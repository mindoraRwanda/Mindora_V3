import mongoose from 'mongoose'

const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017/mindora_messaging'

let isConnected = false

export const connectDatabase = async (): Promise<void> => {
  if (isConnected) {
    console.log('MongoDB already connected, skipping reconnect')
    return
  }

  try {
    // Connect with optimized options to prevent buffering and timeouts
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      retryWrites: true,
      w: 'majority',
      directConnection: false,
      // Prevent query buffering by failing fast if connection isn't ready
      bufferCommands: false
    })

    isConnected = true
    console.log('\u2713 MongoDB connected successfully to', MONGO_URI)
    console.log(`   Connection state: ${mongoose.connection.readyState}`)
    console.log(`   Database name: ${mongoose.connection.db?.databaseName ?? 'N/A'}`)
    console.log(`   Database names: ${(mongoose.connection.db as unknown as Record<string, unknown>)['admin'] ? 'Connected' : 'Checking...'}`)

    // Monitor connection state
    mongoose.connection.on('connected', () => {
      console.log('✓ Mongoose connected to MongoDB')
      isConnected = true
    })

    mongoose.connection.on('error', (error) => {
      console.error('✗ MongoDB connection error:', error.message)
      isConnected = false
    })

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠ MongoDB disconnected')
      isConnected = false
    })

    mongoose.connection.on('reconnected', () => {
      console.log('✓ MongoDB reconnected')
      isConnected = true
    })
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

export const isMongoConnected = (): boolean => isConnected