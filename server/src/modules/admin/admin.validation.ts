import { z } from 'zod';
import { SubscriptionStatus, WebhookEventStatus } from '../../../generated/prisma/enums';
import { paginationQuery } from '../../utils/pagination';

const months = z.object({
  query: z.object({ months: z.coerce.number().int().min(1).max(36).default(12) }),
});

const tenants = z.object({
  query: paginationQuery.extend({
    search: z.string().trim().min(1).max(100).optional(),
    plan: z
      .string()
      .regex(/^[A-Z_]{1,30}$/, 'Use a plan code, e.g. PRO')
      .optional(),
    status: z.enum(SubscriptionStatus).optional(),
  }),
});

const webhookEvents = z.object({
  query: paginationQuery.extend({
    status: z.enum(WebhookEventStatus).default('FAILED'),
  }),
});

export const AdminValidation = { months, tenants, webhookEvents };

export type TMonthsQuery = z.infer<typeof months>['query'];
export type TTenantsQuery = z.infer<typeof tenants>['query'];
export type TWebhookEventsQuery = z.infer<typeof webhookEvents>['query'];
