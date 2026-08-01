"""Ties the Care Coordinator together.

Order of work, and why:

1. Rules decide scope, triage level and the draft answer — this is the part
   that must never depend on a network call.
2. OpenAI rewrites the wording only.
3. Anything the patient reports is written into the Recovery Twin, the risk
   model re-runs, and Moderate/High conversations are logged as alerts the
   doctor can review.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.care import llm, replies, triage
from app.care.replies import CoordinatorReply, PatientContext
from app.models import Alert, Appointment, ChatMessage, Medication, Patient, Scheme, Symptom
from app.services import features_for, latest_assessment, run_assessment

HISTORY_TURNS = 6
ESCALATION_WINDOW_MINUTES = 30

# Triage level -> how the symptom is recorded on the Recovery Twin.
SYMPTOM_LEVEL = {
    triage.LOW: "Mild",
    triage.MODERATE: "Moderate",
    triage.HIGH: "Severe",
}


def build_context(db: Session, patient: Patient) -> PatientContext:
    assessment = latest_assessment(db, patient)
    features = features_for(db, patient)

    return PatientContext(
        name=patient.name,
        diagnosis=patient.diagnosis,
        days_since_discharge=int(features["days_since_discharge"]),
        recovery_score=assessment.recovery_score,
        risk_level=assessment.risk_level,
        medications=list(
            db.scalars(
                select(Medication)
                .where(Medication.patient_id == patient.id)
                .order_by(Medication.id)
            )
        ),
        appointments=list(
            db.scalars(
                select(Appointment)
                .where(Appointment.patient_id == patient.id)
                .order_by(Appointment.scheduled_for)
            )
        ),
        schemes=list(db.scalars(select(Scheme).order_by(Scheme.id))),
    )


def _history(db: Session, patient: Patient) -> list[dict]:
    rows = list(
        db.scalars(
            select(ChatMessage)
            .where(ChatMessage.patient_id == patient.id)
            .order_by(ChatMessage.id.desc())
            .limit(HISTORY_TURNS)
        )
    )
    rows.reverse()
    return [{"from": row.sender, "text": row.text} for row in rows]


def _record_symptoms(db: Session, patient: Patient, result: triage.TriageResult) -> None:
    """Write what the patient reported into the Recovery Twin."""
    level = SYMPTOM_LEVEL.get(result.level or triage.LOW, "Mild")
    now = datetime.now(timezone.utc)

    for label in result.symptoms:
        db.add(
            Symptom(
                patient_id=patient.id,
                name=label.capitalize(),
                level=level,
                trend="up" if result.escalated else "flat",
                logged_at=now,
            )
        )


def _log_escalation(
    db: Session, patient: Patient, result: triage.TriageResult, message: str
) -> Alert | None:
    """
    Record Moderate and High conversations for the doctor dashboard.

    Repeats inside a short window are skipped so one anxious patient does not
    bury the care team in duplicates.
    """
    if result.level not in {triage.MODERATE, triage.HIGH}:
        return None

    severity = "critical" if result.level == triage.HIGH else "warning"
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=ESCALATION_WINDOW_MINUTES)
    duplicate = db.scalar(
        select(Alert)
        .where(
            Alert.patient_id == patient.id,
            Alert.severity == severity,
            Alert.created_at >= cutoff.replace(tzinfo=None),
            Alert.title.like("Reported via AI Care Coordinator%"),
        )
        .limit(1)
    )
    if duplicate is not None:
        return None

    named = ", ".join(result.symptoms[:3]) or "a symptom"
    alert = Alert(
        patient_id=patient.id,
        title=f"Reported via AI Care Coordinator — {named}",
        detail=(
            f"Patient wrote: “{message.strip()[:200]}”. "
            f"Triaged as {result.level}."
        ),
        severity=severity,
    )
    db.add(alert)
    return alert


def respond(db: Session, patient: Patient, message: str) -> CoordinatorReply:
    """Full pipeline for one patient message."""
    context = build_context(db, patient)
    reply, triage_result = replies.build(message, context)

    if triage_result.has_symptoms:
        _record_symptoms(db, patient, triage_result)
        _log_escalation(db, patient, triage_result, message)
        db.commit()

        # Re-score now that the twin has new information.
        assessment = run_assessment(db, patient)
        context.recovery_score = assessment.recovery_score
        context.risk_level = assessment.risk_level

    return llm.refine(
        reply,
        patient_message=message,
        context=context,
        history=_history(db, patient),
    )
