import React from 'react';
import { BookOpen, X, ExternalLink } from 'lucide-react';
import { SchemeItem } from '../../types';

interface SupportedSchemesModalProps {
  isOpen: boolean;
  onClose: () => void;
  schemes: SchemeItem[];
  onAskQuestion: (query: string) => void;
}

export const SupportedSchemesModal: React.FC<SupportedSchemesModalProps> = ({
  isOpen,
  onClose,
  schemes,
  onAskQuestion,
}) => {
  if (!isOpen) return null;

  return (
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
            onClick={onClose}
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
                    onClose();
                    onAskQuestion(`What is the exit load for ${s.scheme_name}?`);
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
            onClick={onClose}
            className="bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-slate-800 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

