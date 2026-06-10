import { LlmProvider } from './types'

export class OpenAiProvider implements LlmProvider {
  private readonly apiKey: string
  private readonly model: string

  constructor(apiKey = process.env.OPENAI_API_KEY ?? '', model = 'gpt-4o-mini') {
    if (!apiKey) throw new Error('OPENAI_API_KEY is not set')
    this.apiKey = apiKey
    this.model = model
  }

  async complete(system: string, user: string): Promise<string> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      throw new Error(`OpenAI API error ${res.status}: ${body}`)
    }

    const json = await res.json() as { choices: Array<{ message: { content: string } }> }
    return json.choices[0].message.content
  }
}
