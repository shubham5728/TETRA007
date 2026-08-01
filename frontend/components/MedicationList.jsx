"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Icon } from "./Icons";
import { ProgressBar } from "./ui";

/**
 * Today's medicines. Tapping a row marks the dose taken or missed, which posts
 * to the API and moves the adherence figure the Sentinel model reads.
 */
export default function MedicationList({ medications, onChange, showPlain = true }) {
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  async function toggle(medication) {
    setBusyId(medication.id);
    setError(null);
    try {
      await api.post(`/api/patient/medications/${medication.id}/take`, {
        taken: !medication.taken_today,
      });
      await onChange?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <ul className="divide-y divide-line">
        {medications.map((medication) => {
          const busy = busyId === medication.id;
          return (
            <li key={medication.id} className="flex items-center gap-4 py-3.5">
              <button
                type="button"
                onClick={() => toggle(medication)}
                disabled={busy}
                aria-pressed={medication.taken_today}
                aria-label={`Mark ${medication.name} as ${
                  medication.taken_today ? "not taken" : "taken"
                }`}
                className={`grid size-10 shrink-0 place-items-center rounded-xl transition disabled:opacity-50 ${
                  medication.taken_today
                    ? "bg-mint text-mint-ink hover:bg-mint-ink/15"
                    : "bg-risk-med/10 text-risk-med hover:bg-risk-med/20"
                }`}
              >
                <Icon
                  name={medication.taken_today ? "check" : "clock"}
                  className="size-5"
                />
              </button>

              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink">
                  {medication.name}{" "}
                  <span className="text-ink-faint">· {medication.dose}</span>
                </p>
                <p className="truncate text-sm text-ink-soft">
                  {showPlain ? medication.plain : medication.schedule}
                </p>
              </div>

              <div className="hidden w-28 shrink-0 sm:block">
                <ProgressBar
                  value={medication.adherence}
                  tone={medication.adherence >= 85 ? "low" : "med"}
                  showValue
                />
              </div>
            </li>
          );
        })}
      </ul>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-risk-high">
          {error}
        </p>
      ) : null}
    </>
  );
}
