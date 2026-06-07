import pytest
from backend.app.services.rag_service import RAGService

def test_chunk_text():
    text = "A" * 2500
    chunks = RAGService.chunk_text(text, chunk_size=1000, overlap=200)
    assert len(chunks) > 1
    # Check overlapping sizes
    for c in chunks:
        assert len(c) <= 1000

def test_get_embedding_deterministic():
    emb1 = RAGService.get_embedding("Verify this text embedding")
    emb2 = RAGService.get_embedding("Verify this text embedding")
    emb3 = RAGService.get_embedding("Different text query")
    
    assert len(emb1) == 768
    assert emb1 == emb2
    assert emb1 != emb3

def test_generate_answer_empty():
    answer_res = RAGService.generate_answer("tenant_abc", "Where is the file?", [])
    assert "I couldn't find any information" in answer_res["answer"]
    assert len(answer_res["citations"]) == 0
