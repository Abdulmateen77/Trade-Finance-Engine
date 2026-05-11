import { ShieldOff, X } from "lucide-react"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatusBadge } from "@/components/StatusBadge"
import type { AgentSlug, AgentState } from "@/lib/deriveAgentState"
import { contractSummary, intakeSummary, underwritingSummary } from "@/lib/summaries"
import { IntakeChecklistPreview } from "@/components/agents/IntakeChecklistPreview"
import { IntakeOutputView } from "@/components/agents/IntakeOutputView"
import { UnderwritingChecklistPreview } from "@/components/agents/UnderwritingChecklistPreview"
import { UnderwritingOutputView } from "@/components/agents/UnderwritingOutputView"
import { ContractChecklistPreview } from "@/components/agents/ContractChecklistPreview"
import { ContractOutputView } from "@/components/agents/ContractOutputView"

interface AgentDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  agent: AgentSlug | null
  state: AgentState | null
  prospectId: string
  defaultTab?: "output" | "checklist"
}

const agentMeta: Record<AgentSlug, { title: string; subtitle: string; step: number }> = {
  intake: { title: "Intake Agent", subtitle: "Parses deal package, validates data sources", step: 2 },
  underwriting: { title: "Underwriting Agent", subtitle: "Applies OceanX playbook: gates, ADB, risk scoring", step: 3 },
  contract: { title: "Contract Agent", subtitle: "Drafts deal-specific facility agreement", step: 4 },
}

function getSummaryText(agent: AgentSlug, output: Record<string, unknown> | null): string {
  if (!output) return ""
  if (agent === "intake") return intakeSummary(output)
  if (agent === "underwriting") return underwritingSummary(output).text
  if (agent === "contract") return contractSummary(output)
  return ""
}

export function AgentDetailDialog({ open, onOpenChange, agent, state, prospectId, defaultTab: propDefaultTab }: AgentDetailDialogProps) {
  if (!agent || !state) return null

  const meta = agentMeta[agent]
  const hasOutput = state.status === "done" || state.status === "flagged"
  const hasError = state.status === "error"
  const showOutputTab = hasOutput || state.status === "skipped"

  const computedDefault = hasError ? "error" : hasOutput || state.status === "skipped" ? "output" : "checklist"
  const defaultTab = propDefaultTab && (propDefaultTab === "output" && showOutputTab) ? "output" : propDefaultTab === "checklist" ? "checklist" : computedDefault
  const summaryText = hasOutput ? getSummaryText(agent, state.output) : ""

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[92vw] max-h-[85vh] overflow-y-auto p-0 bg-white">
        {/* Custom sticky header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-8 py-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                  Step {meta.step}
                </span>
                <StatusBadge status={state.status} />
              </div>
              <DialogTitle className="text-xl font-semibold text-slate-900">
                {meta.title}
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                {meta.subtitle}
              </DialogDescription>
            </div>
            <DialogClose className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
              <X className="h-5 w-5 text-slate-500" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>
          {summaryText && (
            <p className="text-sm text-slate-600 mt-3 pt-3 border-t border-slate-100">
              {summaryText}
            </p>
          )}
        </div>

        {/* Body */}
        <div className="px-8 py-6">
          <Tabs defaultValue={defaultTab} key={`${agent}-${state.status}`} className="w-full">
            <TabsList className="mb-6">
              {showOutputTab && <TabsTrigger value="output">Output</TabsTrigger>}
              <TabsTrigger value="checklist">Checklist</TabsTrigger>
              {hasError && <TabsTrigger value="error">Error</TabsTrigger>}
            </TabsList>

            {showOutputTab && (
              <TabsContent value="output" className="space-y-8">
                {state.status === "skipped" ? (
                  <SkippedPanel agent={agent} />
                ) : state.output ? (
                  <OutputForAgent agent={agent} output={state.output} prospectId={prospectId} />
                ) : null}
              </TabsContent>
            )}

            <TabsContent value="checklist" className="space-y-8">
              <ChecklistForAgent agent={agent} prospectId={prospectId} />
            </TabsContent>

            {hasError && (
              <TabsContent value="error" className="space-y-8">
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {state.errorMessage || "Unknown error occurred"}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {/* Footer hint */}
        <div className="px-8 pb-6">
          <p className="text-xs text-slate-400 text-right">Press Esc to close</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ChecklistForAgent({ agent, prospectId }: { agent: AgentSlug; prospectId: string }) {
  switch (agent) {
    case "intake":
      return <IntakeChecklistPreview prospectId={prospectId} />
    case "underwriting":
      return <UnderwritingChecklistPreview />
    case "contract":
      return <ContractChecklistPreview />
  }
}

function OutputForAgent({ agent, output, prospectId }: { agent: AgentSlug; output: Record<string, unknown>; prospectId: string }) {
  switch (agent) {
    case "intake":
      return <IntakeOutputView output={output} />
    case "underwriting":
      return <UnderwritingOutputView output={output} />
    case "contract":
      return <ContractOutputView output={output} prospectId={prospectId} />
  }
}

function SkippedPanel({ agent }: { agent: AgentSlug }) {
  if (agent === "contract") {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
        <ShieldOff className="h-12 w-12 text-slate-400" aria-hidden="true" />
        <h3 className="text-xl font-semibold text-slate-700">No contract generated</h3>
        <p className="text-sm text-slate-500 max-w-md">
          The supervisor halted the pipeline after underwriting returned REJECT. No contract is drafted for declined applications.
        </p>
        <p className="text-xs text-slate-400 max-w-sm italic">
          In production, the customer would receive a decline notification with the rationale from underwriting.
        </p>
      </div>
    )
  }
  return (
    <p className="text-sm text-slate-500 italic py-8 text-center">
      This agent was skipped — pipeline halted before it could run.
    </p>
  )
}
