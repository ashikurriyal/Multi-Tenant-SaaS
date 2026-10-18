# ADR-005: Daily MRR snapshots instead of computing analytics on request

**Status:** accepted

## Context

The platform admin needs MRR, MRR movements (new, expansion, contraction, churn, reactivation), customer churn, NRR and ARPA for the last 12 or 24 months. The `subscriptions` table holds only the current state, so history can't be reconstructed from it.

## Decision

The daily `mrr-snapshot` job writes one row per organization per day to `mrr_snapshots` (`day`, `organizationId`, `planId`, `mrrCents`), using one rule for MRR (`mrrCentsOf` in [`metrics.ts`](../../server/src/shared/metrics.ts)): recurring plan fees of paid plans with full access, trials excluded, overage excluded. The admin endpoints compare each organization's MRR on the last snapshot day of consecutive months; the movement and rate formulas are pure functions, checked against the SRS worked example by `npm run check:metrics` ([`admin.service.ts`](../../server/src/modules/admin/admin.service.ts)).

## Alternatives considered

- **Compute from Stripe invoices on request:** slow, rate-limited, and invoices don't map cleanly to MRR (proration, credits, overage).
- **An event log of subscription changes:** precise, but every past change must have been captured correctly, and replaying it on each request costs more than reading month-end rows.
- **Monthly snapshots only:** fewer rows, but a missed job leaves a hole that looks like every customer churned.

## Consequences

- Dashboards read a small, indexed table: under 3 ms on a year of sample data.
- A month without snapshots carries the previous state forward (no data = no change) instead of reporting mass churn.
- Rows grow with organizations × days. Indexed on `(day, organizationId)` and `(organizationId, day)`; old rows could be thinned to month-ends later.
- The sample-history seed (`npm run seed:demo`) writes daily rows with the same rule, so the job and the seed always agree.
