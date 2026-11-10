"""Phase 2 Ingestion, Canonical Schema Normalization & Chunking Strategy Test Suite."""
import unittest
import json
import tempfile
import shutil
from pathlib import Path
from src.config import PROCESSED_DATA_PATH, CHROMA_PERSIST_DIR
from src.ingestion.indexer import (
    build_vector_index,
    get_embedding_function,
    query_vector_store,
    HAS_CHROMADB,
)
from src.ingestion.chunker import (
    CANONICAL_CHUNK_TYPES,
    CHUNK_CATEGORY_FEES,
    CHUNK_CATEGORY_LIMITS,
    CHUNK_CATEGORY_RISK,
    CHUNK_CATEGORY_OPERATIONS,
    MAX_EMBEDDING_TOKENS,
    REQUIRED_METADATA_KEYS,
    build_scheme_chunks,
    create_chunks_from_schemes,
    estimate_tokens,
    validate_chunks_metadata,
)
from src.ingestion.normalizer import (
    REQUIRED_FACT_FIELDS,
    REQUIRED_TOP_LEVEL_FIELDS,
    EXPECTED_SCHEME_IDS,
    SEBI_RISKOMETER_LEVELS,
    SchemaValidationError,
    validate_scheme,
    normalize_scheme,
    validate_corpus,
    normalize_and_save_schemes,
)

REQUIRED_FACTS = REQUIRED_FACT_FIELDS


