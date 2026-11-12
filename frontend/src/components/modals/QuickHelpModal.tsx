import React from 'react';
import { X, Plus, ExternalLink, ArrowRight } from 'lucide-react';
import { FAQ_SCHEME_TABS, QUICK_HELP_FAQS } from '../../data/quickHelpFaqs';

interface QuickHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
  faqSchemeFilter: string;
  setFaqSchemeFilter: (filter: string) => void;
  expandedFaqIds: string[];
  toggleFaq: (id: string) => void;
  onAskFaq: (question: string) => void;
  onFocusInput: () => void;
}

export const QuickHelpModal: React.FC<QuickHelpModalProps> = ({
  isOpen,
  onClose,
  faqSchemeFilter,
  setFaqSchemeFilter,
  expandedFaqIds,
  toggleFaq,
  onAskFaq,
  onFocusInput,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="help-modal"
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
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
              onClick={onClose}
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
                          onAskFaq(item.question);
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
              onClick={onFocusInput}
              className="font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center underline decoration-emerald-300 cursor-pointer"
            >
              <span>Ask Fund Compass AI Chatbot</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

