from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, Patient
from app.schemas import UserOut
from app.security import require_roles, hash_password
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/api/admin", tags=["admin"])

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str
    role: str
    patient_id: int | None = None

@router.get("/users", response_model=list[UserOut])
def get_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin")),
) -> list[User]:
    return list(db.scalars(select(User).order_by(User.id)))

@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin")),
) -> User:
    if db.scalar(select(User).where(User.email == payload.email)):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if payload.patient_id:
        if not db.get(Patient, payload.patient_id):
            raise HTTPException(status_code=400, detail="Patient not found")

    user = User(
        email=payload.email.lower().strip(),
        name=payload.name,
        password_hash=hash_password(payload.password),
        role=payload.role,
        patient_id=payload.patient_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_roles("admin")),
) -> None:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete an admin")
    db.delete(user)
    db.commit()
