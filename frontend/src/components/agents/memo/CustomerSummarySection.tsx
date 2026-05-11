interface CustomerSummarySectionProps {
  customer_summary: Record<string, unknown>
}

export function CustomerSummarySection({ customer_summary }: CustomerSummarySectionProps) {
  const cs = customer_summary
  const fields: [string, unknown][] = [
    ["Company", cs.company],
    ["Country", cs.country],
    ["Tenure", cs.tenure_years ? `${cs.tenure_years} years` : cs.tenure],
    ["Business model", cs.business_model],
    ["Channels", cs.channels],
    ["Import regions", cs.import_regions],
  ]

  return (
    <div>
      <h4 className="text-xs uppercase tracking-wide font-semibold text-slate-500 mb-3">Customer Summary</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
        {fields.map(([label, value]) =>
          value ? (
            <div key={label} className="flex items-baseline gap-2 py-1">
              <span className="text-xs uppercase tracking-wide text-slate-400 min-w-[110px] shrink-0">{label}</span>
              <span className="text-sm text-slate-900 line-clamp-2">{String(value)}</span>
            </div>
          ) : null
        )}
      </div>
    </div>
  )
}
