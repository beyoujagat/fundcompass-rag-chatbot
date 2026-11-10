import React, { useState, useEffect, useRef } from 'react';
import { Send, Compass, ShieldAlert, BookOpen, ExternalLink, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import logo from './assets/logo.png';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  intent?: string;
  sourceUrl?: string | null;
  lastUpdated?: string;
  timestamp: string;
}

interface SchemeItem {
  scheme_id: string;
  scheme_name: string;
  category: string;
  source_url: string;
  facts: {
    expense_ratio: string;
    exit_load: string;
    min_sip_amount: string;
    lock_in_period: string;
    riskometer: string;
  };
}

const STARTER_PROMPTS = [
  "What is the exit load for HDFC Mid-Cap Opportunities Fund?",
  "What is the lock-in period for HDFC ELSS Tax Saver Fund?",
  "What is the minimum SIP amount for HDFC Small Cap Fund?"
];

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [schemes, setSchemes] = useState<SchemeItem[]>([]);
  const [showSchemesModal, setShowSchemesModal] = useState(false);
  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Check health and load schemes on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/health`);
        if (res.ok) {
          setApiConnected(true);
        } else {
          setApiConnected(false);
        }
      } catch (e) {
        setApiConnected(false);
      }
    };

    const loadSchemes = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/schemes`);
        if (res.ok) {
          const data = await res.json();
          setSchemes(data);
        }
      } catch (e) {
        console.error('Failed to load schemes', e);
      }
    };

    checkBackend();
    loadSchemes();
  }, [API_BASE_URL]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: query })
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: data.reply,
        intent: data.intent,
        sourceUrl: data.source_url,
        lastUpdated: data.last_updated,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: "Fund Compass is currently unable to reach the API server. Please ensure the backend is running at " + (API_BASE_URL || 'http://localhost:8000') + ".",
        intent: "error",
        lastUpdated: "2026-11-10",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] text-slate-800 font-sans">
      {/* 1. TOP COMPLIANCE HEADER */}
      <header className="bg-white border-b border-slate-200 px-4 py-2.5 sticky top-0 z-20 shadow-xs">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* LEFT UPPER CORNER BRANDING WITH LOGO */}
          <div className="flex items-center">
            <img
              src={logo}
              alt="Fund Compass - A Mutual Fund FAQ Assistant Inspired By Groww"
              className="h-10 sm:h-11 w-auto max-w-[190px] sm:max-w-[240px] object-contain"
            />
          </div>

          {/* PERMANENT DISCLAIMER BADGE */}
          <div className="flex items-center space-x-1.5 bg-rose-50 border border-rose-200 text-rose-700 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
            <span>Facts-only. No investment advice.</span>
          </div>

          {/* Actions & Status */}
          <div className="flex items-center space-x-2 text-xs">
            <button
              onClick={() => setShowSchemesModal(true)}
              className="bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs flex items-center space-x-1.5 transition font-medium"
            >
              <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
              <span>Supported Schemes (5)</span>
            </button>
            <div className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
              <span className={`w-2 h-2 rounded-full ${apiConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></span>
              <span className="text-slate-600 text-[11px] font-medium">{apiConnected ? 'API Connected' : 'Checking API...'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. CHAT CONTAINER */}
      <main className="flex-1 overflow-y-auto p-4 max-w-4xl w-full mx-auto space-y-4">
        {messages.length === 0 ? (
          <div className="my-auto py-8 sm:py-12 text-center space-y-6">
            <div className="bg-white border border-slate-200 p-8 sm:p-10 rounded-2xl max-w-2xl mx-auto shadow-sm">
              <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-xs">
                <Compass className="w-7 h-7 stroke-[2.2]" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Welcome to Fund Compass</h2>
              <p className="text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
                Ask objective, verifiable questions about the 5 selected <strong className="text-slate-900 font-semibold">HDFC Mutual Fund</strong> schemes.
                Every response is strictly facts-only, verified from official AMC & Groww factsheets, capped at 3 sentences, and includes a verified source citation.
              </p>

              <div className="mt-6 pt-6 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider">
                  Quick Starter Questions:
                </p>
                <div className="grid gap-2.5 text-left">
                  {STARTER_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt)}
                      className="bg-slate-50 hover:bg-emerald-50/50 text-slate-700 hover:text-slate-900 text-sm p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 transition-all flex items-center justify-between group shadow-xs"
                    >
                      <span className="font-medium">{prompt}</span>
                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0 ml-3" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl p-4 shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-[#00D09C] text-slate-950 font-medium rounded-br-xs'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                }`}
              >
                {/* Assistant Intent Pill */}
                {msg.sender === 'assistant' && msg.intent && (
                  <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-slate-100 text-[11px]">
                    {msg.intent === 'factual_response' && (
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-md font-semibold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Facts-Only Response
                      </span>
                    )}
                    {msg.intent === 'advisory_refusal' && (
                      <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-md font-semibold flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Advisory Refused
                      </span>
                    )}
                    {msg.intent === 'performance_refusal' && (
                      <span className="bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-0.5 rounded-md font-semibold flex items-center gap-1.5">
                        <ExternalLink className="w-3.5 h-3.5 text-sky-600" /> Factsheet Redirect
                      </span>
                    )}
                    {msg.intent === 'out_of_scope_refusal' && (
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-md font-semibold flex items-center gap-1.5">
                        <Compass className="w-3.5 h-3.5 text-indigo-600" /> Mutual Funds Scope
                      </span>
                    )}
                    {msg.intent === 'pii_violation' && (
                      <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-md font-semibold flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Security Alert (No PII)
                      </span>
                    )}
                  </div>
                )}

                {/* Message Body */}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                {/* Single Citation Pill */}
                {msg.sender === 'assistant' && msg.sourceUrl && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Verified Source:</span>
                    <a
                      href={msg.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:text-emerald-700 hover:underline flex items-center space-x-1 font-mono text-[11px] font-semibold truncate max-w-[280px]"
                    >
                      <span className="truncate">{msg.sourceUrl}</span>
                      <ExternalLink className="w-3 h-3 shrink-0 ml-1" />
                    </a>
                  </div>
                )}

                {/* Timestamp Footer */}
                {msg.sender === 'assistant' && msg.lastUpdated && (
                  <p className="mt-1 text-[11px] text-slate-400 italic">
                    Last updated from sources: {msg.lastUpdated}
                  </p>
                )}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
            </div>
          ))
        )}

        {loading && (
          <div className="flex items-center space-x-2 text-slate-600 text-xs py-2.5 bg-white border border-slate-200 px-4 rounded-xl w-fit shadow-xs">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
            <span>Retrieving verified facts and generating compliant response...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* 3. INPUT BAR */}
      <footer className="bg-white border-t border-slate-200 p-4 shadow-xs">
        <div className="max-w-4xl mx-auto flex flex-col space-y-2">
          {messages.length > 0 && (
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span className="font-medium text-slate-400">Quick Prompts:</span>
              <div className="flex space-x-2">
                {STARTER_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(p)}
                    className="text-slate-600 hover:text-emerald-600 font-medium truncate max-w-[200px] underline"
                  >
                    {p.split('for ')[1] || p}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={input}
              maxLength={1000}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask an objective question (e.g., What is the expense ratio of HDFC Small Cap?)..."
              disabled={loading}
              className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm px-4 py-3 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all disabled:opacity-50"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !input.trim()}
              className="bg-[#00D09C] hover:bg-[#00B88A] disabled:bg-slate-200 disabled:text-slate-400 text-slate-950 px-5 py-3 rounded-xl font-semibold transition flex items-center space-x-2 shrink-0 disabled:cursor-not-allowed shadow-xs"
            >
              <Send className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>Fund Compass does not provide investment advice or fund recommendations.</span>
            <div className="flex items-center space-x-3">
              <span className={input.length > 900 ? 'text-amber-600 font-semibold' : 'text-slate-400'}>
                {input.length}/1000
              </span>
              <span>•</span>
              <button
                onClick={() => setMessages([])}
                className="hover:text-rose-600 text-slate-500 underline transition-colors"
              >
                Clear Conversation
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* 4. SUPPORTED SCHEMES MODAL */}
      {showSchemesModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Supported HDFC Schemes (Seed Corpus)</h3>
              </div>
              <button
                onClick={() => setShowSchemesModal(false)}
                className="text-slate-500 hover:text-slate-800 text-sm px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-medium"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Fund Compass answers factual questions strictly for these 5 Direct Plan Growth schemes using Groww and HDFC factsheet records:
            </p>

            <div className="space-y-3">
              {schemes.map((s) => (
                <div key={s.scheme_id} className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2 hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-slate-900">{s.scheme_name}</h4>
                    <span className="text-[11px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md border border-emerald-200 font-medium">
                      {s.category}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-500 pt-1.5 border-t border-slate-200/70">
                    <div>Expense Ratio: <strong className="text-slate-800">{s.facts.expense_ratio}</strong></div>
                    <div>Min SIP: <strong className="text-slate-800">{s.facts.min_sip_amount}</strong></div>
                    <div>Lock-in: <strong className="text-slate-800">{s.facts.lock_in_period}</strong></div>
                    <div>Risk: <strong className="text-slate-800">{s.facts.riskometer}</strong></div>
                  </div>
                  <div className="pt-1 flex items-center justify-end">
                    <a
                      href={s.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-emerald-600 hover:text-emerald-700 hover:underline flex items-center space-x-1 font-medium"
                    >
                      <span>View on Groww</span>
                      <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
