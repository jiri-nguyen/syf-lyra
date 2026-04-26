from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, Integer, String, Table, Text, Column
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin

if TYPE_CHECKING:
    from app.models.comment import Comment
    from app.models.label import Label
    from app.models.notification import Notification
    from app.models.project import Project
    from app.models.user import User

# association table — no class needed, pure join table
issue_labels = Table(
    "issue_labels",
    Base.metadata,
    Column(
        "issue_id",
        UUID(as_uuid=True),
        ForeignKey("issues.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "label_id",
        UUID(as_uuid=True),
        ForeignKey("labels.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)


class Issue(Base, TimestampMixin):
    __tablename__ = "issues"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    status: Mapped[str] = mapped_column(
        String(30), nullable=False, default="todo", index=True
    )
    # status values: "todo" | "in_progress" | "in_review" | "done" | "cancelled"

    priority: Mapped[str] = mapped_column(
        String(20), nullable=False, default="no_priority"
    )
    # priority values: "no_priority" | "urgent" | "high" | "medium" | "low"

    assignee_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # sort_order: controls display order within a Kanban column

    due_date: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # relationships
    project: Mapped["Project"] = relationship(back_populates="issues")
    assignee: Mapped["User | None"] = relationship(
        back_populates="assigned_issues", foreign_keys=[assignee_id]
    )
    creator: Mapped["User"] = relationship(
        back_populates="created_issues", foreign_keys=[created_by]
    )
    comments: Mapped[list["Comment"]] = relationship(
        back_populates="issue", cascade="all, delete-orphan"
    )
    labels: Mapped[list["Label"]] = relationship(
        secondary=issue_labels, back_populates="issues"
    )
    notifications: Mapped[list["Notification"]] = relationship(
        back_populates="issue", cascade="all, delete-orphan"
    )

    @property
    def workspace_id(self) -> "uuid.UUID | None":
        return self.project.workspace_id if self.project is not None else None