# plant/ml_anomaly.py

from .models import ProductionBatch
from .anomaly_service import extract_features, detect_anomaly  # adjust module name if needed


def detect_anomaly_for_batch(batch: ProductionBatch) -> dict:
    """
    Compute anomaly score + flag for a single batch.
    """
    feats = extract_features(batch)
    res = detect_anomaly(feats)
    return {
        "score": float(res["score"]),
        "is_anomaly": bool(res["is_anomaly"]),
    }
