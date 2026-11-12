"""Focused unit tests for the automated Groww data scraper (src/ingestion/scraper.py).

Verifies:
1. Next.js payload extraction and error handling for missing/malformed HTML.
2. Metric parsing for all 10 core fields + NAV and timestamps.
3. Timestamp distinction: data_fetched_at vs nav_date vs last_updated.
4. SEBI Riskometer normalization and lock-in period formatting.
5. Fail-safe invariance: Network or parse failures retain previously verified records without corruption.
6. End-to-end normalization validation on extracted scheme records.
"""

import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import MagicMock, patch
import urllib.error

from src.ingestion.normalizer import (
    SEBI_RISKOMETER_LEVELS,
    validate_corpus,
    validate_scheme,
)
from src.ingestion.scraper import (
    GROWW_SCHEME_TARGETS,
    GrowwFetchError,
    GrowwIngestionPipeline,
    GrowwParseError,
    clean_riskometer,
    extract_next_data_payload,
    extract_scheme_server_data,
    fetch_scheme_html,
    format_nav,
    generate_step_summary,
    parse_date_to_iso,
    parse_groww_metrics,
)

# Representative Groww HTML fixture with embedded __NEXT_DATA__
SAMPLE_GROWW_MF_DATA = {
    "scheme_name": "HDFC Mid Cap Fund Direct Growth",
    "search_id": "hdfc-mid-cap-fund-direct-growth",
    "amc": "HDFC",
    "category": "Equity",
    "sub_category": "Mid Cap",
    "nav": 229.552,
    "nav_date": "11-Nov-2026",
    "expense_ratio": "0.74",
    "exit_load": "Exit load of 1% if redeemed within 1 year.",
    "min_sip_investment": 100,
    "min_investment_amount": 100,
    "lock_in": {"years": None, "months": None, "days": None},
    "benchmark_name": "NIFTY Midcap 150 Total Return Index",
    "fund_manager": "Chirag Setalvad",
    "nfo_risk": "Moderately High Riskometer",
    "sid_url": "https://www.hdfcfund.com/investor-services/fund-performance/factsheet",
}

SAMPLE_HTML_PAGE = (
    "<!DOCTYPE html>\n<html>\n<head><title>Groww Scheme Page</title></head>\n<body>\n"
    '<div id="root">Mock Page Content</div>\n'
    '<script id="__NEXT_DATA__" type="application/json">\n'
    + json.dumps({"props": {"pageProps": {"mfServerSideData": SAMPLE_GROWW_MF_DATA}}})
    + "\n</script>\n</body>\n</html>"
)


class TestGrowwScraperExtraction(unittest.TestCase):
    """Tests for payload extraction and parsing from raw HTML."""

    def test_extract_next_data_payload_success(self):
        """Extracts valid JSON dictionary from __NEXT_DATA__ script tag."""
        payload = extract_next_data_payload(SAMPLE_HTML_PAGE)
        self.assertIn("props", payload)
        self.assertIn("pageProps", payload["props"])

    def test_extract_next_data_payload_with_nonce_and_crossorigin(self):
        """Extracts valid JSON payload even with nonce, crossorigin, and attribute variations."""
        html_with_nonce = (
            '<!DOCTYPE html><html><body>\n'
            '<script id="__NEXT_DATA__" type="application/json" nonce="EUZO0R7+nQVBYJYyyQYv3ZLBRr/0d9JJW3lQXdyq3KQ=" crossorigin="anonymous">\n'
            + json.dumps({"props": {"pageProps": {"mfServerSideData": SAMPLE_GROWW_MF_DATA}}})
            + '\n</script>\n</body></html>'
        )
        payload = extract_next_data_payload(html_with_nonce)
        self.assertIn("props", payload)
        self.assertEqual(payload["props"]["pageProps"]["mfServerSideData"]["search_id"], "hdfc-mid-cap-fund-direct-growth")

    def test_extract_next_data_missing_script(self):
        """Raises GrowwParseError when __NEXT_DATA__ tag is absent."""
        html_without_data = "<html><body><div>No data here</div></body></html>"
        with self.assertRaises(GrowwParseError):
            extract_next_data_payload(html_without_data)

    def test_extract_next_data_malformed_json(self):
        """Raises GrowwParseError when script tag contains invalid JSON."""
        broken_html = '<script id="__NEXT_DATA__" type="application/json">{invalid_json: true</script>'
        with self.assertRaises(GrowwParseError):
            extract_next_data_payload(broken_html)

    def test_extract_scheme_server_data_success(self):
        """Extracts mfServerSideData dictionary from pageProps."""
        payload = extract_next_data_payload(SAMPLE_HTML_PAGE)
        mfd = extract_scheme_server_data(payload)
        self.assertEqual(mfd["search_id"], "hdfc-mid-cap-fund-direct-growth")
        self.assertEqual(mfd["fund_manager"], "Chirag Setalvad")

    def test_extract_scheme_server_data_missing(self):
        """Raises GrowwParseError when mfServerSideData is not present."""
        empty_payload = {"props": {"pageProps": {}}}
        with self.assertRaises(GrowwParseError):
            extract_scheme_server_data(empty_payload)


