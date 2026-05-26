import { useState } from 'react'
import LoadingSpinner from './LoadingSpinner'

export default function ConfirmDeleteModal({
  open,
  title,
  description,
  confirmLabel,
  danger,
  onClose,
  onConfirm,
}: {
  open: boolean
  title: string
  description?: string
  confirmLabel: string
  danger?: boolean
  onClose: () => void
  onConfirm: () => Promise<void> | void
}) {
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    if (loading) return
    setLoading(true)
    try {
      await onConfirm()
      onClose()
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="relative mx-auto mt-[10vh] w-[92vw] max-w-lg rounded-xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 backdrop-blur p-5 shadow-lg">
        <div className="font-semibold text-lg">{title}</div>
        {description ? <div className="text-sm text-slate-600 dark:text-slate-400 mt-2">{description}</div> : null}

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            className="rounded-md border border-slate-200 dark:border-slate-800 px-4 py-2 text-sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`rounded-md px-4 py-2 text-sm text-white ${
              danger ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-900 hover:bg-slate-800'
            } disabled:opacity-60`}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? <LoadingSpinner label="Deleting..." /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

