import logging

from fastapi import APIRouter, Header, HTTPException, Request, status

from app.config import settings
from app.database import get_db
from app.webhooks.handler import handle_pull_request, handle_push
from app.webhooks.signature import verify_github_signature

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/github", status_code=status.HTTP_200_OK)
async def github_webhook(
    request: Request,
    x_github_event: str = Header(..., alias="X-GitHub-Event"),
    x_hub_signature_256: str = Header("", alias="X-Hub-Signature-256"),
):
    payload_bytes = await request.body()

    # Verify HMAC signature when a secret is configured
    if settings.GITHUB_WEBHOOK_SECRET:
        if not x_hub_signature_256:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing X-Hub-Signature-256 header",
            )
        if not verify_github_signature(payload_bytes, x_hub_signature_256, settings.GITHUB_WEBHOOK_SECRET):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid webhook signature",
            )

    # Route only the events we care about; silently accept anything else
    if x_github_event not in ("push", "pull_request"):
        return {"ok": True}

    import json
    try:
        payload = json.loads(payload_bytes)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON")

    async for db in get_db():
        try:
            if x_github_event == "push":
                await handle_push(db, payload)
            elif x_github_event == "pull_request":
                redis = request.app.state.redis
                await handle_pull_request(db, payload, redis)
        except Exception:
            logger.exception("Error processing GitHub webhook event: %s", x_github_event)

    return {"ok": True}
