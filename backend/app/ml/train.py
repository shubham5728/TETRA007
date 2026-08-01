"""Trains the AURA Sentinel risk models.

There is no real patient dataset for a hackathon prototype, so a synthetic
cohort is generated from clinically plausible relationships (missed doses and
missed follow-ups raise risk, good adherence and activity lower it). The model
learns those relationships and can then score a real patient's record.

This is stated plainly rather than implied: the numbers the engine produces are
only as good as this generated cohort. The pipeline, features and explainability
are real; the training data is not.

Run with:  python -m app.ml.train
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier

from app.config import settings
from app.ml.features import FEATURES

MODEL_VERSION = "sentinel-v1.0 (XGBoost)"
RNG_SEED = 20260801
COHORT_SIZE = 8000


def _sigmoid(x: np.ndarray) -> np.ndarray:
    return 1.0 / (1.0 + np.exp(-x))


def generate_cohort(n: int = COHORT_SIZE, seed: int = RNG_SEED):
    """Build a synthetic post-discharge cohort with two outcome labels."""
    rng = np.random.default_rng(seed)

    age = rng.normal(62, 13, n).clip(28, 95)
    days_since_discharge = rng.integers(1, 45, n).astype(float)
    medication_adherence = rng.beta(6, 2, n) * 100
    missed_doses_7d = rng.poisson((100 - medication_adherence) / 14).astype(float)
    symptom_severity = rng.gamma(1.6, 1.3, n).clip(0, 10)
    followups_missed = rng.binomial(3, 0.16, n).astype(float)
    systolic_bp = rng.normal(128, 16, n).clip(85, 200)
    heart_rate = rng.normal(76, 11, n).clip(45, 140)
    spo2 = rng.normal(96.5, 2.0, n).clip(82, 100)
    steps_per_day = rng.gamma(3.0, 1300, n).clip(120, 15000)
    sleep_hours = rng.normal(6.8, 1.3, n).clip(2.5, 11)
    comorbidity_count = rng.poisson(1.4, n).clip(0, 6).astype(float)
    prior_admissions_12m = rng.poisson(0.7, n).clip(0, 6).astype(float)

    # Latent risk of being readmitted within 30 days.
    readmission_logit = (
        -4.20
        + 0.030 * (age - 60)
        - 0.038 * (medication_adherence - 80)
        + 0.230 * missed_doses_7d
        + 0.280 * symptom_severity
        + 0.780 * followups_missed
        + 0.021 * (systolic_bp - 125)
        + 0.019 * np.abs(heart_rate - 75)
        - 0.150 * (spo2 - 96)
        - 0.00035 * (steps_per_day - 4000)
        - 0.120 * (sleep_hours - 7)
        + 0.310 * comorbidity_count
        + 0.460 * prior_admissions_12m
        - 0.022 * days_since_discharge
        + rng.normal(0, 0.45, n)
    )

    # Early relapse leans harder on symptoms and adherence, less on history.
    relapse_logit = (
        -4.05
        + 0.018 * (age - 60)
        - 0.052 * (medication_adherence - 80)
        + 0.300 * missed_doses_7d
        + 0.460 * symptom_severity
        + 0.420 * followups_missed
        + 0.014 * (systolic_bp - 125)
        - 0.180 * (spo2 - 96)
        - 0.00025 * (steps_per_day - 4000)
        + 0.240 * comorbidity_count
        + 0.180 * prior_admissions_12m
        - 0.030 * days_since_discharge
        + rng.normal(0, 0.50, n)
    )

    X = np.column_stack(
        [
            age,
            days_since_discharge,
            medication_adherence,
            missed_doses_7d,
            symptom_severity,
            followups_missed,
            systolic_bp,
            heart_rate,
            spo2,
            steps_per_day,
            sleep_hours,
            comorbidity_count,
            prior_admissions_12m,
        ]
    )
    y_readmission = rng.binomial(1, _sigmoid(readmission_logit))
    y_relapse = rng.binomial(1, _sigmoid(relapse_logit))
    return X, y_readmission, y_relapse


def _fit(X, y, seed: int) -> tuple[XGBClassifier, float]:
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=seed, stratify=y
    )
    model = XGBClassifier(
        n_estimators=260,
        max_depth=4,
        learning_rate=0.06,
        subsample=0.9,
        colsample_bytree=0.9,
        reg_lambda=1.2,
        eval_metric="logloss",
        random_state=seed,
    )
    model.fit(X_train, y_train)
    auc = roc_auc_score(y_test, model.predict_proba(X_test)[:, 1])
    return model, float(auc)


def train() -> dict:
    X, y_readmission, y_relapse = generate_cohort()

    readmission_model, readmission_auc = _fit(X, y_readmission, RNG_SEED)
    relapse_model, relapse_auc = _fit(X, y_relapse, RNG_SEED + 1)

    import joblib  # imported here so the module stays cheap to import

    bundle = {
        "version": MODEL_VERSION,
        "features": FEATURES,
        "readmission_model": readmission_model,
        "relapse_model": relapse_model,
        "metrics": {
            "readmission_auc": round(readmission_auc, 4),
            "relapse_auc": round(relapse_auc, 4),
            "cohort_size": int(X.shape[0]),
            "readmission_rate": round(float(y_readmission.mean()), 4),
            "relapse_rate": round(float(y_relapse.mean()), 4),
        },
    }

    path = Path(settings.model_path)
    path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(bundle, path)
    return bundle["metrics"] | {"version": MODEL_VERSION, "path": str(path)}


if __name__ == "__main__":
    print(json.dumps(train(), indent=2))
