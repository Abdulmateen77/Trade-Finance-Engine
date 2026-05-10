# Implementation Plan: OceanX AI Underwriting Pipeline

## Overview

Implement a Python/FastAPI service that runs a sequential three-agent AI pipeline (Intake → Underwriting → Contract) orchestrated by a Supervisor. Each agent calls Anthropic Claude, validates its output against a Pydantic schema, and writes structured events to an append-only JSONL audit log. The pipeline exposes a single `/run-pipeline` endpoint and sets a Human Review Flag when confidence is low or required data is missing.

---

## Tasks

- [ ] 1. Project scaffolding and dependencies
  - Create the `app/` directory tree: `app/main.py`, `app/supervisor.py`, `app/audit.py`, `app/schemas.py`, `app/agents/__init__.py`, `app/agents/base.py`, `app/agents/intake.py`, `app/agents/underwriting.py`, `app/agents/contract.py`
  - Add `requirements.txt` (or `pyproject.toml`) pinning: `fastapi`, `uvicorn`, `pydantic>=2`, `anthropic`, `python-dotenv`, `hypothesis`, `pytest`, `pytest-asyncio`
  - Add a `.env.example` file documenting `ANTHROPIC_API_KEY`, `AUDIT_LOG_PATH`, `LLM_MODEL`, `CONFIDENCE_THRESHOLD`
  - _Requirements: 8.4_

- [ ] 2. Define Pydantic schemas (`app/schemas.py`)
  - [ ] 2.1 Implement all Pydantic v2 models: `DealPackage`, `IntakeOutput`, `UnderwritingOutput`, `ContractOutput`, `PipelineResult`
    - `IntakeOutput`: `deal_data: dict`, `missing_items: list[str]`, `confidence_score: float = Field(ge=0.0, le=1.0)`
    - `UnderwritingOutput`: `risk_score: float = Field(ge=0.0, le=1.0)`, `credit_limit: float = Field(ge=0.0)`, `anomalies: list[str]`, `credit_memo: str`, `confidence_score: float = Field(ge=0.0, le=1.0)`
    - `ContractOutput`: `contract_text: str`, `pricing_terms: dict`, `confidence_score: float = Field(ge=0.0, le=1.0)`
    - `PipelineResult`: `run_id: str`, `intake: IntakeOutput`, `underwriting: UnderwritingOutput`, `contract: ContractOutput`, `human_review_required: bool`, `status: str`, `error_message: str | None = None`
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ]* 2.2 Write property tests for Pydantic schemas
    - **Property 1: Roundtrip integrity** — For any valid `IntakeOutput`, `IntakeOutput(**obj.model_dump()) == obj`
    - **Property 2: Confidence score bounds** — For any agent output constructed via Hypothesis, `0.0 <= confidence_score <= 1.0` always holds after validation
    - **Property 3: Credit limit non-negative** — For any `UnderwritingOutput`, `credit_limit >= 0.0` always holds
    - Use `st.floats(min_value=0.0, max_value=1.0)` for confidence scores, `st.text()` for string fields, `st.lists(st.text())` for list fields
    - _Requirements: 9.1–9.5_

- [ ] 3. Implement error hierarchy (`app/errors.py`)
  - [ ] 3.1 Define `PipelineError`, `AgentError` (with `raw_response: str`, `reason: str`), `LLMCallError` (with `original_error: Exception`), and `ValidationError` (with `field_errors: list[dict]`)
    - All errors inherit from `PipelineError`
    - _Requirements: 8.3, 2.3, 3.3, 4.4, 5.3_

- [ ] 4. Implement `AuditLogger` (`app/audit.py`)
  - [ ] 4.1 Implement `AuditLogger.write()` with append-mode file I/O
    - Constructor accepts `log_path: str = "pipeline_audit.jsonl"` (override from `AUDIT_LOG_PATH` env var)
    - Each `write()` call opens the file in `"a"` mode, constructs a record with `timestamp` (UTC ISO 8601), `run_id`, `event_type`, `agent_name`, `payload_summary`, serializes to a single-line JSON string, appends with `\n`, then closes
    - Creates the file on first write (append mode handles this automatically)
    - _Requirements: 7.1, 7.2, 7.4, 7.5_

  - [ ]* 4.2 Write property tests for `AuditLogger`
    - **Property 4: Record structure** — Every record written by `AuditLogger.write()` contains `timestamp`, `run_id`, `event_type`, and `payload_summary` fields
    - **Property 5: JSONL validity** — Every line appended to the log file is independently parseable as valid JSON
    - **Property 6: Append-only** — The number of lines in the log file never decreases between successive `write()` calls
    - Use a `tmp_path` fixture to write to a temporary file; generate arbitrary `run_id`, `event_type`, and `payload_summary` values via Hypothesis
    - _Requirements: 7.1, 7.2, 7.5_

