import 'dotenv/config'
import http from 'http'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { Server as SocketIOServer } from 'socket.io'
import mongoose from 'mongoose'
import { createSocketHandler } from './socket/socket'
import { incidentRoutes } from './routes/incidents'
import { ioSingleton } from './socket/singleton'
import { corsOriginCallback, getClientOriginEntries } from './config/cors'

const isProduction = process.env.NODE_ENV === 'production'

const app = express()

if (isProduction) {
  app.set('trust proxy', 1)
}

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
)

app.use(
  cors({
    origin: corsOriginCallback,
    credentials: false,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  }),
)

app.use(express.json({ limit: '1mb' }))
app.use(morgan(isProduction ? 'combined' : 'dev'))

app.get('/health', (_req, res) => {
  res.json({ ok: true, env: isProduction ? 'production' : 'development' })
})

app.use('/api', incidentRoutes)

const server = http.createServer(app)

const io = new SocketIOServer(server, {
  cors: {
    origin: corsOriginCallback,
    methods: ['GET', 'POST'],
  },
  path: '/socket.io/',
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
})

createSocketHandler(io)
ioSingleton.set(io)

const port = Number(process.env.PORT) || 4000

async function start() {
  const mongoUri = process.env.MONGO_URI
  if (!mongoUri) {
    throw new Error('MONGO_URI is required')
  }

  if (isProduction && getClientOriginEntries().length === 0) {
    console.warn(
      '[startup] CLIENT_URL is not set. Set your Vercel URL(s), e.g. https://your-app.vercel.app,https://*.vercel.app',
    )
  }

  await mongoose.connect(mongoUri)
  server.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on port ${port} (${isProduction ? 'production' : 'development'})`)
  })
}

start().catch((err) => {
  console.error('Fatal startup error:', err)
  process.exit(1)
})
