"use client";

import { useCallback, useEffect, useState } from "react";
import { api, getUser } from "./api";

/**
 * Fetch one endpoint and track loading/error state.
 *
 * Returns `reload` so a screen can refresh itself after a mutation without a
 * full page navigation.
 */
export function useApi(path, { params, skip = false } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(!skip);

  const key = JSON.stringify(params ?? null);

  const load = useCallback(async () => {
    if (skip) return;
    setLoading(true);
    setError(null);
    try {
      setData(await api.get(path, params));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
    // params is compared by value through `key`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, key, skip]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, error, loading, reload: load };
}

/** The signed-in user, read once on mount. */
export function useSession() {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(getUser());
    setReady(true);
  }, []);

  return { user, ready };
}
