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
import IconWrapper from '../IconWrapper';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';
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

  // Markdown components for formatted responses
  const markdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match[1]}
          PreTag="div"
          className="rounded-lg my-2"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className="bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-purple-300" {...props}>
          {children}
        </code>
      );
    },
    h1: ({ children }: any) => <h1 className="text-xl font-bold text-purple-400 mb-3 border-b border-purple-500/30 pb-2">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-lg font-bold text-blue-400 mb-2 mt-4">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-md font-semibold text-pink-400 mb-2 mt-3">{children}</h3>,
    ul: ({ children }: any) => <ul className="list-disc list-inside space-y-1 ml-2 text-gray-300">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal list-inside space-y-1 ml-2 text-gray-300">{children}</ol>,
    li: ({ children }: any) => <li className="text-gray-300 leading-relaxed">{children}</li>,
    p: ({ children }: any) => <p className="text-gray-300 leading-relaxed mb-2">{children}</p>,
    strong: ({ children }: any) => <strong className="text-white font-semibold">{children}</strong>,
    em: ({ children }: any) => <em className="text-purple-300 italic">{children}</em>,
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-purple-500/50 pl-4 my-3 bg-purple-900/20 py-2 rounded-r-lg">
        <div className="text-purple-200">{children}</div>
      </blockquote>
    ),
  };

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
        icon: <IconWrapper icon={FaGraduationCap} size={14} />,
        color: 'from-blue-500 to-indigo-500'
      });
    }

    if (lowerText.includes('university') || lowerText.includes('college')) {
      buttons.push({
        text: 'Search Universities',
        action: () => navigate('/database'),
        icon: <IconWrapper icon={FaUniversity} size={14} />,
        color: 'from-purple-500 to-indigo-500'
      });
    }

    if (lowerText.includes('homework') || lowerText.includes('tutor') || lowerText.includes('study')) {
      buttons.push({
        text: 'AI Study Tools',
        action: () => navigate('/ai-study'),
        icon: <IconWrapper icon={FaLightbulb} size={14} />,
        color: 'from-cyan-500 to-blue-500'
      });
    }

    if (lowerText.includes('upgrade') || lowerText.includes('pro') || lowerText.includes('premium')) {
      buttons.push({
        text: 'Upgrade to Pro',
        action: () => navigate('/subscription'),
        icon: <IconWrapper icon={FaCrown} size={14} />,
        color: 'from-yellow-500 to-orange-500'
      });
    }

    // Always add a general dashboard button
    buttons.push({
      text: 'Dashboard',
      action: () => navigate('/dashboard'),
      icon: <IconWrapper icon={FaChartLine} size={14} />,
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
                  text: "You are MatrixEdu's AI assistant. Help users with educational questions, platform navigation, and provide helpful guidance. Keep responses concise, friendly, and informative. Use markdown formatting for better readability when appropriate."
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
          icon: <IconWrapper icon={FaRocket} size={14} />,
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
            const navigationButtons = generateAINavigationButtons(aiResponse);
            
            setTimeout(() => {
              const botResponse: Message = {
                id: messages.length + 2,
                text: aiResponse,
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
            icon: <IconWrapper icon={FaRocket} size={14} />,
            color: 'from-purple-500 to-pink-500'
          });
        }
      } else {
        // Add default navigation buttons
        actionButtons.push({
          text: 'Explore Platform',
          action: () => navigate('/dashboard'),
          icon: <IconWrapper icon={FaRocket} size={14} />,
          color: 'from-cyan-500 to-purple-500'
        });
      }

      // Add authentication check for certain actions
      if (!user && ['courses', 'aitutor', 'applications', 'profile'].some(keyword => 
        currentInput.toLowerCase().includes(keyword))) {
        actionButtons.unshift({
          text: 'Sign In First',
          action: () => navigate('/login'),
          icon: <IconWrapper icon={FaSignInAlt} size={14} />,
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
      className={`inline-flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-gradient-to-r ${button.color || 'from-cyan-500 to-blue-500'} text-white text-xs font-medium hover:scale-105 transition-all duration-200 shadow-lg`}
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
      className="w-full p-2 sm:p-3 text-left rounded-xl bg-gradient-to-r from-gray-800/50 to-gray-700/50 hover:from-gray-700/50 hover:to-gray-600/50 border border-gray-600/30 hover:border-purple-500/30 text-gray-300 hover:text-white transition-all duration-300 text-xs sm:text-sm backdrop-blur-sm"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-sm sm:text-lg">{question.icon}</span>
          <span>{question.text}</span>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          {(question.requiresAuth && !user) || (question.requiresPro && !isProUser) ? (
            <span className="text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-orange-500/20 text-orange-300 rounded-full">
              {question.requiresPro ? 'Pro' : 'Login'}
            </span>
          ) : null}
          {question.followUpQuestions && question.followUpQuestions.length > 0 ? (
            <span className="text-purple-400 text-sm sm:text-base">→</span>
          ) : null}
        </div>
      </div>
    </motion.button>
  );

  return (
    <>
      <div className="fixed bottom-5 right-5 z-50">
        {/* Modern Bot toggle button */}
        <motion.button
          onClick={toggleChat}
          className="relative p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full shadow-2xl overflow-hidden group"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          animate={{
            boxShadow: isOpen 
              ? '0 0 30px rgba(147, 51, 234, 0.5)' 
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
            className="absolute inset-0 rounded-full border-2 border-purple-400 opacity-50"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          
          <div className="relative z-10">
            {isOpen ? (
              <IconWrapper icon={FaTimes} size={20} />
            ) : (
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <IconWrapper icon={FaRobot} size={20} />
              </motion.div>
            )}
          </div>
          
          {/* Online indicator */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900 animate-pulse"></div>
        </motion.button>

        {/* Modern Chat window */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, x: 50, y: 50 }}
              animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 50, y: 50 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute bottom-16 right-0 w-80 sm:w-96 h-[500px] sm:h-[600px] bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Modern header */}
              <div className="p-3 sm:p-4 border-b border-gray-700/50 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-blue-600/20 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                        <IconWrapper icon={FaRobot} className="text-white" size={14} />
                      </div>
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-400 rounded-full border-2 border-gray-900 animate-pulse"></div>
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        MatrixEdu AI
                      </h3>
                      <p className="text-xs text-gray-400">
                        {user ? (isProUser ? '⭐ Pro Assistant' : '🆓 Basic Assistant') : '👋 Guest Mode'}
                      </p>
                    </div>
                  </div>
                  
                  <motion.button
                    onClick={toggleChat}
                    className="p-1.5 sm:p-2 text-gray-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-all duration-300"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <IconWrapper icon={FaTimes} size={12} />
                  </motion.button>
                </div>
              </div>

              {/* Chat messages */}
              <div className="flex flex-col" style={{ height: 'calc(100% - 70px)' }}>
                <div className="flex-1 p-2 sm:p-4 overflow-y-auto ai-scrollbar" style={{ minHeight: 0 }}>
                  <div className="space-y-2 sm:space-y-3">
                    {messages.length === 0 ? (
                      <div className="text-center py-3 sm:py-4">
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-2xl p-3 sm:p-4 mb-3 sm:mb-4 border border-purple-500/20"
                        >
                          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                            <IconWrapper icon={FaRobot} size={16} className="text-white" />
                          </div>
                          <h4 className="text-base sm:text-lg font-bold text-white mb-1 sm:mb-2">MatrixEdu AI Ready!</h4>
                          <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mb-2 sm:mb-3">
                            I'm your AI-powered website guide and assistant. I can help you navigate our platform, discover features, and get started with your learning journey.
                          </p>
                        </motion.div>
                      </div>
                    ) : (
                      <>
                        {messages.map((message) => (
                          <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-2 sm:gap-3 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            {message.sender === 'bot' && (
                              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                <IconWrapper icon={FaRobot} size={10} className="text-white" />
                              </div>
                            )}
                            <div className={`max-w-[85%] p-2 sm:p-3 rounded-2xl backdrop-blur-sm border text-xs sm:text-sm ${
                              message.sender === 'user' 
                                ? 'bg-gradient-to-r from-blue-600/80 to-purple-600/80 text-white border-blue-500/30' 
                                : message.isAIResponse
                                ? 'bg-gradient-to-r from-purple-800/50 to-blue-800/50 border border-purple-400/30 text-gray-100'
                                : 'bg-gradient-to-r from-gray-800/80 to-gray-700/80 text-gray-200 border-gray-600/30'
                            }`}>
                              {message.isAIResponse && (
                                <div className="text-xs text-purple-300 mb-1 sm:mb-2 font-semibold">🤖 AI Response:</div>
                              )}
                              <div className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                                {message.isAIResponse ? (
                                  <ReactMarkdown
                                    components={markdownComponents}
                                    remarkPlugins={[remarkMath, remarkGfm]}
                                    rehypePlugins={[rehypeKatex]}
                                  >
                                    {message.text}
                                  </ReactMarkdown>
                                ) : (
                                  message.text
                                )}
                              </div>
                              
                              {/* Action buttons */}
                              {message.actionButtons && message.actionButtons.length > 0 && (
                                <div className="mt-2 sm:mt-3 flex flex-wrap gap-1 sm:gap-2">
                                  {message.actionButtons.map((button, index) => (
                                    <QuickActionButton key={index} button={button} />
                                  ))}
                                </div>
                              )}

                              {/* Quick Questions for this message */}
                              {message.quickQuestions && message.quickQuestions.length > 0 && (
                                <div className="mt-2 sm:mt-3">
                                  <div className="text-xs text-cyan-300 mb-1 sm:mb-2 font-semibold">Quick follow-ups:</div>
                                  <div className="space-y-1 sm:space-y-2">
                                    {message.quickQuestions.slice(0, 3).map((question, index) => (
                                      <QuickQuestionButton key={question.id} question={question} />
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              <p className="text-xs opacity-70 mt-1 sm:mt-2">
                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            {message.sender === 'user' && (
                              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                <IconWrapper icon={FaUser} size={10} className="text-white" />
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </>
                    )}

                    {/* Typing indicator */}
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-2 sm:gap-3 justify-start"
                      >
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <IconWrapper icon={FaRobot} size={10} className="text-white" />
                        </div>
                        <div className="bg-gradient-to-r from-gray-800/80 to-gray-700/80 p-2 sm:p-3 rounded-2xl backdrop-blur-sm border border-gray-600/30">
                          <div className="flex items-center gap-1 sm:gap-2">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <span className="text-gray-400 text-xs sm:text-sm ml-1 sm:ml-2">AI is thinking...</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </div>

                {/* Quick Questions Section */}
                {showQuickQuestions && (
                  <div className="border-t border-gray-700/50 bg-gradient-to-r from-gray-800/30 to-gray-700/30 p-2 sm:p-4 max-h-32 sm:max-h-40 overflow-y-auto ai-scrollbar flex-shrink-0">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <h4 className="text-cyan-400 text-xs sm:text-sm font-semibold">Quick Questions:</h4>
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
                    <div className="space-y-1 sm:space-y-2">
                      {currentQuestions.slice(0, 4).map((question) => (
                        <QuickQuestionButton key={question.id} question={question} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Modern input field */}
                <div className="p-2 sm:p-4 border-t border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-700/50 backdrop-blur-sm flex-shrink-0">
                  {!showQuickQuestions && (
                    <div className="mb-1 sm:mb-2">
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
                          className="w-full p-2 sm:p-3 bg-gray-900/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm text-xs sm:text-sm ai-scrollbar"
                        />
                      </div>
                      
                      <motion.button
                        type="submit"
                        className="p-2 sm:p-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={!inputValue.trim() || isTyping}
                      >
                        <IconWrapper icon={FaPaperPlane} size={14} />
                      </motion.button>
                    </div>
                  </form>
                  
                  {/* Status indicator */}
                  <div className="mt-1 sm:mt-2 text-xs text-gray-400 flex items-center justify-between">
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