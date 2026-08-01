"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { findNavItem } from "@/lib/nav";
import { patient } from "@/lib/data";
import { Icon } from "./Icons";

export default function Header({ onOpenMenu }) {
  const pathname = usePathname();
  const current = findNavItem(pathname);
  const title = current?.label ?? "Dashboard";

  return (
    <header className="rounded-3xl border border-line bg-surface px-5 py-4 shadow-[0_1px_2px_rgba(11,27,58,0.04)] sm:px-7 sm:py-5">
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
          <span
            className="grid size-10 place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand"
            title={patient.name}
          >
            {patient.initials}
          </span>
          <Link
            href="/login"
            className="hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-surface-soft hover:text-ink sm:inline-flex"
          >
            <Icon name="logout" className="size-4" />
            Sign out
          </Link>
        </div>
      </div>
    </header>
  );
}
