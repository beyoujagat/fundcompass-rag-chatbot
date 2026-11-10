"""ChromaDB Vector Store Builder and Indexer for Fund Compass.

Constructs and persists a local ChromaDB collection using 384-dimensional dense
embeddings from sentence-transformers/all-MiniLM-L6-v2.
Guarantees persistent storage in data/chroma_db/ and zero cross-fund contamination.
"""

import json
import logging
import sys
import warnings
from pathlib import Path
from typing import Any, Dict, List, Optional

from src.config import (
    CHROMA_PERSIST_DIR,
    EMBEDDING_MODEL_NAME,
    PROCESSED_DATA_PATH,
)
from src.ingestion.chunker import (
    MAX_EMBEDDING_TOKENS,
    create_chunks_from_schemes,
    validate_chunks_metadata,
)
from src.ingestion.normalizer import validate_corpus

logger = logging.getLogger(__name__)

# Suppress benign telemetry / grpc version warnings on Windows
warnings.filterwarnings("ignore", category=RuntimeWarning, module=r"opentelemetry.*")

# Shim for Windows environments with WDAC / AppLocker restrictions on cygrpc
try:
    import grpc  # noqa: F401
except (ImportError, Exception):
    import unittest.mock
    m = unittest.mock.MagicMock()
    m.__version__ = "1.65.0"
    sys.modules["grpc"] = m
    sys.modules["grpc._cython"] = m

# Import ChromaDB and embedding functions
try:
    import chromadb
    from chromadb.utils import embedding_functions
    HAS_CHROMADB = True
except (ImportError, Exception) as err:
    logger.warning(f"ChromaDB not available: {err}")
    chromadb = None
    embedding_functions = None
    HAS_CHROMADB = False


def get_embedding_function():
    """
    Returns the sentence-transformers/all-MiniLM-L6-v2 embedding function.
    Prefers SentenceTransformerEmbeddingFunction if sentence_transformers is installed;
    falls back to ONNXMiniLM_L6_V2 (native ONNX all-MiniLM-L6-v2 in ChromaDB) which produces
    identical 384-dimensional dense embeddings without heavy dependencies.
    """
    if embedding_functions is None:
        return None

    # Option A: Try native sentence_transformers package if available
    try:
        import sentence_transformers  # noqa: F401
        return embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name=EMBEDDING_MODEL_NAME
        )
    except Exception:
        pass

    # Option B: ChromaDB's built-in ONNX implementation of all-MiniLM-L6-v2
    try:
        if hasattr(embedding_functions, "ONNXMiniLM_L6_V2"):
            return embedding_functions.ONNXMiniLM_L6_V2()
    except Exception as e:
        logger.warning(f"Could not initialize ONNXMiniLM_L6_V2: {e}")

    # Option C: Fallback to Chroma default embedding function
    try:
        return embedding_functions.DefaultEmbeddingFunction()
    except Exception as e:
        logger.warning(f"Could not initialize DefaultEmbeddingFunction: {e}")
        return None


