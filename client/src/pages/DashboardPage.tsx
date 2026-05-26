import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useIncidents } from '../context/IncidentContext'
import SkeletonCard from '../components/SkeletonCard'
import EmptyState from '../components/EmptyState'
import { PriorityBadge, StatusBadge } from '../components/IncidentBadge'
import ToastViewport from '../components/ToastViewport'
import type { Priority, Status } from '../types/incidents'

export default function DashboardPage() {
  const { incidents, incidentsLoading, incidentsError, fetchIncidents } = useIncidents()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState<Status | 'All'>('All')
  const [priority, setPriority] = useState<Priority | 'All'>('All')
  const [sort, setSort] = useState('-updated_at')

  useEffect(() => {
    fetchIncidents({ q, status: status === 'All' ? undefined : status, priority: priority === 'All' ? undefined : priority, sort })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, status, priority, sort])

  const cards = useMemo(() => incidents, [incidents])

  return (
    <div className="space-y-4">
      <ToastViewport />
      <div className="flex flex-col md:flex-row gap-3 md:items-end md:justify-between">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
          <div className="sm:col-span-1 lg:col-span-2">
            <label className="text-sm font-medium">Search by title</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 px-3 py-2 text-sm"
              placeholder="e.g. payment, login, dashboard"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Filter status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="mt-1 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 px-3 py-2 text-sm"
            >
              <option value="All">All</option>
              <option value="Open">Open</option>
              <option value="Investigating">Investigating</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Filter priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="mt-1 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 px-3 py-2 text-sm"
            >
              <option value="All">All</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Sort</label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 px-3 py-2 text-sm"
            >
              <option value="-updated_at">Latest updated</option>
              <option value="updated_at">Oldest updated</option>
            </select>
          </div>
        </div>
      </div>

      {incidentsLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>

      ) : incidentsError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 dark:border-rose-900/60 dark:bg-rose-950/30 p-4 text-sm">
          {incidentsError}
        </div>
      ) : cards.length === 0 ? (
        <EmptyState title="No incidents yet" description="Create the first incident to start collaborating." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {cards.map((i) => (
            <Link
              key={i._id}
              to={`/incidents/${i._id}`}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 p-4 hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">{i.title}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <StatusBadge status={i.status} />
                    <PriorityBadge priority={i.priority} />
                  </div>
                </div>
              </div>
              <div className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                <div>
                  <span className="font-medium">Latest update:</span> {i.latest_update || '—'}
                </div>
                <div className="mt-2">
                  <span className="font-medium">Reporter:</span> {i.reporter_name}
                </div>
              </div>
              <div className="mt-4 text-xs text-slate-500 dark:text-slate-400 flex justify-between">
                <span>Created: {new Date(i.created_at).toLocaleString()}</span>
                <span>Updated: {new Date(i.updated_at).toLocaleString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

