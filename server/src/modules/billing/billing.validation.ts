import { z } from 'zod';
import { paginationQuery } from '../../utils/pagination';

// FREE isn't bought: it's what an organization has without a paid subscription
const checkout = z.object({
  body: z.object({ planCode: z.enum(['PRO', 'BUSINESS']) }),
});

const planCode = z.enum(['PRO', 'BUSINESS'], {
  error: 'Choose PRO or BUSINESS. To move to Free, cancel in the billing portal.',
});

const changePlanPreview = z.object({ body: z.object({ planCode }) });

// The proration date from the preview makes the charge match what the user saw
const changePlan = z.object({
  body: z.object({ planCode, prorationDate: z.number().int().positive().optional() }),
  headers: z.object({
    'idempotency-key': z
      .string({ error: 'Idempotency-Key header is required' })
      .regex(/^[A-Za-z0-9_-]{8,100}$/, 'Idempotency-Key must be 8–100 letters, digits, - or _'),
  }),
});

const listInvoices = z.object({ query: paginationQuery });

export const BillingValidation = { checkout, changePlanPreview, changePlan, listInvoices };
