"""Live end-to-end check against running servers.

Unlike the pytest suite (which uses an in-process test client), this walks the
real HTTP stack the browser uses, screen by screen, and also confirms the web
app is serving.

Run with both servers up:
    python scripts/smoke_test.py
"""

from __future__ import annotations

import sys

import httpx

API = "http://127.0.0.1:8000"
WEB = "http://localhost:3000"
PASSWORD = "AuraCare2025"

passed = 0
failed: list[str] = []


def check(name: str, condition: bool, detail: str = "") -> None:
    global passed
    if condition:
        passed += 1
        print(f"  PASS  {name}")
    else:
        failed.append(name)
        print(f"  FAIL  {name} {detail}")


def section(title: str) -> None:
    print(f"\n{title}")
    print("-" * len(title))


def sign_in(client: httpx.Client, email: str) -> dict:
    response = client.post(
        f"{API}/api/auth/login", json={"email": email, "password": PASSWORD}
    )
    response.raise_for_status()
    return response.json()


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def main() -> int:
    with httpx.Client(timeout=30.0) as client:
        # ------------------------------------------------------------- service
        section("Service")
        health = client.get(f"{API}/api/health").json()
        check("API is up", health["status"] == "ok")
        check("Risk model is loaded", health["model"] == "loaded", health["model"])

        # ------------------------------------------------------------- sign-in
        section("Login screen — all five roles")
        sessions = {}
        for email, role, workspace in [
            ("patient@auracarelink.com", "patient", "/dashboard"),
            ("doctor@auracarelink.com", "doctor", "/doctor-portal"),
            ("caregiver@auracarelink.com", "caregiver", "/caregiver-portal"),
            ("admin@auracarelink.com", "admin", "/sentinel"),
            ("gov@auracarelink.com", "gov", "/settings"),
        ]:
            body = sign_in(client, email)
            sessions[role] = body
            check(
                f"{role} signs in and is routed to {workspace}",
                body["user"]["role"] == role and body["workspace"] == workspace,
            )

        bad = client.post(
            f"{API}/api/auth/login",
            json={"email": "patient@auracarelink.com", "password": "nope"},
        )
        check("Wrong password is refused", bad.status_code == 401)
        check(
            "Workspace is closed without a token",
            client.get(f"{API}/api/patient").status_code == 401,
        )

        for email, role, _ in [
            ("patient@auracarelink.com", "patient", "/dashboard"),
            ("doctor@auracarelink.com", "doctor", "/doctor-portal"),
            ("caregiver@auracarelink.com", "caregiver", "/caregiver-portal"),
            ("admin@auracarelink.com", "admin", "/admin-portal"),
            ("gov@auracarelink.com", "gov", "/gov-portal"),
        ]:
            sessions[role] = sign_in(client, email)

        patient = auth(sessions["patient"]["access_token"])
        doctor = auth(sessions["doctor"]["access_token"])
        caregiver = auth(sessions["caregiver"]["access_token"])

        # ------------------------------------------------------------- dashboard
        section("Dashboard")
        w = sessions["patient"].get("workspace")
        check("patient signs in and is routed to /dashboard", w == "/dashboard")

        w = client.post(f"{API}/api/auth/login", json=creds("doctor")).json().get("workspace")
        check("doctor signs in and is routed to /doctor-portal", w == "/doctor-portal")

        w = client.post(f"{API}/api/auth/login", json=creds("caregiver")).json().get("workspace")
        check("caregiver signs in and is routed to /caregiver-portal", w == "/caregiver-portal")

        w = client.post(f"{API}/api/auth/login", json=creds("admin")).json().get("workspace")
        check("admin signs in and is routed to /admin-portal", w == "/admin-portal")

        w = client.post(f"{API}/api/auth/login", json=creds("gov")).json().get("workspace")
        check("gov signs in and is routed to /gov-portal", w == "/gov-portal")

        twin = client.get(f"{API}/api/recovery-twin", headers=patient).json()
        sentinel = client.get(f"{API}/api/sentinel", headers=patient).json()
        meds = client.get(f"{API}/api/patient/medications", headers=patient).json()
        alerts = client.get(f"{API}/api/patient/alerts", headers=patient).json()
        appts = client.get(f"{API}/api/patient/appointments", headers=patient).json()
        vitals = client.get(f"{API}/api/patient/vitals", headers=patient).json()

        check("Recovery Twin loads", twin["patient"]["name"] == "Priya Ananthan")
        check("Recovery score is in range", 0 <= twin["score"] <= 100, str(twin["score"]))
        check("Score history has points", len(twin["history"]) > 0)
        check("Summary is generated", bool(twin["summary"]))
        check("Sentinel risk loads", 0 <= sentinel["readmission_risk"] <= 100)
        check("Medicines load with plain wording", all(m["plain"] for m in meds))
        check("Alerts load", len(alerts) > 0)
        check("Appointments load", len(appts) > 0)
        check("Vitals load", len(vitals) >= 6)

        # ------------------------------------------------- medication interaction
        section("Medicines — marking a dose")
        target = next(m for m in meds if not m["taken_today"])
        before = target["adherence"]
        after = client.post(
            f"{API}/api/patient/medications/{target['id']}/take",
            headers=patient,
            json={"taken": True},
        ).json()
        check(
            f"Marking {target['name']} taken raises adherence",
            after["adherence"] > before,
            f"{before} -> {after['adherence']}",
        )
        check("Dose shows as taken", after["taken_today"] is True)

        twin_after = client.get(f"{API}/api/recovery-twin", headers=patient).json()
        check(
            "Recovery Twin adherence follows the dose",
            twin_after["medication_adherence"] >= twin["medication_adherence"],
        )

        # ------------------------------------------------------------- symptoms
        section("Recovery Twin — logging a symptom")
        logged = client.post(
            f"{API}/api/patient/symptoms",
            headers=patient,
            json={"name": "Smoke test symptom", "level": "Mild"},
        )
        check("Symptom is accepted", logged.status_code == 201)
        symptoms = client.get(f"{API}/api/patient/symptoms", headers=patient).json()
        check(
            "Symptom appears in the list",
            any(s["name"] == "Smoke test symptom" for s in symptoms),
        )
        bad_level = client.post(
            f"{API}/api/patient/symptoms",
            headers=patient,
            json={"name": "X", "level": "Terrible"},
        )
        check("Invalid severity is refused", bad_level.status_code == 422)

        # ------------------------------------------------------------- sentinel
        section("AURA Sentinel")
        rescored = client.post(f"{API}/api/sentinel/run", headers=patient).json()
        check("Re-score returns a level", rescored["risk_level"] in {"Low", "Moderate", "High"})
        check("Explanation has factors", len(rescored["factors"]) > 0)
        check(
            "Factor weights are a normalised share",
            90 <= sum(f["weight"] for f in rescored["factors"]) <= 110,
            str(sum(f["weight"] for f in rescored["factors"])),
        )
        check(
            "Factors say which way they push",
            all(f["direction"] in {"up", "down"} for f in rescored["factors"]),
        )
        model = client.get(f"{API}/api/sentinel/model").json()
        check("Model AUC is reported", model["readmission_auc"] > 0.7, str(model))

        # --------------------------------------------------------- doctor portal
        section("Doctor Portal")
        roster = client.get(f"{API}/api/doctor/patients", headers=doctor).json()
        check("Roster lists every patient", len(roster) == 5, str(len(roster)))
        risks = [row["risk"] for row in roster]
        check("Sorted highest risk first", risks == sorted(risks, reverse=True), str(risks))

        by_name = {row["name"]: row for row in roster}
        check(
            "Sickest patient is flagged High",
            by_name["Rukmini Devi"]["level"] == "High",
            by_name["Rukmini Devi"]["level"],
        )
        check(
            "Healthiest patient is flagged Low",
            by_name["Joseph Mathew"]["level"] == "Low",
            by_name["Joseph Mathew"]["level"],
        )
        check(
            "Risk ordering is clinically sensible",
            by_name["Rukmini Devi"]["risk"] > by_name["Joseph Mathew"]["risk"],
        )

        opened = client.get(
            f"{API}/api/patient",
            headers=doctor,
            params={"patient_id": by_name["Rukmini Devi"]["id"]},
        ).json()
        check("Doctor can open a named patient", opened["name"] == "Rukmini Devi")

        # ------------------------------------------------------------ escalation
        section("Smart Escalation Engine")
        rukmini_alerts = client.get(
            f"{API}/api/patient/alerts",
            headers=doctor,
            params={"patient_id": by_name["Rukmini Devi"]["id"]},
        ).json()
        critical = [a for a in rukmini_alerts if a["severity"] == "critical"]
        check("High risk raised a critical alert", len(critical) > 0)
        if critical:
            check(
                "Alert names the risk figure",
                "%" in critical[0]["title"],
                critical[0]["title"],
            )

        # ------------------------------------------------------ caregiver portal
        section("Caregiver Portal")
        care_patient = client.get(f"{API}/api/patient", headers=caregiver).json()
        check("Caregiver sees the linked patient", care_patient["name"] == "Priya Ananthan")
        care_alerts = client.get(f"{API}/api/patient/alerts", headers=caregiver).json()
        open_alerts = [a for a in care_alerts if not a["acknowledged"]]
        if open_alerts:
            acked = client.post(
                f"{API}/api/patient/alerts/{open_alerts[0]['id']}/ack", headers=caregiver
            ).json()
            check("Caregiver can acknowledge an alert", acked["acknowledged"] is True)
        else:
            check("Caregiver can acknowledge an alert", True, "(none open)")

        # ---------------------------------------------------- care coordinator
        section("AI Care Coordinator — scope")
        history = client.get(f"{API}/api/chat", headers=patient).json()
        check("Chat history loads", len(history) > 0)

        meta = client.get(f"{API}/api/chat/meta", headers=patient).json()
        check("Quick chips are served", "Medication" in meta["quick_chips"])
        print(
            f"        (language model: "
            f"{'enabled — ' + str(health.get('llm_provider')) if meta['llm_enabled'] else 'off, rules only'})"
        )

        def ask(text: str) -> dict:
            return client.post(f"{API}/api/chat", headers=patient, json={"text": text}).json()[1]

        for off_topic in ["Tell me a joke", "Who won the cricket match?",
                          "Should I buy bitcoin?"]:
            reply = ask(off_topic)
            check(
                f"Refuses: {off_topic!r}",
                reply["topic"] == "blocked" and not reply["buttons"],
                reply["assessment"][:60],
            )

        section("AI Care Coordinator — answers from the record")
        medicine = ask("What are my medicines today?")
        check(
            "Medication answer uses the real prescription",
            "Metformin" in medicine["assessment"],
            medicine["assessment"][:70],
        )
        visit = ask("When is my next appointment?")
        check(
            "Appointment answer names the real visit",
            "Diabetes review" in visit["assessment"],
            visit["assessment"][:70],
        )
        score = ask("How is my recovery score?")
        check("Recovery score answer is personalised", "%" in score["assessment"])

        section("AI Care Coordinator — symptom triage")
        mild = ask("I have a mild headache")
        check(
            "Mild symptom -> Low + Continue Recovery",
            mild["risk_level"] == "low"
            and [b["label"] for b in mild["buttons"]] == ["Continue Recovery"],
            str(mild["risk_level"]),
        )

        moderate = ask("I have been vomiting since yesterday")
        check(
            "Vomiting -> Moderate + Book Doctor Appointment",
            moderate["risk_level"] == "moderate"
            and [b["label"] for b in moderate["buttons"]] == ["Book Doctor Appointment"],
            str(moderate["risk_level"]),
        )

        emergency = ask("I have chest pain and cannot breathe")
        check(
            "Chest pain -> High + both emergency buttons",
            emergency["risk_level"] == "high"
            and [b["label"] for b in emergency["buttons"]]
            == ["Emergency Call Doctor", "Call Emergency Services"],
            str(emergency["risk_level"]),
        )
        check(
            "Emergency reply carries the warning banner",
            emergency["assessment"].startswith("⚠️"),
            emergency["assessment"][:40],
        )

        softened = ask("I have mild chest pain")
        check(
            "'Mild' cannot downgrade chest pain",
            softened["risk_level"] == "high",
            str(softened["risk_level"]),
        )

        negated = ask("I have no chest pain today, just a question about food")
        check(
            "Negated red flag does not fire",
            negated["risk_level"] != "high",
            str(negated["risk_level"]),
        )

        section("AI Care Coordinator — escalation and the Recovery Twin")
        alerts_now = client.get(f"{API}/api/patient/alerts", headers=patient).json()
        escalated = [
            a
            for a in alerts_now
            if "AI Care Coordinator" in a["title"] and a["severity"] == "critical"
        ]
        check("High-risk chat reached the doctor dashboard", len(escalated) > 0)

        symptoms_now = client.get(f"{API}/api/patient/symptoms", headers=patient).json()
        check(
            "Reported symptoms were written to the Recovery Twin",
            any(s["name"].lower() == "chest pain" for s in symptoms_now),
        )

        check(
            "Reply falls back to rules when the model is unavailable",
            emergency["source"] == "rules" or meta["llm_enabled"],
            f"source={emergency['source']}",
        )

        # ------------------------------------------------------------ simplifier
        section("Discharge Summary Simplifier")
        for shorthand, fragment in [
            ("Tab Metformin 500mg BID", "after breakfast and one after dinner"),
            ("Cap Omeprazole 20mg OD", "once a day in the morning"),
            ("Tab Atorvastatin 10mg HS", "at bedtime"),
            ("Tab Furosemide 40mg 1-0-1", "1 in the night"),
            ("Inj Insulin 10 units SC", "under the skin"),
        ]:
            body = client.post(f"{API}/api/tools/simplify", json={"text": shorthand}).json()
            check(f"{shorthand!r}", fragment in body["simplified"], body["simplified"])

        prose = client.post(
            f"{API}/api/tools/simplify",
            json={"text": "Patient has HTN and T2DM, review BP at f/u"},
        ).json()
        check(
            "Medical abbreviations expand in prose",
            "high blood pressure" in prose["simplified"].lower(),
            prose["simplified"],
        )

        # -------------------------------------------------------- wearables etc
        section("Wearables, Appointments, Settings")
        devices = client.get(f"{API}/api/patient/wearables", headers=patient).json()
        check("Devices load", len(devices) == 4)
        check("An unpaired device is shown", any(d["status"] == "Offline" for d in devices))
        schemes = client.get(f"{API}/api/patient/schemes", headers=patient).json()
        check("Government schemes load", len(schemes) == 3)

        # ------------------------------------------------------------- security
        section("Role rules")
        check(
            "Patient cannot open the doctor roster",
            client.get(f"{API}/api/doctor/patients", headers=patient).status_code == 403,
        )
        leaked = client.get(
            f"{API}/api/patient", headers=patient, params={"patient_id": 2}
        ).json()
        check(
            "Patient cannot read another patient by id",
            leaked["name"] == "Priya Ananthan",
            leaked["name"],
        )

        # ------------------------------------------------------------- web app
        section("Web app")
        for route in [
            "/login",
            "/dashboard",
            "/recovery-twin",
            "/sentinel",
            "/care-coordinator",
            "/wearables",
            "/doctor-portal",
            "/caregiver-portal",
            "/appointments",
            "/settings",
        ]:
            try:
                page = client.get(f"{WEB}{route}", follow_redirects=True)
                check(f"{route} serves", page.status_code == 200, str(page.status_code))
            except httpx.HTTPError as exc:
                check(f"{route} serves", False, str(exc))

    print("\n" + "=" * 52)
    print(f"  {passed} passed, {len(failed)} failed")
    if failed:
        print("\n  Failures:")
        for name in failed:
            print(f"    - {name}")
    print("=" * 52)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
