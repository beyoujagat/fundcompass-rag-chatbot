import { Percent, Lock, Wallet, PieChart } from 'lucide-react';
import { StarterQuestion } from '../types';

export const STARTER_QUESTIONS: StarterQuestion[] = [
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
