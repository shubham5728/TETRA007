import Image from "next/image";
import { EcgLine } from "./charts";
import { Icon } from "./Icons";
import { Pill } from "./ui";

function FloatingChip({ icon, className = "", delay = "0s" }) {
  return (
    <div
      className={`absolute flex justify-center items-center ${className}`}
      style={{
        animation: "var(--animate-float)",
        animationDelay: delay,
      }}
    >
      <span className="grid size-11 place-items-center rounded-2xl bg-white text-brand shadow-lg shadow-navy-deep/30">
        <Icon name={icon} className="size-5" />
      </span>
    </div>
  );
}

/**
 * Dashboard hero.
 *
 * `imageSrc` points at a file in /public. Leave it undefined and the panel
 * falls back to a designed gradient scene, so the layout never looks broken
 * before the photography is dropped in.
 */
export default function Hero({ imageSrc }) {
  return (
    <section className="overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-surface via-surface-soft to-brand-soft/30 shadow-sm">
      <div className="grid lg:grid-cols-[1.32fr_1fr]">
        {/* ---------------- Left: message + live illustration ---------------- */}
        <div className="relative px-6 py-8 text-ink sm:px-9 sm:py-10">
          {/* Soft light bloom behind the copy */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-brand/10 blur-3xl"
          />

          <div className="relative">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand">
              Immersive AURA Experience
            </p>

            <h2 className="mt-4 max-w-lg font-display text-2xl font-bold leading-[1.15] text-ink sm:text-3xl lg:text-[2.6rem]">
              Intelligence that follows every recovery journey.
            </h2>

            <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-soft sm:text-base">
              Live ECG, wearable signals and Sentinel insight work together in a
              secure healthcare operating system.
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5">
              <Pill tone="neutral">24/7 monitoring</Pill>
              <Pill tone="neutral">Wearable-informed</Pill>
              <Pill tone="neutral">Care-team ready</Pill>
              <Pill tone="neutral" className="border-line bg-surface gap-2">
                <Icon name="hospital" className="size-3 text-brand" />
                Hospital connected
              </Pill>
            </div>
          </div>

          {/* ---- Illustration: floating chips, pulse core, live BPM, ECG ---- */}
          <div className="relative mt-9 h-56 sm:h-60">
            {/* Pulsing core */}
            <div className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 z-10">
              <span
                aria-hidden="true"
                className="absolute inset-0 -m-6 rounded-full bg-brand/20 blur-2xl"
                style={{ animation: "var(--animate-pulse-glow)" }}
              />
              <span className="relative grid size-16 sm:size-20 place-items-center rounded-full bg-brand text-white ring-8 ring-brand/15 shadow-lg">
                <Icon name="brain" className="size-7 sm:size-9" strokeWidth={1.6} />
              </span>
            </div>

            {/* Evenly Spaced Static Floating Elements (hidden outer chips on smallest screens) */}
            <FloatingChip icon="pill" className="left-[48%] top-[2%] -translate-x-1/2" delay="0s" />
            <FloatingChip icon="file" className="left-[20%] sm:left-[25%] top-[15%] -translate-x-1/2" delay="0.5s" />
            <FloatingChip icon="users" className="hidden sm:grid left-[12%] top-[45%] -translate-x-1/2" delay="1s" />
            <FloatingChip icon="stethoscope" className="left-[25%] top-[75%] -translate-x-1/2" delay="1.5s" />
            <FloatingChip icon="heart" className="left-[75%] top-[75%] -translate-x-1/2" delay="2s" />
            <FloatingChip icon="chart" className="hidden sm:grid left-[88%] top-[45%] -translate-x-1/2" delay="2.5s" />

            {/* Live BPM card text */}
            <div
              className="absolute left-[80%] sm:left-[75%] top-[12%] sm:top-[15%] -translate-x-1/2 flex justify-center items-center"
              style={{
                animation: "var(--animate-float)",
                animationDelay: "3s",
              }}
            >
              <div className="w-[74px] sm:w-[86px] rounded-2xl bg-white p-2.5 sm:p-3 text-center shadow-lg border border-line">
                <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.14em] text-ink-faint">
                  Live
                </p>
                <p className="font-display text-xl sm:text-2xl font-bold leading-tight text-ink">72</p>
                <p className="-mt-0.5 text-[8px] sm:text-[9px] font-semibold uppercase tracking-wider text-ink-faint">
                  bpm
                </p>
                <Icon
                  name="heart"
                  className="mx-auto mt-1 size-3.5 sm:size-4 text-risk-high"
                  strokeWidth={2}
                />
              </div>
            </div>

            {/* ECG trace along the bottom */}
            <EcgLine className="absolute inset-x-0 bottom-0 h-16 w-full opacity-60" />
          </div>
        </div>

        {/* ---------------- Right: photography slot ---------------- */}
        <div className="relative min-h-[280px] overflow-hidden lg:min-h-full">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt="A doctor reviewing recovery data with a patient at the bedside"
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover"
              priority
            />
          ) : (
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-br from-brand-soft via-surface to-brand/10"
            >
              <div className="absolute -right-10 top-8 size-56 rounded-full bg-brand/10 blur-2xl" />
              <div className="absolute bottom-16 left-4 size-40 rounded-full bg-teal/20 blur-2xl" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(22,101,216,0.08),transparent_55%)]" />
            </div>
          )}

          {/* Caption card */}
          <div className="absolute inset-x-4 bottom-4 rounded-2xl border border-line bg-surface/90 px-4 py-3 text-ink backdrop-blur-md shadow-sm sm:inset-x-6 sm:bottom-6">
            <p className="font-display text-sm font-bold text-ink">Connected recovery care</p>
            <p className="mt-0.5 text-xs text-ink-soft">
              Doctor, patient and care team aligned
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
