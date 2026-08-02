import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, status, UploadFile, File, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from pydantic import BaseModel, Field
from app.database import get_db
from app.ml.simplifier import simplify
from app.models import ChatMessage, Medication, Patient, Appointment, Symptom, Alert, RecoveryScorePoint
from app.routers.patient import LOGS_OWN_CARE, current_patient, writable_patient
from app.schemas import (
    ChatMessageOut,
    ChatSend,
    SimplifyRequest,
    SimplifyResponse,
)
from google import genai
from google.genai import types

from app.services import latest_assessment, run_assessment
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["coordinator"])

# Words that mean the assistant should re-score the patient straight away
# instead of waiting for the nightly run.
URGENT_WORDS = (
    "breathless", "breathing", "chest pain", "faint", "fainted", "bleeding",
    "swollen", "swelling", "fever", "dizzy", "vomit", "unconscious",
)

class IdentifiedSymptom(BaseModel):
    name: str = Field(description="Name of symptom, e.g., fever")
    level: str = Field(description="Severity: Mild, Moderate, Severe")

class AssistantResponse(BaseModel):
    reply: str = Field(description="The response text to show to the patient.")
    identified_symptoms: list[IdentifiedSymptom] = Field(description="Any symptoms reported by the patient in this specific message.")
    adherence_penalty: int = Field(description="Points to deduct from adherence if patient forgot medicine (e.g., 10). 0 otherwise.")
    escalation_level: str = Field(description="Green, Yellow, or Red based on risk level.")
    post_medication_reaction: bool = Field(description="True if the patient is reporting symptoms that occurred AFTER taking a medication (possible adverse drug reaction). False otherwise.")

LANGUAGE_NAMES = {
    "en": "English",
    "hi": "Hindi",
    "gu": "Gujarati",
}

