/**
 * One-line summary generators for each agent's output.
 */

function formatGbp(value: unknown): string {
  if (typeof value !== "number") return `£${value}`
  if (value >= 1_000_000) return `£${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `£${Math.round(value / 1_000)}k`
  return `£${Math.round(value)}`
}

export function intakeSummary(output: Record<string, unknown> | null): string {
  if (!output) return ""
  const intake = output.intake_output as Record<string, unknown> | undefined
  if (!intake) return "Output received."

  const txCount = intake.transaction_count ?? "?"
  const confidence = typeof intake.confidence === "number" ? intake.confidence.toFixed(2) : "?"
  const missing = Array.isArray(intake.missing_items) ? intake.missing_items.length : 0

  return `Parsed ${txCount} transactions. Confidence ${confidence}. ${missing} missing item${missing !== 1 ? "s" : ""}.`
}

export function underwritingSummary(output: Record<string, unknown> | null): {
  text: string
  decisionColor: string
} {
  if (!output) return { text: "", decisionColor: "text-slate-600" }
  const uw = output.underwriting_output as Record<string, unknown> | undefined
  if (!uw) return { text: "Output received.", decisionColor: "text-slate-600" }

  const decision = (uw.decision as string) || "UNKNOWN"
  const limits = uw.recommended_limits as Record<string, unknown> | undefined
  const limit = limits?.total_gbp ?? limits?.recommended_limit_gbp ?? limits?.final_limit_gbp
  const flags = Array.isArray(uw.risk_flags) ? uw.risk_flags.length : 0

  const colorMap: Record<string, string> = {
    APPROVE: "text-emerald-600",
    APPROVE_WITH_CONDITIONS: "text-amber-600",
    REQUEST_INFO: "text-blue-600",
    REJECT: "text-red-600",
  }

  const formattedLimit = limit != null ? formatGbp(limit) : "£?"

  return {
    text: `Decision: ${decision}. Recommended limit ${formattedLimit}. ${flags} risk flag${flags !== 1 ? "s" : ""}.`,
    decisionColor: colorMap[decision] || "text-slate-600",
  }
}

export function contractSummary(output: Record<string, unknown> | null): string {
  if (!output) return ""
  const contract = output.contract_output as Record<string, unknown> | undefined
  if (!contract) return "Output received."

  const terms = contract.contract_terms as Record<string, unknown> | undefined
  if (!terms) return "Contract drafted."

  const facility = terms.facility_size_gbp ?? terms.facility_amount_gbp ?? terms.credit_limit_gbp
  const rate = terms.rate_apr_pct ?? terms.interest_rate_apr ?? terms.apr
  const tenor = terms.tenor_days ?? terms.repayment_period_days

  const formattedFacility = facility != null ? formatGbp(facility) : "£?"
  const formattedRate = rate != null ? `${rate}%` : "?%"
  const formattedTenor = tenor != null ? `${tenor}` : "?"

  return `Contract drafted. Facility ${formattedFacility}. ${formattedRate} APR over ${formattedTenor} days.`
}
