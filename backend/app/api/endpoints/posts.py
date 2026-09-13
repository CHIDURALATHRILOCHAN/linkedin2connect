from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User, Post
from app.schemas.schemas import PostGenerateRequest, PostUpdateRequest, PostResponse
from app.services.achievement_service import achievement_service

router = APIRouter()

@router.post("/generate", response_model=PostResponse)
def generate_post(
    req: PostGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    post = achievement_service.generate_posts(db, current_user.id, req)
    return PostResponse.model_validate(post)

@router.get("", response_model=List[PostResponse])
def list_posts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    posts = db.query(Post).filter(
        Post.user_id == current_user.id
    ).order_by(Post.created_at.desc()).all()
    return [PostResponse.model_validate(p) for p in posts]

@router.get("/{post_id}", response_model=PostResponse)
def get_post(
    post_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    post = db.query(Post).filter(Post.id == post_id, Post.user_id == current_user.id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")
    return PostResponse.model_validate(post)

@router.patch("/{post_id}", response_model=PostResponse)
def update_post(
    post_id: str,
    data: PostUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    post = db.query(Post).filter(Post.id == post_id, Post.user_id == current_user.id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found.")

    post.caption = data.caption
    post.hashtags = data.hashtags
    if data.tone:
        post.tone = data.tone

    db.commit()
    db.refresh(post)
    return PostResponse.model_validate(post)

@router.post("/{post_id}/publish", response_model=PostResponse)
async def publish_post(
    post_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    published_post = await achievement_service.publish_post(db, post_id, current_user.id)
    return PostResponse.model_validate(published_post)
