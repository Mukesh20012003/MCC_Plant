# plant/ml_service.py
import os
import joblib
import numpy as np

MODEL_PATH = os.path.join(
    os.path.dirname(os.path.dirname(__file__)),  # up from plant/ to project root
    "quality_model.pkl",
)

_model = None
_feature_cols = [
    "pretreatment_temperature",
    "hydrolysis_temperature",
    "hydrolysis_time_min",
    "ph",
    "washing_cycles",
    "drying_temperature",
    "drying_time_min",
]


def load_model():
    global _model
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")
        _model = joblib.load(MODEL_PATH)
    return _model


def predict_quality(parameters_json: dict):
    model = load_model()

    x = [parameters_json.get(col) for col in _feature_cols]

    if any(v is None for v in x):
        raise ValueError("Missing features for prediction")

    X = np.array(x).reshape(1, -1)

    proba = model.predict_proba(X)[0][1]
    pred = model.predict(X)[0]

    return bool(pred), float(proba)
