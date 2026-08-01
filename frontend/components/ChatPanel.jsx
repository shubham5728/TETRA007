"use client";

import { useState } from "react";
import { Icon } from "./Icons";

const SAMPLE_REPLY =
  "Thank you for telling me. I have saved this to your Recovery Twin. If it gets worse, I will alert your doctor straight away.";

/**
 * Chat transcript for the AI Care Coordinator.
 *
 * Replies are sample text — the Gemini call is not wired up yet, and the UI
 * says so rather than pretending the answer came from a model.
 */
export default function ChatPanel({ initialMessages }) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");

  function send(event) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;

    const time = new Date().toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    setMessages((prev) => [
      ...prev,
      { from: "patient", text, time },
      { from: "aura", text: SAMPLE_REPLY, time },
    ]);
    setDraft("");
  }

  return (
    <div className="flex h-full flex-col">
      <ul className="flex-1 space-y-4 overflow-y-auto pr-1">
        {messages.map((message, index) => {
          const fromPatient = message.from === "patient";
          return (
            <li
              key={`${message.time}-${index}`}
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
                <p>{message.text}</p>
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
                  {message.time}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      <form onSubmit={send} className="mt-5 flex items-center gap-2">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask about medicines, symptoms or your next visit…"
          aria-label="Message the AI Care Coordinator"
          className="min-w-0 flex-1 rounded-xl border border-line bg-surface-soft px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand focus:bg-surface"
        />
        <button
          type="submit"
          className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand text-white transition hover:opacity-90 disabled:opacity-40"
          disabled={!draft.trim()}
          aria-label="Send message"
        >
          <Icon name="chevron" className="size-5" />
        </button>
      </form>

      <p className="mt-2.5 text-xs text-ink-faint">
        Prototype: replies are sample text. Connecting the Gemini API will make
        these answers live.
      </p>
    </div>
  );
}
