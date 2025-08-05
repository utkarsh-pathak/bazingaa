# backend/routers/rooms.py
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.concurrency import run_in_threadpool
from fastapi.encoders import jsonable_encoder
from sqlalchemy.orm import Session
import crud, models, schemas
from database import SessionLocal, redis
from websocket import manager as websocket_manager
from services import gemini
import json
import random
import asyncio

router = APIRouter(prefix="/rooms", tags=["rooms"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_game_state(room_code: str):
    state = await redis.hgetall(f"game_state:{room_code}")
    if not state:
        return None
    # Deserialize complex types
    if 'seen_question_texts' in state:
        state['seen_question_texts'] = set(json.loads(state['seen_question_texts']))
    if 'current_question_index' in state:
        state['current_question_index'] = int(state['current_question_index'])
    if 'game_id' in state:
        state['game_id'] = int(state['game_id'])
    return state

async def set_game_state(room_code: str, state: dict):
    # Serialize complex types
    if 'seen_question_texts' in state:
        state['seen_question_texts'] = json.dumps(list(state['seen_question_texts']))
    await redis.hset(f"game_state:{room_code}", mapping=state)


@router.get("/themes")
def get_game_themes():
    return gemini.get_available_themes()

@router.post("/", response_model=schemas.GameRoom)
def create_game_room(payload: schemas.GameRoomAndUserCreate, db: Session = Depends(get_db)):
    room_create = schemas.GameRoomCreate(name=payload.name, max_players=payload.max_players)
    user_create = payload.user
    db_user = crud.get_user_by_username(db, username=user_create.username) or crud.create_user(db, user_create)
    return crud.create_room(db=db, room=room_create, owner=db_user)

@router.post("/{room_code}/join", response_model=schemas.GameRoom)
def join_game_room(room_code: str, user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_username(db, username=user.username) or crud.create_user(db, user)
    db_room = crud.join_room(db=db, room_code=room_code, user=db_user)
    if not db_room:
        raise HTTPException(status_code=404, detail="Room not found or is full")
    return db_room

@router.post("/{room_code}/next_question/{user_id}")
async def host_advance_to_next_question(room_code: str, user_id: int, db: Session = Depends(get_db)):
    db_room = await run_in_threadpool(crud.get_room_by_code, db, room_code)
    if not db_room:
        raise HTTPException(status_code=404, detail="Room not found")
    
    if db_room.owner_id != user_id:
        raise HTTPException(status_code=403, detail="Only the host can advance the game.")

    await advance_to_next_question(room_code)
    return {"message": "Advanced to next question."}

async def broadcast_player_update(db: Session, room_code: str):
    db_room = await run_in_threadpool(crud.get_room_by_code, db, room_code)
    if not db_room: return

    game_state = await get_game_state(room_code)
    if game_state and game_state.get('game_id'):
        scores = await run_in_threadpool(crud.get_scores_for_game, db, game_state['game_id'])
        players = [
            schemas.Player(id=s.player.id, username=s.player.username, score=s.score)
            for s in scores
        ]
    else:
        players = [
            schemas.Player(id=p.id, username=p.username, score=0)
            for p in db_room.players
        ]
    
    await websocket_manager.broadcast(json.dumps({"event": "player_update", "players": jsonable_encoder(players)}), room_code)

async def _start_game_logic(room_code: str, config: schemas.StartGameRequest, db: Session):
    db_room = await run_in_threadpool(crud.get_room_by_code, db, room_code)
    if not db_room or len(db_room.players) < 2:
        print(f"Error starting game in room {room_code}: Not enough players.")
        await websocket_manager.broadcast(json.dumps({"event": "error", "message": "Not enough players to start."}), room_code)
        return

    game_state = await get_game_state(room_code) or {}
    seen_questions = set(game_state.get('seen_question_texts', []))

    questions_data = await run_in_threadpool(
        gemini.generate_game_questions,
        theme=config.theme,
        num_questions=config.num_questions,
        seen_questions=seen_questions
    )

    if not questions_data:
        print(f"Error starting game in room {room_code}: Could not get questions.")
        await websocket_manager.broadcast(json.dumps({"event": "error", "message": "Failed to generate questions for the theme."}), room_code)
        return

    questions = [schemas.QuestionCreate(question_text=q['question_text'], correct_answer_text=q['correct_answer']) for q in questions_data]
    db_game = await run_in_threadpool(crud.create_game_with_questions, db=db, room_id=db_room.id, theme=config.theme, questions=questions)

    game_state.update({
        'current_question_index': 0,
        'game_id': db_game.id,
    })

    for q in questions_data:
        seen_questions.add(q['question_text'])
    game_state['seen_question_texts'] = seen_questions

    await set_game_state(room_code, game_state)

    first_question = db_game.questions[0]
    await run_in_threadpool(crud.set_current_question, db, db_game.id, first_question.id)

    await websocket_manager.broadcast(json.dumps({"event": "game_started", "game": jsonable_encoder(schemas.Game.from_orm(db_game))}), room_code)
    await asyncio.sleep(0.1)
    await websocket_manager.broadcast(json.dumps({"event": "new_question", "question": jsonable_encoder(schemas.Question.from_orm(first_question))}), room_code)
    await broadcast_player_update(db, room_code)

async def handle_answer_submission(room_code: str):
    db = SessionLocal()
    try:
        state = await get_game_state(room_code)
        if not state: return

        db_game = await run_in_threadpool(db.query(models.Game).filter(models.Game.id == state['game_id']).first)
        if not db_game or not db_game.current_question_id: return

        submitted_answers = await run_in_threadpool(crud.get_answers_for_question, db, db_game.current_question_id)
        
        # Get number of active players from Redis pubsub
        num_active_players_tuple = await redis.pubsub_numsub(f"room:{room_code}")
        num_active_players = num_active_players_tuple[0][1]

        if len(submitted_answers) == num_active_players:
            correct_answer_text = db_game.current_question.correct_answer_text
            db_correct_answer = await run_in_threadpool(
                crud.create_answer, db, 
                schemas.AnswerCreate(question_id=db_game.current_question_id, answer_text=correct_answer_text),
                player_id=None
            )
            await run_in_threadpool(crud.set_correct_answer_for_question, db, db_game.current_question_id, db_correct_answer.id)

            all_answers_in_round = await run_in_threadpool(crud.get_answers_for_question, db, db_game.current_question_id)
            all_options = [schemas.Answer.from_orm(a) for a in all_answers_in_round]
            random.shuffle(all_options)
            await websocket_manager.broadcast(json.dumps({"event": "start_voting", "answers": jsonable_encoder(all_options)}), room_code)
    finally:
        db.close()

async def advance_to_next_question(room_code: str):
    db = SessionLocal()
    try:
        state = await get_game_state(room_code)
        if not state: return
        
        db_game = await run_in_threadpool(db.query(models.Game).filter(models.Game.id == state['game_id']).first)
        if not db_game: return

        state['current_question_index'] += 1
        await set_game_state(room_code, state)

        if state['current_question_index'] < len(db_game.questions):
            next_question = db_game.questions[state['current_question_index']]
            await run_in_threadpool(crud.set_current_question, db, db_game.id, next_question.id)
            await websocket_manager.broadcast(json.dumps({"event": "new_question", "question": jsonable_encoder(schemas.Question.from_orm(next_question))}), room_code)
        else:
            scores = await run_in_threadpool(crud.get_scores_for_game, db, db_game.id)
            leaderboard = sorted(
                [schemas.Player(id=s.player.id, username=s.player.username, score=s.score) for s in scores],
                key=lambda p: p.score, reverse=True
            )
            await websocket_manager.broadcast(json.dumps({"event": "game_over", "leaderboard": jsonable_encoder(leaderboard)}), room_code)
    finally:
        db.close()

async def handle_vote_submission(room_code: str):
    db = SessionLocal()
    try:
        state = await get_game_state(room_code)
        if not state: return

        game_id = state['game_id']
        db_game = await run_in_threadpool(db.query(models.Game).filter(models.Game.id == game_id).first)
        if not db_game: return

        db_votes = await run_in_threadpool(db.query(models.Vote).join(models.Answer).filter(models.Answer.question_id == db_game.current_question_id).all)
        
        num_active_players_tuple = await redis.pubsub_numsub(f"room:{room_code}")
        num_active_players = num_active_players_tuple[0][1]

        if len(db_votes) == num_active_players:
            score_updates = {}
            correct_answer_id = db_game.current_question.correct_answer_id
            
            # Prepare individual vote results for all players
            all_results = {}
            active_user_ids = {v.voter_id for v in db_votes}
            for user_id in active_user_ids:
                user_vote = next((v for v in db_votes if v.voter_id == user_id), None)
                if not user_vote: continue

                voted_answer = user_vote.answer
                is_correct = (voted_answer.id == correct_answer_id)
                fooled_by = None
                if not is_correct and voted_answer.player:
                    fooled_by = voted_answer.player.username
                
                all_results[user_id] = {"is_correct": is_correct, "fooled_by": fooled_by, "text": voted_answer.answer_text}

            # Broadcast all results at once
            await websocket_manager.broadcast(json.dumps({"event": "all_vote_results", "results": all_results}), room_code)
            
            # Wait for players to see their individual result
            await asyncio.sleep(5)

            results = []
            all_answers_in_round = await run_in_threadpool(crud.get_answers_for_question, db, db_game.current_question_id)
            
            for answer in all_answers_in_round:
                voters = [v.voter.username for v in db_votes if v.answer_id == answer.id]
                points = 0
                if answer.id == correct_answer_id:
                    author_name = "Bazinga!"
                    for v in db_votes:
                        if v.answer_id == answer.id:
                            score_updates[v.voter_id] = score_updates.get(v.voter_id, 0) + 1
                else:
                    author_name = answer.player.username if answer.player else "Unknown"
                    points = 1 * len(voters)
                    if answer.player_id:
                         score_updates[answer.player_id] = score_updates.get(answer.player_id, 0) + points

                results.append({"answer_text": answer.answer_text, "author": author_name, "voters": voters, "points": points})

            if score_updates:
                await run_in_threadpool(crud.update_scores, db, score_updates, game_id)
                await broadcast_player_update(db, room_code)

            await websocket_manager.broadcast(json.dumps({"event": "round_over", "results": results}), room_code)
            # Host will manually advance to the next question
    finally:
        db.close()

@router.websocket("/ws/{room_code}/{user_id}")
async def websocket_endpoint(websocket: WebSocket, room_code: str, user_id: int):
    await websocket_manager.connect(websocket, room_code, user_id)
    db = SessionLocal()
    try:
        await redis.sadd(f"room:{room_code}:users", user_id)
        await broadcast_player_update(db, room_code)

        game_state = await get_game_state(room_code)
        if game_state and game_state.get('game_id'):
            db_game = await run_in_threadpool(db.query(models.Game).filter(models.Game.id == game_state['game_id']).first)
            if db_game and db_game.current_question_id:
                current_question = await run_in_threadpool(db.query(models.Question).filter(models.Question.id == db_game.current_question_id).first)
                
                await websocket.send_text(json.dumps({"event": "game_started", "game": jsonable_encoder(schemas.Game.from_orm(db_game))}))
                await websocket.send_text(json.dumps({"event": "new_question", "question": jsonable_encoder(schemas.Question.from_orm(current_question))}))
        
        # Keep the connection alive, the manager will handle everything else
        while True:
            await asyncio.sleep(1) # Ping or wait to keep the connection open
    except (WebSocketDisconnect, asyncio.CancelledError):
        # The manager's disconnect logic will handle cleanup
        websocket_manager.disconnect(websocket, room_code, user_id)
    finally:
        db.close()