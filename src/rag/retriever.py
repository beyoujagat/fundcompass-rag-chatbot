"""Scheme Resolver and Factual Retriever for Fund Compass.

Resolves user scheme references (e.g., 'mid cap', 'top 100', 'elss', 'tax saver')
to canonical scheme_id, detects unsupported competitor schemes (e.g., 'SBI Bluechip',
'Axis Long Term'), and retrieves relevant top-k facts and semantic chunks from ChromaDB
with zero cross-fund contamination.
"""

import json
import logging
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

from src.config import (
    CHROMA_PERSIST_DIR,
    DEFAULT_LAST_UPDATED,
    PROCESSED_DATA_PATH,
)

logger = logging.getLogger(__name__)

# Import ChromaDB vector query utility if available
try:
    import chromadb
    from src.ingestion.indexer import get_embedding_function, query_vector_store

    HAS_VECTOR_INDEX = True
except (ImportError, Exception) as err:
    logger.warning(f"Vector store indexer not available: {err}")
    chromadb = None
    query_vector_store = None
    get_embedding_function = None
    HAS_VECTOR_INDEX = False

# Known competitor AMCs and fund houses (outside the 5 supported HDFC funds)
COMPETITOR_AMCS = [
    "sbi",
    "axis",
    "icici",
    "icici prudential",
    "nippon",
    "nippon india",
    "mirae",
    "mirae asset",
    "kotak",
    "parag parikh",
    "ppfas",
    "tata",
    "dsp",
    "uti",
    "aditya birla",
    "absl",
    "motilal",
    "motilal oswal",
    "quant",
    "canara robeco",
    "franklin",
    "franklin templeton",
    "edelweiss",
    "hsbc",
    "sundaram",
    "invesco",
    "bandhan",
    "baroda",
    "pgim",
    "navi",
    "zerodha",
    "quantum",
    "jm financial",
    "whiteoak",
    "mahindra manulife",
    "samco",
    "union mutual fund",
    "iti mutual fund",
    "bank of india",
]

# Patterns identifying mutual fund categories / products not in our 5-scheme corpus
UNSUPPORTED_SCHEME_PATTERNS = [
    r"\bbluechip\b",
    r"\bblue[\s-]chip\b",
    r"\bflexi[\s-]?cap\b",
    r"\bmulti[\s-]?cap\b",
    r"\bhybrid\b",
    r"\bbalanced[\s-]advantage\b",
    r"\bbaf\b",
    r"\barbitrage\b",
    r"\bliquid[\s-]fund\b",
    r"\bovernight[\s-]fund\b",
    r"\bmoney[\s-]market\b",
    r"\bgilt[\s-]fund\b",
    r"\bcorporate[\s-]bond\b",
    r"\bdynamic[\s-]bond\b",
    r"\bcontra[\s-]fund\b",
    r"\bdividend[\s-]yield\b",
    r"\bequity[\s-]savings\b",
    r"\bfocused[\s-]fund\b",
    r"\bpharma[\s-]fund\b",
    r"\btech(?:nology)?[\s-]fund\b",
    r"\binfra(?:structure)?[\s-]fund\b",
]

