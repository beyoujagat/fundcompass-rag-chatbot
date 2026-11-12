import React from 'react';
import { ShieldAlert, X } from 'lucide-react';

interface ComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ComplianceModal: React.FC<ComplianceModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
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
            onClick={onClose}
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
            onClick={onClose}
            className="bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-slate-800 transition"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};

