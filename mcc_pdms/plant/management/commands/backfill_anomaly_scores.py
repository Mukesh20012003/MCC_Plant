# plant/management/commands/backfill_anomaly_scores.py

from django.core.management.base import BaseCommand
from plant.models import ProductionBatch
from plant.ml_anomaly import detect_anomaly_for_batch


class Command(BaseCommand):
    help = "Compute anomaly scores for existing batches and store them."

    def add_arguments(self, parser):
        parser.add_argument(
            "--limit",
            type=int,
            default=None,
            help="Max number of batches to process (for testing).",
        )
        parser.add_argument(
            "--only-missing",
            action="store_true",
            help="Only process batches without anomaly_score.",
        )

    def handle(self, *args, **options):
        qs = ProductionBatch.objects.all().order_by("id")

        if options["only_missing"]:
            qs = qs.filter(anomaly_score__isnull=True)

        if options["limit"]:
            qs = qs[: options["limit"]]

        total = qs.count()
        if not total:
            self.stdout.write(self.style.WARNING("No batches to process"))
            return

        processed = 0
        for batch in qs:
            result = detect_anomaly_for_batch(batch)  # returns dict
            score = float(result["score"])
            is_anom = bool(result["is_anomaly"])

            batch.anomaly_score = score
            batch.is_anomaly = is_anom
            batch.save(update_fields=["anomaly_score", "is_anomaly"])

            processed += 1
            if processed % 50 == 0:
                self.stdout.write(f"Processed {processed}/{total} batches...")

        self.stdout.write(self.style.SUCCESS(f"Done. Processed {processed} batches."))
