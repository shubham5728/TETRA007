"""Runs the trained models against one patient and explains the result."""

from __future__ import annotations

import threading
from pathlib import Path

import numpy as np
import xgboost as xgb

from app.config import settings
from app.ml.features import FEATURES, FEATURE_LABELS, to_row

_lock = threading.Lock()
_bundle: dict | None = None

# How many drivers the explanation shows.
TOP_FACTORS = 6


class ModelNotTrained(RuntimeError):
    """Raised when the model file is missing so the caller can say so clearly."""


def load_bundle(force: bool = False) -> dict:
    """Load the joblib bundle once and keep it in memory."""
    global _bundle
    with _lock:
        if _bundle is None or force:
            path = Path(settings.model_path)
            if not path.exists():
                raise ModelNotTrained(
                    f"No trained model at {path}. Run: python -m app.ml.train"
                )
            import joblib

            _bundle = joblib.load(path)
        return _bundle


def _contributions(model, row: list[float]) -> np.ndarray:
    """Exact per-feature SHAP contributions for a tree model."""
    matrix = xgb.DMatrix(np.array([row], dtype=float))
    # Last column is the bias term, so it is dropped.
    return model.get_booster().predict(matrix, pred_contribs=True)[0][:-1]


def _clamp(value: float, low: float = 0.0, high: float = 100.0) -> float:
    return max(low, min(high, value))


def recovery_score(features: dict[str, float]) -> int:
    """
    A 0-100 wellness index — not a model prediction.

    It is a transparent weighted blend so a clinician can see exactly why the
    number moved. Predictions come from the models; this is bookkeeping.
    """
    adherence = _clamp(features["medication_adherence"])
    symptom = _clamp(100 - features["symptom_severity"] * 10)
    followup = _clamp(100 - features["followups_missed"] * 35)
    activity = _clamp(min(features["steps_per_day"] / 4000.0, 1.0) * 100)

    spo2_part = _clamp((features["spo2"] - 90) / 7 * 100)
    bp_penalty = max(0.0, features["systolic_bp"] - 130) * 1.5
    hr_penalty = max(0.0, abs(features["heart_rate"] - 75) - 10) * 1.5
    vitals = _clamp(spo2_part - bp_penalty - hr_penalty)

    score = (
        0.30 * adherence
        + 0.25 * symptom
        + 0.15 * followup
        + 0.15 * activity
        + 0.15 * vitals
    )
    return int(round(_clamp(score)))


def risk_level(readmission_risk: int) -> str:
    if readmission_risk >= 65:
        return "High"
    if readmission_risk >= 35:
        return "Moderate"
    return "Low"


def _phrase(feature: str, value: float, raises: bool) -> str:
    """Turn a feature into something a person would actually say."""
    label = FEATURE_LABELS.get(feature, feature)
    if feature == "medication_adherence":
        return f"{label} at {value:.0f}%"
    if feature == "missed_doses_7d":
        return f"{value:.0f} missed doses this week"
    if feature == "followups_missed":
        if value == 0:
            return "All follow-ups attended"
        return f"{value:.0f} missed follow-up visit(s)"
    if feature == "symptom_severity":
        if value == 0:
            return "No symptoms reported"
        return f"{label} at {value:.1f}/10"
    if feature == "spo2":
        return f"{label} at {value:.0f}%"
    if feature == "systolic_bp":
        return f"{label} at {value:.0f} mmHg"
    if feature == "heart_rate":
        return f"{label} at {value:.0f} bpm"
    if feature == "steps_per_day":
        return f"{label} at {value:.0f} steps/day"
    if feature == "sleep_hours":
        return f"{label} at {value:.1f} hrs"
    if feature == "days_since_discharge":
        return f"{value:.0f} days since discharge"
    if feature == "age":
        return f"{label} {value:.0f}"
    if feature == "prior_admissions_12m":
        return f"{value:.0f} admission(s) in the last year"
    if feature == "comorbidity_count":
        return f"{value:.0f} other condition(s)"
    direction = "raising" if raises else "lowering"
    return f"{label} ({direction})"


def _recommendation(level: str, drivers: list[dict]) -> str:
    top_up = next((d for d in drivers if d["direction"] == "up"), None)
    driver_text = f" Main driver: {top_up['name'].lower()}." if top_up else ""

    if level == "High":
        return (
            "Contact the patient today and arrange a consultation within 24 hours. "
            "The caregiver has been notified." + driver_text
        )
    if level == "Moderate":
        return (
            "Review at the next scheduled consultation. No emergency action needed "
            "today." + driver_text
        )
    return "Recovery is on track. Keep the current plan and daily check-ins." + driver_text


def assess(features: dict[str, float]) -> dict:
    """Score one patient and explain the score."""
    bundle = load_bundle()
    row = to_row(features)
    matrix = np.array([row], dtype=float)

    readmission = float(bundle["readmission_model"].predict_proba(matrix)[0][1])
    relapse = float(bundle["relapse_model"].predict_proba(matrix)[0][1])

    readmission_pct = int(round(readmission * 100))
    relapse_pct = int(round(relapse * 100))
    level = risk_level(readmission_pct)

    # Explain the readmission score, which is the one that triggers escalation.
    contribs = _contributions(bundle["readmission_model"], row)
    order = np.argsort(np.abs(contribs))[::-1][:TOP_FACTORS]
    total = float(np.abs(contribs[order]).sum()) or 1.0

    factors = []
    for index in order:
        contribution = float(contribs[index])
        feature = FEATURES[index]
        raises = contribution > 0
        factors.append(
            {
                "name": _phrase(feature, features[feature], raises),
                "weight": int(round(abs(contribution) / total * 100)),
                "direction": "up" if raises else "down",
            }
        )

    # Confidence is how far the probability sits from a coin flip.
    confidence = round(max(readmission, 1 - readmission), 3)

    return {
        "readmission_risk": readmission_pct,
        "relapse_risk": relapse_pct,
        "recovery_score": recovery_score(features),
        "risk_level": level,
        "confidence": confidence,
        "model_version": bundle["version"],
        "factors": factors,
        "recommendation": _recommendation(level, factors),
    }


def model_metrics() -> dict:
    return load_bundle()["metrics"]
