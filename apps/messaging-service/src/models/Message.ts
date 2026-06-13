import mongoose, { Document, Schema } from 'mongoose'

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId
  senderId: string
  content: string
  readAt?: Date
  createdAt: Date
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true
    },
    senderId: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    readAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
)

export const Message = mongoose.model<IMessage>('Message', MessageSchema)