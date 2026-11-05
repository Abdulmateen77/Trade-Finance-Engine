import { CheckCircle2, XCircle } from "lucide-react"

interface Gate {
  name: string
  threshold: string
  actual: string
  passed: boolean
}

interface EligibilitySectionProps {
  basic_qualification: Gate[]
  deep_qualification: Gate[]
}

export function EligibilitySection({ basic_qualification, deep_qualification }: EligibilitySectionProps) {
  return (
    <div>
      <h4 className="text-xs uppercase tracking-wide font-semibold text-slate-500 mb-3">Eligibility Gates</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GateColumn title="Basic Qualification" gates={basic_qualification} />
        <GateColumn title="Deep Qualification" gates={deep_qualification} />
      </div>
    </div>
  )
}

function GateColumn({ title, gates }: { title: string; gates: Gate[] }) {
  const allPassed = gates.every((g) => g.passed)
  const failCount = gates.filter((g) => !g.passed).length

  return (
    <div className="rounded-lg border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
        <span className="text-sm font-semibold text-slate-700">{title}</span>
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
            allPassed
              ? "bg-emerald-100 text-emerald-700"
              : "bg-red-100 text-red-700"
          }`}
          aria-label={allPassed ? "All gates passed" : `${failCount} gate${failCount > 1 ? "s" : ""} failed`}
        >
          {allPassed ? "PASS" : "FAIL"}
        </span>
      </div>
      <div className="divide-y divide-slate-100">
        {gates.map((gate, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors"
          >
            {gate.passed ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" aria-hidden="true" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500 shrink-0" aria-hidden="true" />
            )}
            <span className="text-sm font-medium text-slate-700 flex-1">{gate.name}</span>
            <span className="text-xs text-slate-400">{gate.actual}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
