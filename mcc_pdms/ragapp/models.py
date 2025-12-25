from django.db import models
from django.contrib.postgres.fields import ArrayField  # if using Postgres

class Document(models.Model):
    DOC_TYPES = [
        ("SOP", "Standard Operating Procedure"),
        ("MANUAL", "Manual"),
        ("QC", "QC Report"),
        ("INCIDENT", "Incident Report"),
    ]

    title = models.CharField(max_length=255)
    doc_type = models.CharField(max_length=20, choices=DOC_TYPES)
    source_path = models.TextField(blank=True)  # optional: file path or URL
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.doc_type}: {self.title}"


class DocumentChunk(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name="chunks")
    chunk_index = models.IntegerField()
    text = models.TextField()
    # simple embedding storage; for serious usage prefer a vector DB
    embedding = ArrayField(models.FloatField(), size=1536)  # adjust to model dim
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("document", "chunk_index")
