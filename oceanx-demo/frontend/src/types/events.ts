export interface AgentEvent {
  agent: "intake" | "underwriting" | "contract" | "supervisor"
  event_type: "status" | "reasoning_chunk" | "output" | "flag" | "error"
  payload: Record<string, unknown>
  timestamp: string
  latency_ms?: number | null
  tokens_used?: number | null
}

export type PipelineStatus = "idle" | "streaming" | "done" | "error"
