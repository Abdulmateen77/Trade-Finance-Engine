interface NextActionsSectionProps {
  next_actions: string[]
}

export function NextActionsSection({ next_actions }: NextActionsSectionProps) {
  if (!next_actions || next_actions.length === 0) return null

  return (
    <div>
      <h4 className="text-xs uppercase tracking-wide font-semibold text-slate-500 mb-3">Next Actions</h4>
      <ol className="space-y-3">
        {next_actions.map((action, i) => {
          const { chip, text } = parseAction(action)
          return (
            <li key={i} className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white text-xs font-medium">
                {i + 1}
              </span>
              <div className="flex items-start gap-2 pt-0.5">
                {chip && (
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase shrink-0 ${
                      chip === "REQUIRED"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {chip}
                  </span>
                )}
                <span className="text-sm text-slate-700">{text}</span>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function parseAction(action: string): { chip: string | null; text: string } {
  if (action.startsWith("REQUIRED:")) {
    return { chip: "REQUIRED", text: action.slice(9).trim() }
  }
  if (action.startsWith("CONDITION:")) {
    return { chip: "CONDITION", text: action.slice(10).trim() }
  }
  return { chip: null, text: action }
}
