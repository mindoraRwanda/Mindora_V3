import express from 'express'
import communityRoutes from './routes/community.routes'
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from './docs/swagger'

const app = express()

app.use(express.json())

// Swagger docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

// Export the raw spec as JSON so other tools can consume it
app.get('/docs.json', (_req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' })
})

app.use('/api/v1/community', communityRoutes)

app.get('/api/v1/community/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'community-service' })
})

export default app