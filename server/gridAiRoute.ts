/**
 * Framework-agnostic AI route handler for the grid.
 *
 * Usage with Express:
 *   import express from 'express'
 *   import { handleGridAiRequest } from './gridAiRoute'
 *   const app = express()
 *   app.use(express.json())
 *   app.post('/api/grid-ai', async (req, res) => {
 *     const result = await handleGridAiRequest(req.body)
 *     res.json(result)
 *   })
 *
 * Usage with Next.js App Router:
 *   import { handleGridAiRequest } from '@/server/gridAiRoute'
 *   export async function POST(req: Request) {
 *     const body = await req.json()
 *     const result = await handleGridAiRequest(body)
 *     return Response.json(result)
 *   }
 *
 * Set LLM_PROVIDER=openai to use OpenAI; defaults to Anthropic.
 * Set ANTHROPIC_API_KEY or OPENAI_API_KEY in your environment.
 */

import { AnthropicProvider } from './providers/anthropic'
import { OpenAiProvider } from './providers/openai'
import { LlmProvider } from './providers/types'
import { AiCommandSchema } from '../src/components/DataGrid/ai/schema'

interface ColumnMeta {
  id: string
  header: string
  filterType?: string
}

interface GridAiRequestBody {
  prompt: string
  columns: ColumnMeta[]
  currentState: {
    sorts?: Array<{ columnId: string; direction: string }>
    filters?: Array<{ columnId: string; operator: string; value: unknown }>
    grouping?: string[]
  }
}

function buildSystemPrompt(columns: ColumnMeta[]): string {
  const colDescriptions = columns
    .map((c) => `  - id="${c.id}" header="${c.header}"${c.filterType ? ` filterType="${c.filterType}"` : ''}`)
    .join('\n')

  return `You are a data grid assistant. The user will describe what they want to see in the grid in natural language, and you must respond with a JSON object that controls sorting, filtering, and grouping.

Available columns:
${colDescriptions}

Response format (JSON only — no markdown, no explanation outside the JSON):
{
  "sorts": [{ "columnId": "<id>", "direction": "asc" | "desc" }],
  "filters": [{ "columnId": "<id>", "operator": "eq" | "contains" | "gt" | "gte" | "lt" | "lte" | "between" | "in", "value": <string | number | array> }],
  "grouping": ["<columnId>"],
  "reset": false,
  "explanation": "<one sentence describing what you did>"
}

Rules:
- Only include fields that should change. Omit "sorts", "filters", or "grouping" if you are not changing them.
- Set "reset": true to clear all sorts, filters, and grouping.
- Only use column ids from the list above. Ignore any column the user mentions that does not exist.
- For "select" filterType columns, "operator" must be "eq" or "in".
- For "number" or "date" filterType columns, "operator" can be "gt", "gte", "lt", "lte", "between", "eq".
- For "text" filterType columns, "operator" must be "contains" or "eq".
- "between" requires value to be a two-element array: [min, max].
- "in" requires value to be an array of strings or numbers.
- Always include a concise "explanation" field.`
}

function buildUserPrompt(body: GridAiRequestBody): string {
  const stateDescription = JSON.stringify(body.currentState, null, 2)
  return `Current grid state:\n${stateDescription}\n\nUser request: ${body.prompt}`
}

function getProvider(): LlmProvider {
  if (process.env.LLM_PROVIDER === 'openai') {
    return new OpenAiProvider()
  }
  return new AnthropicProvider()
}

function extractJson(raw: string): string {
  // Strip accidental markdown code fences just in case.
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  return fenced ? fenced[1].trim() : raw.trim()
}

const MAX_PROMPT_LENGTH = 1000

export async function handleGridAiRequest(body: GridAiRequestBody): Promise<unknown> {
  if (!body.prompt || typeof body.prompt !== 'string') {
    throw new Error('Invalid request body: prompt is required')
  }
  if (body.prompt.length > MAX_PROMPT_LENGTH) {
    throw new Error(`Prompt exceeds maximum length of ${MAX_PROMPT_LENGTH} characters`)
  }
  if (!Array.isArray(body.columns) || body.columns.length === 0) {
    throw new Error('Invalid request body: columns must be a non-empty array')
  }

  const provider = getProvider()
  const system = buildSystemPrompt(body.columns)
  const user = buildUserPrompt(body)

  const raw = await provider.complete(system, user)
  const jsonStr = extractJson(raw)

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonStr)
  } catch {
    throw new Error('AI returned an invalid response. Please try again.')
  }

  return AiCommandSchema.parse(parsed)
}
