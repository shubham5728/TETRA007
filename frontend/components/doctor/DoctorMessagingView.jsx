"use client";

import { Card, CardTitle } from "@/components/ui";

export default function DoctorMessagingView({
  currentPatient,
  customMessages,
  messageText,
  setMessageText,
  handleSendMessage,
}) {
  return (
    <Card>
      <CardTitle
        eyebrow="Patient & Caregiver Direct Secure Messaging"
        title="Direct Clinical Communication Thread"
        hint="1-on-1 and group thread between doctor, patient, and caregiver"
      />

      <div className="space-y-4">
        {/* Quick Templates */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-ink-faint">Quick Templates:</span>
          {[
            "Please take morning dose after breakfast",
            "Blood pressure check needed today",
            "Schedule follow-up visit soon",
            "Symptoms looking stable",
          ].map((tpl) => (
            <button
              key={tpl}
              onClick={() => setMessageText(tpl)}
              className="rounded-lg border border-line bg-surface-soft px-2.5 py-1 text-[11px] text-ink transition hover:bg-brand hover:text-white"
            >
              {tpl}
            </button>
          ))}
        </div>

        <div className="max-h-72 overflow-y-auto space-y-3 rounded-2xl border border-line p-4 text-xs">
          {(customMessages[currentPatient?.id] || []).map((msg) => (
            <div
              key={msg.id}
              className={`rounded-xl p-3 max-w-md ${
                msg.sender.includes("You")
                  ? "ml-auto bg-brand text-white"
                  : "bg-surface-soft text-ink"
              }`}
            >
              <p className="font-bold">{msg.sender}</p>
              <p className="mt-1 leading-relaxed">{msg.text}</p>
              <span className="mt-1 block text-[10px] opacity-75">{msg.time}</span>
            </div>
          ))}
        </div>

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            placeholder="Type clinical instruction..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="flex-1 rounded-xl border border-line bg-surface px-3.5 py-2 text-xs text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-xl bg-brand px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:opacity-90"
          >
            Send
          </button>
        </form>
      </div>
    </Card>
  );
}
