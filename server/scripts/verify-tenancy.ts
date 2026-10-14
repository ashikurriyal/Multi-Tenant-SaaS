/**
 * Tenant isolation + RBAC check against a real database.
 * Creates two throwaway organizations, tries to cross the tenant boundary every way
 * we know, then deletes everything it created. Exit code 1 if any check fails.
 *
 *   npm run verify:tenancy
 */
import crypto from 'node:crypto';
import express from 'express';
import type { AddressInfo } from 'node:net';
import config from '../src/config';
import { prisma } from '../src/lib/prisma';
import passport from '../src/lib/passport';
import { tenantPrisma } from '../src/lib/tenantPrisma';
import { auth } from '../src/middlewares/auth';
import globalErrorHandler from '../src/middlewares/globalErrorHandler';
import requireOrgMember from '../src/middlewares/requireOrgMember';
import requirePermission from '../src/middlewares/requirePermission';
import requireSuperAdmin from '../src/middlewares/requireSuperAdmin';
import { AuthService } from '../src/modules/auth/auth.service';
import { PERMISSIONS, ROLE_PERMISSIONS, canAssignRole } from '../src/shared/permissions';
import { signAccessToken } from '../src/utils/tokens';

if (config.isProd) {
  console.error('Refusing to run against production (NODE_ENV=production).');
  process.exit(1);
}

const RUN = crypto.randomBytes(3).toString('hex');
const EMAIL_DOMAIN = `@verify-${RUN}.test`;
const DAY = 24 * 60 * 60 * 1000;

let passed = 0;
let failed = 0;

const check = (name: string, ok: boolean) => {
  if (ok) passed++;
  else failed++;
  console.info(`${ok ? '✅' : '❌'} ${name}`);
};

// Returns the Prisma error code (or message) a call fails with, or 'no-throw'
const errorOf = async (fn: () => Promise<unknown>) => {
  try {
    await fn();
    return 'no-throw';
  } catch (err) {
    return (err as { code?: string }).code ?? (err as Error).message;
  }
};

