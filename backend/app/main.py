from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine, SessionLocal
from app.models import Patient
from app.ml import sentinel as engine_ml
from app.routers import auth, coordinator, patient, sentinel, admin
from app.seed import seed


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Tables are created on boot so a fresh clone runs without a migration step.
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        if db.query(Patient).count() == 0:
            seed()
    finally:
        db.close()
        
    yield


app = FastAPI(
    title=settings.app_name,
    version=settings.api_version,
    lifespan=lifespan,
    description=(
        "Backend for AURA CareLink — continuity of care after hospital "
        "discharge. Risk scores come from the AURA Sentinel models; see "
        "/api/sentinel/model for how they were trained."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(patient.router)
app.include_router(sentinel.router)
app.include_router(coordinator.router)
app.include_router(admin.router)


@app.get("/api/health", tags=["meta"])
def health() -> dict:
    """Liveness plus whether the risk model is actually loadable."""
    try:
        engine_ml.load_bundle()
        model_state = "loaded"
    except engine_ml.ModelNotTrained:
        model_state = "not trained — run: python -m app.ml.train"

    from app.care import llm

    return {
        "status": "ok",
        "service": settings.app_name,
        "version": settings.api_version,
        "model": model_state,
        # Which language model will phrase Care Coordinator replies, if any.
        # null means the deterministic rules engine answers on its own.
        "llm_provider": llm.active_provider(),
    }
