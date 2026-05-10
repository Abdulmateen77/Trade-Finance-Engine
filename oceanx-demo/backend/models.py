from pydantic import BaseModel
from typing import Literal
from enum import Enum


class IntakeOutput(BaseModel):
    company_name: str
    country: str
    business_tenure_years: float
    business_model: str
    requested_limit_gbp: float
    data_sources: list[dict]        # [{"source": "connected_bank", "trust": "high"}, ...]
    supplier_summary: dict
    order_summary: dict
    financials_summary: dict        # revenue, gross_margin_pct, net_profit, cash, debt, dso, ap_total, ap_overdue_pct, monthly_opex
    liquidity_summary: dict         # adb_90d, min_daily_balance, balance_volatility, nsf_count, one_off_injections
    cash_cycle_months: float | None
    transaction_count: int
    transaction_period: str
    missing_items: list[str]
    data_quality_notes: list[str]
    confidence: float


class RedFlag(BaseModel):
    severity: Literal["low", "medium", "high"]
    description: str


class DecisionOutcome(str, Enum):
    APPROVE = "APPROVE"
    APPROVE_WITH_CONDITIONS = "APPROVE_WITH_CONDITIONS"
    REQUEST_INFO = "REQUEST_INFO"
    REJECT = "REJECT"


class EligibilityGate(BaseModel):
    name: str
    threshold: str
    actual: str
    passed: bool


class UnderwritingOutput(BaseModel):
    customer_summary: dict
    data_coverage: dict
    basic_qualification: list[EligibilityGate]
    deep_qualification: list[EligibilityGate]
    key_metrics: dict
    method_a_liquidity: dict
    method_b_revenue_caps: dict
    recommended_limits: dict
    repayment_fit: dict
    risk_flags: list[RedFlag]
    impact_of_capital: dict
    decision: DecisionOutcome
    decision_rationale: list[str]
    next_actions: list[str]
    confidence: float
    # Supervisor sets this field — agents never set it directly
    requires_human_review: bool


class ContractOutput(BaseModel):
    contract_terms: dict
    pricing_rationale: str
    contract_draft_md: str          # markdown draft for preview
    contract_docx_path: str         # path to generated .docx
    confidence: float
    edge_cases_flagged: list[str]


class AgentEvent(BaseModel):
    agent: Literal["intake", "underwriting", "contract", "supervisor"]
    event_type: Literal["status", "reasoning_chunk", "output", "flag", "error"]
    payload: dict
    timestamp: str
    latency_ms: int | None = None
    tokens_used: int | None = None
