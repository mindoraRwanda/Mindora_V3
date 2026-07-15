import crypto from 'crypto';

function encryptionKey(): Buffer {
  const raw =
    process.env.COMMUNITY_ENCRYPTION_KEY ??
    'mindora-dev-community-key-32bytes!!';
  return Buffer.from(raw, 'utf8').slice(0, 32);
}

export const encryptUserId = (userId: string): string => {
  const key = encryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  const encrypted = Buffer.concat([
    cipher.update(userId, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Store as iv:authTag:encryptedData — all needed to decrypt later
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
};

export const decryptUserId = (encryptedAuthorId: string): string => {
  const [ivHex, authTagHex, dataHex] = encryptedAuthorId.split(':');
  if (!ivHex || !authTagHex || !dataHex) {
    throw new Error('Malformed encrypted author id');
  }

  const key = encryptionKey();
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    key,
    Buffer.from(ivHex, 'hex')
  );
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, 'hex')),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
};
