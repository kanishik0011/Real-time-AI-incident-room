export type Priority = 'Low' | 'Medium' | 'High'
export type Status = 'Open' | 'Investigating' | 'Resolved'

export type Incident = {
  _id: string
  title: string
  description: string
  priority: Priority
  status: Status
  reporter_name: string
  latest_update: string
  created_at: string
  updated_at: string
}

export type IncidentUpdate = {
  _id: string
  incident_id: string
  message: string
  author_name: string
  created_at: string
}

export type AIResultType = 'summary' | 'next_actions'

export type AIResult = {
  _id: string
  incident_id: string
  type: AIResultType
  result_text: string
  created_at: string
}

