import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.comment import Comment
from app.comments.schemas import CommentCreate, CommentUpdate


async def list_by_issue(db: AsyncSession, issue_id: uuid.UUID) -> list[Comment]:
    result = await db.execute(
        select(Comment)
        .where(Comment.issue_id == issue_id)
        .order_by(Comment.created_at.asc())
    )
    return list(result.scalars().all())


async def get(db: AsyncSession, comment_id: uuid.UUID) -> Comment | None:
    result = await db.execute(select(Comment).where(Comment.id == comment_id))
    return result.scalar_one_or_none()


async def create(
    db: AsyncSession,
    issue_id: uuid.UUID,
    author_id: uuid.UUID,
    data: CommentCreate,
) -> Comment:
    comment = Comment(
        issue_id=issue_id,
        author_id=author_id,
        content=data.content,
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    return comment


async def update(
    db: AsyncSession,
    comment: Comment,
    data: CommentUpdate,
) -> Comment:
    comment.content = data.content
    await db.commit()
    await db.refresh(comment)
    return comment


async def delete(db: AsyncSession, comment: Comment) -> None:
    await db.delete(comment)
    await db.commit()