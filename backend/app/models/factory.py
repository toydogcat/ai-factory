from sqlalchemy import Column, String, Integer, DateTime, Boolean, JSON, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Mentor(Base):
    __tablename__ = "mentors"
    
    mentor_id = Column(String, primary_key=True, index=True, nullable=False)
    password_hash = Column("password", String)
    email = Column(String, index=True)
    role = Column(String, default="mentor")
    points = Column(Integer, default=0)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)
    last_active_at = Column(DateTime)

class Friend(Base):
    __tablename__ = "mentor_friends"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    requester_id = Column(String, ForeignKey("mentors.mentor_id", ondelete="CASCADE"), nullable=False)
    receiver_id = Column(String, ForeignKey("mentors.mentor_id", ondelete="CASCADE"), nullable=False)
    status = Column(String, default="pending") # pending, accepted, declined
    created_at = Column(DateTime, default=datetime.utcnow)

class Message(Base):
    __tablename__ = "mentor_messages"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    sender_id = Column(String, ForeignKey("mentors.mentor_id", ondelete="CASCADE"), nullable=False)
    receiver_id = Column(String, ForeignKey("mentors.mentor_id", ondelete="CASCADE"), nullable=False)
    message = Column(Text)
    is_read = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

class AIInstance(Base):
    __tablename__ = "instances"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True) # e.g., 'tarot-room-1'
    mentor_id = Column(String, ForeignKey("mentors.mentor_id"))
    
    image = Column(String)
    container_id = Column(String)
    status = Column(String) # 'running', 'stopped', 'failed'
    
    url = Column(String) # The Traefik-routed URL
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
