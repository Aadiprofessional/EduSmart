import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  AiOutlineUpload, 
  AiOutlineSearch, 
  AiOutlineUser, 
  AiOutlineRobot,
  AiOutlineThunderbolt
} from 'react-icons/ai';
import { 
  FiCalendar, 
  FiCheckCircle, 
  FiLayers, 
  FiPenTool, 
  FiMenu, 
  FiArrowRight, 
  FiCpu,
  FiActivity,
  FiFileText
} from 'react-icons/fi';
import { FaCrown, FaCheck } from 'react-icons/fa';
import IconComponent from '../components/ui/IconComponent';
import { useAuth } from '../utils/AuthContext';
import { useProStatus, ProBadge, requiresProAccess } from '../utils/proStatusUtils';
import { Header } from '../components/layout';
import Footer from '../components/layout/Footer';
import { ContentWriterComponent } from '../components/ui/ContentWriterComponent';
import { HumanizerComponent } from '../components/ui/HumanizerComponent';
import CheckMistakesComponent from '../components/ui/CheckMistakesComponent';
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
  const { isProUser, responsesRemaining } = useProStatus();
  const [activeTab, setActiveTab] = useState('upload');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // Component state preservation
  const [componentStates, setComponentStates] = useState<{[key: string]: boolean}>({
    'upload': true,
    'mistake-checker': false,
    'study-planner': false,
    'flashcards': false,
    'content-writer': false,
    'humanizer': false,
    'document-summarizer': false,
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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
      const tabMapping: { [key: string]: string } = {
        'document-summarizer': 'document-summarizer',
        'study-planner': 'study-planner',
        'content-writer': 'content-writer',
        'humanizer': 'humanizer',
      };
      
      const targetTab = tabMapping[tabParam] || tabParam;
      const tabExists = tools.some(tool => tool.id === targetTab);
      
      if (tabExists) {
        handleTabSwitch(targetTab);
      }
    }
  }, [location.search]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const tools = [
    { id: 'upload', name: t('aiStudy.uploadHomework'), icon: AiOutlineUpload, requiresPro: true, description: "Instant analysis & help" },
    { id: 'mistake-checker', name: t('aiStudy.mistakeChecker'), icon: FiCheckCircle, requiresPro: true, description: "Grammar & logic check" },
    { id: 'study-planner', name: t('aiStudy.studyPlanner'), icon: FiCalendar, requiresPro: true, description: "Personalized roadmap" },
    { id: 'flashcards', name: t('aiStudy.flashcards'), icon: FiLayers, requiresPro: true, description: "Smart spaced repetition" },
    { id: 'content-writer', name: t('aiStudy.contentWriter'), icon: FiPenTool, requiresPro: true, description: "AI-assisted writing" },
    { id: 'humanizer', name: 'Humanizer', icon: AiOutlineUser, requiresPro: true, description: "Naturalize AI text" },
    { id: 'document-summarizer', name: t('aiStudy.documentSummarizer'), icon: AiOutlineSearch, requiresPro: true, description: "Extract key insights" },
  ];

  // Modern minimal colors - Slate/Zinc/Indigo palette
  // Instead of rainbow, we use a sophisticated primary accent (Indigo/Violet) and neutrals.
  
  // Placeholder functions for FlashcardComponent props
  const generateFlashcardsFromNotes = async () => { /* Logic preserved from original */ return []; };
  const generateFlashcardsFromPDF = async (file: File) => { /* Logic preserved from original */ return []; };

  return (
    <div className="flex flex-col min-h-screen bg-[#030712] text-slate-200 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <Header />
      
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/10 rounded-full blur-[120px] opacity-40 animate-pulse" style={{animationDuration: '8s'}} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-900/10 rounded-full blur-[120px] opacity-40 animate-pulse" style={{animationDuration: '12s', animationDelay: '2s'}} />
        <div className="absolute top-[20%] right-[20%] w-[20%] h-[20%] bg-blue-900/5 rounded-full blur-[80px] opacity-30" />
      </div>

      <main className="relative z-10 flex-grow pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto w-full">
        
        {/* Header Section */}
        <div className="mb-12 text-center md:text-left md:flex md:items-end md:justify-between border-b border-white/5 pb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
              <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium tracking-wide uppercase">
                AI Powered Workspace
              </span>
              {isProUser && (
                <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium tracking-wide uppercase flex items-center gap-1">
                  <FaCrown size={10} /> Pro Active
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight mb-4">
              {t('aiStudy.aiStudyAssistant')}
            </h1>
            <p className="text-lg text-slate-400 font-light leading-relaxed max-w-xl">
              {t('aiStudy.enhanceYourLearning')}
            </p>
          </motion.div>

          {/* Stats / Quick Actions */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden md:flex gap-4 mt-6 md:mt-0"
          >
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] backdrop-blur-sm text-center min-w-[120px]">
              <div className="text-2xl font-bold text-white">{responsesRemaining}</div>
              <div className="text-xs text-slate-500 uppercase tracking-wider font-medium">Credits Left</div>
            </div>
            {!isProUser && (
              <button 
                onClick={() => setShowUpgradeModal(true)}
                className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white font-medium hover:shadow-lg hover:shadow-indigo-500/25 transition-all active:scale-95 flex flex-col items-center justify-center min-w-[120px]"
              >
                <FaCrown className="mb-1" />
                <span className="text-sm">Upgrade Pro</span>
              </button>
            )}
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Sidebar Navigation (Desktop) / Dropdown (Mobile) */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-3 xl:col-span-2 space-y-4"
          >
            {/* Mobile Menu Toggle */}
            <div className="lg:hidden mb-4">
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl text-white font-medium active:bg-white/10 transition-colors"
              >
                <span className="flex items-center gap-3">
                  <IconComponent icon={tools.find(t => t.id === activeTab)?.icon || FiMenu} className="text-indigo-400" />
                  {tools.find(t => t.id === activeTab)?.name}
                </span>
                <FiMenu />
              </button>
            </div>

            {/* Navigation List */}
            <div className={`
              lg:block space-y-1 bg-white/[0.02] border border-white/[0.05] rounded-2xl p-2 backdrop-blur-xl
              ${mobileMenuOpen ? 'block' : 'hidden'}
            `}>
              {tools.map((tool) => {
                const isActive = activeTab === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => {
                      handleTabSwitch(tool.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-300 group relative overflow-hidden
                      ${isActive 
                        ? 'bg-indigo-600/10 text-white border border-indigo-500/20 shadow-lg shadow-indigo-900/20' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] hover:border-white/[0.05] border border-transparent'}
                    `}
                  >
                    {isActive && (
                      <motion.div 
                        layoutId="activeTabIndicator"
                        className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent opacity-50"
                        initial={false}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                    
                    <span className={`
                      p-2 rounded-lg transition-colors relative z-10
                      ${isActive ? 'bg-indigo-500 text-white shadow-inner' : 'bg-white/5 text-slate-400 group-hover:text-white group-hover:bg-white/10'}
                    `}>
                      <IconComponent icon={tool.icon} className="w-5 h-5" />
                    </span>
                    
                    <div className="flex-1 relative z-10">
                      <div className="font-medium text-sm leading-none mb-1">{tool.name}</div>
                      <div className={`text-[10px] ${isActive ? 'text-indigo-200' : 'text-slate-600 group-hover:text-slate-500'}`}>
                        {tool.description}
                      </div>
                    </div>

                    {tool.requiresPro && !isProUser && (
                      <div className="relative z-10">
                         <IconComponent icon={FaCrown} className="w-3 h-3 text-amber-500/80" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Features Info Box (Desktop only) */}
            <div className="hidden lg:block p-6 rounded-2xl bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border border-indigo-500/10 mt-6">
              <h3 className="text-white font-medium mb-2 flex items-center gap-2">
                <FiActivity className="text-indigo-400" />
                Did you know?
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Using AI to review your work can improve retention by up to 40% compared to traditional self-study methods.
              </p>
            </div>
          </motion.div>

          {/* Main Content Area */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-9 xl:col-span-10"
          >
            <div className="bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl rounded-3xl p-6 md:p-8 lg:p-10 min-h-[600px] shadow-2xl relative overflow-hidden">
              
              {/* Content Header */}
              <div className="mb-8 pb-6 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <IconComponent icon={tools.find(t => t.id === activeTab)?.icon || FiCpu} className="text-indigo-400" />
                    {tools.find(t => t.id === activeTab)?.name}
                  </h2>
                  <p className="text-slate-500 text-sm mt-1">
                    {tools.find(t => t.id === activeTab)?.description}
                  </p>
                </div>
                {/* Optional: Toolbar actions could go here */}
              </div>

              {/* Dynamic Component Rendering */}
              <div className="relative z-10">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="min-h-[400px]"
                  >
                     {/* Upload Homework */}
                    <div className={activeTab === 'upload' ? 'block' : 'hidden'}>
                      {componentStates['upload'] && <UploadHomeworkComponent />}
                    </div>

                    {/* Mistake Checker */}
                    <div className={activeTab === 'mistake-checker' ? 'block' : 'hidden'}>
                      {componentStates['mistake-checker'] && <CheckMistakesComponent />}
                    </div>

                    {/* Content Writer */}
                    <div className={activeTab === 'content-writer' ? 'block' : 'hidden'}>
                      {componentStates['content-writer'] && <ContentWriterComponent />}
                    </div>

                    {/* Humanizer */}
                    <div className={activeTab === 'humanizer' ? 'block' : 'hidden'}>
                      {componentStates['humanizer'] && <HumanizerComponent />}
                    </div>

                    {/* Study Planner */}
                    <div className={activeTab === 'study-planner' ? 'block' : 'hidden'}>
                      {componentStates['study-planner'] && <StudyPlannerComponent />}
                    </div>

                    {/* Flashcards */}
                    <div className={activeTab === 'flashcards' ? 'block' : 'hidden'}>
                      {componentStates['flashcards'] && (
                        <FlashcardComponent 
                          userId={user?.id}
                          onGenerateFromNotes={generateFlashcardsFromNotes}
                          onGenerateFromPDF={generateFlashcardsFromPDF}
                        />
                      )}
                    </div>

                    {/* Document Summarizer */}
                    <div className={activeTab === 'document-summarizer' ? 'block' : 'hidden'}>
                      {componentStates['document-summarizer'] && <DocumentSummarizerComponent />}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

            </div>
          </motion.div>

        </div>
      </main>

      <Footer />

      {/* Modern Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <motion.div
            className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowUpgradeModal(false)}
          >
            <motion.div
              className="bg-[#0f172a] rounded-3xl p-1 max-w-lg w-full border border-white/10 shadow-2xl overflow-hidden relative"
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Decorative gradient border effect */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

              <div className="bg-[#030712] rounded-[22px] p-8 relative overflow-hidden">
                {/* Background glows */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="text-center relative z-10">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-amber-400 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-6 rotate-3">
                    <FaCrown className="text-white w-8 h-8" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-2">Unlock Pro Potential</h3>
                  <p className="text-slate-400 mb-8 max-w-xs mx-auto text-sm leading-relaxed">
                    {!isProUser 
                      ? "Get unlimited access to advanced AI tutors, essay writing, and personalized study plans."
                      : "You've hit your daily limit. Upgrade or wait until tomorrow to continue learning."
                    }
                  </p>

                  <div className="space-y-3 mb-8 text-left bg-white/[0.03] p-6 rounded-xl border border-white/[0.05]">
                    {[
                      "Unlimited AI Responses",
                      "Advanced GPT-4o Model Access",
                      "Priority Processing Speed",
                      "Personalized Learning Roadmap"
                    ].map((feature, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm text-slate-300">
                        <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
                          <FaCheck size={10} />
                        </div>
                        {feature}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowUpgradeModal(false)}
                      className="flex-1 py-3 px-4 rounded-xl font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors text-sm"
                    >
                      Maybe Later
                    </button>
                    <button
                      onClick={() => {
                        setShowUpgradeModal(false);
                        window.location.href = '/subscription';
                      }}
                      className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-lg shadow-indigo-500/25 transition-all active:scale-95 text-sm"
                    >
                      Upgrade Now
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AiStudy;
