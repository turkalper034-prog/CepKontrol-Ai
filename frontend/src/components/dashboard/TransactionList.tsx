import { motion } from 'framer-motion';
import type { Transaction } from '../../types';

interface TransactionListProps {
  transactions: Transaction[];
}

export default function TransactionList({ transactions }: TransactionListProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
    >
      <h3 className="text-lg font-bold text-gray-800 mb-6">Son İşlemler</h3>
      {transactions.length === 0 ? <p className="text-sm text-gray-500">Henüz işlem kaydı bulunmuyor.</p> : <div className="space-y-4">
        {transactions.map((transaction, index) => (
          <motion.div
            key={transaction.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            whileHover={{ x: 4, backgroundColor: '#f9fafb' }}
            className="flex items-center gap-4 p-3 rounded-xl transition-all duration-200"
          >
            <div
              className={`p-3 rounded-xl ${
                transaction.type === 'income'
                  ? 'bg-green-100 text-green-600'
                  : 'bg-red-100 text-red-600'
              }`}
            >
              {transaction.icon}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-800">{transaction.description}</p>
              <p className="text-sm text-gray-500">{transaction.category}</p>
            </div>
            <div className="text-right">
              <p
                className={`font-bold ${
                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {transaction.type === 'income' ? '+' : '-'}
                ₺{transaction.amount.toLocaleString('tr-TR')}
              </p>
              <p className="text-xs text-gray-400">{transaction.date}</p>
            </div>
          </motion.div>
        ))}
      </div>}
    </motion.div>
  );
}
