"""Unit and Integration Tests for Phase 4 Task 1: Scheme Resolver & Retriever.

Validates:
1. Canonical alias mapping across all 5 verified HDFC schemes (EV-P4-01).
2. Elimination of cross-fund ambiguity and false mapping.
3. Unsupported scheme fallback for competitor AMCs and non-corpus categories (EV-P4-02).
4. Factual parameter attribute extraction across all 10 core fields.
5. ChromaDB vector store integration, top-k retrieval, and metadata isolation.
"""

import unittest
from pathlib import Path

from src.rag.retriever import (
    SchemeRetriever,
    detect_unsupported_scheme,
    resolve_scheme,
    retrieve_facts,
)
from src.rag.generator import (
    generate_factual_response,
    generate_factual_response_detailed,
    GenerationResult,
)


class TestSchemeResolver(unittest.TestCase):
    """Evaluation EV-P4-01: Entity Resolution & Canonical Mapping."""

    def setUp(self):
        self.retriever = SchemeRetriever()

    def test_mid_cap_canonical_resolution(self):
        """Verify mid-cap queries map to hdfc-mid-cap-fund-direct-growth."""
        probes = [
            "What is the exit load for HDFC Mid-Cap Opportunities Fund?",
            "Tell me about HDFC mid-cap fund",
            "What is the expense ratio for mid cap?",
            "midcap opportunities fund manager",
            "hdfc midcap minimum SIP amount",
        ]
        for query in probes:
            scheme = self.retriever.resolve_scheme(query)
            self.assertIsNotNone(scheme, f"Failed to resolve: {query}")
            self.assertEqual(
                scheme["scheme_id"],
                "hdfc-mid-cap-fund-direct-growth",
                f"Mismatch for query: {query}",
            )

    def test_small_cap_canonical_resolution(self):
        """Verify small-cap queries map to hdfc-small-cap-fund-direct-growth."""
        probes = [
            "What is the expense ratio of HDFC Small Cap Fund?",
            "hdfc small cap exit load",
            "small-cap fund minimum investment",
            "hdfc small fund manager",
            "What is the riskometer of smallcap?",
        ]
        for query in probes:
            scheme = self.retriever.resolve_scheme(query)
            self.assertIsNotNone(scheme, f"Failed to resolve: {query}")
            self.assertEqual(
                scheme["scheme_id"],
                "hdfc-small-cap-fund-direct-growth",
                f"Mismatch for query: {query}",
            )

    def test_gold_etf_fof_canonical_resolution(self):
        """Verify gold FoF queries map to hdfc-gold-etf-fund-of-fund-direct-plan-growth."""
        probes = [
            "Tell me about HDFC Gold ETF Fund of Fund",
            "What is the minimum SIP for HDFC Gold ETF FoF?",
            "hdfc gold fund exit load",
            "gold etf fund of fund expense ratio",
            "gold fund benchmark",
        ]
        for query in probes:
            scheme = self.retriever.resolve_scheme(query)
            self.assertIsNotNone(scheme, f"Failed to resolve: {query}")
            self.assertEqual(
                scheme["scheme_id"],
                "hdfc-gold-etf-fund-of-fund-direct-plan-growth",
                f"Mismatch for query: {query}",
            )

    def test_large_cap_top_100_canonical_resolution(self):
        """Verify top 100 / large cap queries map to hdfc-large-cap-fund-direct-growth."""
        probes = [
            "What benchmark index does HDFC Top 100 use?",
            "What is the expense ratio of HDFC Large Cap?",
            "hdfc top 100 fund manager",
            "top 100 minimum lumpsum amount",
            "hdfc largecap exit load",
        ]
        for query in probes:
            scheme = self.retriever.resolve_scheme(query)
            self.assertIsNotNone(scheme, f"Failed to resolve: {query}")
            self.assertEqual(
                scheme["scheme_id"],
                "hdfc-large-cap-fund-direct-growth",
                f"Mismatch for query: {query}",
            )

    def test_elss_tax_saver_canonical_resolution(self):
        """Verify ELSS / tax saver queries map to hdfc-elss-tax-saver-fund-direct-plan-growth."""
        probes = [
            "What is the lock-in period for HDFC ELSS Tax Saver Fund?",
            "hdfc elss tax saver expense ratio",
            "What is the mandatory 80C holding period for tax saver?",
            "hdfc tax saver minimum SIP",
            "section 80c tax saving fund exit load",
        ]
        for query in probes:
            scheme = self.retriever.resolve_scheme(query)
            self.assertIsNotNone(scheme, f"Failed to resolve: {query}")
            self.assertEqual(
                scheme["scheme_id"],
                "hdfc-elss-tax-saver-fund-direct-plan-growth",
                f"Mismatch for query: {query}",
            )

    def test_zero_cross_fund_leakage_in_disambiguation(self):
        """Verify mid-cap and small-cap are never confused with each other."""
        mid = self.retriever.resolve_scheme("hdfc mid cap expense ratio")
        small = self.retriever.resolve_scheme("hdfc small cap expense ratio")
        self.assertNotEqual(mid["scheme_id"], small["scheme_id"])
        self.assertEqual(mid["scheme_id"], "hdfc-mid-cap-fund-direct-growth")
        self.assertEqual(small["scheme_id"], "hdfc-small-cap-fund-direct-growth")


