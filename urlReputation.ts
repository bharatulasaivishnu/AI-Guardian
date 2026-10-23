import { supabase } from '@/lib/supabase';

export interface ReputationVerdict {
  reputation: 'safe' | 'unsafe' | 'unrated';
  threatTypes: string[];
  summary: string;
  details: string;
}

export interface ReputationResponse {
  verdict: ReputationVerdict;
  source: 'google_safe_browsing';
}

export class ReputationNotConfiguredError extends Error {
  code = 'not_configured' as const;
  constructor() {
    super(
      'URL reputation lookup is not configured yet. A Google Safe Browsing API key must be added as a Supabase secret to enable it.',
    );
    this.name = 'ReputationNotConfiguredError';
  }
}

export async function checkUrlReputation(url: string): Promise<ReputationVerdict> {
  if (!url.trim()) {
    throw new Error('No URL provided.');
  }

  const sessionRes = await supabase.auth.getSession();
  const accessToken = sessionRes.data.session?.access_token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/url-reputation`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ url }),
  });

  if (res.status === 503) {
    throw new ReputationNotConfiguredError();
  }
  if (!res.ok) {
    let message = `Reputation lookup failed (${res.status}).`;
    try {
      const body = await res.json();
      if (body?.error && typeof body.error === 'string') {
        message = body.error;
      }
    } catch {
      // keep default message
    }
    throw new Error(message);
  }

  const data = (await res.json()) as ReputationResponse;
  if (!data?.verdict || !data.verdict.reputation) {
    throw new Error('The reputation service returned an unexpected response. Please try again.');
  }
  return data.verdict;
}
