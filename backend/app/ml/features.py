"""Feature definitions shared by training and inference.

Keeping the order in one place means the model can never be fed columns in a
different order than it was trained on.
"""

from __future__ import annotations

import re
from datetime import date

FEATURES: list[str] = [
    "age",
    "days_since_discharge",
    "medication_adherence",
    "missed_doses_7d",
    "symptom_severity",
    "followups_missed",
    "systolic_bp",
    "heart_rate",
    "spo2",
    "steps_per_day",
    "sleep_hours",
    "comorbidity_count",
    "prior_admissions_12m",
]

# Wording used when the engine explains itself to a clinician.
FEATURE_LABELS: dict[str, str] = {
    "age": "Patient age",
    "days_since_discharge": "Time since discharge",
    "medication_adherence": "Medication adherence",
    "missed_doses_7d": "Missed doses this week",
    "symptom_severity": "Reported symptom severity",
    "followups_missed": "Missed follow-up visits",
    "systolic_bp": "Blood pressure",
    "heart_rate": "Heart rate",
    "spo2": "Oxygen saturation",
    "steps_per_day": "Daily activity level",
    "sleep_hours": "Sleep hours",
    "comorbidity_count": "Other conditions",
    "prior_admissions_12m": "Admissions in the last year",
}

SYMPTOM_WEIGHT = {"None": 0.0, "Mild": 1.5, "Moderate": 3.5, "Severe": 6.0}

DEFAULTS: dict[str, float] = {
    "age": 60,
    "days_since_discharge": 7,
    "medication_adherence": 90,
    "missed_doses_7d": 0,
    "symptom_severity": 0,
    "followups_missed": 0,
    "systolic_bp": 122,
    "heart_rate": 74,
    "spo2": 97,
    "steps_per_day": 4000,
    "sleep_hours": 7,
    "comorbidity_count": 1,
    "prior_admissions_12m": 0,
}


def _first_number(text: str) -> float | None:
    match = re.search(r"-?\d+(?:\.\d+)?", str(text))
    return float(match.group()) if match else None


def build_features(patient, vitals, medications, symptoms, appointments) -> dict[str, float]:
    """Turn a patient's stored records into the model's input vector."""
    values = dict(DEFAULTS)
    values["age"] = float(patient.age)

    delta = (date.today() - patient.discharged_on).days
    values["days_since_discharge"] = float(max(delta, 0))

    if medications:
        adherence = sum(m.adherence for m in medications) / len(medications)
        values["medication_adherence"] = float(adherence)
        # Roughly how many doses were dropped over a week of scheduled doses.
        values["missed_doses_7d"] = float(
            round(sum((100 - m.adherence) / 100 * 7 for m in medications))
        )

    if symptoms:
        values["symptom_severity"] = float(
            min(sum(SYMPTOM_WEIGHT.get(s.level, 0.0) for s in symptoms), 10.0)
        )

    values["followups_missed"] = float(
        sum(1 for a in appointments if a.attended is False)
    )

    for vital in vitals:
        label = vital.label.lower()
        number = _first_number(vital.value)
        if number is None:
            continue
        if "blood pressure" in label:
            values["systolic_bp"] = number
        elif "heart" in label:
            values["heart_rate"] = number
        elif "spo" in label or "oxygen" in label:
            values["spo2"] = number
        elif "step" in label:
            values["steps_per_day"] = number
        elif "sleep" in label:
            values["sleep_hours"] = number

    # Diagnosis text is the only signal available for comorbidity count today.
    values["comorbidity_count"] = float(
        max(len(re.split(r"\+|,|and", patient.diagnosis)), 1)
    )

    return {name: float(values[name]) for name in FEATURES}


def to_row(features: dict[str, float]) -> list[float]:
    return [float(features[name]) for name in FEATURES]
