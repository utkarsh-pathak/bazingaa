# backend/websocket.py
import asyncio
import json
from fastapi import WebSocket, WebSocketDisconnect
from database import redis, SessionLocal
import crud, models, schemas
from fastapi.concurrency import run_in_threadpool

# Import the game logic handlers from the router
from routers import rooms as rooms_router

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, dict[int, WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str, user_id: int):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = {}
        self.active_connections[room_id][user_id] = websocket
        
        pubsub_task = asyncio.create_task(self.redis_listener(websocket, room_id))
        receiver_task = asyncio.create_task(self.message_receiver(websocket, room_id, user_id))
        
        # Attach tasks to the websocket object to be able to cancel them on disconnect
        websocket.tasks = [pubsub_task, receiver_task]

    def disconnect(self, websocket: WebSocket, room_id: str, user_id: int):
        if room_id in self.active_connections and user_id in self.active_connections[room_id]:
            del self.active_connections[room_id][user_id]
            if hasattr(websocket, 'tasks'):
                for task in websocket.tasks:
                    task.cancel()

    async def broadcast(self, message: str, room_id: str):
        await redis.publish(f"room:{room_id}", message)

    async def redis_listener(self, websocket: WebSocket, room_id: str):
        pubsub = redis.pubsub()
        await pubsub.subscribe(f"room:{room_id}")
        try:
            while True:
                message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                if message and message['type'] == 'message':
                    await websocket.send_text(message['data'])
        except (asyncio.CancelledError, WebSocketDisconnect):
            pass
        finally:
            await pubsub.unsubscribe(f"room:{room_id}")
            await pubsub.close()

    async def message_receiver(self, websocket: WebSocket, room_code: str, user_id: int):
        try:
            while True:
                data = await websocket.receive_text()
                message = json.loads(data)
                
                db = SessionLocal()
                try:
                    if message['type'] == 'START_GAME':
                        config = schemas.StartGameRequest(**message['payload'])
                        await rooms_router._start_game_logic(room_code, config, db)

                    elif message['type'] == 'SUBMIT_ANSWER':
                        payload = message['payload']
                        question_id = payload['question_id']
                        answer_text_lower = payload['answer_text'].lower()

                        question = await run_in_threadpool(db.query(models.Question).filter(models.Question.id == question_id).first)
                        if not question: continue

                        if answer_text_lower == question.correct_answer_text.lower():
                            await websocket.send_text(json.dumps({"event": "duplicate_answer", "message": "This is too similar to the correct answer. Try something else!"}))
                            continue

                        existing_answers = await run_in_threadpool(crud.get_answers_for_question, db, question_id)
                        if any(ans.answer_text.lower() == answer_text_lower for ans in existing_answers):
                            await websocket.send_text(json.dumps({"event": "duplicate_answer", "message": "Someone already submitted that answer. Try to be more original!"}))
                            continue

                        answer_data = schemas.AnswerCreate(question_id=question_id, answer_text=payload['answer_text'])
                        await run_in_threadpool(crud.create_answer, db, answer_data, player_id=user_id)
                        
                        await self.broadcast(json.dumps({"event": "player_answered", "user_id": user_id}), room_code)
                        await rooms_router.handle_answer_submission(room_code)

                    elif message['type'] == 'SUBMIT_VOTE':
                        answer_id = int(message['payload']['answer_id'])
                        vote_data = schemas.VoteCreate(answer_id=answer_id)
                        await run_in_threadpool(crud.create_vote, db, vote_data, voter_id=user_id)

                        await self.broadcast(json.dumps({"event": "player_voted", "user_id": user_id}), room_code)
                        await rooms_router.handle_vote_submission(room_code)
                finally:
                    db.close()

        except (WebSocketDisconnect, asyncio.CancelledError):
            self.disconnect(websocket, room_code, user_id)
            await redis.srem(f"room:{room_code}:users", user_id)
            db_disconnect = SessionLocal()
            try:
                await rooms_router.handle_answer_submission(room_code)
                await rooms_router.broadcast_player_update(db_disconnect, room_code)
            finally:
                db_disconnect.close()
        except Exception as e:
            print(f"Error in message_receiver: {e}")
            self.disconnect(websocket, room_code, user_id)

manager = ConnectionManager()