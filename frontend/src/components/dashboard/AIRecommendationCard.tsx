import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import type { AIRecommendation } from '../../types';

interface AIRecommendationCardProps {
  recommendation: AIRecommendation;
  onClick: () => void;
}

export default function AIRecommendationCard({ recommendation, onClick }: AIRecommendationCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      whileHover={{ scale: 1.02, y: -4 }}
      className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-6 text-white shadow-xl"
    >
      {/* Animated gradient overlay */}
      <motion.div
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-30"
        style={{
          backgroundSize: '200% 200%',
        }}
      />

      <div className="relative z-10">
        <div className="flex items-start gap-4 mb-4">
          <motion.div
            animate={{
              rotate: [0, 10, -10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatDelay: 3,
            }}
            className="p-3 bg-white/20 rounded-xl backdrop-blur-sm"
          >
            <Sparkles size={24} className="text-yellow-300" />
          </motion.div>
          <div className="flex-1">
            <h3 className="text-lg font-bold mb-1">Yapay Zekâ Önerisi</h3>
            <span className="inline-block px-2 py-1 bg-white/20 rounded-full text-xs font-medium backdrop-blur-sm">
              {recommendation.category}
            </span>
          </div>
        </div>

        <p className="text-indigo-100 mb-4 leading-relaxed">
          {recommendation.description}
        </p>

        <motion.button
          onClick={onClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
        >
          Önerileri incele
          <ArrowRight size={18} />
        </motion.button>
      </div>

      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-full blur-xl" />
    </motion.div>
  );
}
