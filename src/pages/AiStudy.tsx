import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { AiOutlineUpload, AiOutlineBulb, AiOutlineRobot, AiOutlineHistory, AiOutlineSearch, AiOutlineEdit } from 'react-icons/ai';
import { FiBookOpen, FiClock, FiCalendar, FiCheck, FiBookmark, FiEdit, FiMenu, FiCheckCircle, FiMessageSquare, FiLayers, FiPenTool, FiTrendingUp, FiArrowRight } from 'react-icons/fi';
import { FaCrown, FaExclamationTriangle, FaCheck } from 'react-icons/fa';
import IconComponent from '../components/ui/IconComponent';
import { useAuth } from '../utils/AuthContext';
import { useProStatus, ProBadge, requiresProAccess } from '../utils/proStatusUtils';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import CitationGenerator from '../components/ui/CitationGenerator';
import { ContentWriterComponent } from '../components/ui/ContentWriterComponent';
import CheckMistakesComponent from '../components/ui/CheckMistakesComponent';
import AiTutorChatComponent from '../components/ui/AiTutorChatComponent';
import UploadHomeworkComponent from '../components/ui/UploadHomeworkComponent';
import StudyPlannerComponent from '../components/ui/StudyPlannerComponent';
import FlashcardComponent from '../components/ui/FlashcardComponent';
import DocumentSummarizerComponent from '../components/ui/DocumentSummarizerComponent';
import { useLanguage } from '../utils/LanguageContext';

