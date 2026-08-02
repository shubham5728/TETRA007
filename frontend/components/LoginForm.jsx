"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, registerAccount, setViewingPatientId } from "@/lib/api";
import { Icon } from "./Icons";

const DEMO_PASSWORD = "AuraCare2025";

// Prefill only. The destination comes back from the API, which is the authority
// on what a role is allowed to open.
const loginRoles = [
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

const signupRoles = [
  { id: "patient", label: "Patient", icon: "heart", desc: "Track recovery, symptoms & vitals" },
  { id: "doctor", label: "Doctor", icon: "stethoscope", desc: "Manage clinical care & patients" },
  { id: "caregiver", label: "Caregiver", icon: "users", desc: "Support & monitor family health" },
];

export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState("signin"); // "signin" | "signup"

  // Sign In state
  const [roleId, setRoleId] = useState("patient");
  const [email, setEmail] = useState(loginRoles[0].email);
  const [password, setPassword] = useState(DEMO_PASSWORD);

  // Sign Up state
  const [regRole, setRegRole] = useState("patient");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");
  const [regHospital, setRegHospital] = useState("AURA Care Hospital");
  const [regSpecialization, setRegSpecialization] = useState("General Medicine");
  const [regAge, setRegAge] = useState("32");
  const [regGender, setRegGender] = useState("Female");

  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const selectedLoginRole = loginRoles.find((role) => role.id === roleId);
  const selectedSignupRole = signupRoles.find((role) => role.id === regRole);

  function pickLoginRole(role) {
    setRoleId(role.id);
    setEmail(role.email); // keep the prefilled credentials in step with the role
    setPassword(DEMO_PASSWORD);
    setError(null);
  }

  async function submitLogin(event) {
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

  async function submitRegister(event) {
    event.preventDefault();
    if (regPassword !== regConfirmPassword) {
      setError("Passwords do not match. Please verify your password.");
      return;
    }
    if (regPassword.length < 6) {
      setError("Password should be at least 6 characters.");
      return;
    }

    setBusy(true);
    setError(null);

    const payload = {
      name: regName.trim(),
      email: regEmail.trim(),
      password: regPassword,
      role: regRole,
      hospital: regHospital.trim() || "AURA Medical Center",
      specialization: regRole === "doctor" ? regSpecialization : undefined,
      age: regRole === "patient" ? Number(regAge) || 32 : undefined,
      gender: regRole === "patient" ? regGender : undefined,
    };

    try {
      const session = await registerAccount(payload);
      if (!session.user.patient_id) setViewingPatientId(1);
      router.replace(session.workspace);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-[460px]">
      {/* Mode Switcher Tabs */}
      <div className="mb-6 flex rounded-2xl bg-surface-soft p-1.5 border border-line shadow-inner">
        <button
          type="button"
          onClick={() => {
            setMode("signin");
            setError(null);
          }}
          className={`flex-1 rounded-xl py-2.5 text-center text-sm font-semibold transition ${
            mode === "signin"
              ? "bg-white text-brand shadow-sm"
              : "text-ink-soft hover:text-ink"
          }`}
        >
          Sign In (Existing Account)
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setError(null);
          }}
          className={`flex-1 rounded-xl py-2.5 text-center text-sm font-semibold transition ${
            mode === "signup"
              ? "bg-white text-brand shadow-sm"
              : "text-ink-soft hover:text-ink"
          }`}
        >
          Create New Account
        </button>
      </div>

      {mode === "signin" ? (
        <>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Sign in to your account
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Select a demo role or enter your account credentials to access your workspace.
          </p>

          <form onSubmit={submitLogin} className="mt-6">
            <fieldset disabled={busy}>
              <legend className="sr-only">Choose a workspace role</legend>
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {loginRoles.map((role) => {
                  const active = role.id === roleId;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => pickLoginRole(role)}
                      aria-pressed={active}
                      className={`flex items-center gap-2 sm:gap-2.5 rounded-xl border px-3 sm:px-4 py-3 sm:py-3.5 text-left text-xs sm:text-sm font-semibold transition ${
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
                  <label htmlFor="login-email" className="block text-xs font-semibold text-ink-soft mb-1">
                    Email Address
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="username"
                    required
                    placeholder="name@example.com"
                    className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand disabled:opacity-60"
                  />
                </div>
                <div>
                  <label htmlFor="login-password" className="block text-xs font-semibold text-ink-soft mb-1">
                    Password
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink outline-none transition focus:border-brand disabled:opacity-60"
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

            <p className="mt-4 text-center text-xs text-ink-soft">
              Selected role preset:{" "}
              <span className="font-semibold text-ink">{selectedLoginRole.label}</span>
            </p>

            <button
              type="submit"
              disabled={busy}
              className="mt-3 flex w-full items-center justify-center gap-2.5 rounded-xl bg-brand px-5 py-3.5 font-display text-base font-semibold text-white transition hover:opacity-90 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {busy ? "Signing in…" : `Sign In as ${selectedLoginRole.label}`}
              {busy ? null : <Icon name="arrowRight" className="size-5" />}
            </button>
          </form>

          <div className="mt-6 text-center text-xs leading-relaxed text-ink-soft border-t border-line pt-4">
            <p className="mb-2">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError(null);
                }}
                className="font-semibold text-brand hover:underline"
              >
                Create a Doctor or Patient Account
              </button>
            </p>
            <p className="text-ink-faint text-[11px]">
              Demo password: <span className="font-semibold text-ink-soft">{DEMO_PASSWORD}</span>
            </p>
          </div>
        </>
      ) : (
        <>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink">
            Create a New Account
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Register as a Doctor or Patient to generate your new ID and credentials.
          </p>

          <form onSubmit={submitRegister} className="mt-5">
            <fieldset disabled={busy}>
              <legend className="block text-xs font-semibold text-ink mb-2">Select Account Role</legend>
              <div className="grid grid-cols-2 gap-2.5">
                {signupRoles.map((role) => {
                  const active = role.id === regRole;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      onClick={() => setRegRole(role.id)}
                      aria-pressed={active}
                      className={`flex flex-col gap-1 rounded-xl border p-3 text-left transition ${
                        active
                          ? "border-brand bg-brand-soft text-brand"
                          : "border-line bg-surface text-ink hover:border-brand/40 hover:bg-surface-soft"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon
                          name={role.icon}
                          className={`size-4 shrink-0 ${active ? "text-brand" : "text-ink-faint"}`}
                        />
                        <span className="text-xs font-bold">{role.label}</span>
                      </div>
                      <span className="text-[10px] text-ink-faint leading-tight">{role.desc}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <label htmlFor="reg-name" className="block text-xs font-semibold text-ink-soft mb-1">
                    Full Name *
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    value={regName}
                    onChange={(event) => setRegName(event.target.value)}
                    required
                    placeholder={regRole === "doctor" ? "Dr. Sarah Jenkins" : "Aarav Sharma"}
                    className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand disabled:opacity-60"
                  />
                </div>

                <div>
                  <label htmlFor="reg-email" className="block text-xs font-semibold text-ink-soft mb-1">
                    New Email Address (User ID) *
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    value={regEmail}
                    onChange={(event) => setRegEmail(event.target.value)}
                    autoComplete="username"
                    required
                    placeholder="user@example.com"
                    className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition placeholder:text-ink-faint focus:border-brand disabled:opacity-60"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label htmlFor="reg-password" className="block text-xs font-semibold text-ink-soft mb-1">
                      New Password *
                    </label>
                    <input
                      id="reg-password"
                      type="password"
                      value={regPassword}
                      onChange={(event) => setRegPassword(event.target.value)}
                      autoComplete="new-password"
                      required
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-confirm-password" className="block text-xs font-semibold text-ink-soft mb-1">
                      Confirm Password *
                    </label>
                    <input
                      id="reg-confirm-password"
                      type="password"
                      value={regConfirmPassword}
                      onChange={(event) => setRegConfirmPassword(event.target.value)}
                      autoComplete="new-password"
                      required
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand disabled:opacity-60"
                    />
                  </div>
                </div>

                {regRole === "doctor" && (
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label htmlFor="reg-specialization" className="block text-xs font-semibold text-ink-soft mb-1">
                        Specialization
                      </label>
                      <select
                        id="reg-specialization"
                        value={regSpecialization}
                        onChange={(event) => setRegSpecialization(event.target.value)}
                        className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none transition focus:border-brand disabled:opacity-60"
                      >
                        <option value="General Medicine">General Medicine</option>
                        <option value="Cardiology">Cardiology</option>
                        <option value="Neurology">Neurology</option>
                        <option value="Pediatrics">Pediatrics</option>
                        <option value="Orthopedics">Orthopedics</option>
                        <option value="General Surgery">General Surgery</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="reg-hospital-doc" className="block text-xs font-semibold text-ink-soft mb-1">
                        Hospital / Clinic
                      </label>
                      <input
                        id="reg-hospital-doc"
                        type="text"
                        value={regHospital}
                        onChange={(event) => setRegHospital(event.target.value)}
                        placeholder="AURA Medical Center"
                        className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-brand disabled:opacity-60"
                      />
                    </div>
                  </div>
                )}

                {regRole === "patient" && (
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label htmlFor="reg-age" className="block text-xs font-semibold text-ink-soft mb-1">
                        Age
                      </label>
                      <input
                        id="reg-age"
                        type="number"
                        min="1"
                        max="120"
                        value={regAge}
                        onChange={(event) => setRegAge(event.target.value)}
                        className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none transition focus:border-brand disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label htmlFor="reg-gender" className="block text-xs font-semibold text-ink-soft mb-1">
                        Gender
                      </label>
                      <select
                        id="reg-gender"
                        value={regGender}
                        onChange={(event) => setRegGender(event.target.value)}
                        className="w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink outline-none transition focus:border-brand disabled:opacity-60"
                      >
                        <option value="Female">Female</option>
                        <option value="Male">Male</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="reg-hospital-pat" className="block text-xs font-semibold text-ink-soft mb-1">
                        Hospital
                      </label>
                      <input
                        id="reg-hospital-pat"
                        type="text"
                        value={regHospital}
                        onChange={(event) => setRegHospital(event.target.value)}
                        placeholder="AURA Care"
                        className="w-full rounded-xl border border-line bg-surface px-3 py-2 text-xs text-ink outline-none transition focus:border-brand disabled:opacity-60"
                      />
                    </div>
                  </div>
                )}
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

            <button
              type="submit"
              disabled={busy}
              className="mt-5 flex w-full items-center justify-center gap-2.5 rounded-xl bg-brand px-5 py-3.5 font-display text-base font-semibold text-white transition hover:opacity-90 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {busy ? "Registering..." : `Create ${selectedSignupRole.label} Account`}
              {busy ? null : <Icon name="arrowRight" className="size-5" />}
            </button>
          </form>

          <div className="mt-5 text-center text-xs leading-relaxed text-ink-soft border-t border-line pt-4">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError(null);
              }}
              className="font-semibold text-brand hover:underline"
            >
              Sign In here
            </button>
          </div>
        </>
      )}
    </div>
  );
}

