import { z } from 'zod';

const create = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().pipe(z.email('Invalid email')),
    role: z.enum(['ADMIN', 'BILLING', 'MEMBER'], {
      error: 'Role must be ADMIN, BILLING or MEMBER',
    }),
  }),
});

const token = z.object({
  params: z.object({ token: z.string().min(20).max(100) }),
});

export const InvitationValidation = { create, token };

export type TCreateInvitationPayload = z.infer<typeof create>['body'];
