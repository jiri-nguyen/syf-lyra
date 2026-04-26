import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.issues.schemas import IssueCreate, IssueListItem, IssueRead, IssueStatus, IssuePriority, IssueUpdate
from app.issues import crud

router = APIRouter(prefix="/projects/{project_id}/issues", tags=["issues"])


@router.get("", response_model=list[IssueListItem])
async def list_issues(
    project_id: uuid.UUID,
    status: Annotated[list[IssueStatus] | None, Query()] = None,
    priority: Annotated[list[IssuePriority] | None, Query()] = None,
    assignee_id: uuid.UUID | None = None,
    label_id: Annotated[list[uuid.UUID] | None, Query()] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await crud.list_by_project(db, project_id, status, priority, assignee_id, label_id)


@router.post("", response_model=IssueRead, status_code=status.HTTP_201_CREATED)
async def create_issue(
    project_id: uuid.UUID,
    data: IssueCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await crud.create(db, project_id, current_user.id, data)


@router.get("/{issue_id}", response_model=IssueRead)
async def get_issue(
    project_id: uuid.UUID,
    issue_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    issue = await crud.get(db, issue_id)
    if not issue or issue.project_id != project_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")
    return issue


@router.patch("/{issue_id}", response_model=IssueRead)
async def update_issue(
    project_id: uuid.UUID,
    issue_id: uuid.UUID,
    data: IssueUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    issue = await crud.get(db, issue_id)
    if not issue or issue.project_id != project_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")
    return await crud.update(db, issue, data)


@router.delete("/{issue_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_issue(
    project_id: uuid.UUID,
    issue_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    issue = await crud.get(db, issue_id)
    if not issue or issue.project_id != project_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")
    await crud.delete(db, issue)