"""
Supervisor — orchestrates agents in sequence and writes every event to audit.jsonl.

Phase 1: intake only.
Phase 2: intake → underwriting.
Phase 3: intake → underwriting → contract.

Confidence routing for intake output:
  >= 0.70  → continue to underwriting
  0.50–0.69 → flag for review, continue to underwriting
  < 0.50   → halt (data quality too poor)

Underwriting routing:
  decision == REJECT          → halt (no contract needed)
  decision == REQUEST_INFO    → halt (need more info before contract)
  requires_human_review       → flag, continue
  confidence < 0.70           → flag, continue

Contract routing:
  confidence < 0.70           → flag, continue
"""

from datetime import datetime, timezone
from typing import AsyncGenerator

from agents import run_contract_agent, run_intake_agent, run_underwriting_agent
from audit import write_event
from models import AgentEvent


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _log(event: AgentEvent) -> None:
    """
    Print a short one-line summary of every event to stdout.
    Keeps payloads brief — full detail lives in audit.jsonl.
    """
    summary = ""
    if event.event_type == "status":
        summary = event.payload.get("state", "")
    elif event.event_type == "reasoning_chunk":
        text = event.payload.get("text", "")
        summary = repr(text[:40]) + ("…" if len(text) > 40 else "")
    elif event.event_type == "output":
        keys = list(event.payload.keys())
        summary = f"keys={keys}"
    elif event.event_type == "flag":
        summary = f"action={event.payload.get('action')} reason={event.payload.get('reason')}"
    elif event.event_type == "error":
        summary = event.payload.get("error", "")[:80]

    ts = event.timestamp[:19]
    print(f"[{ts}] [{event.agent:12s}] [{event.event_type:16s}] {summary}")


