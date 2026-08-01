import ChatPanel from "@/components/ChatPanel";
import { Icon } from "@/components/Icons";
import { Card, CardTitle, Eyebrow, Pill } from "@/components/ui";
import { coordinatorChat, medications } from "@/lib/data";

export const metadata = { title: "AI Care Coordinator | AURA CareLink" };

const languages = ["English", "हिन्दी", "தமிழ்", "ગુજરાતી", "বাংলা", "मराठी"];

const abilities = [
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
    detail: "Alerts the doctor if an answer sounds serious.",
  },
];

export default function CareCoordinatorPage() {
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
              Available 24×7. Patients can type or speak in their own language,
              and the answer comes back in the same one.
            </p>
          </div>
          <Pill tone="mint">
            <span className="size-1.5 animate-pulse rounded-full bg-mint-ink" />
            Online
          </Pill>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {languages.map((language) => (
            <Pill key={language}>{language}</Pill>
          ))}
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <Card className="flex min-h-[560px] flex-col">
          <CardTitle eyebrow="Conversation" title="Today" />
          <div className="min-h-0 flex-1">
            <ChatPanel initialMessages={coordinatorChat} />
          </div>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardTitle eyebrow="Capabilities" title="What it can do" />
            <ul className="space-y-3">
              {abilities.map((ability) => (
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
            />
            <ul className="space-y-4">
              {medications.slice(0, 3).map((med) => (
                <li key={med.name} className="rounded-2xl border border-line p-4">
                  <p className="font-mono text-xs text-ink-faint">
                    {med.name} {med.dose} — {med.schedule}
                  </p>
                  <div className="my-2 flex items-center gap-2 text-ink-faint">
                    <span className="h-px flex-1 bg-line" />
                    <Icon name="sparkle" className="size-3.5 text-teal" />
                    <span className="h-px flex-1 bg-line" />
                  </div>
                  <p className="text-sm font-medium text-ink">{med.plain}</p>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
