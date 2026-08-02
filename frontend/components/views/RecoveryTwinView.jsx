"use client";

import { useState } from "react";
import { RecoveryRing, Sparkline } from "@/components/charts";
import { ErrorState, Loading } from "@/components/DataStates";
import { Icon } from "@/components/Icons";
import MedicationList from "@/components/MedicationList";
import {
  Card,
  CardTitle,
  Eyebrow,
  Pill,
  RiskPill,
  StatTile,
} from "@/components/ui";
import { api } from "@/lib/api";
import { formatDate, timeAgo } from "@/lib/format";
import { useApi } from "@/lib/useApi";

const INPUTS = [
  { label: "Symptoms", icon: "alert", detail: "Logged daily by the patient" },
  { label: "Medicines", icon: "pill", detail: "Marked as taken or missed" },
  { label: "Vitals", icon: "activity", detail: "Manual entry or wearable" },
  { label: "Activity", icon: "chart", detail: "Step count and rest" },
  { label: "Follow-ups", icon: "calendar", detail: "Attended or missed" },
  { label: "History", icon: "file", detail: "Discharge summary and reports" },
];

const LEVELS = ["None", "Mild", "Moderate", "Severe"];

function SymptomLogger({ onLogged }) {
  const [name, setName] = useState("");
  const [level, setLevel] = useState("Mild");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function submit(event) {
    event.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await api.post("/api/patient/symptoms", { name: name.trim(), level });
      setName("");
      await onLogged?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-5 border-t border-line pt-4">
      <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">
        Log a symptom
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="What are you feeling?"
          aria-label="Symptom name"
          disabled={busy}
          className="min-w-0 flex-1 rounded-xl border border-line bg-surface-soft px-4 py-2.5 text-sm outline-none transition focus:border-brand focus:bg-surface disabled:opacity-60"
        />
        <select
          value={level}
          onChange={(event) => setLevel(event.target.value)}
          aria-label="Severity"
          disabled={busy}
          className="rounded-xl border border-line bg-surface-soft px-3 py-2.5 text-sm outline-none transition focus:border-brand disabled:opacity-60"
        >
          {LEVELS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={!name.trim() || busy}
          className="rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
        >
          {busy ? "Saving…" : "Add"}
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-risk-high">
          {error}
        </p>
      ) : null}
    </form>
  );
}

export default function RecoveryTwinView() {
  const twin = useApi("/api/recovery-twin");
  const medications = useApi("/api/patient/medications");
  const symptoms = useApi("/api/patient/symptoms");
  const vitals = useApi("/api/patient/vitals");

  const sources = [twin, medications, symptoms, vitals];
  const loading = sources.some((source) => source.loading);
  const error = sources.find((source) => source.error)?.error;

  if (loading) return <Loading rows={4} />;
  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={() => sources.forEach((source) => source.reload())}
      />
    );
  }

  const patient = twin.data.patient;

<<<<<<< HEAD
  async function refresh() {
=======
  /**
   * Doses and symptoms are both inputs to the risk model, but /api/sentinel
   * serves the last stored assessment. Ask for a re-score first, otherwise the
   * Recovery Score stays frozen and the page looks like it ignored the entry.
   */
  async function refresh() {
    try {
      await api.post("/api/sentinel/run", {});
    } catch {
      // A failed re-score must not stop the rest of the page refreshing.
    }
>>>>>>> dd4f47c3681091a37c2e326454fd9dc16645af09
    await Promise.all([twin.reload(), medications.reload(), symptoms.reload()]);
  }

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-col gap-7 lg:flex-row lg:items-center">
          <div className="flex items-center gap-6">
            <RecoveryRing value={twin.data.score} idSuffix="-twin" />
            <div>
              <Eyebrow>Recovery Twin™</Eyebrow>
              <h2 className="mt-1.5 font-display text-xl font-semibold text-ink sm:text-2xl">
                {patient.name}
              </h2>
              <p className="mt-1 text-sm text-ink-soft">
                {patient.age} · {patient.gender} · {patient.diagnosis}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <RiskPill level={twin.data.risk_level} />
                <Pill>Day {twin.data.days_since_discharge} after discharge</Pill>
              </div>
            </div>
          </div>

          <div className="flex-1 rounded-2xl bg-surface-soft p-5 lg:ml-4">
            <p className="text-sm leading-relaxed text-ink-soft">{twin.data.summary}</p>
            <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-faint">Discharged</dt>
                <dd className="font-medium text-ink">
                  {formatDate(patient.discharged_on)}
                </dd>
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
                <dd className="font-medium text-ink">{patient.care_team}</dd>
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
            hint="A new point is recorded each time the engine re-scores."
          />
          <Sparkline data={twin.data.history} className="h-36 w-full" idSuffix="-twin" />
          <div className="mt-4 grid grid-cols-3 gap-3">
            <StatTile label="Today" value={twin.data.score} unit="%" tone="soft" />
            <StatTile
              label="This week"
              value={`${twin.data.score_change >= 0 ? "+" : ""}${twin.data.score_change}`}
              unit="pts"
              tone="soft"
            />
            <StatTile label="Symptom load" value={twin.data.symptom_load} tone="soft" />
          </div>
        </Card>

        <Card>
          <CardTitle
            eyebrow="Inputs"
            title="What the twin reads"
            hint="Six signals feed the profile."
          />
          <ul className="grid gap-3 sm:grid-cols-2">
            {INPUTS.map((input) => (
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
          <CardTitle
            eyebrow="Adherence"
            title="Medicines"
            hint="Tap a dose to mark it taken."
          />
          <MedicationList
            medications={medications.data}
            onChange={refresh}
            showPlain={false}
          />
        </Card>

        <Card>
          <CardTitle eyebrow="Logged by the patient" title="Symptoms" />
          {symptoms.data.length ? (
            <ul className="divide-y divide-line">
              {symptoms.data.map((symptom) => (
                <li key={symptom.id} className="flex items-center gap-3 py-3">
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
                    <p className="text-xs text-ink-faint">
                      {timeAgo(symptom.logged_at)}
                    </p>
                  </div>
                  <Pill tone={symptom.level === "None" ? "mint" : "neutral"}>
                    {symptom.level}
                  </Pill>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-soft">Nothing logged yet.</p>
          )}
<<<<<<< HEAD
          <SymptomLogger onLogged={() => Promise.all([symptoms.reload(), twin.reload()])} />
=======
          <SymptomLogger onLogged={refresh} />
>>>>>>> dd4f47c3681091a37c2e326454fd9dc16645af09
        </Card>
      </div>

      <Card>
        <CardTitle eyebrow="Latest readings" title="Vitals" />
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
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
    </div>
  );
}
