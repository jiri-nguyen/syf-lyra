from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.git_commit import GitCommit
from app.models.git_pull_request import GitPullRequest
from app.models.issue import Issue
from app.models.project import Project
from app.webhooks.parser import parse_branch

logger = logging.getLogger(__name__)

# Statuses that can be auto-upgraded (never downgrade)
_UPGRADEABLE_TO_REVIEW = {"todo", "in_progress"}


async def resolve_issue(
    db: AsyncSession,
    identifier: str,
    sequence_number: int,
) -> Issue | None:
    project_result = await db.execute(
        select(Project).where(func.upper(Project.identifier) == identifier.upper())
    )
    project = project_result.scalar_one_or_none()
    if not project:
        return None

    issue_result = await db.execute(
        select(Issue).where(
            Issue.project_id == project.id,
            Issue.sequence_number == sequence_number,
        )
    )
    return issue_result.scalar_one_or_none()


async def handle_push(db: AsyncSession, payload: dict[str, Any]) -> None:
    ref: str = payload.get("ref", "")
    parsed = parse_branch(ref)
    if not parsed:
        return

    identifier, seq_num = parsed
    issue = await resolve_issue(db, identifier, seq_num)
    if not issue:
        logger.info("push: no issue found for branch %s", ref)
        return

    commits: list[dict] = payload.get("commits", [])
    for commit in commits:
        sha: str = commit.get("id", "")
        if not sha:
            continue

        committed_at: datetime | None = None
        ts = commit.get("timestamp")
        if ts:
            try:
                committed_at = datetime.fromisoformat(ts)
            except ValueError:
                pass

        stmt = (
            insert(GitCommit)
            .values(
                id=uuid.uuid4(),
                issue_id=issue.id,
                project_id=issue.project_id,
                provider="github",
                sha=sha,
                short_sha=sha[:7],
                message=(commit.get("message") or "")[:2000],
                url=commit.get("url") or "",
                author_name=(commit.get("author") or {}).get("name"),
                author_email=(commit.get("author") or {}).get("email"),
                author_avatar=None,
                committed_at=committed_at,
                created_at=datetime.now(timezone.utc),
            )
            .on_conflict_do_nothing(constraint="uq_git_commit_provider_sha")
        )
        await db.execute(stmt)

    await db.commit()


async def handle_pull_request(
    db: AsyncSession,
    payload: dict[str, Any],
    redis: Any,
) -> None:
    pr_data: dict = payload.get("pull_request", {})
    action: str = payload.get("action", "")

    branch_name: str = (pr_data.get("head") or {}).get("ref", "")
    parsed = parse_branch(branch_name)
    if not parsed:
        return

    identifier, seq_num = parsed
    issue = await resolve_issue(db, identifier, seq_num)
    if not issue:
        logger.info("pull_request: no issue found for branch %s", branch_name)
        return

    # Determine PR state
    is_merged: bool = pr_data.get("merged", False)
    pr_state_raw: str = pr_data.get("state", "open")  # 'open' | 'closed'
    if is_merged:
        state = "merged"
    elif pr_state_raw == "closed":
        state = "closed"
    else:
        state = "open"

    merged_at_raw = pr_data.get("merged_at")
    merged_at: datetime | None = None
    if merged_at_raw:
        try:
            merged_at = datetime.fromisoformat(merged_at_raw.replace("Z", "+00:00"))
        except ValueError:
            pass

    now = datetime.now(timezone.utc)

    stmt = (
        insert(GitPullRequest)
        .values(
            id=uuid.uuid4(),
            issue_id=issue.id,
            project_id=issue.project_id,
            provider="github",
            pr_number=pr_data.get("number", 0),
            pr_id=pr_data.get("id", 0),
            title=(pr_data.get("title") or "")[:500],
            url=pr_data.get("html_url") or "",
            state=state,
            branch_name=branch_name,
            author_login=(pr_data.get("user") or {}).get("login"),
            author_avatar=(pr_data.get("user") or {}).get("avatar_url"),
            merged_at=merged_at,
            created_at=now,
            updated_at=now,
        )
        .on_conflict_do_update(
            constraint="uq_git_pr_provider_id",
            set_={
                "title": (pr_data.get("title") or "")[:500],
                "url": pr_data.get("html_url") or "",
                "state": state,
                "merged_at": merged_at,
                "updated_at": now,
            },
        )
    )
    await db.execute(stmt)

    # Auto-status upgrade (never downgrade)
    new_status: str | None = None
    if action in ("opened", "reopened") and issue.status in _UPGRADEABLE_TO_REVIEW:
        new_status = "in_review"
    elif action == "closed" and is_merged:
        new_status = "done"

    if new_status:
        issue.status = new_status

    await db.commit()

    # Publish Redis event so frontend Kanban updates in real-time
    if new_status:
        try:
            event = json.dumps(
                {
                    "type": "issue.updated",
                    "project_id": str(issue.project_id),
                    "data": {"id": str(issue.id), "status": new_status},
                },
                default=str,
            )
            await redis.publish(f"project:{issue.project_id}", event)
        except Exception:
            pass
