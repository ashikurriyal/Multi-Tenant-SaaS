# ADR-001: Shared-database multi-tenancy with a tenant-scoped Prisma client

**Status:** accepted

## Context

Every organization's members, subscription, invoices, API keys, usage and audit log must be invisible to every other organization. The product targets many small tenants on a free database plan, and the schema evolves with migrations.

## Decision

All tenants share one database and one schema. Every tenant-owned table has an `organizationId` column (indexed), and tenant data is read and written only through `tenantPrisma(orgId)` ([`server/src/lib/tenantPrisma.ts`](../../server/src/lib/tenantPrisma.ts)), a Prisma client extension that:

- ANDs `organizationId` into every `where`, including the caller's own condition on that field, so asking for another tenant's row matches nothing instead of silently reading or updating it;
- forces `organizationId` on `create`, `createMany` and `upsert`, and pins it on updates;
- limits the `Organization` model to its own row (no create or delete through it).

`requireOrgMember` resolves membership once per request, answers `404 ORG_NOT_FOUND` for organizations the user doesn't belong to (never `403`, which would confirm they exist), and hands the route a client already bound to that organization.

## Alternatives considered

- **Schema per tenant:** strong isolation, but every migration runs N times, connection pools multiply, and cross-tenant analytics (MRR across all customers) need a union over schemas. Too heavy for many small tenants on a free plan.
- **Database per tenant:** the same problems, worse; not possible on free hosting.
- **Manual `where: { organizationId }` in every query:** simplest, but one forgotten condition leaks data, and code review is the only safeguard.
- **PostgreSQL row-level security:** strong, but needs a session variable per request, which the connection pooler and serverless functions make fragile.

## Consequences

- Isolation lives in one small module, tested by `npm run verify:tenancy`: 40 checks (cross-tenant reads, writes, updates and deletes; role permissions) against a real PostgreSQL in CI.
- Platform-wide features (admin metrics, jobs) deliberately use the unscoped client, which keeps them visibly separate in code.
- Rules developers must follow, documented in the module: write `organizationId` as a plain field, and don't reach tenant tables through nested includes of global models.
- One noisy tenant shares capacity with everyone. Acceptable at this scale; per-key and per-IP rate limits soften it.
