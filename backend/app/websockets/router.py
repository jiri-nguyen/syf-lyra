import uuid

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect, status

from app.auth.security import decode_access_token
from app.database import AsyncSessionLocal
from app.users.crud import get_by_id
from app.websockets.manager import manager

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/projects/{project_id}")
async def ws_project(
    websocket: WebSocket,
    project_id: str,
    token: str = Query(...),  # Browser không gửi được Authorization header qua WS
):
    """Kết nối WebSocket để nhận real-time events của một project.

    Client kết nối: ws://host/ws/projects/{project_id}?token=<jwt>

    Events nhận được:
        {"type": "issue.created" | "issue.updated" | "issue.deleted",
         "project_id": "...", "data": {...}}
    """
    # Validate token TRƯỚC khi accept — close ngay nếu invalid
    try:
        user_id = decode_access_token(token)
    except ValueError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    async with AsyncSessionLocal() as db:
        user = await get_by_id(db, uuid.UUID(user_id))
    if user is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(websocket, project_id)
    try:
        while True:
            # Giữ connection sống — client messages bị bỏ qua
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, project_id)
