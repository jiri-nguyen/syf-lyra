import json
from collections import defaultdict

from fastapi import WebSocket
import redis.asyncio as aioredis


class ConnectionManager:
    def __init__(self) -> None:
        # project_id -> set of active WebSocket connections trên worker này
        self._connections: dict[str, set[WebSocket]] = defaultdict(set)

    async def connect(self, ws: WebSocket, project_id: str) -> None:
        await ws.accept()
        self._connections[project_id].add(ws)

    def disconnect(self, ws: WebSocket, project_id: str) -> None:
        self._connections[project_id].discard(ws)

    async def broadcast_local(self, project_id: str, payload: dict) -> None:
        """Gửi payload đến tất cả WS clients local đang subscribe project này."""
        dead: set[WebSocket] = set()
        for ws in list(self._connections.get(project_id, set())):
            try:
                await ws.send_json(payload)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self._connections[project_id].discard(ws)


# Singleton — dùng chung trong cùng process/worker
manager = ConnectionManager()


async def redis_subscriber(redis_url: str) -> None:
    """Background task: subscribe Redis pub/sub, forward event đến WS clients local.

    Mỗi worker chạy một task này. Khi một worker publish lên Redis channel
    'project:{id}', tất cả workers (kể cả chính nó) sẽ nhận và broadcast
    đến WS clients đang kết nối vào worker đó.
    """
    client = aioredis.from_url(redis_url)
    pubsub = client.pubsub()
    await pubsub.psubscribe("project:*")  # pattern subscribe mọi project

    async for message in pubsub.listen():
        if message["type"] != "pmessage":
            continue
        try:
            # channel dạng b"project:{project_id}"
            channel: str = message["channel"].decode()
            project_id = channel.split(":", 1)[1]
            payload = json.loads(message["data"])
            await manager.broadcast_local(project_id, payload)
        except Exception:
            # Bỏ qua message lỗi — không để crash toàn bộ subscriber
            pass