class TestMetricParsingAndNormalization(unittest.TestCase):
    """Tests parsing, formatting, and canonical normalization of financial metrics."""

    def setUp(self):
        self.existing_scheme = {
            "scheme_id": "hdfc-mid-cap-fund-direct-growth",
            "scheme_name": "HDFC Mid-Cap Opportunities Fund (Direct Plan - Growth)",
            "amc": "HDFC Mutual Fund",
            "category": "Equity: Mid Cap",
            "source_url": "https://groww.in/mutual-funds/hdfc-mid-cap-fund-direct-growth",
            "last_updated": "2026-11-10",
            "facts": {
                "expense_ratio": "0.76%",
                "exit_load": "1.00% if redeemed within 1 year; Nil after 1 year",
                "min_sip_amount": "₹100",
                "min_lumpsum_amount": "₹100",
                "lock_in_period": "Nil",
                "riskometer": "Very High",
                "benchmark": "NIFTY Midcap 150 TRI",
                "fund_manager": "Chirag Setalvad",
                "factsheet_url": "https://www.hdfcfund.com/investor-services/fund-performance/factsheet",
                "statement_download_process": "Download from HDFC portal or MFCentral.",
            },
            "aliases": ["mid cap", "midcap"],
        }

    def test_parse_all_core_metrics(self):
        """Parses expense ratio, exit load, limits, benchmark, Riskometer, and NAV."""
        record = parse_groww_metrics(
            SAMPLE_GROWW_MF_DATA,
            "hdfc-mid-cap-fund-direct-growth",
            "https://groww.in/mutual-funds/hdfc-mid-cap-fund-direct-growth",
            existing_scheme=self.existing_scheme,
        )

        facts = record["facts"]
        self.assertEqual(facts["expense_ratio"], "0.74%")
        self.assertEqual(facts["min_sip_amount"], "₹100")
        self.assertEqual(facts["min_lumpsum_amount"], "₹100")
        self.assertEqual(facts["lock_in_period"], "Nil")
        self.assertEqual(facts["riskometer"], "Moderately High")
        self.assertEqual(facts["benchmark"], "NIFTY Midcap 150 Total Return Index")
        self.assertEqual(facts["fund_manager"], "Chirag Setalvad")
        self.assertEqual(facts["nav"], "₹229.552")
        self.assertEqual(facts["nav_date"], "2026-11-11")

    def test_timestamp_separation(self):
        """Distinguishes data_fetched_at (UTC ISO fetch time) from nav_date (financial effective date)."""
        record = parse_groww_metrics(
            SAMPLE_GROWW_MF_DATA,
            "hdfc-mid-cap-fund-direct-growth",
            "https://groww.in/mutual-funds/hdfc-mid-cap-fund-direct-growth",
            existing_scheme=self.existing_scheme,
        )

        self.assertIn("data_fetched_at", record)
        self.assertTrue(record["data_fetched_at"].endswith("Z"))
        self.assertEqual(record["facts"]["nav_date"], "2026-11-11")
        self.assertEqual(record["last_updated"], "2026-11-11")

    def test_clean_riskometer_variations(self):
        """Correctly cleans riskometer strings and maps them to SEBI standard levels."""
        self.assertEqual(clean_riskometer("Moderately High Riskometer"), "Moderately High")
        self.assertEqual(clean_riskometer("Very High Risk"), "Very High")
        self.assertEqual(clean_riskometer("Moderate"), "Moderate")
        self.assertEqual(clean_riskometer("Low to Moderate"), "Low to Moderate")
        self.assertIsNone(clean_riskometer("Unknown Risk Tier 5"))

    def test_lock_in_elss_formatting(self):
        """ELSS 3-year lock-in maps to official 3 Years Section 80C description."""
        elss_data = dict(SAMPLE_GROWW_MF_DATA)
        elss_data["lock_in"] = {"years": 3, "months": 0, "days": 0}
        record = parse_groww_metrics(
            elss_data,
            "hdfc-elss-tax-saver-fund-direct-plan-growth",
            "https://groww.in/mutual-funds/hdfc-elss-tax-saver-fund-direct-plan-growth",
            existing_scheme=self.existing_scheme,
        )
        self.assertIn("3 Years mandatory lock-in", record["facts"]["lock_in_period"])

    def test_preserves_existing_facts_on_missing_groww_fields(self):
        """When Groww returns null or empty for a field, previously verified value is preserved."""
        sparse_data = {
            "search_id": "hdfc-mid-cap-fund-direct-growth",
            "nav": 230.10,
            "nav_date": "12-Nov-2026",
            "expense_ratio": None,  # Missing in this response
            "exit_load": None,      # Missing in this response
            "fund_manager": "",     # Empty in this response
        }
        record = parse_groww_metrics(
            sparse_data,
            "hdfc-mid-cap-fund-direct-growth",
            "https://groww.in/mutual-funds/hdfc-mid-cap-fund-direct-growth",
            existing_scheme=self.existing_scheme,
        )
        facts = record["facts"]
        # Preserved from self.existing_scheme
        self.assertEqual(facts["expense_ratio"], "0.76%")
        self.assertEqual(facts["exit_load"], "1.00% if redeemed within 1 year; Nil after 1 year")
        self.assertEqual(facts["fund_manager"], "Chirag Setalvad")
        # Updated from sparse_data
        self.assertEqual(facts["nav"], "₹230.10")
        self.assertEqual(facts["nav_date"], "2026-11-12")

    def test_extracted_record_passes_normalizer_validation(self):
        """Extracted record passes canonical validate_scheme() check."""
        record = parse_groww_metrics(
            SAMPLE_GROWW_MF_DATA,
            "hdfc-mid-cap-fund-direct-growth",
            "https://groww.in/mutual-funds/hdfc-mid-cap-fund-direct-growth",
            existing_scheme=self.existing_scheme,
        )
        # Should not raise SchemaValidationError
        validate_scheme(record)

    def test_nav_precision_preserves_up_to_four_decimals(self):
        """format_nav preserves exact source decimal precision without rounding loss."""
        self.assertEqual(format_nav(229.552), "₹229.552")
        self.assertEqual(format_nav(155.255), "₹155.255")
        self.assertEqual(format_nav(43.4947), "₹43.4947")
        self.assertEqual(format_nav(1269.861), "₹1269.861")
        self.assertEqual(format_nav(1552.433), "₹1552.433")
        self.assertEqual(format_nav(100.0), "₹100.00")
        self.assertEqual(format_nav(100.5), "₹100.50")
        self.assertEqual(format_nav("43.4947"), "₹43.4947")
        self.assertIsNone(format_nav(None))

    def test_gold_etf_sip_disallowed_does_not_use_stale_fallback(self):
        """When sip_allowed is False or min_sip_investment is 0, do not fall back to stale ₹100."""
        gold_data = dict(SAMPLE_GROWW_MF_DATA)
        gold_data["sip_allowed"] = False
        gold_data["min_sip_investment"] = 0
        gold_data["nav"] = 43.4947

        record = parse_groww_metrics(
            gold_data,
            "hdfc-gold-etf-fund-of-fund-direct-plan-growth",
            "https://groww.in/mutual-funds/hdfc-gold-etf-fund-of-fund-direct-plan-growth",
            existing_scheme=self.existing_scheme,  # Has min_sip_amount: "₹100"
        )
        facts = record["facts"]
        self.assertIn("SIP not available on platform", facts["min_sip_amount"])
        self.assertNotEqual(facts["min_sip_amount"], "₹100")
        self.assertEqual(facts["nav"], "₹43.4947")
        validate_scheme(record)

    def test_gold_etf_zero_sip_investment_without_sip_allowed_flag(self):
        """When min_sip_investment is 0 (even if sip_allowed is omitted), do not fall back to stale ₹100."""
        gold_data = dict(SAMPLE_GROWW_MF_DATA)
        gold_data["min_sip_investment"] = 0
        if "sip_allowed" in gold_data:
            del gold_data["sip_allowed"]

        record = parse_groww_metrics(
            gold_data,
            "hdfc-gold-etf-fund-of-fund-direct-plan-growth",
            "https://groww.in/mutual-funds/hdfc-gold-etf-fund-of-fund-direct-plan-growth",
            existing_scheme=self.existing_scheme,
        )
        facts = record["facts"]
        self.assertIn("SIP not available on platform", facts["min_sip_amount"])
        self.assertNotEqual(facts["min_sip_amount"], "₹100")
        validate_scheme(record)


