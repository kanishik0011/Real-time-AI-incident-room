import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export const api = axios.create({
  baseURL,
  withCredentials: false,
})

export async function getIncidents(params?: {
  q?: string
  status?: string
  priority?: string
  sort?: string
}) {
  const res = await api.get('/api/incidents', { params })
  return res.data
}

export async function createIncident(input: {
  title: string
  description: string
  priority: 'Low' | 'Medium' | 'High'
  reporter_name: string
}) {
  const res = await api.post('/api/incidents', input)
  return res.data
}

export async function getIncident(id: string) {
  const res = await api.get(`/api/incidents/${id}`)
  return res.data
}

export async function addUpdate(input: { incident_id: string; message: string; author_name: string }) {
  const res = await api.post(`/api/incidents/${input.incident_id}/updates`, input)
  return res.data
}

export async function updateIncidentStatus(id: string, status: string) {
  const res = await api.patch(`/api/incidents/${id}/status`, { status })
  return res.data
}

export async function deleteIncident(id: string) {
  const res = await api.delete(`/api/incidents/${id}`)
  return res.data
}

export async function runAISummary(incidentId: string) {
  const res = await api.post(`/api/incidents/${incidentId}/ai/summary`)
  return res.data
}

export async function runAINextActions(incidentId: string) {
  const res = await api.post(`/api/incidents/${incidentId}/ai/next-actions`)
  return res.data
}

