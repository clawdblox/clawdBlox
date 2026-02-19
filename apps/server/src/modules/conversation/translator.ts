import type { AIProvider, ChatMessage } from '@clawdblox/memoryweave-shared';
import { env } from '../../config/env';

const TRANSLATE_TIMEOUT_MS = 10_000;

export async function translateResponse(
  provider: AIProvider,
  text: string,
  targetLanguage: string,
): Promise<string> {
  const messages: ChatMessage[] = [
    {
      role: 'system',
      content: `Translate the following text to ${targetLanguage}. Preserve *action formatting*. Output ONLY the translation, nothing else.`,
    },
    { role: 'user', content: text },
  ];

  try {
    let translated = '';
    const timeout = AbortSignal.timeout(TRANSLATE_TIMEOUT_MS);

    for await (const token of provider.chat(messages, {
      model: env.GROQ_TRANSLATE_MODEL,
      temperature: 0.2,
      max_tokens: 512,
    })) {
      if (timeout.aborted) {
        console.warn('Translation timeout, returning original text');
        return text;
      }
      translated += token;
    }

    return translated || text;
  } catch (err) {
    console.warn('Translation failed, returning original text:', err instanceof Error ? err.message : err);
    return text;
  }
}
