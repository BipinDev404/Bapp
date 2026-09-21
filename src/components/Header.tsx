import React from 'react';
import { Plus, Sun, Moon, Layers, ShieldCheck, Activity, User } from 'lucide-react';

interface HeaderProps {
  currentView: 'landing' | 'wizard' | 'dashboard' | 'admin' | 'developer';
  setCurrentView: (view: 'landing' | 'wizard' | 'dashboard' | 'admin' | 'developer') => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onNewApp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  setCurrentView,
  darkMode,
  setDarkMode,
  onNewApp,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#F7F7F5]/80 dark:bg-[#0A0A0A]/80 border-b border-neutral-200/80 dark:border-neutral-800/80">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <button
          onClick={() => setCurrentView('landing')}
          className="flex items-center gap-2.5 cursor-pointer text-left focus:outline-none"
        >
          {/* Custom Bapp Minimal Mark: Two rounded app window frames forming a "b" */}
          <div className="w-8 h-8 rounded-xl bg-neutral-900 dark:bg-white flex items-center justify-center text-white dark:text-neutral-900 shadow-sm">
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 fill-none stroke-current stroke-2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="18" rx="2" />
              <rect x="10" y="10" width="11" height="11" rx="2" />
            </svg>
          </div>
          <span className="font-bold text-lg tracking-tight text-neutral-900 dark:text-white">
            bapp
          </span>
        </button>

        {/* Center Navigation */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-neutral-600 dark:text-neutral-400">
          <button
            onClick={() => setCurrentView('landing')}
            className={`transition hover:text-neutral-900 dark:hover:text-white cursor-pointer ${
              currentView === 'landing' ? 'text-neutral-900 dark:text-white font-semibold' : ''
            }`}
          >
            Product
          </button>
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`transition hover:text-neutral-900 dark:hover:text-white cursor-pointer ${
              currentView === 'dashboard' ? 'text-neutral-900 dark:text-white font-semibold' : ''
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setCurrentView('developer')}
            className={`transition hover:text-neutral-900 dark:hover:text-white cursor-pointer flex items-center gap-1.5 ${
              currentView === 'developer' ? 'text-neutral-900 dark:text-white font-semibold' : ''
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>About Developer</span>
          </button>
          <button
            onClick={() => setCurrentView('admin')}
            className={`transition hover:text-neutral-900 dark:hover:text-white cursor-pointer flex items-center gap-1 ${
              currentView === 'admin' ? 'text-neutral-900 dark:text-white font-semibold' : ''
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            <span>Build Workers</span>
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {/* Dark mode toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 sm:px-3 sm:py-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-white/80 dark:bg-neutral-800/80 hover:bg-neutral-100 dark:hover:bg-neutral-700/80 border border-neutral-200/80 dark:border-neutral-700/80 shadow-xs transition-all duration-200 cursor-pointer flex items-center gap-1.5 active:scale-95"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {darkMode ? (
              <>
                <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 rotate-0 hover:rotate-45" />
                <span className="hidden sm:inline text-xs font-medium text-neutral-200">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-neutral-700 transition-transform duration-300 hover:-rotate-12" />
                <span className="hidden sm:inline text-xs font-medium text-neutral-700">Dark</span>
              </>
            )}
          </button>

          {currentView !== 'wizard' && (
            <button
              onClick={onNewApp}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create App</span>
            </button>
          )}

          {currentView === 'wizard' && (
            <button
              onClick={() => setCurrentView('dashboard')}
              className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-medium transition cursor-pointer"
            >
              Dashboard
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
