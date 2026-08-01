"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ErrorState, Loading } from "@/components/DataStates";
import { Icon } from "@/components/Icons";
import { Card, Pill, ProgressBar } from "@/components/ui";
import { setViewingPatientId } from "@/lib/api";
import { useApi } from "@/lib/useApi";
import { exportPatientTelemetryPdf } from "@/lib/pdfExport";

// Import active modular Doctor workflow step components
import DoctorPatientQueueView from "@/components/doctor/DoctorPatientQueueView";
import DoctorSelectPatientView from "@/components/doctor/DoctorSelectPatientView";
import DoctorRecoveryTwinView from "@/components/doctor/DoctorRecoveryTwinView";
import DoctorAiSummaryView from "@/components/doctor/DoctorAiSummaryView";
import DoctorPrescriptionView from "@/components/doctor/DoctorPrescriptionView";
import DoctorRiskOverrideView from "@/components/doctor/DoctorRiskOverrideView";
import DoctorAppointmentsView from "@/components/doctor/DoctorAppointmentsView";
import DoctorEmergencySosView from "@/components/doctor/DoctorEmergencySosView";
import DoctorMessagingView from "@/components/doctor/DoctorMessagingView";
import DoctorSettingsView from "@/components/doctor/DoctorSettingsView";

export default function DoctorPortalView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientsApi = useApi("/api/doctor/patients");

  // Read active tab from URL query param "?tab=..."
  const tabParam = searchParams.get("tab");
  const [activeSideNav, setActiveSideNav] = useState(tabParam || "queue");
  const [toastMessage, setToastMessage] = useState(null);

  // Synchronize state with URL query param changes
  useEffect(() => {
    setActiveSideNav(tabParam || "queue");
  }, [tabParam]);

  function handleTabChange(tabId) {
    setActiveSideNav(tabId);
    router.push(`/doctor-portal?tab=${tabId}`);
  }

  // Search, Filter & Sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("All");
  const [sortBy, setSortBy] = useState("risk-desc");
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  // Modals & Form states
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescriptionForm, setPrescriptionForm] = useState({
    patientId: "",
    drug: "",
    dosage: "500mg",
    frequency: "Twice Daily (BID)",
    duration: "30 days",
    instructions: "Take after meals with water",
  });

  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideLevel, setOverrideLevel] = useState("Moderate");
  const [overrideNote, setOverrideNote] = useState("");

  const [showTwinModal, setShowTwinModal] = useState(false);

  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [newDate, setNewDate] = useState("2026-08-10");
  const [newTime, setNewTime] = useState("10:30");

  // Messaging state
  const [messageText, setMessageText] = useState("");

  // AI Summary state
  const [aiSummary, setAiSummary] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Emergency SOS state
  const [sosBannerActive, setSosBannerActive] = useState(true);
  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [sosNotes, setSosNotes] = useState("");

  // Doctor Settings State
  const [doctorProfile, setDoctorProfile] = useState({
    name: "Dr. Ananya Arora",
    mciNumber: "MCI-2024-8891",
    specialisation: "Senior Consultant Cardiologist & Diabetologist",
    hospital: "Aravind General Hospital & Research Center",
    clinicAddress: "Suite 402, Medical Enclave, Sector 4, City Center",
    consultationHours: "Mon - Fri: 09:00 AM - 05:00 PM",
    riskSensitivity: 75,
  });

  // Local state overrides & history arrays
  const [customPrescriptions, setCustomPrescriptions] = useState({
    1: [
      {
        id: 101,
        date: "2026-07-20",
        drug: "Metformin",
        dosage: "500mg",
        frequency: "Twice Daily (BID)",
        duration: "30 days",
        instructions: "Take after meals",
        signature: "Digitally Signed by Dr. Arora | MCI-2024-8891",
      },
    ],
  });

  const [customRiskOverrides, setCustomRiskOverrides] = useState({});

  const [customMessages, setCustomMessages] = useState({
    1: [
      {
        id: 301,
        sender: "Caregiver (Aarav Sharma)",
        time: "Yesterday 09:15 AM",
        text: "Doctor, morning doses completed. Blood sugar was 130 mg/dL after breakfast.",
      },
    ],
  });

  const [appointmentsList, setAppointmentsList] = useState([
    {
      id: 401,
      patientId: 1,
      patientName: "Priya Ananthan",
      title: "Post-Discharge Cardiac & Diabetes Review",
      doctor: "Dr. Ananya Arora",
      mode: "In person",
      date: "2026-08-05",
      time: "10:30 AM",
      status: "Confirmed",
    },
    {
      id: 402,
      patientId: 1,
      patientName: "Priya Ananthan",
      title: "ASHA Worker Home Vitals Checkup",
      doctor: "Sunita ASHA Worker",
      mode: "Home visit",
      date: "2026-08-08",
      time: "09:00 AM",
      status: "Confirmed",
    },
    {
      id: 403,
      patientId: 2,
      patientName: "Rukmini Devi",
      title: "Emergency SOS Follow-up Consultation",
      doctor: "Dr. Ananya Arora",
      mode: "In person",
      date: "2026-08-02",
      time: "11:00 AM",
      status: "Upcoming",
    },
    {
      id: 404,
      patientId: 3,
      patientName: "Rajesh Sharma",
      title: "Quarterly HbA1c Lab Checkup",
      doctor: "Aravind Pathology Lab",
      mode: "Lab",
      date: "2026-07-25",
      time: "08:00 AM",
      status: "Completed",
    },
  ]);

  const [appointmentFilter, setAppointmentFilter] = useState("All");

  function showToast(text) {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3500);
  }

  if (patientsApi.loading) return <Loading rows={4} />;
  if (patientsApi.error) {
    return <ErrorState error={patientsApi.error} onRetry={patientsApi.reload} />;
  }

  const rawRows = patientsApi.data || [];

  // Resolved list with risk overrides applied
  const resolvedPatients = rawRows.map((patient) => {
    const override = customRiskOverrides[patient.id];
    if (override) {
      return { ...patient, level: override.level, risk: override.risk };
    }
    return patient;
  });

  // Filter & sort roster
  const filteredPatients = resolvedPatients
    .filter((row) => {
      const matchesSearch =
        row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.condition.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRisk = riskFilter === "All" || row.level === riskFilter;
      return matchesSearch && matchesRisk;
    })
    .sort((a, b) => {
      if (sortBy === "risk-desc") return b.risk - a.risk;
      if (sortBy === "risk-asc") return a.risk - b.risk;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0;
    });

  const currentPatient =
    resolvedPatients.find((p) => p.id === selectedPatientId) ||
    filteredPatients[0] ||
    resolvedPatients[0];

  const highRiskCount = resolvedPatients.filter((r) => r.level === "High").length;
  const moderateRiskCount = resolvedPatients.filter((r) => r.level === "Moderate").length;

  /** Open full Recovery Twin popup dialog */
  function openPatientRecoveryTwin(id) {
    if (id) setViewingPatientId(id);
    setShowTwinModal(true);
  }

  /** Trigger AI Summary generation */
  function handleGenerateAiSummary(patient) {
    setIsAiLoading(true);
    setAiSummary(null);
    setTimeout(() => {
      setIsAiLoading(false);
      const summaryPayload = {
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        recoveryScore: Math.max(35, 100 - patient.risk),
        readmissionRisk: patient.risk,
        findings: [
          `Medication adherence is currently at ${Math.max(45, 95 - Math.round(patient.risk * 0.5))}%.`,
          `Vitals stream indicates blood pressure fluctuations over the last 48 hours.`,
          `No missed follow-up appointments recorded in the past 14 days.`,
        ],
        flags:
          patient.level === "High"
            ? ["⚠️ Low medication compliance detected", "⚠️ Elevated Sentinel readmission risk indicator"]
            : ["✅ Vitals stable within clinical thresholds"],
        recommendation:
          patient.level === "High"
            ? "Immediate in-person evaluation recommended within 24-48 hours. Consider dosage recalibration."
            : "Continue current prescription regimen. Schedule routine follow-up checkup.",
      };
      setAiSummary(summaryPayload);
      showToast(`AI Clinical Summary generated for ${patient.name}`);
    }, 900);
  }

  /** Submit Digital Prescription */
  function handleAddPrescription(e) {
    e.preventDefault();
    const targetPatient =
      resolvedPatients.find((p) => p.id === Number(prescriptionForm.patientId)) || currentPatient;
    if (!targetPatient) return;

    const newRx = {
      id: Date.now(),
      date: new Date().toLocaleDateString(),
      drug: prescriptionForm.drug,
      dosage: prescriptionForm.dosage,
      frequency: prescriptionForm.frequency,
      duration: prescriptionForm.duration,
      instructions: prescriptionForm.instructions,
      signature: "Digitally Signed by Dr. Arora | MCI-2024-8891",
    };
    setCustomPrescriptions((prev) => ({
      ...prev,
      [targetPatient.id]: [...(prev[targetPatient.id] || []), newRx],
    }));
    setShowPrescriptionModal(false);
    showToast(`Prescription for ${prescriptionForm.drug} issued to ${targetPatient.name}`);
  }

  /** Submit Sentinel Risk Override */
  function handleSaveRiskOverride(e) {
    e.preventDefault();
    if (!currentPatient) return;
    const riskVal = overrideLevel === "High" ? 85 : overrideLevel === "Moderate" ? 55 : 20;
    setCustomRiskOverrides((prev) => ({
      ...prev,
      [currentPatient.id]: { level: overrideLevel, risk: riskVal, note: overrideNote },
    }));
    setShowOverrideModal(false);
    showToast(`Sentinel risk level updated to ${overrideLevel} for ${currentPatient.name}`);
  }

  /** Send Direct Message */
  function handleSendMessage(e) {
    e.preventDefault();
    if (!messageText.trim() || !currentPatient) return;
    const msg = {
      id: Date.now(),
      sender: "Dr. Arora (You)",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      text: messageText,
    };
    setCustomMessages((prev) => ({
      ...prev,
      [currentPatient.id]: [...(prev[currentPatient.id] || []), msg],
    }));
    setMessageText("");
    showToast(`Message sent to ${currentPatient.name}`);
  }

  /** Resolve SOS Alert */
  function handleResolveSos() {
    setSosBannerActive(false);
    setSosModalOpen(false);
    showToast("Emergency SOS acknowledged and ambulance team dispatched!");
  }

  /** Handle Appointment Actions */
  function handleAppointmentAction(id, action) {
    if (action === "confirm") {
      setAppointmentsList((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "Confirmed" } : a))
      );
      showToast("Appointment status updated to Confirmed");
    } else if (action === "reject") {
      setAppointmentsList((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "Rejected" } : a))
      );
      showToast("Appointment has been Rejected");
    } else if (action === "complete") {
      setAppointmentsList((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: "Completed" } : a))
      );
      showToast("Appointment marked Completed.");
    } else if (action === "reschedule") {
      const target = appointmentsList.find((a) => a.id === id);
      setRescheduleTarget(target);
      setShowRescheduleModal(true);
    }
  }

  function formatTime12h(time24) {
    if (!time24) return "10:30 AM";
    const parts = time24.split(":");
    if (parts.length < 2) return time24;
    let h = parseInt(parts[0], 10);
    if (isNaN(h)) return time24;
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${parts[1]} ${ampm}`;
  }

  function handleSaveReschedule(e) {
    e.preventDefault();
    if (!rescheduleTarget) return;
    const displayTime = formatTime12h(newTime);
    setAppointmentsList((prev) =>
      prev.map((a) =>
        a.id === rescheduleTarget.id
          ? { ...a, date: newDate, time: displayTime, status: "Confirmed" }
          : a
      )
    );
    setShowRescheduleModal(false);
    showToast(`Appointment rescheduled to ${newDate} at ${displayTime}`);
  }

  // Filtered Appointments
  const filteredAppointments = appointmentsList.filter((a) =>
    appointmentFilter === "All" ? true : a.status === appointmentFilter
  );

  return (
    <div className="space-y-6">
      {/* Toast Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex max-w-[calc(100vw-2.5rem)] items-center gap-3 rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-medium text-white shadow-2xl transition safe-bottom">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-emerald-500 text-xs text-white">✓</span>
          <span className="truncate">{toastMessage}</span>
        </div>
      )}

      {/* DYNAMIC MODULAR WORKSPACE CONTENT BASED ON SIDEBAR SELECTION */}
      <main className="space-y-6">
        {activeSideNav === "queue" && (
          <DoctorPatientQueueView
            filteredPatients={filteredPatients}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            sortBy={sortBy}
            setSortBy={setSortBy}
            riskFilter={riskFilter}
            setRiskFilter={setRiskFilter}
            currentPatient={currentPatient}
            setSelectedPatientId={setSelectedPatientId}
            handleTabChange={handleTabChange}
          />
        )}

        {activeSideNav === "select_patient" && (
          <DoctorSelectPatientView
            resolvedPatients={resolvedPatients}
            selectedPatientId={selectedPatientId}
            setSelectedPatientId={setSelectedPatientId}
            currentPatient={currentPatient}
            setShowPrescriptionModal={setShowPrescriptionModal}
            openPatientRecoveryTwin={openPatientRecoveryTwin}
            isAiLoading={isAiLoading}
            aiSummary={aiSummary}
            handleGenerateAiSummary={handleGenerateAiSummary}
            showToast={showToast}
            customPrescriptions={customPrescriptions}
            overrideLevel={overrideLevel}
            setOverrideLevel={setOverrideLevel}
            overrideNote={overrideNote}
            setOverrideNote={setOverrideNote}
            handleSaveRiskOverride={handleSaveRiskOverride}
            customMessages={customMessages}
            messageText={messageText}
            setMessageText={setMessageText}
            handleSendMessage={handleSendMessage}
          />
        )}

        {activeSideNav === "twin" && (
          <DoctorRecoveryTwinView
            currentPatient={currentPatient}
            openPatientRecoveryTwin={openPatientRecoveryTwin}
          />
        )}

        {activeSideNav === "ai_summary" && (
          <DoctorAiSummaryView
            currentPatient={currentPatient}
            isAiLoading={isAiLoading}
            aiSummary={aiSummary}
            handleGenerateAiSummary={handleGenerateAiSummary}
            showToast={showToast}
          />
        )}

        {activeSideNav === "prescribe" && (
          <DoctorPrescriptionView
            currentPatient={currentPatient}
            customPrescriptions={customPrescriptions}
            setShowPrescriptionModal={setShowPrescriptionModal}
          />
        )}

        {activeSideNav === "override" && (
          <DoctorRiskOverrideView
            overrideLevel={overrideLevel}
            setOverrideLevel={setOverrideLevel}
            overrideNote={overrideNote}
            setOverrideNote={setOverrideNote}
            handleSaveRiskOverride={handleSaveRiskOverride}
          />
        )}

        {activeSideNav === "appointments" && (
          <DoctorAppointmentsView
            filteredAppointments={filteredAppointments}
            appointmentFilter={appointmentFilter}
            setAppointmentFilter={setAppointmentFilter}
            handleAppointmentAction={handleAppointmentAction}
          />
        )}

        {activeSideNav === "emergency" && (
          <DoctorEmergencySosView
            sosNotes={sosNotes}
            setSosNotes={setSosNotes}
            handleResolveSos={handleResolveSos}
            handleTabChange={handleTabChange}
            showToast={showToast}
          />
        )}

        {activeSideNav === "messaging" && (
          <DoctorMessagingView
            currentPatient={currentPatient}
            customMessages={customMessages}
            messageText={messageText}
            setMessageText={setMessageText}
            handleSendMessage={handleSendMessage}
          />
        )}

        {activeSideNav === "settings" && (
          <DoctorSettingsView
            doctorProfile={doctorProfile}
            setDoctorProfile={setDoctorProfile}
            addAuditLog={() => {}}
            showToast={showToast}
          />
        )}
      </main>

      {/* MODAL: FULL RECOVERY TWIN DIALOG */}
      {showTwinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[90dvh] overflow-y-auto overscroll-contain rounded-3xl bg-surface p-6 shadow-2xl border border-line">
            <div className="flex items-start justify-between border-b border-line pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="font-display text-xl font-bold text-ink">
                    Digital Recovery Twin — {currentPatient?.name}
                  </h3>
                  <Pill tone="teal">Live Telemetry Sync</Pill>
                </div>
                <p className="mt-1 text-xs text-ink-soft">
                  Patient ID: #{currentPatient?.id} · Age: {currentPatient?.age} yrs · Condition: {currentPatient?.condition}
                </p>
              </div>

              <button
                onClick={() => setShowTwinModal(false)}
                aria-label="Close modal"
                className="grid size-10 shrink-0 place-items-center rounded-xl border border-line text-ink-soft transition hover:bg-surface-soft hover:text-ink"
              >
                <Icon name="x" className="size-4.5" />
              </button>
            </div>

            {/* Recovery Twin Body Details */}
            <div className="mt-5 space-y-5 text-xs">
              {/* Organ Systems Health Radar */}
              <div>
                <h4 className="font-display font-semibold text-ink text-sm">Organ & Physiological System Status</h4>
                <div className="grid gap-3 sm:grid-cols-2 mt-2">
                  <div className="rounded-2xl border border-line bg-surface-soft p-3.5 space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span className="text-ink">Cardiovascular Stability</span>
                      <span className="text-emerald-600">94% (Stable)</span>
                    </div>
                    <ProgressBar value={94} tone="low" />
                  </div>

                  <div className="rounded-2xl border border-line bg-surface-soft p-3.5 space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span className="text-ink">Pulmonary Gas Exchange</span>
                      <span className="text-emerald-600">91% (Normal)</span>
                    </div>
                    <ProgressBar value={91} tone="low" />
                  </div>

                  <div className="rounded-2xl border border-line bg-surface-soft p-3.5 space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span className="text-ink">Renal Filtration Index</span>
                      <span className="text-emerald-600">88% (Normal)</span>
                    </div>
                    <ProgressBar value={88} tone="low" />
                  </div>

                  <div className="rounded-2xl border border-line bg-surface-soft p-3.5 space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span className="text-ink">Glycemic Control</span>
                      <span className="text-amber-600">82% (Monitored)</span>
                    </div>
                    <ProgressBar value={82} tone="med" />
                  </div>
                </div>
              </div>

              {/* Bio-Telemetry Grid */}
              <div>
                <h4 className="font-display font-semibold text-ink text-sm">Biometric Telemetry Stream</h4>
                <div className="grid gap-3 sm:grid-cols-4 mt-2">
                  <div className="rounded-2xl border border-line bg-surface-soft p-3.5">
                    <p className="text-ink-faint">Blood Pressure</p>
                    <p className="mt-1 font-display text-lg font-bold text-ink">132/85 mmHg</p>
                    <p className="text-[11px] text-emerald-600">✓ Target range</p>
                  </div>
                  <div className="rounded-2xl border border-line bg-surface-soft p-3.5">
                    <p className="text-ink-faint">Heart Rate</p>
                    <p className="mt-1 font-display text-lg font-bold text-ink">74 bpm</p>
                    <p className="text-[11px] text-emerald-600">✓ Normal rhythm</p>
                  </div>
                  <div className="rounded-2xl border border-line bg-surface-soft p-3.5">
                    <p className="text-ink-faint">SpO2 Level</p>
                    <p className="mt-1 font-display text-lg font-bold text-ink">98%</p>
                    <p className="text-[11px] text-emerald-600">✓ Optimal saturation</p>
                  </div>
                  <div className="rounded-2xl border border-line bg-surface-soft p-3.5">
                    <p className="text-ink-faint">Med Adherence</p>
                    <p className="mt-1 font-display text-lg font-bold text-brand">
                      {Math.max(48, 95 - Math.round((currentPatient?.risk || 20) * 0.5))}%
                    </p>
                    <p className="text-[11px] text-ink-soft">14-day compliance</p>
                  </div>
                </div>
              </div>

              {/* Post-Discharge Trajectory */}
              <div className="rounded-2xl border border-line bg-surface-soft p-4 space-y-2">
                <h4 className="font-display font-semibold text-ink">Sentinel Readmission Risk Prognosis</h4>
                <div className="flex items-center justify-between">
                  <span className="text-ink-soft">Model Predicted Risk Score:</span>
                  <span className="font-display text-lg font-bold text-ink">{currentPatient?.risk}%</span>
                </div>
                <ProgressBar value={currentPatient?.risk || 20} tone={currentPatient?.level === "High" ? "high" : currentPatient?.level === "Moderate" ? "med" : "low"} />
                <p className="text-ink-soft leading-relaxed">
                  The AURA Sentinel Twin continuous telemetry predicts post-discharge stability based on vitals trend and medication adherence.
                </p>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              <button
                onClick={() => {
                  exportPatientTelemetryPdf(currentPatient, doctorProfile);
                  showToast(`Telemetry PDF generated and downloaded for ${currentPatient?.name}`);
                }}
                className="flex items-center gap-1.5 rounded-xl border border-line bg-surface px-4 py-2 text-xs font-semibold text-ink hover:bg-surface-soft"
              >
                <Icon name="file" className="size-3.5" />
                Export Telemetry Report (PDF)
              </button>

              <button
                onClick={() => setShowTwinModal(false)}
                className="rounded-xl bg-brand px-5 py-2 text-xs font-semibold text-white hover:opacity-90"
              >
                Close Dialog
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NEW PRESCRIPTION */}
      {showPrescriptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md max-h-[90dvh] overflow-y-auto overscroll-contain rounded-2xl bg-surface p-6 shadow-xl border border-line">
            <h3 className="font-display text-lg font-bold text-ink">Issue Digital Prescription</h3>
            <p className="text-xs text-ink-soft">Digitally signed & sent to patient device</p>

            <form onSubmit={handleAddPrescription} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-ink">Select Patient</label>
                <select
                  value={prescriptionForm.patientId || currentPatient?.id}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, patientId: e.target.value })}
                  className="mt-1 w-full max-w-full min-w-0 truncate rounded-xl border border-line bg-surface px-3 py-2 text-ink focus:border-brand focus:outline-none"
                >
                  {resolvedPatients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (#{p.id}) - {p.condition}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-ink">Drug Name</label>
                <input
                  type="text"
                  required
                  value={prescriptionForm.drug}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, drug: e.target.value })}
                  placeholder="e.g. Metformin, Amlodipine, Atorvastatin"
                  className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-ink focus:border-brand focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-ink">Dosage</label>
                  <input
                    type="text"
                    required
                    value={prescriptionForm.dosage}
                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, dosage: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-ink focus:border-brand focus:outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-ink">Frequency</label>
                  <select
                    value={prescriptionForm.frequency}
                    onChange={(e) => setPrescriptionForm({ ...prescriptionForm, frequency: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-ink focus:border-brand focus:outline-none"
                  >
                    <option>Once Daily (OD)</option>
                    <option>Twice Daily (BID)</option>
                    <option>Thrice Daily (TID)</option>
                    <option>As Needed (PRN)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-ink">Duration</label>
                <input
                  type="text"
                  value={prescriptionForm.duration}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, duration: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-ink focus:border-brand focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-ink">Special Instructions</label>
                <textarea
                  rows={2}
                  value={prescriptionForm.instructions}
                  onChange={(e) => setPrescriptionForm({ ...prescriptionForm, instructions: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-ink focus:border-brand focus:outline-none"
                />
              </div>

              <div className="mt-5 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPrescriptionModal(false)}
                  className="rounded-xl border border-line px-4 py-2 font-semibold text-ink-soft hover:bg-surface-soft"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-brand px-4 py-2 font-semibold text-white hover:opacity-90"
                >
                  Digitally Sign & Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RESCHEDULE APPOINTMENT */}
      {showRescheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md max-h-[90dvh] overflow-y-auto overscroll-contain rounded-2xl bg-surface p-6 shadow-xl border border-line">
            <h3 className="font-display text-lg font-bold text-ink">Reschedule Visit</h3>
            <p className="text-xs text-ink-soft">{rescheduleTarget?.title}</p>

            <form onSubmit={handleSaveReschedule} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-semibold text-ink">New Visit Date</label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-ink focus:border-brand focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-ink">New Time Slot</label>
                <input
                  type="time"
                  required
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-ink focus:border-brand focus:outline-none"
                />
              </div>

              <div className="mt-5 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRescheduleModal(false)}
                  className="rounded-xl border border-line px-4 py-2 font-semibold text-ink-soft hover:bg-surface-soft"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-brand px-4 py-2 font-semibold text-white hover:opacity-90"
                >
                  Save & Notify Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EMERGENCY SOS TRIAGE */}
      {sosModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg max-h-[90dvh] overflow-y-auto overscroll-contain rounded-2xl bg-surface p-6 shadow-xl border border-red-500/40">
            <div className="flex items-center gap-2 text-red-600">
              <Icon name="alert" className="size-5" />
              <h3 className="font-display text-lg font-bold">Emergency SOS Triage Response</h3>
            </div>
            <p className="mt-1 text-xs text-ink-soft">
              Patient Rukmini Devi triggered SOS signal. Immediate response requested.
            </p>

            <div className="mt-3 rounded-xl border border-red-200 bg-red-50/50 p-3 text-xs dark:bg-red-950/20 space-y-1">
              <p className="font-bold text-red-900 dark:text-red-300">Emergency Patient Profile:</p>
              <p className="text-ink-soft">• Blood Group: O+ | Age: 67 | Condition: Type-2 Diabetes</p>
              <p className="text-ink-soft">• Active Meds: Metformin 500mg, Amlodipine 5mg</p>
              <p className="text-ink-soft">• Emergency Contact (Son): Aarav Sharma (+91 98765 43210)</p>
            </div>

            <div className="mt-3">
              <label className="text-xs font-semibold text-ink">Emergency Response Notes</label>
              <textarea
                rows={2}
                placeholder="Enter triage details or dispatch instructions..."
                value={sosNotes}
                onChange={(e) => setSosNotes(e.target.value)}
                className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs text-ink focus:border-brand focus:outline-none"
              />
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setSosModalOpen(false)}
                className="rounded-xl border border-line px-4 py-2 text-xs font-semibold text-ink-soft hover:bg-surface-soft"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleResolveSos}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-red-700"
              >
                Acknowledge & Dispatch Emergency Care
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
