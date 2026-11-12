"""Automated Groww Data Ingestion and Scraping Module for Fund Compass.

Fetches live, verified mutual fund facts directly from official Groww scheme pages,
extracts core financial metrics (NAV, NAV date, expense ratio, exit load, investment limits,
lock-in periods, Riskometer, benchmark, and fund managers), and validates data through
the canonical normalizer before safely updating the knowledge base.

Fail-safe design:
- Network failures, rate limits, or page changes NEVER overwrite or corrupt previously verified records.
- Distinguishes data-fetch timestamp from official financial metric effective dates.
- Preserves canonical scheme IDs, aliases, source URLs, and operational procedures.
"""

from datetime import datetime, timezone
import json
import logging
import os
from pathlib import Path
import re
import sys
import time
from typing import Any, Dict, List, Optional, Tuple
import urllib.error
import urllib.request

from src.config import DEFAULT_LAST_UPDATED, PROCESSED_DATA_PATH
from src.ingestion.normalizer import (
    EXPECTED_SCHEME_IDS,
    SEBI_RISKOMETER_LEVELS,
    SchemaValidationError,
    validate_corpus,
    validate_scheme,
)

logger = logging.getLogger(__name__)

# Target Groww scheme URLs mapped by canonical scheme ID
GROWW_SCHEME_TARGETS: Dict[str, Dict[str, str]] = {
    "hdfc-mid-cap-fund-direct-growth": {
        "url": "https://groww.in/mutual-funds/hdfc-mid-cap-fund-direct-growth",
        "search_id": "hdfc-mid-cap-fund-direct-growth",
        "default_name": "HDFC Mid-Cap Opportunities Fund (Direct Plan - Growth)",
    },
    "hdfc-small-cap-fund-direct-growth": {
        "url": "https://groww.in/mutual-funds/hdfc-small-cap-fund-direct-growth",
        "search_id": "hdfc-small-cap-fund-direct-growth",
        "default_name": "HDFC Small Cap Fund (Direct Plan - Growth)",
    },
    "hdfc-gold-etf-fund-of-fund-direct-plan-growth": {
        "url": "https://groww.in/mutual-funds/hdfc-gold-etf-fund-of-fund-direct-plan-growth",
        "search_id": "hdfc-gold-etf-fund-of-fund-direct-plan-growth",
        "default_name": "HDFC Gold ETF Fund of Fund (Direct Plan - Growth)",
    },
    "hdfc-large-cap-fund-direct-growth": {
        "url": "https://groww.in/mutual-funds/hdfc-large-cap-fund-direct-growth",
        "search_id": "hdfc-large-cap-fund-direct-growth",
        "default_name": "HDFC Top 100 / Large Cap Fund (Direct Plan - Growth)",
    },
    "hdfc-elss-tax-saver-fund-direct-plan-growth": {
        "url": "https://groww.in/mutual-funds/hdfc-elss-tax-saver-fund-direct-plan-growth",
        "search_id": "hdfc-elss-tax-saver-fund-direct-plan-growth",
        "default_name": "HDFC ELSS Tax Saver Fund (Direct Plan - Growth)",
    },
}

DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}


class GrowwScraperError(Exception):
    """Base exception for Groww ingestion errors."""
    pass


class GrowwFetchError(GrowwScraperError):
    """Raised when an HTTP or network fetch fails."""
    pass


class GrowwParseError(GrowwScraperError):
    """Raised when the Groww page payload cannot be parsed."""
    pass


def parse_date_to_iso(date_str: Optional[str]) -> Optional[str]:
    """
    Parses various date string formats (e.g. '11-Nov-2026', '2026-11-11') into ISO format 'YYYY-MM-DD'.
    Returns None if date_str cannot be parsed.
    """
    if not date_str or not isinstance(date_str, str):
        return None
    cleaned = date_str.strip()
    if re.match(r"^\d{4}-\d{2}-\d{2}$", cleaned):
        return cleaned

    for fmt in ("%d-%b-%Y", "%d %b %Y", "%d/%m/%Y", "%Y/%m/%d", "%b %d, %Y"):
        try:
            return datetime.strptime(cleaned, fmt).strftime("%Y-%m-%d")
        except ValueError:
            continue
    return None


