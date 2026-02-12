import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock groq-sdk
vi.mock('groq-sdk', () => {
  return {
    default: class MockGroq {
      chat = {
        completions: {
          create: vi.fn(),
        },
      };
      embeddings = {
        create: vi.fn(),
      };
    },
  };
});

import { GroqProvider } from '../../../apps/server/src/ai/providers/groq.provider';

describe('GroqProvider', () => {
  let provider: GroqProvider;

  beforeEach(() => {
    provider = new GroqProvider('test-api-key', 'meta-llama/llama-3-70b-8192', 'text-embedding-3-small');
  });

  it('should have correct name', () => {
    expect(provider.name).toBe('groq');
  });

  it('should stream chat completions', async () => {
    const mockChunks = [
      { choices: [{ delta: { content: 'Hello' } }] },
      { choices: [{ delta: { content: ' World' } }] },
      { choices: [{ delta: { content: '!' } }] },
    ];

    const mockStream = (async function* () {
      for (const chunk of mockChunks) yield chunk;
    })();

    (provider as any).client.chat.completions.create = vi.fn().mockResolvedValue(mockStream);

    const tokens: string[] = [];
    for await (const token of provider.chat([
      { role: 'user', content: 'Say hello' },
    ])) {
      tokens.push(token);
    }

    expect(tokens).toEqual(['Hello', ' World', '!']);
  });

  it('should handle empty chunks', async () => {
    const mockStream = (async function* () {
      yield { choices: [{ delta: { content: 'Hi' } }] };
      yield { choices: [{ delta: {} }] };
      yield { choices: [{ delta: { content: '!' } }] };
    })();

    (provider as any).client.chat.completions.create = vi.fn().mockResolvedValue(mockStream);

    const tokens: string[] = [];
    for await (const token of provider.chat([
      { role: 'user', content: 'Test' },
    ])) {
      tokens.push(token);
    }

    expect(tokens).toEqual(['Hi', '!']);
  });

  it('should pass correct parameters', async () => {
    const mockStream = (async function* () {})();
    const createMock = vi.fn().mockResolvedValue(mockStream);
    (provider as any).client.chat.completions.create = createMock;

    const messages = [{ role: 'user' as const, content: 'Test' }];
    const gen = provider.chat(messages, { temperature: 0.5, max_tokens: 100 });
    for await (const _ of gen) {}

    expect(createMock).toHaveBeenCalledWith(expect.objectContaining({
      model: 'meta-llama/llama-3-70b-8192',
      temperature: 0.5,
      max_tokens: 100,
      stream: true,
    }));
  });

  it('should generate embeddings using the embeddings API', async () => {
    const mockEmbedding = Array.from({ length: 1536 }, (_, i) => i / 1536);
    (provider as any).client.embeddings.create = vi.fn().mockResolvedValue({
      data: [{ embedding: mockEmbedding }],
    });

    const embedding = await provider.embed('test text');
    expect(embedding).toHaveLength(1536);
    expect((provider as any).client.embeddings.create).toHaveBeenCalledWith({
      model: 'text-embedding-3-small',
      input: 'test text',
    });
  });

  it('should throw 503 when embeddings API fails', async () => {
    (provider as any).client.embeddings.create = vi.fn().mockRejectedValue(new Error('Service unavailable'));

    await expect(provider.embed('test text')).rejects.toThrow('Embedding service unavailable');
    try {
      await provider.embed('test text');
    } catch (err: any) {
      expect(err.statusCode).toBe(503);
    }
  });

  it('should throw 503 when embeddings response is empty', async () => {
    (provider as any).client.embeddings.create = vi.fn().mockResolvedValue({
      data: [],
    });

    await expect(provider.embed('test text')).rejects.toThrow('Embedding service unavailable');
  });
});
