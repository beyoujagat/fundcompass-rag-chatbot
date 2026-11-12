import React from 'react';
import { Sparkles, BookOpen, ChevronDown, ShieldCheck, ArrowUp } from 'lucide-react';
import compassEmblem from '../assets/compass-emblem.png';
import { STARTER_QUESTIONS } from '../data/starterQuestions';
import { getQuestionSuggestions, QuestionSuggestion } from '../data/questionSuggestions';
import { AutocompleteSuggestions } from './AutocompleteSuggestions';

interface WelcomeHeroProps {
  input: string;
  loading: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  handleInputChange: (val: string) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleSendMessage: (textToSend?: string) => void;
  suggestions: QuestionSuggestion[];
  setSuggestions: React.Dispatch<React.SetStateAction<QuestionSuggestion[]>>;
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  highlightedIndex: number;
  setHighlightedIndex: React.Dispatch<React.SetStateAction<number>>;
  suggestionDropdownRef: React.RefObject<HTMLDivElement>;
  handleSelectSuggestion: (q: string) => void;
  activeCardIdx: number | null;
  setActiveCardIdx: (idx: number | null) => void;
  onOpenSchemesModal: () => void;
  onOpenComplianceModal: () => void;
}

export const WelcomeHero: React.FC<WelcomeHeroProps> = ({
  input,
  loading,
  inputRef,
  handleInputChange,
  handleKeyDown,
  handleSendMessage,
  suggestions,
  setSuggestions,
  showSuggestions,
  setShowSuggestions,
  highlightedIndex,
  setHighlightedIndex,
  suggestionDropdownRef,
  handleSelectSuggestion,
  activeCardIdx,
  setActiveCardIdx,
  onOpenSchemesModal,
  onOpenComplianceModal,
}) => {
  return (
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

      {/* Welcoming Typography */}
      <div className="w-full max-w-2xl mx-auto text-center">
        {/* Line 1: WELCOME TO FundCompass with curved green accent under Compass */}
        <h1 className="text-[30px] sm:text-[34px] lg:text-[36px] font-extrabold text-slate-900 tracking-tight leading-tight">
          WELCOME TO{' '}
          <span className="font-extrabold italic" style={{ color: '#022581' }}>
            Fund
          </span>
          <span
            className="font-extrabold italic relative inline-block"
            style={{ color: '#00D09C' }}
          >
            Compass
            {/* Curved green underline */}
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

        {/* Line 2: Subtitle */}
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
          Ask objective questions about the 5 selected{' '}
          <strong className="text-slate-700 font-semibold">HDFC Mutual Fund</strong> direct schemes.
          Get clear, facts-only answers using publicly available information from Groww.
        </p>
      </div>

      {/* Starter FAQ Cards Section */}
      <div className="w-full mt-7 sm:mt-8">
        {/* Header Row */}
        <div className="w-full flex items-center justify-between mb-2.5 px-0.5">
          <span className="text-[11px] sm:text-xs font-semibold tracking-wider text-slate-400 uppercase">
            GET STARTED WITH AN EXAMPLE BELOW
          </span>
          <span className="text-[11px] sm:text-xs text-slate-400 font-normal">
            Click any card to ask instantly
          </span>
        </div>

        {/* Four Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-3.5 w-full">
          {STARTER_QUESTIONS.map((item, idx) => {
            const isActive = activeCardIdx === idx;
            const borderClass = isActive
              ? 'border-2 border-emerald-400 bg-emerald-50/20'
              : 'border border-slate-200/80 hover:border-slate-300';
            return (
              <button
                key={idx}
                onClick={() => {
                  setActiveCardIdx(idx);
                  handleSendMessage(item.question);
                }}
                className={`p-4 rounded-2xl text-left transition-all duration-300 ease-out flex flex-col justify-between group h-full relative min-h-[155px] sm:min-h-[165px] bg-white/95 card-elevation backdrop-blur-xs hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60 cursor-pointer ${borderClass}`}
              >
                <div>
                  <span
                    className={`inline-block text-[10px] font-bold border px-2.5 py-0.5 rounded-md mb-2.5 transition-colors ${item.badgeStyle}`}
                  >
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
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all duration-200 shrink-0 group-hover:scale-105 ${item.iconBoxStyle}`}
                  >
                    {item.icon}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Prominent Rounded Chat Input Box */}
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
              type="button"
              onClick={onOpenSchemesModal}
              className="scheme-selector-btn flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 font-medium transition-colors duration-200 cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-teal-600" />
              <span>5 HDFC Schemes</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            <button
              type="button"
              onClick={onOpenComplianceModal}
              className="facts-mode-btn hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-50/70 border border-emerald-200/70 text-emerald-700 font-medium cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Facts-Only Mode</span>
            </button>
          </div>

          {/* Right Controls: Citation Badge, Counter & Send Button */}
          <div className="flex items-center space-x-3">
            <div
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200"
              title="Verified Source Citation requirement"
            >
              <span className="w-2 h-2 rounded-full bg-teal-500"></span>
              <span>Citation</span>
            </div>

            <span className="text-[11px] text-slate-400">{input.length}/1000</span>

            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-full bg-slate-900 hover:bg-emerald-600 text-white flex items-center justify-center transition-all duration-200 disabled:opacity-30 disabled:hover:bg-slate-900 shadow-sm hover:shadow active:scale-95 shrink-0 cursor-pointer"
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
  );
};
