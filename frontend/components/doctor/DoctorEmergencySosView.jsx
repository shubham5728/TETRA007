"use client";

import { Card, CardTitle } from "@/components/ui";
import { Icon } from "@/components/Icons";

export default function DoctorEmergencySosView({
  sosNotes,
  setSosNotes,
  handleResolveSos,
  handleTabChange,
  showToast,
}) {
  return (
    <Card>
      <CardTitle
        eyebrow="Emergency SOS Alert Triage & Response"
        title="Emergency Triage & Ambulance Dispatch Center"
        hint="Real-time emergency signal processing with location coordinates and clinical payload"
      />

      <div className="rounded-2xl border border-red-500/40 bg-red-50/50 p-5 dark:bg-red-950/20 space-y-4">
        <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
          <Icon name="alert" className="size-5" />
          <span>ACTIVE SOS SIGNAL DETECTED</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 text-xs">
          <div className="space-y-1">
            <p className="font-bold text-ink">Patient Data Payload:</p>
            <p className="text-ink-soft">• Name: Rukmini Devi (67 y/o)</p>
            <p className="text-ink-soft">• Blood Group: O+ | Diagnosis: Type-2 Diabetes</p>
            <p className="text-ink-soft">• Active Meds: Metformin 500mg, Amlodipine 5mg</p>
          </div>

          <div className="space-y-1">
            <p className="font-bold text-ink">Location & Emergency Contacts:</p>
            <p className="text-ink-soft">• GPS Location: Rural Sector 4 HQ (Coord: 9.9252, 78.1198)</p>
            <p className="text-ink-soft">• Caregiver (Son): Aarav Sharma (+91 98765 43210)</p>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-ink">Emergency Triage Notes</label>
          <textarea
            rows={2}
            placeholder="Enter dispatch instructions or clinical notes..."
            value={sosNotes}
            onChange={(e) => setSosNotes(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs text-ink focus:border-brand focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            onClick={handleResolveSos}
            className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-red-700"
          >
            Acknowledge & Dispatch Ambulance Care
          </button>
          <button
            onClick={() => {
              handleTabChange("messaging");
              showToast("Opened Direct Messaging thread with Caregiver");
            }}
            className="rounded-xl border border-line bg-surface px-4 py-2 text-xs font-semibold text-ink hover:bg-surface-soft"
          >
            Contact Caregiver Directly
          </button>
        </div>
      </div>
    </Card>
  );
}
