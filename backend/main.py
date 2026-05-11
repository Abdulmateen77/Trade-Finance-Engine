"""
OceanX AI Underwriting Pipeline — FastAPI application.

Phase 0 endpoints: /health, /test-claude, /prospects
Phase 1 endpoint:  /run-pipeline  (SSE streaming)
Phase 3 endpoint:  /download-contract
Phase 4 endpoint:  /send-contract (Gmail SMTP)
"""

import os
import smtplib
import uuid
from datetime import datetime, timezone
from email.mime.application import MIMEApplication
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

app = FastAPI(title="OceanX AI Underwriting Pipeline", version="0.3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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


@app.get("/download-contract")
async def download_contract(filename: str):
    """
    Serves a generated .docx contract for download.

    The filename param must match an existing file in the contracts/ folder.
    Security: rejects any path traversal — only the basename is used.
    """
    # Strip to basename only — prevent path traversal
    safe_name = os.path.basename(filename)
    if safe_name != filename or ".." in filename:
        return JSONResponse(
            status_code=400,
            content={"error": "Invalid filename — path traversal not allowed"},
        )

    contracts_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "contracts")
    filepath = os.path.join(contracts_dir, safe_name)

    if not os.path.isfile(filepath):
        return JSONResponse(
            status_code=404,
            content={"error": f"Contract not found: {safe_name}"},
        )

    return FileResponse(
        path=filepath,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        filename=safe_name,
    )


class SendContractRequest(BaseModel):
    filename: str
    customer_name: str


class SendContractResponse(BaseModel):
    status: str
    envelope_id: str
    sent_at: str
    delivered_to: str
    note: str


@app.post("/send-contract", response_model=SendContractResponse)
async def send_contract(req: SendContractRequest):
    """
    Sends the generated contract .docx as an email attachment via Gmail SMTP.
    """
    # Validate filename (no path traversal)
    safe_filename = Path(req.filename).name
    contract_path = Path(__file__).parent / "contracts" / safe_filename

    if not contract_path.exists():
        return SendContractResponse(
            status="error",
            envelope_id="",
            sent_at=datetime.now(timezone.utc).isoformat(),
            delivered_to="",
            note=f"Contract file not found: {safe_filename}",
        )

    # Load SMTP config — re-read .env to pick up any changes
    from dotenv import dotenv_values
    env = dotenv_values(Path(__file__).parent / ".env")
    smtp_host = env.get("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(env.get("SMTP_PORT", "587"))
    smtp_user = env.get("SMTP_USERNAME")
    smtp_pass = env.get("SMTP_PASSWORD")
    from_name = env.get("SMTP_FROM_NAME", "OceanX AI")
    recipient = env.get("CONTRACT_RECIPIENT")

    if not all([smtp_user, smtp_pass, recipient]):
        return SendContractResponse(
            status="error",
            envelope_id="",
            sent_at=datetime.now(timezone.utc).isoformat(),
            delivered_to="",
            note="SMTP config incomplete — check backend/.env",
        )

    envelope_id = f"env-{uuid.uuid4().hex[:12]}"

    # Build email
    msg = MIMEMultipart()
    msg["From"] = formataddr((from_name, smtp_user))
    msg["To"] = recipient
    msg["Subject"] = f"OceanX Trade Finance Facility — {req.customer_name}"

    body = (
        f"Dear {req.customer_name},\n\n"
        f"Please find attached your Trade Finance Facility Agreement for review and signature.\n\n"
        f"Envelope reference: {envelope_id}\n\n"
        f"This contract was generated automatically by OceanX AI's underwriting pipeline "
        f"following review of your application. The terms reflect the credit decision and "
        f"risk assessment from our underwriting agent.\n\n"
        f"Please review carefully and return signed at your earliest convenience. "
        f"Any covenants requiring documentation are listed in the contract — "
        f"please address these promptly.\n\n"
        f"For questions, contact your OceanX relationship manager.\n\n"
        f"Best regards,\n"
        f"OceanX AI"
    )
    msg.attach(MIMEText(body, "plain"))

    # Attach contract
    with open(contract_path, "rb") as f:
        attachment = MIMEApplication(
            f.read(),
            _subtype="vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
        attachment.add_header("Content-Disposition", "attachment", filename=safe_filename)
        msg.attach(attachment)

    # Send
    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
    except smtplib.SMTPAuthenticationError as e:
        return SendContractResponse(
            status="error",
            envelope_id=envelope_id,
            sent_at=datetime.now(timezone.utc).isoformat(),
            delivered_to=recipient,
            note=f"SMTP auth failed — verify app password. Error: {str(e)[:200]}",
        )
    except Exception as e:
        return SendContractResponse(
            status="error",
            envelope_id=envelope_id,
            sent_at=datetime.now(timezone.utc).isoformat(),
            delivered_to=recipient,
            note=f"Send failed: {str(e)[:200]}",
        )

    return SendContractResponse(
        status="ok",
        envelope_id=envelope_id,
        sent_at=datetime.now(timezone.utc).isoformat(),
        delivered_to=recipient,
        note="Sent via Gmail SMTP",
    )