class TestPhase2Ingestion(unittest.TestCase):
    """Rigorous evaluation suite for Phase 2: Ingestion, Normalization & Chunking Strategy."""

    # -------------------------------------------------------------
    # Task 1: Canonical Schema Normalization Tests
    # -------------------------------------------------------------

    def test_ev_p2_01_corpus_presence(self):
        """Verify that exactly the 5 target HDFC schemes from Groww are present."""
        self.assertTrue(PROCESSED_DATA_PATH.exists(), f"Corpus file not found: {PROCESSED_DATA_PATH}")
        with open(PROCESSED_DATA_PATH, "r", encoding="utf-8") as f:
            schemes = json.load(f)

        self.assertEqual(len(schemes), 5, f"Expected 5 schemes, found {len(schemes)}")
        actual_ids = [s["scheme_id"] for s in schemes]
        self.assertEqual(set(actual_ids), set(EXPECTED_SCHEME_IDS))

    def test_ev_p2_02_all_10_required_facts_completeness(self):
        """Verify that every scheme contains all 10 mandated core factual parameters."""
        with open(PROCESSED_DATA_PATH, "r", encoding="utf-8") as f:
            schemes = json.load(f)

        self.assertEqual(len(REQUIRED_FACT_FIELDS), 10)
        for scheme in schemes:
            facts = scheme.get("facts", {})
            for field in REQUIRED_FACT_FIELDS:
                self.assertIn(field, facts, f"Scheme {scheme['scheme_id']} missing metric: {field}")
                self.assertTrue(facts[field], f"Scheme {scheme['scheme_id']} has empty value for: {field}")

    def test_ev_p2_03_top_level_fields_and_aliases(self):
        """Verify that every scheme contains all canonical top-level fields including aliases."""
        with open(PROCESSED_DATA_PATH, "r", encoding="utf-8") as f:
            schemes = json.load(f)

        for scheme in schemes:
            for field in REQUIRED_TOP_LEVEL_FIELDS:
                self.assertIn(field, scheme, f"Scheme {scheme['scheme_id']} missing field: {field}")
            self.assertIsInstance(scheme["aliases"], list)
            self.assertGreater(len(scheme["aliases"]), 0)
            for alias in scheme["aliases"]:
                self.assertEqual(alias, alias.strip().lower(), f"Alias '{alias}' should be lowercase trimmed")

    def test_ev_p2_04_groww_and_factsheet_source_urls(self):
        """Verify that source URLs point to official Groww scheme pages and factsheet URLs are valid."""
        with open(PROCESSED_DATA_PATH, "r", encoding="utf-8") as f:
            schemes = json.load(f)

        for scheme in schemes:
            url = scheme.get("source_url", "")
            self.assertTrue(url.startswith("https://groww.in/mutual-funds/"), f"Invalid source URL: {url}")
            factsheet_url = scheme["facts"].get("factsheet_url", "")
            self.assertTrue(factsheet_url.startswith("http"), f"Invalid factsheet URL: {factsheet_url}")

    def test_ev_p2_05_sebi_riskometer_standards(self):
        """Verify all scheme riskometer classifications match official SEBI ratings."""
        with open(PROCESSED_DATA_PATH, "r", encoding="utf-8") as f:
            schemes = json.load(f)

        for scheme in schemes:
            riskometer = scheme["facts"]["riskometer"]
            self.assertIn(
                riskometer,
                SEBI_RISKOMETER_LEVELS,
                f"Invalid riskometer '{riskometer}' for {scheme['scheme_id']}"
            )

    def test_ev_p2_06_date_and_expense_ratio_format(self):
        """Verify date is YYYY-MM-DD and expense_ratio is properly percentage formatted."""
        with open(PROCESSED_DATA_PATH, "r", encoding="utf-8") as f:
            schemes = json.load(f)

        for scheme in schemes:
            self.assertRegex(scheme["last_updated"], r"^\d{4}-\d{2}-\d{2}$")
            self.assertIn("%", scheme["facts"]["expense_ratio"])

    def test_ev_p2_07_validate_scheme_and_corpus_success(self):
        """Verify validate_corpus and validate_scheme pass on canonical data."""
        with open(PROCESSED_DATA_PATH, "r", encoding="utf-8") as f:
            schemes = json.load(f)

        validated = validate_corpus(schemes, expected_count=5)
        self.assertEqual(len(validated), 5)
        for s in validated:
            self.assertEqual(validate_scheme(s), s)

    def test_ev_p2_08_normalization_logic(self):
        """Verify normalize_scheme cleans whitespace, deduplicates aliases, and enforces key order."""
        raw_record = {
            "scheme_id": " hdfc-mid-cap-fund-direct-growth ",
            "scheme_name": "  HDFC Mid-Cap Opportunities Fund (Direct Plan - Growth)  ",
            "amc": " HDFC Mutual Fund ",
            "category": " Equity: Mid Cap ",
            "source_url": "https://groww.in/mutual-funds/hdfc-mid-cap-fund-direct-growth",
            "last_updated": "2026-11-10",
            "facts": {
                "expense_ratio": " 0.76% ",
                "exit_load": " 1.00% if redeemed within 1 year; Nil after 1 year ",
                "min_sip_amount": " ₹100 ",
                "min_lumpsum_amount": " ₹100 ",
                "lock_in_period": " Nil ",
                "riskometer": "Very High",
                "benchmark": " NIFTY Midcap 150 TRI ",
                "fund_manager": " Chirag Setalvad ",
                "factsheet_url": " https://www.hdfcfund.com/investor-services/fund-performance/factsheet ",
                "statement_download_process": " Online portal or MFCentral/CAMS. "
            },
            "aliases": ["Mid Cap", "mid cap", "MIDCAP ", "midcap"]
        }
        normalized = normalize_scheme(raw_record)
        self.assertEqual(normalized["scheme_id"], "hdfc-mid-cap-fund-direct-growth")
        self.assertEqual(normalized["scheme_name"], "HDFC Mid-Cap Opportunities Fund (Direct Plan - Growth)")
        self.assertEqual(normalized["facts"]["expense_ratio"], "0.76%")
        self.assertEqual(normalized["facts"]["fund_manager"], "Chirag Setalvad")
        self.assertEqual(normalized["aliases"], ["mid cap", "midcap"])

    def test_ev_p2_09_validation_error_on_missing_fact(self):
        """Verify SchemaValidationError when a required factual parameter is omitted."""
        invalid_record = {
            "scheme_id": "hdfc-mid-cap-fund-direct-growth",
            "scheme_name": "HDFC Mid-Cap",
            "amc": "HDFC Mutual Fund",
            "category": "Equity",
            "source_url": "https://groww.in/mutual-funds/hdfc-mid-cap-fund-direct-growth",
            "last_updated": "2026-11-10",
            "facts": {
                "expense_ratio": "0.76%",
            },
            "aliases": ["mid cap"]
        }
        with self.assertRaises(SchemaValidationError) as ctx:
            validate_scheme(invalid_record)
        self.assertIn("missing required fact field", str(ctx.exception))

    def test_ev_p2_10_validation_error_on_invalid_riskometer(self):
        """Verify SchemaValidationError when riskometer is outside SEBI standard levels."""
        with open(PROCESSED_DATA_PATH, "r", encoding="utf-8") as f:
            schemes = json.load(f)

        corrupt = json.loads(json.dumps(schemes[0]))
        corrupt["facts"]["riskometer"] = "Extreme Risk"
        with self.assertRaises(SchemaValidationError) as ctx:
            validate_scheme(corrupt)
        self.assertIn("invalid riskometer", str(ctx.exception))

    def test_ev_p2_11_validation_error_on_invalid_url_and_date(self):
        """Verify SchemaValidationError when source URL is not Groww or date is malformed."""
        with open(PROCESSED_DATA_PATH, "r", encoding="utf-8") as f:
            schemes = json.load(f)

        corrupt_url = json.loads(json.dumps(schemes[0]))
        corrupt_url["source_url"] = "https://thirdpartyblog.com/scheme"
        with self.assertRaises(SchemaValidationError):
            validate_scheme(corrupt_url)

        corrupt_date = json.loads(json.dumps(schemes[0]))
        corrupt_date["last_updated"] = "10-11-2026"
        with self.assertRaises(SchemaValidationError):
            validate_scheme(corrupt_date)

    def test_ev_p2_12_normalize_and_save_schemes_io(self):
        """Verify normalize_and_save_schemes correctly reads raw input, normalizes, and writes file."""
        temp_dir = tempfile.mkdtemp()
        try:
            temp_in = Path(temp_dir) / "raw.json"
            temp_out = Path(temp_dir) / "processed.json"
            shutil.copyfile(PROCESSED_DATA_PATH, temp_in)

            result = normalize_and_save_schemes(temp_in, temp_out)
            self.assertEqual(len(result), 5)
            self.assertTrue(temp_out.exists())

            with open(temp_out, "r", encoding="utf-8") as f:
                saved = json.load(f)
            self.assertEqual(len(saved), 5)
            self.assertEqual(saved[0]["scheme_id"], result[0]["scheme_id"])
        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

    # -------------------------------------------------------------
    # Task 2: Chunking & Metadata Strategy Tests (all-MiniLM-L6-v2)
    # -------------------------------------------------------------

    def test_ev_p2_13_chunk_count_and_four_categories_per_scheme(self):
        """Verify discrete chunk generation (exactly 20 chunks = 4 per scheme across 5 schemes)."""
        with open(PROCESSED_DATA_PATH, "r", encoding="utf-8") as f:
            schemes = json.load(f)

        chunks = create_chunks_from_schemes(schemes)
        self.assertEqual(len(chunks), 20, f"Expected exactly 20 chunks, found {len(chunks)}")

        by_scheme = {}
        for c in chunks:
            sid = c["metadata"]["scheme_id"]
            by_scheme.setdefault(sid, []).append(c["metadata"]["chunk_type"])

        self.assertEqual(len(by_scheme), 5)
        expected_types = {
            CHUNK_CATEGORY_FEES,
            CHUNK_CATEGORY_LIMITS,
            CHUNK_CATEGORY_RISK,
            CHUNK_CATEGORY_OPERATIONS,
        }
        for sid, ctypes in by_scheme.items():
            self.assertEqual(len(ctypes), 4, f"Scheme {sid} must have exactly 4 chunks")
            self.assertEqual(set(ctypes), expected_types, f"Scheme {sid} missing one of 4 chunk types")

    def test_ev_p2_14_token_limits_optimized_for_all_minilm_l6_v2(self):
        """
        Verify every chunk is strictly within sentence-transformers/all-MiniLM-L6-v2 token budget.
        Hard maximum: 256 tokens.
        Optimal high-density range: 20 to 150 tokens (avoids dilution and truncation).
        """
        with open(PROCESSED_DATA_PATH, "r", encoding="utf-8") as f:
            schemes = json.load(f)

        chunks = create_chunks_from_schemes(schemes)
        max_seen = 0
        min_seen = 9999

        for chunk in chunks:
            cid = chunk["id"]
            tokens = estimate_tokens(chunk["text"])
            self.assertLessEqual(
                tokens,
                MAX_EMBEDDING_TOKENS,
                f"Chunk '{cid}' token count ({tokens}) exceeds all-MiniLM-L6-v2 limit of {MAX_EMBEDDING_TOKENS}"
            )
            self.assertGreaterEqual(
                tokens,
                20,
                f"Chunk '{cid}' token count ({tokens}) is too sparse (< 20 tokens)"
            )
            self.assertLessEqual(
                tokens,
                150,
                f"Chunk '{cid}' token count ({tokens}) exceeds optimal high-density target of 150 tokens"
            )
            max_seen = max(max_seen, tokens)
            min_seen = min(min_seen, tokens)

        self.assertTrue(20 <= min_seen <= max_seen <= 100)

    def test_ev_p2_15_metadata_tagging_completeness(self):
        """Verify 100% of chunks are tagged with complete metadata preventing cross-fund leakage."""
        with open(PROCESSED_DATA_PATH, "r", encoding="utf-8") as f:
            schemes = json.load(f)

        chunks = create_chunks_from_schemes(schemes)
        for chunk in chunks:
            meta = chunk["metadata"]
            for key in REQUIRED_METADATA_KEYS:
                self.assertIn(key, meta, f"Missing required metadata key: {key}")
                self.assertTrue(meta[key], f"Empty value for metadata key: {key}")

            self.assertIn("category", meta)
            self.assertIn("metric_category", meta)
            self.assertIn("factsheet_url", meta)
            self.assertIn("token_count", meta)
            self.assertIsInstance(meta["token_count"], int)
            self.assertTrue(meta["source_url"].startswith("https://groww.in/mutual-funds/"))
            self.assertEqual(meta["last_updated"], "2026-11-10")

    def test_ev_p2_16_zero_cross_fund_contamination(self):
        """Verify chunk text and metadata are strictly isolated per scheme without cross-fund bleed."""
        with open(PROCESSED_DATA_PATH, "r", encoding="utf-8") as f:
            schemes = json.load(f)

        chunks = create_chunks_from_schemes(schemes)
        scheme_id_map = {s["scheme_id"]: s["scheme_name"] for s in schemes}

        for chunk in chunks:
            cid = chunk["id"]
            sid = chunk["metadata"]["scheme_id"]
            self.assertTrue(cid.startswith(sid), f"Chunk ID {cid} does not match scheme_id {sid}")

            sname = scheme_id_map[sid]
            self.assertIn(sname, chunk["text"], f"Chunk {cid} missing scheme name {sname}")

            for other_sid, other_name in scheme_id_map.items():
                if other_sid != sid:
                    self.assertNotIn(
                        f"for {other_name}",
                        chunk["text"],
                        f"Chunk {cid} contaminated with other scheme name {other_name}"
                    )

    def test_ev_p2_17_validate_chunks_metadata_enforcement(self):
        """Verify validate_chunks_metadata raises ValueError on corrupted or oversized chunks."""
        with self.assertRaises(ValueError):
            validate_chunks_metadata([{"id": "test_fees", "text": "", "metadata": {}}])

        huge_text = "word " * 300
        oversized_chunk = [{
            "id": "hdfc-mid-cap-fund-direct-growth_fees",
            "text": huge_text,
            "metadata": {
                "scheme_id": "hdfc-mid-cap-fund-direct-growth",
                "scheme_name": "HDFC Mid Cap",
                "source_url": "https://groww.in/mutual-funds/hdfc-mid-cap-fund-direct-growth",
                "last_updated": "2026-11-10",
                "chunk_type": "fees",
            }
        }]
        with self.assertRaises(ValueError) as ctx:
            validate_chunks_metadata(oversized_chunk)
        self.assertIn("exceeds sentence-transformers/all-MiniLM-L6-v2 limit", str(ctx.exception))

        contaminated_chunk = [{
            "id": "hdfc-small-cap-fund-direct-growth_fees",
            "text": "The expense ratio is 0.76%.",
            "metadata": {
                "scheme_id": "hdfc-mid-cap-fund-direct-growth",
                "scheme_name": "HDFC Mid Cap",
                "source_url": "https://groww.in/mutual-funds/hdfc-mid-cap-fund-direct-growth",
                "last_updated": "2026-11-10",
                "chunk_type": "fees",
            }
        }]
        with self.assertRaises(ValueError) as ctx:
            validate_chunks_metadata(contaminated_chunk)
        self.assertIn("Cross-fund contamination", str(ctx.exception))

    # -------------------------------------------------------------
    # Task 3: Vector Store Generation & ChromaDB Persistence Tests
    # -------------------------------------------------------------

    def test_ev_p2_18_build_vector_index_persistence(self):
        """Verify build_vector_index validates canonical schema and persists chunks.json."""
        result = build_vector_index()
        self.assertIsNotNone(result)

        chunks_path = CHROMA_PERSIST_DIR / "chunks.json"
        self.assertTrue(chunks_path.exists(), f"chunks.json was not created at {chunks_path}")

        with open(chunks_path, "r", encoding="utf-8") as f:
            persisted_chunks = json.load(f)

        self.assertEqual(len(persisted_chunks), 20)
        first_chunk = persisted_chunks[0]
        self.assertIn("metadata", first_chunk)
        self.assertIn("source_url", first_chunk["metadata"])
        self.assertIn("token_count", first_chunk["metadata"])
        self.assertLessEqual(first_chunk["metadata"]["token_count"], MAX_EMBEDDING_TOKENS)

    def test_ev_p2_19_chroma_collection_persistence_and_count(self):
        """Verify Chroma collection is persisted to SQLite with exactly 20 chunks."""
        if not HAS_CHROMADB:
            self.skipTest("ChromaDB is not installed in this environment")

        collection = build_vector_index()
        self.assertIsNotNone(collection)
        self.assertEqual(collection.count(), 20)

        # Verify sqlite file exists on disk
        sqlite_file = CHROMA_PERSIST_DIR / "chroma.sqlite3"
        self.assertTrue(sqlite_file.exists(), f"Chroma sqlite3 database not found at {sqlite_file}")
        self.assertGreater(sqlite_file.stat().st_size, 0)

    def test_ev_p2_20_chromadb_embedding_dimension(self):
        """Verify dense embeddings generated for all-MiniLM-L6-v2 have dimension 384."""
        emb_fn = get_embedding_function()
        if emb_fn is None:
            self.skipTest("Embedding function not available in this environment")

        embeddings = emb_fn(["The direct plan expense ratio for HDFC Mid-Cap is 0.76%"])
        self.assertIsNotNone(embeddings)
        self.assertEqual(len(embeddings), 1)
        self.assertEqual(len(embeddings[0]), 384, f"Expected 384 dimensions, got {len(embeddings[0])}")

    def test_ev_p2_21_semantic_similarity_retrieval(self):
        """Verify query_vector_store accurately retrieves correct target chunk with high similarity."""
        if not HAS_CHROMADB:
            self.skipTest("ChromaDB is not installed in this environment")

        # Query 1: Exit load for Mid-Cap
        res1 = query_vector_store(
            "What is the exit load for HDFC Mid-Cap Opportunities Fund?",
            n_results=1,
            scheme_id="hdfc-mid-cap-fund-direct-growth"
        )
        self.assertIsNotNone(res1)
        self.assertEqual(res1["ids"][0][0], "hdfc-mid-cap-fund-direct-growth_fees")
        self.assertLess(res1["distances"][0][0], 0.35)

        # Query 2: Minimum SIP for Small Cap
        res2 = query_vector_store(
            "What is the minimum SIP amount for HDFC Small Cap Fund?",
            n_results=1,
            scheme_id="hdfc-small-cap-fund-direct-growth"
        )
        self.assertIsNotNone(res2)
        self.assertEqual(res2["ids"][0][0], "hdfc-small-cap-fund-direct-growth_limits")
        self.assertLess(res2["distances"][0][0], 0.35)

    def test_ev_p2_22_metadata_filtered_search_isolation(self):
        """Verify query_vector_store with scheme_id filter strictly guarantees zero cross-fund leakage."""
        if not HAS_CHROMADB:
            self.skipTest("ChromaDB is not installed in this environment")

        target_sid = "hdfc-gold-etf-fund-of-fund-direct-plan-growth"
        results = query_vector_store(
            "What is the expense ratio and exit load?",
            n_results=4,
            scheme_id=target_sid
        )
        self.assertIsNotNone(results)
        self.assertGreater(len(results["ids"][0]), 0)

        for matched_id, meta in zip(results["ids"][0], results["metadatas"][0]):
            self.assertEqual(
                meta["scheme_id"],
                target_sid,
                f"Cross-fund contamination: retrieved {meta['scheme_id']} when filtering for {target_sid}"
            )
            self.assertTrue(matched_id.startswith(target_sid))


if __name__ == "__main__":
    unittest.main()
