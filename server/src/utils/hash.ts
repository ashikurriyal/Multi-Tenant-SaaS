import crypto from 'node:crypto';

// For invitation tokens and API keys: we store only the hash, never the raw value
export const sha256 = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

export const randomToken = (bytes = 32) => crypto.randomBytes(bytes).toString('base64url');
