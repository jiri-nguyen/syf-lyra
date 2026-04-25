import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.comment import Comment
from app.comments.schemas import CommentCreate, CommentRead, CommentUpdate
from app.comments import crud

router = APIRouter(prefix="/issues/{issue_id}/comments", tags=["comments"])


async def _build_comment_read(db: AsyncSession, comment: Comment) -> CommentRead:
    result = await db.execute(select(User).where(User.id == comment.author_id))
    author = result.scalar_one()
    return CommentRead(
        id=comment.id,
        issue_id=comment.issue_id,
        author_id=comment.author_id,
        content=comment.content,
        created_at=comment.created_at,
        updated_at=comment.updated_at,
        author_name=author.full_name,
        author_avatar=author.avatar_url,
    )


@router.get("", response_model=list[CommentRead])
async def list_comments(
    issue_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    comments = await crud.list_by_issue(db, issue_id)
    return [await _build_comment_read(db, c) for c in comments]


@router.post("", response_model=CommentRead, status_code=status.HTTP_201_CREATED)
async def create_comment(
    issue_id: uuid.UUID,
    data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    comment = await crud.create(db, issue_id, current_user.id, data)
    return await _build_comment_read(db, comment)


@router.patch("/{comment_id}", response_model=CommentRead)
async def update_comment(
    issue_id: uuid.UUID,
    comment_id: uuid.UUID,
    data: CommentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    comment = await crud.get(db, comment_id)
    if not comment or comment.issue_id != issue_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    if comment.author_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Can only edit your own comments")
    updated = await crud.update(db, comment, data)
    return await _build_comment_read(db, updated)


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    issue_id: uuid.UUID,
    comment_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    comment = await crud.get(db, comment_id)
    if not comment or comment.issue_id != issue_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
    if comment.author_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Can only delete your own comments")
    await crud.delete(db, comment)