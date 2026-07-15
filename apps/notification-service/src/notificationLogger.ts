import { PrismaClient } from './generated/prisma/index.js';

export const prisma = new PrismaClient();

export interface LogEntry {
  userId: string;
  eventType: string;
  channel: 'push' | 'email' | 'sms';
  status: 'delivered' | 'failed' | 'skipped';
  attempts?: number;
  failureReason?: string;
}

export async function logNotification(entry: LogEntry): Promise<void> {
  try {
    await prisma.notification_logs.create({
      data: {
        userId: entry.userId,
        eventType: entry.eventType,
        channel: entry.channel,
        status: entry.status,
        attempts: entry.attempts ?? 1,
        deliveredAt: entry.status === 'delivered' ? new Date() : null,
        failureReason: entry.failureReason ?? null,
      },
    });
  } catch (err) {
    // Logging must never crash the notification flow
    console.error('[notification-log] Failed to write log entry:', err);
  }
}
