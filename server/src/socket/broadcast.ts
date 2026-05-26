import type { Server as SocketIOServer } from 'socket.io'
import { ioSingleton } from './singleton'

type IncidentLike = {
  _id: string
  title: string
  description: string
  priority: string
  status: string
  reporter_name: string
  latest_update: string
  created_at: string
  updated_at: string
}

type BroadcastUpdate = {
  incidentId: string
  update?: any
}

export function emitIncidentUpdated(incident: IncidentLike, extra?: BroadcastUpdate) {
  const io = ioSingleton.get()
  const incidentId = extra?.incidentId
  if (!io) return

  if (incidentId) {
    io.to(`incident:${incidentId}`).emit('incident:update', { incident, update: extra?.update })
    if (extra?.update) {
      io.to(`incident:${incidentId}`).emit('incident:update:created', { incidentId, update: extra.update })
    }
  }

  io.emit('incident:update', { incident })
}

export function emitIncidentStatus(incident: IncidentLike, extra?: BroadcastUpdate) {
  const io = ioSingleton.get()
  if (!io) return

  if (extra?.incidentId) {
    io.to(`incident:${extra.incidentId}`).emit('incident:status', { incident })
  }

  io.emit('incident:status', { incident })
}

