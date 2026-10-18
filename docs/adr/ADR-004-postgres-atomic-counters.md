# ADR-004: PostgreSQL atomic counters for usage limits instead of Redis

**Status:** accepted

## Context

Customer apps report usage through `POST /api/v1/usage`. The Free plan has a hard limit (1,000 units a month) that must hold even when many requests arrive at once; paid plans allow overage. Each event must be counted once even if the client retries it.

## Decision

The limit check and the increment are a single SQL statement on a per-period counter row ([`usage.service.ts`](../../server/src/modules/usage/usage.service.ts)):

```sql
INSERT INTO usage_counters ("organizationId", "periodStart", units, "updatedAt")
SELECT $org, $period, $q, now() WHERE $limit IS NULL OR $q <= $limit
ON CONFLICT ("organizationId", "periodStart") DO UPDATE
  SET units = usage_counters.units + EXCLUDED.units, "updatedAt" = now()
  WHERE $limit IS NULL OR usage_counters.units + EXCLUDED.units <= $limit
RETURNING units
```

No row returned means the limit would be exceeded (`429 PLAN_LIMIT_USAGE`). The event is inserted in the same transaction, and a unique index on `(organizationId, idempotencyKey)` makes a retried event roll back and answer with the original (`duplicate: true`). Each event records the counter period it went into, so the daily `verify-usage-counters` job can prove `counter = sum(events)` and repair (and audit) any drift.

## Alternatives considered

- **Redis `INCR`:** fast, but a second datastore to host (no free option that fits) and to keep consistent with the events table; the limit and the event would no longer commit together.
- **Read, check, then write:** two concurrent requests both see room and both write; the limit is overrun.
- **`SELECT … FOR UPDATE` then update:** correct, but two round trips while holding the lock.

## Consequences

- Measured: 50 simultaneous requests of 30 units against 1,000 → exactly 33 accepted, counter 990; 20 simultaneous duplicates → one event.
- Concurrent requests for one organization queue on its counter row. Fine for this scale; very high-volume tenants would need sharded counters.
- The per-key rate limit (100/s) is counted in memory per instance, so it is approximate across instances; the plan limit itself is exact.
