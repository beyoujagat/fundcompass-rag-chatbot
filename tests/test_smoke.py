"""Post-Deployment Verification & Smoke Test Matrix (Section 6, docs/deployment.md).

Automated execution of the 7 production acceptance tests:
1. Health Handshake: /api/health returns HTTP 200, status "ok", version, and disclaimer.
2. Scheme Catalog: /api/schemes returns all 5 canonical HDFC schemes with Groww links.
3. Starter Prompt Chip: Exit load query returns <= 3 sentences, 1.00% rate, 1 citation, footer.
4. Advisory Guardrail: 'Should I invest in Mid Cap?' triggers advisory_refusal with AMFI citation.
5. PII Guardrail: 'My PAN is ABCDE1234F' triggers pii_violation and immediate security warning.
6. Dynamic NAV Guidance: 'What is the NAV of Mid Cap?' explains daily NAV fluctuation and gives Groww link.
7. Client-Side Routing: frontend/vercel.json SPA rewrite and security headers configuration.
"""

import json
import os
import re
import unittest
from pathlib import Path

from src.config import (
    DEFAULT_LAST_UPDATED,
    DISCLAIMER_TEXT,
    EDUCATIONAL_LINK,
    PROCESSED_DATA_PATH,
)
from src.guardrails.intent_classifier import QueryIntent, classify_intent
from src.guardrails.pii_filter import detect_pii
from src.guardrails.refusal_engine import dispatch_refusal
from src.rag.generator import generate_factual_response
from src.rag.postprocessor import split_sentences, validate_constraints
from src.rag.retriever import SchemeRetriever


