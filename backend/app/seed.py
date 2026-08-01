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
    DigitalHealthCard,
    VerificationLog,
    DoctorProfile,
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
        village="Thirumangalam",
        district="Madurai",
        state="Tamil Nadu",
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
            doctor_id=1,
            title="Diabetes review",
            doctor="Dr. Meera Rajan",
            mode="In person",
            scheduled_for=_in_days(4),
            time_label="10:30 AM",
            status="Confirmed",
        ),
        Appointment(
            doctor_id=1,
            title="Blood pressure check",
            doctor="ASHA worker visit",
            mode="Home visit",
            scheduled_for=_in_days(7),
            time_label="09:00 AM",
            status="Confirmed",
        ),
        Appointment(
            doctor_id=1,
            title="Lab work — HbA1c",
            doctor="Aravind General Hospital",
            mode="Lab",
            scheduled_for=_in_days(13),
            time_label="07:45 AM",
            status="Pending",
        ),
        Appointment(
            doctor_id=1,
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
        village="Tiruvallur",
        district="Chennai",
        state="Tamil Nadu",
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
        village="Aluva",
        district="Ernakulam",
        state="Kerala",
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
        village="Bavla",
        district="Ahmedabad",
        state="Gujarat",
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
        village="Hoskote",
        district="Bengaluru Rural",
        state="Karnataka",
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

    p_0 = Patient(
        name="Patient 0",
        initials="P0",
        age=28,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(45),
        hospital="General Hospital, Hubballi",
        village="Unknown",
        district="Hubballi",
        state="Karnataka",
        care_team="Dr. Unknown",
    )
    p_0.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [87, 46, 67, 67, 83]
        )
    ]
    db.add(p_0)


    p_1 = Patient(
        name="Patient 1",
        initials="P1",
        age=76,
        gender="Female",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(36),
        hospital="AIIMS, Kozhikode",
        village="Unknown",
        district="Kozhikode",
        state="Kerala",
        care_team="Dr. Unknown",
    )
    p_1.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [57, 41, 70, 63, 50]
        )
    ]
    db.add(p_1)


    p_2 = Patient(
        name="Patient 2",
        initials="P2",
        age=58,
        gender="Female",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(13),
        hospital="Apollo, South Delhi",
        village="Unknown",
        district="South Delhi",
        state="Delhi",
        care_team="Dr. Unknown",
    )
    p_2.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [89, 68, 48, 87, 42]
        )
    ]
    db.add(p_2)


    p_3 = Patient(
        name="Patient 3",
        initials="P3",
        age=62,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(22),
        hospital="City Hospital, Chennai",
        village="Unknown",
        district="Chennai",
        state="Tamil Nadu",
        care_team="Dr. Unknown",
    )
    p_3.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [78, 65, 43, 56, 59]
        )
    ]
    db.add(p_3)


    p_4 = Patient(
        name="Patient 4",
        initials="P4",
        age=36,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(55),
        hospital="City Hospital, Madurai",
        village="Unknown",
        district="Madurai",
        state="Tamil Nadu",
        care_team="Dr. Unknown",
    )
    p_4.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [53, 91, 81, 83, 42]
        )
    ]
    db.add(p_4)


    p_5 = Patient(
        name="Patient 5",
        initials="P5",
        age=55,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(60),
        hospital="City Hospital, South Delhi",
        village="Unknown",
        district="South Delhi",
        state="Delhi",
        care_team="Dr. Unknown",
    )
    p_5.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [40, 44, 94, 61, 74]
        )
    ]
    db.add(p_5)


    p_6 = Patient(
        name="Patient 6",
        initials="P6",
        age=77,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(60),
        hospital="Apollo, Jaipur",
        village="Unknown",
        district="Jaipur",
        state="Rajasthan",
        care_team="Dr. Unknown",
    )
    p_6.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [74, 52, 69, 68, 48]
        )
    ]
    db.add(p_6)


    p_7 = Patient(
        name="Patient 7",
        initials="P7",
        age=59,
        gender="Female",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(59),
        hospital="Civil Hospital, Vadodara",
        village="Unknown",
        district="Vadodara",
        state="Gujarat",
        care_team="Dr. Unknown",
    )
    p_7.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [93, 61, 58, 66, 65]
        )
    ]
    db.add(p_7)


    p_8 = Patient(
        name="Patient 8",
        initials="P8",
        age=80,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(39),
        hospital="City Hospital, South Delhi",
        village="Unknown",
        district="South Delhi",
        state="Delhi",
        care_team="Dr. Unknown",
    )
    p_8.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [95, 78, 81, 54, 77]
        )
    ]
    db.add(p_8)


    p_9 = Patient(
        name="Patient 9",
        initials="P9",
        age=53,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(51),
        hospital="Apollo, Ernakulam",
        village="Unknown",
        district="Ernakulam",
        state="Kerala",
        care_team="Dr. Unknown",
    )
    p_9.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [95, 71, 68, 56, 52]
        )
    ]
    db.add(p_9)


    p_10 = Patient(
        name="Patient 10",
        initials="P10",
        age=23,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(36),
        hospital="City Hospital, Hubballi",
        village="Unknown",
        district="Hubballi",
        state="Karnataka",
        care_team="Dr. Unknown",
    )
    p_10.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [53, 78, 85, 51, 48]
        )
    ]
    db.add(p_10)


    p_11 = Patient(
        name="Patient 11",
        initials="P11",
        age=51,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(50),
        hospital="Apollo, Jodhpur",
        village="Unknown",
        district="Jodhpur",
        state="Rajasthan",
        care_team="Dr. Unknown",
    )
    p_11.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [72, 83, 72, 72, 79]
        )
    ]
    db.add(p_11)


    p_12 = Patient(
        name="Patient 12",
        initials="P12",
        age=53,
        gender="Female",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(18),
        hospital="Apollo, Kanpur",
        village="Unknown",
        district="Kanpur",
        state="Uttar Pradesh",
        care_team="Dr. Unknown",
    )
    p_12.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [60, 63, 75, 66, 68]
        )
    ]
    db.add(p_12)


    p_13 = Patient(
        name="Patient 13",
        initials="P13",
        age=64,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(50),
        hospital="Apollo, Mangaluru",
        village="Unknown",
        district="Mangaluru",
        state="Karnataka",
        care_team="Dr. Unknown",
    )
    p_13.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [45, 73, 56, 95, 59]
        )
    ]
    db.add(p_13)


    p_14 = Patient(
        name="Patient 14",
        initials="P14",
        age=68,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(39),
        hospital="Apollo, Varanasi",
        village="Unknown",
        district="Varanasi",
        state="Uttar Pradesh",
        care_team="Dr. Unknown",
    )
    p_14.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [94, 64, 48, 92, 54]
        )
    ]
    db.add(p_14)


    p_15 = Patient(
        name="Patient 15",
        initials="P15",
        age=75,
        gender="Female",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(16),
        hospital="Civil Hospital, Kozhikode",
        village="Unknown",
        district="Kozhikode",
        state="Kerala",
        care_team="Dr. Unknown",
    )
    p_15.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [57, 71, 62, 44, 46]
        )
    ]
    db.add(p_15)


    p_16 = Patient(
        name="Patient 16",
        initials="P16",
        age=24,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(22),
        hospital="Fortis, Thane",
        village="Unknown",
        district="Thane",
        state="Maharashtra",
        care_team="Dr. Unknown",
    )
    p_16.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [84, 90, 91, 50, 78]
        )
    ]
    db.add(p_16)


    p_17 = Patient(
        name="Patient 17",
        initials="P17",
        age=20,
        gender="Female",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(42),
        hospital="AIIMS, Bengaluru Urban",
        village="Unknown",
        district="Bengaluru Urban",
        state="Karnataka",
        care_team="Dr. Unknown",
    )
    p_17.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [41, 52, 87, 92, 76]
        )
    ]
    db.add(p_17)


    p_18 = Patient(
        name="Patient 18",
        initials="P18",
        age=64,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(39),
        hospital="Fortis, Mangaluru",
        village="Unknown",
        district="Mangaluru",
        state="Karnataka",
        care_team="Dr. Unknown",
    )
    p_18.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [57, 84, 71, 57, 44]
        )
    ]
    db.add(p_18)


    p_19 = Patient(
        name="Patient 19",
        initials="P19",
        age=76,
        gender="Female",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(37),
        hospital="General Hospital, Kanpur",
        village="Unknown",
        district="Kanpur",
        state="Uttar Pradesh",
        care_team="Dr. Unknown",
    )
    p_19.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [86, 55, 83, 47, 86]
        )
    ]
    db.add(p_19)


    p_20 = Patient(
        name="Patient 20",
        initials="P20",
        age=30,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(53),
        hospital="AIIMS, Nagpur",
        village="Unknown",
        district="Nagpur",
        state="Maharashtra",
        care_team="Dr. Unknown",
    )
    p_20.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [52, 79, 51, 50, 48]
        )
    ]
    db.add(p_20)


    p_21 = Patient(
        name="Patient 21",
        initials="P21",
        age=38,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(52),
        hospital="Fortis, Bengaluru Urban",
        village="Unknown",
        district="Bengaluru Urban",
        state="Karnataka",
        care_team="Dr. Unknown",
    )
    p_21.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [90, 56, 85, 75, 77]
        )
    ]
    db.add(p_21)


    p_22 = Patient(
        name="Patient 22",
        initials="P22",
        age=47,
        gender="Female",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(6),
        hospital="City Hospital, Pune",
        village="Unknown",
        district="Pune",
        state="Maharashtra",
        care_team="Dr. Unknown",
    )
    p_22.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [92, 41, 88, 91, 78]
        )
    ]
    db.add(p_22)


    p_23 = Patient(
        name="Patient 23",
        initials="P23",
        age=45,
        gender="Female",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(56),
        hospital="Civil Hospital, Chennai",
        village="Unknown",
        district="Chennai",
        state="Tamil Nadu",
        care_team="Dr. Unknown",
    )
    p_23.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [68, 91, 58, 51, 45]
        )
    ]
    db.add(p_23)


    p_24 = Patient(
        name="Patient 24",
        initials="P24",
        age=33,
        gender="Female",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(33),
        hospital="Fortis, Bengaluru Urban",
        village="Unknown",
        district="Bengaluru Urban",
        state="Karnataka",
        care_team="Dr. Unknown",
    )
    p_24.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [92, 51, 53, 44, 53]
        )
    ]
    db.add(p_24)


    p_25 = Patient(
        name="Patient 25",
        initials="P25",
        age=24,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(23),
        hospital="City Hospital, Thiruvananthapuram",
        village="Unknown",
        district="Thiruvananthapuram",
        state="Kerala",
        care_team="Dr. Unknown",
    )
    p_25.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [83, 71, 91, 93, 67]
        )
    ]
    db.add(p_25)


    p_26 = Patient(
        name="Patient 26",
        initials="P26",
        age=44,
        gender="Female",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(50),
        hospital="Apollo, Thiruvananthapuram",
        village="Unknown",
        district="Thiruvananthapuram",
        state="Kerala",
        care_team="Dr. Unknown",
    )
    p_26.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [77, 47, 76, 91, 75]
        )
    ]
    db.add(p_26)


    p_27 = Patient(
        name="Patient 27",
        initials="P27",
        age=42,
        gender="Female",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(4),
        hospital="General Hospital, Madurai",
        village="Unknown",
        district="Madurai",
        state="Tamil Nadu",
        care_team="Dr. Unknown",
    )
    p_27.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [89, 56, 42, 54, 61]
        )
    ]
    db.add(p_27)


    p_28 = Patient(
        name="Patient 28",
        initials="P28",
        age=47,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(35),
        hospital="Civil Hospital, Thane",
        village="Unknown",
        district="Thane",
        state="Maharashtra",
        care_team="Dr. Unknown",
    )
    p_28.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [70, 79, 94, 77, 67]
        )
    ]
    db.add(p_28)


    p_29 = Patient(
        name="Patient 29",
        initials="P29",
        age=52,
        gender="Female",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(14),
        hospital="General Hospital, New Delhi",
        village="Unknown",
        district="New Delhi",
        state="Delhi",
        care_team="Dr. Unknown",
    )
    p_29.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [93, 47, 72, 86, 83]
        )
    ]
    db.add(p_29)


    p_30 = Patient(
        name="Patient 30",
        initials="P30",
        age=36,
        gender="Female",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(56),
        hospital="City Hospital, Salem",
        village="Unknown",
        district="Salem",
        state="Tamil Nadu",
        care_team="Dr. Unknown",
    )
    p_30.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [58, 55, 94, 71, 85]
        )
    ]
    db.add(p_30)


    p_31 = Patient(
        name="Patient 31",
        initials="P31",
        age=31,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(30),
        hospital="General Hospital, Kozhikode",
        village="Unknown",
        district="Kozhikode",
        state="Kerala",
        care_team="Dr. Unknown",
    )
    p_31.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [60, 52, 59, 42, 42]
        )
    ]
    db.add(p_31)


    p_32 = Patient(
        name="Patient 32",
        initials="P32",
        age=20,
        gender="Female",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(11),
        hospital="City Hospital, Mumbai",
        village="Unknown",
        district="Mumbai",
        state="Maharashtra",
        care_team="Dr. Unknown",
    )
    p_32.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [63, 61, 43, 57, 77]
        )
    ]
    db.add(p_32)


    p_33 = Patient(
        name="Patient 33",
        initials="P33",
        age=74,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(31),
        hospital="City Hospital, Mumbai",
        village="Unknown",
        district="Mumbai",
        state="Maharashtra",
        care_team="Dr. Unknown",
    )
    p_33.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [58, 42, 49, 79, 92]
        )
    ]
    db.add(p_33)


    p_34 = Patient(
        name="Patient 34",
        initials="P34",
        age=37,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(26),
        hospital="Civil Hospital, Agra",
        village="Unknown",
        district="Agra",
        state="Uttar Pradesh",
        care_team="Dr. Unknown",
    )
    p_34.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [90, 94, 61, 56, 84]
        )
    ]
    db.add(p_34)


    p_35 = Patient(
        name="Patient 35",
        initials="P35",
        age=56,
        gender="Female",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(15),
        hospital="Civil Hospital, South Delhi",
        village="Unknown",
        district="South Delhi",
        state="Delhi",
        care_team="Dr. Unknown",
    )
    p_35.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [79, 69, 92, 78, 77]
        )
    ]
    db.add(p_35)


    p_36 = Patient(
        name="Patient 36",
        initials="P36",
        age=38,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(37),
        hospital="AIIMS, Varanasi",
        village="Unknown",
        district="Varanasi",
        state="Uttar Pradesh",
        care_team="Dr. Unknown",
    )
    p_36.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [62, 90, 52, 61, 68]
        )
    ]
    db.add(p_36)


    p_37 = Patient(
        name="Patient 37",
        initials="P37",
        age=56,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(6),
        hospital="AIIMS, Varanasi",
        village="Unknown",
        district="Varanasi",
        state="Uttar Pradesh",
        care_team="Dr. Unknown",
    )
    p_37.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [48, 75, 58, 72, 44]
        )
    ]
    db.add(p_37)


    p_38 = Patient(
        name="Patient 38",
        initials="P38",
        age=24,
        gender="Female",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(50),
        hospital="Fortis, Ernakulam",
        village="Unknown",
        district="Ernakulam",
        state="Kerala",
        care_team="Dr. Unknown",
    )
    p_38.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [76, 90, 68, 55, 52]
        )
    ]
    db.add(p_38)


    p_39 = Patient(
        name="Patient 39",
        initials="P39",
        age=66,
        gender="Female",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(37),
        hospital="City Hospital, Agra",
        village="Unknown",
        district="Agra",
        state="Uttar Pradesh",
        care_team="Dr. Unknown",
    )
    p_39.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [70, 82, 79, 74, 77]
        )
    ]
    db.add(p_39)


    p_40 = Patient(
        name="Patient 40",
        initials="P40",
        age=62,
        gender="Female",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(11),
        hospital="Fortis, Madurai",
        village="Unknown",
        district="Madurai",
        state="Tamil Nadu",
        care_team="Dr. Unknown",
    )
    p_40.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [93, 69, 64, 51, 88]
        )
    ]
    db.add(p_40)


    p_41 = Patient(
        name="Patient 41",
        initials="P41",
        age=65,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(27),
        hospital="Apollo, Pune",
        village="Unknown",
        district="Pune",
        state="Maharashtra",
        care_team="Dr. Unknown",
    )
    p_41.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [74, 45, 64, 72, 85]
        )
    ]
    db.add(p_41)


    p_42 = Patient(
        name="Patient 42",
        initials="P42",
        age=55,
        gender="Female",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(45),
        hospital="General Hospital, Mangaluru",
        village="Unknown",
        district="Mangaluru",
        state="Karnataka",
        care_team="Dr. Unknown",
    )
    p_42.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [85, 41, 94, 41, 45]
        )
    ]
    db.add(p_42)


    p_43 = Patient(
        name="Patient 43",
        initials="P43",
        age=43,
        gender="Female",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(7),
        hospital="Apollo, Ernakulam",
        village="Unknown",
        district="Ernakulam",
        state="Kerala",
        care_team="Dr. Unknown",
    )
    p_43.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [88, 75, 43, 47, 45]
        )
    ]
    db.add(p_43)


    p_44 = Patient(
        name="Patient 44",
        initials="P44",
        age=74,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(13),
        hospital="General Hospital, Lucknow",
        village="Unknown",
        district="Lucknow",
        state="Uttar Pradesh",
        care_team="Dr. Unknown",
    )
    p_44.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [51, 53, 68, 42, 63]
        )
    ]
    db.add(p_44)


    p_45 = Patient(
        name="Patient 45",
        initials="P45",
        age=47,
        gender="Female",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(11),
        hospital="City Hospital, Bengaluru Urban",
        village="Unknown",
        district="Bengaluru Urban",
        state="Karnataka",
        care_team="Dr. Unknown",
    )
    p_45.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [64, 44, 50, 83, 71]
        )
    ]
    db.add(p_45)


    p_46 = Patient(
        name="Patient 46",
        initials="P46",
        age=46,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(35),
        hospital="Fortis, Rajkot",
        village="Unknown",
        district="Rajkot",
        state="Gujarat",
        care_team="Dr. Unknown",
    )
    p_46.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [93, 45, 93, 52, 67]
        )
    ]
    db.add(p_46)


    p_47 = Patient(
        name="Patient 47",
        initials="P47",
        age=52,
        gender="Female",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(43),
        hospital="General Hospital, Kanpur",
        village="Unknown",
        district="Kanpur",
        state="Uttar Pradesh",
        care_team="Dr. Unknown",
    )
    p_47.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [77, 69, 62, 52, 50]
        )
    ]
    db.add(p_47)


    p_48 = Patient(
        name="Patient 48",
        initials="P48",
        age=27,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(45),
        hospital="Apollo, Pune",
        village="Unknown",
        district="Pune",
        state="Maharashtra",
        care_team="Dr. Unknown",
    )
    p_48.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [68, 70, 59, 55, 63]
        )
    ]
    db.add(p_48)


    p_49 = Patient(
        name="Patient 49",
        initials="P49",
        age=46,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(11),
        hospital="General Hospital, Madurai",
        village="Unknown",
        district="Madurai",
        state="Tamil Nadu",
        care_team="Dr. Unknown",
    )
    p_49.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [88, 93, 85, 68, 59]
        )
    ]
    db.add(p_49)


    p_50 = Patient(
        name="Patient 50",
        initials="P50",
        age=54,
        gender="Female",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(19),
        hospital="City Hospital, Jodhpur",
        village="Unknown",
        district="Jodhpur",
        state="Rajasthan",
        care_team="Dr. Unknown",
    )
    p_50.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [66, 51, 71, 95, 81]
        )
    ]
    db.add(p_50)


    p_51 = Patient(
        name="Patient 51",
        initials="P51",
        age=23,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(7),
        hospital="Civil Hospital, Coimbatore",
        village="Unknown",
        district="Coimbatore",
        state="Tamil Nadu",
        care_team="Dr. Unknown",
    )
    p_51.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [87, 73, 84, 67, 69]
        )
    ]
    db.add(p_51)


    p_52 = Patient(
        name="Patient 52",
        initials="P52",
        age=64,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(8),
        hospital="AIIMS, Coimbatore",
        village="Unknown",
        district="Coimbatore",
        state="Tamil Nadu",
        care_team="Dr. Unknown",
    )
    p_52.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [77, 64, 95, 83, 59]
        )
    ]
    db.add(p_52)


    p_53 = Patient(
        name="Patient 53",
        initials="P53",
        age=59,
        gender="Female",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(21),
        hospital="Apollo, Nagpur",
        village="Unknown",
        district="Nagpur",
        state="Maharashtra",
        care_team="Dr. Unknown",
    )
    p_53.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [69, 57, 44, 42, 62]
        )
    ]
    db.add(p_53)


    p_54 = Patient(
        name="Patient 54",
        initials="P54",
        age=79,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(39),
        hospital="General Hospital, Jodhpur",
        village="Unknown",
        district="Jodhpur",
        state="Rajasthan",
        care_team="Dr. Unknown",
    )
    p_54.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [61, 49, 40, 83, 63]
        )
    ]
    db.add(p_54)


    p_55 = Patient(
        name="Patient 55",
        initials="P55",
        age=47,
        gender="Female",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(52),
        hospital="General Hospital, Salem",
        village="Unknown",
        district="Salem",
        state="Tamil Nadu",
        care_team="Dr. Unknown",
    )
    p_55.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [62, 82, 45, 46, 93]
        )
    ]
    db.add(p_55)


    p_56 = Patient(
        name="Patient 56",
        initials="P56",
        age=24,
        gender="Female",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(38),
        hospital="AIIMS, Surat",
        village="Unknown",
        district="Surat",
        state="Gujarat",
        care_team="Dr. Unknown",
    )
    p_56.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [65, 40, 68, 65, 62]
        )
    ]
    db.add(p_56)


    p_57 = Patient(
        name="Patient 57",
        initials="P57",
        age=77,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(19),
        hospital="General Hospital, Rajkot",
        village="Unknown",
        district="Rajkot",
        state="Gujarat",
        care_team="Dr. Unknown",
    )
    p_57.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [61, 87, 74, 64, 49]
        )
    ]
    db.add(p_57)


    p_58 = Patient(
        name="Patient 58",
        initials="P58",
        age=30,
        gender="Female",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(55),
        hospital="Apollo, South Delhi",
        village="Unknown",
        district="South Delhi",
        state="Delhi",
        care_team="Dr. Unknown",
    )
    p_58.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [87, 56, 88, 43, 73]
        )
    ]
    db.add(p_58)


    p_59 = Patient(
        name="Patient 59",
        initials="P59",
        age=56,
        gender="Female",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(31),
        hospital="Apollo, Chennai",
        village="Unknown",
        district="Chennai",
        state="Tamil Nadu",
        care_team="Dr. Unknown",
    )
    p_59.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [67, 93, 42, 51, 66]
        )
    ]
    db.add(p_59)


    p_60 = Patient(
        name="Patient 60",
        initials="P60",
        age=76,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(16),
        hospital="Apollo, Vadodara",
        village="Unknown",
        district="Vadodara",
        state="Gujarat",
        care_team="Dr. Unknown",
    )
    p_60.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [86, 85, 82, 80, 70]
        )
    ]
    db.add(p_60)


    p_61 = Patient(
        name="Patient 61",
        initials="P61",
        age=27,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(3),
        hospital="AIIMS, Chennai",
        village="Unknown",
        district="Chennai",
        state="Tamil Nadu",
        care_team="Dr. Unknown",
    )
    p_61.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [60, 67, 42, 64, 63]
        )
    ]
    db.add(p_61)


    p_62 = Patient(
        name="Patient 62",
        initials="P62",
        age=67,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(27),
        hospital="City Hospital, Vadodara",
        village="Unknown",
        district="Vadodara",
        state="Gujarat",
        care_team="Dr. Unknown",
    )
    p_62.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [80, 54, 70, 86, 65]
        )
    ]
    db.add(p_62)


    p_63 = Patient(
        name="Patient 63",
        initials="P63",
        age=80,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(43),
        hospital="Apollo, Kota",
        village="Unknown",
        district="Kota",
        state="Rajasthan",
        care_team="Dr. Unknown",
    )
    p_63.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [66, 63, 59, 45, 75]
        )
    ]
    db.add(p_63)


    p_64 = Patient(
        name="Patient 64",
        initials="P64",
        age=62,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(22),
        hospital="Apollo, Kozhikode",
        village="Unknown",
        district="Kozhikode",
        state="Kerala",
        care_team="Dr. Unknown",
    )
    p_64.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [89, 78, 54, 71, 79]
        )
    ]
    db.add(p_64)


    p_65 = Patient(
        name="Patient 65",
        initials="P65",
        age=60,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(14),
        hospital="Apollo, Varanasi",
        village="Unknown",
        district="Varanasi",
        state="Uttar Pradesh",
        care_team="Dr. Unknown",
    )
    p_65.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [43, 53, 50, 56, 74]
        )
    ]
    db.add(p_65)


    p_66 = Patient(
        name="Patient 66",
        initials="P66",
        age=48,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(5),
        hospital="Apollo, Mumbai",
        village="Unknown",
        district="Mumbai",
        state="Maharashtra",
        care_team="Dr. Unknown",
    )
    p_66.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [66, 87, 53, 58, 74]
        )
    ]
    db.add(p_66)


    p_67 = Patient(
        name="Patient 67",
        initials="P67",
        age=70,
        gender="Female",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(31),
        hospital="General Hospital, Jodhpur",
        village="Unknown",
        district="Jodhpur",
        state="Rajasthan",
        care_team="Dr. Unknown",
    )
    p_67.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [61, 64, 45, 85, 45]
        )
    ]
    db.add(p_67)


    p_68 = Patient(
        name="Patient 68",
        initials="P68",
        age=74,
        gender="Female",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(25),
        hospital="Apollo, Rajkot",
        village="Unknown",
        district="Rajkot",
        state="Gujarat",
        care_team="Dr. Unknown",
    )
    p_68.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [67, 45, 75, 94, 56]
        )
    ]
    db.add(p_68)


    p_69 = Patient(
        name="Patient 69",
        initials="P69",
        age=23,
        gender="Female",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(53),
        hospital="Apollo, Lucknow",
        village="Unknown",
        district="Lucknow",
        state="Uttar Pradesh",
        care_team="Dr. Unknown",
    )
    p_69.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [69, 74, 41, 62, 80]
        )
    ]
    db.add(p_69)


    p_70 = Patient(
        name="Patient 70",
        initials="P70",
        age=80,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(43),
        hospital="General Hospital, Udaipur",
        village="Unknown",
        district="Udaipur",
        state="Rajasthan",
        care_team="Dr. Unknown",
    )
    p_70.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [50, 65, 68, 60, 86]
        )
    ]
    db.add(p_70)


    p_71 = Patient(
        name="Patient 71",
        initials="P71",
        age=69,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(27),
        hospital="Apollo, Jodhpur",
        village="Unknown",
        district="Jodhpur",
        state="Rajasthan",
        care_team="Dr. Unknown",
    )
    p_71.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [79, 74, 70, 74, 69]
        )
    ]
    db.add(p_71)


    p_72 = Patient(
        name="Patient 72",
        initials="P72",
        age=30,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(36),
        hospital="Civil Hospital, South Delhi",
        village="Unknown",
        district="South Delhi",
        state="Delhi",
        care_team="Dr. Unknown",
    )
    p_72.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [87, 54, 73, 60, 85]
        )
    ]
    db.add(p_72)


    p_73 = Patient(
        name="Patient 73",
        initials="P73",
        age=47,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(8),
        hospital="Fortis, Kanpur",
        village="Unknown",
        district="Kanpur",
        state="Uttar Pradesh",
        care_team="Dr. Unknown",
    )
    p_73.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [79, 70, 82, 44, 48]
        )
    ]
    db.add(p_73)


    p_74 = Patient(
        name="Patient 74",
        initials="P74",
        age=38,
        gender="Female",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(34),
        hospital="AIIMS, Salem",
        village="Unknown",
        district="Salem",
        state="Tamil Nadu",
        care_team="Dr. Unknown",
    )
    p_74.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [62, 87, 92, 54, 61]
        )
    ]
    db.add(p_74)


    p_75 = Patient(
        name="Patient 75",
        initials="P75",
        age=73,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(18),
        hospital="General Hospital, Vadodara",
        village="Unknown",
        district="Vadodara",
        state="Gujarat",
        care_team="Dr. Unknown",
    )
    p_75.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [70, 55, 86, 82, 57]
        )
    ]
    db.add(p_75)


    p_76 = Patient(
        name="Patient 76",
        initials="P76",
        age=22,
        gender="Female",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(38),
        hospital="AIIMS, Coimbatore",
        village="Unknown",
        district="Coimbatore",
        state="Tamil Nadu",
        care_team="Dr. Unknown",
    )
    p_76.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [45, 70, 95, 93, 86]
        )
    ]
    db.add(p_76)


    p_77 = Patient(
        name="Patient 77",
        initials="P77",
        age=62,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(52),
        hospital="City Hospital, Ahmedabad",
        village="Unknown",
        district="Ahmedabad",
        state="Gujarat",
        care_team="Dr. Unknown",
    )
    p_77.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [82, 53, 64, 87, 71]
        )
    ]
    db.add(p_77)


    p_78 = Patient(
        name="Patient 78",
        initials="P78",
        age=64,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(1),
        hospital="General Hospital, Thane",
        village="Unknown",
        district="Thane",
        state="Maharashtra",
        care_team="Dr. Unknown",
    )
    p_78.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [83, 70, 75, 88, 62]
        )
    ]
    db.add(p_78)


    p_79 = Patient(
        name="Patient 79",
        initials="P79",
        age=53,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(10),
        hospital="City Hospital, Kozhikode",
        village="Unknown",
        district="Kozhikode",
        state="Kerala",
        care_team="Dr. Unknown",
    )
    p_79.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [54, 86, 93, 66, 62]
        )
    ]
    db.add(p_79)


    p_80 = Patient(
        name="Patient 80",
        initials="P80",
        age=56,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(38),
        hospital="City Hospital, Udaipur",
        village="Unknown",
        district="Udaipur",
        state="Rajasthan",
        care_team="Dr. Unknown",
    )
    p_80.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [77, 48, 84, 49, 88]
        )
    ]
    db.add(p_80)


    p_81 = Patient(
        name="Patient 81",
        initials="P81",
        age=50,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(31),
        hospital="Civil Hospital, Varanasi",
        village="Unknown",
        district="Varanasi",
        state="Uttar Pradesh",
        care_team="Dr. Unknown",
    )
    p_81.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [93, 60, 77, 82, 72]
        )
    ]
    db.add(p_81)


    p_82 = Patient(
        name="Patient 82",
        initials="P82",
        age=25,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(18),
        hospital="Apollo, Vadodara",
        village="Unknown",
        district="Vadodara",
        state="Gujarat",
        care_team="Dr. Unknown",
    )
    p_82.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [81, 91, 45, 61, 95]
        )
    ]
    db.add(p_82)


    p_83 = Patient(
        name="Patient 83",
        initials="P83",
        age=76,
        gender="Female",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(4),
        hospital="Apollo, Udaipur",
        village="Unknown",
        district="Udaipur",
        state="Rajasthan",
        care_team="Dr. Unknown",
    )
    p_83.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [44, 89, 68, 79, 47]
        )
    ]
    db.add(p_83)


    p_84 = Patient(
        name="Patient 84",
        initials="P84",
        age=36,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(44),
        hospital="Civil Hospital, Nagpur",
        village="Unknown",
        district="Nagpur",
        state="Maharashtra",
        care_team="Dr. Unknown",
    )
    p_84.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [58, 45, 44, 73, 41]
        )
    ]
    db.add(p_84)


    p_85 = Patient(
        name="Patient 85",
        initials="P85",
        age=53,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(59),
        hospital="Apollo, New Delhi",
        village="Unknown",
        district="New Delhi",
        state="Delhi",
        care_team="Dr. Unknown",
    )
    p_85.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [50, 77, 75, 44, 51]
        )
    ]
    db.add(p_85)


    p_86 = Patient(
        name="Patient 86",
        initials="P86",
        age=40,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(33),
        hospital="Apollo, Kanpur",
        village="Unknown",
        district="Kanpur",
        state="Uttar Pradesh",
        care_team="Dr. Unknown",
    )
    p_86.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [65, 63, 55, 61, 63]
        )
    ]
    db.add(p_86)


    p_87 = Patient(
        name="Patient 87",
        initials="P87",
        age=80,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(10),
        hospital="City Hospital, Salem",
        village="Unknown",
        district="Salem",
        state="Tamil Nadu",
        care_team="Dr. Unknown",
    )
    p_87.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [94, 77, 44, 56, 44]
        )
    ]
    db.add(p_87)


    p_88 = Patient(
        name="Patient 88",
        initials="P88",
        age=63,
        gender="Female",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(40),
        hospital="Civil Hospital, New Delhi",
        village="Unknown",
        district="New Delhi",
        state="Delhi",
        care_team="Dr. Unknown",
    )
    p_88.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [74, 87, 52, 67, 90]
        )
    ]
    db.add(p_88)


    p_89 = Patient(
        name="Patient 89",
        initials="P89",
        age=79,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(3),
        hospital="Fortis, Mangaluru",
        village="Unknown",
        district="Mangaluru",
        state="Karnataka",
        care_team="Dr. Unknown",
    )
    p_89.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [67, 68, 85, 69, 80]
        )
    ]
    db.add(p_89)


    p_90 = Patient(
        name="Patient 90",
        initials="P90",
        age=66,
        gender="Female",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(57),
        hospital="General Hospital, Pune",
        village="Unknown",
        district="Pune",
        state="Maharashtra",
        care_team="Dr. Unknown",
    )
    p_90.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [55, 83, 42, 58, 75]
        )
    ]
    db.add(p_90)


    p_91 = Patient(
        name="Patient 91",
        initials="P91",
        age=71,
        gender="Female",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(33),
        hospital="Civil Hospital, Varanasi",
        village="Unknown",
        district="Varanasi",
        state="Uttar Pradesh",
        care_team="Dr. Unknown",
    )
    p_91.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [46, 84, 67, 50, 71]
        )
    ]
    db.add(p_91)


    p_92 = Patient(
        name="Patient 92",
        initials="P92",
        age=36,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(37),
        hospital="General Hospital, Agra",
        village="Unknown",
        district="Agra",
        state="Uttar Pradesh",
        care_team="Dr. Unknown",
    )
    p_92.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [79, 48, 57, 59, 71]
        )
    ]
    db.add(p_92)


    p_93 = Patient(
        name="Patient 93",
        initials="P93",
        age=60,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(42),
        hospital="AIIMS, Rajkot",
        village="Unknown",
        district="Rajkot",
        state="Gujarat",
        care_team="Dr. Unknown",
    )
    p_93.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [42, 87, 64, 66, 91]
        )
    ]
    db.add(p_93)


    p_94 = Patient(
        name="Patient 94",
        initials="P94",
        age=72,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(36),
        hospital="Fortis, Pune",
        village="Unknown",
        district="Pune",
        state="Maharashtra",
        care_team="Dr. Unknown",
    )
    p_94.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [89, 69, 64, 49, 69]
        )
    ]
    db.add(p_94)


    p_95 = Patient(
        name="Patient 95",
        initials="P95",
        age=24,
        gender="Female",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(2),
        hospital="Civil Hospital, Jodhpur",
        village="Unknown",
        district="Jodhpur",
        state="Rajasthan",
        care_team="Dr. Unknown",
    )
    p_95.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [90, 50, 44, 49, 70]
        )
    ]
    db.add(p_95)


    p_96 = Patient(
        name="Patient 96",
        initials="P96",
        age=51,
        gender="Male",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(5),
        hospital="AIIMS, Agra",
        village="Unknown",
        district="Agra",
        state="Uttar Pradesh",
        care_team="Dr. Unknown",
    )
    p_96.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [70, 62, 71, 83, 76]
        )
    ]
    db.add(p_96)


    p_97 = Patient(
        name="Patient 97",
        initials="P97",
        age=56,
        gender="Female",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(27),
        hospital="City Hospital, South Delhi",
        village="Unknown",
        district="South Delhi",
        state="Delhi",
        care_team="Dr. Unknown",
    )
    p_97.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [57, 68, 95, 47, 87]
        )
    ]
    db.add(p_97)


    p_98 = Patient(
        name="Patient 98",
        initials="P98",
        age=52,
        gender="Female",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(39),
        hospital="AIIMS, Rajkot",
        village="Unknown",
        district="Rajkot",
        state="Gujarat",
        care_team="Dr. Unknown",
    )
    p_98.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [53, 94, 61, 66, 56]
        )
    ]
    db.add(p_98)


    p_99 = Patient(
        name="Patient 99",
        initials="P99",
        age=45,
        gender="Female",
        diagnosis="Standard Checkup",
        discharged_on=_days_ago(52),
        hospital="City Hospital, Chennai",
        village="Unknown",
        district="Chennai",
        state="Tamil Nadu",
        care_team="Dr. Unknown",
    )
    p_99.score_history = [
        RecoveryScorePoint(day=f"D{j+1}", score=score)
        for j, score in enumerate(
            [46, 91, 56, 41, 82]
        )
    ]
    db.add(p_99)

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


