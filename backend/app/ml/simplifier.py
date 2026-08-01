"""Turns prescription shorthand into sentences a patient can follow.

The rule engine below is what actually runs today. If a Gemini API key is
configured it is tried first, and any failure falls back to the rules — so the
feature never goes dark just because a network call did.
"""

from __future__ import annotations

import re

from app.config import settings

FORMS = {
    "tab": "tablet",
    "tabs": "tablets",
    "tablet": "tablet",
    "cap": "capsule",
    "caps": "capsules",
    "capsule": "capsule",
    "syp": "syrup",
    "syrup": "syrup",
    "inj": "injection",
    "injection": "injection",
    "oint": "ointment",
    "drops": "drops",
}

FREQUENCIES = {
    "od": "once a day in the morning",
    "qd": "once a day in the morning",
    "bid": "twice a day — one after breakfast and one after dinner",
    "bd": "twice a day — one after breakfast and one after dinner",
    "tid": "three times a day — morning, afternoon and night",
    "tds": "three times a day — morning, afternoon and night",
    "qid": "four times a day",
    "qds": "four times a day",
    "hs": "at bedtime",
    "nocte": "at night",
    "mane": "in the morning",
    "stat": "right now, as a single dose",
    "prn": "only when you need it",
    "sos": "only when you need it",
    "ac": "before meals",
    "pc": "after meals",
    "q4h": "every 4 hours",
    "q6h": "every 6 hours",
    "q8h": "every 8 hours",
    "q12h": "every 12 hours",
}

ROUTES = {
    "po": "by mouth",
    "iv": "into a vein (given by a nurse)",
    "im": "as an injection into the muscle",
    "sc": "as an injection under the skin",
    "sl": "under the tongue",
}

# Plain-language replacements for terms that show up in discharge notes.
TERMS = {
    "htn": "high blood pressure",
    "hypertension": "high blood pressure",
    "dm": "diabetes",
    "t2dm": "type-2 diabetes",
    "cad": "heart artery disease",
    "chf": "heart failure",
    "copd": "long-term lung disease",
    "ckd": "long-term kidney disease",
    "mi": "heart attack",
    "cva": "stroke",
    "afib": "irregular heartbeat",
    "sob": "shortness of breath",
    "npo": "nothing to eat or drink",
    "f/u": "follow-up visit",
    "rx": "prescription",
    "bp": "blood pressure",
    "hr": "heart rate",
    "rbs": "random blood sugar",
    "fbs": "fasting blood sugar",
    "hba1c": "three-month average blood sugar",
}

# 1-0-1 style dosing, widely used on Indian prescriptions.
SLOT_NAMES = ("morning", "afternoon", "night")


def _describe_slots(slots: list[int]) -> str | None:
    parts = [
        f"{count} in the {name}"
        for count, name in zip(slots, SLOT_NAMES)
        if count > 0
    ]
    if not parts:
        return None
    if len(parts) == 1:
        return f"Take {parts[0]}"
    return "Take " + ", ".join(parts[:-1]) + f" and {parts[-1]}"


