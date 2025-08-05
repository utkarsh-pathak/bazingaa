# backend/crud.py
from sqlalchemy.orm import Session
import shortuuid
import models, schemas
from typing import List

# --- User CRUD ---
def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def create_user(db: Session, user: schemas.UserCreate):
    fake_hashed_password = user.password + "notreallyhashed"
    db_user = models.User(username=user.username, hashed_password=fake_hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# --- GameRoom CRUD ---
def get_room_by_code(db: Session, room_code: str):
    return db.query(models.GameRoom).filter(models.GameRoom.room_code == room_code).first()

def create_room(db: Session, room: schemas.GameRoomCreate, owner: models.User):
    room_code = shortuuid.ShortUUID().random(length=6).upper()
    db_room = models.GameRoom(
        name=room.name, 
        max_players=room.max_players, 
        room_code=room_code,
        owner=owner
    )
    db_room.players.append(owner)
    db.add(db_room)
    db.commit()
    db.refresh(db_room)
    return db_room

def join_room(db: Session, room_code: str, user: models.User):
    db_room = get_room_by_code(db, room_code)
    if db_room and len(db_room.players) < db_room.max_players:
        if user not in db_room.players:
            db_room.players.append(user)
            db.commit()
            db.refresh(db_room)
        return db_room
    return None

# --- Game & Question CRUD ---
def create_game_with_questions(db: Session, room_id: int, theme: str, questions: List[schemas.QuestionCreate]):
    db_game = models.Game(room_id=room_id, theme=theme)
    db.add(db_game)
    db.commit()
    db.refresh(db_game)

    # Add players from the room to the game with a starting score of 0
    db_room = db.query(models.GameRoom).filter_by(id=room_id).first()
    for player in db_room.players:
        score_entry = models.PlayerGameScore(player_id=player.id, game_id=db_game.id, score=0)
        db.add(score_entry)

    for q_data in questions:
        db_question = models.Question(
            game_id=db_game.id,
            question_text=q_data.question_text,
            correct_answer_text=q_data.correct_answer_text
        )
        db.add(db_question)
    
    db.commit()
    db.refresh(db_game)
    return db_game

def set_current_question(db: Session, game_id: int, question_id: int):
    db_game = db.query(models.Game).filter(models.Game.id == game_id).first()
    if db_game:
        db_game.current_question_id = question_id
        db.commit()
        db.refresh(db_game)
    return db_game

def create_answer(db: Session, answer: schemas.AnswerCreate, player_id: int):
    db_answer = models.Answer(**answer.dict(), player_id=player_id)
    db.add(db_answer)
    db.commit()
    db.refresh(db_answer)
    return db_answer

def get_answers_for_question(db: Session, question_id: int):
    return db.query(models.Answer).filter(models.Answer.question_id == question_id).all()

def set_correct_answer_for_question(db: Session, question_id: int, answer_id: int):
    db_question = db.query(models.Question).filter(models.Question.id == question_id).first()
    if db_question:
        db_question.correct_answer_id = answer_id
        db.commit()
        db.refresh(db_question)
    return db_question

def create_vote(db: Session, vote: schemas.VoteCreate, voter_id: int):
    db_vote = models.Vote(**vote.dict(), voter_id=voter_id)
    db.add(db_vote)
    db.commit()
    db.refresh(db_vote)
    return db_vote

def update_scores(db: Session, score_updates: dict, game_id: int):
    for user_id, points in score_updates.items():
        db.query(models.PlayerGameScore).filter_by(player_id=user_id, game_id=game_id).update({"score": models.PlayerGameScore.score + points})
    db.commit()

def get_scores_for_game(db: Session, game_id: int):
    return db.query(models.PlayerGameScore).filter_by(game_id=game_id).all()

def clear_all_data(db: Session):
    # Break circular dependencies by setting nullable foreign keys to NULL
    db.query(models.Game).update({models.Game.current_question_id: None})
    db.query(models.Question).update({models.Question.correct_answer_id: None})

    # Delete records in an order that respects foreign key constraints
    db.query(models.Vote).delete()
    db.query(models.Answer).delete()
    db.query(models.Question).delete()
    db.query(models.PlayerGameScore).delete()
    db.query(models.Game).delete()
    db.execute(models.room_players_association.delete())
    db.query(models.GameRoom).delete()
    db.query(models.User).delete()
    db.commit()

