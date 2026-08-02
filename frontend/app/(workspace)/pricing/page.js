"use client";

import { useState, useEffect } from "react";
import { authFetch } from "@/lib/api";
import { useSession } from "@/lib/useApi";
import { Icon } from "@/components/Icons";
import LimitWarningBanner from "@/components/LimitWarningBanner";
import RazorpayModal from "@/components/RazorpayModal";

export default function PricingPage() {
  const { user } = useSession();
  const [activeTab, setActiveTab] = useState(user?.role === "doctor" ? "doctor" : "patient");
  const [subData, setSubData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);
  const [notice, setNotice] = useState(null);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    planTier: "standard",
    role: "patient",
    amount: 499,
    planName: "Standard Plan",
  });

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const res = await authFetch("/api/payments/my-subscription");
      if (res.ok) {
        const data = await res.json();
        setSubData(data);
      }
    } catch (err) {
      console.error("Failed to load subscription status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const handleBuyPlan = (planTier, role) => {
    let amt = 499;
    if (role === "patient") {
      amt = planTier === "premium" ? 1499 : 499;
    } else {
      amt = planTier === "premium" ? 999 : 399;
    }
    setNotice(null);
    setModalConfig({
      isOpen: true,
      planTier,
      role,
      amount: amt,
      planName: `${planTier.charAt(0).toUpperCase() + planTier.slice(1)} Plan`,
    });
  };

  const handleDirectDemoUpgrade = async (planTier, role) => {
    try {
      setPurchasing(planTier);
      const res = await authFetch("/api/payments/upgrade-demo", {
        method: "POST",
        body: JSON.stringify({ plan_tier: planTier, role }),
      });
      if (res.ok) {
        const data = await res.json();
        setNotice({
          type: "success",
          message: `[Demo Mode] Account instantly upgraded to ${planTier.toUpperCase()} plan! All features are now unlocked.`,
        });
        fetchSubscription();
      }
    } catch (err) {
      console.error("Demo upgrade error:", err);
    } finally {
      setPurchasing(null);
    }
  };

  const currentPlanTier = subData?.plan_tier?.toLowerCase() || "basic";
  const userRole = user?.role || "patient";

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
      {/* Razorpay Gateway Modal */}
      <RazorpayModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
        planTier={modalConfig.planTier}
        role={modalConfig.role}
        amount={modalConfig.amount}
        planName={modalConfig.planName}
        onPaymentSuccess={(data) => {
          setNotice({
            type: "success",
            message: data.message || `Payment verified via Razorpay! Account upgraded to ${modalConfig.planTier.toUpperCase()} Plan.`,
          });
          fetchSubscription();
        }}
      />

      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-surface via-surface-soft to-brand-soft/30 p-6 md:p-10 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                Razorpay Payment Gateway Connected
              </span>
              <span className="rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand uppercase tracking-wider">
                {userRole.toUpperCase()} ACCOUNT
              </span>
            </div>
            <h1 className="font-display text-2xl font-black text-ink md:text-4xl tracking-tight">
              AURA CareLink Plans & Access
            </h1>
            <p className="mt-2 text-sm text-ink-soft max-w-2xl">
              Flexible subscription plans tailored for patients, caregivers, and healthcare providers. Upgrade anytime for instant feature access and expanded capacity.
            </p>
          </div>

          <div className="flex flex-col items-start md:items-end gap-2 rounded-2xl bg-white/80 p-4 border border-line dark:bg-surface-soft shadow-inner">
            <span className="text-xs font-semibold text-ink-faint uppercase tracking-wider">Current Active Plan</span>
            <div className="flex items-center gap-2">
              <span className="font-display text-lg font-bold text-brand uppercase">
                {currentPlanTier} Plan
              </span>
              {subData?.billing_cycle && (
                <span className="rounded-md bg-surface-soft px-2 py-0.5 text-xs text-ink-soft border border-line">
                  {subData.billing_cycle}
                </span>
              )}
            </div>
            {subData?.plan_expires_at && (
              <span className="text-[11px] text-ink-faint">
                Renews: {new Date(subData.plan_expires_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      {notice && (
        <div
          className={`flex items-center justify-between gap-4 rounded-2xl p-4 text-xs font-semibold shadow-sm ${
            notice.type === "success"
              ? "bg-emerald-50 text-emerald-900 border border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 text-rose-900 border border-rose-300 dark:bg-rose-950/40 dark:text-rose-200 dark:border-rose-800"
          }`}
        >
          <div className="flex items-center gap-3">
            <Icon name={notice.type === "success" ? "check" : "alert"} className="size-5 shrink-0" />
            <span>{notice.message}</span>
          </div>
          <button onClick={() => setNotice(null)} className="opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* 80% Capacity Limit Warning Banner */}
      {subData && (
        <LimitWarningBanner
          warnings={subData.warnings}
          hasWarning={subData.has_80_percent_warning}
        />
      )}

      {/* Usage Counters Box */}
      {subData?.usage_summary && (
        <div className="rounded-3xl border border-line bg-surface p-6 shadow-[0_1px_2px_rgba(11,27,58,0.04),0_12px_28px_-18px_rgba(11,27,58,0.25)]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink-faint mb-4 flex items-center gap-2">
            <Icon name="barChart" className="size-4 text-brand" />
            Your Plan Capacity & Usage Counters
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(subData.usage_summary).map(([key, val]) => (
              <div key={key} className="rounded-2xl border border-line/70 bg-surface-soft/60 p-4">
                <div className="flex justify-between items-center mb-1 text-xs">
                  <span className="font-semibold text-ink capitalize">
                    {key.replace(/_/g, " ")}
                  </span>
                  <span className={`font-bold ${val.percentage >= 80 ? "text-amber-600" : "text-brand"}`}>
                    {val.used_mb !== undefined ? `${val.used_mb} MB` : val.used} / {val.limit_mb ? (val.limit_mb > 99999 ? "Unlimited" : `${val.limit_mb} MB`) : (val.limit > 9999 ? "Unlimited" : val.limit)}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-line/60">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      val.percentage >= 80 ? "bg-gradient-to-r from-amber-500 to-rose-500" : "bg-gradient-to-r from-brand to-sky-500"
                    }`}
                    style={{ width: `${Math.min(val.percentage, 100)}%` }}
                  />
                </div>
                <span className="text-[10px] text-ink-faint mt-1 block text-right">
                  {val.percentage}% used
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Tabs (Patient vs Doctor Plans) */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-2xl bg-surface-soft p-1.5 border border-line shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab("patient")}
            className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold transition ${
              activeTab === "patient"
                ? "bg-white text-brand shadow-md dark:bg-surface dark:text-white"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            <Icon name="heart" className="size-4" />
            Patient Plans (Includes Caregiver)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("doctor")}
            className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-bold transition ${
              activeTab === "doctor"
                ? "bg-white text-brand shadow-md dark:bg-surface dark:text-white"
                : "text-ink-soft hover:text-ink"
            }`}
          >
            <Icon name="userCheck" className="size-4" />
            Doctor & Provider Plans
          </button>
        </div>
      </div>

      {/* PATIENT PLANS SECTION */}
      {activeTab === "patient" && (
        <div className="space-y-8">
          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Basic Plan */}
            <div className={`relative flex flex-col justify-between rounded-3xl border p-6 transition ${currentPlanTier === "basic" ? "border-brand bg-brand-soft/20 shadow-md" : "border-line bg-surface"}`}>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-ink-faint">Basic Plan</span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-black text-ink">Free</span>
                  <span className="text-xs text-ink-faint">/ forever</span>
                </div>
                <p className="mt-2 text-xs text-ink-soft">Essential health record access and basic reminders for patients.</p>

                <ul className="mt-6 space-y-2.5 text-xs">
                  <li className="flex items-center gap-2 text-ink-soft"><Icon name="check" className="size-4 text-emerald-600 shrink-0" /> Personal health profile</li>
                  <li className="flex items-center gap-2 text-ink-soft"><Icon name="check" className="size-4 text-emerald-600 shrink-0" /> 500 MB medical storage</li>
                  <li className="flex items-center gap-2 text-ink-soft"><Icon name="check" className="size-4 text-emerald-600 shrink-0" /> Basic medication reminders</li>
                  <li className="flex items-center gap-2 text-ink-soft"><Icon name="check" className="size-4 text-emerald-600 shrink-0" /> 30-day health timeline</li>
                  <li className="flex items-center gap-2 text-ink-soft"><Icon name="check" className="size-4 text-emerald-600 shrink-0" /> 1 Caregiver access</li>
                  <li className="flex items-center gap-2 text-ink-soft"><Icon name="check" className="size-4 text-emerald-600 shrink-0" /> 5 AI symptom checks/month</li>
                </ul>
              </div>

              <div className="mt-8">
                {currentPlanTier === "basic" ? (
                  <span className="block w-full text-center rounded-xl bg-surface-soft py-2.5 text-xs font-bold text-ink-faint border border-line">
                    Current Active Plan
                  </span>
                ) : (
                  <span className="block w-full text-center rounded-xl bg-surface-soft/60 py-2.5 text-xs font-medium text-ink-faint border border-line/60">
                    Included in Higher Tier
                  </span>
                )}
              </div>
            </div>

            {/* Standard Plan (Recommended) */}
            <div className={`relative flex flex-col justify-between rounded-3xl border-2 p-6 shadow-xl transition ${currentPlanTier === "standard" ? "border-emerald-500 bg-emerald-500/5" : "border-brand bg-gradient-to-b from-surface to-brand-soft/20"}`}>
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-brand to-sky-600 px-4 py-1 text-[11px] font-extrabold uppercase tracking-widest text-white shadow-md">
                ★ Recommended (Most Popular)
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand">Standard Plan</span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-black text-ink">₹499</span>
                  <span className="text-xs text-ink-faint">/ year</span>
                </div>
                <p className="mt-2 text-xs text-ink-soft">Comprehensive care management with OCR scanning and family tracking.</p>

                <ul className="mt-6 space-y-2.5 text-xs">
                  <li className="flex items-center gap-2 font-medium text-ink"><Icon name="check" className="size-4 text-brand shrink-0" /> Everything in Basic +</li>
                  <li className="flex items-center gap-2 text-ink"><Icon name="check" className="size-4 text-emerald-600 shrink-0" /> <strong>5 GB</strong> encrypted storage</li>
                  <li className="flex items-center gap-2 text-ink"><Icon name="check" className="size-4 text-emerald-600 shrink-0" /> OCR & searchable prescriptions</li>
                  <li className="flex items-center gap-2 text-ink"><Icon name="check" className="size-4 text-emerald-600 shrink-0" /> Smart medication reminders</li>
                  <li className="flex items-center gap-2 text-ink"><Icon name="check" className="size-4 text-emerald-600 shrink-0" /> <strong>Up to 3 caregivers</strong></li>
                  <li className="flex items-center gap-2 text-ink"><Icon name="check" className="size-4 text-emerald-600 shrink-0" /> Emergency SOS alerts</li>
                  <li className="flex items-center gap-2 text-ink"><Icon name="check" className="size-4 text-emerald-600 shrink-0" /> 100 AI symptom checks/mo</li>
                  <li className="flex items-center gap-2 text-ink"><Icon name="check" className="size-4 text-emerald-600 shrink-0" /> Family management (4 members)</li>
                </ul>
              </div>

              <div className="mt-8 space-y-2">
                {currentPlanTier === "standard" ? (
                  <span className="block w-full text-center rounded-xl bg-emerald-500 py-2.5 text-xs font-bold text-white shadow">
                    ✓ Active Standard Plan
                  </span>
                ) : (
                  <>
                    <button
                      onClick={() => handleBuyPlan("standard", "patient")}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-sky-600 py-3 text-xs font-bold text-white shadow-lg transition hover:from-brand-dark hover:to-sky-700"
                    >
                      <Icon name="sparkles" className="size-4" />
                      Buy Standard Plan (₹499/yr)
                    </button>
                    <button
                      onClick={() => handleDirectDemoUpgrade("standard", "patient")}
                      className="w-full text-center text-[10px] text-ink-faint underline hover:text-brand"
                    >
                      [Demo One-Click Instant Upgrade]
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Premium Plan */}
            <div className={`relative flex flex-col justify-between rounded-3xl border p-6 transition ${currentPlanTier === "premium" ? "border-purple-500 bg-purple-500/10 shadow-lg" : "border-line bg-surface"}`}>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Premium Plan</span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-black text-ink">₹1,499</span>
                  <span className="text-xs text-ink-faint">/ year</span>
                </div>
                <p className="mt-2 text-xs text-ink-soft">Unlimited AI assistance, predictive analytics, and real-time SOS location alerts.</p>

                <ul className="mt-6 space-y-2.5 text-xs">
                  <li className="flex items-center gap-2 font-medium text-ink"><Icon name="check" className="size-4 text-purple-600 shrink-0" /> Everything in Standard +</li>
                  <li className="flex items-center gap-2 text-ink"><Icon name="check" className="size-4 text-purple-600 shrink-0" /> <strong>Unlimited</strong> encrypted storage</li>
                  <li className="flex items-center gap-2 text-ink"><Icon name="check" className="size-4 text-purple-600 shrink-0" /> AI-organized history & reminders</li>
                  <li className="flex items-center gap-2 text-ink"><Icon name="check" className="size-4 text-purple-600 shrink-0" /> <strong>Unlimited caregivers</strong> & sync</li>
                  <li className="flex items-center gap-2 text-ink"><Icon name="check" className="size-4 text-purple-600 shrink-0" /> Real-time SOS location alerts</li>
                  <li className="flex items-center gap-2 text-ink"><Icon name="check" className="size-4 text-purple-600 shrink-0" /> <strong>Unlimited AI</strong> assistant & checks</li>
                  <li className="flex items-center gap-2 text-ink"><Icon name="check" className="size-4 text-purple-600 shrink-0" /> Advanced AI lab interpretation</li>
                  <li className="flex items-center gap-2 text-ink"><Icon name="check" className="size-4 text-purple-600 shrink-0" /> 24/7 Priority support</li>
                </ul>
              </div>

              <div className="mt-8 space-y-2">
                {currentPlanTier === "premium" ? (
                  <span className="block w-full text-center rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white shadow">
                    ✓ Active Premium Plan
                  </span>
                ) : (
                  <>
                    <button
                      onClick={() => handleBuyPlan("premium", "patient")}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-xs font-bold text-white shadow-lg transition hover:bg-purple-700"
                    >
                      <Icon name="sparkles" className="size-4" />
                      Buy Premium Plan (₹1,499/yr)
                    </button>
                    <button
                      onClick={() => handleDirectDemoUpgrade("premium", "patient")}
                      className="w-full text-center text-[10px] text-ink-faint underline hover:text-purple-600"
                    >
                      [Demo One-Click Instant Upgrade]
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DOCTOR PLANS SECTION */}
      {activeTab === "doctor" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Doctor Basic */}
            <div className={`relative flex flex-col justify-between rounded-3xl border p-6 transition ${currentPlanTier === "basic" ? "border-brand bg-brand-soft/20" : "border-line bg-surface"}`}>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-ink-faint">Doctor Basic</span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-black text-ink">Free</span>
                  <span className="text-xs text-ink-faint">/ forever</span>
                </div>
                <p className="mt-2 text-xs text-ink-soft">Essential digital profile and appointment management for individual practice.</p>

                <ul className="mt-6 space-y-2.5 text-xs">
                  <li className="flex items-center gap-2 text-ink-soft"><Icon name="check" className="size-4 text-emerald-600 shrink-0" /> Verified doctor profile</li>
                  <li className="flex items-center gap-2 text-ink-soft"><Icon name="check" className="size-4 text-emerald-600 shrink-0" /> 50 appointments/month</li>
                  <li className="flex items-center gap-2 text-ink-soft"><Icon name="check" className="size-4 text-emerald-600 shrink-0" /> Store up to 100 patient records</li>
                  <li className="flex items-center gap-2 text-ink-soft"><Icon name="check" className="size-4 text-emerald-600 shrink-0" /> Basic digital prescriptions</li>
                  <li className="flex items-center gap-2 text-ink-soft"><Icon name="check" className="size-4 text-emerald-600 shrink-0" /> 10 AI prompts/month</li>
                </ul>
              </div>

              <div className="mt-8">
                {currentPlanTier === "basic" ? (
                  <span className="block w-full text-center rounded-xl bg-surface-soft py-2.5 text-xs font-bold text-ink-faint border border-line">
                    Current Active Plan
                  </span>
                ) : (
                  <span className="block w-full text-center rounded-xl bg-surface-soft/60 py-2.5 text-xs font-medium text-ink-faint border border-line/60">
                    Included in Higher Tier
                  </span>
                )}
              </div>
            </div>

            {/* Doctor Standard (Recommended) */}
            <div className={`relative flex flex-col justify-between rounded-3xl border-2 p-6 shadow-xl transition ${currentPlanTier === "standard" ? "border-emerald-500 bg-emerald-500/5" : "border-brand bg-gradient-to-b from-surface to-brand-soft/20"}`}>
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-brand to-sky-600 px-4 py-1 text-[11px] font-extrabold uppercase tracking-widest text-white shadow-md">
                ★ Recommended (Most Popular)
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-brand">Doctor Standard</span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-black text-ink">₹399</span>
                  <span className="text-xs text-ink-faint">/ month</span>
                </div>
                <p className="mt-2 text-xs text-ink-soft">Unlimited appointments, 2,000 patient records, branded prescriptions & AI tools.</p>

                <ul className="mt-6 space-y-2.5 text-xs">
                  <li className="flex items-center gap-2 font-medium text-ink"><Icon name="check" className="size-4 text-brand shrink-0" /> Everything in Basic +</li>
                  <li className="flex items-center gap-2 text-ink"><Icon name="check" className="size-4 text-emerald-600 shrink-0" /> <strong>Unlimited appointments</strong></li>
                  <li className="flex items-center gap-2 text-ink"><Icon name="check" className="size-4 text-emerald-600 shrink-0" /> Up to <strong>2,000 patient records</strong></li>
                  <li className="flex items-center gap-2 text-ink"><Icon name="check" className="size-4 text-emerald-600 shrink-0" /> Branded prescription templates</li>
                  <li className="flex items-center gap-2 text-ink"><Icon name="check" className="size-4 text-emerald-600 shrink-0" /> 500 AI assistant prompts/mo</li>
                  <li className="flex items-center gap-2 text-ink"><Icon name="check" className="size-4 text-emerald-600 shrink-0" /> Caregiver collaboration tools</li>
                  <li className="flex items-center gap-2 text-ink"><Icon name="check" className="size-4 text-emerald-600 shrink-0" /> Featured doctor listing</li>
                </ul>
              </div>

              <div className="mt-8 space-y-2">
                {currentPlanTier === "standard" ? (
                  <span className="block w-full text-center rounded-xl bg-emerald-500 py-2.5 text-xs font-bold text-white shadow">
                    ✓ Active Standard Plan
                  </span>
                ) : (
                  <>
                    <button
                      onClick={() => handleBuyPlan("standard", "doctor")}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-sky-600 py-3 text-xs font-bold text-white shadow-lg transition hover:from-brand-dark hover:to-sky-700"
                    >
                      <Icon name="sparkles" className="size-4" />
                      Buy Standard Plan (₹399/mo)
                    </button>
                    <button
                      onClick={() => handleDirectDemoUpgrade("standard", "doctor")}
                      className="w-full text-center text-[10px] text-ink-faint underline hover:text-brand"
                    >
                      [Demo One-Click Instant Upgrade]
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Doctor Premium */}
            <div className={`relative flex flex-col justify-between rounded-3xl border p-6 transition ${currentPlanTier === "premium" ? "border-purple-500 bg-purple-500/10 shadow-lg" : "border-line bg-surface"}`}>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Doctor Premium</span>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-black text-ink">₹999</span>
                  <span className="text-xs text-ink-faint">/ month</span>
                </div>
                <p className="mt-2 text-xs text-ink-soft">Unlimited patient capacity, E-signatures, hospital API integration, and predictive diagnostics.</p>

                <ul className="mt-6 space-y-2.5 text-xs">
                  <li className="flex items-center gap-2 font-medium text-ink"><Icon name="check" className="size-4 text-purple-600 shrink-0" /> Everything in Standard +</li>
                  <li className="flex items-center gap-2 text-ink"><Icon name="check" className="size-4 text-purple-600 shrink-0" /> <strong>Unlimited patient records</strong></li>
                  <li className="flex items-center gap-2 text-ink"><Icon name="check" className="size-4 text-purple-600 shrink-0" /> Custom prescriptions + E-sign</li>
                  <li className="flex items-center gap-2 text-ink"><Icon name="check" className="size-4 text-purple-600 shrink-0" /> HD + Priority teleconsultation</li>
                  <li className="flex items-center gap-2 text-ink"><Icon name="check" className="size-4 text-purple-600 shrink-0" /> <strong>Unlimited AI</strong> assistant</li>
                  <li className="flex items-center gap-2 text-ink"><Icon name="check" className="size-4 text-purple-600 shrink-0" /> Full hospital/API integration</li>
                  <li className="flex items-center gap-2 text-ink"><Icon name="check" className="size-4 text-purple-600 shrink-0" /> Dedicated onboarding & support</li>
                </ul>
              </div>

              <div className="mt-8 space-y-2">
                {currentPlanTier === "premium" ? (
                  <span className="block w-full text-center rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white shadow">
                    ✓ Active Premium Plan
                  </span>
                ) : (
                  <>
                    <button
                      onClick={() => handleBuyPlan("premium", "doctor")}
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-xs font-bold text-white shadow-lg transition hover:bg-purple-700"
                    >
                      <Icon name="sparkles" className="size-4" />
                      Buy Premium Plan (₹999/mo)
                    </button>
                    <button
                      onClick={() => handleDirectDemoUpgrade("premium", "doctor")}
                      className="w-full text-center text-[10px] text-ink-faint underline hover:text-purple-600"
                    >
                      [Demo One-Click Instant Upgrade]
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
