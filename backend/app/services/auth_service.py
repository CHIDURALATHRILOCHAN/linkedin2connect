from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.models import User, LinkedInConnection
from app.schemas.schemas import UserCreate, UserLogin
from app.core.security import verify_password, get_password_hash, create_access_token, encrypt_token, decrypt_token

class AuthService:
    @staticmethod
    def register_user(db: Session, user_in: UserCreate) -> User:
        existing_user = db.query(User).filter(User.email == user_in.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User with this email already exists."
            )

        hashed_password = get_password_hash(user_in.password)
        db_user = User(
            name=user_in.name,
            email=user_in.email,
            password_hash=hashed_password,
            profile_image=f"https://api.dicebear.com/7.x/avataaars/svg?seed={user_in.name}"
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def authenticate_user(db: Session, credentials: UserLogin) -> User:
        user = db.query(User).filter(User.email == credentials.email).first()
        if not user or not verify_password(credentials.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password."
            )
        return user

    @staticmethod
    def save_linkedin_connection(
        db: Session,
        user_id: str,
        member_id: str,
        access_token: str,
        expires_in: int,
        member_name: str,
        member_picture: str,
        scopes: str = "openid profile email w_member_social"
    ) -> LinkedInConnection:
        conn = db.query(LinkedInConnection).filter(LinkedInConnection.user_id == user_id).first()
        expires_at = datetime.utcnow() + timedelta(seconds=expires_in) if expires_in else None
        encrypted_token = encrypt_token(access_token)

        if conn:
            conn.linkedin_member_id = member_id
            conn.access_token_encrypted = encrypted_token
            conn.access_token_expires_at = expires_at
            conn.member_name = member_name
            conn.member_picture = member_picture
            conn.scopes = scopes
            conn.updated_at = datetime.utcnow()
        else:
            conn = LinkedInConnection(
                user_id=user_id,
                linkedin_member_id=member_id,
                access_token_encrypted=encrypted_token,
                access_token_expires_at=expires_at,
                member_name=member_name,
                member_picture=member_picture,
                scopes=scopes
            )
            db.add(conn)

        db.commit()
        db.refresh(conn)
        return conn

    @staticmethod
    def disconnect_linkedin(db: Session, user_id: str) -> bool:
        conn = db.query(LinkedInConnection).filter(LinkedInConnection.user_id == user_id).first()
        if conn:
            db.delete(conn)
            db.commit()
            return True
        return False

auth_service = AuthService()
