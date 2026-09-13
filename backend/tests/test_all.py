import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.core.database import Base, get_db
from app.core.config import settings

# Test DB Setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_achievement2linkedin.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

@pytest.fixture
def auth_headers():
    # Register & login test user
    email = "testuser@example.com"
    password = "password123"
    client.post("/api/v1/auth/register", json={"name": "Test User", "email": email, "password": password})
    res = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

def test_auth_flow():
    # Register
    res = client.post("/api/v1/auth/register", json={
        "name": "Jane Developer",
        "email": "jane@example.com",
        "password": "securepassword"
    })
    assert res.status_code == 200
    assert "access_token" in res.json()

    # Login
    res_login = client.post("/api/v1/auth/login", json={
        "email": "jane@example.com",
        "password": "securepassword"
    })
    assert res_login.status_code == 200
    assert "access_token" in res_login.json()

from unittest.mock import patch

def test_full_achievement_pipeline(auth_headers):
    # Step 1: Upload fake PNG certificate
    fake_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"
    files = {"file": ("aws_cert.png", fake_png, "image/png")}
    
    mock_extracted = {
        "recipient_name": "Jane Developer",
        "achievement_title": "AWS Certified Solutions Architect",
        "issuing_organization": "Amazon Web Services",
        "issue_date": "2025-08-01",
        "certificate_id": "AWS-12345",
        "achievement_type": "Certification",
        "skills": ["AWS", "Cloud"],
        "description": "Mastery of AWS cloud architecture."
    }

    with patch("app.services.achievement_service.ocr_service.extract_document", return_value=mock_extracted):
        res_upload = client.post("/api/v1/achievements", files=files, headers=auth_headers)
        assert res_upload.status_code == 200
        achievement_id = res_upload.json()["id"]
        assert res_upload.json()["processing_status"] in ["UPLOADED", "EXTRACTED"]


    # Step 2: Verify & Edit field
    verify_payload = {
        "recipient_name": "Jane Developer",
        "achievement_title": "AWS Certified Solutions Architect",
        "issuing_organization": "Amazon Web Services",
        "issue_date": "2025-08-01",
        "certificate_id": "AWS-12345",
        "achievement_type": "Certification",
        "skills": ["AWS", "Cloud"],
        "description": "Mastery of AWS cloud architecture."
    }
    res_verify = client.patch(f"/api/v1/achievements/{achievement_id}/verify", json=verify_payload, headers=auth_headers)
    assert res_verify.status_code == 200

    # Step 3: Generate post variations
    gen_payload = {
        "achievement_id": achievement_id,
        "tone": "Professional"
    }
    res_post = client.post("/api/v1/posts/generate", json=gen_payload, headers=auth_headers)
    assert res_post.status_code == 200
    post_data = res_post.json()
    post_id = post_data["id"]
    assert len(post_data["post_variations"]) == 3

    # Step 4: Connect mock LinkedIn
    res_connect = client.get("/api/v1/linkedin/connect", headers=auth_headers)
    assert res_connect.status_code == 200
    auth_url = res_connect.json()["authorization_url"]
    state = res_connect.json()["state"]

    # Callback
    res_cb = client.get(f"/api/v1/linkedin/callback?code=mock_code&state={state}", follow_redirects=False)
    assert res_cb.status_code in [200, 302, 307]

    # Step 5: Publish post
    res_pub = client.post(f"/api/v1/posts/{post_id}/publish", headers=auth_headers)
    assert res_pub.status_code == 200
    assert res_pub.json()["status"] == "PUBLISHED"
    assert "linkedin_post_id" in res_pub.json()
