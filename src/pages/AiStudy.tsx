import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AiOutlineUpload, AiOutlineBulb, AiOutlineRobot, AiOutlineHistory, AiOutlineSearch, AiOutlineEdit } from 'react-icons/ai';
import { FiBookOpen, FiClock, FiCalendar, FiCheck, FiBookmark, FiEdit, FiMenu, FiCheckCircle, FiMessageSquare, FiLayers, FiPenTool, FiTrendingUp } from 'react-icons/fi';
import IconComponent from '../components/ui/IconComponent';
import { useAuth } from '../utils/AuthContext';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import CitationGenerator from '../components/ui/CitationGenerator';
import { ContentWriterComponent } from '../components/ui/ContentWriterComponent';
import CheckMistakesComponent from '../components/ui/CheckMistakesComponent';
import AiTutorChatComponent from '../components/ui/AiTutorChatComponent';
import UploadHomeworkComponent from '../components/ui/UploadHomeworkComponent';
import StudyPlannerComponent from '../components/ui/StudyPlannerComponent';
import FlashcardComponent from '../components/ui/FlashcardComponent';
import { useLanguage } from '../utils/LanguageContext';

const AiStudy: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('upload');
  
  // Component state preservation
  const [componentStates, setComponentStates] = useState<{[key: string]: boolean}>({
    'upload': true,
    'ai-tutor': false,
    'mistake-checker': false,
    'study-planner': false,
    'flashcards': false,
    'content-writer': false,
    'citation-generator': false,
    'progress-tracker': false,
  });

  const [history, setHistory] = useState<{date: string, question: string, snippet: string}[]>([
    {date: '2 days ago', question: 'Explain photosynthesis', snippet: 'Photosynthesis is the process by which green plants...'},
    {date: '1 week ago', question: 'Solve x^2 - 4 = 0', snippet: 'Using the quadratic formula, we find x = ±2...'},
  ]);
  
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

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
    { id: 'upload', name: t('aiStudy.uploadHomework'), icon: AiOutlineUpload },
    { id: 'ai-tutor', name: t('aiStudy.aiTutor'), icon: FiMessageSquare },
    { id: 'mistake-checker', name: t('aiStudy.mistakeChecker'), icon: FiCheckCircle },
    { id: 'study-planner', name: t('aiStudy.studyPlanner'), icon: FiCalendar },
    { id: 'flashcards', name: t('aiStudy.flashcards'), icon: FiLayers },
    { id: 'content-writer', name: t('aiStudy.contentWriter'), icon: FiPenTool },
    { id: 'citation-generator', name: t('aiStudy.citationGenerator'), icon: FiBookOpen },
    { id: 'progress-tracker', name: t('aiStudy.progressTracker'), icon: FiTrendingUp },
  ];

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

  // Function to handle tab switching with state preservation
  const handleTabSwitch = (tabId: string) => {
    setActiveTab(tabId);
    setComponentStates(prev => ({
      ...prev,
      [tabId]: true
    }));
  };

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
              AI Study Assistant
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Enhance your learning with AI-powered tools
            </p>
            
            {/* Quick Stats */}
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <div className="bg-slate-700/30 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <div className="text-2xl font-bold text-cyan-400">AI-Powered</div>
                <div className="text-sm text-slate-300">Solutions</div>
              </div>
              <div className="bg-slate-700/30 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <div className="text-2xl font-bold text-blue-400">Instant</div>
                <div className="text-sm text-slate-300">Analysis</div>
              </div>
              <div className="bg-slate-700/30 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <div className="text-2xl font-bold text-teal-400">Step-by-Step</div>
                <div className="text-sm text-slate-300">Explanations</div>
              </div>
              <div className="bg-slate-700/30 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <div className="text-2xl font-bold text-emerald-400">Personalized</div>
                <div className="text-sm text-slate-300">Learning</div>
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
                  className="bg-slate-800/95 backdrop-blur-sm shadow-lg absolute z-50 w-full border-b border-white/10"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {tools.map((tool) => (
                    <motion.button
                      key={tool.id}
                      className={`flex items-center py-3 px-4 w-full text-left ${
                        activeTab === tool.id 
                          ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 font-medium border-l-4 border-cyan-400' 
                          : 'text-slate-300 hover:bg-white/5'
                      }`}
                      onClick={() => {
                        handleTabSwitch(tool.id);
                        setMobileMenuOpen(false);
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <IconComponent icon={tool.icon} className="h-5 w-5 mr-3" />
                      <span className="font-medium">{tool.name}</span>
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
                  className={`flex items-center py-4 px-6 flex-1 justify-center transition-all duration-300 ${
                    activeTab === tool.id
                      ? 'bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-cyan-400 font-medium border-b-2 border-cyan-400'
                      : 'hover:bg-white/10 text-slate-300'
                  }`}
                  onClick={() => handleTabSwitch(tool.id)}
                  whileHover={{ backgroundColor: activeTab === tool.id ? "rgba(6, 182, 212, 0.2)" : "rgba(255, 255, 255, 0.1)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  <IconComponent icon={tool.icon} className="h-5 w-5 mr-2" />
                  <span className="font-medium">{tool.name}</span>
                </motion.button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-8 bg-slate-900/20 backdrop-blur-sm">
              <div className={activeTab === 'upload' ? 'block' : 'hidden'}>
                {componentStates['upload'] && (
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                    <UploadHomeworkComponent />
                  </div>
                )}
              </div>

              <div className={activeTab === 'ai-tutor' ? 'block' : 'hidden'}>
                {componentStates['ai-tutor'] && (
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                    <AiTutorChatComponent />
                  </div>
                )}
              </div>

              <div className={activeTab === 'mistake-checker' ? 'block' : 'hidden'}>
                {componentStates['mistake-checker'] && (
                  <motion.div variants={containerVariants} className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                    <h2 className="text-2xl font-semibold text-cyan-400 mb-6">Check Mistakes</h2>
                    <CheckMistakesComponent />
                  </motion.div>
                )}
              </div>

              <div className={activeTab === 'content-writer' ? 'block' : 'hidden'}>
                {componentStates['content-writer'] && (
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                    <ContentWriterComponent />
                  </div>
                )}
              </div>

              <div className={activeTab === 'citation-generator' ? 'block' : 'hidden'}>
                {componentStates['citation-generator'] && (
                  <motion.div variants={containerVariants} className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                    <h2 className="text-2xl font-semibold text-cyan-400 mb-6">Citation Generator</h2>
                    <CitationGenerator />
                  </motion.div>
                )}
              </div>

              <div className={activeTab === 'study-planner' ? 'block' : 'hidden'}>
                {componentStates['study-planner'] && (
                  <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                    <StudyPlannerComponent />
                  </div>
                )}
              </div>

              <div className={activeTab === 'flashcards' ? 'block' : 'hidden'}>
                {componentStates['flashcards'] && (
                  <FlashcardComponent 
                    onGenerateFromNotes={generateFlashcardsFromNotes}
                    onGenerateFromPDF={generateFlashcardsFromPDF}
                  />
                )}
              </div>

              <div className={activeTab === 'progress-tracker' ? 'block' : 'hidden'}>
                {componentStates['progress-tracker'] && (
                  <motion.div variants={containerVariants} className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                    <h2 className="text-2xl font-semibold text-cyan-400 mb-6">{t('aiStudy.progressTracker')}</h2>
                    <div className="bg-slate-700/50 backdrop-blur-sm rounded-lg shadow-lg p-6 border border-white/10">
                      <p className="text-slate-300">Track your learning progress and achievements.</p>
                      
                      {/* Progress Overview */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                        <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 backdrop-blur-sm rounded-lg p-4 text-white border border-cyan-500/30">
                          <h3 className="text-lg font-semibold mb-2 text-cyan-400">Study Sessions</h3>
                          <p className="text-2xl font-bold">24</p>
                          <p className="text-sm opacity-90 text-slate-300">This month</p>
                        </div>
                        
                        <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-sm rounded-lg p-4 text-white border border-orange-500/30">
                          <h3 className="text-lg font-semibold mb-2 text-orange-400">Problems Solved</h3>
                          <p className="text-2xl font-bold">156</p>
                          <p className="text-sm opacity-90 text-slate-300">Total</p>
                        </div>
                        
                        <div className="bg-gradient-to-r from-emerald-500/20 to-green-500/20 backdrop-blur-sm rounded-lg p-4 text-white border border-emerald-500/30">
                          <h3 className="text-lg font-semibold mb-2 text-emerald-400">Accuracy Rate</h3>
                          <p className="text-2xl font-bold">87%</p>
                          <p className="text-sm opacity-90 text-slate-300">Average</p>
                        </div>
                      </div>
                      
                      {/* Recent Activity */}
                      <div className="mt-8">
                        <h3 className="text-lg font-semibold text-slate-200 mb-4">Recent Activity</h3>
                        <div className="space-y-3">
                          <div className="flex items-center p-3 bg-slate-600/30 backdrop-blur-sm rounded-lg border border-white/10">
                            <div className="w-2 h-2 bg-cyan-500 rounded-full mr-3"></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-200">Completed Math homework</p>
                              <p className="text-xs text-slate-400">2 hours ago</p>
                            </div>
                          </div>
                          <div className="flex items-center p-3 bg-slate-600/30 backdrop-blur-sm rounded-lg border border-white/10">
                            <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-200">Used AI Tutor for Physics</p>
                              <p className="text-xs text-slate-400">5 hours ago</p>
                            </div>
                          </div>
                          <div className="flex items-center p-3 bg-slate-600/30 backdrop-blur-sm rounded-lg border border-white/10">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3"></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-200">Created 5 new flashcards</p>
                              <p className="text-xs text-slate-400">1 day ago</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Features Section */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-10"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div 
              className="bg-white/10 backdrop-blur-lg p-6 rounded-xl border border-white/20 hover:border-cyan-400/50 transition-all duration-300"
              variants={itemVariants}
              whileHover={{ y: -5, boxShadow: "0 25px 50px rgba(6, 182, 212, 0.15)" }}
            >
              <div className="bg-gradient-to-br from-cyan-400/20 to-blue-500/20 w-14 h-14 rounded-full flex items-center justify-center mb-4 border border-cyan-400/30">
                <IconComponent icon={AiOutlineUpload} className="h-7 w-7 text-cyan-400" />
              </div>
              <h3 className="text-xl font-semibold text-cyan-400 mb-2">{t('aiStudy.instantHomeworkHelpTitle')}</h3>
              <p className="text-slate-300">Upload your homework images and get instant AI-powered solutions with step-by-step explanations</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('upload')}
                className="mt-4 text-cyan-400 font-medium flex items-center text-sm hover:text-cyan-300 transition-colors"
              >
                {t('aiStudy.tryNowBtn')}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
            </motion.div>
            
            <motion.div 
              className="bg-white/10 backdrop-blur-lg p-6 rounded-xl border border-white/20 hover:border-orange-400/50 transition-all duration-300"
              variants={itemVariants}
              whileHover={{ y: -5, boxShadow: "0 25px 50px rgba(251, 146, 60, 0.15)" }}
            >
              <div className="bg-gradient-to-br from-orange-400/20 to-red-500/20 w-14 h-14 rounded-full flex items-center justify-center mb-4 border border-orange-400/30">
                <IconComponent icon={AiOutlineEdit} className="h-7 w-7 text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-orange-400 mb-2">{t('aiStudy.aiContentWriterTitle')}</h3>
              <p className="text-slate-300">Generate high-quality essays, reports, and creative content with AI assistance and plagiarism checking</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('content-writer')}
                className="mt-4 text-orange-400 font-medium flex items-center text-sm hover:text-orange-300 transition-colors"
              >
                {t('aiStudy.startWritingBtn')}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
            </motion.div>
            
            <motion.div 
              className="bg-white/10 backdrop-blur-lg p-6 rounded-xl border border-white/20 hover:border-teal-400/50 transition-all duration-300"
              variants={itemVariants}
              whileHover={{ y: -5, boxShadow: "0 25px 50px rgba(20, 184, 166, 0.15)" }}
            >
              <div className="bg-gradient-to-br from-teal-400/20 to-emerald-500/20 w-14 h-14 rounded-full flex items-center justify-center mb-4 border border-teal-400/30">
                <IconComponent icon={AiOutlineRobot} className="h-7 w-7 text-teal-400" />
              </div>
              <h3 className="text-xl font-semibold text-teal-400 mb-2">{t('aiStudy.aiTutorChatTitle')}</h3>
              <p className="text-slate-300">Interactive AI tutor available 24/7 for personalized learning support across all subjects</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('ai-tutor')}
                className="mt-4 text-teal-400 font-medium flex items-center text-sm hover:text-teal-300 transition-colors"
              >
                {t('aiStudy.chatNowBtn')}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
            </motion.div>
            
            <motion.div 
              className="bg-white/10 backdrop-blur-lg p-6 rounded-xl border border-white/20 hover:border-blue-400/50 transition-all duration-300"
              variants={itemVariants}
              whileHover={{ y: -5, boxShadow: "0 25px 50px rgba(59, 130, 246, 0.15)" }}
            >
              <div className="bg-gradient-to-br from-blue-400/20 to-indigo-500/20 w-14 h-14 rounded-full flex items-center justify-center mb-4 border border-blue-400/30">
                <IconComponent icon={FiCalendar} className="h-7 w-7 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-blue-400 mb-2">Smart Study Planner</h3>
              <p className="text-slate-300">AI-powered study scheduling with personalized recommendations and progress tracking</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('study-planner')}
                className="mt-4 text-blue-400 font-medium flex items-center text-sm hover:text-blue-300 transition-colors"
              >
                Plan Your Studies
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
            onClick={() => setActiveTab('ai-tutor')}
          >
            <IconComponent icon={AiOutlineRobot} className="h-6 w-6" />
            <span className="ml-2 font-medium hidden md:inline">{t('ask_ai_tutor')}</span>
          </motion.button>
        </div>
      </motion.div>
      <Footer />
    </div>
  );
};

export default AiStudy; 