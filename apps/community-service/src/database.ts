import mongoose from 'mongoose'

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mindora_community'

export const connectDatabase = async (): Promise<void> => {
  console.log('Mongo URI:', MONGO_URI);
  try {
    await mongoose.connect(MONGO_URI)
    console.log('MongoDB connected successfully')
  } catch (error) {
    console.error('MongoDB connection failed:', error)
    process.exit(1)
  }
}

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected')
})

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected')
})