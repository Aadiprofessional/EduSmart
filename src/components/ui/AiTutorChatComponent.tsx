import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
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
  AiOutlineHistory,
  AiOutlineDelete,
  AiOutlineReload
} from 'react-icons/ai';
import { FiSend, FiThumbsUp, FiThumbsDown, FiRefreshCw, FiMaximize2, FiShare2, FiImage, FiTrash2, FiEdit3, FiCopy, FiDownload, FiPlus, FiMessageSquare, FiX, FiFile, FiFileText, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import IconComponent from './IconComponent';
import { useResponseCheck, ResponseUpgradeModal } from '../../utils/responseChecker';
import { useNotification } from '../../utils/NotificationContext';
import { useLanguage } from '../../utils/LanguageContext';
import { chatService, type ChatSession, type ChatMessage, type ChatFile } from '../../utils/supabaseChat';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../utils/AuthContext';
import * as pdfjsLib from 'pdfjs-dist';

// Import markdown and math libraries
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/js/pdf.worker.min.mjs';
  } catch (error) {
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    } catch (fallbackError) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '';
      console.warn('PDF.js worker setup failed, using main thread');
    }
  }
}

// Type definitions for PDF.js
interface PDFPageProxy {
  getViewport(params: { scale: number }): any;
  render(renderContext: any): { promise: Promise<void> };
  getTextContent(): Promise<any>;
}

interface PDFDocumentProxy {
  numPages: number;
  getPage(pageNumber: number): Promise<PDFPageProxy>;
}

// Portal Modal Component for fullscreen mode
interface PortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const PortalModal: React.FC<PortalModalProps> = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent background scrolling by setting body overflow to hidden and storing original value
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      
      return () => {
        document.removeEventListener('keydown', handleEscape);
        // Restore original body styles
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.width = '';
        document.body.style.height = '';
      };
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9999999 // Higher than header's z-index of 999999
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

interface UploadedFile {
  file: File;
  base64: string;
  extractedText: string;
  type: 'image' | 'document' | 'pdf';
  pages?: string[]; // For PDF page images
  processedContent?: string; // For AI processed content
}

interface AiTutorChatComponentProps {
  className?: string;
}

