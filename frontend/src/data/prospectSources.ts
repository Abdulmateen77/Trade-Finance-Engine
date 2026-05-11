export interface SourceInfo {
  provider: string
  detail: string
}

export interface ProspectSources {
  bank: SourceInfo | null
  accounting: SourceInfo | null
  ecom: SourceInfo | null
  uploads: null
  notes: null
}

export const PROSPECT_SOURCES: Record<string, ProspectSources> = {
  atlantic: {
    bank: { provider: "Plaid", detail: "2 accounts, 67 transactions, 90 days daily balances" },
    accounting: { provider: "Xero", detail: "FY2025 financials, AP aging, P&L" },
    ecom: { provider: "Shopify", detail: "B2B channel mix, order data" },
    uploads: null,
    notes: null,
  },
  nordic: {
    bank: { provider: "Plaid", detail: "3 accounts, 142 transactions, 90 days daily balances" },
    accounting: { provider: "Xero", detail: "FY2025 financials, AP aging, P&L" },
    ecom: { provider: "Shopify", detail: "B2C + wholesale channel mix" },
    uploads: null,
    notes: null,
  },
  sunrise: {
    bank: { provider: "Plaid", detail: "1 account, 38 transactions, 90 days daily balances" },
    accounting: { provider: "Xero", detail: "FY2024 financials (early-stage)" },
    ecom: null,
    uploads: null,
    notes: null,
  },
}
