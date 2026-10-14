import { z } from 'zod';
import type { TMeta } from './sendResponse';

// ?page=1&limit=10, maximum limit 100 (SRS section 10.1)
export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type TPagination = z.infer<typeof paginationQuery>;

export const toSkipTake = ({ page, limit }: TPagination) => ({
  skip: (page - 1) * limit,
  take: limit,
});

export const buildMeta = ({ page, limit }: TPagination, total: number): TMeta => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});
