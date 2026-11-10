"""Integration and Evaluation Tests for Phase 5: FastAPI REST Backend Services.

Validates all criteria defined in docs/eval.md:
- EV-P5-01: Health Monitor (GET /api/health)
- EV-P5-02: Schemes Catalog (GET /api/schemes)
- EV-P5-03: Factual Chat Endpoint (POST /api/chat)
- EV-P5-04: Advisory Refusal Endpoint (POST /api/chat)
- EV-P5-05: PII Rejection Endpoint (POST /api/chat)
- EV-P5-06: Payload Validation - empty string & >1000 chars (HTTP 422)
- EV-P5-07: CORS Headers & Preflight Handling (OPTIONS /api/chat)
- Single Scheme Lookup by ID & 404 handling (GET /api/schemes/{id})
- Root Welcome Endpoint (GET /)
"""

import unittest

from unittest.mock import patch

try:
    from fastapi.testclient import TestClient
    from src.api.main import app

    HAS_FASTAPI = True
except ImportError:
    HAS_FASTAPI = False
    TestClient = None
    app = None


@unittest.skipUnless(
    HAS_FASTAPI, "FastAPI / TestClient is not installed in this environment"
)
class TestAPIEndpoints(unittest.TestCase):
    """Integration test suite for FastAPI REST endpoints."""

    def setUp(self):
        if HAS_FASTAPI and app is not None:
            self.client = TestClient(app)
            self.patcher = patch("src.rag.generator.get_groq_client", return_value=None)
            self.patcher.start()

    def tearDown(self):
        if hasattr(self, "patcher"):
            self.patcher.stop()

    def test_ev_p5_01_health_monitor(self):
        """EV-P5-01: Verify GET /api/health returns 200, status: ok, and disclaimer."""
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "ok")
        self.assertEqual(data["app"], "Fund Compass")
        self.assertEqual(data["version"], "2.0.0")
        self.assertIn("Facts-only. No investment advice.", data["disclaimer"])

    def test_ev_p5_02_schemes_catalog(self):
        """EV-P5-02: Verify GET /api/schemes returns list of exactly 5 schemes with Groww URLs."""
        response = self.client.get("/api/schemes")
        self.assertEqual(response.status_code, 200)
        schemes = response.json()
        self.assertEqual(len(schemes), 5)

        scheme_ids = [s["scheme_id"] for s in schemes]
        expected_ids = [
            "hdfc-mid-cap-fund-direct-growth",
            "hdfc-small-cap-fund-direct-growth",
            "hdfc-gold-etf-fund-of-fund-direct-plan-growth",
            "hdfc-large-cap-fund-direct-growth",
            "hdfc-elss-tax-saver-fund-direct-plan-growth",
        ]
        for sid in expected_ids:
            self.assertIn(sid, scheme_ids)

        # Verify Groww source URL for every scheme
        for s in schemes:
            self.assertTrue(s["source_url"].startswith("https://groww.in/mutual-funds/"))
            self.assertIn("facts", s)
            self.assertEqual(s["facts"]["factsheet_url"], "https://www.hdfcfund.com/investor-services/fund-performance/factsheet")

    def test_scheme_by_id_endpoint_success_and_404(self):
        """Verify GET /api/schemes/{id} returns scheme item or 404 for unknown ID."""
        # Success case
        res = self.client.get("/api/schemes/hdfc-mid-cap-fund-direct-growth")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["scheme_id"], "hdfc-mid-cap-fund-direct-growth")
        self.assertIn("Mid-Cap", data["scheme_name"])

        # 404 Not Found case
        res_404 = self.client.get("/api/schemes/unknown-non-existent-fund")
        self.assertEqual(res_404.status_code, 404)
        self.assertIn("not found in verified", res_404.json()["detail"])

    def test_ev_p5_03_factual_chat_endpoint(self):
        """EV-P5-03: Verify POST /api/chat with factual query returns 200, citation, and footer."""
        payload = {"message": "What is the exit load for HDFC Mid-Cap Opportunities Fund?"}
        response = self.client.post("/api/chat", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertEqual(data["intent"], "factual_response")
        self.assertEqual(data["scheme_id"], "hdfc-mid-cap-fund-direct-growth")
        self.assertIn("exit load", data["reply"].lower())
        self.assertIn("1.00%", data["reply"])
        self.assertIn("Source: [https://groww.in/mutual-funds/hdfc-mid-cap-fund-direct-growth]", data["reply"])
        self.assertIn("Last updated from sources: 2026-11-10", data["reply"])
        self.assertEqual(data["last_updated"], "2026-11-10")

    def test_ev_p5_04_advisory_refusal_endpoint(self):
        """EV-P5-04: Verify POST /api/chat with advisory query returns 200, advisory_refusal, and AMFI link."""
        payload = {"message": "Should I invest in HDFC Mid-Cap Opportunities Fund?"}
        response = self.client.post("/api/chat", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertEqual(data["intent"], "advisory_refusal")
        self.assertIsNone(data["scheme_id"])
        self.assertIn("cannot provide investment advice", data["reply"].lower())
        self.assertIn("https://www.amfiindia.com/investor-corner/knowledge-center", data["reply"])
        self.assertIn("Last updated from sources: 2026-11-10", data["reply"])

    def test_performance_refusal_endpoint(self):
        """Verify performance / CAGR requests redirect to official factsheet portal."""
        payload = {"message": "What was the 3-year CAGR for HDFC Top 100?"}
        response = self.client.post("/api/chat", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertEqual(data["intent"], "performance_refusal")
        self.assertIn("performance data and factsheets", data["reply"].lower())
        self.assertIn("https://www.hdfcfund.com/investor-services/fund-performance/factsheet", data["reply"])

    def test_out_of_scope_endpoint(self):
        """Verify out-of-scope non-mutual fund query returns domain reminder."""
        payload = {"message": "What is the weather today in Bengaluru?"}
        response = self.client.post("/api/chat", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertEqual(data["intent"], "out_of_scope_refusal")
        self.assertIn("mutual fund schemes", data["reply"].lower())

    def test_ev_p5_05_pii_rejection_endpoint(self):
        """EV-P5-05: Verify query containing PAN card is blocked with pii_violation."""
        payload = {"message": "My PAN is ABCDE1234F, show my capital gains statement"}
        response = self.client.post("/api/chat", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()

        self.assertEqual(data["intent"], "pii_violation")
        self.assertIsNone(data["scheme_id"])
        self.assertIsNone(data["source_url"])
        self.assertIn("strictly prohibits entering sensitive", data["reply"])

    def test_ev_p5_06_payload_validation_empty_string(self):
        """EV-P5-06: Verify empty string returns HTTP 422 Unprocessable Entity."""
        # Empty string
        res_empty = self.client.post("/api/chat", json={"message": ""})
        self.assertEqual(res_empty.status_code, 422)

        # Whitespace-only string
        res_ws = self.client.post("/api/chat", json={"message": "   "})
        self.assertEqual(res_ws.status_code, 422)

        # Missing field
        res_missing = self.client.post("/api/chat", json={})
        self.assertEqual(res_missing.status_code, 422)

    def test_ev_p5_06_payload_validation_exceeding_1000_chars(self):
        """EV-P5-06: Verify message exceeding 1000 characters returns HTTP 422."""
        too_long_msg = "What is the expense ratio? " * 50  # ~1350 characters
        self.assertGreater(len(too_long_msg), 1000)

        response = self.client.post("/api/chat", json={"message": too_long_msg})
        self.assertEqual(response.status_code, 422)

    def test_ev_p5_07_cors_preflight_headers(self):
        """EV-P5-07: Verify OPTIONS preflight returns proper CORS headers for frontend."""
        headers = {
            "Origin": "https://fundcompass.vercel.app",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        }
        response = self.client.options("/api/chat", headers=headers)
        self.assertEqual(response.status_code, 200)
        allow_origin = response.headers.get("access-control-allow-origin")
        self.assertIsNotNone(allow_origin)
        self.assertIn(allow_origin, ["*", "https://fundcompass.vercel.app"])

    def test_root_welcome_endpoint(self):
        """Verify GET / returns welcome information and OpenAPI link."""
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["app"], "Fund Compass")
        self.assertEqual(data["supported_schemes_count"], 5)
        self.assertIn("/docs", data["message"])
        self.assertIn("disclaimer", data)


if __name__ == "__main__":
    unittest.main()
