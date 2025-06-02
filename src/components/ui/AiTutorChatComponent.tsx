import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AiOutlineRobot, 
  AiOutlineLoading3Quarters, 
  AiOutlineCopy, 
  AiOutlineEdit,
  AiOutlineDelete,
  AiOutlineDownload,
  AiOutlineSend,
  AiOutlineUser,
  AiOutlineBulb,
  AiOutlineBook,
  AiOutlineCalculator,
  AiOutlineExperiment,
  AiOutlineHistory
} from 'react-icons/ai';
import { FiThumbsUp, FiThumbsDown, FiRefreshCw, FiMaximize2, FiMinimize2, FiShare2 } from 'react-icons/fi';
import IconComponent from './IconComponent';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  liked?: boolean;
  disliked?: boolean;
  edited?: boolean;
  originalContent?: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  lastUpdated: Date;
}

interface AiTutorChatComponentProps {
  className?: string;
}

const AiTutorChatComponent: React.FC<AiTutorChatComponentProps> = ({ className = '' }) => {
  const [currentChatId, setCurrentChatId] = useState<string>('default');
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([
    {
      id: 'default',
      title: 'Welcome Chat',
      messages: [
        {
          id: '1',
          role: 'assistant',
          content: 'Hi there! I\'m your AI study assistant from Hong Kong. How can I help you with your homework today? I can assist with math, science, literature, history, and much more!',
          timestamp: new Date()
        }
      ],
      createdAt: new Date(),
      lastUpdated: new Date()
    },
    {
      id: 'math-help',
      title: 'Calculus Derivatives Help',
      messages: [
        {
          id: 'math-1',
          role: 'user',
          content: 'Can you help me understand derivatives in calculus?',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
        },
        {
          id: 'math-2',
          role: 'assistant',
          content: 'Of course! Derivatives measure the rate of change of a function. Think of it as the slope of a curve at any given point. The basic rule is: if f(x) = x^n, then f\'(x) = n·x^(n-1). For example, if f(x) = x², then f\'(x) = 2x.',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000 + 30000)
        }
      ],
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000 + 30000)
    },
    {
      id: 'chemistry-help',
      title: 'Chemistry Balancing Equations',
      messages: [
        {
          id: 'chem-1',
          role: 'user',
          content: 'How do I balance chemical equations?',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
        },
        {
          id: 'chem-2',
          role: 'assistant',
          content: 'Balancing chemical equations ensures the same number of atoms of each element on both sides. Start with the most complex molecule, then balance metals, non-metals, and finally hydrogen and oxygen. For example: H₂ + O₂ → H₂O becomes 2H₂ + O₂ → 2H₂O.',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000 + 45000)
        }
      ],
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      lastUpdated: new Date(Date.now() - 24 * 60 * 60 * 1000 + 45000)
    }
  ]);
  
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  // Get current chat session
  const currentChat = chatSessions.find(session => session.id === currentChatId) || chatSessions[0];
  const chatMessages = currentChat.messages;

  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingMessageId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingMessageId]);

  // Send message to AI API
  const sendMessageToAI = async (message: string): Promise<string> => {
    try {
      const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer 95fad12c-0768-4de2-a4c2-83247337ea89',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "doubao-vision-pro-32k-241028",
          messages: [
            {
              role: "system",
              content: "You are an AI tutor assistant from Hong Kong helping students with their homework and studies. Please provide helpful, educational responses with a friendly Hong Kong perspective. Use clear explanations and examples that students can easily understand."
            },
            {
              role: "user",
              content: message
            }
          ],
          max_tokens: 4000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || 'I apologize, but I encountered an error processing your request. Please try again.';
    } catch (error) {
      console.error('AI API Error:', error);
      return 'I\'m sorry, I\'m having trouble connecting right now. Please try again in a moment.';
    }
  };

  const generateMessageId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || loading) return;
    
    const userMessage = chatInput.trim();
    setChatInput('');
    
    // Update chat title if this is the first user message
    updateChatTitleIfNeeded(userMessage);
    
    // Add user message
    const newUserMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    
    setChatSessions(prev => prev.map(session => 
      session.id === currentChatId 
        ? { 
          ...session, 
          messages: [...session.messages, newUserMessage],
          lastUpdated: new Date()
        }
        : session
    ));
    setLoading(true);
    
    try {
      // Get AI response
      const aiResponse = await sendMessageToAI(userMessage);
      
      // Add AI response
      const newAiMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      };
      
      setChatSessions(prev => prev.map(session => 
        session.id === currentChatId 
          ? { 
            ...session, 
            messages: [...session.messages, newAiMessage],
            lastUpdated: new Date()
          }
          : session
      ));
    } catch (error) {
      console.error('Chat error:', error);
      setChatSessions(prev => prev.map(session => 
        session.id === currentChatId 
          ? { 
            ...session, 
            messages: [...session.messages, {
              id: generateMessageId(),
              role: 'assistant',
              content: 'I apologize, but I encountered an error. Please try asking your question again.',
              timestamp: new Date()
            }],
            lastUpdated: new Date()
          }
          : session
      ));
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setChatSessions(prev => prev.map(session => 
      session.id === currentChatId 
        ? { ...session, messages: [
          {
            id: '1',
            role: 'assistant',
            content: 'Hi there! I\'m your AI study assistant from Hong Kong. How can I help you with your homework today? I can assist with math, science, literature, history, and much more!',
            timestamp: new Date()
          }
        ] }
        : session
    ));
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const shareMessage = async (message: ChatMessage) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'AI Tutor Response',
          text: message.content,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback to copying to clipboard
      copyToClipboard(message.content);
    }
  };

  const downloadChat = () => {
    const chatText = chatMessages.map(msg => 
      `[${msg.timestamp.toLocaleString()}] ${msg.role === 'user' ? 'You' : 'AI Tutor'}: ${msg.content}`
    ).join('\n\n');
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-tutor-chat-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const startEditing = (message: ChatMessage) => {
    setEditingMessageId(message.id);
    setEditContent(message.content);
  };

  const saveEdit = (messageId: string) => {
    setChatSessions(prev => prev.map(session => 
      session.id === currentChatId 
        ? { ...session, messages: session.messages.map(msg => 
          msg.id === messageId 
            ? { ...msg, content: editContent, edited: true, originalContent: msg.originalContent || msg.content }
            : msg
        ) }
        : session
    ));
    setEditingMessageId(null);
    setEditContent('');
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditContent('');
  };

  const deleteMessage = (messageId: string) => {
    setChatSessions(prev => prev.map(session => 
      session.id === currentChatId 
        ? { ...session, messages: session.messages.filter(msg => msg.id !== messageId) }
        : session
    ));
  };

  const likeMessage = (messageId: string) => {
    setChatSessions(prev => prev.map(session => 
      session.id === currentChatId 
        ? { ...session, messages: session.messages.map(msg => 
          msg.id === messageId 
            ? { ...msg, liked: !msg.liked, disliked: false }
            : msg
        ) }
        : session
    ));
  };

  const dislikeMessage = (messageId: string) => {
    setChatSessions(prev => prev.map(session => 
      session.id === currentChatId 
        ? { ...session, messages: session.messages.map(msg => 
          msg.id === messageId 
            ? { ...msg, disliked: !msg.disliked, liked: false }
            : msg
        ) }
        : session
    ));
  };

  const regenerateResponse = async (messageId: string) => {
    const messageIndex = chatMessages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1 || messageIndex === 0) return;
    
    const previousUserMessage = chatMessages[messageIndex - 1];
    if (previousUserMessage.role !== 'user') return;
    
    setLoading(true);
    
    try {
      const newResponse = await sendMessageToAI(previousUserMessage.content);
      setChatSessions(prev => prev.map(session => 
        session.id === currentChatId 
          ? { ...session, messages: session.messages.map(msg => 
            msg.id === messageId 
              ? { ...msg, content: newResponse, timestamp: new Date() }
              : msg
          ) }
          : session
      ));
    } catch (error) {
      console.error('Regeneration error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Chat session management functions
  const createNewChat = () => {
    const newChatId = `chat-${Date.now()}`;
    const newChat: ChatSession = {
      id: newChatId,
      title: 'New Chat',
      messages: [
        {
          id: generateMessageId(),
          role: 'assistant',
          content: 'Hi there! I\'m your AI study assistant from Hong Kong. How can I help you with your homework today? I can assist with math, science, literature, history, and much more!',
          timestamp: new Date()
        }
      ],
      createdAt: new Date(),
      lastUpdated: new Date()
    };
    
    setChatSessions(prev => [newChat, ...prev]);
    setCurrentChatId(newChatId);
    setShowHistory(false);
  };

  const switchToChat = (chatId: string) => {
    setCurrentChatId(chatId);
    setShowHistory(false);
  };

  const deleteChat = (chatId: string) => {
    if (chatSessions.length <= 1) return; // Don't delete the last chat
    
    setChatSessions(prev => prev.filter(session => session.id !== chatId));
    
    // If we're deleting the current chat, switch to the first remaining chat
    if (chatId === currentChatId) {
      const remainingChats = chatSessions.filter(session => session.id !== chatId);
      if (remainingChats.length > 0) {
        setCurrentChatId(remainingChats[0].id);
      }
    }
  };

  const updateChatTitle = (chatId: string, newTitle: string) => {
    setChatSessions(prev => prev.map(session => 
      session.id === chatId 
        ? { ...session, title: newTitle }
        : session
    ));
  };

  const generateChatTitle = (firstUserMessage: string) => {
    // Generate a title from the first user message
    const words = firstUserMessage.split(' ').slice(0, 4);
    return words.join(' ') + (firstUserMessage.split(' ').length > 4 ? '...' : '');
  };

  // Update chat title when first user message is sent
  const updateChatTitleIfNeeded = (userMessage: string) => {
    if (currentChat.title === 'New Chat' && currentChat.messages.length === 1) {
      const newTitle = generateChatTitle(userMessage);
      updateChatTitle(currentChatId, newTitle);
    }
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const quickActions = [
    { text: "Help with math homework", icon: AiOutlineCalculator },
    { text: "Explain a concept", icon: AiOutlineBulb },
    { text: "Check my work", icon: AiOutlineBook },
    { text: "Science experiment help", icon: AiOutlineExperiment },
    { text: "Study tips", icon: AiOutlineUser },
    { text: "Essay writing help", icon: AiOutlineEdit }
  ];

  const buttonVariants = {
    hover: { scale: 1.05, boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.1)" },
    tap: { scale: 0.98 }
  };

  const messageVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  const containerClass = isFullscreen 
    ? "fixed inset-0 z-50 bg-white flex flex-col" 
    : `flex flex-col h-[700px] ${className}`;

  return (
    <div className={containerClass}>
      {/* Chat Header */}
      <div className="flex justify-between items-center p-4 bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-lg">
        <div className="flex items-center flex-1">
          <div className="relative">
            <IconComponent icon={AiOutlineRobot} className="h-8 w-8 mr-3" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold truncate">{currentChat.title}</h3>
            <p className="text-xs text-teal-100">Online • Ready to help</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={createNewChat}
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            title="New chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </motion.button>
          
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => setShowHistory(!showHistory)}
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            title="Chat history"
          >
            <IconComponent icon={AiOutlineHistory} className="h-5 w-5" />
          </motion.button>
          
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={downloadChat}
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            title="Download chat"
          >
            <IconComponent icon={AiOutlineDownload} className="h-5 w-5" />
          </motion.button>
          
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
          >
            <IconComponent icon={isFullscreen ? FiMinimize2 : FiMaximize2} className="h-5 w-5" />
          </motion.button>
          
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={clearChat}
            className="px-3 py-2 bg-white/20 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors"
          >
            Clear Chat
          </motion.button>
        </div>
      </div>

      {/* Chat Messages */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-gray-100 p-4 space-y-4">
        <AnimatePresence>
          {chatMessages.map((msg, index) => (
            <motion.div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              variants={messageVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <div className={`max-w-[85%] group ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                {/* Message bubble */}
                <div className={`relative rounded-2xl px-4 py-3 shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white rounded-tr-none ml-auto' 
                    : 'bg-white border border-gray-200 rounded-tl-none shadow-md'
                }`}>
                  {editingMessageId === msg.id ? (
                    <div className="space-y-2">
                      <textarea
                        ref={editInputRef}
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg resize-none text-gray-800"
                        rows={3}
                      />
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => saveEdit(msg.id)}
                          className="px-3 py-1 bg-teal-600 text-white rounded-lg text-sm hover:bg-teal-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1 bg-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-400"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      {msg.edited && (
                        <p className="text-xs mt-1 opacity-70 italic">
                          (edited)
                        </p>
                      )}
                    </>
                  )}
                  
                  {/* Timestamp */}
                  <div className="flex items-center justify-between mt-2">
                    <p className={`text-xs ${
                      msg.role === 'user' ? 'text-teal-100' : 'text-gray-500'
                    }`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    
                    {/* Message actions */}
                    {editingMessageId !== msg.id && (
                      <div className={`flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                        msg.role === 'user' ? 'text-teal-100' : 'text-gray-500'
                      }`}>
                        <button
                          onClick={() => copyToClipboard(msg.content)}
                          className="p-1 hover:bg-black/10 rounded"
                          title="Copy message"
                        >
                          <IconComponent icon={AiOutlineCopy} className="h-3 w-3" />
                        </button>
                        
                        <button
                          onClick={() => shareMessage(msg)}
                          className="p-1 hover:bg-black/10 rounded"
                          title="Share message"
                        >
                          <IconComponent icon={FiShare2} className="h-3 w-3" />
                        </button>
                        
                        {msg.role === 'user' && (
                          <button
                            onClick={() => startEditing(msg)}
                            className="p-1 hover:bg-black/10 rounded"
                            title="Edit message"
                          >
                            <IconComponent icon={AiOutlineEdit} className="h-3 w-3" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => deleteMessage(msg.id)}
                          className="p-1 hover:bg-black/10 rounded"
                          title="Delete message"
                        >
                          <IconComponent icon={AiOutlineDelete} className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* AI message actions */}
                {msg.role === 'assistant' && editingMessageId !== msg.id && (
                  <div className="flex items-center justify-start mt-2 space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => likeMessage(msg.id)}
                      className={`p-1 rounded-full transition-colors ${
                        msg.liked ? 'bg-green-100 text-green-600' : 'hover:bg-gray-100 text-gray-500'
                      }`}
                      title="Like response"
                    >
                      <IconComponent icon={FiThumbsUp} className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => dislikeMessage(msg.id)}
                      className={`p-1 rounded-full transition-colors ${
                        msg.disliked ? 'bg-red-100 text-red-600' : 'hover:bg-gray-100 text-gray-500'
                      }`}
                      title="Dislike response"
                    >
                      <IconComponent icon={FiThumbsDown} className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => regenerateResponse(msg.id)}
                      className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
                      title="Regenerate response"
                      disabled={loading}
                    >
                      <IconComponent icon={FiRefreshCw} className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Loading indicator */}
        {loading && (
          <motion.div
            className="flex justify-start"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none px-4 py-3 shadow-md">
              <div className="flex items-center space-x-2">
                <IconComponent icon={AiOutlineLoading3Quarters} className="h-4 w-4 animate-spin text-teal-600" />
                <span className="text-gray-600">AI is thinking...</span>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={chatEndRef} />
      </div>
      
      {/* History Panel */}
      {showHistory && (
        <motion.div 
          className="px-4 py-3 bg-white border-t border-gray-200 max-h-80 overflow-y-auto"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">Chat History</h4>
            <div className="flex items-center space-x-2">
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={createNewChat}
                className="px-3 py-1 bg-teal-600 text-white rounded-lg text-xs font-medium hover:bg-teal-700 transition-colors"
              >
                + New Chat
              </motion.button>
              <button
                onClick={() => setShowHistory(false)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Hide
              </button>
            </div>
          </div>
          <div className="space-y-2">
            {chatSessions.map((session) => (
              <motion.div
                key={session.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors group ${
                  session.id === currentChatId 
                    ? 'bg-teal-50 border border-teal-200' 
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
                onClick={() => switchToChat(session.id)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      session.id === currentChatId ? 'text-teal-700' : 'text-gray-700'
                    }`}>
                      {session.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatRelativeTime(session.lastUpdated)}
                    </p>
                    {session.messages.length > 1 && (
                      <p className="text-xs text-gray-400 mt-1 truncate">
                        {session.messages[session.messages.length - 1].content.substring(0, 50)}...
                      </p>
                    )}
                  </div>
                  
                  {/* Delete button - only show if not the last chat */}
                  {chatSessions.length > 1 && (
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChat(session.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <IconComponent icon={AiOutlineDelete} className="h-3 w-3" />
                    </motion.button>
                  )}
                </div>
                
                {/* Message count indicator */}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">
                    {session.messages.length} message{session.messages.length !== 1 ? 's' : ''}
                  </span>
                  {session.id === currentChatId && (
                    <span className="text-xs text-teal-600 font-medium">Current</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
          
          {chatSessions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <IconComponent icon={AiOutlineHistory} className="mx-auto text-4xl mb-2" />
              <p>No chat history yet</p>
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={createNewChat}
                className="mt-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium"
              >
                Start Your First Chat
              </motion.button>
            </div>
          )}
        </motion.div>
      )}
      
      {/* Quick Actions */}
      {showQuickActions && chatMessages.length <= 1 && (
        <motion.div 
          className="px-4 py-2 bg-white border-t border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600 font-medium">Quick actions:</p>
            <button
              onClick={() => setShowQuickActions(false)}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              Hide
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {quickActions.map((action, index) => (
              <motion.button
                key={index}
                onClick={() => setChatInput(action.text)}
                className="flex items-center p-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <IconComponent icon={action.icon} className="h-4 w-4 mr-2 text-teal-600" />
                <span className="truncate">{action.text}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
      
      {/* Chat Input */}
      <motion.div 
        className="p-4 bg-white border-t border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <form onSubmit={handleChatSubmit} className="relative">
          <div className="relative flex items-end space-x-2">
            <div className="flex-1 relative">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleChatSubmit(e);
                  }
                }}
                className="w-full p-3 pr-12 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white shadow-sm resize-none max-h-32"
                placeholder="Ask anything about your homework... (Shift+Enter for new line)"
                disabled={loading}
                rows={1}
                style={{ minHeight: '44px' }}
              />
              
              <div className="absolute right-2 bottom-2 flex items-center space-x-1">
                <motion.button
                  type="submit"
                  className={`p-2 rounded-full transition-colors ${
                    loading || !chatInput.trim()
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-teal-600 hover:bg-teal-700'
                  } text-white`}
                  variants={buttonVariants}
                  whileHover={!loading && chatInput.trim() ? "hover" : undefined}
                  whileTap={!loading && chatInput.trim() ? "tap" : undefined}
                  disabled={loading || !chatInput.trim()}
                >
                  {loading ? (
                    <IconComponent icon={AiOutlineLoading3Quarters} className="h-5 w-5 animate-spin" />
                  ) : (
                    <IconComponent icon={AiOutlineSend} className="h-5 w-5" />
                  )}
                </motion.button>
              </div>
            </div>
          </div>
        </form>
        
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>AI can make mistakes. Please verify important information.</span>
          <span>{chatInput.length}/2000</span>
        </div>
      </motion.div>
    </div>
  );
};

export default AiTutorChatComponent; 