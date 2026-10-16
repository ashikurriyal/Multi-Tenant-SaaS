import { z } from 'zod';

// FREE isn't bought: it's what an organization has without a paid subscription
const checkout = z.object({
  body: z.object({ planCode: z.enum(['PRO', 'BUSINESS']) }),
});

export const BillingValidation = { checkout };
