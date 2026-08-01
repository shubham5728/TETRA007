"use client";

import { Card, CardTitle } from "@/components/ui";
import { Icon } from "@/components/Icons";

export default function DoctorSoapNotesView({
  currentPatient,
  customSoapNotes,
  setShowSoapModal,
}) {
  return (
    <Card>
      <CardTitle
        eyebrow="SOAP Consultation Notes Management"
        title="Clinical SOAP Progress Notes"
        hint="Record Subjective, Objective, Assessment, and Plan notes for in-person & home visits"
        action={
          <button
            onClick={() => setShowSoapModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3.5 py-2 text-xs font-semibold text-ink transition hover:bg-surface-soft"
          >
            <Icon name="file" className="size-3.5 text-brand" />
            + Add SOAP Note
          </button>
        }
      />

      <div className="space-y-3 mt-4">
        {(customSoapNotes[currentPatient?.id] || []).map((note) => (
          <div key={note.id} className="rounded-2xl border border-line p-5 text-xs space-y-2 bg-surface">
            <div className="flex justify-between font-bold text-ink border-b border-line pb-2">
              <span>Clinical Consultation Note</span>
              <span className="text-ink-faint">{note.date}</span>
            </div>
            <p><strong className="text-ink">Subjective (S):</strong> {note.subjective}</p>
            <p><strong className="text-ink">Objective (O):</strong> {note.objective}</p>
            <p><strong className="text-ink">Assessment (A):</strong> {note.assessment}</p>
            <p><strong className="text-ink">Plan (P):</strong> {note.plan}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
