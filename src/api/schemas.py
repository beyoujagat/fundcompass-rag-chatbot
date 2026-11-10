"""Pydantic schemas for Fund Compass API and Canonical Data Models."""

from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field, field_validator


class ChatRequest(BaseModel):
    """User conversational request model with strict validation."""

    message: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        description="User query about mutual funds (1-1000 characters)",
    )

    @field_validator("message")
    @classmethod
    def validate_message_non_empty(cls, v: str) -> str:
        """Rejects empty or whitespace-only queries with HTTP 422."""
        stripped = v.strip()
        if not stripped:
            raise ValueError("Message cannot be empty or whitespace-only.")
        if len(stripped) > 1000:
            raise ValueError("Message cannot exceed 1000 characters.")
        return stripped


class ChatResponse(BaseModel):
    """Compliance-checked conversational response model."""

    reply: str = Field(..., description="Fact-only, compliance-checked response text")
    intent: str = Field(..., description="Identified query intent category")
    scheme_id: Optional[str] = Field(
        None, description="Canonical scheme ID if identified, else None"
    )
    source_url: Optional[str] = Field(
        None, description="Verified official source URL citation"
    )
    last_updated: str = Field(
        ..., description="Timestamp of the source data (YYYY-MM-DD)"
    )


class SchemeFacts(BaseModel):
    """Canonical 10-field mutual fund factual parameter model."""

    expense_ratio: str = Field(
        ..., description="Direct plan expense ratio percentage e.g. '0.76%'"
    )
    exit_load: str = Field(
        ..., description="Exit load rules and redemption holding period"
    )
    min_sip_amount: str = Field(
        ..., description="Minimum SIP installment amount e.g. '₹100'"
    )
    min_lumpsum_amount: str = Field(
        ..., description="Minimum initial lumpsum investment e.g. '₹100'"
    )
    lock_in_period: str = Field(
        ..., description="Statutory or scheme lock-in period e.g. 'Nil' or '3 Years'"
    )
    riskometer: str = Field(
        ..., description="SEBI Riskometer classification e.g. 'Very High'"
    )
    benchmark: str = Field(
        ..., description="Official benchmark index e.g. 'NIFTY Midcap 150 TRI'"
    )
    fund_manager: str = Field(..., description="Designated fund manager(s)")
    factsheet_url: str = Field(..., description="Official AMC factsheet URL")
    statement_download_process: str = Field(
        ..., description="Official procedure to download statements"
    )


class SchemeItem(BaseModel):
    """Canonical scheme item schema."""

    scheme_id: str = Field(..., description="Unique slug identifier for scheme")
    scheme_name: str = Field(..., description="Official scheme name")
    amc: str = Field(..., description="Asset Management Company")
    category: str = Field(..., description="SEBI mutual fund category")
    source_url: str = Field(..., description="Official Groww scheme fact page URL")
    last_updated: str = Field(..., description="Date of verification (YYYY-MM-DD)")
    facts: Union[SchemeFacts, Dict[str, Any]] = Field(
        ..., description="Canonical facts object"
    )
    aliases: Optional[List[str]] = Field(
        default_factory=list, description="Common aliases and abbreviations"
    )


class HealthResponse(BaseModel):
    """System health monitor response schema."""

    status: str = Field("ok", description="Service health indicator")
    app: str = Field("Fund Compass", description="Application name")
    version: str = Field("2.0.0", description="Application version")
    disclaimer: str = Field(
        ..., description="Regulatory facts-only compliance disclaimer"
    )
