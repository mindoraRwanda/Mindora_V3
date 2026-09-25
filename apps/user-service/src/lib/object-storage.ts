import { randomUUID } from 'node:crypto';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { config } from '../config.js';

// S3-compatible object storage for therapist application documents
// (credential PDFs/images). Deliberately not the express.static pattern
// already used for therapist profile photos (app.ts) — that writes to
// local container disk, which is fine for a low-stakes photo but wrong for
// PII-bearing credential documents on Railway, where disk is ephemeral and
// not shared across replicas/redeploys. Works against AWS S3 or any
// S3-compatible provider (e.g. Cloudflare R2, Backblaze B2) via `endpoint`.
const client = new S3Client({
  region: config.objectStorage.region,
  endpoint: config.objectStorage.endpoint,
  // Path-style addressing is required by most non-AWS S3-compatible
  // providers; virtual-hosted-style (the SDK default) only works reliably
  // against AWS itself.
  forcePathStyle: Boolean(config.objectStorage.endpoint),
  credentials: {
    accessKeyId: config.objectStorage.accessKeyId,
    secretAccessKey: config.objectStorage.secretAccessKey,
  },
});

const PRESIGNED_URL_TTL_SECONDS = 300;

export function buildDocumentStorageKey(
  applicationId: string,
  fileName: string
): string {
  // uuid prefix prevents same-filename collisions within one application
  // (e.g. two files both named "license.pdf") and avoids leaking the
  // original filename as a guessable object key.
  return `therapist-applications/${applicationId}/${randomUUID()}-${fileName}`;
}

export async function uploadDocument(
  storageKey: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  await client.send(
    new PutObjectCommand({
      Bucket: config.objectStorage.bucket,
      Key: storageKey,
      Body: body,
      ContentType: contentType,
      // No ACL, no public-read — every read goes through a short-TTL
      // presigned URL generated per request (getDocumentDownloadUrl below),
      // gated to the document owner or a SERVICE-role caller by the route
      // handler, never a stable public path.
    })
  );
}

export async function getDocumentDownloadUrl(
  storageKey: string
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: config.objectStorage.bucket,
    Key: storageKey,
  });
  return getSignedUrl(client, command, {
    expiresIn: PRESIGNED_URL_TTL_SECONDS,
  });
}
