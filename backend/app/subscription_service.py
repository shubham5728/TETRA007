"""
AURA CareLink Subscription Service
Single source of truth for plan specifications, feature matrices, usage counters, and feature gating.
"""

PATIENT_PLANS = {
    "basic": {
        "name": "Basic",
        "price": 0,
        "billing": "Free",
        "limits": {
            "storage_mb": 500,
            "ai_symptom_checks": 5,
            "caregivers": 1,
            "family_members": 0,
            "history_days": 30,
        },
        "features": {
            "personal_profile": True,
            "medical_record_storage": "500 MB",
            "prescription_management": "Basic upload",
            "medication_reminders": "Basic",
            "appointment_tracking": True,
            "health_timeline": "30 days",
            "caregiver_access": "1 caregiver",
            "shared_medication_tracking": False,
            "emergency_profile_sharing": True,
            "ai_symptom_checker": "5/month",
            "lab_report_explanation": False,
            "health_analytics_dashboard": "Basic",
            "family_health_management": False,
            "emergency_sos_alerts": False,
            "ai_health_assistant": False,
            "priority_support": "Email",
        }
    },
    "standard": {
        "name": "Standard",
        "price": 499,
        "billing": "₹499/year",
        "recommended": True,
        "limits": {
            "storage_mb": 5000,
            "ai_symptom_checks": 100,
            "caregivers": 3,
            "family_members": 4,
            "history_days": 365,
        },
        "features": {
            "personal_profile": True,
            "medical_record_storage": "5 GB",
            "prescription_management": "OCR + Search",
            "medication_reminders": "Smart reminders",
            "appointment_tracking": True,
            "health_timeline": "1 year",
            "caregiver_access": "Up to 3 caregivers",
            "shared_medication_tracking": True,
            "emergency_profile_sharing": True,
            "ai_symptom_checker": "100/month",
            "lab_report_explanation": "Basic",
            "health_analytics_dashboard": "Advanced",
            "family_health_management": "Up to 4 members",
            "emergency_sos_alerts": True,
            "ai_health_assistant": "Limited",
            "priority_support": "Chat",
        }
    },
    "premium": {
        "name": "Premium",
        "price": 1499,
        "billing": "₹1,499/year",
        "limits": {
            "storage_mb": 999999,
            "ai_symptom_checks": 999999,
            "caregivers": 999,
            "family_members": 999,
            "history_days": 99999,
        },
        "features": {
            "personal_profile": True,
            "medical_record_storage": "Unlimited",
            "prescription_management": "AI-organized history",
            "medication_reminders": "AI-powered reminders",
            "appointment_tracking": True,
            "health_timeline": "Lifetime",
            "caregiver_access": "Unlimited caregivers",
            "shared_medication_tracking": "Real-time caregiver sync",
            "emergency_profile_sharing": "One-tap emergency access",
            "ai_symptom_checker": "Unlimited",
            "lab_report_explanation": "Advanced AI interpretation",
            "health_analytics_dashboard": "Predictive analytics",
            "family_health_management": "Unlimited family members",
            "emergency_sos_alerts": "Real-time with location alerts",
            "ai_health_assistant": "Unlimited",
            "priority_support": "24/7 Priority",
        }
    }
}

DOCTOR_PLANS = {
    "basic": {
        "name": "Basic",
        "price": 0,
        "billing": "Free",
        "limits": {
            "appointments_per_month": 50,
            "patient_records": 100,
            "ai_prompts_per_month": 10,
        },
        "features": {
            "verified_doctor_profile": True,
            "appointment_management": "50/month",
            "patient_records": "100",
            "digital_prescriptions": "Basic",
            "teleconsultation": "Limited",
            "follow_up_reminders": "Manual",
            "patient_messaging": "Basic",
            "ai_clinical_assistant": "10/month",
            "lab_report_analysis": False,
            "recovery_monitoring_dashboard": "Basic",
            "caregiver_collaboration": False,
            "clinic_analytics": "Basic",
            "hospital_api_integration": False,
            "featured_doctor_listing": False,
            "priority_support": "Community",
        }
    },
    "standard": {
        "name": "Standard",
        "price": 399,
        "billing": "₹399/month",
        "recommended": True,
        "limits": {
            "appointments_per_month": 999999,
            "patient_records": 2000,
            "ai_prompts_per_month": 500,
        },
        "features": {
            "verified_doctor_profile": True,
            "appointment_management": "Unlimited",
            "patient_records": "2,000",
            "digital_prescriptions": "Branded",
            "teleconsultation": "Unlimited",
            "follow_up_reminders": "Automated",
            "patient_messaging": "Secure chat",
            "ai_clinical_assistant": "500/month",
            "lab_report_analysis": "Basic AI",
            "recovery_monitoring_dashboard": "Advanced",
            "caregiver_collaboration": True,
            "clinic_analytics": "Advanced",
            "hospital_api_integration": "Limited",
            "featured_doctor_listing": True,
            "priority_support": "Email + Chat",
        }
    },
    "premium": {
        "name": "Premium",
        "price": 999,
        "billing": "₹999/month",
        "limits": {
            "appointments_per_month": 999999,
            "patient_records": 999999,
            "ai_prompts_per_month": 999999,
        },
        "features": {
            "verified_doctor_profile": True,
            "appointment_management": "Unlimited",
            "patient_records": "Unlimited",
            "digital_prescriptions": "Custom + E-sign",
            "teleconsultation": "HD + Priority",
            "follow_up_reminders": "AI-optimized",
            "patient_messaging": "Chat + file sharing",
            "ai_clinical_assistant": "Unlimited",
            "lab_report_analysis": "Advanced AI",
            "recovery_monitoring_dashboard": "Predictive alerts",
            "caregiver_collaboration": "Advanced",
            "clinic_analytics": "Forecasting",
            "hospital_api_integration": "Full integration",
            "featured_doctor_listing": "Priority featured",
            "priority_support": "Dedicated support",
        }
    }
}


