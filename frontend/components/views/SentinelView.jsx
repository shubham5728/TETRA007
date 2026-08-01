"use client";

import { useState } from "react";
import { FactorBar, RecoveryRing } from "@/components/charts";
import { ErrorState, Loading } from "@/components/DataStates";
import { Icon } from "@/components/Icons";
import { Card, CardTitle, Eyebrow, Pill, RiskPill, StatTile } from "@/components/ui";
import { api } from "@/lib/api";
import { timeAgo } from "@/lib/format";
import { useApi } from "@/lib/useApi";

export default function SentinelView() {
  const sentinel = useApi("/api/sentinel");
  const model = useApi("/api/sentinel/model");
  const alerts = useApi("/api/patient/alerts");
  const [rescoring, setRescoring] = useState(false);

  const sources = [sentinel, model, alerts];
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

  const data = sentinel.data;
  const raising = data.factors.filter((factor) => factor.direction === "up");
  const lowering = data.factors.filter((factor) => factor.direction === "down");
  const criticalAlerts = alerts.data.filter((alert) => alert.severity === "critical");

  async function rescore() {
    setRescoring(true);
    try {
      await api.post("/api/sentinel/run", {});
      await Promise.all([sentinel.reload(), alerts.reload()]);
    } finally {
      setRescoring(false);
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Eyebrow>AURA Sentinel Engine™</Eyebrow>
            <h2 className="mt-1.5 font-display text-xl font-semibold text-ink sm:text-2xl">
              Predicting risk before it becomes an emergency
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
              The engine reads the Recovery Twin and scores three things: the
              chance of going back to hospital, the chance of an early relapse,
              and how well recovery is going overall.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            <RiskPill level={data.risk_level} />
            <Pill>
              <span className="size-1.5 animate-pulse rounded-full bg-risk-low" />
              Last run {timeAgo(data.last_run)}
            </Pill>
            <button
              type="button"
              onClick={rescore}
              disabled={rescoring}
              className="rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {rescoring ? "Re-scoring…" : "Re-score now"}
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <StatTile
            label="Readmission risk"
            value={data.readmission_risk}
            unit="%"
            tone="soft"
            icon="hospital"
          />
          <StatTile
            label="Early relapse risk"
            value={data.relapse_risk}
            unit="%"
            tone="soft"
            icon="alert"
          />
          <StatTile
            label="Recovery score"
            value={data.recovery_score}
            unit="%"
            tone="soft"
            icon="chart"
          />
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardTitle
            eyebrow="Explainability"
            title="Why the score looks like this"
            hint="Each factor's share of the model's decision, from SHAP values."
          />

          {raising.length ? (
            <>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-risk-med">
                Raising the risk
              </p>
              <ul className="space-y-2.5">
                {raising.map((factor) => (
                  <FactorBar key={factor.name} {...factor} />
                ))}
              </ul>
            </>
          ) : null}

          {lowering.length ? (
            <>
              <p className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wide text-risk-low">
                Lowering the risk
              </p>
              <ul className="space-y-2.5">
                {lowering.map((factor) => (
                  <FactorBar key={factor.name} {...factor} />
                ))}
              </ul>
            </>
          ) : null}

          <p className="mt-6 rounded-2xl bg-brand-soft px-4 py-3 text-sm text-brand">
            {data.recommendation}
          </p>
        </Card>

        <Card>
          <CardTitle eyebrow="Model" title="Under the hood" />
          <div className="flex justify-center">
            <RecoveryRing
              value={Math.round(data.confidence * 100)}
              label="Model confidence"
              idSuffix="-sentinel"
              size={132}
            />
          </div>
          <p className="mt-2 text-center text-xs text-ink-faint">Model confidence</p>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-ink-faint">Version</dt>
              <dd className="font-medium text-ink">{data.model_version}</dd>
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
            Trained on a generated cohort, not real patient records. The pipeline
            and explanations are real; the training data is synthetic.
          </p>
        </Card>
      </div>

      <Card>
        <CardTitle
          eyebrow="Smart Escalation Engine"
          title="What happens when risk crosses the limit"
          hint="High risk raises an alert for the doctor and caregiver automatically."
        />
        <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-center">
          <div className="rounded-2xl border border-line p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Signals detected
            </p>
            <ul className="space-y-2">
              {(raising.length ? raising : data.factors).slice(0, 5).map((factor) => (
                <li
                  key={factor.name}
                  className="flex items-center gap-2 text-sm text-ink-soft"
                >
                  <Icon name="alert" className="size-4 shrink-0 text-risk-med" />
                  {factor.name}
                </li>
              ))}
            </ul>
          </div>

          <Icon
            name="chevron"
            className="mx-auto size-5 rotate-90 text-ink-faint lg:rotate-0"
          />

          <div
            className={`rounded-2xl border p-4 text-center ${
              data.risk_level === "High"
                ? "border-risk-high/20 bg-risk-high/5"
                : "border-line"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Risk calculated
            </p>
            <p
              className={`mt-2 font-display text-4xl font-bold ${
                data.risk_level === "High" ? "text-risk-high" : "text-ink"
              }`}
            >
              {data.readmission_risk}%
            </p>
            <p className="mt-1 text-xs text-ink-soft">Readmission risk</p>
          </div>

          <Icon
            name="chevron"
            className="mx-auto size-5 rotate-90 text-ink-faint lg:rotate-0"
          />

          <div className="rounded-2xl border border-line p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Actions triggered
            </p>
            {criticalAlerts.length ? (
              <ul className="space-y-2">
                {criticalAlerts.slice(0, 3).map((alert) => (
                  <li
                    key={alert.id}
                    className="flex items-start gap-2 text-sm text-ink-soft"
                  >
                    <Icon name="check" className="mt-0.5 size-4 shrink-0 text-risk-low" />
                    {alert.title}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-soft">
                Risk is below the escalation limit, so no alert was raised. The
                care team is not disturbed unnecessarily.
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
