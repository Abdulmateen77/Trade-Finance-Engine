"""
Agent functions for the OceanX pipeline.

Phase 1: run_intake_agent()
Phase 2: run_underwriting_agent()
Phase 3: run_contract_agent() (not yet built)
"""

import json
import os
import time
from datetime import datetime, timezone
from typing import AsyncGenerator

from anthropic import Anthropic
from dotenv import load_dotenv
from pydantic import ValidationError

from models import AgentEvent, IntakeOutput, UnderwritingOutput
from prompts import INTAKE_SYSTEM_PROMPT, UNDERWRITING_SYSTEM_PROMPT

load_dotenv()

client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
MODEL = "claude-sonnet-4-5"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _strip_fences(text: str) -> str:
    """
    Remove markdown code fences if the LLM wraps its JSON in them.
    We instruct the model not to, but this is a safety net for the retry path.
    """
    cleaned = text.strip()
    if cleaned.startswith("```"):
        # Drop the opening fence line (```json or ```)
        cleaned = cleaned.split("\n", 1)[1] if "\n" in cleaned else cleaned[3:]
        # Drop the closing fence
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
    return cleaned.strip()


async def run_intake_agent(deal_package: dict) -> AsyncGenerator[AgentEvent, None]:
    """
    Streams AgentEvent objects as it processes the deal package.

    Yields:
      1. status event  (state: running)
      2. reasoning_chunk events as Claude streams tokens
      3. output event  with validated IntakeOutput
      OR error event on failure (after one retry on schema mismatch)
    """
    start = time.time()

    yield AgentEvent(
        agent="intake",
        event_type="status",
        payload={"state": "running"},
        timestamp=now_iso(),
    )

    user_message = f"Parse this deal package:\n\n{json.dumps(deal_package, default=str)}"
    full_response = ""
    input_tokens = 0
    output_tokens = 0

    # ── First attempt ────────────────────────────────────────────────────────
    try:
        with client.messages.stream(
            model=MODEL,
            max_tokens=4096,
            system=INTAKE_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        ) as stream:
            for text_chunk in stream.text_stream:
                full_response += text_chunk
                yield AgentEvent(
                    agent="intake",
                    event_type="reasoning_chunk",
                    payload={"text": text_chunk},
                    timestamp=now_iso(),
                )
            final = stream.get_final_message()
            input_tokens = final.usage.input_tokens
            output_tokens = final.usage.output_tokens

    except Exception as e:
        yield AgentEvent(
            agent="intake",
            event_type="error",
            payload={"error": str(e), "stage": "claude_call"},
            timestamp=now_iso(),
            latency_ms=int((time.time() - start) * 1000),
        )
        return

    # ── Parse + validate ─────────────────────────────────────────────────────
    parsed = None
    validation_error = None
    try:
        data = json.loads(_strip_fences(full_response))
        parsed = IntakeOutput.model_validate(data)
    except (json.JSONDecodeError, ValidationError) as e:
        validation_error = str(e)

    # ── Retry once on schema failure ─────────────────────────────────────────
    if validation_error:
        yield AgentEvent(
            agent="intake",
            event_type="status",
            payload={"state": "retrying", "reason": "schema_validation_failed"},
            timestamp=now_iso(),
        )

        retry_message = (
            f"Your previous response did not match the required schema.\n"
            f"Error: {validation_error}\n\n"
            f"Return ONLY valid JSON matching the IntakeOutput schema. "
            f"No prose, no markdown fences."
        )
        # Pass the bad response back so the model can self-correct
        prior_assistant_content = full_response or "{}"
        full_response = ""

        try:
            with client.messages.stream(
                model=MODEL,
                max_tokens=4096,
                system=INTAKE_SYSTEM_PROMPT,
                messages=[
                    {"role": "user", "content": user_message},
                    {"role": "assistant", "content": prior_assistant_content},
                    {"role": "user", "content": retry_message},
                ],
            ) as stream:
                for text_chunk in stream.text_stream:
                    full_response += text_chunk
                final = stream.get_final_message()
                input_tokens += final.usage.input_tokens
                output_tokens += final.usage.output_tokens

            data = json.loads(_strip_fences(full_response))
            parsed = IntakeOutput.model_validate(data)

        except Exception as e:
            yield AgentEvent(
                agent="intake",
                event_type="error",
                payload={"error": f"Validation failed after retry: {str(e)}"},
                timestamp=now_iso(),
                latency_ms=int((time.time() - start) * 1000),
                tokens_used=input_tokens + output_tokens,
            )
            return

    # ── Success ───────────────────────────────────────────────────────────────
    yield AgentEvent(
        agent="intake",
        event_type="output",
        payload={"intake_output": parsed.model_dump()},
        timestamp=now_iso(),
        latency_ms=int((time.time() - start) * 1000),
        tokens_used=input_tokens + output_tokens,
    )


