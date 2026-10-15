// Every token refresh in the app goes through refreshAccessToken().
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

let inFlight: Promise<string | null> | null = null;

async function requestNewAccessToken(): Promise<string | null> {
  try {
    const res = await fetch(REFRESH_URL, { method: "POST", credentials: "include" });
    if (!res.ok) return null;
    const body = (await res.json()) as { data?: { accessToken?: string } };
    return body.data?.accessToken ?? null;
  } catch {
    return null;
  }
}

// navigator.locks.request resolves with the callback's result once the lock is released
async function withCrossTabLock(fn: () => Promise<string | null>): Promise<string | null> {
  if (typeof navigator !== "undefined" && navigator.locks) {
    return await navigator.locks.request(LOCK_NAME, fn);
  }
  return fn();
}

export function refreshAccessToken(): Promise<string | null> {
  inFlight ??= withCrossTabLock(requestNewAccessToken).finally(() => {
    inFlight = null;
  });
  return inFlight;
}
