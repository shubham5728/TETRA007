import { Icon } from "./Icons";

/** White panel used for nearly every block of content. */
export function Card({ className = "", padded = true, children }) {
  return (
    <section
      className={`rounded-3xl border border-line bg-surface shadow-[0_1px_2px_rgba(11,27,58,0.04),0_12px_28px_-18px_rgba(11,27,58,0.25)] ${
        padded ? "p-6 sm:p-7" : ""
      } ${className}`}
    >
      {children}
    </section>
  );
}

/** Small uppercase label that sits above a heading. */
export function Eyebrow({ children, tone = "teal", className = "" }) {
  const tones = {
    teal: "text-teal",
    brand: "text-brand",
    soft: "text-ink-faint",
  };
  return (
    <p
      className={`text-[11px] font-semibold uppercase tracking-[0.16em] ${tones[tone]} ${className}`}
    >
      {children}
    </p>
  );
}

export function CardTitle({ eyebrow, title, hint, action }) {
  return (
    <header className="mb-5 flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        {eyebrow ? <Eyebrow className="mb-1.5">{eyebrow}</Eyebrow> : null}
        <h2 className="font-display text-lg font-semibold text-ink sm:text-xl">
          {title}
        </h2>
        {hint ? <p className="mt-1 text-sm text-ink-soft">{hint}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

/** Rounded chip. Used for tags, statuses and filters. */
export function Pill({ children, tone = "neutral", className = "" }) {
  const tones = {
    neutral: "bg-surface-soft text-ink-soft border-line",
    brand: "bg-brand-soft text-brand border-brand/15",
    teal: "bg-teal-soft text-teal border-teal/20",
    mint: "bg-mint text-mint-ink border-mint-ink/15",
    onDark: "bg-white/10 text-white border-white/20 backdrop-blur-sm",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

const riskTones = {
  Low: { dot: "bg-risk-low", text: "text-risk-low", bg: "bg-risk-low/10" },
  Moderate: { dot: "bg-risk-med", text: "text-risk-med", bg: "bg-risk-med/10" },
  High: { dot: "bg-risk-high", text: "text-risk-high", bg: "bg-risk-high/10" },
};

export function RiskPill({ level, className = "" }) {
  const tone = riskTones[level] ?? riskTones.Low;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${tone.bg} ${tone.text} ${className}`}
    >
      <span className={`size-1.5 rounded-full ${tone.dot}`} />
      {level} risk
    </span>
  );
}

/** Number tile — label on top, big value, optional change indicator. */
export function StatTile({ label, value, unit, change, icon, tone = "plain" }) {
  const positive = typeof change === "number" && change > 0;
  const tones = {
    plain: "bg-surface border-line",
    soft: "bg-surface-soft border-line",
  };

  return (
    <div className={`rounded-2xl border p-4 ${tones[tone]}`}>
      <div className="flex items-center gap-2 text-ink-faint">
        {icon ? <Icon name={icon} className="size-4" /> : null}
        <p className="text-xs font-medium">{label}</p>
      </div>
      <p className="mt-2 font-display text-xl sm:text-2xl font-semibold text-ink">
        {value}
        {unit ? (
          <span className="ml-1 text-sm font-medium text-ink-faint">{unit}</span>
        ) : null}
      </p>
      {typeof change === "number" ? (
        <p
          className={`mt-1 text-xs font-semibold ${
            positive ? "text-risk-low" : "text-risk-high"
          }`}
        >
          {positive ? "▲" : "▼"} {Math.abs(change)} vs last week
        </p>
      ) : null}
    </div>
  );
}

/** Horizontal progress bar with an optional value label. */
export function ProgressBar({ value, tone = "brand", showValue = false }) {
  const tones = {
    brand: "bg-brand",
    teal: "bg-teal",
    low: "bg-risk-low",
    med: "bg-risk-med",
    high: "bg-risk-high",
  };
  const safe = Math.max(0, Math.min(100, value));

  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
        <div
          className={`h-full rounded-full transition-[width] duration-700 ${tones[tone]}`}
          style={{ width: `${safe}%` }}
        />
      </div>
      {showValue ? (
        <span className="w-10 text-right text-xs font-semibold text-ink-soft">
          {safe}%
        </span>
      ) : null}
    </div>
  );
}

/** Empty-state / not-built-yet notice, so unfinished areas stay honest. */
export function Placeholder({ title, children }) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface-soft p-6 text-center">
      <p className="font-display text-sm font-semibold text-ink">{title}</p>
      {children ? (
        <p className="mx-auto mt-1 max-w-md text-sm text-ink-soft">{children}</p>
      ) : null}
    </div>
  );
}
