import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: string;
  content: string;
  deliveredAt?: Date;
  readAt?: Date;
  createdAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    senderId: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    // Set once the message has reached the recipient (their socket was in the
    // conversation room at send time, or they joined afterwards). Distinct
    // from readAt: delivered means "arrived on their device", read means
    // "they opened it" — the two grey ticks vs two blue ticks distinction.
    // Once set it is never cleared, so ticks only ever move forwards.
    deliveredAt: {
      type: Date,
      default: null,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
