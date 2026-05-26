/**
 * CLIENT_URL — comma-separated allowed browser origins.
 * Examples:
 *   http://localhost:5173
 *   https://your-app.vercel.app
 *   https://*.vercel.app   (wildcard for preview deployments)
 */
export function getClientOriginEntries(): string[] {
  return (process.env.CLIENT_URL || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function matchPattern(origin: string, pattern: string): boolean {
  if (!pattern.includes('*')) {
    return origin === pattern
  }
  const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')
  return new RegExp(`^${escaped}$`, 'i').test(origin)
}

export function isOriginAllowed(origin: string | undefined): boolean {
  // Non-browser clients (health checks, curl)
  if (!origin) return true

  const entries = getClientOriginEntries()
  if (entries.length === 0) {
    return process.env.NODE_ENV !== 'production'
  }

  return entries.some((entry) => matchPattern(origin, entry))
}

export function corsOriginCallback(
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
) {
  if (isOriginAllowed(origin)) {
    callback(null, true)
  } else {
    callback(new Error(`CORS blocked origin: ${origin}`))
  }
}
