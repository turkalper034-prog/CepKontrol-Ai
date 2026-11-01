/**
 * API Client - Backend API ile iletişim için
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';
export const DEMO_READ_ONLY = import.meta.env.VITE_DEMO_READ_ONLY !== 'false'
  && (import.meta.env.PROD || import.meta.env.VITE_DEMO_READ_ONLY === 'true');

export interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category_id: number | null;
  transaction_date: string;
  notes: string | null;
  created_at: string;
  category_name?: string | null;
  icon?: string | null;
}

export interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  icon: string | null;
  color: string | null;
  created_at: string;
}

export interface Budget {
  id: number;
  name: string;
  category_id: number;
  period: 'monthly' | 'custom';
  limit_amount: number;
  start_date: string;
  end_date: string;
  created_at: string;
  spent_amount: number;
  remaining_amount: number;
  usage_percentage: number;
}

export interface SavingsGoal {
  id: number;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  created_at: string;
  progress_percentage: number;
  remaining_amount: number;
}

export interface ReportSummary {
  total_income: number;
  total_expense: number;
  net_difference: number;
  category_spending: CategorySpending[];
  monthly_data: MonthlyData[];
  top_expense_categories: CategorySpending[];
}

export interface DashboardSummary {
  total_income: number;
  total_expense: number;
  net_balance: number;
  savings_rate: number;
  period: string;
}

export interface CategorySpending {
  category_name: string;
  category_type: string;
  total_amount: number;
  percentage: number;
}

export interface MonthlyData {
  month: string;
  income: number;
  expense: number;
}

export interface AIRecommendation {
  title: string;
  description: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  data_source: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      let response: Response;
      try {
        response = await fetch(url, { ...options, headers });
      } catch {
        throw new Error('Backend sunucusuna bağlanılamadı. Sunucunun 127.0.0.1:8000 adresinde çalıştığını kontrol edin.');
      }

      if (!response.ok) {
        const error: { detail?: unknown } = await response.json().catch(() => ({}));
        throw new Error(typeof error.detail === 'string' ? error.detail : 'İstek tamamlanamadı.');
      }

      if (response.status === 204) {
        return {} as T;
      }

      return response.json();
    } catch (error) {
      if (error instanceof Error) throw error;
      throw new Error('Beklenmeyen bir hata oluştu.');
    }
  }

  // Kategoriler
  async getCategories(type?: 'income' | 'expense'): Promise<Category[]> {
    const params = type ? `?type=${type}` : '';
    return this.request<Category[]>(`/api/categories${params}`);
  }

  async getCategory(id: number): Promise<Category> {
    return this.request<Category>(`/api/categories/${id}`);
  }

  // İşlemler
  async getTransactions(params?: {
    type?: 'income' | 'expense';
    category_id?: number;
    start_date?: string;
    end_date?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<Transaction[]> {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.category_id) queryParams.append('category_id', params.category_id.toString());
    if (params?.start_date) queryParams.append('start_date', params.start_date);
    if (params?.end_date) queryParams.append('end_date', params.end_date);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());

    const queryString = queryParams.toString();
    return this.request<Transaction[]>(`/api/transactions${queryString ? `?${queryString}` : ''}`);
  }

  async getTransaction(id: number): Promise<Transaction> {
    return this.request<Transaction>(`/api/transactions/${id}`);
  }

  async createTransaction(data: {
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category_id: number;
    transaction_date: string;
    notes?: string;
  }): Promise<Transaction> {
    return this.request<Transaction>('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTransaction(id: number, data: Partial<{
    description: string;
    amount: number;
    type: 'income' | 'expense';
    category_id: number;
    transaction_date: string;
    notes: string;
  }>): Promise<Transaction> {
    return this.request<Transaction>(`/api/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTransaction(id: number): Promise<void> {
    return this.request<void>(`/api/transactions/${id}`, {
      method: 'DELETE',
    });
  }

  // Bütçeler
  async getBudgets(): Promise<Budget[]> {
    return this.request<Budget[]>('/api/budgets');
  }

  async getBudget(id: number): Promise<Budget> {
    return this.request<Budget>(`/api/budgets/${id}`);
  }

  async createBudget(data: {
    name: string;
    category_id: number;
    period: 'monthly' | 'custom';
    limit_amount: number;
    start_date: string;
    end_date: string;
  }): Promise<Budget> {
    return this.request<Budget>('/api/budgets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBudget(id: number, data: Partial<{
    name: string;
    category_id: number;
    period: 'monthly' | 'custom';
    limit_amount: number;
    start_date: string;
    end_date: string;
  }>): Promise<Budget> {
    return this.request<Budget>(`/api/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBudget(id: number): Promise<void> {
    return this.request<void>(`/api/budgets/${id}`, {
      method: 'DELETE',
    });
  }

  // Tasarruf Hedefleri
  async getGoals(): Promise<SavingsGoal[]> {
    return this.request<SavingsGoal[]>('/api/goals');
  }

  async getGoal(id: number): Promise<SavingsGoal> {
    return this.request<SavingsGoal>(`/api/goals/${id}`);
  }

  async createGoal(data: {
    name: string;
    target_amount: number;
    target_date: string;
    current_amount?: number;
  }): Promise<SavingsGoal> {
    return this.request<SavingsGoal>('/api/goals', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateGoal(id: number, data: Partial<{
    name: string;
    target_amount: number;
    target_date: string;
    current_amount: number;
  }>): Promise<SavingsGoal> {
    return this.request<SavingsGoal>(`/api/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteGoal(id: number): Promise<void> {
    return this.request<void>(`/api/goals/${id}`, {
      method: 'DELETE',
    });
  }

  async addToGoal(id: number, amount: number): Promise<SavingsGoal> {
    return this.request<SavingsGoal>(`/api/goals/${id}/add`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  // Dashboard
  async getDashboardSummary(period: string = 'month'): Promise<DashboardSummary> {
    return this.request<DashboardSummary>(`/api/dashboard/summary?period=${period}`);
  }

  async getCategorySpending(period: string = 'month'): Promise<CategorySpending[]> {
    return this.request<CategorySpending[]>(`/api/dashboard/category-spending?period=${period}`);
  }

  async getMonthlyData(months: number = 6): Promise<MonthlyData[]> {
    return this.request<MonthlyData[]>(`/api/dashboard/monthly-data?months=${months}`);
  }

  async getRecentTransactions(limit: number = 5): Promise<Transaction[]> {
    return this.request<Transaction[]>(`/api/dashboard/recent-transactions?limit=${limit}`);
  }

  async getBudgetStatus(): Promise<Budget[]> {
    return this.request<Budget[]>('/api/dashboard/budget-status');
  }

  // Raporlar
  async getReportSummary(startDate: string, endDate: string): Promise<ReportSummary> {
    return this.request(`/api/reports/summary?start_date=${startDate}&end_date=${endDate}`);
  }

  // AI Önerileri
  async getAIRecommendations(): Promise<AIRecommendation[]> {
    return this.request<AIRecommendation[]>('/api/ai/recommendations');
  }

  // Sağlık Kontrolü
  async healthCheck(): Promise<{ durum: string; mesaj: string; surum: string }> {
    return this.request('/api/health');
  }
}

export const api = new ApiClient();
