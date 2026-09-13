import os
from pathlib import Path
from typing import List, Union
from pydantic import AnyHttpUrl, validator
from pydantic_settings import BaseSettings

# Resolve the .env file path relative to the backend directory (where manage.py/requirements.txt live)
# This ensures .env is found regardless of the current working directory
_BACKEND_DIR = Path(__file__).resolve().parent.parent.parent  # backend/app/core -> backend/
_ROOT_DIR = _BACKEND_DIR.parent
_ENV_FILE = (_ROOT_DIR / ".env") if (_ROOT_DIR / ".env").exists() else (_BACKEND_DIR / ".env")

class Settings(BaseSettings):
    APP_NAME: str = "Achievement2LinkedIn"
    ENV: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "change-this-to-a-super-secret-random-key-in-production-min-32-chars"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    ENCRYPTION_KEY: str = "32-character-secret-encryption-key-12345"

    # Database
    DATABASE_URL: str = "sqlite:///./achievement2linkedin.db"

    # CORS & URLs
    FRONTEND_URL: str = "http://localhost:3000"
    BACKEND_URL: str = "http://localhost:8000"
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # Mock Toggles
    AI_MOCK_MODE: bool = True
    LINKEDIN_MOCK_MODE: bool = True

    # LinkedIn Credentials
    LINKEDIN_CLIENT_ID: str = "mock_client_id"
    LINKEDIN_CLIENT_SECRET: str = "mock_client_secret"
    LINKEDIN_REDIRECT_URI: str = "http://localhost:8000/api/v1/linkedin/callback"
    LINKEDIN_API_VERSION: str = "202503"

    # AI Configuration
    AI_PROVIDER: str = "openai"
    AI_API_KEY: str = "mock_ai_key"

    # Storage
    STORAGE_PROVIDER: str = "local"
    STORAGE_DIR: str = "uploads"
    STORAGE_BUCKET: str = "achievement2linkedin-uploads"

    class Config:
        case_sensitive = True
        env_file = str(_ENV_FILE)
        extra = "ignore"

settings = Settings()

