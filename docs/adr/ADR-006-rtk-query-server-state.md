# ADR-006: RTK Query for server data; Redux slices only for auth and UI state

**Status:** accepted

## Context

The client shows server data (organization, members, usage, invoices, metrics) that changes after mutations and must refresh tokens transparently. Copying API responses into Redux slices by hand leads to stale copies and duplicated loading logic.

## Decision

- **Server data lives only in the RTK Query cache** (`client/src/redux/api/*`). Mutations invalidate tags (e.g. creating an invitation invalidates `Invitations` and `Org`, since pending invitations hold seats) instead of editing state by hand.
- **Redux slices hold only what the server doesn't:** the session (`authSlice`, access token in memory only), the active organization id, and UI state (dismissed banners).
- **Filters, ranges and pages live in the URL** (`?from&to&metric`, `?page`), so views survive reloads and can be shared.
- **One base query handles authentication** ([`baseApi.ts`](../../client/src/redux/api/baseApi.ts)): on `401` it refreshes once and retries once. Refreshes go through [`session.ts`](../../client/src/redux/api/session.ts), which de-duplicates them within a tab and takes turns across tabs with the Web Locks API, because the server rotates refresh tokens and treats a reused one as stolen.

## Alternatives considered

- **Hand-written thunks and slices:** full control, but every list re-implements loading, error and cache logic.
- **TanStack Query plus a separate auth store:** equally capable; RTK Query keeps one store and one devtools view.

## Consequences

- Loading, error and empty states come from the same query flags everywhere. One lesson is recorded in the code: content gated on a request must latch its "ready" flag (`useSettledOnce`), because RTK Query re-fetches a failed request whenever a component subscribes to it, and a gate that re-mounts its children on every retry loops.
- Signed-in pages render in the browser only (the token is in memory), which limits mobile Lighthouse scores on the dashboard; see NFR-PERF-04 in the SRS.
