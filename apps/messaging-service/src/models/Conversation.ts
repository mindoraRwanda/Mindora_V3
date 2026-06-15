import mongoose, { Document, Schema } from 'mongoose'

export interface IConversation extends Document {
  participants: string[]
  lastMessage?: {
    content: string
    senderId: string
    sentAt: Date
  }
  createdAt: Date
  updatedAt: Date
}

const ConversationSchema = new Schema<IConversation>(
  {
    participants: {
      type: [String],
      required: true,
      validate: {
        validator: (v: string[]) => v.length === 2,
        message: 'A conversation must have exactly 2 participants'
      },
    },
    lastMessage: {
      content: { type: String },
      senderId: { type: String },
      sentAt: { type: Date }
    }
  },
  { timestamps: true }
)

// Index to quickly find conversations a user is part of
ConversationSchema.index({ participants: 1 })

export const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema)