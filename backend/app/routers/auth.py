from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import LoginRequest, TokenResponse, UserOut
from app.security import create_access_token, get_current_user, verify_password

router = APIRouter(prefix="/api/auth", tags=["auth"])

<<<<<<< HEAD
# Where each role lands after signing in. Hospital Admin and Government
# Authority reuse the closest existing screen — those workspaces are not built.
=======
# Where each role lands after signing in. Each destination must also be in the
# role's sidebar (frontend/lib/nav.js), or the user arrives somewhere they
# cannot navigate back to.
>>>>>>> dd4f47c3681091a37c2e326454fd9dc16645af09
WORKSPACE_BY_ROLE = {
    "patient": "/dashboard",
    "doctor": "/doctor-portal",
    "caregiver": "/caregiver-portal",
<<<<<<< HEAD
    "admin": "/sentinel",
=======
    # /admin-portal itself has no page; subscriptions is the built admin screen.
    "admin": "/admin-portal/subscriptions",
>>>>>>> dd4f47c3681091a37c2e326454fd9dc16645af09
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
<<<<<<< HEAD
        
    if user.patient_id is not None:
        from app.models import ChatMessage, Patient
        # Delete old chat history
        db.query(ChatMessage).filter(ChatMessage.patient_id == user.patient_id).delete()
        
        # Reset chat credits
        patient = db.scalar(select(Patient).where(Patient.id == user.patient_id))
        if patient:
            patient.chat_credits = 10
            
        db.commit()
        db.refresh(user)
        
=======
>>>>>>> dd4f47c3681091a37c2e326454fd9dc16645af09
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


@router.post("/token", response_model=TokenResponse)
def login_form(
    form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
) -> TokenResponse:
    """Form login, so the Swagger UI 'Authorize' button works."""
    return _token_response(_authenticate(db, form.username, form.password))


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)) -> User:
    return user
