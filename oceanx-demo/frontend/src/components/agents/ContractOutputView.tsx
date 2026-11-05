import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { AlertCircle, CheckCircle2, Download, Info, Loader2, Send } from "lucide-react"
import { StatTile } from "@/components/ui/stat-tile"
import { Button } from "@/components/ui/button"
import { formatGBP } from "@/lib/format"
import { PROSPECTS } from "@/data/prospects"
import { toast } from "@/lib/useToast"

interface ContractOutputViewProps {
  output: Record<string, unknown>
  prospectId: string
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000"

type SendState = "idle" | "sending" | "sent" | "error"

export function ContractOutputView({ output, prospectId }: ContractOutputViewProps) {
  const contract = (output.contract_output as Record<string, unknown>) || output

  const terms = (contract.contract_terms as Record<string, unknown>) || {}
  const facility = terms.facility_size_gbp ?? terms.facility_amount_gbp ?? terms.credit_limit_gbp
  const rate = terms.rate_apr_pct ?? terms.interest_rate_apr ?? terms.apr
  const tenor = terms.tenor_days ?? terms.repayment_period_days
  const covenants = (terms.covenants as string[]) || []
  const pricingRationale = String(contract.pricing_rationale || "")
  const contractDraftMd = String(contract.contract_draft_md || "")
  const edgeCases = (contract.edge_cases_flagged as string[]) || []
  const docxPath = String(contract.contract_docx_path || "")

  const basename = docxPath ? docxPath.split(/[/\\]/).pop() || "" : ""
  const downloadUrl = basename
    ? `${API_BASE}/download-contract?filename=${encodeURIComponent(basename)}`
    : ""

  const prospect = PROSPECTS.find((p) => p.id === prospectId)
  const customerName = prospect?.name || "Customer"

  const [sendState, setSendState] = useState<SendState>("idle")
  const [envelopeId, setEnvelopeId] = useState("")
  const [deliveredTo, setDeliveredTo] = useState("")
  const [sendError, setSendError] = useState("")

  const handleSend = async () => {
    if (!basename) return
    setSendState("sending")
    setSendError("")
    try {
      const res = await fetch(`${API_BASE}/send-contract`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: basename, customer_name: customerName }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.status === "error") {
        setSendError(data.note || "Send failed")
        setSendState("error")
        return
      }
      setEnvelopeId(data.envelope_id || "")
      setDeliveredTo(data.delivered_to || "")
      setSendState("sent")
      toast({
        title: "Contract sent",
        description: `Delivered to ${data.delivered_to} — envelope ${data.envelope_id}`,
      })
    } catch {
      setSendError("Network error — check backend is running")
      setSendState("error")
    }
  }

  return (
    <div className="space-y-8">
      {/* Stat row */}
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Facility" value={formatGBP(facility)} />
        <StatTile label="APR" value={rate != null ? `${rate}%` : "?"} />
        <StatTile label="Tenor" value={tenor != null ? `${tenor}d` : "?"} />
      </div>

      {/* Pricing rationale */}
      {pricingRationale && (
        <div>
          <h4 className="text-xs uppercase tracking-wide font-semibold text-slate-500 mb-3">Pricing Rationale</h4>
          <p className="text-sm text-slate-600 whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed">
            {pricingRationale}
          </p>
        </div>
      )}

      {/* Contract markdown preview */}
      {contractDraftMd && (
        <div>
          <h4 className="text-xs uppercase tracking-wide font-semibold text-slate-500 mb-2">Contract Draft</h4>
          <p className="text-[11px] text-slate-400 mb-3 flex items-center gap-1">
            <Info className="h-3 w-3" aria-hidden="true" />
            Preview only — see Download for the formatted .docx
          </p>
          <div className="rounded-lg border border-slate-200 bg-white p-6 max-h-[600px] overflow-y-auto">
            <div className="prose prose-slate prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {contractDraftMd}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {/* Covenants */}
      {covenants.length > 0 && (
        <div>
          <h4 className="text-xs uppercase tracking-wide font-semibold text-slate-500 mb-3">Covenants</h4>
          <ul className="space-y-1.5">
            {covenants.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <span className="text-slate-300 mt-1">•</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Edge cases flagged */}
      {edgeCases.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-4 w-4 text-amber-600" aria-hidden="true" />
            <span className="text-sm font-medium text-amber-800">Edge Cases Flagged</span>
          </div>
          <ul className="space-y-1">
            {edgeCases.map((e, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
                <span className="text-amber-400 mt-1">•</span>
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action row */}
      {basename && (
        <div className="mt-6 pt-4 border-t border-slate-200 space-y-3">
          <p className="text-[11px] text-slate-400 flex items-center gap-1">
            <Info className="h-3 w-3" aria-hidden="true" />
            Send is mocked for this demo — production triggers DocuSign envelope creation and customer notification. Engineering surface is wired, integration is one swap.
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-slate-500 font-mono">{basename}</span>
            <div className="ml-auto flex items-center gap-2">
              {/* Download button */}
              <a
                href={downloadUrl}
                download={basename}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
              >
                <Download className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                Download .docx
              </a>

              {/* Send button / status */}
              {sendState === "idle" && (
                <Button size="sm" onClick={handleSend}>
                  <Send className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                  Send to customer
                </Button>
              )}
              {sendState === "sending" && (
                <Button size="sm" disabled>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                  Sending…
                </Button>
              )}
              {sendState === "sent" && (
                <span className="inline-flex items-center gap-1.5 text-sm text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  Sent to {deliveredTo} — envelope {envelopeId.slice(-8)}
                  <span className="relative group">
                    <Info className="h-3.5 w-3.5 text-slate-400 cursor-help" aria-hidden="true" />
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-md bg-slate-900 px-3 py-2 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                      Real email sent via Gmail SMTP. Production would route through transactional email provider (Postmark/SES) and trigger DocuSign envelope creation.
                    </span>
                  </span>
                </span>
              )}
              {sendState === "error" && (
                <span className="inline-flex items-center gap-1.5 text-sm text-red-600">
                  ⚠ Send failed
                  <button
                    onClick={handleSend}
                    className="text-xs text-blue-600 hover:underline ml-1"
                  >
                    Retry
                  </button>
                  <span className="relative group">
                    <Info className="h-3.5 w-3.5 text-slate-400 cursor-help" aria-hidden="true" />
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-md bg-slate-900 px-3 py-2 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                      {sendError}
                    </span>
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
