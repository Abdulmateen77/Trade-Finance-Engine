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

## Test the three Phase 0 endpoints

```powershell
# 1. Basic liveness check (no API call)
curl http://localhost:8000/health

# 2. SDK smoke test (makes a real Claude call — confirms key is valid)
curl http://localhost:8000/test-claude

# 3. List demo prospects
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
