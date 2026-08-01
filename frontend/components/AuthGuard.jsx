"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMounted, useToken } from "@/lib/useApi";

/** Keeps signed-out visitors out of the workspace. */
export default function AuthGuard({ children }) {
  const router = useRouter();
  const mounted = useMounted();
  const token = useToken();

  useEffect(() => {
    // Only decide once the browser has told us what is in storage.
    if (mounted && !token) router.replace("/login");
  }, [mounted, token, router]);

  if (!mounted || !token) {
    return (
      <div className="grid min-h-dvh place-items-center bg-canvas">
        <p className="text-sm text-ink-faint">Checking your session…</p>
      </div>
    );
  }

  return children;
}
