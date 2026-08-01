"use client";

import { Card, CardTitle } from "@/components/ui";

export default function DoctorSettingsView({
  doctorProfile,
  setDoctorProfile,
  addAuditLog,
  showToast,
}) {
  return (
    <Card>
      <CardTitle
        eyebrow="Doctor Profile & Settings"
        title="Doctor Credentials & Consultation Settings"
        hint="Manage your medical registration details, consultation hours, and Sentinel risk sensitivity thresholds"
      />

      <div className="grid gap-4 sm:grid-cols-2 text-xs max-w-xl">
        <div>
          <label className="font-semibold text-ink">Doctor Full Name</label>
          <input
            type="text"
            value={doctorProfile.name}
            onChange={(e) => setDoctorProfile({ ...doctorProfile, name: e.target.value })}
            className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-ink focus:border-brand focus:outline-none"
          />
        </div>

        <div>
          <label className="font-semibold text-ink">Medical Reg. Number (MCI)</label>
          <input
            type="text"
            value={doctorProfile.mciNumber}
            onChange={(e) => setDoctorProfile({ ...doctorProfile, mciNumber: e.target.value })}
            className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-ink focus:border-brand focus:outline-none"
          />
        </div>

        <div>
          <label className="font-semibold text-ink">Specialisation</label>
          <input
            type="text"
            value={doctorProfile.specialisation}
            onChange={(e) => setDoctorProfile({ ...doctorProfile, specialisation: e.target.value })}
            className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-ink focus:border-brand focus:outline-none"
          />
        </div>

        <div>
          <label className="font-semibold text-ink">Hospital / Clinic Affiliation</label>
          <input
            type="text"
            value={doctorProfile.hospital}
            onChange={(e) => setDoctorProfile({ ...doctorProfile, hospital: e.target.value })}
            className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-ink focus:border-brand focus:outline-none"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="font-semibold text-ink">Weekly Consultation Hours</label>
          <input
            type="text"
            value={doctorProfile.consultationHours}
            onChange={(e) => setDoctorProfile({ ...doctorProfile, consultationHours: e.target.value })}
            className="mt-1 w-full rounded-xl border border-line bg-surface px-3 py-2 text-ink focus:border-brand focus:outline-none"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="font-semibold text-ink">Sentinel Risk Sensitivity Threshold ({doctorProfile.riskSensitivity}%)</label>
          <input
            type="range"
            min="50"
            max="90"
            value={doctorProfile.riskSensitivity}
            onChange={(e) => setDoctorProfile({ ...doctorProfile, riskSensitivity: Number(e.target.value) })}
            className="mt-2 w-full accent-brand"
          />
        </div>
      </div>

      <div className="mt-5">
        <button
          onClick={() => {
            addAuditLog("Doctor Profile Updated", "Updated registration details and alert thresholds");
            showToast("Doctor Profile settings saved successfully!");
          }}
          className="rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:opacity-90"
        >
          Save Profile Settings
        </button>
      </div>
    </Card>
  );
}
