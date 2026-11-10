"""RAG Core and Retrieval Package for Fund Compass.

Exposes SchemeRetriever, entity resolution, factual retrieval, and Groq/fallback response generation.
"""

from src.rag.retriever import (
    SchemeRetriever,
    resolve_scheme,
    retrieve_facts,
    detect_unsupported_scheme,
    get_default_retriever,
)
from src.rag.generator import (
    generate_factual_response,
    generate_factual_response_detailed,
    GenerationResult,
    get_groq_client,
    SYSTEM_PROMPT,
)
from src.rag.postprocessor import (
    split_sentences,
    enforce_constraints,
    validate_constraints,
    sanitize_urls,
    flatten_formatting,
    format_citation,
    format_footer,
)

__all__ = [
    "SchemeRetriever",
    "resolve_scheme",
    "retrieve_facts",
    "detect_unsupported_scheme",
    "get_default_retriever",
    "generate_factual_response",
    "generate_factual_response_detailed",
    "GenerationResult",
    "get_groq_client",
    "SYSTEM_PROMPT",
    "split_sentences",
    "enforce_constraints",
    "validate_constraints",
    "sanitize_urls",
    "flatten_formatting",
    "format_citation",
    "format_footer",
]
