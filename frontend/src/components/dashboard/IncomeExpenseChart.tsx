import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface IncomeExpenseChartProps {
  data: Array<{
    ay: string;
    gelir: number;
    gider: number;
  }>;
}

export default function IncomeExpenseChart({ data }: IncomeExpenseChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
    >
      <h3 className="text-lg font-bold text-gray-800 mb-6">Gelir ve Gider Analizi</h3>
      {data.length === 0 ? <p className="py-12 text-center text-gray-500">Gösterilecek gelir veya gider verisi yok.</p> : <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="ay"
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#6b7280"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `₺${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
            formatter={(value: any) => [`₺${Number(value).toLocaleString('tr-TR')}`, '']}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
          <Line
            type="monotone"
            dataKey="gelir"
            stroke="#6366f1"
            strokeWidth={3}
            dot={{ fill: '#6366f1', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
            name="Gelir"
          />
          <Line
            type="monotone"
            dataKey="gider"
            stroke="#ec4899"
            strokeWidth={3}
            dot={{ fill: '#ec4899', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
            name="Gider"
          />
        </LineChart>
      </ResponsiveContainer>}
    </motion.div>
  );
}
