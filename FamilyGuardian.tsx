import { useState } from 'react';
import {
  Users,
  Fish,
  MessageCircleX,
  Lock,
  UserMinus,
  CheckCircle2,
  Circle,
  Baby,
  UserRound,
  PersonStanding,
  Info,
} from 'lucide-react';
import { Card, SectionTitle, Notice } from '@/components/ui';
import { useData } from '@/lib/dataContext';
import { useLocalStorage } from '@/lib/useLocalStorage';
import { useEffect } from 'react';

type AgeGroup = 'child' | 'teen' | 'adult';

interface Topic {
  id: string;
  title: string;
  icon: typeof Fish;
  points: { age: AgeGroup | 'all'; text: string }[];
}

const TOPICS: Topic[] = [
  {
    id: 'phishing',
    title: 'Phishing & scams',
    icon: Fish,
    points: [
      { age: 'child', text: 'If a game or website asks for your name, address, or passwords, tell a grown-up right away.' },
      { age: 'teen', text: 'Never trust messages promising free games, skins, or "too good" offers — they often steal accounts.' },
      { age: 'all', text: 'Hover over links before clicking and check the real domain. When unsure, ask a parent.' },
      { age: 'adult', text: 'Teach kids that real companies never ask for passwords or gift-card payments by message.' },
    ],
  },
  {
    id: 'cyberbullying',
    title: 'Cyberbullying',
    icon: MessageCircleX,
    points: [
      { age: 'child', text: 'If someone is mean to you online, don\'t reply — screenshot it and show a trusted adult.' },
      { age: 'teen', text: 'Block and report bullies. Keep evidence with screenshots. You don\'t have to handle it alone.' },
      { age: 'all', text: 'Talk openly — kids should feel safe reporting bullying without losing phone access.' },
      { age: 'adult', text: 'Watch for withdrawal, mood changes, or avoiding devices. Respond supportively, not punitively.' },
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy & personal info',
    icon: Lock,
    points: [
      { age: 'child', text: 'Your full name, school, address, and photos are private. Don\'t share them with online friends.' },
      { age: 'teen', text: 'Check app privacy settings regularly. Turn off location sharing for non-essential apps.' },
      { age: 'all', text: 'Use strong, unique passwords and enable two-factor authentication on important accounts.' },
      { age: 'adult', text: 'Review what your kids share publicly. Explain that posts can be permanent and reshared.' },
    ],
  },
  {
    id: 'contact',
    title: 'Suspicious contact',
    icon: UserMinus,
    points: [
      { age: 'child', text: 'If a stranger online asks to meet or keep a secret, tell a grown-up immediately.' },
      { age: 'teen', text: 'Be cautious with new online "friends." Never meet someone in person without a parent.' },
      { age: 'all', text: 'Report and block suspicious users on any platform. Save evidence before blocking.' },
      { age: 'adult', text: 'Keep conversations open about who your kids talk to. Use parental controls transparently — not secretly.' },
    ],
  },
];

const FAMILY_CHECKLIST = [
  'Set up strong, unique passwords for each family account.',
  'Enable two-factor authentication on email and banking.',
  'Review privacy and location settings on kids\' devices together.',
  'Agree on which apps and games are okay, and at what ages.',
  'Talk regularly about online experiences — keep it judgment-free.',
  'Teach kids to screenshot and report anything uncomfortable.',
  'Keep devices in shared spaces for younger children.',
  'Have a family plan for what to do if an account is compromised.',
];

const AGE_META: Record<AgeGroup, { label: string; icon: typeof Baby; desc: string }> = {
  child: { label: 'Younger kids', icon: Baby, desc: 'Ages 5–11' },
  teen: { label: 'Teens', icon: UserRound, desc: 'Ages 12–17' },
  adult: { label: 'Parents & guardians', icon: PersonStanding, desc: 'Guidance for adults' },
};

export function FamilyGuardian() {
  const [age, setAge] = useState<AgeGroup>('child');
  const { checklist, toggleChecklistItem } = useData();
  const [localChecked, setLocalChecked] = useLocalStorage<boolean[]>(
    'ag_family_checklist',
    FAMILY_CHECKLIST.map(() => false),
  );

  // Migrate localStorage checklist to the server one time: if the server
  // checklist is empty but localStorage has progress, push it up.
  useEffect(() => {
    const hasLocalProgress = localChecked.some((v) => v);
    const hasServerProgress = checklist.length > 0 && checklist.some((v) => v);
    if (hasLocalProgress && !hasServerProgress) {
      localChecked.forEach((v, i) => {
        if (v) void toggleChecklistItem(i, true);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checklist.length]);

  const checked = checklist.length === FAMILY_CHECKLIST.length ? checklist : localChecked;

  function handleToggle(i: number) {
    const newVal = !(checked[i] ?? false);
    void toggleChecklistItem(i, newVal).catch(() => {
      // Fallback to localStorage if the server call fails
      setLocalChecked((arr) => arr.map((v, idx) => (idx === i ? !v : v)));
    });
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <SectionTitle
        title="Family Guardian"
        subtitle="Age-appropriate online safety education and a shared family safety checklist."
        icon={<Users size={18} />}
      />

      <Notice tone="info" title="Guidance, not monitoring">
        Family Guardian provides education and a configurable checklist. It does{' '}
        <strong>not</strong> covertly monitor children, track messages, or access
        devices. Parental controls should be set openly with your child's knowledge.
      </Notice>

      {/* Age selector */}
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(AGE_META) as AgeGroup[]).map((key) => {
          const meta = AGE_META[key];
          const Icon = meta.icon;
          const active = age === key;
          return (
            <button
              key={key}
              onClick={() => setAge(key)}
              className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
                active
                  ? 'border-blue-500/40 bg-blue-500/10 text-blue-100'
                  : 'border-white/10 bg-white/[0.02] text-slate-300 hover:bg-white/5'
              }`}
            >
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  active ? 'bg-blue-500/20 text-blue-200' : 'bg-white/5 text-slate-400'
                }`}
              >
                <Icon size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold">{meta.label}</p>
                <p className="text-[11px] opacity-70">{meta.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Topic cards filtered by age */}
      <div className="grid gap-4 sm:grid-cols-2">
        {TOPICS.map((t) => {
          const Icon = t.icon;
          const points = t.points.filter((p) => p.age === age || p.age === 'all');
          return (
            <Card key={t.id} className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
                  <Icon size={17} />
                </div>
                <h3 className="text-sm font-semibold text-white">{t.title}</h3>
              </div>
              <ul className="space-y-2">
                {points.map((p, i) => (
                  <li key={i} className="flex gap-2 text-sm leading-relaxed text-slate-300">
                    <span className="text-amber-400">•</span>
                    {p.text}
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>

      {/* Family checklist */}
      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-blue-300" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
            Family digital safety checklist
          </h3>
        </div>
        <ol className="space-y-2">
          {FAMILY_CHECKLIST.map((step, i) => {
            const done = checked[i] ?? false;
            return (
              <li key={step}>
                <button
                  onClick={() => handleToggle(i)}
                  className="flex w-full items-start gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 text-left text-sm transition-colors hover:bg-white/5"
                >
                  {done ? (
                    <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-emerald-400" />
                  ) : (
                    <Circle size={17} className="mt-0.5 shrink-0 text-slate-600" />
                  )}
                  <span className={done ? 'text-slate-500 line-through' : 'text-slate-200'}>
                    {step}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </Card>

      <div className="flex items-start gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-4 text-xs text-slate-400">
        <Info size={14} className="mt-0.5 shrink-0 text-slate-500" />
        <p>
          These tips are general educational guidance, not professional advice. For
          serious concerns about a child's safety, contact local authorities or a
          child protection hotline. In the US: 1-800-4-A-CHILD.
        </p>
      </div>
    </div>
  );
}
