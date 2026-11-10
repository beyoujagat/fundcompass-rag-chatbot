"""Chunking and Metadata Strategy Engine for Fund Compass.

Constructs granular, domain-specific semantic chunks optimized for the
sentence-transformers/all-MiniLM-L6-v2 embedding model (max sequence length 256 tokens).
Enforces strict metadata tagging per chunk to guarantee zero cross-fund contamination.
"""

import json
import logging
import re
from typing import Any, Dict, List, Optional, Set, Tuple

logger = logging.getLogger(__name__)

# Embedding Model Token Constraints
# sentence-transformers/all-MiniLM-L6-v2 has a hard maximum sequence length of 256 WordPiece tokens.
MAX_EMBEDDING_TOKENS: int = 256
TARGET_TOKEN_RANGE: Tuple[int, int] = (20, 150)

# 4 Canonical Metric Chunk Categories (producing 4 chunks/scheme * 5 schemes = 20 discrete chunks)
CHUNK_CATEGORY_FEES: str = "fees"
CHUNK_CATEGORY_LIMITS: str = "limits"
CHUNK_CATEGORY_RISK: str = "risk_governance"
CHUNK_CATEGORY_OPERATIONS: str = "operations"

CANONICAL_CHUNK_TYPES: Set[str] = {
    CHUNK_CATEGORY_FEES,
    CHUNK_CATEGORY_LIMITS,
    CHUNK_CATEGORY_RISK,
    CHUNK_CATEGORY_OPERATIONS,
}

REQUIRED_METADATA_KEYS: Set[str] = {
    "scheme_id",
    "scheme_name",
    "source_url",
    "last_updated",
    "chunk_type",
}


def estimate_tokens(text: str) -> int:
    """
    Estimates the number of WordPiece tokens for sentence-transformers/all-MiniLM-L6-v2.
    Uses word count with subword and punctuation inflation multiplier (~1.3x).
    """
    if not text or not text.strip():
        return 0
    words = re.findall(r"\w+|[^\w\s]", text, re.UNICODE)
    # Punctuation marks and currency symbols count as individual tokens in WordPiece
    return max(1, int(len(words) * 1.15))


