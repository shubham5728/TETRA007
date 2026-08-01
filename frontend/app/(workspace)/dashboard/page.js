import Hero from "@/components/Hero";
import { RecoveryRing, Sparkline } from "@/components/charts";
import { Icon } from "@/components/Icons";
import {
  Card,
  CardTitle,
  Eyebrow,
  Pill,
  ProgressBar,
  RiskPill,
  StatTile,
} from "@/components/ui";
import {
  appointments,
  caregiverAlerts,
  medications,
  patient,
  recoveryHistory,
  recoveryTwin,
  sentinel,
  vitals,
} from "@/lib/data";

export const metadata = { title: "Dashboard | AURA CareLink" };

export default function DashboardPage() {
  const nextAppointment = appointments[0];

  return (
    <div className="space-y-5">
      {/* Drop a photo at /public/images/hero-care.jpg and pass it here to
          replace the gradient panel: <Hero imageSrc="/images/hero-care.jpg" /> */}
      <Hero />

      {/* ---------------- Live Recovery Twin ---------------- */}
      <Card>
        <div className="flex flex-col gap-7 lg:flex-row lg:items-center">
          <div className="flex items-center gap-6">
            <RecoveryRing value={recoveryTwin.score} idSuffix="-dash" />
            <div>
              <Eyebrow>Live Recovery Twin™</Eyebrow>
              <h2 className="mt-1.5 font-display text-xl font-semibold text-ink sm:text-2xl">
                Recovery is on track
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-soft">
                {recoveryTwin.summary}
              </p>
            </div>
          </div>

          <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-5 border-line sm:grid-cols-4 lg:border-l lg:pl-8">
            <div>
              <p className="text-xs font-medium text-ink-faint">Change</p>
              <p className="mt-1.5 font-display text-lg font-semibold text-risk-low">
                +{recoveryTwin.scoreChange} pts
              </p>
              <p className="text-xs text-ink-faint">this week</p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-faint">Risk</p>
              <div className="mt-1.5">
                <RiskPill level={recoveryTwin.riskLevel} />
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-faint">Medication</p>
              <p className="mt-1.5 font-display text-lg font-semibold text-ink">
                {recoveryTwin.medicationAdherence}%
              </p>
              <p className="text-xs text-ink-faint">doses taken</p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-faint">Symptoms</p>
              <p className="mt-1.5 font-display text-lg font-semibold text-ink">
                {recoveryTwin.symptomLoad}
              </p>
              <p className="text-xs text-ink-faint">
                day {recoveryTwin.daysSinceDischarge} after discharge
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* ---------------- Trend + Sentinel ---------------- */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardTitle
            eyebrow="Last 14 days"
            title="Recovery score trend"
            hint="Rebuilt every night from that day's check-ins."
          />
          <Sparkline
            data={recoveryHistory}
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
            hint={`Last checked ${sentinel.lastRun}.`}
            action={<RiskPill level={sentinel.riskLevel} />}
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile
              label="Readmission"
              value={sentinel.readmissionRisk}
              unit="%"
              tone="soft"
              icon="hospital"
            />
            <StatTile
              label="Relapse"
              value={sentinel.relapseRisk}
              unit="%"
              tone="soft"
              icon="alert"
            />
            <StatTile
              label="Recovery"
              value={sentinel.recoveryScore}
              unit="%"
              tone="soft"
              icon="chart"
            />
          </div>
          <p className="mt-4 rounded-2xl bg-brand-soft px-4 py-3 text-sm text-brand">
            {sentinel.recommendation}
          </p>
        </Card>
      </div>

      {/* ---------------- Medicines + side column ---------------- */}
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardTitle
            eyebrow="Today"
            title="Medicines"
            hint="Written the way the patient reads them, not the way the report does."
          />
          <ul className="divide-y divide-line">
            {medications.map((med) => (
              <li key={med.name} className="flex items-center gap-4 py-3.5">
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                    med.taken
                      ? "bg-mint text-mint-ink"
                      : "bg-risk-med/10 text-risk-med"
                  }`}
                >
                  <Icon name={med.taken ? "check" : "clock"} className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-ink">
                    {med.name}{" "}
                    <span className="text-ink-faint">· {med.dose}</span>
                  </p>
                  <p className="truncate text-sm text-ink-soft">{med.plain}</p>
                </div>
                <div className="hidden w-28 shrink-0 sm:block">
                  <ProgressBar
                    value={med.adherence}
                    tone={med.adherence >= 85 ? "low" : "med"}
                    showValue
                  />
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardTitle eyebrow="Next visit" title="Upcoming appointment" />
            <div className="rounded-2xl bg-surface-soft p-4">
              <p className="font-display font-semibold text-ink">
                {nextAppointment.title}
              </p>
              <p className="mt-1 text-sm text-ink-soft">{nextAppointment.doctor}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Pill tone="brand">
                  <Icon name="calendar" className="size-3.5" />
                  {nextAppointment.date}
                </Pill>
                <Pill>
                  <Icon name="clock" className="size-3.5" />
                  {nextAppointment.time}
                </Pill>
                <Pill tone="mint">{nextAppointment.mode}</Pill>
              </div>
            </div>
          </Card>

          <Card>
            <CardTitle eyebrow="Escalation" title="Recent alerts" />
            <ul className="space-y-3">
              {caregiverAlerts.map((alert) => (
                <li key={alert.title} className="flex gap-3">
                  <span
                    className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg ${
                      alert.severity === "warning"
                        ? "bg-risk-med/10 text-risk-med"
                        : "bg-brand-soft text-brand"
                    }`}
                  >
                    <Icon
                      name={alert.severity === "warning" ? "alert" : "bell"}
                      className="size-4"
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{alert.title}</p>
                    <p className="text-xs text-ink-soft">{alert.detail}</p>
                    <p className="mt-0.5 text-xs text-ink-faint">{alert.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      {/* ---------------- Vitals ---------------- */}
      <Card>
        <CardTitle
          eyebrow="Latest readings"
          title="Vitals"
          hint={`${patient.name} · discharged ${patient.dischargedOn}`}
        />
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {vitals.map((vital) => (
            <StatTile
              key={vital.label}
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
