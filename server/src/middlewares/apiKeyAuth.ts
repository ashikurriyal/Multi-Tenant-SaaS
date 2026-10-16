import AppError from '../errors/AppError';
import { runInBackground } from '../lib/background';
import { prisma } from '../lib/prisma';
import { API_KEY_PATTERN } from '../modules/apiKey/apiKey.utils';
import catchAsync from '../utils/catchAsync';
import { sha256 } from '../utils/hash';

// lastUsedAt is informational: write it at most once a minute per key, not on every request
const LAST_USED_RESOLUTION_MS = 60 * 1000;

const invalidKey = () => new AppError(401, 'INVALID_API_KEY', 'Invalid or revoked API key');

/**
 * FR-USE-01 / FR-KEY-04: authenticates machine requests by the `x-api-key` header and sets
 * req.apiKey. Checked against the database on every request, so a revoked key stops
 * working immediately. Unknown, malformed and revoked keys get the same 401.
 */
const apiKeyAuth = catchAsync(async (req, _res, next) => {
  const key = req.get('x-api-key')?.trim();
  if (!key || !API_KEY_PATTERN.test(key)) throw invalidKey();

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash: sha256(key) },
    select: { id: true, organizationId: true, prefix: true, revokedAt: true, lastUsedAt: true },
  });
  if (!apiKey || apiKey.revokedAt) throw invalidKey();

  req.apiKey = { id: apiKey.id, organizationId: apiKey.organizationId, prefix: apiKey.prefix };

  const now = Date.now();
  if (!apiKey.lastUsedAt || now - apiKey.lastUsedAt.getTime() > LAST_USED_RESOLUTION_MS) {
    runInBackground('api-key last used', () =>
      prisma.apiKey.updateMany({
        where: {
          id: apiKey.id,
          OR: [
            { lastUsedAt: null },
            { lastUsedAt: { lt: new Date(now - LAST_USED_RESOLUTION_MS) } },
          ],
        },
        data: { lastUsedAt: new Date(now) },
      }),
    );
  }
  next();
});

export default apiKeyAuth;