def clean_riskometer(raw_risk: Optional[str]) -> Optional[str]:
    """
    Normalizes raw Groww risk strings (e.g. 'Moderately High Riskometer', 'Very High')
    into standard SEBI Riskometer classifications.
    """
    if not raw_risk or not isinstance(raw_risk, str):
        return None
    cleaned = raw_risk.strip()
    # Strip trailing 'Riskometer' or 'Risk'
    cleaned = re.sub(r"\s+riskometer$", "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s+risk$", "", cleaned, flags=re.IGNORECASE).strip()

    # Exact match check
    for level in SEBI_RISKOMETER_LEVELS:
        if cleaned.lower() == level.lower():
            return level

    # Partial / substring match
    for level in sorted(SEBI_RISKOMETER_LEVELS, key=len, reverse=True):
        if level.lower() in cleaned.lower():
            return level

    return None


def format_nav(raw_nav: Any) -> Optional[str]:
    """
    Formats NAV preserving exact source precision (up to 4 decimal places),
    without unnecessary rounding or loss of accuracy.
    """
    if raw_nav is None:
        return None
    try:
        nav_float = float(raw_nav)
        # Format up to 4 decimal places without trailing zeroes
        formatted_num = f"{nav_float:.4f}".rstrip("0").rstrip(".")
        if "." in formatted_num:
            decimals = formatted_num.split(".")[1]
            if len(decimals) < 2:
                formatted_num = f"{nav_float:.2f}"
        else:
            formatted_num = f"{nav_float:.2f}"
        return f"₹{formatted_num}"
    except (ValueError, TypeError):
        cleaned = str(raw_nav).strip()
        if not cleaned:
            return None
        return cleaned if cleaned.startswith("₹") else f"₹{cleaned}"


def fetch_scheme_html(
    url: str,
    timeout: int = 15,
    max_retries: int = 3,
    backoff_factor: float = 1.0,
) -> str:
    """
    Fetches raw HTML from a verified Groww scheme page with retry and exponential backoff.
    """
    req = urllib.request.Request(url, headers=DEFAULT_HEADERS)
    last_err: Optional[Exception] = None

    for attempt in range(1, max_retries + 1):
        try:
            with urllib.request.urlopen(req, timeout=timeout) as response:
                if response.status != 200:
                    raise GrowwFetchError(
                        f"HTTP {response.status} received from {url}"
                    )
                charset = response.headers.get_content_charset() or "utf-8"
                return response.read().decode(charset, errors="replace")
        except urllib.error.HTTPError as err:
            last_err = err
            # Avoid retrying client 4xx errors except 429
            if err.code != 429 and 400 <= err.code < 500:
                raise GrowwFetchError(
                    f"HTTP client error {err.code} fetching {url}: {err.reason}"
                ) from err
        except (urllib.error.URLError, TimeoutError, OSError) as err:
            last_err = err

        if attempt < max_retries:
            import time
            sleep_duration = backoff_factor * (2 ** (attempt - 1))
            logger.warning(
                f"[Attempt {attempt}/{max_retries}] Fetch failed for {url}: {last_err}. "
                f"Retrying in {sleep_duration:.1f}s..."
            )
            time.sleep(sleep_duration)

    raise GrowwFetchError(
        f"Failed to fetch {url} after {max_retries} attempts: {last_err}"
    )


def extract_next_data_payload(html: str) -> Dict[str, Any]:
    """
    Extracts and parses the Next.js hydration payload from '__NEXT_DATA__' script tag.
    """
    if not html:
        raise GrowwParseError("Empty HTML response received")

    match = re.search(
        r'<script[^>]*\bid=["\']__NEXT_DATA__["\'][^>]*>(.*?)</script>',
        html,
        re.DOTALL,
    )
    if match:
        json_str = match.group(1).strip()
    else:
        # Fallback to direct string search if regex encounters attribute variations
        tag_start = html.find('id="__NEXT_DATA__"')
        if tag_start == -1:
            tag_start = html.find("id='__NEXT_DATA__'")
        if tag_start != -1:
            content_start = html.find(">", tag_start)
            content_end = html.find("</script>", content_start)
            if content_start != -1 and content_end != -1:
                json_str = html[content_start + 1 : content_end].strip()
            else:
                raise GrowwParseError("Malformed '__NEXT_DATA__' script tag in HTML")
        else:
            raise GrowwParseError("Could not locate '__NEXT_DATA__' script tag in Groww HTML response")
    try:
        return json.loads(json_str)
    except json.JSONDecodeError as err:
        raise GrowwParseError(f"Failed to decode '__NEXT_DATA__' JSON payload: {err}") from err


