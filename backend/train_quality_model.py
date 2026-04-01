import json
import os
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

from ppg_features import extract_ppg_features

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
LABELED_FILE = os.path.join(SCRIPT_DIR, "labeled_records.json")
MODEL_FILE = os.path.join(SCRIPT_DIR, "quality_model.joblib")
SCALER_FILE = os.path.join(SCRIPT_DIR, "quality_scaler.joblib")


def load_labeled():
    if os.path.exists(LABELED_FILE):
        with open(LABELED_FILE, "r") as f:
            return json.load(f)
    return []


def main():
    records = load_labeled()
    if len(records) < 4:
        print("Need at least 4 labeled segments (e.g. 2 good, 2 bad).")
        return

    X = np.array([extract_ppg_features(r["ppgData"]) for r in records])
    y = np.array([1 if r["label"] == "good" else 0 for r in records])
    unique_classes, counts = np.unique(y, return_counts=True)
    if len(unique_classes) < 2 or np.min(counts) < 2:
        print("Need at least 2 samples from each label to train and test.")
        return

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    model = RandomForestClassifier(n_estimators=200, random_state=42)
    model.fit(X_train_scaled, y_train)
    score = model.score(scaler.transform(X_test), y_test)
    print(f"Test accuracy: {score:.2f}")
    preds = model.predict(scaler.transform(X_test))
    print(classification_report(y_test, preds, target_names=["bad", "good"]))
    try:
        import joblib
        joblib.dump(model, MODEL_FILE)
        joblib.dump(scaler, SCALER_FILE)
        print("Training completed. Model and scaler saved.")
        print(f"Saved model to {MODEL_FILE} and scaler to {SCALER_FILE}")
    except Exception as e:
        print("Save failed:", e)


if __name__ == "__main__":
    main()
