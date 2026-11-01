import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { api, DEMO_READ_ONLY } from '../../lib/api';
import type { Budget, Category, ReportSummary, SavingsGoal } from '../../lib/api';

const money = (value: number) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);
const today = new Date().toISOString().slice(0, 10);
const monthStart = `${today.slice(0, 7)}-01`;
const monthEnd = `${today.slice(0, 7)}-${String(new Date(Number(today.slice(0, 4)), Number(today.slice(5, 7)), 0).getDate()).padStart(2, '0')}`;
const initialError = (error: unknown) => error instanceof Error ? error.message : 'İşlem tamamlanamadı.';
const palette = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

function PageHeader({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{title}</h1>
        <p className="text-gray-500">{description}</p>
      </div>
      {action}
    </div>
  );
}

function Notice({ error, info }: { error: string; info?: string }) {
  return (
    <>
      {error && <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>}
      {info && <div className="mb-5 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-blue-800">{info}</div>}
    </>
  );
}

const fieldClass = 'w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200';
const buttonClass = 'rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-700 disabled:opacity-50';
const secondaryButtonClass = 'rounded-lg border border-gray-300 px-3 py-2 text-gray-700 hover:bg-gray-50';

export function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Budget | null>(null);
  const [form, setForm] = useState({ name: '', category_id: '', period: 'monthly' as 'monthly' | 'custom', limit_amount: '', start_date: monthStart, end_date: monthEnd });

  const refresh = async () => {
    try {
      const [data, categoryData] = await Promise.all([api.getBudgets(), api.getCategories('expense')]);
      setBudgets(data);
      setCategories(categoryData);
    } catch (reason) {
      setError(initialError(reason));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { void refresh(); }, []);

  const reset = () => {
    setEditing(null);
    setForm({ name: '', category_id: '', period: 'monthly', limit_amount: '', start_date: monthStart, end_date: monthEnd });
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const limit = Number(form.limit_amount);
    if (!form.name.trim() || !form.category_id || !Number.isFinite(limit) || limit <= 0 || form.start_date >= form.end_date) {
      setError('Bütçe adı, gider kategorisi ve sıfırdan büyük tutar girin; bitiş tarihi başlangıçtan sonra olmalıdır.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = { name: form.name.trim(), category_id: Number(form.category_id), period: form.period, limit_amount: limit, start_date: form.start_date, end_date: form.end_date };
      if (editing) await api.updateBudget(editing.id, payload);
      else await api.createBudget(payload);
      reset();
      await refresh();
    } catch (reason) {
      setError(initialError(reason));
    } finally {
      setSaving(false);
    }
  };

  const edit = (budget: Budget) => {
    setEditing(budget);
    setForm({ name: budget.name, category_id: String(budget.category_id), period: budget.period, limit_amount: String(budget.limit_amount), start_date: budget.start_date, end_date: budget.end_date });
    setError('');
  };

  const remove = async (budget: Budget) => {
    if (!window.confirm(`"${budget.name}" bütçesini silmek istediğinize emin misiniz?`)) return;
    setError('');
    setLoading(true);
    try {
      await api.deleteBudget(budget.id);
      await refresh();
    } catch (reason) {
      setError(initialError(reason));
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <PageHeader title="Bütçelerim" description="Kategori bazında harcama limitlerinizi ve gerçek kullanımınızı takip edin." />
      <Notice error={error} />
      <form onSubmit={submit} className="mb-7 grid gap-4 rounded-2xl bg-white p-5 shadow-lg md:grid-cols-2 xl:grid-cols-6">
        <input aria-label="Bütçe adı" className={fieldClass} placeholder="Bütçe adı" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={100} />
        <select aria-label="Gider kategorisi" className={fieldClass} value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} required>
          <option value="">Gider kategorisi seçin</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        <input aria-label="Bütçe limiti" className={fieldClass} type="number" min="0.01" step="0.01" placeholder="Limit (₺)" value={form.limit_amount} onChange={(e) => setForm({ ...form, limit_amount: e.target.value })} required />
        <select aria-label="Bütçe dönemi" className={fieldClass} value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value as 'monthly' | 'custom' })}>
          <option value="monthly">Aylık</option><option value="custom">Özel dönem</option>
        </select>
        <input aria-label="Başlangıç tarihi" className={fieldClass} type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
        <input aria-label="Bitiş tarihi" className={fieldClass} type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} required />
        <div className="flex gap-2 md:col-span-2 xl:col-span-6">
          {!DEMO_READ_ONLY && <button className={buttonClass} type="submit" disabled={saving}>{saving ? 'Kaydediliyor...' : editing ? 'Bütçeyi Güncelle' : 'Bütçe Ekle'}</button>}
          {editing && !DEMO_READ_ONLY && <button className={secondaryButtonClass} type="button" onClick={reset}>Vazgeç</button>}
        </div>
      </form>
      {loading ? <p role="status" aria-live="polite" className="py-12 text-center text-gray-500">Bütçeler yükleniyor...</p> : budgets.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-lg">Henüz bütçe yok. İlk bütçenizi yukarıdaki formdan oluşturun.</div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {budgets.map((budget) => {
            const overLimit = budget.spent_amount > budget.limit_amount;
            return (
              <motion.article key={budget.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white p-5 shadow-lg">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div><h2 className="font-bold text-gray-800">{budget.name}</h2><p className="text-sm text-gray-500">{categories.find((category) => category.id === budget.category_id)?.name ?? 'Kategori'} · {budget.period === 'monthly' ? 'Aylık' : 'Özel dönem'}</p></div>
                  {!DEMO_READ_ONLY && <div className="flex gap-1"><button className={secondaryButtonClass} onClick={() => edit(budget)}>Düzenle</button><button className="rounded-lg px-2 py-2 text-red-600 hover:bg-red-50" onClick={() => void remove(budget)}>Sil</button></div>}
                </div>
                <p className="text-sm text-gray-500">{budget.start_date} – {budget.end_date}</p>
                <div className="my-4 flex justify-between text-sm"><span>Harcanan <strong className={overLimit ? 'text-red-600' : 'text-gray-800'}>{money(budget.spent_amount)}</strong></span><span>Limit <strong>{money(budget.limit_amount)}</strong></span></div>
                <div className="h-3 overflow-hidden rounded-full bg-gray-100"><div className={`h-full ${overLimit ? 'bg-red-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(budget.usage_percentage, 100)}%` }} /></div>
                <div className={`mt-2 flex justify-between text-sm ${overLimit ? 'font-semibold text-red-600' : 'text-gray-500'}`}><span>{overLimit ? `Limit ${money(Math.abs(budget.remaining_amount))} aşıldı` : `Kalan ${money(budget.remaining_amount)}`}</span><span>%{budget.usage_percentage.toFixed(1)}</span></div>
              </motion.article>
            );
          })}
        </div>
      )}
      <p className="mt-5 text-xs text-gray-500">Bir gider, aynı kategorideki birden fazla bütçenin tarih aralığına giriyorsa her bütçenin kullanımında ayrı ayrı değerlendirilir.</p>
    </div>
  );
}

