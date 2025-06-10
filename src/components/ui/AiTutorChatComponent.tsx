import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AiOutlineRobot,
  AiOutlineLoading3Quarters, 
  AiOutlineCopy,
  AiOutlineEdit,
  AiOutlineDownload,
  AiOutlineSend,
  AiOutlineUser,
  AiOutlineBulb,
  AiOutlineBook,
  AiOutlineCalculator,
  AiOutlineExperiment,
  AiOutlineHistory
} from 'react-icons/ai';
import { FiSend, FiThumbsUp, FiThumbsDown, FiRefreshCw, FiMaximize2, FiMinimize2, FiShare2, FiImage, FiTrash2, FiEdit3, FiCopy, FiDownload, FiPlus, FiMessageSquare } from 'react-icons/fi';
import IconComponent from './IconComponent';

// Import markdown and math libraries
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';

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
    }
  ]);
  
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<{ file: File; base64: string; extractedText: string } | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Preprocess LaTeX for react-markdown
  const preprocessLaTeX = (content: string) => {
    return content
      .replace(/\\\[(.*?)\\\]/g, (_, eq) => `$$${eq}$$`)   // block math
      .replace(/\\\((.*?)\\\)/g, (_, eq) => `$${eq}$`);    // inline math
  };

  // Custom components for ReactMarkdown
  const markdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match[1]}
          PreTag="div"
          className="rounded-lg"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={`${className} bg-slate-600/50 text-cyan-300 px-2 py-1 rounded text-sm font-mono`} {...props}>
          {children}
        </code>
      );
    },
    h1: ({ children }: any) => <h1 className="text-2xl font-bold text-cyan-400 mt-6 mb-3 border-b-2 border-cyan-500/30 pb-2">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-xl font-bold text-blue-400 mt-5 mb-2 border-b border-blue-500/30 pb-1">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-lg font-bold text-teal-400 mt-4 mb-2 bg-teal-500/10 px-3 py-2 rounded border border-teal-500/20">{children}</h3>,
    h4: ({ children }: any) => <h4 className="text-base font-semibold text-slate-300 mt-3 mb-2">{children}</h4>,
    p: ({ children }: any) => <p className="text-slate-300 mb-3 leading-relaxed">{children}</p>,
    ul: ({ children }: any) => <ul className="list-disc list-inside mb-3 text-slate-300 space-y-1">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal list-inside mb-3 text-slate-300 space-y-1">{children}</ol>,
    li: ({ children }: any) => <li className="mb-1 pl-2">{children}</li>,
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-cyan-500 pl-4 my-3 bg-cyan-500/10 py-3 rounded-r italic text-slate-300">
        {children}
      </blockquote>
    ),
    strong: ({ children }: any) => <strong className="font-bold text-cyan-400 bg-cyan-500/10 px-1 rounded">{children}</strong>,
    em: ({ children }: any) => <em className="italic text-slate-300">{children}</em>,
    table: ({ children }: any) => (
      <div className="overflow-x-auto my-3">
        <table className="min-w-full border border-white/20 rounded-lg overflow-hidden">{children}</table>
      </div>
    ),
    thead: ({ children }: any) => <thead className="bg-slate-600/50">{children}</thead>,
    tbody: ({ children }: any) => <tbody>{children}</tbody>,
    tr: ({ children }: any) => <tr className="border-b border-white/10 hover:bg-slate-600/30">{children}</tr>,
    th: ({ children }: any) => <th className="px-3 py-2 text-left font-semibold text-cyan-400 text-sm">{children}</th>,
    td: ({ children }: any) => <td className="px-3 py-2 text-slate-300 text-sm">{children}</td>,
    a: ({ children, href }: any) => (
      <a href={href} className="text-cyan-400 hover:text-cyan-300 underline font-medium" target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
  };

  // Send message to AI API with streaming
  const sendMessageToAI = async (
    message: string, 
    onChunk?: (chunk: string) => void
  ): Promise<string> => {
    console.log('🔄 Starting AI Tutor API request');
    console.log('📝 Message:', message);
    
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
                  text: "You are an AI tutor assistant helping students with their homework and studies. Provide helpful, educational responses with clear explanations and examples that students can easily understand. Use proper markdown formatting for better readability."
                }
              ]
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Please help me with this question or topic:${message}`
                }
              ]
            }
          ],
          stream: true
        })
      });

      console.log('📊 API Response status:', response.status);

      if (!response.ok) {
        console.error('❌ API request failed:', response.status, response.statusText);
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      let fullContent = '';
      let isFirstChunk = true;
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('🏁 Streaming completed');
            break;
          }
          
          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                console.log('✅ Stream marked as DONE');
                continue;
              }
              
              try {
                const parsed = JSON.parse(data);
                const content_chunk = parsed.choices?.[0]?.delta?.content;
                
                if (content_chunk) {
                  if (isFirstChunk) {
                    console.log('📝 First content chunk received');
                    isFirstChunk = false;
                  }
                  
                  fullContent += content_chunk;
                  
                  // Call the chunk callback if provided for real-time updates
                  if (onChunk) {
                    onChunk(content_chunk);
                  }
                }
              } catch (parseError) {
                // Skip invalid JSON lines
                continue;
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      console.log('✅ AI Tutor API request completed successfully');
      console.log('📊 Final content length:', fullContent.length);
      
      return fullContent.trim() || 'I apologize, but I could not generate a response. Please try again.';
    } catch (error) {
      console.error('💥 Error in sendMessageToAI:', error);
      throw new Error('Failed to get response from AI. Please try again.');
    }
  };

  // Handle image upload and text extraction
  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      // Convert image to base64
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

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
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: base64Image
                  }
                },
                {
                  type: "text",
                  text: "Please extract all text from this image exactly as it appears, maintaining line breaks and formatting. If there are any diagrams, mathematical expressions, or visual elements, please describe them clearly so that the content can be understood. Focus on accuracy and completeness."
                }
              ]
            }
          ],
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      let extractedText = '';
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n').filter(line => line.trim() !== '');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta) {
                  const delta = parsed.choices[0].delta;
                  
                  if (delta.content) {
                    extractedText += delta.content;
                  }
                }
              } catch (parseError) {
                console.warn('Failed to parse streaming data:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      return extractedText.trim();
    } catch (error) {
      console.error('Error extracting text from image:', error);
      throw new Error('Failed to extract text from image. Please try again.');
    }
  };

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, JPEG, etc.)');
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    try {
      setIsUploading(true);
      
      // Convert image to base64
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Extract text from image
      const extractedText = await handleImageUpload(file);
      
      // Set uploaded image data
      setUploadedImage({
        file,
        base64: base64Image,
        extractedText
      });
      
    } catch (error) {
      console.error('Error processing image:', error);
      alert('Failed to process image. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const generateMessageId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!chatInput.trim() && !uploadedImage) || isLoading) return;

    const messageContent = uploadedImage 
      ? `${chatInput}\n\n[Image: ${uploadedImage.file.name}]\n\nExtracted text from image:\n${uploadedImage.extractedText}`
      : chatInput;

    const userMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'user',
      content: messageContent,
      timestamp: new Date()
    };

    // Add user message immediately
    setChatSessions(prev => 
      prev.map(session => 
        session.id === currentChatId 
          ? { 
              ...session, 
              messages: [...session.messages, userMessage],
              lastUpdated: new Date()
            }
          : session
      )
    );

    const userInput = messageContent;
    setChatInput('');
    setUploadedImage(null);
    setIsLoading(true);

    // Create assistant message placeholder for streaming
    const assistantMessageId = generateMessageId();
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date()
    };

    // Add empty assistant message
    setChatSessions(prev => 
      prev.map(session => 
        session.id === currentChatId 
          ? { 
              ...session, 
              messages: [...session.messages, assistantMessage],
              lastUpdated: new Date()
            }
          : session
      )
    );

    try {
      // Stream the response
      await sendMessageToAI(userInput, (chunk: string) => {
        // Update the assistant message in real-time
        setChatSessions(prev => 
          prev.map(session => 
            session.id === currentChatId 
              ? { 
                  ...session, 
                  messages: session.messages.map(msg => 
                    msg.id === assistantMessageId 
                      ? { ...msg, content: msg.content + chunk }
                      : msg
                  ),
                  lastUpdated: new Date()
                }
              : session
          )
        );
      });

      // Update chat title if this is the first user message
      updateChatTitleIfNeeded(userInput);
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Update with error message
      setChatSessions(prev => 
        prev.map(session => 
          session.id === currentChatId 
            ? { 
                ...session, 
                messages: session.messages.map(msg => 
                  msg.id === assistantMessageId 
                    ? { ...msg, content: 'Sorry, I encountered an error. Please try again.' }
                    : msg
                ),
                lastUpdated: new Date()
              }
            : session
        )
      );
    } finally {
      setIsLoading(false);
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
    setEditingContent(message.content);
  };

  const saveEdit = (messageId: string) => {
    setChatSessions(prev => prev.map(session => 
      session.id === currentChatId 
        ? { ...session, messages: session.messages.map(msg => 
          msg.id === messageId 
            ? { ...msg, content: editingContent, edited: true, originalContent: msg.originalContent || msg.content }
            : msg
        ) }
        : session
    ));
    setEditingMessageId(null);
    setEditingContent('');
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent('');
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
    
    setIsLoading(true);
    
    // Reset the message content for streaming
    setChatSessions(prev => prev.map(session => 
      session.id === currentChatId 
        ? { ...session, messages: session.messages.map(msg => 
          msg.id === messageId 
            ? { ...msg, content: '', timestamp: new Date() }
            : msg
        ) }
        : session
    ));
    
    try {
      await sendMessageToAI(previousUserMessage.content, (chunk: string) => {
        // Update the message content in real-time
        setChatSessions(prev => prev.map(session => 
          session.id === currentChatId 
            ? { ...session, messages: session.messages.map(msg => 
              msg.id === messageId 
                ? { ...msg, content: msg.content + chunk }
                : msg
            ) }
            : session
        ));
      });
    } catch (error) {
      console.error('Regeneration error:', error);
      setChatSessions(prev => prev.map(session => 
        session.id === currentChatId 
          ? { ...session, messages: session.messages.map(msg => 
            msg.id === messageId 
              ? { ...msg, content: 'I apologize, but I encountered an error. Please try again.' }
              : msg
          ) }
          : session
      ));
    } finally {
      setIsLoading(false);
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
    ? 'fixed inset-0 z-50 bg-slate-900 backdrop-blur-sm'
    : `${className}`;

  return (
    <div className={containerClass}>
      <div 
        className={`${isFullscreen ? 'h-screen w-screen rounded-none' : 'h-full rounded-xl'} bg-slate-600/30 backdrop-blur-sm border border-white/10 shadow-lg overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-blue-800 backdrop-blur-sm px-6 py-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                <IconComponent icon={AiOutlineRobot} className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-cyan-400">AI Tutor</h2>
                <p className="text-slate-300 text-sm">Your personal study assistant</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <motion.button
                onClick={() => setShowHistory(!showHistory)}
                className="p-2 bg-slate-600/50 backdrop-blur-sm hover:bg-slate-500/50 rounded-lg text-slate-300 transition-colors border border-white/10"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Chat History"
              >
                <IconComponent icon={AiOutlineHistory} className="h-5 w-5" />
              </motion.button>
              
              <motion.button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 bg-slate-600/50 backdrop-blur-sm hover:bg-slate-500/50 rounded-lg text-slate-300 transition-colors border border-white/10"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                <IconComponent icon={isFullscreen ? FiMinimize2 : FiMaximize2} className="h-5 w-5" />
              </motion.button>
              
              <motion.button
                onClick={clearChat}
                className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-colors border border-red-500/30"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Clear Chat"
              >
                <IconComponent icon={FiTrash2} className="h-5 w-5" />
              </motion.button>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Chat History Sidebar */}
          <AnimatePresence>
            {showHistory && (
              <motion.div
                className="w-80 bg-slate-700/30 backdrop-blur-sm border-r border-white/10 flex flex-col"
                initial={{ x: -320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -320, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="p-4 border-b border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-cyan-400">Chat History</h3>
                    <motion.button
                      onClick={createNewChat}
                      className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg text-white hover:shadow-lg transition-all"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title="New Chat"
                    >
                      <IconComponent icon={FiPlus} className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {chatSessions.map((session) => (
                    <motion.div
                      key={session.id}
                      className={`p-3 rounded-lg cursor-pointer transition-all border ${
                        session.id === currentChatId
                          ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400'
                          : 'bg-slate-600/30 border-white/10 text-slate-300 hover:bg-slate-600/50'
                      }`}
                      onClick={() => switchToChat(session.id)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{session.title}</h4>
                          <p className="text-xs opacity-75 mt-1">
                            {formatRelativeTime(session.lastUpdated)}
                          </p>
                        </div>
                        {session.id !== 'default' && (
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteChat(session.id);
                            }}
                            className="p-1 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <IconComponent icon={FiTrash2} className="h-3 w-3" />
                          </motion.button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-6 space-y-4"
            >
              {/* Chat Messages */}
              <AnimatePresence>
                {chatMessages.map((message, index) => (
                  <motion.div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                      {/* Message Header */}
                      <div className={`flex items-center space-x-2 mb-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          message.role === 'user' 
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500' 
                            : 'bg-gradient-to-r from-teal-500 to-green-500'
                        }`}>
                          <IconComponent 
                            icon={message.role === 'user' ? AiOutlineUser : AiOutlineRobot} 
                            className="h-4 w-4 text-white" 
                          />
                        </div>
                        <span className="text-sm text-slate-400">
                          {message.role === 'user' ? 'You' : 'AI Tutor'}
                        </span>
                        <span className="text-xs text-slate-500">
                          {message.timestamp.toLocaleTimeString()}
                        </span>
                      </div>

                      {/* Message Content */}
                      <div className={`p-4 rounded-2xl backdrop-blur-sm border ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-500/30 text-slate-200'
                          : 'bg-slate-600/30 border-white/10 text-slate-300'
                      }`}>
                        {editingMessageId === message.id ? (
                          <div className="space-y-3">
                            <textarea
                              ref={editInputRef}
                              value={editingContent}
                              onChange={(e) => setEditingContent(e.target.value)}
                              className="w-full p-3 bg-slate-700/50 backdrop-blur-sm border border-white/10 rounded-lg text-slate-300 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none"
                              rows={3}
                            />
                            <div className="flex items-center space-x-2">
                              <motion.button
                                onClick={() => saveEdit(message.id)}
                                className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 rounded text-green-400 text-sm transition-colors border border-green-500/30"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                Save
                              </motion.button>
                              <motion.button
                                onClick={cancelEdit}
                                className="px-3 py-1 bg-slate-600/50 hover:bg-slate-500/50 rounded text-slate-300 text-sm transition-colors border border-white/10"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                Cancel
                              </motion.button>
                            </div>
                          </div>
                        ) : (
                          <div className="prose prose-invert max-w-none">
                            <ReactMarkdown
                              remarkPlugins={[remarkMath, remarkGfm]}
                              rehypePlugins={[rehypeKatex]}
                              components={markdownComponents}
                            >
                              {preprocessLaTeX(message.content)}
                            </ReactMarkdown>
                          </div>
                        )}
                      </div>

                      {/* Message Actions */}
                      {editingMessageId !== message.id && (
                        <div className={`flex items-center space-x-2 mt-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <motion.button
                            onClick={() => copyToClipboard(message.content)}
                            className="p-1 text-slate-400 hover:text-cyan-400 transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Copy"
                          >
                            <IconComponent icon={FiCopy} className="h-4 w-4" />
                          </motion.button>
                          
                          <motion.button
                            onClick={() => startEditing(message)}
                            className="p-1 text-slate-400 hover:text-blue-400 transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Edit"
                          >
                            <IconComponent icon={FiEdit3} className="h-4 w-4" />
                          </motion.button>
                          
                          <motion.button
                            onClick={() => shareMessage(message)}
                            className="p-1 text-slate-400 hover:text-green-400 transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Share"
                          >
                            <IconComponent icon={FiShare2} className="h-4 w-4" />
                          </motion.button>
                          
                          {message.role === 'assistant' && (
                            <motion.button
                              onClick={() => regenerateResponse(message.id)}
                              className="p-1 text-slate-400 hover:text-yellow-400 transition-colors"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              title="Regenerate"
                            >
                              <IconComponent icon={FiRefreshCw} className="h-4 w-4" />
                            </motion.button>
                          )}
                          
                          <motion.button
                            onClick={() => deleteMessage(message.id)}
                            className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title="Delete"
                          >
                            <IconComponent icon={FiTrash2} className="h-4 w-4" />
                          </motion.button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Loading Indicator */}
              {isLoading && (
                <motion.div
                  className="flex justify-start mb-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-center space-x-3 p-4 bg-slate-600/30 backdrop-blur-sm border border-white/10 rounded-2xl">
                    <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-green-500 rounded-full flex items-center justify-center">
                      <IconComponent icon={AiOutlineRobot} className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <motion.div
                        className="w-2 h-2 bg-cyan-400 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-cyan-400 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                      />
                      <motion.div
                        className="w-2 h-2 bg-cyan-400 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                      />
                      <span className="text-slate-400 text-sm ml-2">AI is thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 border-t border-white/10 bg-slate-700/30 backdrop-blur-sm">
              <form onSubmit={handleChatSubmit} className="space-y-4">
                {/* Image Preview */}
                {uploadedImage && (
                  <div className="flex items-center space-x-3 p-3 bg-slate-600/50 rounded-lg border border-white/10">
                    <img 
                      src={uploadedImage.base64} 
                      alt="Uploaded" 
                      className="w-12 h-12 object-cover rounded border border-white/20"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-slate-300 font-medium">{uploadedImage.file.name}</p>
                      <p className="text-xs text-slate-400">Image attached - add your question above</p>
                    </div>
                    <motion.button
                      type="button"
                      onClick={() => setUploadedImage(null)}
                      className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <IconComponent icon={FiTrash2} className="h-4 w-4" />
                    </motion.button>
                  </div>
                )}

                <div className="flex items-end space-x-4">
                  <div className="flex-1">
                    <textarea
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={uploadedImage ? "Ask a question about the uploaded image..." : "Ask me anything about your studies..."}
                      className="w-full p-4 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-xl text-slate-300 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none"
                      rows={3}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleChatSubmit(e);
                        }
                      }}
                    />
                  </div>
                  
                  <div className="flex flex-col space-y-2">
                    <motion.button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading || isUploading}
                      className="p-3 bg-slate-600/50 backdrop-blur-sm hover:bg-slate-500/50 rounded-xl text-slate-300 transition-colors border border-white/10 disabled:opacity-50"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title="Upload Image"
                    >
                      {isUploading ? (
                        <motion.div
                          className="w-5 h-5"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <IconComponent icon={AiOutlineLoading3Quarters} className="h-5 w-5" />
                        </motion.div>
                      ) : (
                        <IconComponent icon={FiImage} className="h-5 w-5" />
                      )}
                    </motion.button>
                    
                    <motion.button
                      type="submit"
                      disabled={(!chatInput.trim() && !uploadedImage) || isLoading}
                      className="p-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl text-white shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      whileHover={!isLoading ? { scale: 1.05 } : {}}
                      whileTap={!isLoading ? { scale: 0.95 } : {}}
                    >
                      {isLoading ? (
                        <motion.div
                          className="w-5 h-5"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <IconComponent icon={AiOutlineLoading3Quarters} className="h-5 w-5" />
                        </motion.div>
                      ) : (
                        <IconComponent icon={FiSend} className="h-5 w-5" />
                      )}
                    </motion.button>
                  </div>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </form>

              {/* Quick Questions */}
              {chatMessages.length <= 1 && (
                <motion.div
                  className="mt-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="text-sm text-slate-400 mb-3">Quick questions to get started:</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Help me solve this math problem",
                      "Explain photosynthesis",
                      "What is the Pythagorean theorem?",
                      "How do I write a good essay?",
                      "What causes climate change?",
                      "Explain Newton's laws of motion"
                    ].map((question, index) => (
                      <motion.button
                        key={index}
                        onClick={() => setChatInput(question)}
                        className="px-3 py-2 bg-slate-600/30 hover:bg-slate-600/50 rounded-lg text-sm text-slate-300 border border-white/10 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {question}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AiTutorChatComponent; 