interface DecisionRationaleSectionProps {
  decision_rationale: string[]
}

export function DecisionRationaleSection({ decision_rationale }: DecisionRationaleSectionProps) {
  if (!decision_rationale || decision_rationale.length === 0) return null

  return (
    <div>
      <h4 className="text-xs uppercase tracking-wide font-semibold text-slate-500 mb-3">Decision Rationale</h4>
      <ul className="space-y-2">
        {decision_rationale.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span className="text-slate-300 mt-1.5 text-xs">•</span>
            <span className="text-sm text-slate-700 leading-relaxed">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
