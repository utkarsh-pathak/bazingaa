import os
from sqlalchemy import create_engine, inspect
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)

with engine.connect() as connection:
    inspector = inspect(engine)
    columns = inspector.get_columns('gamerooms')
    for c in columns:
        print(c['name'])
