"""Optional language-model layer.

It only rephrases a reply the rules engine already produced. Risk level and
buttons never travel through here, and every failure path returns the original
reply unchanged — so the assistant degrades to the rules engine rather than
going silent.

Gemini and OpenAI are both supported; whichever key is configured is used.
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

MAX_REPLY_CHARS = 1800


def active_provider() -> str | None:
    """Which provider will actually be called, if any."""
    choice = (settings.llm_provider or "auto").lower()

    if choice == "none":
        return None
    if choice == "gemini":
        return "gemini" if settings.gemini_api_key else None
    if choice == "openai":
        return "openai" if settings.openai_api_key else None

    # auto
    if settings.gemini_api_key:
        return "gemini"
    if settings.openai_api_key:
        return "openai"
    return None


def is_enabled() -> bool:
    return active_provider() is not None


# --------------------------------------------------------------------- callers


def _call_openai(system: str, user: str) -> str:
    import httpx

    response = httpx.post(
        f"{settings.openai_base_url}/chat/completions",
        headers={"Authorization": f"Bearer {settings.openai_api_key}"},
        json={
            "model": settings.openai_model,
            "temperature": 0.4,
            "max_tokens": 400,
            "response_format": {"type": "json_object"},
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        },
        timeout=settings.llm_timeout_seconds,
    )
    response.raise_for_status()
    return response.json()["choices"][0]["message"]["content"]


def _call_gemini(system: str, user: str) -> str:
    import httpx

    response = httpx.post(
        f"{settings.gemini_base_url}/models/{settings.gemini_model}:generateContent",
        # Header auth rather than ?key= so the secret stays out of access logs.
        headers={"x-goog-api-key": settings.gemini_api_key},
        json={
            "systemInstruction": {"parts": [{"text": system}]},
            "contents": [{"role": "user", "parts": [{"text": user}]}],
            "generationConfig": {
                "temperature": 0.4,
                "maxOutputTokens": 400,
                "responseMimeType": "application/json",
            },
        },
        timeout=settings.llm_timeout_seconds,
    )
    response.raise_for_status()
    return response.json()["candidates"][0]["content"]["parts"][0]["text"]


_CALLERS = {"openai": _call_openai, "gemini": _call_gemini}


# ---------------------------------------------------------------------- guards


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
    """Return a model-worded copy of `reply`, or `reply` itself on any problem."""
    provider = active_provider()
    if provider is None:
        return reply

    # Refusals are fixed wording by design — the model does not get to soften them.
    if not reply.in_scope:
        return reply

    try:
        raw = _CALLERS[provider](
            SYSTEM_PROMPT,
            build_user_message(
                patient_message=patient_message,
                draft=reply.as_dict(),
                risk_level=reply.risk_level,
                context_lines=_context_lines(context),
                history=history,
            ),
        )
        parsed = json.loads(raw)

        assessment = str(parsed.get("assessment", "")).strip()
        action = str(parsed.get("recommended_action", "")).strip()
        advice = str(parsed.get("recovery_advice", "")).strip()

        if not assessment or not action:
            logger.warning("%s reply missing fields; using rules wording", provider)
            return reply

        combined = f"{assessment} {action} {advice}"
        if len(combined) > MAX_REPLY_CHARS:
            logger.warning("%s reply too long; using rules wording", provider)
            return reply

        if not _safe(combined, reply.risk_level):
            logger.warning(
                "%s softened a high-risk case; using rules wording", provider
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
            source=provider,
        )

    except Exception as exc:  # network, quota, bad key, malformed JSON, anything
        logger.warning("%s call failed (%s); using rules wording", provider, exc)
        return reply
