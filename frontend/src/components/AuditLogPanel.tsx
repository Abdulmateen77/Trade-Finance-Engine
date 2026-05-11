import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { formatLatency, formatNumber } from "@/lib/format"
import type { AgentEvent } from "@/types/events"

interface AuditLogPanelProps {
  events: AgentEvent[]
  totalTokens: number
  totalLatencyMs: number
}

type FilterTab = "all" | "intake" | "underwriting" | "contract" | "supervisor" | "flags"

const agentColors: Record<string, string> = {
  intake: "bg-blue-100 text-blue-700",
  underwriting: "bg-purple-100 text-purple-700",
  contract: "bg-teal-100 text-teal-700",
  supervisor: "bg-amber-100 text-amber-700",
}

const eventTypeStyles: Record<string, string> = {
  status: "bg-slate-100 text-slate-600",
  output: "bg-emerald-100 text-emerald-700",
  flag: "bg-amber-100 text-amber-700",
  error: "bg-red-100 text-red-700",
}

export function AuditLogPanel({ events, totalTokens, totalLatencyMs }: AuditLogPanelProps) {
  const [filter, setFilter] = useState<FilterTab>("all")

  // Compute reasoning chunk counts per agent
  const chunkCounts: Record<string, number> = {}
  const displayEvents: AgentEvent[] = []

  for (const ev of events) {
    if (ev.event_type === "reasoning_chunk") {
      chunkCounts[ev.agent] = (chunkCounts[ev.agent] || 0) + 1
    } else {
      displayEvents.push(ev)
    }
  }

  // Apply filter
  const filtered = displayEvents.filter((ev) => {
    if (filter === "all") return true
    if (filter === "flags") return ev.event_type === "flag"
    return ev.agent === filter
  })

  const filters: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "intake", label: "Intake" },
    { key: "underwriting", label: "Underwriting" },
    { key: "contract", label: "Contract" },
    { key: "supervisor", label: "Supervisor" },
    { key: "flags", label: "Flags only" },
  ]

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-slate-700">Supervisor Agent</h3>
          <Badge variant="secondary" className="text-[10px]">
            {events.length} events
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-500">
            Tokens: <span className="font-medium text-slate-700">{formatNumber(totalTokens)}</span>
          </span>
          <span className="text-xs text-slate-500">
            Latency: <span className="font-medium text-slate-700">{formatLatency(totalLatencyMs)}</span>
          </span>
        </div>
      </div>

      {/* Body — always visible */}
      {events.length > 0 && (
        <div className="border-t border-slate-100">
          {/* Filter row */}
          <div className="px-5 py-3 flex flex-wrap gap-1.5 border-b border-slate-100">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  filter === f.key
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Event list */}
          <div className="max-h-96 overflow-y-auto px-5 py-3 space-y-1">
            {/* Reasoning chunk summaries */}
            {(filter === "all" || filter === "intake" || filter === "underwriting" || filter === "contract") &&
              Object.entries(chunkCounts).map(([agent, count]) => {
                if (filter !== "all" && filter !== agent) return null
                return (
                  <div key={`chunks-${agent}`} className="flex items-center gap-2 py-1 font-mono text-xs text-slate-400">
                    <span className="w-[52px]">—</span>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${agentColors[agent] || "bg-slate-100 text-slate-600"}`}>
                      {agent}
                    </span>
                    <span className="text-slate-400 italic">{count} reasoning chunks streamed</span>
                  </div>
                )
              })}

            {/* Actual events */}
            {filtered.map((ev, i) => (
              <EventRow key={i} event={ev} />
            ))}

            {filtered.length === 0 && Object.keys(chunkCounts).length === 0 && (
              <p className="text-xs text-slate-400 italic py-4 text-center">No events yet</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function EventRow({ event }: { event: AgentEvent }) {
  const time = event.timestamp ? event.timestamp.slice(11, 19) : "—"
  const agentStyle = agentColors[event.agent] || "bg-slate-100 text-slate-600"
  const typeStyle = eventTypeStyles[event.event_type] || "bg-slate-100 text-slate-600"

  let summary = ""
  if (event.event_type === "status") {
    summary = String(event.payload.state || "")
  } else if (event.event_type === "output") {
    summary = "✓ output validated"
  } else if (event.event_type === "flag") {
    summary = `⚑ ${event.payload.action}: ${event.payload.reason}`
  } else if (event.event_type === "error") {
    summary = `✗ ${event.payload.error || "unknown error"}`
  }

  const isError = event.event_type === "error"

  return (
    <div className="flex items-center gap-2 py-1 font-mono text-xs">
      <span className="text-slate-400 w-[52px] shrink-0">{time}</span>
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0 ${agentStyle}`}>
        {event.agent}
      </span>
      <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-medium shrink-0 ${typeStyle}`}>
        {event.event_type}
      </span>
      <span className={`truncate ${isError ? "text-red-600" : "text-slate-600"}`}>
        {summary}
      </span>
      {event.latency_ms && (
        <span className="text-slate-300 shrink-0 ml-auto">{formatLatency(event.latency_ms)}</span>
      )}
      {event.tokens_used && (
        <span className="text-slate-300 shrink-0">{formatNumber(event.tokens_used)}t</span>
      )}
    </div>
  )
}
