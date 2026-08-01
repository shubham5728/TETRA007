from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.ml import sentinel as engine
from app.models import Patient, User
from app.routers.patient import current_patient
from app.schemas import DoctorPatientOut, RecoveryTwinOut, SentinelOut
from app.security import require_roles
from app.services import (
    assessment_to_dict,
    build_twin,
    latest_assessment,
    run_assessment,
)

router = APIRouter(prefix="/api", tags=["sentinel"])


@router.get("/recovery-twin", response_model=RecoveryTwinOut)
def recovery_twin(
    patient: Patient = Depends(current_patient), db: Session = Depends(get_db)
) -> dict:
    return build_twin(db, patient)


@router.get("/sentinel", response_model=SentinelOut)
def sentinel_latest(
    patient: Patient = Depends(current_patient), db: Session = Depends(get_db)
) -> dict:
    return assessment_to_dict(latest_assessment(db, patient))


@router.post("/sentinel/run", response_model=SentinelOut)
def sentinel_run(
    patient: Patient = Depends(current_patient), db: Session = Depends(get_db)
) -> dict:
    """Re-score the patient now. Raises an alert if risk crosses the limit."""
    return assessment_to_dict(run_assessment(db, patient))


@router.get("/sentinel/model")
def sentinel_model() -> dict:
    """Training metrics for the loaded model, so the numbers are inspectable."""
    return engine.model_metrics() | {"version": engine.load_bundle()["version"]}


@router.get("/doctor/patients", response_model=list[DoctorPatientOut])
def doctor_patients(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("doctor", "admin", "gov")),
) -> list[dict]:
    """Every monitored patient, highest risk first."""
    patients = list(db.scalars(select(Patient).order_by(Patient.id)))

    rows = []
    for patient in patients:
        assessment = latest_assessment(db, patient)
        rows.append(
            {
                "id": patient.id,
                "name": patient.name,
                "age": patient.age,
                "condition": patient.diagnosis,
                "risk": assessment.readmission_risk,
                "level": assessment.risk_level,
                "last_check_in": assessment.created_at.strftime("%d %b, %H:%M"),
            }
        )

    rows.sort(key=lambda row: row["risk"], reverse=True)
    return rows
