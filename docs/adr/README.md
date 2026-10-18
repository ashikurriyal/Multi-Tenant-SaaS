# Architecture decision records

One page each: **Context · Decision · Alternatives considered · Consequences.** They record why LedgerFlow is built the way it is; the [SRS](../LedgerFlow.md) records what it does.

| ADR | Decision |
| --- | --- |
| [ADR-001](ADR-001-shared-database-tenancy.md) | Shared-database multi-tenancy with a tenant-scoped Prisma client |
| [ADR-002](ADR-002-stripe-source-of-truth.md) | Stripe is the source of truth: webhook inbox plus nightly reconciliation |
| [ADR-003](ADR-003-refetch-stripe-objects.md) | Re-fetch Stripe objects instead of trusting event payloads |
| [ADR-004](ADR-004-postgres-atomic-counters.md) | PostgreSQL atomic counters for usage limits instead of Redis |
| [ADR-005](ADR-005-daily-mrr-snapshots.md) | Daily MRR snapshots instead of computing analytics on request |
| [ADR-006](ADR-006-rtk-query-server-state.md) | RTK Query for server data; Redux slices only for auth and UI state |
| [ADR-007](ADR-007-same-origin-rewrite.md) | A Next.js rewrite for same-origin cookies |
