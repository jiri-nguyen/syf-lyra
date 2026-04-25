import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.project import Project
from app.projects.schemas import ProjectCreate, ProjectUpdate


async def get_by_id(db: AsyncSession, project_id: uuid.UUID) -> Project | None:
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    return result.scalar_one_or_none()


async def list_by_workspace(
    db: AsyncSession,
    workspace_id: uuid.UUID,
) -> list[Project]:
    result = await db.execute(
        select(Project)
        .where(Project.workspace_id == workspace_id)
        .order_by(Project.created_at.asc())
    )
    return list(result.scalars().all())


async def create(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    data: ProjectCreate,
) -> Project:
    project = Project(
        workspace_id=workspace_id,
        **data.model_dump(),
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project


async def update(
    db: AsyncSession,
    project: Project,
    data: ProjectUpdate,
) -> Project:
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)
    await db.commit()
    await db.refresh(project)
    return project


async def delete(db: AsyncSession, project: Project) -> None:
    await db.delete(project)
    await db.commit()