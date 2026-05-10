"""
Agent functions for the OceanX pipeline.

Phase 0: SDK smoke-test stub only.
Real agents (intake, underwriting, contract) are added in Phases 1-3.
"""

import os
import anthropic
from dotenv import load_dotenv

load_dotenv()


async def stub_claude_call() -> str:
    """
    Proves the Anthropic SDK is wired up end-to-end.
    Makes a real API call with a hardcoded prompt and returns the response text.
    Called only by GET /test-claude — not part of the pipeline.
    """
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    message = client.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=16,
        messages=[
            {"role": "user", "content": "Reply with exactly the word: ready"}
        ],
    )
    return message.content[0].text
