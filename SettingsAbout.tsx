import { useState } from 'react';
import {
  Settings as SettingsIcon,
  Trash2,
  Shield,
  Database,
  Info,
  CheckCircle2,
  AlertTriangle,
  LogOut,
} from 'lucide-react';
import { Card, SectionTitle, Button, Notice } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useData } from '@/lib/dataContext';

const LOCAL_STORAGE_KEYS = [
  { key: 'ag_sos_checklist', label: 'SOS checklist progress', desc: 'Local UI state (not synced)' },
  { key: 'ag_campus_checklist', label: 'Campus checklist progress', desc: 'Local UI state (not synced)' },
  { key: 'ag_family_checklist', label: 'Family checklist progress', desc: 'Local UI state (not synced)' },
  { key: 'ag_campus_contacts', label: 'Campus contacts (sample directory)', desc: 'Local reference data' },
];

export function SettingsPage() {
  const { user, signOut } = useAuth();
  const { clearAnalysisHistory } = useData();
  const [cleared, setCleared] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  function clearKey(key: string) {
    localStorage.removeItem(key);
    setCleared(key);
    setTimeout(() => setCleared(null), 2000);
  }

  function clearAllLocal() {
    LOCAL_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k.key));
    setCleared('all');
    setTimeout(() => setCleared(null), 2000);
  }

  async function handleClearHistory() {
    setBusy(true);
    setMsg('');
    try {
      await clearAnalysisHistory();
      setMsg('Analysis history cleared from your account.');
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Failed to clear history.');
    }
    setBusy(false);
  }

  async function handleSignOut() {
    setBusy(true);
    await signOut();
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <SectionTitle
        title="Settings"
        subtitle="Manage data stored on this device and review privacy options."
        icon={<SettingsIcon size={18} />}
      />

      <Notice tone="info" title="Where your data lives">
        Your trusted contacts, incident reports, and analysis history are stored
        securely in your account on an encrypted database. Only you can read them —
        no other user can access your private records. Checklist progress and the
        campus sample directory remain on this device because they are local UI
        state. Authentication is handled by Supabase Auth; your password is never
        stored in plain text.
      </Notice>

      {user && (
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Shield size={16} className="text-blue-300" />
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
              Account
            </h3>
          </div>
          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-3">
            <div>
              <p className="text-sm font-medium text-slate-100">{user.email}</p>
              <p className="text-xs text-slate-500">Signed in via Supabase Auth</p>
            </div>
            <Button variant="ghost" onClick={handleSignOut} disabled={busy}>
              <LogOut size={15} /> Sign out
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Database size={16} className="text-blue-300" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
            Cloud-stored data (your account)
          </h3>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <div>
            <p className="text-sm font-medium text-slate-100">Analysis history</p>
            <p className="text-xs text-slate-500">Saved scans — synced to your account</p>
          </div>
          <Button variant="ghost" onClick={handleClearHistory} disabled={busy}>
            <Trash2 size={14} /> Clear
          </Button>
        </div>
        {msg && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
            <Info size={12} /> {msg}
          </p>
        )}
        <p className="mt-3 text-xs text-slate-500">
          Trusted contacts and incident reports are managed within their respective
          Guardian modules and are private to your account.
        </p>
      </Card>

      <Card className="p-6">
        <div className="mb-4 flex items-center gap-2">
          <Database size={16} className="text-blue-300" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
            Device-stored data (local only)
          </h3>
        </div>
        <ul className="space-y-2">
          {LOCAL_STORAGE_KEYS.map((k) => {
            const has = localStorage.getItem(k.key) !== null;
            return (
              <li
                key={k.key}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-3"
              >
                <div>
                  <p className="text-sm font-medium text-slate-100">{k.label}</p>
                  <p className="text-xs text-slate-500">{k.desc}</p>
                </div>
                <div className="flex items-center gap-2">
                  {cleared === k.key ? (
                    <span className="flex items-center gap-1 text-xs text-emerald-300">
                      <CheckCircle2 size={12} /> Cleared
                    </span>
                  ) : has ? (
                    <Button variant="ghost" onClick={() => clearKey(k.key)}>
                      <Trash2 size={14} /> Clear
                    </Button>
                  ) : (
                    <span className="text-xs text-slate-600">Empty</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        <div className="mt-4 border-t border-white/10 pt-4">
          <Button variant="danger" onClick={clearAllLocal}>
            <Trash2 size={15} /> Clear all local data
          </Button>
          <p className="mt-2 text-xs text-slate-500">
            This removes checklist progress and the campus sample directory from this
            browser. Your account data (contacts, reports, history) is not affected.
          </p>
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-3 flex items-center gap-2">
          <Shield size={16} className="text-blue-300" />
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
            Analysis method
          </h3>
        </div>
        <p className="text-sm leading-relaxed text-slate-300">
          By default, Cybersecurity Guardian uses transparent rule-based pattern
          detection. This is a demo tool and does not use real AI or live threat
          intelligence. Risk assessments can be incorrect — treat results as
          guidance, not verdicts.
        </p>
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
          <AlertTriangle size={13} className="mt-0.5 shrink-0" />
          The scam and URL analysis runs entirely in your browser using pattern
          matching. No external reputation service is queried.
        </div>
      </Card>
    </div>
  );
}

export function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <SectionTitle
        title="About AI Guardian"
        subtitle="An all-in-one AI safety platform for individuals, students, and families."
        icon={<Info size={18} />}
      />

      <Card className="p-6">
        <h3 className="text-base font-semibold text-white">Mission</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          AI Guardian brings scam detection, personal emergency tools, campus safety,
          and family education together in one accessible, honest platform. It is
          designed for demonstration and educational use — including college project
          showcases — and prioritizes transparency over false confidence.
        </p>
      </Card>

      <Card className="p-6">
        <h3 className="text-base font-semibold text-white">What it does</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          <li className="flex gap-2"><span className="text-blue-400">•</span> Detects common scam and phishing signals in messages and URLs.</li>
          <li className="flex gap-2"><span className="text-blue-400">•</span> Provides an SOS interface with trusted contacts and an action checklist.</li>
          <li className="flex gap-2"><span className="text-blue-400">•</span> Offers a campus safety dashboard with incident reporting.</li>
          <li className="flex gap-2"><span className="text-blue-400">•</span> Delivers age-appropriate family online safety education.</li>
        </ul>
      </Card>

      <Card className="p-6">
        <h3 className="text-base font-semibold text-white">Honesty & limits</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-300">
          <li className="flex gap-2"><span className="text-amber-400">•</span> Risk assessments can be incorrect. Treat results as guidance, not verdicts.</li>
          <li className="flex gap-2"><span className="text-amber-400">•</span> The app never claims a URL is safe without reliable verification.</li>
          <li className="flex gap-2"><span className="text-amber-400">•</span> SOS does not automatically contact anyone — delivery is never faked.</li>
          <li className="flex gap-2"><span className="text-amber-400">•</span> The app does not monitor SMS, calls, or your device.</li>
          <li className="flex gap-2"><span className="text-amber-400">•</span> Campus contacts use clearly labeled sample data until replaced.</li>
          <li className="flex gap-2"><span className="text-amber-400">•</span> The app collects only what you enter, stored locally on your device.</li>
        </ul>
      </Card>

      <Card className="p-6">
        <h3 className="text-base font-semibold text-white">Privacy</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          Your trusted contacts, incident reports, and analysis history are stored
          securely in your account on an encrypted database. Only you can read
          them — no other user can access your private records. Location sharing
          requires your explicit permission and is never shared automatically. No
          unnecessary personal information is collected. See Settings to manage
          your data at any time.
        </p>
      </Card>

      <p className="text-center text-xs text-slate-600">
        AI Guardian · Educational safety demo · Not a substitute for professional
        emergency services
      </p>
    </div>
  );
}
