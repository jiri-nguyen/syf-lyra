import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.issues.git_schemas import GitCommitRead, GitPullRequestRead
from app.models.git_commit import GitCommit
from app.models.git_pull_request import GitPullRequest
from app.models.issue import Issue
from app.models.user import User

router = APIRouter(prefix="/issues", tags=["issues-git"])


async def _get_issue_or_404(db: AsyncSession, issue_id: uuid.UUID) -> Issue:
    result = await db.execute(select(Issue).where(Issue.id == issue_id))
    issue = result.scalar_one_or_none()
    if not issue:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")
    return issue


@router.get("/{issue_id}/git/pull-requests", response_model=list[GitPullRequestRead])
async def list_issue_pull_requests(
    issue_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_issue_or_404(db, issue_id)
    result = await db.execute(
        select(GitPullRequest)
        .where(GitPullRequest.issue_id == issue_id)
        .order_by(GitPullRequest.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{issue_id}/git/commits", response_model=list[GitCommitRead])
async def list_issue_commits(
    issue_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await _get_issue_or_404(db, issue_id)
    result = await db.execute(
        select(GitCommit)
        .where(GitCommit.issue_id == issue_id)
        .order_by(GitCommit.committed_at.desc())
    )
    return result.scalars().all()
