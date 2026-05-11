import { AlertTriangle, Check, Info } from "lucide-react"
import { useState } from "react"
import { StatTile } from "@/components/ui/stat-tile"
import { Progress } from "@/components/ui/progress"
import { formatGBP, formatPercent, formatNumber } from "@/lib/format"

interface IntakeOutputViewProps {
  output: Record<string, unknown>
}

export function IntakeOutputView({ output }: IntakeOutputViewProps) {
  const intake = (output.intake_output as Record<string, unknown>) || output

  const financials = (intake.financials_summary as Record<string, unknown>) || {}
  const liquidity = (intake.liquidity_summary as Record<string, unknown>) || {}
  const order = (intake.order_summary as Record<string, unknown>) || {}
  const dataSources = (intake.data_sources as Array<Record<string, unknown>>) || []
  const missingItems = (intake.missing_items as string[]) || []
  const qualityNotes = (intake.data_quality_notes as string[]) || []
  const confidence = typeof intake.confidence === "number" ? intake.confidence : 0
  const cashCycleMonths = intake.cash_cycle_months

  return (
    <div className="space-y-8">
      {/* Header strip — key metrics */}
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Transactions Parsed" value={String(intake.transaction_count ?? "?")} />
        <StatTile label="Period" value={String(intake.transaction_period ?? "?")} />
        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Confidence</p>
          <p className="text-lg font-semibold text-slate-900 mt-1">{confidence.toFixed(2)}</p>
          <Progress value={confidence * 100} className="h-1.5 mt-1.5" />
        </div>
      </div>

      {/* Identity */}
      <div>
        <h4 className="text-xs uppercase tracking-wide font-semibold text-slate-500 mb-3">Identity</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
          <Row label="Company" value={String(intake.company_name ?? "")} />
          <Row label="Country" value={String(intake.country ?? "")} />
          <Row label="Tenure" value={intake.business_tenure_years ? `${intake.business_tenure_years} years` : "?"} />
          <Row label="Requested limit" value={formatGBP(intake.requested_limit_gbp)} />
          <Row label="Business model" value={String(intake.business_model ?? "")} clamp />
        </div>
      </div>

      {/* Order */}
      {order && Object.keys(order).length > 0 && (
        <div>
          <h4 className="text-xs uppercase tracking-wide font-semibold text-slate-500 mb-3">Order</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatTile label="Goods" value={truncate(String(order.goods ?? "?"), 30)} />
            <StatTile label="Quantity" value={formatNumber(order.quantity)} />
            <StatTile label="Unit Price" value={`$${Number(order.unit_price_usd ?? 0).toFixed(2)}`} />
            <StatTile label="Total" value={`$${formatNumber(Number(order.quantity ?? 0) * Number(order.unit_price_usd ?? 0))}`} />
            <StatTile label="Lead Time" value={`${order.lead_time_days ?? "?"} days`} />
          </div>
        </div>
      )}

      {/* Data Sources */}
      {dataSources.length > 0 && (
        <div>
          <h4 className="text-xs uppercase tracking-wide font-semibold text-slate-500 mb-3">Data Sources</h4>
          <div className="flex flex-wrap gap-2">
            {dataSources.map((src, i) => {
              const trust = String(src.trust || "low")
              const source = String(src.source || "Unknown")
              const provider = src.provider ? ` (${src.provider})` : ""
              const pillStyle =
                trust === "high"
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : trust === "medium"
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : "bg-slate-100 text-slate-600 border-slate-200"
              const trustLabel = trust === "high" ? "High" : trust === "medium" ? "Medium" : "Low"

              return (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${pillStyle}`}
                >
                  <Check className="h-3 w-3" aria-hidden="true" />
                  {humanizeSource(source)}{provider}
                  <span className="ml-1 opacity-60 text-[10px]">{trustLabel}</span>
                </span>
              )
            })}
          </div>
        </div>
      )}

      {/* Financials snapshot */}
      <div>
        <h4 className="text-xs uppercase tracking-wide font-semibold text-slate-500 mb-3">Financials Snapshot</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatTile label="Revenue" value={formatGBP(financials.annual_revenue_gbp ?? financials.revenue)} />
          <StatTile label="Gross Margin" value={formatPercent(financials.gross_margin_pct)} />
          <StatTile label="Net Profit" value={formatGBP(financials.net_profit_gbp ?? financials.net_profit)} />
          <StatTile label="Cash" value={formatGBP(financials.cash_gbp ?? financials.cash)} />
          <StatTile label="Monthly OpEx" value={formatGBP(financials.monthly_opex_gbp ?? financials.monthly_opex)} />
          <StatTile label="Existing Debt" value={formatGBP(financials.existing_debt_gbp ?? financials.existing_debt)} />
          <StatTile label="AP Total" value={formatGBP(financials.ap_total_gbp ?? financials.ap_total)} />
          <StatTile label="DSO" value={`${financials.dso_days ?? financials.dso ?? "?"}d`} />
        </div>
        {financials.ap_overdue_pct != null && (
          <div className="mt-2 rounded-lg border border-slate-200 bg-white px-3 py-2 inline-block">
            <span className="text-[10px] uppercase tracking-wide text-slate-400">AP Overdue</span>
            <span className="text-sm font-medium text-slate-700 ml-2">{formatPercent(financials.ap_overdue_pct)}</span>
          </div>
        )}
      </div>

      {/* Liquidity snapshot */}
      <div>
        <h4 className="text-xs uppercase tracking-wide font-semibold text-slate-500 mb-3">Liquidity Snapshot</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <LiquidityTile label="ADB 90d" value={liquidity.adb_90d_gbp ?? liquidity.adb_90d} />
          <StatTile label="Min Daily Balance" value={formatGBP(liquidity.min_daily_balance_gbp ?? liquidity.min_daily_balance)} />
          <StatTile label="NSF Count" value={String(liquidity.nsf_count ?? "0")} />
          <StatTile label="Cash Cycle" value={cashCycleMonths != null ? `${cashCycleMonths} months` : "?"} />
        </div>
        {liquidity.balance_volatility_note ? (
          <p className="text-xs italic text-slate-400 mt-3 line-clamp-2">
            {String(liquidity.balance_volatility_note)}
          </p>
        ) : null}
      </div>

      {/* Data Quality */}
      {(missingItems.length > 0 || qualityNotes.length > 0) && (
        <div>
          <h4 className="text-xs uppercase tracking-wide font-semibold text-slate-500 mb-3">Data Quality</h4>
          <div className="space-y-3">
            {missingItems.length > 0 && (
              <div className="border-l-4 border-red-400 rounded-md bg-red-50 p-3">
                <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2">Missing Items</p>
                {missingItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 py-0.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" aria-hidden="true" />
                    <span className="text-sm text-red-700">{item}</span>
                  </div>
                ))}
              </div>
            )}
            {qualityNotes.length > 0 && (
              <div className="border-l-4 border-amber-400 rounded-md bg-amber-50 p-3">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">Quality Notes</p>
                {qualityNotes.map((note, i) => (
                  <ExpandableNote key={i} text={note} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value, clamp }: { label: string; value: string; clamp?: boolean }) {
  return (
    <div className="flex items-baseline gap-2 py-1">
      <span className="text-xs uppercase tracking-wide text-slate-400 min-w-[110px] shrink-0">{label}</span>
      <span className={`text-sm text-slate-900 ${clamp ? "line-clamp-2" : ""}`}>{value || "—"}</span>
    </div>
  )
}

function LiquidityTile({ label, value }: { label: string; value: unknown }) {
  if (value === 0 || value === null || value === undefined) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
        <p className="text-sm italic text-slate-400 mt-1">Not pre-calculated</p>
      </div>
    )
  }
  return <StatTile label={label} value={formatGBP(value)} />
}

function ExpandableNote({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = text.length > 120

  return (
    <div className="flex items-start gap-2 py-0.5">
      <Info className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" aria-hidden="true" />
      <div>
        <span className={`text-sm text-amber-800 ${!expanded && isLong ? "line-clamp-2" : ""}`}>{text}</span>
        {isLong && (
          <button onClick={() => setExpanded(!expanded)} className="text-xs text-blue-600 hover:underline ml-1">
            {expanded ? "less" : "more"}
          </button>
        )}
      </div>
    </div>
  )
}

function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + "…" : str
}

function humanizeSource(source: string): string {
  return source
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
