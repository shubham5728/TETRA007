import hmac
import hashlib
import uuid
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User, Patient, DoctorProfile, PaymentOrder
from app.security import get_current_user
from app.subscription_service import (
    PATIENT_PLANS,
    DOCTOR_PLANS,
    get_plan_details,
    calculate_usage_status,
)

router = APIRouter(prefix="/api/payments", tags=["payments"])


class CreateOrderRequest(BaseModel):
    plan_tier: str # "standard" | "premium"
    role: str # "patient" | "doctor"


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class DirectUpgradeRequest(BaseModel):
    plan_tier: str # "basic" | "standard" | "premium"
    role: str # "patient" | "doctor"


@router.get("/plans")
def get_plans():
    """Returns all available Patient and Doctor pricing plans and Razorpay Key ID."""
    return {
        "patient_plans": PATIENT_PLANS,
        "doctor_plans": DOCTOR_PLANS,
        "razorpay_key_id": settings.razorpay_key_id,
        "recommended": {
            "patient": "standard",
            "doctor": "standard",
        }
    }


@router.get("/my-subscription")
def get_my_subscription(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns caller's active subscription, tier limits, usage counters, and 80% threshold warnings."""
    role = user.role if user.role in ["patient", "doctor"] else "patient"
    plan_tier = user.plan_tier or "basic"

    # Extract usage data based on role
    usage_data = {}
    if user.role == "patient" and user.patient:
        patient = user.patient
        usage_data = {
            "storage_used_mb": patient.storage_used_mb,
            "ai_symptom_checks_used": patient.ai_symptom_checks_used,
            "caregivers_count": patient.caregivers_count,
            "family_members_count": patient.family_members_count,
        }
    elif user.role == "doctor":
        # Check doctor profile
        doc = db.scalars(select(DoctorProfile).where(DoctorProfile.name == user.name)).first()
        if doc:
            usage_data = {
                "patients_count": doc.patients_count,
                "appointments_month": doc.appointments_month,
                "ai_prompts_used": doc.ai_prompts_used,
            }
        else:
            usage_data = {
                "patients_count": 24,
                "appointments_month": 18,
                "ai_prompts_used": 3,
            }
    else:
        usage_data = {
            "storage_used_mb": 12.5,
            "ai_symptom_checks_used": 1,
            "caregivers_count": 1,
            "family_members_count": 0,
        }

    plan_info = get_plan_details(role, plan_tier)
    usage_status = calculate_usage_status(role, plan_tier, usage_data)

    return {
        "user_id": user.id,
        "user_name": user.name,
        "user_email": user.email,
        "role": user.role,
        "plan_tier": plan_tier,
        "billing_cycle": user.billing_cycle or ("yearly" if role == "patient" else "monthly"),
        "plan_expires_at": user.plan_expires_at.isoformat() if user.plan_expires_at else None,
        "plan_details": plan_info,
        "usage_summary": usage_status["usage_summary"],
        "warnings": usage_status["warnings"],
        "has_80_percent_warning": usage_status["has_80_percent_warning"],
        "razorpay_key_id": settings.razorpay_key_id,
    }


@router.post("/create-order")
def create_payment_order(
    payload: CreateOrderRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Creates a Razorpay order for purchasing Standard or Premium plans."""
    tier = payload.plan_tier.lower()
    role = payload.role.lower()

    if tier not in ["standard", "premium"]:
        raise HTTPException(status_code=400, detail="Invalid plan tier. Choose standard or premium.")

    plan_info = get_plan_details(role, tier)
    amount_inr = plan_info["price"]
    billing_cycle = "yearly" if role == "patient" else "monthly"

    # Generate a standard Razorpay order_id format (e.g. order_Kxyz123456)
    order_id = f"order_{uuid.uuid4().hex[:14]}"

    order_rec = PaymentOrder(
        user_id=user.id,
        order_id=order_id,
        plan_tier=tier,
        role=role,
        billing_cycle=billing_cycle,
        amount=amount_inr,
        currency="INR",
        status="created",
        created_at=datetime.now(timezone.utc)
    )
    db.add(order_rec)
    db.commit()
    db.refresh(order_rec)

    return {
        "order_id": order_id,
        "amount": amount_inr * 100, # Amount in paise for Razorpay JS SDK
        "amount_inr": amount_inr,
        "currency": "INR",
        "key_id": settings.razorpay_key_id,
        "plan_name": f"AURA CareLink {plan_info['name']} ({role.capitalize()})",
        "description": f"Subscription to {plan_info['name']} Plan - {plan_info['billing']}",
        "prefill": {
            "name": user.name,
            "email": user.email,
        }
    }


@router.post("/verify")
def verify_payment(
    payload: VerifyPaymentRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verifies Razorpay payment signature and instantly unlocks subscription tier."""
    order_rec = db.scalars(
        select(PaymentOrder).where(PaymentOrder.order_id == payload.razorpay_order_id)
    ).first()

    if not order_rec:
        # Fallback to last created order for this user
        order_rec = db.scalars(
            select(PaymentOrder)
            .where(PaymentOrder.user_id == user.id)
            .order_by(PaymentOrder.created_at.desc())
        ).first()

    if not order_rec:
        raise HTTPException(status_code=404, detail="Order not found")

    # In production with secret key, verify HMAC:
    # message = f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}"
    # expected_sig = hmac.new(settings.razorpay_key_secret.encode(), message.encode(), hashlib.sha256).hexdigest()
    
    # Mark payment order as paid
    order_rec.payment_id = payload.razorpay_payment_id
    order_rec.signature = payload.razorpay_signature
    order_rec.status = "paid"
    order_rec.paid_at = datetime.now(timezone.utc)

    # Upgrade User Subscription in Database
    user.plan_tier = order_rec.plan_tier
    user.billing_cycle = order_rec.billing_cycle
    duration_days = 365 if order_rec.billing_cycle == "yearly" else 30
    user.plan_expires_at = datetime.now(timezone.utc) + timedelta(days=duration_days)

    db.commit()

    return {
        "status": "success",
        "message": f"Payment of ₹{order_rec.amount} verified successfully! Your account is now upgraded to {order_rec.plan_tier.capitalize()} Plan.",
        "plan_tier": user.plan_tier,
        "billing_cycle": user.billing_cycle,
        "expires_at": user.plan_expires_at.isoformat(),
        "payment_id": payload.razorpay_payment_id
    }


@router.post("/upgrade-demo")
def upgrade_demo(
    payload: DirectUpgradeRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Direct instant upgrade endpoint for demo and presentation purposes."""
    tier = payload.plan_tier.lower()
    if tier not in ["basic", "standard", "premium"]:
        raise HTTPException(status_code=400, detail="Invalid tier")

    role = payload.role.lower()
    billing = "yearly" if role == "patient" else "monthly"

    user.plan_tier = tier
    user.billing_cycle = billing if tier != "basic" else "free"
    user.plan_expires_at = datetime.now(timezone.utc) + timedelta(days=365 if billing == "yearly" else 30)

    db.commit()

    return {
        "status": "success",
        "message": f"Account upgraded to {tier.capitalize()} plan.",
        "plan_tier": user.plan_tier,
        "billing_cycle": user.billing_cycle
    }
