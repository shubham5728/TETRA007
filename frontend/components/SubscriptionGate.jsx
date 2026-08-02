"use client";

import Link from "next/link";
import { Icon } from "./Icons";

export default function SubscriptionGate({
  requiredPlan = "standard",
  currentPlan = "basic",
  featureName = "This feature",
  children,
  compact = false,
}) {
  const planRank = { basic: 1, standard: 2, premium: 3 };
  const currentRank = planRank[currentPlan?.toLowerCase()] || 1;
  const requiredRank = planRank[requiredPlan?.toLowerCase()] || 2;

  // If user has sufficient plan rank, show children normally
  if (currentRank >= requiredRank) {
    return <>{children}</>;
  }

  const reqPlanName = requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1);

  if (compact) {
    return (
      <div className="relative overflow-hidden rounded-xl border border-dashed border-amber-300 bg-amber-50/70 p-3 dark:border-amber-700/50 dark:bg-amber-950/20">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
            <Icon name="lock" className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>{featureName} requires <strong className="uppercase">{reqPlanName}</strong> plan</span>
          </div>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm transition hover:bg-amber-700 shrink-0"
          >
            Upgrade <Icon name="arrowRight" className="size-3" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-1">
      {/* Blurred background preview */}
      <div className="pointer-events-none select-none blur-[6px] opacity-40 grayscale-[30%]">
        {children}
      </div>

      {/* Lock Overlay */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center bg-surface/70 backdrop-blur-md">
        <div className="grid size-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 mb-3 shadow-inner">
          <Icon name="lock" className="size-6" />
        </div>
        <h4 className="font-display text-base font-bold text-ink">
          {featureName} is Locked
        </h4>
        <p className="mt-1 max-w-sm text-xs text-ink-soft">
          This premium capability is available on the <strong className="text-brand font-semibold">{reqPlanName} Plan</strong> and above. Upgrade your account to gain instant access.
        </p>

        <div className="mt-4 flex items-center gap-3">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand to-sky-600 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:from-brand-dark hover:to-sky-700"
          >
            <Icon name="sparkles" className="size-4" />
            Upgrade to {reqPlanName}
          </Link>
        </div>
      </div>
    </div>
  );
}
