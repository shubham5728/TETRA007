// Mock data for the prototype.
//
// Everything the UI shows comes from this one file, so swapping in the real
// FastAPI backend later means replacing these exports with fetch calls and
// leaving every component untouched.

export const patient = {
  name: "Priya Ananthan",
  initials: "PA",
  age: 67,
  gender: "Female",
  diagnosis: "Type-2 Diabetes + Hypertension",
  dischargedOn: "18 July 2026",
  hospital: "Aravind General Hospital, Madurai",
  village: "Thirumangalam, Tamil Nadu",
  careTeam: "Dr. Meera Rajan",
};

export const recoveryTwin = {
  score: 72,
  scoreChange: +6,
  riskLevel: "Moderate",
  medicationAdherence: 84,
  symptomLoad: "Low",
  daysSinceDischarge: 14,
  summary:
    "Recovery is on track. Medication adherence improved this week, but evening sugar readings are still running high.",
};

export const vitals = [
  { label: "Heart Rate", value: 72, unit: "bpm", status: "normal" },
  { label: "SpO₂", value: 97, unit: "%", status: "normal" },
  { label: "Blood Pressure", value: "138/86", unit: "mmHg", status: "watch" },
  { label: "Temperature", value: 98.4, unit: "°F", status: "normal" },
  { label: "Steps Today", value: 2140, unit: "steps", status: "watch" },
  { label: "Sleep", value: 6.2, unit: "hrs", status: "normal" },
];

// 14 days of recovery score history, used by the trend charts.
export const recoveryHistory = [
  { day: "D1", score: 41 },
  { day: "D2", score: 44 },
  { day: "D3", score: 43 },
  { day: "D4", score: 48 },
  { day: "D5", score: 52 },
  { day: "D6", score: 55 },
  { day: "D7", score: 54 },
  { day: "D8", score: 58 },
  { day: "D9", score: 61 },
  { day: "D10", score: 63 },
  { day: "D11", score: 66 },
  { day: "D12", score: 68 },
  { day: "D13", score: 70 },
  { day: "D14", score: 72 },
];

export const sentinel = {
  readmissionRisk: 34,
  relapseRisk: 21,
  recoveryScore: 72,
  riskLevel: "Moderate",
  lastRun: "2 minutes ago",
  modelVersion: "sentinel-v0.4 (XGBoost)",
  confidence: 0.81,
  factors: [
    { name: "Evening glucose above target", weight: 28, direction: "up" },
    { name: "Missed 3 metformin doses", weight: 22, direction: "up" },
    { name: "Blood pressure trending high", weight: 17, direction: "up" },
    { name: "Daily step count below goal", weight: 11, direction: "up" },
    { name: "All follow-ups attended", weight: 14, direction: "down" },
    { name: "No fever or breathlessness", weight: 8, direction: "down" },
  ],
  recommendation:
    "Review evening insulin timing at the next consultation. No emergency action needed today.",
};

export const medications = [
  {
    name: "Metformin",
    dose: "500 mg",
    schedule: "After breakfast & dinner",
    plain: "Take one tablet after breakfast and one after dinner.",
    adherence: 84,
    taken: true,
  },
  {
    name: "Amlodipine",
    dose: "5 mg",
    schedule: "Once daily, morning",
    plain: "Take one tablet every morning.",
    adherence: 96,
    taken: true,
  },
  {
    name: "Atorvastatin",
    dose: "10 mg",
    schedule: "Once daily, bedtime",
    plain: "Take one tablet before going to sleep.",
    adherence: 71,
    taken: false,
  },
  {
    name: "Aspirin",
    dose: "75 mg",
    schedule: "Once daily, after lunch",
    plain: "Take one tablet after lunch.",
    adherence: 90,
    taken: true,
  },
];

export const symptoms = [
  { name: "Fatigue", level: "Mild", trend: "down", loggedOn: "Today, 08:10" },
  { name: "Dizziness", level: "Mild", trend: "flat", loggedOn: "Yesterday" },
  { name: "Swollen feet", level: "None", trend: "down", loggedOn: "2 days ago" },
  { name: "Breathlessness", level: "None", trend: "flat", loggedOn: "3 days ago" },
];

