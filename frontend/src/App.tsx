import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Message, SchemeItem } from './types';
import { CANONICAL_SCHEMES } from './data/canonicalSchemes';
import { computeSipOrLumpsum } from './utils/calculator';
import { getQuestionSuggestions, QuestionSuggestion } from './data/questionSuggestions';

// Modals
import { SupportedSchemesModal } from './components/modals/SupportedSchemesModal';
import { ComplianceModal } from './components/modals/ComplianceModal';
import { EngineModal } from './components/modals/EngineModal';
import { SipCalculatorModal } from './components/modals/SipCalculatorModal';
import { QuickHelpModal } from './components/modals/QuickHelpModal';

// Layout & View Components
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { WelcomeHero } from './components/WelcomeHero';
import { ChatMessages } from './components/ChatMessages';
import { ChatDock } from './components/ChatDock';

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [schemes, setSchemes] = useState<SchemeItem[]>([]);
  const [showSchemesModal, setShowSchemesModal] = useState(false);
  const [showComplianceModal, setShowComplianceModal] = useState(false);
  const [showEngineModal, setShowEngineModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showSipModal, setShowSipModal] = useState(false);
  const [sipMode, setSipMode] = useState<'sip' | 'lumpsum'>('sip');
  const [sipSchemeId, setSipSchemeId] = useState<string>('');
  const [sipAmount, setSipAmount] = useState<number>(25000);
  const [sipDuration, setSipDuration] = useState<number>(8);
  const [sipRate, setSipRate] = useState<number>(12);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [activeHeaderBtn, setActiveHeaderBtn] = useState<'scheme' | null>(null);

  const activeSipScheme = useMemo(() => {
    return CANONICAL_SCHEMES.find((s) => s.id === sipSchemeId) || null;
  }, [sipSchemeId]);

  const sipCalcResult = useMemo(() => {
    return computeSipOrLumpsum(sipAmount, sipDuration, sipRate, sipMode);
  }, [sipAmount, sipDuration, sipRate, sipMode]);

  const handleSipSchemeSelect = (schemeId: string) => {
    setSipSchemeId(schemeId);
    const found = CANONICAL_SCHEMES.find((s) => s.id === schemeId);
    if (found && sipAmount < found.minSip) {
      setSipAmount(found.minSip);
    }
  };

  const [theme, setTheme] = useState<'light' | 'dark' | 'soft-blue'>(() => {
    try {
      const saved = localStorage.getItem('fc_theme');
      if (saved === 'dark' || saved === 'soft-blue') return saved;
    } catch {
      // ignore
    }
    return 'light';
  });

  const [apiConnected, setApiConnected] = useState<boolean | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [recentQueries, setRecentQueries] = useState<string[]>([]);
  const [activeCardIdx, setActiveCardIdx] = useState<number | null>(null);
  const [faqSchemeFilter, setFaqSchemeFilter] = useState<string>('all');
  const [expandedFaqIds, setExpandedFaqIds] = useState<string[]>(['midcap-exit']);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dockInputRef = useRef<HTMLInputElement>(null);
  const suggestionDropdownRef = useRef<HTMLDivElement>(null);

  // Google-Style Autocomplete Question Suggestions State
  const [suggestions, setSuggestions] = useState<QuestionSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  // Dismiss autocomplete suggestion dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const clickedInsideDropdown = suggestionDropdownRef.current?.contains(target);
      const clickedInsideWelcomeInput = inputRef.current?.contains(target);
      const clickedInsideDockInput = dockInputRef.current?.contains(target);

      if (!clickedInsideDropdown && !clickedInsideWelcomeInput && !clickedInsideDockInput) {
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    }
    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSuggestions]);

  const handleInputChange = (val: string) => {
    setInput(val);
    const trimmed = val.trim();
    if (trimmed.length > 0) {
      const matches = getQuestionSuggestions(val, 5);
      setSuggestions(matches);
      setShowSuggestions(matches.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
    setHighlightedIndex(-1);
  };

  const handleSelectSuggestion = (suggestionText: string) => {
    setInput(suggestionText);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    setTimeout(() => {
      if (messages.length > 0 && dockInputRef.current) {
        dockInputRef.current.focus();
      } else if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 10);
  };

  // Lock body scroll when any modal is open
  useEffect(() => {
    if (showHelpModal || showSipModal || showSchemesModal || showComplianceModal || showEngineModal) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [showHelpModal, showSipModal, showSchemesModal, showComplianceModal, showEngineModal]);

  // Close modals on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (showHelpModal) setShowHelpModal(false);
        if (showSipModal) setShowSipModal(false);
        if (showSchemesModal) {
          setShowSchemesModal(false);
          setActiveHeaderBtn(null);
        }
        if (showComplianceModal) setShowComplianceModal(false);
        if (showEngineModal) setShowEngineModal(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showHelpModal, showSipModal, showSchemesModal, showComplianceModal, showEngineModal]);

  const toggleFaq = (id: string) => {
    setExpandedFaqIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAskFaq = (questionText: string) => {
    setShowHelpModal(false);
    setInput(questionText);
    setTimeout(() => {
      if (messages.length > 0 && dockInputRef.current) {
        dockInputRef.current.focus();
      } else if (inputRef.current) {
        inputRef.current?.focus();
      }
    }, 100);
  };

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Sync theme attribute with document & persist in localStorage
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('fc_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

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
      } catch {
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
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    // Track in recent queries
    setRecentQueries((prev) => {
      const filtered = prev.filter((q) => q !== query);
      return [query, ...filtered].slice(0, 5);
    });

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: query }),
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
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text:
          'Fund Compass is currently unable to reach the API server. Please ensure the backend is running at ' +
          (API_BASE_URL || 'http://localhost:8000') +
          '.',
        intent: 'error',
        lastUpdated: '2026-11-10',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
        return;
      }
      if (e.key === 'Enter') {
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          e.preventDefault();
          handleSelectSuggestion(suggestions[highlightedIndex].question);
          return;
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        return;
      }
    }

    if (e.key === 'Enter') {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
      handleSendMessage();
    }
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetConversation = () => {
    setMessages([]);
    setInput('');
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-800 antialiased overflow-hidden font-sans">
      {/* 1. Collapsible Sidebar & Mobile Drawer */}
      <Sidebar
        sidebarExpanded={sidebarExpanded}
        setSidebarExpanded={setSidebarExpanded}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onResetConversation={handleResetConversation}
        onOpenSchemesModal={() => setShowSchemesModal(true)}
        onOpenComplianceModal={() => setShowComplianceModal(true)}
        onOpenSipModal={() => setShowSipModal(true)}
        onOpenEngineModal={() => setShowEngineModal(true)}
        onOpenHelpModal={() => setShowHelpModal(true)}
        recentQueries={recentQueries}
        onSendMessage={handleSendMessage}
      />

      {/* 2. Main Viewport */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-gradient-to-b from-[#fbfcfd] to-[#f4f7fa] relative">
        {/* Low-Contrast Dot Matrix Background Pattern */}
        <div className="pointer-events-none absolute inset-0 bg-dot-matrix opacity-65 z-0" />

        {/* Ambient Gradient Pools */}
        <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[720px] h-[450px] rounded-full bg-gradient-to-tr from-emerald-100/25 via-sky-100/30 to-purple-100/25 blur-3xl opacity-70 z-0 animate-ambient-pulse" />
        <div className="pointer-events-none absolute top-10 left-8 w-72 h-72 rounded-full bg-emerald-100/20 blur-3xl opacity-60 z-0" />
        <div className="pointer-events-none absolute top-10 right-8 w-72 h-72 rounded-full bg-sky-100/25 blur-3xl opacity-60 z-0" />

        {/* Header */}
        <Header
          theme={theme}
          setTheme={setTheme}
          apiConnected={apiConnected}
          activeHeaderBtn={activeHeaderBtn}
          setActiveHeaderBtn={setActiveHeaderBtn}
          showSchemesModal={showSchemesModal}
          setShowSchemesModal={setShowSchemesModal}
          showSipModal={showSipModal}
          setShowSipModal={setShowSipModal}
          showHelpModal={showHelpModal}
          setShowHelpModal={setShowHelpModal}
          onOpenComplianceModal={() => setShowComplianceModal(true)}
          onResetConversation={handleResetConversation}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        {/* Central Content Area */}
        <main className="flex-1 overflow-y-auto relative flex flex-col justify-between z-10">
          {messages.length === 0 ? (
            <WelcomeHero
              input={input}
              loading={loading}
              inputRef={inputRef}
              handleInputChange={handleInputChange}
              handleKeyDown={handleKeyDown}
              handleSendMessage={handleSendMessage}
              suggestions={suggestions}
              setSuggestions={setSuggestions}
              showSuggestions={showSuggestions}
              setShowSuggestions={setShowSuggestions}
              highlightedIndex={highlightedIndex}
              setHighlightedIndex={setHighlightedIndex}
              suggestionDropdownRef={suggestionDropdownRef}
              handleSelectSuggestion={handleSelectSuggestion}
              activeCardIdx={activeCardIdx}
              setActiveCardIdx={setActiveCardIdx}
              onOpenSchemesModal={() => setShowSchemesModal(true)}
              onOpenComplianceModal={() => setShowComplianceModal(true)}
            />
          ) : (
            <ChatMessages
              messages={messages}
              loading={loading}
              copiedId={copiedId}
              onCopy={copyToClipboard}
              messagesEndRef={messagesEndRef}
            />
          )}

          {/* Chat Dock */}
          {messages.length > 0 && (
            <ChatDock
              input={input}
              loading={loading}
              dockInputRef={dockInputRef}
              handleInputChange={handleInputChange}
              handleKeyDown={handleKeyDown}
              handleSendMessage={handleSendMessage}
              suggestions={suggestions}
              setSuggestions={setSuggestions}
              showSuggestions={showSuggestions}
              setShowSuggestions={setShowSuggestions}
              highlightedIndex={highlightedIndex}
              setHighlightedIndex={setHighlightedIndex}
              suggestionDropdownRef={suggestionDropdownRef}
              handleSelectSuggestion={handleSelectSuggestion}
              onResetConversation={handleResetConversation}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <SupportedSchemesModal
        isOpen={showSchemesModal}
        onClose={() => {
          setShowSchemesModal(false);
          setActiveHeaderBtn(null);
        }}
        schemes={schemes}
        onAskQuestion={(query: string) => {
          setShowSchemesModal(false);
          setActiveHeaderBtn(null);
          handleSendMessage(query);
        }}
      />

      <ComplianceModal
        isOpen={showComplianceModal}
        onClose={() => setShowComplianceModal(false)}
      />

      <EngineModal
        isOpen={showEngineModal}
        onClose={() => setShowEngineModal(false)}
      />

      <SipCalculatorModal
        isOpen={showSipModal}
        onClose={() => setShowSipModal(false)}
        sipMode={sipMode}
        setSipMode={setSipMode}
        sipSchemeId={sipSchemeId}
        onSchemeSelect={handleSipSchemeSelect}
        sipAmount={sipAmount}
        setSipAmount={setSipAmount}
        sipDuration={sipDuration}
        setSipDuration={setSipDuration}
        sipRate={sipRate}
        setSipRate={setSipRate}
        activeSipScheme={activeSipScheme}
        sipCalcResult={sipCalcResult}
        onAskQuestion={handleSendMessage}
      />

      <QuickHelpModal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        faqSchemeFilter={faqSchemeFilter}
        setFaqSchemeFilter={setFaqSchemeFilter}
        expandedFaqIds={expandedFaqIds}
        toggleFaq={toggleFaq}
        onAskFaq={handleAskFaq}
        onFocusInput={() => {
          setShowHelpModal(false);
          setTimeout(() => {
            if (messages.length > 0 && dockInputRef.current) {
              dockInputRef.current.focus();
            } else if (inputRef.current) {
              inputRef.current.focus();
            }
          }, 100);
        }}
      />
    </div>
  );
}