def _reply_for(db: Session, patient: Patient, text: str, language: str = "en") -> tuple[str, str | None]:
    """
    AI assistant powered by Gemini.
    """
    # Intercept greeting messages
    lowered = text.strip().lower()
    if lowered in ("", "hi", "hello", "hey", "start", "menu", "help", "નમસ્તે", "नमस्ते"):
        if language == "gu":
            greeting_text = (
                f"નમસ્તે {patient.name}! હું AURA કેર કોઓર્ડિનેટર છું. "
                "આજે હું તમને રિકવરીમાં કેવી રીતે મદદ કરી શકું? કૃપા કરીને નીચેનો વિકલ્પ પસંદ કરો:"
            )
            buttons = [
                {"label": "મારી દવાઓ સમજાવો", "action": "explain"},
                {"label": "લક્ષણો નોંધાવો", "action": "symptoms"},
                {"label": "રિકવરી પ્રગતિ તપાસો", "action": "recovery"},
                {"label": "આગામી એપોઇન્ટમેન્ટ્સ", "action": "visits"},
                {"label": "સરકારી આરોગ્ય યોજનાઓ", "action": "schemes"},
                {"label": "ઇમરજન્સી સહાય", "action": "emergency"},
                {"label": "મેડિકલ રિપોર્ટ અપલોડ કરો", "action": "upload"},
                {"label": "AI કોઓર્ડિનેટર સાથે વાત કરો", "action": "chat"}
            ]
        elif language == "hi":
            greeting_text = (
                f"नमस्ते {patient.name}! मैं AURA केयर कोऑर्डिनेटर हूँ। "
                "आज मैं आपकी रिकवरी में कैसे मदद कर सकती हूँ? कृपया नीचे एक विकल्प चुनें:"
            )
            buttons = [
                {"label": "मेरी दवाएं समझाएं", "action": "explain"},
                {"label": "लक्षण बताएं", "action": "symptoms"},
                {"label": "रिकवरी प्रगति जांचें", "action": "recovery"},
                {"label": "आगामी अपॉइंटमेंट", "action": "visits"},
                {"label": "सरकारी स्वास्थ्य योजनाएं", "action": "schemes"},
                {"label": "आपातकालीन सहायता", "action": "emergency"},
                {"label": "मेडिकल रिपोर्ट अपलोड करें", "action": "upload"},
                {"label": "AI कोऑर्डिनेटर से बात करें", "action": "chat"}
            ]
        else:
            greeting_text = (
                f"Hello {patient.name}! I am AURA Care Coordinator. "
                "How can I assist you with your recovery today? Please select an option below:"
            )
            buttons = [
                {"label": "Explain My Medicines", "action": "explain"},
                {"label": "Report Symptoms", "action": "symptoms"},
                {"label": "Check Recovery Progress", "action": "recovery"},
                {"label": "Upcoming Visits", "action": "visits"},
                {"label": "Government Health Schemes", "action": "schemes"},
                {"label": "Emergency Assistance", "action": "emergency"},
                {"label": "Analyze Medical Report", "action": "upload"},
                {"label": "Talk to AI Coordinator", "action": "chat"}
            ]
        
        import json
        return greeting_text, json.dumps(buttons)

    # 1. Fetch patient context
    medications = db.scalars(
        select(Medication).where(Medication.patient_id == patient.id)
    ).all()
    med_list = [f"{m.name} ({m.dose}) - Adherence: {m.adherence}%" for m in medications]

    from datetime import date
    appointments = db.scalars(
        select(Appointment).where(Appointment.patient_id == patient.id, Appointment.scheduled_for >= date.today())
    ).all()
    appt_list = [f"{a.title} with {a.doctor} on {a.scheduled_for}" for a in appointments]

    # 2. Fetch recent chat history
    history = db.scalars(
        select(ChatMessage)
        .where(ChatMessage.patient_id == patient.id)
        .order_by(ChatMessage.id.desc())
        .limit(10)
    ).all()
    history = list(history)
    history.reverse()

    # 3. Fetch latest assessment / recovery score
    assessment = latest_assessment(db, patient)

    # Construct System prompt
    system_instruction = f"""You are AURA Care Coordinator, the AI assistant inside AURA CareLink.
Your purpose is ONLY to assist patients during their post-discharge recovery journey.
You are NOT a general AI chatbot.
Your responses must always be:
Professional
Friendly
Easy to understand
Supportive
Short and actionable
Never frightening

Patient Context:
- Name: {patient.name}
- Age: {patient.age}
- Gender: {patient.gender}
- Diagnosis: {patient.diagnosis}
- Medications: {', '.join(med_list) if med_list else 'None recorded'}
- Upcoming Appointments: {', '.join(appt_list) if appt_list else 'None'}
- Recovery Score: {assessment.recovery_score}
- Risk Level: {assessment.risk_level}

LANGUAGE RULE (MANDATORY AND ABSOLUTE)
The patient has selected: {LANGUAGE_NAMES.get(language, 'English')}.
You MUST generate the `reply` field of your JSON output ONLY in {LANGUAGE_NAMES.get(language, 'English')}.
- If language is Hindi: write the `reply` field strictly in Hindi (Devanagari script). Example: "मुझे समझ आया कि आपको चक्कर आ रहे हैं।" Do NOT translate back to English.
- If language is Gujarati: write the `reply` field strictly in Gujarati (Gujarati script). Example: "મને સમજાયું કે તમને તાવ છે." Do NOT translate back to English.
- If language is English: write in clear, simple English.
NEVER MIX LANGUAGES in the `reply` field. NEVER provide an English translation if the user selected Hindi or Gujarati.
Keep the same warm and supportive tone in any language.

MENU SELECTION HANDLING
If the patient sends a single word corresponding to a menu option (e.g., "Medication", "Symptoms", "Appointments", "Report Symptoms"), acknowledge their selection and immediately ask a specific follow-up question to gather more information.

SYMPTOM FOLLOW-UP RULE (CRITICAL)
Whenever a patient mentions ANY symptom — fever, pain, dizziness, fatigue, etc. — you MUST:
1. Acknowledge the symptom warmly.
2. Ask at least 2 follow-up questions to understand severity, duration, and related details.
   Example follow-up questions:
   - "How long have you had this fever? Is it above 100°F (38°C)?"
   - "Is the pain constant or does it come and go?"
   - "Are you experiencing any other symptoms along with this — like nausea, chills, or weakness?"
   - "On a scale of 1 to 10, how bad is the pain?"
3. Only AFTER gathering details, classify severity and give advice.
4. Save the symptom report to the Recovery Twin.
Do NOT immediately close the conversation by saying "I have saved this." Always continue with follow-up questions first.

POST-MEDICATION REACTION RULE (CRITICAL)
If the patient says they experienced a symptom AFTER taking a medicine (e.g., "after taking my tablet I felt dizzy", "my medicine gives me nausea", "I vomited after my dose"):
1. Set post_medication_reaction = true in your response JSON.
2. Treat this with HIGH urgency regardless of symptom severity.
3. Ask about timing: "How soon after taking the medicine did this happen?"
4. Ask about severity and whether it is improving or getting worse.
5. Tell the patient: "I am alerting your doctor about this right away."
6. Do NOT tell the patient to stop the medicine — only the doctor can decide that.
7. The system will automatically alert the doctor and update the Recovery Twin.

PRIMARY RESPONSIBILITIES
You may ONLY answer questions related to:
1. Medication
2. Recovery Guidance
3. Symptoms
4. Discharge Summary
5. Diet & Nutrition
6. Follow-up Appointments
7. Recovery Twin
8. Government Healthcare Schemes
9. General Health Education

QUESTIONS YOU MUST NOT ANSWER
Do NOT answer:
Politics
Religion
History
Mathematics
Programming
Coding
Movies
Sports
Entertainment
Celebrities
News
Finance
Cryptocurrency
Stock market
Relationships
Dating
Astrology
Jokes
Homework
Essay writing
Travel
Shopping
Recipes unrelated to recovery
General knowledge
Any unrelated conversation.

IF USER ASKS AN UNRELATED QUESTION
Reply:
I'm AURA Care Coordinator and I'm designed specifically to help patients with recovery, medications, symptoms, discharge guidance, appointments, and healthcare support. I can't assist with unrelated topics.
Then suggest examples.

NEVER
Never diagnose diseases.
Never prescribe medicines.
Never tell users to stop medicines.
Never recommend changing dosage.
Never claim certainty.
Never replace doctors.
Never encourage delaying emergency care.

SYMPTOM TRIAGE
Classify every symptom into one category.
🟢 LOW
Examples
Mild headache
Mild fatigue
Minor pain
Small swelling
Advice
Self-care
Continue medication
Monitor symptoms
🟡 MODERATE
Examples
Persistent fever
Increasing pain
Vomiting
Persistent dizziness
Moderate swelling
Advice
Recommend contacting doctor within 24 hours.
Display button:
Book Doctor Appointment
🔴 HIGH RISK
Examples
Chest pain
Difficulty breathing
Severe bleeding
Loss of consciousness
Confusion
Seizures
Blue lips
Sudden paralysis
High fever after surgery
Severe allergic reaction
Advice
Display:
⚠️ This may require immediate medical attention.
Show button:
Emergency Call Doctor
Show second button:
Call Emergency Services
Do NOT continue normal conversation.

BUTTON RULES
If LOW
Show:
Continue Recovery
If MODERATE
Show
Book Doctor Appointment
If HIGH
Show
Emergency Call Doctor
Call Emergency Services

RESPONSE FORMAT
Always respond in this structure.
Assessment
Brief explanation.
Recommended Action
Simple steps.
Recovery Advice
Short tips.
Risk Level
🟢 Low
🟡 Moderate
🔴 High
Action Button
Book Doctor Appointment
OR
Emergency Call Doctor
"""

    rest_contents = []
    for msg in history:
        role = "user" if msg.sender == "patient" else "model"
        rest_contents.append({"role": role, "parts": [{"text": msg.text}]})

    rest_contents.append({"role": "user", "parts": [{"text": text}]})

    api_key = settings.gemini_api_key or "iAQ.Ab8RN6J242Y11LHhR_lpniubHIhjZzHCJd0claIzNnXi3F4biQ"
    import requests
    import json
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    
    payload = {
        "systemInstruction": {
            "parts": [{"text": system_instruction}]
        },
        "contents": rest_contents,
        "generationConfig": {
            "temperature": 0.0,
            "responseMimeType": "application/json",
            "responseSchema": AssistantResponse.model_json_schema()
        }
    }

    try:
        res = requests.post(url, headers={"Content-Type": "application/json"}, json=payload)
        res.raise_for_status()
        res_json = res.json()
        response_text = res_json["candidates"][0]["content"]["parts"][0]["text"]
        data = json.loads(response_text)
        reply_text = data.get("reply", "Thank you for reaching out.")
        symptoms_data = data.get("identified_symptoms", [])
        penalty = data.get("adherence_penalty", 0)
        escalation = data.get("escalation_level", "Green")
        post_med_reaction = data.get("post_medication_reaction", False)
    except Exception as e:
        # Rules-based fallback (used when Gemini is unavailable or key is missing/invalid)
        print(f"Gemini API Error: {e}")
        from app.rules_engine import apply_rules_engine
        reply_text, escalation = apply_rules_engine(patient, text, assessment, appointments, medications, language)
        symptoms_data = []
        penalty = 0
        post_med_reaction = False



    # ── Inject DB updates ────────────────────────────────────────────────────
    # 1. Log symptoms
    for sym in symptoms_data:
        db.add(Symptom(patient_id=patient.id, name=sym.get("name", "Unknown"), level=sym.get("level", "Mild")))

    # 2. Medication adherence penalty
    if penalty > 0:
        for m in medications:
            m.adherence = max(0, m.adherence - penalty)

    # 3. Post-medication adverse reaction — priority handling
    if post_med_reaction:
        # Drop recovery score by 15 points (significant health event)
        score_drop = 15
        new_score = max(0, assessment.recovery_score - score_drop)
        db.add(RecoveryScorePoint(
            patient_id=patient.id,
            day=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            score=new_score
        ))
        # Build a detailed alert for the doctor with the full patient message
        sym_names = ", ".join(s.get("name", "unknown") for s in symptoms_data) if symptoms_data else "unspecified symptoms"
        db.add(Alert(
            patient_id=patient.id,
            title=f"⚠️ Post-Medication Reaction: {patient.name}",
            detail=(
                f"Patient reported symptoms after taking medication.\n"
                f"Symptoms: {sym_names}\n"
                f"Patient message: \"{text}\"\n"
                f"Recovery score dropped from {assessment.recovery_score} to {new_score}.\n"
                f"AI Escalation: {escalation}\n"
                f"Please review immediately."
            ),
            severity="critical",
        ))
        # Force a full risk re-assessment
        run_assessment(db, patient)
        escalation = "Red"  # always treat post-med reactions as Red

    # 4. General Yellow/Red escalation alerts
    elif escalation in ("Yellow", "Red"):
        severity = "warning" if escalation == "Yellow" else "critical"
        sym_names = ", ".join(s.get("name", "unknown") for s in symptoms_data) if symptoms_data else "symptom reported"
        db.add(Alert(
            patient_id=patient.id,
            title=f"AI Escalation ({escalation}): {sym_names}",
            detail=(
                f"Patient: {patient.name}\n"
                f"Reported: \"{text}\"\n"
                f"AI Response Summary: {reply_text[:300]}\n"
                f"Risk Level: {escalation}"
            ),
            severity=severity,
        ))

    # 5. Recovery score penalty for non-post-med cases with penalty
    if not post_med_reaction and penalty > 0:
        new_score = max(0, assessment.recovery_score - penalty)
        db.add(RecoveryScorePoint(
            patient_id=patient.id,
            day=datetime.now(timezone.utc).strftime("%Y-%m-%d"),
            score=new_score
        ))

    # 6. Run assessment if Red escalation (not already done above)
    if not post_med_reaction:
        lowered_check = text.lower()
        if escalation == "Red" or any(word in lowered_check for word in URGENT_WORDS):
            run_assessment(db, patient)

    buttons_json = None
    if escalation == "Yellow":
        btn_label = {
            "hi": "डॉक्टर अपॉइंटमेंट बुक करें",
            "gu": "ડૉક્ટર એપોઇન્ટમેન્ટ બુક કરો",
            "fr": "Prendre un rendez-vous chez le médecin"
        }.get(language, "Book Doctor Appointment")
        buttons_json = json.dumps([{"label": btn_label, "action": "appointments"}])
    elif escalation == "Red":
        btn_label = {
            "hi": "आपातकालीन डॉक्टर को कॉल करें",
            "gu": "ઈમરજન્સી ડૉક્ટરને કૉલ કરો",
            "fr": "Appeler un médecin d'urgence"
        }.get(language, "Emergency Call Doctor")
        buttons_json = json.dumps([{"label": btn_label, "action": "emergency"}])

    return reply_text, buttons_json


