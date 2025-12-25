# plant/management/commands/build_rag_index.py
from django.core.management.base import BaseCommand
from ragapp.models import Document, DocumentChunk
from pathlib import Path
import textwrap
from ragapp.embeddings import embed_text

# # TODO: replace with real embedding model (OpenAI, local, etc.)
# def embed_text(text: str) -> list[float]:
#     # Dummy embedding: DO NOT USE IN PROD
#     # Replace with real call to your embedding model.
#     return [float(len(text) % 10)] * 16

def chunk_text(text: str, max_chars: int = 800):
    # Very simple splitter by paragraphs
    paragraphs = [p.strip() for p in text.split("\n") if p.strip()]
    chunks, buf = [], ""
    for p in paragraphs:
        if len(buf) + len(p) + 1 > max_chars:
            if buf:
                chunks.append(buf)
            buf = p
        else:
            buf = (buf + "\n" + p) if buf else p
    if buf:
        chunks.append(buf)
    return chunks

class Command(BaseCommand):
    help = "Build RAG index from plain-text files in a folder"

    def add_arguments(self, parser):
        parser.add_argument("folder", type=str, help="Folder with .txt files")
        parser.add_argument("--doctype", type=str, default="SOP")

    def handle(self, *args, **options):
        folder = Path(options["folder"])
        doc_type = options["doctype"]

        for path in folder.glob("*.txt"):
            self.stdout.write(f"Indexing {path.name}")
            text = path.read_text(encoding="utf-8")
            doc = Document.objects.create(
                title=path.name,
                doc_type=doc_type,
                source_path=str(path),
            )

            chunks = chunk_text(text)
            for i, chunk in enumerate(chunks):
                emb = embed_text(chunk)
                DocumentChunk.objects.create(
                    document=doc,
                    chunk_index=i,
                    text=chunk,
                    embedding=emb,
                )
