import crypto from 'crypto'

// IMPORTANT: This key is a placeholder for local development only.
// In production, this MUST be replaced with the key from AWS Secrets Manager.
const ENCRYPTION_KEY = Buffer.from(
  'placeholder-key-32-bytes-exactly!!',
  'utf8'
).slice(0, 32)

export const encryptUserId = (userId: string): string => {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv)

  const encrypted = Buffer.concat([
    cipher.update(userId, 'utf8'),
    cipher.final()
  ])

  const authTag = cipher.getAuthTag()

  // Store as iv:authTag:encryptedData — all needed to decrypt later
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
}