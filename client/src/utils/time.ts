export function formatRelativeTime(isoOrMs: string | number): string {
  const t = typeof isoOrMs === 'number' ? isoOrMs : new Date(isoOrMs).getTime()
  if (!Number.isFinite(t)) return '—'

  const diffMs = Date.now() - t
  const abs = Math.abs(diffMs)

  const sec = Math.round(abs / 1000)
  const min = Math.round(abs / (60 * 1000))
  const hr = Math.round(abs / (60 * 60 * 1000))
  const day = Math.round(abs / (24 * 60 * 60 * 1000))

  const isPast = diffMs >= 0
  const suffix = isPast ? 'ago' : 'from now'

  if (sec < 45) return `${sec}s ${suffix}`
  if (min < 45) return `${min}m ${suffix}`
  if (hr < 24) return `${hr}h ${suffix}`
  return `${day}d ${suffix}`
}