def build_doctors(db: Session):
    doctors = [
        DoctorProfile(
            name="Dr. Rajesh Patel",
            specialization="Cardiologist",
            hospital="Apollo Hospital Ahmedabad",
            experience_years=15,
            rating=4.9,
            fee=1200,
            languages="English, Hindi, Gujarati",
        ),
        DoctorProfile(
            name="Dr. Priya Shah",
            specialization="General Physician",
            hospital="Sterling Hospital",
            experience_years=10,
            rating=4.7,
            fee=800,
            languages="English, Hindi, Gujarati",
        ),
        DoctorProfile(
            name="Dr. Amit Mehta",
            specialization="Neurologist",
            hospital="Zydus Hospital",
            experience_years=12,
            rating=4.8,
            fee=1500,
            languages="English, Hindi, Gujarati",
        ),
        DoctorProfile(
            name="Dr. Neha Joshi",
            specialization="Endocrinologist",
            hospital="HCG Hospital",
            experience_years=8,
            rating=4.6,
            fee=1000,
            languages="English, Hindi",
        ),
        DoctorProfile(
            name="Dr. Karan Desai",
            specialization="Orthopedic Surgeon",
            hospital="Civil Hospital Ahmedabad",
            experience_years=14,
            rating=4.5,
            fee=600,
            languages="English, Hindi, Gujarati",
        ),
    ]
    db.add_all(doctors)

def seed() -> dict:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        build_doctors(db)
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
