import pandas as pd
import joblib

model = joblib.load("quality_model.pkl")
df = pd.read_csv("training_data.csv").dropna()

sample = df.iloc[0]
features = sample[[
    "pretreatment_temperature",
    "hydrolysis_temperature",
    "hydrolysis_time_min",
    "ph",
    "washing_cycles",
    "drying_temperature",
    "drying_time_min",
]].values.reshape(1, -1)


proba = model.predict_proba(features)[0][1]
pred = model.predict(features)[0]
print("Predicted pass:", bool(pred), "probability:", proba)
