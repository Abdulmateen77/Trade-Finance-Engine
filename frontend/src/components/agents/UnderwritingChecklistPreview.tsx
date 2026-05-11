import { ListChecks } from "lucide-react"
import { Separator } from "@/components/ui/separator"

export function UnderwritingChecklistPreview() {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-slate-700">Will evaluate against OceanX playbook</h4>

      <Section title="Basic qualification">
        <Item text="Annual revenue ≥ USD 1M" />
        <Item text="Approved country (UK, US, Nordics, etc.)" />
        <Item text="Business tenure ≥ 2 years" />
        <Item text="Imports physical goods" />
      </Section>

      <Separator />

      <Section title="Deep qualification">
        <Item text="Debt ratio ≤ 10% of revenue" />
        <Item text="Gross margin ≥ 30%" />
        <Item text="Cash runway > 6 months" />
        <Item text="Overdue AP ≤ 20%" />
        <Item text="ADB sufficient for weekly debits" />
      </Section>

      <Separator />

      <Section title="Credit limit methods">
        <Item text="Method A: 10 × ADB with adjustments" />
        <Item text="Method B: 20% of annual revenue cap (10% import + 10% inventory)" />
        <Item text="Recommended = min(A, B), default 50/50 split" />
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  )
}

function Item({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2">
      <ListChecks className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
      <span className="text-sm text-slate-600">{text}</span>
    </div>
  )
}
