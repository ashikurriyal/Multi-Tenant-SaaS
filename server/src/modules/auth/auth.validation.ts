import { z } from 'zod';

const email = z.string().trim().toLowerCase().pipe(z.email('Invalid email'));

const register = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(60),
    email,
    password: z.string().min(8, 'Password must be at least 8 characters').max(72),
    organizationName: z.string().trim().min(2).max(80),
  }),
});

const login = z.object({
  body: z.object({
    email,
    password: z.string().min(1, 'Password is required'),
  }),
});

export const AuthValidation = { register, login };

export type TRegisterPayload = z.infer<typeof register>['body'];
