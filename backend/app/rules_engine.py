def apply_rules_engine(patient, text, assessment, appointments, medications, language):
    t = text.lower().strip()
    escalation = "Green"
    reply_text = None

    urgent_keywords = [
        "chest pain", "can't breathe", "cannot breathe", "not breathing",
        "breathless", "difficulty breathing", "heart attack", "stroke",
        "unconscious", "fainted", "fainting", "bleeding heavily",
        "severe bleeding", "paralysis", "seizure", "blue lips",
        "loss of consciousness", "emergency"
    ]
    
    yellow_urgent_keywords = [
        "high fever", "fever", "temperature", "vomit", "vomiting",
        "faint", "dizzy", "dizziness", "swollen", "swelling",
        "breathless", "severe pain", "unbearable"
    ]

    mild_keywords = [
        "pain", "ache", "headache", "backache", "nausea", "tired",
        "fatigue", "weakness", "weak", "uncomfortable", "not feeling well",
        "feeling bad", "feeling sick", "unwell", "cough", "cold", "sore throat",
        "constipation", "loose motion", "diarrhea", "itching", "rash",
        "wound", "bleeding", "infection"
    ]

    med_keywords = [
        "medicine", "medication", "tablet", "pill", "dose", "drug",
        "capsule", "injection", "missed dose", "forgot", "side effect",
        "reaction", "prescription", "painkiller", "antibiotic"
    ]
    
    appt_keywords = [
        "appointment", "visit", "schedule", "book", "when is", "next visit",
        "follow up", "follow-up", "checkup", "check up", "hospital"
    ]

    recovery_keywords = [
        "recovery", "progress", "score", "how am i", "how are i doing",
        "status", "health status", "getting better", "improve", "risk"
    ]

    diet_keywords = [
        "diet", "food", "eat", "eating", "nutrition", "meal", "what to eat",
        "fruits", "vegetables", "drink", "drinking", "water", "juice",
        "protein", "vitamins", "avoid", "healthy"
    ]

    sleep_keywords = [
        "sleep", "sleeping", "insomnia", "can't sleep", "rest",
        "resting", "tired", "not sleeping", "waking up"
    ]

    exercise_keywords = [
        "exercise", "walk", "walking", "activity", "physical",
        "workout", "move", "movement", "stretching", "yoga", "gym"
    ]

    mental_keywords = [
        "anxious", "anxiety", "stress", "stressed", "depressed", "depression",
        "sad", "low mood", "worried", "scared", "fear", "lonely",
        "mental", "emotional", "panic", "hopeless", "cry", "crying"
    ]

    scheme_keywords = [
        "government", "scheme", "insurance", "ayushman", "pmjay",
        "health card", "bpl", "ration card", "free treatment", "subsidy",
        "financial", "cost", "money", "afford", "cashless"
    ]

    report_keywords = [
        "discharge", "summary", "report", "test", "lab", "blood test",
        "ecg", "x-ray", "scan", "mri", "ultrasound", "result"
    ]

    thanks_keywords = [
        "thank", "thanks", "thank you", "great", "good", "helpful",
        "awesome", "excellent", "appreciate", "well done"
    ]

    if any(w in t for w in urgent_keywords):
        escalation = "Red"
        if language == "hi":
            reply_text = f"⚠️ {patient.name}, यह एक मेडिकल इमरजेंसी (आपात स्थिति) लग रही है।\n\nकृपया तुरंत आपातकालीन सेवाओं (108 / 112) को कॉल करें या किसी आस-पास के व्यक्ति से मदद मांगें।\n\nइंतजार न करें। आपके डॉक्टर को अभी सतर्क किया जा रहा है।\n\nशांत रहें, बैठ जाएं या लेट जाएं, और जब तक मदद न आए तब तक कुछ भी खाएं या पिएं नहीं।"
        elif language == "gu":
            reply_text = f"⚠️ {patient.name}, આ મેડિકલ ઇમરજન્સી જેવું લાગે છે.\n\nકૃપા કરીને તાત્કાલિક ઇમરજન્સી સેવાઓ (108 / 112) ને કૉલ કરો અથવા નજીકની કોઈ વ્યક્તિને મદદ માટે કહો.\n\nરાહ જોશો નહીં. તમારા ડૉક્ટરને અત્યારે એલર્ટ કરવામાં આવી રહ્યા છે.\n\nશાંત રહો, બેસી જાવ અથવા સૂઈ જાવ, અને મદદ ન આવે ત્યાં સુધી કંઈપણ ખાવું કે પીવું નહીં."
        else:
            reply_text = f"⚠️ {patient.name}, this sounds like a MEDICAL EMERGENCY.\n\nPlease call emergency services (108 / 112) IMMEDIATELY or ask someone nearby to help you.\n\nDo NOT wait. Your doctor is being alerted right now.\n\nStay calm, sit or lie down, and do not eat or drink anything until help arrives."

    elif any(w in t for w in yellow_urgent_keywords):
        escalation = "Yellow"
        if language == "hi":
            reply_text = f"मैंने आपके लक्षण नोट कर लिए हैं, {patient.name}।\n\nकृपया अपनी स्थिति की निगरानी करें। मैं सलाह दूंगा कि आप 24 घंटे के भीतर डॉक्टर से संपर्क करें या आज ही अपनी जांच करवाएं।"
        elif language == "gu":
            reply_text = f"મેં તમારા લક્ષણોની નોંધ કરી છે, {patient.name}.\n\nકૃપા કરીને તમારી સ્થિતિ પર નજર રાખો. હું સલાહ આપીશ કે તમે 24 કલાકની અંદર ડૉક્ટરનો સંપર્ક કરો અથવા આજે જ તપાસ કરાવો."
        else:
            reply_text = f"I've noted your symptom, {patient.name}.\n\nCan you describe your symptom in more detail?\n• When did it start?\n• How severe is it on a scale of 1–10?\n• Is it constant or does it come and go?\n\nThis will help me give you better guidance."

    elif any(w in t for w in mild_keywords):
        escalation = "Yellow"
        if language == "hi":
            reply_text = f"मैं समझ सकता हूँ कि आप ठीक महसूस नहीं कर रहे हैं, {patient.name}। मैं आपकी मदद के लिए यहाँ हूँ।\n\nक्या आप मुझे अपने लक्षण के बारे में और बता सकते हैं?"
        elif language == "gu":
            reply_text = f"હું સમજી શકું છું કે તમને સારું નથી લાગતું, {patient.name}. હું અહીં મદદ કરવા માટે છું.\n\nશું તમે મને તમારા લક્ષણ વિશે વધુ જણાવી શકો છો?"
        else:
            reply_text = f"I understand you are not feeling well, {patient.name}. I'm here to help.\n\nCan you tell me more about your symptom?\n• What exactly are you feeling?\n• How long has it been happening?\n• Is it getting better, worse, or staying the same?\n• Does anything make it better or worse?"

    elif any(w in t for w in med_keywords):
        med_names = ", ".join(m.name for m in medications) if medications else "your prescribed medicines"
        if language == "hi":
            reply_text = f"आपकी वर्तमान दवाएं हैं: {med_names}।\n\nकृपया उन्हें अपने डॉक्टर द्वारा बताए अनुसार ही लें। यदि कोई दुष्प्रभाव हो तो अपने डॉक्टर से संपर्क करें।"
        elif language == "gu":
            reply_text = f"તમારી વર્તમાન દવાઓ આ પ્રમાણે છે: {med_names}.\n\nકૃપા કરીને તમારા ડૉક્ટરે સૂચવ્યા મુજબ જ લો. જો કોઈ આડઅસર જણાય તો તમારા ડૉક્ટરનો સંપર્ક કરો."
        else:
            reply_text = f"Your current medications are: {med_names}.\n\nPlease take them as prescribed by your doctor. If you have any concerns about side effects or missed doses, consult your care team."

    elif any(w in t for w in appt_keywords):
        escalation = "Yellow" if not appointments else "Green"
        if appointments:
            appt_strs = ", ".join(f"{a.title} with {a.doctor} on {a.scheduled_for}" for a in appointments)
            if language == "hi":
                reply_text = f"आपके आगामी अपॉइंटमेंट: {appt_strs}।\n\nक्या आप कोई नया अपॉइंटमेंट बुक करना चाहेंगे?"
            elif language == "gu":
                reply_text = f"તમારી આગામી એપોઇન્ટમેન્ટ્સ: {appt_strs}.\n\nશું તમે નવી એપોઇન્ટમેન્ટ બુક કરવા માંગો છો?"
            else:
                reply_text = f"Your upcoming appointments: {appt_strs}.\n\nWould you like to book a new appointment?"
        else:
            if language == "hi":
                reply_text = f"आपका कोई आगामी अपॉइंटमेंट निर्धारित नहीं है, {patient.name}।\n\nक्या आप नया अपॉइंटमेंट बुक करना चाहेंगे? कृपया 'डॉक्टर अपॉइंटमेंट बुक करें' बटन पर क्लिक करें।"
            elif language == "gu":
                reply_text = f"તમારી કોઈ આગામી એપોઇન્ટમેન્ટ નિર્ધારિત નથી, {patient.name}.\n\nશું તમે નવી એપોઇન્ટમેન્ટ બુક કરવા માંગો છો? કૃપા કરીને 'ડૉક્ટર એપોઇન્ટમેન્ટ બુક કરો' બટન પર ક્લિક કરો."
            else:
                reply_text = f"You have no upcoming appointments scheduled, {patient.name}.\n\nWould you like me to help you book an appointment with your doctor?\nClick the 'Book Doctor Appointment' button below."

    elif any(w in t for w in recovery_keywords):
        if language == "hi":
            reply_text = f"आपका रिकवरी स्कोर {assessment.recovery_score}/100 है और जोखिम स्तर {assessment.risk_level} है।\n\nआपकी दवाएं और आहार बहुत महत्वपूर्ण हैं। क्या आप रिकवरी के बारे में कुछ विशेष जानना चाहेंगे?"
        elif language == "gu":
            reply_text = f"તમારો રિકવરી સ્કોર {assessment.recovery_score}/100 છે અને જોખમ સ્તર {assessment.risk_level} છે.\n\nતમારી દવાઓ અને આહાર ખૂબ જ મહત્વપૂર્ણ છે. શું તમે રિકવરી વિશે કંઈક ખાસ જાણવા માંગો છો?"
        else:
            reply_text = f"Your current recovery score is {assessment.recovery_score}/100 with {assessment.risk_level} risk level.\n\nTo improve your score: take all medicines on time, attend all appointments, eat well, and rest adequately.\n\nIs there anything specific about your recovery you'd like to know more about?"

    elif any(w in t for w in diet_keywords):
        if language == "hi":
            reply_text = f"पौष्टिक आहार रिकवरी के लिए बहुत जरूरी है, {patient.name}!\n\nताजे फल, हरी सब्जियां, और पर्याप्त पानी लें। तला हुआ या मसालेदार भोजन खाने से बचें।"
        elif language == "gu":
            reply_text = f"સારું પોષણ રિકવરી માટે ખૂબ જ જરૂરી છે, {patient.name}!\n\nતાજા ફળો, લીલા શાકભાજી અને પૂરતું પાણી લો. તળેલું અથવા મસાલેદાર ભોજન ટાળો."
        else:
            reply_text = f"Good nutrition is a key part of your recovery, {patient.name}!\n\nEat fresh fruits, vegetables, and drink plenty of water. Avoid fried or spicy foods."

    elif any(w in t for w in sleep_keywords):
        if language == "hi":
            reply_text = f"अच्छी नींद आपके स्वास्थ्य के लिए जरूरी है, {patient.name}।\n\nरोज रात को 7-9 घंटे सोने की कोशिश करें। सोने से पहले मोबाइल या टीवी देखने से बचें।"
        elif language == "gu":
            reply_text = f"સારી ઊંઘ તમારા સ્વાસ્થ્ય માટે જરૂરી છે, {patient.name}.\n\nરોજ રાત્રે 7-9 કલાક ઊંઘવાનો પ્રયાસ કરો. સૂતા પહેલા મોબાઈલ કે ટીવી જોવાનું ટાળો."
        else:
            reply_text = f"Quality sleep is essential for healing, {patient.name}.\n\nAim for 7-9 hours of sleep each night. Avoid phone/TV screens at least 1 hour before sleep."

    elif any(w in t for w in exercise_keywords):
        if language == "hi":
            reply_text = f"रिकवरी के दौरान हल्की शारीरिक गतिविधि अच्छी है, {patient.name}।\n\nघर के अंदर 5-10 मिनट टहलें। भारी वजन उठाने या कठिन व्यायाम से बचें जब तक डॉक्टर अनुमति न दें।"
        elif language == "gu":
            reply_text = f"રિકવરી દરમિયાન હળવી શારીરિક પ્રવૃત્તિ સારી છે, {patient.name}.\n\nઘરની અંદર 5-10 મિનિટ ચાલો. ડૉક્ટરની મંજૂરી વિના ભારે વજન ઉઠાવવાનું કે સખત કસરત ટાળો."
        else:
            reply_text = f"Physical activity is important for recovery, {patient.name}.\n\nShort walks inside your home — 5 to 10 minutes, 2–3 times a day are good. Avoid heavy lifting until your doctor clears you."

    elif any(w in t for w in mental_keywords):
        if language == "hi":
            reply_text = f"मैं आपको समझ सकता हूँ, {patient.name}। अस्पताल से छुट्टी के बाद घबराहट या तनाव महसूस होना आम बात है।\n\nगहरी सांस लेने का व्यायाम करें या अपने परिवार से बात करें। यदि यह बना रहता है, तो कृपया अपने डॉक्टर को बताएं।"
        elif language == "gu":
            reply_text = f"હું તમને સમજી શકું છું, {patient.name}. હોસ્પિટલમાંથી રજા મળ્યા પછી ચિંતા કે તણાવ અનુભવવો સામાન્ય છે.\n\nઊંડા શ્વાસ લેવાની કસરત કરો અથવા તમારા પરિવાર સાથે વાત કરો. જો આ ચાલુ રહે તો કૃપા કરીને તમારા ડૉક્ટરને જણાવો."
        else:
            reply_text = f"I hear you, {patient.name}. Feeling anxious or stressed after a hospital stay is very common.\n\nTry deep breathing or talk to a trusted family member. If you are having persistent sadness, please tell your doctor."

    elif any(w in t for w in scheme_keywords):
        if language == "hi":
            reply_text = f"यहाँ कुछ सरकारी स्वास्थ्य योजनाएं हैं, {patient.name}:\n\n🏥 आयुष्मान भारत – PMJAY\n🏥 राज्य स्वास्थ्य बीमा योजनाएं\n🏥 ईएसआई (ESI)\n\nअधिक जानकारी के लिए 14555 पर कॉल करें।"
        elif language == "gu":
            reply_text = f"અહીં કેટલીક સરકારી આરોગ્ય યોજનાઓ છે, {patient.name}:\n\n🏥 આયુષ્માન ભારત – PMJAY\n🏥 રાજ્ય આરોગ્ય વીમા યોજનાઓ\n🏥 ઇએસઆઇ (ESI)\n\nવધુ માહિતી માટે 14555 પર કૉલ કરો."
        else:
            reply_text = f"Here are some government health schemes, {patient.name}:\n\n🏥 Ayushman Bharat – PMJAY\n🏥 State Health Insurance Schemes\n🏥 ESI (Employees' State Insurance)\n\nCall 14555 for support."

    elif any(w in t for w in report_keywords):
        if language == "hi":
            reply_text = f"मैं आपकी मेडिकल रिपोर्ट समझने में मदद कर सकता हूँ, {patient.name}।\n\nकृपया अपनी डिस्चार्ज समरी या लैब रिपोर्ट इस चैट में अटैचमेंट बटन 📎 का उपयोग करके अपलोड करें।"
        elif language == "gu":
            reply_text = f"હું તમારી મેડિકલ રિપોર્ટ સમજવામાં મદદ કરી શકું છું, {patient.name}.\n\nકૃપા કરીને આ ચેટમાં એટેચમેન્ટ બટન 📎 નો ઉપયોગ કરીને તમારી ડિસ્ચાર્જ સમરી અથવા લેબ રિપોર્ટ અપલોડ કરો."
        else:
            reply_text = f"I can help you understand your medical reports, {patient.name}.\n\nUpload your discharge summary or lab report using the 📎 attachment button in this chat."

    elif any(w in t for w in thanks_keywords):
        if language == "hi":
            reply_text = f"आपका स्वागत है, {patient.name}! 😊\n\nआपका स्वास्थ्य मेरी पहली प्राथमिकता है। क्या मैं आपकी किसी और चीज़ में मदद कर सकता हूँ?"
        elif language == "gu":
            reply_text = f"તમારું સ્વાગત છે, {patient.name}! 😊\n\nતમારું સ્વાસ્થ્ય મારી પ્રથમ પ્રાથમિકતા છે. શું હું તમારી અન્ય કોઈ બાબતમાં મદદ કરી શકું?"
        else:
            reply_text = f"You're very welcome, {patient.name}! 😊\n\nYour health and recovery are my top priority. Is there anything else I can help you with today?"

    else:
        word_count = len(text.split())
        if word_count <= 3:
            if language == "hi":
                reply_text = f"मुझे आपका संदेश मिला: \"{text}\"\n\nक्या आप थोड़ा और विवरण दे सकते हैं, {patient.name}? मैं यह समझना चाहता हूँ कि आपको क्या चाहिए।\n\nउदाहरण के लिए, आप कह सकते हैं:\n• \"मुझे आज सुबह से सिरदर्द है\"\n• \"मुझे कौन सी दवाएं लेनी चाहिए?\"\n• \"मेरा अगला अपॉइंटमेंट कब है?\"\n• \"मैं कमज़ोर और थका हुआ महसूस कर रहा हूँ\"\n• \"रिकवरी के लिए मुझे क्या खाना चाहिए?\""
            elif language == "gu":
                reply_text = f"મને તમારો સંદેશ મળ્યો: \"{text}\"\n\nશું તમે થોડી વધુ વિગતો આપી શકો છો, {patient.name}? હું સમજવા માંગુ છું કે તમને શું જોઈએ છે.\n\nઉદાહરણ તરીકે, તમે કહી શકો છો:\n• \"મને આજ સવારથી માથાનો દુખાવો છે\"\n• \"મારે કઈ દવાઓ લેવી જોઈએ?\"\n• \"મારી આગામી એપોઇન્ટમેન્ટ ક્યારે છે?\"\n• \"હું નબળાઈ અને થાક અનુભવું છું\"\n• \"રિકવરી માટે મારે શું ખાવું જોઈએ?\""
            elif language == "fr":
                reply_text = f"J'ai bien reçu votre message: \"{text}\"\n\nPourriez-vous me donner un peu plus de détails, {patient.name}? Je veux m'assurer de bien comprendre ce dont vous avez besoin.\n\nPar exemple, vous pouvez dire:\n• \"J'ai mal à la tête depuis ce matin\"\n• \"Quels médicaments dois-je prendre?\"\n• \"Quand est mon prochain rendez-vous?\"\n• \"Je me sens faible et fatigué\"\n• \"Que dois-je manger pour ma récupération?\""
            else:
                reply_text = f"I received your message: \"{text}\"\n\nCould you please give me a little more detail, {patient.name}? I want to make sure I understand what you need.\n\nFor example, you can say:\n• \"I have a headache since this morning\"\n• \"What medicines should I take?\"\n• \"When is my next appointment?\"\n• \"I feel weak and tired\"\n• \"What should I eat for recovery?\""
        else:
            if language == "hi":
                reply_text = f"धन्यवाद, {patient.name}।\n\nमुझे बेहतर तरीके से आपकी मदद करने के लिए, क्या आप थोड़ा और विवरण दे सकते हैं? क्या आप शारीरिक लक्षण महसूस कर रहे हैं, या क्या आपको दवाओं, अपॉइंटमेंट या आहार के बारे में कोई सवाल है?"
            elif language == "gu":
                reply_text = f"આભાર, {patient.name}.\n\nમને સારી રીતે તમારી મદદ કરવા માટે, શું તમે થોડી વધુ વિગતો આપી શકો છો? શું તમે શારીરિક લક્ષણો અનુભવી રહ્યા છો, અથવા શું તમને દવાઓ, એપોઇન્ટમેન્ટ અથવા આહાર વિશે કોઈ પ્રશ્ન છે?"
            elif language == "fr":
                reply_text = f"Merci d'avoir partagé cela, {patient.name}.\n\nPour mieux vous aider, pourriez-vous me dire:\n• Ressentez-vous des symptômes physiques?\n• Est-ce lié à vos médicaments ou à votre traitement?\n• Ou avez-vous une question sur votre alimentation, vos rendez-vous ou votre récupération?"
            else:
                reply_text = f"Thank you for sharing that, {patient.name}.\n\nTo help you better, could you tell me:\n• Are you experiencing any physical symptoms?\n• Is this related to your medicines or treatment?\n• Or do you have a question about your diet, appointments, or recovery?"

    return reply_text, escalation
