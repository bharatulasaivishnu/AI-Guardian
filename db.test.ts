/// <reference types="vitest/config" />
import { describe, it, expect } from 'vitest';
import {
  rowToContact,
  rowToIncident,
  rowToAnalysis,
  type TrustedContactRow,
  type IncidentReportRow,
  type AnalysisHistoryRow,
} from '@/lib/db';

describe('rowToContact', () => {
  it('maps snake_case row to the frontend shape', () => {
    const row: TrustedContactRow = {
      id: 'c1',
      user_id: 'u1',
      name: 'Jane',
      phone: '+1 555',
      relationship: 'Parent',
      created_at: '2026-01-01T00:00:00Z',
    };
    expect(rowToContact(row)).toEqual({
      id: 'c1',
      name: 'Jane',
      phone: '+1 555',
      relationship: 'Parent',
    });
  });

  it('does not expose user_id to the frontend type', () => {
    const row: TrustedContactRow = {
      id: 'c1',
      user_id: 'u1',
      name: 'Jane',
      phone: '+1 555',
      relationship: 'Parent',
      created_at: '2026-01-01T00:00:00Z',
    };
    const out = rowToContact(row);
    expect(out).not.toHaveProperty('user_id');
    expect(out).not.toHaveProperty('created_at');
  });
});

describe('rowToIncident', () => {
  it('converts created_at ISO string to a numeric timestamp', () => {
    const row: IncidentReportRow = {
      id: 'i1',
      user_id: 'u1',
      category: 'Theft',
      location: 'Library',
      description: 'desc',
      urgency: 'medium',
      status: 'submitted',
      created_at: '2026-01-02T03:04:05Z',
    };
    const out = rowToIncident(row);
    expect(out.id).toBe('i1');
    expect(out.createdAt).toBe(new Date('2026-01-02T03:04:05Z').getTime());
    expect(out.status).toBe('submitted');
  });
});

describe('rowToAnalysis', () => {
  it('maps all fields and coerces created_at to a timestamp', () => {
    const row: AnalysisHistoryRow = {
      id: 'a1',
      user_id: 'u1',
      type: 'message',
      input: 'hello',
      risk_level: 'medium',
      summary: 's',
      indicators: [{ label: 'x', matched: true, explanation: 'e' }],
      general_guidance: ['g1'],
      recommended_actions: ['r1'],
      is_demo: true,
      created_at: '2026-03-04T05:06:07Z',
    };
    const out = rowToAnalysis(row);
    expect(out.id).toBe('a1');
    expect(out.type).toBe('message');
    expect(out.riskLevel).toBe('medium');
    expect(out.isDemo).toBe(true);
    expect(out.createdAt).toBe(new Date('2026-03-04T05:06:07Z').getTime());
    expect(out.indicators).toHaveLength(1);
  });

  it('falls back to empty arrays when guidance/actions are missing', () => {
    const row = {
      id: 'a2',
      user_id: 'u1',
      type: 'url' as const,
      input: 'https://x.com',
      risk_level: 'low' as const,
      summary: 's',
      indicators: null,
      general_guidance: null,
      recommended_actions: null,
      is_demo: false,
      created_at: '2026-03-04T05:06:07Z',
    };
    const out = rowToAnalysis(row as unknown as AnalysisHistoryRow);
    expect(out.indicators).toEqual([]);
    expect(out.generalGuidance).toEqual([]);
    expect(out.recommendedActions).toEqual([]);
  });
});
