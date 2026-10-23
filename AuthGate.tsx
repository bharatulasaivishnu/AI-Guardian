import { useState } from 'react';
import { Shield, Mail, Lock, Loader2, AlertTriangle, UserPlus, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { Button, Input, Notice } from '@/components/ui';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy-gradient">
        <div className="flex items-center gap-3 text-slate-400">
          <Loader2 size={20} className="animate-spin text-blue-300" />
          <span className="text-sm">Loading your dashboard…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <SignInScreen />;
  }

  return <>{children}</>;
}

function SignInScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    setInfo('');
    if (!email.trim() || !password) {
      setErr('Enter your email and password.');
      return;
    }
    if (password.length < 6) {
      setErr('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    if (mode === 'signup') {
      const { error } = await signUp(email.trim(), password);
      if (error) {
        setErr(error);
      } else {
        setInfo(
          'Account created. If email confirmation is enabled, check your inbox — otherwise you are signed in.',
        );
        setMode('signin');
      }
    } else {
      const { error } = await signIn(email.trim(), password);
      if (error) setErr(error);
    }
    setBusy(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-gradient px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg shadow-blue-500/30">
            <Shield size={26} strokeWidth={2.5} />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-white">AI Guardian</h1>
          <p className="mt-1 text-sm text-slate-400">
            Sign in to sync your contacts, reports, and analysis history securely.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0e1a35]/70 p-6 backdrop-blur-sm">
          <div className="mb-5 flex gap-1 rounded-xl border border-white/10 bg-[#0a1428]/60 p-1">
            <button
              onClick={() => setMode('signin')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                mode === 'signin' ? 'bg-blue-500/15 text-blue-200' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn size={15} /> Sign in
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                mode === 'signup' ? 'bg-blue-500/15 text-blue-200' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserPlus size={15} /> Create account
            </button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs text-slate-400">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <Input
                  value={email}
                  onChange={setEmail}
                  placeholder="you@example.com"
                  type="email"
                  ariaLabel="Email"
                  className="pl-9"
                />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-400">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <Input
                  value={password}
                  onChange={setPassword}
                  placeholder="At least 6 characters"
                  type="password"
                  ariaLabel="Password"
                  className="pl-9"
                />
              </div>
            </div>

            {err && (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                {err}
              </div>
            )}
            {info && <Notice tone="info">{info}</Notice>}

            <Button type="submit" fullWidth disabled={busy}>
              {busy ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Please wait…
                </>
              ) : mode === 'signup' ? (
                'Create account'
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-[11px] leading-relaxed text-slate-600">
          Your password is never stored in plain text. Authentication is handled
          by Supabase Auth. Your contacts, reports, and scans are private to
          your account — no other user can read them.
        </p>
      </div>
    </div>
  );
}

export function AccountBadge() {
  const { user, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  if (!user) return null;

  const email = user.email ?? 'Account';

  async function handleSignOut() {
    setBusy(true);
    await signOut();
    setBusy(false);
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/15 text-xs font-bold text-blue-200">
        {email.charAt(0).toUpperCase()}
      </div>
      <span className="max-w-[140px] truncate text-xs text-slate-300">{email}</span>
      <button
        onClick={handleSignOut}
        disabled={busy}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-40"
        aria-label="Sign out"
      >
        <LogOut size={14} />
      </button>
    </div>
  );
}
