import { Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'

export default function TopNav() {
  const { theme, setTheme } = useTheme()

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 shrink-0 rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500" />
          <div className="min-w-0">
            <div className="font-semibold leading-none truncate">Real-Time AI Incident Room</div>
            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">Internal operations room</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <nav className="hidden sm:flex items-center gap-4 text-sm">
            <Link className="hover:underline" to="/">
              Dashboard
            </Link>
            <Link className="hover:underline" to="/create">
              Create Incident
            </Link>
          </nav>

          <button
            className="rounded-md border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm whitespace-nowrap"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
            type="button"
          >
            {theme === 'dark' ? 'Dark' : 'Light'}
          </button>
        </div>
      </div>
    </header>
  )
}


