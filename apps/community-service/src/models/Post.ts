import mongoose, { Document, Schema } from 'mongoose'

interface IReaction {
  type: 'LIKE' | 'HEART' | 'SUPPORT'
  count: number
}

export interface IPost extends Document {
  communityId: mongoose.Types.ObjectId
  encryptedAuthorId: string
  content: string
  isAnonymous: boolean
  reactions: IReaction[]
  commentCount: number
  createdAt: Date
  updatedAt: Date
}

const PostSchema = new Schema<IPost>(
  {
    communityId: {
      type: Schema.Types.ObjectId,
      ref: 'CommunityGroup',
      required: true,
      index: true
    },
    encryptedAuthorId: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    isAnonymous: {
      type: Boolean,
      default: false
    },
    reactions: {
      type: [
        {
          type: { type: String, enum: ['LIKE', 'HEART', 'SUPPORT'] },
          count: { type: Number, default: 0 }
        }
      ],
      default: [
        { type: 'LIKE', count: 0 },
        { type: 'HEART', count: 0 },
        { type: 'SUPPORT', count: 0 }
      ]
    },
    commentCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
)

export const Post = mongoose.model<IPost>('Post', PostSchema)