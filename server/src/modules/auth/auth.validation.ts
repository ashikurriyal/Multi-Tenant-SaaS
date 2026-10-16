import { z } from 'zod';

const email = z.string().trim().toLowerCase().pipe(z.email('Invalid email'));
const password = z.string().min(8, 'Password must be at least 8 characters').max(72);
const token = z.string().min(20).max(100);

// Same-site paths only, e.g. "/invite/abc" — used to continue after verification
const nextPath = z
  .string()
  .max(300)
  .refine((v) => v.startsWith('/') && !v.startsWith('//') && !v.startsWith('/\\'), 'Invalid path');

const register = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(60),
    email,
    password,
    organizationName: z.string().trim().min(2).max(80),
    // Signing up from an invitation link: the invite proves the address, so no extra email
    inviteToken: token.optional(),
    next: nextPath.optional(),
  }),
});

const login = z.object({
  body: z.object({
    email,
    password: z.string().min(1, 'Password is required'),
  }),
});

const verifyEmail = z.object({ body: z.object({ token }) });

const emailOnly = z.object({ body: z.object({ email, next: nextPath.optional() }) });

const resetPassword = z.object({ body: z.object({ token, password }) });

export const AuthValidation = {
  register,
  login,
  verifyEmail,
  resendVerification: emailOnly,
  forgotPassword: emailOnly,
  resetPassword,
};

export type TRegisterPayload = z.infer<typeof register>['body'];
