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
  FaGraduationCap
} from 'react-icons/fa';
import IconWrapper from '../IconWrapper';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';

interface AIMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
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
  initialX = window.innerWidth - 450,
  initialY = 100
}) => {
  const [position, setPosition] = useState<Position>({ x: initialX, y: initialY });
  const [size, setSize] = useState<Size>({ width: 400, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; width: number; height: number }>({ x: 0, y: 0, width: 0, height: 0 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [previousState, setPreviousState] = useState<{ position: Position; size: Size } | null>(null);
  
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
        
        const newWidth = Math.max(300, Math.min(window.innerWidth - 100, resizeStart.width + deltaX));
        const newHeight = Math.max(400, Math.min(window.innerHeight - 100, resizeStart.height + deltaY));
        
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
  }, [isDragging, isResizing, dragStart, resizeStart, size, isMaximized]);

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
      const newX = Math.min(initialX, window.innerWidth - 400);
      const newY = Math.min(initialY, window.innerHeight - 600);
      setPosition({ x: newX, y: newY });
      setSize({ width: 400, height: 600 });
      setIsMaximized(false);
      setPreviousState(null);
    }
  }, [isOpen, initialX, initialY]);

  const handleSendMessage = () => {
    if (question.trim() && !isTyping) {
      onSendMessage(question);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickSuggestions = [
    { text: "Summarize this lecture", icon: FaBookOpen, category: "summary" },
    { text: "What are the key concepts?", icon: FaBrain, category: "concepts" },
    { text: "Explain the main topic", icon: FaLightbulb, category: "explanation" },
    { text: "Create practice questions", icon: FaQuestionCircle, category: "questions" },
    { text: "Learning objectives", icon: FaGraduationCap, category: "objectives" }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.8, x: 50, y: 50 }}
          animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, x: 50, y: 50 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bg-gradient-to-br from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl border border-gray-700/50 shadow-2xl z-[100] overflow-hidden rounded-xl"
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
                    {currentLecture?.title ? `Learning: ${currentLecture.title.substring(0, 25)}...` : 'Ask me anything'}
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
          <div className="flex-1 p-4 overflow-y-auto" style={{ height: size.height - 140 }}>
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
                    <h4 className="text-lg font-bold text-white mb-2">AI Learning Assistant!</h4>
                    <p className="text-gray-300 text-sm leading-relaxed mb-4">
                      I'm here to help you understand this course better. Ask me about concepts, get summaries, or request practice questions!
                    </p>
                  </motion.div>
                  
                  {/* Quick Action Buttons */}
                  <div className="grid grid-cols-1 gap-2">
                    {quickSuggestions.map((suggestion, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => {
                          onQuestionChange(suggestion.text);
                          onSendMessage(suggestion.text);
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="p-3 bg-gradient-to-r from-gray-800/50 to-gray-700/50 text-gray-300 rounded-xl text-sm hover:from-gray-700/50 hover:to-gray-600/50 transition-all duration-300 border border-gray-600/30 hover:border-purple-500/30 backdrop-blur-sm"
                      >
                        <div className="flex items-center gap-2">
                          <IconWrapper icon={suggestion.icon} size={14} className="text-purple-400" />
                          <span>{suggestion.text}</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
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
          
          {/* Input Area */}
          <div className="p-4 border-t border-gray-700/50 bg-gradient-to-r from-gray-800/50 to-gray-700/50 backdrop-blur-sm">
            <div className="flex gap-2">
              <textarea
                placeholder="Ask me anything about this lecture..."
                value={question}
                onChange={(e) => onQuestionChange(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 px-3 py-2 bg-gray-900/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 backdrop-blur-sm text-sm resize-none"
                disabled={isTyping}
                rows={2}
              />
              <motion.button 
                onClick={handleSendMessage}
                disabled={!question.trim() || isTyping}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-purple-500/25"
              >
                Send
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
                background: 'linear-gradient(-45deg, transparent 30%, rgba(255,255,255,0.3) 40%, rgba(255,255,255,0.3) 60%, transparent 70%)'
              }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AIAssistantModal; 