import uuid
from datetime import datetime

from pydantic import BaseModel


class CommentCreate(BaseModel):
    content: str


class CommentUpdate(BaseModel):
    content: str


class CommentRead(BaseModel):
    id: uuid.UUID
    issue_id: uuid.UUID
    author_id: uuid.UUID
    content: str
    created_at: datetime
    updated_at: datetime

    # thông tin author đính kèm
    author_name: str
    author_avatar: str | None = None

    model_config = {"from_attributes": True}