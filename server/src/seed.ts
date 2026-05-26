import 'dotenv/config'
import mongoose from 'mongoose'
import { Incident } from './models/Incident'
import { IncidentUpdate } from './models/IncidentUpdate'
import { AIResult } from './models/AIResult'

const mongoUri = process.env.MONGO_URI

async function main() {
  if (!mongoUri) throw new Error('MONGO_URI is required')

  await mongoose.connect(mongoUri)

  await AIResult.deleteMany({})
  await IncidentUpdate.deleteMany({})
  await Incident.deleteMany({})

  const incidents = await Incident.insertMany([
    {
      title: 'Payment API failing for some users',
      description:
        'We are seeing elevated 5xx responses from the Payment API for a subset of users. Failures started ~10 minutes ago. Webhooks appear delayed.',
      priority: 'High',
      status: 'Investigating',
      reporter_name: 'Avery',
      latest_update: 'Investigating upstream latency and webhook delivery delays.',
    },
    {
      title: 'Customer upload document errors',
      description:
        'Users report intermittent failures when uploading documents. Error occurs after file selection; some files fail silently.',
      priority: 'Medium',
      status: 'Open',
      reporter_name: 'Sam',
      latest_update: 'Looking at storage write failures and permission changes.',
    },
    {
      title: 'Login error started 10 minutes ago',
      description:
        'Login requests are failing with auth errors. Started around 10 minutes ago after a minor config change. Increased customer reports.',
      priority: 'High',
      status: 'Open',
      reporter_name: 'Jordan',
      latest_update: 'Checking authentication service logs and recent deployments.',
    },
    {
      title: 'Dashboard not loading for some teams',
      description:
        'Certain users experience an infinite loading state for the dashboard. Some endpoints return 200 but UI still blocks.',
      priority: 'Low',
      status: 'Resolved',
      reporter_name: 'Lee',
      latest_update: 'Frontend cache mismatch fixed; API endpoints validated.',
    },
  ])

  const incidentMap = new Map<string, any>()
  for (const inc of incidents) incidentMap.set(inc._id.toString(), inc)

  const now = Date.now()
  const updatesByIncidentIndex = [
    [
      { message: 'Noticed spike in 5xx for /charge; subset of merchants affected.', author_name: 'Avery', offsetMin: 18 },
      { message: 'Webhook delivery delayed; retry queue growing.', author_name: 'Nina', offsetMin: 12 },
      { message: 'Upstream payment gateway showing intermittent timeouts.', author_name: 'Ravi', offsetMin: 6 },
    ],
    [
      { message: 'Storage write failures correlate with increased latency.', author_name: 'Sam', offsetMin: 16 },
      { message: 'Permission policy updated last deploy; verifying credentials.', author_name: 'Quinn', offsetMin: 9 },
    ],
    [
      { message: 'Auth errors increased after configuration change.', author_name: 'Jordan', offsetMin: 14 },
      { message: 'Investigating token validation and clock skew.', author_name: 'Maya', offsetMin: 8 },
      { message: 'Third-party identity provider health is stable.', author_name: 'Omar', offsetMin: 3 },
    ],
    [
      { message: 'Identified frontend infinite spinner due to stale client-side state.', author_name: 'Lee', offsetMin: 30 },
      { message: 'Deployed patch; dashboard now loads for affected users.', author_name: 'Lee', offsetMin: 20 },
    ],
  ]

  for (let i = 0; i < incidents.length; i++) {
    const inc = incidents[i]
    const updates = updatesByIncidentIndex[i]

    for (const u of updates) {
      await IncidentUpdate.create({
        incident_id: inc._id,
        message: u.message,
        author_name: u.author_name,
        createdAt: new Date(now - u.offsetMin * 60_000),
        updatedAt: new Date(now - u.offsetMin * 60_000),
      })
    }
  }

  // Seed AI results (optional) - leave empty so AI button generates on demand.

  console.log('Seed data inserted')
  await mongoose.disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