- [ ] 5. Implement `BaseAgent` (`app/agents/base.py`)
  - [ ] 5.1 Implement `BaseAgent.__init__`, `_call_llm`, and `_parse_json_response`
    - `__init__` accepts an `anthropic.Anthropic` client instance
    - `_call_llm` calls `client.messages.create(model=..., system=system_prompt, messages=[{"role": "user", "content": user_message}], max_tokens=4096)`, extracts `response.content[0].text`, and raises `LLMCallError` on any Anthropic SDK exception
    - `_parse_json_response` calls `json.loads(raw)` and raises `LLMParseError` (subclass of `AgentError`) on `json.JSONDecodeError`, including the raw response in the error
    - Read `LLM_MODEL` from env (default `"claude-3-5-sonnet-20241022"`)
    - _Requirements: 8.1, 8.2, 8.3_

- [ ] 6. Implement `IntakeAgent` (`app/agents/intake.py`)
  - [ ] 6.1 Implement `IntakeAgent.run(deal_package: DealPackage) -> IntakeOutput`
    - Serialize `deal_package` to a JSON string as the user message, prefixed with `"Process the following deal data and return the structured JSON output:"`
    - Use the intake system prompt (role, JSON schema, no-markdown instruction) defined in the design
    - Call `_call_llm`, then `_parse_json_response`, then construct `IntakeOutput(**parsed)` — raise `AgentError` with raw response and reason on any failure
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 6.2 Write unit tests for `IntakeAgent`
    - Mock `anthropic.Anthropic` client to return controlled JSON strings
    - Test: valid response produces correct `IntakeOutput`; non-JSON response raises `AgentError`; response missing required fields raises `AgentError`; `missing_items` list is preserved correctly
    - _Requirements: 3.1, 3.2, 3.3_

- [ ] 7. Implement `UnderwritingAgent` (`app/agents/underwriting.py`)
  - [ ] 7.1 Implement `UnderwritingAgent.run(intake_output: IntakeOutput) -> UnderwritingOutput`
    - Serialize `intake_output.model_dump()` as the user message
    - Use the underwriting system prompt defined in the design
    - Call `_call_llm`, then `_parse_json_response`, then construct `UnderwritingOutput(**parsed)` — raise `AgentError` on any failure
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 7.2 Write unit tests for `UnderwritingAgent`
    - Mock the Anthropic client; test valid response, non-JSON response, schema mismatch (e.g., `risk_score > 1.0`), and anomaly list passthrough
    - _Requirements: 4.1, 4.2, 4.4_

- [ ] 8. Implement `ContractAgent` (`app/agents/contract.py`)
  - [ ] 8.1 Implement `ContractAgent.run(intake_output: IntakeOutput, underwriting_output: UnderwritingOutput) -> ContractOutput`
    - Combine both inputs into a single user message JSON string
    - Use the contract system prompt defined in the design
    - Call `_call_llm`, then `_parse_json_response`, then construct `ContractOutput(**parsed)` — raise `AgentError` on any failure
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 8.2 Write unit tests for `ContractAgent`
    - Mock the Anthropic client; test valid response, non-JSON response, and schema mismatch
    - _Requirements: 5.1, 5.3_

- [ ] 9. Checkpoint — Ensure all agent and schema tests pass
  - Run `pytest tests/` and confirm all unit and property tests pass before proceeding to Supervisor implementation. Ask the user if any questions arise.

