"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function SubscriptionsDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await api.get("/api/subscriptions/admin/pending");
      setRequests(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id, action) => {
    try {
      await api.post(`/api/subscriptions/admin/${id}/verify?action=${action}`);
      alert(`Request ${action}d successfully`);
      fetchRequests();
    } catch (e) {
      alert("Failed to verify request: " + e.message);
    }
  };

  return (
    <div className="p-8 space-y-6 text-slate-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Subscription Verification
          </h1>
          <p className="text-slate-400 mt-1">
            Review and approve UPI payments for AI chat credits.
          </p>
        </div>
        <button 
          onClick={fetchRequests} 
          className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition"
        >
          Refresh
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-950 text-slate-400">
            <tr>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Patient ID</th>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Plan</th>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Amount</th>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">UTR Number</th>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Txn ID</th>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                  Loading pending requests...
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                  No pending subscription requests found.
                </td>
              </tr>
            ) : (
              requests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-800/50 transition">
                  <td className="px-6 py-4 font-medium">#{r.patient_id}</td>
                  <td className="px-6 py-4">{r.plan_name}</td>
                  <td className="px-6 py-4">₹{r.amount}</td>
                  <td className="px-6 py-4 font-mono text-xs text-blue-400 bg-blue-400/10 rounded px-2 inline-block mt-3">{r.utr_number}</td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-400">{r.transaction_id}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleVerify(r.id, "approve")}
                      className="px-3 py-1.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg hover:bg-green-500/20 transition font-medium"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleVerify(r.id, "reject")}
                      className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg hover:bg-red-500/20 transition font-medium"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
