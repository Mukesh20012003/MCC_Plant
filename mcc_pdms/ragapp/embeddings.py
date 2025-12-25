# mcc_pdms/ragapp/embeddings.py
from functools import lru_cache
from sentence_transformers import SentenceTransformer

@lru_cache(maxsize=1)
def _get_model():
    return SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

def embed_text(text: str) -> list[float]:
    model = _get_model()
    emb = model.encode([text], normalize_embeddings=True)[0]
    return emb.tolist()
