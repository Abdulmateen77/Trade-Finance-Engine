export interface Prospect {
  id: string
  name: string
  country: string
  founded: number
  industry: string
  revenue_gbp: number
  requested_limit_gbp: number
  supplier_country: string
}

export const PROSPECTS: Prospect[] = [
  {
    id: "atlantic",
    name: "Atlantic Components Ltd",
    country: "UK",
    founded: 2019,
    industry: "Electronics import/distribution",
    revenue_gbp: 2400000,
    requested_limit_gbp: 150000,
    supplier_country: "China",
  },
  {
    id: "nordic",
    name: "Nordic Apparel Co.",
    country: "UK",
    founded: 2017,
    industry: "Apparel import/wholesale",
    revenue_gbp: 4800000,
    requested_limit_gbp: 200000,
    supplier_country: "China",
  },
  {
    id: "sunrise",
    name: "Sunrise Trading Ltd",
    country: "UK",
    founded: 2024,
    industry: "Home goods import",
    revenue_gbp: 490000,
    requested_limit_gbp: 50000,
    supplier_country: "China",
  },
]
