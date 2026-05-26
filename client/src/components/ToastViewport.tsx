import { useToasts } from '../context/ToastContext'

const styles: Record<string, string> = {
  success: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  error: 'bg-rose-50 text-rose-900 border-rose-200',
  info: 'bg-sky-50 text-sky-900 border-sky-200',
}

export default function ToastViewport() {
  const { toasts } = useToasts()

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-3">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`w-[360px] max-w-[calc(100vw-2rem)] rounded-lg border px-4 py-3 shadow-sm ${
            styles[t.type]
          }`}
          role="status"
        >
          <div className="font-semibold text-sm">{t.title}</div>
          {t.message ? <div className="text-sm opacity-90 mt-1">{t.message}</div> : null}
        </div>
      ))}
    </div>
  )
}

