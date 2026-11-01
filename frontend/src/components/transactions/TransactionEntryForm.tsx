import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { api, DEMO_READ_ONLY } from '../../lib/api';
import type { Category } from '../../lib/api';

interface TransactionEntryFormProps {
  onSuccess: () => void;
}

const today = new Date().toISOString().slice(0, 10);
const inputClass = 'w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200';

export default function TransactionEntryForm({ onSuccess }: TransactionEntryFormProps) {
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryLoading, setCategoryLoading] = useState(true);
  const [categoryError, setCategoryError] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [transactionDate, setTransactionDate] = useState(today);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    setCategoryLoading(true);
    setCategoryError('');
    setCategoryId('');
    api.getCategories(type)
      .then((result) => {
        if (active) setCategories(result);
      })
      .catch((reason: unknown) => {
        if (active) setCategoryError(reason instanceof Error ? reason.message : 'Kategoriler yüklenemedi.');
      })
      .finally(() => {
        if (active) setCategoryLoading(false);
      });
    return () => {
      active = false;
    };
  }, [type]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    const parsedAmount = Number(amount);
    if (!description.trim()) {
      setError('İşlem açıklaması zorunludur.');
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError('Tutar sıfırdan büyük olmalıdır.');
      return;
    }
    if (!categoryId) {
      setError('Lütfen bu işlem için bir kategori seçin.');
      return;
    }

    setSaving(true);
    try {
      await api.createTransaction({
        description: description.trim(),
        amount: parsedAmount,
        type,
        category_id: Number(categoryId),
        transaction_date: transactionDate,
        notes: notes.trim() || undefined,
      });
      setDescription('');
      setAmount('');
      setCategoryId('');
      setNotes('');
      setTransactionDate(today);
      setSuccess(`${type === 'income' ? 'Gelir' : 'Gider'} kaydedildi.`);
      onSuccess();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'İşlem kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section id="transaction-entry-form" className="mb-6 rounded-2xl border border-indigo-100 bg-white p-5 shadow-lg sm:p-6">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-800">Yeni gelir veya gider ekle</h2>
        <p className="mt-1 text-sm text-gray-500">Tutarı girin, işlem türünü ve uygun kategoriyi seçin.</p>
      </div>
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <fieldset className="md:col-span-2 xl:col-span-3">
          <legend className="mb-2 text-sm font-semibold text-gray-700">İşlem türü</legend>
          <div className="flex gap-3">
            <button type="button" aria-pressed={type === 'expense'} onClick={() => { setType('expense'); setSuccess(''); }} className={`flex-1 rounded-lg border px-4 py-3 font-semibold transition-colors ${type === 'expense' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Gider</button>
            <button type="button" aria-pressed={type === 'income'} onClick={() => { setType('income'); setSuccess(''); }} className={`flex-1 rounded-lg border px-4 py-3 font-semibold transition-colors ${type === 'income' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Gelir</button>
          </div>
        </fieldset>

        <label className="block text-sm font-semibold text-gray-700">
          Açıklama *
          <input aria-label="İşlem açıklaması" className={`mt-2 ${inputClass}`} type="text" placeholder="Örn. Elektrik faturası, maaş" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={200} required />
        </label>
        <label className="block text-sm font-semibold text-gray-700">
          Tutar (₺) *
          <input aria-label="İşlem tutarı" className={`mt-2 ${inputClass}`} type="number" placeholder="0,00" min="0.01" step="0.01" inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} required />
        </label>
        <label className="block text-sm font-semibold text-gray-700">
          {type === 'expense' ? 'Gider kategorisi *' : 'Gelir kategorisi *'}
          <select aria-label={type === 'expense' ? 'Gider kategorisi' : 'Gelir kategorisi'} className={`mt-2 ${inputClass}`} value={categoryId} onChange={(event) => setCategoryId(event.target.value)} required disabled={categoryLoading || Boolean(categoryError)}>
            <option value="">{categoryLoading ? 'Kategoriler yükleniyor...' : 'Kategori seçin'}</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.icon ? `${category.icon} ` : ''}{category.name}</option>)}
          </select>
        </label>
        <label className="block text-sm font-semibold text-gray-700">
          Tarih *
          <input aria-label="İşlem tarihi" className={`mt-2 ${inputClass}`} type="date" value={transactionDate} onChange={(event) => setTransactionDate(event.target.value)} required />
        </label>
        <label className="block text-sm font-semibold text-gray-700 md:col-span-2">
          Not <span className="font-normal text-gray-400">(isteğe bağlı)</span>
          <input aria-label="İşlem notu" className={`mt-2 ${inputClass}`} type="text" placeholder="İşlemle ilgili ek bilgi" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={500} />
        </label>
        <div className="flex flex-col items-start justify-end gap-3">
          <button className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50" type="submit" disabled={DEMO_READ_ONLY || saving || categoryLoading || Boolean(categoryError) || categories.length === 0}>
            <Save size={18} />
            {saving ? 'Kaydediliyor...' : 'İşlemi Kaydet'}
          </button>
          {categories.length === 0 && !categoryLoading && !categoryError && <p className="text-sm text-amber-700">Bu tür için kayıtlı kategori bulunamadı.</p>}
        </div>
        {(categoryError || error || success) && (
          <div className="md:col-span-2 xl:col-span-3" aria-live="polite">
            {categoryError && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">Kategoriler yüklenemedi: {categoryError}</p>}
            {error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            {success && <p className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{success}</p>}
          </div>
        )}
      </form>
    </section>
  );
}
