import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.workspace import Workspace, WorkspaceMember
from app.workspaces.schemas import WorkspaceCreate, WorkspaceUpdate


async def get_by_id(db: AsyncSession, workspace_id: uuid.UUID) -> Workspace | None:
    result = await db.execute(
        select(Workspace).where(Workspace.id == workspace_id)
    )
    return result.scalar_one_or_none()


async def get_by_slug(db: AsyncSession, slug: str) -> Workspace | None:
    result = await db.execute(
        select(Workspace).where(Workspace.slug == slug)
    )
    return result.scalar_one_or_none()


async def list_by_user(db: AsyncSession, user_id: uuid.UUID) -> list[Workspace]:
    result = await db.execute(
        select(Workspace)
        .join(WorkspaceMember, WorkspaceMember.workspace_id == Workspace.id)
        .where(WorkspaceMember.user_id == user_id)
        .order_by(Workspace.created_at.asc())
    )
    return list(result.scalars().all())


async def create(
    db: AsyncSession,
    owner_id: uuid.UUID,
    data: WorkspaceCreate,
) -> Workspace:
    workspace = Workspace(
        owner_id=owner_id,
        **data.model_dump(),
    )
    db.add(workspace)
    await db.flush()  # lấy workspace.id trước khi commit

    # tự động thêm owner vào workspace với role admin
    member = WorkspaceMember(
        workspace_id=workspace.id,
        user_id=owner_id,
        role="admin",
    )
    db.add(member)
    await db.commit()
    await db.refresh(workspace)
    return workspace


async def update(
    db: AsyncSession,
    workspace: Workspace,
    data: WorkspaceUpdate,
) -> Workspace:
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(workspace, field, value)
    await db.commit()
    await db.refresh(workspace)
    return workspace


async def get_member(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    user_id: uuid.UUID,
) -> WorkspaceMember | None:
    result = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == workspace_id,
            WorkspaceMember.user_id == user_id,
        )
    )
    return result.scalar_one_or_none()


async def list_members(
    db: AsyncSession,
    workspace_id: uuid.UUID,
) -> list[WorkspaceMember]:
    result = await db.execute(
        select(WorkspaceMember)
        .where(WorkspaceMember.workspace_id == workspace_id)
        .order_by(WorkspaceMember.joined_at.asc())
    )
    return list(result.scalars().all())


async def add_member(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    user_id: uuid.UUID,
    role: str = "member",
) -> WorkspaceMember:
    member = WorkspaceMember(
        workspace_id=workspace_id,
        user_id=user_id,
        role=role,
    )
    db.add(member)
    await db.commit()
    await db.refresh(member)
    return member


async def update_member_role(
    db: AsyncSession,
    member: WorkspaceMember,
    role: str,
) -> WorkspaceMember:
    member.role = role
    await db.commit()
    await db.refresh(member)
    return member


async def remove_member(db: AsyncSession, member: WorkspaceMember) -> None:
    await db.delete(member)
    await db.commit()