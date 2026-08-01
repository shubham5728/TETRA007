"""Loads the demo cohort.

Wipes and rebuilds the database, so it is safe to re-run while developing but
should never point at real data.

Run with:  python -m app.seed
"""

from __future__ import annotations

from datetime import date, datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.database import Base, SessionLocal, engine
from app.models import (
    Alert,
    Appointment,
    ChatMessage,
    Medication,
    Patient,
    RecoveryScorePoint,
    Scheme,
    Symptom,
    User,
    VitalReading,
    WearableDevice,
)
from app.security import hash_password
from app.services import run_assessment

DEMO_PASSWORD = "AuraCare2025"


def _days_ago(days: int) -> date:
    return date.today() - timedelta(days=days)


def _in_days(days: int) -> date:
    return date.today() + timedelta(days=days)


def _vitals(rows: list[tuple[str, str, str, str]]) -> list[VitalReading]:
    return [
        VitalReading(label=label, value=value, unit=unit, status=status)
        for label, value, unit, status in rows
    ]


def build_cohort(db: Session) -> Patient:
    """Create five patients spanning the full risk range. Returns the demo patient."""

    # ---------------------------------------------------------------- patient 1
    priya = Patient(
        name="Priya Ananthan",
        initials="PA",
        age=67,
        gender="Female",
        diagnosis="Type-2 Diabetes + Hypertension",
        discharged_on=_days_ago(14),
        hospital="Aravind General Hospital, Madurai",
        village="Thirumangalam, Tamil Nadu",
        care_team="Dr. Meera Rajan",
    )
    priya.vitals = _vitals(
        [
            ("Heart Rate", "72", "bpm", "normal"),
            ("SpO2", "97", "%", "normal"),
            ("Blood Pressure", "138/86", "mmHg", "watch"),
            ("Temperature", "98.4", "°F", "normal"),
            ("Steps Today", "2140", "steps", "watch"),
            ("Sleep", "6.2", "hrs", "normal"),
        ]
    )
    priya.medications = [
        Medication(
            name="Metformin",
            dose="500 mg",
            schedule="After breakfast & dinner",
            plain="Take one tablet after breakfast and one after dinner.",
            adherence=84,
            taken_today=True,
        ),
        Medication(
            name="Amlodipine",
            dose="5 mg",
            schedule="Once daily, morning",
            plain="Take one tablet every morning.",
            adherence=96,
            taken_today=True,
        ),
        Medication(
            name="Atorvastatin",
            dose="10 mg",
            schedule="Once daily, bedtime",
            plain="Take one tablet before going to sleep.",
            adherence=71,
            taken_today=False,
        ),
        Medication(
            name="Aspirin",
            dose="75 mg",
            schedule="Once daily, after lunch",
            plain="Take one tablet after lunch.",
            adherence=90,
            taken_today=True,
        ),
    ]
    priya.symptoms = [
        Symptom(name="Fatigue", level="Mild", trend="down"),
        Symptom(name="Dizziness", level="Mild", trend="flat"),
        Symptom(name="Swollen feet", level="None", trend="down"),
        Symptom(name="Breathlessness", level="None", trend="flat"),
    ]
    priya.appointments = [
        Appointment(
            title="Diabetes review",
            doctor="Dr. Meera Rajan",
            mode="In person",
            scheduled_for=_in_days(4),
            time_label="10:30 AM",
            status="Confirmed",
        ),
        Appointment(
            title="Blood pressure check",
            doctor="ASHA worker visit",
            mode="Home visit",
            scheduled_for=_in_days(7),
            time_label="09:00 AM",
            status="Confirmed",
        ),
        Appointment(
            title="Lab work — HbA1c",
            doctor="Aravind General Hospital",
            mode="Lab",
            scheduled_for=_in_days(13),
            time_label="07:45 AM",
            status="Pending",
        ),
        Appointment(
            title="Cardiology follow-up",
            doctor="Dr. Suresh Kumar",
            mode="Video call",
            scheduled_for=_in_days(21),
            time_label="04:00 PM",
            status="Confirmed",
        ),
    ]
    priya.alerts = [
        Alert(
            title="Atorvastatin missed last night",
            detail="Bedtime dose was not marked as taken.",
            severity="warning",
            created_at=datetime.now(timezone.utc) - timedelta(hours=9),
        ),
        Alert(
            title="Evening glucose above target",
            detail="Reading was 212 mg/dL after dinner.",
            severity="warning",
            created_at=datetime.now(timezone.utc) - timedelta(days=1),
        ),
        Alert(
            title="Follow-up confirmed",
            detail="Diabetes review booked for next week.",
            severity="info",
            created_at=datetime.now(timezone.utc) - timedelta(days=2),
        ),
    ]
    priya.devices = [
        WearableDevice(name="Fitness band", model="Generic BLE", status="Connected", battery=68),
        WearableDevice(name="BP monitor", model="Omron HEM-7124", status="Connected", battery=41),
        WearableDevice(name="Glucometer", model="Accu-Chek Active", status="Manual entry", battery=None),
        WearableDevice(name="Pulse oximeter", model="Not paired", status="Offline", battery=None),
    ]
    priya.messages = [
        ChatMessage(
            sender="patient",
            text="என் மாத்திரை எப்போது சாப்பிட வேண்டும்?",
            translated="When should I take my tablet?",
            created_at=datetime.now(timezone.utc) - timedelta(hours=3),
        ),
        ChatMessage(
            sender="aura",
            text=(
                "Take one Metformin tablet after breakfast and one after dinner. "
                "You have already marked this morning's dose as taken."
            ),
            created_at=datetime.now(timezone.utc) - timedelta(hours=3),
        ),
    ]
    priya.score_history = [
        RecoveryScorePoint(day=f"D{i + 1}", score=score)
        for i, score in enumerate(
            [41, 44, 43, 48, 52, 55, 54, 58, 61, 63, 66, 68, 70]
        )
    ]

    # ---------------------------------------------------------------- patient 2
    rukmini = Patient(
        name="Rukmini Devi",
        initials="RD",
        age=74,
        gender="Female",
        diagnosis="Heart failure",
        discharged_on=_days_ago(6),
        hospital="Government General Hospital, Chennai",
        village="Tiruvallur, Tamil Nadu",
        care_team="Dr. Anil Verma",
    )
    rukmini.vitals = _vitals(
        [
            ("Heart Rate", "104", "bpm", "watch"),
            ("SpO2", "91", "%", "watch"),
            ("Blood Pressure", "162/98", "mmHg", "watch"),
            ("Steps Today", "380", "steps", "watch"),
            ("Sleep", "4.1", "hrs", "watch"),
        ]
    )
    rukmini.medications = [
        Medication(
            name="Furosemide", dose="40 mg", schedule="Twice daily",
            plain="Take one tablet in the morning and one in the evening.",
            adherence=44, taken_today=False,
        ),
        Medication(
            name="Carvedilol", dose="3.125 mg", schedule="Twice daily",
            plain="Take one tablet after breakfast and one after dinner.",
            adherence=52, taken_today=False,
        ),
    ]
    rukmini.symptoms = [
        Symptom(name="Breathlessness", level="Severe", trend="up"),
        Symptom(name="Swollen feet", level="Moderate", trend="up"),
    ]
    rukmini.appointments = [
        Appointment(
            title="Cardiology review", doctor="Dr. Anil Verma", mode="In person",
            scheduled_for=_days_ago(2), time_label="11:00 AM",
            status="Missed", attended=False,
        ),
    ]

    # ---------------------------------------------------------------- patient 3
    anand = Patient(
        name="Anand Pillai",
        initials="AP",
        age=58,
        gender="Male",
        diagnosis="Post-CABG recovery",
        discharged_on=_days_ago(9),
        hospital="Amrita Institute, Kochi",
        village="Aluva, Kerala",
        care_team="Dr. Leela Nair",
    )
    anand.vitals = _vitals(
        [
            ("Heart Rate", "88", "bpm", "normal"),
            ("SpO2", "94", "%", "watch"),
            ("Blood Pressure", "148/92", "mmHg", "watch"),
            ("Steps Today", "1200", "steps", "watch"),
            ("Sleep", "5.4", "hrs", "watch"),
        ]
    )
    anand.medications = [
        Medication(
            name="Clopidogrel", dose="75 mg", schedule="Once daily",
            plain="Take one tablet every morning.", adherence=66, taken_today=False,
        ),
    ]
    anand.symptoms = [Symptom(name="Chest discomfort", level="Moderate", trend="flat")]
    anand.appointments = [
        Appointment(
            title="Surgical follow-up", doctor="Dr. Leela Nair", mode="In person",
            scheduled_for=_in_days(3), time_label="09:30 AM", status="Confirmed",
        ),
    ]

    # ---------------------------------------------------------------- patient 4
    fatima = Patient(
        name="Fatima Sheikh",
        initials="FS",
        age=45,
        gender="Female",
        diagnosis="Post-operative recovery",
        discharged_on=_days_ago(20),
        hospital="Civil Hospital, Ahmedabad",
        village="Bavla, Gujarat",
        care_team="Dr. Rakesh Shah",
    )
    fatima.vitals = _vitals(
        [
            ("Heart Rate", "76", "bpm", "normal"),
            ("SpO2", "98", "%", "normal"),
            ("Blood Pressure", "124/78", "mmHg", "normal"),
            ("Steps Today", "3800", "steps", "normal"),
            ("Sleep", "7.1", "hrs", "normal"),
        ]
    )
    fatima.medications = [
        Medication(
            name="Paracetamol", dose="500 mg", schedule="When needed",
            plain="Take one tablet only if you have pain.", adherence=92, taken_today=True,
        ),
    ]
    fatima.symptoms = [Symptom(name="Wound pain", level="Mild", trend="down")]
    fatima.appointments = [
        Appointment(
            title="Wound check", doctor="ASHA worker visit", mode="Home visit",
            scheduled_for=_in_days(5), time_label="10:00 AM", status="Confirmed",
        ),
    ]

    # ---------------------------------------------------------------- patient 5
    joseph = Patient(
        name="Joseph Mathew",
        initials="JM",
        age=61,
        gender="Male",
        diagnosis="COPD",
        discharged_on=_days_ago(30),
        hospital="St. John's Medical College, Bengaluru",
        village="Hoskote, Karnataka",
        care_team="Dr. Priya Menon",
    )
    joseph.vitals = _vitals(
        [
            ("Heart Rate", "74", "bpm", "normal"),
            ("SpO2", "96", "%", "normal"),
            ("Blood Pressure", "126/80", "mmHg", "normal"),
            ("Steps Today", "5200", "steps", "normal"),
            ("Sleep", "7.4", "hrs", "normal"),
        ]
    )
    joseph.medications = [
        Medication(
            name="Salbutamol inhaler", dose="100 mcg", schedule="When needed",
            plain="Use two puffs when you feel breathless.", adherence=97, taken_today=True,
        ),
    ]
    joseph.symptoms = [Symptom(name="Cough", level="None", trend="down")]
    joseph.appointments = [
        Appointment(
            title="Lung function test", doctor="Dr. Priya Menon", mode="In person",
            scheduled_for=_in_days(12), time_label="02:00 PM", status="Confirmed",
        ),
    ]

    db.add_all([priya, rukmini, anand, fatima, joseph])
    db.flush()
    return priya


