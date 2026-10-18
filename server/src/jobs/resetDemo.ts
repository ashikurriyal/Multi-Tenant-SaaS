import config from '../config';
import { resetDemo as reset } from '../modules/demo/demo.service';
import type { JobResult } from './registry';

// SRS 21.2: the demo organizations are recreated every night (only when DEMO_ENABLED)
export async function resetDemo(): Promise<JobResult> {
  if (!config.demoEnabled) return { skipped: 'DEMO_ENABLED is not true' };
  const result = await reset();
  console.info('[reset-demo]', JSON.stringify(result));
  return result;
}
