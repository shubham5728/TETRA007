"""Who may write to a patient's clinical record.

Reading and writing follow different rules. Doctors, hospital admins and
government users can *read* any patient by passing `patient_id` — that is the
whole point of the doctor roster. Writing is separate: vitals and symptoms feed
the Sentinel model, so an unrestricted write is a way to move someone's
clinical risk score.
"""

import pytest

# Roles that are not tied to one patient must name the patient they mean.
NEEDS_PATIENT_ID = {"doctor", "admin", "gov"}


@pytest.fixture
def headers_by_role(
    patient_headers, caregiver_headers, doctor_headers, admin_headers, gov_headers
):
    return {
        "patient": patient_headers,
        "caregiver": caregiver_headers,
        "doctor": doctor_headers,
        "admin": admin_headers,
        "gov": gov_headers,
    }


def params_for(role):
    return {"patient_id": 1} if role in NEEDS_PATIENT_ID else {}


def post(client, role, headers_by_role, path, body=None):
    return client.post(
        path,
        headers=headers_by_role[role],
        params=params_for(role),
        json=body if body is not None else {},
    )


# --------------------------------------------------------------- reads are open


@pytest.mark.parametrize("role", ["doctor", "admin", "gov"])
def test_oversight_roles_can_still_read_a_patient(role, client, headers_by_role):
    response = client.get(
        "/api/patient", headers=headers_by_role[role], params={"patient_id": 1}
    )
    assert response.status_code == 200
    assert response.json()["id"] == 1


# ------------------------------------------------------ clinical record writes


@pytest.mark.parametrize("role", ["patient", "caregiver", "doctor"])
def test_care_team_can_record_a_vital(role, client, headers_by_role):
    response = post(
        client,
        role,
        headers_by_role,
        "/api/patient/vitals",
        {"label": "Test BP", "value": "120/80", "unit": "mmHg", "status": "normal"},
    )
    assert response.status_code == 201


@pytest.mark.parametrize("role", ["admin", "gov"])
def test_non_clinical_roles_cannot_record_a_vital(role, client, headers_by_role):
    """A government account must not be able to move a patient's risk score."""
    response = post(
        client,
        role,
        headers_by_role,
        "/api/patient/vitals",
        {"label": "Forged", "value": "220/140", "unit": "mmHg", "status": "critical"},
    )
    assert response.status_code == 403


@pytest.mark.parametrize("role", ["patient", "caregiver", "doctor"])
def test_care_team_can_log_a_symptom(role, client, headers_by_role):
    response = post(
        client,
        role,
        headers_by_role,
        "/api/patient/symptoms",
        {"name": "Test symptom", "level": "Mild"},
    )
    assert response.status_code == 201


@pytest.mark.parametrize("role", ["admin", "gov"])
def test_non_clinical_roles_cannot_log_a_symptom(role, client, headers_by_role):
    response = post(
        client,
        role,
        headers_by_role,
        "/api/patient/symptoms",
        {"name": "Forged", "level": "Severe"},
    )
    assert response.status_code == 403


# ------------------------------------------------------------- the patient's own actions


@pytest.mark.parametrize("role", ["doctor", "admin", "gov"])
def test_only_the_patient_side_marks_a_dose_taken(role, client, headers_by_role):
    """Taking a tablet is something the patient does, not the hospital."""
    medications = client.get(
        "/api/patient/medications",
        headers=headers_by_role["patient"],
    ).json()
    medication_id = medications[0]["id"]

    response = post(
        client,
        role,
        headers_by_role,
        f"/api/patient/medications/{medication_id}/take",
        {"taken": True},
    )
    assert response.status_code == 403


@pytest.mark.parametrize("role", ["patient", "caregiver"])
def test_patient_side_can_mark_a_dose_taken(role, client, headers_by_role):
    medications = client.get(
        "/api/patient/medications", headers=headers_by_role["patient"]
    ).json()
    response = post(
        client,
        role,
        headers_by_role,
        f"/api/patient/medications/{medications[0]['id']}/take",
        {"taken": True},
    )
    assert response.status_code == 200


@pytest.mark.parametrize("role", ["doctor", "admin", "gov"])
def test_nobody_else_can_speak_as_the_patient(role, client, headers_by_role):
    """Chat writes messages as the patient and logs symptoms from them."""
    response = post(
        client, role, headers_by_role, "/api/chat", {"text": "I feel fine"}
    )
    assert response.status_code == 403


@pytest.mark.parametrize("role", ["patient", "caregiver"])
def test_patient_side_can_use_the_coordinator(role, client, headers_by_role):
    response = post(
        client, role, headers_by_role, "/api/chat", {"text": "What are my medicines?"}
    )
    assert response.status_code == 201


# ------------------------------------------------------------------- re-scoring


@pytest.mark.parametrize("role", ["patient", "caregiver", "doctor", "admin"])
def test_care_team_can_rescore(role, client, headers_by_role):
    response = client.post(
        "/api/sentinel/run",
        headers=headers_by_role[role],
        params=params_for(role),
    )
    assert response.status_code == 200


def test_government_cannot_rescore(client, headers_by_role):
    """Re-scoring can raise a clinical alert, so it stays with the care team."""
    response = client.post(
        "/api/sentinel/run", headers=headers_by_role["gov"], params={"patient_id": 1}
    )
    assert response.status_code == 403


# --------------------------------------------------------------- error message


def test_refusal_says_who_is_allowed(client, headers_by_role):
    response = post(
        client,
        "gov",
        headers_by_role,
        "/api/patient/vitals",
        {"label": "x", "value": "1", "unit": "x", "status": "normal"},
    )
    detail = response.json()["detail"]
    assert "gov" in detail and "Allowed" in detail
