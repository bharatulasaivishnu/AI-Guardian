import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase module
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'test-token' } } }),
    },
  },
}));

// Import after mock is set up
import { checkUrlReputation, ReputationNotConfiguredError } from '@/lib/urlReputation';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('urlReputation', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns a safe verdict when Safe Browsing finds no threats', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        verdict: {
          reputation: 'safe',
          threatTypes: [],
          summary: 'No threats found.',
          details: 'Clean result.',
        },
        source: 'google_safe_browsing',
      }),
    });

    const verdict = await checkUrlReputation('https://github.com');
    expect(verdict.reputation).toBe('safe');
    expect(verdict.threatTypes).toEqual([]);
  });

  it('returns an unsafe verdict when Safe Browsing flags the URL', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        verdict: {
          reputation: 'unsafe',
          threatTypes: ['MALWARE', 'SOCIAL_ENGINEERING'],
          summary: 'Flagged as malware, social engineering.',
          details: 'Do not visit.',
        },
        source: 'google_safe_browsing',
      }),
    });

    const verdict = await checkUrlReputation('http://evil.example.com');
    expect(verdict.reputation).toBe('unsafe');
    expect(verdict.threatTypes).toContain('MALWARE');
  });

  it('throws ReputationNotConfiguredError on 503', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ error: 'Not configured', code: 'not_configured' }),
    });

    await expect(checkUrlReputation('https://example.com')).rejects.toThrow(
      ReputationNotConfiguredError,
    );
  });

  it('throws on unexpected response shape', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ unexpected: true }),
    });

    await expect(checkUrlReputation('https://example.com')).rejects.toThrow(
      'unexpected response',
    );
  });

  it('throws on empty URL', async () => {
    await expect(checkUrlReputation('')).rejects.toThrow('No URL provided');
  });

  it('includes authorization header when session exists', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        verdict: {
          reputation: 'safe',
          threatTypes: [],
          summary: 'OK',
          details: 'Clean.',
        },
        source: 'google_safe_browsing',
      }),
    });

    await checkUrlReputation('https://example.com');
    const callArgs = mockFetch.mock.calls[0];
    const headers = callArgs?.[1]?.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer test-token');
    expect(headers.apikey).toBeDefined();
  });
});
