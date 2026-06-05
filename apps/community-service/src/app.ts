import express from 'express'
import communityRoutes from './routes/community.routes'

const app = express()

app.use(express.json())

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' })
})

app.use('/api/v1/community', communityRoutes)

export default app