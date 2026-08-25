import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';

const DEV_FALLBACK_KEY = 'mindora-dev-ai-interaction-key-32bytes!!';

function encryptionKey(): Buffer {
  const configured = process.env.AI_INTERACTION_ENCRYPTION_KEY;

  // This key protects therapy chat content and the stored chatbot account
  // password. Falling back to a value published in this repo would silently
  // make that encryption decorative, so production must set a real one.
  if (process.env.NODE_ENV === 'production' && !configured) {
    throw new Error(
      'AI_INTERACTION_ENCRYPTION_KEY must be set in production. Refusing to ' +
        'encrypt chat content with the public development key.'
    );
  }

  return createHash('sha256')
    .update(configured ?? DEV_FALLBACK_KEY)
    .digest();
}

export function encrypt(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decrypt(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(':');
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error('Invalid encrypted payload format');
  }
  const decipher = createDecipheriv(
    ALGORITHM,
    encryptionKey(),
    Buffer.from(ivB64, 'base64')
  );
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}