class TestUnsupportedSchemeHandling(unittest.TestCase):
    """Evaluation EV-P4-02: Unsupported Scheme Detection and Fallback."""

    def setUp(self):
        self.retriever = SchemeRetriever()

    def test_competitor_amc_unsupported_fallback(self):
        """Verify competitor funds are rejected and never mapped to HDFC schemes."""
        competitor_queries = [
            "What is the expense ratio of SBI Bluechip Fund?",
            "What is the exit load for Axis Long Term Equity Fund?",
            "Tell me about ICICI Prudential Bharat 22 ETF",
            "Nippon India Small Cap Fund minimum SIP",
            "What is the benchmark of Kotak Emerging Equity Fund?",
            "Mirae Asset Large Cap Fund expense ratio",
            "Parag Parikh Flexi Cap Fund exit load",
            "UTI Nifty 50 Index Fund expense ratio",
        ]
        for query in competitor_queries:
            scheme = self.retriever.resolve_scheme(query)
            self.assertIsNone(
                scheme,
                f"Competitor scheme was falsely mapped to HDFC: {query} -> {scheme}",
            )

    def test_detect_unsupported_scheme_returns_competitor_name(self):
        """Verify detect_unsupported_scheme captures competitor AMC or product name."""
        self.assertIsNotNone(self.retriever.detect_unsupported_scheme("SBI Bluechip Fund"))
        self.assertIsNotNone(self.retriever.detect_unsupported_scheme("Axis Long Term Equity"))
        self.assertIsNotNone(self.retriever.detect_unsupported_scheme("ICICI Prudential Technology"))
        self.assertIsNotNone(self.retriever.detect_unsupported_scheme("Flexi Cap fund"))

    def test_retrieve_facts_unsupported_scheme_flags(self):
        """Verify retrieve_facts marks is_supported=False for unsupported funds."""
        result = self.retriever.retrieve_facts("What is the expense ratio of SBI Bluechip Fund?")
        self.assertFalse(result["is_supported"])
        self.assertIsNone(result["scheme"])
        self.assertIsNone(result["scheme_id"])
        self.assertIsNotNone(result["unsupported_scheme"])
        self.assertEqual(result["source_url"], "https://groww.in/mutual-funds")


