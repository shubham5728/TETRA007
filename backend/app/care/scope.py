"""Keeps the Care Coordinator inside its healthcare remit.

The assistant is not a general chatbot. Anything outside post-discharge care is
declined with a fixed message rather than answered, and the decision is made
here in code so it holds even when the language model is unavailable.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

# --------------------------------------------------------------------- topics

TOPIC_KEYWORDS: dict[str, tuple[str, ...]] = {
    "medication": (
        "medicine", "medicines", "medication", "tablet", "tablets", "pill",
        "pills", "capsule", "dose", "doses", "dosage", "syrup", "injection",
        "inhaler", "insulin", "antibiotic", "painkiller", "prescription",
        "metformin", "amlodipine", "atorvastatin", "aspirin", "furosemide",
        "missed my", "forgot to take", "reminder",
    ),
    "symptom": (
        "fever", "pain", "hurts", "hurting", "ache", "aching", "swelling",
        "swollen", "dizzy", "dizziness", "vomit", "vomiting", "nausea",
        "nauseous", "headache", "chest", "breath", "breathless", "breathing",
        "bleeding", "blood", "fatigue", "tired", "weakness", "weak", "cough",
        "rash", "itching", "burning", "wound", "stitches", "infection",
        "diarrhoea", "diarrhea", "constipation", "faint", "fainted",
        "unconscious", "seizure", "fits", "paralysis", "numb", "confused",
        "palpitations", "sweating", "chills", "not feeling well",
        "feeling unwell", "feel unwell", "feeling sick", "feel sick",
    ),
    "recovery": (
        "recovery", "recover", "healing", "heal", "walk", "walking",
        "exercise", "stairs", "lifting", "rest", "resting", "sleep",
        "back to work", "normal activity", "physiotherapy", "wound care",
        "how long", "getting better",
    ),
    "discharge": (
        "discharge", "summary", "report", "instructions", "what does this mean",
        "explain", "prescription says", "doctor wrote", "medical term",
    ),
    "diet": (
        "eat", "eating", "food", "diet", "drink", "water", "nutrition",
        "protein", "sugar", "salt", "oil", "fruit", "vegetable", "avoid",
        "fasting", "meal", "breakfast", "lunch", "dinner",
    ),
    "appointment": (
        "appointment", "follow-up", "follow up", "followup", "visit", "checkup",
        "check-up", "consultation", "next visit", "doctor visit", "booking",
        "reschedule",
    ),
    "twin": (
        "recovery score", "recovery twin", "twin", "progress", "trend",
        "my score", "risk score", "readmission", "how am i doing",
    ),
    "scheme": (
        "scheme", "pm-jay", "pmjay", "jan arogya", "ayushman", "abha",
        "insurance", "government health", "free treatment", "health card",
    ),
    # Deliberately specific. A bare "what is" would swallow every off-topic
    # question ("what is the cricket score?") and defeat the scope guard.
    "education": (
        "blood pressure", "bp", "diabetes", "diabetic", "sugar level",
        "blood sugar", "cholesterol", "hygiene", "infection prevention",
        "why is sugar", "why do i need", "importance of",
    ),
}

# Checked in this order — the first match wins. Symptoms come first because
# they drive triage, and "recovery score" must resolve to the twin rather than
# to general recovery advice.
TOPIC_PRIORITY: tuple[str, ...] = (
    "symptom",
    "twin",
    "medication",
    "appointment",
    "scheme",
    "discharge",
    "education",
    "diet",
    "recovery",
)

# --------------------------------------------------------------------- blocked

BLOCKED_KEYWORDS: tuple[str, ...] = (
    # politics / religion / news
    "politics", "political", "election", "government policy", "minister",
    "prime minister", "president", "religion", "religious", "god", "prayer",
    "temple", "church", "mosque", "news", "headline",
    # academics
    "history", "geography", "mathematics", "maths", "algebra", "calculus",
    "physics", "chemistry", "homework", "assignment", "essay", "exam",
    "solve this", "translate this paragraph",
    # tech
    "programming", "code", "coding", "python", "javascript", "software",
    "algorithm", "database", "debug",
    # entertainment
    "movie", "movies", "film", "song", "music", "actor", "actress",
    "celebrity", "netflix", "cricket", "football", "match score", "ipl",
    "sports", "game", "joke", "funny",
    # money
    "stock", "stocks", "share market", "crypto", "bitcoin", "investment",
    "trading", "loan", "salary", "tax",
    # personal / misc
    "dating", "girlfriend", "boyfriend", "relationship advice", "marriage",
    "astrology", "horoscope", "zodiac", "kundli", "lottery",
    "travel", "holiday", "tourist", "shopping", "buy online", "discount",
    "weather forecast",
)

REFUSAL = (
    "I'm AURA Care Coordinator and I'm designed specifically to help patients "
    "with recovery, medications, symptoms, discharge guidance, appointments, "
    "and healthcare support. I can't assist with unrelated topics."
)

REFUSAL_EXAMPLES = (
    "How should I take my medicine?",
    "I have a fever since yesterday.",
    "What food should I avoid?",
    "When is my next follow-up?",
)

CLARIFY = (
    "I'm here to help with your recovery. Could you tell me a little more? "
    "You can ask about your medicines, any symptom you are feeling, your diet, "
    "or your next appointment."
)


@dataclass(frozen=True)
class ScopeResult:
    in_scope: bool
    topic: str  # one of TOPIC_KEYWORDS, "unclear", or "blocked"


def _contains(text: str, phrase: str) -> bool:
    """Word-boundary match so 'bp' does not fire inside 'bpm'."""
    return re.search(rf"(?<!\w){re.escape(phrase)}(?!\w)", text) is not None


def detect_topics(text: str) -> list[str]:
    """Matching topics, most specific first."""
    lowered = text.lower()
    return [
        topic
        for topic in TOPIC_PRIORITY
        if any(_contains(lowered, keyword) for keyword in TOPIC_KEYWORDS[topic])
    ]


def classify(text: str) -> ScopeResult:
    """
    Decide whether a message belongs to the assistant.

    A healthcare signal always wins over a blocked keyword, so "can I watch a
    movie while resting after surgery" is answered rather than refused.
    """
    lowered = text.lower().strip()
    if not lowered:
        return ScopeResult(in_scope=False, topic="unclear")

    topics = detect_topics(lowered)
    if topics:
        # Symptoms take priority — they drive triage.
        if "symptom" in topics:
            return ScopeResult(in_scope=True, topic="symptom")
        return ScopeResult(in_scope=True, topic=topics[0])

    if any(_contains(lowered, keyword) for keyword in BLOCKED_KEYWORDS):
        return ScopeResult(in_scope=False, topic="blocked")

    return ScopeResult(in_scope=False, topic="unclear")
