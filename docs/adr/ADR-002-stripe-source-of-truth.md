# ADR-002: Stripe is the source of truth; webhook inbox plus nightly reconciliation

**Status:** accepted

## Context

Subscriptions change in places LedgerFlow doesn't control: Stripe Checkout, the Customer Portal, failed renewals, retries, cancellations at period end. Webhooks report those changes, but they can arrive late, twice, out of order, or (if the endpoint is down long enough) not at all. A local billing state that drifts from Stripe means wrong access or wrong invoices.

## Decision

Stripe owns billing state; LedgerFlow keeps a synchronized copy.

1. **Inbox.** `POST /webhooks/stripe` verifies the signature on the raw body, inserts the event into `stripe_events` (primary key = Stripe's event id, so a redelivery is a no-op), answers `200` immediately, and processes it after the response ([`webhook.controller.ts`](../../server/src/modules/webhook/webhook.controller.ts)).
2. **Exactly-once processing.** A worker claims a row atomically (status `RECEIVED`/`FAILED` → `PROCESSING`), runs the handler, and marks it `PROCESSED`, or `FAILED` with exponential backoff (2, 4, 8, 16 minutes; 5 attempts). Rows stuck in `PROCESSING` for 10 minutes are recovered. The `retry-webhooks` job drives retries ([`webhook.processor.ts`](../../server/src/modules/webhook/webhook.processor.ts)).
3. **Reconciliation.** The daily `reconcile-stripe` job re-syncs every organization with a Stripe customer and audits each corrected field as `reconciliation.corrected` ([`reconcileStripe.ts`](../../server/src/jobs/reconcileStripe.ts)). It also finds subscriptions whose webhooks never arrived.
4. **Requests don't change billing state.** A plan change calls Stripe and answers `202`; the database changes when the resulting webhook is processed.

## Alternatives considered

- **Process inside the webhook request:** simpler, but slow handlers risk Stripe's timeout and duplicate deliveries race each other.
- **Update the database directly after calling Stripe from a request:** fast, but then two writers (request and webhook) can disagree, and failures between the two calls leave drift.
- **A message queue:** the right tool at scale, but not available on free serverless hosting; the inbox table gives the same guarantees here.

## Consequences

- Duplicate, late and out-of-order events are harmless; a webhook outage heals by the next night.
- The UI waits for the webhook after Checkout or a plan change (it polls the subscription for up to 30 seconds).
- The inbox doubles as an audit trail; failed events are visible on the admin webhooks page.
