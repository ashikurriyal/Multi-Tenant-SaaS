import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../generated/prisma/client';
import config from '../config';

const adapter = new PrismaPg({ connectionString: config.databaseUrl });

// The hosted database adds ~300ms per round trip, so allow interactive transactions
// more than Prisma's default 5s before they are aborted
export const prisma = new PrismaClient({
  adapter,
  transactionOptions: { maxWait: 5_000, timeout: 15_000 },
});
