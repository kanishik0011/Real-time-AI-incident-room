import { io, Socket } from 'socket.io-client'

export function createSocket(url: string, opts?: { incidentId?: string }) {
  const s: Socket = io(url, { transports: ['websocket'] })
  if (opts?.incidentId) s.emit('room:join', { incidentId: opts.incidentId })
  return s
}

