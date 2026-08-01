"use client";

import { useState } from "react";
import AuthGuard from "./AuthGuard";
import Header from "./Header";
import Sidebar from "./Sidebar";

/**
 * Holds the mobile drawer state and frames every signed-in page.
 *
 * `children` are Server Components passed through as rendered output, so
 * marking this file "use client" does not pull the pages into the client
 * bundle.
 */
export default function AppShell({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <AuthGuard>
      <div className="flex min-h-dvh">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-dvh w-[286px] shrink-0 border-r border-line lg:block">
          <Sidebar />
        </aside>

        {/* Mobile drawer */}
        {menuOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={closeMenu}
              className="absolute inset-0 bg-navy-deep/45 backdrop-blur-[2px]"
            />
            <div className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] border-r border-line shadow-2xl">
              <Sidebar onNavigate={closeMenu} />
            </div>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col gap-5 p-4 sm:p-6 lg:p-8">
          <Header onOpenMenu={() => setMenuOpen(true)} />
          <main className="flex-1 pb-4">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
