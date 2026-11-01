/**
 * Dashboard verileri için custom hook
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import type { DashboardSummary, CategorySpending, MonthlyData, Transaction, Budget, SavingsGoal, AIRecommendation } from '../lib/api';

export function useDashboard(period: string = 'month') {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [budgetStatus, setBudgetStatus] = useState<Budget[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [summaryData, spendingData, monthlyDataRes, transactionsData, budgetData, goalsData, recommendationsData] = await Promise.all([
        api.getDashboardSummary(period),
        api.getCategorySpending(period),
        api.getMonthlyData(6),
        api.getRecentTransactions(5),
        api.getBudgetStatus(),
        api.getGoals(),
        api.getAIRecommendations(),
      ]);

      setSummary(summaryData);
      setError(null);
      setCategorySpending(spendingData);
      setMonthlyData(monthlyDataRes);
      setRecentTransactions(transactionsData);
      setBudgetStatus(budgetData);
      setSavingsGoals(goalsData);
      setRecommendations(recommendationsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Veriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [period]);

  const refetchDashboardData = useCallback(() => {
    setLoading(true);
    setError(null);
    void fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    void fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    summary,
    categorySpending,
    monthlyData,
    recentTransactions,
    budgetStatus,
    savingsGoals,
    recommendations,
    loading,
    error,
    refetch: refetchDashboardData,
  };
}
