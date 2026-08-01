from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.database import get_db
from app.models import SubscriptionRequest, Patient
from app.routers.patient import current_patient

router = APIRouter(prefix="/api/subscriptions", tags=["subscriptions"])

class SubscriptionCreate(BaseModel):
    utr_number: str
    transaction_id: str
    plan_name: str = "AURA Basic Plan"
    amount: int = 49
    credits: int = 25

@router.post("/request", status_code=status.HTTP_201_CREATED)
def create_subscription_request(
    payload: SubscriptionCreate,
    patient: Patient = Depends(current_patient),
    db: Session = Depends(get_db)
):
    req = SubscriptionRequest(
        patient_id=patient.id,
        plan_name=payload.plan_name,
        amount=payload.amount,
        credits_purchased=payload.credits,
        utr_number=payload.utr_number,
        transaction_id=payload.transaction_id,
        status="Pending",
        created_at=datetime.now(timezone.utc)
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return {"message": "Subscription request created.", "id": req.id}

@router.get("/history")
def get_subscription_history(
    patient: Patient = Depends(current_patient),
    db: Session = Depends(get_db)
):
    requests = db.scalars(
        select(SubscriptionRequest)
        .where(SubscriptionRequest.patient_id == patient.id)
        .order_by(SubscriptionRequest.created_at.desc())
    ).all()
    
    return [
        {
            "id": r.id,
            "plan_name": r.plan_name,
            "amount": r.amount,
            "credits_purchased": r.credits_purchased,
            "status": r.status,
            "created_at": r.created_at.isoformat(),
        }
        for r in requests
    ]

# Admin endpoints (In a real app, this would be protected by admin roles)
@router.get("/admin/pending")
def get_pending_requests(db: Session = Depends(get_db)):
    requests = db.scalars(
        select(SubscriptionRequest)
        .where(SubscriptionRequest.status == "Pending")
        .order_by(SubscriptionRequest.created_at.desc())
    ).all()
    return [
        {
            "id": r.id,
            "patient_id": r.patient_id,
            "plan_name": r.plan_name,
            "amount": r.amount,
            "credits_purchased": r.credits_purchased,
            "utr_number": r.utr_number,
            "transaction_id": r.transaction_id,
            "created_at": r.created_at.isoformat(),
        }
        for r in requests
    ]

@router.post("/admin/{req_id}/verify")
def verify_request(
    req_id: int,
    action: str, # "approve" or "reject"
    db: Session = Depends(get_db)
):
    req = db.get(SubscriptionRequest, req_id)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    if req.status != "Pending":
        raise HTTPException(status_code=400, detail="Request already processed")

    if action == "approve":
        req.status = "Approved"
        patient = db.get(Patient, req.patient_id)
        if patient:
            patient.chat_credits += req.credits_purchased
    elif action == "reject":
        req.status = "Rejected"
    else:
        raise HTTPException(status_code=400, detail="Invalid action")
    
    db.commit()
    return {"message": f"Request {action}d successfully."}
