import type { ReactNode } from 'react';

export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-[#0e1a35]/70 backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      {icon && (
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
          {icon}
        </div>
      )}
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-0.5 text-sm text-slate-400">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  type = 'button',
  disabled,
  className = '',
  fullWidth,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  type?: 'button' | 'submit';
  disabled?: boolean;
  className?: string;
  fullWidth?: boolean;
}) {
  const variants = {
    primary:
      'bg-blue-500 hover:bg-blue-400 text-white shadow-lg shadow-blue-500/20 disabled:opacity-40 disabled:hover:bg-blue-500',
    secondary:
      'bg-white/5 hover:bg-white/10 text-slate-100 border border-white/10 disabled:opacity-40',
    danger:
      'bg-red-500 hover:bg-red-400 text-white shadow-lg shadow-red-500/20 disabled:opacity-40',
    ghost: 'text-slate-300 hover:text-white hover:bg-white/5 disabled:opacity-40',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-400/50 ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

export function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  ariaLabel,
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      aria-label={ariaLabel}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full rounded-xl border border-white/10 bg-[#060d1f]/60 px-4 py-2.5 text-sm text-white placeholder:text-slate-500 transition-colors focus:border-blue-400/60 focus:outline-none focus:ring-2 focus:ring-blue-400/20 ${className}`}
    />
  );
}

export function Textarea({
  value,
  onChange,
  placeholder,
  rows = 5,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  ariaLabel?: string;
}) {
  return (
    <textarea
      value={value}
      aria-label={ariaLabel}
      placeholder={placeholder}
      rows={rows}
      onChange={(e) => onChange(e.target.value)}
      className="w-full resize-y rounded-xl border border-white/10 bg-[#060d1f]/60 px-4 py-3 text-sm leading-relaxed text-white placeholder:text-slate-500 transition-colors focus:border-blue-400/60 focus:outline-none focus:ring-2 focus:ring-blue-400/20"
    />
  );
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'blue' | 'green' | 'amber' | 'red';
}) {
  const tones = {
    neutral: 'bg-white/5 text-slate-300 border-white/10',
    blue: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    green: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    red: 'bg-red-500/15 text-red-300 border-red-500/30',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  message,
}: {
  icon: ReactNode;
  title: string;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 px-6 py-10 text-center">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 text-slate-500">
        {icon}
      </div>
      <p className="text-sm font-semibold text-slate-200">{title}</p>
      <p className="mt-1 max-w-sm text-xs text-slate-500">{message}</p>
    </div>
  );
}

export function Notice({
  tone = 'neutral',
  title,
  children,
}: {
  tone?: 'neutral' | 'info' | 'warning';
  title?: string;
  children: ReactNode;
}) {
  const tones = {
    neutral: 'border-white/10 bg-white/5 text-slate-300',
    info: 'border-blue-500/30 bg-blue-500/10 text-blue-200',
    warning: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
  };
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${tones[tone]}`}>
      {title && <p className="mb-1 font-semibold">{title}</p>}
      <div className="text-[13px] leading-relaxed opacity-90">{children}</div>
    </div>
  );
}
