"""Ingestion pipeline, chunking engine, and vector store module for Fund Compass."""

from src.ingestion.normalizer import (
    EXPECTED_SCHEME_IDS,
    REQUIRED_FACT_FIELDS,
    REQUIRED_TOP_LEVEL_FIELDS,
    SEBI_RISKOMETER_LEVELS,
    SchemaValidationError,
    normalize_and_save_schemes,
    normalize_scheme,
    validate_corpus,
    validate_scheme,
)
from src.ingestion.chunker import (
    CANONICAL_CHUNK_TYPES,
    CHUNK_CATEGORY_FEES,
    CHUNK_CATEGORY_LIMITS,
    CHUNK_CATEGORY_OPERATIONS,
    CHUNK_CATEGORY_RISK,
    MAX_EMBEDDING_TOKENS,
    build_scheme_chunks,
    create_chunks_from_schemes,
    estimate_tokens,
    validate_chunks_metadata,
)
from src.ingestion.indexer import (
    build_vector_index,
    get_embedding_function,
    query_vector_store,
)

__all__ = [
    "EXPECTED_SCHEME_IDS",
    "REQUIRED_FACT_FIELDS",
    "REQUIRED_TOP_LEVEL_FIELDS",
    "SEBI_RISKOMETER_LEVELS",
    "SchemaValidationError",
    "validate_scheme",
    "normalize_scheme",
    "validate_corpus",
    "normalize_and_save_schemes",
    "CANONICAL_CHUNK_TYPES",
    "CHUNK_CATEGORY_FEES",
    "CHUNK_CATEGORY_LIMITS",
    "CHUNK_CATEGORY_RISK",
    "CHUNK_CATEGORY_OPERATIONS",
    "MAX_EMBEDDING_TOKENS",
    "estimate_tokens",
    "build_scheme_chunks",
    "create_chunks_from_schemes",
    "validate_chunks_metadata",
    "build_vector_index",
    "get_embedding_function",
    "query_vector_store",
]
