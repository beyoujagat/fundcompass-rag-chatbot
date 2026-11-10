"""Refusal Dispatcher and Response Generator for Fund Compass.

Implements Stage 3 of the compliance guardrail pipeline:
- Standardized advisory refusal directing users to official AMFI Investor Education.
- Performance request refusal redirecting users to official HDFC factsheet portal.
- Out-of-scope domain redirect prompting for mutual fund queries.
- Mandatory compliance footer injection: 'Last updated from sources: <YYYY-MM-DD>'.
- Enforces strict structural rules: <= 3 sentences and exactly 1 citation link.
"""

from dataclasses import dataclass
from typing import Optional

from src.config import DEFAULT_LAST_UPDATED, EDUCATIONAL_LINK
from src.guardrails.intent_classifier import QueryIntent

# Official Regulatory & AMC Resource URLs
AMFI_KNOWLEDGE_CENTER_URL: str = EDUCATIONAL_LINK or "https://www.amfiindia.com/investor-corner/knowledge-center"
HDFC_FACTSHEET_PORTAL_URL: str = "https://www.hdfcfund.com/investor-services/fund-performance/factsheet"


@dataclass
class RefusalResponse:
    """Structured response container for guardrail refusals."""
    reply: str
    intent: str
    source_url: Optional[str]
    last_updated: str


def format_footer(last_updated: str = DEFAULT_LAST_UPDATED) -> str:
    """Formats the mandatory compliance timestamp footer."""
    return f"\n\nLast updated from sources: {last_updated}"


def generate_advisory_refusal(last_updated: str = DEFAULT_LAST_UPDATED) -> str:
    """
    Generates a compliant refusal response for advisory, opinionated, or recommendation queries.
    Strictly adheres to:
    - Exactly 3 sentences.
    - Exactly 1 citation link (AMFI Investor Education portal).
    - Mandatory timestamp footer.
    """
    body = (
        "I cannot provide investment advice, fund recommendations, or subjective comparisons. "
        "Fund Compass is strictly a facts-only assistant designed to answer factual questions about mutual fund schemes. "
        f"For unbiased educational guidance on mutual funds, please visit the official AMFI Investor Education portal: {AMFI_KNOWLEDGE_CENTER_URL}"
    )
    return f"{body}{format_footer(last_updated)}"


def generate_performance_refusal(
    factsheet_url: str = HDFC_FACTSHEET_PORTAL_URL,
    last_updated: str = DEFAULT_LAST_UPDATED,
) -> str:
    """
    Refuses return calculations, past performance comparisons, or return predictions,
    pointing the user strictly to the official audited AMC factsheet portal.
    Strictly adheres to:
    - Maximum 3 sentences (2 sentences).
    - Exactly 1 citation link (Official factsheet URL).
    - Mandatory timestamp footer.
    """
    body = (
        "Fund Compass does not compute or compare historical return figures or future projections. "
        f"You can verify official, audited performance data and factsheets directly at: {factsheet_url}"
    )
    return f"{body}{format_footer(last_updated)}"


def generate_out_of_scope_response(last_updated: str = DEFAULT_LAST_UPDATED) -> str:
    """
    Handles non-mutual fund inquiries, general knowledge questions, and chit-chat.
    Prompts the user for objective mutual fund scheme parameters.
    """
    body = (
        "Fund Compass is dedicated exclusively to answering factual queries regarding mutual fund schemes. "
        f"Please ask an objective question regarding expense ratios, exit loads, SIP amounts, or scheme documentation: {AMFI_KNOWLEDGE_CENTER_URL}"
    )
    return f"{body}{format_footer(last_updated)}"


def generate_pii_refusal(last_updated: str = DEFAULT_LAST_UPDATED) -> str:
    """
    Generates standardized privacy refusal with mandatory timestamp footer.
    """
    body = (
        "For your privacy and security, Fund Compass strictly prohibits entering sensitive personal "
        "or financial details such as PAN, Aadhaar, account numbers, OTPs, or contact information. "
        "Please rephrase your question without including any personal data."
    )
    return f"{body}{format_footer(last_updated)}"


def dispatch_refusal(
    intent: QueryIntent,
    factsheet_url: Optional[str] = None,
    last_updated: str = DEFAULT_LAST_UPDATED,
) -> RefusalResponse:
    """
    Central refusal dispatcher mapping QueryIntent to its compliant refusal reply,
    citation source link, and intent label.
    """
    target_factsheet = factsheet_url or HDFC_FACTSHEET_PORTAL_URL

    if intent == QueryIntent.ADVISORY:
        return RefusalResponse(
            reply=generate_advisory_refusal(last_updated=last_updated),
            intent="advisory_refusal",
            source_url=AMFI_KNOWLEDGE_CENTER_URL,
            last_updated=last_updated,
        )

    if intent == QueryIntent.PERFORMANCE_REQUEST:
        return RefusalResponse(
            reply=generate_performance_refusal(factsheet_url=target_factsheet, last_updated=last_updated),
            intent="performance_refusal",
            source_url=target_factsheet,
            last_updated=last_updated,
        )

    if intent == QueryIntent.OUT_OF_SCOPE:
        return RefusalResponse(
            reply=generate_out_of_scope_response(last_updated=last_updated),
            intent="out_of_scope_refusal",
            source_url=AMFI_KNOWLEDGE_CENTER_URL,
            last_updated=last_updated,
        )

    # Fallback to advisory refusal for unrecognized refusal states
    return RefusalResponse(
        reply=generate_advisory_refusal(last_updated=last_updated),
        intent="advisory_refusal",
        source_url=AMFI_KNOWLEDGE_CENTER_URL,
        last_updated=last_updated,
    )


# Convenient aliases for backward compatibility and clean imports
generate_scope_refusal = generate_out_of_scope_response
generate_out_of_scope_refusal = generate_out_of_scope_response
