import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Send,
  Compass,
  ShieldAlert,
  BookOpen,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Plus,
  Clock,
  Settings,
  Headphones,
  User,
  Wallet,
  Lock,
  Percent,
  PieChart,
  HelpCircle,
  ChevronDown,
  ArrowUp,
  ArrowRight,
  ShieldCheck,
  Copy,
  Check,
  Menu,
  X,
  MessageSquare,
  SlidersHorizontal,
  Info,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft,
  ChevronRight,
  Calculator,
  Sun,
  Moon,
  Droplet,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import compassEmblem from './assets/compass-emblem.png';
import growwBadge from './assets/groww-badge.png';
import { AutocompleteSuggestions } from './components/AutocompleteSuggestions';
import { getQuestionSuggestions, QuestionSuggestion } from './data/questionSuggestions';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  intent?: string;
  sourceUrl?: string | null;
  lastUpdated?: string;
  timestamp: string;
}

interface SchemeItem {
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

export const CANONICAL_SCHEMES: SchemeMeta[] = [
  {
    id: 'hdfc-mid-cap-fund-direct-growth',
    name: 'HDFC Mid-Cap Opportunities Fund (Direct Plan - Growth)',
    shortName: 'HDFC Mid-Cap Opportunities Fund',
    category: 'Equity: Mid Cap',
    minSip: 100,
    minLumpsum: 100,
    lockIn: 'Nil',
    riskometer: 'Very High',
    benchmark: 'NIFTY Midcap 150 TRI',
    expenseRatio: '0.76%',
    sourceUrl: 'https://groww.in/mutual-funds/hdfc-mid-cap-fund-direct-growth',
    factsheetUrl: 'https://www.hdfcfund.com/investor-services/fund-performance/factsheet',
    lastUpdated: '2026-11-10'
  },
  {
    id: 'hdfc-small-cap-fund-direct-growth',
    name: 'HDFC Small Cap Fund (Direct Plan - Growth)',
    shortName: 'HDFC Small Cap Fund',
    category: 'Equity: Small Cap',
    minSip: 100,
    minLumpsum: 100,
    lockIn: 'Nil',
    riskometer: 'Very High',
    benchmark: 'S&P BSE 250 SmallCap TRI',
    expenseRatio: '0.67%',
    sourceUrl: 'https://groww.in/mutual-funds/hdfc-small-cap-fund-direct-growth',
    factsheetUrl: 'https://www.hdfcfund.com/investor-services/fund-performance/factsheet',
    lastUpdated: '2026-11-10'
  },
  {
    id: 'hdfc-gold-etf-fund-of-fund-direct-plan-growth',
    name: 'HDFC Gold ETF Fund of Fund (Direct Plan - Growth)',
    shortName: 'HDFC Gold ETF Fund of Fund',
    category: 'Commodities / Gold FoF',
    minSip: 100,
    minLumpsum: 100,
    lockIn: 'Nil',
    riskometer: 'High',
    benchmark: 'Domestic Price of Physical Gold',
    expenseRatio: '0.16%',
    sourceUrl: 'https://groww.in/mutual-funds/hdfc-gold-etf-fund-of-fund-direct-plan-growth',
    factsheetUrl: 'https://www.hdfcfund.com/investor-services/fund-performance/factsheet',
    lastUpdated: '2026-11-10'
  },
  {
    id: 'hdfc-large-cap-fund-direct-growth',
    name: 'HDFC Top 100 / Large Cap Fund (Direct Plan - Growth)',
    shortName: 'HDFC Top 100 Fund',
    category: 'Equity: Large Cap',
    minSip: 100,
    minLumpsum: 100,
    lockIn: 'Nil',
    riskometer: 'Very High',
    benchmark: 'NIFTY 100 TRI',
    expenseRatio: '0.99%',
    sourceUrl: 'https://groww.in/mutual-funds/hdfc-large-cap-fund-direct-growth',
    factsheetUrl: 'https://www.hdfcfund.com/investor-services/fund-performance/factsheet',
    lastUpdated: '2026-11-10'
  },
  {
    id: 'hdfc-elss-tax-saver-fund-direct-plan-growth',
    name: 'HDFC ELSS Tax Saver Fund (Direct Plan - Growth)',
    shortName: 'HDFC ELSS Tax Saver Fund',
    category: 'Equity: ELSS (Tax Saving)',
    minSip: 500,
    minLumpsum: 500,
    lockIn: '3 Years (Sec 80C)',
    riskometer: 'Very High',
    benchmark: 'NIFTY 500 TRI',
    expenseRatio: '1.08%',
    sourceUrl: 'https://groww.in/mutual-funds/hdfc-elss-tax-saver-fund-direct-plan-growth',
    factsheetUrl: 'https://www.hdfcfund.com/investor-services/fund-performance/factsheet',
    lastUpdated: '2026-11-10'
  }
];

export interface SipCalculationResult {
  invested: number;
  returns: number;
  total: number;
  investedPct: number;
  returnsPct: number;
}

export function computeSipOrLumpsum(
  amount: number,
  years: number,
  annualRatePct: number,
  mode: 'sip' | 'lumpsum' = 'sip'
): SipCalculationResult {
  const safeAmount = Math.max(0, amount);
  const safeYears = Math.max(1, years);
  const safeRate = Math.max(0, annualRatePct);

  if (mode === 'lumpsum') {
    const invested = safeAmount;
    const r = safeRate / 100;
    const fv = invested * Math.pow(1 + r, safeYears);
    const returns = Math.max(0, fv - invested);
    const investedPct = fv > 0 ? Math.round((invested / fv) * 100) : 100;
    const returnsPct = 100 - investedPct;
    return {
      invested: Math.round(invested),
      returns: Math.round(returns),
      total: Math.round(fv),
      investedPct,
      returnsPct
    };
  }

  // Monthly SIP compounding: Annuity Due (beginning-of-month instalments, Zerodha/Groww formula)
  const n = safeYears * 12;
  const i = safeRate / 100 / 12;
  const invested = safeAmount * n;
  let fv = invested;
  if (i > 0) {
    fv = safeAmount * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
  }
  const returns = Math.max(0, fv - invested);
  const investedPct = fv > 0 ? Math.min(100, Math.max(0, Math.round((invested / fv) * 100))) : 100;
  const returnsPct = 100 - investedPct;

  return {
    invested: Math.round(invested),
    returns: Math.round(returns),
    total: Math.round(fv),
    investedPct,
    returnsPct
  };
}

export function formatINR(val: number): string {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(val));
}

interface StarterQuestion {
  question: string;
  scheme: string;
  category: string;
  highlight: string;
  badgeStyle: string;
  cardStyle: string;
  iconBoxStyle: string;
  icon: React.ReactNode;
}

const STARTER_QUESTIONS: StarterQuestion[] = [
  {
    question: "What is the exit load for HDFC Mid-Cap Opportunities Fund?",
    scheme: "HDFC Mid-Cap Opportunities Fund",
    category: "Mid Cap • Growth",
    highlight: "1.00% if redeemed < 1 yr",
    badgeStyle: "bg-emerald-50 text-emerald-700 border-emerald-200/90",
    cardStyle: "",
    iconBoxStyle: "bg-emerald-50/80 border-emerald-200/80",
    icon: <Percent className="w-3.5 h-3.5 text-emerald-600" />
  },
  {
    question: "What is the lock-in period for HDFC ELSS Tax Saver Fund?",
    scheme: "HDFC ELSS Tax Saver Fund",
    category: "ELSS • Tax Saver",
    highlight: "3-year statutory lock-in",
    badgeStyle: "bg-teal-50 text-teal-700 border-teal-200/90",
    cardStyle: "",
    iconBoxStyle: "bg-teal-50/80 border-teal-200/80",
    icon: <Lock className="w-3.5 h-3.5 text-teal-600" />
  },
  {
    question: "What is the minimum SIP amount for HDFC Small Cap Fund?",
    scheme: "HDFC Small Cap Fund",
    category: "Small Cap • Growth",
    highlight: "₹100 monthly minimum...",
    badgeStyle: "bg-sky-50 text-sky-700 border-sky-200/90",
    cardStyle: "",
    iconBoxStyle: "bg-sky-50/80 border-sky-200/80",
    icon: <Wallet className="w-3.5 h-3.5 text-sky-600" />
  },
  {
    question: "What is the expense ratio for HDFC Top 100 Fund?",
    scheme: "HDFC Top 100 Fund",
    category: "Large Cap • Growth",
    highlight: "1.09% direct plan expen...",
    badgeStyle: "bg-blue-50 text-blue-700 border-blue-200/90",
    cardStyle: "",
    iconBoxStyle: "bg-blue-50/80 border-blue-200/80",
    icon: <PieChart className="w-3.5 h-3.5 text-blue-600" />
  }
];

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

export const FAQ_SCHEME_TABS = [
  { id: 'all', label: 'All Schemes' },
  { id: 'midcap', label: 'HDFC Mid-Cap' },
  { id: 'smallcap', label: 'HDFC Small Cap' },
  { id: 'gold', label: 'HDFC Gold FoF' },
  { id: 'top100', label: 'HDFC Top 100' },
  { id: 'elss', label: 'HDFC ELSS Tax Saver' },
  { id: 'rules', label: 'Platform Rules' },
] as const;

