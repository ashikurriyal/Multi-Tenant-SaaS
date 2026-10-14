import crypto from 'node:crypto';

const toSlug = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50) || 'org';

const randomSuffix = () => crypto.randomBytes(3).toString('base64url').toLowerCase().slice(0, 4);

// "Acme Inc" → "acme-inc", or "acme-inc-x7k2" when taken
export const generateUniqueSlug = async (
  name: string,
  isTaken: (slug: string) => Promise<boolean>,
) => {
  const base = toSlug(name);
  if (!(await isTaken(base))) return base;

  for (let i = 0; i < 5; i++) {
    const candidate = `${base}-${randomSuffix()}`;
    if (!(await isTaken(candidate))) return candidate;
  }
  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
};

// Free plan periods are calendar months in UTC (SRS section 12.3)
export const currentFreePeriod = (now = new Date()) => {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start, end };
};
