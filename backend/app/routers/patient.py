from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import (
    Alert,
    Appointment,
    Medication,
    Patient,
    Scheme,
    Symptom,
    VitalReading,
    WearableDevice,
)
from app.schemas import (
    AlertOut,
    AppointmentOut,
    MedicationOut,
    MedicationTake,
    PatientOut,
    SchemeOut,
    SymptomCreate,
    SymptomOut,
    VitalCreate,
    VitalOut,
    WearableOut,
)
from app.security import get_current_user, resolve_patient_id
from app.models import User

router = APIRouter(prefix="/api/patient", tags=["patient"])


def current_patient(
    patient_id: int | None = None,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Patient:
    """Resolve which patient the caller is allowed to read, then load them."""
    resolved = resolve_patient_id(user, patient_id)
    patient = db.get(Patient, resolved)
    if patient is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found"
        )
    return patient


def writable_patient(*allowed_roles: str):
    """
    Dependency for endpoints that change a patient's clinical record.

    Reading and writing need different rules. Doctors, hospital admins and
    government users may *read* any patient by passing `patient_id`, but that
    must not also let them write. Vitals and symptoms feed the Sentinel model,
    so an unrestricted write is a way to move someone's clinical risk score.
    Each write endpoint therefore names the roles allowed to use it.
    """

    def dependency(
        patient_id: int | None = None,
        user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> Patient:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"{user.role} accounts cannot change a patient's record. "
                    f"Allowed: {', '.join(sorted(allowed_roles))}"
                ),
            )
        resolved = resolve_patient_id(user, patient_id)
        patient = db.get(Patient, resolved)
        if patient is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Patient not found"
            )
        return patient

    return dependency


# Who may write what. Kept together so the policy is readable in one place.
LOGS_OWN_CARE = ("patient", "caregiver")
CLINICAL_TEAM = ("patient", "caregiver", "doctor")
CAN_RESCORE = ("patient", "caregiver", "doctor", "admin")


@router.get("", response_model=PatientOut)
def profile(patient: Patient = Depends(current_patient)) -> Patient:
    return patient


@router.get("/vitals", response_model=list[VitalOut])
def vitals(
    patient: Patient = Depends(current_patient), db: Session = Depends(get_db)
) -> list[VitalReading]:
    return list(
        db.scalars(
            select(VitalReading)
            .where(VitalReading.patient_id == patient.id)
            .order_by(VitalReading.id)
        )
    )


@router.post("/vitals", response_model=VitalOut, status_code=status.HTTP_201_CREATED)
def add_vital(
    payload: VitalCreate,
    patient: Patient = Depends(writable_patient(*CLINICAL_TEAM)),
    db: Session = Depends(get_db),
) -> VitalReading:
    reading = VitalReading(patient_id=patient.id, **payload.model_dump())
    db.add(reading)
    db.commit()
    db.refresh(reading)
    return reading


@router.get("/medications", response_model=list[MedicationOut])
def medications(
    patient: Patient = Depends(current_patient), db: Session = Depends(get_db)
) -> list[Medication]:
    return list(
        db.scalars(
            select(Medication)
            .where(Medication.patient_id == patient.id)
            .order_by(Medication.id)
        )
    )


@router.post("/medications/{medication_id}/take", response_model=MedicationOut)
def mark_medication(
    medication_id: int,
    # Marking a dose taken is the patient's own action, so the clinical team
    # is deliberately not included here.
    payload: MedicationTake,
    patient: Patient = Depends(current_patient),
    db: Session = Depends(get_db),
) -> Medication:
    """Mark today's dose as taken or missed, and move adherence accordingly."""
    medication = db.get(Medication, medication_id)
    if medication is None or medication.patient_id != patient.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Medication not found"
        )

    medication.taken_today = payload.taken
    # A single dose is worth roughly one day out of a rolling week.
    step = 4 if payload.taken else -6
    medication.adherence = max(0, min(100, medication.adherence + step))
    db.commit()
    db.refresh(medication)
    return medication


@router.get("/symptoms", response_model=list[SymptomOut])
def symptoms(
    patient: Patient = Depends(current_patient), db: Session = Depends(get_db)
) -> list[Symptom]:
    return list(
        db.scalars(
            select(Symptom)
            .where(Symptom.patient_id == patient.id)
            .order_by(Symptom.logged_at.desc())
        )
    )


@router.post("/symptoms", response_model=SymptomOut, status_code=status.HTTP_201_CREATED)
def log_symptom(
    payload: SymptomCreate,
    patient: Patient = Depends(writable_patient(*CLINICAL_TEAM)),
    db: Session = Depends(get_db),
) -> Symptom:
    symptom = Symptom(
        patient_id=patient.id,
        name=payload.name,
        level=payload.level,
        trend=payload.trend,
        logged_at=datetime.now(timezone.utc),
    )
    db.add(symptom)
    db.commit()
    db.refresh(symptom)
    return symptom


@router.get("/appointments", response_model=list[AppointmentOut])
def appointments(
    patient: Patient = Depends(current_patient), db: Session = Depends(get_db)
) -> list[Appointment]:
    return list(
        db.scalars(
            select(Appointment)
            .where(Appointment.patient_id == patient.id)
            .order_by(Appointment.scheduled_for)
        )
    )


@router.get("/alerts", response_model=list[AlertOut])
def alerts(
    patient: Patient = Depends(current_patient), db: Session = Depends(get_db)
) -> list[Alert]:
    return list(
        db.scalars(
            select(Alert)
            .where(Alert.patient_id == patient.id)
            .order_by(Alert.created_at.desc())
        )
    )


@router.post("/alerts/{alert_id}/ack", response_model=AlertOut)
def acknowledge_alert(
    alert_id: int,
    patient: Patient = Depends(current_patient),
    db: Session = Depends(get_db),
) -> Alert:
    alert = db.get(Alert, alert_id)
    if alert is None or alert.patient_id != patient.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found"
        )
    alert.acknowledged = True
    db.commit()
    db.refresh(alert)
    return alert


@router.get("/wearables", response_model=list[WearableOut])
def wearables(
    patient: Patient = Depends(current_patient), db: Session = Depends(get_db)
) -> list[WearableDevice]:
    return list(
        db.scalars(
            select(WearableDevice)
            .where(WearableDevice.patient_id == patient.id)
            .order_by(WearableDevice.id)
        )
    )


@router.get("/schemes", response_model=list[SchemeOut])
def schemes(
    _: Patient = Depends(current_patient), db: Session = Depends(get_db)
) -> list[Scheme]:
    return list(db.scalars(select(Scheme).order_by(Scheme.id)))
