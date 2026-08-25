import amqp, {
  type Channel,
  type ChannelModel,
  type ConsumeMessage,
} from 'amqplib';

const DEFAULT_URL = 'amqp://mindora:mindora@localhost:5672';

// Delay before retrying a dropped subscription. Fixed rather than
// exponential-backoff: RabbitMQ outages here are broker restarts or network
// blips lasting seconds, not the kind of sustained overload backoff exists
// to protect against.
const RECONNECT_DELAY_MS = 5000;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type MessageHandler = (
  content: unknown,
  raw: ConsumeMessage
) => Promise<void> | void;

type QueueConnection = Awaited<ReturnType<typeof amqp.connect>>;

let sharedConnection: QueueConnection | null = null;

export async function connect(
  url = process.env.RABBITMQ_URL ?? DEFAULT_URL
): Promise<ChannelModel> {
  if (sharedConnection) {
    return sharedConnection;
  }
  // Use a local variable so TypeScript knows the return value is never null,
  // even though the 'close' listener later resets sharedConnection to null.
  const connection = await amqp.connect(url);
  // Node's EventEmitter throws if 'error' is emitted with no listener
  // attached — without this, any post-boot AMQP error (broker restart,
  // heartbeat timeout, TCP reset) would crash the entire process, not just
  // queue handling. 'close' always follows 'error' for a fatal connection
  // error, so the existing close-driven reset below still runs.
  connection.on('error', (error) => {
    console.error('RabbitMQ connection error:', error);
  });
  connection.on('close', () => {
    sharedConnection = null;
  });
  sharedConnection = connection;
  return connection;
}

// Set by disconnect() so a deliberate shutdown doesn't spawn resubscribe
// attempts racing the process exit.
let isShuttingDown = false;

export async function publish(
  queue: string,
  payload: unknown,
  url?: string
): Promise<void> {
  const connection = await connect(url);
  const channel = await connection.createChannel();
  // See the note on connect() above — an unhandled 'error' event crashes the
  // process. This channel is short-lived, but it can still error between
  // creation and the close() below.
  channel.on('error', (error) => {
    console.error(`Channel error while publishing to ${queue}:`, error);
  });
  await channel.assertQueue(queue, { durable: true });
  channel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), {
    persistent: true,
    contentType: 'application/json',
  });
  await channel.close();
}

/**
 * Publish a JSON payload to a topic exchange (used by appointment domain events).
 */
export async function publishToExchange(
  exchange: string,
  routingKey: string,
  payload: unknown,
  url?: string
): Promise<void> {
  const connection = await connect(url);
  const channel = await connection.createChannel();
  channel.on('error', (error) => {
    console.error(`Channel error while publishing to ${exchange}:`, error);
  });
  await channel.assertExchange(exchange, 'topic', { durable: true });
  channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(payload)), {
    persistent: true,
    contentType: 'application/json',
  });
  await channel.close();
}

export async function subscribe(
  queue: string,
  handler: MessageHandler,
  url?: string
): Promise<Channel> {
  try {
    return await setUpSubscription(queue, handler, url);
  } catch (error) {
    console.error(
      `Failed to subscribe to ${queue}, retrying in ${RECONNECT_DELAY_MS}ms:`,
      error
    );
    await delay(RECONNECT_DELAY_MS);
    return subscribe(queue, handler, url);
  }
}

async function setUpSubscription(
  queue: string,
  handler: MessageHandler,
  url?: string
): Promise<Channel> {
  const connection = await connect(url);
  const channel = await connection.createChannel();
  channel.on('error', (error) => {
    console.error(`Channel error on queue ${queue}:`, error);
  });
  // A channel closes on its own connection error/reset, independent of
  // whether the connection itself has already scheduled a reconnect for
  // other consumers. Without this, a dropped connection silently ends this
  // consumer forever — the process stays up, but nothing on this queue is
  // processed again until a manual restart.
  channel.on('close', () => {
    if (isShuttingDown) return;
    console.warn(
      `Channel closed for queue ${queue}, resubscribing in ${RECONNECT_DELAY_MS}ms`
    );
    setTimeout(() => {
      subscribe(queue, handler, url).catch((error) => {
        console.error(`Giving up resubscribing to ${queue}:`, error);
      });
    }, RECONNECT_DELAY_MS);
  });
  await channel.assertQueue(queue, { durable: true });
  await channel.consume(queue, async (message: ConsumeMessage | null) => {
    if (!message) return;
    try {
      const content = JSON.parse(message.content.toString()) as unknown;
      await handler(content, message);
      channel.ack(message);
    } catch (error) {
      channel.nack(message, false, false);
      console.error(`Failed to process message on ${queue}:`, error);
    }
  });
  return channel;
}

export async function subscribeToExchange(
  exchange: string,
  queue: string,
  handler: MessageHandler,
  type: 'fanout' | 'topic' = 'fanout',
  url?: string
): Promise<void> {
  try {
    await setUpExchangeSubscription(exchange, queue, handler, type, url);
  } catch (error) {
    console.error(
      `Failed to subscribe to exchange ${exchange} (queue ${queue}), retrying in ${RECONNECT_DELAY_MS}ms:`,
      error
    );
    await delay(RECONNECT_DELAY_MS);
    await subscribeToExchange(exchange, queue, handler, type, url);
  }
}

async function setUpExchangeSubscription(
  exchange: string,
  queue: string,
  handler: MessageHandler,
  type: 'fanout' | 'topic',
  url?: string
): Promise<void> {
  const connection = await connect(url);
  const channel = await connection.createChannel();
  channel.on('error', (error) => {
    console.error(
      `Channel error on exchange ${exchange} (queue ${queue}):`,
      error
    );
  });
  channel.on('close', () => {
    if (isShuttingDown) return;
    console.warn(
      `Channel closed for exchange ${exchange} (queue ${queue}), resubscribing in ${RECONNECT_DELAY_MS}ms`
    );
    setTimeout(() => {
      subscribeToExchange(exchange, queue, handler, type, url).catch(
        (error) => {
          console.error(
            `Giving up resubscribing to exchange ${exchange} (queue ${queue}):`,
            error
          );
        }
      );
    }, RECONNECT_DELAY_MS);
  });
  await channel.assertExchange(exchange, type, { durable: true });
  await channel.assertQueue(queue, { durable: true });
  // Fanout ignores routing keys entirely, so an empty binding key receives
  // everything. For topic exchanges (used by publishToExchange callers),
  // '#' is the wildcard that matches every routing key — this package has
  // no per-routing-key filtering on the consume side, only exchange-wide
  // fan-in, so callers that need a topic exchange must declare it here too:
  // asserting the same exchange name with two different types (e.g. a
  // publisher using 'topic' while this asserts 'fanout') makes RabbitMQ
  // throw PRECONDITION_FAILED on whichever side connects second.
  await channel.bindQueue(queue, exchange, type === 'topic' ? '#' : '');
  await channel.consume(queue, async (message: ConsumeMessage | null) => {
    if (!message) return;
    try {
      const content = JSON.parse(message.content.toString()) as unknown;
      await handler(content, message);
      channel.ack(message);
    } catch (error) {
      channel.nack(message, false, false);
      console.error(
        `Failed to process message from exchange ${exchange}:`,
        error
      );
    }
  });
}

export async function disconnect(): Promise<void> {
  isShuttingDown = true;
  if (sharedConnection) {
    await sharedConnection.close();
    sharedConnection = null;
  }
}
