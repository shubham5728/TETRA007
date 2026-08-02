"use client";

import { RecoveryRing, Sparkline } from "@/components/charts";
import { ErrorState, Loading } from "@/components/DataStates";
import Hero from "@/components/Hero";
import { Icon } from "@/components/Icons";
import MedicationList from "@/components/MedicationList";
import {
  Card,
  CardTitle,
  Eyebrow,
  Pill,
  RiskPill,
  StatTile,
} from "@/components/ui";
import { api } from "@/lib/api";
import { formatDate, timeAgo } from "@/lib/format";
import { useApi } from "@/lib/useApi";
import LimitWarningBanner from "@/components/LimitWarningBanner";

export default function DashboardView() {
  const twin = useApi("/api/recovery-twin");
  const sentinel = useApi("/api/sentinel");
  const medications = useApi("/api/patient/medications");
  const alerts = useApi("/api/patient/alerts");
  const appointments = useApi("/api/patient/appointments");
  const vitals = useApi("/api/patient/vitals");
  const subscription = useApi("/api/payments/my-subscription");

  const sources = [twin, sentinel, medications, alerts, appointments, vitals];
  const loading = sources.some((source) => source.loading);
  const error = sources.find((source) => source.error)?.error;

  if (loading) return <Loading rows={4} />;
  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={() => sources.forEach((source) => source.reload())}
      />
    );
  }

  const nextAppointment = appointments.data?.[0];

  async function refreshAfterDose() {
    await Promise.all([medications.reload(), twin.reload(), sentinel.reload()]);
  }

  return (
    <div className="space-y-5">
      <LimitWarningBanner
        warnings={subscription.data?.warnings}
        hasWarning={subscription.data?.has_80_percent_warning}
      />
      <Hero imageSrc="/images/hero-care.png" />

      {/* ---------------- Live Recovery Twin ---------------- */}
      <Card>
        <div className="flex flex-col gap-7 lg:flex-row lg:items-center">
          <div className="flex items-center gap-6">
            <RecoveryRing value={twin.data.score} idSuffix="-dash" />
            <div>
              <Eyebrow>Live Recovery Twin™</Eyebrow>
              <h2 className="mt-1.5 font-display text-xl font-semibold text-ink sm:text-2xl">
                {twin.data.patient.name}
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
                {twin.data.summary}
              </p>
            </div>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-5 border-t border-line pt-5 sm:grid-cols-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
            <div>
              <p className="text-xs font-medium text-ink-faint">Change</p>
              <p
                className={`mt-1.5 font-display text-lg font-semibold ${
                  twin.data.score_change >= 0 ? "text-risk-low" : "text-risk-high"
                }`}
              >
                {twin.data.score_change >= 0 ? "+" : ""}
                {twin.data.score_change} pts
              </p>
              <p className="text-xs text-ink-faint">this week</p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-faint">Risk</p>
              <div className="mt-1.5">
                <RiskPill level={twin.data.risk_level} />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-faint">Medication</p>
              <p className="mt-1.5 font-display text-lg font-semibold text-ink">
                {twin.data.medication_adherence}%
              </p>
              <p className="text-xs text-ink-faint">doses taken</p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-faint">Symptoms</p>
              <p className="mt-1.5 font-display text-lg font-semibold text-ink">
                {twin.data.symptom_load}
              </p>
              <p className="text-xs text-ink-faint">
                day {twin.data.days_since_discharge} after discharge
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* ---------------- Trend + Sentinel ---------------- */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardTitle
            eyebrow="Since discharge"
            title="Recovery score trend"
            hint="Rebuilt every time the engine re-scores this patient."
          />
          <Sparkline
            data={twin.data.history}
            className="h-28 w-full"
            idSuffix="-dash"
          />
          <div className="mt-3 flex justify-between text-xs text-ink-faint">
            <span>Discharge day</span>
            <span>Today</span>
          </div>
        </Card>

        <Card>
          <CardTitle
            eyebrow="AURA Sentinel™"
            title="Risk right now"
            hint={`Last checked ${timeAgo(sentinel.data.last_run)}.`}
            action={<RiskPill level={sentinel.data.risk_level} />}
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile
              label="Readmission"
              value={sentinel.data.readmission_risk}
              unit="%"
              tone="soft"
              icon="hospital"
            />
            <StatTile
              label="Relapse"
              value={sentinel.data.relapse_risk}
              unit="%"
              tone="soft"
              icon="alert"
            />
            <StatTile
              label="Recovery"
              value={sentinel.data.recovery_score}
              unit="%"
              tone="soft"
              icon="chart"
            />
          </div>
          <p className="mt-4 rounded-2xl bg-brand-soft px-4 py-3 text-sm text-brand">
            {sentinel.data.recommendation}
          </p>
        </Card>
      </div>

      {/* ---------------- Medicines + side column ---------------- */}
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardTitle
            eyebrow="Today"
            title="Medicines"
            hint="Tap a dose to mark it taken — the risk score updates with it."
          />
          <MedicationList
            medications={medications.data}
            onChange={refreshAfterDose}
          />
        </Card>

        <div className="space-y-5">
          <Card>
            <CardTitle eyebrow="Next visit" title="Upcoming appointment" />
            {nextAppointment ? (
              <div className="rounded-2xl bg-surface-soft p-4">
                <p className="font-display font-semibold text-ink">
                  {nextAppointment.title}
                </p>
                <p className="mt-1 text-sm text-ink-soft">{nextAppointment.doctor}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Pill tone="brand">
                    <Icon name="calendar" className="size-3.5" />
                    {formatDate(nextAppointment.scheduled_for)}
                  </Pill>
                  <Pill>
                    <Icon name="clock" className="size-3.5" />
                    {nextAppointment.time_label}
                  </Pill>
                  <Pill tone="mint">{nextAppointment.mode}</Pill>
                </div>
              </div>
            ) : (
              <p className="text-sm text-ink-soft">No appointments scheduled.</p>
            )}
          </Card>

          <Card>
            <CardTitle eyebrow="Escalation" title="Recent alerts" />
            {alerts.data.length ? (
              <ul className="space-y-3">
                {alerts.data.slice(0, 4).map((alert) => (
                  <li key={alert.id} className="flex gap-3">
                    <span
                      className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg ${
                        alert.severity === "critical"
                          ? "bg-risk-high/10 text-risk-high"
                          : alert.severity === "warning"
                            ? "bg-risk-med/10 text-risk-med"
                            : "bg-brand-soft text-brand"
                      }`}
                    >
                      <Icon
                        name={alert.severity === "info" ? "bell" : "alert"}
                        className="size-4"
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">{alert.title}</p>
                      <p className="text-xs text-ink-soft">{alert.detail}</p>
                      <p className="mt-0.5 text-xs text-ink-faint">
                        {timeAgo(alert.created_at)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-soft">No alerts right now.</p>
            )}
          </Card>
        </div>
      </div>

      {/* ---------------- Vitals ---------------- */}
      <Card>
        <CardTitle
          eyebrow="Latest readings"
          title="Vitals"
          hint={`${twin.data.patient.name} · discharged ${formatDate(
            twin.data.patient.discharged_on,
          )}`}
        />
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {vitals.data.map((vital) => (
            <StatTile
              key={vital.id}
              label={vital.label}
              value={vital.value}
              unit={vital.unit}
              tone="soft"
            />
          ))}
        </div>
      </Card>
    </div>
  );
}
