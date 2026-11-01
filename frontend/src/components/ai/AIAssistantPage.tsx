/**
 * Yapay Zekâ Asistanı Sayfası - Kural Tabanlı Analiz
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw, AlertCircle, TrendingUp, Target } from 'lucide-react';
import { api } from '../../lib/api';
import type { AIRecommendation } from '../../lib/api';

export default function AIAssistantPage() {
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRecommendations = useCallback(async () => {
    try {
      const data = await api.getAIRecommendations();
      setRecommendations(data);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Öneriler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRecommendations = useCallback(() => {
    setLoading(true);
    setError('');
    void loadRecommendations();
  }, [loadRecommendations]);

  useEffect(() => {
    void loadRecommendations();
  }, [loadRecommendations]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle size={20} />;
      case 'medium':
        return <Target size={20} />;
      case 'low':
        return <TrendingUp size={20} />;
      default:
        return <Sparkles size={20} />;
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'Yüksek Öncelik';
      case 'medium':
        return 'Orta Öncelik';
      case 'low':
        return 'Düşük Öncelik';
      default:
        return 'Bilgilendirme';
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Yapay Zekâ Asistanı</h1>
            <p className="text-gray-500">Kural tabanlı finansal analiz ve öneriler</p>
          </div>
          <button
            onClick={fetchRecommendations}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Önerileri Yenile
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6"
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="text-blue-600 mt-0.5" size={20} />
          <div>
            <p className="text-blue-800 font-medium mb-1">Kural Tabanlı Finansal Analiz</p>
            <p className="text-blue-700 text-sm">
              Bu öneriler gerçek bir yapay zekâ servisi tarafından üretilmemektedir.
              Veritabanınızdaki finansal kayıtlara dayalı kural tabanlı analizlerdir.
              Gerçek bir AI API entegrasyonu henüz yapılmamıştır.
            </p>
          </div>
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg"
        >
          {error}
        </motion.div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={48} className="animate-spin text-indigo-600" />
        </div>
      ) : recommendations.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 shadow-lg text-center"
        >
          <Sparkles size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium text-gray-800 mb-2">Öneri Bulunamadı</p>
          <p className="text-gray-500 mb-4">
            Öneri üretmek için yeterli finansal veri bulunamadı.
            İşlem ekleyerek finansal analizleriniz başlatabilirsiniz.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${getPriorityColor(rec.priority)}`}>
                  {getPriorityIcon(rec.priority)}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-800">{rec.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(rec.priority)}`}>
                      {getPriorityLabel(rec.priority)}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-3">{rec.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded">{rec.category}</span>
                    <span className="flex items-center gap-1">
                      <Sparkles size={14} />
                      {rec.data_source}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
