import asyncio
from contextlib import asynccontextmanager

import redis.asyncio as aioredis
from fastapi import FastAPI

from app.auth.router import router as auth_router
from app.comments.router import router as comments_router
from app.config import settings
from app.issues.router import router as issues_router
from app.labels.router import router as labels_router
from app.members.router import router as members_router
from app.notifications.router import router as notifications_router
from app.projects.router import router as projects_router
from app.users.router import router as users_router
from app.websockets.manager import redis_subscriber
from app.websockets.router import router as ws_router
from app.workspaces.router import router as workspaces_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Khởi động Redis subscriber — chạy background task suốt vòng đời app
    task = asyncio.create_task(redis_subscriber(settings.REDIS_URL))
    app.state.redis = aioredis.from_url(settings.REDIS_URL)
    yield
    task.cancel()
    await app.state.redis.aclose()


app = FastAPI(title="Linear Clone", lifespan=lifespan)

app.include_router(ws_router)
app.include_router(auth_router)
app.include_router(users_router)
app.include_router(workspaces_router)
app.include_router(projects_router)
app.include_router(issues_router)
app.include_router(members_router)
app.include_router(comments_router)
app.include_router(labels_router)
app.include_router(notifications_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
