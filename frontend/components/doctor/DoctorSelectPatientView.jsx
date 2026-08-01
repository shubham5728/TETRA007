"use client";

import { useState } from "react";
import { Card, CardTitle, Pill, RiskPill, ProgressBar } from "@/components/ui";
import { Icon } from "@/components/Icons";
import { setViewingPatientId } from "@/lib/api";

import DoctorRecoveryTwinView from "@/components/doctor/DoctorRecoveryTwinView";
import DoctorAiSummaryView from "@/components/doctor/DoctorAiSummaryView";
import DoctorPrescriptionView from "@/components/doctor/DoctorPrescriptionView";
import DoctorRiskOverrideView from "@/components/doctor/DoctorRiskOverrideView";
import DoctorMessagingView from "@/components/doctor/DoctorMessagingView";

const RISK_TONE = { High: "high", Moderate: "med", Low: "low" };

export default function DoctorSelectPatientView({
  resolvedPatients,
  selectedPatientId,
  setSelectedPatientId,
  currentPatient,
  setShowPrescriptionModal,
  // Sub-view props
  openPatientRecoveryTwin,
  isAiLoading,
  aiSummary,
  handleGenerateAiSummary,
  showToast,
  customPrescriptions,
  overrideLevel,
  setOverrideLevel,
  overrideNote,
  setOverrideNote,
  handleSaveRiskOverride,
  customMessages,
  messageText,
  setMessageText,
  handleSendMessage,
}) {
  const [patientSubTab, setPatientSubTab] = useState("overview");
  const activePatient = currentPatient || resolvedPatients[0];

  function handleSelect(id) {
    const numId = Number(id);
    setSelectedPatientId(numId);
    setViewingPatientId(numId);
  }

  if (!activePatient) {
    return (
      <Card>
        <p className="py-8 text-center text-xs text-ink-faint">No patients available in roster.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Patient Selector & Sub-Menu Header Card */}
      <Card>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <CardTitle
            eyebrow="Patient Selection & Clinical Profile"
            title={`Patient Clinical Insights — ${activePatient.name}`}
            hint="Select a patient from the dropdown to view and edit their full clinical records, twin, and prescriptions"
          />

          <div className="flex items-center gap-3">
            <label htmlFor="patient-select" className="text-xs font-semibold text-ink-soft whitespace-nowrap">
              Active Patient:
            </label>
            <select
              id="patient-select"
              value={activePatient.id}
              onChange={(e) => handleSelect(e.target.value)}
              className="rounded-xl border border-brand/40 bg-surface px-4 py-2.5 text-xs font-bold text-ink shadow-sm focus:border-brand focus:outline-none"
            >
              {resolvedPatients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.age} yrs) — {p.risk}% Risk ({p.level})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Patient Sub-Navigation Tabs */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5 border-t border-line pt-4">
          {[
            { id: "overview", label: "Overview & Vitals", icon: "activity" },
            { id: "twin", label: "Recovery Twin", icon: "brain" },
            { id: "ai_summary", label: "AI Clinical Summary", icon: "sparkle" },
            { id: "prescribe", label: "Prescription Builder", icon: "pill" },
            { id: "override", label: "Risk Override", icon: "shield" },
            { id: "messaging", label: "Direct Messaging", icon: "chat" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPatientSubTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                patientSubTab === tab.id
                  ? "bg-brand text-white shadow-sm"
                  : "border border-line bg-surface text-ink-soft hover:bg-surface-soft hover:text-ink"
              }`}
            >
              <Icon name={tab.icon} className="size-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {/* DYNAMIC CONTENT AREA BASED ON SELECTED PATIENT SUB-TAB */}
      {patientSubTab === "overview" && (
        <div className="grid gap-5 lg:grid-cols-3">
          {/* Left Column: Demographics & Sentinel Risk */}
          <div className="space-y-5 lg:col-span-1">
            {/* Demographics Card */}
            <Card>
              <div className="flex items-start justify-between border-b border-line pb-4">
                <div className="flex items-center gap-3">
                  <div className="grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand font-bold text-lg">
                    {activePatient.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-ink">{activePatient.name}</h3>
                    <p className="text-xs text-ink-soft">
                      {activePatient.age} years old · {activePatient.condition}
                    </p>
                  </div>
                </div>
                <RiskPill level={activePatient.level} />
              </div>

              <div className="mt-4 space-y-2.5 text-xs">
                <div className="flex justify-between border-b border-line/50 pb-2">
                  <span className="text-ink-soft">Patient ID:</span>
                  <span className="font-semibold text-ink">#{activePatient.id}</span>
                </div>
                <div className="flex justify-between border-b border-line/50 pb-2">
                  <span className="text-ink-soft">Primary Condition:</span>
                  <span className="font-semibold text-ink">{activePatient.condition}</span>
                </div>
                <div className="flex justify-between border-b border-line/50 pb-2">
                  <span className="text-ink-soft">Blood Group:</span>
                  <span className="font-semibold text-ink">O+ (Rh Positive)</span>
                </div>
                <div className="flex justify-between border-b border-line/50 pb-2">
                  <span className="text-ink-soft">Last Check-in:</span>
                  <span className="font-semibold text-ink">{activePatient.last_check_in}</span>
                </div>
                <div className="flex justify-between border-b border-line/50 pb-2">
                  <span className="text-ink-soft">Attending Clinician:</span>
                  <span className="font-semibold text-ink">Dr. Ananya Arora</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-soft">Emergency Contact:</span>
                  <span className="font-semibold text-brand">+91 98765 43210</span>
                </div>
              </div>
            </Card>

            {/* Sentinel AI Risk Score Card */}
            <Card>
              <CardTitle
                eyebrow="AURA Sentinel Model"
                title="Readmission Risk Assessment"
                hint="Predicted by XGBoost Sentinel model based on clinical telemetry"
              />

              <div className="mt-4 rounded-2xl border border-line bg-surface-soft p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink-soft">Readmission Risk Score</span>
                  <span className="font-display text-2xl font-bold text-ink">{activePatient.risk}%</span>
                </div>

                <ProgressBar value={activePatient.risk} tone={RISK_TONE[activePatient.level]} />

                <p className="text-xs text-ink-soft leading-relaxed">
                  {activePatient.level === "High"
                    ? "🔴 Elevated risk detected due to medication non-compliance and blood pressure variations."
                    : activePatient.level === "Moderate"
                    ? "🟡 Moderate risk monitor indicated. Routine follow-up scheduled."
                    : "🟢 Stable prognosis with strong medication adherence."}
                </p>
              </div>
            </Card>
          </div>

          {/* Right Column: Bio-Telemetry, Regimen & Shortcuts */}
          <div className="space-y-5 lg:col-span-2">
            {/* Bio-Telemetry Stream Grid */}
            <Card>
              <CardTitle
                eyebrow="Real-Time Telemetry"
                title="Vitals Stream & Adherence Metrics"
                hint="Continuous monitoring telemetry from patient home vitals"
              />

              <div className="grid gap-3 sm:grid-cols-3 mt-4">
                <div className="rounded-2xl border border-line bg-surface-soft p-4">
                  <p className="text-xs text-ink-faint">Blood Pressure</p>
                  <p className="mt-1 font-display text-xl font-bold text-ink">
                    132 / 85 <span className="text-xs font-normal text-ink-soft">mmHg</span>
                  </p>
                  <p className="mt-1 text-[11px] text-emerald-600">✓ Target range</p>
                </div>

                <div className="rounded-2xl border border-line bg-surface-soft p-4">
                  <p className="text-xs text-ink-faint">Heart Rate & SpO2</p>
                  <p className="mt-1 font-display text-xl font-bold text-ink">
                    74 <span className="text-xs font-normal text-ink-soft">bpm</span> / 98%
                  </p>
                  <p className="mt-1 text-[11px] text-emerald-600">✓ Stable oxygen</p>
                </div>

                <div className="rounded-2xl border border-line bg-surface-soft p-4">
                  <p className="text-xs text-ink-faint">Medication Adherence</p>
                  <p className="mt-1 font-display text-xl font-bold text-brand">
                    {Math.max(48, 95 - Math.round(activePatient.risk * 0.5))}%
                  </p>
                  <p className="mt-1 text-[11px] text-ink-soft">Past 14 days</p>
                </div>
              </div>
            </Card>

            {/* Active Medication Regimen */}
            <Card>
              <CardTitle
                eyebrow="Prescribed Therapy"
                title="Active Medication Regimen"
                hint="Current active prescriptions issued for this patient"
              />

              <div className="space-y-2 text-xs mt-4">
                <div className="flex items-center justify-between rounded-xl border border-line p-3">
                  <div>
                    <p className="font-bold text-ink">Metformin 500mg</p>
                    <p className="text-ink-soft">Schedule: Twice Daily (BID) after meals</p>
                  </div>
                  <Pill tone="mint">Compliant</Pill>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-line p-3">
                  <div>
                    <p className="font-bold text-ink">Amlodipine 5mg</p>
                    <p className="text-ink-soft">Schedule: Once Daily (OD) morning</p>
                  </div>
                  <Pill tone="mint">Compliant</Pill>
                </div>
              </div>
            </Card>


          </div>
        </div>
      )}

      {patientSubTab === "twin" && (
        <DoctorRecoveryTwinView
          currentPatient={activePatient}
          openPatientRecoveryTwin={openPatientRecoveryTwin}
        />
      )}

      {patientSubTab === "ai_summary" && (
        <DoctorAiSummaryView
          currentPatient={activePatient}
          isAiLoading={isAiLoading}
          aiSummary={aiSummary}
          handleGenerateAiSummary={handleGenerateAiSummary}
          showToast={showToast}
        />
      )}

      {patientSubTab === "prescribe" && (
        <DoctorPrescriptionView
          currentPatient={activePatient}
          customPrescriptions={customPrescriptions}
          setShowPrescriptionModal={setShowPrescriptionModal}
        />
      )}

      {patientSubTab === "override" && (
        <DoctorRiskOverrideView
          overrideLevel={overrideLevel}
          setOverrideLevel={setOverrideLevel}
          overrideNote={overrideNote}
          setOverrideNote={setOverrideNote}
          handleSaveRiskOverride={handleSaveRiskOverride}
        />
      )}

      {patientSubTab === "messaging" && (
        <DoctorMessagingView
          currentPatient={activePatient}
          customMessages={customMessages}
          messageText={messageText}
          setMessageText={setMessageText}
          handleSendMessage={handleSendMessage}
        />
      )}
    </div>
  );
}
