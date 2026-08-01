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
  medications,
  patient,
  recoveryHistory,
  recoveryTwin,
  symptoms,
  vitals,
} from "@/lib/data";

export const metadata = { title: "Recovery Twin | AURA CareLink" };

const inputs = [
  { label: "Symptoms", icon: "alert", detail: "Logged daily by the patient" },
  { label: "Medicines", icon: "pill", detail: "Marked as taken or missed" },
  { label: "Vitals", icon: "activity", detail: "Manual entry or wearable" },
  { label: "Activity", icon: "chart", detail: "Step count and rest" },
  { label: "Follow-ups", icon: "calendar", detail: "Attended or missed" },
  { label: "History", icon: "file", detail: "Discharge summary and reports" },
];

export default function RecoveryTwinPage() {
  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-col gap-7 lg:flex-row lg:items-center">
          <div className="flex items-center gap-6">
            <RecoveryRing value={recoveryTwin.score} idSuffix="-twin" />
            <div>
              <Eyebrow>Recovery Twin™</Eyebrow>
              <h2 className="mt-1.5 font-display text-xl font-semibold text-ink sm:text-2xl">
                {patient.name}
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                {patient.age} · {patient.gender} · {patient.diagnosis}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <RiskPill level={recoveryTwin.riskLevel} />
                <Pill>Day {recoveryTwin.daysSinceDischarge} after discharge</Pill>
              </div>
            </div>
          </div>

          <div className="flex-1 rounded-2xl bg-surface-soft p-5 lg:ml-4">
            <p className="text-sm leading-relaxed text-ink-soft">
              {recoveryTwin.summary}
            </p>
            <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-faint">Discharged</dt>
                <dd className="font-medium text-ink">{patient.dischargedOn}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-faint">Hospital</dt>
                <dd className="truncate font-medium text-ink">{patient.hospital}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-faint">Lives in</dt>
                <dd className="font-medium text-ink">{patient.village}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-faint">Care team</dt>
                <dd className="font-medium text-ink">{patient.careTeam}</dd>
              </div>
            </dl>
          </div>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <CardTitle
            eyebrow="Since discharge"
            title="How the score moved"
            hint="The twin is rebuilt every night from that day's data."
          />
          <Sparkline
            data={recoveryHistory}
            className="h-36 w-full"
            idSuffix="-twin"
          />
          <div className="mt-4 grid grid-cols-3 gap-3">
            <StatTile label="Today" value={recoveryTwin.score} unit="%" tone="soft" />
            <StatTile
              label="This week"
              value={`+${recoveryTwin.scoreChange}`}
              unit="pts"
              tone="soft"
            />
            <StatTile label="Symptom load" value={recoveryTwin.symptomLoad} tone="soft" />
          </div>
        </Card>

        <Card>
          <CardTitle
            eyebrow="Inputs"
            title="What the twin reads"
            hint="Six signals feed the profile."
          />
          <ul className="grid gap-3 sm:grid-cols-2">
            {inputs.map((input) => (
              <li
                key={input.label}
                className="flex items-start gap-3 rounded-2xl border border-line p-3.5"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                  <Icon name={input.icon} className="size-4.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{input.label}</p>
                  <p className="text-xs text-ink-soft">{input.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardTitle eyebrow="Adherence" title="Medicines" />
          <ul className="space-y-4">
            {medications.map((med) => (
              <li key={med.name}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3">
                  <p className="text-sm font-medium text-ink">
                    {med.name} <span className="text-ink-faint">· {med.dose}</span>
                  </p>
                  <p className="text-xs text-ink-faint">{med.schedule}</p>
                </div>
                <ProgressBar
                  value={med.adherence}
                  tone={med.adherence >= 85 ? "low" : "med"}
                  showValue
                />
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardTitle eyebrow="Logged by the patient" title="Symptoms" />
          <ul className="divide-y divide-line">
            {symptoms.map((symptom) => (
              <li key={symptom.name} className="flex items-center gap-3 py-3">
                <span
                  className={`grid size-9 shrink-0 place-items-center rounded-xl ${
                    symptom.level === "None"
                      ? "bg-mint text-mint-ink"
                      : "bg-risk-med/10 text-risk-med"
                  }`}
                >
                  <Icon
                    name={symptom.level === "None" ? "check" : "alert"}
                    className="size-4"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{symptom.name}</p>
                  <p className="text-xs text-ink-faint">{symptom.loggedOn}</p>
                </div>
                <Pill tone={symptom.level === "None" ? "mint" : "neutral"}>
                  {symptom.level}
                </Pill>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <CardTitle eyebrow="Latest readings" title="Vitals" />
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
