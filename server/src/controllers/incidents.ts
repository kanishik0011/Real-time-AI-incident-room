import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import { Incident } from '../models/Incident'
import { IncidentUpdate } from '../models/IncidentUpdate'
import { AIResult } from '../models/AIResult'
import { emitIncidentUpdated, emitIncidentStatus } from '../socket/broadcast'
import { generateAISummary, generateAINextActions } from '../services/ai'

function parseSort(sort?: string) {
  // Accept: -updated_at or updated_at
  if (!sort) return { updated_at: -1 } as any
  if (sort === '-updated_at') return { updated_at: -1 } as any
  if (sort === 'updated_at') return { updated_at: 1 } as any
  return { updated_at: -1 } as any
}


export async function listIncidents(req: Request, res: Response) {
  const { q, status, priority, sort } = req.query
  const filter: any = {}
  if (status) filter.status = status
  if (priority) filter.priority = priority
  if (q && typeof q === 'string') filter.title = { $regex: q, $options: 'i' }

  const sortObj = parseSort(typeof sort === 'string' ? sort : undefined)

  const incidents = await Incident.find(filter).sort(sortObj).limit(200)
  const mapped = incidents.map((i) => ({
    _id: i._id.toString(),
    title: i.title,
    description: i.description,
    priority: i.priority,
    status: i.status,
    reporter_name: i.reporter_name,
    latest_update: i.latest_update,
    created_at: i.createdAt.toISOString(),
    updated_at: i.updatedAt.toISOString(),
  }))

  res.json({ incidents: mapped })
}

export async function createIncident(req: Request, res: Response) {
  const { title, description, priority, reporter_name } = req.body || {}
  if (!title || !description || !priority || !reporter_name) {
    return res.status(400).json({ message: 'title, description, priority, reporter_name are required' })
  }
  const priorities = ['Low', 'Medium', 'High']
  if (!priorities.includes(priority)) {
    return res.status(400).json({ message: `priority must be one of: ${priorities.join(', ')}` })
  }

  const incident = await Incident.create({
    title,
    description,
    priority,
    reporter_name,
    latest_update: '',
    status: 'Open',
  })

  const mapped = {
    _id: incident._id.toString(),
    title: incident.title,
    description: incident.description,
    priority: incident.priority,
    status: incident.status,
    reporter_name: incident.reporter_name,
    latest_update: incident.latest_update,
    created_at: incident.createdAt.toISOString(),
    updated_at: incident.updatedAt.toISOString(),
  }

  // treat as realtime change
  emitIncidentUpdated(mapped)

  res.status(201).json(mapped)
}

export async function getIncidentDetails(req: Request, res: Response) {
  const { id } = req.params
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' })

  const incident = await Incident.findById(id)
  if (!incident) return res.status(404).json({ message: 'Incident not found' })

  const updates = await IncidentUpdate.find({ incident_id: id }).sort({ createdAt: -1 }).limit(500)

  const aiResults = await AIResult.find({ incident_id: id }).sort({ createdAt: -1 }).limit(50)

  const mappedIncident = {
    _id: incident._id.toString(),
    title: incident.title,
    description: incident.description,
    priority: incident.priority,
    status: incident.status,
    reporter_name: incident.reporter_name,
    latest_update: incident.latest_update,
    created_at: incident.createdAt.toISOString(),
    updated_at: incident.updatedAt.toISOString(),
  }

  const mappedUpdates = updates.map((u) => ({
    _id: u._id.toString(),
    incident_id: u.incident_id.toString(),
    message: u.message,
    author_name: u.author_name,
    created_at: u.createdAt.toISOString(),
  }))

  const mappedAi = aiResults.map((r) => ({
    _id: r._id.toString(),
    incident_id: r.incident_id.toString(),
    type: r.type,
    result_text: r.result_text,
    created_at: r.createdAt.toISOString(),
  }))

  res.json({ incident: mappedIncident, updates: mappedUpdates, aiResults: mappedAi })
}