export const appointments = [
  {
    title: "Diabetes review",
    doctor: "Dr. Meera Rajan",
    mode: "In person",
    date: "05 Aug 2026",
    time: "10:30 AM",
    status: "Confirmed",
  },
  {
    title: "Blood pressure check",
    doctor: "ASHA worker visit",
    mode: "Home visit",
    date: "08 Aug 2026",
    time: "09:00 AM",
    status: "Confirmed",
  },
  {
    title: "Lab work — HbA1c",
    doctor: "Aravind General Hospital",
    mode: "Lab",
    date: "14 Aug 2026",
    time: "07:45 AM",
    status: "Pending",
  },
  {
    title: "Cardiology follow-up",
    doctor: "Dr. Suresh Kumar",
    mode: "Video call",
    date: "22 Aug 2026",
    time: "04:00 PM",
    status: "Confirmed",
  },
];

export const doctorPatients = [
  {
    name: "Rukmini Devi",
    age: 74,
    condition: "Heart failure",
    risk: 89,
    level: "High",
    lastCheckIn: "6 hrs ago",
  },
  {
    name: "Anand Pillai",
    age: 58,
    condition: "Post-CABG",
    risk: 76,
    level: "High",
    lastCheckIn: "Today",
  },
  {
    name: "Priya Ananthan",
    age: 67,
    condition: "Diabetes + HTN",
    risk: 34,
    level: "Moderate",
    lastCheckIn: "Today",
  },
  {
    name: "Fatima Sheikh",
    age: 45,
    condition: "Post-op recovery",
    risk: 28,
    level: "Moderate",
    lastCheckIn: "Yesterday",
  },
  {
    name: "Joseph Mathew",
    age: 61,
    condition: "COPD",
    risk: 17,
    level: "Low",
    lastCheckIn: "Today",
  },
];

export const caregiverAlerts = [
  {
    title: "Atorvastatin missed last night",
    detail: "Bedtime dose was not marked as taken.",
    severity: "warning",
    time: "9 hrs ago",
  },
  {
    title: "Evening glucose above target",
    detail: "Reading was 212 mg/dL after dinner.",
    severity: "warning",
    time: "Yesterday",
  },
  {
    title: "Follow-up confirmed",
    detail: "Diabetes review booked for 05 Aug.",
    severity: "info",
    time: "2 days ago",
  },
];

export const wearableDevices = [
  { name: "Fitness band", model: "Generic BLE", status: "Connected", battery: 68 },
  { name: "BP monitor", model: "Omron HEM-7124", status: "Connected", battery: 41 },
  { name: "Glucometer", model: "Accu-Chek Active", status: "Manual entry", battery: null },
  { name: "Pulse oximeter", model: "Not paired", status: "Offline", battery: null },
];

export const coordinatorChat = [
  {
    from: "patient",
    text: "என் மாத்திரை எப்போது சாப்பிட வேண்டும்?",
    translated: "When should I take my tablet?",
    time: "08:02",
  },
  {
    from: "aura",
    text: "Take one Metformin tablet after breakfast and one after dinner. You have already marked this morning's dose as taken.",
    time: "08:02",
  },
  {
    from: "patient",
    text: "My feet feel a little swollen today.",
    time: "08:05",
  },
  {
    from: "aura",
    text: "Thank you for telling me. I have added this to your Recovery Twin. Please raise your feet while resting and drink water. If the swelling gets worse or you feel breathless, I will alert Dr. Meera Rajan straight away.",
    time: "08:05",
  },
];

export const schemes = [
  {
    name: "Ayushman Bharat PM-JAY",
    benefit: "₹5 lakh cover per family per year",
    status: "Eligible",
  },
  {
    name: "CM Comprehensive Health Insurance",
    benefit: "Tamil Nadu state cover for listed procedures",
    status: "Eligible",
  },
  {
    name: "National Programme for Diabetes Care",
    benefit: "Free screening and medicines at PHC",
    status: "Enrolled",
  },
];

export const escalationExample = {
  signals: [
    "Missed medication",
    "Fever",
    "Breathlessness",
    "Low activity",
    "Missed follow-up",
  ],
  risk: 89,
  actions: [
    "Doctor alerted",
    "Caregiver notified",
    "Emergency consultation recommended",
  ],
};
