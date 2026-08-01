"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { api, subscribeToStorage, TOKEN_KEY, USER_KEY } from "./api";

const noopSubscribe = () => () => {};

/**
 * True once the component is running in the browser.
 *
 * Uses useSyncExternalStore rather than a setState-in-effect so the value is
 * available on the first client render and React never schedules a cascading
 * re-render for it.
 */
export function useMounted() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

function useStoredValue(key) {
  return useSyncExternalStore(
    subscribeToStorage,
    () => window.localStorage.getItem(key),
    () => null,
  );
}

/**
 * Fetch one endpoint and track loading/error state.
 *
 * `reload` refetches without clearing what is already on screen, so refreshing
 * after a mutation does not flash a skeleton.
 */
export function useApi(path, { params, skip = false } = {}) {
  const [state, setState] = useState({
    data: null,
    error: null,
    loading: !skip,
  });

  // params is an object literal at most call sites, so compare it by value.
  const key = JSON.stringify(params ?? null);

  const reload = useCallback(async () => {
    try {
      const data = await api.get(path, params ?? undefined);
      setState({ data, error: null, loading: false });
    } catch (error) {
      setState((previous) => ({ ...previous, error, loading: false }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, key]);

  useEffect(() => {
    if (skip) return undefined;

    let cancelled = false;
    (async () => {
      try {
        const data = await api.get(path, params ?? undefined);
        if (!cancelled) setState({ data, error: null, loading: false });
      } catch (error) {
        if (!cancelled) {
          setState((previous) => ({ ...previous, error, loading: false }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, key, skip]);

  return { ...state, reload };
}

/** The signed-in user, read straight from storage. */
export function useSession() {
  const raw = useStoredValue(USER_KEY);
  const mounted = useMounted();

  const user = useMemo(() => {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, [raw]);

  return { user, ready: mounted };
}

/** The raw access token, or null when signed out. */
export function useToken() {
  return useStoredValue(TOKEN_KEY);
}
