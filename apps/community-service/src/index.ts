import 'dotenv/config'
import app from './app'
import { connectDatabase } from './database'

const PORT = process.env.PORT || 3005

const start = async () => {
  await connectDatabase()
  app.listen(PORT, () => {
    console.log(`Community Service running on port ${PORT}`)
  })
}

start()