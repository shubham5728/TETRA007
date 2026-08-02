"use client";

import Link from "next/link";
import { Icon } from "./Icons";
import { Eyebrow, Pill } from "./ui";

export default function LimitWarningBanner({ warnings = [], hasWarning = false }) {
  if (!hasWarning || !warnings || warnings.length === 0) return null;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-surface p-5 sm:p-6 shadow-[0_1px_2px_rgba(11,27,58,0.04),0_12px_28px_-18px_rgba(11,27,58,0.25)]">
      {/* Decorative side accent bar */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-amber-500 to-orange-500" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pl-2">
        <div className="flex items-start gap-4">
          <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
            <Icon name="alert" className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Eyebrow tone="brand">Plan Capacity Alert</Eyebrow>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-500/20">
                <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                80% Capacity Reached
              </span>
            </div>

            <div className="space-y-1">
              {warnings.map((msg, idx) => (
                <p key={idx} className="text-xs font-medium text-ink-soft flex items-center gap-1.5">
                  <span className="size-1 rounded-full bg-amber-500 shrink-0" />
                  {msg}
                </p>
              ))}
            </div>
          </div>
        </div>

        <Link
          href="/pricing"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-dark shrink-0 self-start sm:self-center"
        >
          <Icon name="sparkles" className="size-4" />
          Upgrade Plan
        </Link>
      </div>
    </section>
  );
}