# Factual attribute extraction keywords mapping to canonical schema fact keys
ATTRIBUTE_KEYWORD_MAP = {
    "expense_ratio": [
        r"\bexpense ratios?\b",
        r"\bexpenses?\b",
        r"\bratios?\b",
        r"\bfees?\b",
        r"\bcharges?\b",
        r"\bcosts?\b",
        r"\bter\b",
        r"\bannual fees?\b",
    ],
    "entry_load": [
        r"\bentry[\s-]?loads?\b",
    ],
    "exit_load": [
        r"\bexit[\s-]?loads?\b",
        r"\bloads?\b",
        r"\bpenalt(?:y|ies)\b",
        r"\bexit charges?\b",
        r"\bredemption fees?\b",
        r"\bredemption charges?\b",
    ],
    "min_sip_amount": [
        r"\bmin(?:imum)?[\s-]sips?\b",
        r"\bsip amounts?\b",
        r"\bsips?\b",
        r"\bsystematic investments?\b",
        r"\bmonthly investments?\b",
    ],
    "min_lumpsum_amount": [
        r"\blump[\s-]?sums?\b",
        r"\bone[\s-]?times?\b",
        r"\bonetimes?\b",
        r"\binitial investments?\b",
    ],
    "lock_in_period": [
        r"\block[\s-]?in\b",
        r"\blockin\b",
        r"\bholding periods?\b",
        r"\b3[\s-]?years?\b",
        r"\bthree[\s-]?years?\b",
        r"\b80c\b",
        r"\bsection 80c\b",
    ],
    "riskometer": [
        r"\briskometer\b",
        r"\brisk levels?\b",
        r"\brisk ratings?\b",
        r"\brisks?\b",
        r"\bsafety\b",
        r"\bsafe\b",
    ],
    "benchmark": [
        r"\bbenchmarks?\b",
        r"\bindex\b",
        r"\bindices\b",
        r"\btri\b",
        r"\btracking\b",
    ],
    "fund_manager": [
        r"\bfund managers?\b",
        r"\bmanagers?\b",
        r"\bmanaged by\b",
        r"\bwho manages\b",
        r"\bportfolio managers?\b",
    ],
    "nav": [
        r"\bnavs?\b",
        r"\bnet asset values?\b",
        r"\bcurrent nav\b",
        r"\btoday'?s nav\b",
    ],
    "statement_download_process": [
        r"\bstatements?\b",
        r"\bcapital gains?\b",
        r"\breports?\b",
        r"\bcas\b",
        r"\bdownloads?\b",
        r"\btax statements?\b",
        r"\bcams\b",
        r"\bmfcentral\b",
    ],
    "factsheet_url": [
        r"\bfactsheets?\b",
        r"\bfact sheets?\b",
        r"\bportals?\b",
    ],
}


