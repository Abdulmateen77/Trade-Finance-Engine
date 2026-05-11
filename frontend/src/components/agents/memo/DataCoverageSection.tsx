import { Check, Minus, Shield } from "lucide-react"

interface DataCoverageSectionProps {
  data_coverage: Record<string, unknown>
}

export function DataCoverageSection({ data_coverage }: DataCoverageSectionProps) {
  const dc = data_coverage
  const sources = dc.sources as Record<string, unknown>[] | undefined
  const confidence = String(dc.confidence_label || dc.confidence || "")
  const rationale = String(dc.rationale || dc.confidence_rationale || "")

  // Try to extract source info from the data_coverage object
  const sourceList = sources || extractSources(dc)

  return (
    <div>
      <h4 className="text-xs uppercase tracking-wide font-semibold text-slate-500 mb-3">Data Coverage</h4>

      <div className="flex flex-wrap gap-2 mb-3">
        {sourceList.map((src, i) => {
          const connected = Boolean(src.connected || src.present || src.provider)
          const label = String(src.name || src.source || `Source ${i + 1}`)
          const provider = src.provider ? ` (${src.provider})` : ""

          return (
            <span
              key={i}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
                connected
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-slate-100 text-slate-500 border-slate-200"
              }`}
            >
              {connected ? (
                <Check className="h-3 w-3" aria-hidden="true" />
              ) : (
                <Minus className="h-3 w-3" aria-hidden="true" />
              )}
              {label}{provider}
            </span>
          )
        })}
      </div>

      {(confidence || rationale) && (
        <div className="flex items-start gap-2 text-xs text-slate-500">
          <Shield className="h-3.5 w-3.5 mt-0.5 shrink-0 text-slate-400" aria-hidden="true" />
          <span>
            {confidence && <span className="font-medium">Confidence: {String(confidence)}</span>}
            {rationale && <span className="italic ml-1">— {String(rationale)}</span>}
          </span>
        </div>
      )}
    </div>
  )
}

function extractSources(dc: Record<string, unknown>): Record<string, unknown>[] {
  // Fallback: try to build source list from common field patterns
  const result: Record<string, unknown>[] = []
  const names = ["bank", "accounting", "ecommerce", "uploads", "meeting_notes"]
  const labels = ["Bank", "Accounting", "E-commerce", "Uploads", "Meeting Notes"]

  for (let i = 0; i < names.length; i++) {
    const val = dc[names[i]]
    if (val && typeof val === "object") {
      result.push({ name: labels[i], ...(val as Record<string, unknown>) })
    } else if (typeof val === "string") {
      result.push({ name: labels[i], provider: val, connected: true })
    } else {
      result.push({ name: labels[i], connected: Boolean(val) })
    }
  }
  return result
}
