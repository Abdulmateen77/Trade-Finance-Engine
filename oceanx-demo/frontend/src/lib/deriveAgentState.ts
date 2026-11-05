import type { AgentEvent } from "@/types/events"

export type AgentSlug = "intake" | "underwriting" | "contract"

export type AgentStatus =
  | "idle"
  | "running"
  | "done"
  | "flagged"
  | "error"
  | "skipped"

export interface AgentState {
  status: AgentStatus
  reasoningText: string
  output: Record<string, unknown> | null
  latencyMs: number | null
  tokensUsed: number | null
  errorMessage: string | null
  supervisorFlags: Array<{ action: string; reason: string }>
  startedAt: number | null
  reasoningCharsStreamed: number
}

function emptyState(): AgentState {
  return {
    status: "idle",
    reasoningText: "",
    output: null,
    latencyMs: null,
    tokensUsed: null,
    errorMessage: null,
    supervisorFlags: [],
    startedAt: null,
    reasoningCharsStreamed: 0,
  }
}

// Module-level map to track when each agent first started (client-side timestamp).
// Keyed by a run-specific prefix to handle resets properly.
let agentStartTimes: Record<string, number> = {}
let lastEventCount = 0

export function deriveAgentStates(
  events: AgentEvent[]
): Record<AgentSlug, AgentState> {
  const states: Record<AgentSlug, AgentState> = {
    intake: emptyState(),
    underwriting: emptyState(),
    contract: emptyState(),
  }

  // Reset start times if events array shrunk (reset was called)
  if (events.length < lastEventCount) {
    agentStartTimes = {}
  }
  lastEventCount = events.length

  let pipelineComplete = false

  for (const event of events) {
    const { agent, event_type, payload } = event

    // Handle agent-specific events
    if (agent === "intake" || agent === "underwriting" || agent === "contract") {
      const state = states[agent]

      if (event_type === "status" && payload.state === "running") {
        state.status = "running"
        // Capture start time ONLY on the first running event
        if (!agentStartTimes[agent]) {
          agentStartTimes[agent] = Date.now()
        }
      } else if (event_type === "reasoning_chunk") {
        state.reasoningText += (payload.text as string) || ""
      } else if (event_type === "output") {
        state.status = "done"
        state.output = payload as Record<string, unknown>
        state.latencyMs = event.latency_ms ?? null
        state.tokensUsed = event.tokens_used ?? null
      } else if (event_type === "error") {
        state.status = "error"
        state.errorMessage = (payload.error as string) || "Unknown error"
        state.latencyMs = event.latency_ms ?? null
        state.tokensUsed = event.tokens_used ?? null
      }

      // Always set startedAt and chars from the module-level map
      state.startedAt = agentStartTimes[agent] ?? null
      state.reasoningCharsStreamed = state.reasoningText.length
    }

    // Handle supervisor flags
    if (agent === "supervisor" && event_type === "flag") {
      const action = payload.action as string
      const reason = payload.reason as string

      if (reason?.includes("intake")) {
        states.intake.supervisorFlags.push({ action, reason })
      } else if (reason?.includes("underwriting")) {
        states.underwriting.supervisorFlags.push({ action, reason })
        if (action === "halt" && reason.includes("REJECT")) {
          states.underwriting.status = "flagged"
        }
      } else if (reason?.includes("contract")) {
        states.contract.supervisorFlags.push({ action, reason })
      } else {
        if (states.contract.status === "running" || states.contract.status === "done") {
          states.contract.supervisorFlags.push({ action, reason })
        } else if (states.underwriting.status === "running" || states.underwriting.status === "done") {
          states.underwriting.supervisorFlags.push({ action, reason })
        } else {
          states.intake.supervisorFlags.push({ action, reason })
        }
      }
    }

    // Detect pipeline completion
    if (
      agent === "supervisor" &&
      event_type === "status" &&
      payload.state === "pipeline_complete"
    ) {
      pipelineComplete = true
    }
  }

  // If pipeline completed and contract never ran, mark it as skipped
  if (pipelineComplete && states.contract.status === "idle") {
    states.contract.status = "skipped"
  }

  return states
}
