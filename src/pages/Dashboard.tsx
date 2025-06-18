import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaCrown, FaChartLine, FaHistory, FaRocket, FaCalendarAlt, 
  FaSpinner, FaDownload, FaFilter, FaSearch, FaEye, FaTimes,
  FaArrowUp, FaArrowDown, FaClock, FaCheckCircle, FaExclamationTriangle
} from 'react-icons/fa';
import { AiOutlineCrown, AiOutlineClose } from 'react-icons/ai';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import IconComponent from '../components/ui/IconComponent';
import { useAuth } from '../utils/AuthContext';
import { useSubscription } from '../utils/SubscriptionContext';
import { subscriptionAPI, Transaction, ResponseUsage, UsageLog } from '../utils/subscriptionAPI';

const Dashboard: React.FC = () => {
  const { user, session } = useAuth();
  const { subscriptionStatus, refreshStatus } = useSubscription();
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'responses' | 'logs'>('overview');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [responses, setResponses] = useState<ResponseUsage[]>([]);
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  // Load dashboard data
  const loadDashboardData = async () => {
    if (!session) return;
    
    setLoading(true);
    try {
      const [transactionsResult, responsesResult, logsResult] = await Promise.all([
        subscriptionAPI.getTransactionHistory(1, 20, session),
        subscriptionAPI.getResponseHistory(1, 20, session),
        subscriptionAPI.getUsageLogs(1, 20, session)
      ]);

      if (transactionsResult.success && transactionsResult.data) {
        setTransactions(transactionsResult.data.transactions);
      }

      if (responsesResult.success && responsesResult.data) {
        setResponses(responsesResult.data.responses);
      }

      if (logsResult.success && logsResult.data) {
        setLogs(logsResult.data.logs);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [session]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'active':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'failed':
      case 'cancelled':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'active':
        return FaCheckCircle;
      case 'pending':
        return FaClock;
      case 'failed':
      case 'cancelled':
        return FaExclamationTriangle;
      default:
        return FaClock;
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: FaChartLine },
    { id: 'transactions', name: 'Transactions', icon: FaHistory },
    { id: 'responses', name: 'AI Responses', icon: FaRocket },
    { id: 'logs', name: 'Usage Logs', icon: FaCalendarAlt },
  ];

  const openModal = (item: any) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  if (!subscriptionStatus?.isPro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Header />
        <div className="pt-20 pb-16 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <IconComponent icon={FaCrown} className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-white mb-4">Pro Dashboard</h1>
            <p className="text-gray-400 mb-8">Upgrade to Pro to access your dashboard</p>
            <button
              onClick={() => window.location.href = '/subscription'}
              className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-600 text-white rounded-xl font-bold hover:from-yellow-600 hover:to-orange-700 transition-all duration-300"
            >
              Upgrade to Pro
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Header />
      
      <div className="pt-20 pb-16">
        <motion.div
          className="container mx-auto px-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div 
            className="text-center mb-12"
            variants={itemVariants}
          >
            <div className="flex justify-center mb-6">
              <motion.div
                className="bg-gradient-to-r from-yellow-400 to-orange-500 p-4 rounded-full"
                animate={{
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <IconComponent icon={FaCrown} className="w-12 h-12 text-white" />
              </motion.div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent mb-4">
              Pro Dashboard
            </h1>
            <p className="text-xl text-gray-300">
              Welcome back, {user?.user_metadata?.name || 'Pro Member'}!
            </p>
          </motion.div>

          {/* Stats Overview */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
            variants={itemVariants}
          >
            <div className="bg-black/20 backdrop-blur-xl rounded-xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <IconComponent icon={FaRocket} className="w-8 h-8 text-blue-400" />
                <span className="text-2xl font-bold text-white">{subscriptionStatus.responsesRemaining}</span>
              </div>
              <h3 className="text-gray-400 text-sm">Responses Left</h3>
              <p className="text-white font-medium">of {subscriptionStatus.totalResponses} total</p>
            </div>

            <div className="bg-black/20 backdrop-blur-xl rounded-xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <IconComponent icon={FaChartLine} className="w-8 h-8 text-green-400" />
                <span className="text-2xl font-bold text-white">{responses.length}</span>
              </div>
              <h3 className="text-gray-400 text-sm">AI Queries</h3>
              <p className="text-white font-medium">This month</p>
            </div>

            <div className="bg-black/20 backdrop-blur-xl rounded-xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <IconComponent icon={FaHistory} className="w-8 h-8 text-purple-400" />
                <span className="text-2xl font-bold text-white">{transactions.length}</span>
              </div>
              <h3 className="text-gray-400 text-sm">Transactions</h3>
              <p className="text-white font-medium">All time</p>
            </div>

            <div className="bg-black/20 backdrop-blur-xl rounded-xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <IconComponent icon={FaCalendarAlt} className="w-8 h-8 text-yellow-400" />
                <span className="text-2xl font-bold text-white">
                  {subscriptionStatus.subscription ? 
                    Math.ceil((new Date(subscriptionStatus.subscription.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                    : 0
                  }
                </span>
              </div>
              <h3 className="text-gray-400 text-sm">Days Left</h3>
              <p className="text-white font-medium">Until renewal</p>
            </div>
          </motion.div>

          {/* Tab Navigation */}
          <motion.div 
            className="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 p-2 mb-8"
            variants={itemVariants}
          >
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <IconComponent icon={tab.icon} className="w-5 h-5 mr-2" />
                  {tab.name}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Tab Content */}
          <motion.div variants={itemVariants}>
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Subscription Status */}
                  <div className="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
                    <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                      <IconComponent icon={FaCrown} className="w-6 h-6 mr-3 text-yellow-400" />
                      Subscription Status
                    </h3>
                    {subscriptionStatus.subscription && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-gray-400 mb-2">Plan</p>
                          <p className="text-white font-medium text-lg">
                            {subscriptionStatus.subscription.subscription_plans?.name || 'Pro Plan'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 mb-2">Status</p>
                          <p className={`font-medium text-lg ${getStatusColor(subscriptionStatus.subscription.status)}`}>
                            {subscriptionStatus.subscription.status.charAt(0).toUpperCase() + subscriptionStatus.subscription.status.slice(1)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-400 mb-2">Valid Until</p>
                          <p className="text-white font-medium">{formatDate(subscriptionStatus.subscription.end_date)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400 mb-2">Auto Renewal</p>
                          <p className="text-white font-medium">
                            {new Date(subscriptionStatus.subscription.end_date) > new Date() ? 'Active' : 'Expired'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
                    <h3 className="text-2xl font-bold text-white mb-6">Recent Activity</h3>
                    <div className="space-y-4">
                      {logs.slice(0, 5).map((log) => (
                        <div key={log.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                          <div className="flex items-center">
                            <IconComponent icon={FaRocket} className="w-5 h-5 text-blue-400 mr-3" />
                            <div>
                              <p className="text-white font-medium">{log.description}</p>
                              <p className="text-gray-400 text-sm">{formatDate(log.created_at)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-medium">{log.responses_count} responses</p>
                            <p className="text-gray-400 text-sm">{log.remaining_responses} remaining</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'transactions' && (
                <motion.div
                  key="transactions"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 p-8"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-white">Transaction History</h3>
                    <button className="flex items-center px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-all duration-200">
                      <IconComponent icon={FaDownload} className="w-4 h-4 mr-2" />
                      Export
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <div 
                        key={transaction.id} 
                        className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-200 cursor-pointer"
                        onClick={() => openModal(transaction)}
                      >
                        <div className="flex items-center">
                          <IconComponent 
                            icon={getStatusIcon(transaction.status)} 
                            className={`w-5 h-5 mr-3 ${getStatusColor(transaction.status)}`} 
                          />
                          <div>
                            <p className="text-white font-medium">
                              {transaction.subscription_plans?.name || 'Subscription'}
                            </p>
                            <p className="text-gray-400 text-sm">{formatDate(transaction.created_at)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-medium">{formatCurrency(transaction.amount)}</p>
                          <p className={`text-sm ${getStatusColor(transaction.status)}`}>
                            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'responses' && (
                <motion.div
                  key="responses"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 p-8"
                >
                  <h3 className="text-2xl font-bold text-white mb-6">AI Response History</h3>
                  
                  <div className="space-y-4">
                    {responses.map((response) => (
                      <div 
                        key={response.id} 
                        className="p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-200 cursor-pointer"
                        onClick={() => openModal(response)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-white font-medium capitalize">{response.response_type.replace('_', ' ')}</p>
                          <p className="text-gray-400 text-sm">{formatDate(response.created_at)}</p>
                        </div>
                        <p className="text-gray-400 text-sm mb-2">
                          Responses used: {response.responses_used}
                        </p>
                        {response.query_data && (
                          <p className="text-gray-300 text-sm truncate">
                            Query: {JSON.stringify(response.query_data).substring(0, 100)}...
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'logs' && (
                <motion.div
                  key="logs"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 p-8"
                >
                  <h3 className="text-2xl font-bold text-white mb-6">Usage Logs</h3>
                  
                  <div className="space-y-4">
                    {logs.map((log) => (
                      <div 
                        key={log.id} 
                        className="p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-200 cursor-pointer"
                        onClick={() => openModal(log)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-white font-medium">{log.action}</p>
                          <p className="text-gray-400 text-sm">{formatDate(log.created_at)}</p>
                        </div>
                        <p className="text-gray-300 text-sm mb-2">{log.description}</p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Responses: {log.responses_count}</span>
                          <span className="text-gray-400">Remaining: {log.remaining_responses}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Detail Modal */}
          <AnimatePresence>
            {showModal && selectedItem && (
              <motion.div
                className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="bg-slate-900 rounded-2xl border border-white/10 p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-white">Details</h3>
                    <button
                      onClick={() => setShowModal(false)}
                      className="text-gray-400 hover:text-white"
                    >
                      <IconComponent icon={AiOutlineClose} className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <pre className="bg-black/20 p-4 rounded-xl text-gray-300 text-sm overflow-x-auto">
                      {JSON.stringify(selectedItem, null, 2)}
                    </pre>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard; 