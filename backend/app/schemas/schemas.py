from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict

# User Schemas
class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: EmailStr
    profile_image: Optional[str] = None
    created_at: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# LinkedIn Connection Schema
class LinkedInStatusResponse(BaseModel):
    connected: bool
    linkedin_member_id: Optional[str] = None
    member_name: Optional[str] = None
    member_picture: Optional[str] = None
    access_token_expires_at: Optional[datetime] = None

# OCR Extraction Schema
class ConfidenceScores(BaseModel):
    recipient_name: float = 0.95
    achievement_title: float = 0.95
    issuing_organization: float = 0.90
    issue_date: float = 0.85
    certificate_id: float = 0.80
    skills: float = 0.90

class ExtractedData(BaseModel):
    recipient_name: Optional[str] = None
    achievement_title: Optional[str] = None
    issuing_organization: Optional[str] = None
    issue_date: Optional[str] = None
    certificate_id: Optional[str] = None
    achievement_type: Optional[str] = "Certification"
    skills: List[str] = []
    course_name: Optional[str] = None
    event_name: Optional[str] = None
    role: Optional[str] = None
    description: Optional[str] = None
    confidence: Dict[str, float] = {}

class VerifiedDataUpdate(BaseModel):
    recipient_name: str
    achievement_title: str
    issuing_organization: str
    issue_date: Optional[str] = ""
    certificate_id: Optional[str] = ""
    achievement_type: str = "Certification"
    skills: List[str] = []
    description: Optional[str] = ""
    extra_responses: Optional[Dict[str, Any]] = None

# Achievement Schemas
class AchievementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    original_file_url: str
    file_name: str
    file_type: str
    file_size: int
    extracted_data: Optional[Dict[str, Any]] = None
    verified_data: Optional[Dict[str, Any]] = None
    achievement_type: Optional[str] = "Certification"
    processing_status: str
    extra_responses: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

# Post Schemas
class PostGenerateRequest(BaseModel):
    achievement_id: str
    tone: str = "Professional"  # Professional, Engaging, Short, Technical, Humble
    length: Optional[str] = "medium"  # short, medium, long
    custom_instructions: Optional[str] = None

class PostVariation(BaseModel):
    option_id: int
    title: str
    tone: str
    caption: str
    hashtags: List[str]
    suggested_skills: List[str]

class PostGenerateResponse(BaseModel):
    variations: List[PostVariation]

class PostUpdateRequest(BaseModel):
    caption: str
    hashtags: List[str] = []
    tone: Optional[str] = "Professional"

class PostResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    achievement_id: str
    caption: str
    hashtags: List[str] = []
    tone: str
    post_variations: Optional[List[Dict[str, Any]]] = None
    linkedin_post_id: Optional[str] = None
    linkedin_post_url: Optional[str] = None
    status: str
    error_message: Optional[str] = None
    created_at: datetime
    published_at: Optional[datetime] = None

# Stats / Admin Schema
class DashboardStatsResponse(BaseModel):
    total_achievements: int
    total_posts: int
    published_posts: int
    draft_posts: int
    failed_posts: int
    linkedin_connected: bool
    linkedin_member_name: Optional[str] = None