async function verifyPrismaScoping() {
  const a = await AuthService.register({
    name: 'Alice',
    email: `alice${EMAIL_DOMAIN}`,
    password: 'password123',
    organizationName: `Verify A ${RUN}`,
  });
  const b = await AuthService.register({
    name: 'Bob',
    email: `bob${EMAIL_DOMAIN}`,
    password: 'password123',
    organizationName: `Verify B ${RUN}`,
  });
  const A = a.organization.id;
  const B = b.organization.id;
  const db = tenantPrisma(A);

  const bMembership = await prisma.membership.findFirstOrThrow({ where: { organizationId: B } });
  const invite = (organizationId: string, invitedById: string, tag: string) => ({
    organizationId,
    invitedById,
    email: `${tag}${EMAIL_DOMAIN}`,
    role: 'MEMBER' as const,
    tokenHash: `${RUN}-${tag}`,
    expiresAt: new Date(Date.now() + DAY),
  });
  const invB = await prisma.invitation.create({ data: invite(B, b.user.id, 'inv-b') });

  console.info('\n— Reads');
  const own = await db.membership.findMany();
  check('findMany returns only own rows', own.length === 1 && own[0]!.organizationId === A);
  check(
    'findMany where organizationId = B → nothing',
    (await db.membership.findMany({ where: { organizationId: B } })).length === 0,
  );
  check(
    'findUnique on B row → null',
    (await db.membership.findUnique({ where: { id: bMembership.id } })) === null,
  );
  check(
    'findFirst on B row → null',
    (await db.invitation.findFirst({ where: { id: invB.id } })) === null,
  );
  check('count is scoped', (await db.membership.count()) === 1);
  const agg = await db.membership.aggregate({ _count: { _all: true } });
  check('aggregate is scoped', agg._count._all === 1);
  const groups = await db.membership.groupBy({ by: ['organizationId'], _count: true });
  check('groupBy is scoped', groups.length === 1 && groups[0]!.organizationId === A);
  const orgs = await db.organization.findMany();
  check('organization.findMany → own org only', orgs.length === 1 && orgs[0]!.id === A);
  check(
    'organization.findUnique(B) → null',
    (await db.organization.findUnique({ where: { id: B } })) === null,
  );

  console.info('\n— Writes');
  check(
    'update B row → P2025',
    (await errorOf(() =>
      db.membership.update({ where: { id: bMembership.id }, data: { role: 'MEMBER' } }),
    )) === 'P2025',
  );
  check(
    'updateMany B row → 0 rows',
    (await db.invitation.updateMany({ where: { id: invB.id }, data: { email: 'x@x.test' } }))
      .count === 0,
  );
  check(
    'delete B row → P2025',
    (await errorOf(() => db.invitation.delete({ where: { id: invB.id } }))) === 'P2025',
  );
  check(
    'organization.update(B) → P2025',
    (await errorOf(() => db.organization.update({ where: { id: B }, data: { name: 'x' } }))) ===
      'P2025',
  );
  check(
    'organization.delete blocked',
    (await errorOf(() => db.organization.delete({ where: { id: A } }))).includes('not allowed'),
  );
  check(
    'organization.create blocked',
    (
      await errorOf(() => db.organization.create({ data: { name: 'x', slug: `x-${RUN}` } }))
    ).includes('not allowed'),
  );

  const created = await db.invitation.create({ data: invite(B, a.user.id, 'c1') });
  check('create with organizationId = B is forced to A', created.organizationId === A);
  const many = await db.invitation.createManyAndReturn({
    data: [invite(B, a.user.id, 'c2'), invite(B, a.user.id, 'c3')],
  });
  check(
    'createManyAndReturn is forced to A',
    many.every((i) => i.organizationId === A),
  );
  const moved = await db.invitation.update({
    where: { id: created.id },
    data: { organizationId: B },
  });
  check('update cannot move a row to B', moved.organizationId === A);
  const periodStart = new Date('2000-01-01');
  const counter = await db.usageCounter.upsert({
    where: { organizationId_periodStart: { organizationId: B, periodStart } },
    create: { organizationId: B, periodStart, units: 1 },
    update: { units: { increment: 1 } },
  });
  check('upsert with B creates in A', counter.organizationId === A);
  // Narrowed to this run's rows, so even a broken filter can't touch real data
  const removed = await db.invitation.deleteMany({ where: { email: { endsWith: EMAIL_DOMAIN } } });
  check(
    'deleteMany only deletes own rows',
    removed.count === 3 &&
      (await prisma.invitation.findUnique({ where: { id: invB.id } })) !== null,
  );

  return { a, b, A, B };
}