// Utility function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const AiTutorChatComponent: React.FC<AiTutorChatComponentProps> = ({ className = '' }) => {
  const { t } = useLanguage();
  const { user, session } = useAuth();
  
  // Response checking state
  const { checkAndUseResponse } = useResponseCheck();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');
  const { showError, showWarning, showSuccess } = useNotification();

  // Chat state
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentChatId, setCurrentChatId] = useState('');
  const [currentChat, setCurrentChat] = useState<ChatSession | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Add image modal state
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [selectedImageAlt, setSelectedImageAlt] = useState('');

  // Add document modal state
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [selectedDocumentContent, setSelectedDocumentContent] = useState('');
  const [selectedDocumentName, setSelectedDocumentName] = useState('');
  const [selectedDocumentPages, setSelectedDocumentPages] = useState<string[]>([]);
  const [currentDocumentPage, setCurrentDocumentPage] = useState(0);
  const [isLoadingFileContent, setIsLoadingFileContent] = useState(false);

  const [showQuickActions, setShowQuickActions] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get current messages
  const chatMessages = currentChat?.chat_data || [];

  // Initialize component and load data
  useEffect(() => {
    initializeChat();
  }, []);

  // Load current chat when ID changes
  useEffect(() => {
    if (currentChatId) {
      loadCurrentChat();
    }
  }, [currentChatId]);

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

  // Initialize chat
  const initializeChat = async () => {
    try {
      setIsInitializing(true);
      
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        showError('Please log in to use the AI Tutor chat');
        return;
      }

      // Load existing chat sessions
      const sessions = await chatService.getChatSessions();
      setChatSessions(sessions);

      // If no sessions exist, create a default one
      if (sessions.length === 0) {
        const newSession = await chatService.createChatSession(t('aiStudy.welcomeChat'));
        // Add welcome message
        const welcomeMessage: ChatMessage = {
          id: chatService.generateMessageId(),
          role: 'assistant',
          content: t('aiStudy.welcomeMessage'),
          timestamp: new Date().toISOString()
        };
        await chatService.addMessage(newSession.id, welcomeMessage);
        
        const updatedSession = await chatService.getChatSession(newSession.id);
        setChatSessions([updatedSession!]);
        setCurrentChatId(newSession.id);
        setCurrentChat(updatedSession);
      } else {
        // Set the most recent session as current
        setCurrentChatId(sessions[0].id);
        setCurrentChat(sessions[0]);
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
      showError('Failed to initialize chat. Please refresh the page.');
    } finally {
      setIsInitializing(false);
    }
  };

  // Load current chat
  const loadCurrentChat = async () => {
    if (!currentChatId) return;
    
    try {
      const chat = await chatService.getChatSession(currentChatId);
      if (chat) {
        // Load files for each message
        const chatDataWithFiles = await Promise.all(
          chat.chat_data.map(async (message: ChatMessage, index: number) => {
            const files = await chatService.getMessageFiles(currentChatId, index);
            return {
              ...message,
              files: files
            };
          })
        );
        
        setCurrentChat({
          ...chat,
          chat_data: chatDataWithFiles
        });
      }
    } catch (error) {
      console.error('Error loading current chat:', error);
      showError('Failed to load chat messages');
    }
  };

  // Send message to AI API with streaming and context
  const sendMessageToAI = async (
    userMessage: string,
    chatHistory: ChatMessage[],
    attachedFiles: UploadedFile[] = [],
    onChunk?: (chunk: string) => void
  ): Promise<string> => {
    console.log('🔄 Starting AI Tutor API request with context');
    console.log('📝 User message:', userMessage);
    console.log('📚 Chat history length:', chatHistory.length);
    console.log('📎 Attached files:', attachedFiles.length);
    
    try {
      // Prepare messages with context
      const messages: any[] = [
        {
          role: "system",
          content: [
            {
              type: "text", 
              text: t('aiStudy.aiTutorSystemPrompt')
            }
          ]
        }
      ];

      // Add chat history for context (last 10 messages to avoid token limits)
      const recentHistory = chatHistory.slice(-10);
      for (const msg of recentHistory) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({
            role: msg.role,
            content: [
              {
                type: "text",
                text: msg.content
              }
            ]
          });
        }
      }

      // Prepare current message content
      const currentMessageContent: any[] = [];
      
      // Add text content (include extracted text from documents)
      let messageText = userMessage;
      if (attachedFiles.length > 0) {
        const extractedTexts = attachedFiles
          .filter(file => file.extractedText && file.extractedText.trim())
          .map(file => `\n\n--- Content from ${file.file.name} ---\n${file.extractedText}`)
          .join('\n');
        
        if (extractedTexts) {
          messageText += extractedTexts;
        }
      }
      
      currentMessageContent.push({
        type: "text",
        text: messageText
      });

      // Add attached images and PDF pages
      for (const uploadedFile of attachedFiles) {
        if (uploadedFile.type === 'image') {
          // Add single image
          currentMessageContent.push({
            type: "image_url",
            image_url: { url: uploadedFile.base64 }
          });
        } else if (uploadedFile.type === 'pdf' && uploadedFile.pages) {
          // Add all PDF pages as images
          for (const pageImage of uploadedFile.pages) {
            currentMessageContent.push({
              type: "image_url",
              image_url: { url: pageImage }
            });
          }
        }
        // Document files (non-PDF) are handled via extracted text above
      }

      // Add current user message
      messages.push({
        role: "user",
        content: currentMessageContent
      });

      const response = await fetch(process.env.REACT_APP_DASHSCOPE_ENDPOINT || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_DASHSCOPE_API_KEY || ''}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: "doubao-seed-1-6-vision-250815",
          messages: messages,
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

  const regenerateResponse = async (messageId: string) => {
    if (!currentChat) return;
    
    const messageIndex = currentChat.chat_data.findIndex((msg: ChatMessage) => msg.id === messageId);
    if (messageIndex === -1 || messageIndex === 0) return;
    
    const previousUserMessage = currentChat.chat_data[messageIndex - 1];
    if (previousUserMessage.role !== 'user') return;
    
    setIsLoading(true);
    
    try {
      // Get chat history up to the previous message
      const chatHistory = currentChat.chat_data.slice(0, messageIndex);
      
      // Reset the message content for streaming
      let updatedChatData = [...currentChat.chat_data];
      updatedChatData[messageIndex] = { ...updatedChatData[messageIndex], content: '' };
      setCurrentChat((prev: ChatSession | null) => prev ? { ...prev, chat_data: updatedChatData } : null);
      
      let aiResponse = '';
      await sendMessageToAI(
        previousUserMessage.content,
        chatHistory,
        [], // Empty array of UploadedFile for regeneration
        (chunk: string) => {
          aiResponse += chunk;
          updatedChatData = [...currentChat.chat_data];
          updatedChatData[messageIndex] = { ...updatedChatData[messageIndex], content: aiResponse };
          setCurrentChat((prev: ChatSession | null) => prev ? { ...prev, chat_data: updatedChatData } : null);
        }
      );

      // Save updated chat data
      await chatService.updateChatData(currentChatId!, updatedChatData);
      
    } catch (error) {
      console.error('Regeneration error:', error);
      showError('Failed to regenerate response');
    } finally {
      setIsLoading(false);
    }
  };

  // Utility functions
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccess('Copied to clipboard');
    } catch (err) {
      console.error('Failed to copy text: ', err);
      showError('Failed to copy text');
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
      copyToClipboard(message.content);
    }
  };

  const downloadChat = () => {
    if (!currentChat) return;
    
    const chatText = currentChat.chat_data.map((msg: ChatMessage) => 
      `[${new Date(msg.timestamp).toLocaleString()}] ${msg.role === 'user' ? 'You' : 'AI Tutor'}: ${msg.content}`
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

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
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

  // Preprocess LaTeX for react-markdown
  const preprocessLaTeX = (content: string) => {
    return content
      .replace(/\\\[(.*?)\\\]/g, (_, eq) => `$$${eq}$$`)   // block math
      .replace(/\\\((.*?)\\\)/g, (_, eq) => `$${eq}$`);    // inline math
  };

  // Edit message functionality
  const startEditing = (message: ChatMessage) => {
    setEditingMessageId(message.id);
    setEditingContent(message.content);
  };

  const saveEdit = async (messageId: string) => {
    if (!currentChat) return;
    
    try {
      const updatedChatData = currentChat.chat_data.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: editingContent }
          : msg
      );
      
      await chatService.updateChatData(currentChatId!, updatedChatData);
      setCurrentChat(prev => prev ? { ...prev, chat_data: updatedChatData } : null);
      
      setEditingMessageId(null);
      setEditingContent('');
      showSuccess('Message updated');
    } catch (error) {
      console.error('Error updating message:', error);
      showError('Failed to update message');
    }
  };

  const cancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  // Add image modal handlers
  const openImageModal = (imageUrl: string, imageAlt: string = '') => {
    setSelectedImageUrl(imageUrl);
    setSelectedImageAlt(imageAlt);
    setImageModalOpen(true);
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
    setSelectedImageUrl('');
    setSelectedImageAlt('');
  };

  // Document modal functions
  const openDocumentModal = (content: string, fileName: string, pages?: string[]) => {
    setSelectedDocumentContent(content);
    setSelectedDocumentName(fileName);
    setSelectedDocumentPages(pages || []);
    setCurrentDocumentPage(0);
    setDocumentModalOpen(true);
  };

  const closeDocumentModal = () => {
    setDocumentModalOpen(false);
    setSelectedDocumentContent('');
    setSelectedDocumentName('');
    setSelectedDocumentPages([]);
    setCurrentDocumentPage(0);
  };

  // Load file content from storage
  const loadFileContent = async (file: ChatFile) => {
    if (isLoadingFileContent) return; // Prevent multiple simultaneous loads
    
    setIsLoadingFileContent(true);
    
    try {
      if (file.fileType.startsWith('image/') || file.fileType === 'image') {
        // For images, use stored file content or fallback to URL
        const imageUrl = file.fileContent || file.url || `/api/files/${file.storagePath}`;
        openImageModal(imageUrl, file.fileName);
      } else if (file.fileType === 'application/pdf' || file.fileType === 'pdf') {
        // For PDFs, use stored PDF pages and extracted text
        if (file.pdfPages && file.pdfPages.length > 0) {
          openDocumentModal(file.extractedText || `PDF file: ${file.fileName}`, file.fileName, file.pdfPages);
        } else {
          // Fallback: try to fetch and process PDF
          try {
            const fileUrl = file.url || `/api/files/${file.storagePath}`;
            const response = await fetch(fileUrl);
            
            if (!response.ok) {
              throw new Error('Failed to fetch file');
            }

            const blob = await response.blob();
            const fileObject = new File([blob], file.fileName, { type: file.mimeType });
            const pages = await convertPdfToImages(fileObject);
            const extractedText = await extractTextFromPdf(fileObject);
            openDocumentModal(extractedText, file.fileName, pages);
          } catch (error) {
            console.error('PDF processing error:', error);
            openDocumentModal(`PDF file: ${file.fileName}\n\nError loading PDF content.`, file.fileName);
          }
        }
      } else {
        // For other documents, use stored extracted text
        const content = file.extractedText || `Document file: ${file.fileName}\n\nNo content available.`;
        openDocumentModal(content, file.fileName);
      }
    } catch (error) {
      console.error('Error loading file content:', error);
      showError('Failed to load file content');
    } finally {
      setIsLoadingFileContent(false);
    }
  };

  // Convert PDF to page images
  const convertPdfToImages = async (file: File): Promise<string[]> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true
      });
      
      const pdf = await loadingTask.promise as PDFDocumentProxy;
      const images: string[] = [];
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        if (!context) {
          throw new Error('Could not get canvas context');
        }
        
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        
        await page.render(renderContext).promise;
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        images.push(imageDataUrl);
      }
      
      return images;
    } catch (error) {
      console.error('PDF conversion error:', error);
      throw new Error('Failed to convert PDF to images');
    }
  };

  // Extract text from PDF
  const extractTextFromPdf = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise as PDFDocumentProxy;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n';
      }
      
      return fullText;
    } catch (error) {
      console.error('Text extraction error:', error);
      throw new Error('Failed to extract text from PDF');
    }
  };

  // Extract text from document files
  const extractTextFromDocument = async (file: File): Promise<string> => {
    try {
      if (file.type.startsWith('text/')) {
        return await file.text();
      } else {
        // For other document types, we could add more specific handlers
        // For now, return a placeholder
        return `Document content from ${file.name} (${file.type})`;
      }
    } catch (error) {
      console.error('Document text extraction error:', error);
      throw new Error('Failed to extract text from document');
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!currentChat) return;
    
    try {
      const updatedChatData = currentChat.chat_data.filter((msg: ChatMessage) => msg.id !== messageId);
      await chatService.updateChatData(currentChatId!, updatedChatData);
      setCurrentChat((prev: ChatSession | null) => prev ? { ...prev, chat_data: updatedChatData } : null);
      showSuccess('Message deleted');
    } catch (error) {
      console.error('Error deleting message:', error);
      showError('Failed to delete message');
    }
  };

  // File handling functions
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    
    try {
      const processedFiles: UploadedFile[] = [];
      
      for (const file of files) {
        let fileType: 'image' | 'document' | 'pdf' = 'document';
        let base64 = '';
        let extractedText = '';
        let pages: string[] | undefined;

        if (file.type.startsWith('image/')) {
          fileType = 'image';
          base64 = await fileToBase64(file);
          extractedText = ''; // Images don't have extractable text here
        } else if (file.type === 'application/pdf') {
          fileType = 'pdf';
          try {
            // Convert PDF to page images
            pages = await convertPdfToImages(file);
            base64 = pages[0] || ''; // Use first page as preview
            // Extract text from PDF
            extractedText = await extractTextFromPdf(file);
          } catch (error) {
            console.error('PDF processing error:', error);
            // Fallback: treat as document with base64 encoding
            base64 = await fileToBase64(file);
            extractedText = `PDF file: ${file.name}`;
          }
        } else {
          // Handle other document types
          fileType = 'document';
          base64 = await fileToBase64(file);
          try {
            extractedText = await extractTextFromDocument(file);
          } catch (error) {
            console.error('Document processing error:', error);
            extractedText = `Document file: ${file.name}`;
          }
        }

        processedFiles.push({
          file,
          base64,
          extractedText,
          type: fileType,
          pages
        });
      }
      
      setUploadedFiles([...uploadedFiles, ...processedFiles]);
    } catch (error) {
      console.error('File upload error:', error);
      showError(t('common.uploadError'));
    } finally {
      setIsUploading(false);
      // Reset the input value to allow re-uploading the same file
      event.target.value = '';
    }
  };

  const removeUploadedFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Handle chat submission
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!chatInput.trim() && uploadedFiles.length === 0) || isLoading) return;
    
    const userMessage = chatInput.trim();
    const filesToProcess = [...uploadedFiles];
    
    // Clear input and files
    setChatInput('');
    setUploadedFiles([]);
    setIsLoading(true);
    
    try {
      if (!currentChat) {
        await createNewChat();
      }
      
      const currentChatData = currentChat?.chat_data || [];
      
      // Add user message to chat
      const userChatMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString(),
        files: []
      };
      
      // Process files and add to message if any
      if (filesToProcess.length > 0) {
        // Upload files and get their metadata
        const messageIndex = currentChatData.length;
        const filePromises = filesToProcess.map(async (uploadedFile) => {
          try {
            // Use the original file instead of creating a new blob
            const uploadResult = await chatService.uploadFile(
              uploadedFile.file, 
              currentChatId!, 
              messageIndex,
              uploadedFile.base64, // file content
              uploadedFile.extractedText, // extracted text
              uploadedFile.pages // pdf pages
            );
            
            return uploadResult;
          } catch (error) {
            console.error('File upload error:', error);
            return null;
          }
        });
        
        const uploadResults = await Promise.all(filePromises);
        userChatMessage.files = uploadResults.filter(result => result !== null) as ChatFile[];
      }
      
      const updatedChatData = [...currentChatData, userChatMessage];
      
      // Add assistant message with header immediately
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        files: []
      };
      
      const chatDataWithAssistant = [...updatedChatData, assistantMessage];
      
      // Update chat immediately with user message and empty assistant message
      if (currentChat) {
        const updatedChat = { ...currentChat, chat_data: chatDataWithAssistant };
        setCurrentChat(updatedChat);
        await chatService.updateChatData(currentChatId!, chatDataWithAssistant);
      }
      
      // Auto-scroll to bottom after adding message
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
      // Get AI response with streaming
      let aiResponse = '';
      await sendMessageToAI(
        userMessage,
        updatedChatData,
        filesToProcess, // Pass the uploadedFiles array
        (chunk: string) => {
          aiResponse += chunk;
          // Update the assistant message content in real-time
          const updatedChatDataWithResponse = [...updatedChatData];
          updatedChatDataWithResponse.push({
            ...assistantMessage,
            content: aiResponse
          });
          
          if (currentChat) {
            setCurrentChat({ ...currentChat, chat_data: updatedChatDataWithResponse });
          }
        }
      );
      
      // Final update with complete response
      const finalChatData = [...updatedChatData];
      finalChatData.push({
        ...assistantMessage,
        content: aiResponse
      });
      
      if (currentChat) {
        const finalUpdatedChat = { ...currentChat, chat_data: finalChatData };
        setCurrentChat(finalUpdatedChat);
        await chatService.updateChatData(currentChatId!, finalChatData);
      }
      
      // Update chat title if this is the first user message
      if (updatedChatData.filter(msg => msg.role === 'user').length === 1) {
        await updateChatTitleIfNeeded(userMessage);
      }
      
    } catch (error) {
      console.error('Chat submission error:', error);
      showError('Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  // Chat session management functions
  const createNewChat = async () => {
    try {
      const newSession = await chatService.createChatSession('New Chat');
      
      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: chatService.generateMessageId(),
        role: 'assistant',
        content: t('aiStudy.welcomeMessage'),
        timestamp: new Date().toISOString()
      };
      await chatService.addMessage(newSession.id, welcomeMessage);
      
      // Update local state
      const updatedSession = await chatService.getChatSession(newSession.id);
      setChatSessions(prev => [updatedSession!, ...prev]);
      setCurrentChatId(newSession.id);
      setCurrentChat(updatedSession);
      setShowHistory(false);
      
      showSuccess('New chat created');
    } catch (error) {
      console.error('Error creating new chat:', error);
      showError('Failed to create new chat');
    }
  };

  const switchToChat = async (chatId: string) => {
    if (chatId === currentChatId) return;
    
    try {
      const chat = await chatService.getChatSession(chatId);
      if (chat) {
        setCurrentChatId(chatId);
        setCurrentChat(chat);
        setShowHistory(false);
      }
    } catch (error) {
      console.error('Error switching chat:', error);
      showError('Failed to load chat');
    }
  };

  const deleteChat = async (chatId: string) => {
    if (chatSessions.length <= 1) {
      showWarning('Cannot delete the last chat session');
      return;
    }
    
    try {
      await chatService.deleteChatSession(chatId);
      
      const updatedSessions = chatSessions.filter(session => session.id !== chatId);
      setChatSessions(updatedSessions);
    
      // If we're deleting the current chat, switch to the first remaining chat
      if (chatId === currentChatId && updatedSessions.length > 0) {
        setCurrentChatId(updatedSessions[0].id);
        setCurrentChat(updatedSessions[0]);
      }
      
      showSuccess('Chat deleted');
    } catch (error) {
      console.error('Error deleting chat:', error);
      showError('Failed to delete chat');
    }
  };

  const updateChatTitle = async (chatId: string, newTitle: string) => {
    try {
      await chatService.updateChatSession(chatId, { title: newTitle });
      setChatSessions(prev => prev.map(session => 
        session.id === chatId 
          ? { ...session, title: newTitle }
          : session
      ));
      if (currentChat && currentChat.id === chatId) {
        setCurrentChat((prev: ChatSession | null) => prev ? { ...prev, title: newTitle } : null);
      }
    } catch (error) {
      console.error('Error updating chat title:', error);
    }
  };

  const generateChatTitle = (firstUserMessage: string) => {
    const words = firstUserMessage.split(' ').slice(0, 6);
    return words.join(' ') + (firstUserMessage.split(' ').length > 6 ? '...' : '');
  };

  const updateChatTitleIfNeeded = async (userMessage: string) => {
    if (currentChat && (currentChat.title === 'New Chat' || currentChat.title === t('aiStudy.welcomeChat'))) {
      const newTitle = generateChatTitle(userMessage);
      await updateChatTitle(currentChatId!, newTitle);
    }
  };

  // Custom markdown components for proper styling
  const markdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match[1]}
          PreTag="div"
          className="rounded-lg my-4"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={`${className} bg-slate-700/70 text-cyan-300 px-1.5 py-0.5 rounded text-sm font-mono border border-slate-600/50`} {...props}>
          {children}
        </code>
      );
    },
    h1: ({ children }: any) => <h1 className="text-2xl font-bold text-white mt-6 mb-4 pb-2 border-b-2 border-cyan-500/40">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-xl font-semibold text-cyan-300 mt-5 mb-3 pb-1 border-b border-cyan-500/30">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-lg font-semibold text-blue-300 mt-4 mb-2">{children}</h3>,
    h4: ({ children }: any) => <h4 className="text-base font-medium text-slate-200 mt-3 mb-2">{children}</h4>,
    h5: ({ children }: any) => <h5 className="text-sm font-medium text-slate-300 mt-2 mb-1">{children}</h5>,
    h6: ({ children }: any) => <h6 className="text-sm font-medium text-slate-400 mt-2 mb-1">{children}</h6>,
    p: ({ children }: any) => <p className="text-slate-300 mb-4 leading-7 text-[15px]">{children}</p>,
    ul: ({ children }: any) => <ul className="mb-4 text-slate-300 space-y-2 pl-4">{children}</ul>,
    ol: ({ children }: any) => <ol className="mb-4 text-slate-300 space-y-2 pl-4">{children}</ol>,
    li: ({ children }: any) => (
      <li className="flex items-start">
        <span className="text-cyan-400 mr-2 mt-1 flex-shrink-0">•</span>
        <span className="leading-7">{children}</span>
      </li>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-cyan-500/60 pl-4 my-4 bg-cyan-500/10 py-3 rounded-r-lg italic text-slate-300 bg-slate-800/30">
        {children}
      </blockquote>
    ),
    strong: ({ children }: any) => <strong className="font-semibold text-white">{children}</strong>,
    em: ({ children }: any) => <em className="italic text-slate-300">{children}</em>,
    table: ({ children }: any) => (
      <div className="overflow-x-auto my-4 rounded-lg border border-slate-600/50">
        <table className="min-w-full">{children}</table>
      </div>
    ),
    thead: ({ children }: any) => <thead className="bg-slate-700/60">{children}</thead>,
    tbody: ({ children }: any) => <tbody className="bg-slate-800/30">{children}</tbody>,
    tr: ({ children }: any) => <tr className="border-b border-slate-600/30 hover:bg-slate-700/20">{children}</tr>,
    th: ({ children }: any) => <th className="px-4 py-3 text-left font-semibold text-cyan-300 text-sm">{children}</th>,
    td: ({ children }: any) => <td className="px-4 py-3 text-slate-300 text-sm">{children}</td>,
    a: ({ children, href }: any) => (
      <a href={href} className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 font-medium transition-colors" target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
    hr: () => <hr className="my-6 border-slate-600/50" />,
    pre: ({ children }: any) => (
      <div className="my-4 bg-slate-800/60 rounded-lg border border-slate-600/50 overflow-hidden">
        <pre className="p-4 text-sm text-slate-300 overflow-x-auto">{children}</pre>
      </div>
    ),
  };

  const quickActions = [
    { text: t('aiStudy.helpWithMathHomework'), icon: AiOutlineCalculator },
    { text: t('aiStudy.explainAConcept'), icon: AiOutlineBulb },
    { text: t('aiStudy.checkMyWork'), icon: AiOutlineBook },
    { text: t('aiStudy.scienceExperimentHelp'), icon: AiOutlineExperiment },
    { text: t('aiStudy.studyTips'), icon: AiOutlineUser },
    { text: t('aiStudy.essayWritingHelp'), icon: AiOutlineEdit }
  ];

  const buttonVariants = {
    hover: { scale: 1.05, boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.1)" },
    tap: { scale: 0.98 }
  };

  const messageVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  // Show loading screen while initializing
  if (isInitializing) {
    return (
      <div className={`${className} h-[600px] flex items-center justify-center`}>
        <div className="text-center">
          <motion.div
            className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
          />
          <p className="text-slate-400">{t('common.loading')}...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Embedded mode - seamless integration without border */}
      <div className={`${className} h-[600px] flex flex-col`}>
        {/* Minimal toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
          <h3 className="text-lg font-semibold text-cyan-400">{t('aiStudy.aiTutorChat')}</h3>
          <div className="flex items-center space-x-2">
            <motion.button
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 text-slate-400 hover:text-cyan-400 transition-colors rounded-lg hover:bg-slate-600/50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={t('aiStudy.chatHistory')}
            >
              <IconComponent icon={FiMessageSquare} className="h-4 w-4" />
            </motion.button>
            <motion.button
              onClick={createNewChat}
              className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-3 py-2 rounded-lg font-medium hover:shadow-lg transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <IconComponent icon={FiPlus} className="h-4 w-4" />
              <span>{t('aiStudy.newChat')}</span>
            </motion.button>
            <motion.button
              onClick={() => setIsFullscreen(true)}
              className="p-2 text-slate-400 hover:text-cyan-400 transition-colors rounded-lg hover:bg-slate-600/50"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Fullscreen"
            >
              <IconComponent icon={FiMaximize2} className="h-4 w-4" />
            </motion.button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden min-h-0">
          {/* Chat History Sidebar */}
          <AnimatePresence>
            {showHistory && (
              <motion.div
                className="w-80 bg-slate-700/20 backdrop-blur-sm border-r border-white/10 flex flex-col"
                initial={{ x: -320, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -320, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="p-4 border-b border-white/10">
                  <h3 className="text-lg font-semibold text-cyan-400">{t('aiStudy.chatHistory')}</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {chatSessions.map((session) => (
                    <motion.div
                      key={session.id}
                      className={`p-3 rounded-lg cursor-pointer transition-all border group ${
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
                            {formatRelativeTime(session.updated_at)}
                          </p>
                        </div>
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteChat(session.id);
                            }}
                            className="p-1 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title={t('aiStudy.delete')}
                          >
                            <IconComponent icon={FiTrash2} className="h-3 w-3" />
                          </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Messages */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
              style={{ overscrollBehavior: 'contain' }}
            >
              {/* Chat Messages */}
              <AnimatePresence>
                {chatMessages.map((message: ChatMessage, index: number) => (
                  <motion.div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-6`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className={`max-w-[85%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                      {/* Message Header */}
                      <div className={`flex items-center space-x-3 mb-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
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
                        <span className="text-sm font-medium text-slate-300">
                          {message.role === 'user' ? t('aiStudy.you') : t('aiStudy.aiTutor')}
                        </span>
                      </div>

                      {/* Message Content */}
                      <div className={`${
                        message.role === 'user'
                          ? 'ml-11 p-4 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30'
                          : 'ml-11'
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
                                {t('common.save')}
                              </motion.button>
                              <motion.button
                                onClick={cancelEdit}
                                className="px-3 py-1 bg-slate-600/50 hover:bg-slate-500/50 rounded text-slate-300 text-sm transition-colors border border-white/10"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                {t('common.cancel')}
                              </motion.button>
                            </div>
                          </div>
                        ) : (
                          <div className={`prose prose-invert max-w-none ${
                            message.role === 'user' 
                              ? 'text-slate-200' 
                              : 'text-slate-300'
                          }`}>
                            {message.role === 'user' ? (
                              // Simple text for user messages
                              <p className="mb-0 leading-relaxed">{message.content}</p>
                            ) : (
                              // Markdown for AI messages or loading cursor
                              message.content ? (
                                <ReactMarkdown
                                  remarkPlugins={[remarkMath, remarkGfm]}
                                  rehypePlugins={[rehypeKatex]}
                                  components={markdownComponents}
                                >
                                  {preprocessLaTeX(message.content)}
                                </ReactMarkdown>
                              ) : (
                                // Show blinking cursor when message is empty (loading)
                                <motion.div
                                  className="inline-block w-2 h-5 bg-slate-400 rounded-sm"
                                  animate={{ opacity: [1, 0, 1] }}
                                  transition={{ duration: 1, repeat: Infinity, ease: [0.42, 0, 0.58, 1] as const }}
                                />
                              )
                            )}
                          </div>
                        )}

                        {/* Show attached files */}
                        {message.files && message.files.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {message.files.map((file: ChatFile) => (
                              <div key={file.id} className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded border border-white/10">
                                {file.fileType.startsWith('image/') ? (
                                  <div className="relative">
                                    <img 
                                      src={file.url || `/api/files/${file.storagePath}`}
                                      alt={file.fileName}
                                      className={`w-16 h-16 object-cover rounded border border-white/20 transition-opacity ${
                                        isLoadingFileContent ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:opacity-80'
                                      }`}
                                      onClick={() => !isLoadingFileContent && loadFileContent(file)}
                                      onError={(e) => {
                                        // Fallback to icon if image fails to load
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        target.nextElementSibling?.classList.remove('hidden');
                                      }}
                                    />
                                    {isLoadingFileContent && (
                                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 rounded">
                                        <motion.div
                                          className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full"
                                          animate={{ rotate: 360 }}
                                          transition={{ duration: 1, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="relative">
                                    <div 
                                      className={`w-16 h-16 bg-slate-600 rounded flex items-center justify-center transition-colors ${
                                        isLoadingFileContent ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-slate-500'
                                      }`}
                                      onClick={() => !isLoadingFileContent && loadFileContent(file)}
                                    >
                                      <IconComponent 
                                        icon={file.fileType === 'application/pdf' ? FiFile : FiFileText} 
                                        className="h-8 w-8 text-slate-300" 
                                      />
                                    </div>
                                    {isLoadingFileContent && (
                                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 rounded">
                                        <motion.div
                                          className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full"
                                          animate={{ rotate: 360 }}
                                          transition={{ duration: 1, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                )}
                                <div className="hidden w-16 h-16 bg-slate-600 rounded flex items-center justify-center">
                                  <IconComponent icon={FiImage} className="h-8 w-8 text-slate-300" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm text-slate-300 font-medium">{file.fileName}</p>
                                  <p className="text-xs text-slate-400">
                                    {file.fileType} • {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Message Actions */}
                      {editingMessageId !== message.id && (
                        <div className={`flex items-center space-x-2 mt-2 ml-11 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <motion.button
                            onClick={() => copyToClipboard(message.content)}
                            className="p-1 text-slate-400 hover:text-cyan-400 transition-colors rounded"
                            disabled={isLoading}
                            title={t('aiStudy.copyMessage')}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <IconComponent icon={FiCopy} className="h-4 w-4" />
                          </motion.button>
                          
                          <motion.button
                            onClick={() => startEditing(message)}
                            className="p-1 text-slate-400 hover:text-blue-400 transition-colors rounded"
                            disabled={isLoading}
                            title={t('aiStudy.edit')}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <IconComponent icon={FiEdit3} className="h-4 w-4" />
                          </motion.button>
                          
                          {message.role === 'assistant' && (
                            <motion.button
                              onClick={() => regenerateResponse(message.id)}
                              className="p-1 text-slate-400 hover:text-yellow-400 transition-colors rounded"
                              disabled={isLoading}
                              title={t('aiStudy.regenerateResponse')}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <IconComponent icon={FiRefreshCw} className="h-4 w-4" />
                            </motion.button>
                          )}
                          
                          <motion.button
                            onClick={() => deleteMessage(message.id)}
                            className="p-1 text-slate-400 hover:text-red-400 transition-colors rounded"
                            disabled={isLoading}
                            title={t('aiStudy.delete')}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <IconComponent icon={FiTrash2} className="h-4 w-4" />
                          </motion.button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Show streaming cursor for loading message */}
              {isLoading && (
                <motion.div
                  className="flex justify-start mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="max-w-[85%]">
                    <div className="ml-11">
                      <motion.div
                        className="inline-block w-2 h-5 bg-slate-400 rounded-sm"
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: 1, repeat: Infinity, ease: [0.42, 0, 0.58, 1] as const }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-slate-700/30 backdrop-blur-sm border-t border-white/10 flex-shrink-0">
              <form onSubmit={handleChatSubmit} className="space-y-4">
                {/* File Previews */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    {uploadedFiles.map((uploadedFile, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-slate-600/50 rounded-lg border border-white/10">
                        {uploadedFile.type === 'image' ? (
                          <img 
                            src={uploadedFile.base64} 
                            alt="Uploaded" 
                            className="w-12 h-12 object-cover rounded border border-white/20 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => openImageModal(uploadedFile.base64, uploadedFile.file.name)}
                          />
                        ) : uploadedFile.type === 'pdf' && uploadedFile.pages && uploadedFile.pages.length > 0 ? (
                          <img 
                            src={uploadedFile.pages[0]} 
                            alt="PDF Preview" 
                            className="w-12 h-12 object-cover rounded border border-white/20 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => openDocumentModal(uploadedFile.extractedText, uploadedFile.file.name, uploadedFile.pages)}
                          />
                        ) : (
                          <div 
                            className="w-12 h-12 bg-slate-600 rounded flex items-center justify-center cursor-pointer hover:bg-slate-500 transition-colors"
                            onClick={() => openDocumentModal(uploadedFile.extractedText, uploadedFile.file.name)}
                          >
                            <IconComponent 
                              icon={uploadedFile.type === 'pdf' ? FiFile : FiFileText} 
                              className="h-6 w-6 text-slate-300" 
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm text-slate-300 font-medium">{uploadedFile.file.name}</p>
                          <p className="text-xs text-slate-400">
                            {uploadedFile.type.toUpperCase()} • {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                            {uploadedFile.type === 'pdf' && uploadedFile.pages && (
                              <span> • {uploadedFile.pages.length} pages</span>
                            )}
                          </p>
                        </div>
                        <motion.button
                          type="button"
                          onClick={() => removeUploadedFile(index)}
                          className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <IconComponent icon={FiTrash2} className="h-4 w-4" />
                        </motion.button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-end space-x-4">
                  <div className="flex-1">
                    <textarea
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={uploadedFiles.length > 0 ? t('aiStudy.askQuestionAboutFiles') : t('aiStudy.typeMessage')}
                      className="w-full p-3 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-xl text-slate-300 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none"
                      rows={2}
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
                      type="submit"
                      disabled={(!chatInput.trim() && uploadedFiles.length === 0) || isLoading}
                      className="p-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl text-white shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      whileHover={!isLoading ? { scale: 1.05 } : {}}
                      whileTap={!isLoading ? { scale: 0.95 } : {}}
                    >
                      {isLoading ? (
                        <motion.div
                          className="w-5 h-5"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
                        >
                          <IconComponent icon={AiOutlineLoading3Quarters} className="h-5 w-5" />
                        </motion.div>
                      ) : (
                        <IconComponent icon={FiSend} className="h-5 w-5" />
                      )}
                    </motion.button>
                    
                    <motion.button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading || isUploading}
                      className="p-3 bg-slate-600/50 backdrop-blur-sm hover:bg-slate-500/50 rounded-xl text-slate-300 transition-colors border border-white/10 disabled:opacity-50"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title={t('aiStudy.uploadFiles')}
                    >
                      {isUploading ? (
                        <motion.div
                          className="w-5 h-5"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
                        >
                          <IconComponent icon={AiOutlineLoading3Quarters} className="h-5 w-5" />
                        </motion.div>
                      ) : (
                        <IconComponent icon={FiImage} className="h-5 w-5" />
                      )}
                    </motion.button>
                  </div>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.txt,.md"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </form>

              {/* Quick Questions - smaller for embedded mode */}
              {chatMessages.length <= 1 && (
                <motion.div
                  className="mt-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="text-xs text-slate-400 mb-2">{t('aiStudy.quickQuestionsPrompt')}</p>
                  <div className="flex flex-wrap gap-1">
                    {[
                      t('aiStudy.helpSolveMathProblem'),
                      t('aiStudy.explainPhotosynthesis'),
                      t('aiStudy.writeGoodEssay')
                    ].map((question, index) => (
                      <motion.button
                        key={index}
                        onClick={() => setChatInput(question)}
                        className="px-2 py-1 bg-slate-600/30 hover:bg-slate-600/50 rounded text-xs text-slate-300 border border-white/10 transition-colors"
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

      {/* Fullscreen Mode - Rendered via Portal */}
      <PortalModal isOpen={isFullscreen} onClose={() => setIsFullscreen(false)}>
        {/* Header - Only show in fullscreen */}
        <div className="bg-slate-800/50 backdrop-blur-sm px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
                <IconComponent icon={AiOutlineRobot} className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-cyan-400">{t('aiStudy.aiTutorChat')}</h2>
                <p className="text-slate-300 text-sm">{t('aiStudy.aiTutorChatDescription')}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <motion.button
                onClick={() => setIsFullscreen(false)}
                className="bg-slate-700/50 text-slate-300 p-2 rounded-lg hover:bg-slate-600/50 transition-colors border border-white/10"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <IconComponent icon={FiX} className="h-4 w-4" />
              </motion.button>
              <motion.button
                onClick={() => setShowHistory(!showHistory)}
                className="bg-slate-700/50 text-slate-300 p-2 rounded-lg hover:bg-slate-600/50 transition-colors border border-white/10"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <IconComponent icon={FiMessageSquare} className="h-4 w-4" />
              </motion.button>
              <motion.button
                onClick={() => downloadChat()}
                className="bg-slate-700/50 text-slate-300 p-2 rounded-lg hover:bg-slate-600/50 transition-colors border border-white/10"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <IconComponent icon={FiDownload} className="h-4 w-4" />
              </motion.button>
              <motion.button
                onClick={createNewChat}
                className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-3 py-2 rounded-lg font-medium hover:shadow-lg transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <IconComponent icon={FiPlus} className="h-4 w-4" />
                <span>{t('aiStudy.newChat')}</span>
              </motion.button>
            </div>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Chat History Sidebar - Fullscreen */}
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
                    <h3 className="text-lg font-semibold text-cyan-400">{t('aiStudy.chatHistory')}</h3>
                    <motion.button
                      onClick={createNewChat}
                      className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg text-white hover:shadow-lg transition-all"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title={t('aiStudy.newChat')}
                    >
                      <IconComponent icon={FiPlus} className="h-4 w-4" />
                    </motion.button>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {chatSessions.map((session) => (
                    <motion.div
                      key={session.id}
                      className={`p-3 rounded-lg cursor-pointer transition-all border group ${
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
                            {formatRelativeTime(session.updated_at)}
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
                            title={t('aiStudy.delete')}
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

          {/* Main Chat Area - Fullscreen */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Messages */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
              style={{ overscrollBehavior: 'contain' }}
            >
              {/* Chat Messages */}
              <AnimatePresence>
                {chatMessages.map((message: ChatMessage, index: number) => (
                  <motion.div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} mb-6`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className={`max-w-[85%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                      {/* Message Header */}
                      <div className={`flex items-center space-x-3 mb-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
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
                        <span className="text-sm font-medium text-slate-300">
                          {message.role === 'user' ? t('aiStudy.you') : t('aiStudy.aiTutor')}
                        </span>
                      </div>

                      {/* Message Content */}
                      <div className={`${
                        message.role === 'user'
                          ? 'ml-11 p-4 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30'
                          : 'ml-11'
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
                                {t('common.save')}
                              </motion.button>
                              <motion.button
                                onClick={cancelEdit}
                                className="px-3 py-1 bg-slate-600/50 hover:bg-slate-500/50 rounded text-slate-300 text-sm transition-colors border border-white/10"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                {t('common.cancel')}
                              </motion.button>
                            </div>
                          </div>
                        ) : (
                          <div className={`prose prose-invert max-w-none ${
                            message.role === 'user' 
                              ? 'text-slate-200' 
                              : 'text-slate-300'
                          }`}>
                            {message.role === 'user' ? (
                              // Simple text for user messages
                              <p className="mb-0 leading-relaxed">{message.content}</p>
                            ) : (
                              // Markdown for AI messages or loading cursor
                              message.content ? (
                                <ReactMarkdown
                                  remarkPlugins={[remarkMath, remarkGfm]}
                                  rehypePlugins={[rehypeKatex]}
                                  components={markdownComponents}
                                >
                                  {preprocessLaTeX(message.content)}
                                </ReactMarkdown>
                              ) : (
                                // Show blinking cursor when message is empty (loading)
                                <motion.div
                                  className="inline-block w-2 h-5 bg-slate-400 rounded-sm"
                                  animate={{ opacity: [1, 0, 1] }}
                                  transition={{ duration: 1, repeat: Infinity, ease: [0.42, 0, 0.58, 1] as const }}
                                />
                              )
                            )}
                          </div>
                        )}

                        {/* Show attached files */}
                        {message.files && message.files.length > 0 && (
                          <div className="mt-3 space-y-2">
                            {message.files.map((file) => (
                              <div key={file.id} className="flex items-center space-x-3 p-3 bg-slate-700/30 rounded border border-white/10">
                                {file.fileType.startsWith('image/') ? (
                                  <div className="relative">
                                    <img 
                                      src={file.url || `/api/files/${file.storagePath}`}
                                      alt={file.fileName}
                                      className={`w-16 h-16 object-cover rounded border border-white/20 transition-opacity ${
                                        isLoadingFileContent ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:opacity-80'
                                      }`}
                                      onClick={() => !isLoadingFileContent && loadFileContent(file)}
                                      onError={(e) => {
                                        // Fallback to icon if image fails to load
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        target.nextElementSibling?.classList.remove('hidden');
                                      }}
                                    />
                                    {isLoadingFileContent && (
                                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 rounded">
                                        <motion.div
                                          className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full"
                                          animate={{ rotate: 360 }}
                                          transition={{ duration: 1, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="relative">
                                    <div 
                                      className={`w-16 h-16 bg-slate-600 rounded flex items-center justify-center transition-colors ${
                                        isLoadingFileContent ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-slate-500'
                                      }`}
                                      onClick={() => !isLoadingFileContent && loadFileContent(file)}
                                    >
                                      <IconComponent 
                                        icon={file.fileType === 'application/pdf' ? FiFile : FiFileText} 
                                        className="h-8 w-8 text-slate-300" 
                                      />
                                    </div>
                                    {isLoadingFileContent && (
                                      <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 rounded">
                                        <motion.div
                                          className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full"
                                          animate={{ rotate: 360 }}
                                          transition={{ duration: 1, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                )}
                                <div className="hidden w-16 h-16 bg-slate-600 rounded flex items-center justify-center">
                                  <IconComponent icon={FiImage} className="h-8 w-8 text-slate-300" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm text-slate-300 font-medium">{file.fileName}</p>
                                  <p className="text-xs text-slate-400">
                                    {file.fileType} • {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Message Actions */}
                      {editingMessageId !== message.id && (
                        <div className={`flex items-center space-x-2 mt-2 ml-11 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <motion.button
                            onClick={() => copyToClipboard(message.content)}
                            className="p-1 text-slate-400 hover:text-cyan-400 transition-colors rounded"
                            disabled={isLoading}
                            title={t('aiStudy.copyMessage')}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <IconComponent icon={FiCopy} className="h-4 w-4" />
                          </motion.button>
                          
                          <motion.button
                            onClick={() => startEditing(message)}
                            className="p-1 text-slate-400 hover:text-blue-400 transition-colors rounded"
                            disabled={isLoading}
                            title={t('aiStudy.edit')}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <IconComponent icon={FiEdit3} className="h-4 w-4" />
                          </motion.button>
                          
                          {message.role === 'assistant' && (
                            <motion.button
                              onClick={() => regenerateResponse(message.id)}
                              className="p-1 text-slate-400 hover:text-yellow-400 transition-colors rounded"
                              disabled={isLoading}
                              title={t('aiStudy.regenerateResponse')}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <IconComponent icon={FiRefreshCw} className="h-4 w-4" />
                            </motion.button>
                          )}
                          
                          <motion.button
                            onClick={() => deleteMessage(message.id)}
                            className="p-1 text-slate-400 hover:text-red-400 transition-colors rounded"
                            disabled={isLoading}
                            title={t('aiStudy.delete')}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <IconComponent icon={FiTrash2} className="h-4 w-4" />
                          </motion.button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Show streaming cursor for loading message */}
              {isLoading && (
                <motion.div
                  className="flex justify-start mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="max-w-[85%]">
                    <div className="ml-11">
                      <motion.div
                        className="inline-block w-2 h-5 bg-slate-400 rounded-sm"
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: 1, repeat: Infinity, ease: [0.42, 0, 0.58, 1] as const }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input Area - Fullscreen */}
            <div className="p-6 bg-slate-700/30 backdrop-blur-sm border-t border-white/10 flex-shrink-0">
              <form onSubmit={handleChatSubmit} className="space-y-4">
                {/* File Previews */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-2">
                    {uploadedFiles.map((uploadedFile, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-slate-600/50 rounded-lg border border-white/10">
                        {uploadedFile.type === 'image' ? (
                          <img 
                            src={uploadedFile.base64} 
                            alt="Uploaded" 
                            className="w-12 h-12 object-cover rounded border border-white/20 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => openImageModal(uploadedFile.base64, uploadedFile.file.name)}
                          />
                        ) : uploadedFile.type === 'pdf' && uploadedFile.pages && uploadedFile.pages.length > 0 ? (
                          <img 
                            src={uploadedFile.pages[0]} 
                            alt="PDF Preview" 
                            className="w-12 h-12 object-cover rounded border border-white/20 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => openDocumentModal(uploadedFile.extractedText, uploadedFile.file.name, uploadedFile.pages)}
                          />
                        ) : (
                          <div 
                            className="w-12 h-12 bg-slate-600 rounded flex items-center justify-center cursor-pointer hover:bg-slate-500 transition-colors"
                            onClick={() => openDocumentModal(uploadedFile.extractedText, uploadedFile.file.name)}
                          >
                            <IconComponent 
                              icon={uploadedFile.type === 'pdf' ? FiFile : FiFileText} 
                              className="h-6 w-6 text-slate-300" 
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="text-sm text-slate-300 font-medium">{uploadedFile.file.name}</p>
                          <p className="text-xs text-slate-400">
                            {uploadedFile.type.toUpperCase()} • {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                            {uploadedFile.type === 'pdf' && uploadedFile.pages && (
                              <span> • {uploadedFile.pages.length} pages</span>
                            )}
                          </p>
                        </div>
                        <motion.button
                          type="button"
                          onClick={() => removeUploadedFile(index)}
                          className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <IconComponent icon={FiTrash2} className="h-4 w-4" />
                        </motion.button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-end space-x-4">
                  <div className="flex-1">
                    <textarea
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder={uploadedFiles.length > 0 ? t('aiStudy.askQuestionAboutFiles') : t('aiStudy.typeMessage')}
                      className="w-full p-3 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-xl text-slate-300 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none"
                      rows={2}
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
                      type="submit"
                      disabled={(!chatInput.trim() && uploadedFiles.length === 0) || isLoading}
                      className="p-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl text-white shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      whileHover={!isLoading ? { scale: 1.05 } : {}}
                      whileTap={!isLoading ? { scale: 0.95 } : {}}
                    >
                      {isLoading ? (
                        <motion.div
                          className="w-5 h-5"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
                        >
                          <IconComponent icon={AiOutlineLoading3Quarters} className="h-5 w-5" />
                        </motion.div>
                      ) : (
                        <IconComponent icon={FiSend} className="h-5 w-5" />
                      )}
                    </motion.button>
                    
                    <motion.button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading || isUploading}
                      className="p-3 bg-slate-600/50 backdrop-blur-sm hover:bg-slate-500/50 rounded-xl text-slate-300 transition-colors border border-white/10 disabled:opacity-50"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title={t('aiStudy.uploadFiles')}
                    >
                      {isUploading ? (
                        <motion.div
                          className="w-5 h-5"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
                        >
                          <IconComponent icon={AiOutlineLoading3Quarters} className="h-5 w-5" />
                        </motion.div>
                      ) : (
                        <IconComponent icon={FiImage} className="h-5 w-5" />
                      )}
                    </motion.button>
                  </div>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.txt,.md"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </form>

              {/* Quick Questions - Full version for fullscreen */}
              {chatMessages.length <= 1 && (
                <motion.div
                  className="mt-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="text-sm text-slate-400 mb-3">{t('aiStudy.quickQuestionsPrompt')}</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      t('aiStudy.helpSolveMathProblem'),
                      t('aiStudy.explainPhotosynthesis'),
                      t('aiStudy.pythagoreanTheorem'),
                      t('aiStudy.writeGoodEssay'),
                      t('aiStudy.climateChangeCauses'),
                      t('aiStudy.newtonsLaws')
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
      </PortalModal>

      {/* Response Upgrade Modal */}
      <ResponseUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        message={upgradeMessage}
      />

      {/* Document Modal */}
      <PortalModal isOpen={documentModalOpen} onClose={closeDocumentModal}>
        <div className="flex items-center justify-center min-h-screen p-4">
          <motion.div
            className="relative w-full max-w-6xl max-h-[90vh] bg-slate-800/95 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-700/50">
              <div className="flex items-center space-x-3">
                <IconComponent 
                  icon={selectedDocumentPages.length > 0 ? FiFile : FiFileText} 
                  className="h-6 w-6 text-cyan-400" 
                />
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedDocumentName}</h3>
                  {selectedDocumentPages.length > 0 && (
                    <p className="text-sm text-slate-400">
                      Page {currentDocumentPage + 1} of {selectedDocumentPages.length}
                    </p>
                  )}
                </div>
              </div>
              
              {/* Navigation and Close */}
              <div className="flex items-center space-x-2">
                {selectedDocumentPages.length > 1 && (
                  <>
                    <motion.button
                      onClick={() => setCurrentDocumentPage(Math.max(0, currentDocumentPage - 1))}
                      disabled={currentDocumentPage === 0}
                      className="p-2 rounded-lg bg-slate-600/50 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <IconComponent icon={FiChevronLeft} className="h-5 w-5 text-white" />
                    </motion.button>
                    
                    <motion.button
                      onClick={() => setCurrentDocumentPage(Math.min(selectedDocumentPages.length - 1, currentDocumentPage + 1))}
                      disabled={currentDocumentPage === selectedDocumentPages.length - 1}
                      className="p-2 rounded-lg bg-slate-600/50 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <IconComponent icon={FiChevronRight} className="h-5 w-5 text-white" />
                    </motion.button>
                  </>
                )}
                
                <motion.button
                  onClick={closeDocumentModal}
                  className="p-2 rounded-lg bg-slate-600/50 hover:bg-slate-600 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <IconComponent icon={FiX} className="h-5 w-5 text-white" />
                </motion.button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto max-h-[75vh]">
              {selectedDocumentPages.length > 0 ? (
                // PDF Page Viewer
                <div className="p-6 flex justify-center">
                  <img
                    src={selectedDocumentPages[currentDocumentPage]}
                    alt={`${selectedDocumentName} - Page ${currentDocumentPage + 1}`}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                    style={{ maxHeight: 'calc(75vh - 120px)' }}
                  />
                </div>
              ) : (
                // Text Document Viewer
                <div className="p-6">
                  <div className="bg-slate-700/30 rounded-lg p-4 border border-white/10">
                    <pre className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-mono overflow-auto max-h-96">
                      {selectedDocumentContent || 'No content available'}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Footer for PDF */}
            {selectedDocumentPages.length > 1 && (
              <div className="p-4 border-t border-white/10 bg-slate-700/50">
                <div className="flex items-center justify-center space-x-4">
                  <span className="text-sm text-slate-400">
                    Navigate with arrow keys or buttons above
                  </span>
                  <div className="flex space-x-1">
                    {selectedDocumentPages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentDocumentPage(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          index === currentDocumentPage 
                            ? 'bg-cyan-400' 
                            : 'bg-slate-500 hover:bg-slate-400'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </PortalModal>

      {/* Image Modal */}
      <PortalModal isOpen={imageModalOpen} onClose={closeImageModal}>
        <div className="flex items-center justify-center min-h-screen p-4">
          <motion.div
            className="relative max-w-7xl max-h-[90vh] bg-slate-800/90 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Close Button */}
            <motion.button
              onClick={closeImageModal}
              className="absolute top-4 right-4 z-10 p-2 bg-slate-900/80 hover:bg-slate-900 rounded-full text-slate-300 hover:text-white transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <IconComponent icon={FiX} className="h-6 w-6" />
            </motion.button>

            {/* Image Container */}
            <div className="p-6">
              <img
                src={selectedImageUrl}
                alt={selectedImageAlt}
                className="max-w-full max-h-[80vh] object-contain mx-auto rounded-lg"
                style={{ maxHeight: 'calc(90vh - 120px)' }}
              />
              
              {/* Image Info */}
              {selectedImageAlt && (
                <div className="mt-4 text-center">
                  <p className="text-slate-300 text-sm">{selectedImageAlt}</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </PortalModal>
    </>
  );
};

export default AiTutorChatComponent;
