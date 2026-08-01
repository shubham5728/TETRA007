"use client";

import { Card, CardTitle } from "@/components/ui";
import { Icon } from "@/components/Icons";

export default function DoctorAiSummaryView({
  currentPatient,
  isAiLoading,
  aiSummary,
  handleGenerateAiSummary,
  showToast,
}) {
  return (
    <Card>
      <CardTitle
        eyebrow="AI Patient Clinical Summary Generation"
        title="AURA Sentinel AI Clinical Assistant"
        hint="Generate instant clinical summaries analyzing patient vitals, symptoms, and readmission risk"
        action={
          <button
            onClick={() => handleGenerateAiSummary(currentPatient)}
            disabled={isAiLoading}
            className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-purple-700 disabled:opacity-50"
          >
            <Icon name="sparkle" className="size-4" />
            {isAiLoading ? "Processing Sentinel Data..." : "Generate AI Summary"}
          </button>
        }
      />

      {isAiLoading ? (
        <div className="py-12 text-center">
          <Icon name="sparkle" className="mx-auto size-10 animate-spin text-purple-600" />
          <p className="mt-3 text-xs font-semibold text-ink">Running Sentinel Neural Model analysis...</p>
        </div>
      ) : aiSummary ? (
        <div className="rounded-2xl border border-purple-500/20 bg-purple-50/50 p-6 dark:bg-purple-950/20 space-y-4">
          <div className="flex items-center justify-between border-b border-purple-200 pb-3 dark:border-purple-800">
            <div className="flex items-center gap-2">
              <Icon name="sparkle" className="size-4 text-purple-600" />
              <h4 className="font-display font-bold text-purple-900 dark:text-purple-200">
                AI Clinical Analysis — {currentPatient?.name}
              </h4>
            </div>
            <span className="text-xs text-purple-700">Generated at {aiSummary.timestamp}</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 text-xs">
            <div>
              <p className="font-bold text-purple-900 uppercase">Key Clinical Insights</p>
              <ul className="mt-2 space-y-1.5 text-ink-soft">
                {aiSummary.findings.map((f, i) => (
                  <li key={i}>• {f}</li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-bold text-purple-900 uppercase">Risk Indicators</p>
              <ul className="mt-2 space-y-1.5 text-ink-soft">
                {aiSummary.flags.map((flag, i) => (
                  <li key={i}>{flag}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-xl border border-purple-300 bg-white/70 p-4 dark:bg-purple-900/30">
            <p className="text-xs font-bold text-purple-900 dark:text-purple-200">AI Recommended Action:</p>
            <p className="mt-1 text-xs text-ink leading-relaxed">{aiSummary.recommendation}</p>
            <button
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(aiSummary.recommendation);
                }
                showToast("AI recommendation copied to clipboard!");
              }}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-purple-700"
            >
              Copy AI Recommendation
            </button>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-xs text-ink-soft">
          <p>Click "Generate AI Summary" above to run Sentinel AI clinical analysis for {currentPatient?.name}.</p>
        </div>
      )}
    </Card>
  );
}
