from fastapi import FastAPI

from app.auth.router import router as auth_router
from app.users.router import router as users_router
from app.workspaces.router import router as workspaces_router
from app.projects.router import router as projects_router
from app.issues.router import router as issues_router
from app.members.router import router as members_router
from app.comments.router import router as comments_router
from app.labels.router import router as labels_router

app = FastAPI(title="Linear Clone")

app.include_router(auth_router)
app.include_router(users_router)
app.include_router(workspaces_router)
app.include_router(projects_router)
app.include_router(issues_router)
app.include_router(members_router)
app.include_router(comments_router)
app.include_router(labels_router)


@app.get("/health")
async def health():
    return {"status": "ok"}