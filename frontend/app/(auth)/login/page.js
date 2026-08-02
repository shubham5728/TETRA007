import LoginForm from "@/components/LoginForm";
import { BrandMark, Icon } from "@/components/Icons";

export const metadata = { title: "Sign In or Create Account | AURA CareLink" };

const assurances = [
  { icon: "shield", label: "Encrypted session security" },
  { icon: "checkCircle", label: "Clinical-grade role controls" },
  { icon: "cloud", label: "Protected cloud synchronization" },
];

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* ---------------- Left: brand panel ---------------- */}
      <div className="relative overflow-hidden bg-gradient-to-br from-navy-deep via-navy to-[#0b3d8f] px-6 py-10 text-white sm:px-12 lg:py-16">
        {/* Concentric rings bleeding off the bottom-right corner */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute -bottom-52 -right-40 size-[560px] rounded-full border border-white/10" />
          <div className="absolute -bottom-36 -right-24 size-[420px] rounded-full border border-white/10" />
          <div className="absolute -bottom-24 -right-10 size-[300px] rounded-full bg-white/[0.04]" />
          <div className="absolute -left-24 top-10 size-72 rounded-full bg-teal/15 blur-3xl" />
        </div>

        <div className="relative flex h-full flex-col">
          <div className="flex items-center gap-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-2.5 pr-5 w-fit shadow-xl">
            <span className="grid size-12 place-items-center rounded-xl bg-white p-1.5 shadow-md shrink-0">
              <img
                src="/logo.png"
                alt="AURA CareLink Logo"
                className="size-full object-contain"
              />
            </span>
            <div>
              <span className="font-display text-lg font-bold text-white tracking-tight block leading-none">
                AURA CareLink
              </span>
              <span className="text-[10px] font-bold text-teal tracking-widest uppercase mt-1 block">
                AI Care. Human Touch.
              </span>
            </div>
          </div>

          <div className="mt-8 sm:mt-10 lg:mt-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal">
              Secure AURA Care Network
            </p>

            <h2 className="mt-4 sm:mt-5 max-w-md font-display text-3xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Trusted recovery intelligence starts here.
            </h2>

            <p className="mt-6 max-w-sm text-base leading-relaxed text-white/70">
              Protected access for patients, care teams, doctors, and
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
