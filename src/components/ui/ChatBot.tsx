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

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isTyping?: boolean;
  actionButtons?: ActionButton[];
  isAIResponse?: boolean;
}

interface ActionButton {
  text: string;
  action: () => void;
  icon?: React.ReactNode;
  color?: string;
}

interface QuickQuestion {
  text: string;
  category: string;
  requiresAuth?: boolean;
  requiresPro?: boolean;
}

// Quick questions for guided interaction
const quickQuestions: QuickQuestion[] = [
  // General questions
  { text: "What is MatrixEdu?", category: "about" },
  { text: "How do I get started?", category: "help" },
  { text: "What features are available?", category: "features" },
  { text: "How much does it cost?", category: "pricing" },
  
  // Learning questions
  { text: "Help me with homework", category: "aitutor", requiresAuth: true, requiresPro: true },
  { text: "Find me courses to study", category: "courses", requiresAuth: true },
  { text: "Create flashcards for studying", category: "flashcards", requiresAuth: true, requiresPro: true },
  { text: "Write an essay for me", category: "contentwriter", requiresAuth: true, requiresPro: true },
  
  // University questions
  { text: "Find universities for me", category: "universities", requiresAuth: true },
  { text: "Track my applications", category: "applications", requiresAuth: true },
  { text: "Check admission requirements", category: "requirements", requiresAuth: true },
  
  // Account questions
  { text: "How do I sign up?", category: "signup" },
  { text: "I need to log in", category: "login" },
  { text: "Upgrade to Pro features", category: "upgrade" },
  { text: "Manage my profile", category: "profile", requiresAuth: true }
];

