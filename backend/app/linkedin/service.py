import uuid
import httpx
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, Tuple
from app.core.config import settings
from app.core.security import encrypt_token, decrypt_token

class LinkedInService:
    def get_authorization_url(self, state: str) -> str:
        """
        Generates official LinkedIn OAuth 2.0 URL with OIDC + posting permissions.
        Scopes: openid, profile, email, w_member_social
        """
        if settings.LINKEDIN_MOCK_MODE:
            # Synthetic redirect to backend callback in mock mode
            return f"{settings.BACKEND_URL}{settings.API_V1_STR}/linkedin/callback?code=mock_authorization_code_123&state={state}"

        params = {
            "response_type": "code",
            "client_id": settings.LINKEDIN_CLIENT_ID,
            "redirect_uri": settings.LINKEDIN_REDIRECT_URI,
            "state": state,
            "scope": "openid profile email w_member_social"
        }
        query = "&".join([f"{k}={v}" for k, v in params.items()])
        return f"https://www.linkedin.com/oauth/v2/authorization?{query}"

    async def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """
        Exchanges OAuth code for access token.
        """
        if settings.LINKEDIN_MOCK_MODE or code.startswith("mock_"):
            return {
                "access_token": f"mock_access_token_{uuid.uuid4().hex[:12]}",
                "expires_in": 5183999,  # 60 days
                "refresh_token": None,
                "scope": "openid profile email w_member_social"
            }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://www.linkedin.com/oauth/v2/accessToken",
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": settings.LINKEDIN_REDIRECT_URI,
                    "client_id": settings.LINKEDIN_CLIENT_ID,
                    "client_secret": settings.LINKEDIN_CLIENT_SECRET,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            if response.status_code != 200:
                raise RuntimeError(f"LinkedIn Token Exchange Failed: {response.text}")
            return response.json()

    async def get_user_profile(self, access_token: str, fallback_user: Optional[Any] = None) -> Dict[str, Any]:
        """
        Fetch authorized member identity using current OpenID Connect userinfo endpoint.
        """
        if settings.LINKEDIN_MOCK_MODE or access_token.startswith("mock_"):
            user_name = getattr(fallback_user, "name", None) or "LinkedIn Member"
            user_email = getattr(fallback_user, "email", None) or "member@linkedin.com"
            user_id = str(getattr(fallback_user, "id", "member"))[:8]
            return {
                "sub": f"mock_linkedin_member_{user_id}",
                "name": user_name,
                "email": user_email,
                "picture": f"https://api.dicebear.com/7.x/initials/svg?seed={user_name}"
            }

        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.linkedin.com/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            if response.status_code != 200:
                raise RuntimeError(f"LinkedIn Profile Fetch Failed: {response.text}")
            
            data = response.json()
            return {
                "sub": data.get("sub"),
                "name": data.get("name") or f"{data.get('given_name', '')} {data.get('family_name', '')}".strip(),
                "email": data.get("email"),
                "picture": data.get("picture")
            }

    async def upload_image_media(self, access_token: str, member_id: str, file_path: str) -> str:
        """
        Upload certificate image/media to LinkedIn via current official REST Images API.
        Step 1: Initialize upload (/rest/images?action=initializeUpload)
        Step 2: Binary upload to uploadUrl
        Returns LinkedIn Image URN.
        """
        if settings.LINKEDIN_MOCK_MODE or access_token.startswith("mock_"):
            return f"urn:li:image:mock_img_{uuid.uuid4().hex[:8]}"

        candidate_versions = [settings.LINKEDIN_API_VERSION, "202503", "202502", "202501"]
        # Remove duplicates while preserving order
        candidate_versions = list(dict.fromkeys(candidate_versions))

        # Step 1: Initialize Upload with version resilience
        init_body = {
            "initializeUploadRequest": {
                "owner": f"urn:li:person:{member_id}"
            }
        }
        
        async with httpx.AsyncClient() as client:
            init_res = None
            successful_version = settings.LINKEDIN_API_VERSION

            for ver in candidate_versions:
                headers = {
                    "Authorization": f"Bearer {access_token}",
                    "LinkedIn-Version": ver,
                    "X-Restli-Protocol-Version": "2.0.0",
                    "Content-Type": "application/json"
                }
                init_res = await client.post(
                    "https://api.linkedin.com/rest/images?action=initializeUpload",
                    json=init_body,
                    headers=headers
                )
                if init_res.status_code in [200, 201]:
                    successful_version = ver
                    break
                if init_res.status_code != 426:
                    # If not a version error, break and fail with actual error
                    break

            if not init_res or init_res.status_code not in [200, 201]:
                raise RuntimeError(f"LinkedIn Media Initialization Failed: {init_res.text if init_res else 'No response'}")

            init_data = init_res.json()
            val = init_data.get("value", {})
            upload_url = val.get("uploadUrl")
            image_urn = val.get("image")

            if not upload_url or not image_urn:
                raise RuntimeError(f"Invalid media initialization response from LinkedIn: {init_data}")

            # Step 2: Upload file binary
            with open(file_path, "rb") as f:
                file_bytes = f.read()

            upload_res = await client.put(
                upload_url,
                content=file_bytes,
                headers={"Authorization": f"Bearer {access_token}", "Content-Type": "image/jpeg"}
            )
            if upload_res.status_code not in [200, 201]:
                raise RuntimeError(f"LinkedIn Binary Media Upload Failed: {upload_res.text}")

            return image_urn

    async def create_post(
        self,
        access_token: str,
        member_id: str,
        caption: str,
        media_urn: Optional[str] = None
    ) -> Tuple[str, str]:
        """
        Publish post to authenticated member profile using official LinkedIn Posts API (/rest/posts).
        Returns (linkedin_post_id, linkedin_post_url).
        """
        if settings.LINKEDIN_MOCK_MODE or access_token.startswith("mock_"):
            mock_id = f"urn:li:share:mock_{uuid.uuid4().hex[:10]}"
            mock_url = f"https://www.linkedin.com/feed/update/{mock_id}"
            return mock_id, mock_url

        candidate_versions = [settings.LINKEDIN_API_VERSION, "202503", "202502", "202501"]
        candidate_versions = list(dict.fromkeys(candidate_versions))

        post_body = {
            "author": f"urn:li:person:{member_id}",
            "commentary": caption,
            "visibility": "PUBLIC",
            "distribution": {
                "feedDistribution": "MAIN_FEED",
                "targetEntities": [],
                "thirdPartyDistributionChannels": []
            },
            "lifecycleState": "PUBLISHED",
            "isReshareDisabledByAuthor": False
        }

        if media_urn:
            post_body["content"] = {
                "media": {
                    "title": "Achievement Certificate",
                    "id": media_urn
                }
            }

        async with httpx.AsyncClient() as client:
            res = None
            for ver in candidate_versions:
                headers = {
                    "Authorization": f"Bearer {access_token}",
                    "LinkedIn-Version": ver,
                    "X-Restli-Protocol-Version": "2.0.0",
                    "Content-Type": "application/json"
                }
                res = await client.post(
                    "https://api.linkedin.com/rest/posts",
                    json=post_body,
                    headers=headers
                )
                if res.status_code in [200, 201]:
                    break
                if res.status_code != 426:
                    break

            if not res or res.status_code not in [200, 201]:
                raise RuntimeError(f"LinkedIn Post Creation Failed: {res.text if res else 'No response'}")

            post_id = res.headers.get("x-restli-id") or res.json().get("id") or f"urn:li:share:{uuid.uuid4().hex[:10]}"
            post_url = f"https://www.linkedin.com/feed/update/{post_id}"
            return post_id, post_url

linkedin_service = LinkedInService()
