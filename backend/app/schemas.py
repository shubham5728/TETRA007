from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# --------------------------------------------------------------------------- auth


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(ORMModel):
    id: int
    email: str
    name: str
    role: str
    patient_id: int | None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
    # Where the frontend should land this role after sign-in.
    workspace: str


# --------------------------------------------------------------------------- patient


class PatientOut(ORMModel):
    id: int
    name: str
    initials: str
    age: int
    gender: str
    diagnosis: str
    discharged_on: date
    hospital: str
    village: str
    care_team: str


class VitalOut(ORMModel):
    id: int
    label: str
    value: str
    unit: str
    status: str
    recorded_at: datetime


class VitalCreate(BaseModel):
    label: str
    value: str
    unit: str
    status: str = "normal"


class MedicationCreate(BaseModel):
    name: str
    dose: str
    schedule: str


class MedicationOut(ORMModel):
    id: int
    name: str
    dose: str
    schedule: str
    plain: str
    adherence: int
    taken_today: bool


class MedicationTake(BaseModel):
    taken: bool


class SymptomOut(ORMModel):
    id: int
    name: str
    level: str
    trend: str
    logged_at: datetime


class SymptomCreate(BaseModel):
    name: str
    level: str = Field(pattern="^(None|Mild|Moderate|Severe)$")
    trend: str = "flat"


class AppointmentOut(ORMModel):
    id: int
    title: str
    doctor: str
    mode: str
    scheduled_for: date
    time_label: str
    status: str
    attended: bool | None


class AlertOut(ORMModel):
    id: int
    title: str
    detail: str
    severity: str
    acknowledged: bool
    created_at: datetime


class WearableOut(ORMModel):
    id: int
    name: str
    model: str
    status: str
    battery: int | None


class ScorePointOut(ORMModel):
    day: str
    score: int


class SchemeOut(ORMModel):
    id: int
    name: str
    benefit: str
    status: str


# --------------------------------------------------------------------------- sentinel


class RiskFactor(BaseModel):
    name: str
    weight: int
    direction: str  # "up" raises risk, "down" lowers it


class SentinelOut(BaseModel):
    patient_id: int
    readmission_risk: int
    relapse_risk: int
    recovery_score: int
    risk_level: str
    confidence: float
    model_version: str
    factors: list[RiskFactor]
    recommendation: str
    last_run: datetime


class RecoveryTwinOut(BaseModel):
    patient: PatientOut
    score: int
    score_change: int
    risk_level: str
    medication_adherence: int
    symptom_load: str
    days_since_discharge: int
    summary: str
    history: list[ScorePointOut]


# --------------------------------------------------------------------------- chat


class ChatButton(BaseModel):
    label: str
    action: str


class ChatMessageOut(ORMModel):
    id: int
    sender: str
    text: str
    translated: str | None
    created_at: datetime

    # Present on assistant messages only.
    assessment: str | None = None
    recommended_action: str | None = None
    recovery_advice: str | None = None
    risk_level: str | None = None
    topic: str | None = None
    buttons: list[ChatButton] = Field(default_factory=list)
    source: str | None = None


class ChatSend(BaseModel):
    text: str = Field(min_length=1, max_length=2000)


class ChatMeta(BaseModel):
    """Everything the chat screen needs besides the transcript."""

    quick_chips: list[str]
    assistant_online: bool
    llm_enabled: bool


# --------------------------------------------------------------------------- tools


class SimplifyRequest(BaseModel):
    text: str = Field(min_length=1, max_length=4000)


class SimplifyResponse(BaseModel):
    original: str
    simplified: str
    source: str  # "rules" or "gemini"
    lines: list[str]


class DoctorPatientOut(BaseModel):
    id: int
    name: str
    age: int
    condition: str
    risk: int
    level: str
    last_check_in: str