class TestAttributeExtraction(unittest.TestCase):
    """Verify extraction of all canonical factual parameters."""

    def setUp(self):
        self.retriever = SchemeRetriever()

    def test_extract_expense_ratio(self):
        attr = self.retriever.extract_attribute("What is the expense ratio of HDFC Mid-Cap?")
        self.assertEqual(attr, "expense_ratio")

    def test_extract_exit_load(self):
        attr = self.retriever.extract_attribute("What is the exit load for HDFC Small Cap?")
        self.assertEqual(attr, "exit_load")

    def test_extract_min_sip(self):
        attr = self.retriever.extract_attribute("What is the minimum SIP amount for HDFC Gold FoF?")
        self.assertEqual(attr, "min_sip_amount")

    def test_extract_min_lumpsum(self):
        attr = self.retriever.extract_attribute("What is the minimum lumpsum investment for Top 100?")
        self.assertEqual(attr, "min_lumpsum_amount")

    def test_extract_lock_in_period(self):
        attr = self.retriever.extract_attribute("What is the lock-in period for HDFC ELSS?")
        self.assertEqual(attr, "lock_in_period")

    def test_extract_riskometer(self):
        attr = self.retriever.extract_attribute("What is the Riskometer rating for HDFC Mid-Cap?")
        self.assertEqual(attr, "riskometer")

    def test_extract_benchmark(self):
        attr = self.retriever.extract_attribute("What benchmark index does HDFC Top 100 track?")
        self.assertEqual(attr, "benchmark")

    def test_extract_fund_manager(self):
        attr = self.retriever.extract_attribute("Who is the fund manager of HDFC Small Cap?")
        self.assertEqual(attr, "fund_manager")

    def test_extract_statement_download(self):
        attr = self.retriever.extract_attribute("How do I download my capital gains statement?")
        self.assertEqual(attr, "statement_download_process")


class TestVectorRetrievalIntegration(unittest.TestCase):
    """Verify ChromaDB semantic retrieval and grounded facts retrieval."""

    def setUp(self):
        self.retriever = SchemeRetriever()

    def test_retrieve_facts_structure_for_supported_scheme(self):
        """Verify retrieve_facts returns fully populated schema for supported queries."""
        query = "What is the exit load for HDFC Mid-Cap Opportunities Fund?"
        result = self.retriever.retrieve_facts(query, top_k=2)

        self.assertTrue(result["is_supported"])
        self.assertEqual(result["scheme_id"], "hdfc-mid-cap-fund-direct-growth")
        self.assertIn("HDFC Mid-Cap Opportunities Fund", result["scheme"]["scheme_name"])
        self.assertEqual(result["relevant_attribute"], "exit_load")
        self.assertEqual(result["source_url"], "https://groww.in/mutual-funds/hdfc-mid-cap-fund-direct-growth")
        self.assertEqual(result["last_updated"], "2026-11-10")
        self.assertIn("1.00%", result["facts"]["exit_load"])

        # Vector chunks verification
        self.assertIsInstance(result["retrieved_chunks"], list)
        self.assertGreaterEqual(len(result["retrieved_chunks"]), 1)
        # Verify text snippet contains relevant information
        combined_text = " ".join(result["retrieved_chunks"])
        self.assertIn("exit load", combined_text.lower())
        self.assertIn("1.00%", combined_text)

    def test_zero_cross_fund_leakage_in_vector_results(self):
        """Verify vector retrieval strictly isolates chunks to the queried scheme."""
        query = "What is the lock-in period for HDFC ELSS Tax Saver Fund?"
        result = self.retriever.retrieve_facts(query, top_k=2)

        self.assertEqual(result["scheme_id"], "hdfc-elss-tax-saver-fund-direct-plan-growth")
        # Every retrieved chunk metadata must match the target scheme_id
        for meta in result["chunk_metadatas"]:
            self.assertEqual(meta["scheme_id"], "hdfc-elss-tax-saver-fund-direct-plan-growth")

    def test_get_all_schemes_count(self):
        """Verify get_all_schemes returns exactly 5 verified schemes."""
        schemes = self.retriever.get_all_schemes()
        self.assertEqual(len(schemes), 5)

    def test_get_scheme_by_id(self):
        """Verify get_scheme_by_id returns correct scheme object."""
        scheme = self.retriever.get_scheme_by_id("hdfc-large-cap-fund-direct-growth")
        self.assertIsNotNone(scheme)
        self.assertEqual(scheme["facts"]["benchmark"], "NIFTY 100 TRI")

        none_scheme = self.retriever.get_scheme_by_id("non-existent-fund")
        self.assertIsNone(none_scheme)

    def test_convenience_functions(self):
        """Verify module-level convenience functions."""
        res_scheme = resolve_scheme("hdfc top 100")
        self.assertIsNotNone(res_scheme)
        self.assertEqual(res_scheme["scheme_id"], "hdfc-large-cap-fund-direct-growth")

        facts = retrieve_facts("What is the minimum SIP for HDFC Small Cap?", top_k=1)
        self.assertEqual(facts["scheme_id"], "hdfc-small-cap-fund-direct-growth")
        self.assertEqual(facts["relevant_attribute"], "min_sip_amount")

        unsupported = detect_unsupported_scheme("Axis Long Term Equity")
        self.assertIsNotNone(unsupported)


