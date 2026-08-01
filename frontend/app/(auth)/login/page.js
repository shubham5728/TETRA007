import LoginForm from "@/components/LoginForm";
import { BrandMark, Icon } from "@/components/Icons";

export const metadata = { title: "Sign in | AURA CareLink" };

const assurances = [
  { icon: "shield", label: "Encrypted session security" },
  { icon: "checkCircle", label: "Clinical-grade role controls" },
  { icon: "cloud", label: "Protected cloud synchronization" },
];

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* ---------------- Left: brand panel ---------------- */}
      <div className="relative overflow-hidden bg-gradient-to-br from-navy-deep via-navy to-[#0b3d8f] px-7 py-12 text-white sm:px-12 lg:py-16">
        {/* Concentric rings bleeding off the bottom-right corner */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -bottom-52 -right-40 size-[560px] rounded-full border border-white/10" />
          <div className="absolute -bottom-36 -right-24 size-[420px] rounded-full border border-white/10" />
          <div className="absolute -bottom-24 -right-10 size-[300px] rounded-full bg-white/[0.04]" />
          <div className="absolute -left-24 top-10 size-72 rounded-full bg-teal/15 blur-3xl" />
        </div>

        <div className="relative flex h-full flex-col">
          <BrandMark className="size-14 rounded-2xl" />

          <div className="mt-10 lg:mt-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal">
              Secure AURA Care Network
            </p>

            <h2 className="mt-5 max-w-md font-display text-[2.75rem] font-bold leading-[0.98] tracking-tight sm:text-6xl">
              Trusted recovery intelligence starts here.
            </h2>

            <p className="mt-6 max-w-sm text-base leading-relaxed text-white/70">
              Protected access for patients, care teams, doctors, hospitals and
              government agencies.
            </p>

            <ul className="mt-9 space-y-4">
              {assurances.map((item) => (
                <li key={item.label} className="flex items-center gap-3 text-sm text-white/85">
                  <Icon name={item.icon} className="size-5 shrink-0 text-teal" />
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ---------------- Right: sign-in form ---------------- */}
      <div className="flex items-center justify-center bg-surface px-6 py-12 sm:px-10">
        <LoginForm />
      </div>
    </div>
  );
}
