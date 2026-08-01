// Single source of truth for the sidebar links, page titles and breadcrumbs.
// Both Sidebar and Header read from here so a route can never show the wrong
// title after a rename.

export const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "grid" },
  { href: "/recovery-twin", label: "Recovery Twin", icon: "heart" },
  { href: "/sentinel", label: "AURA Sentinel", icon: "radar", badge: "Live" },
  { href: "/care-coordinator", label: "AI Care Coordinator", icon: "chat" },
  { href: "/wearables", label: "Wearables", icon: "watch" },
  { href: "/doctor-portal", label: "Doctor Portal", icon: "stethoscope" },
  { href: "/caregiver-portal", label: "Caregiver Portal", icon: "users" },
  { href: "/appointments", label: "Appointments", icon: "calendar" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

export function findNavItem(pathname) {
  return navItems.find((item) => pathname.startsWith(item.href));
}
