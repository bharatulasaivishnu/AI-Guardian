import { supabase } from '@/lib/supabase';
import type { AnalysisResult, TrustedContact, IncidentReport } from '@/types';

// ---- Row shapes from the database (snake_case) ----
export interface TrustedContactRow {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  relationship: string;
  created_at: string;
}

export interface IncidentReportRow {
  id: string;
  user_id: string;
  category: string;
  location: string;
  description: string;
  urgency: 'low' | 'medium' | 'high';
  status: 'submitted';
  created_at: string;
}

export interface AnalysisHistoryRow {
  id: string;
  user_id: string;
  type: 'message' | 'url';
  input: string;
  risk_level: 'low' | 'medium' | 'high' | 'unable';
  summary: string;
  indicators: unknown;
  general_guidance: string[];
  recommended_actions: string[];
  is_demo: boolean;
  created_at: string;
}

// ---- Conversions between DB rows and frontend types ----
export function rowToContact(r: TrustedContactRow): TrustedContact {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone,
    relationship: r.relationship,
  };
}

export function rowToIncident(r: IncidentReportRow): IncidentReport {
  return {
    id: r.id,
    category: r.category,
    location: r.location,
    description: r.description,
    urgency: r.urgency,
    status: r.status,
    createdAt: new Date(r.created_at).getTime(),
  };
}

export function rowToAnalysis(r: AnalysisHistoryRow): AnalysisResult {
  return {
    id: r.id,
    type: r.type,
    input: r.input,
    riskLevel: r.risk_level,
    summary: r.summary,
    indicators: (r.indicators as AnalysisResult['indicators']) ?? [],
    generalGuidance: r.general_guidance ?? [],
    recommendedActions: r.recommended_actions ?? [],
    isDemo: r.is_demo,
    createdAt: new Date(r.created_at).getTime(),
  };
}

// ---- Trusted contacts CRUD ----
export async function fetchContacts(): Promise<TrustedContactRow[]> {
  const { data, error } = await supabase
    .from('trusted_contacts')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw new Error(error.message);
  return (data as TrustedContactRow[]) ?? [];
}

export async function insertContact(
  c: Omit<TrustedContact, 'id'>,
): Promise<TrustedContactRow> {
  const { data, error } = await supabase
    .from('trusted_contacts')
    .insert({ name: c.name, phone: c.phone, relationship: c.relationship })
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Failed to save contact.');
  return data as TrustedContactRow;
}

export async function deleteContact(id: string): Promise<void> {
  const { error } = await supabase.from('trusted_contacts').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ---- Incident reports CRUD ----
export async function fetchIncidents(): Promise<IncidentReportRow[]> {
  const { data, error } = await supabase
    .from('incident_reports')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data as IncidentReportRow[]) ?? [];
}

export async function insertIncident(
  r: Omit<IncidentReport, 'id' | 'status' | 'createdAt'>,
): Promise<IncidentReportRow> {
  const { data, error } = await supabase
    .from('incident_reports')
    .insert({
      category: r.category,
      location: r.location,
      description: r.description,
      urgency: r.urgency,
    })
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Failed to submit report.');
  return data as IncidentReportRow;
}

// ---- Analysis history CRUD ----
export async function fetchHistory(limit = 25): Promise<AnalysisHistoryRow[]> {
  const { data, error } = await supabase
    .from('analysis_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data as AnalysisHistoryRow[]) ?? [];
}

export async function insertAnalysis(
  r: AnalysisResult,
): Promise<AnalysisHistoryRow> {
  const { data, error } = await supabase
    .from('analysis_history')
    .insert({
      type: r.type,
      input: r.input,
      risk_level: r.riskLevel,
      summary: r.summary,
      indicators: r.indicators,
      general_guidance: r.generalGuidance,
      recommended_actions: r.recommendedActions,
      is_demo: r.isDemo,
    })
    .select()
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Failed to save analysis.');
  return data as AnalysisHistoryRow;
}

export async function clearHistory(): Promise<void> {
  const { error } = await supabase.from('analysis_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw new Error(error.message);
}

// ---- Checklist progress CRUD ----
export interface ChecklistProgressRow {
  id: string;
  user_id: string;
  item_index: number;
  checked: boolean;
  updated_at: string;
}

export async function fetchChecklistProgress(): Promise<ChecklistProgressRow[]> {
  const { data, error } = await supabase
    .from('checklist_progress')
    .select('item_index, checked')
    .order('item_index', { ascending: true });
  if (error) throw new Error(error.message);
  return (data as ChecklistProgressRow[]) ?? [];
}

export async function upsertChecklistItem(itemIndex: number, checked: boolean): Promise<void> {
  const { error } = await supabase
    .from('checklist_progress')
    .upsert({ item_index: itemIndex, checked }, { onConflict: 'user_id,item_index' });
  if (error) throw new Error(error.message);
}
