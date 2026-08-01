"use client";

import { Card, CardTitle } from "@/components/ui";
import { Icon } from "@/components/Icons";

export default function DoctorRecoveryTwinView({
  currentPatient,
  openPatientRecoveryTwin,
}) {
  return (
    <Card>
      <CardTitle
        eyebrow="Patient Record & Recovery Twin Deep-Dive"
        title={`Digital Recovery Twin — ${currentPatient?.name}`}
        hint="Real-time vitals stream, medication adherence, and recovery metrics"
        action={
          <button
            onClick={() => openPatientRecoveryTwin(currentPatient?.id)}
            className="flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            Full Recovery Twin Page
            <Icon name="arrowRight" className="size-3.5" />
          </button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3 mt-4">
        <div className="rounded-2xl border border-line bg-surface-soft p-4">
          <p className="text-xs text-ink-faint">Blood Pressure Vitals Stream</p>
          <p className="mt-1 font-display text-2xl font-bold text-ink">
            132 / 85 <span className="text-xs font-normal text-ink-soft">mmHg</span>
          </p>
          <p className="mt-1 text-xs text-emerald-600">✓ Vitals within target range</p>
        </div>

        <div className="rounded-2xl border border-line bg-surface-soft p-4">
          <p className="text-xs text-ink-faint">Heart Rate & Oxygen SpO2</p>
          <p className="mt-1 font-display text-2xl font-bold text-ink">
            74 <span className="text-xs font-normal text-ink-soft">bpm</span> / 98<span className="text-xs font-normal text-ink-soft">%</span>
          </p>
          <p className="mt-1 text-xs text-emerald-600">✓ Stable oxygen saturation</p>
        </div>

        <div className="rounded-2xl border border-line bg-surface-soft p-4">
          <p className="text-xs text-ink-faint">Medication Adherence Score</p>
          <p className="mt-1 font-display text-2xl font-bold text-brand">
            {Math.max(48, 95 - Math.round((currentPatient?.risk || 20) * 0.5))}%
          </p>
          <p className="mt-1 text-xs text-ink-soft">Tracked over past 14 days</p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-line p-5 space-y-3">
        <h4 className="font-display font-semibold text-ink">Active Medication Regimen</h4>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between rounded-xl border border-line p-3">
            <div>
              <p className="font-bold text-ink">Metformin 500mg</p>
              <p className="text-ink-soft">Schedule: Twice Daily (BID) after meals</p>
            </div>
            <span className="rounded bg-emerald-100 px-2 py-1 font-semibold text-emerald-800">Compliant</span>
          </div>
          <div className="flex justify-between rounded-xl border border-line p-3">
            <div>
              <p className="font-bold text-ink">Amlodipine 5mg</p>
              <p className="text-ink-soft">Schedule: Once Daily (OD) morning</p>
            </div>
            <span className="rounded bg-emerald-100 px-2 py-1 font-semibold text-emerald-800">Compliant</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
