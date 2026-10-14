import { z } from 'zod';
import { paginationQuery } from '../../utils/pagination';

const membershipParams = z.object({
  orgId: z.string(),
  membershipId: z.string(),
});

const list = z.object({ query: paginationQuery });

const changeRole = z.object({
  params: membershipParams,
  body: z.object({ role: z.enum(['OWNER', 'ADMIN', 'BILLING', 'MEMBER']) }),
});

const remove = z.object({ params: membershipParams });

export const MemberValidation = { list, changeRole, remove };
