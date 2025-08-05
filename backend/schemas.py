# backend/schemas.py
from pydantic import BaseModel, Field
from typing import List, Optional
import datetime

# --- User Schemas ---
class UserBase(BaseModel):
    username: str

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    created_at: datetime.datetime

    class Config:
        from_attributes = True

# --- Player Schema (for game context) ---
class Player(UserBase):
    id: int
    score: int

    class Config:
        from_attributes = True

# --- Question Schemas ---
class QuestionBase(BaseModel):
    question_text: str
    correct_answer_text: str # Renamed from correct_answer

class QuestionCreate(QuestionBase):
    pass

class Question(QuestionBase):
    id: int
    game_id: int
    correct_answer_id: Optional[int] = None

    class Config:
        from_attributes = True

# --- Answer Schemas ---
class AnswerBase(BaseModel):
    answer_text: str

class AnswerCreate(AnswerBase):
    question_id: int

class Answer(AnswerBase):
    id: int
    player_id: Optional[int] = None

    class Config:
        from_attributes = True

# --- Vote Schemas ---
class VoteCreate(BaseModel):
    answer_id: int

# --- Game Schemas ---
class GameBase(BaseModel):
    theme: str

class GameCreate(GameBase):
    pass

class Game(GameBase):
    id: int
    room_id: int
    questions: List[Question] = []
    current_question_id: Optional[int] = None

    class Config:
        from_attributes = True

# --- GameRoom Schemas ---
class GameRoomBase(BaseModel):
    name: str
    max_players: Optional[int] = 8

class GameRoomCreate(GameRoomBase):
    pass

class GameRoomAndUserCreate(GameRoomBase):
    user: UserCreate


class GameRoom(GameRoomBase):
    id: int
    room_code: str
    owner_id: int
    players: List[User] = [] # Players in the lobby
    games: List[Game] = []

    class Config:
        from_attributes = True

# --- Start Game Schema ---
class StartGameRequest(BaseModel):
    theme: str
    num_questions: int = Field(gt=0, le=20)

