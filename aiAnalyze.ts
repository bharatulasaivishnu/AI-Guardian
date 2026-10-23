import { supabase } from '@/lib/supabase';

export interface AiIndicator {
  label: string;
  explanation: string;
}

export interface AiVerdict {
  riskLevel: 'low' | 'medium' | 'high';
  summary: string;
  indicators: AiIndicator[];
  confidence: 'low' | 'medium' | 'high';
}

export interface AiAnalysisResponse {
  verdict: AiVerdict;
  source: 'openai';
}

export class AiNotConfiguredError extends Error {
  code = 'not_configured' as const;
  constructor() {
    super(
      'AI analysis is not configured yet. An OpenAI API key must be added as a Supabase secret to enable it.',
    );
    this.name = 'AiNotConfiguredError';
  }
}

export async function aiAnalyze(text: string, type: 'message' | 'url'): Promise<AiVerdict> {
  if (!text.trim()) {
    throw new Error('Nothing to analyze.');
  }
  if (text.length > 4000) {
    throw new Error('Input is too long (maximum 4000 characters).');
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

  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-analyze`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ text, type }),
  });

  if (res.status === 503) {
    throw new AiNotConfiguredError();
  }
  if (!res.ok) {
    let message = `Analysis request failed (${res.status}).`;
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

  const data = (await res.json()) as AiAnalysisResponse;
  if (!data?.verdict || !data.verdict.riskLevel) {
    throw new Error('The AI service returned an unexpected response. Please try again.');
  }
  return data.verdict;
}
