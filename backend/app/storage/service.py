import os
import uuid
import shutil
from typing import Tuple
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf"}
ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "application/pdf",
}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

class StorageService:
    def __init__(self):
        self.storage_dir = settings.STORAGE_DIR
        os.makedirs(self.storage_dir, exist_ok=True)

    def validate_file(self, file: UploadFile, content: bytes) -> Tuple[str, str, int]:
        filename = file.filename or "file.png"
        ext = os.path.splitext(filename)[1].lower()

        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported file format '{ext}'. Allowed formats: JPG, JPEG, PNG, PDF."
            )

        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds maximum limit of 10MB."
            )

        # Basic header inspection (magic numbers)
        if ext in [".jpg", ".jpeg"]:
            if not content.startswith(b"\xff\xd8"):
                raise HTTPException(status_code=400, detail="Invalid JPEG image format.")
        elif ext == ".png":
            if not content.startswith(b"\x89PNG\r\n\x1a\n"):
                raise HTTPException(status_code=400, detail="Invalid PNG image format.")
        elif ext == ".pdf":
            if not content.startswith(b"%PDF"):
                raise HTTPException(status_code=400, detail="Invalid PDF document format.")

        return filename, ext, len(content)

    def save_file(self, file: UploadFile, content: bytes) -> Tuple[str, str]:
        original_name, ext, size = self.validate_file(file, content)
        secure_filename = f"{uuid.uuid4()}{ext}"
        filepath = os.path.join(self.storage_dir, secure_filename)

        with open(filepath, "wb") as f:
            f.write(content)

        file_url = f"/uploads/{secure_filename}"
        return file_url, filepath

storage_service = StorageService()
