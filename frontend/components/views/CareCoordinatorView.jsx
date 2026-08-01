"use client";

import { useState } from "react";
import ChatPanel from "@/components/ChatPanel";
import { ErrorState, Loading } from "@/components/DataStates";
import { Icon } from "@/components/Icons";
import { Card, CardTitle, Eyebrow, Pill } from "@/components/ui";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";

const LANGUAGES = ["English", "Gujarati", "Hindi", "Hinglish", "Gujlish (Guj+Eng)"];

const ABILITIES = [
  {
    icon: "pill",
    title: "Explains medicines",
    detail: "Turns “Tab Metformin 500mg BID” into plain words.",
  },
  {
    icon: "alert",
    title: "Takes symptom reports",
    detail: "Saves what the patient says into the Recovery Twin.",
  },
  {
    icon: "calendar",
    title: "Reminds about visits",
    detail: "Follow-ups, lab work and home visits.",
  },
  {
    icon: "bell",
    title: "Escalates when needed",
    detail: "Re-scores risk and alerts the doctor if it crosses the limit.",
  },
];

const SAMPLE = "Tab Metformin 500mg BID\nTab Atorvastatin 10mg HS\nReview BP at f/u";

/** Live Discharge Summary Simplifier, calling the backend rules engine. */
function Simplifier() {
  const [text, setText] = useState(SAMPLE);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function run(event) {
    event.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      setResult(await api.post("/api/tools/simplify", { text }));
    } catch (err) {
      setError(err.message);
      setResult(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={run}>
      <label htmlFor="report" className="sr-only">
        Medical report text
      </label>
      <textarea
        id="report"
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={4}
        disabled={busy}
        className="w-full resize-y rounded-xl border border-line bg-surface-soft px-4 py-3 font-mono text-xs text-ink outline-none transition focus:border-brand focus:bg-surface disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={!text.trim() || busy}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
      >
        <Icon name="sparkle" className="size-4" />
        {busy ? "Simplifying…" : "Simplify"}
      </button>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-risk-high">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="mt-4 rounded-2xl border border-line p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Patient-friendly
            </p>
            <Pill tone="teal">via {result.source}</Pill>
          </div>
          <ul className="space-y-2">
            {result.lines.map((line, index) => (
              <li key={index} className="flex gap-2 text-sm text-ink">
                <Icon name="check" className="mt-0.5 size-4 shrink-0 text-risk-low" />
                {line}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </form>
  );
}

export default function CareCoordinatorView() {
  const chat = useApi("/api/chat");
  const sentinel = useApi("/api/sentinel");

  const sources = [chat, sentinel];
  const loading = sources.some((source) => source.loading);
  const error = sources.find((source) => source.error)?.error;

  if (loading) return <Loading rows={2} />;
  if (error) {
    return (
      <ErrorState
        error={error}
        onRetry={() => sources.forEach((source) => source.reload())}
      />
    );
  }

  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Eyebrow>AI Care Coordinator</Eyebrow>
            <h2 className="mt-1.5 font-display text-xl font-semibold text-ink sm:text-2xl">
              A health assistant that speaks the patient&apos;s language
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
              Available 24×7. Patients can type in their own language, and what
              they report goes straight into the Recovery Twin.
            </p>
          </div>
          <Pill tone="mint">
            <span className="size-1.5 animate-pulse rounded-full bg-mint-ink" />
            Online
          </Pill>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {LANGUAGES.map((language) => (
            <Pill key={language}>{language}</Pill>
          ))}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Card className="flex min-h-[560px] flex-col">
          <CardTitle
            eyebrow="Conversation"
            title="Today"
            hint={`Current risk: ${sentinel.data.readmission_risk}% (${sentinel.data.risk_level.toLowerCase()})`}
          />
          <div className="min-h-0 flex-1">
            <ChatPanel
              initialMessages={chat.data}
              onReply={() => sentinel.reload()}
            />
          </div>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardTitle eyebrow="Capabilities" title="What it can do" />
            <ul className="space-y-3">
              {ABILITIES.map((ability) => (
                <li key={ability.title} className="flex gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-teal-soft text-teal">
                    <Icon name={ability.icon} className="size-4.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink">{ability.title}</p>
                    <p className="text-xs text-ink-soft">{ability.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardTitle
              eyebrow="Discharge Summary Simplifier"
              title="Report to plain words"
              hint="Paste any prescription shorthand and run it."
            />
            <Simplifier />
          </Card>
        </div>
      </div>
    </div>
  );
}