class TestGroqGeneratorFallback(unittest.TestCase):
    """Evaluation EV-P4-07: Deterministic Fallback Engine for Groq Generator."""

    def setUp(self):
        self.retriever = SchemeRetriever()

    def test_fallback_exit_load_hdfc_mid_cap(self):
        query = "What is the exit load for HDFC Mid-Cap Opportunities Fund?"
        data = self.retriever.retrieve_facts(query)
        result = generate_factual_response(query, data, client=False)

        self.assertIn("exit load", result.lower())
        self.assertIn("1.00%", result)
        self.assertIn("Source: [https://groww.in/mutual-funds/hdfc-mid-cap-fund-direct-growth]", result)
        self.assertIn("Last updated from sources: 2026-11-10", result)

    def test_fallback_expense_ratio_hdfc_small_cap(self):
        query = "What is the expense ratio of HDFC Small Cap Fund?"
        data = self.retriever.retrieve_facts(query)
        result = generate_factual_response(query, data, client=False)

        self.assertIn("expense ratio", result.lower())
        self.assertIn("0.67%", result)
        self.assertIn("Source: [https://groww.in/mutual-funds/hdfc-small-cap-fund-direct-growth]", result)
        self.assertIn("Last updated from sources: 2026-11-10", result)

    def test_fallback_lock_in_period_hdfc_elss(self):
        query = "What is the lock-in period for HDFC ELSS Tax Saver Fund?"
        data = self.retriever.retrieve_facts(query)
        result = generate_factual_response(query, data, client=False)

        self.assertIn("lock-in", result.lower())
        self.assertIn("3-year", result.lower())
        self.assertIn("Section 80C", result)
        self.assertIn("Source: [https://groww.in/mutual-funds/hdfc-elss-tax-saver-fund-direct-plan-growth]", result)

    def test_fallback_min_sip_hdfc_gold_etf_fof(self):
        query = "What is the minimum SIP for HDFC Gold ETF Fund of Fund?"
        data = self.retriever.retrieve_facts(query)
        result = generate_factual_response(query, data, client=False)

        self.assertIn("₹100", result)
        self.assertIn("Source: [https://groww.in/mutual-funds/hdfc-gold-etf-fund-of-fund-direct-plan-growth]", result)

    def test_fallback_benchmark_hdfc_top_100(self):
        query = "What benchmark index does HDFC Top 100 use?"
        data = self.retriever.retrieve_facts(query)
        result = generate_factual_response(query, data, client=False)

        self.assertIn("NIFTY 100 TRI", result)
        self.assertIn("Source: [https://groww.in/mutual-funds/hdfc-large-cap-fund-direct-growth]", result)

    def test_fallback_unsupported_scheme_notice(self):
        query = "What is the expense ratio of SBI Bluechip Fund?"
        data = self.retriever.retrieve_facts(query)
        result = generate_factual_response(query, data, client=False)

        self.assertIn("not found in the verified 5 HDFC schemes corpus", result)
        self.assertIn("Source: [https://groww.in/mutual-funds]", result)
        self.assertIn("Last updated from sources: 2026-11-10", result)

    def test_fallback_general_statement_download(self):
        query = "How do I download my capital gains statement?"
        data = self.retriever.retrieve_facts(query)
        result = generate_factual_response(query, data, client=False)

        self.assertIn("MFCentral", result)
        self.assertIn("CAMS", result)
        self.assertIn("Last updated from sources: 2026-11-10", result)

    def test_fallback_enforces_max_three_sentences_and_single_citation(self):
        query = "What is the riskometer of HDFC Mid-Cap Opportunities Fund?"
        data = self.retriever.retrieve_facts(query)
        detailed = generate_factual_response_detailed(query, data, client=False)

        self.assertTrue(detailed.is_fallback)
        self.assertEqual(detailed.model, "deterministic_fallback")

        # Sentence count check
        import re
        from src.rag.postprocessor import split_sentences
        body = re.sub(r"\n*Source:.*$", "", detailed.reply, flags=re.DOTALL).strip()
        sentences = split_sentences(body)
        self.assertLessEqual(len(sentences), 3)

        # Single citation check
        citations = re.findall(r"Source:\s*\[.*?\]\(.*?\)", detailed.reply)
        self.assertEqual(len(citations), 1)


