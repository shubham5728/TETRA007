"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { navItems } from "@/lib/nav";
import { useSession } from "@/lib/useApi";
import { BrandMark, Icon } from "./Icons";

export default function Sidebar({ onNavigate }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
        className="flex items-center gap-3 rounded-xl px-1 py-1 transition hover:opacity-90"
      >
        <BrandMark />
        <span className="font-display text-lg font-semibold tracking-tight text-ink">
          AURA CareLink
        </span>
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

      <div className="rounded-2xl border border-mint-ink/10 bg-mint p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-mint-ink">
          <Icon name="shield" className="size-4" />
          Protected session
        </p>
        <p className="mt-1 text-xs text-mint-ink/75">Encrypted health workspace</p>
      </div>
    </div>
  );
}
