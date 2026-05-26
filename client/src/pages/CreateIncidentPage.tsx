import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import LoadingSpinner from '../components/LoadingSpinner'
import ToastViewport from '../components/ToastViewport'
import { useIncidents } from '../context/IncidentContext'
import type { Priority } from '../types/incidents'
import { useToasts } from '../context/ToastContext'

export default function CreateIncidentPage() {
  const navigate = useNavigate()
  const { createIncident } = useIncidents()
  const { push } = useToasts()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<Priority>('Medium')
  const [reporter_name, setReporterName] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  function validate() {
    const next: Record<string, string> = {}
    if (!title.trim()) next.title = 'Title is required.'
    if (!description.trim()) next.description = 'Description is required.'
    if (!reporter_name.trim()) next.reporter_name = 'Reporter name is required.'
    return next
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setLoading(true)
    try {
      await createIncident({ title: title.trim(), description: description.trim(), priority, reporter_name: reporter_name.trim() })
      navigate('/')
    } catch (err: any) {
      push({ type: 'error', title: 'Failed to create incident', message: err?.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <ToastViewport />
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Create Incident</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Report an issue and start collaborating in real time.</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="text-sm font-medium">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 px-3 py-2 text-sm"
              placeholder="e.g. Payment API failing for some users"
            />
            {errors.title ? <div className="mt-1 text-sm text-rose-600">{errors.title}</div> : null}
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full min-h-[120px] rounded-md border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 px-3 py-2 text-sm"
              placeholder="What is happening? Any known symptoms, affected components, timestamps?"
            />
            {errors.description ? <div className="mt-1 text-sm text-rose-600">{errors.description}</div> : null}
          </div>

          <div>
            <label className="text-sm font-medium">Priority *</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="mt-1 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 px-3 py-2 text-sm"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Reporter Name *</label>
            <input
              value={reporter_name}
              onChange={(e) => setReporterName(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/40 px-3 py-2 text-sm"
              placeholder="e.g. Alex"
            />
            {errors.reporter_name ? <div className="mt-1 text-sm text-rose-600">{errors.reporter_name}</div> : null}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            className="rounded-md border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm"
            onClick={() => navigate('/')}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-slate-900 text-white px-4 py-2 text-sm disabled:opacity-60"
          >
            {loading ? <LoadingSpinner label="Creating..." /> : 'Create Incident'}
          </button>
        </div>
      </form>
    </div>
  )
}