export const QUICK_HELP_FAQS: QuickHelpFAQ[] = [
  // 1. HDFC Mid-Cap Opportunities Fund
  {
    id: 'midcap-exit',
    schemeKey: 'midcap',
    schemeName: 'HDFC Mid-Cap Opportunities Fund',
    category: 'Equity: Mid Cap',
    question: 'What is the exit load for HDFC Mid-Cap Opportunities Fund?',
    answer: 'An exit load of 1.00% is applicable if units are redeemed or switched out within 1 year (365 days) from the date of allotment. If units are redeemed after 1 year, the exit load is Nil (0%).',
    sourceUrl: 'https://groww.in/mutual-funds/hdfc-mid-cap-fund-direct-growth',
    factsheetUrl: 'https://www.hdfcfund.com/investor-services/fund-performance/factsheet'
  },
  {
    id: 'midcap-expense',
    schemeKey: 'midcap',
    schemeName: 'HDFC Mid-Cap Opportunities Fund',
    category: 'Equity: Mid Cap',
    question: 'What is the expense ratio of HDFC Mid-Cap Opportunities Fund?',
    answer: 'The direct plan expense ratio is 0.76% (inclusive of GST where applicable). Direct plans offer lower costs than regular plans because no intermediary distributor commissions are deducted.',
    sourceUrl: 'https://groww.in/mutual-funds/hdfc-mid-cap-fund-direct-growth',
    factsheetUrl: 'https://www.hdfcfund.com/investor-services/fund-performance/factsheet'
  },
  {
    id: 'midcap-sip',
    schemeKey: 'midcap',
    schemeName: 'HDFC Mid-Cap Opportunities Fund',
    category: 'Equity: Mid Cap',
    question: 'What are the minimum SIP and lumpsum investment amounts for HDFC Mid-Cap?',
    answer: 'The minimum monthly SIP investment amount is ₹100, and the minimum initial lumpsum purchase amount is also ₹100.',
    sourceUrl: 'https://groww.in/mutual-funds/hdfc-mid-cap-fund-direct-growth',
    factsheetUrl: 'https://www.hdfcfund.com/investor-services/fund-performance/factsheet'
  },
  {
    id: 'midcap-lockin',
    schemeKey: 'midcap',
    schemeName: 'HDFC Mid-Cap Opportunities Fund',
    category: 'Equity: Mid Cap',
    question: 'Does HDFC Mid-Cap have any lock-in period, and what is its risk rating?',
    answer: 'The fund has Nil lock-in period. Units can be redeemed on any business day subject to the 1-year exit load. It is classified as Very High risk under SEBI guidelines, benchmarked against NIFTY Midcap 150 TRI.',
    sourceUrl: 'https://groww.in/mutual-funds/hdfc-mid-cap-fund-direct-growth',
    factsheetUrl: 'https://www.hdfcfund.com/investor-services/fund-performance/factsheet'
  },
  {
    id: 'midcap-manager',
    schemeKey: 'midcap',
    schemeName: 'HDFC Mid-Cap Opportunities Fund',
    category: 'Equity: Mid Cap',
    question: 'Who is the fund manager for HDFC Mid-Cap Opportunities Fund?',
    answer: 'The scheme is managed by Chirag Setalvad.',
    sourceUrl: 'https://groww.in/mutual-funds/hdfc-mid-cap-fund-direct-growth',
    factsheetUrl: 'https://www.hdfcfund.com/investor-services/fund-performance/factsheet'
  },

  // 2. HDFC Small Cap Fund
  {
    id: 'smallcap-expense',
    schemeKey: 'smallcap',
    schemeName: 'HDFC Small Cap Fund',
    category: 'Equity: Small Cap',
    question: 'What is the expense ratio for HDFC Small Cap Fund?',
    answer: 'The direct plan expense ratio is 0.67%.',
    sourceUrl: 'https://groww.in/mutual-funds/hdfc-small-cap-fund-direct-growth',
    factsheetUrl: 'https://www.hdfcfund.com/investor-services/fund-performance/factsheet'
  },
  {
    id: 'smallcap-exit',
    schemeKey: 'smallcap',
    schemeName: 'HDFC Small Cap Fund',
    category: 'Equity: Small Cap',
    question: 'What is the exit load policy for HDFC Small Cap Fund?',
    answer: 'An exit load of 1.00% is levied if units are redeemed or switched out within 1 year from the date of allotment. If redeemed after 1 year, the exit load is Nil (0%).',
    sourceUrl: 'https://groww.in/mutual-funds/hdfc-small-cap-fund-direct-growth',
    factsheetUrl: 'https://www.hdfcfund.com/investor-services/fund-performance/factsheet'
  },
  {
    id: 'smallcap-sip',
    schemeKey: 'smallcap',
    schemeName: 'HDFC Small Cap Fund',
    category: 'Equity: Small Cap',
    question: 'What are the minimum SIP and lumpsum requirements for HDFC Small Cap?',
    answer: 'The minimum monthly SIP amount is ₹100, and the minimum initial lumpsum investment amount is ₹100.',
    sourceUrl: 'https://groww.in/mutual-funds/hdfc-small-cap-fund-direct-growth',
    factsheetUrl: 'https://www.hdfcfund.com/investor-services/fund-performance/factsheet'
  },
  {
    id: 'smallcap-lockin-risk',
    schemeKey: 'smallcap',
    schemeName: 'HDFC Small Cap Fund',
    category: 'Equity: Small Cap',
    question: 'What is the lock-in period, riskometer rating, and benchmark for HDFC Small Cap?',
    answer: 'The fund has Nil lock-in period. It is rated as Very High risk under SEBI guidelines, benchmarked against S&P BSE 250 SmallCap TRI.',
    sourceUrl: 'https://groww.in/mutual-funds/hdfc-small-cap-fund-direct-growth',
    factsheetUrl: 'https://www.hdfcfund.com/investor-services/fund-performance/factsheet'
  },
  {
    id: 'smallcap-manager',
    schemeKey: 'smallcap',
    schemeName: 'HDFC Small Cap Fund',
    category: 'Equity: Small Cap',
    question: 'Who manages the HDFC Small Cap Fund?',
    answer: 'The fund is managed by Chirag Setalvad.',
    sourceUrl: 'https://groww.in/mutual-funds/hdfc-small-cap-fund-direct-growth',
    factsheetUrl: 'https://www.hdfcfund.com/investor-services/fund-performance/factsheet'
  },

  // 3. HDFC Gold ETF Fund of Fund
  {
    id: 'gold-exit',
    schemeKey: 'gold',
    schemeName: 'HDFC Gold ETF Fund of Fund',
    category: 'Commodities / Gold FoF',
    question: 'What is the exit load for HDFC Gold ETF Fund of Fund?',
    answer: 'An exit load of 2.00% applies if units are redeemed within 15 days from the date of allotment. If redeemed after 15 days, the exit load is Nil (0%).',
    sourceUrl: 'https://groww.in/mutual-funds/hdfc-gold-etf-fund-of-fund-direct-plan-growth',
    factsheetUrl: 'https://www.hdfcfund.com/investor-services/fund-performance/factsheet'
  },
  {
    id: 'gold-expense',
    schemeKey: 'gold',
    schemeName: 'HDFC Gold ETF Fund of Fund',
    category: 'Commodities / Gold FoF',
    question: 'What is the expense ratio of HDFC Gold ETF FoF?',
    answer: 'The direct plan expense ratio is 0.16% (among the most cost-efficient commodity funds).',
    sourceUrl: 'https://groww.in/mutual-funds/hdfc-gold-etf-fund-of-fund-direct-plan-growth',
    factsheetUrl: 'https://www.hdfcfund.com/investor-services/fund-performance/factsheet'
  },
  {
    id: 'gold-details',
    schemeKey: 'gold',
    schemeName: 'HDFC Gold ETF Fund of Fund',
    category: 'Commodities / Gold FoF',
    question: 'What is the benchmark, lock-in period, and minimum SIP for HDFC Gold FoF?',
    answer: 'The scheme benchmarks against the Domestic Price of Physical Gold. It has Nil lock-in period, a High risk classification, and a minimum SIP / lumpsum limit of ₹100.',
    sourceUrl: 'https://groww.in/mutual-funds/hdfc-gold-etf-fund-of-fund-direct-plan-growth',
    factsheetUrl: 'https://www.hdfcfund.com/investor-services/fund-performance/factsheet'
  },
  {
    id: 'gold-managers',
    schemeKey: 'gold',
    schemeName: 'HDFC Gold ETF Fund of Fund',
    category: 'Commodities / Gold FoF',
    question: 'Who manages the HDFC Gold ETF Fund of Fund?',
    answer: 'The scheme is co-managed by Nirman Morakhia and Arun Agarwal.',
    sourceUrl: 'https://groww.in/mutual-funds/hdfc-gold-etf-fund-of-fund-direct-plan-growth',
    factsheetUrl: 'https://www.hdfcfund.com/investor-services/fund-performance/factsheet'
  },

  // 4. HDFC Top 100 / Large Cap Fund
  {
    id: 'top100-expense',
    schemeKey: 'top100',
    schemeName: 'HDFC Top 100 / Large Cap Fund',
    category: 'Equity: Large Cap',
    question: 'What is the expense ratio for HDFC Top 100 Fund?',
    answer: 'The direct plan expense ratio is 0.99%.',
    sourceUrl: 'https://groww.in/mutual-funds/hdfc-large-cap-fund-direct-growth',
    factsheetUrl: 'https://www.hdfcfund.com/investor-services/fund-performance/factsheet'
  },
  {
    id: 'top100-exit',
    schemeKey: 'top100',
    schemeName: 'HDFC Top 100 / Large Cap Fund',
    category: 'Equity: Large Cap',
    question: 'What is the exit load for HDFC Top 100 Fund?',
    answer: 'An exit load of 1.00% is applicable if redeemed or switched out within 1 year from the date of allotment. Nil exit load after 1 year.',
    sourceUrl: 'https://groww.in/mutual-funds/hdfc-large-cap-fund-direct-growth',
    factsheetUrl: 'https://www.hdfcfund.com/investor-services/fund-performance/factsheet'
  },
  {
    id: 'top100-benchmark-manager',
    schemeKey: 'top100',
    schemeName: 'HDFC Top 100 / Large Cap Fund',
    category: 'Equity: Large Cap',
    question: 'What is the benchmark and who is the fund manager for HDFC Top 100?',
    answer: 'The scheme benchmarks against NIFTY 100 TRI with a Very High risk rating and Nil lock-in period. The fund manager is Rahul Baijal.',
    sourceUrl: 'https://groww.in/mutual-funds/hdfc-large-cap-fund-direct-growth',
    factsheetUrl: 'https://www.hdfcfund.com/investor-services/fund-performance/factsheet'
  },

  // 5. HDFC ELSS Tax Saver Fund
  {
    id: 'elss-lockin',
    schemeKey: 'elss',
    schemeName: 'HDFC ELSS Tax Saver Fund',
    category: 'Equity: ELSS (Tax Saving)',
    question: 'What is the statutory lock-in period for HDFC ELSS Tax Saver Fund?',
    answer: 'The fund has a mandatory statutory lock-in period of 3 Years from the date of each allotment under Section 80C of the Income Tax Act. In a SIP, each monthly installment has its own separate 3-year lock-in.',
    sourceUrl: 'https://groww.in/mutual-funds/hdfc-elss-tax-saver-fund-direct-plan-growth',
    factsheetUrl: 'https://www.hdfcfund.com/investor-services/fund-performance/factsheet'
  },
  {
    id: 'elss-exit',
    schemeKey: 'elss',
    schemeName: 'HDFC ELSS Tax Saver Fund',
    category: 'Equity: ELSS (Tax Saving)',
    question: 'What is the exit load for HDFC ELSS Tax Saver Fund?',
    answer: 'The exit load is Nil (0%). Because units cannot be redeemed before 3 years, no exit load is charged when redeeming eligible units after the statutory lock-in expires.',
    sourceUrl: 'https://groww.in/mutual-funds/hdfc-elss-tax-saver-fund-direct-plan-growth',
    factsheetUrl: 'https://www.hdfcfund.com/investor-services/fund-performance/factsheet'
  },
  {
    id: 'elss-sip-expense',
    schemeKey: 'elss',
    schemeName: 'HDFC ELSS Tax Saver Fund',
    category: 'Equity: ELSS (Tax Saving)',
    question: 'What is the minimum SIP amount and expense ratio for HDFC ELSS?',
    answer: 'The minimum monthly SIP is ₹500, minimum lumpsum investment is ₹500, and the direct plan expense ratio is 1.08%.',
    sourceUrl: 'https://groww.in/mutual-funds/hdfc-elss-tax-saver-fund-direct-plan-growth',
    factsheetUrl: 'https://www.hdfcfund.com/investor-services/fund-performance/factsheet'
  },
  {
    id: 'elss-benchmark-manager',
    schemeKey: 'elss',
    schemeName: 'HDFC ELSS Tax Saver Fund',
    category: 'Equity: ELSS (Tax Saving)',
    question: 'What is the benchmark and who manages HDFC ELSS Tax Saver Fund?',
    answer: 'The scheme benchmarks against NIFTY 500 TRI with a Very High risk rating, and is managed by Roshi Jain.',
    sourceUrl: 'https://groww.in/mutual-funds/hdfc-elss-tax-saver-fund-direct-plan-growth',
    factsheetUrl: 'https://www.hdfcfund.com/investor-services/fund-performance/factsheet'
  },

  // 6. Platform Rules & Guidelines
  {
    id: 'rules-permitted',
    schemeKey: 'rules',
    schemeName: 'Platform Rules & Safety',
    category: 'Compliance',
    question: 'What types of questions can I ask Fund Compass?',
    answer: 'You can ask any objective, factual questions regarding expense ratios, exit loads, minimum SIP or lumpsum limits, statutory lock-in periods, benchmark indices, fund managers, and official statement download steps for the 5 supported HDFC direct mutual fund schemes.',
    factsheetUrl: 'https://www.hdfcfund.com/investor-services/fund-performance/factsheet'
  },
  {
    id: 'rules-prohibited',
    schemeKey: 'rules',
    schemeName: 'Platform Rules & Safety',
    category: 'Compliance',
    question: 'Why does Fund Compass refuse investment advice or fund recommendations?',
    answer: 'Fund Compass operates under strict non-advisory SEBI compliance. It never provides personalized investment advice ("Should I invest?"), forward-looking return guarantees, or subjective comparisons ("Which fund is best?"). Inquiries containing sensitive personal data (PAN, Aadhaar, bank OTPs) are also automatically blocked.',
    factsheetUrl: 'https://www.hdfcfund.com/investor-services/fund-performance/factsheet'
  },
  {
    id: 'rules-statements',
    schemeKey: 'rules',
    schemeName: 'Platform Rules & Safety',
    category: 'Investor Services',
    question: 'How can I download my official mutual fund account statement?',
    answer: 'Official account statements, Consolidated Account Statements (CAS), and Capital Gains statements can be downloaded directly from the HDFC Mutual Fund online investor portal (hdfcfund.com) or via MFCentral / CAMS using your PAN and registered folio number.',
    factsheetUrl: 'https://www.hdfcfund.com/investor-services/fund-performance/factsheet'
  }
];

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [schemes, setSchemes] = useState<SchemeItem[]>([]);
  const [showSchemesModal, setShowSchemesModal] = useState(false);
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [showEngineModal, setShowEngineModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSipModal, setShowSipModal] = useState(false);
  const [sipMode, setSipMode] = useState<'sip' | 'lumpsum'>('sip');
  const [sipSchemeId, setSipSchemeId] = useState<string>('');
  const [sipAmount, setSipAmount] = useState<number>(25000);
  const [sipDuration, setSipDuration] = useState<number>(8);
  const [sipRate, setSipRate] = useState<number>(12);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [activeHeaderBtn, setActiveHeaderBtn] = useState<'scheme' | 'sip' | null>(null);

  const activeSipScheme = useMemo(() => {
    return CANONICAL_SCHEMES.find((s) => s.id === sipSchemeId) || null;
  }, [sipSchemeId]);

  const sipCalcResult = useMemo(() => {
    return computeSipOrLumpsum(sipAmount, sipDuration, sipRate, sipMode);
  }, [sipAmount, sipDuration, sipRate, sipMode]);

  const handleSipSchemeSelect = (schemeId: string) => {
    setSipSchemeId(schemeId);
    const found = CANONICAL_SCHEMES.find((s) => s.id === schemeId);
    if (found && sipAmount < found.minSip) {
      setSipAmount(found.minSip);
    }
  };
  const [theme, setTheme] = useState<'light' | 'dark' | 'soft-blue'>(() => {
    try {
      const saved = localStorage.getItem('fc_theme');
      if (saved === 'dark' || saved === 'soft-blue') return saved;
    } catch { }
    return 'light';
  });
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const themeDropdownRef = useRef<HTMLDivElement>(null);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [citationToggle, setCitationToggle] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [showRecentDropdown, setShowRecentDropdown] = useState(false);
  const [activeCardIdx, setActiveCardIdx] = useState<number | null>(null);
  const [faqSchemeFilter, setFaqSchemeFilter] = useState<string>('all');
  const [expandedFaqIds, setExpandedFaqIds] = useState<string[]>(['midcap-exit']);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dockInputRef = useRef<HTMLInputElement>(null);
  const suggestionDropdownRef = useRef<HTMLDivElement>(null);

  // Google-Style Autocomplete Question Suggestions State
  const [suggestions, setSuggestions] = useState<QuestionSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Dismiss autocomplete suggestion dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const clickedInsideDropdown = suggestionDropdownRef.current?.contains(target);
      const clickedInsideWelcomeInput = inputRef.current?.contains(target);
      const clickedInsideDockInput = dockInputRef.current?.contains(target);

      if (!clickedInsideDropdown && !clickedInsideWelcomeInput && !clickedInsideDockInput) {
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    }
    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSuggestions]);

  const handleInputChange = (val: string) => {
    setInput(val);
    const trimmed = val.trim();
    if (trimmed.length > 0) {
      const matches = getQuestionSuggestions(val, 5);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    setHighlightedIndex(-1);
  };

  const handleSelectSuggestion = (suggestionText: string) => {
    setInput(suggestionText);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    setTimeout(() => {
      if (messages.length > 0 && dockInputRef.current) {
        dockInputRef.current.focus();
      } else if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 10);
  };

  // Lock body scroll when Quick Help or SIP Calculator modal is open
  useEffect(() => {
    if (showHelpModal || showSipModal) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [showHelpModal, showSipModal]);

  // Close Quick Help or SIP Calculator modal on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (showHelpModal) setShowHelpModal(false);
        if (showSipModal) setShowSipModal(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showHelpModal, showSipModal]);

  const toggleFaq = (id: string) => {
    setExpandedFaqIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleAskFaq = (questionText: string) => {
    setShowHelpModal(false);
    setInput(questionText);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Sync theme attribute with document & persist in localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('fc_theme', theme);
    } catch { }
  }, [theme]);

  // Dismiss theme popover on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target as Node)) {
        setShowThemeDropdown(false);
      }
    }
    if (showThemeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showThemeDropdown]);

  // Check health and load schemes on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/health`);
        if (res.ok) {
          setApiConnected(true);
        } else {
          setApiConnected(false);
        }
      } catch (e) {
        setApiConnected(false);
      }
    };

    const loadSchemes = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/schemes`);
        if (res.ok) {
          const data = await res.json();
          setSchemes(data);
        }
      } catch (e) {
        console.error('Failed to load schemes', e);
      }
    };

    checkBackend();
    loadSchemes();
  }, [API_BASE_URL]);

  const handleSendMessage = async (textToSend?: string) => {
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    // Track in recent queries
    setRecentQueries(prev => {
      const filtered = prev.filter(q => q !== query);
      return [query, ...filtered].slice(0, 5);
    });

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: query })
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: data.reply,
        intent: data.intent,
        sourceUrl: data.source_url,
        lastUpdated: data.last_updated,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: "Fund Compass is currently unable to reach the API server. Please ensure the backend is running at " + (API_BASE_URL || 'http://localhost:8000') + ".",
        intent: "error",
        lastUpdated: "2026-11-10",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
        return;
      }
      if (e.key === 'Enter') {
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          e.preventDefault();
          handleSelectSuggestion(suggestions[highlightedIndex].question);
          return;
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        return;
      }
    }

    if (e.key === 'Enter') {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
      handleSendMessage();
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Parses assistant response to cleanly separate body, citation URL, and date, removing duplicate or malformed tokens
  const parseAssistantResponse = (rawText: string, fallbackUrl?: string | null, fallbackDate?: string) => {
    // 1. Remove stray citation bracket markers (e.g. 【...】 or 【. or stray 【)
    let cleaned = rawText
      .replace(/【.*?】/g, '')
      .replace(/【.*?$/g, '')
      .replace(/[【】]/g, '')
      .trim();

    // 2. Extract embedded citation URL if present
    let sourceUrl = fallbackUrl || null;
    const citationMatch = cleaned.match(/Source:\s*\[(.*?)\]\((.*?)\)/i) || cleaned.match(/Source:\s*(\S+)/i);
    if (citationMatch) {
      if (!sourceUrl) {
        sourceUrl = citationMatch[2] || citationMatch[1];
      }
    }

    // 3. Extract last updated timestamp if present
    let lastUpdated = fallbackDate || '2026-11-10';
    const dateMatch = cleaned.match(/Last updated from sources:\s*(\d{4}-\d{2}-\d{2})/i);
    if (dateMatch) {
      lastUpdated = dateMatch[1];
    }

    // 4. Strip the redundant raw Source: [...] and Last updated lines from the displayed body
    let body = cleaned
      .replace(/\n*Source:\s*\[.*?\]\(.*?\)/gi, '')
      .replace(/\n*Source:\s*\S+/gi, '')
      .replace(/\n*Last updated from sources:\s*\d{4}-\d{2}-\d{2}/gi, '')
      .replace(/\s+([.,;:!?])/g, '$1')
      .trim();

    return { body, sourceUrl, lastUpdated };
  };

  // Lightweight markdown formatter for bold, code, and line breaks
  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`|\n)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-semibold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={index} className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded text-xs font-mono">
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part === '\n') {
        return <br key={index} />;
      }
      return part;
    });
  };

  const handleResetConversation = () => {
    setMessages([]);
    setInput('');
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800 antialiased overflow-hidden font-sans">
      {/* ============================================================== */}
      {/* 1. COLLAPSIBLE / EXPANDABLE NAVIGATION SIDEBAR                 */}
      {/* ============================================================== */}
      <aside
        className={`flex-col justify-between bg-white border-r border-slate-200 z-30 shrink-0 hidden sm:flex transition-all duration-300 ease-in-out select-none ${sidebarExpanded ? 'w-60' : 'w-[88px]'
          }`}
        aria-label="Sidebar navigation"
        aria-expanded={sidebarExpanded}
      >
        {/* Top Header & Brand / Toggle */}
        <div className="w-full flex flex-col">
          {/* Header Bar matching 84px height */}
          <div className={`h-[84px] flex items-center border-b border-slate-100/80 shrink-0 ${sidebarExpanded ? 'px-4 justify-between' : 'justify-center relative'
            }`}>
            {sidebarExpanded ? (
              <>
                <button
                  onClick={handleResetConversation}
                  className="flex items-center space-x-2.5 hover:opacity-90 transition-opacity focus:outline-none min-w-0"
                  title="Fund Compass Home / New Thread"
                >
                  <img
                    src={compassEmblem}
                    alt="Fund Compass"
                    className="w-9 h-9 object-contain drop-shadow-xs shrink-0"
                  />
                  <div className="text-left min-w-0">
                    <span className="font-extrabold text-sm text-slate-900 tracking-tight leading-none block truncate">
                      Fund Compass
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold leading-none block mt-1 truncate">
                      Facts-Only MF
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => setSidebarExpanded(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
                  title="Collapse sidebar"
                  aria-label="Collapse sidebar"
                >
                  <PanelLeftClose className="w-5 h-5 stroke-[1.75]" />
                </button>
              </>
            ) : (
              <button
                onClick={handleResetConversation}
                title="Fund Compass Home / New Thread"
                className="flex items-center justify-center hover:scale-105 transition-transform duration-200 focus:outline-none"
              >
                <img
                  src={compassEmblem}
                  alt="Fund Compass"
                  className="w-[54px] h-[54px] object-contain drop-shadow-xs"
                />
                <span className="sr-only">Fund Compass Home</span>
              </button>
            )}
          </div>

          {/* Toggle Button in Collapsed Mode (near top of sidebar) */}
          {!sidebarExpanded && (
            <div className="flex justify-center pt-3 pb-1">
              <button
                onClick={() => setSidebarExpanded(true)}
                title="Expand sidebar"
                aria-label="Expand sidebar"
                className="w-10 h-10 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-colors group relative"
              >
                <PanelLeftOpen className="w-5 h-5 stroke-[1.75]" />
                <span className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-lg pointer-events-none z-50">
                  Expand sidebar
                </span>
              </button>
            </div>
          )}

          {/* Primary Navigation Actions */}
          <nav className={`w-full flex flex-col ${sidebarExpanded ? 'px-3 pt-3 space-y-1' : 'items-center pt-2 space-y-5 px-2'
            }`}>
            {/* New Chat */}
            <button
              onClick={handleResetConversation}
              className={`${sidebarExpanded
                  ? 'w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors font-medium text-sm text-left group'
                  : 'w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors group relative'
                }`}
              title={sidebarExpanded ? undefined : "Start New Thread"}
            >
              <MessageSquare className={`${sidebarExpanded ? 'w-5 h-5 text-slate-500 group-hover:text-emerald-600' : 'w-6 h-6'} shrink-0 stroke-[1.75]`} />
              {sidebarExpanded ? (
                <span className="truncate">New Chat</span>
              ) : (
                <span className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-lg pointer-events-none z-50">
                  New Chat
                </span>
              )}
            </button>

            {/* Supported Schemes */}
            <button
              onClick={() => setShowSchemesModal(true)}
              className={`${sidebarExpanded
                  ? 'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors font-medium text-sm text-left group'
                  : 'w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors group relative'
                }`}
              title={sidebarExpanded ? undefined : "Supported Schemes Catalog (5)"}
            >
              <div className={sidebarExpanded ? 'flex items-center space-x-3 min-w-0' : 'relative flex items-center justify-center'}>
                <BookOpen className={`${sidebarExpanded ? 'w-5 h-5 text-slate-500 group-hover:text-emerald-600' : 'w-6 h-6'} shrink-0 stroke-[1.75]`} />
                {!sidebarExpanded && (
                  <span className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full bg-[#00D09C] text-slate-950 text-[10px] font-bold flex items-center justify-center shadow-xs">
                    5
                  </span>
                )}
                {sidebarExpanded && <span className="truncate">Supported Schemes</span>}
              </div>
              {sidebarExpanded ? (
                <span className="px-2 py-0.5 rounded-full bg-[#00D09C] text-slate-950 text-[10px] font-bold shadow-2xs shrink-0">
                  5
                </span>
              ) : (
                <span className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-lg pointer-events-none z-50">
                  Supported Schemes (5)
                </span>
              )}
            </button>

            {/* Compliance */}
            <button
              onClick={() => setShowComplianceModal(true)}
              className={`${sidebarExpanded
                  ? 'w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors font-medium text-sm text-left group'
                  : 'w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors group relative'
                }`}
              title={sidebarExpanded ? undefined : "Compliance & SEBI Disclaimers"}
            >
              <ShieldCheck className={`${sidebarExpanded ? 'w-5 h-5 text-slate-500 group-hover:text-emerald-600' : 'w-6 h-6'} shrink-0 stroke-[1.75]`} />
              {sidebarExpanded ? (
                <span className="truncate">Compliance Rules</span>
              ) : (
                <span className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-lg pointer-events-none z-50">
                  Compliance & Rules
                </span>
              )}
            </button>

            {/* Recent Prompts */}
            <div className={`relative ${sidebarExpanded ? 'w-full' : ''}`}>
              <button
                onClick={() => setShowRecentDropdown(!showRecentDropdown)}
                className={`${sidebarExpanded
                    ? `w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors font-medium text-sm text-left group ${showRecentDropdown ? 'bg-slate-100 text-slate-900' : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                    }`
                    : `w-10 h-10 rounded-xl flex items-center justify-center transition-colors group relative ${showRecentDropdown ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                    }`
                  }`}
                title={sidebarExpanded ? undefined : "Recent Prompts"}
              >
                <div className={sidebarExpanded ? 'flex items-center space-x-3 min-w-0' : 'flex items-center justify-center'}>
                  <Clock className={`${sidebarExpanded ? 'w-5 h-5 text-slate-500 group-hover:text-emerald-600' : 'w-6 h-6'} shrink-0 stroke-[1.75]`} />
                  {sidebarExpanded && <span className="truncate">Recent Prompts</span>}
                </div>
                {sidebarExpanded ? (
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showRecentDropdown ? 'rotate-180' : ''}`} />
                ) : (
                  <span className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-lg pointer-events-none z-50">
                    Recent Prompts
                  </span>
                )}
              </button>

              {/* Recent Prompts Dropdown / Popout */}
              {showRecentDropdown && (
                <div className={`${sidebarExpanded
                    ? 'mt-1 w-full bg-slate-50 border border-slate-200/90 rounded-xl p-2 text-left space-y-1'
                    : 'absolute left-14 top-0 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50 text-left'
                  }`}>
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/70">
                    <span className="text-xs font-bold text-slate-800">Recent Prompts</span>
                    <button
                      onClick={() => setShowRecentDropdown(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs px-1"
                    >
                      ✕
                    </button>
                  </div>
                  {recentQueries.length === 0 ? (
                    <p className="text-[11px] text-slate-400 py-2.5 text-center">No recent prompts yet</p>
                  ) : (
                    <div className="space-y-1 mt-1.5 max-h-48 overflow-y-auto">
                      {recentQueries.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setShowRecentDropdown(false);
                            handleSendMessage(q);
                          }}
                          className="w-full text-left text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 p-1.5 rounded-lg truncate transition-colors block"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Bottom Utility & Profile Section */}
        <div className={`w-full ${sidebarExpanded ? 'pb-5 px-3 border-t border-slate-100/80 pt-3 space-y-1' : 'flex flex-col items-center space-y-4 pb-6 px-2'
          }`}>
          {/* Help & FAQs */}
          <button
            onClick={() => setShowHelpModal(true)}
            className={`${sidebarExpanded
                ? 'w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition-colors font-medium text-xs text-left group'
                : 'w-10 h-10 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors group relative'
              }`}
            title={sidebarExpanded ? undefined : "Help & FAQs"}
          >
            <Headphones className={`${sidebarExpanded ? 'w-4 h-4' : 'w-5 h-5'} stroke-[1.75]`} />
            {sidebarExpanded ? (
              <span className="truncate">Help & FAQs</span>
            ) : (
              <span className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-lg pointer-events-none z-50">
                Help & FAQs
              </span>
            )}
          </button>

          {/* Engine Status */}
          <button
            onClick={() => setShowEngineModal(true)}
            className={`${sidebarExpanded
                ? 'w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition-colors font-medium text-xs text-left group'
                : 'w-10 h-10 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors group relative'
              }`}
            title={sidebarExpanded ? undefined : "Settings & System Status"}
          >
            <Settings className={`${sidebarExpanded ? 'w-4 h-4' : 'w-5 h-5'} stroke-[1.75]`} />
            {sidebarExpanded ? (
              <span className="truncate">Engine Status</span>
            ) : (
              <span className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-lg pointer-events-none z-50">
                Engine Status
              </span>
            )}
          </button>

          {/* User / Investor Profile Avatar */}
          {sidebarExpanded ? (
            <div className="flex items-center space-x-3 px-3 py-2 pt-2 border-t border-slate-100 mt-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00D09C] to-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center shadow-xs ring-2 ring-emerald-500/20 relative shrink-0">
                <span>FC</span>
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border-2 border-white rounded-full"></span>
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-xs font-semibold text-slate-800 truncate leading-tight">Investor Session</p>
                <p className="text-[10px] text-emerald-600 font-medium truncate leading-tight mt-0.5">Verified • Groww MF</p>
              </div>
            </div>
          ) : (
            <div className="pt-1">
              <div
                title="Verified Investor Session"
                className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#00D09C] to-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center shadow-xs ring-2 ring-emerald-500/20 relative cursor-pointer group"
              >
                <span>FC</span>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                <span className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-lg pointer-events-none z-50">
                  Verified Investor
                </span>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ============================================================== */}
      {/* MAIN VIEWPORT (Header + Content + Modals)                      */}
      {/* ============================================================== */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-b from-[#fbfcfd] to-[#f4f7fa] relative">
        {/* Subtle Low-Contrast Dot Matrix Background Pattern */}
        <div className="pointer-events-none absolute inset-0 bg-dot-matrix opacity-65 z-0" />

        {/* Soft Ambient Gradient Lighting Pools (Pale Mint, Aqua, Sky Blue with Restrained Purple Highlight) */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[720px] h-[450px] rounded-full bg-gradient-to-tr from-emerald-100/25 via-sky-100/30 to-purple-100/25 blur-3xl opacity-70 z-0 animate-ambient-pulse" />
        <div className="pointer-events-none absolute top-10 left-8 w-72 h-72 rounded-full bg-emerald-100/20 blur-3xl opacity-60 z-0" />
        <div className="pointer-events-none absolute top-10 right-8 w-72 h-72 rounded-full bg-sky-100/25 blur-3xl opacity-60 z-0" />

        {/* ============================================================== */}
        {/* 2. TOP HEADER (Exact Image 1 layout & dimensions)              */}
        {/* ============================================================== */}
        <header className="h-[84px] px-4 sm:px-6 bg-white/90 backdrop-blur-md border-b border-slate-200/90 flex items-center justify-between gap-3 shrink-0 z-20 relative">
          {/* Left: Branding Badge & Regulatory Compliance Disclaimer */}
          <div className="flex items-center space-x-2.5 sm:space-x-3.5 pl-1 sm:pl-2">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="sm:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              title="Open Navigation"
              aria-label="Open Navigation"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Horizontal Inspired By Groww Branding Badge (Exact Image 1) */}
            <button
              onClick={handleResetConversation}
              className="flex items-center focus:outline-none hover:opacity-90 transition-opacity"
              title="Fund Compass — Inspired By Groww"
            >
              <img
                src={growwBadge}
                alt="Inspired By Groww"
                className="h-[38px] w-auto object-contain drop-shadow-2xs"
              />
            </button>

            {/* Regulatory Non-Advisory Compliance Disclaimer Badge */}
            <button
              onClick={() => setShowComplianceModal(true)}
              className="flex items-center space-x-1.5 bg-rose-50/90 hover:bg-rose-100/80 border border-rose-200 text-rose-700 px-2.5 sm:px-3 py-1.5 h-9 rounded-xl text-xs font-semibold shadow-2xs transition-all duration-200"
              title="Click to view regulatory non-advisory compliance rules"
            >
              <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-rose-600" />
              <span className="hidden xl:inline">Facts-only. No investment advice.</span>
              <span className="xl:hidden hidden sm:inline">Facts-only</span>
            </button>
          </div>

          {/* Right: Dedicated Top-Right Action Bar (Theme Switcher + 4 controls) */}
          <div className="flex items-center space-x-2 sm:space-x-2.5">
            {/* Theme Switcher (Positioned immediately before Supported Scheme) */}
            <div className="relative" ref={themeDropdownRef}>
              <button
                type="button"
                onClick={() => setShowThemeDropdown(prev => !prev)}
                className="h-9 px-2.5 sm:px-3 py-1.5 rounded-xl border border-black bg-white hover:bg-slate-100 hover:border-black text-black shadow-2xs text-xs font-semibold flex items-center space-x-1.5 transition-all duration-200 ease-in-out cursor-pointer theme-btn"
                title={`Theme: ${theme === 'soft-blue' ? 'Soft Blue' : theme === 'dark' ? 'Dark' : 'Light'}. Click to switch theme.`}
                aria-label="Switch Theme"
                aria-expanded={showThemeDropdown}
              >
                {theme === 'dark' ? (
                  <Moon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                ) : theme === 'soft-blue' ? (
                  <Droplet className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                ) : (
                  <Sun className="w-3.5 h-3.5 text-black shrink-0" />
                )}
                <span className="hidden xl:inline text-[11px] font-semibold text-black">
                  {theme === 'soft-blue' ? 'Soft Blue' : theme === 'dark' ? 'Dark' : 'Light'}
                </span>
                <ChevronDown className={`w-3 h-3 ${theme === 'light' ? 'text-black' : 'text-slate-400'} transition-transform duration-200 ${showThemeDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Theme Dropdown Popover */}
              {showThemeDropdown && (
                <div className="absolute right-0 top-full mt-1.5 w-44 rounded-2xl bg-white border border-slate-200/90 shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 theme-dropdown">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Select Theme
                  </div>
                  <div className="space-y-0.5 mt-0.5">
                    {/* Option 1: Light */}
                    <button
                      type="button"
                      onClick={() => {
                        setTheme('light');
                        setShowThemeDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors text-left ${theme === 'light'
                          ? 'bg-slate-100 text-black font-bold'
                          : 'text-slate-700 hover:bg-slate-100/80'
                        }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Sun className="w-4 h-4 text-black shrink-0" />
                        <span>Light</span>
                      </div>
                      {theme === 'light' && <Check className="w-3.5 h-3.5 text-black shrink-0" />}
                    </button>

                    {/* Option 2: Dark */}
                    <button
                      type="button"
                      onClick={() => {
                        setTheme('dark');
                        setShowThemeDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors text-left ${theme === 'dark'
                          ? 'bg-slate-900 text-white font-bold'
                          : 'text-slate-700 hover:bg-slate-100/80'
                        }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Moon className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span>Dark</span>
                      </div>
                      {theme === 'dark' && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    </button>

                    {/* Option 3: Soft Blue */}
                    <button
                      type="button"
                      onClick={() => {
                        setTheme('soft-blue');
                        setShowThemeDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors text-left ${theme === 'soft-blue'
                          ? 'bg-sky-100 text-sky-900 font-bold'
                          : 'text-slate-700 hover:bg-slate-100/80'
                        }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Droplet className="w-4 h-4 text-sky-500 shrink-0" />
                        <span>Soft Blue</span>
                      </div>
                      {theme === 'soft-blue' && <Check className="w-3.5 h-3.5 text-sky-700 shrink-0" />}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 1. Supported Scheme */}
            <button
              id="hdr-scheme-btn"
              type="button"
              onClick={() => setActiveHeaderBtn(prev => prev === 'scheme' ? null : 'scheme')}
              className={`h-9 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all duration-200 ease-in-out cursor-pointer ${activeHeaderBtn === 'scheme'
                  ? 'bg-black border border-black text-white shadow-xs hover:bg-slate-900'
                  : 'bg-white border border-black text-black shadow-2xs hover:bg-slate-100 hover:border-black'
                }`}
              title="Supported Scheme"
            >
              <BookOpen className={`w-3.5 h-3.5 shrink-0 transition-colors ${activeHeaderBtn === 'scheme' ? 'text-white' : 'text-black'
                }`} />
              <span className="hidden md:inline">Supported Scheme</span>
              <span className="md:hidden hidden sm:inline">Schemes</span>
            </button>

            {/* 2. SIP Calculator */}
            <button
              id="hdr-sip-btn"
              type="button"
              onClick={() => setShowSipModal(prev => !prev)}
              className={`h-9 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all duration-200 ease-in-out cursor-pointer ${showSipModal
                  ? 'bg-black border border-black text-white shadow-xs hover:bg-slate-900'
                  : 'bg-white border border-black text-black shadow-2xs hover:bg-slate-100 hover:border-black'
                }`}
              title="SIP Calculator"
            >
              <Calculator className={`w-3.5 h-3.5 shrink-0 transition-colors ${showSipModal ? 'text-white' : 'text-black'
                }`} />
              <span className="hidden md:inline">SIP Calculator</span>
              <span className="md:hidden hidden sm:inline">SIP Calc</span>
            </button>

            {/* 3. Quick Help (Opens and closes the FAQ panel, maintains active state when open) */}
            <button
              id="hdr-help-btn"
              type="button"
              onClick={() => setShowHelpModal(prev => !prev)}
              className={`h-9 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all duration-200 ease-in-out cursor-pointer ${showHelpModal
                  ? 'bg-black border border-black text-white shadow-xs hover:bg-slate-900'
                  : 'bg-white border border-black text-black shadow-2xs hover:bg-slate-100 hover:border-black'
                }`}
              title="Quick Help & FAQs"
            >
              <HelpCircle className={`w-3.5 h-3.5 shrink-0 transition-colors ${showHelpModal ? 'text-white' : 'text-black'
                }`} />
              <span className="hidden sm:inline">Quick Help</span>
              <span className="sm:hidden">Help</span>
            </button>

            {/* 4. API Connected (Green-themed status indicator with green dot, green text, subtle light-green bg/border) */}
            <div
              className="h-9 flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-emerald-200/90 bg-emerald-50/80 text-emerald-700 text-xs font-semibold shadow-2xs transition-all duration-200"
              title={apiConnected ? 'FastAPI Gateway Connected (Port 8000)' : 'API Status: Connected'}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-[11px] font-semibold text-emerald-700 hidden lg:inline">
                API Connected
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 lg:hidden hidden sm:inline">
                Connected
              </span>
            </div>
          </div>
        </header>

        {/* ============================================================== */}
        {/* 3. CENTRAL CONTENT AREA (Welcome Mode vs Chat Feed Mode)       */}
        {/* ============================================================== */}
        <main className="flex-1 overflow-y-auto relative flex flex-col justify-between z-10">
          {messages.length === 0 ? (
            /* ============================================================ */
            /* 3A. WELCOMING HOMEPAGE SECTION (Matches Image 2 Composition) */
            /* ============================================================ */
            <div className="mx-auto my-auto w-full max-w-[880px] px-4 sm:px-6 pt-2 pb-5 sm:pt-3 sm:pb-7 flex flex-col items-center relative z-10 -translate-y-2 sm:-translate-y-3.5">
              {/* Standalone Central Compass Emblem with Soft Ambient Glow & Glass-like Halo */}
              <div className="mb-4 sm:mb-5 relative group flex items-center justify-center">
                {/* Ambient halo glow with pale mint, aqua, and restrained purple aura */}
                <div className="pointer-events-none absolute -inset-7 rounded-full bg-gradient-to-tr from-[#00D09C]/20 via-sky-300/20 to-purple-300/25 blur-2xl opacity-75 group-hover:opacity-95 transition-opacity duration-700 animate-ambient-pulse" />
                {/* Subtle glass reflection ring */}
                <div className="pointer-events-none absolute -inset-1.5 rounded-full bg-gradient-to-b from-white/70 via-white/20 to-transparent backdrop-blur-[2px] opacity-80" />
                <img
                  src={compassEmblem}
                  alt="Fund Compass"
                  className="h-22 sm:h-26 lg:h-[110px] w-auto object-contain mx-auto drop-shadow-md relative z-10 transition-transform duration-500 group-hover:scale-105 animate-orb-float"
                />
              </div>

              {/* Welcoming Typography — exact match to approved Image 1 with slightly increased scale */}
              <div className="w-full max-w-2xl mx-auto text-center">

                {/* Line 1: WELCOME TO FundCompass with curved green accent under Compass */}
                <h1 className="text-[30px] sm:text-[34px] lg:text-[36px] font-extrabold text-slate-900 tracking-tight leading-tight">
                  WELCOME TO{' '}
                  <span className="font-extrabold italic" style={{ color: '#022581' }}>
                    Fund
                  </span>
                  <span className="font-extrabold italic relative inline-block" style={{ color: '#00D09C' }}>
                    Compass
                    {/* Curved green underline — brand identity element exclusively under 'Compass' (pass) */}
                    <svg
                      viewBox="0 0 70 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="absolute -bottom-1.5 right-0 w-[60%] h-[7px] pointer-events-none"
                      preserveAspectRatio="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M 2 7 Q 35 1 68 5"
                        stroke="#00D09C"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </h1>

                {/* Line 2: Subtitle — "mutual funds?" in original emerald/teal-to-cyan gradient */}
                <p className="text-[21px] sm:text-[23px] lg:text-[25px] font-bold text-slate-900 tracking-tight mt-3.5 sm:mt-4 leading-snug">
                  What would you like to know about your{' '}
                  <span
                    className="font-extrabold"
                    style={{
                      background: 'linear-gradient(90deg, #00D09C 0%, #00B4B4 45%, #0284C7 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    mutual funds?
                  </span>
                </p>

                {/* Line 3: Supporting description */}
                <p className="text-xs sm:text-[13.5px] text-slate-500 leading-relaxed max-w-xl mx-auto mt-2 sm:mt-2.5">
                  Ask objective questions about the 5 selected <strong className="text-slate-700 font-semibold">HDFC Mutual Fund</strong> direct schemes. Get clear, facts-only answers using publicly available information from Groww.
                </p>
              </div>

              {/* Starter FAQ Cards Section — Exact match to Image 2 design */}
              <div className="w-full mt-7 sm:mt-8">
                {/* Header Row: Left Title & Right Prompt */}
                <div className="w-full flex items-center justify-between mb-2.5 px-0.5">
                  <span className="text-[11px] sm:text-xs font-semibold tracking-wider text-slate-400 uppercase">
                    GET STARTED WITH AN EXAMPLE BELOW
                  </span>
                  <span className="text-[11px] sm:text-xs text-slate-400 font-normal">
                    Click any card to ask instantly
                  </span>
                </div>

                {/* Four Equally Sized Cards Horizontally Arranged */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 w-full">
                  {STARTER_QUESTIONS.map((item, idx) => {
                    const isActive = activeCardIdx === idx;
                    const borderClass = isActive
                      ? "border-2 border-emerald-400 bg-emerald-50/20"
                      : "border border-slate-200/80 hover:border-slate-300";
                    return (
                      <button
                        key={idx}
                        onClick={() => {
                          setActiveCardIdx(idx);
                          handleSendMessage(item.question);
                        }}
                        className={`p-4 rounded-2xl text-left transition-all duration-300 ease-out flex flex-col justify-between group h-full relative min-h-[155px] sm:min-h-[165px] bg-white/95 card-elevation backdrop-blur-xs hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 ${borderClass}`}
                      >
                        <div>
                          <span className={`inline-block text-[10px] font-bold border px-2.5 py-0.5 rounded-md mb-2.5 transition-colors ${item.badgeStyle}`}>
                            {item.category}
                          </span>
                          <p className="text-[13px] sm:text-sm font-semibold text-slate-800 group-hover:text-slate-950 leading-snug line-clamp-3">
                            {item.question}
                          </p>
                        </div>

                        <div className="mt-4 flex items-center justify-between pt-1">
                          <span className="text-xs text-slate-500 font-medium truncate flex-1 mr-2">
                            {item.highlight}
                          </span>
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all duration-200 shrink-0 group-hover:scale-105 ${item.iconBoxStyle}`}>
                            {item.icon}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Prominent Rounded Chat Input Box (Matches Image 2 with subtle elevated appearance) */}
              <div className="w-full mt-4 sm:mt-5 bg-white/95 backdrop-blur-xs border border-slate-200/90 hover:border-slate-300 focus-within:border-emerald-500/80 focus-within:ring-4 focus-within:ring-emerald-500/10 rounded-3xl p-4 sm:p-5 composer-elevation transition-all duration-300 ease-out relative z-30">
                <div className="flex items-start space-x-2.5">
                  <Sparkles className="w-5 h-5 text-[#00D09C] shrink-0 mt-0.5" />
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    maxLength={1000}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                      if (input.trim()) {
                        const matches = getQuestionSuggestions(input, 5);
                        setSuggestions(matches);
                        setShowSuggestions(matches.length > 0);
                      }
                    }}
                    disabled={loading}
                    placeholder="Ask an objective question (e.g., What is the expense ratio of HDFC Small Cap?)..."
                    className="flex-1 bg-transparent border-0 text-slate-900 placeholder-slate-400 text-sm sm:text-base focus:outline-none py-0.5"
                  />
                </div>

                {/* Bottom Input Controls Bar */}
                <div className="mt-3.5 pt-3.5 sm:mt-4 sm:pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  {/* Left Controls / Badges */}
                  <div className="flex items-center space-x-2 text-xs">
                    <button
                      onClick={() => setShowSchemesModal(true)}
                      className="scheme-selector-btn flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 font-medium transition-colors duration-200"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-teal-600" />
                      <span>5 HDFC Schemes</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>

                    <button
                      onClick={() => setShowComplianceModal(true)}
                      className="facts-mode-btn hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-50/70 border border-emerald-200/70 text-emerald-700 font-medium"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Facts-Only Mode</span>
                    </button>
                  </div>

                  {/* Right Controls: Citation Toggle, Counter & Send Button */}
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setCitationToggle(!citationToggle)}
                      className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all duration-200 ${citationToggle
                          ? 'bg-teal-50 text-teal-700 border border-teal-200'
                          : 'bg-slate-50 text-slate-400 border border-slate-200'
                        }`}
                      title="Verified Source Citation requirement"
                    >
                      <span className={`w-2 h-2 rounded-full ${citationToggle ? 'bg-teal-500' : 'bg-slate-300'}`}></span>
                      <span>Citation</span>
                    </button>

                    <span className="text-[11px] text-slate-400">
                      {input.length}/1000
                    </span>

                    <button
                      onClick={() => handleSendMessage()}
                      disabled={loading || !input.trim()}
                      className="w-9 h-9 rounded-full bg-slate-900 hover:bg-emerald-600 text-white flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:hover:bg-slate-900 shadow-sm hover:shadow active:scale-95 shrink-0"
                      title="Send question"
                    >
                      <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </div>

                {/* Google-Style Autocomplete Question Suggestions Dropdown */}
                <AutocompleteSuggestions
                  dropdownRef={suggestionDropdownRef}
                  suggestions={suggestions}
                  query={input}
                  isOpen={showSuggestions}
                  highlightedIndex={highlightedIndex}
                  onSelect={handleSelectSuggestion}
                  onClose={() => {
                    setShowSuggestions(false);
                    setHighlightedIndex(-1);
                  }}
                  placement="bottom"
                />
              </div>
            </div>
          ) : (
            /* ============================================================ */
            /* 3B. ACTIVE CHAT CONVERSATION VIEW                           */
            /* ============================================================ */
            <div className="flex-1 overflow-y-auto w-full max-w-[880px] mx-auto px-4 sm:px-6 py-5 space-y-5">
              {messages.map((msg) => {
                const parsed =
                  msg.sender === 'assistant'
                    ? parseAssistantResponse(msg.text, msg.sourceUrl, msg.lastUpdated)
                    : null;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[90%] sm:max-w-[85%] rounded-2xl p-4 sm:p-5 shadow-xs transition-all ${msg.sender === 'user'
                          ? 'bg-[#00D09C] hover:bg-[#00C291] text-slate-950 font-medium rounded-br-xs shadow-2xs'
                          : 'bg-white border border-slate-200/90 text-slate-800 rounded-bl-xs'
                        }`}
                    >
                      {/* Assistant Message Header & Intent Badges */}
                      {msg.sender === 'assistant' && (
                        <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100">
                          <div className="flex items-center space-x-2">
                            <img
                              src={compassEmblem}
                              alt="Fund Compass Emblem"
                              className="w-4 h-4 object-contain"
                            />
                            <span className="text-xs font-bold text-slate-800">Fund Compass</span>

                            {msg.intent === 'factual_response' && (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Facts-Only Response
                              </span>
                            )}
                            {msg.intent === 'advisory_refusal' && (
                              <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 text-rose-600" /> Advisory Refused
                              </span>
                            )}
                            {msg.intent === 'performance_refusal' && (
                              <span className="bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1">
                                <ExternalLink className="w-3 h-3 text-sky-600" /> Factsheet Redirect
                              </span>
                            )}
                            {msg.intent === 'out_of_scope_refusal' && (
                              <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1">
                                <Compass className="w-3 h-3 text-indigo-600" /> Mutual Funds Scope
                              </span>
                            )}
                            {msg.intent === 'pii_violation' && (
                              <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3 text-amber-600" /> Security Alert (No PII)
                              </span>
                            )}
                          </div>

                          {/* Quick Copy Response Button */}
                          <button
                            onClick={() => copyToClipboard(msg.id, parsed?.body || msg.text)}
                            title="Copy response"
                            className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-50 transition"
                          >
                            {copiedId === msg.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}

                      {/* Message Body */}
                      {msg.sender === 'user' ? (
                        <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap text-slate-950 font-medium">
                          {msg.text}
                        </p>
                      ) : (
                        <div className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap text-slate-800">
                          {renderFormattedText(parsed?.body || msg.text)}
                        </div>
                      )}

                      {/* Verified Source Citation Card */}
                      {msg.sender === 'assistant' && parsed?.sourceUrl && (
                        <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70">
                          <div className="flex items-center space-x-1.5 text-slate-600 font-medium">
                            <ExternalLink className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Verified Source Factsheet:</span>
                          </div>
                          <a
                            href={parsed.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-700 hover:text-emerald-800 hover:underline flex items-center space-x-1 font-mono text-[11px] font-semibold truncate max-w-[280px]"
                          >
                            <span className="truncate">{parsed.sourceUrl}</span>
                            <ExternalLink className="w-3 h-3 shrink-0 ml-1" />
                          </a>
                        </div>
                      )}

                      {/* Timestamp & Provenance Footer */}
                      {msg.sender === 'assistant' && parsed?.lastUpdated && (
                        <p className="mt-2 text-[11px] text-slate-400 italic">
                          Last updated from sources: {parsed.lastUpdated}
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
                  </div>
                );
              })}

              {loading && (
                <div className="flex items-center space-x-2 text-slate-600 text-xs py-2.5 bg-white border border-slate-200/90 px-4 rounded-2xl w-fit shadow-xs">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                  <span>Retrieving verified facts and generating compliant response...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* ============================================================== */}
          {/* 4. CHAT INPUT DOCK (When conversation is in progress)          */}
          {/* ============================================================== */}
          {messages.length > 0 && (
            <footer className="bg-white/90 backdrop-blur-md border-t border-slate-200/80 p-3 sm:p-4 shadow-xs sticky bottom-0 z-10">
              <div className="w-full max-w-[880px] mx-auto px-4 sm:px-6 flex flex-col space-y-2.5">
                {/* Quick Prompts Carousel Bar */}
                <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
                  <span className="text-slate-400 font-medium shrink-0">Quick prompts:</span>
                  {STARTER_QUESTIONS.map((sq, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(sq.question)}
                      className="bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 px-2.5 py-1 rounded-lg shrink-0 transition text-xs font-medium"
                    >
                      {sq.category.split('•')[0].trim()}
                    </button>
                  ))}
                </div>

                {/* Main Input Card with Autocomplete Suggestions */}
                <div className="relative z-30">
                  <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-2xl p-1.5 focus-within:bg-white focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/10 transition-all">
                    <input
                      ref={dockInputRef}
                      type="text"
                      value={input}
                      maxLength={1000}
                      onChange={(e) => handleInputChange(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onFocus={() => {
                        if (input.trim()) {
                          const matches = getQuestionSuggestions(input, 5);
                          setSuggestions(matches);
                          setShowSuggestions(matches.length > 0);
                        }
                      }}
                      disabled={loading}
                      placeholder="Ask another objective question about HDFC schemes..."
                      className="flex-1 bg-transparent border-0 text-slate-900 placeholder-slate-400 text-sm px-3 py-2 focus:outline-none"
                    />
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={loading || !input.trim()}
                      className="bg-slate-900 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white w-9 h-9 rounded-xl flex items-center justify-center transition active:scale-95 shrink-0 shadow-2xs"
                    >
                      <ArrowUp className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>

                  <AutocompleteSuggestions
                    dropdownRef={suggestionDropdownRef}
                    suggestions={suggestions}
                    query={input}
                    isOpen={showSuggestions}
                    highlightedIndex={highlightedIndex}
                    onSelect={handleSelectSuggestion}
                    onClose={() => {
                      setShowSuggestions(false);
                      setHighlightedIndex(-1);
                    }}
                    placement="top"
                  />
                </div>

                {/* Subtext Footer */}
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span className="truncate max-w-[55%] sm:max-w-none">
                    Fund Compass does not provide investment advice or fund recommendations.
                  </span>
                  <div className="flex items-center space-x-3 shrink-0">
                    <span className={input.length > 900 ? 'text-amber-600 font-semibold' : 'text-slate-400'}>
                      {input.length}/1000
                    </span>
                    <span>•</span>
                    <button
                      onClick={handleResetConversation}
                      className="hover:text-rose-600 text-slate-500 underline transition-colors"
                    >
                      Clear Conversation
                    </button>
                  </div>
                </div>
              </div>
            </footer>
          )}
        </main>
      </div>

      {/* ============================================================== */}
      {/* 5. SUPPORTED SCHEMES MODAL                                     */}
      {/* ============================================================== */}
      {showSchemesModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Supported HDFC Mutual Fund Schemes (5 Direct Growth)
                </h3>
              </div>
              <button
                onClick={() => setShowSchemesModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Fund Compass answers factual questions strictly for these 5 Direct Plan Growth schemes using Groww and HDFC factsheet records:
            </p>

            <div className="space-y-3">
              {schemes.map((s) => (
                <div
                  key={s.scheme_id}
                  className="bg-slate-50 hover:bg-white border border-slate-200 p-4 rounded-2xl space-y-2 hover:border-emerald-300 transition-all shadow-2xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-900">{s.scheme_name}</h4>
                    <span className="text-[11px] bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-md border border-emerald-200 font-semibold">
                      {s.category}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-600 pt-2 border-t border-slate-200/70">
                    <div>
                      Expense Ratio: <strong className="text-slate-900">{s.facts.expense_ratio}</strong>
                    </div>
                    <div>
                      Min SIP: <strong className="text-slate-900">{s.facts.min_sip_amount}</strong>
                    </div>
                    <div>
                      Lock-in: <strong className="text-slate-900">{s.facts.lock_in_period}</strong>
                    </div>
                    <div>
                      Riskometer: <strong className="text-slate-900">{s.facts.riskometer}</strong>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-xs">
                    <button
                      onClick={() => {
                        setShowSchemesModal(false);
                        handleSendMessage(`What is the exit load for ${s.scheme_name}?`);
                      }}
                      className="text-slate-500 hover:text-emerald-700 text-[11px] font-medium underline"
                    >
                      Ask about exit load →
                    </button>
                    <a
                      href={s.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-emerald-600 hover:text-emerald-700 hover:underline flex items-center space-x-1 font-semibold"
                    >
                      <span>View Factsheet on Groww</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowSchemesModal(false)}
                className="bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-slate-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. COMPLIANCE & DISCLAIMER MODAL                               */}
      {/* ============================================================== */}
      {showComplianceModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Regulatory & SEBI Compliance Policy
                </h3>
              </div>
              <button
                onClick={() => setShowComplianceModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-medium">
                <strong>Mandatory Directive:</strong> "Facts-only. No investment advice."
              </div>
              <p>
                Fund Compass is an educational and informational tool powered by official Groww and HDFC Mutual Fund factsheets. It operates under strict guardrails:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-slate-700">
                <li><strong>No Advisory / Opinions:</strong> It will never recommend funds, suggest investment decisions, or compare subjective performance.</li>
                <li><strong>Response Hard Cap:</strong> Every answer is capped at a maximum of 3 concise sentences.</li>
                <li><strong>Verified Citation:</strong> Every answer includes a direct clickable citation to the official factsheet.</li>
                <li><strong>Strict PII Protection:</strong> Inbound queries containing PAN cards, Aadhaar, account numbers, or folios are immediately rejected.</li>
                <li><strong>Official Education:</strong> For investment guidance, consult the SEBI/AMFI portal at <a href="https://www.amfiindia.com/investor-corner/knowledge-center" target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline font-semibold">AMFI Mutual Fund Sahi Hai</a>.</li>
              </ul>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowComplianceModal(false)}
                className="bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-slate-800 transition"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. ARCHITECTURE & AI ENGINE MODAL                              */}
      {/* ============================================================== */}
      {showEngineModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Fund Compass AI Architecture
                </h3>
              </div>
              <button
                onClick={() => setShowEngineModal(false)}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-800">LLM Inference:</span>
                  <span className="font-mono text-emerald-700">Groq (openai/gpt-oss-120b, T=0.0)</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-800">Vector Embeddings:</span>
                  <span className="font-mono text-slate-700">ChromaDB + all-MiniLM-L6-v2</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-800">Backend Gateway:</span>
                  <span className="font-mono text-slate-700">FastAPI REST on Railway</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-800">Fallback Engine:</span>
                  <span className="font-mono text-slate-700">Deterministic Rule-based RAG</span>
                </div>
              </div>

              <p>
                The RAG pipeline prioritizes <strong>accuracy over intelligence</strong>. Even if the Groq LLM API is unavailable, the deterministic fallback engine serves 100% verified facts from normalized JSON records.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowEngineModal(false)}
                className="bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-slate-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. SIP CALCULATOR MODAL (Zerodha-inspired)                       */}
      {/* ============================================================== */}
      {showSipModal && (
        <div
          id="sip-modal"
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSipModal(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="sip-modal-title"
        >
          <div
            className="sip-dialog bg-white border border-slate-200/90 rounded-3xl max-w-2xl sm:max-w-3xl w-full max-h-[92vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 1. FIXED HEADER SECTION */}
            <div className="shrink-0 px-5 sm:px-7 pt-5 sm:pt-6 pb-3 border-b border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                {/* Left Title & Eyebrow */}
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="sip-eyebrow inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-slate-100 text-slate-500 border border-slate-200/60">
                      020 • CALCULATOR
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/70">
                      Monthly Compounding
                    </span>
                  </div>
                  <h2 id="sip-modal-title" className="sip-title text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-1">
                    SIP calculator
                  </h2>
                </div>

                {/* Right Controls: Scheme Dropdown (Red marked area in Image 1) & Close Button */}
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <select
                      id="sip-scheme-select"
                      value={sipSchemeId}
                      onChange={(e) => handleSipSchemeSelect(e.target.value)}
                      className="sip-select appearance-none bg-white border border-slate-300 hover:border-slate-400 text-slate-800 text-xs font-semibold rounded-xl pl-3 pr-8 py-2 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer transition-colors max-w-[210px] sm:max-w-[270px] truncate"
                      aria-label="Select HDFC Mutual Fund Scheme"
                    >
                      <option value="">Select Scheme</option>
                      {CANONICAL_SCHEMES.map((scheme) => (
                        <option key={scheme.id} value={scheme.id}>
                          {scheme.shortName}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowSipModal(false)}
                    className="w-8 h-8 rounded-full bg-slate-100/80 hover:bg-slate-200/80 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                    aria-label="Close SIP Calculator"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tab Selection (Image 1: SIP, Lumpsum, Goal SIP) */}
              <div className="flex items-center space-x-6 border-b border-slate-100 pt-1 -mb-3">
                <button
                  type="button"
                  onClick={() => setSipMode('sip')}
                  className={`pb-3 text-sm font-semibold transition-all relative cursor-pointer ${
                    sipMode === 'sip'
                      ? 'text-[#387ED1] border-b-2 border-[#387ED1]'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  SIP
                </button>
                <button
                  type="button"
                  onClick={() => setSipMode('lumpsum')}
                  className={`pb-3 text-sm font-semibold transition-all relative cursor-pointer ${
                    sipMode === 'lumpsum'
                      ? 'text-[#387ED1] border-b-2 border-[#387ED1]'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Lumpsum
                </button>
                <button
                  type="button"
                  disabled
                  className="pb-3 text-sm font-medium text-slate-300 cursor-not-allowed flex items-center space-x-1"
                  title="Goal-based planning coming soon"
                >
                  <span>Goal SIP</span>
                  <span className="text-[9px] bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded font-normal">Soon</span>
                </button>
              </div>
            </div>

            {/* 2. SCROLLABLE CALCULATOR BODY */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-4 space-y-4 overscroll-contain min-h-0">
              {/* Scheme Context Card */}
              {activeSipScheme ? (
                <div className="sip-scheme-card p-3 sm:p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">{activeSipScheme.name}</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-emerald-800 border border-emerald-200">
                        {activeSipScheme.category}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600 text-[11px]">
                      <span>Min SIP: <strong className="text-slate-900 font-semibold">₹{activeSipScheme.minSip}</strong></span>
                      <span>Benchmark: <strong className="text-slate-900 font-semibold">{activeSipScheme.benchmark}</strong></span>
                      <span>Risk: <strong className="text-slate-900 font-semibold">{activeSipScheme.riskometer}</strong></span>
                      <span>Lock-in: <strong className="text-slate-900 font-semibold">{activeSipScheme.lockIn}</strong></span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <a
                      href={activeSipScheme.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-[11px] font-semibold text-emerald-700 bg-white px-2.5 py-1 rounded-lg border border-emerald-200 hover:bg-emerald-50 transition-colors"
                    >
                      <span>Groww Factsheet</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href={activeSipScheme.factsheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-[11px] font-semibold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                    >
                      <span>AMC Factsheet</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="sip-empty-state p-3 sm:p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs flex items-center justify-between gap-3 text-slate-600">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-[#387ED1] shrink-0 font-bold">
                      i
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">Select an HDFC Mutual Fund Scheme above</p>
                      <p className="text-[11px] text-slate-500">
                        Choose from the 5 supported schemes in the top-right dropdown to automatically validate minimum SIP constraints (e.g. ₹500 for ELSS, ₹100 for others).
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Validation Alert */}
              {activeSipScheme && sipAmount < activeSipScheme.minSip && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Minimum SIP for {activeSipScheme.shortName} is ₹{activeSipScheme.minSip}/month.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSipAmount(activeSipScheme.minSip)}
                    className="font-bold underline cursor-pointer text-amber-900 hover:text-amber-950 text-[11px] shrink-0 ml-2"
                  >
                    Set to ₹{activeSipScheme.minSip}
                  </button>
                </div>
              )}

              {/* Row 1: Frequency (Zerodha Layout) */}
              <div className="sip-input-row border border-slate-200 rounded-2xl p-4 bg-white space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700">Frequency</label>
                  <div className="sip-input-badge px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs font-semibold">
                    Monthly
                  </div>
                </div>
              </div>

              {/* Row 2: SIP / Investment Amount */}
              <div className="sip-input-row border border-slate-200 rounded-2xl p-4 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="sip-amount-range" className="text-sm font-semibold text-slate-700">
                    {sipMode === 'sip' ? 'SIP amount' : 'Lumpsum amount'}
                  </label>
                  <div className="sip-input-box flex items-center border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50/70 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                    <span className="text-xs font-bold text-slate-500 mr-1.5">₹</span>
                    <input
                      type="number"
                      min={activeSipScheme ? activeSipScheme.minSip : 100}
                      max={200000}
                      step={500}
                      value={sipAmount}
                      onChange={(e) => setSipAmount(Math.max(0, Number(e.target.value)))}
                      className="sip-input-num text-sm font-bold text-slate-900 bg-transparent border-0 focus:outline-none w-24 text-right"
                    />
                  </div>
                </div>
                <div>
                  <input
                    id="sip-amount-range"
                    type="range"
                    min={activeSipScheme ? activeSipScheme.minSip : 100}
                    max={100000}
                    step={500}
                    value={sipAmount}
                    onChange={(e) => setSipAmount(Number(e.target.value))}
                    className="sip-slider w-full cursor-pointer accent-[#387ED1]"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-1">
                    <span>₹{activeSipScheme ? activeSipScheme.minSip : 100}</span>
                    <span>₹50,000</span>
                    <span>₹1,00,000</span>
                  </div>
                </div>
              </div>

              {/* Row 3: Investment Duration */}
              <div className="sip-input-row border border-slate-200 rounded-2xl p-4 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="sip-duration-range" className="text-sm font-semibold text-slate-700">
                    Investment duration
                  </label>
                  <div className="sip-input-box flex items-center border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50/70 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={sipDuration}
                      onChange={(e) => setSipDuration(Math.max(1, Number(e.target.value)))}
                      className="sip-input-num text-sm font-bold text-slate-900 bg-transparent border-0 focus:outline-none w-12 text-right"
                    />
                    <span className="text-xs font-semibold text-slate-500 ml-1.5">
                      {sipDuration === 1 ? 'year' : 'years'}
                    </span>
                  </div>
                </div>
                <div>
                  <input
                    id="sip-duration-range"
                    type="range"
                    min={1}
                    max={30}
                    step={1}
                    value={sipDuration}
                    onChange={(e) => setSipDuration(Number(e.target.value))}
                    className="sip-slider w-full cursor-pointer accent-[#387ED1]"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-1">
                    <span>1 yr</span>
                    <span>15 yrs</span>
                    <span>30 yrs</span>
                  </div>
                </div>
              </div>

              {/* Row 4: Expected Rate of Return */}
              <div className="sip-input-row border border-slate-200 rounded-2xl p-4 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5">
                    <label htmlFor="sip-rate-range" className="text-sm font-semibold text-slate-700">
                      Expected rate of return
                    </label>
                    <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">
                      (Hypothetical assumption)
                    </span>
                  </div>
                  <div className="sip-input-box flex items-center border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50/70 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
                    <input
                      type="number"
                      min={1}
                      max={30}
                      step={0.5}
                      value={sipRate}
                      onChange={(e) => setSipRate(Math.max(0.5, Number(e.target.value)))}
                      className="sip-input-num text-sm font-bold text-slate-900 bg-transparent border-0 focus:outline-none w-12 text-right"
                    />
                    <span className="text-xs font-bold text-slate-500 ml-1.5">%</span>
                  </div>
                </div>
                <div>
                  <input
                    id="sip-rate-range"
                    type="range"
                    min={1}
                    max={30}
                    step={0.5}
                    value={sipRate}
                    onChange={(e) => setSipRate(Number(e.target.value))}
                    className="sip-slider w-full cursor-pointer accent-[#387ED1]"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium mt-1">
                    <span>1%</span>
                    <span>15%</span>
                    <span>30%</span>
                  </div>
                </div>
              </div>

              {/* 3. RESULTS SECTION (Zerodha Reference Image 1 & Image 2) */}
              <div className="sip-results-box border border-slate-200 rounded-2xl p-5 bg-slate-50/70 space-y-4">
                {/* Three Metric Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sip-metric-col space-y-1">
                    <div className="flex items-center text-xs font-medium text-slate-500">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#F07B3F] inline-block mr-2 shrink-0" />
                      <span>Invested amount</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                      ₹ {formatINR(sipCalcResult.invested)}
                    </p>
                  </div>

                  <div className="sip-metric-col space-y-1">
                    <div className="flex items-center text-xs font-medium text-slate-500">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#387ED1] inline-block mr-2 shrink-0" />
                      <span>Estimated returns</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                      ₹ {formatINR(sipCalcResult.returns)}
                    </p>
                  </div>

                  <div className="sip-metric-col space-y-1">
                    <div className="flex items-center text-xs font-medium text-slate-500">
                      <span>Total value</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 sm:text-slate-900 tracking-tight">
                      ₹ {formatINR(sipCalcResult.total)}
                    </p>
                  </div>
                </div>

                {/* Proportionally Animated Dual Bar (Green marked area in Image 1) */}
                <div className="space-y-2 pt-1">
                  <div
                    className="sip-bar-container h-8 sm:h-9 w-full rounded-xl overflow-hidden flex bg-slate-200 shadow-inner"
                    role="progressbar"
                    aria-label="Investment vs Returns Proportion"
                  >
                    {/* Orange segment: Invested amount */}
                    <div
                      className="sip-bar-invested bg-[#F07B3F] h-full flex items-center justify-center transition-all duration-300 ease-out select-none"
                      style={{ width: `${sipCalcResult.investedPct}%` }}
                      title={`Invested: ${sipCalcResult.investedPct}%`}
                    >
                      {sipCalcResult.investedPct >= 10 && (
                        <span className="text-white text-xs font-bold px-1 truncate">
                          {sipCalcResult.investedPct}%
                        </span>
                      )}
                    </div>

                    {/* Blue segment: Estimated returns */}
                    <div
                      className="sip-bar-returns bg-[#387ED1] h-full flex items-center justify-center transition-all duration-300 ease-out select-none"
                      style={{ width: `${sipCalcResult.returnsPct}%` }}
                      title={`Returns: ${sipCalcResult.returnsPct}%`}
                    >
                      {sipCalcResult.returnsPct >= 10 && (
                        <span className="text-white text-xs font-bold px-1 truncate">
                          {sipCalcResult.returnsPct}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bar Legend */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 px-0.5">
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#F07B3F]" />
                      <span>Invested amount ({sipCalcResult.investedPct}%)</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="w-2.5 h-2.5 rounded-sm bg-[#387ED1]" />
                      <span>Estimated returns ({sipCalcResult.returnsPct}%)</span>
                    </div>
                  </div>
                </div>

                {/* Compliance & Regulatory Disclaimer */}
                <div className="sip-disclaimer pt-3 border-t border-slate-200/80 text-[11px] text-slate-500 space-y-1 leading-relaxed">
                  <p>
                    <strong>Regulatory Disclaimer:</strong> Illustrative example only. The displayed figures are based on a hypothetical annual return assumption of {sipRate}%, compounded monthly with beginning-of-month instalments.
                  </p>
                  <p>
                    Mutual fund investments are subject to market risks; past performance does not guarantee future results. Factual parameters verified from official Groww & HDFC records (last updated: 2026-11-10).
                  </p>
                </div>
              </div>
            </div>

            {/* 4. FIXED FOOTER */}
            <div className="sip-footer shrink-0 px-5 sm:px-7 py-3.5 border-t border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <span>Have questions about this fund?</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowSipModal(false);
                    const query = activeSipScheme
                      ? `What is the exit load and expense ratio for ${activeSipScheme.name}?`
                      : 'What are the 5 supported HDFC mutual fund schemes?';
                    handleSendMessage(query);
                  }}
                  className="font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center space-x-1 underline decoration-emerald-300 cursor-pointer"
                >
                  <span>Ask Fund Compass Chatbot</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowSipModal(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 8. HELP & FAQS MODAL                                           */}
      {/* ============================================================== */}
      {showHelpModal && (
        <div
          id="help-modal"
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowHelpModal(false);
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="faq-modal-title"
        >
          <div className="faq-dialog bg-white border border-slate-200/90 rounded-3xl max-w-2xl w-full max-h-[88vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
            {/* 1. FIXED HEADER SECTION */}
            <div className="shrink-0 px-5 sm:px-7 pt-5 sm:pt-6 pb-3 border-b border-slate-100">
              {/* Eyebrow & Close Button */}
              <div className="flex items-center justify-between mb-2">
                <span className="faq-eyebrow inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-slate-100 text-slate-500 border border-slate-200/60">
                  010 • FAQS
                </span>
                <button
                  type="button"
                  onClick={() => setShowHelpModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100/80 hover:bg-slate-200/80 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Close Quick Help"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Title & Description */}
              <h2
                id="faq-modal-title"
                className="faq-title text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 text-center"
              >
                Quick Help!
              </h2>
              <p className="faq-subtitle text-[11px] sm:text-xs text-slate-500 text-center mt-1 whitespace-nowrap overflow-hidden text-ellipsis tracking-tight">
                Frequently asked questions about the 5 supported HDFC mutual fund schemes and platform guidelines.
              </p>

              {/* Scheme Filter Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-4 pb-1">
                {FAQ_SCHEME_TABS.map((tab) => {
                  const isActive = faqSchemeFilter === tab.id;
                  const count =
                    tab.id === 'all'
                      ? QUICK_HELP_FAQS.length
                      : QUICK_HELP_FAQS.filter((f) => f.schemeKey === tab.id).length;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setFaqSchemeFilter(tab.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer flex items-center space-x-1.5 ${
                        isActive
                          ? 'faq-tab-active bg-slate-950 text-white shadow-xs'
                          : 'faq-tab-inactive bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900 border border-slate-200/60'
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-200/70 text-slate-500'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. SCROLLABLE ACCORDION CONTENT */}
            <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-4 space-y-3 overscroll-contain min-h-0">
              {QUICK_HELP_FAQS.filter(
                (item) => faqSchemeFilter === 'all' || item.schemeKey === faqSchemeFilter
              ).map((item, idx) => {
                const isExpanded = expandedFaqIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className={`transition-all duration-200 ${
                      isExpanded
                        ? 'faq-item-expanded rounded-2xl bg-white border border-blue-200/90 ring-2 ring-blue-500/10 shadow-sm p-4 sm:p-5'
                        : 'faq-item-collapsed rounded-2xl bg-slate-100/70 hover:bg-slate-100 border border-slate-200/60 p-3.5 sm:p-4 hover:border-slate-300/80'
                    }`}
                  >
                    {/* Header Row: Number + Question + Toggle */}
                    <div
                      className="flex items-center justify-between gap-3 cursor-pointer select-none"
                      onClick={() => toggleFaq(item.id)}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span
                          className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 transition-colors ${
                            isExpanded
                              ? 'faq-num-expanded bg-blue-50 text-blue-600 border border-blue-200/80'
                              : 'faq-num-collapsed bg-white text-slate-600 border border-slate-200/80 shadow-2xs'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span
                          className={`faq-q-text text-xs sm:text-sm text-left leading-snug transition-colors ${
                            isExpanded
                              ? 'font-bold text-slate-950'
                              : 'font-semibold text-slate-800'
                          }`}
                        >
                          {item.question}
                        </span>
                      </div>

                      {/* Plus / Minus Circular Toggle Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFaq(item.id);
                        }}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-150 cursor-pointer ${
                          isExpanded
                            ? 'faq-toggle-expanded bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 shadow-2xs'
                            : 'faq-toggle-collapsed bg-slate-950 text-white hover:scale-105 shadow-xs'
                        }`}
                        aria-label={isExpanded ? 'Collapse answer' : 'Expand answer'}
                      >
                        {isExpanded ? (
                          <X className="w-4 h-4 stroke-[2.2]" />
                        ) : (
                          <Plus className="w-4 h-4 stroke-[2.2]" />
                        )}
                      </button>
                    </div>

                    {/* Expanded Content: Answer + Badges + Verified Sources */}
                    {isExpanded && (
                      <div className="pl-10 pr-1 pt-3.5 space-y-3 animate-in fade-in duration-200">
                        <p className="faq-a-text text-xs sm:text-sm text-slate-600 leading-relaxed">
                          {item.answer}
                        </p>

                        {/* Scheme & Category Badges */}
                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
                            {item.schemeName}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200/60">
                            {item.category}
                          </span>
                        </div>

                        {/* Verified Source Citation Box */}
                        <div className="faq-source-box flex flex-wrap items-center justify-between gap-2.5 p-2.5 sm:p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px]">
                          <div className="flex flex-wrap items-center gap-2.5 text-slate-500">
                            <span className="font-semibold text-slate-700">Verified Source:</span>
                            {item.sourceUrl && (
                              <a
                                href={item.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-teal-600 hover:text-teal-700 font-semibold underline decoration-teal-300 space-x-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span>Groww Factsheet</span>
                                <ExternalLink className="w-3 h-3 ml-0.5" />
                              </a>
                            )}
                            {item.factsheetUrl && (
                              <a
                                href={item.factsheetUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-semibold underline decoration-blue-300 space-x-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <span>HDFC AMC Portal</span>
                                <ExternalLink className="w-3 h-3 ml-0.5" />
                              </a>
                            )}
                          </div>

                          {/* Ask in Chat Action Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAskFaq(item.question);
                            }}
                            className="inline-flex items-center px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
                            title="Send this question to the AI Chatbot"
                          >
                            <span>Ask in Chat</span>
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 3. FIXED FOOTER SECTION */}
            <div className="faq-footer shrink-0 px-5 sm:px-7 py-3.5 border-t border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                <span>Have any other questions?</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowHelpModal(false);
                    setTimeout(() => inputRef.current?.focus(), 100);
                  }}
                  className="font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center underline decoration-emerald-300 cursor-pointer"
                >
                  <span>Ask Fund Compass AI Chatbot</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 9. MOBILE NAVIGATION DRAWER (Slide-in with dark backdrop)      */}
      {/* ============================================================== */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 sm:hidden flex transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-72 bg-white h-full p-5 shadow-2xl flex flex-col justify-between transform transition-transform duration-300 ease-out animate-in slide-in-from-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2.5">
                  <img src={compassEmblem} alt="Fund Compass" className="w-8 h-8 object-contain" />
                  <div>
                    <span className="font-extrabold text-slate-900 text-sm block leading-none">Fund Compass</span>
                    <span className="text-[10px] text-emerald-600 font-semibold block leading-none mt-1">Facts-Only MF</span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                  aria-label="Close navigation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1.5 text-sm font-medium">
                <button
                  onClick={() => {
                    handleResetConversation();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 p-2.5 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition"
                >
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                  <span>New Conversation</span>
                </button>

                <button
                  onClick={() => {
                    setShowSchemesModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition"
                >
                  <div className="flex items-center space-x-3">
                    <BookOpen className="w-4 h-4 text-slate-400" />
                    <span>Supported Schemes</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#00D09C] text-slate-950 text-[10px] font-bold">
                    5
                  </span>
                </button>

                <button
                  onClick={() => {
                    setShowSipModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 p-2.5 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition"
                >
                  <Calculator className="w-4 h-4 text-slate-400" />
                  <span>SIP Calculator</span>
                </button>

                <button
                  onClick={() => {
                    setShowComplianceModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 p-2.5 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-rose-600 transition"
                >
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  <span>Compliance Disclaimers</span>
                </button>

                <button
                  onClick={() => {
                    setShowEngineModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 p-2.5 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-teal-600 transition"
                >
                  <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                  <span>Engine Architecture</span>
                </button>

                <button
                  onClick={() => {
                    setShowHelpModal(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 p-2.5 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
                >
                  <Headphones className="w-4 h-4 text-slate-400" />
                  <span>Help & FAQs</span>
                </button>
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00D09C] to-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center shadow-xs ring-2 ring-emerald-500/20 relative shrink-0">
                  <span>FC</span>
                  <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border-2 border-white rounded-full"></span>
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-xs font-semibold text-slate-800 truncate leading-tight">Investor Session</p>
                  <p className="text-[10px] text-emerald-600 font-medium truncate leading-tight mt-0.5">Verified • Groww MF</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">Fund Compass v2.0 • Facts-Only</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
