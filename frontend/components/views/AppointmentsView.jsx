"use client";

import { ErrorState, Loading } from "@/components/DataStates";
import { Icon } from "@/components/Icons";
import { Card, CardTitle, Pill, StatTile } from "@/components/ui";
import { formatDate } from "@/lib/format";
import { useApi } from "@/lib/useApi";

const MODE_ICON = {
  "In person": "hospital",
  "Home visit": "users",
  "Video call": "chat",
  Lab: "file",
};

const STATUS_TONE = {
  Confirmed: "mint",
  Pending: "neutral",
  Missed: "neutral",
};

export default function AppointmentsView() {
  const appointments = useApi("/api/patient/appointments");
  const patient = useApi("/api/patient");

  const sources = [appointments, patient];
  const loading = sources.some((source) => source.loading);
  const error = sources.find((source) => source.error)?.error;

  if (loading) return <Loading rows={2} />;
  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={() => sources.forEach((source) => source.reload())}
      />
    );
  }

  const rows = appointments.data;
  const confirmed = rows.filter((row) => row.status === "Confirmed").length;
  const missed = rows.filter((row) => row.attended === false).length;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Scheduled" value={rows.length} icon="calendar" />
        <StatTile label="Confirmed" value={confirmed} icon="check" />
        <StatTile label="Missed" value={missed} icon="alert" />
      </div>

      <Card>
        <CardTitle
          eyebrow="Follow-up plan"
          title="Appointments"
          hint={`${patient.data.name} · care team ${patient.data.care_team}`}
        />

        {rows.length ? (
          <ul className="space-y-3">
            {rows.map((appointment) => (
              <li
                key={appointment.id}
                className={`flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center ${
                  appointment.attended === false
                    ? "border-risk-high/25 bg-risk-high/5"
                    : "border-line"
                }`}
              >
                <div className="flex w-full items-center gap-4 sm:w-auto sm:flex-1">
                  <span
                    className={`grid size-12 shrink-0 place-items-center rounded-2xl ${
                      appointment.attended === false
                        ? "bg-risk-high/10 text-risk-high"
                        : "bg-brand-soft text-brand"
                    }`}
                  >
                    <Icon
                      name={MODE_ICON[appointment.mode] ?? "calendar"}
                      className="size-5"
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="font-display font-semibold text-ink">
                      {appointment.title}
                    </p>
                    <p className="truncate text-sm text-ink-soft">
                      {appointment.doctor}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                  <Pill>
                    <Icon name="calendar" className="size-3.5" />
                    {formatDate(appointment.scheduled_for)}
                  </Pill>
                  <Pill>
                    <Icon name="clock" className="size-3.5" />
                    {appointment.time_label}
                  </Pill>
                  <Pill tone="teal">{appointment.mode}</Pill>
                  <Pill tone={STATUS_TONE[appointment.status] ?? "neutral"}>
                    {appointment.status}
                  </Pill>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-ink-soft">No appointments scheduled.</p>
        )}
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardTitle eyebrow="Why it matters" title="Missed follow-ups raise risk" />
          <p className="text-sm leading-relaxed text-ink-soft">
            A missed follow-up is one of the strongest signals the Sentinel
            Engine watches. When a visit is skipped, the readmission score goes
            up and the caregiver is reminded the same day.
          </p>
          <ul className="mt-4 space-y-2.5">
            {[
              "Reminder sent 2 days before",
              "Second reminder on the morning of the visit",
              "Caregiver told if the visit is missed",
              "Sentinel recalculates risk the same night",
            ].map((step, index) => (
              <li key={step} className="flex items-center gap-3 text-sm text-ink-soft">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-soft text-xs font-bold text-brand">
                  {index + 1}
                </span>
                {step}
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardTitle eyebrow="Rural support" title="When travel is hard" />
          <ul className="space-y-3">
            {[
              {
                icon: "users",
                title: "ASHA worker home visit",
                detail: "A health worker comes to the village instead.",
              },
              {
                icon: "chat",
                title: "Video consultation",
                detail: "Works on a low-bandwidth connection.",
              },
              {
                icon: "wifiOff",
                title: "Offline booking",
                detail: "Requests queue up and send when the network returns.",
              },
            ].map((item) => (
              <li key={item.title} className="flex gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-teal-soft text-teal">
                  <Icon name={item.icon} className="size-4.5" />
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">{item.title}</p>
                  <p className="text-xs text-ink-soft">{item.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
