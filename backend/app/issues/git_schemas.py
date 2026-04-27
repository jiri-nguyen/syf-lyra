import uuid
from datetime import datetime

from pydantic import BaseModel


class GitPullRequestRead(BaseModel):
    id: uuid.UUID
    pr_number: int
    title: str
    url: str
    state: str  # 'open' | 'closed' | 'merged'
    branch_name: str
    author_login: str | None
    author_avatar: str | None
    merged_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}


class GitCommitRead(BaseModel):
    id: uuid.UUID
    sha: str
    short_sha: str
    message: str
    url: str
    author_name: str | None
    author_avatar: str | None
    committed_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}