export function SavingsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<SavingsGoal | null>(null);
  const [form, setForm] = useState({ name: '', target_amount: '', current_amount: '0', target_date: today });

  const refresh = async () => {
    try { setGoals(await api.getGoals()); } catch (reason) { setError(initialError(reason)); } finally { setLoading(false); }
  };
  useEffect(() => { void refresh(); }, []);
  const reset = () => { setEditing(null); setForm({ name: '', target_amount: '', current_amount: '0', target_date: today }); };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const target = Number(form.target_amount);
    const current = Number(form.current_amount);
    if (!form.name.trim() || !Number.isFinite(target) || target <= 0 || !Number.isFinite(current) || current < 0 || current > target) {
      setError('Hedef adı ve geçerli tutarlar girin. Birikim sıfır veya daha büyük ve hedefi aşmamalıdır.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = { name: form.name.trim(), target_amount: target, current_amount: current, target_date: form.target_date };
      if (editing) await api.updateGoal(editing.id, payload);
      else await api.createGoal(payload);
      reset();
      await refresh();
    } catch (reason) { setError(initialError(reason)); } finally { setSaving(false); }
  };

  const edit = (goal: SavingsGoal) => {
    setEditing(goal);
    setForm({ name: goal.name, target_amount: String(goal.target_amount), current_amount: String(goal.current_amount), target_date: goal.target_date });
    setError('');
  };
  const remove = async (goal: SavingsGoal) => {
    if (!window.confirm(`"${goal.name}" hedefini silmek istediğinize emin misiniz?`)) return;
    setLoading(true);
    try { await api.deleteGoal(goal.id); await refresh(); } catch (reason) { setError(initialError(reason)); }
  };
  const contribute = async (goal: SavingsGoal) => {
    const input = window.prompt(`${goal.name} hedefine eklenecek tutar (₺):`);
    if (input === null) return;
    const amount = Number(input);
    if (!Number.isFinite(amount) || amount <= 0) { setError('Eklenecek tutar sıfırdan büyük olmalıdır.'); return; }
    try { await api.addToGoal(goal.id, amount); await refresh(); } catch (reason) { setError(initialError(reason)); }
  };

  return (
    <div className="p-6 lg:p-8">
      <PageHeader title="Tasarruf Hedeflerim" description="Hedeflerinizi ve veritabanında saklanan birikim tutarlarınızı yönetin." />
      <Notice error={error} info="Hedefe para ekleme işlemi hedefin mevcut birikimini günceller; ayrı bir hareket geçmişi oluşturulmaz." />
      <form onSubmit={submit} className="mb-7 grid gap-4 rounded-2xl bg-white p-5 shadow-lg md:grid-cols-2 xl:grid-cols-5">
        <input aria-label="Hedef adı" className={fieldClass} placeholder="Hedef adı" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required maxLength={100} />
        <input aria-label="Hedef tutarı" className={fieldClass} type="number" min="0.01" step="0.01" placeholder="Hedef tutarı (₺)" value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} required />
        <input aria-label="Mevcut birikim" className={fieldClass} type="number" min="0" step="0.01" placeholder="Mevcut birikim (₺)" value={form.current_amount} onChange={(e) => setForm({ ...form, current_amount: e.target.value })} required />
        <input aria-label="Hedef tarihi" className={fieldClass} type="date" value={form.target_date} onChange={(e) => setForm({ ...form, target_date: e.target.value })} required />
        <div className="flex gap-2">{!DEMO_READ_ONLY && <button className={buttonClass} type="submit" disabled={saving}>{saving ? 'Kaydediliyor...' : editing ? 'Hedefi Güncelle' : 'Hedef Ekle'}</button>}{editing && !DEMO_READ_ONLY && <button className={secondaryButtonClass} type="button" onClick={reset}>Vazgeç</button>}</div>
      </form>
      {loading ? <p role="status" aria-live="polite" className="py-12 text-center text-gray-500">Hedefler yükleniyor...</p> : goals.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-lg">Henüz tasarruf hedefi yok.</div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {goals.map((goal) => {
            const complete = goal.remaining_amount <= 0;
            return (
              <motion.article key={goal.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-white p-5 shadow-lg">
                <div className="mb-4 flex items-start justify-between">
                  <div><h2 className="font-bold text-gray-800">{goal.name}</h2><p className="text-sm text-gray-500">Hedef tarihi: {goal.target_date}</p></div>
                  {!DEMO_READ_ONLY && <div className="flex gap-1"><button className={secondaryButtonClass} onClick={() => edit(goal)}>Düzenle</button><button className="rounded-lg px-2 py-2 text-red-600 hover:bg-red-50" onClick={() => void remove(goal)}>Sil</button></div>}
                </div>
                <p className="text-sm text-gray-700">{money(goal.current_amount)} / {money(goal.target_amount)}</p>
                <div className="my-3 h-3 overflow-hidden rounded-full bg-gray-100"><div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${Math.min(goal.progress_percentage, 100)}%` }} /></div>
                <div className="flex items-center justify-between text-sm"><span className={complete ? 'font-semibold text-green-700' : 'text-gray-500'}>{complete ? 'Hedefe ulaşıldı' : `Kalan ${money(goal.remaining_amount)}`}</span><span className="font-semibold">%{goal.progress_percentage.toFixed(1)}</span></div>
                {!complete && !DEMO_READ_ONLY && <button className={`mt-4 ${buttonClass}`} onClick={() => void contribute(goal)}>Birikim Ekle</button>}
              </motion.article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ReportsPage() {
  const [startDate, setStartDate] = useState(monthStart);
  const [endDate, setEndDate] = useState(today);
  const [report, setReport] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (startDate > endDate) { setError('Başlangıç tarihi bitiş tarihinden sonra olamaz.'); return; }
    setLoading(true);
    setError('');
    try { setReport(await api.getReportSummary(startDate, endDate)); } catch (reason) { setError(initialError(reason)); } finally { setLoading(false); }
  };
  useEffect(() => {
    let active = true;
    api.getReportSummary(monthStart, today)
      .then((data) => { if (active) setReport(data); })
      .catch((reason: unknown) => { if (active) setError(initialError(reason)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const chartData = report?.monthly_data.map((item) => ({ ay: item.month, Gelir: item.income, Gider: item.expense })) ?? [];
  return (
    <div className="p-6 lg:p-8">
      <PageHeader title="Finansal Raporlar" description="Seçtiğiniz dönem için gelir, gider ve kategori analizleri." />
      <Notice error={error} />
      <form onSubmit={(event) => void load(event)} className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl bg-white p-5 shadow-lg">
        <label className="text-sm text-gray-600">Başlangıç tarihi<input className={`mt-1 ${fieldClass}`} type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required /></label>
        <label className="text-sm text-gray-600">Bitiş tarihi<input className={`mt-1 ${fieldClass}`} type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} required /></label>
        <button className={buttonClass} disabled={loading}>{loading ? 'Rapor hazırlanıyor...' : 'Raporu Getir'}</button>
      </form>
      {loading && !report ? <p role="status" aria-live="polite" className="py-12 text-center text-gray-500">Rapor yükleniyor...</p> : report && (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            {[['Toplam gelir', report.total_income, 'text-green-700'], ['Toplam gider', report.total_expense, 'text-red-700'], ['Net fark', report.net_difference, report.net_difference < 0 ? 'text-red-700' : 'text-indigo-700']].map(([label, amount, color]) => (
              <div key={String(label)} className="rounded-2xl bg-white p-5 shadow-lg"><p className="text-sm text-gray-500">{label}</p><p className={`mt-2 text-2xl font-bold ${color}`}>{money(Number(amount))}</p></div>
            ))}
          </div>
          <div className="grid gap-6 xl:grid-cols-2">
            <section className="rounded-2xl bg-white p-5 shadow-lg"><h2 className="mb-4 text-lg font-bold text-gray-800">Dönemsel gelir-gider</h2>{chartData.length ? <ResponsiveContainer width="100%" height={300}><BarChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="ay" /><YAxis /><Tooltip formatter={(value) => money(Number(value))} /><Bar dataKey="Gelir" fill="#10b981" /><Bar dataKey="Gider" fill="#ef4444" /></BarChart></ResponsiveContainer> : <p className="py-12 text-center text-gray-500">Bu dönem için işlem verisi bulunmuyor.</p>}</section>
            <section className="rounded-2xl bg-white p-5 shadow-lg"><h2 className="mb-4 text-lg font-bold text-gray-800">Kategori bazında giderler</h2>{report.category_spending.length ? <div className="grid items-center gap-3 md:grid-cols-2"><ResponsiveContainer width="100%" height={260}><PieChart><Pie data={report.category_spending} dataKey="total_amount" nameKey="category_name" innerRadius={45} outerRadius={90}>{report.category_spending.map((category, index) => <Cell key={category.category_name} fill={palette[index % palette.length]} />)}</Pie><Tooltip formatter={(value) => money(Number(value))} /></PieChart></ResponsiveContainer><div className="space-y-3">{report.category_spending.map((category, index) => <div key={category.category_name} className="flex items-center justify-between gap-3 text-sm"><span className="flex items-center gap-2"><i className="h-3 w-3 rounded-full" style={{ backgroundColor: palette[index % palette.length] }} />{category.category_name}</span><span className="font-medium">{money(category.total_amount)}</span></div>)}</div></div> : <p className="py-12 text-center text-gray-500">Bu dönemde kategorili gider bulunmuyor.</p>}</section>
          </div>
        </>
      )}
    </div>
  );
}

export function SettingsPage() {
  const [health, setHealth] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const checkBackend = async () => {
    setLoading(true); setError(''); setHealth('');
    try {
      const result = await api.healthCheck();
      setHealth(`${result.mesaj} · Sürüm ${result.surum}`);
    } catch (reason) { setError(initialError(reason)); } finally { setLoading(false); }
  };
  return (
    <div className="p-6 lg:p-8">
      <PageHeader title="Ayarlar" description="Uygulama bilgileri ve servis durumu." />
      <Notice error={error} info={health} />
      <section className="max-w-2xl rounded-2xl bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-bold text-gray-800">Uygulama hakkında</h2>
        <dl className="space-y-3 text-sm"><div className="flex justify-between gap-3"><dt className="text-gray-500">Uygulama</dt><dd className="font-medium">CepKontrol AI</dd></div><div className="flex justify-between gap-3"><dt className="text-gray-500">Sürüm</dt><dd className="font-medium">1.0.0</dd></div><div className="flex justify-between gap-3"><dt className="text-gray-500">Veri saklama</dt><dd className="font-medium">Yerel SQLite veritabanı</dd></div><div className="flex justify-between gap-3"><dt className="text-gray-500">Para birimi</dt><dd className="font-medium">Türk lirası (TRY)</dd></div></dl>
        <p className="mt-5 text-sm text-gray-500">Tema ve para birimi değiştirme desteği henüz bulunmadığından, kaydedilmeyen ayar seçenekleri gösterilmez.</p>
        <button className={`mt-5 ${buttonClass}`} onClick={() => void checkBackend()} disabled={loading}>{loading ? 'Kontrol ediliyor...' : 'Backend bağlantısını kontrol et'}</button>
      </section>
    </div>
  );
}