async def run_underwriting_agent(
    intake_output: dict,
    bank_transactions: list,
) -> AsyncGenerator[AgentEvent, None]:
    """
    Streams AgentEvent objects as it underwrites the deal.

    Receives the validated intake_output dict AND the raw bank_transactions
    list — intake deliberately did not analyze transactions, so we pass them
    here for the underwriting agent to scan for red flags.

    Yields:
      1. status event  (state: running)
      2. reasoning_chunk events as Claude streams tokens
      3. output event  with validated UnderwritingOutput
      OR error event on failure (after one retry on schema mismatch)

    max_tokens is 8192 — underwriting produces a much longer response than
    intake (full credit memo, all gate calculations, red flag analysis).
    """
    start = time.time()

    yield AgentEvent(
        agent="underwriting",
        event_type="status",
        payload={"state": "running"},
        timestamp=now_iso(),
    )

    user_message = (
        f"Intake output:\n{json.dumps(intake_output, default=str)}\n\n"
        f"Raw bank transactions:\n{json.dumps(bank_transactions, default=str)}"
    )
    full_response = ""
    input_tokens = 0
    output_tokens = 0

    # ── First attempt ────────────────────────────────────────────────────────
    try:
        with client.messages.stream(
            model=MODEL,
            max_tokens=8192,
            system=UNDERWRITING_SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        ) as stream:
            for text_chunk in stream.text_stream:
                full_response += text_chunk
                yield AgentEvent(
                    agent="underwriting",
                    event_type="reasoning_chunk",
                    payload={"text": text_chunk},
                    timestamp=now_iso(),
                )
            final = stream.get_final_message()
            input_tokens = final.usage.input_tokens
            output_tokens = final.usage.output_tokens

    except Exception as e:
        yield AgentEvent(
            agent="underwriting",
            event_type="error",
            payload={"error": str(e), "stage": "claude_call"},
            timestamp=now_iso(),
            latency_ms=int((time.time() - start) * 1000),
        )
        return

    # ── Parse + validate ─────────────────────────────────────────────────────
    parsed = None
    validation_error = None
    try:
        data = json.loads(_strip_fences(full_response))
        parsed = UnderwritingOutput.model_validate(data)
    except (json.JSONDecodeError, ValidationError) as e:
        validation_error = str(e)

    # ── Retry once on schema failure ─────────────────────────────────────────
    if validation_error:
        yield AgentEvent(
            agent="underwriting",
            event_type="status",
            payload={"state": "retrying", "reason": "schema_validation_failed"},
            timestamp=now_iso(),
        )

        retry_message = (
            f"Your previous response did not match the required UnderwritingOutput schema.\n"
            f"Error: {validation_error}\n\n"
            f"Return ONLY valid JSON matching the schema. No prose, no markdown fences."
        )
        prior_assistant_content = full_response or "{}"
        full_response = ""

        try:
            with client.messages.stream(
                model=MODEL,
                max_tokens=8192,
                system=UNDERWRITING_SYSTEM_PROMPT,
                messages=[
                    {"role": "user", "content": user_message},
                    {"role": "assistant", "content": prior_assistant_content},
                    {"role": "user", "content": retry_message},
                ],
            ) as stream:
                for text_chunk in stream.text_stream:
                    full_response += text_chunk
                final = stream.get_final_message()
                input_tokens += final.usage.input_tokens
                output_tokens += final.usage.output_tokens

            data = json.loads(_strip_fences(full_response))
            parsed = UnderwritingOutput.model_validate(data)

        except Exception as e:
            yield AgentEvent(
                agent="underwriting",
                event_type="error",
                payload={"error": f"Validation failed after retry: {str(e)}"},
                timestamp=now_iso(),
                latency_ms=int((time.time() - start) * 1000),
                tokens_used=input_tokens + output_tokens,
            )
            return

    # ── Success ───────────────────────────────────────────────────────────────
    yield AgentEvent(
        agent="underwriting",
        event_type="output",
        payload={"underwriting_output": parsed.model_dump()},
        timestamp=now_iso(),
        latency_ms=int((time.time() - start) * 1000),
        tokens_used=input_tokens + output_tokens,
    )
