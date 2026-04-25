import uuid
from datetime import datetime

from pydantic import BaseModel, field_validator


class ProjectCreate(BaseModel):
    name: str
    description: str | None = None
    identifier: str

    @field_validator("identifier")
    @classmethod
    def identifier_must_be_valid(cls, v: str) -> str:
        if not v.isupper() or not v.isalpha() or len(v) > 10:
            raise ValueError("identifier phải là chữ hoa, không dấu, tối đa 10 ký tự (ví dụ: ENG, DEV)")
        return v


class ProjectRead(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    name: str
    description: str | None = None
    identifier: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None