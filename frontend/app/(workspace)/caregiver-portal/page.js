import { RecoveryRing } from "@/components/charts";
import { Icon } from "@/components/Icons";
import { Card, CardTitle, Eyebrow, Pill, ProgressBar, RiskPill } from "@/components/ui";
import {
  appointments,
  caregiverAlerts,
  medications,
  patient,
  recoveryTwin,
} from "@/lib/data";

export const metadata = { title: "Caregiver Portal | AURA CareLink" };

export default function CaregiverPortalPage() {
  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-5">
            <RecoveryRing value={recoveryTwin.score} idSuffix="-care" size={120} />
            <div>
              <Eyebrow>Caring for</Eyebrow>
              <h2 className="mt-1.5 font-display text-xl font-semibold text-ink">
                {patient.name}
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                {patient.age} · {patient.diagnosis}
              </p>
              <div className="mt-3">
                <RiskPill level={recoveryTwin.riskLevel} />
              </div>
            </div>
          </div>

          <div className="flex-1 rounded-2xl bg-mint p-5 sm:ml-2">
            <p className="flex items-center gap-2 font-display text-sm font-semibold text-mint-ink">
              <Icon name="check" className="size-4" />
              Recovery is going well
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-mint-ink/80">
              {recoveryTwin.summary}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <Card>
          <CardTitle
            eyebrow="Needs your attention"
            title="Alerts"
            hint="You are told the moment something is missed."
          />
          <ul className="space-y-3">
            {caregiverAlerts.map((alert) => (
              <li
                key={alert.title}
                className={`flex gap-3 rounded-2xl border p-4 ${
                  alert.severity === "warning"
                    ? "border-risk-med/20 bg-risk-med/5"
                    : "border-line"
                }`}
              >
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-xl ${
                    alert.severity === "warning"
                      ? "bg-risk-med/15 text-risk-med"
                      : "bg-brand-soft text-brand"
                  }`}
                >
                  <Icon
                    name={alert.severity === "warning" ? "alert" : "bell"}
                    className="size-4.5"
                  />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{alert.title}</p>
                  <p className="mt-0.5 text-xs text-ink-soft">{alert.detail}</p>
                  <p className="mt-1 text-xs text-ink-faint">{alert.time}</p>
                </div>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-risk-high px-4 py-3.5 font-display text-sm font-semibold text-white transition hover:opacity-90"
          >
            <Icon name="alert" className="size-4.5" />
            Emergency SOS — call care team
          </button>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardTitle eyebrow="Today" title="Medicine reminders" />
            <ul className="divide-y divide-line">
              {medications.map((med) => (
                <li key={med.name} className="flex items-center gap-3 py-3">
                  <span
                    className={`grid size-9 shrink-0 place-items-center rounded-xl ${
                      med.taken ? "bg-mint text-mint-ink" : "bg-risk-med/10 text-risk-med"
                    }`}
                  >
                    <Icon name={med.taken ? "check" : "clock"} className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">{med.name}</p>
                    <p className="truncate text-xs text-ink-soft">{med.schedule}</p>
                  </div>
                  <Pill tone={med.taken ? "mint" : "neutral"}>
                    {med.taken ? "Taken" : "Pending"}
                  </Pill>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <div className="mb-1.5 flex items-baseline justify-between">
                <p className="text-sm text-ink-soft">This week&apos;s adherence</p>
                <p className="text-sm font-semibold text-ink">
                  {recoveryTwin.medicationAdherence}%
                </p>
              </div>
              <ProgressBar value={recoveryTwin.medicationAdherence} tone="low" />
            </div>
          </Card>

          <Card>
            <CardTitle eyebrow="Coming up" title="Appointments" />
            <ul className="space-y-3">
              {appointments.slice(0, 3).map((appointment) => (
                <li
                  key={appointment.title}
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
                      {appointment.date} · {appointment.time}
                    </p>
                  </div>
                  <Pill tone={appointment.status === "Confirmed" ? "mint" : "neutral"}>
                    {appointment.status}
                  </Pill>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
