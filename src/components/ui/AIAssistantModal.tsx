import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaTimes, 
  FaExpand, 
  FaCompress, 
  FaRobot, 
  FaUser, 
  FaLightbulb, 
  FaBrain, 
  FaListUl,
  FaQuestionCircle,
  FaBookOpen,
  FaGraduationCap,
  FaPaperPlane
} from 'react-icons/fa';
import IconWrapper from '../IconWrapper';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';
import { useAuth } from '../../utils/AuthContext';
import { useSubscription } from '../../utils/SubscriptionContext';
import { useNavigate } from 'react-router-dom';
import { quickQuestionsData, getAIAssistantQuestions, type QuickQuestion } from '../../data/quickQuestions';

interface AIMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  quickQuestions?: QuickQuestion[];
}

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLecture?: {
    id: string;
    title: string;
    description?: string;
    lecture_type: 'video' | 'article' | 'quiz' | 'assignment' | 'resource';
    video_url?: string;
    video_duration_seconds?: number;
    article_content?: string;
    resource_url?: string;
    lecture_order: number;
    is_preview: boolean;
    is_free: boolean;
    summary?: string;
  } | null;
  messages: AIMessage[];
  onSendMessage: (message: string) => void;
  isTyping: boolean;
  question: string;
  onQuestionChange: (question: string) => void;
  initialX?: number;
  initialY?: number;
}

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  currentLecture,
  messages,
  onSendMessage,
  isTyping,
  question,
  onQuestionChange,
  initialX = Math.max(50, window.innerWidth - 500),
  initialY = 50
}) => {
  // AI Assistant Modal is for course-specific help and doesn't deduct user responses
  // This is different from ChatBot which is for general website guidance and does deduct responses for AI features
  const { user } = useAuth();
  const { isProUser } = useSubscription();
  const navigate = useNavigate();
  
  const [position, setPosition] = useState<Position>({ x: initialX, y: initialY });
  const [size, setSize] = useState<Size>({ width: 450, height: Math.min(700, window.innerHeight - 100) });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; width: number; height: number }>({ x: 0, y: 0, width: 0, height: 0 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [previousState, setPreviousState] = useState<{ position: Position; size: Size } | null>(null);
  const [currentQuestions, setCurrentQuestions] = useState<QuickQuestion[]>(getAIAssistantQuestions());
  const [questionHistory, setQuestionHistory] = useState<QuickQuestion[][]>([getAIAssistantQuestions()]);
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);
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

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMaximized) return;
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  // Handle resizing
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    if (isMaximized) return;
    
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    });
  };

  // Handle mouse move
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && !isMaximized) {
        const newX = Math.max(0, Math.min(window.innerWidth - size.width, e.clientX - dragStart.x));
        const newY = Math.max(0, Math.min(window.innerHeight - size.height, e.clientY - dragStart.y));
        setPosition({ x: newX, y: newY });
      }
      
      if (isResizing && !isMaximized) {
        const deltaX = e.clientX - resizeStart.x;
        const deltaY = e.clientY - resizeStart.y;
        
        const newWidth = Math.max(400, Math.min(window.innerWidth - position.x - 20, resizeStart.width + deltaX));
        const newHeight = Math.max(500, Math.min(window.innerHeight - position.y - 20, resizeStart.height + deltaY));
        
        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragStart, resizeStart, size, position, isMaximized]);

  // Handle double-click to maximize/restore
  const handleDoubleClick = () => {
    if (isMaximized) {
      // Restore
      if (previousState) {
        setPosition(previousState.position);
        setSize(previousState.size);
        setIsMaximized(false);
        setPreviousState(null);
      }
    } else {
      // Maximize
      setPreviousState({ position, size });
      setPosition({ x: 0, y: 0 });
      setSize({ width: window.innerWidth, height: window.innerHeight });
      setIsMaximized(true);
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Reset position when modal opens
  useEffect(() => {
    if (isOpen) {
      const maxWidth = Math.min(450, window.innerWidth - 100);
      const maxHeight = Math.min(700, window.innerHeight - 100);
      const newX = Math.min(Math.max(50, window.innerWidth - maxWidth - 50), window.innerWidth - maxWidth);
      const newY = Math.min(initialY, window.innerHeight - maxHeight);
      
      setPosition({ x: newX, y: newY });
      setSize({ width: maxWidth, height: maxHeight });
      setIsMaximized(false);
      setPreviousState(null);
      setCurrentQuestions(getAIAssistantQuestions());
      setQuestionHistory([getAIAssistantQuestions()]);
      setShowQuickQuestions(true);
    }
  }, [isOpen, initialY]);

  // Handle quick question click - AI Assistant doesn't deduct responses
  const handleQuickQuestion = (questionData: QuickQuestion) => {
    // Check authentication requirements
    if (questionData.requiresAuth && !user) {
      navigate('/login');
      return;
    }

    // Check pro requirements
    if (questionData.requiresPro && !isProUser) {
      navigate('/subscription');
      return;
    }

    // Send the question
    onSendMessage(questionData.text);
    
    // Update quick questions with follow-ups if available
    if (questionData.followUpQuestions && questionData.followUpQuestions.length > 0) {
      setCurrentQuestions(questionData.followUpQuestions);
      setQuestionHistory(prev => [...prev, questionData.followUpQuestions!]);
    } else {
      // If no follow-ups, hide quick questions
      setShowQuickQuestions(false);
    }

    // Navigate if action path is provided
    if (questionData.actionPath) {
      setTimeout(() => {
        navigate(questionData.actionPath!);
      }, 1000);
    }
  };

  // Handle back navigation in questions
  const handleBackQuestions = () => {
    if (questionHistory.length > 1) {
      const newHistory = questionHistory.slice(0, -1);
      setQuestionHistory(newHistory);
      setCurrentQuestions(newHistory[newHistory.length - 1]);
    } else {
      setCurrentQuestions(getAIAssistantQuestions());
      setQuestionHistory([getAIAssistantQuestions()]);
    }
  };

  const handleSendMessage = () => {
    if (question.trim() && !isTyping) {
      onSendMessage(question);
      setShowQuickQuestions(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const chatHeight = isMaximized 
    ? size.height - 200  // Header + input area
    : Math.max(300, size.height - 200);

  const quickQuestionsHeight = showQuickQuestions ? Math.min(200, currentQuestions.length * 45 + 60) : 0;
  const messagesHeight = chatHeight - quickQuestionsHeight;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.8, x: 50, y: 50 }}
          animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, x: 50, y: 50 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl border border-gray-700/50 shadow-2xl z-[100] overflow-hidden rounded-xl ai-scrollbar"
          style={{
            left: position.x,
            top: position.y,
            width: size.width,
            height: size.height,
            cursor: isDragging ? 'grabbing' : 'default'
          }}
        >
          {/* Header */}
          <div
            ref={headerRef}
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDoubleClick}
            className="p-4 border-b border-gray-700/50 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-blue-600/20 backdrop-blur-sm cursor-grab active:cursor-grabbing select-none"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                    <IconWrapper icon={FaRobot} className="text-white" size={16} />
                  </div>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-gray-900 animate-pulse"></div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    AI Learning Assistant
                  </h3>
                  <p className="text-xs text-gray-400">
                    {currentLecture?.title ? `Learning: ${currentLecture.title.substring(0, 25)}...` : 'Ready to help you learn'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Maximize/Restore button */}
                <motion.button
                  onClick={handleDoubleClick}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300"
                >
                  <IconWrapper icon={isMaximized ? FaCompress : FaExpand} size={14} />
                </motion.button>
                
                {/* Close button */}
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-2 text-gray-400 hover:text-white hover:bg-red-500/20 rounded-lg transition-all duration-300"
                >
                  <IconWrapper icon={FaTimes} size={14} />
                </motion.button>
              </div>
            </div>
          </div>

          {/* Chat Content */}
          <div className="flex flex-col" style={{ height: chatHeight }}>
            {/* Messages Area */}
            <div 
              className="flex-1 p-4 overflow-y-auto ai-scrollbar" 
              style={{ height: messagesHeight }}
            >
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <div className="text-center py-4">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-2xl p-4 mb-4 border border-purple-500/20"
                    >
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
                        <IconWrapper icon={FaRobot} size={20} className="text-white" />
                      </div>
                      <h4 className="text-lg font-bold text-white mb-2">Course AI Assistant Ready!</h4>
                      <p className="text-gray-300 text-sm leading-relaxed mb-3">
                        {currentLecture 
                          ? `I'm here to help you understand "${currentLecture.title}" better. Ask me anything about this lecture!`
                          : "I'm your course companion! I can help explain concepts, answer questions, and provide study assistance."
                        }
                      </p>
                      {currentLecture && currentLecture.summary && (
                        <div className="bg-gradient-to-r from-blue-800/30 to-purple-800/30 rounded-xl p-3 mt-3 border border-blue-500/20">
                          <h5 className="text-sm font-semibold text-blue-300 mb-2">📋 Lecture Summary:</h5>
                          <p className="text-xs text-gray-300 leading-relaxed">{currentLecture.summary}</p>
                        </div>
                      )}
                    </motion.div>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.type === 'assistant' && (
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <IconWrapper icon={FaRobot} size={12} className="text-white" />
                          </div>
                        )}
                        <div className={`max-w-[85%] p-3 rounded-2xl backdrop-blur-sm border text-sm ${
                          message.type === 'user' 
                            ? 'bg-gradient-to-r from-blue-600/80 to-purple-600/80 text-white border-blue-500/30' 
                            : 'bg-gradient-to-r from-gray-800/80 to-gray-700/80 text-gray-200 border-gray-600/30'
                        }`}>
                          <div className="text-sm whitespace-pre-wrap leading-relaxed">
                            {message.type === 'assistant' ? (
                              <ReactMarkdown
                                components={markdownComponents}
                                remarkPlugins={[remarkMath, remarkGfm]}
                                rehypePlugins={[rehypeKatex]}
                              >
                                {message.content}
                              </ReactMarkdown>
                            ) : (
                              message.content
                            )}
                          </div>
                          <p className="text-xs opacity-70 mt-2">
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        {message.type === 'user' && (
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                            <IconWrapper icon={FaUser} size={12} className="text-white" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                    
                    {isTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-3 justify-start"
                      >
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <IconWrapper icon={FaRobot} size={12} className="text-white" />
                        </div>
                        <div className="bg-gradient-to-r from-gray-800/80 to-gray-700/80 p-3 rounded-2xl backdrop-blur-sm border border-gray-600/30">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            <span className="text-gray-400 text-sm ml-2">AI is thinking...</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>
            </div>

            {/* Quick Questions Area */}
            {showQuickQuestions && (
              <div 
                className="border-t border-gray-700/50 bg-gradient-to-r from-gray-800/30 to-gray-700/30 p-4 overflow-y-auto ai-scrollbar"
                style={{ height: quickQuestionsHeight }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-cyan-400">Quick Questions</h4>
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
                <div className="grid grid-cols-1 gap-2">
                  {currentQuestions.map((questionData, index) => (
                    <motion.button
                      key={questionData.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleQuickQuestion(questionData)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="p-3 bg-gradient-to-r from-gray-800/50 to-gray-700/50 text-gray-300 rounded-xl text-sm hover:from-gray-700/50 hover:to-gray-600/50 transition-all duration-300 border border-gray-600/30 hover:border-purple-500/30 backdrop-blur-sm text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{questionData.icon}</span>
                        <span className="flex-1">{questionData.text}</span>
                        {(questionData.requiresAuth && !user) || (questionData.requiresPro && !isProUser) ? (
                          <span className="text-xs px-2 py-1 bg-orange-500/20 text-orange-300 rounded-full">
                            {questionData.requiresPro ? 'Pro' : 'Login'}
                          </span>
                        ) : questionData.followUpQuestions ? (
                          <span className="text-purple-400">→</span>
                        ) : null}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Input Area */}
          <div className="p-4 border-t border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-700/50 backdrop-blur-sm">
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
            <div className="flex gap-2">
              <textarea
                placeholder={currentLecture 
                  ? `Ask me about "${currentLecture.title.substring(0, 30)}..."` 
                  : "Ask me anything about this course..."
                }
                value={question}
                onChange={(e) => onQuestionChange(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 px-3 py-2 bg-gray-900/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm text-sm resize-none ai-scrollbar"
                disabled={isTyping}
                rows={2}
              />
              <motion.button 
                onClick={handleSendMessage}
                disabled={!question.trim() || isTyping}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/25 flex items-center gap-2"
              >
                <IconWrapper icon={FaPaperPlane} size={14} />
                <span className="hidden sm:inline">Send</span>
              </motion.button>
            </div>
          </div>

          {/* Resize handle */}
          {!isMaximized && (
            <div
              ref={resizeRef}
              onMouseDown={handleResizeMouseDown}
              className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-50 hover:opacity-100 transition-opacity"
              style={{
                background: 'linear-gradient(-45deg, transparent 30%, rgba(147, 51, 234, 0.5) 40%, rgba(147, 51, 234, 0.5) 60%, transparent 70%)'
              }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AIAssistantModal; 