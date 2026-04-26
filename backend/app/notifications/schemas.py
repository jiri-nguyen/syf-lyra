import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel

NotificationType = Literal["assigned", "commented"]


class NotificationRead(BaseModel):
    id: uuid.UUID
    type: NotificationType
    read: bool
    created_at: datetime
    issue_id: uuid.UUID
    issue_title: str
    project_id: uuid.UUID
    workspace_id: uuid.UUID
