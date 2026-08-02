"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { api, getUser } from "@/lib/api";

// ─── Language config ───────────────────────────────────────────────────────────
const LANGUAGES = [
  { code: "en", label: "English",  flag: "🇬🇧", native: "English",  tts: "en-IN" },
  { code: "hi", label: "Hindi",    flag: "🇮🇳", native: "हिंदी",    tts: "hi-IN" },
  { code: "gu", label: "Gujarati", flag: "🇮🇳", native: "ગુજરાતી", tts: "gu-IN" },
];

// ─── Action cards on home screen ──────────────────────────────────────────────
const getActionCards = (langCode) => {
  if (langCode === "hi") {
    return [
      { id: "Report Symptoms",           emoji: "🩺", title: "लक्षण बताएं",           sub: "मुझे बताएं आप आज कैसा महसूस कर रहे हैं" },
      { id: "Understand My Medicines",   emoji: "💊", title: "मेरी दवाएं समझाएं",   sub: "किसी भी नुस्खे को सरलता से समझें" },
      { id: "Check Recovery Progress",   emoji: "📈", title: "रिकवरी प्रगति जांचें",   sub: "अपना रिकवरी ट्विन देखें" },
      { id: "Upcoming Appointments",     emoji: "📅", title: "आगामी अपॉइंटमेंट",     sub: "फॉलो-अप और लैब टेस्ट" },
      { id: "Find Healthcare Benefits",  emoji: "🏥", title: "सरकारी स्वास्थ्य योजनाएं",  sub: "सरकारी योजनाएं और पात्रता" },
      { id: "Analyze Medical Reports",   emoji: "📄", title: "मेडिकल रिपोर्ट अपलोड करें",   sub: "विश्लेषण के लिए रिपोर्ट अपलोड करें" },
      { id: "Emergency Assistance",      emoji: "🚨", title: "आपातकालीन सहायता",      sub: "तत्काल स्वास्थ्य सहायता", red: true },
      { id: "Free Chat",                 emoji: "💬", title: "मुफ्त चैट",                 sub: "मुझसे कुछ भी पूछें" },
    ];
  }
  if (langCode === "gu") {
    return [
      { id: "Report Symptoms",           emoji: "🩺", title: "લક્ષણો નોંધાવો",           sub: "મને કહો આજે તમને કેવું લાગે છે" },
      { id: "Understand My Medicines",   emoji: "💊", title: "મારી દવાઓ સમજાવો",   sub: "કોઈપણ પ્રિસ્ક્રિપ્શન સરળતાથી સમજો" },
      { id: "Check Recovery Progress",   emoji: "📈", title: "રિકવરી પ્રગતિ તપાસો",   sub: "તમારો રિકવરી ટ્વીન જુઓ" },
      { id: "Upcoming Appointments",     emoji: "📅", title: "આગામી એપોઇન્ટમેન્ટ્સ",     sub: "ફોલો-અપ્સ અને લેબ ટેસ્ટ" },
      { id: "Find Healthcare Benefits",  emoji: "🏥", title: "સરકારી આરોગ્ય યોજનાઓ",  sub: "સરકારી યોજનાઓ અને પાત્રતા" },
      { id: "Analyze Medical Reports",   emoji: "📄", title: "મેડિકલ રિપોર્ટ અપલોડ કરો",   sub: "વિશ્લેષણ માટે રિપોર્ટ અપલોડ કરો" },
      { id: "Emergency Assistance",      emoji: "🚨", title: "ઇમરજન્સી સહાય",      sub: "તાત્કાલિક આરોગ્ય સહાય", red: true },
      { id: "Free Chat",                 emoji: "💬", title: "મફત ચેટ",                 sub: "મને કંઈપણ પૂછો" },
    ];
  }
  if (langCode === "fr") {
    return [
      { id: "Report Symptoms",           emoji: "🩺", title: "Signaler des symptômes", sub: "Dites-moi comment vous vous sentez" },
      { id: "Understand My Medicines",   emoji: "💊", title: "Comprendre mes médicaments", sub: "Explication simple d'ordonnance" },
      { id: "Check Recovery Progress",   emoji: "📈", title: "Vérifier la récupération", sub: "Voir votre jumeau de récupération" },
      { id: "Upcoming Appointments",     emoji: "📅", title: "Rendez-vous à venir",    sub: "Suivis et tests de laboratoire" },
      { id: "Find Healthcare Benefits",  emoji: "🏥", title: "Avantages de santé",     sub: "Régimes gouvernementaux" },
      { id: "Analyze Medical Reports",   emoji: "📄", title: "Analyser des rapports",  sub: "Téléchargez un rapport médical" },
      { id: "Emergency Assistance",      emoji: "🚨", title: "Assistance d'urgence",   sub: "Soutien de santé immédiat", red: true },
      { id: "Free Chat",                 emoji: "💬", title: "Chat gratuit",           sub: "Posez-moi n'importe quelle question" },
    ];
  }
  return [
    { id: "Report Symptoms",           emoji: "🩺", title: "Report Symptoms",           sub: "Tell me how you feel today" },
    { id: "Understand My Medicines",   emoji: "💊", title: "Understand My Medicines",   sub: "Explain any prescription simply" },
    { id: "Check Recovery Progress",   emoji: "📈", title: "Check Recovery Progress",   sub: "View your Recovery Twin" },
    { id: "Upcoming Appointments",     emoji: "📅", title: "Upcoming Appointments",     sub: "Follow-ups & lab tests" },
    { id: "Find Healthcare Benefits",  emoji: "🏥", title: "Find Healthcare Benefits",  sub: "Government schemes & eligibility" },
    { id: "Analyze Medical Reports",   emoji: "📄", title: "Analyze Medical Reports",   sub: "Upload a report for analysis" },
    { id: "Emergency Assistance",      emoji: "🚨", title: "Emergency Assistance",      sub: "Immediate health support", red: true },
    { id: "Free Chat",                 emoji: "💬", title: "Free Chat",                 sub: "Ask me anything about recovery" },
  ];
};

