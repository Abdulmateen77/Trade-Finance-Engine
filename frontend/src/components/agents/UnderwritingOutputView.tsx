import { Info, XCircle } from "lucide-react"
import { DecisionBanner } from "@/components/agents/memo/DecisionBanner"
import { CustomerSummarySection } from "@/components/agents/memo/CustomerSummarySection"
import { DataCoverageSection } from "@/components/agents/memo/DataCoverageSection"
import { EligibilitySection } from "@/components/agents/memo/EligibilitySection"
import { KeyMetricsSection } from "@/components/agents/memo/KeyMetricsSection"
import { CreditLimitSection } from "@/components/agents/memo/CreditLimitSection"
import { RepaymentFitSection } from "@/components/agents/memo/RepaymentFitSection"
import { RiskFlagsSection } from "@/components/agents/memo/RiskFlagsSection"
import { ImpactSection } from "@/components/agents/memo/ImpactSection"
import { DecisionRationaleSection } from "@/components/agents/memo/DecisionRationaleSection"
import { NextActionsSection } from "@/components/agents/memo/NextActionsSection"

interface UnderwritingOutputViewProps {
  output: Record<string, unknown>
}

interface Gate {
  name: string
  threshold: string
  actual: string
  passed: boolean
}

export function UnderwritingOutputView({ output }: UnderwritingOutputViewProps) {
  const uw = (output.underwriting_output as Record<string, unknown>) || output

  const decision = String(uw.decision || "UNKNOWN")
  const confidence = typeof uw.confidence === "number" ? uw.confidence : 0
  const requiresHumanReview = Boolean(uw.requires_human_review)
  const recommendedLimits = (uw.recommended_limits as Record<string, unknown>) || {}
  const recommendedLimitGbp = (recommendedLimits.total_gbp as number) ?? null

  const customerSummary = (uw.customer_summary as Record<string, unknown>) || {}
  const dataCoverage = (uw.data_coverage as Record<string, unknown>) || {}
  const basicQualification = (uw.basic_qualification as Gate[]) || []
  const deepQualification = (uw.deep_qualification as Gate[]) || []
  const keyMetrics = (uw.key_metrics as Record<string, unknown>) || {}
  const methodA = (uw.method_a_liquidity as Record<string, unknown>) || {}
  const methodB = (uw.method_b_revenue_caps as Record<string, unknown>) || {}
  const repaymentFit = (uw.repayment_fit as Record<string, unknown>) || {}
  const riskFlags = (uw.risk_flags as Array<{ severity: string; description: string }>) || []
  const impactOfCapital = (uw.impact_of_capital as Record<string, unknown>) || {}
  const decisionRationale = (uw.decision_rationale as string[]) || []
  const nextActions = (uw.next_actions as string[]) || []

  // REJECT layout — different structure
  if (decision === "REJECT") {
    const failedGates = [...basicQualification, ...deepQualification].filter((g) => !g.passed)
    return (
      <div className="space-y-8">
        <DecisionBanner
          decision={decision}
          confidence={confidence}
          recommendedLimitGbp={null}
          requiresHumanReview={requiresHumanReview}
          declinedLabel="DECLINED"
        />

        {/* Reasons for decline */}
        {failedGates.length > 0 && (
          <div>
            <h4 className="text-xs uppercase tracking-wide font-semibold text-red-600 mb-3">Reasons for Decline</h4>
            <div className="space-y-2">
              {failedGates.map((gate, i) => (
                <div key={i} className="border-l-4 border-red-400 rounded-md bg-red-50 p-3 flex items-center gap-3">
                  <XCircle className="h-4 w-4 text-red-500 shrink-0" aria-hidden="true" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-red-800">{gate.name}</span>
                    <span className="text-xs text-red-600 ml-2">Actual: {gate.actual} (threshold: {gate.threshold})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <DecisionRationaleSection decision_rationale={decisionRationale} />
        <NextActionsSection next_actions={nextActions} />
        <RiskFlagsSection risk_flags={riskFlags} />

        {Object.keys(customerSummary).length > 0 && (
          <CustomerSummarySection customer_summary={customerSummary} />
        )}

        {Object.keys(keyMetrics).length > 0 && (
          <KeyMetricsSection key_metrics={keyMetrics} />
        )}

        {(basicQualification.length > 0 || deepQualification.length > 0) && (
          <EligibilitySection
            basic_qualification={basicQualification}
            deep_qualification={deepQualification}
          />
        )}
      </div>
    )
  }

  // REQUEST_INFO layout
  if (decision === "REQUEST_INFO") {
    return (
      <div className="space-y-8">
        <DecisionBanner
          decision={decision}
          confidence={confidence}
          recommendedLimitGbp={null}
          requiresHumanReview={requiresHumanReview}
          declinedLabel="PENDING REVIEW"
        />

        {/* Info banner */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" aria-hidden="true" />
          <p className="text-sm text-blue-800">
            Additional information required before underwriting can complete. See Next Actions below.
          </p>
        </div>

        {Object.keys(customerSummary).length > 0 && (
          <CustomerSummarySection customer_summary={customerSummary} />
        )}

        {Object.keys(dataCoverage).length > 0 && (
          <DataCoverageSection data_coverage={dataCoverage} />
        )}

        {(basicQualification.length > 0 || deepQualification.length > 0) && (
          <EligibilitySection
            basic_qualification={basicQualification}
            deep_qualification={deepQualification}
          />
        )}

        {Object.keys(keyMetrics).length > 0 && (
          <KeyMetricsSection key_metrics={keyMetrics} />
        )}

        <DecisionRationaleSection decision_rationale={decisionRationale} />

        {/* Highlighted Next Actions */}
        <div className="ring-2 ring-blue-200 ring-offset-2 rounded-lg p-1">
          <NextActionsSection next_actions={nextActions} />
        </div>

        <RiskFlagsSection risk_flags={riskFlags} />
      </div>
    )
  }

  // APPROVE / APPROVE_WITH_CONDITIONS — full dashboard
  return (
    <div className="space-y-8">
      <DecisionBanner
        decision={decision}
        confidence={confidence}
        recommendedLimitGbp={recommendedLimitGbp}
        requiresHumanReview={requiresHumanReview}
      />

      {Object.keys(customerSummary).length > 0 && (
        <CustomerSummarySection customer_summary={customerSummary} />
      )}

      {Object.keys(dataCoverage).length > 0 && (
        <DataCoverageSection data_coverage={dataCoverage} />
      )}

      {(basicQualification.length > 0 || deepQualification.length > 0) && (
        <EligibilitySection
          basic_qualification={basicQualification}
          deep_qualification={deepQualification}
        />
      )}

      {Object.keys(keyMetrics).length > 0 && (
        <KeyMetricsSection key_metrics={keyMetrics} />
      )}

      {(Object.keys(methodA).length > 0 || Object.keys(methodB).length > 0) && (
        <CreditLimitSection
          method_a_liquidity={methodA}
          method_b_revenue_caps={methodB}
          recommended_limits={recommendedLimits}
        />
      )}

      {Object.keys(repaymentFit).length > 0 && (
        <RepaymentFitSection repayment_fit={repaymentFit} />
      )}

      <RiskFlagsSection risk_flags={riskFlags} />

      {Object.keys(impactOfCapital).length > 0 && (
        <ImpactSection impact_of_capital={impactOfCapital} decision={decision} />
      )}

      <DecisionRationaleSection decision_rationale={decisionRationale} />
      <NextActionsSection next_actions={nextActions} />
    </div>
  )
}
