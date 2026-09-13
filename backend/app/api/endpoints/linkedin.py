import secrets
from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.api.deps import get_current_user
from app.models.models import User, LinkedInConnection
from app.schemas.schemas import LinkedInStatusResponse
from app.linkedin.service import linkedin_service
from app.services.auth_service import auth_service

router = APIRouter()

# Temporary state cache (or token query parameter)
STATE_CACHE = {}

@router.get("/connect")
def connect_linkedin(current_user: User = Depends(get_current_user)):
    state = f"{current_user.id}:{secrets.token_urlsafe(16)}"
    STATE_CACHE[state] = current_user.id
    auth_url = linkedin_service.get_authorization_url(state)
    return {"authorization_url": auth_url, "state": state}

@router.get("/callback")
async def linkedin_callback(
    code: str = Query(...),
    state: str = Query(...),
    db: Session = Depends(get_db)
):
    user_id = None
    if ":" in state:
        user_id = state.split(":")[0]

    if not user_id:
        user_id = STATE_CACHE.get(state)

    if not user_id:
        # Fallback to demo first active user in DB if mock callback without session state
        first_user = db.query(User).first()
        if first_user:
            user_id = first_user.id
        else:
            raise HTTPException(status_code=400, detail="Invalid OAuth state parameter.")

    try:
        token_data = await linkedin_service.exchange_code_for_token(code)
        access_token = token_data.get("access_token")
        expires_in = token_data.get("expires_in", 5183999)

        user_record = db.query(User).filter(User.id == user_id).first()
        profile = await linkedin_service.get_user_profile(access_token, fallback_user=user_record)
        member_id = profile.get("sub", f"member_{user_id[:8]}")
        member_name = profile.get("name") or (user_record.name if user_record else "LinkedIn Professional")
        member_picture = profile.get("picture", "")

        auth_service.save_linkedin_connection(
            db=db,
            user_id=user_id,
            member_id=member_id,
            access_token=access_token,
            expires_in=expires_in,
            member_name=member_name,
            member_picture=member_picture
        )

        redirect_target = f"{settings.FRONTEND_URL}/dashboard/settings/linkedin?connected=true"
        return RedirectResponse(url=redirect_target)
    except Exception as e:
        redirect_target = f"{settings.FRONTEND_URL}/dashboard/settings/linkedin?error={str(e)}"
        return RedirectResponse(url=redirect_target)

@router.get("/status", response_model=LinkedInStatusResponse)
def get_linkedin_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    conn = db.query(LinkedInConnection).filter(LinkedInConnection.user_id == current_user.id).first()
    if not conn:
        return LinkedInStatusResponse(connected=False)

    return LinkedInStatusResponse(
        connected=True,
        linkedin_member_id=conn.linkedin_member_id,
        member_name=conn.member_name,
        member_picture=conn.member_picture,
        access_token_expires_at=conn.access_token_expires_at
    )

@router.post("/disconnect")
def disconnect_linkedin(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    success = auth_service.disconnect_linkedin(db, current_user.id)
    return {"success": success, "message": "LinkedIn account disconnected successfully."}
