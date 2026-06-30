import mongoose, { Document, Schema } from 'mongoose'

export interface IReport extends Document {
  contentId: mongoose.Types.ObjectId
  contentType: 'POST' | 'COMMENT'
  reportedBy: string
  reason: string
  status: 'PENDING' | 'REVIEWED' | 'DISMISSED'
  createdAt: Date
}

const ReportSchema = new Schema<IReport>(
  {
    contentId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true
    },
    contentType: {
      type: String,
      enum: ['POST', 'COMMENT'],
      required: true
    },
    reportedBy: {
      type: String,
      required: true
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'REVIEWED', 'DISMISSED'],
      default: 'PENDING'
    }
  },
  { timestamps: true }
)

export const Report = mongoose.model<IReport>('Report', ReportSchema)