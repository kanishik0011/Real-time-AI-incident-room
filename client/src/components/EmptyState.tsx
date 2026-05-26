export default function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center">
      <div className="text-lg font-semibold">{title}</div>
      {description ? <div className="text-sm text-slate-600 dark:text-slate-400 mt-2">{description}</div> : null}
    </div>
  )
}

