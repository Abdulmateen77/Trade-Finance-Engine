import { useState } from "react"
import { Check } from "lucide-react"

interface RiskFlag {
  severity: string
  description: string
}

interface RiskFlagsSectionProps {
  risk_flags: RiskFlag[]
}

const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 }
const severityStyles: Record<string, string> = {
  high: "border-l-red-500 bg-red-50",
  medium: "border-l-amber-500 bg-amber-50",
  low: "border-l-slate-400 bg-slate-50",
}
const badgeStyles: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-slate-200 text-slate-600",
}

export function RiskFlagsSection({ risk_flags }: RiskFlagsSectionProps) {
  const sorted = [...risk_flags].sort(
    (a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3)
  )

  return (
    <div>
      <h4 className="text-xs uppercase tracking-wide font-semibold text-slate-500 mb-3">Risk Flags</h4>
      {sorted.length === 0 ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-2">
          <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          <span className="text-sm text-emerald-700">No risk flags identified</span>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((flag, i) => (
            <FlagCard key={i} flag={flag} index={i + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

function FlagCard({ flag, index }: { flag: RiskFlag; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const style = severityStyles[flag.severity] || severityStyles.low
  const badge = badgeStyles[flag.severity] || badgeStyles.low
  const isLong = flag.description.length > 150

  return (
    <div className={`border-l-4 rounded-md p-3 ${style}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${badge}`}>
          {flag.severity}
        </span>
        <span className="text-xs text-slate-400">Flag {index}</span>
      </div>
      <p className={`text-sm text-slate-700 ${!expanded && isLong ? "line-clamp-3" : ""}`}>
        {flag.description}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-blue-600 hover:underline mt-1"
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  )
}
