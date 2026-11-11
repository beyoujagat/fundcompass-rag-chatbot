/**
 * Verified Question Suggestions Dataset & Search Engine for Fund Compass.
 *
 * RESTRICTED EXCLUSIVELY TO:
 * 1. HDFC Mid-Cap Opportunities Fund (Direct Plan - Growth)
 * 2. HDFC Small Cap Fund (Direct Plan - Growth)
 * 3. HDFC Gold ETF Fund of Fund (Direct Plan - Growth)
 * 4. HDFC Top 100 / Large Cap Fund (Direct Plan - Growth)
 * 5. HDFC ELSS Tax Saver Fund (Direct Plan - Growth)
 * Plus compliant platform factual guidelines (Statement download & Rules).
 *
 * Adheres strictly to SEBI non-advisory compliance rules. No speculative,
 * advice-seeking or external mutual fund suggestions.
 */

export interface QuestionSuggestion {
  id: string;
  question: string;
  schemeId: string;
  schemeName: string;
  category: string;
  badgeText: string;
  badgeColor: string; // Tailwind color classes for the pill badge
  keywords: string[];
}

export const QUESTION_SUGGESTIONS_POOL: QuestionSuggestion[] = [
  // =========================================================================
  // 1. HDFC Mid-Cap Opportunities Fund (Direct Plan - Growth)
  // =========================================================================
  {
    id: 'midcap-exit',
    question: 'What is the exit load for HDFC Mid-Cap Opportunities Fund?',
    schemeId: 'hdfc-mid-cap-fund-direct-growth',
    schemeName: 'HDFC Mid-Cap Opportunities Fund',
    category: 'Equity: Mid Cap',
    badgeText: 'Mid Cap',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/90',
    keywords: [
      'exit', 'exit load', 'redeem', 'redemption', 'charges', 'penalty', '1 year',
      'mid cap', 'midcap', 'mid-cap', 'opportunities', 'hdfc mid cap'
    ]
  },
  {
    id: 'midcap-expense',
    question: 'What is the expense ratio of HDFC Mid-Cap Opportunities Fund?',
    schemeId: 'hdfc-mid-cap-fund-direct-growth',
    schemeName: 'HDFC Mid-Cap Opportunities Fund',
    category: 'Equity: Mid Cap',
    badgeText: 'Mid Cap',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/90',
    keywords: [
      'expense', 'expense ratio', 'ter', 'fees', 'charges', 'cost', 'direct plan',
      'mid cap', 'midcap', 'mid-cap', 'opportunities', 'hdfc mid cap'
    ]
  },
  {
    id: 'midcap-sip',
    question: 'What are the minimum SIP and lumpsum investment amounts for HDFC Mid-Cap?',
    schemeId: 'hdfc-mid-cap-fund-direct-growth',
    schemeName: 'HDFC Mid-Cap Opportunities Fund',
    category: 'Equity: Mid Cap',
    badgeText: 'Mid Cap',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/90',
    keywords: [
      'sip', 'minimum sip', 'lumpsum', 'minimum lumpsum', 'min sip', 'investment amount',
      'mid cap', 'midcap', 'mid-cap', 'opportunities', 'hdfc mid cap'
    ]
  },
  {
    id: 'midcap-lockin-risk',
    question: 'Does HDFC Mid-Cap have any lock-in period, and what is its risk rating?',
    schemeId: 'hdfc-mid-cap-fund-direct-growth',
    schemeName: 'HDFC Mid-Cap Opportunities Fund',
    category: 'Equity: Mid Cap',
    badgeText: 'Mid Cap',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/90',
    keywords: [
      'lock in', 'lock-in', 'lockin', 'holding period', 'risk', 'riskometer', 'rating',
      'mid cap', 'midcap', 'mid-cap', 'opportunities', 'hdfc mid cap'
    ]
  },
  {
    id: 'midcap-benchmark',
    question: 'What is the benchmark index for HDFC Mid-Cap Opportunities Fund?',
    schemeId: 'hdfc-mid-cap-fund-direct-growth',
    schemeName: 'HDFC Mid-Cap Opportunities Fund',
    category: 'Equity: Mid Cap',
    badgeText: 'Mid Cap',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/90',
    keywords: [
      'benchmark', 'index', 'nifty midcap 150', 'tri', 'mid cap', 'midcap',
      'opportunities', 'hdfc mid cap'
    ]
  },
  {
    id: 'midcap-manager',
    question: 'Who is the fund manager for HDFC Mid-Cap Opportunities Fund?',
    schemeId: 'hdfc-mid-cap-fund-direct-growth',
    schemeName: 'HDFC Mid-Cap Opportunities Fund',
    category: 'Equity: Mid Cap',
    badgeText: 'Mid Cap',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/90',
    keywords: [
      'fund manager', 'manager', 'who manages', 'chirag setalvad', 'mid cap',
      'midcap', 'opportunities', 'hdfc mid cap'
    ]
  },
  {
    id: 'midcap-statement',
    question: 'How can I download my account statement for HDFC Mid-Cap Opportunities Fund?',
    schemeId: 'hdfc-mid-cap-fund-direct-growth',
    schemeName: 'HDFC Mid-Cap Opportunities Fund',
    category: 'Equity: Mid Cap',
    badgeText: 'Mid Cap',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200/90',
    keywords: [
      'statement', 'cas', 'capital gains', 'download', 'cams', 'mfcentral', 'folio',
      'mid cap', 'midcap', 'opportunities', 'hdfc mid cap'
    ]
  },

  // =========================================================================
  // 2. HDFC Small Cap Fund (Direct Plan - Growth)
  // =========================================================================
  {
    id: 'smallcap-expense',
    question: 'What is the expense ratio for HDFC Small Cap Fund?',
    schemeId: 'hdfc-small-cap-fund-direct-growth',
    schemeName: 'HDFC Small Cap Fund',
    category: 'Equity: Small Cap',
    badgeText: 'Small Cap',
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200/90',
    keywords: [
      'expense', 'expense ratio', 'ter', 'fees', 'charges', 'cost', 'direct plan',
      'small cap', 'smallcap', 'small-cap', 'hdfc small cap'
    ]
  },
  {
    id: 'smallcap-exit',
    question: 'What is the exit load policy for HDFC Small Cap Fund?',
    schemeId: 'hdfc-small-cap-fund-direct-growth',
    schemeName: 'HDFC Small Cap Fund',
    category: 'Equity: Small Cap',
    badgeText: 'Small Cap',
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200/90',
    keywords: [
      'exit', 'exit load', 'redeem', 'redemption', 'charges', 'penalty', '1 year',
      'small cap', 'smallcap', 'small-cap', 'hdfc small cap'
    ]
  },
  {
    id: 'smallcap-sip',
    question: 'What are the minimum SIP and lumpsum requirements for HDFC Small Cap?',
    schemeId: 'hdfc-small-cap-fund-direct-growth',
    schemeName: 'HDFC Small Cap Fund',
    category: 'Equity: Small Cap',
    badgeText: 'Small Cap',
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200/90',
    keywords: [
      'sip', 'minimum sip', 'lumpsum', 'minimum lumpsum', 'min sip', 'investment',
      'small cap', 'smallcap', 'small-cap', 'hdfc small cap'
    ]
  },
  {
    id: 'smallcap-lockin-risk',
    question: 'What is the lock-in period, riskometer rating, and benchmark for HDFC Small Cap?',
    schemeId: 'hdfc-small-cap-fund-direct-growth',
    schemeName: 'HDFC Small Cap Fund',
    category: 'Equity: Small Cap',
    badgeText: 'Small Cap',
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200/90',
    keywords: [
      'lock in', 'lock-in', 'lockin', 'risk', 'riskometer', 'benchmark', 'bse 250',
      'small cap', 'smallcap', 'small-cap', 'hdfc small cap'
    ]
  },
  {
    id: 'smallcap-manager',
    question: 'Who manages the HDFC Small Cap Fund?',
    schemeId: 'hdfc-small-cap-fund-direct-growth',
    schemeName: 'HDFC Small Cap Fund',
    category: 'Equity: Small Cap',
    badgeText: 'Small Cap',
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200/90',
    keywords: [
      'fund manager', 'manager', 'who manages', 'chirag setalvad', 'small cap',
      'smallcap', 'small-cap', 'hdfc small cap'
    ]
  },
  {
    id: 'smallcap-statement',
    question: 'How to download account statement for HDFC Small Cap Fund?',
    schemeId: 'hdfc-small-cap-fund-direct-growth',
    schemeName: 'HDFC Small Cap Fund',
    category: 'Equity: Small Cap',
    badgeText: 'Small Cap',
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200/90',
    keywords: [
      'statement', 'cas', 'capital gains', 'download', 'cams', 'mfcentral', 'folio',
      'small cap', 'smallcap', 'small-cap', 'hdfc small cap'
    ]
  },

  // =========================================================================
  // 3. HDFC Gold ETF Fund of Fund (Direct Plan - Growth)
  // =========================================================================
  {
    id: 'gold-exit',
    question: 'What is the exit load for HDFC Gold ETF Fund of Fund?',
    schemeId: 'hdfc-gold-etf-fund-of-fund-direct-plan-growth',
    schemeName: 'HDFC Gold ETF Fund of Fund',
    category: 'Commodities / Gold FoF',
    badgeText: 'Gold FoF',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200/90',
    keywords: [
      'exit', 'exit load', 'redeem', 'redemption', 'charges', '15 days', 'penalty',
      'gold', 'gold etf', 'gold fof', 'gold fund', 'hdfc gold'
    ]
  },
  {
    id: 'gold-expense',
    question: 'What is the expense ratio of HDFC Gold ETF FoF?',
    schemeId: 'hdfc-gold-etf-fund-of-fund-direct-plan-growth',
    schemeName: 'HDFC Gold ETF Fund of Fund',
    category: 'Commodities / Gold FoF',
    badgeText: 'Gold FoF',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200/90',
    keywords: [
      'expense', 'expense ratio', 'ter', 'fees', 'charges', 'cost', '0.16',
      'gold', 'gold etf', 'gold fof', 'gold fund', 'hdfc gold'
    ]
  },
  {
    id: 'gold-details',
    question: 'What is the benchmark, lock-in period, and minimum SIP for HDFC Gold FoF?',
    schemeId: 'hdfc-gold-etf-fund-of-fund-direct-plan-growth',
    schemeName: 'HDFC Gold ETF Fund of Fund',
    category: 'Commodities / Gold FoF',
    badgeText: 'Gold FoF',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200/90',
    keywords: [
      'benchmark', 'lock in', 'lock-in', 'lockin', 'minimum sip', 'sip', 'physical gold',
      'gold', 'gold etf', 'gold fof', 'gold fund', 'hdfc gold'
    ]
  },
  {
    id: 'gold-managers',
    question: 'Who manages the HDFC Gold ETF Fund of Fund?',
    schemeId: 'hdfc-gold-etf-fund-of-fund-direct-plan-growth',
    schemeName: 'HDFC Gold ETF Fund of Fund',
    category: 'Commodities / Gold FoF',
    badgeText: 'Gold FoF',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200/90',
    keywords: [
      'fund manager', 'manager', 'who manages', 'nirman morakhia', 'arun agarwal',
      'gold', 'gold etf', 'gold fof', 'gold fund', 'hdfc gold'
    ]
  },
  {
    id: 'gold-risk',
    question: 'What is the riskometer rating for HDFC Gold ETF Fund of Fund?',
    schemeId: 'hdfc-gold-etf-fund-of-fund-direct-plan-growth',
    schemeName: 'HDFC Gold ETF Fund of Fund',
    category: 'Commodities / Gold FoF',
    badgeText: 'Gold FoF',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200/90',
    keywords: [
      'risk', 'riskometer', 'rating', 'high risk', 'gold', 'gold etf', 'gold fof',
      'gold fund', 'hdfc gold'
    ]
  },

  // =========================================================================
  // 4. HDFC Top 100 / Large Cap Fund (Direct Plan - Growth)
  // =========================================================================
  {
    id: 'top100-expense',
    question: 'What is the expense ratio for HDFC Top 100 Fund?',
    schemeId: 'hdfc-large-cap-fund-direct-growth',
    schemeName: 'HDFC Top 100 / Large Cap Fund',
    category: 'Equity: Large Cap',
    badgeText: 'Top 100',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200/90',
    keywords: [
      'expense', 'expense ratio', 'ter', 'fees', 'charges', 'cost', 'direct plan',
      'top 100', 'top100', 'large cap', 'large-cap', 'largecap', 'hdfc top 100', 'hdfc large cap'
    ]
  },
  {
    id: 'top100-exit',
    question: 'What is the exit load for HDFC Top 100 Fund?',
    schemeId: 'hdfc-large-cap-fund-direct-growth',
    schemeName: 'HDFC Top 100 / Large Cap Fund',
    category: 'Equity: Large Cap',
    badgeText: 'Top 100',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200/90',
    keywords: [
      'exit', 'exit load', 'redeem', 'redemption', 'charges', 'penalty', '1 year',
      'top 100', 'top100', 'large cap', 'large-cap', 'largecap', 'hdfc top 100', 'hdfc large cap'
    ]
  },
  {
    id: 'top100-sip',
    question: 'What are the minimum SIP and lumpsum amounts for HDFC Top 100?',
    schemeId: 'hdfc-large-cap-fund-direct-growth',
    schemeName: 'HDFC Top 100 / Large Cap Fund',
    category: 'Equity: Large Cap',
    badgeText: 'Top 100',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200/90',
    keywords: [
      'sip', 'minimum sip', 'lumpsum', 'minimum lumpsum', 'min sip', 'investment',
      'top 100', 'top100', 'large cap', 'large-cap', 'largecap', 'hdfc top 100', 'hdfc large cap'
    ]
  },
  {
    id: 'top100-benchmark-manager',
    question: 'What is the benchmark and who is the fund manager for HDFC Top 100?',
    schemeId: 'hdfc-large-cap-fund-direct-growth',
    schemeName: 'HDFC Top 100 / Large Cap Fund',
    category: 'Equity: Large Cap',
    badgeText: 'Top 100',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200/90',
    keywords: [
      'benchmark', 'nifty 100', 'fund manager', 'manager', 'who manages', 'rahul baijal',
      'top 100', 'top100', 'large cap', 'large-cap', 'largecap', 'hdfc top 100', 'hdfc large cap'
    ]
  },
  {
    id: 'top100-lockin-risk',
    question: 'What is the riskometer rating and lock-in period for HDFC Top 100 Fund?',
    schemeId: 'hdfc-large-cap-fund-direct-growth',
    schemeName: 'HDFC Top 100 / Large Cap Fund',
    category: 'Equity: Large Cap',
    badgeText: 'Top 100',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200/90',
    keywords: [
      'risk', 'riskometer', 'lock in', 'lock-in', 'lockin', 'rating', 'very high',
      'top 100', 'top100', 'large cap', 'large-cap', 'largecap', 'hdfc top 100', 'hdfc large cap'
    ]
  },
  {
    id: 'top100-statement',
    question: 'How to download account statement for HDFC Top 100 Fund?',
    schemeId: 'hdfc-large-cap-fund-direct-growth',
    schemeName: 'HDFC Top 100 / Large Cap Fund',
    category: 'Equity: Large Cap',
    badgeText: 'Top 100',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200/90',
    keywords: [
      'statement', 'cas', 'capital gains', 'download', 'cams', 'mfcentral', 'folio',
      'top 100', 'top100', 'large cap', 'large-cap', 'largecap', 'hdfc top 100'
    ]
  },

  // =========================================================================
  // 5. HDFC ELSS Tax Saver Fund (Direct Plan - Growth)
  // =========================================================================
  {
    id: 'elss-lockin',
    question: 'What is the statutory lock-in period for HDFC ELSS Tax Saver Fund?',
    schemeId: 'hdfc-elss-tax-saver-fund-direct-plan-growth',
    schemeName: 'HDFC ELSS Tax Saver Fund',
    category: 'Equity: ELSS (Tax Saving)',
    badgeText: 'ELSS Tax Saver',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200/90',
    keywords: [
      'lock in', 'lock-in', 'lockin', '3 years', 'holding period', 'statutory',
      'elss', 'tax saver', 'tax saving', '80c', 'section 80c', 'hdfc elss'
    ]
  },
  {
    id: 'elss-exit',
    question: 'What is the exit load for HDFC ELSS Tax Saver Fund?',
    schemeId: 'hdfc-elss-tax-saver-fund-direct-plan-growth',
    schemeName: 'HDFC ELSS Tax Saver Fund',
    category: 'Equity: ELSS (Tax Saving)',
    badgeText: 'ELSS Tax Saver',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200/90',
    keywords: [
      'exit', 'exit load', 'redeem', 'redemption', 'charges', 'nil',
      'elss', 'tax saver', 'tax saving', '80c', 'section 80c', 'hdfc elss'
    ]
  },
  {
    id: 'elss-sip-expense',
    question: 'What is the minimum SIP amount and expense ratio for HDFC ELSS?',
    schemeId: 'hdfc-elss-tax-saver-fund-direct-plan-growth',
    schemeName: 'HDFC ELSS Tax Saver Fund',
    category: 'Equity: ELSS (Tax Saving)',
    badgeText: 'ELSS Tax Saver',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200/90',
    keywords: [
      'sip', 'minimum sip', 'min sip', 'expense', 'expense ratio', 'ter', '500',
      'elss', 'tax saver', 'tax saving', '80c', 'section 80c', 'hdfc elss'
    ]
  },
  {
    id: 'elss-benchmark-manager',
    question: 'What is the benchmark and who manages HDFC ELSS Tax Saver Fund?',
    schemeId: 'hdfc-elss-tax-saver-fund-direct-plan-growth',
    schemeName: 'HDFC ELSS Tax Saver Fund',
    category: 'Equity: ELSS (Tax Saving)',
    badgeText: 'ELSS Tax Saver',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200/90',
    keywords: [
      'benchmark', 'nifty 500', 'fund manager', 'manager', 'who manages', 'roshi jain',
      'elss', 'tax saver', 'tax saving', '80c', 'section 80c', 'hdfc elss'
    ]
  },
  {
    id: 'elss-tax-benefit',
    question: 'What tax deduction benefits are available under Section 80C for HDFC ELSS?',
    schemeId: 'hdfc-elss-tax-saver-fund-direct-plan-growth',
    schemeName: 'HDFC ELSS Tax Saver Fund',
    category: 'Equity: ELSS (Tax Saving)',
    badgeText: 'ELSS Tax Saver',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200/90',
    keywords: [
      'tax', 'tax deduction', '80c', 'section 80c', 'tax saving', 'tax exemption',
      'elss', 'tax saver', 'hdfc elss'
    ]
  },
  {
    id: 'elss-statement',
    question: 'How to download capital gains statement for HDFC ELSS Tax Saver Fund?',
    schemeId: 'hdfc-elss-tax-saver-fund-direct-plan-growth',
    schemeName: 'HDFC ELSS Tax Saver Fund',
    category: 'Equity: ELSS (Tax Saving)',
    badgeText: 'ELSS Tax Saver',
    badgeColor: 'bg-teal-50 text-teal-700 border-teal-200/90',
    keywords: [
      'statement', 'cas', 'capital gains', 'tax statement', 'download', 'cams', 'mfcentral',
      'elss', 'tax saver', 'tax saving', '80c', 'section 80c', 'hdfc elss'
    ]
  },

  // =========================================================================
  // 6. Platform Rules & Statement Downloads (Compliance Scope)
  // =========================================================================
  {
    id: 'rules-permitted',
    question: 'What types of questions can I ask Fund Compass?',
    schemeId: 'platform-rules',
    schemeName: 'Platform Rules & Safety',
    category: 'Compliance',
    badgeText: 'Platform Rules',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200/90',
    keywords: [
      'what can i ask', 'supported questions', 'scope', 'rules', 'capabilities',
      'permitted', 'help', 'topics', 'what questions'
    ]
  },
  {
    id: 'rules-prohibited',
    question: 'Why does Fund Compass refuse investment advice or fund recommendations?',
    schemeId: 'platform-rules',
    schemeName: 'Platform Rules & Safety',
    category: 'Compliance',
    badgeText: 'Platform Rules',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-200/90',
    keywords: [
      'advice', 'why refuse', 'refusal', 'recommendations', 'sebi', 'compliance',
      'non-advisory', 'rules', 'regulations'
    ]
  },
  {
    id: 'rules-statements',
    question: 'How can I download my official mutual fund account statement?',
    schemeId: 'platform-rules',
    schemeName: 'Investor Services',
    category: 'Investor Services',
    badgeText: 'Account CAS',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200/90',
    keywords: [
      'download statement', 'account statement', 'cas', 'capital gains', 'mfcentral',
      'cams', 'folio', 'statements', 'how to download'
    ]
  }
];

