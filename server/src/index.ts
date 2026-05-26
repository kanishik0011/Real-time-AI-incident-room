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


const app = express()


app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: false }))
app.use(express.json({ limit: '1mb' }))
app.use(morgan('dev'))

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api', incidentRoutes)

const server = http.createServer(app)

const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  },
})

createSocketHandler(io)
ioSingleton.set(io)



const port = Number(process.env.PORT) || 4000


async function start() {
  const mongoUri = process.env.MONGO_URI
  if (!mongoUri) {
    throw new Error('MONGO_URI is required')
  }

  await mongoose.connect(mongoUri)
  server.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`)
  })
}

start().catch((err) => {
  console.error('Fatal startup error:', err)
  process.exit(1)
})

