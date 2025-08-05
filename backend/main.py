from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models, crud
from database import engine, SessionLocal, redis
from routers import rooms
import contextlib

# This will create the tables if they don't exist
models.Base.metadata.create_all(bind=engine)

@contextlib.asynccontextmanager
async def lifespan(app: FastAPI):
    # Clear all data on startup
    db = SessionLocal()
    try:
        crud.clear_all_data(db)
        await redis.flushdb()
    finally:
        db.close()
    yield
    # Any cleanup on shutdown would go here

app = FastAPI(lifespan=lifespan)

# CORS configuration
origins = [
    "http://localhost",
    "http://localhost:5173", # Default Vite dev server port
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rooms.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Bazinga! backend."}
