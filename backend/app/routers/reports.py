from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import MedicalReport, Patient
from app.routers.patient import current_patient

router = APIRouter(prefix="/api/reports", tags=["reports"])

@router.get("")
def get_reports(
    patient: Patient = Depends(current_patient),
    db: Session = Depends(get_db)
):
    reports = db.scalars(
        select(MedicalReport)
        .where(MedicalReport.patient_id == patient.id)
        .order_by(MedicalReport.uploaded_at.desc())
    ).all()
    
    return [
        {
            "id": r.id,
            "filename": r.filename,
            "uploaded_at": r.uploaded_at.isoformat(),
            "ocr_text": r.ocr_text,
            "smart_summary": r.smart_summary,
            "simple_explanation": r.simple_explanation,
            "risk_level": r.risk_level,
            "recommended_specialist": r.recommended_specialist,
            "language": r.language,
        }
        for r in reports
    ]
