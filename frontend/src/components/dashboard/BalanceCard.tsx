import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface BalanceCardProps {
  balance: number;
  change: number;
  changeType: 'increase' | 'decrease';
}

export default function BalanceCard({ balance, change, changeType }: BalanceCardProps) {
  const formattedBalance = new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
  }).format(balance);

  const formattedChange = change.toFixed(2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(99, 102, 241, 0.15)' }}
      className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl p-8 text-white shadow-xl"
    >
      {/* Decorative gradient shapes */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-2xl" />

      <div className="relative z-10">
        <p className="text-indigo-200 text-sm font-medium mb-2">Toplam Bakiye</p>
        <motion.h2
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-5xl font-bold mb-4"
        >
          {formattedBalance}
        </motion.h2>

        <div className="flex items-center gap-2">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.4 }}
            className={`flex items-center gap-1 px-3 py-1 rounded-full ${
              changeType === 'increase'
                ? 'bg-green-500/20 text-green-300'
                : 'bg-red-500/20 text-red-300'
            }`}
          >
            {changeType === 'increase' ? (
              <TrendingUp size={16} />
            ) : (
              <TrendingDown size={16} />
            )}
            <span className="text-sm font-medium">
              {changeType === 'increase' ? '+' : '-'}%{formattedChange}
            </span>
          </motion.div>
          <span className="text-indigo-200 text-sm">geçen aya göre</span>
        </div>
      </div>

      {/* Animated decorative element */}
      <motion.div
        animate={{
          rotate: [0, 360],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute -right-8 -bottom-8 w-32 h-32 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-xl"
      />
    </motion.div>
  );
}
