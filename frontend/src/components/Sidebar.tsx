import React, { useState } from 'react';
import {
  PanelLeftClose,
  PanelLeftOpen,
  MessageSquare,
  BookOpen,
  ShieldCheck,
  Clock,
  ChevronDown,
  Headphones,
  Settings,
  X,
  Calculator,
  SlidersHorizontal,
} from 'lucide-react';
import compassEmblem from '../assets/compass-emblem.png';

interface SidebarProps {
  sidebarExpanded: boolean;
  setSidebarExpanded: (expanded: boolean) => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  onResetConversation: () => void;
  onOpenSchemesModal: () => void;
  onOpenComplianceModal: () => void;
  onOpenSipModal: () => void;
  onOpenEngineModal: () => void;
  onOpenHelpModal: () => void;
  recentQueries: string[];
  onSendMessage: (query: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  sidebarExpanded,
  setSidebarExpanded,
  mobileMenuOpen,
  setMobileMenuOpen,
  onResetConversation,
  onOpenSchemesModal,
  onOpenComplianceModal,
  onOpenSipModal,
  onOpenEngineModal,
  onOpenHelpModal,
  recentQueries,
  onSendMessage,
}) => {
  const [showRecentDropdown, setShowRecentDropdown] = useState(false);

  return (
    <>
      {/* ============================================================== */}
      {/* 1. COLLAPSIBLE / EXPANDABLE DESKTOP NAVIGATION SIDEBAR          */}
      {/* ============================================================== */}
      <aside
        className={`flex-col justify-between bg-white border-r border-slate-200 z-30 shrink-0 hidden sm:flex transition-all duration-300 ease-in-out select-none ${
          sidebarExpanded ? 'w-60' : 'w-[88px]'
        }`}
        aria-label="Sidebar navigation"
        aria-expanded={sidebarExpanded}
      >
        {/* Top Header & Brand / Toggle */}
        <div className="w-full flex flex-col">
          {/* Header Bar matching 84px height */}
          <div
            className={`h-[84px] flex items-center border-b border-slate-100/80 shrink-0 ${
              sidebarExpanded ? 'px-4 justify-between' : 'justify-center relative'
            }`}
          >
            {sidebarExpanded ? (
              <>
                <button
                  onClick={onResetConversation}
                  className="flex items-center space-x-2.5 hover:opacity-90 transition-opacity focus:outline-none min-w-0 cursor-pointer"
                  title="Fund Compass Home / New Thread"
                >
                  <img
                    src={compassEmblem}
                    alt="Fund Compass"
                    className="w-9 h-9 object-contain drop-shadow-xs shrink-0"
                  />
                  <div className="text-left min-w-0">
                    <span className="font-extrabold text-sm text-slate-900 tracking-tight leading-none block truncate">
                      Fund Compass
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold leading-none block mt-1 truncate">
                      Facts-Only MF
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => setSidebarExpanded(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                  title="Collapse sidebar"
                  aria-label="Collapse sidebar"
                >
                  <PanelLeftClose className="w-5 h-5 stroke-[1.75]" />
                </button>
              </>
            ) : (
              <button
                onClick={onResetConversation}
                title="Fund Compass Home / New Thread"
                className="flex items-center justify-center hover:scale-105 transition-transform duration-200 focus:outline-none cursor-pointer"
              >
                <img
                  src={compassEmblem}
                  alt="Fund Compass"
                  className="w-[54px] h-[54px] object-contain drop-shadow-xs"
                />
                <span className="sr-only">Fund Compass Home</span>
              </button>
            )}
          </div>

          {/* Toggle Button in Collapsed Mode (near top of sidebar) */}
          {!sidebarExpanded && (
            <div className="flex justify-center pt-3 pb-1">
              <button
                onClick={() => setSidebarExpanded(true)}
                title="Expand sidebar"
                aria-label="Expand sidebar"
                className="w-10 h-10 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-colors group relative cursor-pointer"
              >
                <PanelLeftOpen className="w-5 h-5 stroke-[1.75]" />
                <span className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-lg pointer-events-none z-50">
                  Expand sidebar
                </span>
              </button>
            </div>
          )}

          {/* Primary Navigation Actions */}
          <nav
            className={`w-full flex flex-col ${
              sidebarExpanded ? 'px-3 pt-3 space-y-1' : 'items-center pt-2 space-y-5 px-2'
            }`}
          >
            {/* New Chat */}
            <button
              onClick={onResetConversation}
              className={`${
                sidebarExpanded
                  ? 'w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors font-medium text-sm text-left group cursor-pointer'
                  : 'w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors group relative cursor-pointer'
              }`}
              title={sidebarExpanded ? undefined : 'Start New Thread'}
            >
              <MessageSquare
                className={`${
                  sidebarExpanded
                    ? 'w-5 h-5 text-slate-500 group-hover:text-emerald-600'
                    : 'w-6 h-6'
                } shrink-0 stroke-[1.75]`}
              />
              {sidebarExpanded ? (
                <span className="truncate">New Chat</span>
              ) : (
                <span className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-lg pointer-events-none z-50">
                  New Chat
                </span>
              )}
            </button>

            {/* Supported Schemes */}
            <button
              onClick={onOpenSchemesModal}
              className={`${
                sidebarExpanded
                  ? 'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors font-medium text-sm text-left group cursor-pointer'
                  : 'w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors group relative cursor-pointer'
              }`}
              title={sidebarExpanded ? undefined : 'Supported Schemes Catalog (5)'}
            >
              <div
                className={
                  sidebarExpanded
                    ? 'flex items-center space-x-3 min-w-0'
                    : 'relative flex items-center justify-center'
                }
              >
                <BookOpen
                  className={`${
                    sidebarExpanded
                      ? 'w-5 h-5 text-slate-500 group-hover:text-emerald-600'
                      : 'w-6 h-6'
                  } shrink-0 stroke-[1.75]`}
                />
                {!sidebarExpanded && (
                  <span className="absolute -top-1 -right-1 w-[18px] h-[18px] rounded-full bg-[#00D09C] text-slate-950 text-[10px] font-bold flex items-center justify-center shadow-xs">
                    5
                  </span>
                )}
                {sidebarExpanded && <span className="truncate">Supported Schemes</span>}
              </div>
              {sidebarExpanded ? (
                <span className="px-2 py-0.5 rounded-full bg-[#00D09C] text-slate-950 text-[10px] font-bold shadow-2xs shrink-0">
                  5
                </span>
              ) : (
                <span className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-lg pointer-events-none z-50">
                  Supported Schemes (5)
                </span>
              )}
            </button>

            {/* Compliance */}
            <button
              onClick={onOpenComplianceModal}
              className={`${
                sidebarExpanded
                  ? 'w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors font-medium text-sm text-left group cursor-pointer'
                  : 'w-10 h-10 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors group relative cursor-pointer'
              }`}
              title={sidebarExpanded ? undefined : 'Compliance & SEBI Disclaimers'}
            >
              <ShieldCheck
                className={`${
                  sidebarExpanded
                    ? 'w-5 h-5 text-slate-500 group-hover:text-emerald-600'
                    : 'w-6 h-6'
                } shrink-0 stroke-[1.75]`}
              />
              {sidebarExpanded ? (
                <span className="truncate">Compliance Rules</span>
              ) : (
                <span className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-lg pointer-events-none z-50">
                  Compliance & Rules
                </span>
              )}
            </button>

            {/* Recent Prompts */}
            <div className={`relative ${sidebarExpanded ? 'w-full' : ''}`}>
              <button
                onClick={() => setShowRecentDropdown(!showRecentDropdown)}
                className={`${
                  sidebarExpanded
                    ? `w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors font-medium text-sm text-left group cursor-pointer ${
                        showRecentDropdown
                          ? 'bg-slate-100 text-slate-900'
                          : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100'
                      }`
                    : `w-10 h-10 rounded-xl flex items-center justify-center transition-colors group relative cursor-pointer ${
                        showRecentDropdown
                          ? 'bg-slate-100 text-slate-900'
                          : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                      }`
                }`}
                title={sidebarExpanded ? undefined : 'Recent Prompts'}
              >
                <div
                  className={
                    sidebarExpanded
                      ? 'flex items-center space-x-3 min-w-0'
                      : 'flex items-center justify-center'
                  }
                >
                  <Clock
                    className={`${
                      sidebarExpanded
                        ? 'w-5 h-5 text-slate-500 group-hover:text-emerald-600'
                        : 'w-6 h-6'
                    } shrink-0 stroke-[1.75]`}
                  />
                  {sidebarExpanded && <span className="truncate">Recent Prompts</span>}
                </div>
                {sidebarExpanded ? (
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                      showRecentDropdown ? 'rotate-180' : ''
                    }`}
                  />
                ) : (
                  <span className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-lg pointer-events-none z-50">
                    Recent Prompts
                  </span>
                )}
              </button>

              {/* Recent Prompts Dropdown / Popout */}
              {showRecentDropdown && (
                <div
                  className={`${
                    sidebarExpanded
                      ? 'mt-1 w-full bg-slate-50 border border-slate-200/90 rounded-xl p-2 text-left space-y-1'
                      : 'absolute left-14 top-0 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 z-50 text-left'
                  }`}
                >
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/70">
                    <span className="text-xs font-bold text-slate-800">Recent Prompts</span>
                    <button
                      onClick={() => setShowRecentDropdown(false)}
                      className="text-slate-400 hover:text-slate-600 text-xs px-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  {recentQueries.length === 0 ? (
                    <p className="text-[11px] text-slate-400 py-2.5 text-center">
                      No recent prompts yet
                    </p>
                  ) : (
                    <div className="space-y-1 mt-1.5 max-h-48 overflow-y-auto">
                      {recentQueries.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setShowRecentDropdown(false);
                            onSendMessage(q);
                          }}
                          className="w-full text-left text-xs text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 p-1.5 rounded-lg truncate transition-colors block cursor-pointer"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Bottom Utility & Profile Section */}
        <div
          className={`w-full ${
            sidebarExpanded
              ? 'pb-5 px-3 border-t border-slate-100/80 pt-3 space-y-1'
              : 'flex flex-col items-center space-y-4 pb-6 px-2'
          }`}
        >
          {/* Help & FAQs */}
          <button
            onClick={onOpenHelpModal}
            className={`${
              sidebarExpanded
                ? 'w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition-colors font-medium text-xs text-left group cursor-pointer'
                : 'w-10 h-10 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors group relative cursor-pointer'
            }`}
            title={sidebarExpanded ? undefined : 'Help & FAQs'}
          >
            <Headphones className={`${sidebarExpanded ? 'w-4 h-4' : 'w-5 h-5'} stroke-[1.75]`} />
            {sidebarExpanded ? (
              <span className="truncate">Help & FAQs</span>
            ) : (
              <span className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-lg pointer-events-none z-50">
                Help & FAQs
              </span>
            )}
          </button>

          {/* Engine Status */}
          <button
            onClick={onOpenEngineModal}
            className={`${
              sidebarExpanded
                ? 'w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-slate-600 hover:text-slate-950 hover:bg-slate-100 transition-colors font-medium text-xs text-left group cursor-pointer'
                : 'w-10 h-10 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors group relative cursor-pointer'
            }`}
            title={sidebarExpanded ? undefined : 'Settings & System Status'}
          >
            <Settings className={`${sidebarExpanded ? 'w-4 h-4' : 'w-5 h-5'} stroke-[1.75]`} />
            {sidebarExpanded ? (
              <span className="truncate">Engine Status</span>
            ) : (
              <span className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-lg pointer-events-none z-50">
                Engine Status
              </span>
            )}
          </button>

          {/* User / Investor Profile Avatar */}
          {sidebarExpanded ? (
            <div className="flex items-center space-x-3 px-3 py-2 pt-2 border-t border-slate-100 mt-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00D09C] to-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center shadow-xs ring-2 ring-emerald-500/20 relative shrink-0">
                <span>FC</span>
                <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border-2 border-white rounded-full"></span>
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-xs font-semibold text-slate-800 truncate leading-tight">
                  Investor Session
                </p>
                <p className="text-[10px] text-emerald-600 font-medium truncate leading-tight mt-0.5">
                  Verified • Groww MF
                </p>
              </div>
            </div>
          ) : (
            <div className="pt-1">
              <div
                title="Verified Investor Session"
                className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#00D09C] to-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center shadow-xs ring-2 ring-emerald-500/20 relative cursor-pointer group"
              >
                <span>FC</span>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                <span className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-xs font-medium rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap shadow-lg pointer-events-none z-50">
                  Verified Investor
                </span>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ============================================================== */}
      {/* 2. MOBILE NAVIGATION DRAWER (Slide-in with dark backdrop)       */}
      {/* ============================================================== */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 sm:hidden flex transition-opacity duration-300"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-72 bg-white h-full p-5 shadow-2xl flex flex-col justify-between transform transition-transform duration-300 ease-out animate-in slide-in-from-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2.5">
                  <img src={compassEmblem} alt="Fund Compass" className="w-8 h-8 object-contain" />
                  <div>
                    <span className="font-extrabold text-slate-900 text-sm block leading-none">
                      Fund Compass
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold block leading-none mt-1">
                      Facts-Only MF
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Close navigation"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1.5 text-sm font-medium">
                <button
                  onClick={() => {
                    onResetConversation();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 p-2.5 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                  <span>New Conversation</span>
                </button>

                <button
                  onClick={() => {
                    onOpenSchemesModal();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-emerald-600 transition cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <BookOpen className="w-4 h-4 text-slate-400" />
                    <span>Supported Schemes</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-[#00D09C] text-slate-950 text-[10px] font-bold">
                    5
                  </span>
                </button>

                <button
                  onClick={() => {
                    onOpenSipModal();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 p-2.5 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition cursor-pointer"
                >
                  <Calculator className="w-4 h-4 text-slate-400" />
                  <span>SIP Calculator</span>
                </button>

                <button
                  onClick={() => {
                    onOpenComplianceModal();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 p-2.5 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-rose-600 transition cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  <span>Compliance Disclaimers</span>
                </button>

                <button
                  onClick={() => {
                    onOpenEngineModal();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 p-2.5 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-teal-600 transition cursor-pointer"
                >
                  <SlidersHorizontal className="w-4 h-4 text-slate-400" />
                  <span>Engine Architecture</span>
                </button>

                <button
                  onClick={() => {
                    onOpenHelpModal();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 p-2.5 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition cursor-pointer"
                >
                  <Headphones className="w-4 h-4 text-slate-400" />
                  <span>Help & FAQs</span>
                </button>
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00D09C] to-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center shadow-xs ring-2 ring-emerald-500/20 relative shrink-0">
                  <span>FC</span>
                  <span className="absolute bottom-0 right-0 w-2 h-2 bg-emerald-500 border-2 border-white rounded-full"></span>
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-xs font-semibold text-slate-800 truncate leading-tight">
                    Investor Session
                  </p>
                  <p className="text-[10px] text-emerald-600 font-medium truncate leading-tight mt-0.5">
                    Verified • Groww MF
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">Fund Compass v2.0 • Facts-Only</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

