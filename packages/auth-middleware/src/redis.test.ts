import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockExists = vi.fn();
const mockSet = vi.fn();
const mockDel = vi.fn();
const mockConnect = vi.fn().mockResolvedValue(undefined);

vi.mock('ioredis', () => {
  const Redis = vi.fn(function () {
    return {
      status: 'ready' as const,
      connect: mockConnect,
      exists: (...args: unknown[]) => mockExists(...args),
      set: (...args: unknown[]) => mockSet(...args),
      del: (...args: unknown[]) => mockDel(...args),
      get: vi.fn().mockResolvedValue(null),
      on: vi.fn(),
    };
  });
  return { default: Redis, Redis };
});

import { isUserSuspended, setUserSuspended, suspendedKey } from './redis.js';

const REDIS_URL = 'redis://localhost:6379';

describe('suspendedKey', () => {
  it('namespaces by userId', () => {
    expect(suspendedKey('user-123')).toBe('auth:suspended:user-123');
  });
});

describe('isUserSuspended', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns true when the suspended key exists', async () => {
    mockExists.mockResolvedValue(1);
    const result = await isUserSuspended(REDIS_URL, 'user-123');
    expect(result).toBe(true);
    expect(mockExists).toHaveBeenCalledWith('auth:suspended:user-123');
  });

  it('returns false when the suspended key does not exist', async () => {
    mockExists.mockResolvedValue(0);
    const result = await isUserSuspended(REDIS_URL, 'user-123');
    expect(result).toBe(false);
  });
});

describe('setUserSuspended', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sets the suspended key with no TTL when suspending', async () => {
    mockSet.mockResolvedValue('OK');
    await setUserSuspended(REDIS_URL, 'user-123', true);

    expect(mockSet).toHaveBeenCalledWith('auth:suspended:user-123', '1');
    expect(mockDel).not.toHaveBeenCalled();
  });

  it('deletes the suspended key when reactivating', async () => {
    mockDel.mockResolvedValue(1);
    await setUserSuspended(REDIS_URL, 'user-123', false);

    expect(mockDel).toHaveBeenCalledWith('auth:suspended:user-123');
    expect(mockSet).not.toHaveBeenCalled();
  });
});
