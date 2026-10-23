export type RiskLevel = 'low' | 'medium' | 'high' | 'unable';

export interface RiskIndicator {
  label: string;
  matched: boolean;
  explanation: string;
  snippet?: string;
}

export interface AnalysisResult {
  id: string;
  type: 'message' | 'url';
  input: string;
  riskLevel: RiskLevel;
  summary: string;
  indicators: RiskIndicator[];
  generalGuidance: string[];
  recommendedActions: string[];
  isDemo: boolean;
  createdAt: number;
  reputation?: {
    reputation: 'safe' | 'unsafe' | 'unrated';
    threatTypes: string[];
    summary: string;
    details: string;
  };
}

export interface TrustedContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
}

export interface IncidentReport {
  id: string;
  category: string;
  location: string;
  description: string;
  urgency: 'low' | 'medium' | 'high';
  status: 'submitted';
  createdAt: number;
}

export interface CampusContact {
  id: string;
  name: string;
  role: string;
  phone: string;
  isSample: boolean;
}

export type AnalysisHistory = AnalysisResult[];
