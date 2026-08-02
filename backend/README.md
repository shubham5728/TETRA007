# AURA CareLink — Backend

FastAPI service behind the AURA CareLink web app. It stores the patient record,
runs the AURA Sentinel risk models, and raises escalation alerts when a
patient's risk crosses the safe limit.

## Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS / Linux

pip install -r requirements.txt
python -m app.ml.train          # trains and saves the risk models
python -m app.seed              # loads the demo cohort
uvicorn app.main:app --reload
```

The API runs on `http://localhost:8000`. Interactive docs are at
`http://localhost:8000/docs`.

## Demo accounts

All five use the password **`AuraCare2025`**.

| Email | Role | Opens |
| --- | --- | --- |
| `patient@auracarelink.com` | Patient | `/dashboard` |
| `doctor@auracarelink.com` | Doctor | `/doctor-portal` |
| `caregiver@auracarelink.com` | Caregiver | `/caregiver-portal` |
<<<<<<< HEAD
=======
| `admin@auracarelink.com` | Hospital Admin | `/sentinel` |
>>>>>>> dd4f47c3681091a37c2e326454fd9dc16645af09
| `gov@auracarelink.com` | Government Authority | `/settings` |

## How the risk score works

`app/ml/` holds the AURA Sentinel engine.

- **`features.py`** — the 13 inputs the model reads (adherence, missed doses,
  symptom severity, missed follow-ups, vitals, activity, sleep, comorbidities,
  prior admissions, age, days since discharge), and the code that derives them
  from a patient's stored records.
- **`train.py`** — trains two XGBoost classifiers, one for 30-day readmission
  and one for early relapse. **The training data is synthetic.** There is no
  real patient dataset for a hackathon prototype, so a cohort is generated from
  clinically plausible relationships and the model learns those. The pipeline,
  features and explanations are real; the training data is not.
- **`sentinel.py`** — scores a patient and explains the score using exact SHAP
  contributions from the tree model, so every factor shown in the UI is the
  model's own reasoning rather than a hand-written rule.

Held-out performance is exposed at `GET /api/sentinel/model`:

| Metric | Value |
| --- | --- |
| Readmission AUC | 0.79 |
| Relapse AUC | 0.85 |
| Training rows | 8,000 |

The **Recovery Score** is not a prediction — it is a transparent weighted index
(adherence 30%, symptoms 25%, follow-ups 15%, activity 15%, vitals 15%) so a
clinician can see exactly why it moved.

## Smart Escalation Engine

When a re-score returns **High**, `services.py` writes a `critical` alert naming
the risk figure and the top drivers, then surfaces it to the doctor and
caregiver. It fires at most once every 12 hours so a nightly re-run does not
spam the care team.

## Discharge Summary Simplifier

`app/ml/simplifier.py` rewrites prescription shorthand in plain English —
`Tab Metformin 500mg BID` becomes *"Take one tablet of Metformin (500 mg) twice
a day — one after breakfast and one after dinner."* It handles dose forms,
strengths, frequency codes (`BID`, `HS`, `PRN`, `q8h`), Indian `1-0-1` slot
dosing, routes and durations, and expands abbreviations such as `HTN` and `T2DM`
inside ordinary sentences.

A Gemini path exists behind `GEMINI_API_KEY`. **It is untested** — no key was
available during development — and any failure falls back to the rules engine,
which is what actually runs today.

## API

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Sign in, returns a JWT and the role's workspace |
| `GET` | `/api/auth/me` | The signed-in user |
| `GET` | `/api/patient` | Patient profile |
| `GET` `POST` | `/api/patient/vitals` | Vital readings |
| `GET` | `/api/patient/medications` | Medicines with plain-language wording |
| `POST` | `/api/patient/medications/{id}/take` | Mark a dose taken or missed |
| `GET` `POST` | `/api/patient/symptoms` | Symptom log |
| `GET` | `/api/patient/appointments` | Follow-up plan |
| `GET` | `/api/patient/alerts` | Alerts |
| `POST` | `/api/patient/alerts/{id}/ack` | Acknowledge an alert |
| `GET` | `/api/patient/wearables` | Paired devices |
| `GET` | `/api/patient/schemes` | Government schemes |
| `GET` | `/api/recovery-twin` | Composite Recovery Twin payload |
| `GET` | `/api/sentinel` | Latest risk assessment |
| `POST` | `/api/sentinel/run` | Re-score now, escalating if needed |
| `GET` | `/api/sentinel/model` | Model version and held-out metrics |
| `GET` | `/api/doctor/patients` | Roster, highest risk first |
| `GET` `POST` | `/api/chat` | AI Care Coordinator |
| `POST` | `/api/tools/simplify` | Discharge Summary Simplifier |
| `GET` | `/api/health` | Liveness and model state |

Roles tied to one patient (`patient`, `caregiver`) are pinned server-side — a
`patient_id` in the query string is ignored for them. `doctor`, `admin` and
`gov` must name the patient they are viewing.

## Tests

```bash
python -m pytest tests -q          # 53 tests, in-process
python scripts/smoke_test.py       # 64 checks against running servers
```

The smoke test needs both the API and the web app running.

## Storage

SQLite (`backend/aura.db`) keeps the prototype self-contained. Moving to
PostgreSQL means changing `DATABASE_URL` only — SQLAlchemy handles the rest.

## Configuration

Copy `.env.example` to `.env` to override any of it.

| Variable | Default |
| --- | --- |
| `DATABASE_URL` | `sqlite:///backend/aura.db` |
| `JWT_SECRET` | `dev-only-change-me` — **change this outside development** |
| `ACCESS_TOKEN_MINUTES` | `720` |
| `GEMINI_API_KEY` | unset (simplifier uses the rules engine) |
| `CORS_ORIGINS` | `["*"]` — open, so any deployed frontend can call it |

`CORS_ORIGINS` is `["*"]` to keep deployment easy during the hackathon. Because
of that, `allow_credentials` is `False` (browsers reject a wildcard origin
combined with credentials). Auth travels in the `Authorization` header, not a
cookie, so this works — but narrow the origins list before any real use.
