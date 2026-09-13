# Achievement2LinkedIn 🚀

**Achievement2LinkedIn** is a production-quality AI platform that empowers professionals to upload certificates, awards, and course credentials, automatically extract key details using OCR/Document AI, refine post captions and tones using an LLM, preview realistic LinkedIn posts, and publish them to their authenticated LinkedIn profile feed via official OAuth 2.0 and LinkedIn REST APIs.

---

## 🌟 Key Features

- **Official LinkedIn Integration**: Uses official LinkedIn OAuth 2.0 (OpenID Connect `openid profile email w_member_social`) and the official LinkedIn Posts API (`/rest/posts`).
- **Zero Scraping / No Automation**: 100% compliant with LinkedIn Terms of Service. Never asks for passwords.
- **AI OCR & Document Understanding**: Automatically extracts recipient names, issuing organizations, dates, skills, certificate IDs, and achievement classifications.
- **Human Verification**: Side-by-side certificate document viewer and verification form with confidence metrics.
- **Multi-variation LLM Post Generator**: Generates 3 distinct post options (Professional, Engaging, Short) with customizable tone, hashtags, and suggested skills.
- **Realistic LinkedIn Preview**: Pixel-perfect LinkedIn post preview card with author info, commentary, certificate media preview, and action buttons.
- **Explicit Approval Modal**: Requires user confirmation before publishing.
- **Mock Mode Support**: `LINKEDIN_MOCK_MODE=true` and `AI_MOCK_MODE=true` allow testing the entire end-to-end user flow out-of-the-box without requiring live API keys.
- **Data Privacy & Erasure**: Encrypted access token storage (Fernet) and 1-click user data erasure.

---

## 🏗️ Architecture & Monorepo Structure

```
/achievement2linkedin
├── frontend/             # Next.js 14 App Router, React 18, Tailwind CSS, Lucide icons
│   ├── app/              # (Landing, Auth, Dashboard, Achievements, Settings, Privacy, Terms)
│   ├── components/       # (LinkedInPreview, PostEditor, Navbar, Footer)
│   ├── context/          # (AuthContext & LinkedIn status provider)
│   └── lib/              # (API client wrapper)
├── backend/              # FastAPI, Python 3.11+, Pydantic v2, SQLAlchemy
│   ├── app/
│   │   ├── api/          # FastAPI route handlers (auth, linkedin, achievements, posts, admin)
│   │   ├── core/         # Config, Database, JWT Security, Fernet Encryption
│   │   ├── models/       # SQLAlchemy models (User, LinkedInConnection, Achievement, Post)
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # Business logic layer
│   │   ├── ocr/          # DocumentExtractionService abstraction
│   │   ├── ai/           # PostGenerationService abstraction
│   │   └── linkedin/     # Isolated LinkedInService (OAuth, Userinfo, Upload, Posts API)
│   └── tests/            # Pytest suite
├── docs/                 # (architecture.md, linkedin-integration.md)
├── docker-compose.yml    # Development multi-container environment
├── README.md             # Developer documentation
└── .env.example          # Environment variable template
```

---

## ⚡ Quick Start & Development Setup

### 1. Environment Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Default settings in `.env.example` enable `LINKEDIN_MOCK_MODE=true` and `AI_MOCK_MODE=true`, allowing instant out-of-the-box execution.

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows: venv\Scripts\activate
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
FastAPI Interactive Swagger Docs: `http://localhost:8000/docs`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open Frontend in Browser: `http://localhost:3000`

### 4. Running With Docker Compose
```bash
docker compose up --build
```

---

## 🧪 Running Automated Tests

Run backend Pytest suite:
```bash
cd backend
pytest -v
```

---

## 🌐 Public Cloud Deployment Guide

### Option A: 1-Click Render Deployment (Recommended)
1. Fork or push this repository to your GitHub account: `https://github.com/CHIDURALATHRILOCHAN/linkedin2connect`.
2. Sign in to [Render](https://render.com/).
3. Click **New +** -> **Blueprint**.
4. Connect your `linkedin2connect` GitHub repository.
5. Render will automatically detect `render.yaml` and provision:
   - **PostgreSQL Database** (`achievement2linkedin-db`)
   - **FastAPI Backend Web Service** (`achievement2linkedin-backend`)
   - **Next.js Frontend Web Service** (`achievement2linkedin-frontend`)

### Option B: Deploy Frontend to Vercel & Backend to Render / Railway
- **Frontend (Vercel)**: Import `frontend/` directory into Vercel. Set `NEXT_PUBLIC_API_URL` environment variable to your deployed backend domain.
- **Backend (Render / Railway / Koyeb)**: Deploy `backend/` using Docker or Python 3.11 runtime. Set `FRONTEND_URL` and `DATABASE_URL` environment variables.

---

## 🔒 Official LinkedIn Developer App Setup (Production)

To connect live LinkedIn credentials for production deployment:
1. Go to [LinkedIn Developer Portal](https://developer.linkedin.com/) and create a new App.
2. Under the **Products** tab, request access to:
   - **Sign In with LinkedIn using OpenID Connect**
   - **Share on LinkedIn**
3. Under the **Auth** tab, add your Redirect URIs:
   - Development: `http://localhost:8000/api/v1/linkedin/callback`
   - Production: `https://your-backend-domain.onrender.com/api/v1/linkedin/callback`
4. Copy `Client ID` and `Client Secret` to your cloud service environment variables:
   ```env
   LINKEDIN_CLIENT_ID=your_actual_client_id
   LINKEDIN_CLIENT_SECRET=your_actual_client_secret
   LINKEDIN_MOCK_MODE=false
   ```

---

## 📄 License & Security

Built with strict adherence to security best practices:
- Passlib bcrypt password hashing.
- Cryptography Fernet 256-bit encryption for stored OAuth access tokens.
- Isolated LinkedIn integration layer in `backend/app/linkedin/service.py`.

