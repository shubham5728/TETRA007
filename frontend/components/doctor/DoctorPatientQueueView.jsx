"use client";

import { Card, CardTitle, ProgressBar, RiskPill } from "@/components/ui";
import { Icon } from "@/components/Icons";

const RISK_TONE = { High: "high", Moderate: "med", Low: "low" };

export default function DoctorPatientQueueView({
  filteredPatients,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  riskFilter,
  setRiskFilter,
  currentPatient,
  setSelectedPatientId,
  handleTabChange,
}) {
  return (
    <Card>
      <div className="flex flex-col justify-between gap-4 border-b border-line pb-4 sm:flex-row sm:items-center">
        <CardTitle
          eyebrow="All Patient Roster"
          title="All Patient Directory & Risk Triage"
          hint="Inspect complete patient cohort, filter by Sentinel readmission risk level, and select records"
        />

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="relative w-full sm:w-52">
            <input
              type="text"
              placeholder="Search patient or diagnosis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-3.5 py-2 pl-9 text-xs text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none"
            />
            <Icon name="search" className="absolute left-3 top-2.5 size-3.5 text-ink-faint" />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full sm:w-auto rounded-xl border border-line bg-surface px-3 py-2 text-xs text-ink focus:border-brand focus:outline-none"
          >
            <option value="risk-desc">Highest Risk First</option>
            <option value="risk-asc">Lowest Risk First</option>
            <option value="name">Patient Name (A-Z)</option>
          </select>

          <div className="flex flex-wrap max-w-full overflow-x-auto rounded-xl border border-line bg-surface p-1">
            {["All", "High", "Moderate", "Low"].map((level) => (
              <button
                key={level}
                onClick={() => setRiskFilter(level)}
                className={`inline-flex min-h-[36px] items-center justify-center rounded-lg px-3.5 py-1.5 text-xs font-semibold transition ${
                  riskFilter === level
                    ? "bg-brand text-white shadow-sm"
                    : "text-ink-soft hover:text-ink"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Roster Unified Responsive Table */}
      <div className="mt-4 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[620px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs font-semibold uppercase tracking-wide text-ink-faint">
              <th className="pb-3 pr-4">Patient Details</th>
              <th className="pb-3 pr-4">Condition / Diagnosis</th>
              <th className="pb-3 pr-4">Sentinel Readmission Risk</th>
              <th className="pb-3 pr-4">Risk Level</th>
              <th className="pb-3 pr-4">Last Check-in</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filteredPatients.length ? (
              filteredPatients.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => setSelectedPatientId(row.id)}
                  className={`cursor-pointer transition hover:bg-surface-soft ${
                    currentPatient?.id === row.id ? "bg-brand-soft/30" : ""
                  }`}
                >
                  <td className="py-3.5 pr-4">
                    <p className="font-semibold text-ink">{row.name}</p>
                    <p className="text-xs text-ink-faint">{row.age} yrs · Patient #{row.id}</p>
                  </td>
                  <td className="py-3.5 pr-4 text-ink-soft">{row.condition}</td>
                  <td className="py-3.5 pr-4">
                    <div className="flex w-36 sm:w-44 items-center gap-3">
                      <ProgressBar value={row.risk} tone={RISK_TONE[row.level]} />
                      <span className="w-9 text-right text-xs font-bold text-ink">
                        {row.risk}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 pr-4">
                    <RiskPill level={row.level} />
                  </td>
                  <td className="py-3.5 pr-4 text-xs text-ink-soft">{row.last_check_in}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-8 text-center text-xs text-ink-faint">
                  No matching patients found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
