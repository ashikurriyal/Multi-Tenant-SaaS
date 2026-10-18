-- Usage jobs: each event records the usage_counters period it was added to (so the
-- verify-usage-counters job can compare exactly) and whether it is billable (reported to
-- Stripe's meter by report-usage).

-- DropIndex
DROP INDEX "usage_events_reportedToStripeAt_idx";

-- AlterTable: periodStart is added as nullable, backfilled, then made required
ALTER TABLE "usage_events" ADD COLUMN     "billable" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "periodStart" TIMESTAMP(3);

-- Backfill: events recorded during a paid subscription's current period belong to it;
-- everything else to its calendar month (the Free period). Existing events stay
-- billable = false, so nothing recorded before this migration is sent to Stripe.
UPDATE "usage_events" e
SET "periodStart" = s."currentPeriodStart"
FROM "subscriptions" s
JOIN "plans" p ON p."id" = s."planId"
WHERE s."organizationId" = e."organizationId"
  AND p."stripePriceId" IS NOT NULL
  AND e."createdAt" >= s."currentPeriodStart"
  AND e."createdAt" < s."currentPeriodEnd";

UPDATE "usage_events"
SET "periodStart" = date_trunc('month', "createdAt")
WHERE "periodStart" IS NULL;

ALTER TABLE "usage_events" ALTER COLUMN "periodStart" SET NOT NULL;

-- CreateIndex
CREATE INDEX "usage_events_organizationId_periodStart_idx" ON "usage_events"("organizationId", "periodStart");

-- CreateIndex
CREATE INDEX "usage_events_occurredAt_idx" ON "usage_events"("occurredAt");

-- CreateIndex
CREATE INDEX "usage_events_billable_reportedToStripeAt_idx" ON "usage_events"("billable", "reportedToStripeAt");
