// Thin client for the FastAPI backend.
//
// The token lives in localStorage because every workspace screen fetches on the
// client. Moving to httpOnly cookies later only changes this file.

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "https://tetra007.onrender.com";

export const TOKEN_KEY = "aura.token";
export const USER_KEY = "aura.user";

/** Lets hooks subscribe to session changes made in another tab. */
export function subscribeToStorage(callback) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function saveSession(token, user) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

<<<<<<< HEAD
=======
/**
 * In-memory cache of GET responses.
 *
 * Every screen fetches on the client, so without this, moving between pages
 * refetches everything and shows a skeleton each time. With it, a page you
 * have already opened paints instantly from cache and quietly revalidates in
 * the background. Memory only, so a refresh starts clean.
 */
const responseCache = new Map();

export function readCache(key) {
  return responseCache.get(key);
}

export function writeCache(key, value) {
  responseCache.set(key, value);
}

export function clearApiCache() {
  responseCache.clear();
}

>>>>>>> dd4f47c3681091a37c2e326454fd9dc16645af09
export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
<<<<<<< HEAD
=======
  // Never let the next person to sign in see the last person's data.
  clearApiCache();
>>>>>>> dd4f47c3681091a37c2e326454fd9dc16645af09
}

/** Doctors, admins and government users must name the patient they are viewing. */
export function viewingPatientId() {
  const user = getUser();
  if (!user) return null;
  if (user.patient_id) return null; // patients and caregivers are pinned server-side
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem("aura.patient_id");
  return stored ? Number(stored) : 1;
}

export function setViewingPatientId(id) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("aura.patient_id", String(id));
}

async function request(path, { method = "GET", body, auth = true, params } = {}) {
  const url = new URL(path, API_BASE);
  const merged = { ...(params ?? {}) };

  // Roles that are not tied to a patient have to say who they are looking at.
  if (auth && merged.patient_id === undefined) {
    const id = viewingPatientId();
    if (id !== null) merged.patient_id = id;
  }
  for (const [key, value] of Object.entries(merged)) {
    if (value !== undefined && value !== null) url.searchParams.set(key, value);
  }

  const headers = {};
  if (body !== undefined && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body === undefined ? undefined : (body instanceof FormData ? body : JSON.stringify(body)),
    });
  } catch {
    throw new ApiError(
      `Cannot reach the API at ${API_BASE}. Is the backend running?`,
      0,
    );
  }

  if (response.status === 401) {
    clearSession();
    if (path === "/api/auth/login") {
      throw new ApiError("Incorrect email or password.", 401);
    }
    throw new ApiError("Your session has expired. Please sign in again.", 401);
  }

  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const problem = await response.json();
      if (typeof problem.detail === "string") detail = problem.detail;
    } catch {
      // Keep the generic message.
    }
    throw new ApiError(detail, response.status);
  }

  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  get: (path, params) => request(path, { params }),
  post: (path, body, params) => request(path, { method: "POST", body, params }),
};

export async function login(email, password) {
  const data = await request("/api/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
  saveSession(data.access_token, data.user);
  return data;
}
