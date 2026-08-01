from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from datetime import datetime, timezone, timedelta
import random

from app.database import get_db
from app.models import Patient, RiskAssessment, User, DigitalHealthCard, VerificationLog

router = APIRouter(prefix="/api/gov", tags=["gov"])


def _verify_gov_role(user: User):
    if user.role != "gov":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized"
        )


@router.get("/dashboard")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_patients = db.query(func.count(Patient.id)).scalar()
    
    # Active recovery cases (discharged within last 30 days)
    thirty_days_ago = datetime.now(timezone.utc).date() - timedelta(days=30)
    active_cases = db.query(func.count(Patient.id)).filter(Patient.discharged_on >= thirty_days_ago).scalar()
    
    # High risk patients based on RiskAssessment
    high_risk_patients = db.query(func.count(RiskAssessment.id)).filter(RiskAssessment.risk_level == "High").scalar()
    
    # Mocking readmission rate and fraud alerts for demo
    readmission_rate = f"{random.randint(8, 18)}%"
    fraud_alerts = random.randint(120, 450)
    
    # PM-JAY Beneficiaries (mocked based on total)
    pmjay_beneficiaries = int(total_patients * 0.75) if total_patients else 0

    return {
        "totalRegistered": total_patients,
        "activeCases": active_cases,
        "highRiskPatients": high_risk_patients,
        "readmissionRate": readmission_rate,
        "pmjayBeneficiaries": pmjay_beneficiaries,
        "fraudAlerts": fraud_alerts,
        "districtHealthScore": random.randint(70, 95)
    }


@router.get("/map-data")
def get_map_data(db: Session = Depends(get_db)):
    # Group patients by state and district
    states_data = {}
    
    patients = db.query(Patient).all()
    for p in patients:
        if not p.state or not p.district:
            continue
            
        if p.state not in states_data:
            states_data[p.state] = {
                "name": p.state,
                "total_patients": 0,
                "risk_level": "Green", 
                "districts": {}
            }
        
        if p.district not in states_data[p.state]["districts"]:
            states_data[p.state]["districts"][p.district] = {
                "name": p.district,
                "total_patients": 0,
                "recovery_rate": random.randint(60, 98),
                "fraud_cases": random.randint(0, 50),
                "pmjay_usage": random.randint(40, 90)
            }
            
        states_data[p.state]["total_patients"] += 1
        states_data[p.state]["districts"][p.district]["total_patients"] += 1

    # Calculate overall risk for state
    for state_name, state_info in states_data.items():
        if state_info["total_patients"] > 20:
            state_info["risk_level"] = "Yellow"
        if state_info["total_patients"] > 50:
            state_info["risk_level"] = "Red"
            
    return {"states": states_data}


@router.get("/schemes")
def get_scheme_analytics(db: Session = Depends(get_db)):
    return {
        "abha": {
            "totalBeneficiaries": 1450000,
            "activeUsers": 980000,
            "pendingVerifications": 12500
        },
        "pmjay": {
            "totalBeneficiaries": 890000,
            "activeUsers": 640000,
            "pendingVerifications": 8400
        },
        "trends": [
            {"month": "Jan", "abha": 100, "pmjay": 80},
            {"month": "Feb", "abha": 120, "pmjay": 90},
            {"month": "Mar", "abha": 140, "pmjay": 110},
            {"month": "Apr", "abha": 160, "pmjay": 125},
            {"month": "May", "abha": 190, "pmjay": 150}
        ]
    }


class AdvisorRequest(BaseModel):
    query: str

@router.post("/advisor")
def get_advisor_insight(req: AdvisorRequest, db: Session = Depends(get_db)):
    # In a real app, this would hit the Gemini API with the query and the context
    # of the data aggregated above.
    
    query = req.query.lower()
    
    if "low abha adoption" in query:
        reply = "Based on the latest data, the districts with the lowest ABHA adoption are **Thane (42%)**, **Kozhikode (45%)**, and **Agra (47%)**. I recommend initiating targeted awareness campaigns via local ASHA workers in these regions."
    elif "readmission" in query:
        reply = "**Bengaluru Rural** and **Ahmedabad** show the highest readmission risks (above 18%), primarily due to missed post-operative follow-ups. Introducing automated IVR calls for patient follow-up compliance could reduce this risk."
    elif "fraud" in query:
        reply = "I've detected a cluster of suspicious PM-JAY claims in **Surat** (14 duplicate identities flagged this week). You may want to dispatch a field verification team to the top 3 offending hospitals."
    else:
        reply = f"I have analyzed the national health index for your query regarding '{req.query}'. Overall, healthcare accessibility is improving, but rural coverage remains a challenge in central districts. Would you like a detailed CSV report?"
        
    return {"reply": reply}
