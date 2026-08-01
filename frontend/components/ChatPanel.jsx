"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { clockTime } from "@/lib/format";
import { Icon } from "./Icons";

// India's ambulance line. Used by the emergency button so the tap does
// something real rather than opening a placeholder number.
const EMERGENCY_NUMBER = "108";

const RISK = {
  low: { dot: "🟢", label: "Low risk", chip: "bg-risk-low/10 text-risk-low" },
  moderate: { dot: "🟡", label: "Moderate risk", chip: "bg-risk-med/10 text-risk-med" },
  high: { dot: "🔴", label: "High risk", chip: "bg-risk-high/15 text-risk-high" },
};

// What each chip asks on the patient's behalf.
const CHIP_PROMPTS = {
  Medication: "What are my medicines today?",
  Symptoms: "I want to report a symptom",
  Diet: "What food should I eat?",
  Recovery: "How is my recovery going?",
  Appointments: "When is my next appointment?",
  Reports: "Can you explain my discharge summary?",
};

function ActionButtons({ buttons, onDone }) {
  const router = useRouter();
  const [note, setNote] = useState(null);

  if (note) {
    return (
      <p className="mt-3 flex items-start gap-2 rounded-xl bg-mint px-3 py-2.5 text-xs text-mint-ink">
        <Icon name="check" className="mt-0.5 size-3.5 shrink-0" />
        {note}
      </p>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {buttons.map((button) => {
        if (button.action === "call_emergency") {
          return (
            <a
              key={button.action}
              href={`tel:${EMERGENCY_NUMBER}`}
              className="inline-flex items-center gap-2 rounded-xl bg-risk-high px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <Icon name="alert" className="size-4" />
              {button.label}
            </a>
          );
        }

        if (button.action === "call_doctor") {
          return (
            <button
              key={button.action}
              type="button"
              onClick={() =>
                setNote(
                  "Your doctor and caregiver have been alerted. This conversation is now on the doctor's dashboard.",
                )
              }
              className="inline-flex items-center gap-2 rounded-xl border border-risk-high/30 bg-risk-high/10 px-4 py-2.5 text-sm font-semibold text-risk-high transition hover:bg-risk-high/15"
            >
              <Icon name="stethoscope" className="size-4" />
              {button.label}
            </button>
          );
        }

        if (button.action === "book_appointment") {
          return (
            <button
              key={button.action}
              type="button"
              onClick={() => router.push("/appointments")}
              className="inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <Icon name="calendar" className="size-4" />
              {button.label}
            </button>
          );
        }

        return (
          <button
            key={button.action}
            type="button"
            onClick={() => {
              setNote("Good. Keep logging how you feel each day.");
              onDone?.();
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink-soft transition hover:text-ink"
          >
            <Icon name="check" className="size-4" />
            {button.label}
          </button>
        );
      })}
    </div>
  );
}

function AssistantMessage({ message }) {
  const risk = RISK[message.risk_level];
  const emergency = message.risk_level === "high";

  // Older transcripts predate the structured fields, so fall back to the text.
  const assessment = message.assessment ?? message.text;

  return (
    <div
      className={`max-w-[86%] rounded-2xl rounded-bl-md px-4 py-3 text-sm leading-relaxed ${
        emergency
          ? "border border-risk-high/25 bg-risk-high/5 text-ink"
          : "bg-surface-soft text-ink"
      }`}
    >
      {risk ? (
        <span
          className={`mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${risk.chip}`}
        >
          {risk.dot} {risk.label}
        </span>
      ) : null}

      <p>{assessment}</p>

      {message.recommended_action ? (
        <div className="mt-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-faint">
            Recommended action
          </p>
          <p className="mt-1">{message.recommended_action}</p>
        </div>
      ) : null}

      {message.recovery_advice ? (
        <div className="mt-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-faint">
            Recovery advice
          </p>
          <p className="mt-1 text-ink-soft">{message.recovery_advice}</p>
        </div>
      ) : null}

      {message.buttons?.length ? <ActionButtons buttons={message.buttons} /> : null}

      <p className="mt-2.5 flex items-center gap-2 text-[10px] text-ink-faint">
        {clockTime(message.created_at)}
        {message.source === "rules" ? null : (
          <span className="rounded bg-teal-soft px-1.5 py-0.5 font-semibold text-teal">
            {message.source}
          </span>
        )}
      </p>
    </div>
  );
}

export default function ChatPanel({ initialMessages, quickChips = [], onReply }) {
  const [messages, setMessages] = useState(initialMessages ?? []);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function submit(text) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    setBusy(true);
    setError(null);
    try {
      const created = await api.post("/api/chat", { text: trimmed });
      setMessages((previous) => [...previous, ...created]);
      setDraft("");
      await onReply?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <ul className="max-h-[420px] flex-1 space-y-4 overflow-y-auto pr-1">
        {messages.map((message) => {
          const fromPatient = message.sender === "patient";
          return (
            <li
              key={message.id}
              className={`flex gap-3 ${fromPatient ? "justify-end" : ""}`}
            >
              {!fromPatient ? (
                <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-teal-soft text-teal">
                  <Icon name="sparkle" className="size-4" />
                </span>
              ) : null}

              {fromPatient ? (
                <div className="max-w-[78%] rounded-2xl rounded-br-md bg-brand px-4 py-3 text-sm leading-relaxed text-white">
                  <p>{message.text}</p>
                  {message.translated ? (
                    <p className="mt-1.5 text-xs italic text-white/70">
                      {message.translated}
                    </p>
                  ) : null}
                  <p className="mt-1.5 text-[10px] text-white/60">
                    {clockTime(message.created_at)}
                  </p>
                </div>
              ) : (
                <AssistantMessage message={message} />
              )}
            </li>
          );
        })}

        {busy ? (
          <li className="flex gap-3">
            <span className="mt-1 grid size-8 shrink-0 place-items-center rounded-full bg-teal-soft text-teal">
              <Icon name="sparkle" className="size-4" />
            </span>
            <div className="rounded-2xl rounded-bl-md bg-surface-soft px-4 py-3 text-sm text-ink-faint">
              AURA is checking your record…
            </div>
          </li>
        ) : null}
      </ul>

      {quickChips.length ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {quickChips.map((chip) => (
            <button
              key={chip}
              type="button"
              disabled={busy}
              onClick={() => submit(CHIP_PROMPTS[chip] ?? chip)}
              className="rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink-soft transition hover:border-brand/40 hover:text-brand disabled:opacity-50"
            >
              {chip}
            </button>
          ))}
        </div>
      ) : null}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit(draft);
        }}
        className="mt-3 flex items-center gap-2"
      >
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask about medicines, symptoms or your next visit…"
          aria-label="Message the AI Care Coordinator"
          disabled={busy}
          className="min-w-0 flex-1 rounded-xl border border-line bg-surface-soft px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand focus:bg-surface disabled:opacity-60"
        />
        <button
          type="submit"
          className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand text-white transition hover:opacity-90 disabled:opacity-40"
          disabled={!draft.trim() || busy}
          aria-label="Send message"
        >
          <Icon name="chevron" className="size-5" />
        </button>
      </form>

      {error ? (
        <p role="alert" className="mt-2 text-sm text-risk-high">
          {error}
        </p>
      ) : null}
    </div>
  );
}
