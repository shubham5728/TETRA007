import Link from "next/link";
import { Icon } from "@/components/Icons";
import Toggle from "@/components/Toggle";
import { Card, CardTitle, Eyebrow, Pill } from "@/components/ui";
import { patient, schemes } from "@/lib/data";

export const metadata = { title: "Settings | AURA CareLink" };

const languages = ["English", "हिन्दी", "தமிழ்", "ગુજરાતી"];

export default function SettingsPage() {
  return (
    <div className="space-y-5">
      <Card>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-brand-soft font-display text-xl font-bold text-brand">
            {patient.initials}
          </span>
          <div className="min-w-0 flex-1">
            <Eyebrow>Profile</Eyebrow>
            <h2 className="mt-1 font-display text-xl font-semibold text-ink">
              {patient.name}
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              {patient.age} · {patient.gender} · {patient.village}
            </p>
          </div>
          <Pill tone="mint">
            <Icon name="shield" className="size-3.5" />
            Verified patient
          </Pill>
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardTitle eyebrow="Preferences" title="Language" hint="Used across the app and by the AI assistant." />
          <div className="flex flex-wrap gap-2">
            {languages.map((language, index) => (
              <Pill key={language} tone={index === 2 ? "brand" : "neutral"}>
                {language}
              </Pill>
            ))}
          </div>

          <div className="mt-6 divide-y divide-line border-t border-line pt-2">
            <Toggle
              label="Read answers aloud"
              hint="Useful for patients who cannot read comfortably."
              defaultOn
            />
            <Toggle
              label="Large text"
              hint="Increases font size across the workspace."
            />
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
          <CardTitle eyebrow="Offline" title="Data & sync" />
          <div className="rounded-2xl bg-surface-soft p-4">
            <p className="flex items-center gap-2 text-sm font-medium text-ink">
              <Icon name="check" className="size-4 text-risk-low" />
              All data synced
            </p>
            <p className="mt-1 text-xs text-ink-soft">
              Last sync 4 minutes ago · 0 items waiting
            </p>
          </div>
          <div className="mt-2 divide-y divide-line">
            <Toggle
              label="Work offline"
              hint="Keeps a local copy so the app runs without internet."
              defaultOn
            />
            <Toggle
              label="Sync only on Wi-Fi"
              hint="Saves mobile data in rural areas."
            />
          </div>
        </Card>

        <Card>
          <CardTitle
            eyebrow="Government Scheme Navigator"
            title="Schemes you may be eligible for"
          />
          <ul className="space-y-3">
            {schemes.map((scheme) => (
              <li
                key={scheme.name}
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
              Ends this encrypted session on the device.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-medium text-ink-soft transition hover:bg-surface-soft hover:text-ink"
          >
            <Icon name="logout" className="size-4" />
            Sign out
          </Link>
        </div>
      </Card>
    </div>
  );
}