async def run_pipeline(deal_package: dict) -> AsyncGenerator[AgentEvent, None]:
    """
    Runs the pipeline for a given deal package, yielding AgentEvent objects.
    Every event is also written to audit.jsonl and logged to stdout.

    Phase 2: intake → underwriting.
    Phase 3 will insert contract after underwriting output block.
    """
    intake_output = None

    # ── Stage 1: Intake ───────────────────────────────────────────────────────
    # This block is unchanged from Phase 1.
    async for event in run_intake_agent(deal_package):
        write_event(event)
        _log(event)
        yield event

        if event.event_type == "output" and event.agent == "intake":
            intake_output = event.payload.get("intake_output")

        if event.event_type == "error":
            sup = AgentEvent(
                agent="supervisor",
                event_type="flag",
                payload={"action": "halt", "reason": "intake error"},
                timestamp=now_iso(),
            )
            write_event(sup)
            _log(sup)
            yield sup
            return

    # ── Supervisor confidence routing (intake) ────────────────────────────────
    if intake_output:
        confidence = intake_output.get("confidence", 0.0)

        if confidence < 0.5:
            sup = AgentEvent(
                agent="supervisor",
                event_type="flag",
                payload={
                    "action": "halt",
                    "reason": f"intake confidence too low ({confidence:.2f})",
                },
                timestamp=now_iso(),
            )
            write_event(sup)
            _log(sup)
            yield sup
            return

        elif confidence < 0.7:
            sup = AgentEvent(
                agent="supervisor",
                event_type="flag",
                payload={
                    "action": "continue_with_review",
                    "reason": f"intake confidence below 0.70 ({confidence:.2f})",
                },
                timestamp=now_iso(),
            )
            write_event(sup)
            _log(sup)
            yield sup

    # ── Stage 2: Underwriting ─────────────────────────────────────────────────
    # Pass intake_output + raw bank_transactions (intake didn't analyze them).
    # The underwriting agent scans transactions directly for red flags.
    if not intake_output:
        # Intake produced no output (shouldn't happen if no error, but be safe)
        return

    bank_transactions = deal_package.get("bank_transactions", [])
    underwriting_output = None

    async for event in run_underwriting_agent(intake_output, bank_transactions):
        write_event(event)
        _log(event)
        yield event

        if event.event_type == "output" and event.agent == "underwriting":
            underwriting_output = event.payload.get("underwriting_output")

        if event.event_type == "error":
            # Underwriting failed — halt, no contract without a credit decision
            sup = AgentEvent(
                agent="supervisor",
                event_type="flag",
                payload={"action": "halt", "reason": "underwriting error"},
                timestamp=now_iso(),
            )
            write_event(sup)
            _log(sup)
            yield sup
            return

    # ── Supervisor routing (underwriting) ─────────────────────────────────────
    if underwriting_output:
        decision = underwriting_output.get("decision", "")
        confidence = underwriting_output.get("confidence", 0.0)
        human_review = underwriting_output.get("requires_human_review", False)

        if decision == "REJECT":
            # Hard stop — no contract for a rejected deal
            sup = AgentEvent(
                agent="supervisor",
                event_type="flag",
                payload={
                    "action": "halt",
                    "reason": f"underwriting decision: REJECT",
                },
                timestamp=now_iso(),
            )
            write_event(sup)
            _log(sup)
            yield sup
            # Still emit pipeline_complete so the client knows the stream ended
            done = AgentEvent(
                agent="supervisor",
                event_type="status",
                payload={"state": "pipeline_complete", "phase": 2, "decision": "REJECT"},
                timestamp=now_iso(),
            )
            write_event(done)
            _log(done)
            yield done
            return

        if human_review:
            # High-severity flag or low confidence — flag but continue to contract
            sup = AgentEvent(
                agent="supervisor",
                event_type="flag",
                payload={
                    "action": "continue_with_review",
                    "reason": "high-severity flag or low confidence",
                },
                timestamp=now_iso(),
            )
            write_event(sup)
            _log(sup)
            yield sup

        elif confidence < 0.7:
            sup = AgentEvent(
                agent="supervisor",
                event_type="flag",
                payload={
                    "action": "continue_with_review",
                    "reason": f"underwriting confidence below 0.70 ({confidence:.2f})",
                },
                timestamp=now_iso(),
            )
            write_event(sup)
            _log(sup)
            yield sup

    # ── Stage 3: Contract ────────────────────────────────────────────────────
    # Only runs for APPROVE or APPROVE_WITH_CONDITIONS.
    # REJECT already halted above; REQUEST_INFO halts here.
    if not underwriting_output:
        return

    decision = underwriting_output.get("decision", "")

    if decision == "REQUEST_INFO":
        sup = AgentEvent(
            agent="supervisor",
            event_type="flag",
            payload={
                "action": "halt",
                "reason": "underwriting requested more info before contract",
            },
            timestamp=now_iso(),
        )
        write_event(sup)
        _log(sup)
        yield sup
        return

    # Extract inputs for contract agent
    order_summary = intake_output.get("order_summary", {})
    company_info = {
        "name": deal_package.get("company", {}).get("name", ""),
        "country": deal_package.get("company", {}).get("country", ""),
        "type": deal_package.get("company", {}).get("type", ""),
    }

    contract_output = None

    async for event in run_contract_agent(underwriting_output, order_summary, company_info):
        write_event(event)
        _log(event)
        yield event

        if event.event_type == "output" and event.agent == "contract":
            contract_output = event.payload.get("contract_output")

        if event.event_type == "error":
            sup = AgentEvent(
                agent="supervisor",
                event_type="flag",
                payload={"action": "halt", "reason": "contract error"},
                timestamp=now_iso(),
            )
            write_event(sup)
            _log(sup)
            yield sup
            return

    # ── Supervisor routing (contract) ─────────────────────────────────────────
    if contract_output:
        confidence = contract_output.get("confidence", 0.0)
        if confidence < 0.7:
            sup = AgentEvent(
                agent="supervisor",
                event_type="flag",
                payload={
                    "action": "continue_with_review",
                    "reason": f"contract confidence below 0.70 ({confidence:.2f})",
                },
                timestamp=now_iso(),
            )
            write_event(sup)
            _log(sup)
            yield sup

    # ── Pipeline complete (Phase 3) ───────────────────────────────────────────
    decision_label = underwriting_output.get("decision", "unknown") if underwriting_output else "unknown"
    done = AgentEvent(
        agent="supervisor",
        event_type="status",
        payload={"state": "pipeline_complete", "phase": 3, "decision": decision_label},
        timestamp=now_iso(),
    )
    write_event(done)
    _log(done)
    yield done
