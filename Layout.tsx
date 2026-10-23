import { useState, useEffect } from 'react';
import {
  Shield,
  Home,
  Lock,
  HeartPulse,
  GraduationCap,
  Users,
  Settings,
  Info,
  Menu,
  X,
} from 'lucide-react';
import { AccountBadge } from '@/components/AuthGate';

export type Route =
  | 'home'
  | 'cyber'
  | 'personal'
  | 'student'
  | 'family'
  | 'settings'
  | 'about';

interface NavItem {
  route: Route;
  label: string;
  icon: typeof Shield;
}

const NAV: NavItem[] = [
  { route: 'home', label: 'Home', icon: Home },
  { route: 'cyber', label: 'Cybersecurity', icon: Lock },
  { route: 'personal', label: 'Personal Safety', icon: HeartPulse },
  { route: 'student', label: 'Student Safety', icon: GraduationCap },
  { route: 'family', label: 'Family Guardian', icon: Users },
  { route: 'settings', label: 'Settings', icon: Settings },
  { route: 'about', label: 'About', icon: Info },
];

const MODULE_NAV = NAV.filter((n) =>
  ['cyber', 'personal', 'student', 'family'].includes(n.route),
);

export function Sidebar({
  route,
  navigate,
}: {
  route: Route;
  navigate: (r: Route) => void;
}) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-[#0a1428]/80 backdrop-blur md:flex md:flex-col">
      <div className="flex h-16 items-center gap-2.5 border-b border-white/10 px-5">
        <ShieldLogo />
        <div className="leading-tight">
          <p className="text-sm font-bold tracking-tight text-white">AI Guardian</p>
          <p className="text-[10px] uppercase tracking-[0.18em] text-blue-300/70">
            Safety Platform
          </p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV.map((item) => (
          <NavButton
            key={item.route}
            item={item}
            active={route === item.route}
            onClick={() => navigate(item.route)}
          />
        ))}
      </nav>
      <div className="border-t border-white/10 px-4 py-4">
        <div className="mb-3">
          <AccountBadge />
        </div>
        <p className="text-[10px] leading-relaxed text-slate-500">
          Risk assessments can be incorrect. This tool assists judgment — it does
          not replace professional advice or emergency services.
        </p>
      </div>
    </aside>
  );
}

export function MobileNav({
  route,
  navigate,
}: {
  route: Route;
  navigate: (r: Route) => void;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    setOpen(false);
  }, [route]);
  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-white/10 bg-[#0a1428]/95 px-4 backdrop-blur md:hidden">
        <div className="flex items-center gap-2">
          <ShieldLogo small />
          <span className="text-sm font-bold text-white">AI Guardian</span>
        </div>
        <div className="flex items-center gap-2">
          <AccountBadge />
          <button
            aria-label="Toggle menu"
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-slate-200"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>
      {open && (
        <div className="fixed inset-0 z-40 md:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <nav
            className="absolute right-0 top-14 h-[calc(100vh-3.5rem)] w-64 space-y-1 overflow-y-auto border-l border-white/10 bg-[#0a1428] px-3 py-4"
            onClick={(e) => e.stopPropagation()}
          >
            {NAV.map((item) => (
              <NavButton
                key={item.route}
                item={item}
                active={route === item.route}
                onClick={() => navigate(item.route)}
              />
            ))}
          </nav>
        </div>
      )}
    </>
  );
}

export function ShieldLogo({ small }: { small?: boolean }) {
  const size = small ? 'h-7 w-7' : 'h-9 w-9';
  return (
    <div
      className={`flex ${size} items-center justify-center rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-lg shadow-blue-500/30`}
    >
      <Shield size={small ? 16 : 20} strokeWidth={2.5} />
    </div>
  );
}

function NavButton({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
        active
          ? 'bg-blue-500/15 text-blue-200 shadow-[inset_0_0_0_1px] shadow-blue-500/30'
          : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
      }`}
    >
      <Icon size={17} className={active ? 'text-blue-300' : ''} />
      {item.label}
    </button>
  );
}

export function ModuleHeader({
  route,
  navigate,
}: {
  route: Route;
  navigate: (r: Route) => void;
}) {
  return (
    <nav className="flex gap-1 overflow-x-auto rounded-xl border border-white/10 bg-[#0a1428]/60 p-1 md:hidden">
      {MODULE_NAV.map((item) => {
        const Icon = item.icon;
        const active = route === item.route;
        return (
          <button
            key={item.route}
            onClick={() => navigate(item.route)}
            className={`flex flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-[10px] font-medium transition-colors ${
              active ? 'bg-blue-500/15 text-blue-200' : 'text-slate-400'
            }`}
          >
            <Icon size={18} />
            {item.label.split(' ')[0]}
          </button>
        );
      })}
    </nav>
  );
}
