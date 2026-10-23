import type { AnalysisResult, RiskLevel, RiskIndicator } from '@/types';

// Pattern-based heuristic analysis. This is NOT real AI threat intelligence.
// It surfaces classic scam/phishing signals so users can make informed decisions.
// The UI always labels this as rule-based demo analysis.

interface Pattern {
  re: RegExp;
  label: string;
  explanation: string;
  weight: number;
  // Optional negative test: if the message reads as benign context, skip the match.
  // e.g. "blocked" in "I blocked the road" should not trigger account-pressure.
  suppressIf?: RegExp;
}

const MESSAGE_PATTERNS: Pattern[] = [
  {
    re: /\b(urgent|act now|final notice|last warning|within 24 hours|immediate action)\b/i,
    label: 'Urgency / pressure tactic',
    explanation:
      'Scammers create false deadlines to stop you from thinking clearly or verifying the claim.',
    weight: 2,
  },
  {
    re: /\b(you(?:'ve| have)? (?:won|been selected)|congratulations[,!]?\s*(?:you|winner)|claim your (?:prize|reward|bonus)|lottery|sweepstake)\b/i,
    label: 'Unsolicited prize or reward',
    explanation:
      'Unexpected winnings are a common lure. Legitimate prizes never require upfront payments.',
    weight: 2,
  },
  {
    re: /\b(gift card|itunes card|google play card|steam card|wire transfer|crypto\b|bitcoin|usdt|send (?:money|\$\d)|western union|moneygram)\b/i,
    label: 'Unusual payment method',
    explanation:
      'Gift cards, wire transfers, and crypto are hard to reverse — a major scam red flag.',
    weight: 3,
  },
  {
    re: /\b(your (?:bank )?account (?:has been|is|will be) (?:suspended|locked|blocked|compromised|closed|terminated|restricted|disabled)|verify your (?:account|identity)|confirm your (?:billing|payment|details)|update your (?:payment|card|billing) (?:info|details|method))\b/i,
    label: 'Account verification pressure',
    explanation:
      'Phishing messages impersonate institutions to steal credentials via fake login pages.',
    weight: 2,
    suppressIf: /\b(i (?:blocked|have blocked) (?:the|your|a)\b|blocked (?:the|a) (?:road|number|caller))\b/i,
  },
  {
    re: /\b(click (?:here|this|the (?:link|button))|visit (?:this|the) link|bit\.ly\/|tinyurl\.com\/|t\.me\/|wa\.me\/|is\.gd\/|rb\.gy\/)\b/i,
    label: 'Suspicious link prompt',
    explanation:
      'Shortened or unfamiliar links often lead to phishing or malware sites.',
    weight: 2,
  },
  {
    re: /\b(IRS\b|tax refund|social security number|medicare|arrest warrant|outstanding warrant|lawsuit (?:has been|been) filed|legal action (?:has been|will be) (?:taken|filed))\b/i,
    label: 'Authority impersonation',
    explanation:
      'Government agencies do not demand payment or personal info via text or email.',
    weight: 3,
  },
  {
    re: /\b(dear (?:customer|user|sir|madam|beneficiary)|valued customer|to (?:whom it may concern|our valued customer))\b/i,
    label: 'Generic greeting',
    explanation:
      'Legitimate organizations usually address you by name. Generic greetings signal mass phishing.',
    weight: 1,
  },
  {
    re: /\b(kindly\b|please kindly|respond asap)\b/i,
    label: 'Unusual phrasing (e.g. "kindly")',
    explanation:
      'Unusual phrasing like "kindly" is common in scam scripts, especially advance-fee fraud.',
    weight: 1,
  },
  {
    re: /\b(don'?t tell anyone|keep (?:this|it) (?:a )?secret|between (?:you and me|us))\b/i,
    label: 'Secrecy request',
    explanation:
      'Asking you to keep a transaction secret is a strong manipulation signal — legitimate requests don\'t need secrecy.',
    weight: 2,
  },
  {
    re: /\b(?:send|share|provide|enter|confirm|give|reply with|text|email)\s+(?:me |us |you )?(?:your |the |a )?(?:pin|otp|password|passcode|one[- ]?time (?:password|code)|verification code|2fa code|authentication code|recovery code|cvv|full card number|security code|access code)\b/i,
    label: 'Requests sensitive credentials',
    explanation:
      'No legitimate service will ask for your password, OTP, PIN, recovery code, or full card number by message.',
    weight: 3,
    suppressIf: /\b(?:never (?:share|give|send|provide)|don'?t (?:share|give|send|provide)|never (?:ask|asks) for)\b/i,
  },
  {
    re: /\b(guaranteed (?:return|profit)|double your (?:money|investment)|risk[- ]?free investment|crypto (?:opportunity|giveaway)|trading signals?|forex (?:manager|investment))\b/i,
    label: 'Investment lure',
    explanation:
      'Guaranteed returns and sudden investment tips are hallmarks of financial scams.',
    weight: 2,
  },
  {
    re: /\b(?:(?:found|discovered)\s+\$[\d,.]+\s*[mmb]?\b|transfer.{0,40}(?:overseas|abroad|diplomat|military))\b/i,
    label: 'Advance-fee / "found money" story',
    explanation:
      'Strangers offering to share found money in exchange for your help moving it is a classic advance-fee scam.',
    weight: 3,
  },
  {
    re: /\b(fedex|ups|dhl|usps|royal mail)\b.{0,50}\b(held|reschedule|customs fee|delivery issue|returned to sender|pending delivery|address verification)\b/i,
    label: 'Delivery-service impersonation',
    explanation:
      'Fake courier messages about held packages are a top phishing category. Track through the courier\'s official site or app, not a link in the message.',
    weight: 2,
  },
  {
    re: /\b(this is my new number|my phone (?:broke|was (?:broken|damaged|lost|stolen))|dropped my phone)\b.*\b(gift card|payment|transfer|send \$|wire|bank details)\b/i,
    label: 'Impersonation of a contact (SIM-swap style)',
    explanation:
      'A "new number" message that quickly asks for money or gift cards is a common impersonation scam. Verify by calling the known number.',
    weight: 3,
  },
];

const URL_PATTERNS: Pattern[] = [
  {
    re: /\b(bit\.ly|tinyurl|t\.co|goo\.gl|ow\.ly|shorturl|rebrand\.ly|cutt\.ly|is\.gd|rb\.gy)\b/i,
    label: 'URL shortener detected',
    explanation:
      'Shortened URLs hide the real destination. Expand them before trusting.',
    weight: 2,
  },
  {
    re: /^https?:\/\/(\d{1,3}\.){3}\d{1,3}/,
    label: 'Raw IP address as domain',
    explanation:
      'Legitimate organizations use domain names. A raw IP is common in phishing.',
    weight: 2,
  },
  {
    re: /\b(login|signin|verify|account|update|secure|unlock|wallet)[.-]/i,
    label: 'Credential-harvesting keyword in path/subdomain',
    explanation:
      'Phishing sites mimic login pages. Confirm the domain matches the real institution.',
    weight: 1,
  },
  {
    re: /\.(tk|ml|ga|cf|gq|xyz|top|click|country|stream|live)\b/i,
    label: 'High-abuse TLD',
    explanation:
      'Some TLDs are frequently abused for cheap phishing domains. Treat with caution.',
    weight: 1,
    suppressIf: /\b(github\.io|vercel\.app|netlify\.app)\b/i,
  },
  {
    re: /(paypal|apple|amazon|microsoft|google|netflix|coinbase|chase|wellsfargo|bankofamerica)[^a-z0-9]/i,
    label: 'Brand name in suspicious position',
    explanation:
      'Check that a brand name is the actual registrable domain (e.g. "paypal.com"), not a subdomain or path on another site.',
    weight: 2,
    suppressIf:
      /^https?:\/\/(?:[a-z0-9-]+\.)*(?:paypal|apple|amazon|microsoft|google|netflix|coinbase|chase|wellsfargo|bankofamerica)\.(?:com|org|net|edu|gov)\b/i,
  },
  {
    re: /[-](login|verify|secure|update|account|support|help)\b/i,
    label: 'Suspicious hyphenated segment',
    explanation:
      'Hyphenated prefixes like "secure-login.brand-verify.xyz" are common phishing patterns.',
    weight: 2,
  },
  {
    re: /(xn--|@)/i,
    label: 'Punycode or embedded @ symbol',
    explanation:
      'Punycode and embedded @ characters can spoof legitimate domains.',
    weight: 2,
  },
  {
    re: /\b(shipping|delivery|package|parcel|customs|fedex|ups|dhl|usps)[.-]/i,
    label: 'Delivery-impersonation keyword in domain',
    explanation:
      'Fake delivery-tracking sites are a top phishing category. Verify the courier\'s real domain.',
    weight: 1,
  },
];

function matchPattern(p: Pattern, text: string): boolean {
  if (!p.re.test(text)) return false;
  if (p.suppressIf && p.suppressIf.test(text)) return false;
  return true;
}

function scoreToRisk(score: number, hasContent: boolean, tooShort: boolean): RiskLevel {
  if (!hasContent || tooShort) return 'unable';
  if (score >= 5) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
}

function buildIndicators(patterns: Pattern[], text: string): RiskIndicator[] {
  return patterns.map((p) => {
    const matched = matchPattern(p, text);
    return {
      label: p.label,
      matched,
      explanation: p.explanation,
      snippet: matched ? extractSnippet(p.re, text) : undefined,
    };
  });
}

function extractSnippet(re: RegExp, text: string): string {
  const m = re.exec(text);
  if (!m) return text.slice(0, 60);
  const start = Math.max(0, m.index - 20);
  const end = Math.min(text.length, m.index + m[0].length + 20);
  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
}

function analyzeMessage(text: string): { indicators: RiskIndicator[]; score: number } {
  const indicators = buildIndicators(MESSAGE_PATTERNS, text);
  const score = MESSAGE_PATTERNS.reduce(
    (acc, p, i) => acc + (indicators[i].matched ? p.weight : 0),
    0,
  );
  return { indicators, score };
}

function analyzeUrl(url: string): { indicators: RiskIndicator[]; score: number } {
  const indicators = buildIndicators(URL_PATTERNS, url);
  const score = URL_PATTERNS.reduce(
    (acc, p, i) => acc + (indicators[i].matched ? p.weight : 0),
    0,
  );
  return { indicators, score };
}

const GENERAL_GUIDANCE: Record<'message' | 'url', string[]> = {
  message: [
    'Legitimate organizations rarely ask for passwords, PINs, or gift cards by message.',
    'Spelling errors, generic greetings, and pressure to act fast are common scam signals.',
    'If a message claims to be from your bank, log in through the app or website you already trust — not a link in the message.',
  ],
  url: [
    'Pattern checks do not verify a URL\'s reputation or actual safety. A clean scan does not mean the site is safe.',
    'Check the real domain: brands belong before the dot, e.g. "paypal.com" — not "paypal.fake-site.xyz".',
    'For a real reputation check, use a dedicated service like Google Safe Browsing or VirusTotal.',
  ],
};

function recommendedActions(type: 'message' | 'url', risk: RiskLevel): string[] {
  if (risk === 'unable') {
    return [
      'Enter more detail so the analysis can surface warning signs.',
      type === 'url'
        ? 'Include the full address, e.g. "https://example.com/login".'
        : 'Paste the full message text, including any links or phone numbers.',
    ];
  }
  const common = [
    'Do not click any links or download attachments.',
    'Do not share personal, financial, or account details.',
    'When in doubt, contact the organization through their official website or phone number — not the contact info in the message.',
  ];
  if (risk === 'high') {
    return [
      'Treat this as very likely fraudulent. Block and report the sender.',
      type === 'url'
        ? 'Do not enter any information on this site. Run a reputable security scan or reputation check.'
        : 'Report the message to your carrier (forward to 7726 in the US) and the FTC at reportfraud.ftc.gov.',
      ...common,
    ];
  }
  if (risk === 'medium') {
    return [
      'Verify independently before taking any action.',
      'Look up the organization through an official channel and confirm the request.',
      ...common,
    ];
  }
  return [
    'No major red flags were found, but this does not guarantee safety.',
    'Stay cautious and verify anything unusual through an official channel.',
    ...common,
  ];
}

function summary(
  type: 'message' | 'url',
  risk: RiskLevel,
  matched: number,
): string {
  if (risk === 'unable') {
    return 'Unable to determine risk from the provided input. Please add more content for a meaningful scan.';
  }
  const subject = type === 'message' ? 'this message' : 'this URL';
  if (risk === 'high') {
    return `Multiple strong scam indicators detected in ${subject}. ${matched} warning sign${matched === 1 ? '' : 's'} matched. Treat with high caution.`;
  }
  if (risk === 'medium') {
    return `Several warning signs present in ${subject}. Verify carefully before acting.`;
  }
  return `Few or minor warning signs in ${subject}. No serious indicators detected — but remain cautious, as this does not confirm safety.`;
}

export function analyze(input: string, type: 'message' | 'url'): AnalysisResult {
  const trimmed = input.trim();
  const hasContent = trimmed.length > 0;
  const tooShort =
    type === 'message' ? trimmed.length < 8 : !/\./.test(trimmed);
  const { indicators, score } =
    type === 'message' ? analyzeMessage(trimmed) : analyzeUrl(trimmed);
  const risk = scoreToRisk(score, hasContent, tooShort);
  const matched = indicators.filter((i) => i.matched).length;

  return {
    id: `an_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    input: trimmed,
    riskLevel: risk,
    summary: summary(type, risk, matched),
    indicators,
    generalGuidance: GENERAL_GUIDANCE[type],
    recommendedActions: recommendedActions(type, risk),
    isDemo: true,
    createdAt: Date.now(),
  };
}

// ---- Self-test suite (rule calibration against known cases) ----
// These tests run locally and help catch false positives / negatives when
// patterns are edited. They are NOT a claim of accuracy against real threats.

interface TestCase {
  name: string;
  input: string;
  type: 'message' | 'url';
  expectRisk: RiskLevel;
  expectMatchedAtLeast?: number;
  expectMatchedExactly?: number;
}

const TEST_CASES: TestCase[] = [
  // Obvious scams (should be high)
  {
    name: 'FedEx package phishing',
    input:
      'URGENT: Your FedEx package #A22 is held. Verify your address now at bit.ly/fedex-reschedule to avoid return.',
    type: 'message',
    expectRisk: 'high',
    expectMatchedAtLeast: 3,
  },
  {
    name: 'Advance-fee military scam',
    input:
      "Hi dear, I'm General Miller stationed overseas. I found $4.5M in a raid and need your help transferring it. Kindly keep this secret.",
    type: 'message',
    expectRisk: 'high',
    expectMatchedAtLeast: 3,
  },
  {
    name: 'Gift-card impersonation (new number)',
    input:
      "Hey mom, I dropped my phone. This is my new number. I need a $50 Amazon gift card for a school project ASAP, please don't call.",
    type: 'message',
    expectRisk: 'high',
    expectMatchedAtLeast: 2,
  },
  // Legitimate messages (should be low)
  {
    name: 'Legit Amazon shipping notice',
    input:
      'Your Amazon order #112-9 has shipped and will arrive Tuesday. Track at amazon.com/track/112-9.',
    type: 'message',
    expectRisk: 'low',
    expectMatchedExactly: 0,
  },
  {
    name: 'Casual text about blocking a caller',
    input: 'I blocked the number you told me about. Thanks for the heads up.',
    type: 'message',
    expectRisk: 'low',
    expectMatchedExactly: 0,
  },
  {
    name: 'Friendly reminder',
    input: 'Hey, just a reminder we have dinner at 7 on Friday. See you there!',
    type: 'message',
    expectRisk: 'low',
    expectMatchedExactly: 0,
  },
  // Ambiguous (should be low or medium, never high, and never unable)
  {
    name: 'Bank marketing with urgency',
    input:
      'Final notice: your rewards points expire this month. Log in to redeem before they are gone.',
    type: 'message',
    expectRisk: 'medium',
  },
  {
    name: 'Short ambiguous text',
    input: 'call me back asap please',
    type: 'message',
    expectRisk: 'low',
  },
  // Suspicious URLs (high)
  {
    name: 'Spoofed PayPal phishing URL',
    input: 'http://secure-login.paypal-verify.account-update.xyz/login',
    type: 'url',
    expectRisk: 'high',
    expectMatchedAtLeast: 3,
  },
  {
    name: 'IP-based phishing URL',
    input: 'http://192.168.44.12/wellsfargo/verify',
    type: 'url',
    expectRisk: 'medium',
    expectMatchedAtLeast: 2,
  },
  // Legitimate URLs (low)
  {
    name: 'Legit GitHub URL',
    input: 'https://github.com',
    type: 'url',
    expectRisk: 'low',
    expectMatchedExactly: 0,
  },
  {
    name: 'Legit PayPal domain',
    input: 'https://www.paypal.com/signin',
    type: 'url',
    expectRisk: 'low',
    expectMatchedExactly: 0,
  },
  // Credential-harvesting phishing (should be high)
  {
    name: 'OTP scam with urgency, suspension threat, and link',
    input:
      'URGENT: Your bank account will be blocked today. Click this link and share your OTP to verify your account.',
    type: 'message',
    expectRisk: 'high',
    expectMatchedAtLeast: 3,
  },
  {
    name: 'OTP request with account suspension threat',
    input:
      'Your account will be suspended within 24 hours. Provide your OTP to confirm your identity.',
    type: 'message',
    expectRisk: 'high',
    expectMatchedAtLeast: 2,
  },
  // Legitimate notifications (should be low)
  {
    name: 'Legit appointment confirmation',
    input:
      'Your appointment with Dr. Smith is confirmed for Tuesday at 2pm. Please reply if you need to reschedule.',
    type: 'message',
    expectRisk: 'low',
    expectMatchedExactly: 0,
  },
  {
    name: 'Routine account statement notification',
    input:
      'Your October account statement is now available in your online banking portal.',
    type: 'message',
    expectRisk: 'low',
    expectMatchedExactly: 0,
  },
  // Ambiguous account notification (medium, not high)
  {
    name: 'Ambiguous account review request',
    input:
      'Reminder: your account settings need to be updated. Log in to confirm your details at your convenience.',
    type: 'message',
    expectRisk: 'medium',
  },
  // Suspicious URL (elevated)
  {
    name: 'Spoofed Apple phishing URL',
    input: 'http://login-apple-verify.xyz/account/secure',
    type: 'url',
    expectRisk: 'high',
    expectMatchedAtLeast: 3,
  },
  // Educational warnings should NOT be high (no false positive)
  {
    name: 'Educational OTP warning (not a request)',
    input: 'Never share your OTP with anyone. Your bank will never ask for it.',
    type: 'message',
    expectRisk: 'low',
    expectMatchedExactly: 0,
  },
  // Unable to determine
  {
    name: 'Empty message',
    input: '',
    type: 'message',
    expectRisk: 'unable',
  },
  {
    name: 'Too-short URL (no dot)',
    input: 'login',
    type: 'url',
    expectRisk: 'unable',
  },
];

export interface TestResult {
  name: string;
  passed: boolean;
  reason: string;
  input: string;
  type: 'message' | 'url';
  expected: RiskLevel;
  actual: RiskLevel;
  matched: number;
}

export function runSelfTests(): TestResult[] {
  return TEST_CASES.map((tc) => {
    const result = analyze(tc.input, tc.type);
    const matched = result.indicators.filter((i) => i.matched).length;
    const reasons: string[] = [];
    let passed = true;

    if (result.riskLevel !== tc.expectRisk) {
      passed = false;
      reasons.push(
        `expected ${tc.expectRisk}, got ${result.riskLevel}`,
      );
    }
    if (tc.expectMatchedAtLeast !== undefined && matched < tc.expectMatchedAtLeast) {
      passed = false;
      reasons.push(
        `expected ≥${tc.expectMatchedAtLeast} matches, got ${matched}`,
      );
    }
    if (tc.expectMatchedExactly !== undefined && matched !== tc.expectMatchedExactly) {
      passed = false;
      reasons.push(
        `expected exactly ${tc.expectMatchedExactly} matches, got ${matched}`,
      );
    }

    return {
      name: tc.name,
      passed,
      reason: passed ? 'OK' : reasons.join('; '),
      input: tc.input,
      type: tc.type,
      expected: tc.expectRisk,
      actual: result.riskLevel,
      matched,
    };
  });
}

export function selfTestSummary(): {
  total: number;
  passed: number;
  failed: number;
  results: TestResult[];
} {
  const results = runSelfTests();
  const passed = results.filter((r) => r.passed).length;
  return {
    total: results.length,
    passed,
    failed: results.length - passed,
    results,
  };
}
