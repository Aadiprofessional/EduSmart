import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AiOutlineUpload, AiOutlineBulb, AiOutlineRobot, AiOutlineHistory, AiOutlineFileText, AiOutlineCamera, AiOutlineFullscreen, AiOutlineSearch } from 'react-icons/ai';
import { FiBookOpen, FiClock, FiCalendar, FiCheck, FiBookmark, FiEdit, FiMenu } from 'react-icons/fi';
import IconComponent from '../components/ui/IconComponent';
import { useAuth } from '../utils/AuthContext';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import CitationGenerator from '../components/ui/CitationGenerator';

const AiStudy: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('upload');
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState('');
  const [chatMessages, setChatMessages] = useState<{role: string, content: string}[]>([
    {role: 'assistant', content: 'Hi there! I\'m your AI study assistant. How can I help you with your homework today?'}
  ]);
  const [chatInput, setChatInput] = useState('');
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

  // New state for check mistakes functionality
  const [documentPages, setDocumentPages] = useState<string[]>([
    'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80',
    'https://images.unsplash.com/photo-1516979187457-637abb4f9353?ixlib=rb-1.2.1&auto=format&fit=crop&w=634&q=80',
  ]);
  const [currentPage, setCurrentPage] = useState(0);
  const [mistakes, setMistakes] = useState<{id: number, line: string, correction: string, type: string}[]>([
    {id: 1, line: "The study were conducted in 2020.", correction: "The study was conducted in 2020.", type: "Grammar"},
    {id: 2, line: "They're were four participants.", correction: "There were four participants.", type: "Spelling"},
    {id: 3, line: "According to Smith et al", correction: "Add proper citation: (Smith et al., 2019)", type: "Citation"},
  ]);
  const [fullScreenSolution, setFullScreenSolution] = useState(false);
  const [fullScreenDocument, setFullScreenDocument] = useState(false);
  
  const [newTask, setNewTask] = useState({task: '', subject: '', date: ''});
  const [currentFlashcard, setCurrentFlashcard] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showFullScreen, setShowFullScreen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      
      // If we're in check mistakes tab, process the file for mistakes checking
      if (activeTab === 'check-mistakes') {
        // Create a file URL
        const fileUrl = URL.createObjectURL(e.target.files[0]);
        
        // Add the new file to document pages
        setDocumentPages(prev => [...prev, fileUrl]);
        setCurrentPage(documentPages.length); // Set to the newly added page
        
        // Simulate processing the file for mistakes
        setLoading(true);
        setTimeout(() => {
          // Add some sample mistakes
          setMistakes([
            {id: Date.now(), line: "The data were collected from participants.", correction: "The data was collected from participants.", type: "Grammar"},
            {id: Date.now() + 1, line: "According to Smith et al", correction: "According to Smith et al. (2021)", type: "Citation"},
            {id: Date.now() + 2, line: "This results in a signficant change.", correction: "This results in a significant change.", type: "Spelling"},
          ]);
          setLoading(false);
        }, 2000);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!file && !question) || loading) return;
    
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setAnswer('Based on your homework question, the solution involves applying the principles of [subject] to solve this problem. First, we need to identify the key variables and constraints. Then, using the formula [formula], we can determine that the answer is [detailed explanation with step-by-step working].');
      setLoading(false);
      
      // Add to history
      if (question) {
        setHistory(prev => [
          {date: 'Just now', question, snippet: 'Based on your homework question...'},
          ...prev
        ]);
      }
    }, 2000);
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || loading) return;
    
    // Add user message
    setChatMessages(prev => [...prev, {role: 'user', content: chatInput}]);
    setLoading(true);
    
    // Simulate AI response
    setTimeout(() => {
      setChatMessages(prev => [
        ...prev, 
        {role: 'assistant', content: `I've analyzed your question about "${chatInput}". Here's how to approach it: [detailed explanation with step-by-step guidance and examples to help understand the concept]`}
      ]);
      setChatInput('');
      setLoading(false);
      
      // Scroll to bottom of chat
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 1500);
  };

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

  const tabs = [
    { id: 'upload', name: 'Upload Homework', icon: AiOutlineUpload },
    { id: 'chat', name: 'AI Tutor Chat', icon: AiOutlineRobot },
    { id: 'check-mistakes', name: 'Check Mistakes', icon: AiOutlineSearch },
    { id: 'study-planner', name: 'Study Planner', icon: FiCalendar },
    { id: 'flashcards', name: 'Flashcards', icon: FiBookOpen },
    { id: 'citations', name: 'Citations', icon: FiEdit },
    { id: 'history', name: 'Study History', icon: AiOutlineHistory },
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
            className="text-center mb-12"
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-bold text-teal-800 mb-3">
              AI<span className="text-orange-500">Study</span> Assistant
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Get instant help with your homework, assignments, and learning materials. 
              Our AI assistant provides step-by-step solutions and explanations.
            </p>
          </motion.div>

          {/* Subject Selector */}
          <motion.div
            className="mb-8 max-w-6xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <div className="bg-gradient-to-r from-teal-700 to-teal-900 rounded-xl p-4 shadow-md">
              <h3 className="text-white font-medium mb-3">Select Subject</h3>
              
              {/* Mobile subject selector */}
              <div className="sm:hidden -mx-1 px-1">
                <div className="flex overflow-x-auto pb-2 custom-hide-scrollbar">
                  {['Mathematics', 'Science', 'English', 'History', 'Computer Science', 'Physics', 'Chemistry', 'Biology', 'Literature', 'Languages'].map((subject) => (
                    <motion.button
                      key={subject}
                      className="bg-white/10 hover:bg-white/20 text-white rounded-lg py-2 px-3 text-sm backdrop-blur-sm transition-colors whitespace-nowrap mr-2 flex-shrink-0"
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {subject}
                    </motion.button>
                  ))}
                </div>
              </div>
              
              {/* Desktop subject selector */}
              <div className="hidden sm:grid sm:grid-cols-3 md:grid-cols-5 gap-2">
                {['Mathematics', 'Science', 'English', 'History', 'Computer Science', 'Physics', 'Chemistry', 'Biology', 'Literature', 'Languages'].map((subject) => (
                  <motion.button
                    key={subject}
                    className="bg-white/10 hover:bg-white/20 text-white rounded-lg py-2 px-3 text-sm backdrop-blur-sm transition-colors"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {subject}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-6xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Tabs - Mobile Version */}
            <div className="md:hidden">
              <div className="flex justify-between items-center bg-gradient-to-r from-teal-700 to-teal-900 text-white p-4">
                <span className="font-medium">{tabs.find(tab => tab.id === activeTab)?.name}</span>
                <motion.button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  whileTap={{ scale: 0.95 }}
                  className="p-2"
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
                  {tabs.map((tab) => (
                    <motion.button
                      key={tab.id}
                      className={`flex items-center py-3 px-4 w-full text-left ${
                        activeTab === tab.id ? 'bg-teal-50 text-teal-700' : 'text-gray-700'
                      }`}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setMobileMenuOpen(false);
                      }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <IconComponent icon={tab.icon} className="h-5 w-5 mr-3" />
                      <span className="font-medium">{tab.name}</span>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Tabs - Desktop Version */}
            <div className="hidden md:flex bg-gradient-to-r from-teal-700 to-teal-900 text-white">
              {tabs.map((tab) => (
                <motion.button
                  key={tab.id}
                  className={`flex items-center py-4 px-6 flex-1 justify-center ${
                    activeTab === tab.id
                      ? 'bg-white/10 border-b-2 border-orange-500'
                      : 'hover:bg-white/5'
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                  whileHover={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                  whileTap={{ scale: 0.98 }}
                >
                  <IconComponent icon={tab.icon} className="h-5 w-5 mr-2" />
                  <span className="font-medium">{tab.name}</span>
                </motion.button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'upload' && (
                <motion.div variants={containerVariants}>
                  <motion.div 
                    variants={itemVariants}
                    className="grid grid-cols-1 md:grid-cols-2 gap-8"
                  >
                    {/* Input Section */}
                    <div>
                      <h2 className="text-2xl font-semibold text-teal-800 mb-6">Submit Your Homework</h2>
                      
                      <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                          <label className="block text-gray-700 mb-2 font-medium">
                            Describe your homework problem
                          </label>
                          <textarea
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none h-40"
                            placeholder="Type your homework question or problem here..."
                          />
                        </div>
                        
                        <div className="mb-6">
                          <label className="block text-gray-700 mb-2 font-medium">
                            Or upload your assignment
                          </label>
                          <div 
                            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-teal-500 cursor-pointer transition-colors"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <input 
                              type="file" 
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              className="hidden"
                              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            />
                            {file ? (
                              <div className="text-gray-700">
                                <IconComponent icon={AiOutlineFileText} className="h-8 w-8 mx-auto mb-2 text-teal-600" />
                                <p className="font-medium">{file.name}</p>
                                <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                              </div>
                            ) : (
                              <div className="text-gray-500">
                                <IconComponent icon={AiOutlineUpload} className="h-8 w-8 mx-auto mb-2" />
                                <p>Drag and drop your file here, or click to browse</p>
                                <p className="text-sm mt-1">Supports PDF, Word, and images</p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <motion.button
                            type="button"
                            className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <IconComponent icon={AiOutlineCamera} className="h-5 w-5 mr-2" />
                            Take Photo
                          </motion.button>
                          
                          <motion.button
                            type="submit"
                            className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 rounded-lg text-white font-medium shadow-md hover:shadow-lg"
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                            disabled={loading}
                            animate={loading ? "pulse" : ""}
                          >
                            {loading ? 'Processing...' : 'Get Solution'}
                            <IconComponent icon={AiOutlineBulb} className="h-5 w-5 ml-2" />
                          </motion.button>
                        </div>
                      </form>
                    </div>
                    
                    {/* Results Section */}
                    <div>
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-semibold text-teal-800">Solution</h2>
                        {answer && (
                          <motion.button
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                            onClick={() => setFullScreenSolution(!fullScreenSolution)}
                            className="flex items-center text-teal-600 font-medium"
                          >
                            <IconComponent 
                              icon={AiOutlineFullscreen} 
                              className="h-5 w-5 mr-1" 
                            />
                            {fullScreenSolution ? "Exit Fullscreen" : "Fullscreen"}
                          </motion.button>
                        )}
                      </div>
                      
                      <motion.div
                        className={`bg-gray-50 rounded-xl p-6 overflow-y-auto transition-all duration-300 ${
                          fullScreenSolution ? 
                            "fixed top-0 left-0 right-0 bottom-0 z-50 rounded-none" : 
                            "h-[450px]"
                        }`}
                        variants={itemVariants}
                        animate={answer ? { boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)" } : {}}
                      >
                        {loading ? (
                          <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <motion.div
                              className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full mb-4"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                            <p>Analyzing your homework...</p>
                          </div>
                        ) : answer ? (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            className="relative"
                          >
                            {fullScreenSolution && (
                              <div className="sticky top-2 right-2 flex justify-end mb-4">
                                <motion.button
                                  variants={buttonVariants}
                                  whileHover="hover"
                                  whileTap="tap"
                                  onClick={() => setFullScreenSolution(false)}
                                  className="bg-white text-gray-700 p-2 rounded-full shadow-md"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </motion.button>
                              </div>
                            )}
                            <div className="prose prose-teal max-w-none">
                              <p>{answer}</p>
                            </div>
                          </motion.div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <IconComponent icon={AiOutlineBulb} className="h-12 w-12 mb-3 opacity-50" />
                            <p className="text-center">Your solution will appear here after submitting your homework problem.</p>
                          </div>
                        )}
                      </motion.div>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {activeTab === 'chat' && (
                <motion.div 
                  variants={containerVariants}
                  className="flex flex-col h-[600px]"
                >
                  {/* Chat messages */}
                  <div className="flex-1 overflow-y-auto mb-4 bg-gray-50 rounded-xl p-4">
                    {chatMessages.map((msg, index) => (
                      <motion.div
                        key={index}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div 
                          className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                            msg.role === 'user' 
                              ? 'bg-teal-600 text-white rounded-tr-none' 
                              : 'bg-white border border-gray-200 rounded-tl-none'
                          }`}
                        >
                          {msg.content}
                        </div>
                      </motion.div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                  
                  {/* Chat input */}
                  <motion.form 
                    variants={itemVariants}
                    onSubmit={handleChatSubmit}
                    className="relative"
                  >
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="w-full p-4 pr-16 border border-gray-300 rounded-full focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="Ask anything about your homework..."
                      disabled={loading}
                    />
                    <motion.button
                      type="submit"
                      className="absolute right-2 top-2 p-2 bg-teal-600 text-white rounded-full"
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      disabled={loading}
                    >
                      <IconComponent icon={AiOutlineRobot} className="h-6 w-6" />
                    </motion.button>
                  </motion.form>
                </motion.div>
              )}

              {activeTab === 'study-planner' && (
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
                                <div>
                                  <p className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                                    {task.task}
                                  </p>
                                  <div className="flex items-center text-sm text-gray-500 mt-1">
                                    <span className="bg-teal-100 text-teal-800 px-2 py-0.5 rounded text-xs mr-2">
                                      {task.subject}
                                    </span>
                                    <span className="flex items-center">
                                      <IconComponent icon={FiCalendar} className="h-3 w-3 mr-1" />
                                      {new Date(task.date).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <span className={`text-xs font-medium ml-2 px-2 py-1 rounded-full ${
                                new Date(task.date) < new Date() && !task.completed
                                  ? 'bg-red-100 text-red-800'
                                  : task.completed
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-blue-100 text-blue-800'
                              }`}>
                                {task.completed 
                                  ? 'Completed' 
                                  : new Date(task.date) < new Date() 
                                    ? 'Overdue' 
                                    : 'Upcoming'}
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <IconComponent icon={FiCalendar} className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>Your study tasks will appear here once you add them.</p>
                        </div>
                      )}
                    </motion.div>
                    
                    {/* AI Study Recommendations */}
                    <motion.div 
                      variants={itemVariants}
                      className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl p-6 shadow-md text-white col-span-full"
                    >
                      <h3 className="text-lg font-medium mb-4 flex items-center">
                        <IconComponent icon={AiOutlineBulb} className="mr-2" /> Smart Study Recommendations
                      </h3>
                      
                      <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                        <p className="mb-3">Based on your upcoming tasks and learning patterns, here are personalized recommendations:</p>
                        <ul className="space-y-2">
                          <li className="flex items-start">
                            <span className="bg-white text-teal-800 rounded-full p-1 mr-2 flex-shrink-0">
                              <IconComponent icon={FiCheck} className="h-3 w-3" />
                            </span>
                            <span>Start with Mathematics homework first, as it's due earliest.</span>
                          </li>
                          <li className="flex items-start">
                            <span className="bg-white text-teal-800 rounded-full p-1 mr-2 flex-shrink-0">
                              <IconComponent icon={FiCheck} className="h-3 w-3" />
                            </span>
                            <span>Block 2-hour focus sessions with 15-minute breaks for better retention.</span>
                          </li>
                          <li className="flex items-start">
                            <span className="bg-white text-teal-800 rounded-full p-1 mr-2 flex-shrink-0">
                              <IconComponent icon={FiCheck} className="h-3 w-3" />
                            </span>
                            <span>Create flashcards for biology terms to prepare for your upcoming test.</span>
                          </li>
                        </ul>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'flashcards' && (
                <motion.div variants={containerVariants}>
                  <h2 className="text-2xl font-semibold text-teal-800 mb-6">Smart Flashcards</h2>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Flashcard Display */}
                    <div className="lg:col-span-2">
                      <div className="bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden h-72 relative perspective">
                        {/* Question Side */}
                        <motion.div
                          className="absolute w-full h-full p-8 bg-white"
                          initial={false}
                          animate={{
                            rotateY: showAnswer ? 180 : 0,
                            opacity: showAnswer ? 0 : 1,
                            zIndex: showAnswer ? 0 : 1,
                          }}
                          transition={{ duration: 0.6 }}
                        >
                          <div className="flex justify-between mb-2">
                            <span className="text-sm text-gray-500">Card {currentFlashcard + 1} of {flashcards.length}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              flashcards[currentFlashcard]?.mastered 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {flashcards[currentFlashcard]?.mastered ? 'Mastered' : 'Learning'}
                            </span>
                          </div>
                          <div className="flex items-center justify-center h-4/5">
                            <h3 className="text-xl text-center font-medium text-gray-800">
                              {flashcards[currentFlashcard]?.question}
                            </h3>
                          </div>
                          <div className="absolute bottom-4 left-0 right-0 text-center">
                            <motion.button
                              variants={buttonVariants}
                              whileHover="hover"
                              whileTap="tap"
                              className="bg-teal-600 text-white px-4 py-2 rounded-full text-sm font-medium"
                              onClick={() => setShowAnswer(true)}
                            >
                              Show Answer
                            </motion.button>
                          </div>
                        </motion.div>
                        
                        {/* Answer Side */}
                        <motion.div
                          className="absolute w-full h-full p-8 bg-white"
                          initial={false}
                          animate={{
                            rotateY: showAnswer ? 0 : -180,
                            opacity: showAnswer ? 1 : 0,
                            zIndex: showAnswer ? 1 : 0,
                          }}
                          transition={{ duration: 0.6 }}
                        >
                          <div className="flex justify-between mb-2">
                            <span className="text-sm text-gray-500">Answer</span>
                            <motion.button
                              variants={buttonVariants}
                              whileHover="hover"
                              whileTap="tap"
                              className="text-xs flex items-center"
                              onClick={toggleFlashcardMastery}
                            >
                              <span className={`px-2 py-0.5 rounded-full ${
                                flashcards[currentFlashcard]?.mastered 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {flashcards[currentFlashcard]?.mastered ? 'Mastered' : 'Mark as Mastered'}
                              </span>
                            </motion.button>
                          </div>
                          <div className="flex items-center justify-center h-4/5">
                            <p className="text-center text-gray-700">
                              {flashcards[currentFlashcard]?.answer}
                            </p>
                          </div>
                          <div className="absolute bottom-4 left-0 right-0 text-center">
                            <motion.button
                              variants={buttonVariants}
                              whileHover="hover"
                              whileTap="tap"
                              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-full text-sm font-medium"
                              onClick={() => setShowAnswer(false)}
                            >
                              Back to Question
                            </motion.button>
                          </div>
                        </motion.div>
                      </div>
                      
                      {/* Navigation Controls */}
                      <div className="flex justify-between mt-4">
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

              {activeTab === 'citations' && (
                <motion.div variants={containerVariants}>
                  <h2 className="text-2xl font-semibold text-teal-800 mb-6">Citation Generator</h2>
                  
                  <CitationGenerator />
                </motion.div>
              )}

              {activeTab === 'history' && (
                <motion.div variants={containerVariants}>
                  <h2 className="text-2xl font-semibold text-teal-800 mb-6">Your Study History</h2>
                  
                  {history.length > 0 ? (
                    <div className="space-y-4">
                      {history.map((item, index) => (
                        <motion.div
                          key={index}
                          variants={itemVariants}
                          className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
                          whileHover={{ y: -2 }}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium text-teal-800 truncate mr-4">{item.question}</h3>
                            <span className="text-sm text-gray-500 whitespace-nowrap">{item.date}</span>
                          </div>
                          <p className="text-gray-600 text-sm line-clamp-2">{item.snippet}</p>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <IconComponent icon={AiOutlineHistory} className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Your study history will appear here once you start using AI Study.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'check-mistakes' && (
                <motion.div variants={containerVariants}>
                  <h2 className="text-2xl font-semibold text-teal-800 mb-6">Check Mistakes</h2>
                  
                  {documentPages.length > 0 ? (
                    <div>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-4">
                        <div className="lg:col-span-2">
                          <div className="flex justify-between items-center mb-4">
                            <div className="flex space-x-2">
                              <button 
                                className="px-3 py-1 bg-gray-200 rounded-md disabled:opacity-50"
                                disabled={currentPage === 0}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                              >
                                Previous
                              </button>
                              <button 
                                className="px-3 py-1 bg-gray-200 rounded-md disabled:opacity-50"
                                disabled={currentPage === documentPages.length - 1}
                                onClick={() => setCurrentPage(prev => prev + 1)}
                              >
                                Next
                              </button>
                            </div>
                            <div className="text-gray-600">
                              Page {currentPage + 1} of {documentPages.length}
                            </div>
                            <motion.button
                              variants={buttonVariants}
                              whileHover="hover"
                              whileTap="tap"
                              onClick={() => setFullScreenDocument(!fullScreenDocument)}
                              className="flex items-center text-teal-600"
                            >
                              <IconComponent icon={AiOutlineFullscreen} className="h-5 w-5 mr-1" />
                              <span className="hidden sm:inline">Fullscreen</span>
                            </motion.button>
                          </div>
                          
                          <div className={`relative ${
                            fullScreenDocument ? 
                              "fixed top-0 left-0 right-0 bottom-0 z-50 bg-gray-900 flex items-center justify-center p-4" : 
                              "aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden"
                          }`}>
                            {fullScreenDocument && (
                              <motion.button
                                variants={buttonVariants}
                                whileHover="hover"
                                whileTap="tap"
                                onClick={() => setFullScreenDocument(false)}
                                className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md z-10"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </motion.button>
                            )}
                            <img 
                              src={documentPages[currentPage]} 
                              alt={`Document page ${currentPage + 1}`}
                              className={`${fullScreenDocument ? 'max-h-full max-w-full object-contain' : 'w-full h-full object-cover'}`}
                            />
                          </div>
                        </div>
                        
                        <div className="lg:col-span-1">
                          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm h-full">
                            <h3 className="text-lg font-medium text-teal-800 mb-4 flex items-center">
                              <IconComponent icon={AiOutlineSearch} className="mr-2" /> 
                              Identified Mistakes
                            </h3>
                            
                            {mistakes.length > 0 ? (
                              <div className="space-y-4 overflow-y-auto" style={{ maxHeight: "500px" }}>
                                {mistakes.map((mistake) => (
                                  <motion.div
                                    key={mistake.id}
                                    variants={itemVariants}
                                    className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                                    whileHover={{ y: -2 }}
                                  >
                                    <div className="flex justify-between items-start">
                                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                        mistake.type === 'Grammar' ? 'bg-red-100 text-red-800' :
                                        mistake.type === 'Spelling' ? 'bg-orange-100 text-orange-800' :
                                        'bg-blue-100 text-blue-800'
                                      }`}>
                                        {mistake.type}
                                      </span>
                                    </div>
                                    <div className="mt-2">
                                      <p className="text-sm line-through text-gray-500">{mistake.line}</p>
                                      <p className="text-sm font-medium text-green-700 mt-1">{mistake.correction}</p>
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                                <IconComponent icon={AiOutlineSearch} className="h-12 w-12 mb-3 opacity-50" />
                                <p className="text-center">No mistakes found on this page.</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-4 rounded-lg mt-6">
                        <h3 className="text-lg font-medium text-teal-800 mb-3">Upload Document to Check</h3>
                        <div className="flex flex-wrap gap-4">
                          <motion.button
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                            className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <IconComponent icon={AiOutlineUpload} className="mr-2" />
                            Upload New Document
                          </motion.button>
                          <motion.button
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                            className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg"
                          >
                            <IconComponent icon={AiOutlineCamera} className="mr-2" />
                            Take Photo
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                      <div className="bg-gray-100 rounded-full p-6 mb-4">
                        <IconComponent icon={AiOutlineUpload} className="h-12 w-12 opacity-70" />
                      </div>
                      <h3 className="text-xl font-medium text-gray-700 mb-2">No Documents Uploaded</h3>
                      <p className="text-gray-500 mb-6 text-center max-w-md">
                        Upload a document or take a photo to check for mistakes, grammar issues, and suggestions.
                      </p>
                      <div className="flex flex-wrap gap-4 justify-center">
                        <motion.button
                          variants={buttonVariants}
                          whileHover="hover"
                          whileTap="tap"
                          className="flex items-center px-6 py-3 bg-teal-600 text-white rounded-lg shadow-md"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <IconComponent icon={AiOutlineUpload} className="mr-2" />
                          Upload Document
                        </motion.button>
                        <motion.button
                          variants={buttonVariants}
                          whileHover="hover"
                          whileTap="tap"
                          className="flex items-center px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg"
                        >
                          <IconComponent icon={AiOutlineCamera} className="mr-2" />
                          Take Photo
                        </motion.button>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Features Section */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-16"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div 
              className="bg-white p-6 rounded-xl shadow-md"
              variants={itemVariants}
              whileHover={{ y: -5, boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)" }}
            >
              <div className="bg-teal-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <IconComponent icon={AiOutlineUpload} className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-teal-800 mb-2">Instant Homework Solutions</h3>
              <p className="text-gray-600">Upload your homework and get detailed step-by-step solutions instantly.</p>
            </motion.div>
            
            <motion.div 
              className="bg-white p-6 rounded-xl shadow-md"
              variants={itemVariants}
              whileHover={{ y: -5, boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)" }}
            >
              <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <IconComponent icon={AiOutlineRobot} className="h-6 w-6 text-orange-500" />
              </div>
              <h3 className="text-xl font-semibold text-teal-800 mb-2">AI Tutoring Chat</h3>
              <p className="text-gray-600">Chat with our AI tutor for personalized help and explanations on any subject.</p>
            </motion.div>
            
            <motion.div 
              className="bg-white p-6 rounded-xl shadow-md"
              variants={itemVariants}
              whileHover={{ y: -5, boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)" }}
            >
              <div className="bg-teal-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <IconComponent icon={AiOutlineSearch} className="h-6 w-6 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-teal-800 mb-2">Check Mistakes</h3>
              <p className="text-gray-600">Upload papers and get instant feedback on grammar, spelling, and content errors.</p>
            </motion.div>
          </motion.div>

          {/* Floating Action Button */}
          <motion.button
            className="fixed bottom-5 right-5 md:right-20 z-40 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-3 md:p-4 rounded-full shadow-lg flex items-center justify-center"
            whileHover={{ scale: 1.1, boxShadow: "0 8px 20px rgba(0, 0, 0, 0.2)" }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            onClick={() => setActiveTab('upload')}
          >
            <IconComponent icon={AiOutlineBulb} className="h-5 w-5 md:h-6 md:w-6" />
            <span className="ml-2 font-medium hidden md:inline">Quick Help</span>
          </motion.button>
        </div>
      </motion.div>
      <Footer />
    </div>
  );
};

export default AiStudy; 