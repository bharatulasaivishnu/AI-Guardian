/// <reference types="vitest/config" />
import { describe, it, expect } from 'vitest';
import { analyze, runSelfTests, selfTestSummary } from '@/lib/analysis';

describe('analyze', () => {
  it('returns an id, createdAt, and isDemo=true for rule-based results', () => {
    const r = analyze('URGENT: verify your account now at bit.ly/x', 'message');
    expect(r.id).toBeTruthy();
    expect(r.createdAt).toBeGreaterThan(0);
    expect(r.isDemo).toBe(true);
    expect(r.type).toBe('message');
  });

  it('marks empty messages as "unable"', () => {
    expect(analyze('', 'message').riskLevel).toBe('unable');
  });

  it('marks URLs without a dot as "unable"', () => {
    expect(analyze('login', 'url').riskLevel).toBe('unable');
  });

  it('includes general guidance and recommended actions for every non-unable result', () => {
    const r = analyze('https://github.com', 'url');
    expect(r.riskLevel).not.toBe('unable');
    expect(r.generalGuidance.length).toBeGreaterThan(0);
    expect(r.recommendedActions.length).toBeGreaterThan(0);
  });

  it('produces stable indicator labels across message and URL scans', () => {
    const msg = analyze('URGENT: your account is suspended. Click bit.ly/x', 'message');
    const url = analyze('http://secure-login.paypal-verify.xyz/login', 'url');
    expect(msg.indicators.every((i) => typeof i.label === 'string')).toBe(true);
    expect(url.indicators.every((i) => typeof i.label === 'string')).toBe(true);
  });
});

describe('self-test calibration suite', () => {
  const results = runSelfTests();

  it('runs 21 test cases', () => {
    expect(results.length).toBe(21);
  });

  it('reports a consistent summary', () => {
    const s = selfTestSummary();
    expect(s.total).toBe(21);
    expect(s.passed + s.failed).toBe(21);
    expect(s.results.length).toBe(21);
  });

  // Explicit per-case assertions so a regression names the failing input.
  it.each(results.map((r) => [r.name, r] as const))(
    'case "%s" passes',
    (_name, r) => {
      expect(r.passed, r.reason).toBe(true);
    },
  );
});
