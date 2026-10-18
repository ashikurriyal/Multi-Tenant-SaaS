# ADR-007: A Next.js rewrite for same-origin cookies

**Status:** accepted

## Context

The refresh token is an httpOnly cookie (so scripts can't read it) scoped to `/api/v1/auth`. The website and the API are separate deployments on different hosts (`ledgerflow-web-portal.vercel.app`, `ledgerflow-api-service.vercel.app`). Cross-site, that cookie is a third-party cookie: Safari blocks it, and Chrome is phasing them out, which would break login.

## Decision

The website proxies `/api/*` to the API with a rewrite in [`client/next.config.ts`](../../client/next.config.ts), and the client calls relative URLs (`/api/v1/...`). The browser sees one origin, so the cookie is first-party and can use `SameSite=Lax`. The API trusts the proxy's `X-Forwarded-For` (`TRUST_PROXY`) so rate limits and logs still see the client's IP.

## Alternatives considered

- **Call the API host directly with CORS and `SameSite=None; Secure`:** works in some browsers today, blocked in others, and depends on third-party cookies surviving.
- **Token in `localStorage`:** no cookie problem, but readable by any injected script (excluded by NFR-SEC-02).
- **A custom domain for both (`app.` and `api.` subdomains):** same-site and clean, but needs a paid or owned domain; the project runs at zero cost.

## Consequences

- No CORS preflights for the app's own requests; one origin in the browser.
- Every API call takes one extra hop through the website's edge. Small, but it is part of the measured latency.
- `API_URL` is read when the website is built, so changing it means redeploying the website.
- Stripe webhooks and the scheduled-job calls go to the API host directly; they don't involve cookies.
