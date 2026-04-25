import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.workspace import WorkspaceMember
from app.workspaces.schemas import MemberInvite, MemberRead, MemberUpdateRole
from app.workspaces import crud
from app.users.crud import get_by_email

router = APIRouter(prefix="/workspaces/{workspace_id}/members", tags=["members"])


def _require_admin(member: WorkspaceMember | None) -> None:
    if not member or member.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin only",
        )


async def _build_member_read(db: AsyncSession, member: WorkspaceMember) -> MemberRead:
    """Join member với user để trả về thông tin đầy đủ."""
    result = await db.execute(select(User).where(User.id == member.user_id))
    user = result.scalar_one()
    return MemberRead(
        user_id=member.user_id,
        workspace_id=member.workspace_id,
        role=member.role,
        joined_at=member.joined_at,
        email=user.email,
        full_name=user.full_name,
        avatar_url=user.avatar_url,
    )


@router.get("", response_model=list[MemberRead])
async def list_members(
    workspace_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    members = await crud.list_members(db, workspace_id)
    return [await _build_member_read(db, m) for m in members]


@router.post("", response_model=MemberRead, status_code=status.HTTP_201_CREATED)
async def invite_member(
    workspace_id: uuid.UUID,
    data: MemberInvite,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # chỉ admin mới được mời
    current_member = await crud.get_member(db, workspace_id, current_user.id)
    _require_admin(current_member)

    # tìm user theo email
    user = await get_by_email(db, data.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found — they need to register first",
        )

    # kiểm tra đã là member chưa
    existing = await crud.get_member(db, workspace_id, user.id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member",
        )

    member = await crud.add_member(db, workspace_id, user.id)
    return await _build_member_read(db, member)


@router.patch("/{user_id}", response_model=MemberRead)
async def update_role(
    workspace_id: uuid.UUID,
    user_id: uuid.UUID,
    data: MemberUpdateRole,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    current_member = await crud.get_member(db, workspace_id, current_user.id)
    _require_admin(current_member)

    member = await crud.get_member(db, workspace_id, user_id)
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    # không được tự hạ quyền mình
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own role",
        )

    updated = await crud.update_member_role(db, member, data.role)
    return await _build_member_read(db, updated)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    workspace_id: uuid.UUID,
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    current_member = await crud.get_member(db, workspace_id, current_user.id)

    # admin xóa người khác, hoặc tự rời workspace
    if user_id != current_user.id:
        _require_admin(current_member)

    # owner không thể bị xóa
    workspace = await crud.get_by_id(db, workspace_id)
    if workspace and workspace.owner_id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot remove workspace owner",
        )

    member = await crud.get_member(db, workspace_id, user_id)
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")

    await crud.remove_member(db, member)