"""
Audit log writer.

write_event() appends one JSON line per AgentEvent to audit.jsonl in the
backend/ directory. The file is created automatically on first write —
append mode handles this without any explicit file-creation step.

We open and close the file on every call intentionally: simple, no
file-handle leaks, safe for the sequential pipeline we're building.
"""

import os
from models import AgentEvent

# Audit log lives next to the running process (backend/)
AUDIT_PATH = os.path.join(os.path.dirname(__file__), "audit.jsonl")


def write_event(event: AgentEvent) -> None:
    """Append a single AgentEvent as a JSON line to audit.jsonl."""
    with open(AUDIT_PATH, "a", encoding="utf-8") as f:
        f.write(event.model_dump_json() + "\n")
