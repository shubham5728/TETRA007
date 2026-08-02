"use client";

import { useState } from "react";
import { authFetch } from "@/lib/api";
import { Icon } from "./Icons";

export default function RazorpayModal({
  isOpen,
  onClose,
  planTier = "standard",
  role = "patient",
  amount = 499,
  planName = "Standard Plan",
  onPaymentSuccess,
}) {
  const [method, setMethod] = useState("upi");
  const [upiId, setUpiId] = useState("user@upi");
  const [cardNumber, setCardNumber] = useState("4532 •••• •••• 8892");
  const [step, setStep] = useState("details"); // 'details' | 'processing' | 'success' | 'error'
  const [statusMsg, setStatusMsg] = useState("");

  if (!isOpen) return null;

  const handleProcessPayment = async () => {
    try {
      setStep("processing");
      setStatusMsg("Creating Razorpay Order...");

      // 1. Call Backend to create order
      const orderRes = await authFetch("/api/payments/create-order", {
        method: "POST",
        body: JSON.stringify({ plan_tier: planTier, role }),
      });

      if (!orderRes.ok) {
        const err = await orderRes.json();
        throw new Error(err.detail || "Order creation failed");
      }

      const orderData = await orderRes.json();
      const orderId = orderData.order_id;

      // 2. Simulate payment processing & signature verification
      setStatusMsg("Processing Payment via Razorpay Gateway...");
      await new Promise((r) => setTimeout(r, 1200));

      setStatusMsg("Verifying Signature & Updating Account...");
      const verifyRes = await authFetch("/api/payments/verify", {
        method: "POST",
        body: JSON.stringify({
          razorpay_order_id: orderId,
          razorpay_payment_id: `pay_${Math.random().toString(36).substring(2, 12)}`,
          razorpay_signature: "rzp_hmac_verified_ok",
        }),
      });

      if (!verifyRes.ok) {
        const errData = await verifyRes.json();
        throw new Error(errData.detail || "Payment verification failed");
      }

      const verifyData = await verifyRes.json();
      setStep("success");

      setTimeout(() => {
        if (onPaymentSuccess) onPaymentSuccess(verifyData);
        onClose();
        setStep("details");
      }, 1800);
    } catch (err) {
      console.error("Payment error:", err);
      setStep("error");
      setStatusMsg(err.message || "Payment processing error.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        
        {/* Razorpay Top Header Banner */}
        <div className="bg-slate-900 px-6 py-5 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {/* Razorpay Shield Icon */}
              <div className="grid size-9 place-items-center rounded-xl bg-blue-600 font-bold text-white shadow-md">
                R
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-base font-bold tracking-tight text-white">
                    Razorpay
                  </span>
                  <span className="rounded bg-blue-500/30 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-blue-300">
                    Test Mode
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">AURA CareLink Payment Gateway</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-full bg-slate-800 p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white transition"
            >
              ✕
            </button>
          </div>

          {/* Amount Display */}
          <div className="mt-4 flex items-baseline justify-between border-t border-slate-800 pt-3">
            <span className="text-xs text-slate-400 font-medium">Total Amount Due</span>
            <span className="font-display text-2xl font-black text-white">
              ₹{amount.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {step === "details" && (
            <div className="space-y-5">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Select Payment Method
                </label>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMethod("upi")}
                    className={`flex flex-col items-center justify-center rounded-xl border p-3 text-xs font-bold transition ${
                      method === "upi"
                        ? "border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300"
                    }`}
                  >
                    <span className="text-lg">📱</span>
                    <span className="mt-1">UPI / QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod("card")}
                    className={`flex flex-col items-center justify-center rounded-xl border p-3 text-xs font-bold transition ${
                      method === "card"
                        ? "border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300"
                    }`}
                  >
                    <span className="text-lg">💳</span>
                    <span className="mt-1">Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod("netbanking")}
                    className={`flex flex-col items-center justify-center rounded-xl border p-3 text-xs font-bold transition ${
                      method === "netbanking"
                        ? "border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300"
                    }`}
                  >
                    <span className="text-lg">🏦</span>
                    <span className="mt-1">Netbanking</span>
                  </button>
                </div>
              </div>

              {/* Form Input depending on method */}
              {method === "upi" && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Virtual Payment Address (VPA) / PhonePe / GPay
                  </label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    Supports Google Pay, PhonePe, Paytm, BHIM & any UPI ID
                  </span>
                </div>
              )}

              {method === "card" && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                    Card Number (Visa / Mastercard / RuPay)
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 focus:border-blue-600 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="MM/YY"
                      defaultValue="08/29"
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                    <input
                      type="password"
                      placeholder="CVV"
                      defaultValue="778"
                      className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {method === "netbanking" && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                    Popular Indian Banks
                  </label>
                  <select className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
                    <option>HDFC Bank</option>
                    <option>State Bank of India (SBI)</option>
                    <option>ICICI Bank</option>
                    <option>Axis Bank</option>
                    <option>Kotak Mahindra Bank</option>
                  </select>
                </div>
              )}

              {/* Pay Action Button */}
              <button
                type="button"
                onClick={handleProcessPayment}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-xs font-bold text-white shadow-lg transition hover:bg-blue-700"
              >
                <Icon name="shield" className="size-4" />
                Pay ₹{amount.toLocaleString("en-IN")} via Razorpay
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
                <span>🔒</span> 256-bit SSL Encrypted • Powered by Razorpay
              </div>
            </div>
          )}

          {step === "processing" && (
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto grid size-14 place-items-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                <span className="size-8 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
              </div>
              <div>
                <h4 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  Processing Razorpay Payment
                </h4>
                <p className="mt-1 text-xs text-slate-500">{statusMsg}</p>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <Icon name="check" className="size-8 stroke-[3]" />
              </div>
              <div>
                <h4 className="font-display text-lg font-black text-slate-900 dark:text-white">
                  Payment Verified Successfully!
                </h4>
                <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  Your account has been upgraded to {planName}.
                </p>
              </div>
            </div>
          )}

          {step === "error" && (
            <div className="py-6 text-center space-y-4">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                <Icon name="alert" className="size-6" />
              </div>
              <div>
                <h4 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  Payment Error
                </h4>
                <p className="mt-1 text-xs text-rose-600">{statusMsg}</p>
              </div>
              <button
                onClick={() => setStep("details")}
                className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
