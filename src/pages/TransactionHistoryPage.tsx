import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AiOutlineArrowLeft, AiOutlineCalendar, AiOutlineCreditCard, AiOutlineCheckCircle, AiOutlineCloseCircle, AiOutlineClockCircle, AiOutlineCrown } from 'react-icons/ai';
import { FaBookOpen, FaBrain, FaCalendarCheck, FaComments, FaFileAlt, FaInfoCircle, FaRobot, FaSpellCheck } from 'react-icons/fa';
import { useAuth } from '../utils/AuthContext';
import { subscriptionAPI, Transaction } from '../utils/subscriptionAPI';
import { Header } from '../components/layout';
import { Skeleton } from '../components/ui/Skeleton';
import { useLanguage } from '../utils/LanguageContext';
import coinIcon from '../assets/assets_coin.png';

const chargeSections = [
  {
    title: 'AI Solver',
    icon: FaBrain,
    color: 'text-violet-500',
    bg: 'bg-violet-500/10',
    items: [
      { label: 'Text query', cost: '1', sublabel: '1 Coin per message' },
      { label: 'Image understanding', cost: '3', sublabel: '3 Coins per image' },
      { label: 'PDF understanding', cost: '2', sublabel: '2 Coins per PDF' },
    ],
  },
  {
    title: 'Mistake Checker',
    icon: FaSpellCheck,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    items: [
      { label: 'Image / photo', cost: '3', sublabel: '3 Coins per image' },
      { label: 'PDF document', cost: '10', sublabel: '10 Coins per PDF' },
    ],
  },
  {
    title: 'AI Humanizer',
    icon: FaRobot,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    items: [
      { label: 'Humanize text', cost: '40', sublabel: 'Per humanization request' },
    ],
  },
  {
    title: 'Study Set Creation',
    icon: FaBookOpen,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
    items: [
      { label: 'Speech to Text', cost: '1', sublabel: '1 Coin per minute' },
      { label: 'YouTube video', cost: '10', sublabel: '10 Coins per video' },
      { label: 'Other input methods', cost: '1', sublabel: '1 Coin per method' },
    ],
  },
  {
    title: 'AI Study Planner',
    icon: FaCalendarCheck,
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
    items: [
      { label: 'AI Roadmap generation', cost: '2', sublabel: '2 Coins per roadmap' },
    ],
  },
  {
    title: 'Paper Grader',
    icon: FaFileAlt,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    items: [
      { label: 'Per message', cost: '1', sublabel: '1 Coin per message sent' },
    ],
  },
  {
    title: 'Study Chat',
    icon: FaComments,
    color: 'text-indigo-500',
    bg: 'bg-indigo-500/10',
    items: [
      { label: 'Per message', cost: '1', sublabel: '1 Coin per message sent' },
    ],
  },
];

