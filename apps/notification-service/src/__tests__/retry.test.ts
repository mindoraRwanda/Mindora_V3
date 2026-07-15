import { describe, it, expect, beforeEach, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const mockSendToQueue = vi.fn();
  const mockAssertQueue = vi.fn().mockResolvedValue({});
  const mockClose = vi.fn().mockResolvedValue(undefined);
  const mockConsume = vi
    .fn()
    .mockResolvedValue({ consumerTag: 'test-consumer' });
  const mockAck = vi.fn();
  const mockNack = vi.fn();
  const mockChannel = {
    assertQueue: mockAssertQueue,
    sendToQueue: mockSendToQueue,
    close: mockClose,
    consume: mockConsume,
    ack: mockAck,
    nack: mockNack,
  };
  const mockCreateChannel = vi.fn().mockResolvedValue(mockChannel);
  const mockConnection = { createChannel: mockCreateChannel };
  const mockConnect = vi.fn().mockResolvedValue(mockConnection);
  const mockSubscribeToExchange = vi.fn().mockResolvedValue(undefined);
  return {
    mockSendToQueue,
    mockAssertQueue,
    mockClose,
    mockConsume,
    mockAck,
    mockNack,
    mockChannel,
    mockCreateChannel,
    mockConnection,
    mockConnect,
    mockSubscribeToExchange,
  };
});

vi.mock('@mindora/queue', () => ({
  connect: mocks.mockConnect,
  subscribeToExchange: mocks.mockSubscribeToExchange,
}));

describe('subscribeWithRetry', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.mockConnect.mockResolvedValue(mocks.mockConnection);
    mocks.mockCreateChannel.mockResolvedValue(mocks.mockChannel);
    mocks.mockAssertQueue.mockResolvedValue({});
    mocks.mockSendToQueue.mockReturnValue(true);
    mocks.mockClose.mockResolvedValue(undefined);
    mocks.mockSubscribeToExchange.mockResolvedValue(undefined);
    delete process.env.RETRY_TEST_MODE;
  });

  it('calls subscribeToExchange with the given exchange and queue', async () => {
    const { subscribeWithRetry } = await import('../retry.js');
    const handler = vi.fn().mockResolvedValue(undefined);
    await subscribeWithRetry('mindora.test', 'test.queue', handler);
    expect(mocks.mockSubscribeToExchange).toHaveBeenCalledWith(
      'mindora.test',
      'test.queue',
      expect.any(Function),
      'fanout'
    );
  });

  it('passes through a topic exchange type when specified', async () => {
    const { subscribeWithRetry } = await import('../retry.js');
    const handler = vi.fn().mockResolvedValue(undefined);
    await subscribeWithRetry('mindora.test', 'test.queue', handler, 'topic');
    expect(mocks.mockSubscribeToExchange).toHaveBeenCalledWith(
      'mindora.test',
      'test.queue',
      expect.any(Function),
      'topic'
    );
  });

  it('invokes the handler on delivery without queuing a retry on success', async () => {
    const { subscribeWithRetry } = await import('../retry.js');
    const handler = vi.fn().mockResolvedValue(undefined);
    await subscribeWithRetry('mindora.test', 'test.queue', handler);

    const wrappedHandler = mocks.mockSubscribeToExchange.mock.calls[0][2] as (
      p: unknown
    ) => Promise<void>;
    await wrappedHandler({ eventId: 'e1', data: 'ok' });

    expect(handler).toHaveBeenCalledWith({ eventId: 'e1', data: 'ok' });
    expect(mocks.mockSendToQueue).not.toHaveBeenCalled();
  });

  it('publishes to a retry queue on transient error with attempt incremented to 1', async () => {
    const { subscribeWithRetry } = await import('../retry.js');
    const handler = vi.fn().mockRejectedValue(new Error('transient failure'));
    await subscribeWithRetry('mindora.appointments', 'notif.queue', handler);

    const wrappedHandler = mocks.mockSubscribeToExchange.mock.calls[0][2] as (
      p: unknown
    ) => Promise<void>;
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    await wrappedHandler({ test: 'payload' });

    expect(mocks.mockSendToQueue).toHaveBeenCalledOnce();
    const [queueName, msgBuffer] = mocks.mockSendToQueue.mock.calls[0];
    expect(String(queueName)).toMatch(/retry/);
    const envelope = JSON.parse((msgBuffer as Buffer).toString());
    expect(envelope.attempt).toBe(1);
    expect(envelope.exchange).toBe('mindora.appointments');
    expect(envelope.payload).toEqual({ test: 'payload' });
  });

  it('routes FatalNotificationError directly to DLQ without touching a retry queue', async () => {
    const { subscribeWithRetry } = await import('../retry.js');
    const { FatalNotificationError } = await import('../fcm.js');

    const fatalErr = new FatalNotificationError(
      'Invalid token',
      'messaging/invalid-registration-token',
      'user-1'
    );
    const handler = vi.fn().mockRejectedValue(fatalErr);
    await subscribeWithRetry('mindora.messages', 'notif.queue', handler);

    const wrappedHandler = mocks.mockSubscribeToExchange.mock.calls[0][2] as (
      p: unknown
    ) => Promise<void>;
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await wrappedHandler({ msg: 'data' });

    const dlqCall = mocks.mockSendToQueue.mock.calls.find(
      ([q]) => q === 'mindora.notifications.dlq'
    );
    const retryCall = mocks.mockSendToQueue.mock.calls.find(([q]) =>
      String(q).includes('retry')
    );
    expect(dlqCall).toBeDefined();
    expect(retryCall).toBeUndefined();
  });

  it('DLQ envelope includes failedAt and error fields', async () => {
    const { subscribeWithRetry } = await import('../retry.js');
    const { FatalNotificationError } = await import('../fcm.js');

    const fatalErr = new FatalNotificationError(
      'Bad token',
      'messaging/invalid-registration-token',
      'u1'
    );
    const handler = vi.fn().mockRejectedValue(fatalErr);
    await subscribeWithRetry('mindora.messages', 'q', handler);
    const wrapped = mocks.mockSubscribeToExchange.mock.calls[0][2] as (
      p: unknown
    ) => Promise<void>;
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await wrapped({ x: 1 });

    const [, buf] = mocks.mockSendToQueue.mock.calls.find(
      ([q]) => q === 'mindora.notifications.dlq'
    )!;
    const dlqPayload = JSON.parse((buf as Buffer).toString());
    expect(dlqPayload.failedAt).toBeDefined();
    expect(dlqPayload.error).toBeDefined();
  });
});

