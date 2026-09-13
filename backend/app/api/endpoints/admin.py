from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.models import User, Achievement, Post, LinkedInConnection, PostStatus
from app.schemas.schemas import DashboardStatsResponse

router = APIRouter()

@router.get("/dashboard-stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    total_achievements = db.query(Achievement).filter(Achievement.user_id == current_user.id).count()
    user_posts = db.query(Post).filter(Post.user_id == current_user.id).all()
    
    total_posts = len(user_posts)
    published_posts = len([p for p in user_posts if p.status == PostStatus.PUBLISHED])
    draft_posts = len([p for p in user_posts if p.status in [PostStatus.DRAFT, PostStatus.READY]])
    failed_posts = len([p for p in user_posts if p.status == PostStatus.FAILED])

    conn = db.query(LinkedInConnection).filter(LinkedInConnection.user_id == current_user.id).first()
    linkedin_connected = conn is not None
    member_name = conn.member_name if conn else None

    return DashboardStatsResponse(
        total_achievements=total_achievements,
        total_posts=total_posts,
        published_posts=published_posts,
        draft_posts=draft_posts,
        failed_posts=failed_posts,
        linkedin_connected=linkedin_connected,
        linkedin_member_name=member_name
    )

@router.delete("/delete-all-data")
def delete_user_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Cascade delete all achievements and posts
    db.query(Achievement).filter(Achievement.user_id == current_user.id).delete()
    db.query(Post).filter(Post.user_id == current_user.id).delete()
    db.commit()
    return {"message": "All your achievements and post records have been permanently deleted."}
