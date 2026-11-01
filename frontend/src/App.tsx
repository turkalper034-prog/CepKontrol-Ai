import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import { DEMO_READ_ONLY } from './lib/api';

const Dashboard = lazy(() => import('./components/dashboard/Dashboard'));
const TransactionsPage = lazy(() => import('./components/transactions/TransactionsPage'));
const AIAssistantPage = lazy(() => import('./components/ai/AIAssistantPage'));
const BudgetsPage = lazy(() => import('./components/pages/FinancePages').then((module) => ({ default: module.BudgetsPage })));
const ReportsPage = lazy(() => import('./components/pages/FinancePages').then((module) => ({ default: module.ReportsPage })));
const SavingsPage = lazy(() => import('./components/pages/FinancePages').then((module) => ({ default: module.SavingsPage })));
const SettingsPage = lazy(() => import('./components/pages/FinancePages').then((module) => ({ default: module.SettingsPage })));

const menuPaths: Record<string, string> = {
  overview: '/',
  'income-expense': '/income-expense',
  budgets: '/budgets',
  reports: '/reports',
  'ai-assistant': '/ai-assistant',
  savings: '/savings',
  settings: '/settings',
};

function getMenuFromLocation() {
  const route = window.location.hash
    ? window.location.hash.slice(1)
    : window.location.pathname;
  return Object.entries(menuPaths).find(([, path]) => path === route)?.[0] ?? 'overview';
}

function App() {
  const [activeMenu, setActiveMenu] = useState(getMenuFromLocation);

  useEffect(() => {
    const syncMenuWithLocation = () => setActiveMenu(getMenuFromLocation());
    window.addEventListener('hashchange', syncMenuWithLocation);
    window.addEventListener('popstate', syncMenuWithLocation);
    return () => {
      window.removeEventListener('hashchange', syncMenuWithLocation);
      window.removeEventListener('popstate', syncMenuWithLocation);
    };
  }, []);

  const navigateToMenu = useCallback((menuId: string) => {
    const path = menuPaths[menuId];
    if (!path) return;
    if (window.location.hash !== `#${path}`) {
      window.location.hash = path;
    } else {
      setActiveMenu(menuId);
    }
  }, []);

  const renderContent = () => {
    switch (activeMenu) {
      case 'overview':
        return <Dashboard onNavigate={navigateToMenu} />;
      case 'income-expense':
        return <TransactionsPage onNavigate={navigateToMenu} />;
      case 'budgets':
        return <BudgetsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'ai-assistant':
        return <AIAssistantPage />;
      case 'savings':
        return <SavingsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard onNavigate={navigateToMenu} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50">
      <Sidebar activeMenu={activeMenu} onMenuChange={navigateToMenu} />
      <main className="flex-1 overflow-hidden">
        {DEMO_READ_ONLY && (
          <div className="bg-indigo-950 px-4 py-2 text-center text-sm font-medium text-white">
            Portföy demosu · Sentetik örnek veriler · Salt okunur
          </div>
        )}
        <Suspense fallback={<div role="status" aria-live="polite" className="p-8 text-center text-gray-500">Sayfa yükleniyor...</div>}>
          {renderContent()}
        </Suspense>
      </main>
    </div>
  );
}

export default App;
