import { Router } from 'express'
import { createIncident, listIncidents, getIncidentDetails, addUpdate, updateStatus, runAISummary, runAINextActions, deleteIncident } from '../controllers/incidents'

export const incidentRoutes = Router()

incidentRoutes.get('/incidents', listIncidents)
incidentRoutes.post('/incidents', createIncident)
incidentRoutes.get('/incidents/:id', getIncidentDetails)
incidentRoutes.post('/incidents/:id/updates', addUpdate)
incidentRoutes.patch('/incidents/:id/status', updateStatus)
incidentRoutes.post('/incidents/:id/ai/summary', runAISummary)
incidentRoutes.post('/incidents/:id/ai/next-actions', runAINextActions)
incidentRoutes.delete('/incidents/:id', deleteIncident)

