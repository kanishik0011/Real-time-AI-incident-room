export default function LoadingSpinner({ label }: { label?: string }) {
  return (
    <div className="inline-flex items-center gap-3">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-100" />
      {label ? <span className="text-sm">{label}</span> : null}
    </div>
  )
}

