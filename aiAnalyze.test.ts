/// <reference types="vitest/config" />
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { aiAnalyze, AiNotConfiguredError } from '@/lib/aiAnalyze';

// Mock the supabase module so aiAnalyze doesn't need real credentials.
// vi.hoisted ensures the mock fn exists before the hoisted vi.mock factory runs.
const { getSessionMock } = vi.hoisted(() => ({
  getSessionMock: vi.fn(),
}));
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: getSessionMock,
    },
  },
}));

const VITE_SUPABASE_URL = 'https://example.supabase.co';
const VITE_SUPABASE_ANON_KEY = 'anon-key';

vi.stubEnv('VITE_SUPABASE_URL', VITE_SUPABASE_URL);
vi.stubEnv('VITE_SUPABASE_ANON_KEY', VITE_SUPABASE_ANON_KEY);

beforeEach(() => {
  getSessionMock.mockResolvedValue({ data: { session: { access_token: 'tok' } } });
  vi.spyOn(globalThis, 'fetch');
  vi.mocked(globalThis.fetch).mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

function mockFetch(response: Response) {
  vi.mocked(globalThis.fetch).mockResolvedValue(response);
}

describe('aiAnalyze', () => {
  it('throws on empty input', async () => {
    await expect(aiAnalyze('   ', 'message')).rejects.toThrow('Nothing to analyze');
  });

  it('throws on input over 4000 characters', async () => {
    await expect(aiAnalyze('a'.repeat(4001), 'message')).rejects.toThrow(
      /too long/i,
    );
  });

  it('throws AiNotConfiguredError on a 503 response', async () => {
    mockFetch(
      new Response(JSON.stringify({ error: 'not configured', code: 'not_configured' }), {
        status: 503,
      }),
    );
    await expect(aiAnalyze('hello', 'message')).rejects.toBeInstanceOf(
      AiNotConfiguredError,
    );
  });

  it('surfaces the server error message on a 502', async () => {
    mockFetch(
      new Response(
        JSON.stringify({ error: 'AI service returned an error', code: 'ai_service_error' }),
        { status: 502 },
      ),
    );
    await expect(aiAnalyze('hello', 'message')).rejects.toThrow(
      'AI service returned an error',
    );
  });

  it('returns the parsed verdict on a 200', async () => {
    const verdict = {
      riskLevel: 'high',
      summary: 'This is a scam.',
      indicators: [{ label: 'Urgency', explanation: 'Pressure tactic' }],
      confidence: 'high',
    };
    mockFetch(
      new Response(JSON.stringify({ verdict, source: 'openai' }), { status: 200 }),
    );
    const result = await aiAnalyze('URGENT: verify now', 'message');
    expect(result.riskLevel).toBe('high');
    expect(result.indicators).toHaveLength(1);
    const call = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(call?.[1]?.method).toBe('POST');
  });

  it('throws when the response body is missing the verdict', async () => {
    mockFetch(new Response(JSON.stringify({ source: 'openai' }), { status: 200 }));
    await expect(aiAnalyze('hello', 'url')).rejects.toThrow(/unexpected response/i);
  });

  it('sends the text and type in the request body', async () => {
    mockFetch(
      new Response(
        JSON.stringify({
          verdict: { riskLevel: 'low', summary: 'ok', indicators: [], confidence: 'high' },
          source: 'openai',
        }),
        { status: 200 },
      ),
    );
    await aiAnalyze('https://github.com', 'url');
    const call = vi.mocked(globalThis.fetch).mock.calls[0];
    const body = JSON.parse(String(call?.[1]?.body)) as { text: string; type: string };
    expect(body.text).toBe('https://github.com');
    expect(body.type).toBe('url');
  });
});
