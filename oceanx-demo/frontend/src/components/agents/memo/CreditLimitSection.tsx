import { formatGBPFull, formatGBP } from "@/lib/format"

interface CreditLimitSectionProps {
  method_a_liquidity: Record<string, unknown>
  method_b_revenue_caps: Record<string, unknown>
  recommended_limits: Record<string, unknown>
}

export function CreditLimitSection({ method_a_liquidity, method_b_revenue_caps, recommended_limits }: CreditLimitSectionProps) {
  const ma = method_a_liquidity
  const mb = method_b_revenue_caps
  const rec = recommended_limits

  const adjustments = (ma.adjustments_applied as string[]) || []

  return (
    <div>
      <h4 className="text-xs uppercase tracking-wide font-semibold text-slate-500 mb-3">Credit Limit Calculation</h4>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Method A */}
        <div className="rounded-lg border border-slate-200 p-5">
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
            Method A — Liquidity
          </span>
          <p className="text-2xl font-bold text-slate-900 mt-3">
            {formatGBPFull(ma.method_a_limit_gbp)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Base: 10 × ADB ({formatGBP(ma.adb_90d_gbp)}) = {formatGBPFull(ma.base_limit_gbp)}
          </p>
          {adjustments.length > 0 && (
            <div className="mt-3 max-h-32 overflow-y-auto">
              <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-1">Adjustments</p>
              <ul className="space-y-0.5">
                {adjustments.map((adj, i) => (
                  <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                    <span className="text-slate-300 mt-0.5">•</span>
                    <span>{adj}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Method B */}
        <div className="rounded-lg border border-slate-200 p-5">
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
            Method B — Revenue caps
          </span>
          <p className="text-2xl font-bold text-slate-900 mt-3">
            {formatGBPFull(mb.total_cap_gbp)}
          </p>
          <div className="text-xs text-slate-500 mt-1 space-y-0.5">
            <p>Import cap (10% rev): {formatGBPFull(mb.import_cap_gbp)}</p>
            <p>Inventory cap (10% rev): {formatGBPFull(mb.inventory_cap_gbp)}</p>
          </div>
          <p className="text-[10px] text-slate-400 mt-3 italic">
            20% combined cap of annual revenue
          </p>
        </div>

        {/* Recommended */}
        <div className="rounded-lg border border-slate-300 ring-1 ring-slate-200 p-5">
          <span className="inline-flex items-center rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-semibold text-white uppercase tracking-wide">
            Recommended
          </span>
          <p className="text-2xl font-bold text-slate-900 mt-3">
            {formatGBPFull(rec.total_gbp)}
          </p>
          <div className="text-xs text-slate-600 mt-2 space-y-0.5">
            <p>Import Finance: {formatGBPFull(rec.import_finance_gbp)}</p>
            <p>Inventory Finance: {formatGBPFull(rec.inventory_finance_gbp)}</p>
          </div>
          <p className="text-[10px] text-slate-400 mt-3 italic">
            min(Method A, Method B)
          </p>
        </div>
      </div>
    </div>
  )
}