- [ ] 10. Implement `Supervisor` (`app/supervisor.py`)
  - [ ] 10.1 Implement `Supervisor.__init__` and `Supervisor.run`
    - `__init__` accepts an `AuditLogger` instance and creates the three agent instances (injecting the shared `anthropic.Anthropic` client)
    - `run` generates a UUID4 `run_id`, writes `PIPELINE_START`, then invokes agents in order: Intake → Underwriting → Contract
    - Around each agent call: write `AGENT_START` before, write `AGENT_COMPLETE` after, call `_check_human_review` after each completion
    - On any `PipelineError`: write the appropriate audit event (`VALIDATION_ERROR` or `LLM_ERROR`) and re-raise
    - On success: write `PIPELINE_COMPLETE` and return `PipelineResult`
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 7.3_

  - [ ] 10.2 Implement `Supervisor._check_human_review`
    - Accepts `run_id`, `agent_name`, `confidence: float`, `missing_items: list[str] | None`
    - Sets `self._human_review` to `True` (sticky — never resets to `False`) if `confidence < CONFIDENCE_THRESHOLD` (default 0.75, read from env) or if `missing_items` is non-empty
    - When flag is set, writes `HUMAN_REVIEW_FLAGGED` audit event with agent name and reason
    - _Requirements: 6.1, 6.2, 6.4_

  - [ ]* 10.3 Write property tests for Supervisor Human Review Flag logic
    - **Property 7: Flag monotonicity** — Once `human_review_required` is `True` in a run, it is never reset to `False`
    - **Property 8: Flag completeness** — For any `PipelineResult` where any agent's `confidence_score < 0.75`, `human_review_required == True`
    - **Property 9: Missing items trigger** — For any `PipelineResult` where `intake.missing_items` is non-empty, `human_review_required == True`
    - Mock all three agents to return controlled outputs; use Hypothesis to generate confidence scores and missing item lists
    - _Requirements: 6.1, 6.2_

  - [ ]* 10.4 Write property tests for Supervisor audit log ordering
    - **Property 10: Agent order invariant** — The sequence of `AGENT_START` events in the audit log for a given `run_id` is always `intake → underwriting → contract`
    - **Property 11: Every run produces at least one record** — For any completed pipeline run (success or error), the audit log contains at least one record with the matching `run_id`
    - **Property 12: Run ID uniqueness** — No two concurrent pipeline runs share the same `run_id`
    - Use a temporary JSONL file and mock agents; parse the log after each run to verify ordering and uniqueness
    - _Requirements: 7.3, 2.5_

- [ ] 11. Implement FastAPI application (`app/main.py`)
  - [ ] 11.1 Wire up the FastAPI app and `/run-pipeline` endpoint
    - Create `app = FastAPI()` and a shared `anthropic.Anthropic()` client (reads `ANTHROPIC_API_KEY` from env via `python-dotenv`)
    - Instantiate `AuditLogger` (reads `AUDIT_LOG_PATH` from env) and `Supervisor` at startup
    - Implement `async def run_pipeline(deal_package: DealPackage) -> PipelineResult` using `asyncio.get_event_loop().run_in_executor(None, supervisor.run, deal_package)` to avoid blocking the event loop
    - Add an exception handler that catches unhandled exceptions, writes a `PIPELINE_ERROR` audit event, and returns HTTP 500 with an error message
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 8.4_

  - [ ]* 11.2 Write integration tests for the `/run-pipeline` endpoint
    - Use `pytest-asyncio` and FastAPI `TestClient` (or `AsyncClient`)
    - Mock the `Supervisor.run` method to return a controlled `PipelineResult`
    - Test: HTTP 200 on valid input; HTTP 422 on malformed JSON body; HTTP 500 on `PipelineError` raised by supervisor; `human_review_required` field present in response body
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 6.3_

- [ ] 12. Final checkpoint — Full test suite
  - Run `pytest tests/ -v` and confirm all unit, property, and integration tests pass. Ask the user if any questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints (tasks 9 and 12) ensure incremental validation before moving to the next phase
- Property tests use Hypothesis `@given` strategies; mock the Anthropic client with `unittest.mock.patch` so no live API calls are needed during testing
- The `CONFIDENCE_THRESHOLD` env var (default `0.75`) controls the Human Review Flag trigger — read it once at Supervisor init
- The `human_review_required` flag is sticky within a run: once `True` it cannot be reset to `False`
- All agent errors must include the raw LLM response to aid debugging

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1", "3.1"] },
    { "id": 1, "tasks": ["2.2", "4.1"] },
    { "id": 2, "tasks": ["4.2", "5.1"] },
    { "id": 3, "tasks": ["6.1", "7.1", "8.1"] },
    { "id": 4, "tasks": ["6.2", "7.2", "8.2"] },
    { "id": 5, "tasks": ["10.1", "10.2"] },
    { "id": 6, "tasks": ["10.3", "10.4"] },
    { "id": 7, "tasks": ["11.1"] },
    { "id": 8, "tasks": ["11.2"] }
  ]
}
```
