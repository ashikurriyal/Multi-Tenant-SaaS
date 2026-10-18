import type { Me } from "@/types/api";

// Every token refresh in the app goes through refreshSession().
//
// The server rotates the refresh token on each use and treats a reused one as stolen
// (401 TOKEN_REUSED → whole session revoked). Two refreshes sent with the same cookie
// would therefore log the user out, so:
//  - inside a tab, concurrent callers share one in-flight request
//    (React StrictMode runs AuthBootstrap's effect twice; several queries can 401 together)
//  - across tabs, the Web Locks API makes tabs take turns, so the next tab refreshes
//    with the cookie the previous one just rotated

const REFRESH_URL = "/api/v1/auth/refresh-token";
const LOCK_NAME = "ledgerflow:refresh-token";

// `me` comes back only when asked for (the page-load refresh), see refreshSession(true)
export type RefreshResult = { accessToken: string; me?: Me } | null;

let inFlight: Promise<RefreshResult> | null = null;

async function requestRefresh(includeMe: boolean): Promise<RefreshResult> {
  try {
    const res = await fetch(includeMe ? `${REFRESH_URL}?include=me` : REFRESH_URL, {
      method: "POST",
      credentials: "include",
    });
    // 204: no session cookie at all (a visitor); not ok: invalid or expired session
    if (!res.ok || res.status === 204) return null;
    const body = (await res.json()) as { data?: { accessToken?: string; me?: Me } };
    return body.data?.accessToken ? { accessToken: body.data.accessToken, me: body.data.me } : null;
  } catch {
    return null;
  }
}

// navigator.locks.request resolves with the callback's result once the lock is released
async function withCrossTabLock<T>(fn: () => Promise<T>): Promise<T> {
  if (typeof navigator !== "undefined" && navigator.locks) {
    return await navigator.locks.request(LOCK_NAME, fn);
  }
  return fn();
}

/**
 * Refreshes the session. With includeMe, the response also carries the account, so page
 * load needs one request instead of two in a row. A caller that joins a refresh already in
 * flight gets that one's result, which may lack `me`; it then loads the account itself.
 */
export function refreshSession(includeMe = false): Promise<RefreshResult> {
  inFlight ??= withCrossTabLock(() => requestRefresh(includeMe)).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

export const refreshAccessToken = () => refreshSession().then((r) => r?.accessToken ?? null);
