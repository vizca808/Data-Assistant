from datetime import datetime
from typing import Any
from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str


class ChartData(BaseModel):
    type: str  # bar, line, pie, area
    title: str
    data: list[dict[str, Any]]
    x_key: str = "name"
    y_key: str = "value"


class MessageResponse(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    chart_data: dict[str, Any] | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
