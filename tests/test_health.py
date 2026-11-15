"""Focused health/readiness checks; no external models or inference required."""
import copy
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient
from src.config import PROCESSED_DATA_PATH
from src.rag.retriever import SchemeRetriever

# Import the app without building/downloading an index as a test side effect.
with patch.object(SchemeRetriever, "validate_index_readiness", return_value={}):
    from src.api.main import app, startup_validation


class TestHealthReadiness(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.data_path = Path(self.temp.name) / "schemes.json"
        self.records = json.loads(PROCESSED_DATA_PATH.read_text(encoding="utf-8"))
        self.data_path.write_text(json.dumps(self.records), encoding="utf-8")
        self.retriever = SchemeRetriever(self.data_path, Path(self.temp.name), auto_validate_index=False)
        self.patcher = patch("src.api.routes.retriever", self.retriever)
        self.patcher.start()
        self.addCleanup(self.patcher.stop)
        self.vector = patch("src.rag.retriever.HAS_VECTOR_INDEX", False)
        self.vector.start()
        self.addCleanup(self.vector.stop)
        self.client = TestClient(app)

    def assert_not_ready(self, data_ready=False):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 503)
        body = response.json()
        self.assertEqual(body["status"], "not_ready")
        self.assertEqual(body["data_ready"], data_ready)
        self.assertFalse(body["retrieval_ready"])
        self.assertEqual(body["retrieval_mode"], "unavailable")
        self.assertNotIn(self.temp.name, response.text)
        return body

    def test_healthy_json_fallback_preserves_contract(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["status"], "ok")
        self.assertTrue(body["data_ready"])
        self.assertTrue(body["retrieval_ready"])
        self.assertEqual(body["retrieval_mode"], "json_fallback")
        self.assertEqual(body["app"], "Fund Compass")
        self.assertEqual(body["version"], "2.0.0")
        self.assertEqual(body["disclaimer"], "Facts-only. No investment advice.")

    def test_healthy_vector_retrieval(self):
        result = {"documents": [["Verified scheme facts"]], "metadatas": [[{"kind": "facts"}]]}
        with patch("src.rag.retriever.HAS_VECTOR_INDEX", True), patch(
            "src.rag.retriever.query_vector_store", return_value=result
        ) as query:
            response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["retrieval_mode"], "vector")
        self.assertEqual(query.call_count, 5)

    def test_missing_data_file(self):
        self.data_path.unlink()
        self.assert_not_ready()

    def test_malformed_data_file(self):
        self.data_path.write_text("{invalid", encoding="utf-8")
        self.assert_not_ready()

    def test_missing_required_scheme(self):
        self.retriever.schemes.pop()
        self.assert_not_ready()

    def test_wrong_scheme_ids_despite_five_records(self):
        records = copy.deepcopy(self.records)
        records[0]["scheme_id"] = "unsupported-fund"
        self.data_path.write_text(json.dumps(records), encoding="utf-8")
        self.assert_not_ready()

    def test_unusable_required_facts(self):
        del self.retriever.schemes[0]["facts"]["expense_ratio"]
        self.assert_not_ready()

    def test_retrieval_without_context_is_not_ready(self):
        with patch.object(self.retriever, "retrieve_facts", return_value={}):
            self.assert_not_ready(data_ready=True)

    def test_retrieval_dependency_failure_does_not_expose_details(self):
        with patch.object(self.retriever, "retrieve_facts", side_effect=RuntimeError("credential=SECRET")):
            body = self.assert_not_ready(data_ready=True)
        self.assertNotIn("SECRET", json.dumps(body))

    def test_health_rechecks_after_runtime_failure_and_recovery(self):
        self.assertEqual(self.client.get("/api/health").status_code, 200)
        self.data_path.unlink()
        self.assert_not_ready()
        self.data_path.write_text(json.dumps(self.records), encoding="utf-8")
        self.assertEqual(self.client.get("/api/health").status_code, 200)

    def test_startup_accepts_usable_fallback(self):
        startup_validation()

    def test_startup_rejects_missing_data_and_failed_retrieval(self):
        with patch.object(self.retriever, "retrieve_facts", return_value={}):
            with self.assertRaisesRegex(RuntimeError, "retrieval is not ready"):
                startup_validation()
        self.data_path.unlink()
        with self.assertRaisesRegex(RuntimeError, "retrieval is not ready"):
            startup_validation()
