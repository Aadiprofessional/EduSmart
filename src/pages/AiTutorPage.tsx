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
  AiOutlineReload,
  AiOutlineMenu,
  AiOutlinePlus
} from 'react-icons/ai';
import { FiSend, FiThumbsUp, FiThumbsDown, FiRefreshCw, FiMaximize2, FiShare2, FiImage, FiTrash2, FiEdit3, FiCopy, FiDownload, FiPlus, FiMessageSquare, FiX, FiFile, FiFileText, FiChevronLeft, FiChevronRight, FiMoreHorizontal } from 'react-icons/fi';
import IconComponent from '../components/ui/IconComponent';
import { Header } from '../components/layout';
import { useResponseCheck, ResponseUpgradeModal } from '../utils/responseChecker';
import { useNotification } from '../utils/NotificationContext';
import { useLanguage } from '../utils/LanguageContext';
import { chatService, type ChatSession, type ChatMessage, type ChatFile } from '../utils/supabaseChat';
import { supabase } from '../utils/supabase';
import { useAuth } from '../utils/AuthContext';
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

// Portal Modal Component for fullscreen mode (reused from component)
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
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = originalOverflow;
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
        className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm flex flex-col z-[999999]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
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

// Utility function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

const AiTutorPage: React.FC = () => {
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
  
  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

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

  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Get current messages
  const chatMessages = currentChat?.chat_data || [];

  // Initialize component and load data
  useEffect(() => {
    initializeChat();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
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
  }, [chatMessages, isLoading]);

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
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Redirect or show login (handled by protected route usually, but just in case)
        return;
      }

      // Load existing chat sessions
      const sessions = await chatService.getChatSessions();
      setChatSessions(sessions);

      // If no sessions exist, create a default one
      if (sessions.length === 0) {
        await createNewChat();
      } else {
        // Set the most recent session as current
        setCurrentChatId(sessions[0].id);
        setCurrentChat(sessions[0]);
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
      showError('Failed to initialize chat');
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

  const getCurrentLocalTimeFormatted = () => {
    return new Date().toLocaleString();
  };

  // Send message using WebSocket
  const sendMessageToWS = async (
    userMessage: string,
    chatHistory: ChatMessage[],
    attachedFiles: UploadedFile[] = [],
    onChunk?: (chunk: string) => void
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const ws = new WebSocket('wss://main.matrixaiserver.com/ws/chat');
        wsRef.current = ws;

        let fullContent = '';

        ws.onopen = () => {
          console.log('WS Connected');
          
          const messagePayload: any = {
            uid: user?.id || 'anonymous',
            type: 'text',
            text: { body: userMessage },
            body: userMessage,
            content: userMessage,
            role: 'user',
            roleDescription: 'You are a helpful AI Tutor.',
            timestamp: getCurrentLocalTimeFormatted(),
            chatid: currentChatId
          };

          // Handle attachments if any
          if (attachedFiles.length > 0) {
            // This part depends on how the WS expects attachments. 
            // Based on the snippet, it supports `attachments`, `image_urls`.
            // We might need to upload them first or send base64 if supported.
            // For now, we will append file context to the message content as text/instructions
            // similar to the REST implementation, unless we confirm WS handles base64 directly in `attachments`.
            // The snippet showed:
            // if ((base as any).attachments) message.attachments = (base as any).attachments;
            // if ((base as any).image_urls) message.image_urls = (base as any).image_urls;
            
            // Let's stick to appending text context for now to be safe, or use the previously uploaded files URLs if we have them.
            // But we can't easily get URLs for new files without uploading them first. 
            // The `handleChatSubmit` uploads files to supabase first. We can use those URLs.
          }

          const payload: any = {
            type: 'openrequest',
            stream: true,
            chatid: currentChatId,
            messages: [messagePayload]
          };
          
          ws.send(JSON.stringify(payload));
        };

        ws.onmessage = (evt) => {
          const raw = typeof evt.data === 'string' ? evt.data : '';
          try {
            const obj = JSON.parse(raw);
            if (obj && typeof obj === 'object') {
              if (obj.type === 'done' || obj.done === true) {
                ws.close();
                return;
              }
              
              let chunk = '';
              if (obj.type === 'chunk' && typeof obj.text === 'string') chunk = obj.text;
              else if (typeof obj.chunk === 'string') chunk = obj.chunk;
              else if (typeof obj.data === 'string') chunk = obj.data;
              else if (typeof obj.text === 'string') chunk = obj.text;
              else if (typeof obj.body === 'string') chunk = obj.body;

              if (chunk) {
                fullContent += chunk;
                if (onChunk) onChunk(chunk);
              }
            }
          } catch (e) {
            // If parse fails, treat raw as chunk if not empty
            if (raw) {
                fullContent += raw;
                if (onChunk) onChunk(raw);
            }
          }
        };

        ws.onerror = (err) => {
          console.error('WebSocket error:', err);
          reject(new Error('WebSocket connection failed'));
        };

        ws.onclose = () => {
          console.log('WS Closed');
          wsRef.current = null;
          resolve(fullContent);
        };

      } catch (e) {
        reject(e);
      }
    });
  };

  const regenerateResponse = async (messageId: string) => {
    if (!currentChat) return;
    
    const messageIndex = currentChat.chat_data.findIndex((msg: ChatMessage) => msg.id === messageId);
    if (messageIndex === -1 || messageIndex === 0) return;
    
    const previousUserMessage = currentChat.chat_data[messageIndex - 1];
    if (previousUserMessage.role !== 'user') return;
    
    setIsLoading(true);
    
    try {
      const chatHistory = currentChat.chat_data.slice(0, messageIndex);
      
      let updatedChatData = [...currentChat.chat_data];
      updatedChatData[messageIndex] = { ...updatedChatData[messageIndex], content: '' };
      setCurrentChat((prev: ChatSession | null) => prev ? { ...prev, chat_data: updatedChatData } : null);
      
      let aiResponse = '';
      await sendMessageToWS(
        previousUserMessage.content,
        chatHistory,
        [],
        (chunk: string) => {
          aiResponse += chunk;
          updatedChatData = [...currentChat.chat_data];
          updatedChatData[messageIndex] = { ...updatedChatData[messageIndex], content: aiResponse };
          setCurrentChat((prev: ChatSession | null) => prev ? { ...prev, chat_data: updatedChatData } : null);
        }
      );

      await chatService.updateChatData(currentChatId!, updatedChatData);
      
    } catch (error) {
      console.error('Regeneration error:', error);
      showError('Failed to regenerate response');
    } finally {
      setIsLoading(false);
    }
  };

  // Utility functions (copied from original component)
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccess('Copied to clipboard');
    } catch (err) {
      console.error('Failed to copy text: ', err);
      showError('Failed to copy text');
    }
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

  const preprocessLaTeX = (content: string) => {
    return content
      .replace(/\\\[(.*?)\\\]/g, (_, eq) => `$$${eq}$$`)
      .replace(/\\\((.*?)\\\)/g, (_, eq) => `$${eq}$`);
  };

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

  const loadFileContent = async (file: ChatFile) => {
    if (isLoadingFileContent) return;
    
    setIsLoadingFileContent(true);
    
    try {
      if (file.fileType.startsWith('image/') || file.fileType === 'image') {
        const imageUrl = file.fileContent || file.url || `/api/files/${file.storagePath}`;
        openImageModal(imageUrl, file.fileName);
      } else if (file.fileType === 'application/pdf' || file.fileType === 'pdf') {
        if (file.pdfPages && file.pdfPages.length > 0) {
          openDocumentModal(file.extractedText || `PDF file: ${file.fileName}`, file.fileName, file.pdfPages);
        } else {
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

  const extractTextFromDocument = async (file: File): Promise<string> => {
    try {
      if (file.type.startsWith('text/')) {
        return await file.text();
      } else {
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
          extractedText = '';
        } else if (file.type === 'application/pdf') {
          fileType = 'pdf';
          try {
            pages = await convertPdfToImages(file);
            base64 = pages[0] || '';
            extractedText = await extractTextFromPdf(file);
          } catch (error) {
            console.error('PDF processing error:', error);
            base64 = await fileToBase64(file);
            extractedText = `PDF file: ${file.name}`;
          }
        } else {
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
      event.target.value = '';
    }
  };

  const removeUploadedFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!chatInput.trim() && uploadedFiles.length === 0) || isLoading) return;
    
    const userMessage = chatInput.trim();
    const filesToProcess = [...uploadedFiles];
    
    setChatInput('');
    setUploadedFiles([]);
    setIsLoading(true);
    
    try {
      if (!currentChat) {
        await createNewChat();
      }
      
      const currentChatData = currentChat?.chat_data || [];
      
      const userChatMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString(),
        files: []
      };
      
      if (filesToProcess.length > 0) {
        const messageIndex = currentChatData.length;
        const filePromises = filesToProcess.map(async (uploadedFile) => {
          try {
            const uploadResult = await chatService.uploadFile(
              uploadedFile.file, 
              currentChatId!, 
              messageIndex,
              uploadedFile.base64,
              uploadedFile.extractedText,
              uploadedFile.pages
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
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        files: []
      };
      
      const chatDataWithAssistant = [...updatedChatData, assistantMessage];
      
      if (currentChat) {
        const updatedChat = { ...currentChat, chat_data: chatDataWithAssistant };
        setCurrentChat(updatedChat);
        await chatService.updateChatData(currentChatId!, chatDataWithAssistant);
      }
      
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      
      let aiResponse = '';
      await sendMessageToWS(
        userMessage,
        updatedChatData,
        filesToProcess,
        (chunk: string) => {
          aiResponse += chunk;
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

  const createNewChat = async () => {
    try {
      const newSession = await chatService.createChatSession('New Chat');
      
      const welcomeMessage: ChatMessage = {
        id: chatService.generateMessageId(),
        role: 'assistant',
        content: t('aiStudy.welcomeMessage'),
        timestamp: new Date().toISOString()
      };
      await chatService.addMessage(newSession.id, welcomeMessage);
      
      const updatedSession = await chatService.getChatSession(newSession.id);
      setChatSessions(prev => [updatedSession!, ...prev]);
      setCurrentChatId(newSession.id);
      setCurrentChat(updatedSession);
      
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

  const markdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match[1]}
          PreTag="div"
          className="rounded-lg my-4 shadow-lg"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={`${className} bg-slate-700/50 text-cyan-300 px-1.5 py-0.5 rounded text-sm font-mono border border-slate-600/30`} {...props}>
          {children}
        </code>
      );
    },
    // ... (rest of markdown components similar to before but perhaps slightly tweaked for "modern" look)
  };

  // Grok-like UI Layout
  return (
    <>
      <Header />
      <div className="flex h-screen bg-[#0f1117] text-slate-200 overflow-hidden font-sans pt-16">
        
        {/* Sidebar - Chat History */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 280, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="h-full bg-[#16181e] border-r border-white/5 flex flex-col flex-shrink-0"
          >
            <div className="p-4 flex items-center justify-between border-b border-white/5">
              <h2 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                AI Tutor
              </h2>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={createNewChat} 
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors text-cyan-400"
                  title={t('aiStudy.newChat')}
                >
                  <FiPlus className="w-5 h-5" />
                </button>
                <button className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                   <FiShare2 className="w-5 h-5" />
                </button>
                <button 
                   onClick={() => setIsSidebarOpen(false)}
                   className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors lg:hidden"
                >
                   <FiChevronLeft className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
              {chatSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => switchToChat(session.id)}
                  className={`group flex items-center p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                    session.id === currentChatId
                      ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 text-cyan-300'
                      : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FiMessageSquare className="w-4 h-4 mr-3 flex-shrink-0 opacity-70" />
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{session.title}</p>
                    <p className="text-xs opacity-50 truncate">{formatRelativeTime(session.updated_at)}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(session.id);
                    }}
                    className="p-1.5 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-white/5">
              <div className="flex items-center space-x-3 text-slate-400 text-sm">
                 <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
                    {user?.email?.[0].toUpperCase() || 'U'}
                 </div>
                 <div className="flex-1 truncate">
                    {user?.email || 'User'}
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative">
        {/* Toggle button when sidebar is closed */}
        {!isSidebarOpen && (
           <button
             onClick={() => setIsSidebarOpen(true)}
             className="absolute top-4 left-4 z-20 p-2 bg-[#16181e]/80 backdrop-blur text-slate-400 hover:text-white rounded-lg border border-white/10 shadow-lg transition-colors"
           >
             <AiOutlineMenu className="w-5 h-5" />
           </button>
        )}

        {/* Chat Area */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth custom-scrollbar"
        >
          <div className="max-w-3xl mx-auto space-y-8 pb-32">
            {chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-6">
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-cyan-500/20 mb-4">
                  <AiOutlineRobot className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white">How can I help you learn today?</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                  {[
                    "Explain quantum physics like I'm 5",
                    "Help me solve a calculus problem",
                    "Write an essay about climate change",
                    "Debug my Python code"
                  ].map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => setChatInput(suggestion)}
                      className="p-4 bg-[#1e2029] hover:bg-[#252833] border border-white/5 rounded-xl text-left text-sm text-slate-300 transition-all hover:scale-[1.02] hover:shadow-lg"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {chatMessages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-[90%] md:max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'} items-start gap-4`}>
                  
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center mt-1 ${
                    message.role === 'user' 
                      ? 'bg-slate-700 text-slate-200' 
                      : 'bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                  }`}>
                    {message.role === 'user' ? <AiOutlineUser className="w-5 h-5" /> : <AiOutlineRobot className="w-5 h-5" />}
                  </div>

                  {/* Message Bubble */}
                  <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`group relative px-6 py-4 rounded-2xl ${
                      message.role === 'user'
                        ? 'bg-[#1e2029] text-slate-100 border border-white/5'
                        : 'bg-transparent text-slate-200'
                    }`}>
                      {editingMessageId === message.id ? (
                        <div className="w-full min-w-[300px]">
                          <textarea
                            ref={editInputRef}
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="w-full p-3 bg-[#0f1117] border border-white/10 rounded-xl text-slate-200 focus:ring-1 focus:ring-cyan-500 outline-none resize-none"
                            rows={4}
                          />
                          <div className="flex justify-end gap-2 mt-2">
                            <button onClick={cancelEdit} className="px-3 py-1.5 text-xs rounded-lg hover:bg-white/5 text-slate-400">Cancel</button>
                            <button onClick={() => saveEdit(message.id)} className="px-3 py-1.5 text-xs rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white">Save</button>
                          </div>
                        </div>
                      ) : (
                        <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-[#0f1117] prose-pre:border prose-pre:border-white/5 max-w-none">
                          {message.role === 'user' ? (
                            <p className="whitespace-pre-wrap">{message.content}</p>
                          ) : (
                            <ReactMarkdown
                              remarkPlugins={[remarkMath, remarkGfm]}
                              rehypePlugins={[rehypeKatex]}
                              components={markdownComponents}
                            >
                              {preprocessLaTeX(message.content || '')}
                            </ReactMarkdown>
                          )}
                        </div>
                      )}

                      {/* Message Actions */}
                      {editingMessageId !== message.id && (
                        <div className={`absolute ${message.role === 'user' ? '-left-12' : '-right-12'} top-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1`}>
                           <button onClick={() => copyToClipboard(message.content)} className="p-1.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg" title="Copy">
                              <FiCopy className="w-4 h-4" />
                           </button>
                           {message.role === 'assistant' && (
                              <button onClick={() => regenerateResponse(message.id)} className="p-1.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg" title="Regenerate">
                                <FiRefreshCw className="w-4 h-4" />
                              </button>
                           )}
                           <button onClick={() => startEditing(message)} className="p-1.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg" title="Edit">
                              <FiEdit3 className="w-4 h-4" />
                           </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Attachments */}
                    {message.files && message.files.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {message.files.map((file) => (
                          <div 
                            key={file.id} 
                            onClick={() => loadFileContent(file)}
                            className="flex items-center gap-2 px-3 py-2 bg-[#1e2029] border border-white/5 rounded-lg cursor-pointer hover:bg-[#252833] transition-colors"
                          >
                            <IconComponent icon={file.fileType.includes('pdf') ? FiFile : FiImage} className="w-4 h-4 text-cyan-400" />
                            <span className="text-xs text-slate-300 truncate max-w-[150px]">{file.fileName}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            
            {/* Loading Indicator */}
            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                 <div className="flex items-start gap-4 max-w-[80%]">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                      <AiOutlineRobot className="w-5 h-5 text-white" />
                    </div>
                    <div className="bg-transparent px-6 py-4">
                      <div className="flex gap-1">
                        <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-2 h-2 bg-cyan-500 rounded-full" />
                        <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-2 h-2 bg-cyan-500 rounded-full" />
                        <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-2 h-2 bg-cyan-500 rounded-full" />
                      </div>
                    </div>
                 </div>
              </motion.div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#0f1117] via-[#0f1117] to-transparent pt-10 pb-6 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
             {/* File Preview */}
             {uploadedFiles.length > 0 && (
                <div className="flex gap-2 mb-3 overflow-x-auto pb-2 custom-scrollbar">
                   {uploadedFiles.map((file, i) => (
                      <div key={i} className="relative group flex-shrink-0">
                         <div className="w-16 h-16 rounded-xl bg-[#1e2029] border border-white/10 flex items-center justify-center overflow-hidden">
                            {file.type === 'image' ? (
                               <img src={file.base64} alt="preview" className="w-full h-full object-cover" />
                            ) : (
                               <FiFileText className="w-8 h-8 text-slate-400" />
                            )}
                         </div>
                         <button 
                            onClick={() => removeUploadedFile(i)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                         >
                            <FiX className="w-3 h-3" />
                         </button>
                      </div>
                   ))}
                </div>
             )}

             <form onSubmit={handleChatSubmit} className="relative bg-[#1e2029] border border-white/10 rounded-2xl shadow-2xl focus-within:ring-1 focus-within:ring-cyan-500/50 transition-all">
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleChatSubmit(e);
                    }
                  }}
                  placeholder="Ask anything..."
                  className="w-full bg-transparent text-slate-200 p-4 pr-32 min-h-[60px] max-h-[200px] outline-none resize-none placeholder-slate-500"
                  rows={1}
                />
                
                <div className="absolute right-2 bottom-2 flex items-center gap-1">
                   <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                      title="Upload file"
                   >
                      <FiPlus className="w-5 h-5" />
                   </button>
                   <button
                      type="submit"
                      disabled={(!chatInput.trim() && uploadedFiles.length === 0) || isLoading}
                      className="p-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                      {isLoading ? <AiOutlineLoading3Quarters className="w-5 h-5 animate-spin" /> : <FiSend className="w-5 h-5" />}
                   </button>
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
             <p className="text-center text-xs text-slate-500 mt-2">
                AI Tutor can make mistakes. Consider checking important information.
             </p>
          </div>
        </div>
      </div>

      {/* Modals */}
      <PortalModal isOpen={imageModalOpen} onClose={closeImageModal}>
         <div className="flex items-center justify-center min-h-screen p-4" onClick={closeImageModal}>
            <div className="relative max-w-7xl max-h-[90vh]" onClick={e => e.stopPropagation()}>
               <img src={selectedImageUrl} alt={selectedImageAlt} className="max-w-full max-h-[90vh] rounded-lg shadow-2xl" />
               <button onClick={closeImageModal} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/70">
                  <FiX className="w-6 h-6" />
               </button>
            </div>
         </div>
      </PortalModal>

      <PortalModal isOpen={documentModalOpen} onClose={closeDocumentModal}>
         <div className="flex items-center justify-center min-h-screen p-4 bg-black/80" onClick={closeDocumentModal}>
            <div className="w-full max-w-5xl h-[85vh] bg-[#16181e] rounded-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
               <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#0f1117]">
                  <h3 className="text-white font-medium truncate">{selectedDocumentName}</h3>
                  <button onClick={closeDocumentModal} className="text-slate-400 hover:text-white">
                     <FiX className="w-6 h-6" />
                  </button>
               </div>
               <div className="flex-1 overflow-auto p-6 bg-[#0f1117]">
                  {selectedDocumentPages.length > 0 ? (
                     <div className="flex flex-col items-center gap-4">
                        <img 
                           src={selectedDocumentPages[currentDocumentPage]} 
                           alt={`Page ${currentDocumentPage + 1}`}
                           className="max-w-full shadow-lg" 
                        />
                        {selectedDocumentPages.length > 1 && (
                           <div className="flex items-center gap-4 mt-4 bg-[#1e2029] px-4 py-2 rounded-full">
                              <button 
                                 onClick={() => setCurrentDocumentPage(p => Math.max(0, p - 1))}
                                 disabled={currentDocumentPage === 0}
                                 className="text-white disabled:opacity-30"
                              >
                                 <FiChevronLeft className="w-5 h-5" />
                              </button>
                              <span className="text-sm text-slate-300">{currentDocumentPage + 1} / {selectedDocumentPages.length}</span>
                              <button 
                                 onClick={() => setCurrentDocumentPage(p => Math.min(selectedDocumentPages.length - 1, p + 1))}
                                 disabled={currentDocumentPage === selectedDocumentPages.length - 1}
                                 className="text-white disabled:opacity-30"
                              >
                                 <FiChevronRight className="w-5 h-5" />
                              </button>
                           </div>
                        )}
                     </div>
                  ) : (
                     <pre className="text-slate-300 font-mono text-sm whitespace-pre-wrap">{selectedDocumentContent}</pre>
                  )}
               </div>
            </div>
         </div>
      </PortalModal>

    </div>
    </>
  );
};

export default AiTutorPage;
