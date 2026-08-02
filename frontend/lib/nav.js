// Single source of truth for the sidebar links, page titles and breadcrumbs.
// Both Sidebar and Header read from here so a route can never show the wrong
// title after a rename.

export const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "grid", roles: ["patient"] },
  { href: "/recovery-twin", label: "Recovery Twin", icon: "heart", roles: ["patient"] },
  { href: "/care-coordinator", label: "AI Care Coordinator", icon: "chat", roles: ["patient", "caregiver"] },
  { href: "/wearables", label: "Wearables", icon: "watch", roles: ["patient"] },
  
  // Doctor Workspace Navigation Items
  { href: "/doctor-portal?tab=queue", label: "All Patient", icon: "users", roles: ["doctor"] },
  { href: "/doctor-portal?tab=appointments", label: "Appointments & Visits", icon: "calendar", roles: ["doctor"] },
  { href: "/doctor-portal?tab=select_patient", label: "Patient Details", icon: "userCheck", roles: ["doctor"] },
  { href: "/sentinel", label: "AURA Sentinel", icon: "radar", badge: "Live", roles: ["doctor"] },
  { href: "/doctor-portal?tab=settings", label: "Doctor Profile & Settings", icon: "settings", roles: ["doctor"] },

  { href: "/caregiver-portal", label: "Caregiver Portal", icon: "users", roles: ["caregiver"] },
<<<<<<< HEAD
  { href: "/admin-portal", label: "Admin Portal", icon: "hospital", roles: ["admin"] },
=======
  { href: "/admin-portal/subscriptions", label: "Admin Portal", icon: "hospital", roles: ["admin"] },
>>>>>>> dd4f47c3681091a37c2e326454fd9dc16645af09
  { href: "/gov-portal", label: "Government Schemes", icon: "bank", roles: ["gov"] },
  { href: "/appointments", label: "Appointments", icon: "calendar", roles: ["patient", "caregiver"] },
  { href: "/pricing", label: "Plans & Pricing", icon: "shield", badge: "Upgrade", roles: ["patient", "doctor", "caregiver", "admin"] },
  { href: "/settings", label: "Settings", icon: "settings", roles: ["patient", "caregiver", "admin", "gov"] },
];

export function findNavItem(pathname, search = "") {
  const full = pathname + search;
  return (
    navItems.find((item) => item.href === full) ||
    navItems.find((item) => item.href === pathname) ||
    navItems.find((item) => item.href.startsWith(pathname) && !item.href.includes("?")) ||
    navItems.find((item) => item.href.startsWith(pathname))
  );
}
