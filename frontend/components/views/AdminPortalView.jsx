"use client";

import { ErrorState, Loading } from "@/components/DataStates";
import { Icon } from "@/components/Icons";
import { Card, CardTitle, ProgressBar, StatTile } from "@/components/ui";
import { useApi } from "@/lib/useApi";

export default function AdminPortalView() {
  const patients = useApi("/api/doctor/patients");
  const model = useApi("/api/sentinel/model");

  const sources = [patients, model];
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

  const rows = patients.data;
  const highRisk = rows.filter((row) => row.level === "High").length;
  const moderate = rows.filter((row) => row.level === "Moderate").length;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Total Monitored" value={rows.length} icon="users" />
        <StatTile label="High Risk Patients" value={highRisk} icon="alert" />
        <StatTile label="Moderate Risk" value={moderate} icon="activity" />
        <StatTile
          label="Low Risk"
          value={rows.length - highRisk - moderate}
          icon="check"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardTitle
            eyebrow="AURA Sentinel Model"
            title="Risk Prediction Engine"
            hint="Live model metrics for the hospital."
          />
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-faint">Version</dt>
              <dd className="font-medium text-ink">{model.data.version}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-faint">Readmission AUC</dt>
              <dd className="font-medium text-ink">{model.data.readmission_auc}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-faint">Relapse AUC</dt>
              <dd className="font-medium text-ink">{model.data.relapse_auc}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink-faint">Training rows</dt>
              <dd className="font-medium text-ink">
                {model.data.cohort_size.toLocaleString("en-IN")}
              </dd>
            </div>
          </dl>
          <p className="mt-4 rounded-xl bg-surface-soft px-3 py-2.5 text-xs leading-relaxed text-ink-soft">
            These metrics show how accurately the Sentinel engine is predicting
            readmissions and relapses based on historical hospital data.
          </p>
        </Card>

        <Card>
          <CardTitle eyebrow="Hospital Overview" title="Why Administrators Need This" />
          <ul className="space-y-3">
            {[
              {
                icon: "chart",
                title: "Resource Allocation",
                detail: "Know how many patients are high risk to allocate follow-up nurses.",
              },
              {
                icon: "radar",
                title: "Predictive Insights",
                detail: "Identify trends in readmissions before they happen.",
              },
              {
                icon: "hospital",
                title: "Quality of Care",
                detail: "Track aggregate recovery scores to improve hospital protocols.",
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

      <Card>
        <CardTitle
          eyebrow="Hospital Operations"
          title="Administrative Tools"
          hint="Quick actions for hospital management."
        />
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <button className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-line p-6 text-center transition hover:border-brand/40 hover:bg-surface-soft">
            <Icon name="users" className="size-8 text-ink-soft" />
            <span className="font-semibold text-ink">Manage Users</span>
            <span className="text-xs text-ink-faint">Add doctors and staff</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-line p-6 text-center transition hover:border-brand/40 hover:bg-surface-soft">
            <Icon name="settings" className="size-8 text-ink-soft" />
            <span className="font-semibold text-ink">Configuration</span>
            <span className="text-xs text-ink-faint">Edit alert thresholds</span>
          </button>
          <button className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-line p-6 text-center transition hover:border-brand/40 hover:bg-surface-soft">
            <Icon name="file" className="size-8 text-ink-soft" />
            <span className="font-semibold text-ink">Export Reports</span>
            <span className="text-xs text-ink-faint">Download CSV analytics</span>
          </button>
        </div>
      </Card>
    </div>
  );
}
