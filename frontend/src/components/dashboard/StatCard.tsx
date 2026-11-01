import { motion } from 'framer-motion';
import type { StatCard as StatCardType } from '../../types';

interface StatCardProps {
  stat: StatCardType;
  index: number;
}

export default function StatCard({ stat, index }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl ${stat.color} bg-opacity-10`}>
          <div className={stat.color}>{stat.icon}</div>
        </div>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: index * 0.1 + 0.3 }}
          className={`flex items-center gap-1 text-sm font-medium ${
            stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {stat.changeType === 'increase' ? '↑' : '↓'}
          %{Math.abs(stat.change)}
        </motion.div>
      </div>

      <p className="text-gray-500 text-sm font-medium mb-1">{stat.title}</p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
        className="text-2xl font-bold text-gray-800"
      >
        {stat.value}
      </motion.p>
    </motion.div>
  );
}
