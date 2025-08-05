# backend/models.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Table, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

room_players_association = Table(
    'room_players', Base.metadata,
    Column('user_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('room_id', Integer, ForeignKey('gamerooms.id'), primary_key=True)
)

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    rooms = relationship("GameRoom", secondary=room_players_association, back_populates="players")
    owned_rooms = relationship("GameRoom", back_populates="owner")
    answers = relationship("Answer", back_populates="player")
    scores = relationship("PlayerGameScore", back_populates="player")

class GameRoom(Base):
    __tablename__ = "gamerooms"
    id = Column(Integer, primary_key=True, index=True)
    room_code = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), index=True, nullable=False)
    max_players = Column(Integer, default=8)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    owner_id = Column(Integer, ForeignKey('users.id'))

    owner = relationship("User", back_populates="owned_rooms")
    players = relationship("User", secondary=room_players_association, back_populates="rooms")
    games = relationship("Game", back_populates="room")

class Game(Base):
    __tablename__ = "games"
    id = Column(Integer, primary_key=True, index=True)
    room_id = Column(Integer, ForeignKey('gamerooms.id'))
    theme = Column(String(255), nullable=False)
    current_question_id = Column(Integer, ForeignKey('questions.id'), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    room = relationship("GameRoom", back_populates="games")
    questions = relationship("Question", back_populates="game", foreign_keys="[Question.game_id]", order_by="Question.id")
    current_question = relationship("Question", foreign_keys=[current_question_id])
    player_scores = relationship("PlayerGameScore", back_populates="game")

class PlayerGameScore(Base):
    __tablename__ = "player_game_scores"
    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(Integer, ForeignKey('users.id'))
    game_id = Column(Integer, ForeignKey('games.id'))
    score = Column(Integer, default=0)

    player = relationship("User", back_populates="scores")
    game = relationship("Game", back_populates="player_scores")

class Question(Base):
    __tablename__ = "questions"
    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, ForeignKey('games.id'))
    question_text = Column(Text, nullable=False)
    correct_answer_text = Column(Text, nullable=False) # Renamed from correct_answer
    correct_answer_id = Column(Integer, ForeignKey('answers.id'), nullable=True)

    game = relationship("Game", back_populates="questions", foreign_keys=[game_id])
    answers = relationship("Answer", back_populates="question", foreign_keys="[Answer.question_id]")
    correct_answer = relationship("Answer", foreign_keys=[correct_answer_id], post_update=True)


class Answer(Base):
    __tablename__ = "answers"
    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(Integer, ForeignKey('questions.id'))
    player_id = Column(Integer, ForeignKey('users.id'))
    answer_text = Column(Text, nullable=False)

    question = relationship("Question", back_populates="answers", foreign_keys=[question_id])
    player = relationship("User", back_populates="answers")
    votes = relationship("Vote", back_populates="answer")

class Vote(Base):
    __tablename__ = "votes"
    id = Column(Integer, primary_key=True, index=True)
    answer_id = Column(Integer, ForeignKey('answers.id'))
    voter_id = Column(Integer, ForeignKey('users.id'))

    answer = relationship("Answer", back_populates="votes")
    voter = relationship("User")


