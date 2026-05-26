import { Navigate, Route, Routes } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import CreateIncidentPage from './pages/CreateIncidentPage'
import IncidentDetailsPage from './pages/IncidentDetailsPage'
import NotFoundPage from './pages/NotFoundPage'
import TopNav from './components/TopNav'

export default function App() {
  return (
    <div className="min-h-screen">
      <TopNav />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/create" element={<CreateIncidentPage />} />
          <Route path="/incidents/:id" element={<IncidentDetailsPage />} />
          <Route path="/incidents" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  )
}

