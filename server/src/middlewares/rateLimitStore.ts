import type { ClientRateLimitInfo, Options, Store } from 'express-rate-limit';
import { prisma } from '../lib/prisma';

type TRow = { hits: number; resetAt: Date };

/**
 * express-rate-limit store backed by PostgreSQL, so the limit holds across every
 * server instance. One atomic upsert per counted request: a window that has expired
 * starts again at 1, otherwise the counter is incremented.
 */
export class PrismaRateLimitStore implements Store {
  readonly prefix: string;
  private windowSeconds = 60;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  init(options: Options) {
    this.windowSeconds = options.windowMs / 1000;
  }

  private key(key: string) {
    return `${this.prefix}:${key}`;
  }

  async increment(key: string): Promise<ClientRateLimitInfo> {
    const rows = await prisma.$queryRaw<TRow[]>`
      INSERT INTO rate_limits ("key", hits, "resetAt")
      VALUES (${this.key(key)}, 1, now() + make_interval(secs => ${this.windowSeconds}::double precision))
      ON CONFLICT ("key") DO UPDATE SET
        hits = CASE WHEN rate_limits."resetAt" <= now() THEN 1 ELSE rate_limits.hits + 1 END,
        "resetAt" = CASE WHEN rate_limits."resetAt" <= now()
          THEN now() + make_interval(secs => ${this.windowSeconds}::double precision)
          ELSE rate_limits."resetAt" END
      RETURNING hits, "resetAt"`;
    const row = rows[0]!;
    return { totalHits: row.hits, resetTime: row.resetAt };
  }

  async decrement(key: string) {
    await prisma.$executeRaw`
      UPDATE rate_limits SET hits = GREATEST(hits - 1, 0) WHERE "key" = ${this.key(key)}`;
  }

  async resetKey(key: string) {
    await prisma.rateLimit.deleteMany({ where: { key: this.key(key) } });
  }
}
