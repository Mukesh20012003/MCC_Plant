# plant/anomaly_service.py
import numpy as np
from sklearn.ensemble import IsolationForest
from pathlib import Path
import joblib
from .models import ProductionBatch


MODEL_PATH = Path("models/anomaly_iforest.joblib")

FEATURES = ["temp", "pressure", "ph"]  # replace with real fields

def extract_features(batch: ProductionBatch):
    # dummy: replace with real numeric fields
    return np.array([
        float(getattr(batch, "temp", 0.0)),
        float(getattr(batch, "pressure", 0.0)),
        float(getattr(batch, "ph", 7.0)),
    ])

def train_anomaly_model():
    qs = ProductionBatch.objects.all()
    X = np.array([extract_features(b) for b in qs])
    if len(X) < 10:
        return None
    model = IsolationForest(contamination=0.05, random_state=42)
    model.fit(X)
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    return model

def load_model():
    if MODEL_PATH.exists():
        return joblib.load(MODEL_PATH)
    return None

def detect_anomaly(features: np.ndarray):
    model = load_model()
    if model is None:
        # Optional: train on demand
        return {"score": 0.0, "is_anomaly": False}
    score = -model.decision_function([features])[0]
    is_anomaly = model.predict([features])[0] == -1
    return {"score": float(score), "is_anomaly": bool(is_anomaly)}
