import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  BarChart3,
  Sparkles,
  Target,
  Settings,
  Menu,
  X,
  User
} from 'lucide-react';
import type { MenuItem } from '../../types';

const menuItems: MenuItem[] = [
  { id: 'overview', label: 'Genel Bakış', icon: <LayoutDashboard size={20} />, path: '/' },
  { id: 'income-expense', label: 'Gelir ve Giderler', icon: <TrendingUp size={20} />, path: '/income-expense' },
  { id: 'budgets', label: 'Bütçelerim', icon: <Wallet size={20} />, path: '/budgets' },
  { id: 'reports', label: 'Finansal Raporlar', icon: <BarChart3 size={20} />, path: '/reports' },
  { id: 'ai-assistant', label: 'Yapay Zekâ Asistanı', icon: <Sparkles size={20} />, path: '/ai-assistant' },
  { id: 'savings', label: 'Tasarruf Hedeflerim', icon: <Target size={20} />, path: '/savings' },
  { id: 'settings', label: 'Ayarlar', icon: <Settings size={20} />, path: '/settings' },
];

interface SidebarProps {
  activeMenu: string;
  onMenuChange: (menuId: string) => void;
}

export default function Sidebar({ activeMenu, onMenuChange }: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        aria-label={isMobileOpen ? 'Menüyü kapat' : 'Menüyü aç'}
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-indigo-900 text-white rounded-lg shadow-lg"
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        className={`fixed left-0 top-0 z-40 h-full w-72 bg-gradient-to-b from-indigo-950 via-indigo-900 to-slate-900 text-white shadow-2xl transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-6 border-b border-indigo-800">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            CepKontrol AI
          </h1>
          <p className="text-indigo-300 text-sm mt-1">Akıllı Finans Yönetimi</p>
        </div>

        <nav aria-label="Ana gezinme" className="max-h-[calc(100vh-12rem)] overflow-y-auto overscroll-contain p-4 space-y-2">
          {menuItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => {
                onMenuChange(item.id);
                setIsMobileOpen(false);
              }}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                activeMenu === item.id
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/30'
                  : 'hover:bg-indigo-800/50 text-indigo-200'
              }`}
            >
              <span className={activeMenu === item.id ? 'text-white' : 'text-indigo-300'}>
                {item.icon}
              </span>
              <span className="font-medium">{item.label}</span>
              {activeMenu === item.id && (
                <motion.div
                  layoutId="activeIndicator"
                  className="ml-auto w-2 h-2 bg-white rounded-full"
                />
              )}
            </motion.button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-indigo-800">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <User size={20} />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">Kullanıcı</p>
              <p className="text-xs text-indigo-300">Yerel kullanım</p>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          />
        )}
      </AnimatePresence>
    </>
  );
}
