import { createContext, useContext } from 'react';
import { useUserData, migrateLocalStorage } from '@/lib/useUserData';
import { useAuth } from '@/lib/auth';
import type { AnalysisResult, TrustedContact, IncidentReport } from '@/types';

interface DataContextValue {
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

const DataContext = createContext<DataContextValue | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const data = useUserData(!!user);
  return <DataContext.Provider value={data}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}

export { migrateLocalStorage };
