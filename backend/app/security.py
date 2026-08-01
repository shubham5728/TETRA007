import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

_PBKDF2_ROUNDS = 240_000


def hash_password(password: str) -> str:
    """PBKDF2-SHA256. Stdlib only, so there is no bcrypt build step to fail."""
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, _PBKDF2_ROUNDS)
    return f"pbkdf2_sha256${_PBKDF2_ROUNDS}${salt.hex()}${digest.hex()}"


def verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, rounds, salt_hex, digest_hex = encoded.split("$")
    except ValueError:
        return False
    if algorithm != "pbkdf2_sha256":
        return False
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode(), bytes.fromhex(salt_hex), int(rounds)
    )
    return hmac.compare_digest(digest.hex(), digest_hex)


def create_access_token(user: User) -> str:
    expires = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_minutes)
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "role": user.role,
        "patient_id": user.patient_id,
        "exp": expires,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


CREDENTIALS_ERROR = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    try:
        payload = jwt.decode(
            token, settings.jwt_secret, algorithms=[settings.jwt_algorithm]
        )
    except jwt.PyJWTError as exc:
        raise CREDENTIALS_ERROR from exc

    user_id = payload.get("sub")
    if user_id is None:
        raise CREDENTIALS_ERROR

    user = db.get(User, int(user_id))
    if user is None:
        raise CREDENTIALS_ERROR
    return user


def require_roles(*roles: str):
    """Dependency factory that limits an endpoint to the given roles."""

    def guard(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This endpoint is limited to: {', '.join(roles)}",
            )
        return user

    return guard


def resolve_patient_id(user: User, requested: int | None = None) -> int:
    """
    Work out which patient's data the caller may read.

    Patients and caregivers are pinned to their own linked patient. Doctors,
    hospital admins and government users may pass an explicit patient id.
    """
    if user.role in {"patient", "caregiver"}:
        if user.patient_id is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This account is not linked to a patient",
            )
        return user.patient_id

    if requested is not None:
        return requested
    if user.patient_id is not None:
        return user.patient_id

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="patient_id is required for this role",
    )
