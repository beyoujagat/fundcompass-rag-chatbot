import React from 'react';
import { ChevronDown, X, ExternalLink, AlertTriangle, ArrowRight } from 'lucide-react';
import { CANONICAL_SCHEMES } from '../../data/canonicalSchemes';
import { SchemeMeta, SipCalculationResult } from '../../types';
import { formatINR } from '../../utils/calculator';

interface SipCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  sipMode: 'sip' | 'lumpsum';
  setSipMode: (mode: 'sip' | 'lumpsum') => void;
  sipSchemeId: string;
  onSchemeSelect: (schemeId: string) => void;
  sipAmount: number;
  setSipAmount: (amount: number) => void;
  sipDuration: number;
  setSipDuration: (years: number) => void;
  sipRate: number;
  setSipRate: (rate: number) => void;
  activeSipScheme: SchemeMeta | null;
  sipCalcResult: SipCalculationResult;
  onAskQuestion: (query: string) => void;
}

export const SipCalculatorModal: React.FC<SipCalculatorModalProps> = ({
  isOpen,
  onClose,
  sipMode,
  setSipMode,
  sipSchemeId,
  onSchemeSelect,
  sipAmount,
  setSipAmount,
  sipDuration,
  setSipDuration,
  sipRate,
  setSipRate,
  activeSipScheme,
  sipCalcResult,
  onAskQuestion,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="sip-modal"
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 z-50 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
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

            {/* Right Controls: Scheme Dropdown & Close Button */}
            <div className="flex items-center space-x-2">
              <div className="relative">
                <select
                  id="sip-scheme-select"
                  value={sipSchemeId}
                  onChange={(e) => onSchemeSelect(e.target.value)}
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
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100/80 hover:bg-slate-200/80 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                aria-label="Close SIP Calculator"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tab Selection */}
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

          {/* Row 1: Frequency */}
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

          {/* 3. RESULTS SECTION */}
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

            {/* Proportionally Animated Dual Bar */}
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
                onClose();
                const query = activeSipScheme
                  ? `What is the exit load and expense ratio for ${activeSipScheme.name}?`
                  : 'What are the 5 supported HDFC mutual fund schemes?';
                onAskQuestion(query);
              }}
              className="font-semibold text-emerald-600 hover:text-emerald-700 inline-flex items-center space-x-1 underline decoration-emerald-300 cursor-pointer"
            >
              <span>Ask Fund Compass Chatbot</span>
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

