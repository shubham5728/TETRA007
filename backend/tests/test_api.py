"""End-to-end tests for every feature the frontend depends on."""

import pytest

from app.seed import DEMO_PASSWORD

# --------------------------------------------------------------------- meta


def test_health_reports_model_loaded(client):
    body = client.get("/api/health").json()
    assert body["status"] == "ok"
    assert body["model"] == "loaded"


# --------------------------------------------------------------------- auth


@pytest.mark.parametrize(
    "email,role,workspace",
    [
        ("patient@auracarelink.com", "patient", "/dashboard"),
        ("doctor@auracarelink.com", "doctor", "/doctor-portal"),
        ("caregiver@auracarelink.com", "caregiver", "/caregiver-portal"),
        ("admin@auracarelink.com", "admin", "/admin-portal/subscriptions"),
        ("gov@auracarelink.com", "gov", "/gov-portal"),
    ],
)
def test_every_role_can_sign_in(client, email, role, workspace):
    response = client.post(
        "/api/auth/login", json={"email": email, "password": DEMO_PASSWORD}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["user"]["role"] == role
    assert body["workspace"] == workspace
    assert body["access_token"]


def test_wrong_password_is_rejected(client):
    response = client.post(
        "/api/auth/login",
        json={"email": "patient@auracarelink.com", "password": "wrong"},
    )
    assert response.status_code == 401


def test_unknown_email_is_rejected(client):
    response = client.post(
        "/api/auth/login", json={"email": "nobody@example.com", "password": DEMO_PASSWORD}
    )
    assert response.status_code == 401


def test_protected_route_needs_a_token(client):
    assert client.get("/api/patient").status_code == 401


def test_garbage_token_is_rejected(client):
    response = client.get(
        "/api/patient", headers={"Authorization": "Bearer not-a-real-token"}
    )
    assert response.status_code == 401


def test_me_returns_the_signed_in_user(client, patient_headers):
    body = client.get("/api/auth/me", headers=patient_headers).json()
    assert body["email"] == "patient@auracarelink.com"
    assert body["patient_id"] is not None


# --------------------------------------------------------------------- profile


def test_patient_profile(client, patient_headers):
    body = client.get("/api/patient", headers=patient_headers).json()
    assert body["name"] == "Priya Ananthan"
    assert body["diagnosis"] == "Type-2 Diabetes + Hypertension"


def test_vitals_are_listed(client, patient_headers):
    body = client.get("/api/patient/vitals", headers=patient_headers).json()
    labels = {row["label"] for row in body}
    assert {"Heart Rate", "SpO2", "Blood Pressure"} <= labels


def test_vitals_can_be_added(client, patient_headers):
    before = len(client.get("/api/patient/vitals", headers=patient_headers).json())
    response = client.post(
        "/api/patient/vitals",
        headers=patient_headers,
        json={"label": "Weight", "value": "64", "unit": "kg", "status": "normal"},
    )
    assert response.status_code == 201
    after = client.get("/api/patient/vitals", headers=patient_headers).json()
    assert len(after) == before + 1


def test_wearable_devices(client, patient_headers):
    body = client.get("/api/patient/wearables", headers=patient_headers).json()
    assert len(body) == 4
    assert any(device["status"] == "Offline" for device in body)


def test_schemes(client, patient_headers):
    body = client.get("/api/patient/schemes", headers=patient_headers).json()
    assert len(body) == 3
    assert any(scheme["status"] == "Enrolled" for scheme in body)


# --------------------------------------------------------------------- medication


def test_medications_include_plain_language(client, patient_headers):
    body = client.get("/api/patient/medications", headers=patient_headers).json()
    metformin = next(m for m in body if m["name"] == "Metformin")
    assert metformin["plain"] == (
        "Take one tablet after breakfast and one after dinner."
    )


def test_marking_a_dose_taken_raises_adherence(client, patient_headers):
    meds = client.get("/api/patient/medications", headers=patient_headers).json()
    target = next(m for m in meds if m["name"] == "Atorvastatin")
    before = target["adherence"]

    response = client.post(
        f"/api/patient/medications/{target['id']}/take",
        headers=patient_headers,
        json={"taken": True},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["taken_today"] is True
    assert body["adherence"] > before


def test_marking_a_dose_missed_lowers_adherence(client, patient_headers):
    meds = client.get("/api/patient/medications", headers=patient_headers).json()
    target = next(m for m in meds if m["name"] == "Aspirin")
    before = target["adherence"]

    body = client.post(
        f"/api/patient/medications/{target['id']}/take",
        headers=patient_headers,
        json={"taken": False},
    ).json()
    assert body["taken_today"] is False
    assert body["adherence"] < before


def test_medication_from_another_patient_is_not_reachable(client, patient_headers):
    response = client.post(
        "/api/patient/medications/9999/take",
        headers=patient_headers,
        json={"taken": True},
    )
    assert response.status_code == 404


# --------------------------------------------------------------------- symptoms


def test_symptoms_are_listed(client, patient_headers):
    body = client.get("/api/patient/symptoms", headers=patient_headers).json()
    assert any(symptom["name"] == "Fatigue" for symptom in body)


def test_logging_a_symptom(client, patient_headers):
    response = client.post(
        "/api/patient/symptoms",
        headers=patient_headers,
        json={"name": "Headache", "level": "Mild", "trend": "flat"},
    )
    assert response.status_code == 201
    assert response.json()["name"] == "Headache"

    listed = client.get("/api/patient/symptoms", headers=patient_headers).json()
    assert any(symptom["name"] == "Headache" for symptom in listed)


def test_invalid_symptom_level_is_rejected(client, patient_headers):
    response = client.post(
        "/api/patient/symptoms",
        headers=patient_headers,
        json={"name": "Headache", "level": "Catastrophic"},
    )
    assert response.status_code == 422


# --------------------------------------------------------------------- appointments & alerts


def test_appointments_are_sorted_by_date(client, patient_headers):
    body = client.get("/api/patient/appointments", headers=patient_headers).json()
    dates = [row["scheduled_for"] for row in body]
    assert dates == sorted(dates)


def test_alerts_and_acknowledgement(client, patient_headers):
    alerts = client.get("/api/patient/alerts", headers=patient_headers).json()
    assert alerts, "expected seeded alerts"
    target = alerts[0]
    assert target["acknowledged"] is False

    body = client.post(
        f"/api/patient/alerts/{target['id']}/ack", headers=patient_headers
    ).json()
    assert body["acknowledged"] is True


# --------------------------------------------------------------------- recovery twin


def test_recovery_twin_payload(client, patient_headers):
    body = client.get("/api/recovery-twin", headers=patient_headers).json()
    assert body["patient"]["name"] == "Priya Ananthan"
    assert 0 <= body["score"] <= 100
    assert body["risk_level"] in {"Low", "Moderate", "High"}
    assert body["symptom_load"] in {"None", "Low", "Moderate", "High"}
    assert body["days_since_discharge"] >= 0
    assert body["history"], "expected a score history"
    assert body["summary"]


# --------------------------------------------------------------------- sentinel


def test_sentinel_returns_a_scored_assessment(client, patient_headers):
    body = client.get("/api/sentinel", headers=patient_headers).json()
    assert 0 <= body["readmission_risk"] <= 100
    assert 0 <= body["relapse_risk"] <= 100
    assert 0 <= body["recovery_score"] <= 100
    assert body["risk_level"] in {"Low", "Moderate", "High"}
    assert 0.5 <= body["confidence"] <= 1.0
    assert body["model_version"].startswith("sentinel-")
    assert body["recommendation"]


def test_sentinel_explains_itself(client, patient_headers):
    body = client.get("/api/sentinel", headers=patient_headers).json()
    factors = body["factors"]
    assert 1 <= len(factors) <= 6
    for factor in factors:
        assert factor["direction"] in {"up", "down"}
        assert 0 <= factor["weight"] <= 100
        assert factor["name"]
    # The weights are a normalised share of the total contribution.
    assert 90 <= sum(f["weight"] for f in factors) <= 110


def test_sentinel_run_recomputes(client, patient_headers):
    body = client.post("/api/sentinel/run", headers=patient_headers).json()
    assert body["risk_level"] in {"Low", "Moderate", "High"}


def test_model_metrics_are_exposed(client):
    body = client.get("/api/sentinel/model").json()
    assert body["readmission_auc"] > 0.7
    assert body["relapse_auc"] > 0.7
    assert body["cohort_size"] == 8000


def test_risk_ordering_matches_clinical_expectation(client, doctor_headers):
    """The sickest seeded patient must outrank the healthiest one."""
    rows = client.get("/api/doctor/patients", headers=doctor_headers).json()
    by_name = {row["name"]: row for row in rows}

    assert by_name["Rukmini Devi"]["level"] == "High"
    assert by_name["Joseph Mathew"]["level"] == "Low"
    assert by_name["Rukmini Devi"]["risk"] > by_name["Anand Pillai"]["risk"]
    assert by_name["Anand Pillai"]["risk"] > by_name["Joseph Mathew"]["risk"]


def test_high_risk_patient_gets_an_escalation_alert(client, doctor_headers):
    """The Smart Escalation Engine must raise an alert for the High-risk patient."""
    rows = client.get("/api/doctor/patients", headers=doctor_headers).json()
    rukmini = next(row for row in rows if row["name"] == "Rukmini Devi")

    alerts = client.get(
        "/api/patient/alerts",
        headers=doctor_headers,
        params={"patient_id": rukmini["id"]},
    ).json()
    assert any(alert["severity"] == "critical" for alert in alerts)


# --------------------------------------------------------------------- role rules


def test_doctor_list_is_sorted_highest_risk_first(client, doctor_headers):
    rows = client.get("/api/doctor/patients", headers=doctor_headers).json()
    risks = [row["risk"] for row in rows]
    assert risks == sorted(risks, reverse=True)
    # The seed size changes as demo data grows, so assert it is populated
    # rather than pinning an exact count.
    assert len(rows) > 0


def test_patient_cannot_open_the_doctor_list(client, patient_headers):
    assert client.get("/api/doctor/patients", headers=patient_headers).status_code == 403


def test_patient_cannot_read_another_patients_record(client, patient_headers):
    """A patient_id in the query string must be ignored for patient accounts."""
    body = client.get(
        "/api/patient", headers=patient_headers, params={"patient_id": 2}
    ).json()
    assert body["name"] == "Priya Ananthan"


def test_doctor_can_read_a_named_patient(client, doctor_headers):
    body = client.get(
        "/api/patient", headers=doctor_headers, params={"patient_id": 2}
    ).json()
    assert body["name"] == "Rukmini Devi"


def test_doctor_without_patient_id_is_asked_for_one(client, doctor_headers):
    assert client.get("/api/patient", headers=doctor_headers).status_code == 400


def test_caregiver_sees_the_linked_patient(client, caregiver_headers):
    body = client.get("/api/patient", headers=caregiver_headers).json()
    assert body["name"] == "Priya Ananthan"


# --------------------------------------------------------------------- coordinator


def test_chat_history_is_returned(client, patient_headers):
    body = client.get("/api/chat", headers=patient_headers).json()
    assert body
    assert body[0]["sender"] in {"patient", "aura"}


def test_sending_a_message_returns_question_and_reply(client, patient_headers):
    """The transcript contract holds whether or not Gemini is reachable."""
    body = client.post(
        "/api/chat", headers=patient_headers, json={"text": "When do I take my medicine?"}
    ).json()
    assert len(body) == 2
    assert body[0]["sender"] == "patient"
    assert body[0]["text"] == "When do I take my medicine?"
    assert body[1]["sender"] == "aura"
    assert body[1]["text"].strip()


def test_chat_still_answers_when_the_model_is_unavailable(client, patient_headers):
    """
    Tests run with no Gemini key, which is the same situation as an expired
    key, an exhausted quota or a clinic with no internet. The endpoint must
    still answer, and the answer must point the patient at a human rather than
    reassure or diagnose.
    """
    response = client.post(
        "/api/chat",
        headers=patient_headers,
        json={"text": "I feel breathless tonight"},
    )
    assert response.status_code == 201

    reply = response.json()[1]["text"].lower()
    assert "108" in reply, "the offline reply must give the emergency number"
    assert "doctor" in reply or "caregiver" in reply
    for reassurance in ("do not worry", "nothing serious", "you are fine"):
        assert reassurance not in reply


def test_empty_message_is_rejected(client, patient_headers):
    assert client.post("/api/chat", headers=patient_headers, json={"text": ""}).status_code == 422


# --------------------------------------------------------------------- simplifier


@pytest.mark.parametrize(
    "shorthand,expected_fragment",
    [
        ("Tab Metformin 500mg BID", "after breakfast and one after dinner"),
        ("Cap Omeprazole 20mg OD", "once a day in the morning"),
        ("Tab Atorvastatin 10mg HS", "at bedtime"),
        ("Tab Paracetamol 500mg QID x 5 days", "four times a day"),
        ("Tab Amlodipine 5mg 1-0-0", "1 in the morning"),
        ("Tab Furosemide 40mg 1-0-1", "1 in the night"),
        ("Inj Insulin 10 units SC", "under the skin"),
        ("Tab Ibuprofen 400mg PRN", "only when you need it"),
    ],
)
def test_simplifier_handles_prescription_shorthand(client, shorthand, expected_fragment):
    body = client.post("/api/tools/simplify", json={"text": shorthand}).json()
    assert expected_fragment in body["simplified"], body["simplified"]
    assert body["source"] == "rules"


def test_simplifier_expands_medical_terms_in_prose(client):
    body = client.post(
        "/api/tools/simplify",
        json={"text": "Patient has HTN and T2DM, review BP at f/u"},
    ).json()
    simplified = body["simplified"].lower()
    assert "high blood pressure" in simplified
    assert "type-2 diabetes" in simplified


def test_simplifier_handles_multiple_lines(client):
    body = client.post(
        "/api/tools/simplify",
        json={"text": "Tab Metformin 500mg BID\nTab Amlodipine 5mg OD"},
    ).json()
    assert len(body["lines"]) == 2


def test_simplifier_rejects_empty_input(client):
    assert client.post("/api/tools/simplify", json={"text": ""}).status_code == 422
