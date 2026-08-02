from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Patient, DoctorProfile
from app.schemas import LoginRequest, RegisterRequest, TokenResponse, UserOut
from app.security import create_access_token, get_current_user, hash_password, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Where each role lands after signing in.
WORKSPACE_BY_ROLE = {
    "patient": "/dashboard",
    "doctor": "/doctor-portal",
    "caregiver": "/caregiver-portal",
    "admin": "/sentinel",
    "gov": "/gov-portal",
}

INVALID = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Incorrect email or password",
)


def _authenticate(db: Session, email: str, password: str) -> User:
    user = db.scalar(select(User).where(User.email == email.lower().strip()))
    if user is None or not verify_password(password, user.password_hash):
        raise INVALID
    return user


def _token_response(user: User) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(user),
        user=UserOut.model_validate(user),
        workspace=WORKSPACE_BY_ROLE.get(user.role, "/dashboard"),
    )


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """JSON login used by the web app."""
    return _token_response(_authenticate(db, payload.email, payload.password))


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> TokenResponse:
    """Create a new account for Doctor, Patient, or Caregiver."""
    clean_email = payload.email.lower().strip()

    # Check if user already exists
    existing = db.scalar(select(User).where(User.email == clean_email))
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists. Please sign in.",
        )

    patient_id = None

    if payload.role == "patient":
        # Create linked Patient record
        words = payload.name.strip().split()
        initials = "".join([w[0].upper() for w in words[:2]]) or "PT"
        patient_rec = Patient(
            name=payload.name.strip(),
            initials=initials,
            age=payload.age or 32,
            gender=payload.gender or "Other",
            diagnosis="Routine Care & Health Monitoring",
            discharged_on=date.today(),
            hospital=payload.hospital or "AURA General Hospital",
            village="Urban",
            district="Central",
            state="State",
            care_team="AURA Care Team",
            chat_credits=10,
            storage_used_mb=0.0,
            ai_symptom_checks_used=0,
            caregivers_count=1,
            family_members_count=0,
        )
        db.add(patient_rec)
        db.flush()
        patient_id = patient_rec.id

    elif payload.role == "doctor":
        # Create linked DoctorProfile record
        doctor_profile = DoctorProfile(
            name=payload.name.strip(),
            specialization=payload.specialization or "General Medicine",
            hospital=payload.hospital or "AURA Medical Center",
            experience_years=8,
            rating=4.9,
            fee=500,
            languages="English, Hindi",
            patients_count=0,
            appointments_month=0,
            ai_prompts_used=0,
        )
        db.add(doctor_profile)

    user = User(
        name=payload.name.strip(),
        email=clean_email,
        password_hash=hash_password(payload.password),
        role=payload.role,
        patient_id=patient_id,
        plan_tier="basic",
        billing_cycle="free",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return _token_response(user)


@router.post("/token", response_model=TokenResponse)
def login_form(
    form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
) -> TokenResponse:
    """Form login, so the Swagger UI 'Authorize' button works."""
    return _token_response(_authenticate(db, form.username, form.password))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> User:
    return user