def _simplify_line(line: str) -> str | None:
    original = line.strip().strip("-•* ")
    if not original:
        return None

    working = original
    form_word = None
    frequency_text = None
    route_text = None
    duration_text = None

    # Dose form at the start: "Tab Metformin ..."
    form_match = re.match(r"^\s*(tabs?|tablet|caps?|capsule|syp|syrup|inj|injection|oint|drops)\b\.?\s*", working, re.I)
    if form_match:
        form_word = FORMS[form_match.group(1).lower().rstrip(".")]
        working = working[form_match.end():]

    # Duration: "x 5 days" / "for 5 days"
    duration_match = re.search(r"\b(?:x|for)\s*(\d+)\s*(day|days|week|weeks)\b", working, re.I)
    if duration_match:
        count = duration_match.group(1)
        unit = duration_match.group(2).lower().rstrip("s")
        duration_text = f"for {count} {unit}{'s' if count != '1' else ''}"
        working = working[: duration_match.start()] + working[duration_match.end():]

    # 1-0-1 slot dosing
    slot_match = re.search(r"\b(\d)\s*-\s*(\d)\s*-\s*(\d)\b", working)
    slots = None
    if slot_match:
        slots = [int(slot_match.group(i)) for i in (1, 2, 3)]
        working = working[: slot_match.start()] + working[slot_match.end():]

    # Route
    for code, text in ROUTES.items():
        if re.search(rf"\b{code}\b", working, re.I):
            route_text = text
            working = re.sub(rf"\b{code}\b", "", working, flags=re.I)
            break

    # Frequency — longest codes first so q12h wins over q1
    for code in sorted(FREQUENCIES, key=len, reverse=True):
        if re.search(rf"\b{re.escape(code)}\b", working, re.I):
            frequency_text = FREQUENCIES[code]
            working = re.sub(rf"\b{re.escape(code)}\b", "", working, flags=re.I)
            break

    # Strength: 500mg, 5 mg, 10ml
    strength = None
    strength_match = re.search(r"(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|iu|units?)\b", working, re.I)
    if strength_match:
        strength = f"{strength_match.group(1)} {strength_match.group(2).lower()}"
        working = working[: strength_match.start()] + working[strength_match.end():]

    drug = re.sub(r"[,;:]+", " ", working)
    drug = re.sub(r"\s{2,}", " ", drug).strip(" .-")

    # Only treat the line as a prescription when something actually marks it as
    # one — a dose form, a strength, a frequency code or slot dosing. Leftover
    # words alone are prose, not a drug name.
    if not (form_word or strength or frequency_text or slots is not None):
        return _simplify_prose(original)

    unit = form_word or "dose"
    name = drug or "the medicine"
    strength_part = f" ({strength})" if strength else ""

    if slots is not None:
        body = _describe_slots(slots)
        if body is None:
            return f"{name}{strength_part}: no doses scheduled."
        sentence = f"{body} — {name}{strength_part}"
    elif frequency_text:
        sentence = f"Take one {unit} of {name}{strength_part} {frequency_text}"
    else:
        sentence = f"Take {name}{strength_part} as your doctor told you"

    if route_text:
        sentence += f", {route_text}"
    if duration_text:
        sentence += f", {duration_text}"
    return sentence.strip() + "."


def _simplify_prose(text: str) -> str:
    """Expand abbreviations inside ordinary sentences."""
    result = text
    for short, long in sorted(TERMS.items(), key=lambda kv: len(kv[0]), reverse=True):
        result = re.sub(rf"\b{re.escape(short)}\b", long, result, flags=re.I)
    return result.strip().rstrip(".") + "."


def simplify_with_rules(text: str) -> list[str]:
    lines = [line for line in re.split(r"[\n\r]+", text) if line.strip()]
    if not lines:
        return []
    output = []
    for line in lines:
        simplified = _simplify_line(line)
        if simplified:
            output.append(simplified)
    return output


def _simplify_with_gemini(text: str) -> list[str] | None:
    """
    Optional path. Untested in this build — no API key is configured here, so
    the rules engine is what has actually been exercised.
    """
    if not settings.gemini_api_key:
        return None
    try:
        import httpx

        prompt = (
            "Rewrite this discharge instruction so a patient with no medical "
            "training can follow it. Use short sentences. One instruction per "
            "line. Do not add advice that is not in the text.\n\n" + text
        )
        response = httpx.post(
            "https://generativelanguage.googleapis.com/v1beta/models/"
            "gemini-2.0-flash:generateContent",
            params={"key": settings.gemini_api_key},
            json={"contents": [{"parts": [{"text": prompt}]}]},
            timeout=20.0,
        )
        response.raise_for_status()
        body = response.json()
        reply = body["candidates"][0]["content"]["parts"][0]["text"]
        return [line.strip("-•* ") for line in reply.splitlines() if line.strip()]
    except Exception:
        # Any failure falls through to the rules engine.
        return None


def simplify(text: str) -> dict:
    lines = _simplify_with_gemini(text)
    source = "gemini"
    if not lines:
        lines = simplify_with_rules(text)
        source = "rules"
    return {
        "original": text,
        "simplified": " ".join(lines),
        "lines": lines,
        "source": source,
    }
