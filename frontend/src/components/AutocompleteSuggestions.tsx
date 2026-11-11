import React from 'react';
import { Search, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { QuestionSuggestion } from '../data/questionSuggestions';

interface AutocompleteSuggestionsProps {
  suggestions: QuestionSuggestion[];
  query: string;
  isOpen: boolean;
  highlightedIndex: number;
  onSelect: (question: string) => void;
  onClose: () => void;
  dropdownRef?: React.RefObject<HTMLDivElement>;
  placement?: 'bottom' | 'top';
}

/**
 * Highlights tokens matching the user query within the question text.
 */
function renderHighlightedText(text: string, query: string) {
  const trimmed = query.trim();
  if (!trimmed) {
    return <span>{text}</span>;
  }

  const tokens = trimmed
    .split(/\s+/)
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .filter(Boolean);

  if (tokens.length === 0) {
    return <span>{text}</span>;
  }

  const regex = new RegExp(`(${tokens.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, idx) => {
        const isMatch = tokens.some((token) => new RegExp(`^${token}$`, 'i').test(part));
        return isMatch ? (
          <span key={idx} className="font-bold text-slate-950 underline decoration-[#00D09C] decoration-2 underline-offset-2">
            {part}
          </span>
        ) : (
          <span key={idx} className="text-slate-600">
            {part}
          </span>
        );
      })}
    </span>
  );
}

export const AutocompleteSuggestions: React.FC<AutocompleteSuggestionsProps> = ({
  suggestions,
  query,
  isOpen,
  highlightedIndex,
  onSelect,
  dropdownRef,
  placement = 'bottom',
}) => {
  if (!isOpen || suggestions.length === 0) {
    return null;
  }

  const positionClasses =
    placement === 'top'
      ? 'bottom-full mb-2'
      : 'top-full mt-2';

  return (
    <div
      ref={dropdownRef}
      role="listbox"
      aria-label="Mutual Fund Question Suggestions"
      className={`absolute left-0 right-0 ${positionClasses} z-50 bg-white/98 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl overflow-hidden transition-all duration-150 animate-autocomplete-in text-slate-800`}
    >
      {/* Suggestions List */}
      <div className="py-1 max-h-[290px] overflow-y-auto divide-y divide-slate-100/70">
        {suggestions.map((item, index) => {
          const isSelected = index === highlightedIndex;

          return (
            <button
              key={item.id}
              role="option"
              aria-selected={isSelected}
              type="button"
              onMouseDown={(e) => {
                // Prevent input from losing focus before selection is registered
                e.preventDefault();
                onSelect(item.question);
              }}
              className={`w-full text-left px-3.5 sm:px-4 py-2.5 flex items-center justify-between gap-3 group transition-colors duration-150 cursor-pointer ${
                isSelected
                  ? 'bg-emerald-50/80 border-l-4 border-l-[#00D09C] pl-2.5 sm:pl-3 text-slate-950 font-medium'
                  : 'hover:bg-slate-50/90 text-slate-700'
              }`}
            >
              {/* Left icon & highlighted question */}
              <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                <Search
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    isSelected ? 'text-emerald-600' : 'text-slate-400 group-hover:text-emerald-600'
                  }`}
                />
                <span className="text-xs sm:text-[13px] leading-snug truncate">
                  {renderHighlightedText(item.question, query)}
                </span>
              </div>

              {/* Right: Scheme badge & Fill action indicator */}
              <div className="flex items-center space-x-2 shrink-0">
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border whitespace-nowrap shadow-2xs ${item.badgeColor}`}
                >
                  {item.badgeText}
                </span>
                <ArrowUpRight
                  className={`w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                    isSelected ? 'text-emerald-600' : 'text-slate-300 group-hover:text-slate-600'
                  }`}
                  title="Insert question"
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Subtle Bottom Helper Footer (Google-like metadata & keyboard instructions) */}
      <div className="px-3.5 py-1.5 bg-slate-50/90 border-t border-slate-100/90 flex items-center justify-between text-[10px] text-slate-400 select-none">
        <div className="flex items-center space-x-1.5">
          <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
          <span className="font-medium text-slate-500">5 Verified HDFC Schemes</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>
            <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-mono text-slate-600">↑</kbd>
            <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-mono text-slate-600 ml-0.5">↓</kbd> navigate
          </span>
          <span>•</span>
          <span>
            <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-mono text-slate-600">↵</kbd> select
          </span>
          <span>•</span>
          <span>
            <kbd className="px-1 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-mono text-slate-600">esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
};

