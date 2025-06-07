from sqlalchemy import Column, String, DateTime, JSON, Text, ForeignKey, Integer, Boolean
from sqlalchemy.orm import relationship, DeclarativeBase
import datetime
import uuid

class Base(DeclarativeBase):
    pass

class User(Base):
    """SQLAlchemy model for user accounts"""
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.now)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.datetime.now)

class Spider(Base):
    """SQLAlchemy model for spider configuration"""
    __tablename__ = "spiders"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False, unique=True, index=True)
    start_urls = Column(JSON, nullable=False)
    blocks = Column(JSON, nullable=False)
    settings = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.now)
    updated_at = Column(DateTime, nullable=True, onupdate=datetime.datetime.now)
    status = Column(String, default="idle")

class SpiderExecution(Base):
    """SQLAlchemy model for spider execution history"""
    __tablename__ = "spider_executions"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    spider_id = Column(String, ForeignKey("spiders.id", ondelete="CASCADE"), nullable=False)
    started_at = Column(DateTime, default=datetime.datetime.now)
    finished_at = Column(DateTime, nullable=True)
    status = Column(String, default="running")  # running, finished, error
    items_scraped = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    stats = Column(JSON, nullable=True)

    # Relationship
    spider = relationship("Spider", backref="executions")

# Add Job model as an alias for SpiderExecution to maintain compatibility
Job = SpiderExecution
