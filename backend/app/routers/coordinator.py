import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.care import coordinator, llm
from app.care.replies import QUICK_CHIPS
from app.database import get_db
from app.ml.simplifier import simplify
from app.models import ChatMessage, Patient
from app.routers.patient import current_patient
from app.schemas import (
    ChatMessageOut,
    ChatMeta,
    ChatSend,
    SimplifyRequest,
    SimplifyResponse,
)

router = APIRouter(prefix="/api", tags=["coordinator"])


def _serialise(message: ChatMessage) -> dict:
    """Widen the ORM row into the shape the chat UI renders."""
    data = {
        "id": message.id,
        "sender": message.sender,
        "text": message.text,
        "translated": message.translated,
        "created_at": message.created_at,
        "assessment": message.assessment,
        "recommended_action": message.recommended_action,
        "recovery_advice": message.recovery_advice,
        "risk_level": message.risk_level,
        "topic": message.topic,
        "source": message.source,
        "buttons": [],
    }
    if message.buttons_json:
        try:
            data["buttons"] = json.loads(message.buttons_json)
        except json.JSONDecodeError:
            data["buttons"] = []
    return data


@router.get("/chat/meta", response_model=ChatMeta)
def chat_meta() -> dict:
    """Quick-action chips and whether the language model is wired up."""
    return {
        "quick_chips": list(QUICK_CHIPS),
        "assistant_online": True,
        "llm_enabled": llm.is_enabled(),
    }


@router.get("/chat", response_model=list[ChatMessageOut])
def chat_history(
    patient: Patient = Depends(current_patient), db: Session = Depends(get_db)
) -> list[dict]:
    rows = db.scalars(
        select(ChatMessage)
        .where(ChatMessage.patient_id == patient.id)
        .order_by(ChatMessage.id)
    )
    return [_serialise(row) for row in rows]


@router.post(
    "/chat", response_model=list[ChatMessageOut], status_code=status.HTTP_201_CREATED
)
def send_message(
    payload: ChatSend,
    patient: Patient = Depends(current_patient),
    db: Session = Depends(get_db),
) -> list[dict]:
    """
    Store the patient's message and the assistant's reply, returning both.

    The reply is triaged by rules first; anything the patient reports is written
    into the Recovery Twin and Moderate/High cases raise an alert for the doctor.
    """
    now = datetime.now(timezone.utc)
    text = payload.text.strip()

    question = ChatMessage(
        patient_id=patient.id, sender="patient", text=text, created_at=now
    )
    db.add(question)
    db.flush()

    reply = coordinator.respond(db, patient, text)

    answer = ChatMessage(
        patient_id=patient.id,
        sender="aura",
        text=reply.as_text(),
        created_at=now,
        assessment=reply.assessment,
        recommended_action=reply.recommended_action,
        recovery_advice=reply.recovery_advice,
        risk_level=reply.risk_level,
        topic=reply.topic,
        buttons_json=json.dumps(reply.buttons) if reply.buttons else None,
        source=reply.source,
    )
    db.add(answer)
    db.commit()
    db.refresh(question)
    db.refresh(answer)

    return [_serialise(question), _serialise(answer)]


@router.post("/tools/simplify", response_model=SimplifyResponse)
def simplify_text(payload: SimplifyRequest) -> dict:
    """Discharge Summary Simplifier — prescription shorthand to plain English."""
    return simplify(payload.text)
