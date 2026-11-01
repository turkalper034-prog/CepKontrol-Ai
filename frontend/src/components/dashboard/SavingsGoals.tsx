import { motion } from 'framer-motion';
import type { SavingsGoal } from '../../types';

interface SavingsGoalsProps {
  goals: SavingsGoal[];
}

export default function SavingsGoals({ goals }: SavingsGoalsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.7 }}
      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
    >
      <h3 className="text-lg font-bold text-gray-800 mb-6">Tasarruf Hedeflerim</h3>
      {goals.length === 0 ? <p className="text-sm text-gray-500">Henüz tasarruf hedefi oluşturulmadı.</p> : <div className="space-y-5">
        {goals.map((goal, index) => (
          <motion.div
            key={goal.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                  {goal.icon}
                </div>
                <div>
                  <p className="font-medium text-gray-800">{goal.name}</p>
                  <p className="text-xs text-gray-500">Son tarih: {goal.deadline}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-800">
                  ₺{goal.current.toLocaleString('tr-TR')}
                </p>
                <p className="text-xs text-gray-500">
                  / ₺{goal.target.toLocaleString('tr-TR')}
                </p>
              </div>
            </div>
            <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${goal.progress}%` }}
                transition={{ duration: 1, delay: index * 0.1 + 0.5 }}
                className="absolute h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
              />
            </div>
            <p className="text-xs text-gray-500 text-right">%{goal.progress} tamamlandı</p>
          </motion.div>
        ))}
      </div>}
    </motion.div>
  );
}
