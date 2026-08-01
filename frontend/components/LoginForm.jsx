"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, setViewingPatientId } from "@/lib/api";
import { Icon } from "./Icons";

const DEMO_PASSWORD = "AuraCare2025";

// Prefill only. The destination comes back from the API, which is the authority
// on what a role is allowed to open.
const roles = [
  { id: "patient", label: "Patient", icon: "heart", email: "patient@auracarelink.com" },
  { id: "doctor", label: "Doctor", icon: "stethoscope", email: "doctor@auracarelink.com" },
  { id: "caregiver", label: "Caregiver", icon: "users", email: "caregiver@auracarelink.com" },
  {
    id: "gov",
    label: "Government Authority",
    icon: "bank",
    email: "gov@auracarelink.com",
    wide: true,
  },
];

export default function LoginForm() {
  const router = useRouter();
  const [roleId, setRoleId] = useState("patient");
  const [email, setEmail] = useState(roles[0].email);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const selected = roles.find((role) => role.id === roleId);

  function pickRole(role) {
    setRoleId(role.id);
    setEmail(role.email); // keep the prefilled credentials in step with the role
    setPassword(DEMO_PASSWORD);
    setError(null);
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const session = await login(email, password);
      // Roles that are not tied to one patient start on the demo patient.
      if (!session.user.patient_id) setViewingPatientId(1);
      router.replace(session.workspace);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-[460px]">
      <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
        Secure role-based login
      </h1>
      <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">
        Select a role. Demo credentials are prefilled so every workspace can be
        evaluated immediately.
      </p>

      <form onSubmit={submit} className="mt-7">
        <fieldset disabled={busy}>
          <legend className="sr-only">Choose a workspace role</legend>
          <div className="grid grid-cols-2 gap-3">
            {roles.map((role) => {
              const active = role.id === roleId;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => pickRole(role)}
                  aria-pressed={active}
                  className={`flex items-center gap-2.5 rounded-xl border px-4 py-3.5 text-left text-sm font-semibold transition ${
                    role.wide ? "col-span-2" : ""
                  } ${
                    active
                      ? "border-brand bg-brand-soft text-brand"
                      : "border-line bg-surface text-ink hover:border-brand/40 hover:bg-surface-soft"
                  }`}
                >
                  <Icon
                    name={role.icon}
                    className={`size-5 shrink-0 ${active ? "text-brand" : "text-ink-faint"}`}
                  />
                  {role.label}
                </button>
              );
            })}
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="username"
                required
                className="w-full rounded-xl border border-line bg-surface px-4 py-3.5 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand disabled:opacity-60"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
                className="w-full rounded-xl border border-line bg-surface px-4 py-3.5 text-sm text-ink outline-none transition focus:border-brand disabled:opacity-60"
              />
            </div>
          </div>
        </fieldset>

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-risk-high/20 bg-risk-high/5 px-4 py-3 text-sm text-risk-high"
          >
            {error}
          </p>
        ) : null}

        <p className="mt-5 text-center text-sm text-ink-soft">
          Selected workspace:{" "}
          <span className="font-semibold text-ink">{selected.label}</span>
        </p>

        <button
          type="submit"
          disabled={busy}
          className="mt-3 flex w-full items-center justify-center gap-2.5 rounded-xl bg-brand px-5 py-4 font-display text-base font-semibold text-white transition hover:opacity-90 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {busy ? "Signing in…" : `Enter ${selected.label} workspace`}
          {busy ? null : <Icon name="arrowRight" className="size-5" />}
        </button>
      </form>

      <p className="mt-6 text-center text-sm leading-relaxed text-ink-soft">
        Demo password: <span className="font-semibold text-ink">{DEMO_PASSWORD}</span>.
        Sessions are encrypted and role-aware.
      </p>
    </div>
  );
}
