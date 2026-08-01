import { Icon } from "@/components/Icons";
import { Card, CardTitle, Pill, ProgressBar, RiskPill, StatTile } from "@/components/ui";
import { doctorPatients } from "@/lib/data";

export const metadata = { title: "Doctor Portal | AURA CareLink" };

const riskTone = { High: "high", Moderate: "med", Low: "low" };

export default function DoctorPortalPage() {
  const sorted = [...doctorPatients].sort((a, b) => b.risk - a.risk);
  const highRisk = sorted.filter((p) => p.level === "High").length;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Patients monitored" value={sorted.length} icon="users" />
        <StatTile label="High risk today" value={highRisk} icon="alert" />
        <StatTile label="Alerts this week" value={7} icon="bell" />
        <StatTile label="Follow-ups due" value={3} icon="calendar" />
      </div>

      <Card>
        <CardTitle
          eyebrow="Sorted by risk"
          title="High-risk patients come first"
          hint="The list reorders itself as Sentinel scores update."
          action={
            <Pill tone="brand">
              <Icon name="download" className="size-3.5" />
              Export
            </Pill>
          }
        />

        {/* Table on desktop */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs font-semibold uppercase tracking-wide text-ink-faint">
                <th className="pb-3 pr-4 font-semibold">Patient</th>
                <th className="pb-3 pr-4 font-semibold">Condition</th>
                <th className="pb-3 pr-4 font-semibold">Readmission risk</th>
                <th className="pb-3 pr-4 font-semibold">Level</th>
                <th className="pb-3 font-semibold">Last check-in</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {sorted.map((p) => (
                <tr key={p.name}>
                  <td className="py-3.5 pr-4">
                    <p className="font-medium text-ink">{p.name}</p>
                    <p className="text-xs text-ink-faint">{p.age} years</p>
                  </td>
                  <td className="py-3.5 pr-4 text-ink-soft">{p.condition}</td>
                  <td className="py-3.5 pr-4">
                    <div className="flex w-44 items-center gap-3">
                      <ProgressBar value={p.risk} tone={riskTone[p.level]} />
                      <span className="w-9 text-right text-xs font-semibold text-ink">
                        {p.risk}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 pr-4">
                    <RiskPill level={p.level} />
                  </td>
                  <td className="py-3.5 text-ink-soft">{p.lastCheckIn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cards on mobile */}
        <ul className="space-y-3 md:hidden">
          {sorted.map((p) => (
            <li key={p.name} className="rounded-2xl border border-line p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-ink">{p.name}</p>
                  <p className="text-xs text-ink-soft">
                    {p.age} years · {p.condition}
                  </p>
                </div>
                <RiskPill level={p.level} />
              </div>
              <div className="mt-3 flex items-center gap-3">
                <ProgressBar value={p.risk} tone={riskTone[p.level]} />
                <span className="w-9 text-right text-xs font-semibold text-ink">
                  {p.risk}%
                </span>
              </div>
              <p className="mt-2 text-xs text-ink-faint">
                Last check-in {p.lastCheckIn}
              </p>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardTitle eyebrow="Needs attention" title="Rukmini Devi" />
          <div className="rounded-2xl border border-risk-high/20 bg-risk-high/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-display text-3xl font-bold text-risk-high">89%</p>
              <RiskPill level="High" />
            </div>
            <p className="mt-2 text-sm text-ink-soft">
              Readmission risk crossed the safe limit 6 hours ago. Escalation has
              already notified the caregiver.
            </p>
          </div>
          <ul className="mt-4 space-y-2.5">
            {[
              "Missed 2 diuretic doses",
              "Weight up 2.1 kg in 3 days",
              "Reported breathlessness at night",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-ink-soft">
                <Icon name="alert" className="size-4 shrink-0 text-risk-high" />
                {item}
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardTitle eyebrow="Saves time" title="Why this helps doctors" />
          <ul className="space-y-3">
            {[
              {
                icon: "chart",
                title: "No manual chasing",
                detail: "The list surfaces who needs attention today.",
              },
              {
                icon: "bell",
                title: "Alerts, not inboxes",
                detail: "Only threshold breaches reach the doctor.",
              },
              {
                icon: "file",
                title: "Context on arrival",
                detail: "Full recovery history is one click away.",
              },
            ].map((item) => (
              <li key={item.title} className="flex gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
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
