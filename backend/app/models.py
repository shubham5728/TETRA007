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
    care_team: Mapped[str] = mapped_column(String(120))

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


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    password_hash: Mapped[str] = mapped_column(String(255))
    # patient | doctor | caregiver | admin | gov
    role: Mapped[str] = mapped_column(String(20), index=True)
    # The patient this account is attached to. Doctors and admins see every
    # patient, so this stays null for them.
    patient_id: Mapped[int | None] = mapped_column(ForeignKey("patients.id"))

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


class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(primary_key=True)
    patient_id: Mapped[int] = mapped_column(ForeignKey("patients.id"), index=True)
    title: Mapped[str] = mapped_column(String(160))
    doctor: Mapped[str] = mapped_column(String(160))
    mode: Mapped[str] = mapped_column(String(40))
    scheduled_for: Mapped[date] = mapped_column(Date)
    time_label: Mapped[str] = mapped_column(String(20))
    status: Mapped[str] = mapped_column(String(20), default="Confirmed")
    attended: Mapped[bool | None] = mapped_column(Boolean, default=None)

    patient: Mapped["Patient"] = relationship(back_populates="appointments")


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
