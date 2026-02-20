from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.services.ai_service import generate_stream

router = APIRouter(prefix="/api/ai", tags=["ai"])


class AIRequest(BaseModel):
    text: str
    action: str  # 'summarize' | 'fix_grammar'


@router.post("/generate")
async def generate_ai(body: AIRequest):
    if not body.text or not body.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")

    if body.action not in ("summarize", "fix_grammar"):
        raise HTTPException(status_code=400, detail="Action must be 'summarize' or 'fix_grammar'")

    return StreamingResponse(
        generate_stream(body.text, body.action),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
