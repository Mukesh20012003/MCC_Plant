# export_training_data.py
import csv
import django
import os

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mcc_pdms.settings")
django.setup()

from plant.models import ProductionBatch, QCReport


def export_training_data(csv_path="training_data.csv"):
    fields = [
        "batch_no",
        "pretreatment_temperature",
        "hydrolysis_temperature",
        "hydrolysis_time_min",
        "ph",
        "washing_cycles",
        "drying_temperature",
        "drying_time_min",
        "passed",
    ]

    with open(csv_path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()

        for qc in QCReport.objects.select_related("batch").all():
            batch = qc.batch
            params = batch.process_parameters_json or {}
            row = {
                "batch_no": batch.batch_no,
                "pretreatment_temperature": params.get("pretreatment_temperature"),
                "hydrolysis_temperature": params.get("hydrolysis_temperature"),
                "hydrolysis_time_min": params.get("hydrolysis_time_min"),
                "ph": params.get("ph"),
                "washing_cycles": params.get("washing_cycles"),
                "drying_temperature": params.get("drying_temperature"),
                "drying_time_min": params.get("drying_time_min"),
                "passed": int(bool(qc.passed)),
            }
            writer.writerow(row)

    print(f"Exported {QCReport.objects.count()} rows to {csv_path}")


if __name__ == "__main__":
    export_training_data()
