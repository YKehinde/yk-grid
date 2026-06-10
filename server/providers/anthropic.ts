// Stub — implemented in phase 11.
import { LlmProvider } from './types'

export class AnthropicProvider implements LlmProvider {
  async complete(_system: string, _user: string): Promise<string> {
    throw new Error('AnthropicProvider not yet implemented — phase 11')
  }
}
