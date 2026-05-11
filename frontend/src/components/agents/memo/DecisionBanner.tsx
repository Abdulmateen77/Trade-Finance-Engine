import { HelpCircle, ShieldAlert, ShieldCheck, ShieldX } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { formatGBP } from "@/lib/format"

interface DecisionBannerProps {
  decision: string
  confidence: number
  recommendedLimitGbp: number | null
  requiresHumanReview: boolean
  declinedLabel?: string
}

const styles: Record<string, string> = {
  APPROVE: "bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-900",
  APPROVE_WITH_CONDITIONS: "bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 text-amber-900",
  REQUEST_INFO: "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 text-blue-900",
  REJECT: "bg-gradient-to-br from-red-50 to-red-100 border-red-200 text-red-900",
}

const icons: Record<string, React.ComponentType<{ className?: string }>> = {
  APPROVE: ShieldCheck,
  APPROVE_WITH_CONDITIONS: ShieldAlert,
  REQUEST_INFO: HelpCircle,
  REJECT: ShieldX,
}

export function DecisionBanner({ decision, confidence, recommendedLimitGbp, requiresHumanReview, declinedLabel }: DecisionBannerProps) {
  const style = styles[decision] || "bg-slate-50 border-slate-200 text-slate-900"
  const humanized = decision.replace(/_/g, " ")
  const Icon = icons[decision] || ShieldCheck

  const rightLabel = declinedLabel || (recommendedLimitGbp != null ? formatGBP(recommendedLimitGbp) : null)
  const rightSublabel = declinedLabel ? "" : "RECOMMENDED LIMIT"

  return (
    <div
      className={`rounded-xl border-2 p-8 ${style} animate-in fade-in slide-in-from-top-2 duration-500`}
      aria-label={`Decision: ${humanized}. ${rightLabel ? `Recommended limit: ${rightLabel}` : ""}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Icon className="h-8 w-8 opacity-80" aria-hidden="true" />
          <div>
            <p className="text-[10px] uppercase tracking-wide opacity-70">Decision</p>
            <p className="text-4xl font-bold mt-1">{humanized}</p>
          </div>
        </div>
        {rightLabel && (
          <div className="text-right">
            <p className="text-2xl font-bold">{rightLabel}</p>
            {rightSublabel && (
              <p className="text-[10px] uppercase tracking-wide opacity-70 mt-1">{rightSublabel}</p>
            )}
          </div>
        )}
      </div>

      {requiresHumanReview && (
        <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/60 px-3 py-1 text-xs font-medium">
          Requires human review
        </div>
      )}

      <div className="mt-4 flex items-center gap-3">
        <Progress value={confidence * 100} className="flex-1 h-2" />
        <span className="text-xs font-medium whitespace-nowrap">
          Confidence: {confidence.toFixed(2)}
        </span>
      </div>
    </div>
  )
}
