import { GoogleGenerativeAI } from '@google/generative-ai'

type UpdateForAI = {
  message: string
  author_name: string
  created_at: string
}

type AISummaryInput = {
  title: string
  description: string
  updates: UpdateForAI[]
}

function fallbackRules(input: AISummaryInput) {
  const text = `${input.title}\n${input.description}\n${input.updates.map((u) => u.message).join('\n')}`.toLowerCase()

  const nextActions: string[] = []

  const pickBy = [
    {
      when: ['payment', 'billing', 'card', 'charge'],
      actions: [
        'Check payment service logs for recent errors/latency.',
        'Verify upstream PSP status and webhook delivery.',
        'Confirm user account/payment tokens are still valid.',
      ],
    },
    {
      when: ['login', 'auth', 'authentication', 'sso'],
      actions: [
        'Check authentication service logs and recent deployments.',
        'Review token/session validation and clock skew.',
        'Verify third-party identity provider health.',
      ],
    },
    {
      when: ['upload', 'storage', 's3', 'blob', 'document'],
      actions: [
        'Check storage service logs for failed writes.',
        'Verify credentials/permissions for the storage backend.',
        'Confirm file size/type limits and virus scanning pipeline health.',
      ],
    },
    {
      when: ['dashboard', 'frontend', 'api', 'backend'],
      actions: [
        'Check frontend build/runtime logs and console errors.',
        'Verify API endpoints for auth/timeouts/5xx.',
        'Run health checks on dependent services.',
      ],
    },
  ]

  const rule = pickBy.find((r) => r.when.some((k) => text.includes(k)))
  if (rule) nextActions.push(...rule.actions)
  else {
    nextActions.push(
      'Gather latest incident updates and validate impacted components.',
      'Review system metrics (latency/5xx/errors) and recent deploys.',
      'Coordinate mitigation and communicate current status to stakeholders.',
    )
  }

  const updateSnippet =
    input.updates.length > 0
      ? ` Latest notes: ${input.updates.slice(0, 3).map((u) => u.message).join(' | ')}`
      : ''

  return {
    summary: `Incident "${input.title}" is active.${updateSnippet} Priority checks should focus on the symptoms described and recent timeline entries.`,
    nextActions,
  }
}

const geminiAvailable = () => !!process.env.GEMINI_API_KEY?.trim()

async function callGemini(prompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
  const result = await model.generateContent(prompt)
  return result.response.text() || ''
}

function buildPrompt(input: AISummaryInput) {
  const recentUpdates = input.updates
    .slice(0, 10)
    .map((u) => `- (${u.created_at}) ${u.author_name}: ${u.message}`)
    .join('\n')

  return `Analyze this incident:

Title:
${input.title}

Description:
${input.description}

Recent Updates:
${recentUpdates || '(none)'}

Return:

Summary:
- concise summary

Next Actions:
- action items list
`
}

export async function generateAISummary(input: AISummaryInput): Promise<{ result_text: string; usedFallback: boolean }> {
  const fallback = fallbackRules(input)

  if (!geminiAvailable()) {
    return { result_text: fallback.summary, usedFallback: true }
  }

  try {
    const text = await callGemini(buildPrompt(input))
    const m = text.match(/Summary\s*:\s*([\s\S]*?)(Next Actions\s*:|$)/i)
    const summary = m?.[1]?.trim() ? m[1].trim() : text.trim()
    return { result_text: summary || fallback.summary, usedFallback: false }
  } catch {
    return { result_text: fallback.summary, usedFallback: true }
  }
}

export async function generateAINextActions(input: AISummaryInput): Promise<{ result_text: string; usedFallback: boolean }> {
  const fallback = fallbackRules(input)

  if (!geminiAvailable()) {
    return {
      result_text: fallback.nextActions.map((a) => `- ${a}`).join('\n'),
      usedFallback: true,
    }
  }

  try {
    const text = await callGemini(buildPrompt(input))
    const m = text.match(/Next Actions\s*:\s*([\s\S]*)/i)
    const next = m?.[1]?.trim() ? m[1].trim() : text.trim()
    return {
      result_text: next || fallback.nextActions.map((a) => `- ${a}`).join('\n'),
      usedFallback: false,
    }
  } catch {
    return {
      result_text: fallback.nextActions.map((a) => `- ${a}`).join('\n'),
      usedFallback: true,
    }
  }
}
