import { useState } from "react"
import {
  Banknote,
  Building2,
  Calculator,
  Calendar,
  Check,
  ChevronDown,
  FileUp,
  MessageSquare,
  MinusCircle,
  ShoppingBag,
  TrendingUp,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent } from "@/components/ui/collapsible"
import type { Prospect } from "@/data/prospects"
import { PROSPECT_SOURCES } from "@/data/prospectSources"

interface VendorVerifyCardProps {
  prospect: Prospect
}

function formatRevenue(gbp: number): string {
  if (gbp >= 1_000_000) return `£${(gbp / 1_000_000).toFixed(1)}M`
  if (gbp >= 1_000) return `£${(gbp / 1_000).toFixed(0)}k`
  return `£${gbp}`
}

function formatLimit(gbp: number): string {
  if (gbp >= 1_000_000) return `£${(gbp / 1_000_000).toFixed(1)}M`
  return `£${(gbp / 1_000).toFixed(0)}k`
}

function countryFlag(country: string): string {
  const flags: Record<string, string> = { UK: "🇬🇧", China: "🇨🇳", India: "🇮🇳", Turkey: "🇹🇷" }
  return flags[country] || "🌍"
}

export function VendorVerifyCard({ prospect }: VendorVerifyCardProps) {
  const [sourcesExpanded, setSourcesExpanded] = useState(false)
  const sources = PROSPECT_SOURCES[prospect.id] || PROSPECT_SOURCES.atlantic

  const optionalConnected = sources.ecom ? 1 : 0

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-[1px] hover:shadow-md">
      {/* PART 1 — Company summary */}
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
          Step 1
        </span>
        <Badge
          variant="secondary"
          className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[11px]"
        >
          <Check className="mr-1 h-3 w-3" />
          Verified
        </Badge>
      </div>

      <h2 className="text-2xl font-semibold text-slate-900 mb-3">{prospect.name}</h2>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Chip>{countryFlag(prospect.country)} {prospect.country}</Chip>
        <Chip><Calendar className="mr-1 h-3 w-3 text-slate-400" />{prospect.founded}</Chip>
        <Chip><Building2 className="mr-1 h-3 w-3 text-slate-400" />{prospect.industry}</Chip>
        <Chip><TrendingUp className="mr-1 h-3 w-3 text-slate-400" />{formatRevenue(prospect.revenue_gbp)} revenue</Chip>
      </div>

      <p className="text-sm text-slate-500">
        Customer meeting checkpoint complete → Requested limit{" "}
        <span className="font-medium text-slate-700">{formatLimit(prospect.requested_limit_gbp)}</span>{" "}
        for goods from{" "}
        <span className="font-medium text-slate-700">{countryFlag(prospect.supplier_country)} {prospect.supplier_country}</span>
      </p>

      {/* Divider */}
      <div className="border-t border-slate-200 my-4" />

      {/* PART 3 — Data Sources (collapsible) */}
      <Collapsible open={sourcesExpanded} onOpenChange={setSourcesExpanded}>
        {/* Collapsed summary row — always visible */}
        <div
          className="flex items-center justify-between cursor-pointer select-none py-1"
          onClick={() => setSourcesExpanded(!sourcesExpanded)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              setSourcesExpanded(!sourcesExpanded)
            }
          }}
          role="button"
          tabIndex={0}
          aria-expanded={sourcesExpanded}
        >
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wide font-semibold text-slate-500">Data Sources</span>
            {/* Status dots */}
            <div className="flex items-center gap-1">
              <Dot connected={!!sources.bank} />
              <Dot connected={!!sources.accounting} />
              <Dot connected={!!sources.ecom} />
              <Dot connected={false} />
              <Dot connected={false} />
            </div>
            <span className="text-xs text-slate-400">
              2 required connected · {optionalConnected} optional
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
              <Check className="h-2.5 w-2.5" aria-hidden="true" />
              Ready
            </span>
            <ChevronDown
              className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${sourcesExpanded ? "rotate-180" : ""}`}
            />
          </div>
        </div>

        {/* Expanded content */}
        <CollapsibleContent>
          <div className="mt-4 space-y-0">
            <SourceRow
              icon={Banknote}
              title="Bank Account"
              required
              provider={sources.bank?.provider || "—"}
              trustLabel="High trust"
              trustStyle="bg-emerald-50 text-emerald-700"
              detail={sources.bank?.detail || "Not connected"}
              connected={!!sources.bank}
            />
            <SourceRow
              icon={Calculator}
              title="Accounting"
              required
              provider={sources.accounting?.provider || "—"}
              trustLabel="High trust"
              trustStyle="bg-emerald-50 text-emerald-700"
              detail={sources.accounting?.detail || "Not connected"}
              connected={!!sources.accounting}
            />
            <SourceRow
              icon={ShoppingBag}
              title="E-commerce"
              required={false}
              provider={sources.ecom?.provider || "—"}
              trustLabel="Medium-high trust"
              trustStyle="bg-amber-50 text-amber-700"
              detail={sources.ecom?.detail || "Not connected — skipped for SMB customer"}
              connected={!!sources.ecom}
            />
            <SourceRow
              icon={FileUp}
              title="Documents"
              required={false}
              provider="Upload"
              trustLabel="Supporting only"
              trustStyle="bg-slate-100 text-slate-500"
              detail="No documents uploaded"
              connected={false}
            />
            <SourceRow
              icon={MessageSquare}
              title="Meeting Notes"
              required={false}
              provider="HubSpot"
              trustLabel="Context only"
              trustStyle="bg-slate-100 text-slate-500"
              detail="No meeting notes available"
              connected={false}
              isLast
            />
          </div>

          <Separator className="mt-4 mb-3" />
          <p className="text-xs italic text-slate-500">
            Trust hierarchy: Bank &gt; Accounting &gt; E-commerce &gt; Documents &gt; Notes. If sources conflict, the highest-trust source wins.
          </p>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

function Dot({ connected }: { connected: boolean }) {
  return (
    <span
      className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500" : "bg-slate-300"}`}
      aria-hidden="true"
    />
  )
}

function SourceRow({
  icon: Icon,
  title,
  required,
  provider,
  trustLabel,
  trustStyle,
  detail,
  connected,
  isLast,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  required: boolean
  provider: string
  trustLabel: string
  trustStyle: string
  detail: string
  connected: boolean
  isLast?: boolean
}) {
  return (
    <div className={`flex items-center gap-4 py-3 ${!isLast ? "border-b border-slate-100" : ""}`}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-50">
        <Icon className="h-4 w-4 text-slate-500" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-slate-700">{title}</span>
          {required ? (
            <span className="rounded-full bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-medium text-red-700">Required</span>
          ) : (
            <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600">Optional</span>
          )}
          <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-500">{provider}</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${trustStyle}`}>{trustLabel}</span>
        </div>
        <p className="text-xs text-slate-500 mt-0.5 truncate">{detail}</p>
      </div>
      {connected ? (
        <span className="inline-flex items-center gap-1 shrink-0 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-medium text-emerald-700">
          <Check className="h-3 w-3" aria-hidden="true" />
          Connected
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 shrink-0 rounded-full bg-slate-50 border border-slate-200 px-2.5 py-0.5 text-[10px] font-medium text-slate-400">
          <MinusCircle className="h-3 w-3" aria-hidden="true" />
          Skipped
        </span>
      )}
    </div>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-md bg-slate-50 border border-slate-200 px-2 py-1 text-xs text-slate-600">
      {children}
    </span>
  )
}