async function verifyHttpGuards(ctx: Awaited<ReturnType<typeof verifyPrismaScoping>>) {
  const { a, b, A, B } = ctx;

  const app = express();
  app.use(passport.initialize());
  app.get(
    '/orgs/:orgId/read',
    auth,
    requireOrgMember,
    requirePermission('members:read'),
    (req, res) => {
      res.json({ role: req.org!.role });
    },
  );
  app.get(
    '/orgs/:orgId/manage',
    auth,
    requireOrgMember,
    requirePermission('members:manage'),
    (_req, res) => {
      res.json({ ok: true });
    },
  );
  app.get('/admin', auth, requireSuperAdmin, (_req, res) => {
    res.json({ ok: true });
  });
  app.use(globalErrorHandler);

  const server = app.listen(0); // any free port
  const { port } = server.address() as AddressInfo;
  const get = async (path: string, user: Express.User) => {
    const res = await fetch(`http://127.0.0.1:${port}${path}`, {
      headers: { authorization: `Bearer ${signAccessToken(user)}` },
    });
    const body = (await res.json()) as { errorCode?: string };
    return `${res.status} ${body.errorCode ?? JSON.stringify(body)}`;
  };

  try {
    console.info('\n— HTTP guards');
    check(
      'member → own org: 200',
      (await get(`/orgs/${A}/read`, a.user)) === '200 {"role":"OWNER"}',
    );
    check(
      'non-member → other org: 404 ORG_NOT_FOUND',
      (await get(`/orgs/${B}/read`, a.user)) === '404 ORG_NOT_FOUND',
    );
    check(
      'unknown org id: same 404',
      (await get(`/orgs/${crypto.randomUUID()}/read`, a.user)) === '404 ORG_NOT_FOUND',
    );

    await prisma.membership.create({
      data: { userId: b.user.id, organizationId: A, role: 'MEMBER' },
    });
    check(
      'MEMBER → members:read 200',
      (await get(`/orgs/${A}/read`, b.user)) === '200 {"role":"MEMBER"}',
    );
    check(
      'MEMBER → members:manage 403',
      (await get(`/orgs/${A}/manage`, b.user)) === '403 FORBIDDEN',
    );
    await prisma.membership.updateMany({
      where: { userId: b.user.id, organizationId: A },
      data: { role: 'ADMIN' },
    });
    check(
      'ADMIN → members:manage 200',
      (await get(`/orgs/${A}/manage`, b.user)) === '200 {"ok":true}',
    );

    check('USER → /admin 403', (await get('/admin', a.user)) === '403 FORBIDDEN');
    const superAdmin = await prisma.user.findFirst({ where: { platformRole: 'SUPER_ADMIN' } });
    if (superAdmin) {
      check('SUPER_ADMIN → /admin 200', (await get('/admin', superAdmin)) === '200 {"ok":true}');
      check(
        'SUPER_ADMIN → org they are not in: 404',
        (await get(`/orgs/${A}/read`, superAdmin)) === '404 ORG_NOT_FOUND',
      );
    } else {
      console.info('⚠️  No super admin found (run the seed) — skipped 2 checks');
    }
  } finally {
    server.close();
  }
}

function verifyPermissionMatrix() {
  console.info('\n— Permission matrix (SRS §8.3)');
  const expected: Record<string, string> = {
    'usage:read': 'OABM',
    'members:read': 'OABM',
    'members:manage': 'OA',
    'apikeys:manage': 'OA',
    'org:update': 'OA',
    'audit:read': 'OA',
    'billing:read': 'OAB',
    'billing:manage': 'OB',
  };
  const roles = { O: 'OWNER', A: 'ADMIN', B: 'BILLING', M: 'MEMBER' } as const;
  for (const permission of PERMISSIONS) {
    const actual = Object.entries(roles)
      .filter(([, role]) => ROLE_PERMISSIONS[role].includes(permission))
      .map(([letter]) => letter)
      .join('');
    check(`${permission.padEnd(15)} ${actual}`, actual === expected[permission]);
  }
  check(
    'only OWNER can grant OWNER',
    !canAssignRole('ADMIN', 'MEMBER', 'OWNER') && canAssignRole('OWNER', 'MEMBER', 'OWNER'),
  );
  check('only OWNER can demote an OWNER', !canAssignRole('ADMIN', 'OWNER', 'MEMBER'));
  check('ADMIN can change MEMBER → BILLING', canAssignRole('ADMIN', 'MEMBER', 'BILLING'));
}

// Everything this run created carries RUN in its email or organization name
async function cleanup() {
  await prisma.organization.deleteMany({ where: { name: { endsWith: ` ${RUN}` } } });
  await prisma.user.deleteMany({ where: { email: { endsWith: EMAIL_DOMAIN } } });
}

async function main() {
  console.info(`Tenancy verification (run ${RUN})`);
  try {
    const ctx = await verifyPrismaScoping();
    await verifyHttpGuards(ctx);
    verifyPermissionMatrix();
  } finally {
    await cleanup();
  }
  console.info(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
