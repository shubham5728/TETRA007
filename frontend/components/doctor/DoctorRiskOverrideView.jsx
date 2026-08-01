"use client";

import { Card, CardTitle } from "@/components/ui";

export default function DoctorRiskOverrideView({
  overrideLevel,
  setOverrideLevel,
  overrideNote,
  setOverrideNote,
  handleSaveRiskOverride,
}) {
  return (
    <Card>
      <CardTitle
        eyebrow="Sentinel Risk Level Override"
        title="Manual Clinical Risk Level Recalibration"
        hint="Override AI prediction score when clinically indicated. Creates mandatory audit log."
      />

      <div className="rounded-2xl border border-line p-5 text-xs space-y-4 max-w-lg">
        <div>
          <label className="font-semibold text-ink">Target Risk Level</label>
          <select
            value={overrideLevel}
            onChange={(e) => setOverrideLevel(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-ink focus:border-brand focus:outline-none"
          >
            <option value="High">🔴 High Risk (85%)</option>
            <option value="Moderate">🟡 Moderate Risk (55%)</option>
            <option value="Low">🟢 Low Risk (20%)</option>
          </select>
        </div>

        <div>
          <label className="font-semibold text-ink">Mandatory Clinical Justification</label>
          <textarea
            rows={3}
            required
            placeholder="Provide clinical reason for manually altering the AI prediction score..."
            value={overrideNote}
            onChange={(e) => setOverrideNote(e.target.value)}
            className="mt-1 w-full rounded-xl border border-line bg-surface px-3.5 py-2 text-ink focus:border-brand focus:outline-none"
          />
        </div>

        <button
          onClick={handleSaveRiskOverride}
          className="rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:opacity-90"
        >
          Save Override & Log Audit Entry
        </button>
      </div>
    </Card>
  );
}