export async function addUpdate(req: Request, res: Response) {
  const { id } = req.params
  const { message, author_name } = req.body || {}

  if (!message || !author_name) return res.status(400).json({ message: 'message and author_name are required' })
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' })

  const incident = await Incident.findById(id)
  if (!incident) return res.status(404).json({ message: 'Incident not found' })

  const update = await IncidentUpdate.create({ incident_id: id, message, author_name })

  // Update latest_update + updatedAt via save
  incident.latest_update = message
  incident.status = incident.status
  await incident.save()

  const mappedIncident = {
    _id: incident._id.toString(),
    title: incident.title,
    description: incident.description,
    priority: incident.priority,
    status: incident.status,
    reporter_name: incident.reporter_name,
    latest_update: incident.latest_update,
    created_at: incident.createdAt.toISOString(),
    updated_at: incident.updatedAt.toISOString(),
  }

  const mappedUpdate = {
    _id: update._id.toString(),
    incident_id: update.incident_id.toString(),
    message: update.message,
    author_name: update.author_name,
    created_at: update.createdAt.toISOString(),
  }

  emitIncidentUpdated(mappedIncident, {
    incidentId: id,
    update: mappedUpdate,
  })

  res.status(201).json({ update: mappedUpdate, incident: mappedIncident })
}

export async function updateStatus(req: Request, res: Response) {
  const { id } = req.params
  const { status } = req.body || {}

  if (!status) return res.status(400).json({ message: 'status is required' })
  const allowed = ['Open', 'Investigating', 'Resolved']
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: `status must be one of: ${allowed.join(', ')}` })
  }
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' })

  const incident = await Incident.findById(id)
  if (!incident) return res.status(404).json({ message: 'Incident not found' })

  incident.status = status
  await incident.save()

  const mappedIncident = {
    _id: incident._id.toString(),
    title: incident.title,
    description: incident.description,
    priority: incident.priority,
    status: incident.status,
    reporter_name: incident.reporter_name,
    latest_update: incident.latest_update,
    created_at: incident.createdAt.toISOString(),
    updated_at: incident.updatedAt.toISOString(),
  }

  emitIncidentStatus(mappedIncident, { incidentId: id })

  res.json(mappedIncident)
}

export async function runAISummary(req: Request, res: Response) {
  const { id } = req.params
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' })

  const data = await Incident.findById(id)
  if (!data) return res.status(404).json({ message: 'Incident not found' })


  const updates = await IncidentUpdate.find({ incident_id: id }).sort({ createdAt: -1 }).limit(20)

  const result = await generateAISummary({
    title: data.title,
    description: data.description,
    updates: updates.map((u) => ({ message: u.message, author_name: u.author_name, created_at: u.createdAt.toISOString() })),
  })

  const saved = await AIResult.create({ incident_id: id, type: 'summary', result_text: result.result_text })

  res.json({ aiResult: { _id: saved._id.toString(), incident_id: id, type: 'summary', result_text: saved.result_text, created_at: saved.createdAt.toISOString() } })
}

export async function runAINextActions(req: Request, res: Response) {
  const { id } = req.params
  const data = await Incident.findById(id)
  if (!data) return res.status(404).json({ message: 'Incident not found' })

  const updates = await IncidentUpdate.find({ incident_id: id }).sort({ createdAt: -1 }).limit(20)

  const result = await generateAINextActions({
    title: data.title,
    description: data.description,
    updates: updates.map((u) => ({ message: u.message, author_name: u.author_name, created_at: u.createdAt.toISOString() })),
  })

  const saved = await AIResult.create({ incident_id: id, type: 'next_actions', result_text: result.result_text })

  res.json({
    aiResult: {
      _id: saved._id.toString(),
      incident_id: id,
      type: 'next_actions',
      result_text: saved.result_text,
      created_at: saved.createdAt.toISOString(),
    },
  })
}

export async function deleteIncident(req: Request, res: Response) {
  const { id } = req.params
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' })

  const incident = await Incident.findByIdAndDelete(id)
  if (!incident) return res.status(404).json({ message: 'Incident not found' })

  await IncidentUpdate.deleteMany({ incident_id: id })
  await AIResult.deleteMany({ incident_id: id })

  // No explicit broadcast requirement in prompt, but we can emit an update with stale card removed on refresh.
  res.json({ ok: true })
}

