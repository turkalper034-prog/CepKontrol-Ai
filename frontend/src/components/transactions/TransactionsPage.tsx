/**
 * Gelir ve Giderler Sayfası - Tam İşlevli
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Search, Filter, Trash2, Edit, XCircle } from 'lucide-react';
import { api, DEMO_READ_ONLY } from '../../lib/api';
import type { Transaction, Category } from '../../lib/api';
import TransactionForm from './TransactionForm';
import TransactionEntryForm from './TransactionEntryForm';

interface TransactionsPageProps {
  onNavigate: (menuId: string) => void;
}

export default function TransactionsPage({ onNavigate }: TransactionsPageProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Filtreler
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const clearFilters = () => {
    setTypeFilter('all');
    setCategoryFilter('');
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
  };

  const updateDateRange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    if (start && end && start > end) {
      setTransactions([]);
      setError('Başlangıç tarihi bitiş tarihinden sonra olamaz.');
    } else {
      setError('');
    }
  };

  const fetchTransactions = useCallback(async () => {
    if (startDate && endDate && startDate > endDate) return;
    setLoading(true);
    try {
      const params: {
        type?: 'income' | 'expense';
        category_id?: number;
        search?: string;
        start_date?: string;
        end_date?: string;
      } = {};
      if (typeFilter !== 'all') params.type = typeFilter;
      if (categoryFilter) params.category_id = parseInt(categoryFilter);
      if (searchQuery) params.search = searchQuery;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const data = await api.getTransactions(params);
      setTransactions(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlemler yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, categoryFilter, searchQuery, startDate, endDate]);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch (err) {
      console.error('Kategoriler yüklenirken hata:', err);
    }
  }, []);

  useEffect(() => {
    void fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    void fetchCategories();
  }, [fetchCategories]);

  const handleDelete = async (id: number) => {
    if (!confirm('Bu işlemi silmek istediğinize emin misiniz?')) return;

    try {
      setLoading(true);
      await api.deleteTransaction(id);
      await fetchTransactions();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Silme işlemi başarısız.');
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const filteredCategories = typeFilter === 'all'
    ? categories
    : categories.filter((cat) => cat.type === typeFilter);

  return (
    <div className="p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Gelir ve Giderler</h1>
          <p className="text-gray-500">Tüm finansal işlemlerinizi buradan yönetebilirsiniz.</p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('overview')}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-white px-4 py-2.5 font-semibold text-indigo-700 shadow-sm transition-colors hover:bg-indigo-50"
        >
          <ArrowLeft size={18} />
          Ana sayfaya dön
        </button>
      </motion.div>

      <TransactionEntryForm onSuccess={() => { void fetchTransactions(); }} />

      {/* Filtreler ve Arama */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 shadow-lg mb-6"
      >
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                aria-label="İşlem ara"
                type="text"
                placeholder="İşlem ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <select
              aria-label="İşlem türüne göre filtrele"
              value={typeFilter}
              onChange={(e) => {
                const nextType = e.target.value as 'all' | 'income' | 'expense';
                setTypeFilter(nextType);
                setCategoryFilter('');
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">Tümü</option>
              <option value="income">Gelir</option>
              <option value="expense">Gider</option>
            </select>

            <select
              aria-label="Kategoriye göre filtrele"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Tüm Kategoriler</option>
              {filteredCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>

            <input
              aria-label="Başlangıç tarihi filtresi"
              type="date"
              value={startDate}
              onChange={(e) => updateDateRange(e.target.value, endDate)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />

            <input
              aria-label="Bitiş tarihi filtresi"
              type="date"
              value={endDate}
              onChange={(e) => updateDateRange(startDate, e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={() => {
              document.getElementById('transaction-entry-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            <Plus size={18} />
            İşlem Ekleme Formuna Git
          </button>

          {(typeFilter !== 'all' || categoryFilter || searchQuery || startDate || endDate) && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              <XCircle size={18} />
              Filtreleri Temizle
            </button>
          )}
        </div>
      </motion.div>

      {/* İşlem Listesi */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg overflow-hidden"
      >
        {loading ? (
          <div role="status" aria-live="polite" className="p-8 text-center text-gray-500">İşlemler yükleniyor...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">{error}</div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Filter size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2">İşlem bulunamadı</p>
            <p className="text-sm mb-4">Filtreleri değiştirin veya yukarıdaki formdan yeni işlem ekleyin.</p>
            <button
              onClick={() => {
                document.getElementById('transaction-entry-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              İşlem Ekleme Formuna Git
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlem
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kategori
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tarih
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tutar
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map((transaction, index) => (
                  <motion.tr
                    key={transaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {transaction.description}
                      </div>
                      {transaction.notes && (
                        <div className="text-xs text-gray-500 mt-1">{transaction.notes}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {transaction.category_id
                          ? categories.find((c) => c.id === transaction.category_id)?.name || '-'
                          : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(transaction.transaction_date)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`font-bold ${
                          transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {!DEMO_READ_ONLY && <button
                          aria-label={`${transaction.description} işlemini düzenle`}
                          onClick={() => {
                            setEditingTransaction(transaction);
                            setIsFormOpen(true);
                          }}
                          className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                        >
                          <Edit size={18} />
                        </button>}
                        {!DEMO_READ_ONLY && <button
                          aria-label={`${transaction.description} işlemini sil`}
                          onClick={() => handleDelete(transaction.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <TransactionForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingTransaction(null);
        }}
        onSuccess={fetchTransactions}
        transaction={editingTransaction}
      />
    </div>
  );
}
