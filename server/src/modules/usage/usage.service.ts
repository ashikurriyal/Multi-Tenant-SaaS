import { Prisma } from '../../../generated/prisma/client';
import AppError from '../../errors/AppError';
import { prisma } from '../../lib/prisma';
import { getUsageContext } from './usage.utils';
import type { TUsageInput } from './usage.validation';

type TApiKey = { id: string; organizationId: string };

export type TUsageResult = {
  eventId: string;
  duplicate: boolean;
  periodUnits: number;
  includedUnits: number;
};

const findOriginal = (organizationId: string, idempotencyKey: string) =>
  prisma.usageEvent.findUnique({
    where: { organizationId_idempotencyKey: { organizationId, idempotencyKey } },
    select: { id: true },
  });

const limitReached = (limit: number) =>
  new AppError(
    429,
    'PLAN_LIMIT_USAGE',
    `Monthly usage limit of ${limit.toLocaleString('en-US')} units reached. Upgrade to continue.`,
  );

/**
 * FR-USE-01…06, SRS 16.4. The limit check and the increment are ONE SQL statement:
 * PostgreSQL locks the counter row while updating it, so concurrent requests queue and each
 * sees the previous result — the limit can't be overrun. The event row is written in the
 * same transaction, so a rejected or duplicate request counts nothing.
 */
const recordUsage = async (apiKey: TApiKey, input: TUsageInput): Promise<TUsageResult> => {
  const { organizationId } = apiKey;
  const ctx = await getUsageContext(organizationId);
  const periodUnits = async () =>
    (
      await prisma.usageCounter.findUnique({
        where: { organizationId_periodStart: { organizationId, periodStart: ctx.periodStart } },
        select: { units: true },
      })
    )?.units ?? 0;

  // A retry of something already recorded is answered as a duplicate — even at the limit
  const existing = await findOriginal(organizationId, input.idempotencyKey);
  if (existing) {
    return {
      eventId: existing.id.toString(),
      duplicate: true,
      periodUnits: await periodUnits(),
      includedUnits: ctx.includedUnits,
    };
  }

  try {
    return await prisma.$transaction(async (tx) => {
      // Insert the counter for a new period, or add to it — only if it stays within the limit.
      // No row back = the limit would be exceeded.
      const rows = await tx.$queryRaw<{ units: number }[]>`
        INSERT INTO usage_counters ("organizationId", "periodStart", units, "updatedAt")
        SELECT ${organizationId}, ${ctx.periodStart}, ${input.quantity}, now()
        WHERE ${ctx.limit}::int IS NULL OR ${input.quantity} <= ${ctx.limit}::int
        ON CONFLICT ("organizationId", "periodStart") DO UPDATE
          SET units = usage_counters.units + EXCLUDED.units, "updatedAt" = now()
          WHERE ${ctx.limit}::int IS NULL OR usage_counters.units + EXCLUDED.units <= ${ctx.limit}::int
        RETURNING units`;
      if (rows.length === 0) throw limitReached(ctx.limit!);

      const event = await tx.usageEvent.create({
        data: {
          organizationId,
          apiKeyId: apiKey.id,
          metric: input.metric,
          quantity: input.quantity,
          idempotencyKey: input.idempotencyKey,
          occurredAt: input.occurredAt ?? new Date(),
        },
        select: { id: true },
      });

      // BigInt ids can't go through JSON.stringify
      return {
        eventId: event.id.toString(),
        duplicate: false,
        periodUnits: rows[0]!.units,
        includedUnits: ctx.includedUnits,
      };
    });
  } catch (err) {
    // Two identical requests at the same moment: the unique index lets one win and the
    // whole transaction of the other (counter included) rolls back
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      const original = await findOriginal(organizationId, input.idempotencyKey);
      if (original) {
        return {
          eventId: original.id.toString(),
          duplicate: true,
          periodUnits: await periodUnits(),
          includedUnits: ctx.includedUnits,
        };
      }
    }
    throw err;
  }
};

export const UsageService = { recordUsage };
