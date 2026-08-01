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
      <div className="flex h-dvh overflow-hidden bg-canvas">
        {/* Desktop sidebar - FIXED FULL HEIGHT */}
        <aside className="hidden h-full w-[286px] shrink-0 border-r border-line bg-surface lg:block">
          <Sidebar />
        </aside>

        {/* Mobile drawer */}
        {menuOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close navigation menu"
              onClick={closeMenu}
              className="absolute inset-0 bg-navy-deep/50 backdrop-blur-[2px] cursor-default animate-fade-in"
            />
            <div className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] border-r border-line shadow-2xl safe-bottom animate-slide-in-left">
              <Sidebar onNavigate={closeMenu} />
            </div>
          </div>
        ) : null}

        {/* Right workspace area - FIXED 100dvh CONTAINER */}
        <div className="flex flex-1 flex-col h-full min-w-0 overflow-hidden">
          {/* Header - Fixed top area, NEVER scrolls */}
          <div className="shrink-0 p-4 pb-0 sm:p-6 sm:pb-0 lg:p-8 lg:pb-0">
            <Header onOpenMenu={() => setMenuOpen(true)} />
          </div>

          {/* Main workspace content - ONLY THIS CONTAINER SCROLLS */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 safe-bottom">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
