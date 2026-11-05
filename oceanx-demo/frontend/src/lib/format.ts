export function formatGBP(n: unknown): string {
  if (typeof n !== "number") return `£${n ?? "?"}`
  if (n >= 1_000_000) return `£${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `£${Math.round(n / 1_000)}k`
  return `£${Math.round(n)}`
}

export function formatGBPFull(n: unknown): string {
  if (typeof n !== "number") return `£${n ?? "?"}`
  return `£${n.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`
}

export function formatPercent(n: unknown, decimals = 1): string {
  if (typeof n !== "number") return `${n ?? "?"}%`
  return `${n.toFixed(decimals)}%`
}

export function formatNumber(n: unknown): string {
  if (typeof n !== "number") return String(n ?? "?")
  return n.toLocaleString("en-GB")
}

export function formatLatency(ms: unknown): string {
  if (typeof ms !== "number") return "?"
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.round(ms)}ms`
}
