"use client";

import { EcgLine, Sparkline } from "@/components/charts";
import { ErrorState, Loading } from "@/components/DataStates";
import { Icon } from "@/components/Icons";
import { Card, CardTitle, Eyebrow, Pill, ProgressBar, StatTile } from "@/components/ui";
import { useApi } from "@/lib/useApi";

const STATUS_TONE = {
  Connected: "mint",
  "Manual entry": "brand",
  Offline: "neutral",
};

const STEP_GOAL = 4000;

export default function WearablesView() {
  const devices = useApi("/api/patient/wearables");
  const vitals = useApi("/api/patient/vitals");
  const twin = useApi("/api/recovery-twin");

  const sources = [devices, vitals, twin];
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

  const heartRate = vitals.data.find((vital) => vital.label === "Heart Rate");
  const steps = vitals.data.find((vital) => vital.label.startsWith("Steps"));
  const stepCount = Number(steps?.value ?? 0);
  const stepPercent = Math.min(100, Math.round((stepCount / STEP_GOAL) * 100));

  return (
    <div className="space-y-5">
      <Card padded={false} className="overflow-hidden">
        <div className="bg-navy px-6 py-7 text-white sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal">
                Live signal
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold">
                Heart rate — {heartRate?.value ?? "—"} {heartRate?.unit ?? ""}
              </h2>
              <p className="mt-1 text-sm text-white/70">
                Streaming from the paired fitness band.
              </p>
            </div>
            <div className="flex gap-2">
              <Pill tone="onDark">Signal good</Pill>
              <Pill tone="onDark">
                {devices.data.filter((device) => device.status === "Connected").length}{" "}
                devices connected
              </Pill>
            </div>
          </div>
          <EcgLine className="mt-6 h-24 w-full" />
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <Card>
          <CardTitle
            eyebrow="Paired devices"
            title="Connected hardware"
            hint="Optional — the app works fully without any device."
          />
          <ul className="divide-y divide-line">
            {devices.data.map((device) => (
              <li key={device.id} className="flex items-center gap-4 py-4">
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                    device.status === "Offline"
                      ? "bg-surface-soft text-ink-faint"
                      : "bg-brand-soft text-brand"
                  }`}
                >
                  <Icon
                    name={device.status === "Offline" ? "wifiOff" : "watch"}
                    className="size-5"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{device.name}</p>
                  <p className="truncate text-xs text-ink-soft">{device.model}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <Pill tone={STATUS_TONE[device.status] ?? "neutral"}>
                    {device.status}
                  </Pill>
                  {device.battery !== null ? (
                    <span className="text-xs text-ink-faint">
                      {device.battery}% battery
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardTitle eyebrow="Latest readings" title="Vitals" />
            <div className="grid gap-3 sm:grid-cols-3">
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

          <Card>
            <CardTitle eyebrow="Since discharge" title="Recovery trend" />
            <Sparkline
              data={twin.data.history}
              className="h-28 w-full"
              stroke="var(--color-teal)"
              idSuffix="-wear"
            />
            <div className="mt-4">
              <div className="mb-1.5 flex items-baseline justify-between">
                <p className="text-sm text-ink-soft">Daily step goal</p>
                <p className="text-sm font-semibold text-ink">
                  {stepCount.toLocaleString("en-IN")} / {STEP_GOAL.toLocaleString("en-IN")}
                </p>
              </div>
              <ProgressBar value={stepPercent} tone={stepPercent >= 75 ? "low" : "med"} />
            </div>
          </Card>
        </div>
      </div>

      <Card>
        <div className="flex items-start gap-4">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-mint text-mint-ink">
            <Icon name="wifiOff" className="size-5" />
          </span>
          <div>
            <Eyebrow tone="soft">Offline first</Eyebrow>
            <p className="mt-1.5 font-display font-semibold text-ink">
              Readings are stored on the phone when there is no internet
            </p>
            <p className="mt-1 max-w-2xl text-sm text-ink-soft">
              Nothing is lost during a network outage. As soon as the connection
              comes back, the queued readings sync to the cloud and the Recovery
              Twin updates itself.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
