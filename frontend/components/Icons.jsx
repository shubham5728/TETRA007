// Inline SVG icon set.
//
// Kept local instead of pulling an icon package so the app has zero runtime
// dependencies beyond React/Next and works offline — which matters for a
// product that has to run in low-connectivity clinics.

const paths = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </>
  ),
  heart: (
    <>
      <path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 0 0-7.1 7.1l7.9 7.9a1.3 1.3 0 0 0 1.8 0l7.9-7.9a5 5 0 0 0 0-7.1Z" />
      <path d="M3.5 12.5h4l1.5-2.5 2 5 2-4 1.2 1.5h6" />
    </>
  ),
  radar: (
    <>
      <circle cx="12" cy="12" r="2" />
      <path d="M12 5.5a6.5 6.5 0 0 1 6.5 6.5" />
      <path d="M12 2a10 10 0 0 1 10 10" />
      <path d="M12 19a7 7 0 0 1-7-7" />
      <path d="M12 22A10 10 0 0 1 2 12" />
    </>
  ),
  chat: (
    <>
      <path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5Z" />
    </>
  ),
  watch: (
    <>
      <rect x="7" y="6" width="10" height="12" rx="3" />
      <path d="M9.5 6V3.5h5V6M9.5 18v2.5h5V18" />
      <path d="M12 10v2.5l1.5 1" />
    </>
  ),
  stethoscope: (
    <>
      <path d="M5 3v5a4 4 0 0 0 8 0V3" />
      <path d="M5 3H3.5M13 3h1.5" />
      <path d="M9 12v2.5a5 5 0 0 0 10 0V13" />
      <circle cx="19" cy="11" r="2" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
      <path d="M16 5.5a3.2 3.2 0 0 1 0 6" />
      <path d="M17.5 14.2A6.5 6.5 0 0 1 21.5 20" />
    </>
  ),
  userCheck: (
    <>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 20a6.5 6.5 0 0 1 11.5 0" />
      <path d="m15 11 2 2 4-4" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2.5" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </>
  ),
  shield: (
    <>
      <path d="M12 2.8 4.5 6v6c0 4.4 3.1 8.2 7.5 9.2 4.4-1 7.5-4.8 7.5-9.2V6Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  logout: (
    <>
      <path d="M9 21H5.5A2.5 2.5 0 0 1 3 18.5v-13A2.5 2.5 0 0 1 5.5 3H9" />
      <path d="M16 16.5 20.5 12 16 7.5M20.5 12H9" />
    </>
  ),
  pill: (
    <>
      <rect x="2.5" y="8" width="19" height="8" rx="4" transform="rotate(-45 12 12)" />
      <path d="m9 9 6 6" />
    </>
  ),
  file: (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8Z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </>
  ),
  brain: (
    <>
      <path d="M12 5.5a3 3 0 0 0-5.6-1.5A3 3 0 0 0 4 9.4a3.2 3.2 0 0 0 .6 5A3 3 0 0 0 9.5 19a3 3 0 0 0 2.5-1.5Z" />
      <path d="M12 5.5A3 3 0 0 1 17.6 4 3 3 0 0 1 20 9.4a3.2 3.2 0 0 1-.6 5A3 3 0 0 1 14.5 19a3 3 0 0 1-2.5-1.5Z" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V4M4 20h16" />
      <path d="m7.5 15 3.5-4 3 2.5 4.5-6" />
    </>
  ),
  hospital: (
    <>
      <path d="M4 21V7.5L12 3l8 4.5V21" />
      <path d="M3 21h18" />
      <path d="M12 8.5v5M9.5 11h5" />
      <path d="M9.5 21v-4h5v4" />
    </>
  ),
  activity: <path d="M2.5 12h4l2.5-7 4.5 14 2.5-7h5.5" />,
  bell: (
    <>
      <path d="M18 8.5a6 6 0 1 0-12 0c0 5.5-2 7-2 7h16s-2-1.5-2-7Z" />
      <path d="M10.3 19.5a2 2 0 0 0 3.4 0" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  alert: (
    <>
      <path d="M10.3 3.9 2.4 17.2A2 2 0 0 0 4.1 20h15.8a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 16.5v.5" />
    </>
  ),
  wifiOff: (
    <>
      <path d="m2 2 20 20" />
      <path d="M5 12.5a11 11 0 0 1 3.5-2.3M2 8.8a16 16 0 0 1 4.4-2.8M16 6.2A16 16 0 0 1 22 8.8M14.5 10.5a11 11 0 0 1 4.5 2M8.8 16.3a6 6 0 0 1 6.4 0" />
      <path d="M12 20h.01" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  chevron: <path d="m9 5 7 7-7 7" />,
  sparkle: (
    <>
      <path d="M12 3.5 13.8 9 19.5 10.8 13.8 12.6 12 18.2 10.2 12.6 4.5 10.8 10.2 9Z" />
      <path d="M18.5 16.5 19.3 19l2.2.8-2.2.8-.8 2.2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.2l3.2 2" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v11" />
      <path d="m7.5 10 4.5 4 4.5-4" />
      <path d="M4 20h16" />
    </>
  ),
  cloud: (
    <>
      <path d="M6.5 18.5a4.5 4.5 0 0 1-.6-8.96 6 6 0 0 1 11.5 1.2 3.9 3.9 0 0 1-.9 7.76Z" />
    </>
  ),
  checkCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </>
  ),
  bank: (
    <>
      <path d="M3.5 9.5 12 4l8.5 5.5" />
      <path d="M5.5 10v8M9.5 10v8M14.5 10v8M18.5 10v8" />
      <path d="M3 21h18" />
    </>
  ),
  arrowRight: (
    <>
      <path d="M4 12h15" />
      <path d="m13.5 6 6 6-6 6" />
    </>
  ),
};

export function Icon({ name, className = "size-5", strokeWidth = 1.7, ...rest }) {
  const path = paths[name];
  if (!path) return null;

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {path}
    </svg>
  );
}

// The product mark: a rounded tile with the heart-pulse glyph.
export function BrandMark({ className = "size-9" }) {
  return (
    <span
      className={`${className} grid place-items-center rounded-xl bg-gradient-to-br from-brand to-teal text-white shadow-sm shadow-brand/30`}
    >
      <Icon name="heart" className="size-5" strokeWidth={1.9} />
    </span>
  );
}
