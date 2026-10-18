import config from '../../config';
import AppError from '../../errors/AppError';
import { prisma } from '../../lib/prisma';
import { AuthService } from '../auth/auth.service';
import { DEMO_ACCOUNTS, type DemoAccountKey } from './demo.config';

// The buttons on the login page: only accounts that exist right now (not mid-reset)
const listAccounts = async () => {
  if (!config.demoEnabled) return [];
  const entries = Object.entries(DEMO_ACCOUNTS) as [
    DemoAccountKey,
    (typeof DEMO_ACCOUNTS)[DemoAccountKey],
  ][];
  const existing = await prisma.user.findMany({
    where: {
      email: { in: entries.map(([, a]) => a.email) },
      memberships: { some: { organization: { isDemo: true } } },
    },
    select: { email: true },
  });
  const ready = new Set(existing.map((u) => u.email));
  return entries
    .filter(([, a]) => ready.has(a.email))
    .map(([account, a]) => ({ account, label: a.label, description: a.description }));
};

/**
 * SRS 21.2: one click, no password. Only the fixed demo accounts, only while they belong
 * to a demo organization, and only when DEMO_ENABLED is on. The session is an ordinary
 * one; what a demo user may change is limited by the demo guards.
 */
const login = async (account: DemoAccountKey) => {
  if (!config.demoEnabled) throw new AppError(404, 'NOT_FOUND', 'The demo is not available');
  const user = await prisma.user.findUnique({
    where: { email: DEMO_ACCOUNTS[account].email },
    select: {
      id: true,
      name: true,
      email: true,
      platformRole: true,
      status: true,
      memberships: { where: { organization: { isDemo: true } }, select: { id: true }, take: 1 },
    },
  });
  if (!user || user.status !== 'ACTIVE' || user.memberships.length === 0) {
    throw new AppError(
      503,
      'SERVICE_UNAVAILABLE',
      'The demo is being reset. Try again in a minute.',
    );
  }
  const { memberships: _memberships, status: _status, ...sessionUser } = user;
  return AuthService.startSession(sessionUser);
};

export const DemoAuth = { listAccounts, login };
