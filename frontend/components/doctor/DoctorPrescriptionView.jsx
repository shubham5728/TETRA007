"use client";

import { Card, CardTitle } from "@/components/ui";
import { Icon } from "@/components/Icons";

export default function DoctorPrescriptionView({
  currentPatient,
  customPrescriptions,
  setShowPrescriptionModal,
}) {
  return (
    <Card>
      <CardTitle
        eyebrow="Interactive Digital Prescription Builder"
        title="Prescription Regimen Management"
        hint="Issue digitally signed prescriptions directly to patient and caregiver mobile devices"
        action={
          <button
            onClick={() => setShowPrescriptionModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            <Icon name="plus" className="size-3.5" />
            Issue New Prescription
          </button>
        }
      />

      <div className="space-y-3 mt-4">
        <h4 className="font-display font-semibold text-xs text-ink">Issued Prescription History — {currentPatient?.name}</h4>
        {(customPrescriptions[currentPatient?.id] || []).map((rx) => (
          <div key={rx.id} className="rounded-2xl border border-brand/30 bg-brand-soft/20 p-4 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-bold text-brand">{rx.drug} ({rx.dosage})</p>
              <span className="rounded bg-brand px-2.5 py-0.5 text-[10px] font-bold text-white">Digitally Signed</span>
            </div>
            <p className="text-ink-soft">Frequency: {rx.frequency} · Duration: {rx.duration}</p>
            <p className="text-ink-soft">Instructions: {rx.instructions}</p>
            <p className="text-[10px] text-ink-faint pt-1 border-t border-line">{rx.signature} · Issued on {rx.date}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
