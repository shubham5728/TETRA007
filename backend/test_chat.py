import requests

r = requests.post("http://127.0.0.1:8000/api/auth/login",
    json={"email": "patient@auracarelink.com", "password": "AuraCare2025"})
token = r.json().get("access_token", "")
headers = {"Authorization": f"Bearer {token}"}

tests = [
    "I have a headache since morning",
    "What should I eat for recovery?",
    "I forgot to take my medicine",
    "I feel anxious and sad",
    "When is my next appointment?",
    "How is my recovery going?",
    "I have a cough and sore throat",
]

for msg in tests:
    r2 = requests.post("http://127.0.0.1:8000/api/chat",
        json={"text": msg, "language": "en"}, headers=headers)
    if r2.status_code == 201:
        aura = next((m for m in r2.json() if m["sender"] == "aura"), None)
        if aura:
            safe = aura["text"].encode("ascii", errors="replace").decode("ascii")
            print(f"\n--- User: {msg} ---")
            print(f"AURA: {safe[:300]}")
    else:
        print(f"ERROR {r2.status_code}: {r2.text[:200]}")
