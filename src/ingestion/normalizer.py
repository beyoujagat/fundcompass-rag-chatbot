"""Canonical Schema Normalization and Validation Engine for Fund Compass.

Enforces strict structural compliance for mutual fund schemes data ingested
from Groww and official AMC / regulatory sources.
"""

import json
import logging
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Set

from src.config import DEFAULT_LAST_UPDATED, PROCESSED_DATA_PATH

logger = logging.getLogger(__name__)

# Official SEBI Riskometer Classifications
SEBI_RISKOMETER_LEVELS: Set[str] = {
    "Low",
    "Low to Moderate",
    "Moderate",
    "Moderately High",
    "High",
    "Very High",
}

# 10 Core Factual Fields Mandated by Problem Statement & Implementation Plan
REQUIRED_FACT_FIELDS: List[str] = [
    "expense_ratio",
    "exit_load",
    "min_sip_amount",
    "min_lumpsum_amount",
    "lock_in_period",
    "riskometer",
    "benchmark",
    "fund_manager",
    "factsheet_url",
    "statement_download_process",
]

# Top-level Fields for Canonical Mutual Fund Record
REQUIRED_TOP_LEVEL_FIELDS: List[str] = [
    "scheme_id",
    "scheme_name",
    "amc",
    "category",
    "source_url",
    "last_updated",
    "facts",
    "aliases",
]

# 5 Target HDFC Mutual Fund Seed Schemes
EXPECTED_SCHEME_IDS: List[str] = [
    "hdfc-mid-cap-fund-direct-growth",
    "hdfc-small-cap-fund-direct-growth",
    "hdfc-gold-etf-fund-of-fund-direct-plan-growth",
    "hdfc-large-cap-fund-direct-growth",
    "hdfc-elss-tax-saver-fund-direct-plan-growth",
]

SCHEME_ID_PATTERN = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
DATE_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}$")
URL_PATTERN = re.compile(r"^https?://")


class SchemaValidationError(ValueError):
    """Raised when mutual fund scheme record fails canonical schema validation."""
    pass


# Optional Pydantic Integration (graceful fallback if not installed)
try:
    from pydantic import BaseModel, Field, field_validator

    class SchemeFactsModel(BaseModel):
        expense_ratio: str = Field(..., description="Direct plan expense ratio e.g. '0.76%'")
        exit_load: str = Field(..., description="Exit load terms and holding duration")
        min_sip_amount: str = Field(..., description="Minimum SIP investment amount")
        min_lumpsum_amount: str = Field(..., description="Minimum lumpsum investment amount")
        lock_in_period: str = Field(..., description="Statutory or scheme lock-in period")
        riskometer: str = Field(..., description="SEBI Riskometer classification")
        benchmark: str = Field(..., description="Official benchmark index")
        fund_manager: str = Field(..., description="Fund manager name(s)")
        factsheet_url: str = Field(..., description="Official AMC factsheet URL")
        statement_download_process: str = Field(..., description="Statement download procedure")

        @field_validator("riskometer")
        @classmethod
        def validate_riskometer(cls, v: str) -> str:
            if v not in SEBI_RISKOMETER_LEVELS:
                raise ValueError(f"Invalid riskometer '{v}'. Must be one of {SEBI_RISKOMETER_LEVELS}")
            return v

    class CanonicalSchemeModel(BaseModel):
        scheme_id: str
        scheme_name: str
        amc: str
        category: str
        source_url: str
        last_updated: str
        facts: SchemeFactsModel
        aliases: List[str]

    HAS_PYDANTIC_MODELS = True
except ImportError:
    HAS_PYDANTIC_MODELS = False
    SchemeFactsModel = None
    CanonicalSchemeModel = None


