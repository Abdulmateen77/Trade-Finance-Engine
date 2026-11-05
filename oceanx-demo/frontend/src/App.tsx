import { useState } from "react"
import { AppHeader } from "@/components/AppHeader"
import { VendorVerifyCard } from "@/components/VendorVerifyCard"
import { AgentCardGrid } from "@/components/AgentCardGrid"
import { AuditLogPanel } from "@/components/AuditLogPanel"
import { Toaster } from "@/components/ui/toaster"
import { usePipeline } from "@/lib/usePipeline"
import { PROSPECTS } from "@/data/prospects"

function App() {
  const [prospectId, setProspectId] = useState("atlantic")
  const pipeline = usePipeline()
  const selectedProspect = PROSPECTS.find((p) => p.id === prospectId)!

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl px-6 py-8 flex flex-col gap-6">
        <AppHeader
          prospectId={prospectId}
          setProspectId={setProspectId}
          pipeline={pipeline}
        />
        <VendorVerifyCard prospect={selectedProspect} />
        <AgentCardGrid events={pipeline.events} prospectId={prospectId} />
        <AuditLogPanel
          events={pipeline.events}
          totalTokens={pipeline.totalTokens}
          totalLatencyMs={pipeline.totalLatencyMs}
        />
      </div>
      <Toaster />
    </div>
  )
}

export default App
