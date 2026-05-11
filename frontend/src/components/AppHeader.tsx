import { Loader2, Play, RotateCcw, Waves } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PROSPECTS } from "@/data/prospects"
import type { PipelineState } from "@/lib/usePipeline"

interface AppHeaderProps {
  prospectId: string
  setProspectId: (id: string) => void
  pipeline: PipelineState
}

export function AppHeader({ prospectId, setProspectId, pipeline }: AppHeaderProps) {
  const { status, events, totalTokens, totalLatencyMs, run, reset } = pipeline
  const isStreaming = status === "streaming"
  const hasEvents = events.length > 0

  const badgeVariant =
    status === "done"
      ? "secondary"
      : status === "error"
        ? "destructive"
        : status === "streaming"
          ? "default"
          : "outline"

  const badgeLabel =
    status === "idle"
      ? "Idle"
      : status === "streaming"
        ? "Streaming"
        : status === "done"
          ? "Complete"
          : "Error"

  return (
    <div className="space-y-3">
      {/* Main header row */}
      <div className="flex items-center justify-between">
        {/* Left: logo + title */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 text-white">
            <Waves className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 leading-tight">OceanX AI</p>
            <p className="text-xs text-slate-500 leading-tight">Underwriting Pipeline</p>
          </div>
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-4">
          {/* Select with label */}
          <div>
            <p className="text-xs uppercase tracking-wide font-semibold text-slate-500 mb-1.5">Select Company</p>
            <Select value={prospectId} onValueChange={setProspectId} disabled={isStreaming}>
              <SelectTrigger className="w-[200px] h-9 text-sm">
                <SelectValue placeholder="Select prospect" />
              </SelectTrigger>
              <SelectContent>
                {PROSPECTS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 pt-5">
            <Switch disabled id="step-through" />
            <label
              htmlFor="step-through"
              className="text-xs text-slate-500 cursor-default"
            >
              Step Through
            </label>
          </div>

          {/* Run Pipeline — prominent */}
          <div className="pt-5">
            <button
              onClick={() => run(prospectId)}
              disabled={isStreaming}
              className={`inline-flex items-center justify-center rounded-lg px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                isStreaming
                  ? "bg-slate-700 opacity-70 cursor-not-allowed"
                  : "bg-gradient-to-r from-slate-900 to-slate-700 hover:from-slate-800 hover:to-slate-600 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
              }`}
            >
              {isStreaming ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running pipeline...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Pipeline
                </>
              )}
            </button>
          </div>

          <div className="pt-5">
            <Button
              size="sm"
              variant="ghost"
              onClick={reset}
              disabled={isStreaming || !hasEvents}
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Stats row — only visible when events are flowing */}
      {hasEvents && (
        <div className="flex items-center gap-4 text-xs">
          <Badge variant={badgeVariant} className="text-[10px] px-2 py-0.5">
            {badgeLabel}
          </Badge>
          <span className="text-slate-500">
            Tokens: <span className="font-medium text-slate-700">{totalTokens.toLocaleString()}</span>
          </span>
          <span className="text-slate-500">
            Cost: <span className="font-medium text-slate-700">${(totalTokens / 1_000_000 * 6).toFixed(2)}</span>
          </span>
          <span className="text-slate-500">
            Total latency:{" "}
            <span className="font-medium text-slate-700">
              {(totalLatencyMs / 1000).toFixed(1)}s
            </span>
          </span>
          <span className="text-slate-500">
            Events: <span className="font-medium text-slate-700">{events.length}</span>
          </span>
        </div>
      )}

      {/* Bottom border */}
      <div className="border-b border-slate-200" />
    </div>
  )
}
