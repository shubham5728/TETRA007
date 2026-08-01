"use client";

import { useState } from "react";
import { RecoveryRing } from "@/components/charts";
import { ErrorState, Loading } from "@/components/DataStates";
import { Icon } from "@/components/Icons";
import MedicationList from "@/components/MedicationList";
import { Card, CardTitle, Eyebrow, Pill, ProgressBar, RiskPill } from "@/components/ui";
import { api } from "@/lib/api";
import { formatDate, timeAgo } from "@/lib/format";
import { useApi } from "@/lib/useApi";

export default function CaregiverPortalView() {
  const twin = useApi("/api/recovery-twin");
  const alerts = useApi("/api/patient/alerts");
  const medications = useApi("/api/patient/medications");
  const appointments = useApi("/api/patient/appointments");
  const [ackId, setAckId] = useState(null);

  const sources = [twin, alerts, medications, appointments];
  const loading = sources.some((source) => source.loading);
  const error = sources.find((source) => source.error)?.error;

  if (loading) return <Loading rows={3} />;
  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={() => sources.forEach((source) => source.reload())}
      />
    );
  }

  const patient = twin.data.patient;
  const open = alerts.data.filter((alert) => !alert.acknowledged);

  async function acknowledge(alert) {
    setAckId(alert.id);
    try {
      await api.post(`/api/patient/alerts/${alert.id}/ack`, {});
      await alerts.reload();
    } finally {
      setAckId(null);
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-5">
            <RecoveryRing value={twin.data.score} idSuffix="-care" size={120} />
            <div>
              <Eyebrow>Caring for</Eyebrow>
              <h2 className="mt-1.5 font-display text-xl font-semibold text-ink">
                {patient.name}
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                {patient.age} · {patient.diagnosis}
              </p>
              <div className="mt-3">
                <RiskPill level={twin.data.risk_level} />
              </div>
            </div>
          </div>

          <div
            className={`flex-1 rounded-2xl p-5 sm:ml-2 ${
              twin.data.risk_level === "High" ? "bg-risk-high/5" : "bg-mint"
            }`}
          >
            <p
              className={`flex items-center gap-2 font-display text-sm font-semibold ${
                twin.data.risk_level === "High" ? "text-risk-high" : "text-mint-ink"
              }`}
            >
              <Icon
                name={twin.data.risk_level === "High" ? "alert" : "check"}
                className="size-4"
              />
              {twin.data.risk_level === "High"
                ? "Needs attention today"
                : "Recovery is going well"}
            </p>
            <p
              className={`mt-1.5 text-sm leading-relaxed ${
                twin.data.risk_level === "High" ? "text-ink-soft" : "text-mint-ink/80"
              }`}
            >
              {twin.data.summary}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <Card>
          <CardTitle
            eyebrow="Needs your attention"
            title="Alerts"
            hint={
              open.length
                ? `${open.length} not yet acknowledged.`
                : "Everything has been acknowledged."
            }
          />
          {alerts.data.length ? (
            <ul className="space-y-3">
              {alerts.data.map((alert) => (
                <li
                  key={alert.id}
                  className={`flex gap-3 rounded-2xl border p-4 ${
                    alert.acknowledged
                      ? "border-line opacity-60"
                      : alert.severity === "critical"
                        ? "border-risk-high/25 bg-risk-high/5"
                        : alert.severity === "warning"
                          ? "border-risk-med/20 bg-risk-med/5"
                          : "border-line"
                  }`}
                >
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-xl ${
                      alert.severity === "critical"
                        ? "bg-risk-high/15 text-risk-high"
                        : alert.severity === "warning"
                          ? "bg-risk-med/15 text-risk-med"
                          : "bg-brand-soft text-brand"
                    }`}
                  >
                    <Icon
                      name={alert.severity === "info" ? "bell" : "alert"}
                      className="size-4.5"
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{alert.title}</p>
                    <p className="mt-0.5 text-xs text-ink-soft">{alert.detail}</p>
                    <p className="mt-1 text-xs text-ink-faint">
                      {timeAgo(alert.created_at)}
                    </p>
                  </div>
                  {alert.acknowledged ? (
                    <Pill tone="mint">Seen</Pill>
                  ) : (
                    <button
                      type="button"
                      onClick={() => acknowledge(alert)}
                      disabled={ackId === alert.id}
                      className="shrink-0 self-start rounded-lg border border-line bg-surface px-3.5 py-2 text-xs font-semibold text-ink-soft transition hover:text-ink disabled:opacity-50 touch-target min-h-[38px]"
                    >
                      {ackId === alert.id ? "…" : "Mark seen"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-soft">No alerts right now.</p>
          )}

          <button
            type="button"
            className="mt-5 flex w-full min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-risk-high px-4 py-3.5 font-display text-sm font-semibold text-white transition hover:opacity-90 shadow-md active:scale-[0.99]"
          >
            <Icon name="alert" className="size-4.5" />
            Emergency SOS — call care team
          </button>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardTitle
              eyebrow="Today"
              title="Medicine reminders"
              hint="Tap to mark a dose taken on the patient's behalf."
            />
            <MedicationList
              medications={medications.data}
              onChange={() => Promise.all([medications.reload(), twin.reload()])}
              showPlain={false}
            />
            <div className="mt-4">
              <div className="mb-1.5 flex items-baseline justify-between">
                <p className="text-sm text-ink-soft">This week&apos;s adherence</p>
                <p className="text-sm font-semibold text-ink">
                  {twin.data.medication_adherence}%
                </p>
              </div>
              <ProgressBar
                value={twin.data.medication_adherence}
                tone={twin.data.medication_adherence >= 85 ? "low" : "med"}
              />
            </div>
          </Card>

          <Card>
            <CardTitle eyebrow="Coming up" title="Appointments" />
            {appointments.data.length ? (
              <ul className="space-y-3">
                {appointments.data.slice(0, 3).map((appointment) => (
                  <li
                    key={appointment.id}
                    className="flex items-center gap-3 rounded-2xl border border-line p-3.5"
                  >
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                      <Icon name="calendar" className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {appointment.title}
                      </p>
                      <p className="truncate text-xs text-ink-soft">
                        {formatDate(appointment.scheduled_for)} · {appointment.time_label}
                      </p>
                    </div>
                    <Pill tone={appointment.status === "Confirmed" ? "mint" : "neutral"}>
                      {appointment.status}
                    </Pill>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-soft">Nothing scheduled.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