// Comprehensive default responses for different types of questions
const defaultResponses = {
  // Authentication & Account related
  login: {
    keywords: ['login', 'sign in', 'log in', 'account access', 'signin'],
    response: "Welcome back! I'll help you sign in to your MatrixEdu account to access all features.",
    actionButtons: [
      { text: 'Sign In', path: '/login', icon: <IconComponent icon={FaSignInAlt} />, color: 'from-blue-500 to-purple-500' }
    ]
  },
  signup: {
    keywords: ['signup', 'sign up', 'register', 'create account', 'join'],
    response: "Ready to join MatrixEdu? Create your account and start your AI-powered learning journey today!",
    actionButtons: [
      { text: 'Create Account', path: '/signup', icon: <IconComponent icon={FaUser} />, color: 'from-green-500 to-blue-500' }
    ]
  },
  profile: {
    keywords: ['profile', 'account settings', 'my account', 'personal info'],
    response: "Manage your profile - Update your personal information, preferences, and account settings.",
    actionButtons: [
      { text: 'View Profile', path: '/profile', icon: <IconComponent icon={FaUser} />, color: 'from-purple-500 to-pink-500' }
    ]
  },

  // Subscription & Pro Features
  upgrade: {
    keywords: ['upgrade', 'pro', 'premium', 'subscription', 'unlock features', 'paid plan'],
    response: "Unlock Premium Features! Get unlimited AI responses, advanced tools, and priority support with MatrixEdu Pro.",
    actionButtons: [
      { text: 'Upgrade to Pro', path: '/subscription', icon: <IconComponent icon={FaCrown} />, color: 'from-yellow-500 to-orange-500' }
    ]
  },
  pricing: {
    keywords: ['price', 'cost', 'how much', 'pricing', 'plans', 'subscription cost'],
    response: "Flexible Pricing Plans - Choose the perfect plan for your educational needs. Start with our free tier or unlock everything with Pro!",
    actionButtons: [
      { text: 'View Pricing', path: '/subscription', icon: <IconComponent icon={FaShoppingCart} />, color: 'from-green-500 to-teal-500' }
    ]
  },

  // Courses & Learning
  courses: {
    keywords: ['courses', 'learn', 'classes', 'training', 'education', 'study materials'],
    response: "Explore Our Course Library - Discover AI-powered courses, interactive learning materials, and expert-led content across various subjects.",
    actionButtons: [
      { text: 'Browse Courses', path: '/courses', icon: <IconComponent icon={FaGraduationCap} />, color: 'from-blue-500 to-indigo-500' }
    ]
  },
  aitutor: {
    keywords: ['ai tutor', 'homework help', 'tutoring', 'study help', 'learn with ai'],
    response: "AI Tutor Assistant - Get personalized help with homework, explanations, and interactive learning support powered by advanced AI.",
    actionButtons: [
      { text: 'Start AI Tutoring', path: '/ai-study', icon: <IconComponent icon={FaLightbulb} />, color: 'from-cyan-500 to-blue-500' }
    ]
  },
  flashcards: {
    keywords: ['flashcards', 'memorize', 'review', 'study cards', 'memory'],
    response: "Smart Flashcards - Create AI-generated flashcards for effective studying and memory retention.",
    actionButtons: [
      { text: 'Create Flashcards', path: '/ai-study', icon: <IconComponent icon={FaBookOpen} />, color: 'from-pink-500 to-red-500' }
    ]
  },

  // University & Applications
  universities: {
    keywords: ['university', 'college', 'universities', 'higher education', 'uni search'],
    response: "University Database - Explore thousands of universities worldwide with AI-powered matching based on your preferences and profile.",
    actionButtons: [
      { text: 'Search Universities', path: '/database', icon: <IconComponent icon={FaUniversity} />, color: 'from-purple-500 to-indigo-500' }
    ]
  },
  applications: {
    keywords: ['application', 'apply', 'admission', 'application tracker', 'track applications'],
    response: "Application Tracker - Manage your university applications, track deadlines, and stay organized throughout your admission journey.",
    actionButtons: [
      { text: 'Track Applications', path: '/database', icon: <IconComponent icon={FaChartLine} />, color: 'from-teal-500 to-green-500' }
    ]
  },
  requirements: {
    keywords: ['requirements', 'admission requirements', 'prerequisites', 'eligibility'],
    response: "Admission Requirements - Check detailed admission requirements, prerequisites, and eligibility criteria for universities.",
    actionButtons: [
      { text: 'View Requirements', path: '/database', icon: <IconComponent icon={FaFileAlt} />, color: 'from-orange-500 to-red-500' }
    ]
  },

  // Content Creation & Tools
  contentwriter: {
    keywords: ['content writer', 'essay', 'writing', 'generate content', 'write essay'],
    response: "AI Content Writer - Generate high-quality essays, personal statements, and academic content with AI assistance.",
    actionButtons: [
      { text: 'Start Writing', path: '/ai-study', icon: <IconComponent icon={FaFileAlt} />, color: 'from-green-500 to-blue-500' }
    ]
  },
  citations: {
    keywords: ['citation', 'references', 'bibliography', 'cite sources', 'apa', 'mla'],
    response: "Citation Generator - Automatically generate proper citations in APA, MLA, Chicago, and other formats for your academic work.",
    actionButtons: [
      { text: 'Generate Citations', path: '/ai-study', icon: <IconComponent icon={FaBookOpen} />, color: 'from-blue-500 to-purple-500' }
    ]
  },
  homework: {
    keywords: ['homework', 'assignment', 'upload homework', 'check homework', 'document analysis'],
    response: "Homework Assistant - Upload your homework for AI-powered analysis, error checking, and detailed feedback.",
    actionButtons: [
      { text: 'Upload Homework', path: '/ai-study', icon: <IconComponent icon={FaFileAlt} />, color: 'from-indigo-500 to-purple-500' }
    ]
  },

  // General Help & Information
  help: {
    keywords: ['help', 'support', 'assistance', 'how to', 'guide'],
    response: "Help Center - I'm here to help! You can ask me about courses, universities, AI tools, subscriptions, or any other MatrixEdu features.",
    actionButtons: [
      { text: 'Browse Features', path: '/about', icon: <IconComponent icon={FaQuestionCircle} />, color: 'from-gray-500 to-blue-500' }
    ]
  },
  about: {
    keywords: ['about', 'what is matrixedu', 'platform info', 'company'],
    response: "About MatrixEdu - We're an AI-powered education platform revolutionizing how students learn, discover universities, and achieve academic success.",
    actionButtons: [
      { text: 'Learn More', path: '/about', icon: <IconComponent icon={FaRocket} />, color: 'from-cyan-500 to-purple-500' }
    ]
  },
  features: {
    keywords: ['features', 'what can you do', 'tools', 'capabilities'],
    response: "Platform Features - AI Tutoring, University Database, Application Tracking, Content Writing, Document Analysis, Citation Generation, and more!",
    actionButtons: [
      { text: 'Explore Features', path: '/about', icon: <IconComponent icon={FaCogs} />, color: 'from-purple-500 to-pink-500' }
    ]
  },
  dashboard: {
    keywords: ['dashboard', 'home', 'main page', 'overview'],
    response: "Your Dashboard - Access all your learning tools, track progress, and manage your educational journey from one central location.",
    actionButtons: [
      { text: 'Go to Dashboard', path: '/dashboard', icon: <IconComponent icon={FaChartLine} />, color: 'from-blue-500 to-green-500' }
    ]
  },

  // Specific Questions
  howto: {
    keywords: ['how to', 'how do i', 'tutorial', 'guide me'],
    response: "Step-by-Step Guides - I can help you navigate any feature! Tell me what you'd like to do and I'll guide you through it.",
    actionButtons: [
      { text: 'Get Started', path: '/dashboard', icon: <IconComponent icon={FaLightbulb} />, color: 'from-yellow-500 to-orange-500' }
    ]
  },
  free: {
    keywords: ['free', 'free features', 'no cost', 'without paying'],
    response: "Free Features Available! - Access basic tools, limited AI responses, and explore the platform. Upgrade for unlimited access!",
    actionButtons: [
      { text: 'View Free Features', path: '/dashboard', icon: <IconComponent icon={FaRocket} />, color: 'from-green-500 to-blue-500' }
    ]
  },
  
  // Default fallback
  default: {
    keywords: [],
    response: "I'm your MatrixEdu AI Assistant! I can help you with courses, universities, AI tutoring, content creation, and more. What would you like to explore?",
    actionButtons: [
      { text: 'Explore Platform', path: '/dashboard', icon: <IconComponent icon={FaRocket} />, color: 'from-cyan-500 to-purple-500' }
    ]
  }
};

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
      text: 'Welcome to MatrixEdu! I\'m your AI-powered educational assistant. How can I help you today?', 
      sender: 'bot',
      timestamp: new Date()
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');
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

  // Find the best matching response based on keywords
  const findBestResponse = (userInput: string) => {
    const input = userInput.toLowerCase();
    
    // Check each response category for keyword matches
    for (const [key, response] of Object.entries(defaultResponses)) {
      if (key === 'default') continue;
      
      const matchCount = response.keywords.filter(keyword => 
        input.includes(keyword.toLowerCase())
      ).length;
      
      if (matchCount > 0) {
        return response;
      }
    }
    
    return defaultResponses.default;
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

  // Handle quick question clicks
  const handleQuickQuestion = (question: QuickQuestion) => {
    // Check authentication requirements
    if (question.requiresAuth && !user) {
      setUpgradeMessage('Please sign in to access this feature');
      setShowUpgradeModal(true);
      return;
    }

    // Check pro requirements
    if (question.requiresPro && !isProUser) {
      setUpgradeMessage('This feature requires a Pro subscription. Upgrade now to unlock unlimited AI assistance!');
      setShowUpgradeModal(true);
      return;
    }

    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      text: question.text,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setShowQuickQuestions(false);
    setIsTyping(true);

    // Process the question
    setTimeout(() => {
      const matchedResponse = findBestResponse(question.text);
      
      const actionButtons: ActionButton[] = matchedResponse.actionButtons?.map(button => ({
        text: button.text,
        action: () => navigate(button.path),
        icon: button.icon,
        color: button.color
      })) || [];

      const botResponse: Message = {
        id: messages.length + 2,
        text: matchedResponse.response,
        sender: 'bot',
        timestamp: new Date(),
        isAIResponse: true,
        actionButtons
      };
      
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000);
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
      // Try to use AI response for pro users
      try {
        const responseCheck = await checkAndUseResponse({
          responseType: 'chatbot',
          queryData: { message: currentInput },
          responsesUsed: 1
        });

        if (responseCheck.canProceed) {
          // Call AI API
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

    // Fall back to default responses
    setTimeout(() => {
      const matchedResponse = findBestResponse(currentInput);
      
      const actionButtons: ActionButton[] = matchedResponse.actionButtons?.map(button => ({
        text: button.text,
        action: () => navigate(button.path),
        icon: button.icon,
        color: button.color
      })) || [];

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
        text: matchedResponse.response,
        sender: 'bot',
        timestamp: new Date(),
        actionButtons
      };
      
      setMessages(prev => [...prev, botResponse]);
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
        <span>{question.text}</span>
        {(question.requiresAuth && !user) || (question.requiresPro && !isProUser) ? (
          <span className="text-orange-400 text-xs">
            {question.requiresPro ? '⭐ Pro' : '🔒 Login'}
          </span>
        ) : null}
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

              {/* Quick Questions Section */}
              {showQuickQuestions && (
                <div className="p-4 border-b border-cyan-400/20 bg-gray-900/30">
                  <h4 className="text-cyan-400 text-sm font-semibold mb-3">Quick Questions:</h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {quickQuestions.slice(0, 6).map((question, index) => (
                      <QuickQuestionButton key={index} question={question} />
                    ))}
                  </div>
                  <button
                    onClick={() => setShowQuickQuestions(false)}
                    className="text-gray-400 text-xs mt-2 hover:text-cyan-400 transition-colors"
                  >
                    Hide suggestions
                  </button>
                </div>
              )}

              {/* Chat messages with cyberpunk styling */}
              <div className={`p-4 overflow-y-auto scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-cyan-500 ${showQuickQuestions ? 'h-64' : 'h-80'}`}>
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

              {/* Show quick questions button */}
              {!showQuickQuestions && (
                <div className="px-4 pb-2">
                  <button
                    onClick={() => setShowQuickQuestions(true)}
                    className="text-cyan-400 text-xs hover:text-cyan-300 transition-colors"
                  >
                    Show quick questions
                  </button>
                </div>
              )}

              {/* Futuristic input field */}
              <div className="p-4 border-t border-cyan-400/20 bg-gray-900/50">
                <form onSubmit={handleSubmit} className="relative">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        placeholder="Ask me anything about MatrixEdu..."
                        className="w-full p-3 bg-gray-800/80 border border-cyan-400/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/20 transition-all"
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