import React from 'react';
import { ArrowUp } from 'lucide-react';
import { STARTER_QUESTIONS } from '../data/starterQuestions';
import { getQuestionSuggestions, QuestionSuggestion } from '../data/questionSuggestions';
import { AutocompleteSuggestions } from './AutocompleteSuggestions';

interface ChatDockProps {
  input: string;
  loading: boolean;
  dockInputRef: React.RefObject<HTMLInputElement>;
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
  onResetConversation: () => void;
}

export const ChatDock: React.FC<ChatDockProps> = ({
  input,
  loading,
  dockInputRef,
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
  onResetConversation,
}) => {
  return (
    <footer className="bg-white/90 backdrop-blur-md border-t border-slate-200/80 p-3 sm:p-4 shadow-xs sticky bottom-0 z-10">
      <div className="w-full max-w-[880px] mx-auto px-4 sm:px-6 flex flex-col space-y-2.5">
        {/* Quick Prompts Carousel Bar */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-medium shrink-0">Quick prompts:</span>
          {STARTER_QUESTIONS.map((sq, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendMessage(sq.question)}
              className="bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 px-2.5 py-1 rounded-lg shrink-0 transition text-xs font-medium cursor-pointer"
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
              type="button"
              onClick={() => handleSendMessage()}
              disabled={loading || !input.trim()}
              className="bg-slate-900 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white w-9 h-9 rounded-xl flex items-center justify-center transition active:scale-95 shrink-0 shadow-2xs cursor-pointer"
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
            <span
              className={input.length > 900 ? 'text-amber-600 font-semibold' : 'text-slate-400'}
            >
              {input.length}/1000
            </span>
            <span>•</span>
            <button
              type="button"
              onClick={onResetConversation}
              className="hover:text-rose-600 text-slate-500 underline transition-colors cursor-pointer"
            >
              Clear Conversation
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
