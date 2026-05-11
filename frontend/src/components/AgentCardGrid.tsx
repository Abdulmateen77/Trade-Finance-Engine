import { useState } from "react"
import { AgentCard } from "@/components/AgentCard"
import { AgentDetailDialog } from "@/components/AgentDetailDialog"
import { deriveAgentStates, type AgentSlug } from "@/lib/deriveAgentState"
import type { AgentEvent } from "@/types/events"

interface AgentCardGridProps {
  events: AgentEvent[]
  prospectId: string
}

type OpenAgent = { agent: AgentSlug; defaultTab: "output" | "checklist" } | null

export function AgentCardGrid({ events, prospectId }: AgentCardGridProps) {
  const [openAgent, setOpenAgent] = useState<OpenAgent>(null)
  const states = deriveAgentStates(events)

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <AgentCard
          agent="intake"
          state={states.intake}
          stepNumber={2}
          onOpen={(agent, tab) => setOpenAgent({ agent, defaultTab: tab })}
        />
        <AgentCard
          agent="underwriting"
          state={states.underwriting}
          stepNumber={3}
          onOpen={(agent, tab) => setOpenAgent({ agent, defaultTab: tab })}
        />
        <AgentCard
          agent="contract"
          state={states.contract}
          stepNumber={4}
          onOpen={(agent, tab) => setOpenAgent({ agent, defaultTab: tab })}
        />
      </div>

      <AgentDetailDialog
        open={openAgent !== null}
        onOpenChange={(o) => { if (!o) setOpenAgent(null) }}
        agent={openAgent?.agent ?? null}
        state={openAgent ? states[openAgent.agent] : null}
        prospectId={prospectId}
        defaultTab={openAgent?.defaultTab ?? "checklist"}
      />
    </>
  )
}
