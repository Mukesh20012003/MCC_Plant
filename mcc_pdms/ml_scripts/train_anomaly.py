# ml_scripts/train_anomaly.py
import os
import pandas as pd
from sklearn.ensemble import IsolationForest
import joblib  # pip install joblib

# ---------- paths ----------
BASE_DIR = os.path.dirname(os.path.dirname(__file__))

batches_path = os.path.join(BASE_DIR, "plant_productionbatch.csv")
qc_path = os.path.join(BASE_DIR, "plant_qcreport.csv")
labels_path = os.path.join(BASE_DIR, "ml_data", "batch_labels.csv")
model_path = os.path.join(BASE_DIR, "ml_models", "anomaly_iforest.joblib")

os.makedirs(os.path.dirname(model_path), exist_ok=True)

# ---------- load CSVs ----------
batches = pd.read_csv(batches_path)
qc = pd.read_csv(qc_path)
labels = pd.read_csv(labels_path)

# Clean up batch_no strings
batches["batch_no"] = batches["batch_no"].astype(str).str.strip()
labels["batch_no"] = labels["batch_no"].astype(str).str.strip()

print("All batches batch_no:", batches["batch_no"].tolist())
print("Labels batch_no:", labels["batch_no"].tolist())

# Keep only batches that appear in labels
batches = batches[batches["batch_no"].isin(labels["batch_no"])]
print("Filtered batches (intersection):", batches["batch_no"].tolist())

# ---------- aggregate QC per batch_id ----------
qc_agg = (
    qc.groupby("batch_id")[["moisture_actual", "particle_size_actual"]]
    .mean()
    .reset_index()
)

print("QC agg head:")
print(qc_agg.head())

# Merge QC onto batches using id <-> batch_id
batches = batches.merge(qc_agg, left_on="id", right_on="batch_id", how="left")

# ---------- join labels on batch_no ----------
batches = batches.merge(labels[["batch_no", "is_really_bad"]], on="batch_no", how="left")

print("After label merge:")
print(batches[["batch_no", "is_really_bad"]])

# ---------- select labeled rows ----------
train_df = batches.dropna(subset=["is_really_bad"])
if train_df.empty:
    raise RuntimeError(
        "Still no labeled rows – check that batch_labels.csv batch_no values "
        "match plant_productionbatch.csv (see printed lists above)."
    )

train_df["is_really_bad"] = train_df["is_really_bad"].astype(int)

print("Labeled rows used for training:")
print(train_df[["batch_no", "is_really_bad"]])

# ---------- build feature matrix ----------
X = train_df[["moisture_actual", "particle_size_actual"]].fillna(0)
y = train_df["is_really_bad"]

print("X shape:", X.shape)

# ---------- train Isolation Forest ----------
model = IsolationForest(random_state=42, contamination=0.2)
model.fit(X)

# ---------- save model ----------
joblib.dump(model, model_path)
print("Saved model to:", model_path)