const TransactionHistoryPage: React.FC = () => {
  const { user, session } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'transactions' | 'charges'>('transactions');

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        // Use 'fake-user-for-plans' if user is not logged in, though typically history requires login
        // But user provided a curl example with uid, so we follow that pattern
        const uid = user?.id || 'fake-user-for-plans';
        const response = await subscriptionAPI.getTransactionHistory(1, 20, session, uid);
        
        console.log('API Response:', response); // Debug log

        if (response.success && response.data) {
          // Check if data is an array (direct list) or object with transactions property
          const transactionsData = Array.isArray(response.data) 
            ? response.data 
            : (response.data.transactions || []);
            
          setTransactions(transactionsData);
        } else {
          setError(response.error || t('transactionHistoryPage.failedToLoad'));
        }
      } catch (err) {
        setError(t('transactionHistoryPage.unexpectedError'));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user, session]);

  const getTypeColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'purchase':
      case 'completed':
      case 'succeeded':
        return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'refund':
        return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'spend':
        return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
      case 'failed':
      case 'cancelled':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      default:
        return 'text-gray-500 bg-gray-500/10 border-gray-500/20';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'purchase':
      case 'completed':
      case 'succeeded':
        return <AiOutlineCheckCircle className="w-4 h-4" />;
      case 'refund':
        return <AiOutlineClockCircle className="w-4 h-4" />;
      case 'spend':
        return <AiOutlineCreditCard className="w-4 h-4" />;
      case 'failed':
      case 'cancelled':
        return <AiOutlineCloseCircle className="w-4 h-4" />;
      default:
        return <AiOutlineClockCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111111] text-gray-900 dark:text-white font-sans">
      <Header />
      
      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center">
            <button 
              onClick={() => navigate(-1)}
              className="mr-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
            >
              <AiOutlineArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-bold">{t('transactionHistoryPage.title')}</h1>
          </div>
          <button
            onClick={() => navigate('/subscription')}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/20 transition-all"
          >
            <AiOutlineCrown className="w-5 h-5" />
            {t('transactionHistoryPage.buyCoins')}
          </button>
        </div>

        <div className="inline-flex w-full sm:w-auto bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl p-1 mb-6 shadow-sm">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'transactions'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('transactionHistoryPage.tabs.transactions')}
          </button>
          <button
            onClick={() => setActiveTab('charges')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === 'charges'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('transactionHistoryPage.tabs.charges')}
          </button>
        </div>

        <div className="bg-white dark:bg-[#1a1a1a] rounded-2xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm">
          {activeTab === 'transactions' ? (
          loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-white/5 last:border-0">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="w-32 h-4" />
                      <Skeleton className="w-24 h-3" />
                    </div>
                  </div>
                  <Skeleton className="w-20 h-6 rounded-full" />
                  <Skeleton className="w-16 h-4" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 text-red-500 mb-4">
                <AiOutlineCloseCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">{t('transactionHistoryPage.couldNotLoad')}</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/20 transition-colors"
              >
                {t('transactionHistoryPage.tryAgain')}
              </button>
            </div>
          ) : !transactions || transactions.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 text-gray-400 mb-4">
                <AiOutlineCalendar className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">{t('transactionHistoryPage.noTransactions')}</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">{t('transactionHistoryPage.noTransactionsDescription')}</p>
              <button
                onClick={() => navigate('/subscription')}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-colors"
              >
                <AiOutlineCrown className="w-5 h-5" />
                {t('transactionHistoryPage.buyCoins')}
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('transactionHistoryPage.columns.description')}</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('transactionHistoryPage.columns.dateTime')}</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('transactionHistoryPage.columns.amount')}</th>
                    <th className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('transactionHistoryPage.columns.type')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                  {transactions?.map((transaction) => (
                    <motion.tr 
                      key={transaction.id || Math.random()}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500">
                            <AiOutlineCrown className="w-5 h-5" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {transaction.description || transaction.subscription_plans?.name || t('transactionHistoryPage.transactionFallback')}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <AiOutlineCalendar className="mr-2 w-4 h-4 opacity-70" />
                          {transaction.created_at ? new Date(transaction.created_at).toLocaleDateString(language, { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          }) : t('transactionHistoryPage.notAvailable')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                          {t('transactionHistoryPage.coinsAmount', { values: { amount: typeof transaction.amount === 'number' ? Math.abs(transaction.amount).toFixed(0) : '0' } })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTypeColor(transaction.type || transaction.status || 'unknown')}`}>
                          <span className="mr-1.5">{getTypeIcon(transaction.type || transaction.status || 'unknown')}</span>
                          {(transaction.type || transaction.status || 'unknown').charAt(0).toUpperCase() + (transaction.type || transaction.status || 'unknown').slice(1)}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
          ) : (
            <div className="p-4 sm:p-6">
              <div className="flex items-start gap-3 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 p-4 mb-6">
                <FaInfoCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-300 mt-0.5 flex-shrink-0" />
                <p className="text-sm leading-relaxed text-indigo-700 dark:text-indigo-200">
                  {t('transactionHistoryPage.chargesInfo')}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {chargeSections.map((section) => {
                  const Icon = section.icon;

                  return (
                    <section key={section.title} className="rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] overflow-hidden">
                      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-white/10">
                        <div className={`w-9 h-9 rounded-xl ${section.bg} flex items-center justify-center`}>
                          <Icon className={`w-4 h-4 ${section.color}`} />
                        </div>
                        <h2 className="text-sm font-bold text-gray-900 dark:text-white">{section.title}</h2>
                      </div>
                      <div className="divide-y divide-gray-200 dark:divide-white/10">
                        {section.items.map((item) => (
                          <div key={`${section.title}-${item.label}`} className="flex items-center justify-between gap-4 px-4 py-3">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.sublabel}</p>
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 flex-shrink-0">
                              <span className="text-sm font-bold text-amber-700 dark:text-amber-300">-{item.cost}</span>
                              <img src={coinIcon} alt="Coins" className="w-4 h-4" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TransactionHistoryPage;
