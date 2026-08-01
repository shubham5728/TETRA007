"use client";

import { useRouter } from "next/navigation";
import { ErrorState, Loading } from "@/components/DataStates";
import { Icon } from "@/components/Icons";
import { Card, CardTitle, ProgressBar, RiskPill, StatTile } from "@/components/ui";
import { setViewingPatientId } from "@/lib/api";
import { useApi } from "@/lib/useApi";

const RISK_TONE = { High: "high", Moderate: "med", Low: "low" };

export default function DoctorPortalView() {
  const router = useRouter();
  const patients = useApi("/api/doctor/patients");

  if (patients.loading) return <Loading rows={3} />;
  if (patients.error) {
    return <ErrorState error={patients.error} onRetry={patients.reload} />;
  }

  const rows = patients.data;
  const highRisk = rows.filter((row) => row.level === "High").length;
  const moderate = rows.filter((row) => row.level === "Moderate").length;
  const worst = rows[0];

  /** Open a patient's Recovery Twin in the same workspace. */
  function openPatient(id) {
    setViewingPatientId(id);
    router.push("/recovery-twin");
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Patients monitored" value={rows.length} icon="users" />
        <StatTile label="High risk today" value={highRisk} icon="alert" />
        <StatTile label="Moderate risk" value={moderate} icon="activity" />
        <StatTile
          label="Low risk"
          value={rows.length - highRisk - moderate}
          icon="check"
        />
      </div>

      <Card>
        <CardTitle
          eyebrow="Sorted by risk"
          title="High-risk patients come first"
          hint="Scores come from the Sentinel models. Select a row to open the record."
        />

        {/* Table on desktop */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs font-semibold uppercase tracking-wide text-ink-faint">
                <th className="pb-3 pr-4">Patient</th>
                <th className="pb-3 pr-4">Condition</th>
                <th className="pb-3 pr-4">Readmission risk</th>
                <th className="pb-3 pr-4">Level</th>
                <th className="pb-3">Last scored</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => openPatient(row.id)}
                  className="cursor-pointer transition hover:bg-surface-soft"
                >
                  <td className="py-3.5 pr-4">
                    <p className="font-medium text-ink">{row.name}</p>
                    <p className="text-xs text-ink-faint">{row.age} years</p>
                  </td>
                  <td className="py-3.5 pr-4 text-ink-soft">{row.condition}</td>
                  <td className="py-3.5 pr-4">
                    <div className="flex w-44 items-center gap-3">
                      <ProgressBar value={row.risk} tone={RISK_TONE[row.level]} />
                      <span className="w-9 text-right text-xs font-semibold text-ink">
                        {row.risk}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 pr-4">
                    <RiskPill level={row.level} />
                  </td>
                  <td className="py-3.5 text-ink-soft">{row.last_check_in}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Cards on mobile */}
        <ul className="space-y-3 md:hidden">
          {rows.map((row) => (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => openPatient(row.id)}
                className="w-full rounded-2xl border border-line p-4 text-left transition hover:bg-surface-soft"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{row.name}</p>
                    <p className="text-xs text-ink-soft">
                      {row.age} years · {row.condition}
                    </p>
                  </div>
                  <RiskPill level={row.level} />
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <ProgressBar value={row.risk} tone={RISK_TONE[row.level]} />
                  <span className="w-9 text-right text-xs font-semibold text-ink">
                    {row.risk}%
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardTitle eyebrow="Needs attention" title={worst.name} />
          <div
            className={`rounded-2xl border p-4 ${
              worst.level === "High"
                ? "border-risk-high/20 bg-risk-high/5"
                : "border-line"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <p
                className={`font-display text-3xl font-bold ${
                  worst.level === "High" ? "text-risk-high" : "text-ink"
                }`}
              >
                {worst.risk}%
              </p>
              <RiskPill level={worst.level} />
            </div>
            <p className="mt-2 text-sm text-ink-soft">
              {worst.age} years · {worst.condition}. Last scored {worst.last_check_in}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openPatient(worst.id)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Open recovery record
            <Icon name="arrowRight" className="size-4" />
          </button>
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
