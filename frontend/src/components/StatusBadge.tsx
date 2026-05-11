import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  MinusCircle,
  XCircle,
} from "lucide-react"
import type { AgentStatus } from "@/lib/deriveAgentState"

interface StatusBadgeProps {
  status: AgentStatus
}

const config: Record<
  AgentStatus,
  { icon: React.ComponentType<{ className?: string }>; label: string; classes: string }
> = {
  idle: {
    icon: Clock,
    label: "Idle",
    classes: "bg-slate-100 text-slate-600 border-slate-200",
  },
  running: {
    icon: Loader2,
    label: "Running",
    classes: "bg-blue-50 text-blue-700 border-blue-200",
  },
  done: {
    icon: CheckCircle2,
    label: "Done",
    classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  flagged: {
    icon: AlertTriangle,
    label: "Flagged",
    classes: "bg-amber-50 text-amber-700 border-amber-200",
  },
  error: {
    icon: XCircle,
    label: "Error",
    classes: "bg-red-50 text-red-700 border-red-200",
  },
  skipped: {
    icon: MinusCircle,
    label: "Skipped",
    classes: "bg-slate-50 text-slate-400 border-slate-200",
  },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { icon: Icon, label, classes } = config[status]
  const isSpinning = status === "running"

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors duration-300 ${classes}`}
      aria-label={label}
    >
      <Icon className={`h-3 w-3 ${isSpinning ? "animate-spin" : ""}`} />
      {label}
    </span>
  )
}
