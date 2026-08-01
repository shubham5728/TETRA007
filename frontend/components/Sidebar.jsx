"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { navItems } from "@/lib/nav";
import { useSession } from "@/lib/useApi";
import { clearSession } from "@/lib/api";
import { BrandMark, Icon } from "./Icons";

export default function Sidebar({ onNavigate }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useSession();

  const userRole = user?.role || "patient";
  const filteredItems = navItems.filter((item) => {
    if (item.roles) {
      return item.roles.includes(userRole);
    }
    return true;
  });

  return (
    <div className="flex h-full flex-col gap-6 bg-surface px-5 py-6">
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-2xl border border-line bg-surface-soft/80 p-2.5 shadow-sm transition hover:border-brand/40 hover:bg-surface-soft"
      >
        <span className="grid size-10 place-items-center rounded-xl bg-white border border-line/80 p-1 shadow-sm shrink-0">
          <img
            src="/logo.png"
            alt="AURA CareLink Logo"
            className="size-full object-contain"
          />
        </span>
        <div className="min-w-0">
          <span className="font-display text-base font-bold tracking-tight text-ink block leading-tight">
            AURA CareLink
          </span>
          <span className="text-[10px] font-bold text-brand uppercase tracking-wider block mt-0.5">
            AI Care. Human Touch.
          </span>
        </div>
      </Link>

      <div className="flex-1 overflow-y-auto">
        <p className="px-3 pb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-faint">
          Secure Care Workspace
        </p>

        <nav aria-label="Main">
          <ul className="space-y-1">
            {filteredItems.map((item) => {
              const currentSearch = searchParams?.toString() ? `?${searchParams.toString()}` : "";
              const currentFull = pathname + currentSearch;
              const active =
                item.href === currentFull ||
                (!searchParams?.get("tab") && item.href === "/doctor-portal?tab=queue" && pathname === "/doctor-portal") ||
                (!item.href.includes("?") && pathname.startsWith(item.href));
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                      active
                        ? "bg-brand-soft font-semibold text-brand shadow-sm"
                        : "font-medium text-ink-soft hover:bg-surface-soft hover:text-ink"
                    }`}
                  >
                    <Icon
                      name={item.icon}
                      className={`size-5 ${active ? "text-brand" : "text-ink-faint group-hover:text-ink-soft"}`}
                    />
                    <span className="flex-1 text-xs">{item.label}</span>
                    {item.badge ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-mint px-2 py-0.5 text-[10px] font-bold text-mint-ink">
                        <span className="size-1.5 animate-pulse rounded-full bg-mint-ink" />
                        {item.badge}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-mint-ink/10 bg-mint p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-mint-ink">
            <Icon name="shield" className="size-4" />
            Protected session
          </p>
          <p className="mt-1 text-xs text-mint-ink/75">Encrypted health workspace</p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (onNavigate) onNavigate();
            clearSession();
            router.replace("/login");
          }}
          className="flex w-full items-center gap-3 rounded-xl border border-line bg-surface-soft px-3 py-2.5 text-xs font-semibold text-ink-soft transition hover:bg-risk-high/10 hover:text-risk-high"
        >
          <Icon name="logout" className="size-4" />
          Sign out session
        </button>
      </div>
    </div>
  );
}
