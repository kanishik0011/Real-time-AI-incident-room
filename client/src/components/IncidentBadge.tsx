import { Priority, Status } from '../types/incidents'

function badgeClass(kind: string) {
  const map: Record<string, string> = {
    Open: 'bg-sky-50 text-sky-900 border-sky-200 dark:bg-sky-950/30 dark:text-sky-200 dark:border-sky-900',
    Investigating:
      'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-900',
    Resolved:
      'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-200 dark:border-emerald-900',
    Low: 'bg-slate-50 text-slate-900 border-slate-200 dark:bg-slate-800/30 dark:text-slate-200 dark:border-slate-700',
    Medium:
      'bg-indigo-50 text-indigo-900 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-200 dark:border-indigo-900',
    High: 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/30 dark:text-rose-200 dark:border-rose-900',
  }
  return map[kind] || map.Low
}

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeClass(
        status,
      )}`}
    >
      {status}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeClass(
        priority,
      )}`}
    >
      {priority}
    </span>
  )
}

