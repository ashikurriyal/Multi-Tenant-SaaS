# ADR-003: Re-fetch Stripe objects instead of trusting event payloads

**Status:** accepted

## Context

A webhook event carries a snapshot of the object at the time the event was created. Events can arrive out of order (an older `customer.subscription.updated` after a newer one) and twice. Applying payloads in arrival order can roll a subscription back to an old state.

## Decision

Handlers treat an event only as "this object changed, look again". [`billing.sync.ts`](../../server/src/modules/billing/billing.sync.ts) then:

- re-fetches the subscription or invoice from the Stripe API (current state, with the prices expanded);
- resolves the organization by `metadata.organizationId` (set by our Checkout), or by the saved `stripeCustomerId`, and ignores objects that belong to no LedgerFlow organization (development and production share one Stripe test account);
- locks the organization's subscription row (`SELECT … FOR UPDATE`) and writes plan, status, period dates, cancellation and the grace period in one transaction, together with the audit rows and outbox emails that a status change calls for;
- refuses to let an event about an older, already replaced subscription undo the current one.

## Alternatives considered

- **Apply the event payload:** one API call fewer per event, but correctness then depends on ordering, which Stripe doesn't guarantee.
- **Compare event timestamps and drop older ones:** fragile (several events share a second) and still loses information when the newest event is the one that fails.

## Consequences

- Every path (webhook, retry, nightly reconciliation, the demo provisioning) ends in the same current state, because they all call the same sync.
- One extra Stripe API call per event; negligible at this volume.
- Emails follow status changes inside the same transaction, so a repeated event never sends a second email.
