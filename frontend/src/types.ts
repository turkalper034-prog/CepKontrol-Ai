// Demo veri türleri - Not: Bu veriler sadece demo amaçlıdır, gerçek kullanıcı verisi değildir

export type TimePeriod = 'month' | 'quarter' | 'year';

export interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

export interface StatCard {
  title: string;
  value: string;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: React.ReactNode;
  color: string;
}

export interface Transaction {
  id: string;
  description: string;
  category: string;
  amount: number;
  type: 'income' | 'expense';
  date: string;
  icon: React.ReactNode;
}

export interface SavingsGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  progress: number;
  deadline: string;
  icon: React.ReactNode;
}

export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
}