def build_users(db: Session, demo_patient: Patient) -> None:
    password = hash_password(DEMO_PASSWORD)
    db.add_all(
        [
            User(
                email="patient@auracarelink.com", name="Priya Ananthan",
                password_hash=password, role="patient", patient_id=demo_patient.id,
            ),
            User(
                email="doctor@auracarelink.com", name="Dr. Meera Rajan",
                password_hash=password, role="doctor", patient_id=None,
            ),
            User(
                email="caregiver@auracarelink.com", name="Karthik Ananthan",
                password_hash=password, role="caregiver", patient_id=demo_patient.id,
            ),
            User(
                email="admin@auracarelink.com", name="Hospital Admin",
                password_hash=password, role="admin", patient_id=None,
            ),
            User(
                email="gov@auracarelink.com", name="Health Department",
                password_hash=password, role="gov", patient_id=None,
            ),
        ]
    )


def build_schemes(db: Session) -> None:
    db.add_all(
        [
            Scheme(
                name="Ayushman Bharat PM-JAY",
                benefit="₹5 lakh cover per family per year",
                status="Eligible",
            ),
            Scheme(
                name="CM Comprehensive Health Insurance",
                benefit="Tamil Nadu state cover for listed procedures",
                status="Eligible",
            ),
            Scheme(
                name="National Programme for Diabetes Care",
                benefit="Free screening and medicines at the local health centre",
                status="Enrolled",
            ),
        ]
    )


def seed() -> dict:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        demo_patient = build_cohort(db)
        build_users(db, demo_patient)
        build_schemes(db)
        db.commit()

        # Score everyone once so the doctor list and dashboards have data.
        from app.models import Patient as PatientModel

        summary = []
        for patient in db.query(PatientModel).all():
            assessment = run_assessment(db, patient)
            summary.append(
                {
                    "patient": patient.name,
                    "readmission_risk": assessment.readmission_risk,
                    "level": assessment.risk_level,
                    "recovery_score": assessment.recovery_score,
                }
            )
        return {"patients": summary, "password": DEMO_PASSWORD}
    finally:
        db.close()


if __name__ == "__main__":
    import json

    print(json.dumps(seed(), indent=2, ensure_ascii=False))
