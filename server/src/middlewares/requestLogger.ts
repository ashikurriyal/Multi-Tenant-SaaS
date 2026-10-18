import type { IncomingMessage } from 'node:http';
import morgan from 'morgan';
import config from '../config';

/**
 * Request logs without secrets (NFR-SEC-08). Invitation tokens travel in the URL path
 * (/invitations/<token>, and the browser's Referer from /invite/<token>), and some links
 * carry ?token=, so both the URL and the referrer are redacted before they are written.
 */
export const redactUrl = (url: string | undefined) =>
  (url ?? '')
    .replace(/(\/invit(?:e|ations)\/)[A-Za-z0-9_-]{20,}/g, '$1[token]')
    .replace(/([?&](?:token|key|code)=)[^&#]*/gi, '$1[redacted]');

morgan.token('safe-url', (req: IncomingMessage & { originalUrl?: string }) =>
  redactUrl(req.originalUrl ?? req.url),
);
morgan.token('safe-referrer', (req: IncomingMessage) => {
  const referrer = req.headers.referer ?? req.headers.referrer;
  return redactUrl(Array.isArray(referrer) ? referrer[0] : referrer) || '-';
});

// Same fields as morgan's "combined" and "dev" formats, with the redacted URL and referrer
const PROD_FORMAT =
  ':remote-addr - :remote-user [:date[clf]] ":method :safe-url HTTP/:http-version" :status :res[content-length] ":safe-referrer" ":user-agent"';
const DEV_FORMAT = ':method :safe-url :status :response-time ms - :res[content-length]';

export const requestLogger = morgan(config.isProd ? PROD_FORMAT : DEV_FORMAT);
