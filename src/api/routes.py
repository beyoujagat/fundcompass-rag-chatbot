"""API Routes for Fund Compass."""

import logging
from typing import List

from fastapi import APIRouter, HTTPException, status

from src.api.schemas import (
    ChatRequest,
    ChatResponse,
    HealthResponse,
    SchemeItem,
)
from src.config import DEFAULT_LAST_UPDATED, DISCLAIMER_TEXT
from src.guardrails.intent_classifier import QueryIntent, classify_intent
from src.guardrails.pii_filter import detect_pii
from src.guardrails.refusal_engine import dispatch_refusal
from src.rag.generator import generate_factual_response
from src.rag.retriever import SchemeRetriever

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Fund Compass"])
retriever = SchemeRetriever()


@router.get("/health", response_model=HealthResponse, summary="Service Health Check")
def health_check() -> HealthResponse:
    """Returns application health status, version, and the permanent regulatory disclaimer."""
    return HealthResponse(
        status="ok",
        app="Fund Compass",
        version="2.0.0",
        disclaimer=DISCLAIMER_TEXT,
    )


@router.get(
    "/schemes",
    response_model=List[SchemeItem],
    summary="List Supported Mutual Fund Schemes",
)
def get_supported_schemes() -> List[SchemeItem]:
    """Returns the catalog of verified HDFC mutual fund schemes and their factual parameters."""
    return retriever.get_all_schemes()


@router.get(
    "/schemes/{scheme_id}",
    response_model=SchemeItem,
    summary="Get Scheme Details by ID",
)
def get_scheme_by_id(scheme_id: str) -> SchemeItem:
    """Returns factual metadata for a specific mutual fund scheme by its canonical ID."""
    scheme = retriever.get_scheme_by_id(scheme_id)
    if not scheme:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Scheme '{scheme_id}' not found in verified 5 HDFC schemes corpus.",
        )
    return scheme


@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Facts-Only Conversational Chat Endpoint",
)
def chat_endpoint(req: ChatRequest) -> ChatResponse:
    """
    Core conversational query endpoint.
    Executes multi-stage pipeline:
    1. Inbound PII Detection & Sanitization (blocks PAN, Aadhaar, OTPs, folios).
    2. Intent Classification (routes Advisory, Performance, and Out-of-Scope queries to Refusal Dispatcher).
    3. Factual Scheme Entity Resolution & ChromaDB Vector Retrieval.
    4. Grounded Groq LLM Generation with deterministic fallback.
    5. Output Constraint Enforcement (<= 3 sentences, 1 citation link, mandatory timestamp footer).
    """
    user_query = req.message.strip()

    # Stage 1: PII Sanitization Guardrail
    has_pii, pii_warning = detect_pii(user_query)
    if has_pii:
        return ChatResponse(
            reply=pii_warning,
            intent="pii_violation",
            scheme_id=None,
            source_url=None,
            last_updated=DEFAULT_LAST_UPDATED,
        )

    # Stage 2: Intent Classification & Refusal Dispatcher Guardrail
    intent = classify_intent(user_query)

    if intent in (
        QueryIntent.ADVISORY,
        QueryIntent.PERFORMANCE_REQUEST,
        QueryIntent.OUT_OF_SCOPE,
    ):
        refusal = dispatch_refusal(intent)
        return ChatResponse(
            reply=refusal.reply,
            intent=refusal.intent,
            scheme_id=None,
            source_url=refusal.source_url,
            last_updated=refusal.last_updated,
        )

    # Stage 3: Factual Scheme Entity Resolution & ChromaDB Vector Retrieval
    retrieval_data = retriever.retrieve_facts(user_query)
    scheme = retrieval_data.get("scheme")
    scheme_id = scheme.get("scheme_id") if scheme else None
    source_url = retrieval_data.get("source_url")
    last_updated = retrieval_data.get("last_updated", DEFAULT_LAST_UPDATED)

    # Stage 4 & 5: Grounded Response Generation & Post-Processing Constraint Enforcement
    reply_text = generate_factual_response(user_query, retrieval_data)

    return ChatResponse(
        reply=reply_text,
        intent="factual_response",
        scheme_id=scheme_id,
        source_url=source_url,
        last_updated=last_updated,
    )
