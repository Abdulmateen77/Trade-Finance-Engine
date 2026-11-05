import { useState } from "react"
import { StatTile } from "@/components/ui/stat-tile"
import { formatGBPFull } from "@/lib/format"

interface RepaymentFitSectionProps {
  repayment_fit: Record<string, unknown>
}

export function RepaymentFitSection({ repayment_fit }: RepaymentFitSectionProps) {
  const rf = repayment_fit
  const [showFull, setShowFull] = useState(false)

  const sanityCheck = String(rf.sanity_check || "")
  const isFail = sanityCheck.toUpperCase().startsWith("FAIL")
  const isLong = sanityCheck.length > 200

  return (
    <div>
      <h4 className="text-xs uppercase tracking-wide font-semibold text-slate-500 mb-3">Repayment Fit</h4>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile label="Cash Cycle" value={`${rf.cash_cycle_months ?? "?"} months`} />
        <StatTile label="Term" value={`${rf.repayment_weeks ?? "?"} weeks`} />
        <StatTile label="Weekly Debit" value={formatGBPFull(rf.weekly_debit_gbp)} />
        <div className="rounded-lg border border-slate-200 bg-white p-3 flex flex-col justify-center">
          <p className="text-[10px] uppercase tracking-wide text-slate-500">Sanity Check</p>
          <span
            className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold w-fit ${
              isFail ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {isFail ? "Fail" : "Pass"}
          </span>
        </div>
      </div>
      {sanityCheck && (
        <p className="text-xs italic text-slate-500 mt-3">
          {showFull || !isLong ? sanityCheck : sanityCheck.slice(0, 200) + "…"}
          {isLong && (
            <button
              onClick={() => setShowFull(!showFull)}
              className="ml-1 text-blue-600 hover:underline"
            >
              {showFull ? "Show less" : "Show more"}
            </button>
          )}
        </p>
      )}
    </div>
  )
}
