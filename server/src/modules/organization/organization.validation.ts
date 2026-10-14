import { z } from 'zod';

const name = z.string().trim().min(2).max(80);

const create = z.object({ body: z.object({ name }) });
const update = z.object({ body: z.object({ name }) });

export const OrganizationValidation = { create, update };
