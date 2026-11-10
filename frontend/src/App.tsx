import React, { useState, useEffect, useRef } from 'react';
import { Send, Compass, ShieldAlert, BookOpen, ExternalLink, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

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
    <div className="flex flex-col h-screen bg-[#0d1117] text-gray-100 font-sans">
      {/* 1. TOP COMPLIANCE HEADER */}
      <header className="bg-[#161b22] border-b border-[#30363d] px-4 py-3 sticky top-0 z-20 shadow-md">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="bg-[#00D09C] p-2 rounded-xl text-black shadow-lg">
              <Compass className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold tracking-tight text-white">Fund Compass</h1>
                <span className="text-xs bg-[#21262d] text-gray-300 px-2 py-0.5 rounded-full border border-gray-700">
                  powered by Groww
                </span>
              </div>
              <p className="text-xs text-gray-400">Facts-Only Mutual Fund Assistant (HDFC Schemes)</p>
            </div>
          </div>

          {/* PERMANENT DISCLAIMER BADGE */}
          <div className="flex items-center space-x-2 bg-[#2d1b14] border border-[#ff7b72]/40 text-[#ff7b72] px-3 py-1.5 rounded-lg text-xs font-semibold shadow-inner">
            <ShieldAlert className="w-4 h-4 shrink-0 text-[#ff7b72]" />
            <span>Facts-only. No investment advice.</span>
          </div>

          {/* Actions & Status */}
          <div className="flex items-center space-x-2 text-xs">
            <button
              onClick={() => setShowSchemesModal(true)}
              className="bg-[#21262d] hover:bg-[#30363d] text-gray-200 px-3 py-1.5 rounded-md border border-[#30363d] flex items-center space-x-1 transition"
            >
              <BookOpen className="w-3.5 h-3.5 text-[#00D09C]" />
              <span>Supported Schemes (5)</span>
            </button>
            <div className="flex items-center space-x-1.5 px-2 py-1 bg-[#21262d] rounded-md border border-[#30363d]">
              <span className={`w-2 h-2 rounded-full ${apiConnected ? 'bg-[#00D09C] animate-pulse' : 'bg-amber-400'}`}></span>
              <span className="text-gray-400 text-[11px]">{apiConnected ? 'API Connected' : 'Checking API...'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* 2. CHAT CONTAINER */}
      <main className="flex-1 overflow-y-auto p-4 max-w-4xl w-full mx-auto space-y-4">
        {messages.length === 0 ? (
          <div className="my-auto py-12 text-center space-y-6">
            <div className="bg-[#161b22] border border-[#30363d] p-8 rounded-2xl max-w-2xl mx-auto shadow-xl">
              <div className="w-12 h-12 bg-[#00D09C]/10 border border-[#00D09C]/30 text-[#00D09C] rounded-2xl mx-auto flex items-center justify-center mb-4">
                <Compass className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Welcome to Fund Compass</h2>
              <p className="text-sm text-gray-300 leading-relaxed max-w-lg mx-auto">
                Ask objective, verifiable questions about the 5 selected <strong className="text-white">HDFC Mutual Fund</strong> schemes.
                Every response is strictly facts-only, verified from official AMC/Groww sources, capped at 3 sentences, and includes the verified source citation.
              </p>

              <div className="mt-6 pt-6 border-t border-[#30363d]">
                <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                  Quick Starter Questions:
                </p>
                <div className="grid gap-2 text-left">
                  {STARTER_PROMPTS.map((prompt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(prompt)}
                      className="bg-[#21262d] hover:bg-[#30363d] text-gray-200 text-sm p-3 rounded-xl border border-[#30363d] hover:border-[#00D09C]/50 transition flex items-center justify-between group"
                    >
                      <span>{prompt}</span>
                      <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-[#00D09C] transition shrink-0 ml-2" />
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
                className={`max-w-[85%] rounded-2xl p-4 shadow-md ${
                  msg.sender === 'user'
                    ? 'bg-[#00D09C] text-black font-medium rounded-br-xs'
                    : 'bg-[#161b22] border border-[#30363d] text-gray-100 rounded-bl-xs'
                }`}
              >
                {/* Assistant Intent Pill */}
                {msg.sender === 'assistant' && msg.intent && (
                  <div className="flex items-center space-x-2 mb-2 pb-2 border-b border-[#30363d]/80 text-[11px]">
                    {msg.intent === 'factual_response' && (
                      <span className="bg-[#00D09C]/10 text-[#00D09C] border border-[#00D09C]/30 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Facts-Only Response
                      </span>
                    )}
                    {msg.intent === 'advisory_refusal' && (
                      <span className="bg-[#ff7b72]/10 text-[#ff7b72] border border-[#ff7b72]/30 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Advisory Refused
                      </span>
                    )}
                    {msg.intent === 'performance_refusal' && (
                      <span className="bg-sky-400/10 text-sky-400 border border-sky-400/30 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" /> Factsheet Redirect
                      </span>
                    )}
                    {msg.intent === 'out_of_scope_refusal' && (
                      <span className="bg-purple-400/10 text-purple-400 border border-purple-400/30 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                        <Compass className="w-3 h-3" /> Mutual Funds Scope
                      </span>
                    )}
                    {msg.intent === 'pii_violation' && (
                      <span className="bg-amber-400/10 text-amber-400 border border-amber-400/30 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" /> Security Alert (No PII)
                      </span>
                    )}
                  </div>
                )}

                {/* Message Body */}
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                {/* Single Citation Pill */}
                {msg.sender === 'assistant' && msg.sourceUrl && (
                  <div className="mt-3 pt-2.5 border-t border-[#30363d] flex items-center justify-between text-xs">
                    <span className="text-gray-400">Verified Source:</span>
                    <a
                      href={msg.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#00D09C] hover:underline flex items-center space-x-1 font-mono text-[11px] truncate max-w-[280px]"
                    >
                      <span className="truncate">{msg.sourceUrl}</span>
                      <ExternalLink className="w-3 h-3 shrink-0 ml-1" />
                    </a>
                  </div>
                )}

                {/* Timestamp Footer */}
                {msg.sender === 'assistant' && msg.lastUpdated && (
                  <p className="mt-1 text-[11px] text-gray-500 italic">
                    Last updated from sources: {msg.lastUpdated}
                  </p>
                )}
              </div>
              <span className="text-[10px] text-gray-500 mt-1 px-1">{msg.timestamp}</span>
            </div>
          ))
        )}

        {loading && (
          <div className="flex items-center space-x-2 text-gray-400 text-xs py-2 bg-[#161b22] border border-[#30363d] px-4 rounded-xl w-fit">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#00D09C]" />
            <span>Retrieving verified facts and generating compliant response...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* 3. INPUT BAR */}
      <footer className="bg-[#161b22] border-t border-[#30363d] p-4">
        <div className="max-w-4xl mx-auto flex flex-col space-y-2">
          {messages.length > 0 && (
            <div className="flex items-center justify-between text-xs text-gray-400 px-1">
              <span>Quick Prompts:</span>
              <div className="flex space-x-2">
                {STARTER_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(p)}
                    className="hover:text-[#00D09C] truncate max-w-[200px] underline"
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
              className="flex-1 bg-[#0d1117] border border-[#30363d] text-gray-100 placeholder-gray-500 text-sm px-4 py-3 rounded-xl focus:outline-none focus:border-[#00D09C] transition disabled:opacity-50"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !input.trim()}
              className="bg-[#00D09C] hover:bg-[#00B88A] disabled:bg-gray-700 text-black px-5 py-3 rounded-xl font-semibold transition flex items-center space-x-2 shrink-0 disabled:cursor-not-allowed shadow-md"
            >
              <Send className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
          <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
            <span>Fund Compass does not provide investment advice or fund recommendations.</span>
            <div className="flex items-center space-x-3">
              <span className={input.length > 900 ? 'text-amber-400 font-semibold' : 'text-gray-500'}>
                {input.length}/1000
              </span>
              <span>•</span>
              <button
                onClick={() => setMessages([])}
                className="hover:text-gray-300 underline"
              >
                Clear Conversation
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* 4. SUPPORTED SCHEMES MODAL */}
      {showSchemesModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-3">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-[#00D09C]" />
                <h3 className="font-bold text-white text-base">Supported HDFC Schemes (Seed Corpus)</h3>
              </div>
              <button
                onClick={() => setShowSchemesModal(false)}
                className="text-gray-400 hover:text-white text-sm px-2 py-1 bg-[#21262d] rounded-md"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-gray-400">
              Fund Compass answers factual questions strictly for these 5 Direct Plan Growth schemes using Groww and HDFC factsheet records:
            </p>

            <div className="space-y-3">
              {schemes.map((s) => (
                <div key={s.scheme_id} className="bg-[#0d1117] border border-[#30363d] p-3 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold text-white">{s.scheme_name}</h4>
                    <span className="text-[11px] bg-[#21262d] text-[#00D09C] px-2 py-0.5 rounded border border-[#00D09C]/30">
                      {s.category}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-gray-400 pt-1 border-t border-[#21262d]">
                    <div>Expense Ratio: <strong className="text-gray-200">{s.facts.expense_ratio}</strong></div>
                    <div>Min SIP: <strong className="text-gray-200">{s.facts.min_sip_amount}</strong></div>
                    <div>Lock-in: <strong className="text-gray-200">{s.facts.lock_in_period}</strong></div>
                    <div>Risk: <strong className="text-gray-200">{s.facts.riskometer}</strong></div>
                  </div>
                  <div className="pt-1 flex items-center justify-end">
                    <a
                      href={s.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[#00D09C] hover:underline flex items-center space-x-1"
                    >
                      <span>View on Groww</span>
                      <ExternalLink className="w-3 h-3" />
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

