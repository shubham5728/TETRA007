"""Business logic shared by the routers."""

from __future__ import annotations

import json
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ml import sentinel as engine
from app.ml.features import build_features
from app.models import (
    Alert,
    Appointment,
    Medication,
    Patient,
    RecoveryScorePoint,
    RiskAssessment,
    Symptom,
    VitalReading,
)

ESCALATION_WINDOW_HOURS = 12


def patient_records(db: Session, patient: Patient) -> dict:
    """Pull everything the feature builder needs in one place."""
    return {
        "vitals": list(
            db.scalars(select(VitalReading).where(VitalReading.patient_id == patient.id))
        ),
        "medications": list(
            db.scalars(select(Medication).where(Medication.patient_id == patient.id))
        ),
        "symptoms": list(
            db.scalars(select(Symptom).where(Symptom.patient_id == patient.id))
        ),
        "appointments": list(
            db.scalars(select(Appointment).where(Appointment.patient_id == patient.id))
        ),
    }


def features_for(db: Session, patient: Patient) -> dict[str, float]:
    records = patient_records(db, patient)
    return build_features(
        patient,
        records["vitals"],
        records["medications"],
        records["symptoms"],
        records["appointments"],
    )


def _escalate(db: Session, patient: Patient, result: dict) -> Alert | None:
    """
    Smart Escalation Engine.

    A High risk level raises an alert for the doctor and caregiver, but only
    once per window so a nightly re-run does not spam the care team.
    """
    if result["risk_level"] != "High":
        return None

    cutoff = datetime.now(timezone.utc) - timedelta(hours=ESCALATION_WINDOW_HOURS)
    recent = db.scalar(
        select(Alert)
        .where(
            Alert.patient_id == patient.id,
            Alert.severity == "critical",
            Alert.created_at >= cutoff.replace(tzinfo=None),
        )
        .limit(1)
    )
    if recent is not None:
        return None

    drivers = [f["name"] for f in result["factors"] if f["direction"] == "up"][:3]
    alert = Alert(
        patient_id=patient.id,
        title=f"Readmission risk at {result['readmission_risk']}% — doctor alerted",
        detail=(
            "Risk crossed the safe limit. "
            + ("Main signals: " + "; ".join(drivers) + ". " if drivers else "")
            + result["recommendation"]
        ),
        severity="critical",
    )
    db.add(alert)
    return alert


def run_assessment(db: Session, patient: Patient) -> RiskAssessment:
    """Score the patient, store the result, and escalate if needed."""
    features = features_for(db, patient)
    result = engine.assess(features)

    assessment = RiskAssessment(
        patient_id=patient.id,
        readmission_risk=result["readmission_risk"],
        relapse_risk=result["relapse_risk"],
        recovery_score=result["recovery_score"],
        risk_level=result["risk_level"],
        confidence=result["confidence"],
        model_version=result["model_version"],
        factors_json=json.dumps(result["factors"]),
        recommendation=result["recommendation"],
    )
    db.add(assessment)
    _escalate(db, patient, result)

    # Keep the trend line in step with the score the engine just produced.
    today_label = f"D{(date.today() - patient.discharged_on).days}"
    point = db.scalar(
        select(RecoveryScorePoint).where(
            RecoveryScorePoint.patient_id == patient.id,
            RecoveryScorePoint.day == today_label,
        )
    )
    if point is None:
        db.add(
            RecoveryScorePoint(
                patient_id=patient.id,
                day=today_label,
                score=result["recovery_score"],
            )
        )
    else:
        point.score = result["recovery_score"]

    db.commit()
    db.refresh(assessment)
    return assessment


def latest_assessment(db: Session, patient: Patient) -> RiskAssessment:
    """Most recent score, computing one on first use."""
    assessment = db.scalar(
        select(RiskAssessment)
        .where(RiskAssessment.patient_id == patient.id)
        .order_by(RiskAssessment.created_at.desc(), RiskAssessment.id.desc())
        .limit(1)
    )
    if assessment is None:
        assessment = run_assessment(db, patient)
    return assessment


def _symptom_load(severity: float) -> str:
    if severity <= 0:
        return "None"
    if severity <= 3:
        return "Low"
    if severity <= 6:
        return "Moderate"
    return "High"


def _summary(features: dict[str, float], level: str) -> str:
    parts: list[str] = []

    adherence = features["medication_adherence"]
    if adherence >= 90:
        parts.append("Medicines are being taken on time.")
    elif adherence >= 75:
        parts.append("Medication adherence is improving but doses are still missed.")
    else:
        parts.append("Medicine doses are being missed regularly.")

    severity = features["symptom_severity"]
    if severity <= 0:
        parts.append("No symptoms reported.")
    elif severity <= 3:
        parts.append("Only mild symptoms reported.")
    else:
        parts.append("Symptoms need a doctor's review.")

    if features["followups_missed"] > 0:
        parts.append("A follow-up visit was missed.")

    if features["steps_per_day"] < 2500:
        parts.append("Daily activity is below the goal.")

    lead = {
        "Low": "Recovery is on track.",
        "Moderate": "Recovery is going well, with a few things to watch.",
        "High": "Recovery needs attention right now.",
    }[level]
    return " ".join([lead, *parts])


def build_twin(db: Session, patient: Patient) -> dict:
    assessment = latest_assessment(db, patient)
    features = features_for(db, patient)

    history = list(
        db.scalars(
            select(RecoveryScorePoint)
            .where(RecoveryScorePoint.patient_id == patient.id)
            .order_by(RecoveryScorePoint.id)
        )
    )
    # Change over roughly the last week of recorded points.
    week_ago = history[-8].score if len(history) >= 8 else (history[0].score if history else assessment.recovery_score)
    score_change = assessment.recovery_score - week_ago

    medications = db.scalars(
        select(Medication).where(Medication.patient_id == patient.id)
    ).all()
    adherence = (
        int(round(sum(m.adherence for m in medications) / len(medications)))
        if medications
        else 0
    )

    return {
        "patient": patient,
        "score": assessment.recovery_score,
        "score_change": score_change,
        "risk_level": assessment.risk_level,
        "medication_adherence": adherence,
        "symptom_load": _symptom_load(features["symptom_severity"]),
        "days_since_discharge": int(features["days_since_discharge"]),
        "summary": _summary(features, assessment.risk_level),
        "history": history,
    }


def assessment_to_dict(assessment: RiskAssessment) -> dict:
    return {
        "patient_id": assessment.patient_id,
        "readmission_risk": assessment.readmission_risk,
        "relapse_risk": assessment.relapse_risk,
        "recovery_score": assessment.recovery_score,
        "risk_level": assessment.risk_level,
        "confidence": assessment.confidence,
        "model_version": assessment.model_version,
        "factors": json.loads(assessment.factors_json),
        "recommendation": assessment.recommendation,
        "last_run": assessment.created_at,
    }
