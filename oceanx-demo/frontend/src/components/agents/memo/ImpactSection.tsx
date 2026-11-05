import { StatTile } from "@/components/ui/stat-tile"
import { formatGBP } from "@/lib/format"

interface ImpactSectionProps {
  impact_of_capital: Record<string, unknown>
  decision: string
}

export function ImpactSection({ impact_of_capital, decision }: ImpactSectionProps) {
  const ic = impact_of_capital

  // For REJECT decisions where impact is not meaningful
  if (decision === "REJECT") {
    return (
      <div>
        <h4 className="text-xs uppercase tracking-wide font-semibold text-slate-500 mb-3">Impact of Capital</h4>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm text-slate-500 italic">
            Impact analysis not performed — deal rejected
          </p>
        </div>
      </div>
    )
  }

  const assumptions = String(ic.assumptions || ic.notes || "")

  return (
    <div>
      <h4 className="text-xs uppercase tracking-wide font-semibold text-slate-500 mb-3">Impact of Capital</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile label="Sales/Cycle" value={formatGBP(ic.sales_per_cycle_gbp)} />
        <StatTile label="Turns/Year" value={typeof ic.turns_per_year === "number" ? ic.turns_per_year.toFixed(1) : String(ic.turns_per_year ?? "?")} />
        <StatTile label="Incr. Annual Sales" value={formatGBP(ic.incremental_annual_sales_gbp)} />
        <StatTile label="Incr. Annual GP" value={formatGBP(ic.incremental_annual_gross_profit_gbp)} />
      </div>
      {assumptions && (
        <p className="text-xs italic text-slate-400 mt-3">{assumptions}</p>
      )}
    </div>
  )
}
