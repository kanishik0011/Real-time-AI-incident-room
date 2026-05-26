import type { Server as SocketIOServer } from 'socket.io'
import { registerIncidentRooms } from './rooms'

export function createSocketHandler(io: SocketIOServer) {
  registerIncidentRooms(io)
}