// ─── Language picker ───────────────────────────────────────────────────────────
function LanguagePicker({ onSelect }) {
  return (
    <div style={S.screen}>
      <div style={S.langBox}>
        <p style={S.auraLabel}>AURA</p>
        <h1 style={S.langTitle}>Choose your language</h1>
        <p style={S.langSub}>Select the language you are most comfortable with</p>
        <div style={S.langGrid}>
          {LANGUAGES.map((l) => (
            <button key={l.code} style={S.langCard} onClick={() => onSelect(l)}>
              <span style={{ fontSize: 34 }}>{l.flag}</span>
              <strong style={{ color: "#0b1b3a", fontSize: 17, fontWeight: 700 }}>{l.native}</strong>
              <span style={{ color: "#4a5b76", fontSize: 13, fontWeight: 600 }}>{l.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Intro typewriter ──────────────────────────────────────────────────────────
function IntroScreen({ lang, name, onContinue, onVoice }) {
  const full = `Hello ${name}.\n\nI am AURA Health Companion.\n\nI will help you manage your recovery, medications, appointments, and healthcare benefits.\n\nYou can talk to me by typing or using your voice.`;
  const [text, setText] = useState("");
  const i = useRef(0);
  useEffect(() => {
    const t = setInterval(() => {
      if (i.current < full.length) { setText(full.slice(0, i.current + 1)); i.current++; }
      else clearInterval(t);
    }, 20);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={S.screen}>
      <div style={S.langBox}>
        <div style={S.introAvatar}>A</div>
        <pre style={S.typewriter}>{text}<span style={S.cursor}>|</span></pre>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 28 }}>
          <button style={S.btnPrimary} onClick={onContinue}>Continue →</button>
          <button style={S.btnGhost} onClick={onVoice}>🎙️ Enable Voice</button>
        </div>
      </div>
    </div>
  );
}

// ─── Typing indicator ──────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div style={S.msgRow}>
      <div style={S.aiAvatar}>A</div>
      <div style={{ ...S.bubble, ...S.aiBubble, display: "flex", gap: 5, alignItems: "center", padding: "12px 16px" }}>
        {[0, 1, 2].map((n) => (
          <span key={n} style={{ ...S.dot, animationDelay: `${n * 0.18}s` }} />
        ))}
      </div>
    </div>
  );
}

// ─── Message bubble ────────────────────────────────────────────────────────────
function Bubble({ msg, onSpeak, onSend }) {
  const isMe = msg.sender === "patient";
  const btns = (() => { try { return msg.buttons_json ? JSON.parse(msg.buttons_json) : null; } catch { return null; } })();
  return (
    <div style={{ ...S.msgRow, justifyContent: isMe ? "flex-end" : "flex-start" }}>
      {!isMe && <div style={S.aiAvatar}>A</div>}
      <div style={{ maxWidth: "78%" }}>
        <div style={{ ...S.bubble, ...(isMe ? S.meBubble : S.aiBubble) }}>
          <p style={{ ...S.msgText, color: isMe ? "#ffffff" : "#0b1b3a" }}>{msg.text}</p>
          {!isMe && (
            <button style={S.ttsBtn} onClick={() => onSpeak(msg.text)} title="Speak">🔊</button>
          )}
        </div>
        {btns && (
          <div style={S.btnRow}>
            {btns.map((b, i) => (
              <button key={i} style={S.quickBtn} onClick={() => onSend(b.label)}>{b.label}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Subscription Modal ────────────────────────────────────────────────────────
function SubscriptionModal({ onClose }) {
  const [step, setStep] = useState("offer");
  const [utr, setUtr] = useState("");
  const [txn, setTxn] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!utr || !txn) return;
    setBusy(true);
    try {
      await api.post("/api/subscriptions/request", {
        utr_number: utr,
        transaction_id: txn
      });
      setStep("done");
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{...S.screen, zIndex: 1000}}>
      <div style={{...S.langBox, background: "#ffffff"}}>
        {step === "offer" && (
          <>
            <h2 style={{ color: "#0b1b3a", fontWeight: 700, marginBottom: 12 }}>Credits Exhausted</h2>
            <p style={{ color: "#dc2626", fontSize: 14, fontWeight: 600, marginBottom: 20 }}>You have used all your available AI Health Companion credits.</p>
            <div style={{ background: "#f6f9fd", border: "1px solid #e2e9f3", borderRadius: 16, padding: 20, marginBottom: 20 }}>
              <h3 style={{ color: "#1665d8", fontWeight: 700, margin: "0 0 8px" }}>AURA Basic Plan</h3>
              <p style={{ fontSize: 24, fontWeight: 800, color: "#0b1b3a", margin: "0 0 8px" }}>₹49 <span style={{fontSize: 14, fontWeight: 600, color: "#4a5b76"}}>/ 30 Days</span></p>
              <ul style={{ color: "#4a5b76", fontWeight: 600, fontSize: 14, textAlign: "left", margin: "0 0 16px", paddingLeft: 20 }}>
                <li style={{marginBottom: 8}}>✓ 25 AI Chat Credits</li>
                <li style={{marginBottom: 8}}>✓ Report Analysis</li>
                <li style={{marginBottom: 8}}>✓ Medicine Explanation</li>
                <li style={{marginBottom: 8}}>✓ Voice Responses</li>
              </ul>
              <button style={{...S.btnPrimary, width: "100%", marginBottom: 10}} onClick={() => setStep("payment")}>Subscribe Now</button>
              <button style={{...S.btnGhost, width: "100%"}} onClick={onClose}>Cancel</button>
            </div>
          </>
        )}
        {step === "payment" && (
          <>
            <h2 style={{ color: "#0b1b3a", fontWeight: 700, marginBottom: 12 }}>Complete Payment</h2>
            <p style={{ color: "#4a5b76", fontSize: 14, fontWeight: 600, marginBottom: 20 }}>Pay ₹49 via UPI</p>
            
            <div style={{ background: "#f6f9fd", border: "1px solid #e2e9f3", padding: 10, display: "inline-block", borderRadius: 8, marginBottom: 16 }}>
              <div style={{ width: 150, height: 150, background: `url("https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=amrmeetdesai02432@oksbi&pn=Aura&am=49") center/cover` }} />
            </div>
            
            <p style={{ color: "#0b1b3a", fontSize: 15, fontWeight: 700, margin: "0 0 20px" }}>
              UPI ID: amrmeetdesai02432@oksbi
              <button style={{...S.chipBtn, marginLeft: 10}} onClick={() => navigator.clipboard.writeText("amrmeetdesai02432@oksbi")}>Copy</button>
            </p>
            
            <input style={{...S.textInput, marginBottom: 10, width: "100%", boxSizing: "border-box"}} placeholder="UTR Number (12 digits)" value={utr} onChange={e => setUtr(e.target.value)} />
            <input style={{...S.textInput, marginBottom: 20, width: "100%", boxSizing: "border-box"}} placeholder="Transaction ID" value={txn} onChange={e => setTxn(e.target.value)} />
            
            <button style={{...S.btnPrimary, width: "100%", marginBottom: 10, opacity: busy ? 0.7 : 1}} onClick={submit} disabled={busy || !utr || !txn}>I Have Paid</button>
            <button style={{...S.btnGhost, width: "100%"}} onClick={onClose}>Cancel</button>
          </>
        )}
        {step === "done" && (
          <>
            <div style={{ fontSize: 40, margin: "0 0 16px" }}>⏳</div>
            <h2 style={{ color: "#0b1b3a", fontWeight: 700, marginBottom: 12 }}>Pending Verification</h2>
            <p style={{ color: "#4a5b76", fontSize: 14, fontWeight: 600, marginBottom: 20 }}>Your payment request has been submitted to the admin. 25 credits will be added once verified.</p>
            <button style={{...S.btnPrimary, width: "100%"}} onClick={onClose}>Close</button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function AuraHealthCompanion() {
  const user = typeof window !== "undefined" ? getUser() : null;
  const firstName = user?.name?.split(" ")[0] || "there";

  const [step, setStep] = useState(() => {
    if (typeof window === "undefined") return "lang";
    return localStorage.getItem("aura.lang") ? "home" : "lang";
  });
  const [lang, setLang] = useState(() => {
    if (typeof window === "undefined") return LANGUAGES[0];
    return LANGUAGES.find((l) => l.code === localStorage.getItem("aura.lang")) || LANGUAGES[0];
  });
  const [voiceOn, setVoiceOn] = useState(false);

  // chat
  const [msgs, setMsgs] = useState([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [err, setErr] = useState(null);
  const [inChat, setInChat] = useState(false);
  const [credits, setCredits] = useState(null);
  const [showSub, setShowSub] = useState(false);

  useEffect(() => {
    api.get("/api/patient").then(p => {
      setCredits(p.chat_credits);
      if (p.language) {
        const dbLang = LANGUAGES.find(l => l.code === p.language);
        if (dbLang) {
          setLang(dbLang);
          localStorage.setItem("aura.lang", dbLang.code);
        }
      }
    }).catch(console.error);
  }, []);

  const bottomRef = useRef(null);
  const fileRef = useRef(null);
  const recRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  // Use a ref so the stale-closure inside sendText always reads the live value
  const voiceOnRef = useRef(voiceOn);
  useEffect(() => { voiceOnRef.current = voiceOn; }, [voiceOn]);
  const [ttsState, setTtsState] = useState("stopped"); // playing, paused, stopped
  const [currentText, setCurrentText] = useState("");

  const stopSpeak = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setTtsState("stopped");
    setCurrentText("");
  }, []);




  const speak = useCallback((text) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    
    stopSpeak();
    
    // Clean markdown and English names to help native TTS
    let cleanText = text.replace(/\*\*/g, '').replace(/\*/g, '').replace(/#/g, '');
    setCurrentText(text);
    
    const u = new SpeechSynthesisUtterance(cleanText);
    u.rate = 0.88;
    u.pitch = 1;

    u.onstart = () => setTtsState("playing");
    u.onend = () => setTtsState("stopped");
    u.onerror = () => setTtsState("stopped");
    u.onpause = () => setTtsState("paused");
    u.onresume = () => setTtsState("playing");

    let voices = window.speechSynthesis.getVoices();
    const targetLang = lang.tts;

    const findVoice = (voiceList) => {
      return voiceList.find((v) => v.lang === targetLang) ||
             voiceList.find((v) => v.lang.replace('_', '-').startsWith(lang.code)) ||
             voiceList.find((v) => v.name.toLowerCase().includes(lang.label.toLowerCase())) ||
             voiceList.find((v) => v.name.includes(lang.native));
    };

    let voice = findVoice(voices);

    const playVoice = (v) => {
      if (v) u.voice = v;
      u.lang = v ? v.lang : targetLang;
      window.speechSynthesis.speak(u);
    };

    if (voice) {
      playVoice(voice);
    } else {
      let hasPlayed = false;
      const handleVoicesChanged = () => {
        if (hasPlayed) return;
        const newVoices = window.speechSynthesis.getVoices();
        const newVoice = findVoice(newVoices);
        if (newVoice) {
          hasPlayed = true;
          window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
          playVoice(newVoice);
        }
      };
      
      window.speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);
      
      setTimeout(() => {
        if (!hasPlayed) {
          hasPlayed = true;
          window.speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
          playVoice(null);
        }
      }, 1000);
    }
  }, [lang]);

  const pauseSpeak = useCallback(() => {
    if (window.speechSynthesis) window.speechSynthesis.pause();
  }, []);

  const resumeSpeak = useCallback(() => {
    if (audioRef.current && ttsState === "paused") {
      audioRef.current.play();
      setTtsState("playing");
    }
    if (window.speechSynthesis) window.speechSynthesis.resume();
  }, [ttsState]);

  const replaySpeak = useCallback(() => {
    if (currentText) speak(currentText);
  }, [currentText, speak]);

  // ── STT ──────────────────────────────────────────────────────────────────────
  const toggleMic = useCallback(() => {
    if (listening) { recRef.current?.stop(); setListening(false); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert("Voice input requires Chrome browser."); return; }
    const r = new SR();
    r.lang = lang.tts;
    r.continuous = false;
    r.interimResults = false;
    r.onresult = (e) => {
      const t = e.results[0][0].transcript;
      setDraft(t);
      setListening(false);
      sendText(t);
    };
    r.onerror = r.onend = () => setListening(false);
    recRef.current = r;
    r.start();
    setListening(true);
  }, [listening, lang]);

  // ── Send ─────────────────────────────────────────────────────────────────────
  const sendText = useCallback(async (text) => {
    const t = (text || draft).trim();
    if (!t || busy) return;
    setBusy(true);
    setErr(null);
    setDraft("");
    setInChat(true);
    try {
      // Send language so backend replies in the selected language
      const created = await api.post("/api/chat", { text: t, language: lang.code });
      setMsgs((prev) => [...prev, ...created]);
      setCredits(c => c !== null ? c - 1 : null);
      const aiMsg = created.find((m) => m.sender === "aura");
      // Use ref to read live voiceOn value (avoids stale closure)
      if (aiMsg && voiceOnRef.current) speak(aiMsg.text);
    } catch (e) {
      if (e.status === 402) setShowSub(true);
      else setErr(e.message);
    } finally {
      setBusy(false);
    }
  }, [draft, busy, speak, lang]);

  const sendFile = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file || busy) return;
    setBusy(true);
    setInChat(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("language", lang.code);
    try {
      const created = await api.post("/api/chat/upload", fd);
      setMsgs((prev) => [...prev, ...created]);
      setCredits(c => c !== null ? c - 1 : null);
      const aiMsg = created.find((m) => m.sender === "aura");
      if (aiMsg && voiceOnRef.current) speak(aiMsg.text);
    } catch (ex) { 
      if (ex.status === 402) setShowSub(true);
      else setErr(ex.message);
    }
    finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  }, [busy, lang, speak]);

  // ── Onboarding ───────────────────────────────────────────────────────────────
  if (step === "lang") {
    return (
      <LanguagePicker onSelect={(l) => {
        setLang(l);
        localStorage.setItem("aura.lang", l.code);
        setStep("intro");
      }} />
    );
  }
  if (step === "intro") {
    return (
      <IntroScreen
        lang={lang}
        name={firstName}
        onContinue={() => setStep("home")}
        onVoice={() => { setVoiceOn(true); setStep("home"); }}
      />
    );
  }

  if (step === "reports") {
    return <ReportsScreen onBack={() => setStep("home")} lang={lang} />;
  }

  // ── Main UI ──────────────────────────────────────────────────────────────────
  return (
    <div style={S.wrap}>
      {/* Top bar */}
      <div style={S.topBar}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ ...S.aiAvatar, background: "#ffffff", border: "1px solid #e2e9f3", padding: 5, boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
            <img src="/logo.png" alt="AURA" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          </div>
          <div>
            <p style={{ color: "#0b1b3a", fontWeight: 700, fontSize: 15, margin: 0 }}>AURA Health Companion</p>
            <p style={{ color: "#16a34a", fontSize: 12, fontWeight: 600, margin: 0, display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
              Online · {lang.native}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {credits !== null && (
            <div title="Credits Remaining" style={{...S.chipBtn, background: "#e8f0fe", color: "#1665d8", border: "1px solid #1665d8", display: "flex", gap: 5, alignItems: "center", cursor: "default"}}>
              <span style={{ fontSize: 13 }}>💎</span> Unlimited
            </div>
          )}
          <button style={S.chipBtn} onClick={() => setStep("lang")}>{lang.flag} {lang.label}</button>
          <button style={S.chipBtn} onClick={() => setStep("reports")}>📄 Reports</button>
          {inChat && <button style={S.chipBtn} onClick={() => setInChat(false)}>← Home</button>}
          <button
            style={{
              ...S.chipBtn,
              background: voiceOn ? "#e9f8f1" : "#ffffff",
              border: voiceOn ? "1px solid #0f7b52" : "1px solid #e2e9f3",
              color: voiceOn ? "#0f7b52" : "#0b1b3a",
              fontWeight: 700,
            }}
            onClick={() => {
              const next = !voiceOn;
              setVoiceOn(next);
              voiceOnRef.current = next;
              if (!next && typeof window !== "undefined" && window.speechSynthesis) {
                window.speechSynthesis.cancel();
              }
            }}
            title={voiceOn ? "Voice ON — click to turn off" : "Voice OFF — click to enable"}
          >
            {voiceOn ? "🔊 Voice On" : "🔇 Voice Off"}
          </button>
        </div>
      </div>

      {/* Body */}
      {!inChat ? (
        /* Home */
        <div style={S.home}>
          <p style={S.greeting}>👋 How can I help you today, <strong>{firstName}</strong>?</p>
          <div style={S.cardGrid}>
            {getActionCards(lang.code).map((c) => (
              <button
                key={c.id}
                style={{ ...S.card, ...(c.red ? S.cardRed : {}) }}
                onClick={() => {
                  if (c.id === "Analyze Medical Reports") {
                    fileRef.current?.click();
                  } else {
                    sendText(c.title);
                  }
                }}
              >
                <span style={{ fontSize: 28 }}>{c.emoji}</span>
                <p style={{ color: "#0b1b3a", fontWeight: 700, fontSize: 13, margin: "6px 0 2px" }}>{c.title}</p>
                <p style={{ color: "#4a5b76", fontSize: 11, fontWeight: 500, margin: 0 }}>{c.sub}</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Chat */
        <div style={S.chat}>
          <div style={S.messages}>
            {msgs.length === 0 && !busy && (
              <div style={{ textAlign: "center", color: "#4a5b76", marginTop: 40 }}>
                <div style={{ ...S.aiAvatar, margin: "0 auto 10px", opacity: 0.5 }}>A</div>
                <p style={{ fontSize: 14, fontWeight: 600 }}>AURA is ready to help…</p>
              </div>
            )}
            {msgs.map((m) => <Bubble key={m.id} msg={m} onSpeak={speak} onSend={sendText} />)}
            {busy && <TypingDots />}
            <div ref={bottomRef} />
          </div>

          {err && <p style={{ color: "#f87171", fontSize: 12, textAlign: "center", padding: "4px 16px" }}>{err}</p>}
          
          {/* TTS Controls */}
          {ttsState !== "stopped" && (
            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 10, padding: 8, background: "rgba(255,255,255,0.05)", borderRadius: 12 }}>
              <span style={{ color: "#ccc", fontSize: 12, display: "flex", alignItems: "center" }}>Reading aloud...</span>
              {ttsState === "playing" ? (
                <button style={S.chipBtn} onClick={pauseSpeak}>⏸️ Pause</button>
              ) : (
                <button style={S.chipBtn} onClick={resumeSpeak}>▶️ Resume</button>
              )}
              <button style={S.chipBtn} onClick={replaySpeak}>🔄 Replay</button>
            </div>
          )}

          {/* Input row */}
          <div style={S.inputRow}>
            <input type="file" accept="image/*,.pdf" style={{ display: "none" }} ref={fileRef} onChange={sendFile} />
            <button style={S.iconBtn} onClick={() => fileRef.current?.click()} disabled={busy} title="Upload report">📄</button>
            <input
              style={S.textInput}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendText())}
              placeholder={lang.code === "hi" ? "यहाँ टाइप करें… (अंग्रेजी में)" : lang.code === "gu" ? "અહીં ટાઇપ કરો… (English)" : "Type a message…"}
              disabled={busy}
              lang="en"
              inputMode="text"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
            <button
              style={{ ...S.iconBtn, background: listening ? "rgba(239,68,68,0.15)" : "#ffffff", border: listening ? "1px solid rgba(239,68,68,0.5)" : "1px solid #e2e9f3" }}
              onClick={toggleMic}
              disabled={busy}
              title={listening ? "Stop listening" : "Speak"}
            >
              {listening ? "🔴" : "🎤"}
            </button>
            <button
              style={{ ...S.iconBtn, background: "linear-gradient(135deg,#1665d8,#0ea5e9)", color: "#ffffff", border: "none", opacity: !draft.trim() || busy ? 0.4 : 1 }}
              onClick={() => sendText()}
              disabled={!draft.trim() || busy}
            >
              ➤
            </button>
          </div>
        </div>
      )}
      {showSub && <SubscriptionModal onClose={() => setShowSub(false)} />}
    </div>
  );
}

// ─── Reports Screen ──────────────────────────────────────────────────────────────
function ReportsScreen({ onBack, lang }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    api.get("/api/reports")
      .then((data) => setReports(data))
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "24px 16px", background: "#ffffff" }}>
      <button style={{ ...S.chipBtn, marginBottom: 20 }} onClick={onBack}>← Back to Home</button>
      <h2 style={{ color: "#0b1b3a", fontSize: 20, marginBottom: 16 }}>My Medical Reports</h2>
      
      {loading && <p style={{ color: "#4a5b76" }}>Loading reports...</p>}
      {err && <p style={{ color: "#dc2626" }}>{err}</p>}
      
      {!loading && reports.length === 0 && (
        <p style={{ color: "#4a5b76", textAlign: "center", marginTop: 40 }}>No reports analyzed yet.</p>
      )}

      {!loading && reports.map(r => (
        <div key={r.id} style={{ background: "#f6f9fd", border: "1px solid #e2e9f3", borderRadius: 16, padding: 16, marginBottom: 16 }}>
          <p style={{ color: "#1665d8", fontSize: 12, fontWeight: 700, margin: "0 0 4px" }}>
            {new Date(r.uploaded_at).toLocaleDateString()} · {r.filename}
          </p>
          <p style={{ color: "#0b1b3a", fontSize: 14, margin: "0 0 12px" }}>
            <strong>Risk Level:</strong> <span style={{ color: r.risk_level === "High" ? "#dc2626" : r.risk_level === "Moderate" ? "#d97706" : "#16a34a" }}>{r.risk_level}</span>
          </p>
          {r.recommended_specialist && (
            <p style={{ color: "#4a5b76", fontSize: 13, margin: "0 0 12px" }}>
              <strong>Recommended Specialist:</strong> {r.recommended_specialist}
            </p>
          )}
          
          <div style={{ background: "#ffffff", border: "1px solid #e2e9f3", borderRadius: 12, padding: 12, marginBottom: 12 }}>
            <strong style={{ color: "#0b1b3a", fontSize: 13 }}>Smart Summary</strong>
            <p style={{ color: "#4a5b76", fontSize: 13, margin: "4px 0 0", whiteSpace: "pre-wrap" }}>{r.smart_summary}</p>
          </div>
          
          <div style={{ background: "#ffffff", border: "1px solid #e2e9f3", borderRadius: 12, padding: 12 }}>
            <strong style={{ color: "#0b1b3a", fontSize: 13 }}>Explanation</strong>
            <p style={{ color: "#4a5b76", fontSize: 13, margin: "4px 0 0", whiteSpace: "pre-wrap" }}>{r.simple_explanation}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const S = {
  screen: { position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(11,27,58,0.5)", padding: 20, backdropFilter: "blur(8px)" },
  langBox: { background: "#ffffff", border: "1px solid #e2e9f3", borderRadius: 24, padding: 40, maxWidth: 480, width: "100%", textAlign: "center", boxShadow: "0 20px 40px rgba(11,27,58,0.12)" },
  auraLabel: { fontSize: 13, fontWeight: 800, letterSpacing: 4, color: "#1665d8", margin: "0 0 12px" },
  langTitle: { fontSize: 28, fontWeight: 800, color: "#0b1b3a", margin: "0 0 6px" },
  langSub: { fontSize: 14, color: "#4a5b76", margin: "0 0 28px" },
  langGrid: { display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 },
  langCard: { display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: "#f6f9fd", border: "1px solid #e2e9f3", borderRadius: 18, padding: "20px 10px", cursor: "pointer", transition: "all 0.2s" },
  introAvatar: { width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,#1665d8,#0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: 800, color: "#fff", margin: "0 auto 24px" },
  typewriter: { fontFamily: "inherit", fontSize: 17, lineHeight: 1.7, color: "#0b1b3a", whiteSpace: "pre-wrap", textAlign: "left", minHeight: 140, margin: 0 },
  cursor: { display: "inline-block", color: "#1665d8", animation: "none" },
  btnPrimary: { background: "linear-gradient(135deg,#1665d8,#0ea5e9)", color: "#fff", border: "none", borderRadius: 14, padding: "13px 28px", fontSize: 16, fontWeight: 700, cursor: "pointer" },
  btnGhost: { background: "#f6f9fd", border: "1px solid #e2e9f3", color: "#4a5b76", borderRadius: 14, padding: "13px 28px", fontSize: 15, cursor: "pointer" },

  wrap: { display: "flex", flexDirection: "column", height: "100%", minHeight: 580, background: "#ffffff", border: "1px solid #e2e9f3", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 20px rgba(11,27,58,0.04)", fontFamily: "'Inter',system-ui,sans-serif" },

  topBar: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "#f6f9fd", borderBottom: "1px solid #e2e9f3", flexShrink: 0 },
  aiAvatar: { width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#1665d8,#0ea5e9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: "#fff", flexShrink: 0 },
  chipBtn: { background: "#ffffff", border: "1px solid #e2e9f3", borderRadius: 100, padding: "5px 12px", color: "#4a5b76", fontSize: 12, cursor: "pointer" },

  home: { flex: 1, overflowY: "auto", padding: "24px 16px", background: "#ffffff" },
  greeting: { fontSize: 18, color: "#0b1b3a", textAlign: "center", marginBottom: 24, fontWeight: 500 },
  cardGrid: { display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 },
  card: { display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 0, background: "#f6f9fd", border: "1px solid #e2e9f3", borderRadius: 18, padding: "18px 14px", cursor: "pointer", transition: "all 0.2s", textAlign: "left" },
  cardRed: { borderColor: "#fca5a5", background: "#fef2f2" },

  chat: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#ffffff" },
  messages: { flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 12 },
  msgRow: { display: "flex", gap: 8, alignItems: "flex-end" },
  bubble: { borderRadius: 18, padding: "10px 14px", position: "relative", maxWidth: "100%", wordBreak: "break-word" },
  aiBubble: { background: "#f6f9fd", border: "1px solid #e2e9f3", borderRadius: "18px 18px 18px 4px" },
  meBubble: { background: "linear-gradient(135deg,#1665d8,#0ea5e9)", borderRadius: "18px 18px 4px 18px" },
  msgText: { fontSize: 14, color: "#0b1b3a", lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" },
  ttsBtn: { marginTop: 4, background: "none", border: "none", cursor: "pointer", fontSize: 13, opacity: 0.7, padding: 0, display: "block" },
  btnRow: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 },
  quickBtn: { background: "#e8f0fe", border: "1px solid #1665d8", borderRadius: 100, padding: "6px 14px", fontSize: 12, fontWeight: 600, color: "#1665d8", cursor: "pointer" },
  dot: { width: 7, height: 7, borderRadius: "50%", background: "#4a5b76", display: "inline-block", animation: "bounce 1.2s ease-in-out infinite" },

  inputRow: { display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", background: "#f6f9fd", borderTop: "1px solid #e2e9f3", flexShrink: 0 },
  iconBtn: { width: 36, height: 36, borderRadius: "50%", background: "#ffffff", border: "1px solid #e2e9f3", fontSize: 15, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  textInput: { flex: 1, minWidth: 0, background: "#ffffff", border: "1px solid #e2e9f3", borderRadius: 100, padding: "9px 16px", fontSize: 14, color: "#0b1b3a", outline: "none" },
};
