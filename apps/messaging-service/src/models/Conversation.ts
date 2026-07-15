import mongoose, { Document, Schema } from 'mongoose';

export interface IConversation extends Document {
  participants: string[];
  lastMessage?: {
    content: string;
    senderId: string;
    sentAt: Date;
  };
  // Single counter for the conversation (not per-participant). Maintained by
  // the socket layer: incremented on send_message, decremented on mark_read.
  // GET /conversations still computes its own unread count via aggregation,
  // independent of this field — see conversations.routes.ts.
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    participants: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => v.length === 2,
        message: 'A conversation must have exactly 2 participants',
      },
    },
    lastMessage: {
      content: { type: String },
      senderId: { type: String },
      sentAt: { type: Date },
    },
    unreadCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

// Index to quickly find conversations a user is part of
ConversationSchema.index({ participants: 1 });

export const Conversation = mongoose.model<IConversation>(
  'Conversation',
  ConversationSchema
);
