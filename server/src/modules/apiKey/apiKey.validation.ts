import { z } from 'zod';

const create = z.object({
  body: z.object({ name: z.string().trim().min(2, 'At least 2 characters').max(60) }),
});

const revoke = z.object({
  params: z.object({ orgId: z.string(), keyId: z.string().uuid('Invalid key id') }),
});

export const ApiKeyValidation = { create, revoke };
