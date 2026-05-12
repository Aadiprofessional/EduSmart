import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaArrowLeft, FaCommentAlt, FaBug, FaQuestionCircle, FaLightbulb, FaPaperPlane, FaCheckCircle } from 'react-icons/fa';
import { useAuth } from '../utils/AuthContext';
import { useLanguage } from '../utils/LanguageContext';
import { supabase } from '../utils/supabase';
import { Header } from '../components/layout';

type FeedbackType = 'feedback' | 'bug' | 'help' | 'feature';

interface TypeConfig {
  id: FeedbackType;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}

const TYPE_CONFIG: TypeConfig[] = [
  {
    id: 'feedback',
    icon: <FaCommentAlt />,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
    borderColor: 'border-indigo-500/40',
  },
  {
    id: 'bug',
    icon: <FaBug />,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/40',
  },
  {
    id: 'help',
    icon: <FaQuestionCircle />,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/40',
  },
  {
    id: 'feature',
    icon: <FaLightbulb />,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/40',
  },
];

const FeedbackPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [feedbackType, setFeedbackType] = useState<FeedbackType>('feedback');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!message.trim()) {
      setError(t('feedback.emptyMsg'));
      return;
    }
    setError(null);
    setSending(true);
    try {
      const { error: dbError } = await supabase.from('feedback').insert({
        user_id: user?.id ?? null,
        email: email.trim() || null,
        type: feedbackType,
        message: message.trim(),
        platform: 'web',
      });

      if (dbError) throw new Error(dbError.message);
      setSent(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`${t('feedback.errorMsg')}: ${msg}`);
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#111111] text-gray-900 dark:text-white">
        <Header />
        <main className="pt-24 pb-12 px-4 flex items-center justify-center min-h-[calc(100vh-80px)]">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md"
          >
            <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
              <FaCheckCircle className="text-green-500 text-4xl" />
            </div>
            <h2 className="text-2xl font-bold mb-3">{t('feedback.successTitle')}</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">{t('feedback.successMsg')}</p>
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
            >
              {t('common.close')}
            </button>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111111] text-gray-900 dark:text-white">
      <Header />

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-2xl mx-auto">
        {/* Back button + Title */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
          >
            <FaArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <FaCommentAlt className="text-indigo-500" />
            <h1 className="text-2xl font-bold">{t('feedback.title')}</h1>
          </div>
        </div>

        <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm">{t('feedback.subtitle')}</p>

        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm space-y-6">
          {/* Type selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
              {t('feedback.typeLabel')}
            </label>
            <div className="flex flex-wrap gap-2">
              {TYPE_CONFIG.map((tc) => {
                const isActive = feedbackType === tc.id;
                const labelKey = `feedback.type${tc.id.charAt(0).toUpperCase() + tc.id.slice(1)}` as any;
                return (
                  <button
                    key={tc.id}
                    onClick={() => setFeedbackType(tc.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition-all ${
                      isActive
                        ? `${tc.bgColor} ${tc.borderColor} ${tc.color}`
                        : 'bg-transparent border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20'
                    }`}
                  >
                    <span className={isActive ? tc.color : 'text-gray-400'}>{tc.icon}</span>
                    {t(labelKey)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
              {t('feedback.messageLabel')}
            </label>
            <textarea
              rows={6}
              maxLength={2000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('feedback.messagePlaceholder')}
              className="w-full bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none transition-colors"
            />
            <p className="text-xs text-gray-400 dark:text-gray-600 text-right mt-1">{message.length}/2000</p>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
              {t('feedback.emailLabel')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('feedback.emailPlaceholder')}
              className="w-full bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-colors"
            />
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Submit */}
          <button
            onClick={handleSend}
            disabled={sending}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-xl transition-colors"
          >
            {sending ? (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : (
              <FaPaperPlane className="w-4 h-4" />
            )}
            {sending ? t('common.loading') : t('feedback.submitBtn')}
          </button>
        </div>
      </main>
    </div>
  );
};

export default FeedbackPage;