class TestGroqInferenceIntegration(unittest.TestCase):
    """Verify Groq LLM inference integration and fail-safe handling."""

    def setUp(self):
        self.retriever = SchemeRetriever()

    def test_system_prompt_compliance_rules(self):
        """Verify SYSTEM_PROMPT contains all mandated constraints."""
        from src.rag.generator import SYSTEM_PROMPT
        self.assertIn("Fund Compass", SYSTEM_PROMPT)
        self.assertIn("EXCLUSIVELY on the provided CONTEXT", SYSTEM_PROMPT)
        self.assertIn("Maximum of 3 sentences", SYSTEM_PROMPT)
        self.assertIn("exactly ONE official source link", SYSTEM_PROMPT)
        self.assertIn("NEVER give investment advice", SYSTEM_PROMPT)

    def test_groq_successful_inference_mock(self):
        """Verify successful Groq API execution flow."""
        import unittest.mock as mock
        mock_client = mock.MagicMock()
        mock_choice = mock.MagicMock()
        mock_choice.message.content = "The direct plan expense ratio is 0.76%. The fund is managed by Chirag Setalvad."
        mock_response = mock.MagicMock()
        mock_response.choices = [mock_choice]
        mock_client.chat.completions.create.return_value = mock_response

        query = "What is the expense ratio for HDFC Mid-Cap?"
        data = self.retriever.retrieve_facts(query)
        result = generate_factual_response_detailed(query, data, client=mock_client)

        self.assertFalse(result.is_fallback)
        self.assertEqual(result.model, "openai/gpt-oss-120b")
        self.assertIn("0.76%", result.reply)
        self.assertIn("Source: [https://groww.in/mutual-funds/hdfc-mid-cap-fund-direct-growth]", result.reply)
        mock_client.chat.completions.create.assert_called_once()

    def test_groq_exception_triggers_graceful_fallback(self):
        """Verify that any Groq API exception seamlessly fails over to fallback."""
        import unittest.mock as mock
        mock_client = mock.MagicMock()
        mock_client.chat.completions.create.side_effect = RuntimeError("Groq Cloud Rate Limit Exceeded: 429")

        query = "What is the exit load for HDFC Small Cap?"
        data = self.retriever.retrieve_facts(query)
        result = generate_factual_response_detailed(query, data, client=mock_client)

        self.assertTrue(result.is_fallback)
        self.assertEqual(result.model, "deterministic_fallback")
        self.assertIn("1.00%", result.reply)
        self.assertIn("Source: [https://groww.in/mutual-funds/hdfc-small-cap-fund-direct-growth]", result.reply)


