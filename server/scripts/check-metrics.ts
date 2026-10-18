/**
 * SRS section 12.4 worked example, run through src/shared/metrics.ts:
 * start MRR $10,000 from 100 customers; in the month expansion $800, contraction $200,
 * 4 customers churn with $300, 6 new customers add $400.
 * Expected: net new $700, end MRR $10,700, churn 4%, NRR 103%, ARPA $104.90.
 *   npm run check:metrics
 */
import {
  arpaCents,
  customerChurnRate,
  mrrMovements,
  netRevenueRetention,
  totalMrr,
} from '../src/shared/metrics';

const start = new Map<string, number>();
const end = new Map<string, number>();

// 4 customers that churn, $75 each = $300
for (let i = 1; i <= 4; i++) start.set(`churn-${i}`, 7_500);
// 96 customers sharing the remaining $9,700
for (let i = 1; i <= 96; i++) start.set(`stay-${i}`, i === 96 ? 970_000 - 95 * 10_104 : 10_104);

for (const [id, cents] of start) if (!id.startsWith('churn-')) end.set(id, cents);
// Expansion: 8 customers +$100 each = $800
for (let i = 1; i <= 8; i++) end.set(`stay-${i}`, end.get(`stay-${i}`)! + 10_000);
// Contraction: 2 customers −$100 each = $200
for (let i = 9; i <= 10; i++) end.set(`stay-${i}`, end.get(`stay-${i}`)! - 10_000);
// 6 new customers adding $400
for (let i = 1; i <= 6; i++) end.set(`new-${i}`, i === 6 ? 40_000 - 5 * 6_667 : 6_667);

const m = mrrMovements(start, end, () => false);
const startMrr = totalMrr(start);
const endMrr = totalMrr(end);
const churn = customerChurnRate(start, end)!;
const nrr = netRevenueRetention(startMrr, m)!;
const arpa = arpaCents(end)!;

const dollars = (cents: number) => `$${(cents / 100).toFixed(2)}`;
const checks: [string, string, string][] = [
  ['Start MRR', dollars(startMrr), '$10000.00'],
  ['New', dollars(m.newCents), '$400.00'],
  ['Expansion', dollars(m.expansionCents), '$800.00'],
  ['Contraction', dollars(m.contractionCents), '$200.00'],
  ['Churned', dollars(m.churnedCents), '$300.00'],
  ['Net new MRR', dollars(m.netNewCents), '$700.00'],
  ['End MRR', dollars(endMrr), '$10700.00'],
  ['Customer churn', `${(churn * 100).toFixed(2)}%`, '4.00%'],
  ['NRR', `${(nrr * 100).toFixed(2)}%`, '103.00%'],
  ['ARPA', dollars(Math.round(arpa)), '$104.90'],
];

let failed = 0;
for (const [name, got, expected] of checks) {
  const ok = got === expected;
  if (!ok) failed++;
  console.info(
    `${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(15)} ${got}${ok ? '' : `  (expected ${expected})`}`,
  );
}
console.info(failed ? `\n${failed} failed` : '\nAll metrics match section 12.4');
process.exit(failed ? 1 : 0);
