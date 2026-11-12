import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Compass,
  ShieldAlert,
  Check,
  Copy,
  RefreshCw,
} from 'lucide-react';
import compassEmblem from '../assets/compass-emblem.png';
import { Message } from '../types';
import { parseAssistantResponse, renderFormattedText } from '../utils/responseParser';

interface ChatMessagesProps {
  messages: Message[];
  loading: boolean;
  copiedId: string | null;
  onCopy: (id: string, text: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  messages,
  loading,
  copiedId,
  onCopy,
  messagesEndRef,
}) => {
  return (
    <div className="flex-1 overflow-y-auto w-full max-w-[880px] mx-auto px-4 sm:px-6 py-5 space-y-5">
      {messages.map((msg) => {
        const parsed =
          msg.sender === 'assistant'
            ? parseAssistantResponse(msg.text, msg.sourceUrl, msg.lastUpdated)
            : null;

        return (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[90%] sm:max-w-[85%] rounded-2xl p-4 sm:p-5 shadow-xs transition-all ${
                msg.sender === 'user'
                  ? 'bg-[#00D09C] hover:bg-[#00C291] text-slate-950 font-medium rounded-br-xs shadow-2xs'
                  : 'bg-white border border-slate-200/90 text-slate-800 rounded-bl-xs'
              }`}
            >
              {/* Assistant Message Header & Intent Badges */}
              {msg.sender === 'assistant' && (
                <div className="flex items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <img
                      src={compassEmblem}
                      alt="Fund Compass Emblem"
                      className="w-4 h-4 object-contain"
                    />
                    <span className="text-xs font-bold text-slate-800">Fund Compass</span>

                    {msg.intent === 'factual_response' && (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Facts-Only Response
                      </span>
                    )}
                    {msg.intent === 'advisory_refusal' && (
                      <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-rose-600" /> Advisory Refused
                      </span>
                    )}
                    {msg.intent === 'performance_refusal' && (
                      <span className="bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1">
                        <ExternalLink className="w-3 h-3 text-sky-600" /> Factsheet Redirect
                      </span>
                    )}
                    {msg.intent === 'out_of_scope_refusal' && (
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1">
                        <Compass className="w-3 h-3 text-indigo-600" /> Mutual Funds Scope
                      </span>
                    )}
                    {msg.intent === 'pii_violation' && (
                      <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3 text-amber-600" /> Security Alert (No PII)
                      </span>
                    )}
                  </div>

                  {/* Quick Copy Response Button */}
                  <button
                    type="button"
                    onClick={() => onCopy(msg.id, parsed?.body || msg.text)}
                    title="Copy response"
                    className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-50 transition cursor-pointer"
                  >
                    {copiedId === msg.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}

              {/* Message Body */}
              {msg.sender === 'user' ? (
                <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap text-slate-950 font-medium">
                  {msg.text}
                </p>
              ) : (
                <div className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap text-slate-800">
                  {renderFormattedText(parsed?.body || msg.text)}
                </div>
              )}

              {/* Verified Source Citation Card */}
              {msg.sender === 'assistant' && parsed?.sourceUrl && (
                <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70">
                  <div className="flex items-center space-x-1.5 text-slate-600 font-medium">
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Verified Source Factsheet:</span>
                  </div>
                  <a
                    href={parsed.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 hover:text-emerald-800 hover:underline flex items-center space-x-1 font-mono text-[11px] font-semibold truncate max-w-[280px]"
                  >
                    <span className="truncate">{parsed.sourceUrl}</span>
                    <ExternalLink className="w-3 h-3 shrink-0 ml-1" />
                  </a>
                </div>
              )}

              {/* Timestamp & Provenance Footer */}
              {msg.sender === 'assistant' && parsed?.lastUpdated && (
                <p className="mt-2 text-[11px] text-slate-400 italic">
                  Last updated from sources: {parsed.lastUpdated}
                </p>
              )}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
          </div>
        );
      })}

      {loading && (
        <div className="flex items-center space-x-2 text-slate-600 text-xs py-2.5 bg-white border border-slate-200/90 px-4 rounded-2xl w-fit shadow-xs">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
          <span>Retrieving verified facts and generating compliant response...</span>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};
