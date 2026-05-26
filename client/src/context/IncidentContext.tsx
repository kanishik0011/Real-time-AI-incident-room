import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { io } from 'socket.io-client'
import { getApiUrl, getSocketOptions } from '../config/env'
import { api, createIncident as createIncidentApi, getIncident, getIncidents, updateIncidentStatus } from '../services/api'
import type { AIResult, Incident, IncidentUpdate, Priority, Status } from '../types/incidents'
import { useToasts } from './ToastContext'

type IncidentContextValue = {
  incidents: Incident[]
  incidentsLoading: boolean
  incidentsError?: string

  fetchIncidents: (opts?: {
    q?: string
    status?: string
    priority?: string
    sort?: string
  }) => Promise<void>

  createIncident: (input: {
    title: string
    description: string
    priority: Priority
    reporter_name: string
  }) => Promise<void>

  getIncidentDetails: (id: string) => Promise<{
    incident: Incident
    updates: IncidentUpdate[]
    aiResults: AIResult[]
  }>

  addRealtimeUpdate: (incidentId: string, message: string, author_name: string) => Promise<void>

  setStatus: (incidentId: string, status: Status) => Promise<void>

  deleteIncident: (incidentId: string) => Promise<void>

  socketConnected: boolean

}

const IncidentContext = createContext<IncidentContextValue | null>(null)

export function IncidentProvider({ children }: { children: React.ReactNode }) {
  const { push } = useToasts()
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [incidentsLoading, setIncidentsLoading] = useState(false)
  const [incidentsError, setIncidentsError] = useState<string | undefined>(undefined)
  const [socketConnected, setSocketConnected] = useState(false)

  useEffect(() => {
    const s = io(getApiUrl(), getSocketOptions())

    s.on('connect', () => setSocketConnected(true))
    s.on('disconnect', () => setSocketConnected(false))

    s.on('incident:update', (payload: { incident: Incident }) => {
      const inc = (payload as any)?.incident
      if (!inc?._id) return
      setIncidents((prev) => {
        const idx = prev.findIndex((i) => i._id === inc._id)
        if (idx === -1) return [inc, ...prev]
        const copy = [...prev]
        copy[idx] = inc
        return copy
      })
    })


    s.on('incident:status', (payload: { incident: Incident }) => {
      setIncidents((prev) => {
        const idx = prev.findIndex((i) => i._id === payload.incident._id)
        if (idx === -1) return [payload.incident, ...prev]
        const copy = [...prev]
        copy[idx] = payload.incident
        return copy
      })
    })

    return () => {
      s.close()
    }
  }, [])

  async function fetchIncidents(opts?: { q?: string; status?: string; priority?: string; sort?: string }) {
    setIncidentsLoading(true)
    setIncidentsError(undefined)
    try {
      const data = await getIncidents(opts)
      setIncidents(data.incidents)
    } catch (e: any) {
      setIncidentsError(e?.message || 'Failed to load incidents')
    } finally {
      setIncidentsLoading(false)
    }
  }

  async function createIncident(input: {
    title: string
    description: string
    priority: Priority
    reporter_name: string
  }) {
    const created = await createIncidentApi(input)
    setIncidents((prev) => {
      const exists = prev.some((i) => i._id === created._id)
      if (exists) return prev
      return [created, ...prev]
    })
    push({ type: 'success', title: 'Incident created', message: 'Dashboard updated in real time.' })
  }

  async function getIncidentDetails(id: string) {
    return await getIncident(id)
  }

  async function addRealtimeUpdate(incidentId: string, message: string, author_name: string) {
    await api.post(`/api/incidents/${incidentId}/updates`, { incident_id: incidentId, message, author_name })
    // dashboard updates via socket
    push({ type: 'success', title: 'Update posted', message: 'Incident feed updated in real time.' })
  }

  async function setStatus(incidentId: string, status: Status) {
    await updateIncidentStatus(incidentId, status)
    push({ type: 'success', title: 'Status updated', message: `Incident is now ${status}.` })
  }

  async function deleteIncident(incidentId: string) {
    await api.delete(`/api/incidents/${incidentId}`)
    push({ type: 'success', title: 'Incident deleted' })
    await fetchIncidents({ sort: '-updated_at' })
  }


  useEffect(() => {
    fetchIncidents({ sort: '-updated_at' })
  }, [])

  const value = useMemo(
    () => ({
      incidents,
      incidentsLoading,
      incidentsError,
      fetchIncidents,
      createIncident,
      getIncidentDetails,
      addRealtimeUpdate,
      setStatus,
      deleteIncident,
      socketConnected,
    }),

    [incidents, incidentsLoading, incidentsError, socketConnected],
  )

  return <IncidentContext.Provider value={value}>{children}</IncidentContext.Provider>
}

export function useIncidents() {
  const ctx = useContext(IncidentContext)
  if (!ctx) throw new Error('useIncidents must be used within IncidentProvider')
  return ctx
}

