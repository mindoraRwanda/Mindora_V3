import mongoose, { Document, Schema } from 'mongoose'

export interface IComment extends Document {
  postId: mongoose.Types.ObjectId
  communityId: mongoose.Types.ObjectId
  encryptedAuthorId: string
  content: string
  isAnonymous: boolean
  createdAt: Date
  updatedAt: Date
}

const CommentSchema = new Schema<IComment>(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
      index: true
    },
    communityId: {
      type: Schema.Types.ObjectId,
      ref: 'CommunityGroup',
      required: true
    },
    encryptedAuthorId: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000
    },
    isAnonymous: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
)

export const Comment = mongoose.model<IComment>('Comment', CommentSchema)