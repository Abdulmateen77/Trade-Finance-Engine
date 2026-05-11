import { FileSignature, FileText, Receipt, Shield, Stamp } from "lucide-react"

export function ContractChecklistPreview() {
  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-slate-700">Will generate</h4>

      <div className="space-y-2">
        <Item icon={Receipt} text="Pricing terms (APR, tenor, fees) based on risk profile" />
        <Item icon={FileText} text="Deal-specific facility agreement referencing the supplier and goods" />
        <Item icon={Shield} text="Covenants derived from underwriting red flags" />
        <Item icon={FileSignature} text="Repayment schedule (weekly direct debit)" />
        <Item icon={Stamp} text="Personal guarantee requirement" />
        <Item icon={FileText} text="Downloadable .docx ready for DocuSign" />
      </div>

      <p className="text-xs italic text-slate-400 pt-2">
        DocuSign integration is a single API call, intentionally not wired for this demo — the contract output is ready for envelope creation.
      </p>
    </div>
  )
}

function Item({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
      <span className="text-sm text-slate-600">{text}</span>
    </div>
  )
}
