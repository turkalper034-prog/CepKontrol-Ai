/**
 * İşlem Ekleme/Düzenleme Formu
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, XCircle } from 'lucide-react';
import { api, DEMO_READ_ONLY } from '../../lib/api';
import type { Transaction, Category } from '../../lib/api';

const defaultTransactionDate = new Date().toISOString().split('T')[0];

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  transaction?: Transaction | null;
}

export default function TransactionForm({ isOpen, onClose, onSuccess, transaction }: TransactionFormProps) {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    category_id: '' as string,
    transaction_date: defaultTransactionDate,
    notes: '',
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categoryError, setCategoryError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (transaction) {
        setFormData({
          description: transaction.description,
          amount: transaction.amount.toString(),
          type: transaction.type,
          category_id: transaction.category_id?.toString() || '',
          transaction_date: transaction.transaction_date.split('T')[0],
          notes: transaction.notes || '',
        });
      } else {
        setFormData({
          description: '',
          amount: '',
          type: 'expense',
          category_id: '',
          transaction_date: defaultTransactionDate,
          notes: '',
        });
      }
    }
  }, [isOpen, transaction]);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await api.getCategories(formData.type);
      setCategories(data);
      setCategoryError('');
    } catch (err) {
      setCategoryError(err instanceof Error ? err.message : 'Kategoriler yüklenemedi.');
    }
  }, [formData.type]);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [fetchCategories, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const amount = Number(formData.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Tutar sıfırdan büyük olmalıdır.');
      return;
    }

    if (!formData.category_id) {
      setError('Kategori seçimi zorunludur');
      return;
    }

    setLoading(true);

    try {
      const data = {
        description: formData.description,
        amount,
        type: formData.type,
        category_id: parseInt(formData.category_id),
        transaction_date: formData.transaction_date,
        notes: formData.notes || undefined,
      };

      if (transaction) {
        await api.updateTransaction(transaction.id, data);
      } else {
        await api.createTransaction(data);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'İşlem kaydedilirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const filteredCategories = categories.filter((cat) => cat.type === formData.type);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                {transaction ? 'İşlemi Düzenle' : 'Yeni İşlem Ekle'}
              </h2>
              <button
                aria-label="Düzenleme penceresini kapat"
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}
              {categoryError && (
                <div role="alert" className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm">
                  {categoryError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  İşlem Türü *
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'income', category_id: '' })}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      formData.type === 'income'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Gelir
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'expense', category_id: '' })}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                      formData.type === 'expense'
                        ? 'bg-red-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Gider
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tutar (₺) *
                </label>
                <input
                  aria-label="Düzenlenecek işlem tutarı"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açıklama *
                </label>
                <input
                  aria-label="Düzenlenecek işlem açıklaması"
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategori *
                </label>
                <select
                  aria-label="Düzenlenecek işlem kategorisi"
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                >
                  <option value="">Seçiniz</option>
                  {filteredCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tarih *
                </label>
                <input
                  aria-label="Düzenlenecek işlem tarihi"
                  type="date"
                  value={formData.transaction_date}
                  onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Not (İsteğe bağlı)
                </label>
                <textarea
                  aria-label="Düzenlenecek işlem notu"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  rows={2}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={DEMO_READ_ONLY || loading || Boolean(categoryError) || categories.length === 0}
                  className="flex-1 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  <XCircle size={18} className="inline mr-2" />
                  Vazgeç
                </button>
                <button
                  type="submit"
                  disabled={DEMO_READ_ONLY || loading || Boolean(categoryError) || categories.length === 0}
                  className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  <Save size={18} className="inline mr-2" />
                  {loading ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
