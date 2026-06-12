import amqp, {
  type Channel,
  type ChannelModel,
  type ConsumeMessage,
} from 'amqplib';

const DEFAULT_URL = 'amqp://mindora:mindora@localhost:5672';

export type MessageHandler = (
  content: unknown,
  raw: ConsumeMessage
) => Promise<void> | void;

type QueueConnection = Awaited<ReturnType<typeof amqp.connect>>;
type QueueChannel = Awaited<ReturnType<QueueConnection['createChannel']>>;

let sharedConnection: QueueChannel | null = null;

export async function connect(
  url = process.env.RABBITMQ_URL ?? DEFAULT_URL
): Promise<ChannelModel> {
  if (sharedConnection) {
    return sharedConnection;
  }
  // Use a local variable so TypeScript knows the return value is never null,
  // even though the 'close' listener later resets sharedConnection to null.
  const connection = await amqp.connect(url);
  connection.on('close', () => {
    sharedConnection = null;
  });
  sharedConnection = connection;
  return connection;
}

export async function publish(
  queue: string,
  payload: unknown,
  url?: string
): Promise<void> {
  const connection = await connect(url);
  const channel = await connection.createChannel();
  await channel.assertQueue(queue, { durable: true });
  channel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), {
    persistent: true,
    contentType: 'application/json',
  });
  await channel.close();
}

export async function subscribe(
  queue: string,
  handler: MessageHandler,
  url?: string
): Promise<QueueChannel> {
  const connection = await connect(url);
  const channel = await connection.createChannel();
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

export async function disconnect(): Promise<void> {
  if (sharedConnection) {
    await sharedConnection.close();
    sharedConnection = null;
  }
}
