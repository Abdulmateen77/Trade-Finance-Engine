import { useState } from "react"
import { AgentCard } from "@/components/AgentCard"
import { AgentDetailDialog } from "@/components/AgentDetailDialog"
import { deriveAgentStates, type AgentSlug } from "@/lib/deriveAgentState"
import type { AgentEvent } from "@/types/events"

interface AgentCardGridProps {
  events: AgentEvent[]
  prospectId: string
}

export function AgentCardGrid({ events, prospectId }: AgentCardGridProps) {
  const [openAgent, setOpenAgent] = useState<AgentSlug | null>(null)
  const states = deriveAgentStates(events)

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <AgentCard
          agent="intake"
          state={states.intake}
          stepNumber={2}
          onOpen={(a) => setOpenAgent(a)}
        />
        <AgentCard
          agent="underwriting"
          state={states.underwriting}
          stepNumber={3}
          onOpen={(a) => setOpenAgent(a)}
        />
        <AgentCard
          agent="contract"
          state={states.contract}
          stepNumber={4}
          onOpen={(a) => setOpenAgent(a)}
        />
      </div>

      <AgentDetailDialog
        open={openAgent !== null}
        onOpenChange={(o) => { if (!o) setOpenAgent(null) }}
        agent={openAgent}
        state={openAgent ? states[openAgent] : null}
        prospectId={prospectId}
      />
    </>
  )
}
