import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer, Text, JSON, Enum as SQLEnum, Float
from sqlalchemy.orm import relationship
import enum
from app.core.database import Base

class AchievementStatus(str, enum.Enum):
    UPLOADED = "UPLOADED"
    PROCESSING = "PROCESSING"
    EXTRACTED = "EXTRACTED"
    NEEDS_REVIEW = "NEEDS_REVIEW"
    APPROVED = "APPROVED"
    GENERATING_POST = "GENERATING_POST"
    DRAFT_READY = "DRAFT_READY"
    PUBLISHING = "PUBLISHING"
    PUBLISHED = "PUBLISHED"
    FAILED = "FAILED"

class PostStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    READY = "READY"
    PUBLISHING = "PUBLISHING"
    PUBLISHED = "PUBLISHED"
    FAILED = "FAILED"

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    profile_image = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    linkedin_connection = relationship("LinkedInConnection", back_populates="user", uselist=False, cascade="all, delete-orphan")
    achievements = relationship("Achievement", back_populates="user", cascade="all, delete-orphan")
    posts = relationship("Post", back_populates="user", cascade="all, delete-orphan")

class LinkedInConnection(Base):
    __tablename__ = "linkedin_connections"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    linkedin_member_id = Column(String(255), nullable=False)
    access_token_encrypted = Column(Text, nullable=False)
    refresh_token_encrypted = Column(Text, nullable=True)
    access_token_expires_at = Column(DateTime, nullable=True)
    refresh_token_expires_at = Column(DateTime, nullable=True)
    scopes = Column(String(512), nullable=True)
    member_name = Column(String(255), nullable=True)
    member_picture = Column(String(512), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="linkedin_connection")

class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    original_file_url = Column(String(512), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)
    file_size = Column(Integer, nullable=False, default=0)
    
    extracted_data = Column(JSON, nullable=True)
    verified_data = Column(JSON, nullable=True)
    achievement_type = Column(String(100), nullable=True, default="Certification")
    processing_status = Column(SQLEnum(AchievementStatus), default=AchievementStatus.UPLOADED)
    extra_responses = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="achievements")
    posts = relationship("Post", back_populates="achievement", cascade="all, delete-orphan")

class Post(Base):
    __tablename__ = "posts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    achievement_id = Column(String(36), ForeignKey("achievements.id", ondelete="CASCADE"), nullable=False)
    
    caption = Column(Text, nullable=False)
    hashtags = Column(JSON, nullable=True, default=list)
    tone = Column(String(50), nullable=False, default="Professional")
    post_variations = Column(JSON, nullable=True, default=list)
    
    linkedin_post_id = Column(String(255), nullable=True)
    linkedin_post_url = Column(String(512), nullable=True)
    status = Column(SQLEnum(PostStatus), default=PostStatus.DRAFT)
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    published_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="posts")
    achievement = relationship("Achievement", back_populates="posts")
