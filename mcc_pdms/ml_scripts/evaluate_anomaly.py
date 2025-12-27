import os
import pandas as pd
import joblib
from sklearn.metrics import classification_report

from sklearn.ensemble import IsolationForest  # only for type hints

BASE_DIR = os.path.dirname(os.path.dirname(__file__))

batches_path = os.path.join(BASE_DIR, "plant_productionbatch.csv")
qc_path = os.path.join(BASE_DIR, "plant_qcreport.csv")
labels_path = os.path.join(BASE_DIR, "ml_data", "batch_labels.csv")
model_path = os.path.join(BASE_DIR, "ml_models", "anomaly_iforest.joblib")

batches = pd.read_csv(batches_path)
qc = pd.read_csv(qc_path)
labels = pd.read_csv(labels_path)

batches["batch_no"] = batches["batch_no"].astype(str).str.strip()
labels["batch_no"] = labels["batch_no"].astype(str).str.strip()

batches = batches[batches["batch_no"].isin(labels["batch_no"])]

qc_agg = (
    qc.groupby("batch_id")[["moisture_actual", "particle_size_actual"]]
    .mean()
    .reset_index()
)

batches = batches.merge(qc_agg, left_on="id", right_on="batch_id", how="left")
batches = batches.merge(labels[["batch_no", "is_really_bad"]], on="batch_no", how="left")
batches = batches.dropna(subset=["is_really_bad"])

X = batches[["moisture_actual", "particle_size_actual"]].fillna(0)
y_true = batches["is_really_bad"].astype(int)

model: IsolationForest = joblib.load(model_path)

scores = model.decision_function(X)      # higher = more normal [web:1311]
y_pred_raw = model.predict(X)            # -1 = anomaly, 1 = normal [web:1309]
y_pred = (y_pred_raw == -1).astype(int)  # 1=bad, 0=good

print(classification_report(y_true, y_pred, digits=3))