class TestIndexReadinessPerScheme(unittest.TestCase):
    """Tests for per-scheme ChromaDB vector index readiness validation."""

    def setUp(self):
        self.retriever = SchemeRetriever()

    def test_index_status_includes_missing_schemes_field(self):
        """validate_index_readiness() returns a 'missing_schemes' field in the status dict."""
        status = self.retriever.index_status
        self.assertIn("missing_schemes", status)
        self.assertIsInstance(status["missing_schemes"], list)

    def test_all_five_schemes_have_indexed_chunks(self):
        """Each of the 5 canonical scheme IDs must have at least one indexed chunk."""
        status = self.retriever.index_status
        self.assertTrue(status["vector_index_ready"], f"Index not ready: {status}")
        self.assertEqual(
            status["missing_schemes"], [],
            f"Missing chunks for schemes: {status['missing_schemes']}",
        )

    def test_per_scheme_validation_covers_all_canonical_ids(self):
        """The readiness check must examine every scheme loaded from schemes.json."""
        expected_ids = {s["scheme_id"] for s in self.retriever.schemes}
        self.assertEqual(len(expected_ids), 5)
        # If index_status reports no missing schemes and is ready, all 5 were checked
        status = self.retriever.index_status
        self.assertTrue(status["vector_index_ready"])
        self.assertEqual(status["chunks_count"], 20)


class TestDynamicNAVFinancialAccuracy(unittest.TestCase):
    """Priority 4 Tests: Dynamic NAV & Financial Response Accuracy across all 5 schemes."""

    def setUp(self):
        self.retriever = SchemeRetriever()

    def test_nav_retrieval_and_precision_all_five_schemes(self):
        """Verifies exact verified NAV values, date provenance, and fluctuation notice for all 5 schemes."""
        expected_schemes = [
            ("What is the NAV of HDFC Mid-Cap?", "hdfc-mid-cap-fund-direct-growth", "₹229.552"),
            ("What is the current NAV of Small Cap?", "hdfc-small-cap-fund-direct-growth", "₹155.255"),
            ("HDFC Gold ETF NAV today", "hdfc-gold-etf-fund-of-fund-direct-plan-growth", "₹43.4947"),
            ("Tell me the NAV of HDFC Top 100", "hdfc-large-cap-fund-direct-growth", "₹1269.861"),
            ("What is the NAV for HDFC ELSS Tax Saver?", "hdfc-elss-tax-saver-fund-direct-plan-growth", "₹1552.433"),
        ]
        for query, expected_sid, expected_nav in expected_schemes:
            with self.subTest(scheme_id=expected_sid):
                retrieval = self.retriever.retrieve_facts(query)
                self.assertEqual(retrieval["scheme_id"], expected_sid)
                self.assertEqual(retrieval["relevant_attribute"], "nav")
                self.assertEqual(retrieval["facts"]["nav"], expected_nav)

                res = generate_factual_response_detailed(query, retrieval, client=False)
                self.assertIn(expected_nav, res.reply)
                self.assertIn("2026-11-10", res.reply)
                self.assertIn("fluctuates daily", res.reply.lower())
                self.assertIn("market close", res.reply.lower())
                self.assertIn(retrieval["source_url"], res.reply)
                self.assertIn("Last updated from sources: 2026-11-10", res.reply)

    def test_missing_nav_graceful_fallback(self):
        """Verifies missing or null NAV does not hallucinate figures and provides clean fallback."""
        scheme_data = {
            "scheme_name": "HDFC Test Fund (Direct Plan - Growth)",
            "scheme_id": "hdfc-test-fund",
            "source_url": "https://groww.in/mutual-funds/hdfc-test-fund",
            "last_updated": "2026-11-10",
            "facts": {"nav": None, "nav_date": None},
        }
        retrieval = {
            "scheme": scheme_data,
            "scheme_id": "hdfc-test-fund",
            "facts": scheme_data["facts"],
            "source_url": scheme_data["source_url"],
            "last_updated": "2026-11-10",
            "relevant_attribute": "nav",
        }
        res = generate_factual_response_detailed("What is the NAV?", retrieval, client=False)
        self.assertNotIn("₹", res.reply)
        self.assertIn("fluctuates daily", res.reply.lower())
        self.assertIn("market close", res.reply.lower())
        self.assertIn("Groww factsheet", res.reply)


if __name__ == "__main__":
    unittest.main()

