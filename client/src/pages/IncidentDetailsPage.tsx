import { useEffect, useMemo, useRef, useState } from 'react'

import { useParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import LoadingSpinner from '../components/LoadingSpinner'
import EmptyState from '../components/EmptyState'
import ToastViewport from '../components/ToastViewport'
import { useIncidents } from '../context/IncidentContext'
import { useToasts } from '../context/ToastContext'
import type { AIResult, AIResultType, IncidentUpdate, Status } from '../types/incidents'
import { runAINextActions, runAISummary } from '../services/api'
import { PriorityBadge, StatusBadge } from '../components/IncidentBadge'
import ConfirmDeleteModal from '../components/ConfirmDeleteModal'
import { formatRelativeTime } from '../utils/time'

const socketUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function AiCard({
  title,
  children,
  meta,
}: {
  title: string
  children: React.ReactNode
  meta?: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{title}</div>
          {meta ? <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{meta}</div> : null}
        </div>
      </div>
      <div className="mt-3 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{children}</div>
    </div>
  )
}

function TimelineItem({
  update,
  isNew,
}: {
  update: IncidentUpdate
  isNew?: boolean
}) {
  return (
    <div
      className={`rounded-lg border border-slate-200 dark:border-slate-800 p-3 transition ${
        isNew ? 'ring-2 ring-indigo-400 dark:ring-indigo-500 bg-indigo-50/60 dark:bg-indigo-500/10' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium flex items-center gap-2">
          <span>{update.author_name}</span>
          {isNew ? (
            <span className="inline-flex items-center rounded-full bg-indigo-600 text-white px-2 py-0.5 text-[11px] font-semibold">
              NEW
            </span>
          ) : null}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400">{formatRelativeTime(update.created_at)}</div>
      </div>
      <div className="mt-2 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{update.message}</div>
    </div>
  )
}

export default function IncidentDetailsPage() {
  const { id } = useParams()
  const incidentId = id as string
  const { getIncidentDetails, addRealtimeUpdate, setStatus, deleteIncident } = useIncidents()

  const { push } = useToasts()

  const [loading, setLoading] = useState(true)
  const [incident, setIncident] = useState<any>(null)
  const [updates, setUpdates] = useState<IncidentUpdate[]>([])
  const [aiResults, setAiResults] = useState<AIResult[]>([])
  const [aiLoadingType, setAiLoadingType] = useState<AIResultType | null>(null)

  const [message, setMessage] = useState('')
  const [author, setAuthor] = useState('')
  const [posting, setPosting] = useState(false)

  const newestUpdateIdRef = useRef<string | null>(null)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function onConfirmDelete() {
    setDeleting(true)
    try {
      await deleteIncident(incidentId)
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  const aiSummary = useMemo(
    () => aiResults.find((r) => r.type === 'summary')?.result_text,
    [aiResults],
  )

  const aiNextActions = useMemo(
    () => aiResults.find((r) => r.type === 'next_actions')?.result_text,
    [aiResults],
  )

  async function refresh() {
    setLoading(true)
    try {
      const data = await getIncidentDetails(incidentId)
      setIncident(data.incident)
      setUpdates(data.updates)
      setAiResults(data.aiResults)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incidentId])

  useEffect(() => {
    const s = io(socketUrl, { transports: ['websocket', 'polling'] })

    s.on('connect', () => {
      s.emit('room:join', { incidentId })
    })

    s.on('incident:update', (payload: { incident: any; update?: IncidentUpdate }) => {
      if (payload.incident?._id === incidentId && payload.update) {
        setIncident(payload.incident)
        newestUpdateIdRef.current = payload.update._id
        setUpdates((prev) => {
          const exists = prev.some((u) => u._id === payload.update!._id)
          return exists ? prev : [payload.update!, ...prev]
        })
      } else if (payload.incident?._id === incidentId) {
        setIncident(payload.incident)
      }
    })


    s.on('incident:status', (payload: { incident: any }) => {
      if (payload.incident?._id === incidentId) setIncident(payload.incident)
    })

    s.on('incident:update:created', (payload: { incidentId: string; update: IncidentUpdate }) => {
      if (payload.incidentId === incidentId) {
        setUpdates((prev) => [payload.update, ...prev])
      }
    })

    return () => {
      s.close()
    }
  }, [incidentId])

  async function onPostUpdate(e: React.FormEvent) {
    e.preventDefault()
    if (!message.trim() || !author.trim()) {
      push({ type: 'error', title: 'Validation error', message: 'Message and author name are required.' })
      return
    }

    setPosting(true)
    try {
      await addRealtimeUpdate(incidentId, message.trim(), author.trim())
      setMessage('')
      setAuthor('')
    } catch (err: any) {
      push({ type: 'error', title: 'Failed to post update', message: err?.message })
    } finally {
      setPosting(false)
    }
  }

  async function run(type: AIResultType) {
    setAiLoadingType(type)
    try {
      if (type === 'summary') {
        const res = await runAISummary(incidentId)
        setAiResults((prev) => {
          const existing = prev.filter((r) => r.type !== 'summary')
          return [...existing, res.aiResult]
        })
      } else {
        const res = await runAINextActions(incidentId)
        setAiResults((prev) => {
          const existing = prev.filter((r) => r.type !== 'next_actions')
          return [...existing, res.aiResult]
        })
      }
      push({ type: 'success', title: 'AI analysis generated' })
    } catch (err: any) {
      push({ type: 'error', title: 'AI generation failed', message: err?.message })
    } finally {
      setAiLoadingType(null)
    }
  }

  async function onStatusChange(next: Status) {
    try {
      await setStatus(incidentId, next)
    } catch (err: any) {
      push({ type: 'error', title: 'Status update failed', message: err?.message })
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <ToastViewport />
        <LoadingSpinner label="Loading incident..." />
      </div>
    )
  }

  if (!incident) {
    return (
      <div className="space-y-4">
        <ToastViewport />
        <EmptyState title="Incident not found" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ToastViewport />

      <ConfirmDeleteModal
        open={deleteOpen}
        title="Delete incident?"
        description="This will permanently remove the incident and its updates."
        confirmLabel={deleting ? 'Deleting...' : 'Delete'}
        danger
        onClose={() => setDeleteOpen(false)}
        onConfirm={onConfirmDelete}
      />

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 p-4 md:p-6">


        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{incident.title}</h1>

            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge status={incident.status} />
              <PriorityBadge priority={incident.priority} />
            </div>
            <p className="mt-4 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{incident.description}</p>
            <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-3">
              <span>Reporter: {incident.reporter_name}</span>
              <span>Created: {new Date(incident.created_at).toLocaleString()}</span>
              <span>Updated: {formatRelativeTime(incident.updated_at)}</span>

            </div>
          </div>

          <div className="min-w-[240px]">
            <label className="text-sm font-medium">Current status</label>
            <button
              type="button"
              className="mt-3 w-full rounded-md border border-rose-200 bg-rose-50 text-rose-900 px-3 py-2 text-sm hover:bg-rose-100 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-200"
              onClick={() => setDeleteOpen(true)}
            >
              Delete incident
            </button>

            <select
              value={incident.status}
              onChange={(e) => onStatusChange(e.target.value as Status)}
              className="mt-1 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 px-3 py-2 text-sm"
            >
              <option value="Open">Open</option>
              <option value="Investigating">Investigating</option>
              <option value="Resolved">Resolved</option>
            </select>
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">Updates dashboard in real time.</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 p-4">
            <h2 className="font-semibold">Live update feed</h2>
            <div className="mt-4">
              {updates.length === 0 ? (
                <EmptyState title="No updates yet" description="Post the first update to start the timeline." />
              ) : (
                <div className="space-y-3">
                  {updates
                    .slice()
                    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
                    .map((u) => (
                      <TimelineItem key={u._id} update={u} isNew={newestUpdateIdRef.current === u._id} />
                    ))}
                </div>
              )}

            </div>
          </div>

          <form onSubmit={onPostUpdate} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 p-4">
            <h2 className="font-semibold">Add update</h2>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-sm font-medium">Message *</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="mt-1 w-full min-h-[90px] rounded-md border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 px-3 py-2 text-sm"
                  placeholder="What changed? Any findings, logs, mitigations?"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Author name *</label>
                <input
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 px-3 py-2 text-sm"
                  placeholder="e.g. Sam"
                />
              </div>
              <div className="sm:col-span-2 flex justify-end">
                <button
                  type="submit"
                  disabled={posting}
                  className="rounded-md bg-slate-900 text-white px-4 py-2 text-sm disabled:opacity-60"
                >
                  {posting ? <LoadingSpinner label="Posting..." /> : 'Post update'}
                </button>
              </div>
            </div>
          </form>
        </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 p-4">
              <h2 className="font-semibold">Recent Activity</h2>
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">Latest updates in this room.</div>
              <div className="mt-3 space-y-2">
                {updates.length === 0 ? (
                  <EmptyState title="No activity yet" description="Post an update to start the feed." />
                ) : (
                  updates
                    .slice(0, 5)
                    .map((u) => (
                      <div
                        key={u._id}
                        className={`rounded-lg border border-slate-200 dark:border-slate-800 p-3 transition ${
                          newestUpdateIdRef.current === u._id
                            ? 'ring-2 ring-indigo-400 dark:ring-indigo-500 bg-indigo-50/60 dark:bg-indigo-500/10'
                            : ''
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm font-medium flex items-center gap-2">
                            <span>{u.author_name}</span>
                            {newestUpdateIdRef.current === u._id ? (
                              <span className="inline-flex items-center rounded-full bg-indigo-600 text-white px-2 py-0.5 text-[11px] font-semibold">
                                NEW
                              </span>
                            ) : null}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">{formatRelativeTime(u.created_at)}</div>
                        </div>
                        <div className="mt-2 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap line-clamp-3">{u.message}</div>
                      </div>
                    ))
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 p-4">
              <h2 className="font-semibold">AI analysis</h2>

            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">Uses Gemini when available; otherwise falls back to rules.</div>

            <div className="mt-4 space-y-3">
              <button
                type="button"
                disabled={aiLoadingType !== null}
                onClick={() => run('summary')}
                className="w-full rounded-md border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm disabled:opacity-60"
              >
                {aiLoadingType === 'summary' ? <LoadingSpinner label="Generating..." /> : 'Generate AI Incident Summary'}
              </button>
              <button
                type="button"
                disabled={aiLoadingType !== null}
                onClick={() => run('next_actions')}
                className="w-full rounded-md border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm disabled:opacity-60"
              >
                {aiLoadingType === 'next_actions' ? (
                  <LoadingSpinner label="Generating..." />
                ) : (
                  'Generate AI Next Action Suggestion'
                )}
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="space-y-2">
                <div className="text-sm font-medium">Latest AI Summary</div>
                <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap rounded-lg border border-slate-200 dark:border-slate-800 p-3 bg-white/60 dark:bg-slate-950/20">
                  {aiSummary || '—'}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Latest AI Next Actions</div>
                <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap rounded-lg border border-slate-200 dark:border-slate-800 p-3 bg-white/60 dark:bg-slate-950/20">
                  {aiNextActions || '—'}
                </div>
              </div>

              {aiResults.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-xs text-slate-500 dark:text-slate-400">AI history (saved results)</div>
                  {aiResults
                    .slice()
                    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
                    .filter((r) => r.type === 'summary' || r.type === 'next_actions')
                    .map((r) => (
                      <AiCard
                        key={`${r.type}-${r._id}`}
                        title={r.type === 'summary' ? 'Summary' : 'Next actions'}
                        meta={`${formatRelativeTime(r.created_at)} • ${r.type === 'summary' ? 'Summary' : 'Next actions'}`}
                      >
                        {r.result_text}
                      </AiCard>
                    ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 p-4">
            <h2 className="font-semibold">Incident history</h2>
            <div className="mt-3 text-sm text-slate-600 dark:text-slate-400">
              <div>Feed is driven by Socket.IO—updates appear instantly for all connected users.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