def get_plan_details(role: str, plan_tier: str):
    tier = (plan_tier or "basic").lower()
    if role == "doctor":
        return DOCTOR_PLANS.get(tier, DOCTOR_PLANS["basic"])
    return PATIENT_PLANS.get(tier, PATIENT_PLANS["basic"])


def calculate_usage_status(user_role: str, plan_tier: str, usage_data: dict):
    plan_info = get_plan_details(user_role, plan_tier)
    limits = plan_info["limits"]
    
    warnings = []
    usage_summary = {}

    if user_role == "doctor":
        # Check Appointments
        appt_used = usage_data.get("appointments_month", 0)
        appt_limit = limits.get("appointments_per_month", 50)
        appt_pct = (appt_used / appt_limit) * 100 if appt_limit < 999999 else 0
        usage_summary["appointments"] = {"used": appt_used, "limit": appt_limit, "percentage": round(appt_pct, 1)}
        if appt_pct >= 80 and appt_limit < 999999:
            warnings.append(f"You have used {appt_pct:.0f}% of your monthly appointment limit ({appt_used}/{appt_limit}). Upgrade your plan to unlock unlimited appointments.")

        # Check Patient Records
        records_used = usage_data.get("patients_count", 0)
        records_limit = limits.get("patient_records", 100)
        records_pct = (records_used / records_limit) * 100 if records_limit < 999999 else 0
        usage_summary["patient_records"] = {"used": records_used, "limit": records_limit, "percentage": round(records_pct, 1)}
        if records_pct >= 80 and records_limit < 999999:
            warnings.append(f"You have used {records_pct:.0f}% of your patient record limit ({records_used}/{records_limit}). Upgrade to store more patients.")

        # Check AI Prompts
        prompts_used = usage_data.get("ai_prompts_used", 0)
        prompts_limit = limits.get("ai_prompts_per_month", 10)
        prompts_pct = (prompts_used / prompts_limit) * 100 if prompts_limit < 999999 else 0
        usage_summary["ai_prompts"] = {"used": prompts_used, "limit": prompts_limit, "percentage": round(prompts_pct, 1)}
        if prompts_pct >= 80 and prompts_limit < 999999:
            warnings.append(f"You have reached {prompts_pct:.0f}% of your monthly AI clinical prompts ({prompts_used}/{prompts_limit}). Upgrade for higher capacity.")

    else:
        # Patient Role
        # Storage
        storage_used = usage_data.get("storage_used_mb", 12.5)
        storage_limit = limits.get("storage_mb", 500)
        storage_pct = (storage_used / storage_limit) * 100 if storage_limit < 999999 else 0
        usage_summary["storage"] = {"used_mb": round(storage_used, 1), "limit_mb": storage_limit, "percentage": round(storage_pct, 1)}
        if storage_pct >= 80 and storage_limit < 999999:
            warnings.append(f"You have used {storage_pct:.0f}% of your medical record storage ({storage_used:.1f} MB / {storage_limit} MB). Upgrade to expand storage.")

        # AI Symptom Checks
        ai_used = usage_data.get("ai_symptom_checks_used", 1)
        ai_limit = limits.get("ai_symptom_checks", 5)
        ai_pct = (ai_used / ai_limit) * 100 if ai_limit < 999999 else 0
        usage_summary["ai_symptom_checks"] = {"used": ai_used, "limit": ai_limit, "percentage": round(ai_pct, 1)}
        if ai_pct >= 80 and ai_limit < 999999:
            warnings.append(f"You have used {ai_pct:.0f}% of your monthly AI symptom checks ({ai_used}/{ai_limit}). Upgrade to get more checks.")

        # Caregivers
        cg_used = usage_data.get("caregivers_count", 1)
        cg_limit = limits.get("caregivers", 1)
        cg_pct = (cg_used / cg_limit) * 100 if cg_limit < 999 else 0
        usage_summary["caregivers"] = {"used": cg_used, "limit": cg_limit, "percentage": round(cg_pct, 1)}
        if cg_pct >= 80 and cg_limit < 999:
            warnings.append(f"Caregiver count has reached {cg_pct:.0f}% of your limit ({cg_used}/{cg_limit}). Upgrade to invite more caregivers.")

        # Family Members
        fam_used = usage_data.get("family_members_count", 0)
        fam_limit = limits.get("family_members", 0)
        fam_pct = (fam_used / fam_limit) * 100 if fam_limit > 0 and fam_limit < 999 else (100 if fam_used > 0 else 0)
        usage_summary["family_members"] = {"used": fam_used, "limit": fam_limit, "percentage": round(fam_pct, 1)}

    return {
        "usage_summary": usage_summary,
        "warnings": warnings,
        "has_80_percent_warning": len(warnings) > 0
    }
