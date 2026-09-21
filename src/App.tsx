import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LandingPage } from './components/LandingPage';
import { WizardContainer } from './components/Wizard/WizardContainer';
import { Dashboard } from './components/Dashboard';
import { AdminPanel } from './components/AdminPanel';
import { AboutDeveloper } from './components/AboutDeveloper';
import type { Project } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'wizard' | 'dashboard' | 'admin' | 'developer'>('landing');
  const [initialUrl, setInitialUrl] = useState<string>('');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('bapp-theme') === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('bapp-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('bapp-theme', 'light');
    }
  }, [darkMode]);

  const handleStartCreate = (url: string) => {
    setInitialUrl(url);
    setCurrentView('wizard');
  };

  const handleOpenProject = (project: Project) => {
    setInitialUrl(project.websiteUrl);
    setCurrentView('wizard');
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5] dark:bg-[#0A0A0A] text-neutral-900 dark:text-neutral-100 flex flex-col font-sans selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-900">
      <Header
        currentView={currentView}
        setCurrentView={setCurrentView}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onNewApp={() => {
          setInitialUrl('');
          setCurrentView('wizard');
        }}
      />

      <main className="flex-1 flex flex-col">
        {currentView === 'landing' && (
          <LandingPage
            onStartCreate={handleStartCreate}
            onOpenDeveloper={() => setCurrentView('developer')}
          />
        )}

        {currentView === 'wizard' && (
          <WizardContainer
            initialUrl={initialUrl}
            onFinish={() => setCurrentView('dashboard')}
            onCancel={() => setCurrentView('landing')}
          />
        )}

        {currentView === 'dashboard' && (
          <Dashboard
            onCreateNew={() => {
              setInitialUrl('');
              setCurrentView('wizard');
            }}
            onOpenProject={handleOpenProject}
          />
        )}

        {currentView === 'developer' && <AboutDeveloper />}

        {currentView === 'admin' && <AdminPanel />}
      </main>
    </div>
  );
}
