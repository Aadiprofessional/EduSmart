import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaRobot, 
  FaTimes, 
  FaPaperPlane, 
  FaUser, 
  FaGraduationCap,
  FaUniversity,
  FaFileAlt,
  FaChartLine,
  FaCrown,
  FaSignInAlt,
  FaShoppingCart,
  FaQuestionCircle,
  FaCogs,
  FaBookOpen,
  FaLightbulb,
  FaRocket
} from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { useSubscription } from '../../utils/SubscriptionContext';
import { useResponseCheck, ResponseUpgradeModal } from '../../utils/responseChecker';
import IconComponent from './IconComponent';
import { quickQuestionsData, getInitialQuestions, type QuickQuestion } from '../../data/quickQuestions';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isTyping?: boolean;
  actionButtons?: ActionButton[];
  isAIResponse?: boolean;
  quickQuestions?: QuickQuestion[];
}

interface ActionButton {
  text: string;
  action: () => void;
  icon?: React.ReactNode;
  color?: string;
}

const ChatBot: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isProUser } = useSubscription();
  const { checkAndUseResponse } = useResponseCheck();
  
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 1, 
      text: 'Welcome to MatrixEdu! I\'m your AI-powered website guide and assistant. I can help you navigate our platform, discover features, and get started with your learning journey. Choose from the quick questions below or ask me anything!', 
      sender: 'bot',
      timestamp: new Date(),
      quickQuestions: getInitialQuestions()
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');
  const [currentQuestions, setCurrentQuestions] = useState<QuickQuestion[]>(getInitialQuestions());
  const [questionHistory, setQuestionHistory] = useState<QuickQuestion[][]>([getInitialQuestions()]);
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat window when new messages appear
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Hide ChatBot on CoursePlayer pages
  const shouldHideChatBot = location.pathname.includes('/course/') || 
                           location.pathname.includes('/learn/');

  if (shouldHideChatBot) {
    return null;
  }

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Reset to initial state when opening
      setCurrentQuestions(getInitialQuestions());
      setQuestionHistory([getInitialQuestions()]);
      setShowQuickQuestions(true);
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  // Clean AI response text by removing markdown symbols
  const cleanAIResponseText = (text: string): string => {
    return text
      .replace(/\*\*\*(.*?)\*\*\*/g, '$1')  // Remove triple asterisks
      .replace(/\*\*(.*?)\*\*/g, '$1')      // Remove double asterisks
      .replace(/\*(.*?)\*/g, '$1')          // Remove single asterisks
      .replace(/###\s*(.*?)(\n|$)/g, '$1\n') // Remove ### headers
      .replace(/##\s*(.*?)(\n|$)/g, '$1\n')  // Remove ## headers
      .replace(/#\s*(.*?)(\n|$)/g, '$1\n')   // Remove # headers
      .replace(/`(.*?)`/g, '$1')            // Remove backticks
      .replace(/^\s*[-*+]\s+/gm, '• ')      // Convert list markers to bullets
      .replace(/\n\n+/g, '\n\n')            // Normalize line breaks
      .trim();
  };

  // Generate navigation buttons based on AI response content
  const generateAINavigationButtons = (aiText: string): ActionButton[] => {
    const buttons: ActionButton[] = [];
    const lowerText = aiText.toLowerCase();

    // Add relevant buttons based on content
    if (lowerText.includes('course') || lowerText.includes('learn')) {
      buttons.push({
        text: 'Browse Courses',
        action: () => navigate('/courses'),
        icon: <IconComponent icon={FaGraduationCap} />,
        color: 'from-blue-500 to-indigo-500'
      });
    }

    if (lowerText.includes('university') || lowerText.includes('college')) {
      buttons.push({
        text: 'Search Universities',
        action: () => navigate('/database'),
        icon: <IconComponent icon={FaUniversity} />,
        color: 'from-purple-500 to-indigo-500'
      });
    }

    if (lowerText.includes('homework') || lowerText.includes('tutor') || lowerText.includes('study')) {
      buttons.push({
        text: 'AI Study Tools',
        action: () => navigate('/ai-study'),
        icon: <IconComponent icon={FaLightbulb} />,
        color: 'from-cyan-500 to-blue-500'
      });
    }

    if (lowerText.includes('upgrade') || lowerText.includes('pro') || lowerText.includes('premium')) {
      buttons.push({
        text: 'Upgrade to Pro',
        action: () => navigate('/subscription'),
        icon: <IconComponent icon={FaCrown} />,
        color: 'from-yellow-500 to-orange-500'
      });
    }

    // Always add a general dashboard button
    buttons.push({
      text: 'Dashboard',
      action: () => navigate('/dashboard'),
      icon: <IconComponent icon={FaChartLine} />,
      color: 'from-gray-500 to-blue-500'
    });

    return buttons;
  };

  // Handle AI API call for pro users
  const handleAIResponse = async (userMessage: string): Promise<string> => {
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
                  text: "You are MatrixEdu's AI assistant. Help users with educational questions, platform navigation, and provide helpful guidance. Keep responses concise, friendly, and informative. Avoid using markdown formatting symbols like **, ***, ##, etc. Write in plain text with clear, natural language."
                }
              ]
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: userMessage
                }
              ]
            }
          ],
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || 'I apologize, but I could not generate a response. Please try again.';
    } catch (error) {
      console.error('Error calling AI API:', error);
      throw new Error('Failed to get AI response. Please try again.');
    }
  };

  // Handle quick question click
  const handleQuickQuestion = (questionData: QuickQuestion) => {
    // Check authentication requirements
    if (questionData.requiresAuth && !user) {
      setUpgradeMessage('Please sign in to access this feature');
      setShowUpgradeModal(true);
      return;
    }

    // Check pro requirements
    if (questionData.requiresPro && !isProUser) {
      setUpgradeMessage('This feature requires a Pro subscription. Upgrade now to unlock unlimited AI assistance!');
      setShowUpgradeModal(true);
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      text: questionData.text,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    // Process the question
    setTimeout(() => {
      const actionButtons: ActionButton[] = [];
      
      // Add navigation button if action path exists
      if (questionData.actionPath) {
        actionButtons.push({
          text: 'Go to ' + questionData.actionPath.replace('/', '').replace('-', ' '),
          action: () => navigate(questionData.actionPath!),
          icon: <IconComponent icon={FaRocket} />,
          color: 'from-purple-500 to-pink-500'
        });
      }

      const botResponse: Message = {
        id: messages.length + 2,
        text: questionData.response || 'I can help you with that! Let me know if you need more specific information.',
        sender: 'bot',
        timestamp: new Date(),
        isAIResponse: false,
        actionButtons,
        quickQuestions: questionData.followUpQuestions && questionData.followUpQuestions.length > 0 
          ? questionData.followUpQuestions 
          : undefined
      };
      
      setMessages(prev => [...prev, botResponse]);
      
      // Update current questions
      if (questionData.followUpQuestions && questionData.followUpQuestions.length > 0) {
        setCurrentQuestions(questionData.followUpQuestions);
        setQuestionHistory(prev => [...prev, questionData.followUpQuestions!]);
      } else {
        setShowQuickQuestions(false);
      }
      
      setIsTyping(false);

      // Navigate if action path is provided (with delay)
      if (questionData.actionPath) {
        setTimeout(() => {
          navigate(questionData.actionPath!);
        }, 2000);
      }
    }, 1000);
  };

  // Handle back navigation in questions
  const handleBackQuestions = () => {
    if (questionHistory.length > 1) {
      const newHistory = questionHistory.slice(0, -1);
      setQuestionHistory(newHistory);
      setCurrentQuestions(newHistory[newHistory.length - 1]);
    } else {
      setCurrentQuestions(getInitialQuestions());
      setQuestionHistory([getInitialQuestions()]);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!inputValue.trim()) return;
    
    // Hide quick questions after first user input
    setShowQuickQuestions(false);
    
    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsTyping(true);

    // Check if user wants AI response (contains question words or complex queries)
    const aiTriggers = ['?', 'how', 'what', 'why', 'when', 'where', 'explain', 'tell me', 'help me with'];
    const needsAI = aiTriggers.some(trigger => currentInput.toLowerCase().includes(trigger));

    if (needsAI && user && isProUser) {
      // Try to use AI response for pro users (this WILL deduct from response quota)
      try {
        const responseCheck = await checkAndUseResponse({
          responseType: 'chatbot',
          queryData: { message: currentInput },
          responsesUsed: 1
        });

        if (responseCheck.canProceed) {
          // Call AI API - this deducts responses for ChatBot AI features
          try {
            const aiResponse = await handleAIResponse(currentInput);
            const cleanedResponse = cleanAIResponseText(aiResponse);
            const navigationButtons = generateAINavigationButtons(cleanedResponse);
            
            setTimeout(() => {
              const botResponse: Message = {
                id: messages.length + 2,
                text: cleanedResponse,
                sender: 'bot',
                timestamp: new Date(),
                isAIResponse: true,
                actionButtons: navigationButtons
              };
              setMessages(prev => [...prev, botResponse]);
              setIsTyping(false);
            }, 1000);
            return;
          } catch (aiError) {
            console.error('AI API failed, falling back to default response');
          }
        } else {
          setUpgradeMessage(responseCheck.message || 'Upgrade required');
          setShowUpgradeModal(true);
        }
      } catch (error) {
        console.error('Response check failed:', error);
      }
    }

    // Fall back to finding matching question from our database
    const matchingQuestion = quickQuestionsData.find(q => 
      q.text.toLowerCase().includes(currentInput.toLowerCase()) ||
      currentInput.toLowerCase().includes(q.category.toLowerCase()) ||
      (q.response && currentInput.toLowerCase().split(' ').some(word => 
        q.response!.toLowerCase().includes(word)
      ))
    );

    setTimeout(() => {
      let responseText = "I'm your MatrixEdu AI Assistant! I can help you with courses, universities, AI tutoring, content creation, and more. What would you like to explore?";
      let actionButtons: ActionButton[] = [];
      let followUpQuestions: QuickQuestion[] | undefined;

      if (matchingQuestion) {
        responseText = matchingQuestion.response || responseText;
        followUpQuestions = matchingQuestion.followUpQuestions;
        
        if (matchingQuestion.actionPath) {
          actionButtons.push({
            text: 'Go to ' + matchingQuestion.actionPath.replace('/', '').replace('-', ' '),
            action: () => navigate(matchingQuestion.actionPath!),
            icon: <IconComponent icon={FaRocket} />,
            color: 'from-purple-500 to-pink-500'
          });
        }
      } else {
        // Add default navigation buttons
        actionButtons.push({
          text: 'Explore Platform',
          action: () => navigate('/dashboard'),
          icon: <IconComponent icon={FaRocket} />,
          color: 'from-cyan-500 to-purple-500'
        });
      }

      // Add authentication check for certain actions
      if (!user && ['courses', 'aitutor', 'applications', 'profile'].some(keyword => 
        currentInput.toLowerCase().includes(keyword))) {
        actionButtons.unshift({
          text: 'Sign In First',
          action: () => navigate('/login'),
          icon: <IconComponent icon={FaSignInAlt} />,
          color: 'from-blue-500 to-purple-500'
        });
      }

      const botResponse: Message = {
        id: messages.length + 2,
        text: responseText,
        sender: 'bot',
        timestamp: new Date(),
        actionButtons,
        quickQuestions: followUpQuestions
      };
      
      setMessages(prev => [...prev, botResponse]);
      
      // Update current questions if follow-ups exist
      if (followUpQuestions && followUpQuestions.length > 0) {
        setCurrentQuestions(followUpQuestions);
        setQuestionHistory(prev => [...prev, followUpQuestions!]);
        setShowQuickQuestions(true);
      }
      
      setIsTyping(false);
    }, 1000);
  };

  const QuickActionButton = ({ button }: { button: ActionButton }) => (
    <motion.button
      onClick={button.action}
      className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r ${button.color || 'from-cyan-500 to-blue-500'} text-white text-sm font-medium hover:scale-105 transition-all duration-200 shadow-lg`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {button.icon && <span className="text-xs">{button.icon}</span>}
      <span>{button.text}</span>
    </motion.button>
  );

  const QuickQuestionButton = ({ question }: { question: QuickQuestion }) => (
    <motion.button
      onClick={() => handleQuickQuestion(question)}
      className="w-full p-3 text-left rounded-lg bg-gray-800/60 hover:bg-gray-700/60 border border-cyan-400/20 hover:border-cyan-400/40 text-gray-300 hover:text-white transition-all duration-200 text-sm"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{question.icon}</span>
          <span>{question.text}</span>
        </div>
        <div className="flex items-center gap-2">
          {(question.requiresAuth && !user) || (question.requiresPro && !isProUser) ? (
            <span className="text-xs px-2 py-1 bg-orange-500/20 text-orange-300 rounded-full">
              {question.requiresPro ? 'Pro' : 'Login'}
            </span>
          ) : null}
          {question.followUpQuestions && question.followUpQuestions.length > 0 ? (
            <span className="text-purple-400">→</span>
          ) : null}
        </div>
      </div>
    </motion.button>
  );

  return (
    <>
      <div className="fixed bottom-5 right-5 z-50">
        {/* Futuristic Bot toggle button */}
        <motion.button
          onClick={toggleChat}
          className="relative bg-gradient-to-r from-cyan-500 to-purple-500 text-white p-4 rounded-full shadow-2xl overflow-hidden group"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          animate={{
            boxShadow: isOpen 
              ? '0 0 30px rgba(6, 182, 212, 0.5)' 
              : '0 0 20px rgba(147, 51, 234, 0.3)'
          }}
        >
          {/* Animated background */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          
          {/* Pulsing ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-cyan-400 opacity-50"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          <div className="relative z-10">
            {isOpen ? (
              <IconComponent icon={FaTimes} size={20} />
            ) : (
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <IconComponent icon={FaRobot} size={20} />
              </motion.div>
            )}
          </div>
        </motion.button>

        {/* Futuristic Chat window */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.8 }}
              transition={{ type: 'spring', damping: 25 }}
              className="absolute bottom-16 right-0 w-96 h-[600px] bg-gray-900/95 backdrop-blur-xl border border-cyan-400/30 rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Futuristic header */}
              <div className="bg-gradient-to-r from-cyan-600 to-purple-600 p-4 relative overflow-hidden">
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0"
                  animate={{ opacity: [0, 0.3, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                      className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full flex items-center justify-center"
                    >
                      <IconComponent icon={FaRobot} className="text-white text-sm" />
                    </motion.div>
                    <div>
                      <h3 className="font-bold text-white">MatrixEdu AI</h3>
                      <p className="text-xs text-cyan-200">
                        {user ? (isProUser ? '⭐ Pro Assistant' : '🆓 Basic Assistant') : '👋 Guest Mode'}
                      </p>
                    </div>
                  </div>
                  
                  <motion.button
                    onClick={toggleChat}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <IconComponent icon={FaTimes} className="text-white text-sm" />
                  </motion.button>
                </div>

                {/* Animated lines */}
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
              </div>

              {/* Chat messages with cyberpunk styling */}
              <div className="flex flex-col" style={{ height: 'calc(100% - 80px)' }}>
                <div className="flex-1 p-4 overflow-y-auto ai-scrollbar" style={{ minHeight: 0 }}>
                  <AnimatePresence>
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`mb-4 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}
                      >
                        <div className={`inline-block max-w-[80%] ${message.sender === 'user' ? 'ml-auto' : 'mr-auto'}`}>
                          <div
                            className={`p-3 rounded-2xl relative overflow-hidden ${
                              message.sender === 'user'
                                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                                : message.isAIResponse
                                ? 'bg-gradient-to-r from-purple-800/50 to-blue-800/50 border border-purple-400/30 text-gray-100'
                                : 'bg-gray-800/80 border border-cyan-400/20 text-gray-100'
                            }`}
                          >
                            {message.sender === 'bot' && !message.isAIResponse && (
                              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-purple-500/5" />
                            )}
                            
                            {message.isAIResponse && (
                              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10" />
                            )}
                            
                            <div className="relative z-10">
                              {message.isAIResponse && (
                                <div className="text-xs text-purple-300 mb-2 font-semibold">🤖 AI Response:</div>
                              )}
                              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                                {message.text}
                              </div>
                              
                              {/* Action buttons */}
                              {message.actionButtons && message.actionButtons.length > 0 && (
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {message.actionButtons.map((button, index) => (
                                    <QuickActionButton key={index} button={button} />
                                  ))}
                                </div>
                              )}

                              {/* Quick Questions for this message */}
                              {message.quickQuestions && message.quickQuestions.length > 0 && (
                                <div className="mt-3">
                                  <div className="text-xs text-cyan-300 mb-2 font-semibold">Quick follow-ups:</div>
                                  <div className="space-y-2">
                                    {message.quickQuestions.slice(0, 3).map((question, index) => (
                                      <QuickQuestionButton key={question.id} question={question} />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className={`text-xs text-gray-400 mt-1 ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Typing indicator */}
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-4"
                    >
                      <div className="inline-block bg-gray-800/80 border border-cyan-400/20 p-3 rounded-2xl">
                        <div className="flex space-x-1">
                          {[0, 1, 2].map((i) => (
                            <motion.div
                              key={i}
                              className="w-2 h-2 bg-cyan-400 rounded-full"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Questions Section */}
                {showQuickQuestions && (
                  <div className="border-t border-cyan-400/20 bg-gray-900/30 p-4 max-h-40 overflow-y-auto ai-scrollbar flex-shrink-0">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-cyan-400 text-sm font-semibold">Quick Questions:</h4>
                      <div className="flex gap-2">
                        {questionHistory.length > 1 && (
                          <button
                            onClick={handleBackQuestions}
                            className="text-xs text-gray-400 hover:text-cyan-400 transition-colors"
                          >
                            ← Back
                          </button>
                        )}
                        <button
                          onClick={() => setShowQuickQuestions(false)}
                          className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                        >
                          Hide
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {currentQuestions.slice(0, 4).map((question) => (
                        <QuickQuestionButton key={question.id} question={question} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Futuristic input field */}
                <div className="p-4 border-t border-cyan-400/20 bg-gray-900/50 flex-shrink-0">
                  {!showQuickQuestions && (
                    <div className="mb-2">
                      <button
                        onClick={() => setShowQuickQuestions(true)}
                        className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        Show quick questions
                      </button>
                    </div>
                  )}
                  <form onSubmit={handleSubmit} className="relative">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={inputValue}
                          onChange={handleInputChange}
                          placeholder="Ask me anything about MatrixEdu..."
                          className="w-full p-3 bg-gray-800/80 border border-cyan-400/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all ai-scrollbar"
                        />
                      </div>
                      
                      <motion.button
                        type="submit"
                        className="p-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl hover:from-cyan-600 hover:to-purple-600 transition-all shadow-lg"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={!inputValue.trim() || isTyping}
                      >
                        <IconComponent icon={FaPaperPlane} size={16} />
                      </motion.button>
                    </div>
                  </form>
                  
                  {/* Status indicator */}
                  <div className="mt-2 text-xs text-gray-400 flex items-center justify-between">
                    <span>
                      {user ? (
                        isProUser ? '⭐ Pro features enabled' : '🆓 Basic features'
                      ) : '👋 Sign in for full features'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Upgrade Modal */}
      <ResponseUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        message={upgradeMessage}
      />
    </>
  );
};

export default ChatBot; 