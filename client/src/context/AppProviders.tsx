import { IncidentProvider } from './IncidentContext'
import { ThemeProvider } from './ThemeContext'
import { ToastProvider } from './ToastContext'

export function AppProviders({ children }: { children: React.ReactNode }) {
  // Placeholder for future global providers; kept explicit for interview clarity.
  return (
    <ThemeProvider>
      <ToastProvider>
        <IncidentProvider>{children}</IncidentProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}

