"""Builds the Care Coordinator's answer.

Every reply has the same shape — assessment, recommended action, recovery
advice, risk level, buttons — so the UI can render it consistently and the
language model has a fixed contract to fill in rather than free rein.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field

from app.care import scope, triage

QUICK_CHIPS: tuple[str, ...] = (
    "Medication",
    "Symptoms",
    "Diet",
    "Recovery",
    "Appointments",
    "Reports",
)

BUTTONS: dict[str, list[dict[str, str]]] = {
    triage.LOW: [{"label": "Continue Recovery", "action": "continue"}],
    triage.MODERATE: [
        {"label": "Book Doctor Appointment", "action": "book_appointment"}
    ],
    triage.HIGH: [
        {"label": "Emergency Call Doctor", "action": "call_doctor"},
        {"label": "Call Emergency Services", "action": "call_emergency"},
    ],
}

EMERGENCY_BANNER = "⚠️ This may require immediate medical attention."

SAFETY_LINE = (
    "I can share general guidance, but I cannot diagnose or change your "
    "prescription — only your doctor can do that."
)


@dataclass
class CoordinatorReply:
    assessment: str
    recommended_action: str
    recovery_advice: str | None = None
    risk_level: str | None = None
    buttons: list[dict[str, str]] = field(default_factory=list)
    topic: str = "unclear"
    in_scope: bool = True
    source: str = "rules"

    def as_dict(self) -> dict:
        return asdict(self)

    def as_text(self) -> str:
        """Flat version, kept for the plain chat transcript."""
        parts = [self.assessment, self.recommended_action]
        if self.recovery_advice:
            parts.append(self.recovery_advice)
        return " ".join(part.strip() for part in parts if part)


@dataclass
class PatientContext:
    """Everything the assistant is allowed to personalise with."""

    name: str
    diagnosis: str
    days_since_discharge: int
    recovery_score: int
    risk_level: str
    medications: list  # Medication rows
    appointments: list  # Appointment rows
    schemes: list  # Scheme rows

    @property
    def first_name(self) -> str:
        return self.name.split()[0] if self.name else "there"

    @property
    def pending_medications(self) -> list:
        return [m for m in self.medications if not m.taken_today]

    @property
    def next_appointment(self):
        return self.appointments[0] if self.appointments else None

    def has(self, *terms: str) -> bool:
        lowered = self.diagnosis.lower()
        return any(term in lowered for term in terms)


# ------------------------------------------------------------------- symptoms


def _symptom_reply(result: triage.TriageResult, context: PatientContext) -> CoordinatorReply:
    named = ", ".join(result.symptoms[:3])

    if result.level == triage.HIGH:
        flags = ", ".join(result.red_flags) or named
        return CoordinatorReply(
            assessment=(
                f"{EMERGENCY_BANNER} What you have described ({flags}) can be "
                "a medical emergency."
            ),
            recommended_action=(
                "Please seek medical help right now. Call your doctor or "
                "emergency services immediately, and do not travel alone."
            ),
            recovery_advice=(
                "Stay seated or lying down and keep someone with you until "
                "help arrives."
            ),
            risk_level=triage.HIGH,
            buttons=BUTTONS[triage.HIGH],
            topic="symptom",
        )

    if result.level == triage.MODERATE:
        return CoordinatorReply(
            assessment=(
                f"You have reported {named}. This is not an emergency, but it "
                "does need a doctor to look at it."
            ),
            recommended_action=(
                "Please contact your doctor within the next 24 hours. I have "
                "saved this to your Recovery Twin and informed your care team."
            ),
            recovery_advice=(
                "Keep taking your medicines as prescribed, drink enough water, "
                "and tell me again if anything gets worse."
            ),
            risk_level=triage.MODERATE,
            buttons=BUTTONS[triage.MODERATE],
            topic="symptom",
        )

    return CoordinatorReply(
        assessment=(
            f"You have reported {named}. Mild symptoms like this are common "
            f"on day {context.days_since_discharge} after discharge."
        ),
        recommended_action=(
            "Keep monitoring it and carry on with your normal recovery plan. "
            "I have added it to your Recovery Twin."
        ),
        recovery_advice=(
            "Rest when you need to, drink water regularly, and tell me straight "
            "away if it becomes stronger or does not settle."
        ),
        risk_level=triage.LOW,
        buttons=BUTTONS[triage.LOW],
        topic="symptom",
    )


# --------------------------------------------------------------- other topics


def _medication_reply(context: PatientContext) -> CoordinatorReply:
    if not context.medications:
        return CoordinatorReply(
            assessment="I do not have any medicines saved for you yet.",
            recommended_action="Please ask your care team to add your prescription.",
            topic="medication",
        )

    lines = [f"{m.name} ({m.dose}) — {m.plain}" for m in context.medications[:4]]
    pending = context.pending_medications
    pending_text = (
        f"Still to take today: {', '.join(m.name for m in pending)}."
        if pending
        else "You have marked all of today's doses as taken. Well done."
    )

    return CoordinatorReply(
        assessment="Here is your medicine plan for today. " + " ".join(lines),
        recommended_action=pending_text,
        recovery_advice=(
            "Never double a dose to make up for a missed one, and do not stop "
            "any medicine without asking your doctor first."
        ),
        topic="medication",
    )


def _appointment_reply(context: PatientContext) -> CoordinatorReply:
    appointment = context.next_appointment
    if appointment is None:
        return CoordinatorReply(
            assessment="You do not have a follow-up booked at the moment.",
            recommended_action="I can help you request one with your care team.",
            topic="appointment",
            buttons=BUTTONS[triage.MODERATE],
        )

    return CoordinatorReply(
        assessment=(
            f"Your next visit is {appointment.title} with {appointment.doctor} "
            f"on {appointment.scheduled_for:%d %b %Y} at {appointment.time_label} "
            f"({appointment.mode})."
        ),
        recommended_action=(
            "You will get a reminder two days before and again on the morning "
            "of the visit."
        ),
        recovery_advice=(
            "Carry your discharge summary and your medicine list to the visit. "
            "Missing a follow-up raises your readmission risk."
        ),
        topic="appointment",
    )


def _twin_reply(context: PatientContext) -> CoordinatorReply:
    return CoordinatorReply(
        assessment=(
            f"Your Recovery Score today is {context.recovery_score}% and your "
            f"risk level is {context.risk_level.lower()}. You are on day "
            f"{context.days_since_discharge} after discharge."
        ),
        recommended_action=(
            "The score is rebuilt every day from your medicines, symptoms, "
            "vitals, activity and follow-up visits."
        ),
        recovery_advice=(
            "Taking your doses on time and logging how you feel each day are "
            "the two things that move the score most."
        ),
        topic="twin",
    )


def _diet_reply(context: PatientContext) -> CoordinatorReply:
    advice: list[str] = []
    if context.has("diabet", "sugar"):
        advice.append(
            "Because of your diabetes, keep sweets, sugary drinks and large "
            "portions of rice or potato small, and space your meals evenly."
        )
    if context.has("hypertens", "blood pressure", "htn", "heart", "cardiac", "cabg"):
        advice.append(
            "For your blood pressure, keep salt low — avoid pickles, papad, "
            "packet snacks and added table salt."
        )
    if context.has("kidney", "ckd"):
        advice.append("Ask your doctor how much fluid and protein is right for you.")
    if not advice:
        advice.append(
            "Eat freshly cooked food with plenty of vegetables and enough protein "
            "such as dal, eggs, curd or fish."
        )

    return CoordinatorReply(
        assessment="Food makes a real difference to how quickly you recover.",
        recommended_action=" ".join(advice),
        recovery_advice=(
            "Drink water through the day unless your doctor has limited your "
            "fluids, and avoid alcohol and smoking while you recover."
        ),
        topic="diet",
    )


def _recovery_reply(context: PatientContext) -> CoordinatorReply:
    return CoordinatorReply(
        assessment=(
            f"You are on day {context.days_since_discharge} after leaving "
            f"hospital, and your Recovery Score is {context.recovery_score}%."
        ),
        recommended_action=(
            "Build up activity slowly. Short, gentle walks are usually better "
            "than one long effort."
        ),
        recovery_advice=(
            "Stop and rest if you feel pain, dizziness or breathlessness. "
            "Check with your doctor before lifting heavy things, climbing many "
            "stairs or returning to work."
        ),
        topic="recovery",
    )


def _discharge_reply(context: PatientContext) -> CoordinatorReply:
    return CoordinatorReply(
        assessment=(
            "I can rewrite anything from your discharge summary in simple words."
        ),
        recommended_action=(
            "Paste the line you want explained, or open the Discharge Summary "
            "Simplifier on this page."
        ),
        recovery_advice=(
            f"Your summary lists {len(context.medications)} medicine(s) and "
            f"{len(context.appointments)} follow-up visit(s)."
        ),
        topic="discharge",
    )


def _scheme_reply(context: PatientContext) -> CoordinatorReply:
    if not context.schemes:
        return CoordinatorReply(
            assessment="I do not have scheme information saved for you yet.",
            recommended_action="Your care team can check which schemes you qualify for.",
            topic="scheme",
        )

    lines = [f"{s.name} — {s.benefit} ({s.status})" for s in context.schemes]
    return CoordinatorReply(
        assessment="These government schemes are linked to your record. "
        + " ".join(lines),
        recommended_action=(
            "Carry your ID and hospital papers when you apply or claim."
        ),
        recovery_advice=(
            "You can see the full list any time under Settings → Government "
            "Scheme Navigator."
        ),
        topic="scheme",
    )


GLOSSARY: dict[str, str] = {
    "blood pressure": (
        "Blood pressure is the force of blood pushing against your artery "
        "walls. When it stays high for a long time it strains the heart, "
        "kidneys and brain, which is why it is checked often."
    ),
    "diabetes": (
        "Diabetes means there is too much sugar in your blood because your "
        "body cannot use insulin properly. Keeping sugar steady protects your "
        "eyes, kidneys, nerves and heart."
    ),
    "cholesterol": (
        "Cholesterol is a fat in your blood. Too much of the harmful type can "
        "narrow the arteries, which raises the risk of a heart attack."
    ),
    "infection": (
        "An infection happens when germs enter the body, often through a wound. "
        "Warning signs are increasing pain, redness, warmth, pus or fever."
    ),
}


def _education_reply(message: str, context: PatientContext) -> CoordinatorReply:
    lowered = message.lower()
    for term, explanation in GLOSSARY.items():
        if term in lowered:
            return CoordinatorReply(
                assessment=explanation,
                recommended_action=(
                    "Keep taking your medicines and attend your follow-up so "
                    "this stays under control."
                ),
                recovery_advice=SAFETY_LINE,
                topic="education",
            )

    return CoordinatorReply(
        assessment=(
            "I can explain health terms from your discharge summary in simple "
            "language."
        ),
        recommended_action="Tell me which word or reading you would like explained.",
        recovery_advice=SAFETY_LINE,
        topic="education",
    )


def _out_of_scope(topic: str) -> CoordinatorReply:
    if topic == "blocked":
        examples = " You could ask me: " + " ".join(
            f"“{example}”" for example in scope.REFUSAL_EXAMPLES
        )
        return CoordinatorReply(
            assessment=scope.REFUSAL,
            recommended_action=examples.strip(),
            topic="blocked",
            in_scope=False,
        )

    return CoordinatorReply(
        assessment=scope.CLARIFY,
        recommended_action="Try one of the quick options below to get started.",
        topic="unclear",
        in_scope=False,
    )


# ------------------------------------------------------------------ orchestration

_HANDLERS = {
    "medication": lambda message, context: _medication_reply(context),
    "appointment": lambda message, context: _appointment_reply(context),
    "twin": lambda message, context: _twin_reply(context),
    "diet": lambda message, context: _diet_reply(context),
    "recovery": lambda message, context: _recovery_reply(context),
    "discharge": lambda message, context: _discharge_reply(context),
    "scheme": lambda message, context: _scheme_reply(context),
    "education": _education_reply,
}


def build(message: str, context: PatientContext) -> tuple[CoordinatorReply, triage.TriageResult]:
    """Scope check, then triage, then the matching answer."""
    scope_result = scope.classify(message)
    triage_result = triage.assess(message)

    # A red flag is answered even if the message also mentions something else.
    if triage_result.level == triage.HIGH:
        return _symptom_reply(triage_result, context), triage_result

    if not scope_result.in_scope:
        return _out_of_scope(scope_result.topic), triage.TriageResult()

    if scope_result.topic == "symptom" and triage_result.has_symptoms:
        return _symptom_reply(triage_result, context), triage_result

    handler = _HANDLERS.get(scope_result.topic)
    if handler is None:
        return _out_of_scope("unclear"), triage.TriageResult()

    return handler(message, context), triage_result
