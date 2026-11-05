import { useEffect, useState } from "react"
import { AlertTriangle, ArrowUpRight, BookOpen, Loader2 } from "lucide-react"
import { StatusBadge } from "@/components/StatusBadge"
import type { AgentSlug, AgentState } from "@/lib/deriveAgentState"
import { getCuratedStatus } from "@/lib/agentStatusMessages"
import { contractSummary, intakeSummary, underwritingSummary } from "@/lib/summaries"

interface AgentCardProps {
  agent: AgentSlug
  state: AgentState
  stepNumber: 2 | 3 | 4
  onOpen: (agent: AgentSlug, defaultTab: "output" | "checklist") => void
}

const agentMeta: Record<AgentSlug, { title: string; subtitle: string }> = {
  intake: {
    title: "Intake",
    subtitle: "Parses deal package, validates data sources",
  },
  underwriting: {
    title: "Underwriting",
    subtitle: "Applies OceanX playbook: gates, ADB, risk scoring",
  },
  contract: {
    title: "Contract",
    subtitle: "Drafts deal-specific facility agreement",
  },
}

export function AgentCard({ agent, state, stepNumber, onOpen }: AgentCardProps) {
  const { title, subtitle } = agentMeta[agent]
  const isRunning = state.status === "running"
  const ringClass = isRunning ? "ring-1 ring-blue-200" : ""

  // Force re-render every 500ms while running so curated messages advance
  const [, forceTick] = useState(0)
  useEffect(() => {
    if (!isRunning) return
    const interval = setInterval(() => forceTick((t) => t + 1), 500)
    return () => clearInterval(interval)
  }, [isRunning])

  const defaultTab = state.status === "done" || state.status === "flagged" || state.status === "error" || state.status === "skipped" ? "output" : "checklist"

  return (
    <div
      className={`min-h-[180px] rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${ringClass}`}
      onClick={() => onOpen(agent, defaultTab)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onOpen(agent, defaultTab)
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Open ${title} agent details`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 uppercase tracking-wide">
              Step {stepNumber}
            </span>
            <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
          </div>
          <p className="text-sm text-slate-600">{subtitle}</p>
        </div>
        <StatusBadge status={state.status} />
      </div>

      {/* Activity strip */}
      <ActivityStrip agent={agent} state={state} />

      {/* Stats row */}
      {(state.status === "done" || state.status === "error" || state.status === "flagged") &&
        (state.latencyMs != null || state.tokensUsed != null) && (
          <div className="mt-3 flex items-center justify-end gap-3 text-[11px] text-slate-400">
            {state.latencyMs != null && (
              <span>took {(state.latencyMs / 1000).toFixed(1)}s</span>
            )}
            {state.tokensUsed != null && (
              <span>{state.tokensUsed.toLocaleString()} tokens</span>
            )}
          </div>
        )}

      {/* Button row */}
      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
        {/* Knowledge button — always visible */}
        <button
          onClick={(e) => { e.stopPropagation(); onOpen(agent, "checklist") }}
          className="inline-flex items-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors duration-150"
        >
          <BookOpen className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Agent knowledge
        </button>

        {/* View output button — conditional */}
        <OutputButton status={state.status} onOpen={() => onOpen(agent, "output")} />
      </div>
    </div>
  )
}

function OutputButton({ status, onOpen }: { status: AgentState["status"]; onOpen: () => void }) {
  if (status === "idle") return null

  if (status === "running") {
    return (
      <button
        disabled
        className="inline-flex items-center rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white opacity-60 cursor-not-allowed"
      >
        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
        Output pending...
      </button>
    )
  }

  if (status === "error") {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); onOpen() }}
        className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors duration-150"
      >
        <ArrowUpRight className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
        View error
      </button>
    )
  }

  if (status === "skipped") {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); onOpen() }}
        className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 transition-colors duration-150"
      >
        <ArrowUpRight className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
        View skip reason
      </button>
    )
  }

  // done or flagged
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onOpen() }}
      className="inline-flex items-center rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800 hover:shadow-sm transition-all duration-150"
    >
      <ArrowUpRight className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
      View output
      {status === "flagged" && <AlertTriangle className="ml-1.5 h-3.5 w-3.5 text-amber-400" aria-hidden="true" />}
    </button>
  )
}

function ActivityStrip({ agent, state }: { agent: AgentSlug; state: AgentState }) {
  if (state.status === "idle") return null

  if (state.status === "skipped") {
    return (
      <div className="mt-2 text-sm text-slate-400 italic leading-relaxed">
        Skipped — pipeline halted at underwriting
      </div>
    )
  }

  if (state.status === "error") {
    return (
      <div className="mt-2 text-sm text-red-500 leading-relaxed">
        {state.errorMessage || "Unknown error"}
      </div>
    )
  }

  if (state.status === "running") {
    const elapsedMs = state.startedAt != null ? Date.now() - state.startedAt : 0
    const curatedMessage = getCuratedStatus(agent, Math.max(0, elapsedMs))

    return (
      <div className="mt-2 flex items-center gap-2">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500 animate-pulse" />
        <span className="text-sm text-slate-700 leading-relaxed">{curatedMessage}</span>
      </div>
    )
  }

  // done or flagged — show summary
  return (
    <div className="mt-2 text-sm text-slate-600 leading-relaxed">
      <SummaryLine agent={agent} output={state.output} />
    </div>
  )
}

function SummaryLine({ agent, output }: { agent: AgentSlug; output: Record<string, unknown> | null }) {
  if (agent === "intake") return <span>{intakeSummary(output)}</span>

  if (agent === "underwriting") {
    const { text, decisionColor } = underwritingSummary(output)
    const parts = text.split(/(APPROVE_WITH_CONDITIONS|APPROVE|REQUEST_INFO|REJECT)/)
    return (
      <span>
        {parts.map((part, i) => {
          if (["APPROVE", "APPROVE_WITH_CONDITIONS", "REQUEST_INFO", "REJECT"].includes(part)) {
            return <span key={i} className={`font-semibold ${decisionColor}`}>{part}</span>
          }
          return <span key={i}>{part}</span>
        })}
      </span>
    )
  }

  if (agent === "contract") return <span>{contractSummary(output)}</span>

  return null
}
