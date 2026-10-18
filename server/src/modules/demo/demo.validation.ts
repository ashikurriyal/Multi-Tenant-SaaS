import { z } from 'zod';
import { DEMO_ACCOUNTS, type DemoAccountKey } from './demo.config';

const login = z.object({
  body: z.object({
    account: z.enum(Object.keys(DEMO_ACCOUNTS) as [DemoAccountKey, ...DemoAccountKey[]]),
  }),
});

export const DemoValidation = { login };
