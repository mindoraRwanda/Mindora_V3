import mongoose, { Document, Schema } from 'mongoose'

export interface ICommunityGroup extends Document {
  name: string
  description: string
  category: string
  isAnonymous: boolean
  memberCount: number
  createdAt: Date
}

const CommunityGroupSchema = new Schema<ICommunityGroup>(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true
    },
    isAnonymous: {
      type: Boolean,
      default: false
    },
    memberCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
)

export const CommunityGroup = mongoose.model<ICommunityGroup>(
  'CommunityGroup',
  CommunityGroupSchema
)