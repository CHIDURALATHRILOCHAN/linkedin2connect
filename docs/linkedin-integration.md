# LinkedIn Integration Documentation & API Specification

## 1. Overview
This document specifies the official integration architecture for **Achievement2LinkedIn** with LinkedIn APIs (2024-2026 OIDC & REST APIs).

> [!IMPORTANT]
> - NEVER ask users for their LinkedIn password.
> - NEVER use Selenium/Playwright or browser scraping for LinkedIn operations.
> - ALWAYS use official LinkedIn OAuth 2.0 and LinkedIn REST APIs.
> - ALL LinkedIn API interaction must remain isolated within `backend/app/linkedin/service.py`.

---

## 2. OAuth 2.0 Protocol & Credentials

### Setup in LinkedIn Developer Portal
1. Create a LinkedIn App at [developer.linkedin.com](https://developer.linkedin.com/).
2. Request access to:
   - **Sign In with LinkedIn using OpenID Connect**
   - **Share on LinkedIn**
3. Configure Redirect URI:
   - Development: `http://localhost:8000/api/v1/auth/linkedin/callback` (or frontend redirect `http://localhost:3000/dashboard/settings/linkedin/callback`)

### Authorization Request
- **Endpoint**: `https://www.linkedin.com/oauth/v2/authorization`
- **Method**: `GET`
- **Query Parameters**:
  - `response_type`: `code`
  - `client_id`: `${LINKEDIN_CLIENT_ID}`
  - `redirect_uri`: `${LINKEDIN_REDIRECT_URI}`
  - `state`: Cryptographic random string (anti-CSRF)
  - `scope`: `openid profile email w_member_social`

### Access Token Exchange
- **Endpoint**: `https://www.linkedin.com/oauth/v2/accessToken`
- **Method**: `POST`
- **Body**: `grant_type=authorization_code&code={code}&redirect_uri={redirect_uri}&client_id={client_id}&client_secret={client_secret}`
- **Response**:
  ```json
  {
    "access_token": "AQ...",
    "expires_in": 5183999,
    "scope": "openid profile email w_member_social"
  }
  ```

### User Profile Retrieval (OpenID Connect)
- **Endpoint**: `https://api.linkedin.com/v2/userinfo`
- **Method**: `GET`
- **Headers**:
  - `Authorization`: `Bearer {access_token}`
- **Response**:
  ```json
  {
    "sub": "abc123XYZ",
    "name": "Jane Doe",
    "given_name": "Jane",
    "family_name": "Doe",
    "picture": "https://media.licdn.com/dms/image/...",
    "email": "jane.doe@example.com"
  }
  ```
- **Member URN**: `urn:li:person:{sub}`

---

## 3. Media & Certificate Document Upload

### Step 1: Initialize Image Upload
- **Endpoint**: `POST https://api.linkedin.com/rest/images?action=initializeUpload`
- **Headers**:
  - `Authorization`: `Bearer {access_token}`
  - `LinkedIn-Version`: `202508`
  - `X-Restli-Protocol-Version`: `2.0.0`
  - `Content-Type`: `application/json`
- **Body**:
  ```json
  {
    "initializeUploadRequest": {
      "owner": "urn:li:person:{sub}"
    }
  }
  ```
- **Response**:
  ```json
  {
    "value": {
      "uploadUrl": "https://api.linkedin.com/mediaUpload/...",
      "image": "urn:li:image:D4E10AQH..."
    }
  }
  ```

### Step 2: Perform Binary Upload
- **Endpoint**: `{uploadUrl}` returned from Step 1
- **Method**: `PUT`
- **Headers**:
  - `Authorization`: `Bearer {access_token}`
  - `Content-Type`: `image/png` or `image/jpeg`
- **Body**: Binary image payload.

---

## 4. Creating LinkedIn Post (`/rest/posts`)

- **Endpoint**: `POST https://api.linkedin.com/rest/posts`
- **Headers**:
  - `Authorization`: `Bearer {access_token}`
  - `LinkedIn-Version`: `202508`
  - `X-Restli-Protocol-Version`: `2.0.0`
  - `Content-Type`: `application/json`
- **Body**:
  ```json
  {
    "author": "urn:li:person:{sub}",
    "commentary": "Excited to share my latest certification in Machine Learning! #MachineLearning #AI #Certification",
    "visibility": "PUBLIC",
    "distribution": {
      "feedDistribution": "MAIN_FEED",
      "targetEntities": [],
      "thirdPartyDistributionChannels": []
    },
    "content": {
      "media": {
        "title": "Machine Learning Certificate",
        "id": "urn:li:image:D4E10AQH..."
      }
    },
    "lifecycleState": "PUBLISHED",
    "isReshareDisabledByAuthor": false
  }
  ```
- **Response Header**: `x-restli-id: urn:li:share:1234567890`

---

## 5. Mock Mode (`LINKEDIN_MOCK_MODE=true`)

When `LINKEDIN_MOCK_MODE=true`:
1. `GET /api/v1/linkedin/connect` generates a synthetic state and redirects to mock OAuth callback.
2. Token exchange returns a mock access token `mock_token_xyz` with 60-day expiry.
3. Userinfo returns:
   - ID: `mock_member_123`
   - Name: `Demo Professional`
   - Profile Picture: Standard avatar.
4. Media upload returns mock URN `urn:li:image:mock_img_12345`.
5. Post publishing returns mock share URN `urn:li:share:mock_post_67890` and URL `https://www.linkedin.com/feed/update/urn:li:share:mock_post_67890`.

This guarantees 100% testability without live LinkedIn app approval during development.
