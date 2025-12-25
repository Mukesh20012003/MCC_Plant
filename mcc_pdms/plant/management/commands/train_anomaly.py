# plant/management/commands/train_anomaly.py
from django.core.management.base import BaseCommand
from plant.anomaly_service import train_anomaly_model

class Command(BaseCommand):
    help = "Train anomaly detection model"

    def handle(self, *args, **options):
        model = train_anomaly_model()
        if model is None:
            self.stdout.write("Not enough data to train.")
        else:
            self.stdout.write("Anomaly model trained and saved.")
