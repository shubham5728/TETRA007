"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { findNavItem } from "@/lib/nav";
import { clearSession } from "@/lib/api";
import { useSession } from "@/lib/useApi";
import { Icon } from "./Icons";

const ROLE_LABEL = {
  patient: "Patient",
  doctor: "Doctor",
  caregiver: "Caregiver",
  admin: "Hospital Admin",
  gov: "Government Authority",
};

function initialsFor(name) {
  if (!name) return "··";
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function Header({ onOpenMenu }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useSession();

  const currentTab = searchParams.get("tab");
  const search = currentTab ? `?tab=${currentTab}` : "";

  const current = findNavItem(pathname, search);
  const title = current?.label ?? "Dashboard";

  function signOut() {
    clearSession();
    router.replace("/login");
  }

  return (
    <header className="rounded-3xl border border-line bg-surface px-5 py-4 shadow-sm sm:px-7 sm:py-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label="Open navigation menu"
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-line text-ink-soft transition hover:bg-surface-soft lg:hidden"
          >
            <Icon name="grid" className="size-5" />
          </button>

          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
              Care Workspace / {title}
            </p>
            <h1 className="truncate font-display text-2xl font-semibold text-ink sm:text-3xl">
              {title}
            </h1>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-ink">{user?.name ?? "…"}</p>
            <p className="text-xs text-ink-faint">
              {ROLE_LABEL[user?.role] ?? ""}
            </p>
          </div>
          <span
            className="grid size-10 place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand"
            title={user?.name ?? ""}
          >
            {initialsFor(user?.name)}
          </span>
          <button
            type="button"
            onClick={signOut}
            title="Sign out"
            aria-label="Sign out"
            className="flex items-center gap-2 rounded-xl border border-line p-2.5 text-sm font-medium text-ink-soft transition hover:bg-surface-soft hover:text-ink sm:border-transparent sm:px-3 sm:py-2"
          >
            <Icon name="logout" className="size-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
