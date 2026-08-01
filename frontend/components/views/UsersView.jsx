"use client";

import { useState } from "react";
import { ErrorState, Loading } from "@/components/DataStates";
import { Icon } from "@/components/Icons";
import { Card, CardTitle, Pill } from "@/components/ui";
import { api } from "@/lib/api";
import { useApi } from "@/lib/useApi";

export default function UsersView() {
  const users = useApi("/api/admin/users");
  const [formData, setFormData] = useState({ email: "", name: "", password: "", role: "doctor", patient_id: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [formError, setFormError] = useState("");

  if (users.loading) return <Loading rows={5} />;
  if (users.error) {
    return <ErrorState error={users.error} onRetry={users.reload} />;
  }

  async function handleCreate(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError("");
    try {
      const payload = {
        email: formData.email,
        name: formData.name,
        password: formData.password,
        role: formData.role,
        patient_id: formData.patient_id ? parseInt(formData.patient_id) : null
      };
      await api.post("/api/admin/users", payload);
      setFormData({ email: "", name: "", password: "", role: "doctor", patient_id: "" });
      users.reload();
    } catch (err) {
      setFormError(err.message || "Failed to create user");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Are you sure you want to delete this user?")) return;
    setDeleteId(id);
    try {
      await api.delete(`/api/admin/users/${id}`);
      users.reload();
    } catch (err) {
      alert("Failed to delete user: " + err.message);
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 lg:grid-cols-3">
        
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardTitle
              eyebrow="Directory"
              title="Registered Users"
              hint="All staff and patient accounts"
            />
            <div className="mt-6 divide-y divide-line border-t border-line">
              {users.data.map((user) => (
                <div key={user.id} className="flex items-center justify-between py-4">
                  <div>
                    <p className="font-semibold text-ink">{user.name}</p>
                    <p className="text-sm text-ink-soft">{user.email}</p>
                    {user.patient_id && (
                      <p className="text-xs text-ink-faint">Patient ID: {user.patient_id}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <Pill tone={user.role === 'admin' ? 'brand' : user.role === 'patient' ? 'mint' : 'neutral'}>
                      {user.role}
                    </Pill>
                    <button
                      onClick={() => handleDelete(user.id)}
                      disabled={deleteId === user.id || user.role === 'admin'}
                      className="text-risk-high hover:opacity-75 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Delete User"
                    >
                      <Icon name="x" className="size-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div>
          <Card>
            <CardTitle
              eyebrow="Management"
              title="Create New User"
            />
            <form onSubmit={handleCreate} className="mt-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink">Name</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(d => ({ ...d, name: e.target.value }))}
                  className="mt-1 block w-full rounded-xl border border-line bg-surface p-2.5 text-sm outline-none focus:border-brand"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink">Email</label>
                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(d => ({ ...d, email: e.target.value }))}
                  className="mt-1 block w-full rounded-xl border border-line bg-surface p-2.5 text-sm outline-none focus:border-brand"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink">Password</label>
                <input
                  required
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(d => ({ ...d, password: e.target.value }))}
                  className="mt-1 block w-full rounded-xl border border-line bg-surface p-2.5 text-sm outline-none focus:border-brand"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink">Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(d => ({ ...d, role: e.target.value }))}
                  className="mt-1 block w-full rounded-xl border border-line bg-surface p-2.5 text-sm outline-none focus:border-brand"
                >
                  <option value="patient">Patient</option>
                  <option value="doctor">Doctor</option>
                  <option value="caregiver">Caregiver</option>
                  <option value="admin">Admin</option>
                  <option value="gov">Gov</option>
                </select>
              </div>
              {(formData.role === "patient" || formData.role === "caregiver") && (
                <div>
                  <label className="block text-sm font-medium text-ink">Patient ID (Required for Patient/Caregiver)</label>
                  <input
                    type="number"
                    value={formData.patient_id}
                    onChange={(e) => setFormData(d => ({ ...d, patient_id: e.target.value }))}
                    className="mt-1 block w-full rounded-xl border border-line bg-surface p-2.5 text-sm outline-none focus:border-brand"
                    placeholder="1"
                    required
                  />
                </div>
              )}
              {formError && <p className="text-sm text-risk-high">{formError}</p>}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-ink py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
              >
                {isSubmitting ? "Creating..." : "Create User"}
              </button>
            </form>
          </Card>
        </div>
        
      </div>
    </div>
  );
}