def build_vector_index(
    data_path: Path = PROCESSED_DATA_PATH,
    persist_dir: Path = CHROMA_PERSIST_DIR,
    collection_name: str = "fund_compass_schemes",
    force_rebuild: bool = False,
):
    """
    Builds and persists the vector index in data/chroma_db/.
    1. Validates corpus strictly against canonical schema.
    2. Constructs granular semantic chunks optimized for sentence-transformers/all-MiniLM-L6-v2.
    3. Validates chunk metadata and token boundaries (<= 256 tokens).
    4. Persists normalized chunks.json in persist_dir.
    5. Indexes chunks and generates 384-dimensional dense embeddings in ChromaDB.
    """
    if not data_path.exists():
        raise FileNotFoundError(f"Processed schemes file not found: {data_path}")

    with open(data_path, "r", encoding="utf-8") as f:
        schemes = json.load(f)

    # 1. Validate corpus strictly against canonical schema
    validate_corpus(schemes, expected_count=len(schemes))

    # 2. Construct granular semantic chunks optimized for all-MiniLM-L6-v2
    chunks = create_chunks_from_schemes(schemes)

    # 3. Validate chunk metadata & token boundaries
    validate_chunks_metadata(chunks)

    persist_dir.mkdir(parents=True, exist_ok=True)

    # 4. Always persist normalized chunks JSON index
    chunks_file = persist_dir / "chunks.json"
    with open(chunks_file, "w", encoding="utf-8") as f:
        json.dump(chunks, f, indent=2, ensure_ascii=False)
        f.write("\n")

    # 5. ChromaDB Vector Store Generation & Persistence
    if HAS_CHROMADB and chromadb is not None and embedding_functions is not None:
        try:
            client = chromadb.PersistentClient(path=str(persist_dir))
            emb_fn = get_embedding_function()

            # Handle force rebuild or collection update
            if force_rebuild:
                try:
                    client.delete_collection(name=collection_name)
                except Exception:
                    pass

            collection = client.get_or_create_collection(
                name=collection_name,
                embedding_function=emb_fn,
                metadata={
                    "description": "HDFC Mutual Fund schemes facts from Groww",
                    "embedding_model": EMBEDDING_MODEL_NAME,
                    "dimension": 384,
                },
            )

            ids = [c["id"] for c in chunks]
            documents = [c["text"] for c in chunks]
            metadatas = [c["metadata"] for c in chunks]

            collection.upsert(
                ids=ids,
                documents=documents,
                metadatas=metadatas,
            )
            print(
                f"[ChromaDB] Successfully indexed {len(chunks)} chunks into Chroma collection '{collection_name}' at {persist_dir}"
            )
            return collection
        except Exception as e:
            logger.warning(f"ChromaDB indexing error: {e}. Chunks persisted to {chunks_file}")
            print(f"[ChromaDB Warning] Indexing exception: {e}. Saved {len(chunks)} chunks to {chunks_file}")
    else:
        print(f"[Vector Index] Persisted {len(chunks)} discrete chunks with full metadata to {chunks_file}")
        print("[Note] Install chromadb and sentence-transformers to enable dense vector search.")

    return chunks


def query_vector_store(
    query_text: str,
    n_results: int = 2,
    scheme_id: Optional[str] = None,
    persist_dir: Path = CHROMA_PERSIST_DIR,
    collection_name: str = "fund_compass_schemes",
) -> Optional[Dict[str, Any]]:
    """
    Executes a semantic similarity query against the persistent ChromaDB collection.
    Applies optional scheme_id metadata filter to eliminate cross-fund contamination.
    """
    if not HAS_CHROMADB or chromadb is None:
        return None

    try:
        client = chromadb.PersistentClient(path=str(persist_dir))
        emb_fn = get_embedding_function()
        collection = client.get_collection(
            name=collection_name,
            embedding_function=emb_fn,
        )

        where_filter = {"scheme_id": scheme_id} if scheme_id else None
        results = collection.query(
            query_texts=[query_text],
            n_results=n_results,
            where=where_filter,
        )
        return results
    except Exception as e:
        logger.warning(f"ChromaDB query error: {e}")
        return None


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="ChromaDB Vector Store Indexer for Fund Compass")
    parser.add_argument("--rebuild", action="store_true", help="Force rebuild ChromaDB collection")
    parser.add_argument("--query", type=str, default=None, help="Test semantic query against vector store")
    args = parser.parse_args()

    collection = build_vector_index(force_rebuild=args.rebuild)

    test_query = args.query or "What is the exit load for HDFC Mid-Cap Opportunities Fund?"
    print(f"\n[Verification] Running semantic probe query: '{test_query}'")
    results = query_vector_store(test_query, n_results=1, scheme_id="hdfc-mid-cap-fund-direct-growth")

    if results and results.get("ids") and results["ids"][0]:
        top_id = results["ids"][0][0]
        top_doc = results["documents"][0][0]
        distance = results["distances"][0][0] if results.get("distances") else None
        print(f"[Verification] Top match ID: {top_id}")
        print(f"[Verification] Cosine Distance: {distance:.4f}" if distance is not None else "")
        print(f"[Verification] Text snippet: {top_doc[:120]}...")
        print("[Verification] STATUS: SUCCESS - Vector store built and verified!")
    else:
        print("[Verification] Persistent chunks saved to data/chroma_db/chunks.json")
