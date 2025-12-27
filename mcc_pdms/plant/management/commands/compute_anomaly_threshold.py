# plant/management/commands/compute_anomaly_threshold.py

from django.core.management.base import BaseCommand
from plant.models import ProductionBatch as Batch
import numpy as np


class Command(BaseCommand):
    help = "Compute percentile-based anomaly threshold from historical scores"

    def add_arguments(self, parser):
        parser.add_argument(
            "--percentile",
            type=float,
            default=97.0,
            help="Percentile for anomaly threshold (e.g. 95, 97, 99)",
        )

    def handle(self, *args, **options):
        percentile = options["percentile"]

        scores = list(
            Batch.objects
            .exclude(anomaly_score__isnull=True)
            .values_list("anomaly_score", flat=True)
        )

        if not scores:
            self.stdout.write(self.style.ERROR("No anomaly_score values found"))
            return

        threshold = float(np.percentile(scores, percentile))
        self.stdout.write(
            self.style.SUCCESS(
                f"Threshold at P{percentile}: {threshold:.4f}"
            )
        )
