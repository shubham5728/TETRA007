// Single source of truth for the sidebar links, page titles and breadcrumbs.
// Both Sidebar and Header read from here so a route can never show the wrong
// title after a rename.

export const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "grid", roles: ["patient"] },
  { href: "/recovery-twin", label: "Recovery Twin", icon: "heart", roles: ["patient"] },
  { href: "/sentinel", label: "AURA Sentinel", icon: "radar", badge: "Live", roles: ["admin", "doctor"] },
  { href: "/care-coordinator", label: "AI Care Coordinator", icon: "chat", roles: ["patient", "caregiver"] },
  { href: "/wearables", label: "Wearables", icon: "watch", roles: ["patient"] },
  { href: "/doctor-portal", label: "Doctor Portal", icon: "stethoscope", roles: ["doctor"] },
  { href: "/caregiver-portal", label: "Caregiver Portal", icon: "users", roles: ["caregiver"] },
  { href: "/appointments", label: "Appointments", icon: "calendar", roles: ["patient", "caregiver"] },
  { href: "/settings", label: "Settings", icon: "settings", roles: ["patient", "doctor", "caregiver", "admin", "gov"] },
];

export function findNavItem(pathname) {
  return navItems.find((item) => pathname.startsWith(item.href));
}
