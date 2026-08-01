from datetime import datetime, timezone

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.ml.simplifier import simplify
from app.models import ChatMessage, Medication, Patient
from app.routers.patient import current_patient
from app.schemas import (
    ChatMessageOut,
    ChatSend,
    SimplifyRequest,
    SimplifyResponse,
)
from app.services import run_assessment

router = APIRouter(prefix="/api", tags=["coordinator"])

# Words that mean the assistant should re-score the patient straight away
# instead of waiting for the nightly run.
URGENT_WORDS = (
    "breathless", "breathing", "chest pain", "faint", "fainted", "bleeding",
    "swollen", "swelling", "fever", "dizzy", "vomit", "unconscious",
)


def _reply_for(db: Session, patient: Patient, text: str) -> str:
    """
    Rule-based assistant.

    This is deliberately simple and says what it knows. Wiring Gemini in means
    replacing this one function.
    """
    lowered = text.lower()

    if any(word in lowered for word in URGENT_WORDS):
        assessment = run_assessment(db, patient)
        if assessment.risk_level == "High":
            return (
                "Thank you for telling me. This has been added to your Recovery "
                f"Twin and your risk is now {assessment.readmission_risk}%. "
                "I have alerted your doctor and caregiver. Please rest and keep "
                "your phone nearby."
            )
        return (
            "Thank you for telling me. I have saved this to your Recovery Twin "
            f"and re-checked your risk — it is {assessment.readmission_risk}%, "
            f"which is {assessment.risk_level.lower()}. If it gets worse, tell me "
            "again and I will alert your doctor."
        )

    if any(word in lowered for word in ("medicine", "tablet", "dose", "medication")):
        medications = db.scalars(
            select(Medication).where(Medication.patient_id == patient.id)
        ).all()
        if medications:
            lines = [f"{m.name} ({m.dose}) — {m.plain}" for m in medications[:4]]
            return "Here is your medicine plan today. " + " ".join(lines)
        return "I do not have any medicines saved for you yet."

    if any(word in lowered for word in ("appointment", "visit", "follow")):
        return (
            "I can see your follow-up plan in the Appointments section. You will "
            "get a reminder two days before and again on the morning of the visit."
        )

    if any(word in lowered for word in ("risk", "score", "recovery")):
        return (
            "Your Recovery Twin is updated every day from your check-ins. You can "
            "see the current score and what is driving it on the Recovery Twin page."
        )

    return (
        "Thank you for telling me. I have saved this to your Recovery Twin. If "
        "anything gets worse, tell me straight away and I will alert your doctor."
    )


@router.get("/chat", response_model=list[ChatMessageOut])
def chat_history(
    patient: Patient = Depends(current_patient), db: Session = Depends(get_db)
) -> list[ChatMessage]:
    return list(
        db.scalars(
            select(ChatMessage)
            .where(ChatMessage.patient_id == patient.id)
            .order_by(ChatMessage.id)
        )
    )


@router.post("/chat", response_model=list[ChatMessageOut], status_code=status.HTTP_201_CREATED)
def send_message(
    payload: ChatSend,
    patient: Patient = Depends(current_patient),
    db: Session = Depends(get_db),
) -> list[ChatMessage]:
    """Store the patient's message and the assistant's reply, returning both."""
    now = datetime.now(timezone.utc)

    question = ChatMessage(
        patient_id=patient.id, sender="patient", text=payload.text.strip(), created_at=now
    )
    db.add(question)
    db.flush()

    answer = ChatMessage(
        patient_id=patient.id,
        sender="aura",
        text=_reply_for(db, patient, payload.text),
        created_at=now,
    )
    db.add(answer)
    db.commit()
    db.refresh(question)
    db.refresh(answer)
    return [question, answer]


@router.post("/tools/simplify", response_model=SimplifyResponse)
def simplify_text(payload: SimplifyRequest) -> dict:
    """Discharge Summary Simplifier — prescription shorthand to plain English."""
    return simplify(payload.text)
