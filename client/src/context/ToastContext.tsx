import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

export type Toast = {
  id: string
  type: 'success' | 'error' | 'info'
  title: string
  message?: string
}

type ToastContextValue = {
  toasts: Toast[]
  push: (t: Omit<Toast, 'id'>) => void
  remove: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  function remove(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  function push(t: Omit<Toast, 'id'>) {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`
    const toast: Toast = { id, ...t }
    setToasts((prev) => [toast, ...prev])
    window.setTimeout(() => remove(id), 4000)
  }

  const value = useMemo(() => ({ toasts, push, remove }), [toasts])

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToasts() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToasts must be used within ToastProvider')
  return ctx
}


