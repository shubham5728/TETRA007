from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Appointment, DoctorProfile, Patient
from app.schemas import AppointmentOut, AppointmentStatusUpdate
from app.security import get_current_user

router = APIRouter(prefix="/api/doctor", tags=["doctor"])

def current_doctor(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> User:
    if user.role != "doctor":
        raise HTTPException(status_code=403, detail="Not a doctor")
    return user


@router.get("/appointments", response_model=list[AppointmentOut])
def get_appointments(
    doctor: User = Depends(current_doctor), db: Session = Depends(get_db)
) -> list[Appointment]:
    # In a real app, you'd match the logged in doctor to their DoctorProfile.
    # For the hackathon, we'll return all appointments or match by some logic.
    # Let's just return all appointments to make the demo easy, or we can fetch a specific profile.
    # To be realistic, we will just fetch appointments that have a doctor_id.
    appts = db.scalars(
        select(Appointment)
        .where(Appointment.doctor_id.isnot(None))
        .order_by(Appointment.scheduled_for, Appointment.time_label)
    ).all()
    return list(appts)


@router.post("/appointments/{appt_id}/status", response_model=AppointmentOut)
def update_appointment_status(
    appt_id: int,
    req: AppointmentStatusUpdate,
    doctor: User = Depends(current_doctor),
    db: Session = Depends(get_db)
) -> Appointment:
    appt = db.scalar(select(Appointment).where(Appointment.id == appt_id))
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    appt.status = req.status
    if req.status == "Rescheduled":
        if req.new_date:
            appt.scheduled_for = req.new_date
        if req.new_time:
            appt.time_label = req.new_time

    db.commit()
    db.refresh(appt)
    return appt


@router.get("/appointments/{appt_id}/recovery-twin")
def get_recovery_twin(
    appt_id: int,
    doctor: User = Depends(current_doctor),
    db: Session = Depends(get_db)
):
    appt = db.scalar(select(Appointment).where(Appointment.id == appt_id))
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    if not appt.shared_recovery_twin:
        raise HTTPException(status_code=400, detail="Patient did not share Recovery Twin")

    patient = appt.patient
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Fetch patient's latest score
    latest_score = 0
    if patient.score_history:
        latest_score = patient.score_history[-1].score
    
    # Calculate adherence
    med_count = len(patient.medications)
    taken = sum(1 for m in patient.medications if m.taken_today)
    adherence = int((taken / med_count * 100)) if med_count > 0 else 100

    return {
        "patient": {
            "name": patient.name,
            "age": patient.age,
            "gender": patient.gender,
            "diagnosis": patient.diagnosis,
        },
        "recovery_score": latest_score,
        "medication_adherence": adherence,
        "ai_health_summary": appt.ai_health_summary,
        "symptoms": [{"name": s.name, "level": s.level} for s in patient.symptoms]
    }
