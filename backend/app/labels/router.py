import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.labels.schemas import LabelCreate, LabelRead, LabelUpdate
from app.labels import crud

# workspace-scoped labels
router = APIRouter(tags=["labels"])

# ── Workspace labels CRUD ──────────────────────────────────────────────────

@router.get("/workspaces/{workspace_id}/labels", response_model=list[LabelRead])
async def list_labels(
    workspace_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await crud.list_by_workspace(db, workspace_id)


@router.post("/workspaces/{workspace_id}/labels", response_model=LabelRead, status_code=status.HTTP_201_CREATED)
async def create_label(
    workspace_id: uuid.UUID,
    data: LabelCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await crud.create(db, workspace_id, data)


@router.patch("/workspaces/{workspace_id}/labels/{label_id}", response_model=LabelRead)
async def update_label(
    workspace_id: uuid.UUID,
    label_id: uuid.UUID,
    data: LabelUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    label = await crud.get(db, label_id)
    if not label or label.workspace_id != workspace_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Label not found")
    return await crud.update(db, label, data)


@router.delete("/workspaces/{workspace_id}/labels/{label_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_label(
    workspace_id: uuid.UUID,
    label_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    label = await crud.get(db, label_id)
    if not label or label.workspace_id != workspace_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Label not found")
    await crud.delete_label(db, label)


# ── Issue label assignment ─────────────────────────────────────────────────

@router.get("/issues/{issue_id}/labels", response_model=list[LabelRead])
async def get_issue_labels(
    issue_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await crud.get_issue_labels(db, issue_id)


@router.post("/issues/{issue_id}/labels/{label_id}", status_code=status.HTTP_204_NO_CONTENT)
async def add_label(
    issue_id: uuid.UUID,
    label_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    label = await crud.get(db, label_id)
    if not label:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Label not found")
    existing = await crud.get_issue_labels(db, issue_id)
    if any(l.id == label_id for l in existing):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Label already added")
    await crud.add_label_to_issue(db, issue_id, label_id)


@router.delete("/issues/{issue_id}/labels/{label_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_label(
    issue_id: uuid.UUID,
    label_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await crud.remove_label_from_issue(db, issue_id, label_id)