import type { Server as SocketIOServer } from 'socket.io'

let io: SocketIOServer | null = null

export const ioSingleton = {
  set(next: SocketIOServer) {
    io = next
  },
  get() {
    return io
  },
}

