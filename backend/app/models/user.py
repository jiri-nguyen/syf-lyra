from __future__ import annotations

import uuid
from typing import TYPE_CHECKING

from sqlalchemy import String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.comment import Comment
    from app.models.issue import Issue
    from app.models.notification import Notification
    from app.models.workspace import Workspace, WorkspaceMember


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(Text, nullable=True)

    # relationships
    owned_workspaces: Mapped[list["Workspace"]] = relationship(
        back_populates="owner", foreign_keys="Workspace.owner_id"
    )
    workspace_memberships: Mapped[list["WorkspaceMember"]] = relationship(
        back_populates="user"
    )
    assigned_issues: Mapped[list["Issue"]] = relationship(
        back_populates="assignee", foreign_keys="Issue.assignee_id"
    )
    created_issues: Mapped[list["Issue"]] = relationship(
        back_populates="creator", foreign_keys="Issue.created_by"
    )
    comments: Mapped[list["Comment"]] = relationship(back_populates="author")
    notifications: Mapped[list["Notification"]] = relationship(back_populates="user")