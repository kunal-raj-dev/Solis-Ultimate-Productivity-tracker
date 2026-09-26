import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { dataService } from '../services/dataService';
import { DailySummary } from '../types/analytics';
import { useAuth } from './AuthContext';

interface DataContextValue {
  summary: DailySummary | null;
  refreshCount: number;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [refreshCount, setRefreshCount] = useState<number>(0);

  const fetchSummary = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setSummary(null);
      return;
    }

    try {
      const sum = await dataService.analytics.getDailySummary();
      setSummary(sum);
    } catch {
      setSummary(null);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setSummary(null);
      return;
    }

    fetchSummary();

    // Plan §6.1 scoped entity pub/sub: this provider aggregates every entity
    // (getDailySummary derives from tasks/study/focus/habits, and refreshCount
    // consumers such as useGuideCompletion also track notes, goals, and
    // flashcards), so it subscribes to all six canonical channels. Domains
    // outside the enum broadcast on 'all' and still reach it.
    const unsubscribe = dataService.subscribe(() => {
      setRefreshCount((prev) => prev + 1);
      fetchSummary();
    }, ['tasks', 'habits', 'notes', 'study', 'focus', 'goals']);

    return () => {
      unsubscribe();
    };
  }, [fetchSummary, isAuthenticated, user]);

  const contextValue = React.useMemo(
    () => ({
      summary,
      refreshCount,
      refreshData: fetchSummary
    }),
    [summary, refreshCount, fetchSummary]
  );

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

export function useData(): DataContextValue {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
