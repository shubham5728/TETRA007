import requests

# Patient Login
login_data = {"email": "priya@example.com", "password": "AuraCare2025"}
res = requests.post("http://127.0.0.1:8000/api/auth/login", json=login_data)
if res.status_code != 200:
    print("Patient login failed", res.text)
else:
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.get("http://127.0.0.1:8000/api/patient/appointments", headers=headers)
    print("Patient Appointments:", r.status_code, r.text)

# Doctor Login
login_data = {"email": "doctor@example.com", "password": "AuraCare2025"}
res = requests.post("http://127.0.0.1:8000/api/auth/login", json=login_data)
if res.status_code != 200:
    print("Doctor login failed", res.text)
else:
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    r = requests.get("http://127.0.0.1:8000/api/doctor/appointments", headers=headers)
    print("Doctor Appointments:", r.status_code, r.text)
