import pytest
from app.models import User

def test_get_users_admin_only(client, patient_headers, admin_headers):
    res = client.get("/api/admin/users", headers=patient_headers)
    assert res.status_code == 403
    
    res = client.get("/api/admin/users", headers=admin_headers)
    assert res.status_code == 200
    assert len(res.json()) > 0

def test_create_user(client, admin_headers):
    payload = {
        "email": "newdoctor@auracarelink.com",
        "name": "New Doctor",
        "password": "pass",
        "role": "doctor"
    }
    
    res = client.post("/api/admin/users", json=payload, headers=admin_headers)
    assert res.status_code == 201
    assert res.json()["email"] == "newdoctor@auracarelink.com"
    assert res.json()["role"] == "doctor"
    
def test_delete_user(client, admin_headers):
    payload = {
        "email": "temp@example.com",
        "name": "Temp User",
        "password": "123",
        "role": "patient",
        "patient_id": 1
    }
    res = client.post("/api/admin/users", json=payload, headers=admin_headers)
    user_id = res.json()["id"]
    
    res = client.delete(f"/api/admin/users/{user_id}", headers=admin_headers)
    assert res.status_code == 204
    
    res = client.get("/api/admin/users", headers=admin_headers)
    assert not any(u["id"] == user_id for u in res.json())

def test_cannot_delete_admin(client, admin_headers):
    res = client.get("/api/admin/users", headers=admin_headers)
    admin_user = next(u for u in res.json() if u["role"] == "admin")
    
    res = client.delete(f"/api/admin/users/{admin_user['id']}", headers=admin_headers)
    assert res.status_code == 400
    assert res.json()["detail"] == "Cannot delete an admin"
