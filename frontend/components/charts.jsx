// Hand-rolled SVG charts. No charting library — each one is a single path,
// which keeps the bundle small and renders fine on a slow rural connection.

/**
 * Animated ECG trace. The line "draws" itself left to right on a loop via
 * stroke-dashoffset (see the `ecg` keyframe in globals.css).
 */
export function EcgLine({ className = "", stroke = "var(--color-teal)" }) {
  // One flat baseline broken by a P wave, a QRS spike and a T wave, repeated.
  const beat = (x) =>
    `M${x} 40 H${x + 46} l7 -5 l7 5 H${x + 78} l5 3 l5 -27 l6 45 l6 -25 l5 4 H${
      x + 140
    } c8 0 11 -9 19 -9 c8 0 11 9 19 9 H${x + 200}`;

  return (
    <svg
      viewBox="0 0 600 80"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ecg-fade" x1="0" x2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0" />
          <stop offset="18%" stopColor={stroke} stopOpacity="1" />
          <stop offset="82%" stopColor={stroke} stopOpacity="1" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d={`${beat(0)} ${beat(200)} ${beat(400)}`}
        fill="none"
        stroke="url(#ecg-fade)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ strokeDasharray: 1200, animation: "var(--animate-ecg)" }}
      />
    </svg>
  );
}

/**
 * Donut gauge for the Recovery Score.
 * `idSuffix` keeps gradient ids unique when several rings share a page.
 */
export function RecoveryRing({
  value = 0,
  size = 148,
  label = "Recovery Score",
  idSuffix = "",
}) {
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const safe = Math.max(0, Math.min(100, value));
  const offset = circumference * (1 - safe / 100);
  const gradientId = `ring-grad${idSuffix}`;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label}: ${safe} percent`}
    >
      <svg viewBox="0 0 150 150" className="size-full -rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-brand)" />
            <stop offset="100%" stopColor="var(--color-teal)" />
          </linearGradient>
        </defs>
        <circle
          cx="75"
          cy="75"
          r={radius}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth="11"
        />
        <circle
          cx="75"
          cy="75"
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-center">
          <p className="font-display text-3xl font-semibold text-ink">{safe}%</p>
        </div>
      </div>
    </div>
  );
}

/**
 * Small trend line with a soft area fill. `data` is an array of
 * `{ day, score }` objects.
 */
export function Sparkline({
  data,
  className = "",
  stroke = "var(--color-brand)",
  idSuffix = "",
}) {
  if (!data?.length) return null;

  const width = 320;
  const height = 90;
  const pad = 6;
  const values = data.map((d) => d.score);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const points = data.map((d, i) => {
    const x = pad + (i * (width - pad * 2)) / (data.length - 1 || 1);
    const y = height - pad - ((d.score - min) / span) * (height - pad * 2);
    return [x, y];
  });

  const line = points.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");
  const area = `${line} L${points.at(-1)[0]} ${height} L${points[0][0]} ${height} Z`;
  const fillId = `spark-fill${idSuffix}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className={className} aria-hidden="true">
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.22" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${fillId})`} />
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={points.at(-1)[0]} cy={points.at(-1)[1]} r="4" fill={stroke} />
    </svg>
  );
}

/** Vertical bars, used for the Sentinel risk-factor breakdown. */
export function FactorBar({ label, weight, direction }) {
  const up = direction === "up";
  return (
    <li className="flex items-center gap-3">
      <span className="w-52 shrink-0 truncate text-sm text-ink-soft" title={label}>
        {label}
      </span>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-line">
        <div
          className={`h-full rounded-full ${up ? "bg-risk-med" : "bg-risk-low"}`}
          style={{ width: `${weight * 3}%` }}
        />
      </div>
      <span
        className={`w-16 text-right text-xs font-semibold ${
          up ? "text-risk-med" : "text-risk-low"
        }`}
      >
        {up ? "raises" : "lowers"}
      </span>
    </li>
  );
}