def extract_scheme_server_data(next_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Extracts the 'mfServerSideData' dictionary from the Next.js pageProps.
    """
    props = next_data.get("props", {})
    page_props = props.get("pageProps", {})
    mfd = page_props.get("mfServerSideData")

    if not isinstance(mfd, dict):
        raise GrowwParseError("Missing or invalid 'mfServerSideData' in pageProps")
    return mfd


def parse_groww_metrics(
    mfd: Dict[str, Any],
    scheme_id: str,
    source_url: str,
    existing_scheme: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Extracts and normalizes scheme facts from Groww mfServerSideData.
    Preserves existing verified values for any field that Groww returns as null/missing.
    """
    existing_facts = (existing_scheme or {}).get("facts", {})
    now_utc = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    # 1. NAV and NAV Date
    raw_nav = mfd.get("nav")
    formatted_nav = format_nav(raw_nav)

    raw_nav_date = mfd.get("nav_date")
    iso_nav_date = parse_date_to_iso(raw_nav_date)
    effective_date = iso_nav_date or existing_scheme.get("last_updated") if existing_scheme else None
    if not effective_date:
        effective_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")

    # 2. Expense Ratio
    raw_expense = mfd.get("expense_ratio")
    formatted_expense: Optional[str] = None
    if raw_expense is not None:
        try:
            exp_float = float(raw_expense)
            formatted_expense = f"{exp_float:.2f}%"
        except (ValueError, TypeError):
            exp_str = str(raw_expense).strip()
            if exp_str:
                formatted_expense = exp_str if "%" in exp_str else f"{exp_str}%"

    expense_ratio = formatted_expense or existing_facts.get("expense_ratio") or "0.00%"

    # 3. Exit Load (ensure standard percentage precision e.g. 1.00%)
    raw_exit_load = mfd.get("exit_load")
    exit_load: Optional[str] = None
    if raw_exit_load and isinstance(raw_exit_load, str) and raw_exit_load.strip():
        exit_load_str = raw_exit_load.strip()
        exit_load = re.sub(r"\b(\d+)%", r"\1.00%", exit_load_str)
    else:
        exit_load = existing_facts.get("exit_load") or "Nil"

    # 4. Minimum SIP Amount
    sip_allowed = mfd.get("sip_allowed")
    raw_sip = mfd.get("min_sip_investment")
    formatted_sip: Optional[str] = None

    if sip_allowed is False or (raw_sip is not None and str(raw_sip).strip() in ("0", "0.0")):
        formatted_sip = "SIP not available on platform (Disallowed by distributor/AMC)"
    elif raw_sip is not None:
        try:
            sip_num = int(raw_sip)
            if sip_num > 0:
                formatted_sip = f"₹{sip_num}"
        except (ValueError, TypeError):
            pass

    if formatted_sip:
        min_sip_amount = formatted_sip
    else:
        min_sip_amount = existing_facts.get("min_sip_amount") or "N/A"

    # 5. Minimum Lumpsum Amount
    raw_lump = mfd.get("min_investment_amount")
    formatted_lump: Optional[str] = None
    if raw_lump is not None:
        try:
            lump_num = int(raw_lump)
            if lump_num > 0:
                formatted_lump = f"₹{lump_num}"
        except (ValueError, TypeError):
            pass
    min_lumpsum_amount = formatted_lump or existing_facts.get("min_lumpsum_amount") or "N/A"

    # 6. Lock-in Period
    raw_lock_in = mfd.get("lock_in")
    formatted_lock_in: Optional[str] = None
    if isinstance(raw_lock_in, dict) and raw_lock_in.get("years"):
        formatted_lock_in = f"{raw_lock_in['years']} Years mandatory lock-in under Section 80C of the Income Tax Act"
    elif raw_lock_in == "Nil" or (isinstance(raw_lock_in, dict) and not raw_lock_in.get("years")):
        formatted_lock_in = "Nil"
    lock_in_period = formatted_lock_in or existing_facts.get("lock_in_period") or "Nil"

    # 7. Riskometer
    raw_risk = mfd.get("nfo_risk")
    cleaned_risk = clean_riskometer(raw_risk)
    riskometer = cleaned_risk or existing_facts.get("riskometer") or "Very High"

    # 8. Benchmark
    raw_benchmark = mfd.get("benchmark_name") or mfd.get("benchmark")
    benchmark: Optional[str] = None
    if raw_benchmark and isinstance(raw_benchmark, str) and raw_benchmark.strip():
        benchmark = raw_benchmark.strip()
    else:
        benchmark = existing_facts.get("benchmark") or "Benchmark Index"

    # 9. Fund Manager
    raw_mgr = mfd.get("fund_manager")
    fund_manager: Optional[str] = None
    if raw_mgr and isinstance(raw_mgr, str) and raw_mgr.strip():
        fund_manager = raw_mgr.strip()
    else:
        fund_manager = existing_facts.get("fund_manager") or "Fund Management Team"

    # 10. Factsheet URL and Statements (preserve verified AMC endpoints)
    factsheet_url = (
        existing_facts.get("factsheet_url")
        or "https://www.hdfcfund.com/investor-services/fund-performance/factsheet"
    )
    statement_process = existing_facts.get(
        "statement_download_process",
        (
            "Statements and Capital Gains reports can be downloaded from the HDFC Mutual Fund "
            "online investor portal or via MFCentral/CAMS using PAN and registered folio number."
        ),
    )

    # Compile verified facts dictionary
    facts: Dict[str, Any] = {
        "expense_ratio": expense_ratio,
        "exit_load": exit_load,
        "min_sip_amount": min_sip_amount,
        "min_lumpsum_amount": min_lumpsum_amount,
        "lock_in_period": lock_in_period,
        "riskometer": riskometer,
        "benchmark": benchmark,
        "fund_manager": fund_manager,
        "factsheet_url": factsheet_url,
        "statement_download_process": statement_process,
    }

    # Add verified NAV and provenance timestamps
    if formatted_nav:
        facts["nav"] = formatted_nav
    if iso_nav_date:
        facts["nav_date"] = iso_nav_date
        facts["effective_date"] = iso_nav_date

    # Determine scheme metadata (strictly preserve canonical naming invariance)
    scheme_name = (
        (existing_scheme.get("scheme_name") if existing_scheme else None)
        or GROWW_SCHEME_TARGETS.get(scheme_id, {}).get("default_name")
        or mfd.get("scheme_name")
        or scheme_id
    )
    amc = existing_scheme.get("amc", "HDFC Mutual Fund") if existing_scheme else "HDFC Mutual Fund"
    category = existing_scheme.get("category", "Mutual Fund") if existing_scheme else "Mutual Fund"
    aliases = existing_scheme.get("aliases", []) if existing_scheme else [scheme_id]

    # Assembled canonical record
    return {
        "scheme_id": scheme_id,
        "scheme_name": scheme_name,
        "amc": amc,
        "category": category,
        "source_url": source_url,
        "last_updated": effective_date,
        "data_fetched_at": now_utc,
        "facts": facts,
        "aliases": aliases,
    }


class GrowwIngestionPipeline:
    """
    Automated Ingestion Pipeline orchestrating fetch, extraction, validation,
    and safe atomic persistence of mutual fund scheme records.
    """

    def __init__(
        self,
        data_path: Path = PROCESSED_DATA_PATH,
        timeout: int = 15,
        max_retries: int = 3,
        inter_request_delay_seconds: float = 0.5,
    ):
        self.data_path = Path(data_path)
        self.timeout = timeout
        self.max_retries = max_retries
        self.inter_request_delay_seconds = inter_request_delay_seconds

    def load_existing_records(self) -> Dict[str, Dict[str, Any]]:
        """Loads and returns existing verified scheme records indexed by scheme_id."""
        if not self.data_path.exists():
            return {}
        try:
            with open(self.data_path, "r", encoding="utf-8") as f:
                records = json.load(f)
            return {r["scheme_id"]: r for r in records if isinstance(r, dict) and "scheme_id" in r}
        except Exception as e:
            logger.warning(f"Could not load existing records from {self.data_path}: {e}")
            return {}

    def fetch_single_scheme(
        self,
        scheme_id: str,
        existing_scheme: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Fetches and parses a single scheme from Groww.
        Raises GrowwScraperError on failure.
        """
        target_info = GROWW_SCHEME_TARGETS.get(scheme_id)
        if not target_info:
            raise ValueError(f"Unknown scheme_id '{scheme_id}'. Not in GROWW_SCHEME_TARGETS.")

        if existing_scheme is None:
            existing_scheme = self.load_existing_records().get(scheme_id)

        url = target_info["url"]
        logger.info(f"Fetching scheme '{scheme_id}' from {url}...")
        html = fetch_scheme_html(url, timeout=self.timeout, max_retries=self.max_retries)
        next_data = extract_next_data_payload(html)
        mfd = extract_scheme_server_data(next_data)
        record = parse_groww_metrics(mfd, scheme_id, url, existing_scheme=existing_scheme)

        # Validate through canonical normalizer
        validate_scheme(record)
        return record

    def run_ingestion(
        self,
        dry_run: bool = False,
    ) -> Dict[str, Any]:
        """
        Executes end-to-end ingestion across all 5 supported Groww schemes.
        - Guarantees fail-safe update: Failed fetches retain their existing verified records.
        - Validates every updated record against the canonical schema.
        - Atomically saves updated dataset to disk.
        """
        existing_map = self.load_existing_records()
        updated_records: List[Dict[str, Any]] = []
        summary = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "total_target_schemes": len(GROWW_SCHEME_TARGETS),
            "successfully_updated": 0,
            "retained_previous": 0,
            "failed_schemes": [],
            "updated_schemes": [],
        }

        for idx, (scheme_id, target) in enumerate(GROWW_SCHEME_TARGETS.items()):
            # Apply configurable delay between consecutive scheme fetches to avoid rate-limiting
            if idx > 0 and self.inter_request_delay_seconds > 0:
                time.sleep(self.inter_request_delay_seconds)

            existing = existing_map.get(scheme_id)
            try:
                scraped_record = self.fetch_single_scheme(scheme_id, existing_scheme=existing)
                updated_records.append(scraped_record)
                summary["successfully_updated"] += 1
                summary["updated_schemes"].append(scheme_id)
                logger.info(f"Successfully updated scheme '{scheme_id}' from live Groww source.")
            except Exception as e:
                logger.warning(
                    f"Live ingestion failed for '{scheme_id}': {e}. Retaining existing verified record."
                )
                summary["failed_schemes"].append({"scheme_id": scheme_id, "error": str(e)})
                if existing:
                    updated_records.append(existing)
                    summary["retained_previous"] += 1
                else:
                    logger.error(f"No existing record available to retain for '{scheme_id}'.")

        # Validate entire updated corpus
        if len(updated_records) == len(GROWW_SCHEME_TARGETS):
            validate_corpus(updated_records, expected_count=len(GROWW_SCHEME_TARGETS))
        else:
            logger.warning(
                f"Corpus count ({len(updated_records)}) does not match expected targets ({len(GROWW_SCHEME_TARGETS)})"
            )

        # Atomically write to disk if not a dry run
        if not dry_run and updated_records:
            self._save_atomically(updated_records)
            logger.info(f"Atomically updated knowledge base at {self.data_path}")

        summary["records_count"] = len(updated_records)
        summary["records"] = updated_records
        return summary

    def _save_atomically(self, records: List[Dict[str, Any]]) -> None:
        """Saves records to temporary file and atomically replaces destination."""
        self.data_path.parent.mkdir(parents=True, exist_ok=True)
        temp_path = self.data_path.with_suffix(".tmp")

        with open(temp_path, "w", encoding="utf-8") as f:
            json.dump(records, f, indent=2, ensure_ascii=False)
            f.write("\n")

        # Atomic file replacement
        os.replace(temp_path, self.data_path)


def run_scraper(
    dry_run: bool = False,
    delay_seconds: float = 0.5,
) -> Dict[str, Any]:
    """Convenience runner function."""
    pipeline = GrowwIngestionPipeline(inter_request_delay_seconds=delay_seconds)
    return pipeline.run_ingestion(dry_run=dry_run)


def generate_step_summary(summary: Dict[str, Any]) -> str:
    """
    Generates a structured GitHub Actions markdown table for $GITHUB_STEP_SUMMARY,
    reporting the status, NAV, effective date, and key metrics for each scheme.
    """
    lines = [
        "## 📊 Fund Compass Daily Data Ingestion Summary",
        f"- **Timestamp (UTC):** `{summary.get('timestamp')}`",
        f"- **Total Target Schemes:** `{summary.get('total_target_schemes')}`",
        f"- **Successfully Updated:** `{summary.get('successfully_updated')}`",
        f"- **Retained Previous Verified Records:** `{summary.get('retained_previous')}`",
        f"- **Failed Scheme Fetches:** `{len(summary.get('failed_schemes', []))}`",
        "",
        "### Scheme-Level Ingestion Status",
        "| Scheme Name | NAV | NAV Date | Min SIP | Expense Ratio | Status |",
        "| :--- | :--- | :--- | :--- | :--- | :--- |",
    ]
    records = summary.get("records", [])
    failed_map = {f["scheme_id"]: f["error"] for f in summary.get("failed_schemes", [])}

    for record in records:
        sid = record.get("scheme_id", "")
        name = record.get("scheme_name", sid)
        facts = record.get("facts", {})
        nav = facts.get("nav", "N/A")
        nav_date = facts.get("nav_date", facts.get("effective_date", "N/A"))
        min_sip = facts.get("min_sip_amount", "N/A")
        expense = facts.get("expense_ratio", "N/A")

        if sid in failed_map:
            status_str = f"⚠️ Retained Previous (`{failed_map[sid][:25]}`)"
        else:
            status_str = "✅ Freshly Updated"

        lines.append(f"| {name} | {nav} | {nav_date} | {min_sip} | {expense} | {status_str} |")

    return "\n".join(lines) + "\n"


if __name__ == "__main__":
    import argparse

    logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
    parser = argparse.ArgumentParser(description="Groww Data Ingestion Module for Fund Compass")
    parser.add_argument("--dry-run", action="store_true", help="Fetch and validate without writing to disk")
    parser.add_argument(
        "--delay",
        type=float,
        default=0.5,
        help="Configurable delay in seconds between consecutive scheme requests (default: 0.5s)",
    )
    parser.add_argument(
        "--step-summary",
        action="store_true",
        help="Output markdown summary table to terminal and $GITHUB_STEP_SUMMARY if set",
    )
    args = parser.parse_args()

    result = run_scraper(dry_run=args.dry_run, delay_seconds=args.delay)
    print("\n--- Ingestion Result Summary ---")
    print(json.dumps({k: v for k, v in result.items() if k != "records"}, indent=2))

    # Append to GITHUB_STEP_SUMMARY if running inside GitHub Actions or if requested
    markdown_table = generate_step_summary(result)
    if "GITHUB_STEP_SUMMARY" in os.environ:
        summary_file = os.environ["GITHUB_STEP_SUMMARY"]
        try:
            with open(summary_file, "a", encoding="utf-8") as f:
                f.write(markdown_table)
            logger.info(f"Appended step summary to {summary_file}")
        except Exception as e:
            logger.warning(f"Could not write to GITHUB_STEP_SUMMARY: {e}")

    if args.step_summary:
        print("\n" + markdown_table)

    # Exit with non-zero code when ALL scheme extractions failed.
    # Previously verified records are already preserved on disk —
    # this exit code signals GitHub Actions to report the run as failed
    # so maintainers are alerted to platform-wide scraping outages.
    total_targets = result.get("total_target_schemes", len(GROWW_SCHEME_TARGETS))
    if result.get("successfully_updated", 0) == 0 and len(result.get("failed_schemes", [])) == total_targets:
        logger.error(
            "FATAL: All %d scheme extractions failed. Previously verified records retained. "
            "Exiting with non-zero status to alert maintainers.",
            total_targets,
        )
        sys.exit(1)
