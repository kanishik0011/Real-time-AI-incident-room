import type { Server as SocketIOServer } from 'socket.io'

export function registerIncidentRooms(io: SocketIOServer) {
  io.on('connection', (socket) => {
    socket.on('room:join', (payload: { incidentId: string }) => {
      if (!payload?.incidentId) return
      socket.join(`incident:${payload.incidentId}`)
    })
  })
}

