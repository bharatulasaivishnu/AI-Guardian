import type { RiskLevel } from '@/types';

export const riskConfig: Record<
  RiskLevel,
  { label: string; text: string; bg: string; border: string; dot: string; ring: string }
> = {
  low: {
    label: 'Low Risk',
    text: 'text-emerald-300',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/40',
    dot: 'bg-emerald-400',
    ring: 'ring-emerald-500/30',
  },
  medium: {
    label: 'Medium Risk',
    text: 'text-amber-300',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/40',
    dot: 'bg-amber-400',
    ring: 'ring-amber-500/30',
  },
  high: {
    label: 'High Risk',
    text: 'text-red-300',
    bg: 'bg-red-500/10',
    border: 'border-red-500/40',
    dot: 'bg-red-400',
    ring: 'ring-red-500/30',
  },
  unable: {
    label: 'Unable to Determine',
    text: 'text-slate-300',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/40',
    dot: 'bg-slate-400',
    ring: 'ring-slate-500/30',
  },
};
