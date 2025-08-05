# backend/clear_db.py
from .database import engine
from . import models

def main():
    print("Dropping all tables...")
    models.Base.metadata.drop_all(bind=engine)
    print("Tables dropped successfully.")

if __name__ == "__main__":
    main()
