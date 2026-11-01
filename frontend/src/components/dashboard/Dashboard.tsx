import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronDown, RefreshCw } from 'lucide-react';
import type { TimePeriod } from '../../types';
import { useDashboard } from '../../hooks/useDashboard';
import BalanceCard from './BalanceCard';
import StatCard from './StatCard';
import IncomeExpenseChart from './IncomeExpenseChart';
import ExpensePieChart from './ExpensePieChart';
import AIRecommendationCard from './AIRecommendationCard';
import TransactionList from './TransactionList';
import SavingsGoals from './SavingsGoals';
import { TrendingUp, TrendingDown, PiggyBank, Target, Plus } from 'lucide-react';

interface DashboardProps {
  onNavigate: (menu: string) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const {
    summary,
    categorySpending,
    monthlyData,
    recentTransactions,
    budgetStatus,
    savingsGoals,
    recommendations,
    loading,
    error,
    refetch
  } = useDashboard(timePeriod);

  const timePeriods: { value: TimePeriod; label: string }[] = [
    { value: 'month', label: 'Bu ay' },
    { value: 'quarter', label: 'Bu çeyrek' },
    { value: 'year', label: 'Bu yıl' },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const stats = summary ? [
    {
      title: 'Toplam Gelir',
      value: formatCurrency(summary.total_income),
      change: 0,
      changeType: 'increase' as const,
      icon: <TrendingUp size={24} />,
      color: 'text-green-600',
    },
    {
      title: 'Toplam Gider',
      value: formatCurrency(summary.total_expense),
      change: 0,
      changeType: 'decrease' as const,
      icon: <TrendingDown size={24} />,
      color: 'text-red-600',
    },
    {
      title: 'Tasarruf Oranı',
      value: `%${summary.savings_rate.toFixed(1)}`,
      change: 0,
      changeType: 'increase' as const,
      icon: <PiggyBank size={24} />,
      color: 'text-purple-600',
    },
    {
      title: 'Net Bakiye',
      value: formatCurrency(summary.net_balance),
      change: 0,
      changeType: 'increase' as const,
      icon: <Target size={24} />,
      color: 'text-indigo-600',
    },
  ] : [];

  const chartData = monthlyData.map((data) => ({
    ay: data.month,
    gelir: data.income,
    gider: data.expense,
  }));

  const pieData = categorySpending.map((data) => ({
    name: data.category_name,
    value: data.total_amount,
    color: ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'][categorySpending.indexOf(data) % 6],
  }));

  const transactions = recentTransactions.map((t) => ({
    id: t.id.toString(),
    description: t.description,
    category: t.category_name || 'Kategorisiz',
    amount: t.amount,
    type: t.type,
    date: new Date(t.transaction_date).toLocaleDateString('tr-TR'),
    icon: <TrendingDown size={20} />,
  }));

  const dashboardGoals = savingsGoals.map((goal) => ({
    id: goal.id.toString(),
    name: goal.name,
    target: goal.target_amount,
    current: goal.current_amount,
    progress: Math.min(goal.progress_percentage, 100),
    deadline: new Date(`${goal.target_date}T00:00:00`).toLocaleDateString('tr-TR'),
    icon: <Target size={20} />,
  }));

  const featuredRecommendation = recommendations[0];

  return (
    <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Finansal kontrol sende.</h1>
            <p className="text-gray-500">Paranı anla, hedeflerine güvenle ilerle.</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => onNavigate('income-expense')}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white transition-colors hover:bg-indigo-700"
            >
              <Plus size={18} />
              Gelir / Gider Ekle
            </button>
            {/* Refresh button */}
            <button
              aria-label="Verileri yenile"
              onClick={refetch}
              disabled={loading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Verileri yenile"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>

            {/* Time Period Selector */}
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Calendar size={18} className="text-gray-500" />
                <span className="text-gray-700 font-medium">
                  {timePeriods.find((t) => t.value === timePeriod)?.label}
                </span>
                <ChevronDown size={18} className="text-gray-500" />
              </button>
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10"
                  >
                    {timePeriods.map((period) => (
                      <button
                        key={period.value}
                        onClick={() => {
                          setTimePeriod(period.value);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${
                          timePeriod === period.value ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700'
                        }`}
                      >
                        {period.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg"
        >
          {error}
        </motion.div>
      )}

      {loading ? (
        <div role="status" aria-label="Dashboard yükleniyor" className="flex items-center justify-center py-20">
          <RefreshCw size={48} className="animate-spin text-indigo-600" />
        </div>
      ) : (
        <>
          {/* Balance Card */}
          <div className="mb-8">
            {summary && (
              <BalanceCard
                balance={summary.net_balance}
                change={0}
                changeType="increase"
              />
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => (
              <StatCard key={stat.title} stat={stat} index={index} />
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <IncomeExpenseChart data={chartData} />
            <ExpensePieChart data={pieData} />
          </div>

          {/* AI Recommendation */}
          <div className="mb-8">
            <AIRecommendationCard
              recommendation={featuredRecommendation ? {
                id: '1',
                title: featuredRecommendation.title,
                description: featuredRecommendation.description,
                category: featuredRecommendation.category,
                priority: featuredRecommendation.priority,
              } : {
                id: '1',
                title: 'Yeterli veri yok',
                description: 'Öneri üretmek için işlem ekleyin.',
                category: 'Bilgilendirme',
                priority: 'low',
              }}
              onClick={() => onNavigate('ai-assistant')}
            />
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TransactionList transactions={transactions} />
            <div className="space-y-6">
              <SavingsGoals goals={dashboardGoals} />
              <section className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Bütçe Durumu</h3>
                {budgetStatus.length === 0 ? (
                  <p className="text-sm text-gray-500">Henüz bütçe oluşturulmadı.</p>
                ) : budgetStatus.slice(0, 4).map((budget) => (
                  <div key={budget.id} className="mb-4 last:mb-0">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{budget.name}</span>
                      <span className={budget.usage_percentage >= 100 ? 'text-red-600 font-semibold' : 'text-gray-500'}>
                        {formatCurrency(budget.spent_amount)} / {formatCurrency(budget.limit_amount)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${budget.usage_percentage >= 100 ? 'bg-red-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(budget.usage_percentage, 100)}%` }} />
                    </div>
                  </div>
                ))}
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
