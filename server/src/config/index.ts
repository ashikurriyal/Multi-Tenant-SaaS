import 'dotenv/config';
import { z } from 'zod';

// Only the variables used so far are validated; each feature adds its own.
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().min(1),
  CLIENT_URL: z.url().default('http://localhost:3000'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
});

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
} as const;

export default config;
