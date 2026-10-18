import type { OrgRole } from '../../../generated/prisma/client';

/**
 * SRS 21.2: the one-click demo accounts. Organizations use the reserved `demo-` slug
 * prefix (no real organization can get one) and users use `.example` addresses (reserved
 * by RFC 2606, so no email can ever reach them).
 */

export type DemoOrgKey = 'acme' | 'globex' | 'initech';
export type DemoScenario = 'pro_active' | 'pro_past_due' | 'free_near_limit';

export const DEMO_ORGS: Record<
  DemoOrgKey,
  { name: string; slug: string; scenario: DemoScenario; usagePercent: number }
> = {
  acme: { name: 'Acme Corp', slug: 'demo-acme', scenario: 'pro_active', usagePercent: 81 },
  globex: { name: 'Globex', slug: 'demo-globex', scenario: 'pro_past_due', usagePercent: 34 },
  initech: { name: 'Initech', slug: 'demo-initech', scenario: 'free_near_limit', usagePercent: 95 },
};

export const DEMO_TENANT_SLUGS = Object.values(DEMO_ORGS).map((o) => o.slug);

export type DemoAccountKey = 'acme-owner' | 'acme-billing' | 'globex-owner' | 'initech-owner';

export const DEMO_ACCOUNTS: Record<
  DemoAccountKey,
  {
    org: DemoOrgKey;
    role: OrgRole;
    name: string;
    email: string;
    label: string;
    description: string;
  }
> = {
  'acme-owner': {
    org: 'acme',
    role: 'OWNER',
    name: 'Sarah Khan',
    email: 'sarah.khan@acme.example',
    label: 'Owner · Acme (Pro)',
    description: 'Billing, plan change with proration preview, usage near 80%',
  },
  'acme-billing': {
    org: 'acme',
    role: 'BILLING',
    name: 'Omar Haddad',
    email: 'omar.haddad@acme.example',
    label: 'Billing user · Acme',
    description: "Manages billing; can't manage members or API keys",
  },
  'globex-owner': {
    org: 'globex',
    role: 'OWNER',
    name: 'Lena Fischer',
    email: 'lena.fischer@globex.example',
    label: 'Owner · Globex (past due)',
    description: 'Failed payment banner with grace period countdown',
  },
  'initech-owner': {
    org: 'initech',
    role: 'OWNER',
    name: 'Priya Singh',
    email: 'priya.singh@initech.example',
    label: 'Owner · Initech (Free)',
    description: 'Usage at 95% of the Free limit; upgrade prompts',
  },
};

// Extra members that make the member lists look lived-in (they never sign in)
export const DEMO_EXTRA_MEMBERS: { org: DemoOrgKey; role: OrgRole; name: string; email: string }[] =
  [
    { org: 'acme', role: 'ADMIN', name: 'Mateo Rossi', email: 'mateo.rossi@acme.example' },
    { org: 'acme', role: 'MEMBER', name: 'Grace Okafor', email: 'grace.okafor@acme.example' },
    { org: 'acme', role: 'MEMBER', name: 'Hugo Tanaka', email: 'hugo.tanaka@acme.example' },
    { org: 'globex', role: 'MEMBER', name: 'Ines Weber', email: 'ines.weber@globex.example' },
  ];

const DEMO_EMAILS = new Set([
  ...Object.values(DEMO_ACCOUNTS).map((a) => a.email),
  ...DEMO_EXTRA_MEMBERS.map((m) => m.email),
]);

export const isDemoEmail = (email: string) => DEMO_EMAILS.has(email.toLowerCase());
export const allDemoEmails = () => [...DEMO_EMAILS];

export const DEMO_RESTRICTED_MESSAGE =
  'This is turned off in the demo, so the next visitor finds it the same. Create your own free account to try it.';
