'use client';

import { useEffect } from 'react';
import { useTradingStore } from '@/store';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Sidebar } from '@/components/Sidebar';
import { Onboarding } from '@/components/Onboarding';
import { Dashboard } from '@/components/Dashboard';
import { TradeEntry } from '@/components/TradeEntry';
import { TradeLog } from '@/components/TradeLog';
import { DailyJournal } from '@/components/DailyJournal';
import { CalendarView } from '@/components/CalendarView';
import { ChecklistManager } from '@/components/ChecklistManager';
import { StrategyManager } from '@/components/StrategyManager';
import { Analytics } from '@/components/Analytics';
import { Settings } from '@/components/Settings';

export default function Home() {
  const { preferences, activeNav, isInitialized, initStore } = useTradingStore();

  useEffect(() => {
    initStore();
  }, [initStore]);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-400 font-medium animate-pulse">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!preferences.onboardingComplete) {
    return <Onboarding />;
  }

  return (
    <div className="main-layout">
      <Sidebar />
      <main className="main-content">
        {activeNav === 'dashboard' && <Dashboard />}
        {activeNav === 'new-trade' && <TradeEntry />}
        {activeNav === 'trade-log' && <TradeLog />}
        {activeNav === 'checklist' && <ChecklistManager />}
        {activeNav === 'journal' && <DailyJournal />}
        {activeNav === 'calendar' && <CalendarView />}
        {activeNav === 'strategies' && <StrategyManager />}
        {activeNav === 'analytics' && <Analytics />}
        {activeNav === 'settings' && <Settings />}
      </main>
    </div>
  );
}
