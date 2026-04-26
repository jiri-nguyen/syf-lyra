import json
import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.issues import crud
from app.issues.schemas import IssueCreate, IssueListItem, IssueRead, IssuePriority, IssueStatus, IssueUpdate
from app.models.user import User
from app.notifications import crud as notif_crud

router = APIRouter(prefix="/projects/{project_id}/issues", tags=["issues"])


async def _publish(request: Request, event_type: str, project_id: uuid.UUID, issue_data: dict) -> None:
    """Publish issue event lên Redis. Bỏ qua nếu Redis không available."""
    try:
        payload = json.dumps(
            {"type": event_type, "project_id": str(project_id), "data": issue_data},
            default=str,
        )
        await request.app.state.redis.publish(f"project:{project_id}", payload)
    except Exception:
        pass  # Không để Redis failure làm crash HTTP endpoint


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
    request: Request,
    project_id: uuid.UUID,
    data: IssueCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    issue = await crud.create(db, project_id, current_user.id, data)
    issue_data = IssueRead.model_validate(issue).model_dump(mode="json")
    await _publish(request, "issue.created", project_id, issue_data)
    return issue


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
    request: Request,
    project_id: uuid.UUID,
    issue_id: uuid.UUID,
    data: IssueUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    issue = await crud.get(db, issue_id)
    if not issue or issue.project_id != project_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")

    old_assignee_id = issue.assignee_id
    updated = await crud.update(db, issue, data)

    # Tạo notification khi assign cho người khác
    new_assignee_id = updated.assignee_id
    if (
        new_assignee_id
        and new_assignee_id != old_assignee_id
        and new_assignee_id != current_user.id
    ):
        await notif_crud.create(db, new_assignee_id, issue_id, "assigned")

    issue_data = IssueRead.model_validate(updated).model_dump(mode="json")
    await _publish(request, "issue.updated", project_id, issue_data)
    return updated


@router.delete("/{issue_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_issue(
    request: Request,
    project_id: uuid.UUID,
    issue_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    issue = await crud.get(db, issue_id)
    if not issue or issue.project_id != project_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Issue not found")
    await crud.delete(db, issue)
    await _publish(request, "issue.deleted", project_id, {"id": str(issue_id)})
