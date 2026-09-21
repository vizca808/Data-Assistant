import os
import json
import uuid
import shutil
import pandas as pd
from pathlib import Path
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from core.dependencies import get_db, get_current_user
from core.config import settings
from models.user import User
from models.session import Session as SessionModel
from models.uploaded_file import UploadedFile
from services.file_processor import FileProcessor
from services.vector_store import VectorStore
from schemas.session import FileInfoResponse

router = APIRouter(prefix="/api/sessions", tags=["upload"])

ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls", ".pdf", ".txt"}
MAX_SIZE_BYTES = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024


@router.post("/{session_id}/upload", response_model=FileInfoResponse)
async def upload_file(
    session_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # Verify session ownership
    session = db.query(SessionModel).filter(
        SessionModel.id == session_id,
        SessionModel.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesi tidak ditemukan")

    # Validate file extension
    suffix = Path(file.filename or "").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Format file tidak didukung. Gunakan: {', '.join(ALLOWED_EXTENSIONS)}",
        )

    # Read file content
    content = await file.read()
    if len(content) > MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Ukuran file melebihi {settings.MAX_UPLOAD_SIZE_MB}MB",
        )

    # Save to disk
    upload_dir = Path(settings.UPLOAD_DIR) / session_id
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_path = upload_dir / f"{uuid.uuid4()}{suffix}"
    with open(file_path, "wb") as f:
        f.write(content)

    # Process file
    processor = FileProcessor()
    file_type = suffix.lstrip(".")
    result = processor.process(file_path, file_type)

    # For text-based files (PDF, TXT), index in ChromaDB
    if file_type in ("pdf", "txt") and result.get("text_chunks"):
        try:
            vs = VectorStore()
            vs.index_chunks(session_id, result["text_chunks"])
        except Exception as e:
            print(f"Warning: ChromaDB indexing failed: {e}")

    # Remove old file record for this session if any
    db.query(UploadedFile).filter(UploadedFile.session_id == session_id).delete()

    # Save metadata to DB
    columns_json = json.dumps(result.get("columns", [])) if result.get("columns") else None
    summary_json = json.dumps(result.get("summary", {})) if result.get("summary") else None

    uploaded = UploadedFile(
        id=str(uuid.uuid4()),
        session_id=session_id,
        filename=file.filename,
        file_type=file_type,
        file_size=len(content),
        row_count=result.get("row_count"),
        col_count=result.get("col_count"),
        columns=columns_json,
        summary=summary_json,
        storage_path=str(file_path),
    )
    db.add(uploaded)

    # Update session name
    session.name = Path(file.filename or "session").stem
    session.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(uploaded)

    return FileInfoResponse(
        id=uploaded.id,
        filename=uploaded.filename,
        file_type=uploaded.file_type,
        file_size=uploaded.file_size,
        row_count=uploaded.row_count,
        col_count=uploaded.col_count,
        columns=json.loads(uploaded.columns) if uploaded.columns else None,
        summary=json.loads(uploaded.summary) if uploaded.summary else None,
        created_at=uploaded.created_at,
    )
