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
  
  const [flashcards, setFlashcards] = useState<{question: string, answer: string, mastered: boolean}[]>([
    {question: 'What is photosynthesis?', answer: 'The process by which green plants and some other organisms use sunlight to synthesize nutrients from carbon dioxide and water.', mastered: false},
    {question: 'What is Newton\'s First Law?', answer: 'An object at rest stays at rest and an object in motion stays in motion with the same speed and in the same direction unless acted upon by an unbalanced force.', mastered: true},
    {question: 'What is the Pythagorean theorem?', answer: 'In a right-angled triangle, the square of the hypotenuse equals the sum of squares of the other two sides: a² + b² = c².', mastered: false},
  ]);

  const [studyTasks, setStudyTasks] = useState<{task: string, subject: string, date: string, completed: boolean}[]>([
    {task: 'Complete math homework', subject: 'Mathematics', date: '2023-06-25', completed: false},
    {task: 'Prepare for biology test', subject: 'Biology', date: '2023-06-27', completed: false},
    {task: 'Read chapter 5 for literature', subject: 'Literature', date: '2023-06-24', completed: true},
  ]);

  const [newTask, setNewTask] = useState({task: '', subject: '', date: ''});
  const [currentFlashcard, setCurrentFlashcard] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
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

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.task.trim() || !newTask.subject.trim() || !newTask.date) return;
    
    setStudyTasks(prev => [
      ...prev,
      {...newTask, completed: false}
    ]);
    
    setNewTask({task: '', subject: '', date: ''});
  };

  const handleTaskToggle = (index: number) => {
    setStudyTasks(prev => 
      prev.map((task, i) => 
        i === index ? {...task, completed: !task.completed} : task
      )
    );
  };

  const handleNextFlashcard = () => {
    setShowAnswer(false);
    setCurrentFlashcard(prev => 
      prev === flashcards.length - 1 ? 0 : prev + 1
    );
  };

  const handlePrevFlashcard = () => {
    setShowAnswer(false);
    setCurrentFlashcard(prev => 
      prev === 0 ? flashcards.length - 1 : prev - 1
    );
  };

  const toggleFlashcardMastery = () => {
    setFlashcards(prev => 
      prev.map((card, i) => 
        i === currentFlashcard ? {...card, mastered: !card.mastered} : card
      )
    );
  };

  // For creating new flashcards
  const [newFlashcard, setNewFlashcard] = useState({ question: '', answer: '' });

  const handleAddFlashcard = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newFlashcard.question.trim() || !newFlashcard.answer.trim()) return;
    
    // Add the new flashcard
    setFlashcards(prev => [
      ...prev,
      { ...newFlashcard, mastered: false }
    ]);
    
    // Reset form
    setNewFlashcard({ question: '', answer: '' });
    
    // Optionally, switch to the newly added card
    setCurrentFlashcard(flashcards.length);
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
    <div className="flex flex-col min-h-screen overflow-hidden">
      <Header />
      <motion.div
        className="flex-grow bg-gradient-to-b from-gray-50 to-gray-100 py-16"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-8"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold text-teal-800 mb-3">
              {t('aiStudy.title')}
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('aiStudy.subtitle')}
            </p>
            
            {/* Content Writer Button */}
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.1)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab('content-writer')}
              className="mt-4 inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg shadow-md font-medium"
            >
              <IconComponent icon={AiOutlineEdit} className="mr-2 h-5 w-5" />
              {t('aiStudy.contentWriter')}
            </motion.button>
          </motion.div>

          <motion.div 
            className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-7xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Tabs - Mobile Version */}
            <div className="md:hidden">
              <div className="flex justify-between items-center bg-gradient-to-r from-teal-700 to-teal-900 text-white p-4 rounded-t-2xl">
                <span className="font-medium flex items-center">
                  <IconComponent icon={tools.find(tool => tool.id === activeTab)?.icon || FiEdit} className="mr-2 h-5 w-5" />
                  {tools.find(tool => tool.id === activeTab)?.name}
                </span>
                <motion.button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  whileTap={{ scale: 0.95 }}
                  className="p-2 bg-white/10 rounded-lg"
                >
                  <IconComponent icon={FiMenu} className="h-6 w-6" />
                </motion.button>
              </div>
              
              {mobileMenuOpen && (
                <motion.div 
                  className="bg-white shadow-lg rounded-b-lg absolute z-50 w-full"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  {tools.map((tool) => (
                    <motion.button
                      key={tool.id}
                      className={`flex items-center py-3 px-4 w-full text-left ${
                        activeTab === tool.id ? 'bg-orange-50 text-orange-600 font-medium' : 'text-gray-700 hover:bg-gray-50'
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
            <div className="hidden md:flex bg-gradient-to-r from-teal-700 to-teal-900 text-white rounded-t-2xl overflow-hidden">
              {tools.map((tool) => (
                <motion.button
                  key={tool.id}
                  className={`flex items-center py-4 px-6 flex-1 justify-center ${
                    activeTab === tool.id
                      ? 'bg-teal-600 text-white font-medium border-b-2 border-orange-500'
                      : 'hover:bg-white/10'
                  }`}
                  onClick={() => handleTabSwitch(tool.id)}
                  whileHover={{ backgroundColor: activeTab === tool.id ? "rgba(20, 184, 166, 0.8)" : "rgba(255, 255, 255, 0.1)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  <IconComponent icon={tool.icon} className="h-5 w-5 mr-2" />
                  <span className="font-medium">{tool.name}</span>
                </motion.button>
              ))}
            </div>

            {/* Tab Content - All components are mounted but hidden when not active */}
            <div className="p-6">
              <div className={activeTab === 'upload' ? 'block' : 'hidden'}>
                {componentStates['upload'] && <UploadHomeworkComponent />}
              </div>

              <div className={activeTab === 'ai-tutor' ? 'block' : 'hidden'}>
                {componentStates['ai-tutor'] && <AiTutorChatComponent />}
              </div>

              <div className={activeTab === 'mistake-checker' ? 'block' : 'hidden'}>
                {componentStates['mistake-checker'] && (
                  <motion.div variants={containerVariants}>
                    <h2 className="text-2xl font-semibold text-teal-800 mb-6">Check Mistakes</h2>
                    <CheckMistakesComponent />
                  </motion.div>
                )}
              </div>

              <div className={activeTab === 'content-writer' ? 'block' : 'hidden'}>
                {componentStates['content-writer'] && <ContentWriterComponent />}
              </div>

              <div className={activeTab === 'citation-generator' ? 'block' : 'hidden'}>
                {componentStates['citation-generator'] && (
                  <motion.div variants={containerVariants}>
                    <h2 className="text-2xl font-semibold text-teal-800 mb-6">Citation Generator</h2>
                    <CitationGenerator />
                  </motion.div>
                )}
              </div>

              <div className={activeTab === 'study-planner' ? 'block' : 'hidden'}>
                {componentStates['study-planner'] && (
                  <motion.div variants={containerVariants}>
                    <h2 className="text-2xl font-semibold text-teal-800 mb-6">Study Planner</h2>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      {/* Add new task */}
                      <motion.div 
                        variants={itemVariants}
                        className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
                      >
                        <h3 className="text-lg font-medium text-teal-800 mb-4 flex items-center">
                          <IconComponent icon={FiCalendar} className="mr-2" /> Add New Study Task
                        </h3>
                        
                        <form onSubmit={handleAddTask}>
                          <div className="mb-4">
                            <label className="block text-gray-700 mb-1 text-sm font-medium">
                              Task Description
                            </label>
                            <input
                              type="text"
                              value={newTask.task}
                              onChange={(e) => setNewTask({...newTask, task: e.target.value})}
                              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                              placeholder="What do you need to study?"
                            />
                          </div>
                          
                          <div className="mb-4">
                            <label className="block text-gray-700 mb-1 text-sm font-medium">
                              Subject
                            </label>
                            <input
                              type="text"
                              value={newTask.subject}
                              onChange={(e) => setNewTask({...newTask, subject: e.target.value})}
                              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                              placeholder="e.g. Math, Science, History"
                            />
                          </div>
                          
                          <div className="mb-4">
                            <label className="block text-gray-700 mb-1 text-sm font-medium">
                              Due Date
                            </label>
                            <input
                              type="date"
                              value={newTask.date}
                              onChange={(e) => setNewTask({...newTask, date: e.target.value})}
                              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                            />
                          </div>
                          
                          <motion.button
                            type="submit"
                            className="w-full py-2 bg-gradient-to-r from-teal-600 to-teal-700 rounded-lg text-white font-medium shadow-md hover:shadow-lg"
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                          >
                            Add to Study Plan
                          </motion.button>
                        </form>
                      </motion.div>
                      
                      {/* Task List */}
                      <motion.div 
                        variants={itemVariants}
                        className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm lg:col-span-2"
                      >
                        <h3 className="text-lg font-medium text-teal-800 mb-4 flex items-center">
                          <IconComponent icon={FiClock} className="mr-2" /> Your Study Schedule
                        </h3>
                        
                        {studyTasks.length > 0 ? (
                          <div className="space-y-3">
                            {studyTasks.map((task, index) => (
                              <motion.div
                                key={index}
                                variants={itemVariants}
                                className={`border rounded-lg p-3 flex items-start justify-between ${
                                  task.completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'
                                }`}
                                whileHover={{ y: -2, boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)" }}
                              >
                                <div className="flex items-start flex-1">
                                  <motion.button
                                    className={`mt-1 mr-3 w-5 h-5 flex-shrink-0 rounded-full border ${
                                      task.completed ? 'bg-teal-500 border-teal-500' : 'border-gray-300'
                                    }`}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => handleTaskToggle(index)}
                                  >
                                    {task.completed && (
                                      <IconComponent icon={FiCheck} className="text-white w-full h-full p-0.5" />
                                    )}
                                  </motion.button>
                                  <div className="flex-1">
                                    <p className={`font-medium ${task.completed ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
                                      {task.task}
                                    </p>
                                    <div className="flex items-center mt-1 text-sm text-gray-500">
                                      <span className="bg-teal-100 text-teal-700 px-2 py-1 rounded-full text-xs mr-2">
                                        {task.subject}
                                      </span>
                                      <span>{task.date}</span>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <IconComponent icon={FiCalendar} className="mx-auto text-4xl mb-2" />
                            <p>No study tasks yet</p>
                            <p className="text-sm mt-1">Add your first task to get started</p>
                          </div>
                        )}
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className={activeTab === 'flashcards' ? 'block' : 'hidden'}>
                {componentStates['flashcards'] && (
                  <motion.div variants={containerVariants}>
                    <h2 className="text-2xl font-semibold text-teal-800 mb-6">Flashcards</h2>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Flashcard Viewer */}
                      <motion.div 
                        variants={itemVariants}
                        className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
                      >
                        <h3 className="text-lg font-medium text-teal-800 mb-4 flex items-center">
                          <IconComponent icon={FiLayers} className="mr-2" /> Study Cards
                        </h3>
                        
                        {flashcards.length > 0 ? (
                          <div className="space-y-4">
                            <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl p-6 min-h-[200px] flex flex-col justify-center">
                              <div className="text-center">
                                <div className="mb-4">
                                  <span className="text-sm text-teal-600 font-medium">
                                    Card {currentFlashcard + 1} of {flashcards.length}
                                  </span>
                                  {flashcards[currentFlashcard].mastered && (
                                    <span className="ml-2 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                                      Mastered
                                    </span>
                                  )}
                                </div>
                                
                                <div className="mb-6">
                                  <p className="text-lg font-medium text-gray-800 mb-4">
                                    {flashcards[currentFlashcard].question}
                                  </p>
                                  
                                  {showAnswer && (
                                    <motion.div
                                      initial={{ opacity: 0, y: 20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      className="bg-white rounded-lg p-4 border border-teal-200"
                                    >
                                      <p className="text-gray-700">
                                        {flashcards[currentFlashcard].answer}
                                      </p>
                                    </motion.div>
                                  )}
                                </div>
                                
                                <div className="flex justify-center space-x-3">
                                  {!showAnswer ? (
                                    <motion.button
                                      variants={buttonVariants}
                                      whileHover="hover"
                                      whileTap="tap"
                                      onClick={() => setShowAnswer(true)}
                                      className="bg-teal-600 text-white px-6 py-2 rounded-lg font-medium"
                                    >
                                      Show Answer
                                    </motion.button>
                                  ) : (
                                    <div className="flex space-x-2">
                                      <motion.button
                                        variants={buttonVariants}
                                        whileHover="hover"
                                        whileTap="tap"
                                        onClick={toggleFlashcardMastery}
                                        className={`px-4 py-2 rounded-lg font-medium ${
                                          flashcards[currentFlashcard].mastered
                                            ? 'bg-gray-200 text-gray-700'
                                            : 'bg-green-600 text-white'
                                        }`}
                                      >
                                        {flashcards[currentFlashcard].mastered ? 'Unmark' : 'Mark as Mastered'}
                                      </motion.button>
                                      
                                      <motion.button
                                        variants={buttonVariants}
                                        whileHover="hover"
                                        whileTap="tap"
                                        onClick={() => setShowAnswer(false)}
                                        className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium"
                                      >
                                        Hide Answer
                                      </motion.button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <motion.button
                                variants={buttonVariants}
                                whileHover="hover"
                                whileTap="tap"
                                onClick={handlePrevFlashcard}
                                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Previous
                              </motion.button>
                              
                              <motion.button
                                variants={buttonVariants}
                                whileHover="hover"
                                whileTap="tap"
                                onClick={handleNextFlashcard}
                                className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center"
                              >
                                Next
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                              </motion.button>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <IconComponent icon={FiLayers} className="mx-auto text-4xl mb-2" />
                            <p>No flashcards yet</p>
                            <p className="text-sm mt-1">Create your first flashcard to start studying</p>
                          </div>
                        )}
                      </motion.div>
                      
                      {/* Create New Flashcards */}
                      <motion.div 
                        variants={itemVariants}
                        className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
                      >
                        <h3 className="text-lg font-medium text-teal-800 mb-4 flex items-center">
                          <IconComponent icon={FiBookmark} className="mr-2" /> Create Flashcards
                        </h3>
                        
                        <div className="mb-4">
                          <button 
                            className="w-full py-3 bg-teal-600 text-white rounded-lg flex items-center justify-center font-medium"
                          >
                            <IconComponent icon={AiOutlineBulb} className="mr-2" />
                            Generate from Notes
                          </button>
                        </div>
                        
                        <div className="text-center relative my-4">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                          </div>
                          <span className="relative bg-white px-2 text-sm text-gray-500">or create manually</span>
                        </div>
                        
                        <form onSubmit={handleAddFlashcard}>
                          <div className="mb-3">
                            <label className="block text-gray-700 mb-1 text-sm font-medium">
                              Question
                            </label>
                            <textarea
                              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none h-20"
                              placeholder="Enter your question here"
                              value={newFlashcard.question}
                              onChange={(e) => setNewFlashcard({...newFlashcard, question: e.target.value})}
                            />
                          </div>
                          
                          <div className="mb-4">
                            <label className="block text-gray-700 mb-1 text-sm font-medium">
                              Answer
                            </label>
                            <textarea
                              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none h-20"
                              placeholder="Enter the answer here"
                              value={newFlashcard.answer}
                              onChange={(e) => setNewFlashcard({...newFlashcard, answer: e.target.value})}
                            />
                          </div>
                          
                          <motion.button
                            type="submit"
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                            className="w-full py-2 bg-gradient-to-r from-teal-600 to-teal-700 rounded-lg text-white font-medium shadow-md hover:shadow-lg"
                          >
                            Add Flashcard
                          </motion.button>
                        </form>
                      </motion.div>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className={activeTab === 'progress-tracker' ? 'block' : 'hidden'}>
                {componentStates['progress-tracker'] && (
                  <motion.div variants={containerVariants}>
                    <h2 className="text-2xl font-semibold text-teal-800 mb-6">{t('aiStudy.progressTracker')}</h2>
                    <div className="bg-white rounded-lg shadow-lg p-6">
                      <p className="text-gray-600">Track your learning progress and achievements.</p>
                      
                      {/* Progress Overview */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                        <div className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg p-4 text-white">
                          <h3 className="text-lg font-semibold mb-2">Study Sessions</h3>
                          <p className="text-2xl font-bold">24</p>
                          <p className="text-sm opacity-90">This month</p>
                        </div>
                        
                        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
                          <h3 className="text-lg font-semibold mb-2">Problems Solved</h3>
                          <p className="text-2xl font-bold">156</p>
                          <p className="text-sm opacity-90">Total</p>
                        </div>
                        
                        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
                          <h3 className="text-lg font-semibold mb-2">Accuracy Rate</h3>
                          <p className="text-2xl font-bold">87%</p>
                          <p className="text-sm opacity-90">Average</p>
                        </div>
                      </div>
                      
                      {/* Recent Activity */}
                      <div className="mt-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
                        <div className="space-y-3">
                          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                            <div className="w-2 h-2 bg-teal-500 rounded-full mr-3"></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800">Completed Math homework</p>
                              <p className="text-xs text-gray-500">2 hours ago</p>
                            </div>
                          </div>
                          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                            <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800">Used AI Tutor for Physics</p>
                              <p className="text-xs text-gray-500">5 hours ago</p>
                            </div>
                          </div>
                          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800">Created 5 new flashcards</p>
                              <p className="text-xs text-gray-500">1 day ago</p>
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
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300"
              variants={itemVariants}
              whileHover={{ y: -5, boxShadow: "0 15px 30px rgba(0, 0, 0, 0.1)" }}
            >
              <div className="bg-teal-100 w-14 h-14 rounded-full flex items-center justify-center mb-4">
                <IconComponent icon={AiOutlineUpload} className="h-7 w-7 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-teal-800 mb-2">Instant Homework Help</h3>
              <p className="text-gray-600">{t('instant_homework_help')}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('upload')}
                className="mt-4 text-teal-600 font-medium flex items-center text-sm"
              >
                {t('try_now')}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
            </motion.div>
            
            <motion.div 
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300"
              variants={itemVariants}
              whileHover={{ y: -5, boxShadow: "0 15px 30px rgba(0, 0, 0, 0.1)" }}
            >
              <div className="bg-orange-100 w-14 h-14 rounded-full flex items-center justify-center mb-4">
                <IconComponent icon={AiOutlineEdit} className="h-7 w-7 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-teal-800 mb-2">AI Content Writer</h3>
              <p className="text-gray-600">{t('ai_content_writer')}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('content-writer')}
                className="mt-4 text-orange-500 font-medium flex items-center text-sm"
              >
                {t('start_writing')}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
            </motion.div>
            
            <motion.div 
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300"
              variants={itemVariants}
              whileHover={{ y: -5, boxShadow: "0 15px 30px rgba(0, 0, 0, 0.1)" }}
            >
              <div className="bg-teal-100 w-14 h-14 rounded-full flex items-center justify-center mb-4">
                <IconComponent icon={AiOutlineRobot} className="h-7 w-7 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-teal-800 mb-2">AI Tutor Chat</h3>
              <p className="text-gray-600">{t('ai_tutor_chat')}</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('ai-tutor')}
                className="mt-4 text-teal-600 font-medium flex items-center text-sm"
              >
                {t('chat_now')}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
            </motion.div>
            
            <motion.div 
              className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300"
              variants={itemVariants}
              whileHover={{ y: -5, boxShadow: "0 15px 30px rgba(0, 0, 0, 0.1)" }}
            >
              <div className="bg-blue-100 w-14 h-14 rounded-full flex items-center justify-center mb-4">
                <IconComponent icon={FiCalendar} className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-teal-800 mb-2">Study Planner</h3>
              <p className="text-gray-600">Organize your study schedule with AI-powered task management and smart recommendations</p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab('study-planner')}
                className="mt-4 text-blue-600 font-medium flex items-center text-sm"
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
            className="fixed bottom-5 right-5 md:right-20 z-40 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-full shadow-lg flex items-center justify-center"
            whileHover={{ scale: 1.1, boxShadow: "0 8px 20px rgba(0, 0, 0, 0.2)" }}
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