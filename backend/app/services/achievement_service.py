from datetime import datetime
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.models import Achievement, Post, AchievementStatus, PostStatus, User, LinkedInConnection
from app.schemas.schemas import VerifiedDataUpdate, PostGenerateRequest, PostUpdateRequest
from app.ocr.extractor import ocr_service
from app.ai.post_generator import post_generator_service
from app.linkedin.service import linkedin_service
from app.core.security import decrypt_token

class AchievementService:
    @staticmethod
    def create_achievement(
        db: Session,
        user_id: str,
        file_name: str,
        file_url: str,
        file_type: str,
        file_size: int,
        local_path: str
    ) -> Achievement:
        achievement = Achievement(
            user_id=user_id,
            original_file_url=file_url,
            file_name=file_name,
            file_type=file_type,
            file_size=file_size,
            processing_status=AchievementStatus.UPLOADED
        )
        db.add(achievement)
        db.commit()
        db.refresh(achievement)

        # Trigger initial OCR processing automatically
        AchievementService.process_ocr(db, achievement.id, local_path)
        return achievement

    @staticmethod
    def process_ocr(db: Session, achievement_id: str, local_path: str) -> Achievement:
        achievement = db.query(Achievement).filter(Achievement.id == achievement_id).first()
        if not achievement:
            raise HTTPException(status_code=404, detail="Achievement not found.")

        achievement.processing_status = AchievementStatus.PROCESSING
        db.commit()

        try:
            extracted_json = ocr_service.extract_document(local_path, achievement.file_type)
            achievement.extracted_data = extracted_json
            achievement.verified_data = extracted_json  # Pre-fill verified data with OCR defaults
            achievement.achievement_type = extracted_json.get("achievement_type", "Certification")
            achievement.processing_status = AchievementStatus.EXTRACTED
        except Exception as e:
            achievement.processing_status = AchievementStatus.FAILED
            db.commit()
            raise HTTPException(status_code=500, detail=f"OCR Processing failed: {str(e)}")

        db.commit()
        db.refresh(achievement)
        return achievement

    @staticmethod
    def verify_achievement(db: Session, achievement_id: str, user_id: str, data: VerifiedDataUpdate) -> Achievement:
        achievement = db.query(Achievement).filter(
            Achievement.id == achievement_id,
            Achievement.user_id == user_id
        ).first()
        if not achievement:
            raise HTTPException(status_code=404, detail="Achievement not found.")

        achievement.verified_data = data.model_dump(exclude={"extra_responses"})
        achievement.achievement_type = data.achievement_type
        if data.extra_responses:
            achievement.extra_responses = data.extra_responses
        achievement.processing_status = AchievementStatus.NEEDS_REVIEW
        
        db.commit()
        db.refresh(achievement)
        return achievement

    @staticmethod
    def generate_posts(db: Session, user_id: str, req: PostGenerateRequest) -> Post:
        achievement = db.query(Achievement).filter(
            Achievement.id == req.achievement_id,
            Achievement.user_id == user_id
        ).first()
        if not achievement:
            raise HTTPException(status_code=404, detail="Achievement not found.")

        verified = achievement.verified_data or achievement.extracted_data or {}
        variations = post_generator_service.generate_post_variations(
            verified_data=verified,
            achievement_type=achievement.achievement_type,
            extra_responses=achievement.extra_responses,
            preferred_tone=req.tone,
            custom_instructions=req.custom_instructions
        )

        selected_option = variations[0]

        # Check if draft post exists
        post = db.query(Post).filter(
            Post.achievement_id == achievement.id,
            Post.user_id == user_id
        ).first()

        if post:
            post.caption = selected_option["caption"]
            post.hashtags = selected_option["hashtags"]
            post.tone = req.tone
            post.post_variations = variations
            post.status = PostStatus.DRAFT
        else:
            post = Post(
                user_id=user_id,
                achievement_id=achievement.id,
                caption=selected_option["caption"],
                hashtags=selected_option["hashtags"],
                tone=req.tone,
                post_variations=variations,
                status=PostStatus.DRAFT
            )
            db.add(post)

        achievement.processing_status = AchievementStatus.DRAFT_READY
        db.commit()
        db.refresh(post)
        return post

    @staticmethod
    async def publish_post(db: Session, post_id: str, user_id: str) -> Post:
        post = db.query(Post).filter(Post.id == post_id, Post.user_id == user_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Post not found.")

        # Validate LinkedIn Connection
        conn = db.query(LinkedInConnection).filter(LinkedInConnection.user_id == user_id).first()
        if not conn:
            raise HTTPException(
                status_code=400,
                detail="Your LinkedIn account is not connected. Please connect your LinkedIn account first."
            )

        if conn.access_token_expires_at and conn.access_token_expires_at < datetime.utcnow():
            raise HTTPException(
                status_code=400,
                detail="We couldn't publish your post because your LinkedIn connection has expired. Please reconnect your LinkedIn account."
            )

        access_token = decrypt_token(conn.access_token_encrypted)
        if not access_token:
            raise HTTPException(
                status_code=400,
                detail="Invalid or missing access token. Please reconnect your LinkedIn account."
            )

        post.status = PostStatus.PUBLISHING
        achievement = post.achievement
        achievement.processing_status = AchievementStatus.PUBLISHING
        db.commit()

        try:
            # Step 1: Upload certificate media
            media_urn = None
            if achievement.original_file_url:
                local_path = achievement.original_file_url.replace("/uploads/", "uploads/")
                media_urn = await linkedin_service.upload_image_media(
                    access_token=access_token,
                    member_id=conn.linkedin_member_id,
                    file_path=local_path
                )

            # Step 2: Create post commentary with hashtags
            full_caption = post.caption
            if post.hashtags and len(post.hashtags) > 0:
                tags_str = " ".join(post.hashtags)
                if tags_str not in full_caption:
                    full_caption += f"\n\n{tags_str}"

            # Step 3: Create post on LinkedIn
            linkedin_post_id, linkedin_post_url = await linkedin_service.create_post(
                access_token=access_token,
                member_id=conn.linkedin_member_id,
                caption=full_caption,
                media_urn=media_urn
            )

            post.linkedin_post_id = linkedin_post_id
            post.linkedin_post_url = linkedin_post_url
            post.status = PostStatus.PUBLISHED
            post.published_at = datetime.utcnow()
            post.error_message = None

            achievement.processing_status = AchievementStatus.PUBLISHED
        except Exception as e:
            post.status = PostStatus.FAILED
            post.error_message = str(e)
            achievement.processing_status = AchievementStatus.FAILED
            db.commit()
            raise HTTPException(
                status_code=500,
                detail=f"LinkedIn Publishing Failed: {str(e)}"
            )

        db.commit()
        db.refresh(post)
        return post

achievement_service = AchievementService()
