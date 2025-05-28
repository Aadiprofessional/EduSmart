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
  AiOutlineExperiment
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

interface AiTutorChatComponentProps {
  className?: string;
}

const AiTutorChatComponent: React.FC<AiTutorChatComponentProps> = ({ className = '' }) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hi there! I\'m your AI study assistant. How can I help you with your homework today? I can assist with math, science, literature, history, and much more!',
      timestamp: new Date()
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(true);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when new messages are added
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
      const response = await fetch('https://dashscope.aliyuncs.com/api/v1/apps/33b3f866ff054f2eb98d17c174239fc8/completion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sk-58ed6751f00d4ad9ac9d606ee085b065',
          'Accept-Language': 'en-US,en'
        },
        body: JSON.stringify({
          input: {
            prompt: `You are an AI tutor assistant helping students with their homework and studies. Please provide helpful, educational responses to the following question or request: ${message}`
          },
          parameters: {
            stream: false,
            incremental_output: false,
            response_format: {
              language: "en"
            }
          },
          debug: {}
        })
      });

      const data = await response.json();
      return data.output?.text || 'I apologize, but I encountered an error processing your request. Please try again.';
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
    
    // Add user message
    const newUserMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    
    setChatMessages(prev => [...prev, newUserMessage]);
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
      
      setChatMessages(prev => [...prev, newAiMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      setChatMessages(prev => [...prev, {
        id: generateMessageId(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try asking your question again.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setChatMessages([{
      id: '1',
      role: 'assistant',
      content: 'Hi there! I\'m your AI study assistant. How can I help you with your homework today? I can assist with math, science, literature, history, and much more!',
      timestamp: new Date()
    }]);
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
    setChatMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, content: editContent, edited: true, originalContent: msg.originalContent || msg.content }
        : msg
    ));
    setEditingMessageId(null);
    setEditContent('');
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditContent('');
  };

  const deleteMessage = (messageId: string) => {
    setChatMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const likeMessage = (messageId: string) => {
    setChatMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, liked: !msg.liked, disliked: false }
        : msg
    ));
  };

  const dislikeMessage = (messageId: string) => {
    setChatMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, disliked: !msg.disliked, liked: false }
        : msg
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
      setChatMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: newResponse, timestamp: new Date() }
          : msg
      ));
    } catch (error) {
      console.error('Regeneration error:', error);
    } finally {
      setLoading(false);
    }
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
        <div className="flex items-center">
          <div className="relative">
            <IconComponent icon={AiOutlineRobot} className="h-8 w-8 mr-3" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <h3 className="text-lg font-semibold">AI Tutor Assistant</h3>
            <p className="text-xs text-teal-100">Online • Ready to help</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
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
      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-gray-100 p-4 space-y-4">
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