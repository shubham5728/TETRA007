"use client";

import { Card, CardTitle, Pill } from "@/components/ui";

const STATUS_TONE = {
  Confirmed: "mint",
  Rejected: "coral",
  Upcoming: "amber",
  Completed: "neutral",
};

export default function DoctorAppointmentsView({
  filteredAppointments,
  appointmentFilter,
  setAppointmentFilter,
  handleAppointmentAction,
}) {
  return (
    <Card>
      <div className="flex flex-col justify-between gap-4 border-b border-line pb-4 sm:flex-row sm:items-center">
        <CardTitle
          eyebrow="Appointment & Visit Management"
          title="In-Person & Home Visit Oversight"
          hint="Confirm, reschedule, or reject clinic visits and home checkups"
        />

        <div className="flex rounded-xl border border-line bg-surface p-1">
          {["All", "Upcoming", "Confirmed", "Rejected", "Completed"].map((st) => (
            <button
              key={st}
              onClick={() => setAppointmentFilter(st)}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                appointmentFilter === st
                  ? "bg-brand text-white shadow-sm"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3 mt-4">
        {filteredAppointments.length === 0 ? (
          <p className="py-8 text-center text-xs text-ink-faint">
            No appointments found for the selected filter.
          </p>
        ) : (
          filteredAppointments.map((apt) => (
            <div
              key={apt.id}
              className="flex flex-col justify-between gap-3 rounded-2xl border border-line p-4 sm:flex-row sm:items-center text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-bold text-ink text-sm">{apt.title}</p>
                  <Pill tone="teal">{apt.mode}</Pill>
                  <Pill tone={STATUS_TONE[apt.status] || "neutral"}>{apt.status}</Pill>
                </div>
                <p className="mt-1 text-ink-soft">
                  Patient: <span className="font-medium text-ink">{apt.patientName}</span> · Attending: {apt.doctor}
                </p>
                <p className="text-ink-faint">Scheduled: {apt.date} at {apt.time}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleAppointmentAction(apt.id, "confirm")}
                  disabled={apt.status === "Confirmed"}
                  className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                >
                  Confirm
                </button>
                <button
                  onClick={() => handleAppointmentAction(apt.id, "reschedule")}
                  className="rounded-lg border border-line bg-surface px-3.5 py-1.5 text-xs font-semibold text-ink transition hover:bg-surface-soft"
                >
                  Reschedule
                </button>
                <button
                  onClick={() => handleAppointmentAction(apt.id, "reject")}
                  disabled={apt.status === "Rejected"}
                  className="rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-600 hover:text-white disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
