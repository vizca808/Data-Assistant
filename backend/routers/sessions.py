import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from core.dependencies import get_db, get_current_user
from models.user import User
from models.session import Session as SessionModel
from models.uploaded_file import UploadedFile
from schemas.session import SessionCreate, SessionResponse, SessionDetailResponse, FileInfoResponse
import json

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


def _build_session_detail(session: SessionModel, db: Session) -> SessionDetailResponse:
    file = db.query(UploadedFile).filter(
        UploadedFile.session_id == session.id
    ).order_by(UploadedFile.created_at.desc()).first()

    file_info = None
    if file:
        columns = json.loads(file.columns) if file.columns else None
        summary = json.loads(file.summary) if file.summary else None
        file_info = FileInfoResponse(
            id=file.id,
            filename=file.filename,
            file_type=file.file_type,
            file_size=file.file_size,
            row_count=file.row_count,
            col_count=file.col_count,
            columns=columns,
            summary=summary,
            created_at=file.created_at,
        )

    return SessionDetailResponse(
        id=session.id,
        name=session.name,
        created_at=session.created_at,
        updated_at=session.updated_at,
        file=file_info,
    )


@router.get("", response_model=list[SessionResponse])
def list_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sessions = (
        db.query(SessionModel)
        .filter(SessionModel.user_id == current_user.id)
        .order_by(SessionModel.updated_at.desc())
        .all()
    )
    return sessions


@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
def create_session(
    payload: SessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = SessionModel(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        name=payload.name,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/{session_id}", response_model=SessionDetailResponse)
def get_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = db.query(SessionModel).filter(
        SessionModel.id == session_id,
        SessionModel.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesi tidak ditemukan")
    return _build_session_detail(session, db)


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = db.query(SessionModel).filter(
        SessionModel.id == session_id,
        SessionModel.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sesi tidak ditemukan")

    # Also delete vector store collection for this session
    try:
        from services.vector_store import VectorStore
        vs = VectorStore()
        vs.delete_collection(session_id)
    except Exception:
        pass

    db.delete(session)
    db.commit()