@router.get("/chat", response_model=list[ChatMessageOut])
def chat_history(
    patient: Patient = Depends(current_patient), db: Session = Depends(get_db)
) -> list[ChatMessage]:
    return list(
        db.scalars(
            select(ChatMessage)
            .where(ChatMessage.patient_id == patient.id)
            .order_by(ChatMessage.id)
        )
    )


@router.post("/chat", response_model=list[ChatMessageOut], status_code=status.HTTP_201_CREATED)
def send_message(
    payload: ChatSend,
    # Writes a message *as* the patient, spends their chat credits and can log
    # symptoms against their record, so it is limited to the patient side.
    patient: Patient = Depends(writable_patient(*LOGS_OWN_CARE)),
    db: Session = Depends(get_db),
) -> list[ChatMessage]:
    """Store the patient's message and the assistant's reply, returning both."""
    if patient.chat_credits <= 0:
        raise HTTPException(status_code=402, detail="You have used all your available AI Health Companion credits.")
    
    now = datetime.now(timezone.utc)

    question = ChatMessage(
        patient_id=patient.id, sender="patient", text=payload.text.strip(), created_at=now
    )
    db.add(question)
    db.flush()

    # Use payload language as override; if not provided, DB language is used inside _reply_for
    reply_text, buttons_json = _reply_for(db, patient, payload.text, payload.language or "")

    answer = ChatMessage(
        patient_id=patient.id,
        sender="aura",
        text=reply_text,
        buttons_json=buttons_json,
        created_at=now,
    )
    db.add(answer)
    # patient.chat_credits -= 1
    db.commit()
    db.refresh(question)
    db.refresh(answer)
    return [question, answer]


