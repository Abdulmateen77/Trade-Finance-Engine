export type AgentSlug = "intake" | "underwriting" | "contract"

interface StatusPhase {
  minMs: number
  message: string
}

const INTAKE_PHASES: StatusPhase[] = [
  { minMs: 0, message: "Reading deal package…" },
  { minMs: 2000, message: "Identifying data sources and trust levels…" },
  { minMs: 5000, message: "Extracting company and financial details…" },
  { minMs: 9000, message: "Counting transactions and validating periods…" },
  { minMs: 13000, message: "Checking data quality and completeness…" },
  { minMs: 17000, message: "Finalising structured output…" },
]

const UNDERWRITING_PHASES: StatusPhase[] = [
  { minMs: 0, message: "Loading deal data…" },
  { minMs: 3000, message: "Evaluating basic qualification gates…" },
  { minMs: 8000, message: "Running deep qualification checks…" },
  { minMs: 14000, message: "Computing Average Daily Balance from 90 days…" },
  { minMs: 20000, message: "Calculating credit limits (Method A and B)…" },
  { minMs: 27000, message: "Scanning bank transactions for anomalies…" },
  { minMs: 35000, message: "Assessing risk flags and severity…" },
  { minMs: 43000, message: "Building credit memo and decision rationale…" },
  { minMs: 52000, message: "Finalising decision and next actions…" },
]

const CONTRACT_PHASES: StatusPhase[] = [
  { minMs: 0, message: "Reading underwriting decision…" },
  { minMs: 3000, message: "Applying pricing logic for risk profile…" },
  { minMs: 7000, message: "Drafting facility terms and covenants…" },
  { minMs: 14000, message: "Composing contract clauses…" },
  { minMs: 25000, message: "Adding deal-specific covenants from risk flags…" },
  { minMs: 38000, message: "Generating Word document…" },
  { minMs: 50000, message: "Finalising signature blocks…" },
]

export function getCuratedStatus(
  agent: AgentSlug,
  elapsedMs: number,
): string {
  const phases =
    agent === "intake"
      ? INTAKE_PHASES
      : agent === "underwriting"
        ? UNDERWRITING_PHASES
        : CONTRACT_PHASES

  let current = phases[0]
  for (const phase of phases) {
    if (elapsedMs >= phase.minMs) {
      current = phase
    }
  }
  return current.message
}
