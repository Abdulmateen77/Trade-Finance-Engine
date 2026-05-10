# OceanX AI — 3-Agent Underwriting Pipeline

A FastAPI backend that processes SME trade finance deals through a sequential AI pipeline: Intake → Underwriting → Contract, orchestrated by a Supervisor and streamed via Server-Sent Events. Powered by Anthropic Claude (claude-sonnet-4-5). Three demo prospects cover Approve, Conditional Approve, and Reject outcomes.

---

## Setup (Windows PowerShell)

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
# Edit .env — replace sk-ant-placeholder with your real ANTHROPIC_API_KEY
uvicorn main:app --reload --port 8000
```

---

## Phase 0 — Foundation endpoints

```powershell
# Basic liveness check (no API call)
curl http://localhost:8000/health

# SDK smoke test (makes a real Claude call — confirms key is valid)
curl http://localhost:8000/test-claude

# List demo prospects
curl http://localhost:8000/prospects
```

Expected responses:
```json
{"status": "ok"}
{"claude_response": "ready"}
{"prospects": [
  {"id": "atlantic", "name": "Atlantic Components Ltd"},
  {"id": "nordic",   "name": "Nordic Apparel Co."},
  {"id": "sunrise",  "name": "Sunrise Trading Ltd"}
]}
```

---

## Pipeline testing (Phase 2: intake + underwriting)

```powershell
# Atlantic Components Ltd — expected: APPROVE_WITH_CONDITIONS (~60–120s)
# Red flag: £52k directors loan caught by underwriting
# Liquidity flag: min balance < 25% of ADB
curl.exe -N http://localhost:8000/run-pipeline

# Nordic Apparel Co. — expected: APPROVE, clean case (~60–120s)
curl.exe -N "http://localhost:8000/run-pipeline?prospect_id=nordic"

# Sunrise Trading Ltd — expected: REJECT (~30–60s)
# Fails: tenure < 2 years, revenue < $1M USD, gross margin < 30%
curl.exe -N "http://localhost:8000/run-pipeline?prospect_id=sunrise"
```

Each command streams `AgentEvent` JSON objects as Server-Sent Events until the supervisor emits `pipeline_complete`. The server logs a one-line summary of every event to stdout. Underwriting runs after intake completes — expect the full pipeline to take 60–120 seconds per prospect.

---

## Build phases

| Phase | Status | Description |
|-------|--------|-------------|
| 0 | ✅ Done | Foundation: structure, schemas, mock data, SDK smoke test |
| 1 | ✅ Done | Intake agent + supervisor + SSE streaming |
| 2 | ✅ Done | Underwriting agent |
| 3 | ⏳ Next | Contract agent |
| 4 | — | Polish: red flag verification, latency tracking, error paths |
| 5 | — | Frontend (separate brief) |