describe('setupRetryInfrastructure', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocks.mockConnect.mockResolvedValue(mocks.mockConnection);
    mocks.mockCreateChannel.mockResolvedValue(mocks.mockChannel);
    mocks.mockAssertQueue.mockResolvedValue({});
    mocks.mockSendToQueue.mockReturnValue(true);
    mocks.mockClose.mockResolvedValue(undefined);
    mocks.mockConsume.mockResolvedValue({ consumerTag: 'rc' });
    delete process.env.RETRY_TEST_MODE;
  });

  it('asserts DLQ, reprocess queue, and 4 retry queues', async () => {
    const { setupRetryInfrastructure } = await import('../retry.js');
    await setupRetryInfrastructure();

    const asserted = mocks.mockAssertQueue.mock.calls.map(
      ([name]) => name as string
    );
    expect(asserted).toContain('mindora.notifications.dlq');
    expect(asserted).toContain('mindora.notifications.reprocess');
    expect(asserted.filter((q) => q.includes('retry'))).toHaveLength(4);
  });

  it('sets up a consumer on the reprocess queue', async () => {
    const { setupRetryInfrastructure } = await import('../retry.js');
    await setupRetryInfrastructure();

    const reprocessConsumer = mocks.mockConsume.mock.calls.find(
      ([q]) => q === 'mindora.notifications.reprocess'
    );
    expect(reprocessConsumer).toBeDefined();
  });

  it('nacks malformed (non-JSON) messages on the reprocess queue', async () => {
    const { setupRetryInfrastructure } = await import('../retry.js');

    let consumeCallback: ((msg: unknown) => Promise<void>) | undefined;
    mocks.mockConsume.mockImplementation(
      (_q: string, cb: (msg: unknown) => Promise<void>) => {
        consumeCallback = cb;
        return Promise.resolve({ consumerTag: 'rc' });
      }
    );

    await setupRetryInfrastructure();

    const badMsg = { content: Buffer.from('not valid json {{{') };
    await consumeCallback!(badMsg);
    expect(mocks.mockNack).toHaveBeenCalledWith(badMsg, false, false);
  });

  it('routes envelope with attempt >= MAX_RETRIES to DLQ via reprocess consumer', async () => {
    const { subscribeWithRetry, setupRetryInfrastructure } =
      await import('../retry.js');

    const failingHandler = vi
      .fn()
      .mockRejectedValue(new Error('persistent error'));
    // Register handler so reprocess consumer can look it up by exchange
    mocks.mockSubscribeToExchange.mockResolvedValue(undefined);
    await subscribeWithRetry(
      'mindora.appointments',
      'notif.queue',
      failingHandler
    );
    vi.clearAllMocks();

    let consumeCallback: ((msg: unknown) => Promise<void>) | undefined;
    mocks.mockConsume.mockImplementation(
      (_q: string, cb: (msg: unknown) => Promise<void>) => {
        consumeCallback = cb;
        return Promise.resolve({ consumerTag: 'rc' });
      }
    );
    mocks.mockConnect.mockResolvedValue(mocks.mockConnection);
    mocks.mockCreateChannel.mockResolvedValue(mocks.mockChannel);
    mocks.mockAssertQueue.mockResolvedValue({});

    await setupRetryInfrastructure();

    const envelope = {
      exchange: 'mindora.appointments',
      payload: { data: 'test' },
      attempt: 4,
    };
    const msg = { content: Buffer.from(JSON.stringify(envelope)) };
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await consumeCallback!(msg);

    expect(failingHandler).toHaveBeenCalledWith({ data: 'test' });
    const dlqCall = mocks.mockSendToQueue.mock.calls.find(
      ([q]) => q === 'mindora.notifications.dlq'
    );
    expect(dlqCall).toBeDefined();
    const retryCall = mocks.mockSendToQueue.mock.calls.find(([q]) =>
      String(q).includes('retry')
    );
    expect(retryCall).toBeUndefined();
  });

  it('acks the reprocess message before scheduling the next retry', async () => {
    const { subscribeWithRetry, setupRetryInfrastructure } =
      await import('../retry.js');

    const failingHandler = vi
      .fn()
      .mockRejectedValue(new Error('still failing'));
    mocks.mockSubscribeToExchange.mockResolvedValue(undefined);
    await subscribeWithRetry(
      'mindora.appointments',
      'notif.queue',
      failingHandler
    );
    vi.clearAllMocks();

    let consumeCallback: ((msg: unknown) => Promise<void>) | undefined;
    mocks.mockConsume.mockImplementation(
      (_q: string, cb: (msg: unknown) => Promise<void>) => {
        consumeCallback = cb;
        return Promise.resolve({ consumerTag: 'rc' });
      }
    );
    mocks.mockConnect.mockResolvedValue(mocks.mockConnection);
    mocks.mockCreateChannel.mockResolvedValue(mocks.mockChannel);
    mocks.mockAssertQueue.mockResolvedValue({});

    await setupRetryInfrastructure();

    const envelope = {
      exchange: 'mindora.appointments',
      payload: { x: 1 },
      attempt: 1,
    };
    const msg = { content: Buffer.from(JSON.stringify(envelope)) };
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    await consumeCallback!(msg);

    // Message must be acked (removed from reprocess queue) before retry is queued
    expect(mocks.mockAck).toHaveBeenCalledWith(msg);
    // And a retry queue entry should follow
    const retryCall = mocks.mockSendToQueue.mock.calls.find(([q]) =>
      String(q).includes('retry')
    );
    expect(retryCall).toBeDefined();
  });

  it('uses test-mode queue name prefix and short delays when RETRY_TEST_MODE=true', async () => {
    process.env.RETRY_TEST_MODE = 'true';
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { setupRetryInfrastructure } = await import('../retry.js');
    await setupRetryInfrastructure();

    const retryQueues = mocks.mockAssertQueue.mock.calls
      .map(([name]) => name as string)
      .filter((q) => q.includes('retry'));

    expect(retryQueues).toHaveLength(4);
    retryQueues.forEach((q) => expect(q).toContain('.test.'));
  });

  it('uses production queue name prefix when RETRY_TEST_MODE is not set', async () => {
    const { setupRetryInfrastructure } = await import('../retry.js');
    await setupRetryInfrastructure();

    const retryQueues = mocks.mockAssertQueue.mock.calls
      .map(([name]) => name as string)
      .filter((q) => q.includes('retry'));

    expect(retryQueues).toHaveLength(4);
    retryQueues.forEach((q) => expect(q).not.toContain('.test.'));
  });
});
