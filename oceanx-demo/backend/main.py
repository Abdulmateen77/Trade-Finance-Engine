"""
OceanX AI Underwriting Pipeline — FastAPI application.

Phase 0: /health, /test-claude, /prospects endpoints only.
The /run-pipeline SSE endpoint is added in Phase 1.
"""

import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.responses import JSONResponse

load_dotenv()

app = FastAPI(title="OceanX AI Underwriting Pipeline", version="0.1.0")


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
    from agents import stub_claude_call

    try:
        text = await stub_claude_call()
        return {"claude_response": text}
    except Exception as exc:
        # Surface the error clearly — no silent failures
        return JSONResponse(
            status_code=500,
            content={"error": str(exc)},
        )


@app.get("/prospects")
async def list_prospects():
    """
    Returns the list of available demo prospects.
    Used by the frontend (Phase 5) to populate the prospect selector.
    """
    from mock_data import PROSPECTS

    return {
        "prospects": [
            {"id": pid, "name": data["company"]["name"]}
            for pid, data in PROSPECTS.items()
        ]
    }
