import { z } from 'zod';

const MAX_AGE_MS = 24 * 60 * 60 * 1000; // FR-USE-02: not more than 24 hours old
const MAX_FUTURE_MS = 5 * 60 * 1000; // …or 5 minutes in the future (clock skew)

const ingest = z.object({
  body: z.object({
    metric: z
      .string()
      .regex(/^[a-z0-9_]{1,50}$/, 'Use 1–50 lowercase letters, digits or underscores'),
    quantity: z.number().int('Must be a whole number').min(1).max(10_000),
    idempotencyKey: z.string().trim().min(1).max(100),
    occurredAt: z.coerce
      .date()
      .refine((d) => Date.now() - d.getTime() <= MAX_AGE_MS, 'Must be within the last 24 hours')
      .refine((d) => d.getTime() - Date.now() <= MAX_FUTURE_MS, 'Must not be in the future')
      .optional(),
  }),
});

const day = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
  .refine((d) => !Number.isNaN(Date.parse(d)), 'Not a real date');

// The range rules (from ≤ to, at most 90 days, defaults) are applied in the service
const daily = z.object({
  query: z.object({
    from: day.optional(),
    to: day.optional(),
    metric: z
      .string()
      .regex(/^[a-z0-9_]{1,50}$/, 'Unknown metric')
      .optional(),
  }),
});

export const UsageValidation = { ingest, daily };

export type TUsageInput = z.infer<typeof ingest>['body'];

export type TDailyQuery = z.infer<typeof daily>['query'];
