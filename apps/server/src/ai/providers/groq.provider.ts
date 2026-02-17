import Groq from 'groq-sdk';
import OpenAI from 'openai';
import type { AIProvider, ChatMessage, ChatOptions, EmbedOptions } from '@clawdblox/memoryweave-shared';

const API_TIMEOUT_MS = 30_000;

export class GroqProvider implements AIProvider {
  readonly name = 'groq';
  private readonly client: Groq;
  private readonly embedClient: OpenAI;
  private readonly chatModel: string;
  private readonly embedModel: string;

  constructor(apiKey: string, chatModel: string, embedModel: string, openaiApiKey?: string) {
    this.client = new Groq({ apiKey, timeout: API_TIMEOUT_MS });
    this.embedClient = openaiApiKey
      ? new OpenAI({ apiKey: openaiApiKey, timeout: API_TIMEOUT_MS })
      : (undefined as unknown as OpenAI);
    this.chatModel = chatModel;
    this.embedModel = embedModel;
  }

  async *chat(messages: ChatMessage[], options?: ChatOptions): AsyncGenerator<string, void, unknown> {
    const stream = await this.client.chat.completions.create({
      model: options?.model || this.chatModel,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.max_tokens ?? 1024,
      stop: options?.stop,
      response_format: options?.json ? { type: 'json_object' } : undefined,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        yield content;
      }
    }
  }

  async embed(text: string, options?: EmbedOptions): Promise<number[]> {
    if (!this.embedClient) {
      throw new Error('No OpenAI API key configured. Set OPENAI_API_KEY for embeddings.');
    }
    try {
      const response = await this.embedClient.embeddings.create({
        model: options?.model || this.embedModel,
        input: text,
      });

      const embedding = response.data?.[0]?.embedding;
      if (!Array.isArray(embedding) || embedding.length === 0) {
        throw new Error('Empty embedding response from OpenAI');
      }

      return embedding;
    } catch (err) {
      const error = new Error(
        `Embedding service unavailable: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
      (error as any).statusCode = 503;
      throw error;
    }
  }
}
