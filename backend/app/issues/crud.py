import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.issue import Issue
from app.models.project import Project
from app.issues.schemas import IssueCreate, IssueUpdate


async def list_by_project(
    db: AsyncSession,
    project_id: uuid.UUID,
    status: list[str] | None = None,
    priority: list[str] | None = None,
    assignee_id: uuid.UUID | None = None,
    label_ids: list[uuid.UUID] | None = None,
) -> list[Issue]:
    query = (
        select(Issue)
        .where(Issue.project_id == project_id)
        .order_by(Issue.sort_order.asc(), Issue.created_at.asc())
    )
    if status:
        query = query.where(Issue.status.in_(status))
    if priority:
        query = query.where(Issue.priority.in_(priority))
    if assignee_id:
        query = query.where(Issue.assignee_id == assignee_id)
    if label_ids:
        from app.models.issue import issue_labels
        query = query.join(issue_labels, issue_labels.c.issue_id == Issue.id).where(
            issue_labels.c.label_id.in_(label_ids)
        ).distinct()

    result = await db.execute(query)
    return list(result.scalars().all())


async def get(db: AsyncSession, issue_id: uuid.UUID) -> Issue | None:
    result = await db.execute(
        select(Issue)
        .options(selectinload(Issue.project))
        .where(Issue.id == issue_id)
    )
    return result.scalar_one_or_none()


async def create(
    db: AsyncSession,
    project_id: uuid.UUID,
    created_by: uuid.UUID,
    data: IssueCreate,
) -> Issue:
    # Lock project row to serialize concurrent issue creation within the same project
    await db.execute(
        select(Project).where(Project.id == project_id).with_for_update()
    )

    # Next sequence_number for this project
    seq_result = await db.execute(
        select(func.coalesce(func.max(Issue.sequence_number), 0))
        .where(Issue.project_id == project_id)
    )
    sequence_number = (seq_result.scalar() or 0) + 1

    # sort_order: place at end within same status column
    result = await db.execute(
        select(Issue)
        .where(Issue.project_id == project_id, Issue.status == data.status)
        .order_by(Issue.sort_order.desc())
        .limit(1)
    )
    last = result.scalar_one_or_none()
    sort_order = (last.sort_order + 1000) if last else 1000

    issue = Issue(
        project_id=project_id,
        created_by=created_by,
        sort_order=sort_order,
        sequence_number=sequence_number,
        **data.model_dump(),
    )
    db.add(issue)
    await db.commit()
    return await get(db, issue.id)  # type: ignore[return-value]


async def update(
    db: AsyncSession,
    issue: Issue,
    data: IssueUpdate,
) -> Issue:
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(issue, field, value)
    await db.commit()
    return await get(db, issue.id)  # type: ignore[return-value]


async def delete(db: AsyncSession, issue: Issue) -> None:
    await db.delete(issue)
    await db.commit()