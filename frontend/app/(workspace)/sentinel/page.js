import { FactorBar, RecoveryRing } from "@/components/charts";
import { Icon } from "@/components/Icons";
import { Card, CardTitle, Eyebrow, Pill, RiskPill, StatTile } from "@/components/ui";
import { escalationExample, sentinel } from "@/lib/data";

export const metadata = { title: "AURA Sentinel | AURA CareLink" };

export default function SentinelPage() {
  const raising = sentinel.factors.filter((f) => f.direction === "up");
  const lowering = sentinel.factors.filter((f) => f.direction === "down");

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
              The engine reads the Recovery Twin every night and scores three
              things: the chance of going back to hospital, the chance of an
              early relapse, and how well recovery is going overall.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
            <RiskPill level={sentinel.riskLevel} />
            <Pill>
              <span className="size-1.5 animate-pulse rounded-full bg-risk-low" />
              Last run {sentinel.lastRun}
            </Pill>
          </div>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <StatTile
            label="Readmission risk"
            value={sentinel.readmissionRisk}
            unit="%"
            tone="soft"
            icon="hospital"
          />
          <StatTile
            label="Early relapse risk"
            value={sentinel.relapseRisk}
            unit="%"
            tone="soft"
            icon="alert"
          />
          <StatTile
            label="Recovery score"
            value={sentinel.recoveryScore}
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
            hint="Every factor the model leaned on, and which way it pushed."
          />

          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-risk-med">
            Raising the risk
          </p>
          <ul className="space-y-2.5">
            {raising.map((factor) => (
              <FactorBar key={factor.name} {...factor} />
            ))}
          </ul>

          <p className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wide text-risk-low">
            Lowering the risk
          </p>
          <ul className="space-y-2.5">
            {lowering.map((factor) => (
              <FactorBar key={factor.name} {...factor} />
            ))}
          </ul>

          <p className="mt-6 rounded-2xl bg-brand-soft px-4 py-3 text-sm text-brand">
            {sentinel.recommendation}
          </p>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardTitle eyebrow="Model" title="Under the hood" />
            <RecoveryRing
              value={Math.round(sentinel.confidence * 100)}
              label="Model confidence"
              idSuffix="-sentinel"
              size={132}
            />
            <p className="mt-2 text-center text-xs text-ink-faint">Model confidence</p>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-faint">Version</dt>
                <dd className="font-medium text-ink">{sentinel.modelVersion}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-faint">Runs</dt>
                <dd className="font-medium text-ink">Nightly + on new data</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-faint">Inputs</dt>
                <dd className="font-medium text-ink">6 signal groups</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>

      <Card>
        <CardTitle
          eyebrow="Smart Escalation Engine"
          title="What happens when risk crosses the limit"
          hint="Worked example — this is the path an alert takes."
        />
        <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-center">
          <div className="rounded-2xl border border-line p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Signals detected
            </p>
            <ul className="space-y-2">
              {escalationExample.signals.map((signal) => (
                <li key={signal} className="flex items-center gap-2 text-sm text-ink-soft">
                  <Icon name="alert" className="size-4 shrink-0 text-risk-med" />
                  {signal}
                </li>
              ))}
            </ul>
          </div>

          <Icon
            name="chevron"
            className="mx-auto size-5 rotate-90 text-ink-faint lg:rotate-0"
          />

          <div className="rounded-2xl border border-risk-high/20 bg-risk-high/5 p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Risk calculated
            </p>
            <p className="mt-2 font-display text-4xl font-bold text-risk-high">
              {escalationExample.risk}%
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
            <ul className="space-y-2">
              {escalationExample.actions.map((action) => (
                <li key={action} className="flex items-center gap-2 text-sm text-ink-soft">
                  <Icon name="check" className="size-4 shrink-0 text-risk-low" />
                  {action}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
