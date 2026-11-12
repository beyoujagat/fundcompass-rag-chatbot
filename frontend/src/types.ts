export type Theme = 'light' | 'dark' | 'soft-blue';

export interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  intent?: string;
  sourceUrl?: string | null;
  lastUpdated?: string;
  timestamp: string;
}

export interface SchemeItem {
  scheme_id: string;
  scheme_name: string;
  category: string;
  source_url: string;
  facts: {
    expense_ratio: string;
    exit_load: string;
    min_sip_amount: string;
    lock_in_period: string;
    riskometer: string;
    benchmark?: string;
    factsheet_url?: string;
    nav?: string;
    nav_date?: string;
  };
}

export interface SchemeMeta {
  id: string;
  name: string;
  shortName: string;
  category: string;
  minSip: number;
  minLumpsum: number;
  lockIn: string;
  riskometer: string;
  benchmark: string;
  expenseRatio: string;
  sourceUrl: string;
  factsheetUrl: string;
  lastUpdated: string;
}

export interface SipCalculationResult {
  invested: number;
  returns: number;
  total: number;
  investedPct: number;
  returnsPct: number;
}

export interface StarterQuestion {
  question: string;
  scheme: string;
  category: string;
  highlight: string;
  badgeStyle: string;
  cardStyle: string;
  iconBoxStyle: string;
  icon: React.ReactNode;
}

export interface QuickHelpFAQ {
  id: string;
  schemeKey: 'midcap' | 'smallcap' | 'gold' | 'top100' | 'elss' | 'rules';
  schemeName: string;
  category: string;
  question: string;
  answer: string;
  sourceUrl?: string;
  factsheetUrl?: string;
}

export interface FaqSchemeTab {
  id: string;
  label: string;
}
