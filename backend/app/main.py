import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.core.config import settings
from app.core.database import engine, Base
from app.api.endpoints import auth, linkedin, achievements, posts, admin

# Create DB tables
Base.metadata.create_all(bind=engine)

# Startup diagnostics
print(f"[STARTUP] LINKEDIN_MOCK_MODE = {settings.LINKEDIN_MOCK_MODE}")
print(f"[STARTUP] LINKEDIN_CLIENT_ID = {settings.LINKEDIN_CLIENT_ID[:8]}..." if len(settings.LINKEDIN_CLIENT_ID) > 8 else f"[STARTUP] LINKEDIN_CLIENT_ID = {settings.LINKEDIN_CLIENT_ID}")
print(f"[STARTUP] AI_MOCK_MODE = {settings.AI_MOCK_MODE}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    import threading
    from app.ocr.extractor import ocr_service
    # Preload EasyOCR reader lazily in background thread
    threading.Thread(target=ocr_service._get_ocr_reader, daemon=True).start()
    yield

app = FastAPI(
    title=settings.APP_NAME,
    description="AI-powered certificate & achievement analyzer to publish professional LinkedIn posts.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS
origins = [
    settings.FRONTEND_URL,
    "https://achievement2linkedin-frontend.onrender.com",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure upload directory exists and mount static route
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.STORAGE_DIR), name="uploads")

# Include Router endpoints
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(linkedin.router, prefix=f"{settings.API_V1_STR}/linkedin", tags=["LinkedIn OAuth & Integration"])
app.include_router(achievements.router, prefix=f"{settings.API_V1_STR}/achievements", tags=["Achievements & File Upload"])
app.include_router(posts.router, prefix=f"{settings.API_V1_STR}/posts", tags=["Post Generation & Publishing"])
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["Dashboard & Admin Metrics"])

@app.get("/")
def root():
    return {
        "app": settings.APP_NAME,
        "status": "online",
        "mock_modes": {
            "ai_mock_mode": settings.AI_MOCK_MODE,
            "linkedin_mock_mode": settings.LINKEDIN_MOCK_MODE
        },
        "docs": "/docs"
    }
