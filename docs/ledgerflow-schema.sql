-- LedgerFlow schema (PostgreSQL). Generated from prisma/schema.prisma.
-- Import into DrawSQL: New diagram > Import > PostgreSQL.

CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'BLOCKED');
CREATE TYPE "PlatformRole" AS ENUM ('USER', 'SUPER_ADMIN');
CREATE TYPE "OrgRole" AS ENUM ('OWNER', 'ADMIN', 'BILLING', 'MEMBER');
CREATE TYPE "SubscriptionStatus" AS ENUM ('INCOMPLETE', 'TRIALING', 'ACTIVE', 'PAST_DUE', 'UNPAID', 'CANCELED');
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'OPEN', 'PAID', 'UNCOLLECTIBLE', 'VOID');
CREATE TYPE "WebhookEventStatus" AS ENUM ('RECEIVED', 'PROCESSING', 'PROCESSED', 'FAILED');
CREATE TYPE "EmailStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

CREATE TABLE "users" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "password" TEXT NOT NULL,
  "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "platformRole" "PlatformRole" NOT NULL DEFAULT 'USER',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE "organizations" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "stripeCustomerId" TEXT UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE "memberships" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "role" "OrgRole" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  UNIQUE ("userId", "organizationId")
);

CREATE TABLE "invitations" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "organizationId" TEXT NOT NULL,
  "invitedById" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" "OrgRole" NOT NULL,
  "tokenHash" TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "acceptedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE TABLE "refresh_tokens" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "familyId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE TABLE "plans" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "stripePriceId" TEXT UNIQUE,
  "stripeMeteredPriceId" TEXT UNIQUE,
  "monthlyPriceCents" INTEGER NOT NULL,
  "seatLimit" INTEGER NOT NULL,
  "includedUnits" INTEGER NOT NULL,
  "overageUnitMicros" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE TABLE "subscriptions" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "organizationId" TEXT NOT NULL UNIQUE,
  "planId" TEXT NOT NULL,
  "stripeSubscriptionId" TEXT UNIQUE,
  "status" "SubscriptionStatus" NOT NULL,
  "currentPeriodStart" TIMESTAMP(3) NOT NULL,
  "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
  "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
  "trialEndsAt" TIMESTAMP(3),
  "graceEndsAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE "invoices" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "organizationId" TEXT NOT NULL,
  "subscriptionId" TEXT,
  "stripeInvoiceId" TEXT NOT NULL UNIQUE,
  "status" "InvoiceStatus" NOT NULL,
  "amountDueCents" INTEGER NOT NULL,
  "amountPaidCents" INTEGER NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'usd',
  "periodStart" TIMESTAMP(3) NOT NULL,
  "periodEnd" TIMESTAMP(3) NOT NULL,
  "hostedInvoiceUrl" TEXT,
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE TABLE "stripe_events" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" "WebhookEventStatus" NOT NULL DEFAULT 'RECEIVED',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3),
  "lastError" TEXT,
  "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  PRIMARY KEY ("id")
);

CREATE TABLE "api_keys" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "organizationId" TEXT NOT NULL,
  "createdById" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "prefix" TEXT NOT NULL,
  "keyHash" TEXT NOT NULL UNIQUE,
  "lastUsedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE TABLE "usage_events" (
  "id" BIGSERIAL NOT NULL,
  "organizationId" TEXT NOT NULL,
  "apiKeyId" TEXT NOT NULL,
  "metric" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "reportedToStripeAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  UNIQUE ("organizationId", "idempotencyKey")
);

CREATE TABLE "usage_counters" (
  "organizationId" TEXT NOT NULL,
  "periodStart" TIMESTAMP(3) NOT NULL,
  "units" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  PRIMARY KEY ("organizationId", "periodStart")
);

CREATE TABLE "usage_daily_rollups" (
  "organizationId" TEXT NOT NULL,
  "metric" TEXT NOT NULL,
  "day" DATE NOT NULL,
  "quantity" INTEGER NOT NULL,
  PRIMARY KEY ("organizationId", "metric", "day")
);

CREATE TABLE "mrr_snapshots" (
  "day" DATE NOT NULL,
  "organizationId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "mrrCents" INTEGER NOT NULL,
  PRIMARY KEY ("day", "organizationId")
);

CREATE TABLE "audit_logs" (
  "id" BIGSERIAL NOT NULL,
  "organizationId" TEXT,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "before" JSONB,
  "after" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

CREATE TABLE "email_outbox" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
  "organizationId" TEXT,
  "toEmail" TEXT NOT NULL,
  "template" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "status" "EmailStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY ("id")
);

ALTER TABLE "memberships" ADD CONSTRAINT "memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "memberships" ADD CONSTRAINT "memberships_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE;
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE;
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "users"("id");
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id");
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE;
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id");
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE;
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id");
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE;
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "api_keys"("id");
ALTER TABLE "usage_counters" ADD CONSTRAINT "usage_counters_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE;
ALTER TABLE "usage_daily_rollups" ADD CONSTRAINT "usage_daily_rollups_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE;
ALTER TABLE "mrr_snapshots" ADD CONSTRAINT "mrr_snapshots_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE;
ALTER TABLE "mrr_snapshots" ADD CONSTRAINT "mrr_snapshots_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id");
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id");
ALTER TABLE "email_outbox" ADD CONSTRAINT "email_outbox_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE;
