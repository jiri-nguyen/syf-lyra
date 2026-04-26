from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.issue import Issue
    from app.models.project import Project


class GitCommit(Base):
    __tablename__ = "git_commits"
    __table_args__ = (
        UniqueConstraint("provider", "sha", name="uq_git_commit_provider_sha"),
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
    sha: Mapped[str] = mapped_column(String(64), nullable=False)
    short_sha: Mapped[str] = mapped_column(String(8), nullable=False)
    message: Mapped[str] = mapped_column(String(2000), nullable=False)
    url: Mapped[str] = mapped_column(String(1000), nullable=False)
    author_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    author_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    author_avatar: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    committed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )

    # relationships
    issue: Mapped["Issue"] = relationship(back_populates="commits")
    project: Mapped["Project"] = relationship()
