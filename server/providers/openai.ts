// Stub — shows the interface is provider-agnostic. Implemented in phase 11.
import { LlmProvider } from './types'

export class OpenAiProvider implements LlmProvider {
  async complete(_system: string, _user: string): Promise<string> {
    throw new Error('OpenAiProvider not yet implemented — phase 11')
  }
}
