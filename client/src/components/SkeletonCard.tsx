export default function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white/70 dark:bg-slate-950/40">
      <div className="animate-pulse">
        <div className="h-5 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="mt-3 h-4 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="mt-3 h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="mt-4 h-9 w-full rounded bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  )
}

