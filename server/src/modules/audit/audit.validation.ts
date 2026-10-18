import { z } from 'zod';
import { paginationQuery } from '../../utils/pagination';

// Groups of audit actions, so the timeline can be narrowed (prefixes of `action`)
export const AUDIT_CATEGORIES = {
  members: ['member.', 'invitation.'],
  api_keys: ['apikey.'],
  billing: ['checkout.', 'plan.', 'subscription.', 'reconciliation.'],
  usage: ['usage.'],
  organization: ['organization.'],
} as const;

export type TAuditCategory = keyof typeof AUDIT_CATEGORIES;

const list = z.object({
  query: paginationQuery.extend({
    category: z
      .enum(Object.keys(AUDIT_CATEGORIES) as [TAuditCategory, ...TAuditCategory[]])
      .optional(),
  }),
});

export const AuditValidation = { list };

export type TAuditListQuery = z.infer<typeof list>['query'];
