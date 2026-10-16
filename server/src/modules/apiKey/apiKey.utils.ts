import config from '../../config';
import { randomToken, sha256 } from '../../utils/hash';

// FR-KEY-01: lf_live_ + 32 random bytes (base64url). Development keys say lf_test_, so a key
// from the wrong environment is recognizable at a glance (like Stripe's sk_live_/sk_test_)
export const keyPrefixFor = () => (config.isProd ? 'lf_live_' : 'lf_test_');

// lf_live_ / lf_test_ followed by 43 base64url characters (32 bytes)
export const API_KEY_PATTERN = /^lf_(live|test)_[A-Za-z0-9_-]{43}$/;

export const MAX_ACTIVE_KEYS = 10; // FR-KEY-03

export function generateApiKey() {
  const key = `${keyPrefixFor()}${randomToken(32)}`;
  // FR-KEY-02: only the hash and the first 12 characters are stored
  return { key, keyHash: sha256(key), prefix: key.slice(0, 12) };
}
