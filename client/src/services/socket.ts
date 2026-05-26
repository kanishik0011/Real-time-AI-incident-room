import { io, Socket } from 'socket.io-client'
import { getApiUrl, getSocketOptions } from '../config/env'

export function createSocket(opts?: { incidentId?: string }) {
  const s: Socket = io(getApiUrl(), getSocketOptions())
  s.on('connect', () => {
    if (opts?.incidentId) s.emit('room:join', { incidentId: opts.incidentId })
  })
  return s
}

