"use client";

import { useRouter } from "next/navigation";
import { ErrorState, Loading } from "@/components/DataStates";
import { Icon } from "@/components/Icons";
import Toggle from "@/components/Toggle";
import { Card, CardTitle, Eyebrow, Pill } from "@/components/ui";
import { API_BASE, clearSession } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useApi, useSession } from "@/lib/useApi";

import { useEffect, useState } from "react";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी" },
  { code: "gu", label: "ગુજરાતી" }
];

export default function SettingsView() {
  const router = useRouter();
  const { user } = useSession();
  const patient = useApi("/api/patient");
  const schemes = useApi("/api/patient/schemes");
  const health = useApi("/api/health");

  const [langCode, setLangCode] = useState("en");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setLangCode(localStorage.getItem("aura.lang") || "en");
    }
  }, []);

  const sources = [patient, schemes, health];
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

  function changeLang(code) {
    setLangCode(code);
    localStorage.setItem("aura.lang", code);
  }

  function signOut() {
    clearSession();
    router.replace("/login");
  }

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-brand-soft font-display text-xl font-bold text-brand">
            {patient.data.initials}
          </span>
          <div className="min-w-0 flex-1">
            <Eyebrow>Profile</Eyebrow>
            <h2 className="mt-1 font-display text-xl font-semibold text-ink">
              {patient.data.name}
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              {patient.data.age} · {patient.data.gender} · {patient.data.village}
            </p>
            <p className="mt-1 text-xs text-ink-faint">
              Discharged {formatDate(patient.data.discharged_on)} from{" "}
              {patient.data.hospital}
            </p>
          </div>
          <Pill tone="mint">
            <Icon name="shield" className="size-3.5" />
            Signed in as {user?.role ?? "…"}
          </Pill>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardTitle
            eyebrow="Preferences"
            title="Language"
            hint="Used across the app and by the AI assistant."
          />
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => changeLang(lang.code)}
                className="focus:outline-none"
              >
                <Pill tone={langCode === lang.code ? "brand" : "neutral"}>
                  {lang.label}
                </Pill>
              </button>
            ))}
          </div>

          <div className="mt-6 divide-y divide-line border-t border-line pt-2">
            <Toggle
              label="Read answers aloud"
              hint="Useful for patients who cannot read comfortably."
              defaultOn
            />
            <Toggle label="Large text" hint="Increases font size across the workspace." />
          </div>
        </Card>

        <Card>
          <CardTitle eyebrow="Alerts" title="Notifications" />
          <div className="divide-y divide-line">
            <Toggle
              label="Medicine reminders"
              hint="Sent at each scheduled dose time."
              defaultOn
            />
            <Toggle
              label="Follow-up reminders"
              hint="Two days before, and again on the morning."
              defaultOn
            />
            <Toggle
              label="High-risk alerts to caregiver"
              hint="Sent when Sentinel crosses the safe limit."
              defaultOn
            />
            <Toggle label="Weekly recovery summary" hint="Every Sunday evening." />
          </div>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
        <Card>
          <CardTitle eyebrow="System" title="Connection & sync" />
          <div className="rounded-2xl bg-surface-soft p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-ink">
              <Icon name="check" className="size-4 text-risk-low" />
              API reachable
            </p>
            <dl className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-faint">Endpoint</dt>
                <dd className="truncate font-mono text-ink-soft">{API_BASE}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-faint">Service</dt>
                <dd className="text-ink-soft">
                  {health.data.service} v{health.data.version}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-faint">Risk model</dt>
                <dd className="text-ink-soft">{health.data.model}</dd>
              </div>
            </dl>
          </div>
          <div className="mt-2 divide-y divide-line">
            <Toggle
              label="Work offline"
              hint="Keeps a local copy so the app runs without internet."
              defaultOn
            />
            <Toggle label="Sync only on Wi-Fi" hint="Saves mobile data in rural areas." />
          </div>
        </Card>

        <Card>
          <CardTitle
            eyebrow="Government Scheme Navigator"
            title="Schemes you may be eligible for"
          />
          <ul className="space-y-3">
            {schemes.data.map((scheme) => (
              <li
                key={scheme.id}
                className="flex items-start gap-3 rounded-2xl border border-line p-4"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-mint text-mint-ink">
                  <Icon name="shield" className="size-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink">{scheme.name}</p>
                  <p className="mt-0.5 text-xs text-ink-soft">{scheme.benefit}</p>
                </div>
                <Pill tone={scheme.status === "Enrolled" ? "mint" : "brand"}>
                  {scheme.status}
                </Pill>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display font-semibold text-ink">Sign out</p>
            <p className="mt-0.5 text-sm text-ink-soft">
              Ends this session on the device.
            </p>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink-soft transition hover:bg-surface-soft hover:text-ink"
          >
            <Icon name="logout" className="size-4" />
            Sign out
          </button>
        </div>
      </Card>
    </div>
  );
}
