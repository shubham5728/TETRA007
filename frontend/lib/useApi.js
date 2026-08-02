"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
<<<<<<< HEAD
import { api, subscribeToStorage, TOKEN_KEY, USER_KEY } from "./api";
=======
import {
  api,
  readCache,
  subscribeToStorage,
  TOKEN_KEY,
  USER_KEY,
  viewingPatientId,
  writeCache,
} from "./api";
>>>>>>> dd4f47c3681091a37c2e326454fd9dc16645af09

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
<<<<<<< HEAD
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
=======
  // params is an object literal at most call sites, so compare it by value.
  const key = JSON.stringify(params ?? null);

  // The viewed patient is injected into the request by api.js, so two doctors
  // looking at different patients must not share a cache entry.
  const cacheKey = `${path}|${key}|${
    typeof window === "undefined" ? "" : viewingPatientId() ?? ""
  }`;

  const [state, setState] = useState(() => {
    if (skip) return { data: null, error: null, loading: false };
    const cached = readCache(cacheKey);
    // Paint immediately from cache; the effect below revalidates.
    return cached !== undefined
      ? { data: cached, error: null, loading: false }
      : { data: null, error: null, loading: true };
  });

  const reload = useCallback(async () => {
    try {
      const data = await api.get(path, params ?? undefined);
      writeCache(cacheKey, data);
>>>>>>> dd4f47c3681091a37c2e326454fd9dc16645af09
      setState({ data, error: null, loading: false });
    } catch (error) {
      setState((previous) => ({ ...previous, error, loading: false }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
<<<<<<< HEAD
  }, [path, key]);
=======
  }, [path, key, cacheKey]);
>>>>>>> dd4f47c3681091a37c2e326454fd9dc16645af09

  useEffect(() => {
    if (skip) return undefined;

<<<<<<< HEAD
=======
    const cached = readCache(cacheKey);
    if (cached !== undefined) {
      // Switching routes reuses the hook, so adopt this key's cached value.
      setState({ data: cached, error: null, loading: false });
    } else {
      setState((previous) => ({ ...previous, loading: true }));
    }

>>>>>>> dd4f47c3681091a37c2e326454fd9dc16645af09
    let cancelled = false;
    (async () => {
      try {
        const data = await api.get(path, params ?? undefined);
<<<<<<< HEAD
=======
        writeCache(cacheKey, data);
>>>>>>> dd4f47c3681091a37c2e326454fd9dc16645af09
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
<<<<<<< HEAD
  }, [path, key, skip]);
=======
  }, [path, key, skip, cacheKey]);
>>>>>>> dd4f47c3681091a37c2e326454fd9dc16645af09

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
