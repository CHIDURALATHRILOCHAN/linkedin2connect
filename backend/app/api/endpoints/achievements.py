import os
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User, Achievement
from app.schemas.schemas import AchievementResponse, VerifiedDataUpdate
from app.storage.service import storage_service
from app.services.achievement_service import achievement_service

router = APIRouter()

@router.post("", response_model=AchievementResponse)
async def upload_achievement(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    content = await file.read()
    file_url, filepath = storage_service.save_file(file, content)
    
    achievement = achievement_service.create_achievement(
        db=db,
        user_id=current_user.id,
        file_name=file.filename or "certificate.png",
        file_url=file_url,
        file_type=file.content_type or "image/png",
        file_size=len(content),
        local_path=filepath
    )
    return AchievementResponse.model_validate(achievement)

@router.get("", response_model=List[AchievementResponse])
def list_achievements(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    achievements = db.query(Achievement).filter(
        Achievement.user_id == current_user.id
    ).order_by(Achievement.created_at.desc()).all()
    return [AchievementResponse.model_validate(a) for a in achievements]

@router.get("/{achievement_id}", response_model=AchievementResponse)
def get_achievement(
    achievement_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    achievement = db.query(Achievement).filter(
        Achievement.id == achievement_id,
        Achievement.user_id == current_user.id
    ).first()
    if not achievement:
        raise HTTPException(status_code=404, detail="Achievement not found.")
    return AchievementResponse.model_validate(achievement)

@router.patch("/{achievement_id}/verify", response_model=AchievementResponse)
def verify_achievement(
    achievement_id: str,
    data: VerifiedDataUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    achievement = achievement_service.verify_achievement(
        db=db,
        achievement_id=achievement_id,
        user_id=current_user.id,
        data=data
    )
    return AchievementResponse.model_validate(achievement)

@router.delete("/{achievement_id}")
def delete_achievement(
    achievement_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    achievement = db.query(Achievement).filter(
        Achievement.id == achievement_id,
        Achievement.user_id == current_user.id
    ).first()
    if not achievement:
        raise HTTPException(status_code=404, detail="Achievement not found.")

    if achievement.original_file_url and achievement.original_file_url.startswith("/uploads/"):
        file_path = achievement.original_file_url.replace("/uploads/", "uploads/")
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception:
                pass

    db.delete(achievement)
    db.commit()
    return {"message": "Achievement deleted successfully."}
