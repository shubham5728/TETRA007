"""Care Coordinator: scope, triage, escalation and the model guard rails.

These are the safety-critical paths. Every assertion here holds without a
network connection, which is the point of putting triage in code.
"""

import pytest

from app.care import llm, scope, triage
from app.care.replies import BUTTONS

# --------------------------------------------------------------------- scope


@pytest.mark.parametrize(
    "message",
    [
        "Who is the prime minister?",
        "Tell me a joke",
        "Write a python function to sort a list",
        "What is the cricket score?",
        "Should I invest in bitcoin?",
        "What does my horoscope say today?",
        "Help me with my maths homework",
    ],
)
def test_unrelated_questions_are_refused(message):
    result = scope.classify(message)
    assert result.in_scope is False
    assert result.topic == "blocked"


@pytest.mark.parametrize(
    "message,topic",
    [
        ("When should I take my tablet?", "medication"),
        ("I have a fever", "symptom"),
        ("What food should I avoid?", "diet"),
        ("When is my next follow-up?", "appointment"),
        ("How is my recovery score?", "twin"),
        ("Am I eligible for Ayushman Bharat?", "scheme"),
        ("Can I climb stairs after surgery?", "recovery"),
    ],
)
def test_healthcare_questions_are_accepted(message, topic):
    result = scope.classify(message)
    assert result.in_scope is True
    assert result.topic == topic


def test_health_signal_beats_a_blocked_word():
    """'Can I watch a movie while resting?' is a recovery question, not chat."""
    result = scope.classify("Can I watch a movie while resting after surgery?")
    assert result.in_scope is True


def test_empty_message_is_not_in_scope():
    assert scope.classify("   ").in_scope is False


# -------------------------------------------------------------------- triage


@pytest.mark.parametrize(
    "message",
    [
        "I have chest pain",
        "I am having difficulty breathing",
        "There is severe bleeding from my wound",
        "My father passed out just now",
        "I had a seizure",
        "My lips are turning blue",
        "My face is drooping and my speech is slurred",
        "I think I am having an allergic reaction, my throat is closing",
    ],
)
def test_red_flags_are_always_high(message):
    result = triage.assess(message)
    assert result.level == triage.HIGH
    assert result.red_flags


def test_a_softening_word_cannot_downgrade_a_red_flag():
    """'Mild chest pain' is still an emergency."""
    result = triage.assess("I have mild chest pain")
    assert result.level == triage.HIGH


def test_negated_symptoms_do_not_trigger():
    result = triage.assess("I have no chest pain and no fever today")
    assert result.level is None
    assert not result.red_flags


@pytest.mark.parametrize(
    "message,expected",
    [
        ("I have a mild headache", triage.LOW),
        ("I feel a little tired", triage.LOW),
        ("I have a fever", triage.MODERATE),
        ("I have been vomiting", triage.MODERATE),
        ("There is pus coming from my wound", triage.MODERATE),
        ("My pain is increasing", triage.MODERATE),
        ("I have had a headache for 3 days", triage.MODERATE),
        ("I have a severe headache", triage.MODERATE),
        ("I have very high fever", triage.HIGH),
        # Persistence must not manufacture an emergency out of a Moderate case.
        ("I have been vomiting since yesterday", triage.MODERATE),
        ("My pain has been increasing for 2 days", triage.MODERATE),
    ],
)
def test_severity_classification(message, expected):
    assert triage.assess(message).level == expected


def test_modifiers_cannot_manufacture_an_emergency():
    """Only the red-flag list produces High — never 'moderate + severe'."""
    result = triage.assess("I have severe vomiting that will not stop")
    assert result.level == triage.MODERATE
    assert not result.red_flags


def test_the_worst_symptom_wins():
    result = triage.assess("I have a mild headache and I am breathless")
    assert result.level == triage.HIGH


def test_no_symptom_means_no_level():
    assert triage.assess("When is my next appointment?").level is None


# ------------------------------------------------------------------- buttons


def test_buttons_match_the_risk_level():
    assert [b["label"] for b in BUTTONS[triage.LOW]] == ["Continue Recovery"]
    assert [b["label"] for b in BUTTONS[triage.MODERATE]] == [
        "Book Doctor Appointment"
    ]
    assert [b["label"] for b in BUTTONS[triage.HIGH]] == [
        "Emergency Call Doctor",
        "Call Emergency Services",
    ]


# ------------------------------------------------------------- model guard rail


def test_no_language_model_is_called_in_tests():
    assert llm.active_provider() is None
    assert llm.is_enabled() is False


