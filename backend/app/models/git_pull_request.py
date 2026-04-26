from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.issue import Issue
    from app.models.project import Project


class GitPullRequest(Base):
    __tablename__ = "git_pull_requests"
    __table_args__ = (
        UniqueConstraint("provider", "pr_id", name="uq_git_pr_provider_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    issue_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("issues.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )
    provider: Mapped[str] = mapped_column(String(20), nullable=False, default="github")
    pr_number: Mapped[int] = mapped_column(Integer, nullable=False)
    pr_id: Mapped[int] = mapped_column(BigInteger, nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    url: Mapped[str] = mapped_column(String(1000), nullable=False)
    state: Mapped[str] = mapped_column(String(20), nullable=False, default="open")
    # state values: "open" | "closed" | "merged"
    branch_name: Mapped[str] = mapped_column(String(255), nullable=False)
    author_login: Mapped[str | None] = mapped_column(String(255), nullable=True)
    author_avatar: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    merged_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    # relationships
    issue: Mapped["Issue"] = relationship(back_populates="pull_requests")
    project: Mapped["Project"] = relationship()
