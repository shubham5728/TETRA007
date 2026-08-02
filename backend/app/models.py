from datetime import date, datetime, timezone

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Patient(Base):
    __tablename__ = "patients"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    initials: Mapped[str] = mapped_column(String(4))
    age: Mapped[int] = mapped_column(Integer)
    gender: Mapped[str] = mapped_column(String(20))
    diagnosis: Mapped[str] = mapped_column(String(200))
    discharged_on: Mapped[date] = mapped_column(Date)
    hospital: Mapped[str] = mapped_column(String(200))
    village: Mapped[str] = mapped_column(String(200))
    district: Mapped[str | None] = mapped_column(String(120))
    state: Mapped[str | None] = mapped_column(String(120))
    care_team: Mapped[str] = mapped_column(String(120))
    chat_credits: Mapped[int] = mapped_column(Integer, default=999999)
    language: Mapped[str] = mapped_column(String(10), default="en")

    # Subscription Usage Counters
    storage_used_mb: Mapped[float] = mapped_column(Float, default=12.5)
    ai_symptom_checks_used: Mapped[int] = mapped_column(Integer, default=1)
    caregivers_count: Mapped[int] = mapped_column(Integer, default=1)
    family_members_count: Mapped[int] = mapped_column(Integer, default=0)

    users: Mapped[list["User"]] = relationship(back_populates="patient")
    vitals: Mapped[list["VitalReading"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan"
    )
    medications: Mapped[list["Medication"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan"
    )
    symptoms: Mapped[list["Symptom"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan"
    )
    appointments: Mapped[list["Appointment"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan"
    )
    alerts: Mapped[list["Alert"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan"
    )
    assessments: Mapped[list["RiskAssessment"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan"
    )
    messages: Mapped[list["ChatMessage"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan"
    )
    devices: Mapped[list["WearableDevice"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan"
    )
    score_history: Mapped[list["RecoveryScorePoint"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan"
    )
    health_cards: Mapped[list["DigitalHealthCard"]] = relationship(
        back_populates="patient", cascade="all, delete-orphan"
    )


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    password_hash: Mapped[str] = mapped_column(String(255))
    # patient | doctor | hospital_admin | caregiver | rural_health_worker | gov_authority | insurance
    role: Mapped[str] = mapped_column(String(20), index=True)
    # The patient this account is attached to. Doctors and admins see every
    # patient, so this stays null for them.
    patient_id: Mapped[int | None] = mapped_column(ForeignKey("patients.id"))

    # Active Subscription Plan
    plan_tier: Mapped[str] = mapped_column(String(20), default="basic")
    billing_cycle: Mapped[str] = mapped_column(String(20), default="free")
    plan_expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    patient: Mapped["Patient | None"] = relationship(back_populates="users")


class VitalReading(Base):
    __tablename__ = "vital_readings"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), index=True)
    label: Mapped[str] = mapped_column(String(60))
    value: Mapped[str] = mapped_column(String(40))
    unit: Mapped[str] = mapped_column(String(20))
    status: Mapped[str] = mapped_column(String(20), default="normal")
    recorded_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    patient: Mapped["Patient"] = relationship(back_populates="vitals")


class Medication(Base):
    __tablename__ = "medications"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), index=True)
    name: Mapped[str] = mapped_column(String(120))
    dose: Mapped[str] = mapped_column(String(60))
    schedule: Mapped[str] = mapped_column(String(120))
    # Patient-friendly rewrite produced by the simplifier.
    plain: Mapped[str] = mapped_column(Text)
    adherence: Mapped[int] = mapped_column(Integer, default=100)
    taken_today: Mapped[bool] = mapped_column(Boolean, default=False)

    patient: Mapped["Patient"] = relationship(back_populates="medications")


class Symptom(Base):
    __tablename__ = "symptoms"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), index=True)
    name: Mapped[str] = mapped_column(String(80))
    level: Mapped[str] = mapped_column(String(20))  # None | Mild | Moderate | Severe
    trend: Mapped[str] = mapped_column(String(10), default="flat")
    logged_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    patient: Mapped["Patient"] = relationship(back_populates="symptoms")


class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160))
    specialization: Mapped[str] = mapped_column(String(160))
    hospital: Mapped[str] = mapped_column(String(200))
    experience_years: Mapped[int] = mapped_column(Integer)
    rating: Mapped[float] = mapped_column(Float)
    fee: Mapped[int] = mapped_column(Integer)
    languages: Mapped[str] = mapped_column(String(200))

    # Doctor Plan Usage Counters
    patients_count: Mapped[int] = mapped_column(Integer, default=24)
    appointments_month: Mapped[int] = mapped_column(Integer, default=18)
    ai_prompts_used: Mapped[int] = mapped_column(Integer, default=3)


class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), index=True)
    doctor_id: Mapped[int | None] = mapped_column(ForeignKey("doctor_profiles.id"), index=True, nullable=True)
    title: Mapped[str] = mapped_column(String(160))
    doctor: Mapped[str] = mapped_column(String(160))
    mode: Mapped[str] = mapped_column(String(40))
    scheduled_for: Mapped[date] = mapped_column(Date)
    time_label: Mapped[str] = mapped_column(String(20))
    status: Mapped[str] = mapped_column(String(20), default="Confirmed")
    attended: Mapped[bool | None] = mapped_column(Boolean, default=None)
    reason_for_visit: Mapped[str | None] = mapped_column(Text)
    shared_recovery_twin: Mapped[bool] = mapped_column(Boolean, default=False)
    ai_health_summary: Mapped[str | None] = mapped_column(Text)

    patient: Mapped["Patient"] = relationship(back_populates="appointments")
    doctor_profile: Mapped["DoctorProfile"] = relationship()


