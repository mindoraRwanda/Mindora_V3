import 'dotenv/config'
import http from 'http'
import app from './app'
import { connectDatabase } from './database'
import { initializeSocket } from './socket'

const PORT = process.env.PORT || 3006

const start = async () => {
  try {
    // CRITICAL: Connect to MongoDB BEFORE initializing Socket.io
    // This prevents Mongoose query buffering timeouts
    console.log('⏳ Connecting to MongoDB...')
    await connectDatabase()
    console.log('✓ Database connection established')

    // Create HTTP server from Express app
    const httpServer = http.createServer(app)

    // Attach Socket.io to the HTTP server
    console.log('⏳ Initializing Socket.io...')
    const io = await initializeSocket(httpServer)
    console.log('✓ Socket.io initialized')

    // Store io on app so routes can access it later if needed
    app.set('io', io)

    // Listen on the HTTP server, not the Express app directly
    httpServer.listen(PORT, () => {
      console.log(`✓ Messaging Service running on port ${PORT}`)
    })

    process.on('SIGTERM', () => {
      console.log('⏳ SIGTERM received, closing gracefully...')
      httpServer.close()
    })
    process.on('SIGINT', () => {
      console.log('⏳ SIGINT received, closing gracefully...')
      httpServer.close()
    })
  } catch (error) {
    console.error('✗ Failed to start service:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

start()




