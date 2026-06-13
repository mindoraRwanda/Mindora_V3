import { connectDatabase } from './database'
import 'dotenv/config'
import app from './app'

const PORT = process.env.PORT || 3006

const start = async () => {
  await connectDatabase()
  const server = app.listen(PORT, () => {
  console.log(`Messaging Service running on port ${PORT}`)
  })
  process.on('SIGTERM', () => server.close())
  process.on('SIGINT', () => server.close())

}
start()




