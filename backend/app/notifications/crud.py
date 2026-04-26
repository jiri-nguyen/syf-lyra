import uuid

from sqlalchemy import func, select, update as sa_update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.issue import Issue
from app.models.notification import Notification


async def create(
    db: AsyncSession,
    user_id: uuid.UUID,
    issue_id: uuid.UUID,
    type_: str,
) -> Notification:
    notif = Notification(user_id=user_id, issue_id=issue_id, type=type_)
    db.add(notif)
    await db.commit()
    return notif


async def list_for_user(
    db: AsyncSession,
    user_id: uuid.UUID,
    limit: int = 30,
) -> list[Notification]:
    result = await db.execute(
        select(Notification)
        .options(selectinload(Notification.issue).selectinload(Issue.project))
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
    )
    return list(result.scalars().all())


async def count_unread(db: AsyncSession, user_id: uuid.UUID) -> int:
    result = await db.execute(
        select(func.count())
        .select_from(Notification)
        .where(Notification.user_id == user_id, Notification.read == False)  # noqa: E712
    )
    return result.scalar() or 0


async def mark_read(
    db: AsyncSession,
    notif_id: uuid.UUID,
    user_id: uuid.UUID,
) -> Notification | None:
    result = await db.execute(
        select(Notification).where(
            Notification.id == notif_id,
            Notification.user_id == user_id,
        )
    )
    notif = result.scalar_one_or_none()
    if notif is None:
        return None
    notif.read = True
    await db.commit()
    # Re-fetch với issue loaded để có issue_title và project_id
    return await _get_with_issue(db, notif_id)


async def mark_all_read(db: AsyncSession, user_id: uuid.UUID) -> None:
    await db.execute(
        sa_update(Notification)
        .where(Notification.user_id == user_id, Notification.read == False)  # noqa: E712
        .values(read=True)
    )
    await db.commit()


async def _get_with_issue(
    db: AsyncSession,
    notif_id: uuid.UUID,
) -> Notification | None:
    result = await db.execute(
        select(Notification)
        .options(selectinload(Notification.issue).selectinload(Issue.project))
        .where(Notification.id == notif_id)
    )
    return result.scalar_one_or_none()
