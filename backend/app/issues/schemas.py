import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel

IssueStatus = Literal["todo", "in_progress", "in_review", "done", "cancelled"]
IssuePriority = Literal["no_priority", "urgent", "high", "medium", "low"]


class IssueCreate(BaseModel):
    title: str
    description: str | None = None
    status: IssueStatus = "todo"
    priority: IssuePriority = "no_priority"
    assignee_id: uuid.UUID | None = None
    due_date: datetime | None = None


class IssueUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: IssueStatus | None = None
    priority: IssuePriority | None = None
    assignee_id: uuid.UUID | None = None
    sort_order: int | None = None
    due_date: datetime | None = None


class IssueListItem(BaseModel):
    id: uuid.UUID
    title: str
    status: IssueStatus
    priority: IssuePriority
    assignee_id: uuid.UUID | None = None
    sort_order: int
    sequence_number: int = 0
    due_date: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class IssueRead(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    workspace_id: uuid.UUID | None = None
    title: str
    description: str | None = None
    status: IssueStatus
    priority: IssuePriority
    assignee_id: uuid.UUID | None = None
    created_by: uuid.UUID
    sort_order: int
    sequence_number: int = 0
    due_date: datetime | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}