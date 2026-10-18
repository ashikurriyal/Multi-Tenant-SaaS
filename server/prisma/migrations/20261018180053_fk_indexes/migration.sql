-- CreateIndex
CREATE INDEX "api_keys_createdById_idx" ON "api_keys"("createdById");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "email_outbox_organizationId_idx" ON "email_outbox"("organizationId");

-- CreateIndex
CREATE INDEX "invitations_invitedById_idx" ON "invitations"("invitedById");

-- CreateIndex
CREATE INDEX "invoices_subscriptionId_idx" ON "invoices"("subscriptionId");

-- CreateIndex
CREATE INDEX "mrr_snapshots_organizationId_day_idx" ON "mrr_snapshots"("organizationId", "day");

-- CreateIndex
CREATE INDEX "mrr_snapshots_planId_idx" ON "mrr_snapshots"("planId");

-- CreateIndex
CREATE INDEX "subscriptions_planId_idx" ON "subscriptions"("planId");

-- CreateIndex
CREATE INDEX "usage_events_apiKeyId_idx" ON "usage_events"("apiKeyId");
