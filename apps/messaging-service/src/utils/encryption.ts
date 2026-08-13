import crypto from 'crypto';

const DEV_KEY = 'mindora-dev-message-key-32bytes!!';

function resolveKey(): Buffer {
  const configured = process.env.MESSAGE_ENCRYPTION_KEY;

  // A missing key in production would silently encrypt every therapy message
  // with a value published in this repo, which is indistinguishable from not
  // encrypting at all. Fail to boot instead.
  if (process.env.NODE_ENV === 'production') {
    if (!configured) {
      throw new Error(
        'MESSAGE_ENCRYPTION_KEY must be set in production (32 bytes).'
      );
    }
    if (configured === DEV_KEY) {
      throw new Error(
        'MESSAGE_ENCRYPTION_KEY is still the development default. Generate a ' +
          'unique 32-byte key before deploying.'
      );
    }
  }

  const key = Buffer.from(configured ?? DEV_KEY, 'utf8');
  if (key.length < 32) {
    throw new Error(
      `MESSAGE_ENCRYPTION_KEY must be at least 32 bytes (got ${key.length}).`
    );
  }
  return key.subarray(0, 32);
}

// Resolved lazily so importing this module (e.g. in tests) doesn't throw
// before the environment is configured, but cached so the checks run once.
let cachedKey: Buffer | null = null;
function encryptionKey(): Buffer {
  if (!cachedKey) cachedKey = resolveKey();
  return cachedKey;
}

/** `iv:authTag:ciphertext`, all hex. */
export function encryptContent(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Returns the input unchanged when it isn't in the encrypted format.
 *
 * This passthrough is deliberate and load-bearing: messages written before
 * encryption was wired up are stored as plaintext, and this is what lets them
 * keep rendering while the backfill runs
 * (`npm run backfill:encrypt -w @mindora/messaging-service`).
 *
 * It does mean a genuine decryption failure is indistinguishable from
 * plaintext at the call site — so failures are logged rather than swallowed
 * silently, which is how the "encryption was never actually wired up" bug went
 * unnoticed for so long.
 */
export function decryptContent(ciphertext: string): string {
  const parts = ciphertext.split(':');
  if (parts.length !== 3) return ciphertext;
  try {
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      encryptionKey(),
      iv
    );
    decipher.setAuthTag(authTag);
    return decipher.update(encrypted).toString('utf8') + decipher.final('utf8');
  } catch (err) {
    // Almost always a changed/rotated key or a corrupted row — both need
    // human attention, so don't let it vanish.
    console.error(
      '[encryption] Failed to decrypt message content; returning as-is:',
      err instanceof Error ? err.message : err
    );
    return ciphertext;
  }
}

/** True when `value` is already in the encrypted wire format. */
export function isEncrypted(value: string): boolean {
  const parts = value.split(':');
  return (
    parts.length === 3 &&
    parts.every((p) => p.length > 0 && /^[0-9a-f]+$/i.test(p))
  );
}
