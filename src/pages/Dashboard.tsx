import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaCrown, FaChartLine, FaHistory, FaRocket, FaCalendarAlt, 
  FaSpinner, FaDownload, FaFilter, FaSearch, FaEye, FaTimes,
  FaArrowUp, FaArrowDown, FaClock, FaCheckCircle, FaExclamationTriangle,
  FaChevronLeft, FaChevronRight, FaFileAlt, FaGraduationCap, FaPenFancy,
  FaBookOpen, FaComments, FaQuestionCircle, FaLayerGroup, FaUserGraduate,
  FaBrain, FaSpellCheck, FaRobot, FaEdit, FaLightbulb, FaBookReader,
  FaMagic, FaCode, FaLanguage, FaCalculator, FaFlask, FaGlobe
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

  // Activity pagination and filtering states
  const [activityPage, setActivityPage] = useState(1);
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [showActivityFilters, setShowActivityFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const activityPerPage = 5;

  // Load dashboard data
  const loadDashboardData = async () => {
    if (!session) return;
    
    setLoading(true);
    try {
      const [transactionsResult, responsesResult, logsResult] = await Promise.all([
        subscriptionAPI.getTransactionHistory(1, 20, session),
        subscriptionAPI.getResponseHistory(1, 50, session), // Get more for pagination
        subscriptionAPI.getUsageLogs(1, 100, session) // Get more for pagination
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

  // Get response type icon and display name
  const getResponseTypeInfo = (responseType: string) => {
    const types: { [key: string]: { icon: any; name: string; color: string; bgColor: string } } = {
      'mistake_checker': { 
        icon: FaSpellCheck, 
        name: 'Mistake Checker', 
        color: 'text-red-400',
        bgColor: 'bg-red-500/20'
      },
      'document_summary': { 
        icon: FaFileAlt, 
        name: 'Document Summary', 
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/20'
      },
      'content_generation': { 
        icon: FaPenFancy, 
        name: 'Content Generation', 
        color: 'text-green-400',
        bgColor: 'bg-green-500/20'
      },
      'flashcard_ai_generation': { 
        icon: FaLayerGroup, 
        name: 'Flashcard Generation', 
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/20'
      },
      'homework_solution': { 
        icon: FaGraduationCap, 
        name: 'Homework Solution', 
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20'
      },
      'ai_tutor_chat': { 
        icon: FaComments, 
        name: 'AI Tutor Chat', 
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/20'
      },
      'citation_generator': { 
        icon: FaBookOpen, 
        name: 'Citation Generator', 
        color: 'text-indigo-400',
        bgColor: 'bg-indigo-500/20'
      },
      'study_planner': { 
        icon: FaCalendarAlt, 
        name: 'Study Planner', 
        color: 'text-pink-400',
        bgColor: 'bg-pink-500/20'
      },
      'text_analyzer': { 
        icon: FaBrain, 
        name: 'Text Analyzer', 
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/20'
      },
      'language_translator': { 
        icon: FaLanguage, 
        name: 'Language Translator', 
        color: 'text-teal-400',
        bgColor: 'bg-teal-500/20'
      },
      'math_solver': { 
        icon: FaCalculator, 
        name: 'Math Solver', 
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/20'
      },
      'science_assistant': { 
        icon: FaFlask, 
        name: 'Science Assistant', 
        color: 'text-violet-400',
        bgColor: 'bg-violet-500/20'
      }
    };

    return types[responseType] || { 
      icon: FaRocket, 
      name: responseType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()), 
      color: 'text-gray-400',
      bgColor: 'bg-gray-500/20'
    };
  };

  // Filter and sort activity data
  const getFilteredActivity = () => {
    let filtered = [...logs];
    
    // Filter by type
    if (activityFilter !== 'all') {
      filtered = filtered.filter(log => 
        log.description.toLowerCase().includes(activityFilter.toLowerCase()) ||
        log.action.toLowerCase().includes(activityFilter.toLowerCase())
      );
    }
    
    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
    
    return filtered;
  };

  // Get paginated activity
  const getPaginatedActivity = () => {
    const filtered = getFilteredActivity();
    const startIndex = (activityPage - 1) * activityPerPage;
    const endIndex = startIndex + activityPerPage;
    return {
      items: filtered.slice(startIndex, endIndex),
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / activityPerPage)
    };
  };

  // Get unique activity types for filter
  const getActivityTypes = () => {
    const types = new Set(logs.map(log => {
      const match = log.description.match(/Response used: (\w+)/);
      return match ? match[1] : 'other';
    }));
    return Array.from(types);
  };

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

  // Calculate progress percentage
  const progressPercentage = subscriptionStatus ? 
    ((subscriptionStatus.responsesRemaining || 0) / (subscriptionStatus.totalResponses || 1)) * 100 : 0;

  const responsesUsed = (subscriptionStatus?.totalResponses || 0) - (subscriptionStatus?.responsesRemaining || 0);

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

          {/* Cool Progress Bar for Responses */}
          <motion.div 
            className="mb-12"
            variants={itemVariants}
          >
            <div className="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white flex items-center">
                  <IconComponent icon={FaRocket} className="w-6 h-6 mr-3 text-blue-400" />
                  AI Response Usage
                </h3>
                <div className="text-right">
                  <p className="text-3xl font-bold text-white">
                    {subscriptionStatus.responsesRemaining}
                  </p>
                  <p className="text-gray-400 text-sm">responses left</p>
                </div>
              </div>
              
              {/* Animated Progress Bar */}
              <div className="relative">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Used: {responsesUsed}</span>
                  <span>Total: {subscriptionStatus.totalResponses}</span>
                </div>
                
                <div className="relative h-6 bg-gray-800 rounded-full overflow-hidden border border-white/10">
                  {/* Background glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full"></div>
                  
                  {/* Progress fill with gradient */}
                  <motion.div
                    className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 rounded-full shadow-lg"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  >
                    {/* Animated shine effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full"
                      animate={{
                        x: ['-100%', '100%']
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </motion.div>
                  
                  {/* Percentage text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white font-bold text-sm z-10">
                      {Math.round(progressPercentage)}%
                    </span>
                  </div>
                </div>
                
                {/* Usage statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="text-center p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                    <p className="text-emerald-400 font-bold text-lg">{responsesUsed}</p>
                    <p className="text-gray-400 text-xs">Used</p>
                  </div>
                  <div className="text-center p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                    <p className="text-blue-400 font-bold text-lg">{subscriptionStatus.responsesRemaining}</p>
                    <p className="text-gray-400 text-xs">Remaining</p>
                  </div>
                  <div className="text-center p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
                    <p className="text-purple-400 font-bold text-lg">{subscriptionStatus.totalResponses}</p>
                    <p className="text-gray-400 text-xs">Total</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                    <p className="text-yellow-400 font-bold text-lg">
                      {subscriptionStatus.subscription ? 
                        Math.ceil((new Date(subscriptionStatus.subscription.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                        : 0
                      }
                    </p>
                    <p className="text-gray-400 text-xs">Days Left</p>
                  </div>
                </div>
              </div>
            </div>
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
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-2xl font-bold text-white">Recent Activity</h3>
                      <div className="flex items-center space-x-2">
                        {/* Filter Toggle */}
                        <button
                          onClick={() => setShowActivityFilters(!showActivityFilters)}
                          className={`p-2 rounded-lg transition-colors ${
                            showActivityFilters 
                              ? 'bg-purple-500/30 text-purple-400' 
                              : 'bg-white/5 text-gray-400 hover:text-white'
                          }`}
                        >
                          <IconComponent icon={FaFilter} className="w-4 h-4" />
                        </button>
                        
                        {/* Sort Order */}
                        <button
                          onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                          className="p-2 bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
                        >
                          <IconComponent icon={sortOrder === 'desc' ? FaArrowDown : FaArrowUp} className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Filter Options */}
                    <AnimatePresence>
                      {showActivityFilters && (
                        <motion.div
                          className="mb-6 p-4 bg-white/5 rounded-xl border border-white/10"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => setActivityFilter('all')}
                              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                activityFilter === 'all'
                                  ? 'bg-purple-500 text-white'
                                  : 'bg-white/10 text-gray-400 hover:text-white'
                              }`}
                            >
                              All
                            </button>
                            {getActivityTypes().map((type) => {
                              const typeInfo = getResponseTypeInfo(type);
                              return (
                                <button
                                  key={type}
                                  onClick={() => setActivityFilter(type)}
                                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                    activityFilter === type
                                      ? 'bg-purple-500 text-white'
                                      : 'bg-white/10 text-gray-400 hover:text-white'
                                  }`}
                                >
                                  {typeInfo.name}
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Activity List */}
                    <div className="space-y-4 mb-6">
                      {getPaginatedActivity().items.map((log) => {
                        // Extract response type from description
                        const responseTypeMatch = log.description.match(/Response used: (\w+)/);
                        const responseType = responseTypeMatch ? responseTypeMatch[1] : 'other';
                        const typeInfo = getResponseTypeInfo(responseType);
                        
                        return (
                          <motion.div 
                            key={log.id} 
                            className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-200 border border-white/5"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            whileHover={{ scale: 1.02 }}
                          >
                            <div className="flex items-center">
                              {/* Enhanced Icon with Background */}
                              <div className={`p-3 rounded-xl ${typeInfo.bgColor} border border-white/10 mr-4`}>
                                <IconComponent 
                                  icon={typeInfo.icon} 
                                  className={`w-5 h-5 ${typeInfo.color}`} 
                                />
                              </div>
                              <div>
                                <p className="text-white font-medium">{typeInfo.name}</p>
                                <p className="text-gray-400 text-sm">
                                  {formatDate(log.created_at)}
                                </p>
                                <p className="text-gray-500 text-xs">
                                  {log.description}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                                  {log.responses_count} responses
                                </span>
                              </div>
                              <p className="text-gray-400 text-sm">{log.remaining_responses} remaining</p>
                            </div>
                          </motion.div>
                        );
                      })}
                      
                      {getPaginatedActivity().items.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          <IconComponent icon={FaHistory} className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No activity found</p>
                        </div>
                      )}
                    </div>

                    {/* Pagination */}
                    {getPaginatedActivity().totalPages > 1 && (
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-400">
                          Showing {((activityPage - 1) * activityPerPage) + 1} to {Math.min(activityPage * activityPerPage, getPaginatedActivity().total)} of {getPaginatedActivity().total} entries
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setActivityPage(Math.max(1, activityPage - 1))}
                            disabled={activityPage === 1}
                            className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <IconComponent icon={FaChevronLeft} className="w-4 h-4" />
                          </button>
                          
                          <div className="flex items-center space-x-1">
                            {Array.from({ length: getPaginatedActivity().totalPages }, (_, i) => i + 1)
                              .filter(page => 
                                page === 1 || 
                                page === getPaginatedActivity().totalPages || 
                                Math.abs(page - activityPage) <= 1
                              )
                              .map((page, index, array) => (
                                <React.Fragment key={page}>
                                  {index > 0 && array[index - 1] !== page - 1 && (
                                    <span className="text-gray-400 px-2">...</span>
                                  )}
                                  <button
                                    onClick={() => setActivityPage(page)}
                                    className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                                      activityPage === page
                                        ? 'bg-purple-500 text-white'
                                        : 'bg-white/5 text-gray-400 hover:text-white'
                                    }`}
                                  >
                                    {page}
                                  </button>
                                </React.Fragment>
                              ))
                            }
                          </div>
                          
                          <button
                            onClick={() => setActivityPage(Math.min(getPaginatedActivity().totalPages, activityPage + 1))}
                            disabled={activityPage === getPaginatedActivity().totalPages}
                            className="p-2 rounded-lg bg-white/5 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <IconComponent icon={FaChevronRight} className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
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
                    {responses.map((response) => {
                      const typeInfo = getResponseTypeInfo(response.response_type);
                      
                      return (
                        <div 
                          key={response.id} 
                          className="p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-200 cursor-pointer border border-white/5"
                          onClick={() => openModal(response)}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center">
                              <div className={`p-2 rounded-lg ${typeInfo.bgColor} border border-white/10 mr-3`}>
                                <IconComponent 
                                  icon={typeInfo.icon} 
                                  className={`w-4 h-4 ${typeInfo.color}`} 
                                />
                              </div>
                              <div>
                                <p className="text-white font-medium">{typeInfo.name}</p>
                                <p className="text-gray-400 text-sm">{formatDate(response.created_at)}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                                {response.responses_used} responses
                              </span>
                            </div>
                          </div>
                          {response.query_data && (
                            <p className="text-gray-300 text-sm truncate">
                              Query: {JSON.stringify(response.query_data).substring(0, 100)}...
                            </p>
                          )}
                        </div>
                      );
                    })}
                    
                    {responses.length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <IconComponent icon={FaRocket} className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No AI responses found</p>
                      </div>
                    )}
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
                    {logs.map((log) => {
                      // Extract response type from description for better UI
                      const responseTypeMatch = log.description.match(/Response used: (\w+)/);
                      const responseType = responseTypeMatch ? responseTypeMatch[1] : 'general';
                      const typeInfo = getResponseTypeInfo(responseType);
                      
                      return (
                        <motion.div 
                          key={log.id} 
                          className="p-6 bg-white/5 rounded-xl hover:bg-white/10 transition-all duration-200 cursor-pointer border border-white/5 hover:border-white/20"
                          onClick={() => openModal(log)}
                          whileHover={{ scale: 1.02 }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                              {/* Enhanced Icon with Background */}
                              <div className={`p-3 rounded-xl ${typeInfo.bgColor} border border-white/10 mr-4`}>
                                <IconComponent 
                                  icon={typeInfo.icon} 
                                  className={`w-5 h-5 ${typeInfo.color}`} 
                                />
                              </div>
                              <div>
                                <p className="text-white font-bold text-lg">{log.action}</p>
                                <p className="text-gray-400 text-sm">{formatDate(log.created_at)}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="px-3 py-1 bg-red-500/20 text-red-400 text-sm rounded-full font-medium">
                                  -{log.responses_count}
                                </span>
                              </div>
                              <p className="text-gray-400 text-xs">responses used</p>
                            </div>
                          </div>
                          
                          {/* Enhanced Description */}
                          <div className="mb-4 p-4 bg-black/20 rounded-lg border border-white/5">
                            <p className="text-gray-300 text-sm">{log.description}</p>
                          </div>
                          
                          {/* Usage Statistics Row */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-6">
                              <div className="text-center">
                                <p className="text-xl font-bold text-red-400">{log.responses_count}</p>
                                <p className="text-gray-400 text-xs">Used</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xl font-bold text-green-400">{log.remaining_responses}</p>
                                <p className="text-gray-400 text-xs">Remaining</p>
                              </div>
                            </div>
                            
                            {/* Mini Progress Bar */}
                            <div className="flex-1 max-w-32 ml-6">
                              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-300"
                                  style={{ 
                                    width: `${Math.min((log.responses_count / (log.remaining_responses + log.responses_count)) * 100, 100)}%` 
                                  }}
                                />
                              </div>
                              <div className="flex justify-between text-xs text-gray-400 mt-1">
                                <span>Impact</span>
                                <span>{Math.round((log.responses_count / (log.remaining_responses + log.responses_count)) * 100)}%</span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                    
                    {logs.length === 0 && (
                      <div className="text-center py-12 text-gray-400">
                        <IconComponent icon={FaCalendarAlt} className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">No usage logs found</p>
                        <p className="text-sm">Start using AI features to see your activity here</p>
                      </div>
                    )}
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
                  className="bg-slate-900 rounded-2xl border border-white/10 p-8 max-w-4xl w-full max-h-[80vh] overflow-y-auto"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-white">
                      {activeTab === 'transactions' && 'Transaction Details'}
                      {activeTab === 'responses' && 'AI Response Details'}
                      {activeTab === 'logs' && 'Usage Log Details'}
                    </h3>
                    <button
                      onClick={() => setShowModal(false)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <IconComponent icon={AiOutlineClose} className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Transaction Details */}
                  {activeTab === 'transactions' && (
                    <div className="space-y-6">
                      {/* Header */}
                      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30">
                        <div className="flex items-center">
                          <div className="p-3 bg-green-500/20 rounded-xl mr-4">
                            <IconComponent 
                              icon={getStatusIcon(selectedItem.status)} 
                              className={`w-6 h-6 ${getStatusColor(selectedItem.status)}`} 
                            />
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-white">
                              {selectedItem.subscription_plans?.name || 'Subscription Purchase'}
                            </h4>
                            <p className="text-green-400 font-medium">
                              {formatCurrency(selectedItem.amount)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                            selectedItem.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            selectedItem.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {selectedItem.status.charAt(0).toUpperCase() + selectedItem.status.slice(1)}
                          </div>
                        </div>
                      </div>

                      {/* Transaction Info Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                          <h5 className="text-gray-400 text-sm mb-2">Transaction ID</h5>
                          <p className="text-white font-mono text-sm break-all">{selectedItem.id}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                          <h5 className="text-gray-400 text-sm mb-2">Date & Time</h5>
                          <p className="text-white">{formatDate(selectedItem.created_at)}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                          <h5 className="text-gray-400 text-sm mb-2">Payment Method</h5>
                          <p className="text-white">{selectedItem.payment_method || 'Credit Card'}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                          <h5 className="text-gray-400 text-sm mb-2">Subscription Period</h5>
                          <p className="text-white">
                            {selectedItem.subscription_plans?.duration_days || 30} days
                          </p>
                        </div>
                      </div>

                      {/* Plan Details */}
                      {selectedItem.subscription_plans && (
                        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                          <h5 className="text-lg font-bold text-white mb-4">Plan Features</h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-purple-500/10 rounded-lg">
                              <p className="text-purple-400 font-bold text-2xl">
                                {selectedItem.subscription_plans.responses || 'Unlimited'}
                              </p>
                              <p className="text-gray-400 text-sm">AI Responses</p>
                            </div>
                            <div className="text-center p-4 bg-blue-500/10 rounded-lg">
                              <p className="text-blue-400 font-bold text-2xl">
                                {selectedItem.subscription_plans.duration_days || 30}
                              </p>
                              <p className="text-gray-400 text-sm">Days Access</p>
                            </div>
                            <div className="text-center p-4 bg-green-500/10 rounded-lg">
                              <p className="text-green-400 font-bold text-2xl">
                                {formatCurrency(selectedItem.subscription_plans.price || selectedItem.amount)}
                              </p>
                              <p className="text-gray-400 text-sm">Total Cost</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* AI Response Details */}
                  {activeTab === 'responses' && (
                    <div className="space-y-6">
                      {/* Header */}
                      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl border border-blue-500/30">
                        <div className="flex items-center">
                          <div className="p-3 bg-blue-500/20 rounded-xl mr-4">
                            <IconComponent 
                              icon={getResponseTypeInfo(selectedItem.response_type).icon} 
                              className={`w-6 h-6 ${getResponseTypeInfo(selectedItem.response_type).color}`} 
                            />
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-white">
                              {getResponseTypeInfo(selectedItem.response_type).name}
                            </h4>
                            <p className="text-blue-400 font-medium">
                              {selectedItem.responses_used} response{selectedItem.responses_used !== 1 ? 's' : ''} used
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-400 text-sm">{formatDate(selectedItem.created_at)}</p>
                        </div>
                      </div>

                      {/* Response Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                          <h5 className="text-gray-400 text-sm mb-2">Response ID</h5>
                          <p className="text-white font-mono text-sm break-all">{selectedItem.id}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                          <h5 className="text-gray-400 text-sm mb-2">Responses Used</h5>
                          <div className="flex items-center">
                            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm font-medium">
                              {selectedItem.responses_used}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Query Data */}
                      {selectedItem.query_data && (
                        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                          <h5 className="text-lg font-bold text-white mb-4">Query Information</h5>
                          <div className="space-y-4">
                            {selectedItem.query_data.mode && (
                              <div>
                                <p className="text-gray-400 text-sm mb-1">Mode</p>
                                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-medium">
                                  {selectedItem.query_data.mode}
                                </span>
                              </div>
                            )}
                            {selectedItem.query_data.fileName && (
                              <div>
                                <p className="text-gray-400 text-sm mb-1">File Name</p>
                                <p className="text-white font-medium flex items-center">
                                  <IconComponent icon={FaFileAlt} className="w-4 h-4 mr-2 text-blue-400" />
                                  {selectedItem.query_data.fileName}
                                </p>
                              </div>
                            )}
                            {selectedItem.query_data.fileSize && (
                              <div>
                                <p className="text-gray-400 text-sm mb-1">File Size</p>
                                <p className="text-white">
                                  {(selectedItem.query_data.fileSize / 1024).toFixed(1)} KB
                                </p>
                              </div>
                            )}
                            {selectedItem.query_data.fileType && (
                              <div>
                                <p className="text-gray-400 text-sm mb-1">File Type</p>
                                <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-medium">
                                  {selectedItem.query_data.fileType}
                                </span>
                              </div>
                            )}
                            {selectedItem.query_data.text && (
                              <div>
                                <p className="text-gray-400 text-sm mb-1">Input Text</p>
                                <div className="bg-black/20 p-4 rounded-lg max-h-32 overflow-y-auto">
                                  <p className="text-white text-sm">{selectedItem.query_data.text}</p>
                                </div>
                              </div>
                            )}
                            {selectedItem.query_data.subject && (
                              <div>
                                <p className="text-gray-400 text-sm mb-1">Subject</p>
                                <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-medium">
                                  {selectedItem.query_data.subject}
                                </span>
                              </div>
                            )}
                            {selectedItem.query_data.difficulty && (
                              <div>
                                <p className="text-gray-400 text-sm mb-1">Difficulty</p>
                                <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm font-medium">
                                  {selectedItem.query_data.difficulty}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Additional Query Data */}
                      {selectedItem.query_data && Object.keys(selectedItem.query_data).some(key => 
                        !['mode', 'fileName', 'fileSize', 'fileType', 'text', 'subject', 'difficulty'].includes(key)
                      ) && (
                        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                          <h5 className="text-lg font-bold text-white mb-4">Additional Data</h5>
                          <div className="bg-black/20 p-4 rounded-lg">
                            <pre className="text-gray-300 text-sm overflow-x-auto">
                              {JSON.stringify(
                                Object.fromEntries(
                                  Object.entries(selectedItem.query_data).filter(([key]) => 
                                    !['mode', 'fileName', 'fileSize', 'fileType', 'text', 'subject', 'difficulty'].includes(key)
                                  )
                                ), 
                                null, 
                                2
                              )}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Usage Log Details */}
                  {activeTab === 'logs' && (
                    <div className="space-y-6">
                      {/* Header */}
                      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-xl border border-orange-500/30">
                        <div className="flex items-center">
                          <div className="p-3 bg-orange-500/20 rounded-xl mr-4">
                            <IconComponent icon={FaHistory} className="w-6 h-6 text-orange-400" />
                          </div>
                          <div>
                            <h4 className="text-xl font-bold text-white">{selectedItem.action}</h4>
                            <p className="text-orange-400 font-medium">Usage Activity</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-gray-400 text-sm">{formatDate(selectedItem.created_at)}</p>
                        </div>
                      </div>

                      {/* Usage Info Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white/5 rounded-xl p-6 border border-white/10 text-center">
                          <h5 className="text-gray-400 text-sm mb-2">Responses Used</h5>
                          <p className="text-3xl font-bold text-red-400">{selectedItem.responses_count}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-6 border border-white/10 text-center">
                          <h5 className="text-gray-400 text-sm mb-2">Remaining After</h5>
                          <p className="text-3xl font-bold text-green-400">{selectedItem.remaining_responses}</p>
                        </div>
                        <div className="bg-white/5 rounded-xl p-6 border border-white/10 text-center">
                          <h5 className="text-gray-400 text-sm mb-2">Log ID</h5>
                          <p className="text-white font-mono text-xs break-all">{selectedItem.id}</p>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <h5 className="text-lg font-bold text-white mb-4">Activity Description</h5>
                        <div className="bg-black/20 p-4 rounded-lg">
                          <p className="text-gray-300">{selectedItem.description}</p>
                        </div>
                      </div>

                      {/* Timeline Visualization */}
                      <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <h5 className="text-lg font-bold text-white mb-4">Response Usage Impact</h5>
                        <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-400">
                              {selectedItem.remaining_responses + selectedItem.responses_count}
                            </p>
                            <p className="text-gray-400 text-sm">Before</p>
                          </div>
                          <div className="flex-1 mx-4">
                            <div className="relative">
                              <div className="h-2 bg-gray-700 rounded-full"></div>
                              <div className="absolute top-0 left-0 h-2 bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                                   style={{ width: `${(selectedItem.responses_count / (selectedItem.remaining_responses + selectedItem.responses_count)) * 100}%` }}>
                              </div>
                            </div>
                            <div className="flex justify-center mt-2">
                              <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                                -{selectedItem.responses_count}
                              </span>
                            </div>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-400">{selectedItem.remaining_responses}</p>
                            <p className="text-gray-400 text-sm">After</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Close Button */}
                  <div className="mt-8 flex justify-end">
                    <button
                      onClick={() => setShowModal(false)}
                      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
                    >
                      Close
                    </button>
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