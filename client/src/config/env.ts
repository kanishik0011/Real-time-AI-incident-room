/**
 * Backend base URL (no trailing slash).
 * Set VITE_API_URL in Vercel to your Render/Railway API URL, e.g. https://your-api.onrender.com
 */
export function getApiUrl(): string {
  const raw = import.meta.env.VITE_API_URL as string | undefined
  if (raw?.trim()) {
    return raw.trim().replace(/\/$/, '')
  }
  if (import.meta.env.PROD) {
    console.warn('[config] VITE_API_URL is not set — API and Socket.IO will fail in production.')
  }
  return 'http://localhost:4000'
}

export function getSocketOptions() {
  return {
    transports: ['websocket', 'polling'] as ('websocket' | 'polling')[],
    path: '/socket.io/',
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 10,
  }
}