@router.post("/tools/simplify", response_model=SimplifyResponse)
def simplify_text(payload: SimplifyRequest) -> dict:
    """Discharge Summary Simplifier — prescription shorthand to plain English."""
    return simplify(payload.text)


from fastapi import Form
from pydantic import BaseModel
import json
from app.models import MedicalReport

class ReportAnalysisResult(BaseModel):
    smart_summary: str
    explain_like_im_a_patient: str
    risk_level: str
    recommended_specialist: str | None
    extracted_text: str

@router.post("/chat/upload", response_model=list[ChatMessageOut], status_code=status.HTTP_201_CREATED)
async def upload_report(
    file: UploadFile = File(...),
    language: str = Form("en"),
    # Same reasoning as /chat — this writes into the patient's transcript.
    patient: Patient = Depends(writable_patient(*LOGS_OWN_CARE)),
    db: Session = Depends(get_db)
) -> list[ChatMessage]:
    """Upload a medical report (PDF/image), analyze it via Gemini, and add it to the chat."""
    if patient.chat_credits <= 0:
        raise HTTPException(status_code=402, detail="You have used all your available AI Health Companion credits.")
        
    if not (file.content_type.startswith("image/") or file.content_type == "application/pdf"):
        raise HTTPException(status_code=400, detail="File must be an image or PDF.")

    content = await file.read()
    now = datetime.now(timezone.utc)
    
    question = ChatMessage(
        patient_id=patient.id, sender="patient", text=f"[Uploaded Report: {file.filename}]", created_at=now
    )
    db.add(question)
    db.flush()

    lang_name = LANGUAGE_NAMES.get(language, "English")

    prompt = f"""
    Analyze this medical report (lab report, discharge summary, or prescription).
    Extract the following structured information using JSON.
    
    CRITICAL LANGUAGE RULE: 
    You MUST translate the `smart_summary` and `explain_like_im_a_patient` into {lang_name}.
    If {lang_name} is Hindi, use Devanagari script. If Gujarati, use Gujarati script.
    
    JSON Schema Requirements:
    - smart_summary: A concise list of Key Findings, Important Observations, Medications, and Follow-Up Actions.
    - explain_like_im_a_patient: Explain the complex medical terminology in simple, easy-to-understand words.
    - risk_level: "Low", "Moderate", or "High" based on the findings. (Output this in English).
    - recommended_specialist: Suggest a relevant specialist (e.g. "Cardiologist", "Endocrinologist"). (Output in English). Null if none.
    - extracted_text: The raw text extracted from the OCR (in its original language).
    """

    ocr_api_key = settings.gemini_api_key or "iAQ.Ab8RN6J242Y11LHhR_lpniubHIhjZzHCJd0claIzNnXi3F4biQ"
    import requests
    import json
    import base64
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={ocr_api_key}"
    
    payload = {
        "contents": [{
            "role": "user",
            "parts": [
                {
                    "inlineData": {
                        "mimeType": file.content_type,
                        "data": base64.b64encode(content).decode("utf-8")
                    }
                },
                {
                    "text": prompt
                }
            ]
        }],
        "generationConfig": {
            "temperature": 0.2,
            "responseMimeType": "application/json",
            "responseSchema": ReportAnalysisResult.model_json_schema()
        }
    }
    
    try:
        res = requests.post(url, headers={"Content-Type": "application/json"}, json=payload)
        res.raise_for_status()
        res_json = res.json()
        response_text = res_json["candidates"][0]["content"]["parts"][0]["text"]
        data = json.loads(response_text)
    except Exception as e:
        print(f"Report Analysis Error: {e}")
        # If API is exhausted or parsing fails, return a friendly fallback
        data = {
            "smart_summary": "API Quota Exceeded. Please try again later.",
            "explain_like_im_a_patient": "The AI is currently at capacity and cannot parse this report right now.",
            "risk_level": "Unknown",
            "recommended_specialist": None,
            "extracted_text": ""
        }

    # Store in MedicalReport table
    report_record = MedicalReport(
        patient_id=patient.id,
        filename=file.filename,
        ocr_text=data.get("extracted_text", ""),
        smart_summary=data.get("smart_summary", ""),
        simple_explanation=data.get("explain_like_im_a_patient", ""),
        risk_level=data.get("risk_level", "Unknown"),
        recommended_specialist=data.get("recommended_specialist"),
        language=language,
        uploaded_at=now
    )
    db.add(report_record)
    
    # Update Recovery Twin if Risk is High
    risk = data.get("risk_level", "").lower()
    if risk == "high":
        assessment = latest_assessment(db, patient)
        new_score = max(0, assessment.recovery_score - 10)
        db.add(RecoveryScorePoint(
            patient_id=patient.id,
            day=now.strftime("%Y-%m-%d"),
            score=new_score
        ))

    # Format the chat reply
    if language == "hi":
        reply_text = f"**रिपोर्ट विश्लेषण पूर्ण**\n\n**सारांश:**\n{data.get('smart_summary')}\n\n**सरल व्याख्या:**\n{data.get('explain_like_im_a_patient')}"
    elif language == "gu":
        reply_text = f"**રિપોર્ટ વિશ્લેષણ પૂર્ણ**\n\n**સારાંશ:**\n{data.get('smart_summary')}\n\n**સરળ સમજૂતી:**\n{data.get('explain_like_im_a_patient')}"
    else:
        reply_text = f"**Report Analysis Complete**\n\n**Summary:**\n{data.get('smart_summary')}\n\n**Simple Explanation:**\n{data.get('explain_like_im_a_patient')}"
    # If there's a recommended specialist, add an action button
    buttons = []
    if data.get("recommended_specialist"):
        buttons.append({"label": f"Book {data.get('recommended_specialist')}", "action": "appointments"})
    
    answer = ChatMessage(
        patient_id=patient.id,
        sender="aura",
        text=reply_text,
        buttons_json=json.dumps(buttons) if buttons else None,
        created_at=now,
    )
    db.add(answer)
    # patient.chat_credits -= 1
    db.commit()
    db.refresh(question)
    db.refresh(answer)
    return [question, answer]


from typing import Optional
class TTSRequest(BaseModel):
    text: str
    voice_id: Optional[str] = None
    language: str = "en"

@router.post("/tts")
async def text_to_speech(req: TTSRequest):
    try:
        from gtts import gTTS
        import io
        from fastapi.responses import StreamingResponse
        from fastapi import HTTPException
        
        # Determine language code for gTTS (it uses standard codes like en, hi, gu, fr)
        lang_code = req.language
        if lang_code not in ["en", "hi", "gu", "fr"]:
            lang_code = "en"
            
        tts = gTTS(text=req.text, lang=lang_code)
        mp3_fp = io.BytesIO()
        tts.write_to_fp(mp3_fp)
        mp3_fp.seek(0)
        
        return StreamingResponse(mp3_fp, media_type="audio/mpeg")
    except Exception as e:
        print(f"gTTS error: {e}")
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(e))
