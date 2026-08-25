import mongoose, { Document, Schema } from 'mongoose';
import type { MessageReceivedEvent } from '@mindora/events';

// Durable outbox for message.received events — same pattern as
// ai-integration-service's crisis_alerts table. Previously a fire-and-forget
// RabbitMQ publish with nothing recorded on failure: a broker blip at the
// exact moment of publish silently dropped the event forever.
export interface IPendingMessageEvent extends Document {
  payload: MessageReceivedEvent;
  published: boolean;
  publishedAt?: Date | null;
  attempts: number;
  lastError?: string | null;
  createdAt: Date;
}

const PendingMessageEventSchema = new Schema<IPendingMessageEvent>(
  {
    payload: {
      type: Schema.Types.Mixed,
      required: true,
    },
    published: {
      type: Boolean,
      default: false,
      index: true,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    lastError: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const PendingMessageEvent = mongoose.model<IPendingMessageEvent>(
  'PendingMessageEvent',
  PendingMessageEventSchema
);