// Competitor AMCs and unsupported external mutual fund houses
const COMPETITOR_AMCS = [
  'sbi', 'axis', 'icici', 'nippon', 'tata', 'mirae', 'kotak', 'uti',
  'parag parikh', 'ppfas', 'dsp', 'motilal', 'quant', 'aditya birla',
  'absl', 'bandhan', 'franklin', 'invesco', 'canara', 'hsbc', 'sundaram'
];

// Common grammatical English stop words
const STOP_WORDS = new Set([
  'in', 'is', 'for', 'the', 'a', 'an', 'of', 'to', 'and', 'my', 'can', 'i',
  'are', 'does', 'any', 'how', 'who', 'what', 'about', 'with', 'on', 'at', 'by'
]);

/**
 * Searches the verified question suggestions pool using multi-token matching,
 * keyword weighting, and scheme canonical alias scoring.
 *
 * RESTRICTION: Exclusively matches the 5 supported HDFC mutual fund schemes.
 * Rejects competitor AMCs, non-financial topics, and irrelevant phrases.
 *
 * @param input The current text input from the chatbot input field.
 * @param limit Maximum number of suggestions to return (Default: 5).
 * @returns Array of at most `limit` verified QuestionSuggestion objects, or empty array if no matches.
 */
export function getQuestionSuggestions(input: string, limit: number = 5): QuestionSuggestion[] {
  const trimmed = input.trim();
  if (!trimmed) {
    return [];
  }

  const query = trimmed.toLowerCase();

  // 1. Hard Compliance Gate: Reject queries mentioning competitor AMCs
  for (const amc of COMPETITOR_AMCS) {
    const amcRegex = new RegExp(`\\b${amc}\\b`, 'i');
    if (amcRegex.test(query)) {
      return [];
    }
  }

  const queryTokens = query.split(/\s+/).filter(Boolean);
  const contentTokens = queryTokens.filter((t) => !STOP_WORDS.has(t) && t.length > 1);

  const scored: { item: QuestionSuggestion; score: number }[] = [];

  for (const item of QUESTION_SUGGESTIONS_POOL) {
    const qLower = item.question.toLowerCase();
    const schemeLower = item.schemeName.toLowerCase();
    const catLower = item.category.toLowerCase();
    const badgeLower = item.badgeText.toLowerCase();

    let score = 0;

    // 2. Direct whole-query matches on question text
    if (qLower === query) {
      score += 1000;
    } else if (qLower.startsWith(query)) {
      score += 650;
    } else if (qLower.includes(query)) {
      score += 400;
    }

    // 3. Direct whole-query matches on scheme name or badge
    if (schemeLower.startsWith(query)) {
      score += 350;
    } else if (schemeLower.includes(query) || badgeLower.includes(query)) {
      score += 250;
    }

    // 4. Multi-token evaluation across question, scheme, category, and keywords
    let allTokensMatched = true;
    let contentTokensMatchedCount = 0;

    for (const token of queryTokens) {
      const isStopWord = STOP_WORDS.has(token);
      let tokenFound = false;

      // Word-boundary matching for short tokens (<= 3 chars) to avoid substring collisions
      const tokenRegex = token.length <= 3
        ? new RegExp(`\\b${token}\\b`, 'i')
        : new RegExp(`${token}`, 'i');

      if (tokenRegex.test(qLower)) {
        score += isStopWord ? 10 : 70;
        tokenFound = true;
      }
      if (tokenRegex.test(schemeLower) || tokenRegex.test(badgeLower)) {
        score += isStopWord ? 10 : 60;
        tokenFound = true;
      }
      if (tokenRegex.test(catLower)) {
        score += isStopWord ? 5 : 40;
        tokenFound = true;
      }
      for (const kw of item.keywords) {
        if (tokenRegex.test(kw.toLowerCase())) {
          score += isStopWord ? 10 : 50;
          tokenFound = true;
          break;
        }
      }

      if (tokenFound) {
        if (!isStopWord && token.length > 1) {
          contentTokensMatchedCount++;
        }
      } else {
        allTokensMatched = false;
      }
    }

    // If query has non-stop-word content tokens, AT LEAST ONE content token must match
    if (contentTokens.length > 0 && contentTokensMatchedCount === 0) {
      continue;
    }

    // Reward queries where all entered tokens find a match
    if (queryTokens.length > 1 && allTokensMatched) {
      score += 250;
    }

    // Discard low-confidence accidental matches
    if (score >= 50) {
      scored.push({ item, score });
    }
  }

  // Sort descending by relevance score; tie-break by question length
  scored.sort((a, b) => b.score - a.score || a.item.question.length - b.item.question.length);

  return scored.slice(0, limit).map((s) => s.item);
}
