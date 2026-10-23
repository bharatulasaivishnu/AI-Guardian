import {
  Shield,
  Lock,
  HeartPulse,
  GraduationCap,
  Users,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Phone,
} from 'lucide-react';
import type { Route } from '@/components/Layout';
import { ShieldLogo } from '@/components/Layout';

const MODULES: {
  route: Route;
  title: string;
  desc: string;
  icon: typeof Lock;
  accent: string;
  points: string[];
}[] = [
  {
    route: 'cyber',
    title: 'Cybersecurity Guardian',
    desc: 'Scan suspicious messages, emails, and URLs for scam and phishing signals.',
    icon: Lock,
    accent: 'from-blue-500/20 to-blue-500/5 border-blue-500/30',
    points: ['Message analysis', 'URL risk check', 'Warning breakdown'],
  },
  {
    route: 'personal',
    title: 'Personal Safety Guardian',
    desc: 'A prominent SOS interface, trusted contacts, and an emergency action checklist.',
    icon: HeartPulse,
    accent: 'from-red-500/20 to-red-500/5 border-red-500/30',
    points: ['SOS interface', 'Trusted contacts', 'Action checklist'],
  },
  {
    route: 'student',
    title: 'Student Safety Guardian',
    desc: 'A campus safety dashboard with contacts, incident reporting, and guidance.',
    icon: GraduationCap,
    accent: 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30',
    points: ['Campus directory', 'Incident reports', 'Safety checklist'],
  },
  {
    route: 'family',
    title: 'Family Guardian',
    desc: 'Age-appropriate online safety education and family digital safety checklists.',
    icon: Users,
    accent: 'from-amber-500/20 to-amber-500/5 border-amber-500/30',
    points: ['Phishing & cyberbullying', 'Privacy guidance', 'Family checklist'],
  },
];

export function Home({ navigate }: { navigate: (r: Route) => void }) {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-navy-gradient px-6 py-10 sm:px-10 sm:py-14">
        <div className="absolute inset-0 bg-grid opacity-40" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <ShieldLogo />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-300/80">
                All-in-One AI Safety Platform
              </p>
            </div>
          </div>
          <h1 className="mt-5 max-w-2xl text-3xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
            Your personal <span className="text-gradient">guardian</span> for scams,
            safety, and digital wellbeing.
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
            AI Guardian brings together scam detection, personal emergency tools,
            campus safety, and family education in one secure, accessible dashboard.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <button
              onClick={() => navigate('cyber')}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-400 active:scale-[0.98]"
            >
              <ShieldCheck size={16} /> Analyze a message
            </button>
            <button
              onClick={() => navigate('personal')}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10"
            >
              <Phone size={16} /> Open SOS
            </button>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section>
        <div className="mb-4 flex items-center gap-2">
          <Shield size={18} className="text-blue-300" />
          <h2 className="text-sm font-semibold uppercase tracking-[0.15em] text-slate-400">
            Four Safety Modules
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {MODULES.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.route}
                onClick={() => navigate(m.route)}
                className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-6 text-left transition-all duration-200 hover:scale-[1.01] hover:shadow-2xl ${m.accent}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                    <Icon size={22} />
                  </div>
                  <ArrowRight
                    size={18}
                    className="text-slate-400 transition-transform group-hover:translate-x-1"
                  />
                </div>
                <h3 className="mt-4 text-lg font-bold text-white">{m.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
                  {m.desc}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {m.points.map((p) => (
                    <span
                      key={p}
                      className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-300"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Trust strip */}
      <section className="grid gap-4 sm:grid-cols-3">
        <TrustCard
          icon={<ShieldCheck size={18} />}
          title="Transparency first"
          desc="Every analysis is labeled as rule-based demo logic. No fake AI claims."
        />
        <TrustCard
          icon={<AlertTriangle size={18} />}
          title="Honest assessments"
          desc="We never claim a URL is safe without verification, and never fake SOS delivery."
        />
        <TrustCard
          icon={<Lock size={18} />}
          title="Your data stays local"
          desc="History and contacts are stored on your device, not uploaded to a server."
        />
      </section>
    </div>
  );
}

function TrustCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0e1a35]/60 p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
        {icon}
      </div>
      <h4 className="mt-3 text-sm font-semibold text-white">{title}</h4>
      <p className="mt-1 text-xs leading-relaxed text-slate-400">{desc}</p>
    </div>
  );
}
