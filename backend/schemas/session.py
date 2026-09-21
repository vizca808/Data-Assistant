from datetime import datetime
from typing import Any
from pydantic import BaseModel


class SessionCreate(BaseModel):
    name: str = "New Session"


class SessionResponse(BaseModel):
    id: str
    name: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class FileInfoResponse(BaseModel):
    id: str
    filename: str
    file_type: str
    file_size: int | None
    row_count: int | None
    col_count: int | None
    columns: list[str] | None
    summary: dict[str, Any] | None
    created_at: datetime

    model_config = {"from_attributes": True}


class SessionDetailResponse(BaseModel):
    id: str
    name: str
    created_at: datetime
    updated_at: datetime
    file: FileInfoResponse | None = None

    model_config = {"from_attributes": True}
