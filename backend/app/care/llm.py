"""Optional OpenAI layer.

It only rephrases a reply the rules engine already produced. Risk level and
buttons never travel through here, and every failure path returns the original
reply unchanged — so the assistant degrades to the rules engine rather than
going silent.
"""

from __future__ import annotations

import json
import logging

from app.care.prompt import SYSTEM_PROMPT, build_user_message
from app.care.replies import CoordinatorReply, PatientContext
from app.care.triage import HIGH
from app.config import settings

logger = logging.getLogger(__name__)

# Phrases that would contradict an emergency. If the model produces one while
# the risk level is High, the rewrite is thrown away.
UNSAFE_WHEN_HIGH: tuple[str, ...] = (
    "not serious", "nothing serious", "no need to worry", "don't worry",
    "do not worry", "no cause for concern", "wait and see", "wait a few days",
    "should settle", "will pass", "not urgent", "no need to see",
    "monitor at home", "rest at home",
)

MAX_FIELD_CHARS = 600


def is_enabled() -> bool:
    return bool(settings.openai_api_key)


def _context_lines(context: PatientContext) -> list[str]:
    lines = [
        f"Name: {context.name}",
        f"Diagnosis: {context.diagnosis}",
        f"Day {context.days_since_discharge} after discharge",
        f"Recovery score: {context.recovery_score}%",
        f"Current risk level: {context.risk_level}",
    ]
    if context.medications:
        lines.append(
            "Medicines: "
            + "; ".join(f"{m.name} {m.dose} — {m.schedule}" for m in context.medications)
        )
    appointment = context.next_appointment
    if appointment is not None:
        lines.append(
            f"Next visit: {appointment.title} on "
            f"{appointment.scheduled_for:%d %b %Y} at {appointment.time_label}"
        )
    return lines


def _safe(text: str, risk_level: str | None) -> bool:
    if risk_level != HIGH:
        return True
    lowered = text.lower()
    return not any(phrase in lowered for phrase in UNSAFE_WHEN_HIGH)


def refine(
    reply: CoordinatorReply,
    *,
    patient_message: str,
    context: PatientContext,
    history: list[dict],
) -> CoordinatorReply:
    """Return an LLM-worded copy of `reply`, or `reply` itself on any problem."""
    if not is_enabled():
        return reply

    # Refusals are fixed wording by design — the model does not get to soften them.
    if not reply.in_scope:
        return reply

    try:
        import httpx

        response = httpx.post(
            f"{settings.openai_base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.openai_api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": settings.openai_model,
                "temperature": 0.4,
                "max_tokens": 400,
                "response_format": {"type": "json_object"},
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {
                        "role": "user",
                        "content": build_user_message(
                            patient_message=patient_message,
                            draft=reply.as_dict(),
                            risk_level=reply.risk_level,
                            context_lines=_context_lines(context),
                            history=history,
                        ),
                    },
                ],
            },
            timeout=settings.openai_timeout_seconds,
        )
        response.raise_for_status()
        content = response.json()["choices"][0]["message"]["content"]
        parsed = json.loads(content)

        assessment = str(parsed.get("assessment", "")).strip()
        action = str(parsed.get("recommended_action", "")).strip()
        advice = str(parsed.get("recovery_advice", "")).strip()

        if not assessment or not action:
            logger.warning("OpenAI reply missing required fields; using rules wording")
            return reply

        combined = f"{assessment} {action} {advice}"
        if len(combined) > MAX_FIELD_CHARS * 3:
            logger.warning("OpenAI reply too long; using rules wording")
            return reply

        if not _safe(combined, reply.risk_level):
            logger.warning(
                "OpenAI reply softened a high-risk case; using rules wording"
            )
            return reply

        return CoordinatorReply(
            assessment=assessment,
            recommended_action=action,
            recovery_advice=advice or None,
            # Never taken from the model.
            risk_level=reply.risk_level,
            buttons=reply.buttons,
            topic=reply.topic,
            in_scope=reply.in_scope,
            source="openai",
        )

    except Exception as exc:  # network, quota, malformed JSON, anything
        logger.warning("OpenAI call failed (%s); using rules wording", exc)
        return reply
