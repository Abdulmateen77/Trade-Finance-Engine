import { StatTile } from "@/components/ui/stat-tile"
import { formatGBP, formatPercent } from "@/lib/format"

interface KeyMetricsSectionProps {
  key_metrics: Record<string, unknown>
}

export function KeyMetricsSection({ key_metrics }: KeyMetricsSectionProps) {
  const km = key_metrics

  return (
    <div>
      <h4 className="text-xs uppercase tracking-wide font-semibold text-slate-500 mb-3">Key Metrics</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile label="Revenue (TTM)" value={formatGBP(km.revenue_ttm_gbp ?? km.annual_revenue_gbp)} />
        <StatTile label="Gross Margin" value={formatPercent(km.gross_margin_pct)} />
        <StatTile label="Net Profit" value={formatGBP(km.net_profit_gbp)} />
        <StatTile label="Cash" value={formatGBP(km.cash_gbp)} />
        <StatTile label="ADB (90d)" value={formatGBP(km.adb_90d_gbp)} />
        <StatTile label="Min Daily Balance" value={formatGBP(km.min_daily_balance_gbp)} />
        <StatTile label="Monthly OpEx" value={formatGBP(km.monthly_opex_gbp)} />
        <StatTile label="Debt" value={formatGBP(km.debt_gbp ?? km.existing_debt_gbp)} />
      </div>
      <div className="grid grid-cols-3 gap-3 mt-3">
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
          <span className="text-[10px] uppercase tracking-wide text-slate-400">AP Total</span>
          <span className="text-sm font-medium text-slate-700 ml-2">{formatGBP(km.ap_total_gbp)}</span>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
          <span className="text-[10px] uppercase tracking-wide text-slate-400">AP Overdue</span>
          <span className="text-sm font-medium text-slate-700 ml-2">{formatPercent(km.ap_overdue_pct)}</span>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
          <span className="text-[10px] uppercase tracking-wide text-slate-400">DSO</span>
          <span className="text-sm font-medium text-slate-700 ml-2">{String(km.dso_days ?? "?")}d</span>
        </div>
      </div>
    </div>
  )
}
