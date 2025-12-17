import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib


def main():
    df = pd.read_csv("training_data.csv")

    # remove rows with missing values
    df = df.dropna()

    feature_cols = [
        "pretreatment_temperature",
        "hydrolysis_temperature",
        "hydrolysis_time_min",
        "ph",
        "washing_cycles",
        "drying_temperature",
        "drying_time_min",
    ]
    X = df[feature_cols]
    y = df["passed"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = RandomForestClassifier(
        n_estimators=200,
        random_state=42,
        class_weight="balanced",
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    print(classification_report(y_test, y_pred))

    joblib.dump(model, "quality_model.pkl")
    print("Model saved to quality_model.pkl")


if __name__ == "__main__":
    main()
