import amqp, {
  type Channel,
  type Connection,
  type ConsumeMessage,
} from 'amqplib';

const DEFAULT_URL = 'amqp://mindora:mindora@localhost:5672';

export type MessageHandler = (
  content: unknown,
  raw: ConsumeMessage
) => Promise<void> | void;

let sharedConnection: Connection | null = null;

export async function connect(
  url = process.env.RABBITMQ_URL ?? DEFAULT_URL
): Promise<Connection> {
  if (sharedConnection) {
    return sharedConnection;
  }
  sharedConnection = await amqp.connect(url);
  sharedConnection.on('close', () => {
    sharedConnection = null;
  });
  return sharedConnection;
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
): Promise<Channel> {
  const connection = await connect(url);
  const channel = await connection.createChannel();
  await channel.assertQueue(queue, { durable: true });
  await channel.consume(queue, async (message) => {
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
