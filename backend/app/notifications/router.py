import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.notification import Notification
from app.models.user import User
from app.notifications import crud
from app.notifications.schemas import NotificationRead

router = APIRouter(prefix="/me/notifications", tags=["notifications"])


def _build(notif: Notification) -> NotificationRead:
    return NotificationRead(
        id=notif.id,
        type=notif.type,  # type: ignore[arg-type]
        read=notif.read,
        created_at=notif.created_at,
        issue_id=notif.issue_id,
        issue_title=notif.issue.title,
        project_id=notif.issue.project_id,
        workspace_id=notif.issue.workspace_id,
    )


@router.get("", response_model=list[NotificationRead])
async def list_notifications(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    notifs = await crud.list_for_user(db, current_user.id)
    return [_build(n) for n in notifs]


@router.get("/unread-count")
async def unread_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    count = await crud.count_unread(db, current_user.id)
    return {"count": count}


@router.patch("/read-all", status_code=status.HTTP_204_NO_CONTENT)
async def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await crud.mark_all_read(db, current_user.id)


@router.patch("/{notification_id}/read", response_model=NotificationRead)
async def mark_read(
    notification_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    notif = await crud.mark_read(db, notification_id, current_user.id)
    if not notif:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")
    return _build(notif)
