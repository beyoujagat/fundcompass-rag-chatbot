import { QuickHelpFAQ, FaqSchemeTab } from '../types';

export const FAQ_SCHEME_TABS: readonly FaqSchemeTab[] = [
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