def build_scheme_chunks(scheme: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Transforms a single verified scheme record into 4 high-signal semantic chunks
    optimized for sentence-transformers/all-MiniLM-L6-v2.
    """
    scheme_id = scheme.get("scheme_id", "").strip()
    scheme_name = scheme.get("scheme_name", "").strip()
    source_url = scheme.get("source_url", "").strip()
    last_updated = scheme.get("last_updated", "2026-11-10").strip()
    category = scheme.get("category", "").strip()
    facts = scheme.get("facts", {})
    factsheet_url = facts.get("factsheet_url", "").strip()

    if not scheme_id or not scheme_name or not source_url:
        raise ValueError(f"Scheme record missing critical identifiers: {scheme}")

    chunks: List[Dict[str, Any]] = []

    # -------------------------------------------------------------
    # Chunk 1: Costs & Fees (Expense Ratio, Exit Load)
    # -------------------------------------------------------------
    fees_text = (
        f"The direct plan expense ratio for {scheme_name} is {facts.get('expense_ratio', '').strip()}. "
        f"The exit load is {facts.get('exit_load', '').strip()}."
    )
    chunks.append({
        "id": f"{scheme_id}_{CHUNK_CATEGORY_FEES}",
        "text": fees_text,
        "metadata": {
            "scheme_id": scheme_id,
            "scheme_name": scheme_name,
            "category": category,
            "source_url": source_url,
            "last_updated": last_updated,
            "chunk_type": CHUNK_CATEGORY_FEES,
            "metric_category": "Costs & Fees",
            "factsheet_url": factsheet_url,
            "token_count": estimate_tokens(fees_text),
        },
    })

    # -------------------------------------------------------------
    # Chunk 2: Investment Limits & Lock-in (SIP, Lumpsum, Lock-in)
    # -------------------------------------------------------------
    limits_text = (
        f"The minimum SIP amount for {scheme_name} is {facts.get('min_sip_amount', '').strip()}. "
        f"The minimum lumpsum investment is {facts.get('min_lumpsum_amount', '').strip()}. "
        f"The mandatory lock-in period is {facts.get('lock_in_period', '').strip()}."
    )
    chunks.append({
        "id": f"{scheme_id}_{CHUNK_CATEGORY_LIMITS}",
        "text": limits_text,
        "metadata": {
            "scheme_id": scheme_id,
            "scheme_name": scheme_name,
            "category": category,
            "source_url": source_url,
            "last_updated": last_updated,
            "chunk_type": CHUNK_CATEGORY_LIMITS,
            "metric_category": "Investment Limits & Lock-in",
            "factsheet_url": factsheet_url,
            "token_count": estimate_tokens(limits_text),
        },
    })

    # -------------------------------------------------------------
    # Chunk 3: Risk, Benchmark & Governance (Riskometer, Benchmark, Manager, Factsheet)
    # -------------------------------------------------------------
    risk_text = (
        f"The SEBI Riskometer classification for {scheme_name} is {facts.get('riskometer', '').strip()}. "
        f"The benchmark index is {facts.get('benchmark', '').strip()}. "
        f"The fund category is {category}. The fund manager is {facts.get('fund_manager', '').strip()}. "
        f"Official factsheet: {factsheet_url}."
    )
    chunks.append({
        "id": f"{scheme_id}_{CHUNK_CATEGORY_RISK}",
        "text": risk_text,
        "metadata": {
            "scheme_id": scheme_id,
            "scheme_name": scheme_name,
            "category": category,
            "source_url": source_url,
            "last_updated": last_updated,
            "chunk_type": CHUNK_CATEGORY_RISK,
            "metric_category": "Risk & Benchmark",
            "factsheet_url": factsheet_url,
            "token_count": estimate_tokens(risk_text),
        },
    })

    # -------------------------------------------------------------
    # Chunk 4: Operations & Statements (Statement & Capital Gains Download)
    # -------------------------------------------------------------
    ops_text = (
        f"Account statements and capital gains reports for {scheme_name}: "
        f"{facts.get('statement_download_process', '').strip()}"
    )
    chunks.append({
        "id": f"{scheme_id}_{CHUNK_CATEGORY_OPERATIONS}",
        "text": ops_text,
        "metadata": {
            "scheme_id": scheme_id,
            "scheme_name": scheme_name,
            "category": category,
            "source_url": source_url,
            "last_updated": last_updated,
            "chunk_type": CHUNK_CATEGORY_OPERATIONS,
            "metric_category": "Operations & Statements",
            "factsheet_url": factsheet_url,
            "token_count": estimate_tokens(ops_text),
        },
    })

    return chunks


def validate_chunks_metadata(chunks: List[Dict[str, Any]]) -> bool:
    """
    Validates that:
    1. Every chunk has valid id, non-empty text, and complete metadata.
    2. All required metadata fields exist and are non-empty.
    3. Every chunk's token length is <= MAX_EMBEDDING_TOKENS (256 tokens).
    4. No cross-fund contamination (chunk id matches metadata scheme_id).
    """
    if not isinstance(chunks, list) or len(chunks) == 0:
        raise ValueError(f"Chunks list must be non-empty, got {type(chunks).__name__}")

    for idx, chunk in enumerate(chunks):
        cid = chunk.get("id", f"chunk_at_{idx}")
        if not chunk.get("text") or not isinstance(chunk["text"], str):
            raise ValueError(f"Chunk '{cid}' missing valid text")

        # Validate token budget
        token_count = estimate_tokens(chunk["text"])
        if token_count > MAX_EMBEDDING_TOKENS:
            raise ValueError(
                f"Chunk '{cid}' token count ({token_count}) exceeds "
                f"sentence-transformers/all-MiniLM-L6-v2 limit of {MAX_EMBEDDING_TOKENS} tokens"
            )

        # Validate metadata
        meta = chunk.get("metadata")
        if not isinstance(meta, dict):
            raise ValueError(f"Chunk '{cid}' missing metadata dictionary")

        for req_key in REQUIRED_METADATA_KEYS:
            if req_key not in meta or not meta[req_key]:
                raise ValueError(f"Chunk '{cid}' metadata missing required key '{req_key}'")

        if meta["chunk_type"] not in CANONICAL_CHUNK_TYPES:
            raise ValueError(f"Chunk '{cid}' has unrecognized chunk_type '{meta['chunk_type']}'")

        # Guarantee zero cross-scheme contamination
        if not cid.startswith(meta["scheme_id"]):
            raise ValueError(
                f"Cross-fund contamination: Chunk id '{cid}' does not match metadata scheme_id '{meta['scheme_id']}'"
            )

    return True


def create_chunks_from_schemes(schemes: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Transforms scheme records into high-signal, domain-specific text chunks with metadata.
    Generates 4 discrete chunks per scheme (20 chunks total for the 5 seed schemes).
    Validates token limits and metadata integrity.
    """
    all_chunks: List[Dict[str, Any]] = []
    for scheme in schemes:
        scheme_chunks = build_scheme_chunks(scheme)
        all_chunks.extend(scheme_chunks)

    # Validate all generated chunks
    validate_chunks_metadata(all_chunks)

    return all_chunks


if __name__ == "__main__":
    from src.config import PROCESSED_DATA_PATH

    print(f"[Chunking Strategy] Loading verified schemes from {PROCESSED_DATA_PATH}...")
    with open(PROCESSED_DATA_PATH, "r", encoding="utf-8") as f:
        schemes_data = json.load(f)

    chunks = create_chunks_from_schemes(schemes_data)
    print(f"[Chunking Strategy] Successfully constructed {len(chunks)} chunks across {len(schemes_data)} schemes.")
    print("-" * 80)
    for c in chunks:
        toks = c["metadata"]["token_count"]
        print(f"ID: {c['id']:<55} | Tokens: {toks:>3} | Type: {c['metadata']['chunk_type']}")
    print("-" * 80)
    print(f"Token Limit for sentence-transformers/all-MiniLM-L6-v2: {MAX_EMBEDDING_TOKENS} tokens")
    print(f"Max chunk tokens observed: {max(c['metadata']['token_count'] for c in chunks)} tokens (well within limit).")