const AiStudy: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { isProUser, responsesRemaining, loading: proLoading, forceRefresh } = useProStatus();
  const [activeTab, setActiveTab] = useState('upload');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // Component state preservation
  const [componentStates, setComponentStates] = useState<{[key: string]: boolean}>({
    'upload': true,
    'ai-tutor': false,
    'mistake-checker': false,
    'study-planner': false,
    'flashcards': false,
    'content-writer': false,
    'citation-generator': false,
    'document-summarizer': false,
  });

  const [history, setHistory] = useState<{date: string, question: string, snippet: string}[]>([
    {date: '2 days ago', question: 'Explain photosynthesis', snippet: 'Photosynthesis is the process by which green plants...'},
    {date: '1 week ago', question: 'Solve x^2 - 4 = 0', snippet: 'Using the quadratic formula, we find x = ±2...'},
  ]);
  
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Function to handle AI feature usage
  const handleAIFeatureUse = React.useCallback(async (featureType: string, queryData: any, responsesUsed: number = 1) => {
    if (!user) {
      window.location.href = '/login';
      return false;
    }

    if (!isProUser) {
      setShowUpgradeModal(true);
      return false;
    }

    if (responsesRemaining < responsesUsed) {
      setShowUpgradeModal(true);
      return false;
    }

    return true;
  }, [user, isProUser, responsesRemaining]);

  // Function to handle tab switching with AI feature checks
  const handleTabSwitch = (tabId: string) => {
    // Check if feature requires PRO
    if (requiresProAccess(tabId) && !isProUser) {
      if (!user) {
        window.location.href = '/login';
        return;
      }
      setShowUpgradeModal(true);
      return;
    }

    setActiveTab(tabId);
    setComponentStates(prev => ({
      ...prev,
      [tabId]: true
    }));
  };

  // Handle URL parameters for direct tab navigation
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    
    if (tabParam) {
      // Map tab parameters to actual tab IDs
      const tabMapping: { [key: string]: string } = {
        'document-summarizer': 'document-summarizer',
        'study-planner': 'study-planner',
        'content-writer': 'content-writer',
        'ai-tutor': 'ai-tutor'
      };
      
      const targetTab = tabMapping[tabParam] || tabParam;
      
      // Check if the tab exists in our tools
      const tabExists = tools.some(tool => tool.id === targetTab);
      
      if (tabExists) {
        handleTabSwitch(targetTab);
      }
    }
  }, [location.search]);

  useEffect(() => {
    // Add custom CSS for scrollbar hiding and 3D perspective
    const style = document.createElement('style');
    style.textContent = `
      .custom-hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .custom-hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      .perspective {
        perspective: 1000px;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const buttonVariants = {
    hover: { scale: 1.05, boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.1)" },
    tap: { scale: 0.98 }
  };
  
  const glowVariants = {
    pulse: {
      boxShadow: [
        "0 0 5px rgba(80, 200, 120, 0.5)",
        "0 0 15px rgba(80, 200, 120, 0.8)",
        "0 0 5px rgba(80, 200, 120, 0.5)"
      ],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse" as const
      }
    }
  };

  const tools = [
    { id: 'upload', name: t('aiStudy.uploadHomework'), icon: AiOutlineUpload, requiresPro: true },
    { id: 'ai-tutor', name: t('aiStudy.aiTutor'), icon: FiMessageSquare, requiresPro: true },
    { id: 'mistake-checker', name: t('aiStudy.mistakeChecker'), icon: FiCheckCircle, requiresPro: true },
    { id: 'study-planner', name: t('aiStudy.studyPlanner'), icon: FiCalendar, requiresPro: false },
    { id: 'flashcards', name: t('aiStudy.flashcards'), icon: FiLayers, requiresPro: true },
    { id: 'content-writer', name: t('aiStudy.contentWriter'), icon: FiPenTool, requiresPro: true },
    { id: 'citation-generator', name: t('aiStudy.citationGenerator'), icon: FiBookOpen, requiresPro: true },
    { id: 'document-summarizer', name: t('aiStudy.documentSummarizer'), icon: AiOutlineSearch, requiresPro: true },
  ];

  // Function to get unique colors for each tool
  const getToolColors = (toolId: string, isActive: boolean) => {
    const colorThemes = {
      'upload': {
        text: isActive 
          ? 'bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent'
          : 'bg-gradient-to-r from-cyan-400 via-blue-400 to-teal-400 bg-clip-text text-transparent',
        icon: isActive 
          ? 'bg-blue-500/20 text-blue-400'
          : 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400',
        hoverText: 'group-hover:from-cyan-300 group-hover:via-blue-300 group-hover:to-teal-300',
        hoverIcon: 'group-hover:from-cyan-400/30 group-hover:to-blue-400/30'
      },
      'ai-tutor': {
        text: isActive 
          ? 'bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent'
          : 'bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent',
        icon: isActive 
          ? 'bg-blue-500/20 text-blue-400'
          : 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 text-emerald-400',
        hoverText: 'group-hover:from-emerald-300 group-hover:via-green-300 group-hover:to-teal-300',
        hoverIcon: 'group-hover:from-emerald-400/30 group-hover:to-green-400/30'
      },
      'mistake-checker': {
        text: isActive 
          ? 'bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent'
          : 'bg-gradient-to-r from-red-400 via-pink-400 to-rose-400 bg-clip-text text-transparent',
        icon: isActive 
          ? 'bg-blue-500/20 text-blue-400'
          : 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-400',
        hoverText: 'group-hover:from-red-300 group-hover:via-pink-300 group-hover:to-rose-300',
        hoverIcon: 'group-hover:from-red-400/30 group-hover:to-pink-400/30'
      },
      'study-planner': {
        text: isActive 
          ? 'bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent'
          : 'bg-gradient-to-r from-purple-400 via-violet-400 to-indigo-400 bg-clip-text text-transparent',
        icon: isActive 
          ? 'bg-blue-500/20 text-blue-400'
          : 'bg-gradient-to-r from-purple-500/20 to-violet-500/20 text-purple-400',
        hoverText: 'group-hover:from-purple-300 group-hover:via-violet-300 group-hover:to-indigo-300',
        hoverIcon: 'group-hover:from-purple-400/30 group-hover:to-violet-400/30'
      },
      'flashcards': {
        text: isActive 
          ? 'bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent'
          : 'bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 bg-clip-text text-transparent',
        icon: isActive 
          ? 'bg-blue-500/20 text-blue-400'
          : 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 text-yellow-400',
        hoverText: 'group-hover:from-yellow-300 group-hover:via-amber-300 group-hover:to-orange-300',
        hoverIcon: 'group-hover:from-yellow-400/30 group-hover:to-amber-400/30'
      },
      'content-writer': {
        text: isActive 
          ? 'bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent'
          : 'bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent',
        icon: isActive 
          ? 'bg-blue-500/20 text-blue-400'
          : 'bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-400',
        hoverText: 'group-hover:from-orange-300 group-hover:via-red-300 group-hover:to-pink-300',
        hoverIcon: 'group-hover:from-orange-400/30 group-hover:to-red-400/30'
      },
      'citation-generator': {
        text: isActive 
          ? 'bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent'
          : 'bg-gradient-to-r from-indigo-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent',
        icon: isActive 
          ? 'bg-blue-500/20 text-blue-400'
          : 'bg-gradient-to-r from-indigo-500/20 to-blue-500/20 text-indigo-400',
        hoverText: 'group-hover:from-indigo-300 group-hover:via-blue-300 group-hover:to-cyan-300',
        hoverIcon: 'group-hover:from-indigo-400/30 group-hover:to-blue-400/30'
      },
      'document-summarizer': {
        text: isActive 
          ? 'bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent'
          : 'bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent',
        icon: isActive 
          ? 'bg-blue-500/20 text-blue-400'
          : 'bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-400',
        hoverText: 'group-hover:from-violet-300 group-hover:via-purple-300 group-hover:to-fuchsia-300',
        hoverIcon: 'group-hover:from-violet-400/30 group-hover:to-purple-400/30'
      }
    };
    
    return colorThemes[toolId as keyof typeof colorThemes] || colorThemes['upload'];
  };

  // Function to generate flashcards from notes using AI
  const generateFlashcardsFromNotes = async () => {
    try {
      const response = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer sk-0d874843ff2542c38940adcbeb2b2cc4',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "qwen-vl-max",
          messages: [
            {
              role: "system",
              content: [
                {
                  type: "text", 
                  text: "You are an AI assistant that creates educational flashcards. Generate 5-10 high-quality flashcards based on common study topics. Each flashcard should have a clear question and a comprehensive answer. Format your response as a JSON array with objects containing 'question' and 'answer' fields."
                }
              ]
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Please generate educational flashcards covering important concepts in science, mathematics, history, and literature. Make sure the questions are clear and the answers are informative but concise."
                }
              ]
            }
          ],
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Try to parse the JSON response
      try {
        const flashcards = JSON.parse(content);
        console.log('Generated flashcards:', flashcards);
        // You can add logic here to update the flashcards in the FlashcardComponent
        return flashcards;
      } catch (parseError) {
        console.error('Failed to parse flashcards JSON:', parseError);
        throw new Error('Failed to parse generated flashcards');
      }
    } catch (error) {
      console.error('Error generating flashcards from notes:', error);
      throw error;
    }
  };

  // Function to generate flashcards from PDF using AI
  const generateFlashcardsFromPDF = async (file: File) => {
    try {
      // Convert PDF to images (page by page)
      const formData = new FormData();
      formData.append('file', file);
      
      // For now, we'll extract text from the PDF and then generate flashcards
      // In a real implementation, you'd convert PDF to images first
      
      const response = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer sk-0d874843ff2542c38940adcbeb2b2cc4',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "qwen-vl-max",
          messages: [
            {
              role: "system",
              content: [
                {
                  type: "text", 
                  text: "You are an AI assistant that creates educational flashcards from document content. Generate 5-10 high-quality flashcards based on the provided content. Each flashcard should have a clear question and a comprehensive answer. Format your response as a JSON array with objects containing 'question' and 'answer' fields."
                }
              ]
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Please generate educational flashcards from this PDF document: ${file.name}. Create questions that test understanding of key concepts, definitions, and important facts from the document.`
                }
              ]
            }
          ],
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      try {
        const flashcards = JSON.parse(content);
        console.log('Generated flashcards from PDF:', flashcards);
        return flashcards;
      } catch (parseError) {
        console.error('Failed to parse flashcards JSON:', parseError);
        throw new Error('Failed to parse generated flashcards');
      }
    } catch (error) {
      console.error('Error generating flashcards from PDF:', error);
      throw error;
    }
  };

  // Scroll to top on initial load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-teal-900">
      <Header />
      
      {/* Modern Hero Section */}
      <motion.div
        className="relative overflow-hidden pt-20 pb-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-teal-400/20 to-emerald-500/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-500/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative container mx-auto px-4 text-center">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-teal-400 bg-clip-text text-transparent mb-6">
              {t('aiStudy.aiStudyAssistant')}
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-2xl mx-auto">
              {t('aiStudy.enhanceYourLearning')}
            </p>
            
            {/* Quick Stats */}
            <motion.div
              className="w-full max-w-6xl mx-auto"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              {/* Mobile Layout: 3 items in first row, 2 items in second row */}
              <div className="grid grid-cols-3 gap-2 mb-2 md:hidden">
                <div className="bg-slate-700/30 backdrop-blur-sm rounded-lg py-3 px-2 border border-white/10">
                  <div className="text-sm font-bold text-cyan-400">{t('aiStudy.aiPowered')}</div>
                  <div className="text-xs text-slate-300 mt-1">{t('aiStudy.solutions')}</div>
                </div>
                <div className="bg-slate-700/30 backdrop-blur-sm rounded-lg py-3 px-2 border border-white/10">
                  <div className="text-sm font-bold text-blue-400">{t('aiStudy.instant')}</div>
                  <div className="text-xs text-slate-300 mt-1">{t('aiStudy.analysis')}</div>
                </div>
                <div className="bg-slate-700/30 backdrop-blur-sm rounded-lg py-3 px-2 border border-white/10">
                  <div className="text-sm font-bold text-teal-400">{t('aiStudy.stepByStep')}</div>
                  <div className="text-xs text-slate-300 mt-1">{t('aiStudy.explanations')}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 md:hidden">
                <div className="bg-slate-700/30 backdrop-blur-sm rounded-lg py-3 px-2 border border-white/10">
                  <div className="text-sm font-bold text-emerald-400">{t('aiStudy.personalised')}</div>
                  <div className="text-xs text-slate-300 mt-1">{t('aiStudy.learning')}</div>
                </div>
                <div className="bg-slate-700/30 backdrop-blur-sm rounded-lg py-3 px-2 border border-white/10">
                  <div className="text-sm font-bold text-purple-400">{t('aiStudy.mindmap')}</div>
                  <div className="text-xs text-slate-300 mt-1">{t('aiStudy.summarizer')}</div>
                </div>
              </div>
              
              {/* Desktop Layout: All 5 items in one row */}
              <div className="hidden md:grid md:grid-cols-5 gap-4 text-center">
                <div className="bg-slate-700/30 backdrop-blur-sm rounded-lg py-4 px-4 border border-white/10">
                  <div className="text-lg lg:text-xl font-bold text-cyan-400">{t('aiStudy.aiPowered')}</div>
                  <div className="text-xs lg:text-sm text-slate-300 mt-1">{t('aiStudy.solutions')}</div>
                </div>
                <div className="bg-slate-700/30 backdrop-blur-sm rounded-lg py-4 px-4 border border-white/10">
                  <div className="text-lg lg:text-xl font-bold text-blue-400">{t('aiStudy.instant')}</div>
                  <div className="text-xs lg:text-sm text-slate-300 mt-1">{t('aiStudy.analysis')}</div>
                </div>
                <div className="bg-slate-700/30 backdrop-blur-sm rounded-lg py-4 px-4 border border-white/10">
                  <div className="text-lg lg:text-xl font-bold text-teal-400">{t('aiStudy.stepByStep')}</div>
                  <div className="text-xs lg:text-sm text-slate-300 mt-1">{t('aiStudy.explanations')}</div>
                </div>
                <div className="bg-slate-700/30 backdrop-blur-sm rounded-lg py-4 px-4 border border-white/10">
                  <div className="text-lg lg:text-xl font-bold text-emerald-400">{t('aiStudy.personalised')}</div>
                  <div className="text-xs lg:text-sm text-slate-300 mt-1">{t('aiStudy.learning')}</div>
                </div>
                <div className="bg-slate-700/30 backdrop-blur-sm rounded-lg py-4 px-4 border border-white/10">
                  <div className="text-lg lg:text-xl font-bold text-purple-400">{t('aiStudy.mindmap')}</div>
                  <div className="text-xs lg:text-sm text-slate-300 mt-1">{t('aiStudy.summarizer')}</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div
        className="flex-grow pb-16"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
      >
        <div className="container mx-auto px-4">
          <motion.div 
            className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden max-w-7xl mx-auto shadow-2xl"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Tabs - Mobile Version */}
            <div className="md:hidden">
              <div className="flex justify-between items-center bg-gradient-to-r from-slate-800/90 to-blue-800/90 backdrop-blur-sm text-white p-4 rounded-t-3xl border-b border-white/10">
                <span className="font-medium flex items-center">
                  <IconComponent icon={tools.find(tool => tool.id === activeTab)?.icon || FiEdit} className="mr-2 h-5 w-5" />
                  {tools.find(tool => tool.id === activeTab)?.name}
                  {/* Show PRO badge for active tab if it requires PRO and user is not PRO */}
                  {tools.find(tool => tool.id === activeTab)?.requiresPro && !isProUser && (
                    <div className="ml-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-1">
                      <IconComponent icon={FaCrown} className="h-3 w-3 text-white" />
                    </div>
                  )}
                </span>
                <motion.button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 bg-white/10 rounded-lg border border-white/20"
                >
                  <IconComponent icon={FiMenu} className="h-6 w-6" />
                </motion.button>
              </div>
              
              {mobileMenuOpen && (
                <motion.div 
                  className="bg-slate-800/95 backdrop-blur-sm shadow-lg absolute z-30 w-full border-b border-white/10"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {tools.map((tool) => (
                    <motion.button
                      key={tool.id}
                      onClick={() => {
                        handleTabSwitch(tool.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left p-4 transition-all duration-300 relative ${
                        activeTab === tool.id
                          ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 shadow-lg'
                          : 'bg-slate-700/30 hover:bg-slate-600/40 border border-slate-600/50'
                      } ${tool.requiresPro && !isProUser ? 'opacity-70' : ''}`}
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full relative ${getToolColors(tool.id, activeTab === tool.id).icon}`}>
                          <IconComponent icon={tool.icon} className="h-5 w-5" />
                          {/* PRO Badge for mobile tabs */}
                          {tool.requiresPro && !isProUser && (
                            <ProBadge size="sm" position="top-right" className="scale-75" />
                          )}
                        </div>
                        <div className="flex-1">
                          <span className={`font-medium text-sm ${getToolColors(tool.id, activeTab === tool.id).text}`}>
                            {tool.name}
                          </span>
                          {tool.requiresPro && !isProUser && (
                            <div className="text-xs text-yellow-400 mt-1">PRO Required</div>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Tabs - Desktop Version */}
            <div className="hidden md:flex bg-gradient-to-r from-slate-800/90 to-blue-800/90 backdrop-blur-sm text-white rounded-t-3xl overflow-hidden border-b border-white/10">
              {tools.map((tool) => (
                <motion.button
                  key={tool.id}
                  className={`flex items-center py-4 px-6 flex-1 justify-center transition-all duration-300 group relative overflow-visible ${
                    activeTab === tool.id
                      ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 border-b-2 border-blue-400'
                      : 'hover:bg-white/10'
                  } ${tool.requiresPro && !isProUser ? 'opacity-70' : ''}`}
                  onClick={() => handleTabSwitch(tool.id)}
                  whileHover={{ backgroundColor: activeTab === tool.id ? "rgba(59, 130, 246, 0.2)" : "rgba(255, 255, 255, 0.1)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className={`p-1.5 rounded-full mr-2 relative ${getToolColors(tool.id, activeTab === tool.id).icon} ${
                    activeTab !== tool.id ? getToolColors(tool.id, false).hoverIcon : ''
                  }`}>
                    <IconComponent icon={tool.icon} className="h-4 w-4" />
                    {/* PRO Badge for desktop tabs - improved positioning */}
                    {tool.requiresPro && !isProUser && (
                      <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-1 border border-white/20 shadow-lg z-20">
                        <IconComponent icon={FaCrown} className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  <span className={`font-medium text-sm ${getToolColors(tool.id, activeTab === tool.id).text} ${
                    activeTab !== tool.id ? getToolColors(tool.id, false).hoverText : ''
                  }`}>
                    {tool.name}
                  </span>
                </motion.button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-8 bg-slate-900/20 backdrop-blur-sm">
              
              {/* Upload Homework */}
              <div className={activeTab === 'upload' ? 'block' : 'hidden'}>
                {componentStates['upload'] && <UploadHomeworkComponent />}
              </div>

              {/* AI Tutor */}
              <div className={activeTab === 'ai-tutor' ? 'block' : 'hidden'}>
                {componentStates['ai-tutor'] && <AiTutorChatComponent />}
              </div>

              {/* Mistake Checker */}
              <div className={activeTab === 'mistake-checker' ? 'block' : 'hidden'}>
                {componentStates['mistake-checker'] && <CheckMistakesComponent />}
              </div>

              {/* Content Writer */}
              <div className={activeTab === 'content-writer' ? 'block' : 'hidden'}>
                {componentStates['content-writer'] && <ContentWriterComponent />}
              </div>

              {/* Citation Generator */}
              <div className={activeTab === 'citation-generator' ? 'block' : 'hidden'}>
                {componentStates['citation-generator'] && <CitationGenerator />}
              </div>

              {/* Study Planner */}
              <div className={activeTab === 'study-planner' ? 'block' : 'hidden'}>
                {componentStates['study-planner'] && <StudyPlannerComponent />}
              </div>

              {/* Flashcards */}
              <div className={activeTab === 'flashcards' ? 'block' : 'hidden'}>
                {componentStates['flashcards'] && (
                  <FlashcardComponent 
                    onGenerateFromNotes={generateFlashcardsFromNotes}
                    onGenerateFromPDF={generateFlashcardsFromPDF}
                  />
                )}
              </div>

              {/* Document Summarizer */}
              <div className={activeTab === 'document-summarizer' ? 'block' : 'hidden'}>
                {componentStates['document-summarizer'] && <DocumentSummarizerComponent />}
              </div>
              
            </div>
          </motion.div>

          {/* Upgrade Modal */}
          <AnimatePresence>
            {showUpgradeModal && (
              <motion.div
                className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowUpgradeModal(false)}
              >
                <motion.div
                  className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 max-w-md w-full border border-white/10 shadow-2xl"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="text-center">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <IconComponent icon={FaCrown} className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">{t('aiStudy.upgradeModal.title')}</h3>
                    <p className="text-slate-300 mb-6">
                      {!isProUser 
                        ? t('aiStudy.upgradeModal.notProDescription')
                        : t('aiStudy.upgradeModal.limitReachedDescription')
                      }
                    </p>
                    
                    <div className="space-y-3 mb-6 text-left">
                      <div className="flex items-center space-x-3">
                        <div className="bg-green-500/20 p-1 rounded-full">
                          <IconComponent icon={FaCheck} className="w-4 h-4 text-green-400" />
                        </div>
                        <span className="text-slate-300">{t('aiStudy.upgradeModal.features.generousAllowance')}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="bg-green-500/20 p-1 rounded-full">
                          <IconComponent icon={FaCheck} className="h-3 w-3 text-green-400" />
                        </div>
                        <span className="text-slate-300">{t('aiStudy.upgradeModal.features.advancedTutoring')}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="bg-green-500/20 p-1 rounded-full">
                          <IconComponent icon={FaCheck} className="h-3 w-3 text-green-400" />
                        </div>
                        <span className="text-slate-300">{t('aiStudy.upgradeModal.features.contentGeneration')}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="bg-green-500/20 p-1 rounded-full">
                          <IconComponent icon={FaCheck} className="h-3 w-3 text-green-400" />
                        </div>
                        <span className="text-slate-300">{t('aiStudy.upgradeModal.features.prioritySupport')}</span>
                      </div>
                    </div>

                    <div className="flex space-x-3">
                      <motion.button
                        onClick={() => setShowUpgradeModal(false)}
                        className="flex-1 bg-slate-700 text-white py-3 px-4 rounded-xl font-semibold hover:bg-slate-600 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {t('aiStudy.upgradeModal.maybeLaterBtn')}
                      </motion.button>
                      <motion.button
                        onClick={() => {
                          setShowUpgradeModal(false);
                          window.location.href = '/subscription';
                        }}
                        className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white py-3 px-4 rounded-xl font-semibold hover:from-yellow-400 hover:to-orange-400 transition-all"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {t('aiStudy.upgradeModal.upgradeNowBtn')}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Features Section */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-10"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div 
              className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 backdrop-blur-lg p-6 rounded-xl border border-cyan-400/30 hover:border-cyan-400/50 transition-all duration-300"
              variants={itemVariants}
              whileHover={{ y: -5, boxShadow: "0 25px 50px rgba(6, 182, 212, 0.15)" }}
            >
              <div className="bg-gradient-to-br from-cyan-400/20 to-blue-500/20 w-14 h-14 rounded-full flex items-center justify-center mb-4 border border-cyan-400/30">
                <IconComponent icon={AiOutlineUpload} className="h-7 w-7 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-cyan-400 mb-2">{t('aiStudy.instantHomeworkHelpTitle')}</h3>
              <p className="text-slate-300">{t('aiStudy.instantHomeworkHelpDescription')}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleTabSwitch('upload')}
                className="mt-4 text-cyan-400 font-medium flex items-center text-sm hover:text-cyan-300 transition-colors"
              >
                {t('aiStudy.tryNowBtn')}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
            </motion.div>
            
            <motion.div 
              className="bg-gradient-to-br from-orange-500/20 to-red-600/20 backdrop-blur-lg p-6 rounded-xl border border-orange-400/30 hover:border-orange-400/50 transition-all duration-300"
              variants={itemVariants}
              whileHover={{ y: -5, boxShadow: "0 25px 50px rgba(251, 146, 60, 0.15)" }}
            >
              <div className="bg-gradient-to-br from-orange-400/20 to-red-500/20 w-14 h-14 rounded-full flex items-center justify-center mb-4 border border-orange-400/30">
                <IconComponent icon={AiOutlineEdit} className="h-7 w-7 text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-orange-400 mb-2">{t('aiStudy.aiContentWriterTitle')}</h3>
              <p className="text-slate-300">{t('aiStudy.aiContentWriterDescription')}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleTabSwitch('content-writer')}
                className="mt-4 text-orange-400 font-medium flex items-center text-sm hover:text-orange-300 transition-colors"
              >
                {t('aiStudy.startWritingBtn')}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
            </motion.div>
            
            <motion.div 
              className="bg-gradient-to-br from-emerald-500/20 to-teal-600/20 backdrop-blur-lg p-6 rounded-xl border border-emerald-400/30 hover:border-emerald-400/50 transition-all duration-300"
              variants={itemVariants}
              whileHover={{ y: -5, boxShadow: "0 25px 50px rgba(20, 184, 166, 0.15)" }}
            >
              <div className="bg-gradient-to-br from-emerald-400/20 to-teal-500/20 w-14 h-14 rounded-full flex items-center justify-center mb-4 border border-emerald-400/30">
                <IconComponent icon={AiOutlineRobot} className="h-7 w-7 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-emerald-400 mb-2">{t('aiStudy.aiTutorChatTitle')}</h3>
              <p className="text-slate-300">{t('aiStudy.aiTutorChatDescription')}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleTabSwitch('ai-tutor')}
                className="mt-4 text-emerald-400 font-medium flex items-center text-sm hover:text-emerald-300 transition-colors"
              >
                {t('aiStudy.chatNowBtn')}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
            </motion.div>
            
            <motion.div 
              className="bg-gradient-to-br from-purple-500/20 to-indigo-600/20 backdrop-blur-lg p-6 rounded-xl border border-purple-400/30 hover:border-purple-400/50 transition-all duration-300"
              variants={itemVariants}
              whileHover={{ y: -5, boxShadow: "0 25px 50px rgba(147, 51, 234, 0.15)" }}
            >
              <div className="bg-gradient-to-br from-purple-400/20 to-indigo-500/20 w-14 h-14 rounded-full flex items-center justify-center mb-4 border border-purple-400/30">
                <IconComponent icon={FiCalendar} className="h-7 w-7 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-purple-400 mb-2">{t('aiStudy.smartStudyPlannerTitle')}</h3>
              <p className="text-slate-300 mb-4">{t('aiStudy.smartStudyPlannerDescription')}</p>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleTabSwitch('study-planner')}
                  className="flex-1 text-purple-400 font-medium flex items-center justify-center text-sm hover:text-purple-300 transition-colors bg-purple-500/10 hover:bg-purple-500/20 px-4 py-2 rounded-lg border border-purple-500/30"
                >
                  {t('aiStudy.useHereBtn')}
                  <IconComponent icon={FiArrowRight} className="h-4 w-4 ml-1" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/dashboard?tab=study-planner')}
                  className="flex-1 text-purple-400 font-medium flex items-center justify-center text-sm hover:text-purple-300 transition-colors px-4 py-2 rounded-lg border border-purple-500/30 hover:bg-purple-500/10"
                >
                  {t('aiStudy.gotoPlannerBtn')}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </motion.button>
              </div>
            </motion.div>
            
            <motion.div 
              className="bg-gradient-to-br from-red-500/20 to-pink-600/20 backdrop-blur-lg p-6 rounded-xl border border-red-400/30 hover:border-red-400/50 transition-all duration-300"
              variants={itemVariants}
              whileHover={{ y: -5, boxShadow: "0 25px 50px rgba(239, 68, 68, 0.15)" }}
            >
              <div className="bg-gradient-to-br from-red-400/20 to-pink-500/20 w-14 h-14 rounded-full flex items-center justify-center mb-4 border border-red-400/30">
                <IconComponent icon={FiCheckCircle} className="h-7 w-7 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-red-400 mb-2">{t('aiStudy.mistakeChecker')}</h3>
              <p className="text-slate-300">{t('aiStudy.mistakeCheckerDescription')}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleTabSwitch('mistake-checker')}
                className="mt-4 text-red-400 font-medium flex items-center text-sm hover:text-red-300 transition-colors"
              >
                {t('aiStudy.checkMistakesBtn')}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
            </motion.div>
            
            <motion.div 
              className="bg-gradient-to-br from-yellow-500/20 to-amber-600/20 backdrop-blur-lg p-6 rounded-xl border border-yellow-400/30 hover:border-yellow-400/50 transition-all duration-300"
              variants={itemVariants}
              whileHover={{ y: -5, boxShadow: "0 25px 50px rgba(245, 158, 11, 0.15)" }}
            >
              <div className="bg-gradient-to-br from-yellow-400/20 to-amber-500/20 w-14 h-14 rounded-full flex items-center justify-center mb-4 border border-yellow-400/30">
                <IconComponent icon={FiLayers} className="h-7 w-7 text-yellow-400" />
              </div>
              <h3 className="text-xl font-semibold text-yellow-400 mb-2">{t('aiStudy.flashcards')}</h3>
              <p className="text-slate-300">{t('aiStudy.flashcardsDescription')}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleTabSwitch('flashcards')}
                className="mt-4 text-yellow-400 font-medium flex items-center text-sm hover:text-yellow-300 transition-colors"
              >
                {t('aiStudy.createFlashcardsBtn')}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
            </motion.div>
            
            <motion.div 
              className="bg-gradient-to-br from-indigo-500/20 to-violet-600/20 backdrop-blur-lg p-6 rounded-xl border border-indigo-400/30 hover:border-indigo-400/50 transition-all duration-300"
              variants={itemVariants}
              whileHover={{ y: -5, boxShadow: "0 25px 50px rgba(99, 102, 241, 0.15)" }}
            >
              <div className="bg-gradient-to-br from-indigo-400/20 to-violet-500/20 w-14 h-14 rounded-full flex items-center justify-center mb-4 border border-indigo-400/30">
                <IconComponent icon={FiBookOpen} className="h-7 w-7 text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold text-indigo-400 mb-2">{t('aiStudy.citationGenerator')}</h3>
              <p className="text-slate-300">{t('aiStudy.citationGeneratorDescription')}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleTabSwitch('citation-generator')}
                className="mt-4 text-indigo-400 font-medium flex items-center text-sm hover:text-indigo-300 transition-colors"
              >
                {t('aiStudy.generateCitationsBtn')}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
            </motion.div>
            
            <motion.div 
              className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-lg p-6 rounded-xl border border-green-400/30 hover:border-green-400/50 transition-all duration-300"
              variants={itemVariants}
              whileHover={{ y: -5, boxShadow: "0 25px 50px rgba(34, 197, 94, 0.15)" }}
            >
              <div className="bg-gradient-to-br from-green-400/20 to-emerald-500/20 w-14 h-14 rounded-full flex items-center justify-center mb-4 border border-green-400/30">
                <IconComponent icon={AiOutlineSearch} className="h-7 w-7 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-green-400 mb-2">{t('aiStudy.documentSummarizer')}</h3>
              <p className="text-slate-300">{t('aiStudy.documentSummarizerDescription')}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleTabSwitch('document-summarizer')}
                className="mt-4 text-green-400 font-medium flex items-center text-sm hover:text-green-300 transition-colors"
              >
                {t('aiStudy.summarizeDocumentsBtn')}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Floating Action Button */}
          <motion.button
            className="fixed bottom-5 right-5 md:right-20 z-40 bg-gradient-to-r from-orange-500 to-red-500 text-white p-4 rounded-full shadow-2xl flex items-center justify-center backdrop-blur-sm border border-orange-400/30"
            whileHover={{ 
              scale: 1.1, 
              boxShadow: "0 20px 40px rgba(251, 146, 60, 0.4)",
              backgroundColor: "rgba(251, 146, 60, 0.9)"
            }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onClick={() => handleTabSwitch('ai-tutor')}
          >
            <IconComponent icon={AiOutlineRobot} className="h-6 w-6" />
            <span className="ml-2 font-medium hidden md:inline">{t('aiStudy.ask_ai_tutor')}</span>
          </motion.button>
        </div>
      </motion.div>
      <Footer />
    </div>
  );
};

export default AiStudy; 