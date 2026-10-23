import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
  fetchContacts,
  insertContact,
  deleteContact,
  fetchIncidents,
  insertIncident,
  fetchHistory,
  insertAnalysis,
  clearHistory,
  fetchChecklistProgress,
  upsertChecklistItem,
  rowToContact,
  rowToIncident,
  rowToAnalysis,
} from '@/lib/db';
import type { AnalysisResult, TrustedContact, IncidentReport } from '@/types';

interface UseUserDataResult {
  contacts: TrustedContact[];
  incidents: IncidentReport[];
  history: AnalysisResult[];
  checklist: boolean[];
  loading: boolean;
  error: string;
  reloadAll: () => Promise<void>;
  addContact: (c: Omit<TrustedContact, 'id'>) => Promise<void>;
  removeContact: (id: string) => Promise<void>;
  addIncident: (r: Omit<IncidentReport, 'id' | 'status' | 'createdAt'>) => Promise<void>;
  addAnalysis: (r: AnalysisResult) => Promise<void>;
  clearAnalysisHistory: () => Promise<void>;
  toggleChecklistItem: (index: number, checked: boolean) => Promise<void>;
}

export function useUserData(isAuthenticated: boolean): UseUserDataResult {
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [incidents, setIncidents] = useState<IncidentReport[]>([]);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [checklist, setChecklist] = useState<boolean[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reloadAll = useCallback(async () => {
    if (!isAuthenticated) {
      setContacts([]);
      setIncidents([]);
      setHistory([]);
      setChecklist([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [c, i, h, cp] = await Promise.all([
        fetchContacts(),
        fetchIncidents(),
        fetchHistory(),
        fetchChecklistProgress(),
      ]);
      setContacts(c.map(rowToContact));
      setIncidents(i.map(rowToIncident));
      setHistory(h.map(rowToAnalysis));
      setChecklist(cp.map((row) => row.checked));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    reloadAll();
  }, [reloadAll]);

  const addContact = useCallback(async (c: Omit<TrustedContact, 'id'>) => {
    const row = await insertContact(c);
    setContacts((prev) => [...prev, rowToContact(row)]);
  }, []);

  const removeContact = useCallback(async (id: string) => {
    await deleteContact(id);
    setContacts((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const addIncident = useCallback(
    async (r: Omit<IncidentReport, 'id' | 'status' | 'createdAt'>) => {
      const row = await insertIncident(r);
      setIncidents((prev) => [rowToIncident(row), ...prev]);
    },
    [],
  );

  const addAnalysis = useCallback(async (r: AnalysisResult) => {
    const row = await insertAnalysis(r);
    setHistory((prev) => [rowToAnalysis(row), ...prev].slice(0, 25));
  }, []);

  const clearAnalysisHistory = useCallback(async () => {
    await clearHistory();
    setHistory([]);
  }, []);

  const toggleChecklistItem = useCallback(async (index: number, checked: boolean) => {
    setChecklist((prev) => {
      const next = [...prev];
      next[index] = checked;
      return next;
    });
    await upsertChecklistItem(index, checked);
  }, []);

  return {
    contacts,
    incidents,
    history,
    checklist,
    loading,
    error,
    reloadAll,
    addContact,
    removeContact,
    addIncident,
    addAnalysis,
    clearAnalysisHistory,
    toggleChecklistItem,
  };
}

/**
 * On a user's first sign-in, migrate any localStorage data that has a natural
 * server-side home. Returns the counts migrated. Only runs once per user
 * (guarded by a localStorage flag keyed by user id).
 */
export async function migrateLocalStorage(userId: string): Promise<{
  contacts: number;
  incidents: number;
  history: number;
  checklist: number;
}> {
  const flagKey = `ag_migrated_${userId}`;
  if (localStorage.getItem(flagKey)) {
    return { contacts: 0, incidents: 0, history: 0, checklist: 0 };
  }

  let contacts = 0;
  let incidents = 0;
  let history = 0;
  let checklist = 0;

  try {
    const rawContacts = localStorage.getItem('ag_contacts');
    if (rawContacts) {
      const parsed = JSON.parse(rawContacts) as TrustedContact[];
      for (const c of parsed) {
        try {
          await insertContact({
            name: c.name,
            phone: c.phone,
            relationship: c.relationship,
          });
          contacts++;
        } catch {
          // skip duplicates / validation failures
        }
      }
    }
  } catch {
    /* parse error — skip */
  }

  try {
    const rawIncidents = localStorage.getItem('ag_incidents');
    if (rawIncidents) {
      const parsed = JSON.parse(rawIncidents) as IncidentReport[];
      for (const r of parsed) {
        if (!r.description || r.description.length < 10) continue;
        try {
          await insertIncident({
            category: r.category,
            location: r.location,
            description: r.description,
            urgency: r.urgency,
          });
          incidents++;
        } catch {
          // skip validation failures
        }
      }
    }
  } catch {
    /* parse error — skip */
  }

  try {
    const rawHistory = localStorage.getItem('ag_history');
    if (rawHistory) {
      const parsed = JSON.parse(rawHistory) as AnalysisResult[];
      // most recent first in localStorage; insert oldest first to preserve order
      for (let i = parsed.length - 1; i >= 0; i--) {
        const r = parsed[i];
        if (!r.input || r.input.length === 0) continue;
        try {
          await insertAnalysis(r);
          history++;
        } catch {
          // skip validation failures
        }
      }
    }
  } catch {
    /* parse error — skip */
  }

  try {
    const rawChecklist = localStorage.getItem('ag_family_checklist');
    if (rawChecklist) {
      const parsed = JSON.parse(rawChecklist) as boolean[];
      for (let i = 0; i < parsed.length && i < 8; i++) {
        if (parsed[i]) {
          try {
            await upsertChecklistItem(i, true);
            checklist++;
          } catch {
            // skip failures
          }
        }
      }
    }
  } catch {
    /* parse error — skip */
  }

  localStorage.setItem(flagKey, '1');
  return { contacts, incidents, history, checklist };
}

/**
 * Check whether the current session belongs to a brand-new user who has not
 * yet been migrated. Exposed for the auth flow.
 */
export async function checkAndMigrate(): Promise<void> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await migrateLocalStorage(data.user.id);
}
