import uuid
from datetime import datetime

from pydantic import BaseModel, field_validator


class WorkspaceCreate(BaseModel):
    name: str
    slug: str

    @field_validator("slug")
    @classmethod
    def slug_must_be_valid(cls, v: str) -> str:
        import re
        if not re.match(r"^[a-z0-9]+(?:-[a-z0-9]+)*$", v):
            raise ValueError("slug chỉ được chứa chữ thường, số và dấu gạch ngang")
        return v


class WorkspaceRead(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    owner_id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class WorkspaceUpdate(BaseModel):
    name: str | None = None