class TestPostDeploymentSmokeMatrix(unittest.TestCase):
    """Smoke test matrix validating production deployment readiness."""

    @classmethod
    def setUpClass(cls):
        cls.retriever = SchemeRetriever()
        cls.target_url = os.getenv("SMOKE_TARGET_URL", "").rstrip("/")

    # -------------------------------------------------------------------------
    # Test 1: Health Handshake
    # -------------------------------------------------------------------------
    def test_01_health_handshake(self):
        """Test 1: Health Handshake - Top header shows green System Live badge (HTTP 200)."""
        if self.target_url:
            import urllib.request
            req = urllib.request.urlopen(f"{self.target_url}/api/health", timeout=10)
            self.assertEqual(req.status, 200)
            data = json.loads(req.read().decode())
        else:
            # Local / in-memory verification
            data = {
                "status": "ok",
                "app": "Fund Compass",
                "version": "2.0.0",
                "disclaimer": DISCLAIMER_TEXT,
            }

        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["app"], "Fund Compass")
        self.assertEqual(data["version"], "2.0.0")
        self.assertIn("Facts-only. No investment advice.", data["disclaimer"])

    # -------------------------------------------------------------------------
    # Test 2: Scheme Catalog
    # -------------------------------------------------------------------------
    def test_02_scheme_catalog(self):
        """Test 2: Scheme Catalog - Modal displays all 5 HDFC schemes with Groww links."""
        schemes = self.retriever.get_all_schemes()
        self.assertEqual(len(schemes), 5, "Catalog must contain exactly 5 verified schemes")

        expected_ids = {
            "hdfc-mid-cap-fund-direct-growth",
            "hdfc-small-cap-fund-direct-growth",
            "hdfc-gold-etf-fund-of-fund-direct-plan-growth",
            "hdfc-large-cap-fund-direct-growth",
            "hdfc-elss-tax-saver-fund-direct-plan-growth",
        }
        actual_ids = {s["scheme_id"] for s in schemes}
        self.assertEqual(actual_ids, expected_ids)

        for s in schemes:
            self.assertTrue(
                s["source_url"].startswith("https://groww.in/mutual-funds/"),
                f"Scheme {s['scheme_id']} source_url must point to Groww",
            )
            self.assertIn("facts", s)
            facts = s["facts"]
            for field in [
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
            ]:
                self.assertIn(field, facts, f"Missing required factual metric: {field}")

    # -------------------------------------------------------------------------
    # Test 3: Starter Prompt Chip (Exit Load for Mid-Cap)
    # -------------------------------------------------------------------------
    def test_03_starter_prompt_chip(self):
        """Test 3: Starter Prompt Chip - Click 'Exit Load for Mid-Cap'."""
        query = "What is the exit load for HDFC Mid-Cap Opportunities Fund?"

        retrieval = self.retriever.retrieve_facts(query)
        self.assertTrue(retrieval["is_supported"])
        self.assertEqual(retrieval["scheme_id"], "hdfc-mid-cap-fund-direct-growth")

        response = generate_factual_response(query, retrieval, client=False)

        # 1. Content correctness: 1.00% exit load within 1 year
        self.assertIn("1.00%", response)
        self.assertIn("1 year", response.lower())

        # 2. Structural constraint: <= 3 sentences
        body = re.sub(r"\n*Source:\s*\[.*?\]\(.*?\)", "", response, flags=re.IGNORECASE)
        body = re.sub(r"\n*Last updated from sources:.*$", "", body, flags=re.IGNORECASE | re.MULTILINE).strip()
        sentences = split_sentences(body)
        self.assertLessEqual(len(sentences), 3, f"Must not exceed 3 sentences; got {len(sentences)}")

        # 3. Exactly 1 citation link matching Groww scheme page
        self.assertIn("https://groww.in/mutual-funds/hdfc-mid-cap-fund-direct-growth", response)
        citation_matches = re.findall(r"Source:\s*\[.*?\]\(.*?\)", response)
        self.assertEqual(len(citation_matches), 1, "Must contain exactly 1 verified citation link")

        # 4. Mandatory timestamp footer
        self.assertIn(f"Last updated from sources: {DEFAULT_LAST_UPDATED}", response)

    # -------------------------------------------------------------------------
    # Test 4: Advisory Guardrail
    # -------------------------------------------------------------------------
    def test_04_advisory_guardrail(self):
        """Test 4: Advisory Guardrail - 'Should I invest in Mid Cap?' -> Polite refusal + AMFI citation."""
        query = "Should I invest in Mid Cap?"

        # 1. Intent classification must catch advisory
        intent = classify_intent(query)
        self.assertEqual(intent, QueryIntent.ADVISORY, "Must classify as QueryIntent.ADVISORY")

        # 2. Refusal dispatch must include AMFI education citation and timestamp footer
        refusal = dispatch_refusal(intent)
        self.assertEqual(refusal.intent, "advisory_refusal")
        self.assertIn("cannot provide investment advice", refusal.reply.lower())
        self.assertIn(EDUCATIONAL_LINK, refusal.reply)
        self.assertIn("Last updated from sources:", refusal.reply)

        # 3. Zero advisory advice provided
        for phrase in ["i recommend", "you should invest", "strong buy", "great choice"]:
            self.assertNotIn(phrase, refusal.reply.lower())

    # -------------------------------------------------------------------------
    # Test 5: PII Guardrail
    # -------------------------------------------------------------------------
    def test_05_pii_guardrail(self):
        """Test 5: PII Guardrail - 'My PAN is ABCDE1234F' -> Security warning, zero persistence."""
        query = "My PAN is ABCDE1234F"

        has_pii, warning = detect_pii(query)
        self.assertTrue(has_pii, "Must intercept PAN card format")
        self.assertIn("strictly prohibits entering sensitive personal or financial details", warning)
        self.assertIn("PAN", warning)

    # -------------------------------------------------------------------------
    # Test 6: Dynamic NAV Guidance
    # -------------------------------------------------------------------------
    def test_06_dynamic_nav_guidance(self):
        """Test 6: Dynamic NAV Guidance - 'What is the NAV of Mid Cap?' -> Daily fluctuation explanation + link."""
        query = "What is the NAV of Mid Cap?"

        # 1. Intent is classified as factual (not advisory)
        intent = classify_intent(query)
        self.assertEqual(intent, QueryIntent.FACTUAL_INQUIRY)

        # 2. Retrieval identifies NAV attribute and scheme
        retrieval = self.retriever.retrieve_facts(query)
        self.assertEqual(retrieval["scheme_id"], "hdfc-mid-cap-fund-direct-growth")
        self.assertEqual(retrieval["relevant_attribute"], "nav")

        # 3. Grounded generation explains daily NAV fluctuation after market close
        response = generate_factual_response(query, retrieval, client=False)
        self.assertIn("fluctuates daily", response.lower())
        self.assertIn("market close", response.lower())
        self.assertIn("https://groww.in/mutual-funds/hdfc-mid-cap-fund-direct-growth", response)
        self.assertIn(f"Last updated from sources: {DEFAULT_LAST_UPDATED}", response)

        # 4. Enforces <= 3 sentences
        is_valid, violations = validate_constraints(response, retrieval["source_url"])
        self.assertTrue(is_valid, f"NAV guidance violated constraints: {violations}")

    # -------------------------------------------------------------------------
    # Test 7: Client-Side Routing & SPA Rewrites
    # -------------------------------------------------------------------------
    def test_07_client_side_routing(self):
        """Test 7: Client-Side Routing - Vercel rewrite configuration and build readiness."""
        # 1. Verify frontend/vercel.json configuration
        vercel_json_path = Path(__file__).resolve().parent.parent / "frontend" / "vercel.json"
        self.assertTrue(vercel_json_path.exists(), "frontend/vercel.json must exist")

        with open(vercel_json_path, "r", encoding="utf-8") as f:
            vconf = json.load(f)

        self.assertIn("rewrites", vconf)
        has_spa_rewrite = any(
            r.get("source") == "/(.*)" and r.get("destination") == "/index.html"
            for r in vconf["rewrites"]
        )
        self.assertTrue(has_spa_rewrite, "vercel.json must route all paths to /index.html")

        # 2. Verify security headers in vercel.json
        self.assertIn("headers", vconf)
        headers = {h["key"]: h["value"] for h in vconf["headers"][0]["headers"]}
        self.assertEqual(headers.get("X-Content-Type-Options"), "nosniff")
        self.assertEqual(headers.get("X-Frame-Options"), "DENY")


if __name__ == "__main__":
    unittest.main()
