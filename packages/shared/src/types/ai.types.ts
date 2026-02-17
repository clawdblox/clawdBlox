export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stop?: string[];
  json?: boolean;
}

export interface EmbedOptions {
  model?: string;
}

export interface AIProvider {
  /** Stream chat completion, yielding tokens one at a time */
  chat(messages: ChatMessage[], options?: ChatOptions): AsyncGenerator<string, void, unknown>;

  /** Generate embedding vector for text */
  embed(text: string, options?: EmbedOptions): Promise<number[]>;

  /** Provider name for logging */
  readonly name: string;
}

export interface AIProviderConfig {
  provider: 'groq';
  apiKey: string;
  chatModel?: string;
  embedModel?: string;
}