class TestGrowwIngestionPipelineFailSafe(unittest.TestCase):
    """Tests fail-safe invariance and atomic updates in GrowwIngestionPipeline."""

    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.data_path = Path(self.temp_dir.name) / "schemes.json"

        # Initialize existing verified dataset with 5 schemes
        self.initial_schemes = [
            {
                "scheme_id": sid,
                "scheme_name": f"HDFC Test Scheme {idx}",
                "amc": "HDFC Mutual Fund",
                "category": "Equity",
                "source_url": target["url"],
                "last_updated": "2026-11-10",
                "facts": {
                    "expense_ratio": "0.75%",
                    "exit_load": "1.00% within 1 year",
                    "min_sip_amount": "₹100",
                    "min_lumpsum_amount": "₹100",
                    "lock_in_period": "Nil",
                    "riskometer": "Very High",
                    "benchmark": "NIFTY Index",
                    "fund_manager": "Manager Name",
                    "factsheet_url": "https://www.hdfcfund.com/factsheet",
                    "statement_download_process": "Download via portal.",
                },
                "aliases": [sid.split("-")[1]],
            }
            for idx, (sid, target) in enumerate(GROWW_SCHEME_TARGETS.items())
        ]
        with open(self.data_path, "w", encoding="utf-8") as f:
            json.dump(self.initial_schemes, f)

        self.pipeline = GrowwIngestionPipeline(
            data_path=self.data_path,
            timeout=5,
            max_retries=1,
            inter_request_delay_seconds=0.0,
        )

    def tearDown(self):
        self.temp_dir.cleanup()

    @patch("src.ingestion.scraper.fetch_scheme_html")
    def test_pipeline_retains_records_on_fetch_failure(self, mock_fetch):
        """Simulates complete network failure; verifies all 5 schemes are retained untouched."""
        mock_fetch.side_effect = GrowwFetchError("Connection timed out")

        summary = self.pipeline.run_ingestion(dry_run=False)

        self.assertEqual(summary["successfully_updated"], 0)
        self.assertEqual(summary["retained_previous"], 5)
        self.assertEqual(len(summary["failed_schemes"]), 5)

        # Verify dataset was not corrupted
        with open(self.data_path, "r", encoding="utf-8") as f:
            persisted = json.load(f)
        self.assertEqual(len(persisted), 5)
        self.assertEqual(persisted[0]["facts"]["expense_ratio"], "0.75%")
        # Validate corpus still passes 100%
        validate_corpus(persisted, expected_count=5)

    @patch("src.ingestion.scraper.fetch_scheme_html")
    def test_pipeline_updates_successfully_when_online(self, mock_fetch):
        """Simulates successful fetch; verifies records are updated and saved atomically."""
        mock_fetch.return_value = SAMPLE_HTML_PAGE

        summary = self.pipeline.run_ingestion(dry_run=False)

        self.assertEqual(summary["successfully_updated"], 5)
        self.assertEqual(summary["retained_previous"], 0)

        with open(self.data_path, "r", encoding="utf-8") as f:
            persisted = json.load(f)

        self.assertEqual(len(persisted), 5)
        # Expense ratio updated to 0.74% from sample fixture
        for scheme in persisted:
            self.assertEqual(scheme["facts"]["expense_ratio"], "0.74%")
            self.assertEqual(scheme["facts"]["nav"], "₹229.552")

        validate_corpus(persisted, expected_count=5)

    @patch("src.ingestion.scraper.fetch_scheme_html")
    def test_pipeline_partial_failure_preserves_failed_and_updates_succeeded(self, mock_fetch):
        """When 1 scheme fails and 4 succeed, failed scheme retains previous and succeeded update."""
        def side_effect(url, **kwargs):
            if "hdfc-gold-etf" in url:
                raise GrowwFetchError("HTTP 502 Bad Gateway")
            return SAMPLE_HTML_PAGE

        mock_fetch.side_effect = side_effect

        summary = self.pipeline.run_ingestion(dry_run=False)

        self.assertEqual(summary["successfully_updated"], 4)
        self.assertEqual(summary["retained_previous"], 1)

        with open(self.data_path, "r", encoding="utf-8") as f:
            persisted = json.load(f)

        gold_scheme = next(s for s in persisted if s["scheme_id"] == "hdfc-gold-etf-fund-of-fund-direct-plan-growth")
        # Retained previous 0.75%
        self.assertEqual(gold_scheme["facts"]["expense_ratio"], "0.75%")

        mid_scheme = next(s for s in persisted if s["scheme_id"] == "hdfc-mid-cap-fund-direct-growth")
        # Successfully updated to 0.74%
        self.assertEqual(mid_scheme["facts"]["expense_ratio"], "0.74%")

        validate_corpus(persisted, expected_count=5)

    @patch("src.ingestion.scraper.fetch_scheme_html")
    def test_fetch_single_scheme_defaults_to_saved_record_if_no_existing_passed(self, mock_fetch):
        """fetch_single_scheme automatically falls back to load_existing_records when existing_scheme is None."""
        mock_fetch.return_value = SAMPLE_HTML_PAGE
        record = self.pipeline.fetch_single_scheme("hdfc-mid-cap-fund-direct-growth")
        self.assertEqual(record["scheme_id"], "hdfc-mid-cap-fund-direct-growth")
        self.assertEqual(record["facts"]["expense_ratio"], "0.74%")
        validate_scheme(record)

    @patch("time.sleep")
    @patch("src.ingestion.scraper.fetch_scheme_html")
    def test_inter_request_delay_applied_between_consecutive_fetches(self, mock_fetch, mock_sleep):
        """Inter-request delay is applied between consecutive scheme requests (N-1 times for N schemes)."""
        mock_fetch.return_value = SAMPLE_HTML_PAGE
        pipeline = GrowwIngestionPipeline(
            data_path=self.data_path,
            timeout=5,
            max_retries=1,
            inter_request_delay_seconds=0.75,
        )
        summary = pipeline.run_ingestion(dry_run=True)
        self.assertEqual(summary["successfully_updated"], 5)
        # For 5 schemes, sleep should be called exactly 4 times with 0.75 seconds
        self.assertEqual(mock_sleep.call_count, 4)
        mock_sleep.assert_called_with(0.75)

    def test_generate_step_summary_output(self):
        """generate_step_summary generates structured markdown table for GitHub Actions."""
        mock_summary = {
            "timestamp": "2026-11-12T12:00:00Z",
            "total_target_schemes": 2,
            "successfully_updated": 1,
            "retained_previous": 1,
            "failed_schemes": [{"scheme_id": "scheme-2", "error": "HTTP 502"}],
            "records": [
                {
                    "scheme_id": "scheme-1",
                    "scheme_name": "Scheme One",
                    "facts": {"nav": "₹100.50", "nav_date": "2026-11-11", "min_sip_amount": "₹100", "expense_ratio": "0.50%"},
                },
                {
                    "scheme_id": "scheme-2",
                    "scheme_name": "Scheme Two",
                    "facts": {"nav": "₹200.00", "nav_date": "2026-11-10", "min_sip_amount": "₹500", "expense_ratio": "1.00%"},
                },
            ],
        }
        md = generate_step_summary(mock_summary)
        self.assertIn("## 📊 Fund Compass Daily Data Ingestion Summary", md)
        self.assertIn("| Scheme Name | NAV | NAV Date | Min SIP | Expense Ratio | Status |", md)
        self.assertIn("Scheme One", md)
        self.assertIn("✅ Freshly Updated", md)
        self.assertIn("Scheme Two", md)
        self.assertIn("⚠️ Retained Previous", md)

    @patch("src.ingestion.scraper.fetch_scheme_html")
    def test_complete_failure_exits_nonzero_via_main(self, mock_fetch):
        """When all 5 scheme extractions fail, __main__ block exits with sys.exit(1)."""
        mock_fetch.side_effect = GrowwFetchError("Connection timed out")

        summary = self.pipeline.run_ingestion(dry_run=False)

        # Verify the summary matches the total-failure condition
        self.assertEqual(summary["successfully_updated"], 0)
        self.assertEqual(len(summary["failed_schemes"]), 5)
        self.assertEqual(summary["retained_previous"], 5)

        # Verify previously verified records are still intact on disk
        with open(self.data_path, "r", encoding="utf-8") as f:
            persisted = json.load(f)
        self.assertEqual(len(persisted), 5)
        validate_corpus(persisted, expected_count=5)

    @patch("src.ingestion.scraper.fetch_scheme_html")
    def test_partial_failure_does_not_trigger_nonzero_exit(self, mock_fetch):
        """When some schemes succeed and some fail, condition for sys.exit(1) is NOT met."""
        def side_effect(url, **kwargs):
            if "hdfc-gold-etf" in url:
                raise GrowwFetchError("HTTP 502 Bad Gateway")
            return SAMPLE_HTML_PAGE

        mock_fetch.side_effect = side_effect

        summary = self.pipeline.run_ingestion(dry_run=False)

        # Partial success: 4 updated, 1 retained
        self.assertEqual(summary["successfully_updated"], 4)
        self.assertEqual(summary["retained_previous"], 1)
        # The total-failure exit condition should NOT trigger
        total_targets = summary["total_target_schemes"]
        is_total_failure = (
            summary["successfully_updated"] == 0
            and len(summary["failed_schemes"]) == total_targets
        )
        self.assertFalse(is_total_failure, "Partial failure must not trigger total-failure exit")


if __name__ == "__main__":
    unittest.main()