def test_provider_selection(monkeypatch):
    """auto prefers Gemini, falls back to OpenAI, then to nothing."""
    from app.config import settings

    monkeypatch.setattr(settings, "llm_provider", "auto")
    monkeypatch.setattr(settings, "gemini_api_key", "g")
    monkeypatch.setattr(settings, "openai_api_key", "o")
    assert llm.active_provider() == "gemini"

    monkeypatch.setattr(settings, "gemini_api_key", None)
    assert llm.active_provider() == "openai"

    monkeypatch.setattr(settings, "openai_api_key", None)
    assert llm.active_provider() is None

    # An explicit choice is honoured even when the other key is present.
    monkeypatch.setattr(settings, "llm_provider", "openai")
    monkeypatch.setattr(settings, "gemini_api_key", "g")
    assert llm.active_provider() is None  # no OpenAI key set

    monkeypatch.setattr(settings, "llm_provider", "none")
    monkeypatch.setattr(settings, "openai_api_key", "o")
    assert llm.active_provider() is None


@pytest.mark.parametrize(
    "text",
    [
        "This is not serious, rest at home.",
        "No need to worry, it should settle by itself.",
        "You can wait a few days before calling anyone.",
    ],
)
def test_reassuring_wording_is_rejected_for_high_risk(text):
    assert llm._safe(text, triage.HIGH) is False


def test_the_same_wording_is_fine_for_low_risk():
    assert llm._safe("This is not serious.", triage.LOW) is True


# ------------------------------------------------------------------ end to end


def test_refusal_reply_over_the_api(client, patient_headers):
    body = client.post(
        "/api/chat", headers=patient_headers, json={"text": "Tell me a joke"}
    ).json()
    reply = body[1]
    assert reply["topic"] == "blocked"
    assert reply["risk_level"] is None
    assert reply["buttons"] == []
    assert "AURA Care Coordinator" in reply["assessment"]


def test_medication_reply_uses_the_real_prescription(client, patient_headers):
    body = client.post(
        "/api/chat", headers=patient_headers, json={"text": "What are my medicines?"}
    ).json()
    reply = body[1]
    assert reply["topic"] == "medication"
    assert "Metformin" in reply["assessment"]
    assert reply["source"] == "rules"


def test_low_risk_reply_shape(client, patient_headers):
    body = client.post(
        "/api/chat", headers=patient_headers, json={"text": "I have a mild headache"}
    ).json()
    reply = body[1]
    assert reply["risk_level"] == "low"
    assert [b["label"] for b in reply["buttons"]] == ["Continue Recovery"]
    assert reply["assessment"] and reply["recommended_action"]


def test_moderate_risk_offers_an_appointment(client, patient_headers):
    body = client.post(
        "/api/chat", headers=patient_headers, json={"text": "I have been vomiting today"}
    ).json()
    reply = body[1]
    assert reply["risk_level"] == "moderate"
    assert [b["label"] for b in reply["buttons"]] == ["Book Doctor Appointment"]


def test_high_risk_shows_both_emergency_buttons(client, patient_headers):
    body = client.post(
        "/api/chat",
        headers=patient_headers,
        json={"text": "I have chest pain and cannot breathe"},
    ).json()
    reply = body[1]
    assert reply["risk_level"] == "high"
    assert [b["label"] for b in reply["buttons"]] == [
        "Emergency Call Doctor",
        "Call Emergency Services",
    ]
    assert "⚠️" in reply["assessment"]


def test_high_risk_conversation_reaches_the_doctor(client, patient_headers):
    """A red-flag message must show up on the doctor dashboard."""
    client.post(
        "/api/chat",
        headers=patient_headers,
        json={"text": "I am having severe bleeding from my wound"},
    )
    alerts = client.get("/api/patient/alerts", headers=patient_headers).json()
    logged = [
        a
        for a in alerts
        if a["severity"] == "critical" and "AI Care Coordinator" in a["title"]
    ]
    assert logged, "expected the conversation to be escalated"


def test_reported_symptom_lands_in_the_recovery_twin(client, patient_headers):
    client.post(
        "/api/chat", headers=patient_headers, json={"text": "My wound is swollen"}
    )
    symptoms = client.get("/api/patient/symptoms", headers=patient_headers).json()
    assert any(s["name"].lower() == "swelling" for s in symptoms)


def test_chat_meta_lists_quick_chips(client, patient_headers):
    body = client.get("/api/chat/meta", headers=patient_headers).json()
    assert "Medication" in body["quick_chips"]
    assert "Symptoms" in body["quick_chips"]
    assert body["llm_enabled"] is False


def test_history_keeps_the_structured_reply(client, patient_headers):
    client.post(
        "/api/chat", headers=patient_headers, json={"text": "I have a mild headache"}
    )
    history = client.get("/api/chat", headers=patient_headers).json()
    last = history[-1]
    assert last["sender"] == "aura"
    assert last["risk_level"] == "low"
    assert last["buttons"], "buttons must survive a reload"
