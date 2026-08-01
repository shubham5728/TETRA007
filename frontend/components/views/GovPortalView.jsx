"use client";

import { ErrorState, Loading } from "@/components/DataStates";
import { Icon } from "@/components/Icons";
import { Card, CardTitle, Pill } from "@/components/ui";
import { useApi } from "@/lib/useApi";

export default function GovPortalView() {
  const schemes = useApi("/api/patient/schemes");

  if (schemes.loading) return <Loading rows={3} />;
  if (schemes.error) {
    return <ErrorState error={schemes.error} onRetry={schemes.reload} />;
  }

  const activeSchemes = schemes.data.filter((s) => s.status === "active");

  return (
    <div className="space-y-5">
      <Card>
        <CardTitle
          eyebrow="Government Health Schemes"
          title="Active Programs & Benefits"
          hint="List of schemes available to eligible patients."
        />
        <div className="mt-6">
          {schemes.data.length ? (
            <ul className="grid gap-4 sm:grid-cols-2">
              {schemes.data.map((scheme) => (
                <li
                  key={scheme.id}
                  className="flex flex-col gap-3 rounded-2xl border border-line p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-semibold text-ink">{scheme.name}</h3>
                    <Pill tone={scheme.status === "active" ? "mint" : "neutral"}>
                      {scheme.status}
                    </Pill>
                  </div>
                  <p className="text-sm leading-relaxed text-ink-soft">
                    {scheme.benefit}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-soft">No schemes are currently listed.</p>
          )}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardTitle
            eyebrow="Coverage Overview"
            title="Why Track Schemes?"
          />
          <ul className="space-y-3">
            {[
              {
                icon: "users",
                title: "Financial Protection",
                detail: "Ensures low-income patients do not skip follow-ups due to cost.",
              },
              {
                icon: "radar",
                title: "Real-time Access",
                detail: "Care coordinators map active schemes directly to patient needs.",
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

        <Card>
          <CardTitle
            eyebrow="Public Health"
            title="Analytics & Export"
            hint="Integration with central government DBs."
          />
          <div className="mt-4 flex flex-col items-center justify-center gap-3 rounded-2xl border border-line p-8 text-center">
            <Icon name="activity" className="size-8 text-brand" />
            <div>
              <p className="font-semibold text-ink">Sync to Central DB</p>
              <p className="mt-1 max-w-sm text-xs text-ink-soft">
                The government portal pushes aggregated hospital metrics to the national health registry.
              </p>
            </div>
            <button className="mt-2 rounded-xl bg-surface-soft px-4 py-2 text-sm font-semibold text-ink transition hover:bg-line">
              Push Metrics (Coming Soon)
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
}
