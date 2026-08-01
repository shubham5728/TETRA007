"""Test setup.

The database URL is redirected before anything under app/ is imported, so tests
never touch the development database.
"""

import os
import tempfile
from pathlib import Path

TEST_DB = Path(tempfile.gettempdir()) / "aura_carelink_test.db"
if TEST_DB.exists():
    TEST_DB.unlink()
os.environ["DATABASE_URL"] = f"sqlite:///{TEST_DB}"

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.main import app  # noqa: E402
from app.seed import DEMO_PASSWORD, seed  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def seeded_database():
    seed()
    yield


@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client


def _login(client: TestClient, email: str) -> str:
    response = client.post(
        "/api/auth/login", json={"email": email, "password": DEMO_PASSWORD}
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


@pytest.fixture
def patient_headers(client):
    return {"Authorization": f"Bearer {_login(client, 'patient@auracarelink.com')}"}


@pytest.fixture
def doctor_headers(client):
    return {"Authorization": f"Bearer {_login(client, 'doctor@auracarelink.com')}"}


@pytest.fixture
def caregiver_headers(client):
    return {"Authorization": f"Bearer {_login(client, 'caregiver@auracarelink.com')}"}
