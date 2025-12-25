import os
from typing import Iterable
from math import sqrt
from django.conf import settings
from langchain_groq import ChatGroq
# from langchain.schema import HumanMessage, SystemMessage
from ragapp.models import DocumentChunk
from django.db.models import F

try:
    # Newer LangChain
    from langchain_core.messages import HumanMessage, SystemMessage
except ImportError:
    # Older LangChain
    from langchain.schema import HumanMessage, SystemMessage


EMBED_DIM = 768  # adjust based on model

api_key = os.environ.get("GROQ_API_KEY")
# groqapi=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


def _groq_llm():
    return ChatGroq(
        model="llama-3.1-8b-instant",
        api_key=os.environ.get("GROQ_API_KEY"),
        temperature=0.1,
    )

# same dummy embedding size as before
def embed_question(question: str) -> list[float]:
    return [float(len(question) % 10)] * 16

def cosine_sim(a, b):
    num = sum(x*y for x, y in zip(a, b))
    da = sqrt(sum(x*x for x in a))
    db = sqrt(sum(x*x for x in b))
    return num / (da * db + 1e-9)

def retrieve_top_k(question: str, k: int = 5) -> list[DocumentChunk]:
    q_emb = embed_question(question)
    chunks = list(DocumentChunk.objects.select_related("document").all()[:500])  # simple
    scored = [
        (cosine_sim(q_emb, c.embedding), c)
        for c in chunks
    ]
    scored.sort(key=lambda x: x[0], reverse=True)
    return [c for _, c in scored[:k]]

# def generate_answer(question: str, batch_context: str | None, chunks: Iterable[DocumentChunk]) -> str:
#     context_snippets = "\n\n".join(f"- {c.text[:200]}" for c in chunks)
#     ctx = f"\nBatch info:\n{batch_context}\n" if batch_context else ""
#     return (
#         f"Question: {question}\n"
#         f"{ctx}\n"
#         f"Relevant context:\n{context_snippets}\n\n"
#         "This is a placeholder answer generated from stored documents. "
#         "Replace this with a real LLM call."
#     )


# ---- Embeddings (simple: use LLM to generate vector-like numbers) ----
# In production, use a real embedding model; Groq currently focuses on chat.
def embed_text(text: str) -> list[float]:
    # Very naive: hash text into a fixed-size vector
    import hashlib
    h = hashlib.sha256(text.encode("utf-8")).digest()
    nums = [b for b in h]
    # stretch to EMBED_DIM
    v = (nums * ((EMBED_DIM // len(nums)) + 1))[:EMBED_DIM]
    norm = sqrt(sum(x * x for x in v)) or 1.0
    return [x / norm for x in v]

def embed_question(q: str) -> list[float]:
    return embed_text(q)

def cosine_sim(a, b):
    num = sum(x*y for x, y in zip(a, b))
    da = sqrt(sum(x*x for x in a))
    db = sqrt(sum(x*x for x in b))
    return num / (da * db + 1e-9)

def retrieve_top_k(question: str, k: int = 5) -> list[DocumentChunk]:
    q_emb = embed_question(question)
    # naive in-DB scan; later you can move to pgvector/faiss
    chunks = list(DocumentChunk.objects.select_related("document").all())
    scored = [(cosine_sim(q_emb, c.embedding), c) for c in chunks]
    scored.sort(key=lambda x: x[0], reverse=True)
    return [c for _, c in scored[:k]]

def generate_answer(question: str, batch_context: str | None, chunks: Iterable[DocumentChunk]) -> str:
    context_text = "\n\n".join(
        f"Document: {c.document.title} [type={c.document.doc_type}]\n{c.text}"
        for c in chunks
    )
    system_prompt = (
        "You are an MCC PDMS plant assistant. Answer based only on the provided "
        "SOPs/manuals/QC/incident context and batch info, in a concise way."
    )
    user_prompt = f"Question: {question}\n\n"
    if batch_context:
        user_prompt += f"Batch context:\n{batch_context}\n\n"
    user_prompt += f"Knowledge base:\n{context_text}\n\nAnswer clearly:"

    llm = _groq_llm()
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt),
    ]
    # ChatGroq uses .invoke() in LangChain 0.2+
    response = llm.invoke(messages)
    return response.content


def answer_with_rag(question: str, batch_context: str | None = None) -> tuple[str, list[DocumentChunk]]:
    top_chunks = retrieve_top_k(question, k=5)
    answer = generate_answer(question, batch_context, top_chunks)
    return answer, top_chunks