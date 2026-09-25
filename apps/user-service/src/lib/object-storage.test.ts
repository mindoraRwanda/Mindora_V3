import { describe, expect, it } from 'vitest';
import { buildDocumentStorageKey } from './object-storage.js';

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
