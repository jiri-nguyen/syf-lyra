import uuid

from pydantic import BaseModel, field_validator


class LabelCreate(BaseModel):
    name: str
    color: str

    @field_validator("color")
    @classmethod
    def color_must_be_hex(cls, v: str) -> str:
        import re
        if not re.match(r"^#[0-9A-Fa-f]{6}$", v):
            raise ValueError("color phải là hex hợp lệ, ví dụ: #FF5733")
        return v


class LabelRead(BaseModel):
    id: uuid.UUID
    workspace_id: uuid.UUID
    name: str
    color: str

    model_config = {"from_attributes": True}


class LabelUpdate(BaseModel):
    name: str | None = None
    color: str | None = None

    @field_validator("color")
    @classmethod
    def color_must_be_hex(cls, v: str | None) -> str | None:
        import re
        if v and not re.match(r"^#[0-9A-Fa-f]{6}$", v):
            raise ValueError("color phải là hex hợp lệ, ví dụ: #FF5733")
        return v