import { LlmProvider } from './types'

export class AnthropicProvider implements LlmProvider {
  private readonly apiKey: string
  private readonly model: string

  constructor(apiKey = process.env.ANTHROPIC_API_KEY ?? '', model = 'claude-haiku-4-5-20251001') {
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')
    this.apiKey = apiKey
    this.model = model
  }

  async complete(system: string, user: string): Promise<string> {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1024,
        system,
        messages: [{ role: 'user', content: user }],
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error(`Anthropic API error ${res.status}: ${body}`)
      throw new Error(`AI request failed (status ${res.status})`)
    }

    const json = await res.json() as { content: Array<{ type: string; text: string }> }
    const textBlock = json.content.find((b) => b.type === 'text')
    if (!textBlock) throw new Error('No text block in Anthropic response')
    return textBlock.text
  }
}
