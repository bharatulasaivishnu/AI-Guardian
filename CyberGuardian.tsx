import { useState } from 'react';
import {
  Lock,
  ScanLine,
  Link2,
  MessageSquare,
  XCircle,
  Lightbulb,
  History,
  AlertTriangle,
  Info,
  BookOpen,
  FlaskConical,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { Card, SectionTitle, Button, Textarea, Input, EmptyState, Notice, Badge } from '@/components/ui';
import { analyze, selfTestSummary } from '@/lib/analysis';
import type { TestResult } from '@/lib/analysis';
import { riskConfig } from '@/lib/riskConfig';
import { useData } from '@/lib/dataContext';
import { aiAnalyze, AiNotConfiguredError } from '@/lib/aiAnalyze';
import type { AiVerdict } from '@/lib/aiAnalyze';
import { checkUrlReputation, ReputationNotConfiguredError } from '@/lib/urlReputation';
import type { ReputationVerdict } from '@/lib/urlReputation';
import { useLocalStorage } from '@/lib/useLocalStorage';
import type { AnalysisResult } from '@/types';
import { Sparkles, Zap, ShieldAlert, ShieldCheck } from 'lucide-react';

type Tab = 'message' | 'url';

const SAMPLE_MESSAGES: { label: string; text: string; tag: 'scam' | 'legit' | 'ambiguous' }[] = [
  {
    label: 'Scam: package phishing',
    tag: 'scam',
    text: 'URGENT: Your FedEx package #A22 is held. Verify your address now at bit.ly/fedex-reschedule to avoid return.',
  },
  {
    label: 'Scam: advance-fee',
    tag: 'scam',
    text: "Hi dear, I'm General Miller stationed overseas. I found $4.5M in a raid and need your help transferring it. Kindly keep this secret.",
  },
  {
    label: 'Scam: gift-card impersonation',
    tag: 'scam',
    text: "Hey mom, I dropped my phone. This is my new number. I need a $50 Amazon gift card for a school project ASAP, please don't call.",
  },
  {
    label: 'Legit: shipping notice',
    tag: 'legit',
    text: 'Your Amazon order #112-9 has shipped and will arrive Tuesday. Track at amazon.com/track/112-9.',
  },
  {
    label: 'Ambiguous: rewards expiry',
    tag: 'ambiguous',
    text: 'Final notice: your rewards points expire this month. Log in to redeem before they are gone.',
  },
];

const SAMPLE_URLS: { label: string; text: string; tag: 'suspicious' | 'legit' }[] = [
  {
    label: 'Suspicious: spoofed PayPal',
    tag: 'suspicious',
    text: 'http://secure-login.paypal-verify.account-update.xyz/login',
  },
  {
    label: 'Suspicious: IP + brand path',
    tag: 'suspicious',
    text: 'http://192.168.44.12/wellsfargo/verify',
  },
  {
    label: 'Legit: GitHub',
    tag: 'legit',
    text: 'https://github.com',
  },
  {
    label: 'Legit: PayPal signin',
    tag: 'legit',
    text: 'https://www.paypal.com/signin',
  },
];

export function CyberGuardian() {
  const [tab, setTab] = useState<Tab>('message');
  const [message, setMessage] = useState('');
  const [url, setUrl] = useState('');
  const { history, addAnalysis, clearAnalysisHistory, loading } = useData();
  const [current, setCurrent] = useState<AnalysisResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [showTests, setShowTests] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);
  const [saveErr, setSaveErr] = useState('');
  const [aiErr, setAiErr] = useState('');
  const [reputationErr, setReputationErr] = useState('');
  const [useAi, setUseAi] = useLocalStorage<boolean>('ag_use_ai', false);

  function buildAiResult(input: string, type: Tab, verdict: AiVerdict): AnalysisResult {
    return {
      id: `ai_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type,
      input,
      riskLevel: verdict.riskLevel,
      summary: verdict.summary,
      indicators: verdict.indicators.map((ind) => ({
        label: ind.label,
        matched: true,
        explanation: ind.explanation,
      })),
      generalGuidance: [
        'Never share codes, passwords, or financial details with unsolicited contacts.',
        'When in doubt, contact the organization directly through their official website or phone number.',
      ],
      recommendedActions: [
        verdict.riskLevel === 'high'
          ? 'Do not click any links or reply. Block and report the sender.'
          : 'Verify independently before taking any action.',
      ],
      isDemo: false,
      createdAt: Date.now(),
    };
  }

  async function runAnalysis() {
    const input = tab === 'message' ? message : url;
    if (!input.trim()) return;
    setScanning(true);
    setAiErr('');
    setSaveErr('');
    setReputationErr('');
    try {
      let result: AnalysisResult;

      if (useAi) {
        const verdict = await aiAnalyze(input, tab);
        result = buildAiResult(input, tab, verdict);
      } else {
        result = await new Promise<AnalysisResult>((resolve) =>
          setTimeout(() => resolve(analyze(input, tab)), 350),
        );
      }

      // For URLs, also run a live reputation check in parallel
      if (tab === 'url') {
        try {
          const reputation = await checkUrlReputation(input);
          result = mergeReputation(result, reputation);
        } catch (e) {
          if (e instanceof ReputationNotConfiguredError) {
            // Non-fatal: reputation just isn't configured. Keep pattern result.
            setReputationErr(e.message);
          } else {
            setReputationErr(e instanceof Error ? e.message : 'Reputation lookup failed.');
          }
        }
      }

      setCurrent(result);
      addAnalysis(result).catch((e) => {
        setSaveErr(e instanceof Error ? e.message : 'Failed to save analysis.');
      });
    } catch (e) {
      if (e instanceof AiNotConfiguredError) {
        setAiErr(e.message);
        setUseAi(false);
      } else {
        setAiErr(e instanceof Error ? e.message : 'Analysis failed.');
      }
    } finally {
      setScanning(false);
    }
  }

  function loadSample(text: string) {
    if (tab === 'message') setMessage(text);
    else setUrl(text);
  }

  function loadFromHistory(r: AnalysisResult) {
    setTab(r.type);
    if (r.type === 'message') setMessage(r.input);
    else setUrl(r.input);
    setCurrent(r);
  }

  function clearHistory() {
    clearAnalysisHistory().catch((e) => {
      setSaveErr(e instanceof Error ? e.message : 'Failed to clear history.');
    });
  }

  function runTests() {
    setTestResults(selfTestSummary().results);
  }

  function mergeReputation(result: AnalysisResult, rep: ReputationVerdict): AnalysisResult {
    const updated: AnalysisResult = {
      ...result,
      reputation: rep,
    };

    if (rep.reputation === 'unsafe') {
      // Escalate to high risk if Safe Browsing flagged it
      updated.riskLevel = 'high';
      updated.indicators = [
        ...result.indicators,
        {
          label: `Google Safe Browsing: ${rep.threatTypes.join(', ')}`,
          matched: true,
          explanation: rep.details,
        },
      ];
      updated.summary = rep.summary;
      updated.recommendedActions = [
        'This URL is on Google\'s blocklist. Do not visit it or enter any information.',
        ...updated.recommendedActions,
      ];
    } else if (rep.reputation === 'safe' && result.riskLevel === 'low') {
      updated.summary = `${result.summary} Google Safe Browsing found no known threats.`;
    }

    return updated;
  }

  const samples = tab === 'message' ? SAMPLE_MESSAGES : SAMPLE_URLS;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <SectionTitle
        title="Cybersecurity Guardian"
        subtitle="Analyze suspicious messages and URLs for scam and phishing warning signs."
        icon={<Lock size={18} />}
      />

      <Notice tone="info" title="How analysis works">
        By default, this tool uses <strong>rule-based pattern detection</strong>
        running in your browser. Enable <strong>AI analysis</strong> below for a
        deeper assessment powered by a real language model. Risk assessments can
        be incorrect — a "Low" result never means a URL is safe, only that no
        strong red flags were found.
      </Notice>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0a1428]/60 px-4 py-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Zap size={14} className={useAi ? 'text-blue-300' : 'text-slate-600'} />
          <span>
            {useAi ? (
              <>AI analysis <span className="text-slate-600">(real LLM via secure server)</span></>
            ) : (
              <>Rule-based analysis <span className="text-slate-600">(local patterns)</span></>
            )}
          </span>
        </div>
        <button
          onClick={() => { setUseAi((v) => !v); setAiErr(''); }}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
            useAi
              ? 'border-blue-500/40 bg-blue-500/15 text-blue-200'
              : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/10'
          }`}
          aria-pressed={useAi}
        >
          <Sparkles size={12} /> {useAi ? 'AI on' : 'Enable AI'}
        </button>
      </div>

      {aiErr && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <AlertTriangle size={15} className="mt-0.5 shrink-0" />
          <span>{aiErr}</span>
        </div>
      )}

      {reputationErr && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <Info size={15} className="mt-0.5 shrink-0" />
          <span>{reputationErr}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-white/10 bg-[#0a1428]/60 p-1">
        <TabButton active={tab === 'message'} onClick={() => setTab('message')} icon={<MessageSquare size={15} />}>
          Message / SMS / Email
        </TabButton>
        <TabButton active={tab === 'url'} onClick={() => setTab('url')} icon={<Link2 size={15} />}>
          URL Check
        </TabButton>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Input */}
        <div className="space-y-4 lg:col-span-3">
          <Card className="relative overflow-hidden p-5">
            {scanning && (
              <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 bg-blue-400/80 scan-line" />
            )}
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-200">
                {tab === 'message' ? 'Paste the message' : 'Enter a URL'}
              </label>
            </div>
            {tab === 'message' ? (
              <Textarea
                value={message}
                onChange={setMessage}
                placeholder="Paste an SMS, email, or any suspicious text here…"
                rows={6}
                ariaLabel="Message to analyze"
              />
            ) : (
              <Input
                value={url}
                onChange={setUrl}
                placeholder="https://example.com/login"
                ariaLabel="URL to analyze"
              />
            )}

            {/* Samples */}
            <div className="mt-3">
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Try a sample
              </p>
              <div className="flex flex-wrap gap-2">
                {samples.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => loadSample(s.text)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium text-slate-300 transition-colors hover:bg-white/10"
                  >
                    {s.tag === 'scam' || s.tag === 'suspicious' ? (
                      <AlertTriangle size={11} className="text-amber-400" />
                    ) : s.tag === 'legit' ? (
                      <CheckCircle2 size={11} className="text-emerald-400" />
                    ) : (
                      <Info size={11} className="text-slate-400" />
                    )}
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-[11px] text-slate-500">
                {tab === 'message'
                  ? `${message.length} characters`
                  : 'URLs also get a live Google Safe Browsing reputation check.'}
              </p>
              <Button onClick={runAnalysis} disabled={scanning || !(tab === 'message' ? message.trim() : url.trim())}>
                <ScanLine size={15} /> {scanning ? 'Analyzing…' : 'Analyze'}
              </Button>
            </div>
          </Card>

          {current && <ResultView result={current} />}
        </div>

        {/* History */}
        <div className="space-y-4 lg:col-span-2">
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History size={15} className="text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-200">Analysis History</h3>
              </div>
              {history.length > 0 && (
                <button onClick={clearHistory} className="text-xs text-slate-500 hover:text-red-300">
                  Clear
                </button>
              )}
            </div>
            {saveErr && (
              <p className="mb-2 flex items-center gap-1.5 text-xs text-red-300">
                <AlertTriangle size={12} /> {saveErr}
              </p>
            )}
            {loading && history.length === 0 ? (
              <p className="text-xs text-slate-500">Loading history…</p>
            ) : history.length === 0 ? (
              <EmptyState
                icon={<History size={18} />}
                title="No analyses yet"
                message="Your recent scans appear here, saved securely to your account."
              />
            ) : (
              <ul className="space-y-2">
                {history.map((r) => {
                  const cfg = riskConfig[r.riskLevel];
                  return (
                    <li key={r.id}>
                      <button
                        onClick={() => loadFromHistory(r)}
                        className="w-full rounded-xl border border-white/10 bg-white/[0.02] p-3 text-left transition-colors hover:bg-white/5"
                      >
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                          <Badge tone={r.type === 'message' ? 'blue' : 'neutral'}>
                            {r.type === 'message' ? 'Message' : 'URL'}
                          </Badge>
                          <span className={`flex items-center gap-1 text-[11px] font-semibold ${cfg.text}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                        </div>
                        <p className="truncate text-xs text-slate-400">
                          {r.input.slice(0, 70) || '(empty)'}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-600">
                          {new Date(r.createdAt).toLocaleString()}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {/* Self-test panel */}
          <Card className="p-5">
            <button
              onClick={() => {
                setShowTests((v) => !v);
                if (!testResults) runTests();
              }}
              className="flex w-full items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <FlaskConical size={15} className="text-blue-300" />
                <h3 className="text-sm font-semibold text-slate-200">Calibration tests</h3>
              </div>
              {showTests ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronRight size={16} className="text-slate-500" />}
            </button>
            {showTests && testResults && (
              <div className="mt-3 animate-fade-in-up">
                <p className="mb-2 text-[11px] leading-relaxed text-slate-500">
                  Internal checks that verify known scam, legit, and ambiguous inputs
                  classify as expected. They guard against false positives when rules
                  are edited — they do not prove real-world accuracy.
                </p>
                <ul className="space-y-1.5">
                  {testResults.map((t) => (
                    <li
                      key={t.name}
                      className="flex items-start gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2"
                    >
                      {t.passed ? (
                        <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-400" />
                      ) : (
                        <XCircle size={14} className="mt-0.5 shrink-0 text-red-400" />
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-200">{t.name}</p>
                        <p className="text-[10px] text-slate-500">
                          {t.type} · expected {t.expected} · got {t.actual} · {t.matched} match(es)
                        </p>
                        {!t.passed && (
                          <p className="mt-0.5 text-[10px] text-red-300">{t.reason}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">
                    {testResults.filter((t) => t.passed).length}/{testResults.length} passed
                  </span>
                  <Button variant="ghost" onClick={runTests}>
                    Re-run
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function ResultView({ result }: { result: AnalysisResult }) {
  const cfg = riskConfig[result.riskLevel];
  const matched = result.indicators.filter((i) => i.matched);
  return (
    <Card className={`animate-fade-in-up border ${cfg.border} ${cfg.bg} p-5`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`flex h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
          <h3 className={`text-sm font-bold ${cfg.text}`}>{cfg.label}</h3>
        </div>
        <Badge tone="neutral">
          <Info size={11} /> {result.isDemo ? 'Rule-based' : 'AI-powered'}
        </Badge>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-slate-200">{result.summary}</p>

      {result.reputation && (
        <div
          className={`mt-4 flex items-start gap-2.5 rounded-xl border px-4 py-3 text-sm ${
            result.reputation.reputation === 'unsafe'
              ? 'border-red-500/30 bg-red-500/10 text-red-200'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
          }`}
        >
          {result.reputation.reputation === 'unsafe' ? (
            <ShieldAlert size={16} className="mt-0.5 shrink-0" />
          ) : (
            <ShieldCheck size={16} className="mt-0.5 shrink-0" />
          )}
          <div className="min-w-0">
            <p className="font-semibold">
              {result.reputation.reputation === 'unsafe'
                ? 'Flagged by Google Safe Browsing'
                : 'No threats found by Google Safe Browsing'}
            </p>
            <p className="mt-1 text-xs leading-relaxed opacity-90">{result.reputation.details}</p>
          </div>
        </div>
      )}

      {result.riskLevel === 'unable' ? (
        <div className="mt-4 flex gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-sm text-amber-200">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          Unable to determine risk from the provided input. Add more detail for a
          meaningful scan.
        </div>
      ) : (
        <>
          {/* Matched warning signs only */}
          <div className="mt-5">
            <div className="mb-2 flex items-center gap-2">
              <Search size={13} className="text-red-300" />
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Warning signs detected
              </h4>
              <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] font-bold text-red-300">
                {matched.length}
              </span>
            </div>
            {matched.length === 0 ? (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2.5 text-xs text-emerald-200">
                No known warning-sign patterns matched. This does not guarantee the{' '}
                {result.type === 'message' ? 'message' : 'URL'} is safe — it only means
                no red flag was detected by this rule set.
              </div>
            ) : (
              <ul className="space-y-2">
                {matched.map((ind) => (
                  <li
                    key={ind.label}
                    className="flex gap-3 rounded-xl border border-red-500/25 bg-red-500/5 px-3 py-2.5 text-sm"
                  >
                    <XCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
                    <div className="min-w-0">
                      <p className="font-medium text-slate-100">{ind.label}</p>
                      <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
                        {ind.explanation}
                      </p>
                      {ind.snippet && (
                        <p className="mt-1.5 rounded-md bg-black/30 px-2 py-1 font-mono text-[11px] text-slate-300">
                          {ind.snippet}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* General educational guidance (separate from matched signs) */}
          <div className="mt-5 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="mb-2 flex items-center gap-2 text-slate-300">
              <BookOpen size={14} />
              <h4 className="text-xs font-semibold uppercase tracking-wide">
                General {result.type === 'message' ? 'message-safety' : 'URL-safety'} guidance
              </h4>
            </div>
            <ul className="space-y-1.5">
              {result.generalGuidance.map((g) => (
                <li key={g} className="flex gap-2 text-xs leading-relaxed text-slate-400">
                  <span className="text-slate-500">•</span>
                  {g}
                </li>
              ))}
            </ul>
          </div>

          {/* Recommended actions */}
          <div className="mt-4 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-blue-200">
              <Lightbulb size={15} />
              <h4 className="text-xs font-semibold uppercase tracking-wide">
                Recommended actions
              </h4>
            </div>
            <ul className="space-y-1.5">
              {result.recommendedActions.map((a) => (
                <li key={a} className="flex gap-2 text-sm text-slate-200">
                  <span className="text-blue-400">•</span>
                  {a}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </Card>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
        active ? 'bg-blue-500/15 text-blue-200' : 'text-slate-400 hover:text-slate-200'
      }`}
    >
      {icon}
      {children}
    </button>
  );
}
