"use client";

import { useState, useRef } from "react";
import { api } from "@/lib/api";
import { clockTime } from "@/lib/format";
import { Icon } from "./Icons";

/**
 * AI Care Coordinator transcript.
 *
 * Replies come from the backend assistant, which can re-score the patient when
 * a message mentions something urgent.
 */
export default function ChatPanel({ initialMessages, onReply }) {
  const [messages, setMessages] = useState(() => {
    if (initialMessages && initialMessages.length > 0) {
      return [
        {
          id: "welcome-back",
          sender: "aura",
          text: `Welcome back!\n\nI have reviewed your latest health information.\nYou have:\n- 1 upcoming appointment\n- 2 medications due today\n- Recovery Score: 82/100\n- No critical alerts detected\n\nHow can I assist you today?`,
          created_at: new Date().toISOString(),
          buttons_json: JSON.stringify([
            { label: "Explain My Medicines", action: "explain" },
            { label: "Report Symptoms", action: "symptoms" },
            { label: "Check Recovery Progress", action: "recovery" },
            { label: "Upcoming Visits", action: "visits" },
            { label: "Government Health Schemes", action: "schemes" },
            { label: "Emergency Assistance", action: "emergency" },
            { label: "Upload Medical Report", action: "upload" },
            { label: "Talk to AI Coordinator", action: "chat" }
          ])
        }
      ];
    }
    return [
      {
        id: "welcome-first",
        sender: "aura",
        text: "Hello, I am your AI Care Coordinator.\n\nI can help you manage your recovery journey.\n\nPlease choose what you would like help with.",
        created_at: new Date().toISOString(),
        buttons_json: JSON.stringify([
          { label: "Explain My Medicines", action: "explain" },
          { label: "Report Symptoms", action: "symptoms" },
          { label: "Check Recovery Progress", action: "recovery" },
          { label: "Upcoming Visits", action: "visits" },
          { label: "Government Health Schemes", action: "schemes" },
          { label: "Emergency Assistance", action: "emergency" },
          { label: "Upload Medical Report", action: "upload" },
          { label: "Talk to AI Coordinator", action: "chat" }
        ])
      }
    ];
  });
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function sendWithText(text) {
    if (!text || busy) return;

    setBusy(true);
    setError(null);
    try {
      const created = await api.post("/api/chat", { text });
      setMessages((previous) => [...previous, ...created]);
      setDraft("");
      await onReply?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function send(event) {
    event.preventDefault();
    await sendWithText(draft.trim());
  }

  const fileInputRef = useRef(null);

  async function handleFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file || busy) return;

    setBusy(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const created = await api.post("/api/chat/upload", formData);
      setMessages((previous) => [...previous, ...created]);
      await onReply?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="flex h-full flex-col">
      <ul className="max-h-[50dvh] sm:max-h-[420px] flex-1 space-y-4 overflow-y-auto pr-1">
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

              <div
                className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  fromPatient
                    ? "rounded-br-md bg-brand text-white"
                    : "rounded-bl-md bg-surface-soft text-ink"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.text}</p>
                {message.buttons_json ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(() => {
                      try {
                        return JSON.parse(message.buttons_json).map((btn, idx) => (
                          <button
                            key={idx}
                            onClick={(e) => {
                              e.preventDefault();
                              sendWithText(btn.label);
                            }}
                            className="inline-flex min-h-[36px] items-center rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-brand shadow-sm transition hover:bg-brand hover:text-white border border-brand/20 active:scale-95"
                          >
                            {btn.label}
                          </button>
                        ));
                      } catch (e) {
                        return null;
                      }
                    })()}
                  </div>
                ) : null}
                {message.translated ? (
                  <p
                    className={`mt-1.5 text-xs italic ${
                      fromPatient ? "text-white/70" : "text-ink-faint"
                    }`}
                  >
                    {message.translated}
                  </p>
                ) : null}
                <p
                  className={`mt-1.5 text-[10px] ${
                    fromPatient ? "text-white/60" : "text-ink-faint"
                  }`}
                >
                  {clockTime(message.created_at)}
                </p>
              </div>
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

      <form onSubmit={send} className="mt-5 flex items-center gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask about medicines, symptoms or your next visit…"
          aria-label="Message the AI Care Coordinator"
          disabled={busy}
          className="min-w-0 flex-1 rounded-xl border border-line bg-surface-soft px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand focus:bg-surface disabled:opacity-60"
        />
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileUpload}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="grid size-11 shrink-0 place-items-center rounded-xl bg-surface-soft text-ink-soft transition hover:bg-surface-hover disabled:opacity-40"
          disabled={busy}
          aria-label="Upload medical document"
        >
          <Icon name="document" className="size-5" />
        </button>
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

      <p className="mt-2.5 text-xs text-ink-faint">
        Replies come from the backend assistant. Saying something urgent — for
        example &quot;I feel breathless&quot; — re-scores your risk immediately.
      </p>
    </div>
  );
}
