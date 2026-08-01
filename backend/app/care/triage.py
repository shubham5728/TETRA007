"""Symptom triage.

Severity is decided here in code, never by the language model. Two rules make
this safe:

1. Red-flag symptoms (chest pain, trouble breathing, seizures…) are always
   High and can never be talked down by a softening word.
2. When several symptoms appear in one message, the most severe one wins.

The consequence is that an LLM outage, a bad completion, or a patient with no
internet all still get the same triage decision.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

LOW, MODERATE, HIGH = "low", "moderate", "high"
_ORDER = {LOW: 0, MODERATE: 1, HIGH: 2}
_BY_ORDER = {value: key for key, value in _ORDER.items()}


@dataclass
class Symptom:
    label: str
    patterns: tuple[str, ...]
    base: str
    red_flag: bool = False


# Red flags — always High, never downgraded.
RED_FLAGS: tuple[Symptom, ...] = (
    Symptom("chest pain", ("chest pain", "pain in my chest", "chest tightness",
                           "tightness in my chest", "chest pressure",
                           "chest discomfort", "chest is heavy"), HIGH, True),
    Symptom("trouble breathing", ("difficulty breathing", "trouble breathing",
                                  "can't breathe", "cannot breathe",
                                  "cant breathe", "short of breath",
                                  "shortness of breath", "breathless",
                                  "breathlessness", "gasping",
                                  "hard to breathe"), HIGH, True),
    Symptom("heavy bleeding", ("severe bleeding", "heavy bleeding",
                               "bleeding a lot", "bleeding heavily",
                               "won't stop bleeding", "wont stop bleeding",
                               "blood loss"), HIGH, True),
    Symptom("loss of consciousness", ("unconscious", "lost consciousness",
                                      "loss of consciousness", "passed out",
                                      "blacked out", "collapsed"), HIGH, True),
    Symptom("confusion", ("confused", "disoriented", "not making sense",
                          "can't recognise", "cannot recognise"), HIGH, True),
    Symptom("seizure", ("seizure", "seizures", "convulsion", "convulsions",
                        "fits", "shaking uncontrollably"), HIGH, True),
    Symptom("blue lips", ("blue lips", "lips turning blue", "blue fingers",
                          "turning blue"), HIGH, True),
    Symptom("stroke signs", ("paralysis", "paralysed", "can't move my",
                             "cannot move my", "face drooping",
                             "slurred speech", "one side is weak"), HIGH, True),
    Symptom("severe allergic reaction", ("allergic reaction", "anaphylaxis",
                                         "throat is closing", "swollen throat",
                                         "swollen tongue", "lips swelling",
                                         "hives all over"), HIGH, True),
)

# Everything else starts at a base level and can move with modifiers.
SYMPTOMS: tuple[Symptom, ...] = (
    # Post-discharge fever is an infection signal, so it starts at Moderate.
    Symptom("fever", ("fever", "temperature is high", "high temperature",
                      "feeling feverish", "burning up"), MODERATE),
    Symptom("vomiting", ("vomit", "vomiting", "throwing up", "threw up"), MODERATE),
    Symptom("wound infection", ("pus", "wound smells", "wound is red",
                                "discharge from wound", "wound is warm",
                                "wound infection", "stitches opened"), MODERATE),
    Symptom("diarrhoea", ("diarrhoea", "diarrhea", "loose motions"), MODERATE),
    Symptom("palpitations", ("palpitations", "heart racing", "heart pounding",
                             "fast heartbeat"), MODERATE),
    Symptom("dizziness", ("dizzy", "dizziness", "light headed", "lightheaded",
                          "giddy", "room is spinning"), LOW),
    Symptom("headache", ("headache", "head ache", "head is paining"), LOW),
    Symptom("pain", ("pain", "hurts", "hurting", "ache", "aching", "sore"), LOW),
    Symptom("swelling", ("swelling", "swollen", "puffy"), LOW),
    Symptom("nausea", ("nausea", "nauseous", "feel like vomiting"), LOW),
    Symptom("fatigue", ("fatigue", "tired", "exhausted", "no energy",
                        "weakness", "feeling weak"), LOW),
    Symptom("cough", ("cough", "coughing"), LOW),
    Symptom("rash", ("rash", "itching", "itchy", "skin irritation"), LOW),
    Symptom("constipation", ("constipation", "can't pass stool"), LOW),
    Symptom("poor appetite", ("not eating", "no appetite", "can't eat",
                              "cannot eat", "loss of appetite"), LOW),
)

ESCALATORS: tuple[str, ...] = (
    "severe", "severely", "very bad", "extreme", "extremely", "unbearable",
    "worst", "terrible", "badly", "a lot", "too much", "sudden", "suddenly",
    "increasing", "worsening", "getting worse", "worse than", "more than before",
    "not stopping", "won't stop", "wont stop", "high fever", "very high",
)

PERSISTENCE: tuple[str, ...] = (
    "persistent", "constant", "constantly", "continuous", "continuously",
    "all day", "all night", "since yesterday", "for days", "since days",
    "every day", "keeps coming back", "still have",
)

SOFTENERS: tuple[str, ...] = (
    "mild", "mildly", "slight", "slightly", "little", "a bit", "bit of",
    "minor", "small", "tiny", "manageable", "not much",
)

NEGATIONS: tuple[str, ...] = (
    "no", "not", "don't", "dont", "didn't", "didnt", "without", "never",
    "stopped", "gone", "free of", "any",
)

_DURATION = re.compile(r"\b(?:for|since|from)\s+\d+\s*(?:day|days|week|weeks|hour|hours)\b")


@dataclass
class TriageResult:
    level: str | None = None
    symptoms: list[str] = field(default_factory=list)
    red_flags: list[str] = field(default_factory=list)
    escalated: bool = False
    softened: bool = False

    @property
    def has_symptoms(self) -> bool:
        return bool(self.symptoms)


def _negated(text: str, start: int) -> bool:
    """True when a negation word sits just before the match."""
    window = text[max(0, start - 32) : start]
    words = re.findall(r"[a-z']+", window)
    return any(word in NEGATIONS for word in words[-4:])


def _find(text: str, symptom: Symptom) -> bool:
    for pattern in symptom.patterns:
        for match in re.finditer(rf"(?<!\w){re.escape(pattern)}(?!\w)", text):
            if not _negated(text, match.start()):
                return True
    return False


def _bump(level: str, steps: int) -> str:
    return _BY_ORDER[max(0, min(2, _ORDER[level] + steps))]


def assess(text: str) -> TriageResult:
    """Classify a patient message into Low / Moderate / High, or nothing."""
    lowered = text.lower()
    result = TriageResult()

    for symptom in RED_FLAGS:
        if _find(lowered, symptom):
            result.red_flags.append(symptom.label)
            result.symptoms.append(symptom.label)

    if result.red_flags:
        # A red flag ends the discussion — no modifier can soften it.
        result.level = HIGH
        return result

    has_escalator = any(word in lowered for word in ESCALATORS)
    has_persistence = (
        any(word in lowered for word in PERSISTENCE) or _DURATION.search(lowered) is not None
    )
    has_softener = any(word in lowered for word in SOFTENERS)

    highest: str | None = None
    for symptom in SYMPTOMS:
        if not _find(lowered, symptom):
            continue
        result.symptoms.append(symptom.label)

        level = symptom.base
        if has_escalator:
            level = _bump(level, 1)
            result.escalated = True
        elif has_persistence:
            level = _bump(level, 1)
            result.escalated = True
        elif has_softener:
            level = _bump(level, -1)
            result.softened = True

        if highest is None or _ORDER[level] > _ORDER[highest]:
            highest = level

    result.level = highest
    return result
