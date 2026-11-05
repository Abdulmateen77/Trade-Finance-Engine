import { useCallback, useRef, useState } from "react"
import type { AgentEvent, PipelineStatus } from "@/types/events"

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000"

export interface PipelineState {
  status: PipelineStatus
  events: AgentEvent[]
  totalTokens: number
  totalLatencyMs: number
  run: (prospectId: string) => void
  reset: () => void
}

export function usePipeline(): PipelineState {
  const [status, setStatus] = useState<PipelineStatus>("idle")
  const [events, setEvents] = useState<AgentEvent[]>([])
  const [totalTokens, setTotalTokens] = useState(0)
  const [totalLatencyMs, setTotalLatencyMs] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  const reset = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
    setStatus("idle")
    setEvents([])
    setTotalTokens(0)
    setTotalLatencyMs(0)
  }, [])

  const run = useCallback((prospectId: string) => {
    // Abort any existing stream
    if (abortRef.current) {
      abortRef.current.abort()
    }

    const controller = new AbortController()
    abortRef.current = controller

    setEvents([])
    setTotalTokens(0)
    setTotalLatencyMs(0)
    setStatus("streaming")

    const consume = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/run-pipeline?prospect_id=${encodeURIComponent(prospectId)}`,
          { signal: controller.signal }
        )

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error("No readable stream available")
        }

        const decoder = new TextDecoder()
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            if (buffer.trim()) {
              processBuffer(buffer)
            }
            setStatus("done")
            return
          }

          buffer += decoder.decode(value, { stream: true })
          const messages = buffer.split("\n\n")
          buffer = messages.pop() || ""

          for (const message of messages) {
            processBuffer(message)
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          // User cancelled — don't set error state
          return
        }
        console.error("Pipeline error:", err)
        setStatus("error")
      }
    }

    const processBuffer = (message: string) => {
      const lines = message.split("\n")
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const jsonStr = line.slice(6)
          try {
            const event = JSON.parse(jsonStr) as AgentEvent
            setEvents((prev) => [...prev, event])

            // Accumulate tokens
            if (event.tokens_used) {
              setTotalTokens((prev) => prev + event.tokens_used!)
            }
            // Accumulate latency from output events
            if (event.latency_ms && event.event_type === "output") {
              setTotalLatencyMs((prev) => prev + event.latency_ms!)
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }

    consume()
  }, [])

  return { status, events, totalTokens, totalLatencyMs, run, reset }
}
