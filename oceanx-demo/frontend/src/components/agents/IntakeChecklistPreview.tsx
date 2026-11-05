import {
  Banknote,
  Calculator,
  CheckCircle2,
  Circle,
  FileText,
  MessageSquare,
  ShoppingBag,
} from "lucide-react"
import { PROSPECT_SOURCES } from "@/data/prospectSources"

interface IntakeChecklistPreviewProps {
  prospectId: string
}

const sources = [
  { key: "bank" as const, label: "Connected bank", icon: Banknote, trust: "High trust" },
  { key: "accounting" as const, label: "Connected accounting", icon: Calculator, trust: "High trust" },
  { key: "ecom" as const, label: "Connected e-commerce", icon: ShoppingBag, trust: "Medium trust" },
  { key: "uploads" as const, label: "Uploaded documents", icon: FileText, trust: "Supporting only" },
  { key: "notes" as const, label: "Meeting notes", icon: MessageSquare, trust: "Context only" },
]

export function IntakeChecklistPreview({ prospectId }: IntakeChecklistPreviewProps) {
  const ps = PROSPECT_SOURCES[prospectId] || PROSPECT_SOURCES.atlantic

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-slate-700">What this agent will check</h4>

      <div className="space-y-2">
        {sources.map((src) => {
          const sourceVal = ps[src.key] as unknown
          const isPresent = sourceVal != null && sourceVal !== false
          const provider = isPresent && typeof sourceVal === "object" && sourceVal !== null
            ? (sourceVal as { provider: string }).provider
            : "—"
          const Icon = src.icon

          return (
            <div key={src.key} className="flex items-center gap-3 py-1">
              <Icon className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="text-sm font-medium text-slate-700 min-w-[160px]">
                {src.label}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                {src.trust}
              </span>
              <span className="text-xs text-slate-400 ml-auto mr-3">
                {provider}
              </span>
              {isPresent ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="h-4 w-4 text-slate-300 shrink-0" />
              )}
            </div>
          )
        })}
      </div>

      <p className="text-xs italic text-slate-400 pt-2">
        Per OceanX trust hierarchy: connected sources always override uploads. If numbers conflict, the highest-trust source wins.
      </p>
    </div>
  )
}
