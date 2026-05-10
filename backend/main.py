"""
OceanX AI Underwriting Pipeline — FastAPI application.

Phase 0 endpoints: /health, /test-claude, /prospects
Phase 1 endpoint:  /run-pipeline  (SSE streaming)
"""

import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.responses import JSONResponse, StreamingResponse

load_dotenv()

app = FastAPI(title="OceanX AI Underwriting Pipeline", version="0.2.0")


@app.get("/health")
async def health():
    """Basic liveness check — no external dependencies."""
    return {"status": "ok"}


@app.get("/test-claude")
async def test_claude():
    """
    Calls stub_claude_call() to verify the Anthropic SDK and API key work.
    Use this before running the full pipeline to catch auth issues early.
    """
    from agents import stub_claude_call  # type: ignore[attr-defined]

    try:
        text = await stub_claude_call()
        return {"claude_response": text}
    except Exception as exc:
        return JSONResponse(status_code=500, content={"error": str(exc)})


@app.get("/prospects")
async def list_prospects():
    """Returns the list of available demo prospects."""
    from mock_data import PROSPECTS

    return {
        "prospects": [
            {"id": pid, "name": data["company"]["name"]}
            for pid, data in PROSPECTS.items()
        ]
    }


@app.get("/run-pipeline")
async def run_pipeline_endpoint(prospect_id: str = "atlantic"):
    """
    Streams the full pipeline as Server-Sent Events.

    Each event is a JSON-serialised AgentEvent on a `data:` line.
    The client reads the stream until the supervisor emits
    event_type="status" with state="pipeline_complete" (or an error).

    Query param:
      prospect_id — one of "atlantic" | "nordic" | "sunrise" (default: atlantic)
    """
    from mock_data import PROSPECTS
    from supervisor import run_pipeline

    if prospect_id not in PROSPECTS:
        return JSONResponse(
            status_code=404,
            content={"error": f"Unknown prospect: {prospect_id}. "
                               f"Valid options: {list(PROSPECTS.keys())}"},
        )

    deal_package = PROSPECTS[prospect_id]

    async def event_stream():
        async for event in run_pipeline(deal_package):
            # SSE format: each message is "data: <json>\n\n"
            yield f"data: {event.model_dump_json()}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",   # disable nginx buffering if behind a proxy
        },
    )