def validate_scheme(record: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validates a scheme dictionary strictly against canonical schema rules.
    Raises SchemaValidationError on any violation.
    """
    if not isinstance(record, dict):
        raise SchemaValidationError(f"Scheme record must be a dict, got {type(record).__name__}")

    scheme_id = record.get("scheme_id")
    context = f"Scheme [{scheme_id or 'UNKNOWN'}]"

    # Top-level required fields
    for field in REQUIRED_TOP_LEVEL_FIELDS:
        if field not in record:
            raise SchemaValidationError(f"{context} missing required top-level field '{field}'")
        val = record[field]
        if val is None or (isinstance(val, (str, list, dict)) and len(val) == 0):
            raise SchemaValidationError(f"{context} field '{field}' cannot be empty")

    # scheme_id format
    if not isinstance(record["scheme_id"], str) or not SCHEME_ID_PATTERN.match(record["scheme_id"]):
        raise SchemaValidationError(
            f"{context} 'scheme_id' must be lowercase alphanumeric with hyphens, got '{record['scheme_id']}'"
        )

    # string fields validation
    for str_field in ["scheme_name", "amc", "category"]:
        if not isinstance(record[str_field], str) or not record[str_field].strip():
            raise SchemaValidationError(f"{context} '{str_field}' must be a non-empty string")

    # source_url validation
    source_url = record["source_url"]
    if not isinstance(source_url, str) or not source_url.startswith("https://groww.in/mutual-funds/"):
        raise SchemaValidationError(
            f"{context} 'source_url' must be an official Groww scheme URL, got '{source_url}'"
        )

    # last_updated validation (YYYY-MM-DD)
    last_updated = record["last_updated"]
    if not isinstance(last_updated, str) or not DATE_PATTERN.match(last_updated):
        raise SchemaValidationError(
            f"{context} 'last_updated' must match YYYY-MM-DD format, got '{last_updated}'"
        )

    # aliases validation
    aliases = record["aliases"]
    if not isinstance(aliases, list) or len(aliases) == 0:
        raise SchemaValidationError(f"{context} 'aliases' must be a non-empty list of strings")
    for a in aliases:
        if not isinstance(a, str) or not a.strip():
            raise SchemaValidationError(f"{context} alias '{a}' must be a non-empty string")

    # facts validation
    facts = record["facts"]
    if not isinstance(facts, dict):
        raise SchemaValidationError(f"{context} 'facts' must be a dictionary")

    for fact_field in REQUIRED_FACT_FIELDS:
        if fact_field not in facts:
            raise SchemaValidationError(f"{context} missing required fact field '{fact_field}'")
        fval = facts[fact_field]
        if not isinstance(fval, str) or not fval.strip():
            raise SchemaValidationError(f"{context} fact field '{fact_field}' must be a non-empty string")

    # expense_ratio must contain '%'
    if "%" not in facts["expense_ratio"]:
        raise SchemaValidationError(
            f"{context} 'expense_ratio' must specify a percentage (e.g. '0.76%'), got '{facts['expense_ratio']}'"
        )

    # riskometer must match SEBI standards
    riskometer = facts["riskometer"]
    if riskometer not in SEBI_RISKOMETER_LEVELS:
        raise SchemaValidationError(
            f"{context} invalid riskometer '{riskometer}'. Must be one of: {sorted(SEBI_RISKOMETER_LEVELS)}"
        )

    # factsheet_url must be a valid http/https URL
    factsheet_url = facts["factsheet_url"]
    if not URL_PATTERN.match(factsheet_url):
        raise SchemaValidationError(
            f"{context} 'factsheet_url' must be a valid HTTP/HTTPS URL, got '{factsheet_url}'"
        )

    return record


def normalize_scheme(record: Dict[str, Any]) -> Dict[str, Any]:
    """
    Standardizes whitespace, trims text, deduplicates aliases, validates,
    and returns a canonical dictionary with deterministic key order.
    """
    if not isinstance(record, dict):
        raise SchemaValidationError("Input record must be a dictionary")

    # Clean top-level string fields
    scheme_id = str(record.get("scheme_id", "")).strip().lower()
    scheme_name = str(record.get("scheme_name", "")).strip()
    amc = str(record.get("amc", "HDFC Mutual Fund")).strip()
    category = str(record.get("category", "")).strip()
    source_url = str(record.get("source_url", "")).strip()
    last_updated = str(record.get("last_updated", DEFAULT_LAST_UPDATED)).strip()

    # Clean and deduplicate aliases
    raw_aliases = record.get("aliases", [])
    seen_aliases: Set[str] = set()
    cleaned_aliases: List[str] = []
    if isinstance(raw_aliases, list):
        for item in raw_aliases:
            if isinstance(item, str):
                cleaned = item.strip().lower()
                if cleaned and cleaned not in seen_aliases:
                    seen_aliases.add(cleaned)
                    cleaned_aliases.append(cleaned)

    # Clean facts dictionary
    raw_facts = record.get("facts", {})
    cleaned_facts: Dict[str, str] = {}
    if isinstance(raw_facts, dict):
        for k in REQUIRED_FACT_FIELDS:
            v = raw_facts.get(k, "")
            cleaned_facts[k] = str(v).strip() if v is not None else ""

    normalized_record: Dict[str, Any] = {
        "scheme_id": scheme_id,
        "scheme_name": scheme_name,
        "amc": amc,
        "category": category,
        "source_url": source_url,
        "last_updated": last_updated,
        "facts": cleaned_facts,
        "aliases": cleaned_aliases,
    }

    # Validate the normalized record
    validate_scheme(normalized_record)

    return normalized_record


def validate_corpus(schemes: List[Dict[str, Any]], expected_count: Optional[int] = 5) -> List[Dict[str, Any]]:
    """
    Validates a list of scheme records against canonical schema rules and corpus constraints.
    """
    if not isinstance(schemes, list):
        raise SchemaValidationError(f"Corpus must be a list of scheme objects, got {type(schemes).__name__}")

    if expected_count is not None and len(schemes) != expected_count:
        raise SchemaValidationError(f"Corpus expected exactly {expected_count} schemes, found {len(schemes)}")

    seen_ids: Set[str] = set()
    for scheme in schemes:
        validated = validate_scheme(scheme)
        sid = validated["scheme_id"]
        if sid in seen_ids:
            raise SchemaValidationError(f"Duplicate scheme_id found in corpus: '{sid}'")
        seen_ids.add(sid)

    return schemes


def normalize_and_save_schemes(
    input_path: Path,
    output_path: Optional[Path] = None,
    verify_target_schemes: bool = True
) -> List[Dict[str, Any]]:
    """
    Loads raw or processed scheme records, normalizes each record, validates the corpus,
    and writes out formatted JSON to output_path.
    """
    if not input_path.exists():
        raise FileNotFoundError(f"Scheme source file not found: {input_path}")

    with open(input_path, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    if not isinstance(raw_data, list):
        raise SchemaValidationError(f"JSON root must be a list, got {type(raw_data).__name__}")

    normalized_schemes = [normalize_scheme(item) for item in raw_data]

    # Validate overall corpus
    validate_corpus(normalized_schemes, expected_count=5 if verify_target_schemes else None)

    if verify_target_schemes:
        actual_ids = {s["scheme_id"] for s in normalized_schemes}
        expected_ids = set(EXPECTED_SCHEME_IDS)
        if actual_ids != expected_ids:
            missing = expected_ids - actual_ids
            unexpected = actual_ids - expected_ids
            raise SchemaValidationError(
                f"Corpus schemes mismatch. Missing: {missing}, Unexpected: {unexpected}"
            )

    dest = output_path or input_path
    dest.parent.mkdir(parents=True, exist_ok=True)
    with open(dest, "w", encoding="utf-8") as f:
        json.dump(normalized_schemes, f, indent=2, ensure_ascii=False)
        f.write("\n")

    return normalized_schemes


if __name__ == "__main__":
    import argparse
    import sys

    parser = argparse.ArgumentParser(description="Canonical Schema Normalizer for Fund Compass")
    parser.add_argument("--check", action="store_true", help="Validate existing processed schemes file")
    parser.add_argument("--input", type=str, default=str(PROCESSED_DATA_PATH), help="Input schemes JSON path")
    parser.add_argument("--output", type=str, default=None, help="Output schemes JSON path (optional)")
    args = parser.parse_args()

    input_p = Path(args.input)
    output_p = Path(args.output) if args.output else input_p

    print(f"[Canonical Schema] Inspecting schemes file: {input_p}")
    try:
        if args.check:
            with open(input_p, "r", encoding="utf-8") as file:
                data = json.load(file)
            validate_corpus(data, expected_count=5)
            print(f"[Canonical Schema] SUCCESS: All {len(data)} schemes adhere to Canonical Schema!")
        else:
            schemes = normalize_and_save_schemes(input_p, output_p)
            print(f"[Canonical Schema] SUCCESS: Normalized & validated {len(schemes)} schemes -> {output_p}")
        sys.exit(0)
    except Exception as exc:
        print(f"[Canonical Schema] ERROR: {exc}", file=sys.stderr)
        sys.exit(1)

