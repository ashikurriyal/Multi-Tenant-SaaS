import 'dotenv/config';
import { z } from 'zod';

// Only the variables used so far are validated; each feature adds its own.
const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().int().positive().default(5000),
    DATABASE_URL: z.string().min(1),
    CLIENT_URL: z.url().default('http://localhost:3000'),
    BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
    JWT_ACCESS_SECRET: z.string().min(32, 'must be at least 32 characters'),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_SECRET: z.string().min(32, 'must be at least 32 characters'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    MAIL_FROM: z.string().default('LedgerFlow <no-reply@ledgerflow.dev>'),
    ENABLE_JOBS: z
      .enum(['true', 'false'])
      .default('true')
      .transform((v) => v === 'true'),
  })
  .refine((env) => env.JWT_ACCESS_SECRET !== env.JWT_REFRESH_SECRET, {
    message: 'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different',
    path: ['JWT_REFRESH_SECRET'],
  })
  .refine(
    (env) =>
      env.NODE_ENV !== 'production' || Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS),
    {
      message: 'SMTP_HOST, SMTP_USER and SMTP_PASS are required in production',
      path: ['SMTP_HOST'],
    },
  );

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', z.prettifyError(parsed.error));
  process.exit(1);
}

const env = parsed.data;

const config = {
  env: env.NODE_ENV,
  isProd: env.NODE_ENV === 'production',
  port: env.PORT,
  databaseUrl: env.DATABASE_URL,
  clientUrl: env.CLIENT_URL,
  bcryptSaltRounds: env.BCRYPT_SALT_ROUNDS,
  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET,
    accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
    refreshSecret: env.JWT_REFRESH_SECRET,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },
  mail: {
    host: env.SMTP_HOST || undefined,
    port: env.SMTP_PORT,
    user: env.SMTP_USER || undefined,
    pass: env.SMTP_PASS || undefined,
    from: env.MAIL_FROM,
  },
  enableJobs: env.ENABLE_JOBS,
} as const;

export default config;
