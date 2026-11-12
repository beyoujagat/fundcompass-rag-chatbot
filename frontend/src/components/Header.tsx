import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  ShieldAlert,
  Sun,
  Moon,
  Droplet,
  ChevronDown,
  Check,
  BookOpen,
  Calculator,
  HelpCircle,
} from 'lucide-react';
import growwBadge from '../assets/groww-badge.png';

interface HeaderProps {
  theme: 'light' | 'dark' | 'soft-blue';
  setTheme: (theme: 'light' | 'dark' | 'soft-blue') => void;
  apiConnected: boolean | null;
  activeHeaderBtn: 'scheme' | null;
  setActiveHeaderBtn: React.Dispatch<React.SetStateAction<'scheme' | null>>;
  showSchemesModal: boolean;
  setShowSchemesModal: React.Dispatch<React.SetStateAction<boolean>>;
  showSipModal: boolean;
  setShowSipModal: React.Dispatch<React.SetStateAction<boolean>>;
  showHelpModal: boolean;
  setShowHelpModal: React.Dispatch<React.SetStateAction<boolean>>;
  onOpenComplianceModal: () => void;
  onResetConversation: () => void;
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  setTheme,
  apiConnected,
  activeHeaderBtn,
  setActiveHeaderBtn,
  showSchemesModal,
  setShowSchemesModal,
  showSipModal,
  setShowSipModal,
  showHelpModal,
  setShowHelpModal,
  onOpenComplianceModal,
  onResetConversation,
  onOpenMobileMenu,
}) => {
  const [showThemeDropdown, setShowThemeDropdown] = useState(false);
  const themeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(event.target as Node)) {
        setShowThemeDropdown(false);
      }
    }
    if (showThemeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showThemeDropdown]);

  const isSchemeActive = activeHeaderBtn === 'scheme' || showSchemesModal;

  return (
    <header className="h-[84px] px-4 sm:px-6 bg-white/90 backdrop-blur-md border-b border-slate-200/90 flex items-center justify-between gap-3 shrink-0 z-20 relative">
      {/* Left: Branding Badge & Regulatory Compliance Disclaimer */}
      <div className="flex items-center space-x-2.5 sm:space-x-3.5 pl-1 sm:pl-2">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onOpenMobileMenu}
          className="sm:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          title="Open Navigation"
          aria-label="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Horizontal Inspired By Groww Branding Badge */}
        <button
          onClick={onResetConversation}
          className="flex items-center focus:outline-none hover:opacity-90 transition-opacity cursor-pointer"
          title="Fund Compass — Inspired By Groww"
        >
          <img
            src={growwBadge}
            alt="Inspired By Groww"
            className="h-[38px] w-auto object-contain drop-shadow-2xs"
          />
        </button>

        {/* Regulatory Non-Advisory Compliance Disclaimer Badge */}
        <button
          onClick={onOpenComplianceModal}
          className="flex items-center space-x-1.5 bg-rose-50/90 hover:bg-rose-100/80 border border-rose-200 text-rose-700 px-2.5 sm:px-3 py-1.5 h-9 rounded-xl text-xs font-semibold shadow-2xs transition-all duration-200 cursor-pointer"
          title="Click to view regulatory non-advisory compliance rules"
        >
          <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-rose-600" />
          <span className="hidden xl:inline">Facts-only. No investment advice.</span>
          <span className="xl:hidden hidden sm:inline">Facts-only</span>
        </button>
      </div>

      {/* Right: Dedicated Top-Right Action Bar (Theme Switcher + 4 controls) */}
      <div className="flex items-center space-x-2 sm:space-x-2.5">
        {/* Theme Switcher (Positioned immediately before Supported Scheme) */}
        <div className="relative" ref={themeDropdownRef}>
          <button
            type="button"
            onClick={() => setShowThemeDropdown((prev) => !prev)}
            className="h-9 px-2.5 sm:px-3 py-1.5 rounded-xl border border-black bg-white hover:bg-slate-100 hover:border-black text-black shadow-2xs text-xs font-semibold flex items-center space-x-1.5 transition-all duration-200 ease-in-out cursor-pointer theme-btn"
            title={`Theme: ${theme === 'soft-blue' ? 'Soft Blue' : theme === 'dark' ? 'Dark' : 'Light'}. Click to switch theme.`}
            aria-label="Switch Theme"
            aria-expanded={showThemeDropdown}
          >
            {theme === 'dark' ? (
              <Moon className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            ) : theme === 'soft-blue' ? (
              <Droplet className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-black shrink-0" />
            )}
            <span className="hidden xl:inline text-[11px] font-semibold text-black">
              {theme === 'soft-blue' ? 'Soft Blue' : theme === 'dark' ? 'Dark' : 'Light'}
            </span>
            <ChevronDown
              className={`w-3 h-3 ${theme === 'light' ? 'text-black' : 'text-slate-400'} transition-transform duration-200 ${
                showThemeDropdown ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Theme Dropdown Popover */}
          {showThemeDropdown && (
            <div className="absolute right-0 top-full mt-1.5 w-44 rounded-2xl bg-white border border-slate-200/90 shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 theme-dropdown">
              <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Select Theme
              </div>
              <div className="space-y-0.5 mt-0.5">
                {/* Option 1: Light */}
                <button
                  type="button"
                  onClick={() => {
                    setTheme('light');
                    setShowThemeDropdown(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer ${
                    theme === 'light'
                      ? 'bg-slate-100 text-black font-bold'
                      : 'text-slate-700 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Sun className="w-4 h-4 text-black shrink-0" />
                    <span>Light</span>
                  </div>
                  {theme === 'light' && <Check className="w-3.5 h-3.5 text-black shrink-0" />}
                </button>

                {/* Option 2: Dark */}
                <button
                  type="button"
                  onClick={() => {
                    setTheme('dark');
                    setShowThemeDropdown(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-slate-900 text-white font-bold'
                      : 'text-slate-700 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Moon className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Dark</span>
                  </div>
                  {theme === 'dark' && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                </button>

                {/* Option 3: Soft Blue */}
                <button
                  type="button"
                  onClick={() => {
                    setTheme('soft-blue');
                    setShowThemeDropdown(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer ${
                    theme === 'soft-blue'
                      ? 'bg-sky-100 text-sky-900 font-bold'
                      : 'text-slate-700 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Droplet className="w-4 h-4 text-sky-500 shrink-0" />
                    <span>Soft Blue</span>
                  </div>
                  {theme === 'soft-blue' && <Check className="w-3.5 h-3.5 text-sky-700 shrink-0" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 1. Supported Scheme */}
        <button
          id="hdr-scheme-btn"
          type="button"
          onClick={() => {
            setActiveHeaderBtn((prev) => (prev === 'scheme' ? null : 'scheme'));
            setShowSchemesModal((prev) => !prev);
          }}
          className={`h-9 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all duration-200 ease-in-out cursor-pointer ${
            isSchemeActive
              ? 'bg-black border border-black text-white shadow-xs hover:bg-slate-900'
              : 'bg-white border border-black text-black shadow-2xs hover:bg-slate-100 hover:border-black'
          }`}
          title="Supported Scheme"
        >
          <BookOpen
            className={`w-3.5 h-3.5 shrink-0 transition-colors ${
              isSchemeActive ? 'text-white' : 'text-black'
            }`}
          />
          <span className="hidden md:inline">Supported Scheme</span>
          <span className="md:hidden hidden sm:inline">Schemes</span>
        </button>

        {/* 2. SIP Calculator */}
        <button
          id="hdr-sip-btn"
          type="button"
          onClick={() => setShowSipModal((prev) => !prev)}
          className={`h-9 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all duration-200 ease-in-out cursor-pointer ${
            showSipModal
              ? 'bg-black border border-black text-white shadow-xs hover:bg-slate-900'
              : 'bg-white border border-black text-black shadow-2xs hover:bg-slate-100 hover:border-black'
          }`}
          title="SIP Calculator"
        >
          <Calculator
            className={`w-3.5 h-3.5 shrink-0 transition-colors ${
              showSipModal ? 'text-white' : 'text-black'
            }`}
          />
          <span className="hidden md:inline">SIP Calculator</span>
          <span className="md:hidden hidden sm:inline">SIP Calc</span>
        </button>

        {/* 3. Quick Help */}
        <button
          id="hdr-help-btn"
          type="button"
          onClick={() => setShowHelpModal((prev) => !prev)}
          className={`h-9 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all duration-200 ease-in-out cursor-pointer ${
            showHelpModal
              ? 'bg-black border border-black text-white shadow-xs hover:bg-slate-900'
              : 'bg-white border border-black text-black shadow-2xs hover:bg-slate-100 hover:border-black'
          }`}
          title="Quick Help & FAQs"
        >
          <HelpCircle
            className={`w-3.5 h-3.5 shrink-0 transition-colors ${
              showHelpModal ? 'text-white' : 'text-black'
            }`}
          />
          <span className="hidden sm:inline">Quick Help</span>
          <span className="sm:hidden">Help</span>
        </button>

        {/* 4. API Connected */}
        <div
          className="h-9 flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-emerald-200/90 bg-emerald-50/80 text-emerald-700 text-xs font-semibold shadow-2xs transition-all duration-200"
          title={apiConnected ? 'FastAPI Gateway Connected (Port 8000)' : 'API Status: Connected'}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="text-[11px] font-semibold text-emerald-700 hidden lg:inline">
            API Connected
          </span>
          <span className="text-[11px] font-semibold text-emerald-700 lg:hidden hidden sm:inline">
            Connected
          </span>
        </div>
      </div>
    </header>
  );
};