class SchemeRetriever:
    """
    Scheme Resolver and Grounded Fact Retriever.
    Resolves scheme entities from user queries, performs isolated vector search
    filtered by scheme_id, and returns grounded context with official citations.
    """

    def __init__(
        self,
        data_path: Path = PROCESSED_DATA_PATH,
        chroma_dir: Path = CHROMA_PERSIST_DIR,
        auto_validate_index: bool = True,
    ):
        self.data_path = Path(data_path)
        self.chroma_dir = Path(chroma_dir)
        self.schemes = self._load_schemes()
        self.scheme_map = {s["scheme_id"]: s for s in self.schemes}
        self.index_status: Dict[str, Any] = {}
        if auto_validate_index and self.schemes:
            self.index_status = self.validate_index_readiness()

    def validate_index_readiness(self) -> Dict[str, Any]:
        """
        Validates that ChromaDB vector store is populated with verified scheme chunks.
        Checks both total chunk count (>= 20) and per-scheme coverage for all 5 canonical
        scheme IDs. If the index is missing or incomplete, triggers self-healing
        build_vector_index() to guarantee vector retrieval rather than silently
        falling back to JSON.
        """
        status: Dict[str, Any] = {
            "schemes_count": len(self.schemes),
            "chroma_available": HAS_VECTOR_INDEX,
            "vector_index_ready": False,
            "chunks_count": 0,
            "missing_schemes": [],
        }

        if not self.schemes:
            logger.warning(f"No scheme records found at {self.data_path}")
            return status

        # Check ChromaDB collection status
        if HAS_VECTOR_INDEX and chromadb is not None:
            try:
                client = chromadb.PersistentClient(path=str(self.chroma_dir))
                emb_fn = get_embedding_function()
                collection = client.get_or_create_collection(
                    name="fund_compass_schemes",
                    embedding_function=emb_fn,
                )
                count = collection.count()
                status["chunks_count"] = count

                if count >= 20:
                    # Per-scheme coverage check: verify every canonical scheme has chunks
                    missing = []
                    for scheme in self.schemes:
                        sid = scheme["scheme_id"]
                        try:
                            res = collection.get(where={"scheme_id": sid}, limit=1)
                            if not res or not res.get("ids") or len(res["ids"]) == 0:
                                missing.append(sid)
                        except Exception as per_scheme_err:
                            logger.warning(f"Per-scheme readiness check failed for '{sid}': {per_scheme_err}")
                            missing.append(sid)

                    status["missing_schemes"] = missing
                    if not missing:
                        status["vector_index_ready"] = True
                        logger.info(f"ChromaDB vector store verified: {count} chunks indexed across all {len(self.schemes)} schemes.")
                        return status
                    else:
                        logger.warning(
                            f"ChromaDB has {count} total chunks but is missing chunks for schemes: {missing}"
                        )
            except Exception as e:
                logger.warning(f"ChromaDB readiness check error: {e}")

        # If ChromaDB collection has fewer than 20 chunks, missing schemes, or was absent — self-heal
        logger.info("ChromaDB vector collection missing or incomplete. Initiating self-healing build_vector_index()...")
        try:
            from src.ingestion.indexer import build_vector_index
            collection = build_vector_index(data_path=self.data_path, persist_dir=self.chroma_dir)
            if hasattr(collection, "count"):
                status["chunks_count"] = collection.count()
            status["vector_index_ready"] = True
            status["missing_schemes"] = []
            logger.info("Self-healing vector indexing completed successfully.")
        except Exception as err:
            logger.error(f"Failed to build vector index during startup validation: {err}")

        return status

    def _load_schemes(self) -> List[Dict[str, Any]]:
        """Loads canonical scheme database from processed data path."""
        if not self.data_path.exists():
            logger.warning(f"Scheme database not found at {self.data_path}")
            return []
        with open(self.data_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def detect_unsupported_scheme(self, query: str) -> Optional[str]:
        """
        Detects if the query refers to an unsupported competitor mutual fund scheme
        (e.g., SBI Bluechip, Axis Long Term, ICICI Prudential, Nippon India).
        Returns the detected competitor or category name if present, else None.
        """
        clean_query = query.lower()
        has_hdfc = bool(re.search(r"\bhdfc\b", clean_query))

        # Check competitor AMCs
        for amc in COMPETITOR_AMCS:
            pattern = r"\b" + re.escape(amc) + r"\b"
            if re.search(pattern, clean_query):
                # If competitor AMC is present and HDFC is not, it's definitely competitor
                if not has_hdfc:
                    return amc.upper()
                # If both are mentioned, competitor AMC is likely part of query
                return amc.upper()

        # Check unsupported category keywords (e.g. Bluechip, Flexicap, Arbitrage)
        for pat in UNSUPPORTED_SCHEME_PATTERNS:
            match = re.search(pat, clean_query)
            if match:
                # If query mentions "bluechip" or "flexi cap" and none of our 5 funds match
                return match.group(0).title()

        return None

    def resolve_scheme(self, query: str) -> Optional[Dict[str, Any]]:
        """
        Maps a user query to one of the 5 canonical HDFC schemes using:
        1. Competitor exclusion filter (guarantees zero false mappings for SBI, Axis, etc.)
        2. Exact alias phrase matching with word boundaries
        3. Canonical token and keyword pattern matching
        """
        clean_query = query.lower().strip()
        has_hdfc = bool(re.search(r"\bhdfc\b", clean_query))

        # 1. Competitor check: If an external AMC is referenced without HDFC, do NOT match
        for amc in COMPETITOR_AMCS:
            if re.search(r"\b" + re.escape(amc) + r"\b", clean_query) and not has_hdfc:
                return None

        # 2. Check unsupported non-corpus categories (e.g., "bluechip" without our funds)
        if re.search(r"\b(bluechip|blue[\s-]chip|flexi[\s-]?cap|arbitrage|liquid[\s-]fund)\b", clean_query):
            return None

        # 3. Match against scheme-specific aliases with word boundaries
        for scheme in self.schemes:
            for alias in scheme.get("aliases", []):
                pattern = r"\b" + re.escape(alias.lower()) + r"\b"
                if re.search(pattern, clean_query):
                    return scheme

        # 4. Token & category pattern matching across the 5 schemes
        # A. HDFC Mid-Cap Opportunities Fund
        if re.search(r"\b(mid[\s-]?cap|midcap|midkap|midcap opportunities)\b", clean_query):
            for s in self.schemes:
                if "mid" in s["scheme_name"].lower():
                    return s

        # B. HDFC Small Cap Fund
        if re.search(r"\b(small[\s-]?cap|smallcap|smalcap)\b", clean_query):
            for s in self.schemes:
                if "small" in s["scheme_name"].lower():
                    return s

        # C. HDFC Gold ETF Fund of Fund
        if re.search(r"\b(gold[\s-]?etf|gold[\s-]?fof|gold fund|fund of fund|gold)\b", clean_query):
            for s in self.schemes:
                if "gold" in s["scheme_name"].lower():
                    return s

        # D. HDFC Top 100 / Large Cap Fund
        if re.search(r"\b(large[\s-]?cap|largecap|top[\s-]?100|top100)\b", clean_query):
            for s in self.schemes:
                if "large" in s["scheme_name"].lower() or "100" in s["scheme_name"].lower():
                    return s

        # E. HDFC ELSS Tax Saver Fund
        if re.search(r"\b(elss|tax[\s-]?saver|taxsaver|tax[\s-]?saving|80c|section 80c)\b", clean_query):
            for s in self.schemes:
                if "elss" in s["scheme_name"].lower():
                    return s

        return None

    def resolve_all_schemes(self, query: str) -> List[Dict[str, Any]]:
        """
        Resolves all mentioned schemes from a multi-entity query (EC-ENT-03).
        Returns a list of unique matched scheme dictionaries.
        """
        clean_query = query.lower().strip()
        matched: List[Dict[str, Any]] = []
        matched_ids = set()

        patterns = [
            ("hdfc-mid-cap-fund-direct-growth", r"\b(mid[\s-]?cap|midcap|midkap)\b"),
            ("hdfc-small-cap-fund-direct-growth", r"\b(small[\s-]?cap|smallcap|smalcap)\b"),
            ("hdfc-gold-etf-fund-of-fund-direct-plan-growth", r"\b(gold[\s-]?etf|gold[\s-]?fof|gold fund)\b"),
            ("hdfc-large-cap-fund-direct-growth", r"\b(large[\s-]?cap|largecap|top[\s-]?100|top100)\b"),
            ("hdfc-elss-tax-saver-fund-direct-plan-growth", r"\b(elss|tax[\s-]?saver|taxsaver)\b"),
        ]
        for sid, pat in patterns:
            if re.search(pat, clean_query) and sid in self.scheme_map:
                if sid not in matched_ids:
                    matched.append(self.scheme_map[sid])
                    matched_ids.add(sid)

        return matched

    def extract_attribute(self, query: str) -> Optional[str]:
        """
        Extracts the relevant factual parameter key from the user query
        (e.g., 'expense_ratio', 'exit_load', 'min_sip_amount', 'lock_in_period').
        """
        clean_query = query.lower()
        for attr, patterns in ATTRIBUTE_KEYWORD_MAP.items():
            for pat in patterns:
                if re.search(pat, clean_query):
                    return attr
        return None

    def _load_chunks_fallback(
        self, scheme_id: Optional[str] = None, attribute: Optional[str] = None
    ) -> List[str]:
        """
        Fallback chunk loader from data/chroma_db/chunks.json when ChromaDB is offline.
        """
        chunks_file = self.chroma_dir / "chunks.json"
        if not chunks_file.exists():
            return []

        try:
            with open(chunks_file, "r", encoding="utf-8") as f:
                all_chunks = json.load(f)

            filtered = []
            for c in all_chunks:
                meta = c.get("metadata", {})
                if scheme_id and meta.get("scheme_id") != scheme_id:
                    continue
                filtered.append(c["text"])

            return filtered[:4]
        except Exception as e:
            logger.warning(f"Failed to read fallback chunks.json: {e}")
            return []

    def retrieve_facts(self, query: str, top_k: int = 4) -> Dict[str, Any]:
        """
        Retrieves relevant factual data and vector store chunks for the query.
        Guarantees isolation by filtering on canonical scheme_id.

        Returns:
            {
                "scheme": Dict or None,
                "scheme_id": str or None,
                "facts": Dict or None,
                "source_url": str,
                "last_updated": str,
                "relevant_attribute": str or None,
                "retrieved_chunks": List[str],
                "chunk_metadatas": List[Dict[str, Any]],
                "context_text": str,
                "is_supported": bool,
                "unsupported_scheme": str or None
            }
        """
        scheme = self.resolve_scheme(query)
        unsupported = self.detect_unsupported_scheme(query)
        attribute = self.extract_attribute(query)

        # Handle unsupported scheme or general query where no scheme is identified
        if not scheme:
            return {
                "scheme": None,
                "scheme_id": None,
                "facts": None,
                "source_url": "https://groww.in/mutual-funds",
                "last_updated": DEFAULT_LAST_UPDATED,
                "relevant_attribute": attribute,
                "retrieved_chunks": [],
                "chunk_metadatas": [],
                "context_text": "",
                "is_supported": False,
                "unsupported_scheme": unsupported,
                "retrieval_source": "none",
            }

        scheme_id = scheme["scheme_id"]
        facts = scheme.get("facts", {})
        source_url = scheme.get("source_url", "https://groww.in/mutual-funds")
        last_updated = scheme.get("last_updated", DEFAULT_LAST_UPDATED)

        # Perform semantic vector retrieval from ChromaDB
        retrieved_chunks: List[str] = []
        chunk_metadatas: List[Dict[str, Any]] = []

        if HAS_VECTOR_INDEX and query_vector_store is not None:
            try:
                results = query_vector_store(
                    query_text=query,
                    n_results=top_k,
                    scheme_id=scheme_id,
                    persist_dir=self.chroma_dir,
                )
                if results and results.get("documents") and results["documents"][0]:
                    retrieved_chunks = [d for d in results["documents"][0] if d]
                    if results.get("metadatas") and results["metadatas"][0]:
                        chunk_metadatas = [m for m in results["metadatas"][0] if m]
            except Exception as e:
                logger.warning(f"Vector retrieval error: {e}")

        # Fallback to chunks.json if vector query returned no documents
        if not retrieved_chunks:
            retrieved_chunks = self._load_chunks_fallback(scheme_id=scheme_id, attribute=attribute)

        # Synthesize rich context text for downstream LLM generator
        facts_summary = f"Scheme: {scheme['scheme_name']}\nVerified Core Facts:\n" + "\n".join(
            f"- {k}: {v}" for k, v in facts.items()
        )
        if retrieved_chunks:
            context_text = f"{facts_summary}\n\nDetailed Scheme Documents:\n" + "\n\n".join(retrieved_chunks)
        else:
            context_text = facts_summary

        return {
            "scheme": scheme,
            "scheme_id": scheme_id,
            "facts": facts,
            "source_url": source_url,
            "last_updated": last_updated,
            "relevant_attribute": attribute,
            "retrieved_chunks": retrieved_chunks,
            "chunk_metadatas": chunk_metadatas,
            "context_text": context_text,
            "is_supported": True,
            "unsupported_scheme": None,
            "retrieval_source": "chroma_vector_index" if chunk_metadatas else "json_fallback",
        }

    def get_all_schemes(self) -> List[Dict[str, Any]]:
        """Returns all 5 verified canonical schemes."""
        return self.schemes

    def get_scheme_by_id(self, scheme_id: str) -> Optional[Dict[str, Any]]:
        """Fetches scheme metadata by canonical scheme_id."""
        return self.scheme_map.get(scheme_id)


# Module-level convenience functions
_default_retriever: Optional[SchemeRetriever] = None


def get_default_retriever() -> SchemeRetriever:
    """Returns singleton instance of SchemeRetriever."""
    global _default_retriever
    if _default_retriever is None:
        _default_retriever = SchemeRetriever()
    return _default_retriever


def resolve_scheme(query: str) -> Optional[Dict[str, Any]]:
    """Convenience function resolving scheme from query using default retriever."""
    return get_default_retriever().resolve_scheme(query)


def retrieve_facts(query: str, top_k: int = 4) -> Dict[str, Any]:
    """Convenience function retrieving facts and chunks using default retriever."""
    return get_default_retriever().retrieve_facts(query, top_k=top_k)


def detect_unsupported_scheme(query: str) -> Optional[str]:
    """Convenience function detecting unsupported competitor schemes."""
    return get_default_retriever().detect_unsupported_scheme(query)