class MedicalReport(Base):
    __tablename__ = "medical_reports"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), index=True)
    filename: Mapped[str] = mapped_column(String(200))
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    ocr_text: Mapped[str] = mapped_column(Text)
    smart_summary: Mapped[str] = mapped_column(Text)
    simple_explanation: Mapped[str] = mapped_column(Text)
    risk_level: Mapped[str] = mapped_column(String(20), default="Unknown")
    recommended_specialist: Mapped[str | None] = mapped_column(String(100), nullable=True)
    language: Mapped[str] = mapped_column(String(10), default="en")

    patient: Mapped["Patient"] = relationship()


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    detail: Mapped[str] = mapped_column(Text)
    severity: Mapped[str] = mapped_column(String(20))  # info | warning | critical
    acknowledged: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    patient: Mapped["Patient"] = relationship(back_populates="alerts")


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), index=True)
    readmission_risk: Mapped[int] = mapped_column(Integer)
    relapse_risk: Mapped[int] = mapped_column(Integer)
    recovery_score: Mapped[int] = mapped_column(Integer)
    risk_level: Mapped[str] = mapped_column(String(20))
    confidence: Mapped[float] = mapped_column(Float)
    model_version: Mapped[str] = mapped_column(String(60))
    factors_json: Mapped[str] = mapped_column(Text)
    recommendation: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    patient: Mapped["Patient"] = relationship(back_populates="assessments")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), index=True)
    sender: Mapped[str] = mapped_column(String(10))  # patient | aura
    text: Mapped[str] = mapped_column(Text)
    translated: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    # Structured assistant reply. Stored so reopening the chat renders exactly
    # what the patient saw, buttons included.
    assessment: Mapped[str | None] = mapped_column(Text)
    recommended_action: Mapped[str | None] = mapped_column(Text)
    recovery_advice: Mapped[str | None] = mapped_column(Text)
    risk_level: Mapped[str | None] = mapped_column(String(10))  # low|moderate|high
    topic: Mapped[str | None] = mapped_column(String(20))
    buttons_json: Mapped[str | None] = mapped_column(Text)
    source: Mapped[str | None] = mapped_column(String(10))  # rules | openai

    patient: Mapped["Patient"] = relationship(back_populates="messages")


class WearableDevice(Base):
    __tablename__ = "wearable_devices"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), index=True)
    name: Mapped[str] = mapped_column(String(80))
    model: Mapped[str] = mapped_column(String(120))
    status: Mapped[str] = mapped_column(String(30))
    battery: Mapped[int | None] = mapped_column(Integer)

    patient: Mapped["Patient"] = relationship(back_populates="devices")


class RecoveryScorePoint(Base):
    __tablename__ = "recovery_score_points"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), index=True)
    day: Mapped[str] = mapped_column(String(10))
    score: Mapped[int] = mapped_column(Integer)

    patient: Mapped["Patient"] = relationship(back_populates="score_history")


class Scheme(Base):
    __tablename__ = "schemes"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    benefit: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(30))


class DigitalHealthCard(Base):
    __tablename__ = "digital_health_cards"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), index=True)
    card_type: Mapped[str] = mapped_column(String(100))  # ABHA | Ayushman Bharat | PM-JAY | Hospital | Insurance
    card_number: Mapped[str] = mapped_column(String(100))
    verification_status: Mapped[str] = mapped_column(String(50), default="Pending") # Pending | Verified | Rejected
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    image_url: Mapped[str | None] = mapped_column(String(500))

    patient: Mapped["Patient"] = relationship(back_populates="health_cards")
    verification_logs: Mapped[list["VerificationLog"]] = relationship(
        back_populates="card", cascade="all, delete-orphan"
    )


class VerificationLog(Base):
    __tablename__ = "verification_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    card_id: Mapped[int] = mapped_column(ForeignKey("digital_health_cards.id"), index=True)
    status: Mapped[str] = mapped_column(String(50))
    fraud_risk_score: Mapped[int | None] = mapped_column(Integer)
    notes: Mapped[str | None] = mapped_column(Text)
    verified_by_role: Mapped[str | None] = mapped_column(String(50))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    card: Mapped["DigitalHealthCard"] = relationship(back_populates="verification_logs")


class SubscriptionRequest(Base):
    __tablename__ = "subscription_requests"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), index=True)
    plan_name: Mapped[str] = mapped_column(String(100), default="AURA Basic Plan")
    amount: Mapped[int] = mapped_column(Integer, default=49)
    credits_purchased: Mapped[int] = mapped_column(Integer, default=25)
    utr_number: Mapped[str] = mapped_column(String(100))
    transaction_id: Mapped[str] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(String(50), default="Pending") # Pending | Approved | Rejected
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)

    patient: Mapped["Patient"] = relationship()


class PaymentOrder(Base):
    __tablename__ = "payment_orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    order_id: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    payment_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    signature: Mapped[str | None] = mapped_column(String(255), nullable=True)
    plan_tier: Mapped[str] = mapped_column(String(20))
    role: Mapped[str] = mapped_column(String(20))
    billing_cycle: Mapped[str] = mapped_column(String(20))
    amount: Mapped[int] = mapped_column(Integer) # In INR (rupees)
    currency: Mapped[str] = mapped_column(String(10), default="INR")
    status: Mapped[str] = mapped_column(String(30), default="created") # created | paid | failed
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    user: Mapped["User"] = relationship()
