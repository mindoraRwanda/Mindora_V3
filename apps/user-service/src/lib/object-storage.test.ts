import { beforeEach, describe, expect, it, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { PassThrough } from 'node:stream';
import type { Response } from 'express';

const mockOpenDownloadStreamByName = vi.fn();

vi.mock('./mongo.js', () => ({
  getDocumentsBucket: () => ({
    openDownloadStreamByName: (...args: unknown[]) =>
      mockOpenDownloadStreamByName(...args),
  }),
}));

import { config } from '../config.js';
import {
  buildDocumentStorageKey,
  getDocumentDownloadUrl,
  InvalidDownloadTokenError,
  streamDocumentForToken,
} from './object-storage.js';

describe('buildDocumentStorageKey', () => {
  it('namespaces the key under the application id and preserves the original filename', () => {
    const key = buildDocumentStorageKey('app-123', 'license.pdf');

    expect(key.startsWith('therapist-applications/app-123/')).toBe(true);
    expect(key.endsWith('-license.pdf')).toBe(true);
  });

  it('produces a different key each call for the same filename (no collisions within an application)', () => {
    const a = buildDocumentStorageKey('app-123', 'license.pdf');
    const b = buildDocumentStorageKey('app-123', 'license.pdf');

    expect(a).not.toBe(b);
  });
});

describe('getDocumentDownloadUrl', () => {
  it('returns a URL through the gateway to the self-hosted download route, carrying a signed token', async () => {
    const url = await getDocumentDownloadUrl(
      'therapist-applications/app-1/uuid-license.pdf',
      'license.pdf',
      'application/pdf'
    );

    expect(
      url.startsWith(`${config.publicKongUrl}/api/v1/users/therapist-documents/download?token=`)
    ).toBe(true);

    const token = new URL(url).searchParams.get('token')!;
    const payload = jwt.verify(token, config.jwtSecret) as Record<string, unknown>;
    expect(payload).toMatchObject({
      purpose: 'therapist-document-download',
      storageKey: 'therapist-applications/app-1/uuid-license.pdf',
      fileName: 'license.pdf',
      mimeType: 'application/pdf',
    });
  });
});

describe('streamDocumentForToken', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // streamDocumentForToken both sets headers (Express Response API) and
  // pipes a GridFS stream into it (Writable stream API) - a real
  // PassThrough satisfies the latter; setHeader is bolted on separately
  // since PassThrough doesn't have one.
  function fakeResponse() {
    const stream = new PassThrough() as unknown as Response & { headers: Record<string, string> };
    const headers: Record<string, string> = {};
    stream.headers = headers;
    stream.setHeader = vi.fn((key: string, value: string) => {
      headers[key] = value;
      return stream;
    }) as Response['setHeader'];
    return stream;
  }

  it('rejects a garbage token', async () => {
    const res = fakeResponse();
    await expect(streamDocumentForToken('not-a-real-token', res)).rejects.toThrow(
      InvalidDownloadTokenError
    );
  });

  it('rejects a validly-signed token with the wrong purpose', async () => {
    const wrongPurposeToken = jwt.sign(
      { purpose: 'something-else', storageKey: 'x', fileName: 'x', mimeType: 'x' },
      config.jwtSecret,
      { expiresIn: 300 }
    );
    const res = fakeResponse();
    await expect(streamDocumentForToken(wrongPurposeToken, res)).rejects.toThrow(
      InvalidDownloadTokenError
    );
  });

  it('rejects an expired token', async () => {
    const expiredToken = jwt.sign(
      {
        purpose: 'therapist-document-download',
        storageKey: 'x',
        fileName: 'x',
        mimeType: 'x',
      },
      config.jwtSecret,
      { expiresIn: -1 }
    );
    const res = fakeResponse();
    await expect(streamDocumentForToken(expiredToken, res)).rejects.toThrow(
      InvalidDownloadTokenError
    );
  });

  it('streams the GridFS file with the token-carried Content-Type and filename for a valid token', async () => {
    const validToken = jwt.sign(
      {
        purpose: 'therapist-document-download',
        storageKey: 'therapist-applications/app-1/uuid-license.pdf',
        fileName: 'license.pdf',
        mimeType: 'application/pdf',
      },
      config.jwtSecret,
      { expiresIn: 300 }
    );

    const fakeGridFsStream = new PassThrough();
    mockOpenDownloadStreamByName.mockReturnValueOnce(fakeGridFsStream);

    const res = fakeResponse();
    const promise = streamDocumentForToken(validToken, res);
    fakeGridFsStream.end('%PDF-1.4 fake content');
    await promise;

    expect(mockOpenDownloadStreamByName).toHaveBeenCalledWith(
      'therapist-applications/app-1/uuid-license.pdf'
    );
    expect(res.headers['Content-Type']).toBe('application/pdf');
    expect(res.headers['Content-Disposition']).toBe('inline; filename="license.pdf"');
  });
});
