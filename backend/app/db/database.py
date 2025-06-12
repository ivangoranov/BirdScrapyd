"""Database configuration module"""
from sqlalchemy import create_engine, func
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///birdscrapyd.db")

# Create database engine
engine = create_engine(DATABASE_URL)

# Create SessionLocal class for database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Export func for aggregate operations
sql = func

def get_db() -> Generator[Session, None, None]:
    """
    Dependency function to get a database session.
    This should be used with FastAPI's dependency injection system.
    Returns a database session and ensures it's closed after use.
    """
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

# Export SessionLocal, get_db, and sql
__all__ = ["SessionLocal", "get_db", "sql"]
