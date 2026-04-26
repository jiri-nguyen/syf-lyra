import uuid

from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.label import Label
from app.models.issue import Issue, issue_labels
from app.labels.schemas import LabelCreate, LabelUpdate


async def list_by_workspace(db: AsyncSession, workspace_id: uuid.UUID) -> list[Label]:
    result = await db.execute(
        select(Label)
        .where(Label.workspace_id == workspace_id)
        .order_by(Label.name.asc())
    )
    return list(result.scalars().all())


async def get(db: AsyncSession, label_id: uuid.UUID) -> Label | None:
    result = await db.execute(select(Label).where(Label.id == label_id))
    return result.scalar_one_or_none()


async def create(
    db: AsyncSession,
    workspace_id: uuid.UUID,
    data: LabelCreate,
) -> Label:
    label = Label(workspace_id=workspace_id, **data.model_dump())
    db.add(label)
    await db.commit()
    await db.refresh(label)
    return label


async def update(db: AsyncSession, label: Label, data: LabelUpdate) -> Label:
    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(label, field, value)
    await db.commit()
    await db.refresh(label)
    return label


async def delete_label(db: AsyncSession, label: Label) -> None:
    await db.delete(label)
    await db.commit()


# ── Issue label assignment ─────────────────────────────────────────────────

async def get_issue_labels(db: AsyncSession, issue_id: uuid.UUID) -> list[Label]:
    result = await db.execute(
        select(Label)
        .join(issue_labels, issue_labels.c.label_id == Label.id)
        .where(issue_labels.c.issue_id == issue_id)
    )
    return list(result.scalars().all())


async def add_label_to_issue(
    db: AsyncSession,
    issue_id: uuid.UUID,
    label_id: uuid.UUID,
) -> None:
    await db.execute(
        issue_labels.insert().values(issue_id=issue_id, label_id=label_id)
    )
    await db.commit()


async def remove_label_from_issue(
    db: AsyncSession,
    issue_id: uuid.UUID,
    label_id: uuid.UUID,
) -> None:
    await db.execute(
        delete(issue_labels).where(
            issue_labels.c.issue_id == issue_id,
            issue_labels.c.label_id == label_id,
        )
    )
    await db.commit()


async def list_issues_by_label(
    db: AsyncSession,
    label_id: uuid.UUID,
    project_id: uuid.UUID,
) -> list[Issue]:
    result = await db.execute(
        select(Issue)
        .join(issue_labels, issue_labels.c.issue_id == Issue.id)
        .where(
            issue_labels.c.label_id == label_id,
            Issue.project_id == project_id,
        )
        .order_by(Issue.sort_order.asc())
    )
    return list(result.scalars().all())