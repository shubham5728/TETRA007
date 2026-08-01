import Image from "next/image";
import { EcgLine } from "./charts";
import { Icon } from "./Icons";
import { Pill } from "./ui";

/** Small white tile holding a single icon, scattered around the illustration. */
function FloatingChip({ icon, className, delay = "0s" }) {
  return (
    <span
      className={`absolute grid size-11 place-items-center rounded-2xl bg-white text-brand shadow-lg shadow-navy-deep/30 ${className}`}
      style={{ animation: "var(--animate-float)", animationDelay: delay }}
    >
      <Icon name={icon} className="size-5" />
    </span>
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
    <section className="overflow-hidden rounded-3xl border border-line bg-navy shadow-[0_20px_50px_-30px_rgba(9,26,61,0.7)]">
      <div className="grid lg:grid-cols-[1.32fr_1fr]">
        {/* ---------------- Left: message + live illustration ---------------- */}
        <div className="relative px-6 py-8 text-white sm:px-9 sm:py-10">
          {/* Soft light bloom behind the copy */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-brand/25 blur-3xl"
          />

          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal">
              Immersive AURA Experience
            </p>

            <h2 className="mt-4 max-w-lg font-display text-3xl font-bold leading-[1.15] sm:text-[2.6rem]">
              Intelligence that follows every recovery journey.
            </h2>

            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70 sm:text-base">
              Live ECG, wearable signals and Sentinel insight work together in a
              secure healthcare operating system.
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5">
              <Pill tone="onDark">24/7 monitoring</Pill>
              <Pill tone="onDark">Wearable-informed</Pill>
              <Pill tone="onDark">Care-team ready</Pill>
            </div>
          </div>

          {/* ---- Illustration: floating chips, pulse core, live BPM, ECG ---- */}
          <div className="relative mt-9 h-64 sm:h-60">
            <FloatingChip icon="pill" className="left-[18%] top-[4%]" delay="0s" />
            <FloatingChip icon="file" className="left-[2%] top-[36%]" delay="0.8s" />
            <FloatingChip icon="users" className="left-[10%] top-[66%]" delay="1.6s" />
            <FloatingChip
              icon="stethoscope"
              className="left-[38%] bottom-[2%]"
              delay="2.2s"
            />
            <FloatingChip icon="heart" className="right-[16%] top-[8%]" delay="1.2s" />
            <FloatingChip icon="chart" className="right-[4%] top-[58%]" delay="2.8s" />

            {/* Pulsing core */}
            <div className="absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2">
              <span
                aria-hidden="true"
                className="absolute inset-0 -m-6 rounded-full bg-teal/30 blur-2xl"
                style={{ animation: "var(--animate-pulse-glow)" }}
              />
              <span className="relative grid size-20 place-items-center rounded-full bg-teal/90 text-white ring-8 ring-teal/15">
                <Icon name="brain" className="size-9" strokeWidth={1.6} />
              </span>
            </div>

            {/* Hospital connected chip */}
            <span className="absolute right-[20%] top-0 inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-[11px] font-semibold text-white backdrop-blur-sm">
              <Icon name="hospital" className="size-4" />
              Hospital connected
            </span>

            {/* Live BPM card */}
            <div className="absolute right-[30%] top-[34%] w-[86px] rounded-2xl bg-white p-3 text-center shadow-xl shadow-navy-deep/40">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-ink-faint">
                Live
              </p>
              <p className="font-display text-2xl font-bold leading-tight text-ink">72</p>
              <p className="-mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-ink-faint">
                bpm
              </p>
              <Icon
                name="heart"
                className="mx-auto mt-1 size-4 text-risk-high"
                strokeWidth={2}
              />
            </div>

            {/* ECG trace along the bottom */}
            <EcgLine className="absolute inset-x-0 bottom-0 h-16 w-full" />
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
              className="absolute inset-0 bg-gradient-to-br from-[#123a6b] via-[#12608f] to-[#14b3ac]"
            >
              <div className="absolute -right-10 top-8 size-56 rounded-full bg-white/10 blur-2xl" />
              <div className="absolute bottom-16 left-4 size-40 rounded-full bg-teal/30 blur-2xl" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.18),transparent_55%)]" />
            </div>
          )}

          {/* Caption card */}
          <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-navy-deep/80 px-4 py-3 text-white backdrop-blur-md sm:inset-x-6 sm:bottom-6">
            <p className="font-display text-sm font-semibold">Connected recovery care</p>
            <p className="mt-0.5 text-xs text-white/70">
              Doctor, patient and care team aligned
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
