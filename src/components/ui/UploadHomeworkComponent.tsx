import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AiOutlineUpload, AiOutlineCamera, AiOutlineFullscreen, AiOutlineBulb, AiOutlineFileText, AiOutlineHistory } from 'react-icons/ai';
import { FiDownload, FiCopy, FiShare2, FiClock, FiTrash2 } from 'react-icons/fi';
import IconComponent from './IconComponent';
import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
import { Document, Paragraph, TextRun, Packer } from 'docx';
import { useResponseCheck, ResponseUpgradeModal } from '../../utils/responseChecker';
import { useNotification } from '../../utils/NotificationContext';
import { useLanguage } from '../../utils/LanguageContext';
import { useAuth } from '../../utils/AuthContext';

import { supabase } from '../../utils/supabase';
import { v4 as uuidv4 } from 'uuid';

// Import homework API functions
import { 
  getHomeworkHistory, 
  deleteHomework 
} from '../../utils/homeworkAPI';

// Import markdown and math libraries
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';

// Set up PDF.js worker with a more reliable approach
if (typeof window !== 'undefined') {
  try {
    // Use local worker file first
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/js/pdf.worker.min.js';
  } catch (error) {
    // Fallback to CDN with the correct .mjs extension
    try {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    } catch (fallbackError) {
      // Final fallback - try the bundled version
      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url
        ).toString();
      } catch (finalError) {
        // Disable worker as last resort
        pdfjsLib.GlobalWorkerOptions.workerSrc = '';
        console.warn('PDF.js worker setup failed, using main thread');
      }
    }
  }
}

// Type definitions for PDF.js
interface PDFPageProxy {
  getViewport(params: { scale: number }): any;
  render(renderContext: any): { promise: Promise<void> };
}

interface PDFDocumentProxy {
  numPages: number;
  getPage(pageNumber: number): Promise<PDFPageProxy>;
}

interface UploadHomeworkComponentProps {
  className?: string;
}

interface HomeworkHistoryItem {
  id: string;
  fileName?: string;
  fileUrl?: string;
  question: string;
  answer: string;
  timestamp: Date;
  fileType: string;
  documentPages?: string[];
  file?: File;
  // Add page solutions to properly store all page-specific solutions
  pageSolutions?: PageSolution[];
  // Add current page to restore navigation state
  currentPage?: number;
  // Add processing completion state
  overallProcessingComplete?: boolean;
}

// Add new interface for page solutions
interface PageSolution {
  pageNumber: number;
  solution: string;
  isLoading: boolean;
  isComplete: boolean;
  error?: string;
}

// Add interface for related knowledge - simplified for streaming
interface RelatedKnowledge {
  content: string; // Raw markdown content that will be streamed
  isComplete: boolean;
}

// Portal Modal Component - renders at document.body level
interface PortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

const PortalModal: React.FC<PortalModalProps> = ({ isOpen, onClose, children, className = '' }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9999
        }}
      >
        <motion.div 
          className={className}
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            maxWidth: '90vw',
            maxHeight: '90vh'
          }}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

// Helper to convert base64 to Blob
const base64ToBlob = (base64: string, mimeType: string = 'image/jpeg'): Blob => {
  const byteCharacters = atob(base64.split(',')[1]);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: mimeType });
};

// Helper to get local ISO string with offset
const toLocalISOString = (date: Date) => {
  const tzo = -date.getTimezoneOffset();
  const dif = tzo >= 0 ? '+' : '-';
  const pad = (num: number) => {
    const norm = Math.floor(Math.abs(num));
    return (norm < 10 ? '0' : '') + norm;
  };

  return date.getFullYear() +
    '-' + pad(date.getMonth() + 1) +
    '-' + pad(date.getDate()) +
    'T' + pad(date.getHours()) +
    ':' + pad(date.getMinutes()) +
    ':' + pad(date.getSeconds()) +
    dif + pad(tzo / 60) + ':' + pad(tzo % 60);
};

const UploadHomeworkComponent: React.FC<UploadHomeworkComponentProps> = ({ className = '' }) => {
  const { t } = useLanguage();
  const { user, session } = useAuth();
  
  // Check if user is authenticated
  useEffect(() => {
    if (!user && !session) {
      console.warn('⚠️ No authenticated user found in UploadHomeworkComponent');
    }
  }, [user, session]);

  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState('');
  const [documentPages, setDocumentPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [fullScreenSolution, setFullScreenSolution] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [homeworkHistory, setHomeworkHistory] = useState<HomeworkHistoryItem[]>([]);
  const [showGetAnswerButton, setShowGetAnswerButton] = useState(false);
  const [showRelatedKnowledge, setShowRelatedKnowledge] = useState(false);
  const [relatedKnowledge, setRelatedKnowledge] = useState<RelatedKnowledge | null>(null);
  const [loadingKnowledge, setLoadingKnowledge] = useState(false);
  
  // Add new state for page solutions
  const [pageSolutions, setPageSolutions] = useState<PageSolution[]>([]);
  const [overallProcessingComplete, setOverallProcessingComplete] = useState(false);
  
  // Add state to track if processing has been started to prevent double clicks
  const [isProcessingStarted, setIsProcessingStarted] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add refs for auto-scrolling
  const solutionContainerRef = useRef<HTMLDivElement>(null);
  const relatedKnowledgeContainerRef = useRef<HTMLDivElement>(null);

  // Response checking state
  const { checkAndUseResponse } = useResponseCheck();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');
  const { showSuccess } = useNotification();

  // Helper to upload file to Supabase
  const uploadToSupabase = async (file: File | Blob, fileName: string): Promise<string | null> => {
    try {
      // Use chat-attachments bucket
      const filePath = `${user?.id || 'anonymous'}/${Date.now()}_${fileName}`;
      const { data, error } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file);

      if (error) {
        console.error('Supabase upload error:', error);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Upload to Supabase failed:', error);
      return null;
    }
  };

  // Auto-scroll function for solution container
  const scrollToBottom = (containerRef: React.RefObject<HTMLDivElement>) => {
    if (containerRef.current) {
      const container = containerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  };

  // Auto-scroll effect for solution updates
  useEffect(() => {
    if (answer || (pageSolutions.length > 0 && pageSolutions[currentPage]?.solution)) {
      // Small delay to ensure content is rendered before scrolling
      setTimeout(() => scrollToBottom(solutionContainerRef), 100);
    }
  }, [answer, pageSolutions, currentPage]);

  // Auto-scroll effect for related knowledge updates
  useEffect(() => {
    if (relatedKnowledge?.content) {
      setTimeout(() => scrollToBottom(relatedKnowledgeContainerRef), 100);
    }
  }, [relatedKnowledge?.content]);

  // Load history from database on component mount
  useEffect(() => {
    const loadHistoryFromDatabase = async () => {
      // Only load history if user is authenticated
      if (!user && !session) {
        console.log('🚫 No authenticated user - clearing history');
        setHomeworkHistory([]);
        return;
      }

      try {
        console.log('📚 Loading homework history from database...');
        const result = await getHomeworkHistory(user, session);
        
        if (result.success && result.history) {
          console.log('✅ Loaded homework history:', result.history.length, 'items');
          setHomeworkHistory(result.history);
        } else {
          console.error('❌ Failed to load homework history:', result.error);
          // Do not fallback to localStorage for security reasons
          setHomeworkHistory([]);
        }
      } catch (error) {
        console.error('Error loading homework history from database:', error);
        // Do not fallback to localStorage for security reasons
        setHomeworkHistory([]);
      }
    };

    loadHistoryFromDatabase();
  }, [user, session]);



  // Function to add item to history - only for authenticated users
  const addToHistory = async (fileName: string, question: string, answer: string, fileType: string, documentPages?: string[], originalFile?: File, pageSolutions?: PageSolution[], currentPageIndex?: number, processingComplete?: boolean) => {
    // Require authentication for saving history
    if (!user && !session) {
      console.warn('⚠️ Cannot save homework history - user not authenticated');
      return;
    }

    try {
      console.log('💾 Saving homework to local history (database save disabled)...');
      
      // Create a local history item
      const newItem: HomeworkHistoryItem = {
        id: uuidv4(), // Generate a temporary ID
        fileName: fileName,
        fileUrl: '', // URL is not saved to DB anymore
        question: question,
        answer: answer,
        timestamp: new Date(),
        fileType: fileType,
        documentPages,
        file: originalFile,
        pageSolutions: pageSolutions,
        currentPage: currentPageIndex,
        overallProcessingComplete: processingComplete || false
      };
      
      // Update local state
      setHomeworkHistory(prev => [newItem, ...prev.slice(0, 19)]); // Keep only last 20 items

      /*
      // Submit to database
      const submissionData = {
        question,
        solution: answer,
        file: originalFile,
        fileType,
        fileName,
        pageSolutions,
        currentPage: currentPageIndex,
        processingComplete: processingComplete || false
      };

      const result = await submitHomework(submissionData, user, session);
      
      if (result.success && result.homework) {
        console.log('✅ Homework saved to database successfully');
        
        // Create the history item from the database response
        const newItem: HomeworkHistoryItem = {
          id: result.homework.id.toString(),
          fileName: result.homework.fileName,
          fileUrl: result.homework.fileUrl,
          question: result.homework.question,
          answer: result.homework.solution,
          timestamp: new Date(result.homework.timestamp),
          fileType: result.homework.fileType,
          documentPages,
          file: originalFile,
          pageSolutions: result.homework.pageSolutions,
          currentPage: result.homework.currentPage,
          overallProcessingComplete: result.homework.processingComplete
        };
        
        // Update local state
        setHomeworkHistory(prev => [newItem, ...prev.slice(0, 19)]); // Keep only last 20 items
      } else {
        console.error('❌ Failed to save homework to database:', result.error);
        // Do not save to localStorage as fallback - require authentication
      }
      */
    } catch (error) {
      console.error('❌ Error saving homework:', error);
      // Do not save to localStorage as fallback - require authentication
    }
  };

  // Function to convert PDF URL to images (for history restoration)
  const convertPdfUrlToImages = async (pdfUrl: string): Promise<string[]> => {
    try {
      setProcessingStatus('Loading PDF from history...');
      
      // Fetch PDF from URL
      const response = await fetch(pdfUrl);
      const arrayBuffer = await response.arrayBuffer();
      
      // Initialize PDF.js with proper worker setup
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true
      });
      
      const pdf = await loadingTask.promise as PDFDocumentProxy;
      const images: string[] = [];
      
      setProcessingStatus(`Converting ${pdf.numPages} pages to images...`);
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        setProcessingStatus(`Converting page ${pageNum} of ${pdf.numPages}...`);
        
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality
        
        // Create canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        if (!context) {
          throw new Error('Could not get canvas context');
        }
        
        // Render page to canvas
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        
        await page.render(renderContext).promise;
        
        // Convert canvas to base64 image
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        images.push(imageDataUrl);
      }
      
      setProcessingStatus('PDF conversion completed!');
      return images;
    } catch (error) {
      console.error('PDF URL conversion error:', error);
      setProcessingStatus('Error converting PDF');
      throw error;
    }
  };

  // Function to load from history - updated to restore complete state including all page solutions
  const loadFromHistory = async (item: HomeworkHistoryItem) => {
    const displayFileName = item.fileName || 'Text Question';
    
    console.log('🔄 Loading from history:', {
      fileName: displayFileName,
      hasDocumentPages: !!item.documentPages?.length,
      hasPageSolutions: !!item.pageSolutions?.length,
      currentPage: item.currentPage,
      overallComplete: item.overallProcessingComplete,
      fileUrl: item.fileUrl,
      fileType: item.fileType
    });
    
    setQuestion(item.question);
    setAnswer(item.answer);
    setShowHistory(false);
    setLoading(true);
    setProcessingStatus('Restoring from history...');
    
    try {
      // Restore document pages if available (for both PDFs and images)
      if (item.documentPages && item.documentPages.length > 0) {
        console.log('📄 Restoring document pages:', item.documentPages.length);
        setDocumentPages(item.documentPages);
        setCurrentPage(item.currentPage || 0);
        
        // Restore complete page solutions if available
        if (item.pageSolutions && item.pageSolutions.length > 0) {
          console.log('✅ Restoring complete page solutions:', item.pageSolutions.length, 'pages');
          setPageSolutions(item.pageSolutions);
          setShowGetAnswerButton(false); // Hide button since solutions are already loaded
          setOverallProcessingComplete(item.overallProcessingComplete || true);
        } else {
          console.log('⚠️ No page solutions found, creating legacy fallback');
          // Fallback: Initialize page solutions with the combined answer (legacy support)
          const initialPageSolutions: PageSolution[] = item.documentPages.map((_, index) => ({
            pageNumber: index + 1,
            solution: index === 0 ? item.answer : '', // Only first page has the answer for legacy items
            isLoading: false,
            isComplete: true
          }));
          setPageSolutions(initialPageSolutions);
          setShowGetAnswerButton(true); // Show button for legacy items
          setOverallProcessingComplete(false);
        }
      } else if (item.fileUrl && item.fileType === 'application/pdf') {
        // Handle PDF files that need to be converted to images
        console.log('📄 PDF file detected, converting to images:', item.fileUrl);
        
        try {
          const convertedImages = await convertPdfUrlToImages(item.fileUrl);
          setDocumentPages(convertedImages);
          setCurrentPage(0);
          
          // If we have page solutions, restore them
          if (item.pageSolutions && item.pageSolutions.length > 0) {
            setPageSolutions(item.pageSolutions);
            setShowGetAnswerButton(false);
            setOverallProcessingComplete(item.overallProcessingComplete || true);
          } else {
            // Legacy support - create page solutions from the main answer
            const initialPageSolutions: PageSolution[] = convertedImages.map((_, index) => ({
              pageNumber: index + 1,
              solution: index === 0 ? item.answer : '',
              isLoading: false,
              isComplete: true
            }));
            setPageSolutions(initialPageSolutions);
            setShowGetAnswerButton(true);
            setOverallProcessingComplete(false);
          }
        } catch (error) {
          console.error('❌ Error converting PDF from history:', error);
          setProcessingStatus('Error loading PDF from history');
          // Fallback to showing the answer without document pages
          setDocumentPages([]);
          setPageSolutions([]);
          setShowGetAnswerButton(false);
          setOverallProcessingComplete(false);
        }
      } else if (item.fileUrl && item.fileType?.startsWith('image/')) {
        // Handle single image files
        console.log('🖼️ Restoring single image file:', item.fileUrl);
        setDocumentPages([item.fileUrl]);
        setCurrentPage(0);
        setPageSolutions([]);
        setShowGetAnswerButton(false);
        setOverallProcessingComplete(false);
      } else {
        console.log('📝 Loading text question from history');
        // Clear document-related state for text questions
        setDocumentPages([]);
        setPageSolutions([]);
        setShowGetAnswerButton(false);
        setOverallProcessingComplete(false);
      }
    } catch (error) {
      console.error('❌ Error loading from history:', error);
      setProcessingStatus('Error loading from history');
    }
    
    // Clear file state since we're loading from history
    setFile(null);
    
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Clear any processing status after a delay
    setTimeout(() => {
      setProcessingStatus('');
      setLoading(false);
      setIsProcessingStarted(false); // Reset processing state
    }, 1000);
    
    console.log('✅ History loaded successfully');
  };

  // Function to delete history item - updated to delete from database
  const deleteHistoryItem = async (id: string) => {
    // Require authentication for deleting history
    if (!user && !session) {
      console.warn('⚠️ Cannot delete homework - user not authenticated');
      return;
    }

    try {
      console.log('🗑️ Deleting homework from database:', id);
      
      const result = await deleteHomework(id, user, session);
      
      if (result.success) {
        console.log('✅ Homework deleted from database successfully');
        setHomeworkHistory(prev => prev.filter(item => item.id !== id));
      } else {
        console.error('❌ Failed to delete homework from database:', result.error);
        // Do not update local state if database delete failed for consistency
      }
    } catch (error) {
      console.error('❌ Error deleting homework:', error);
      // Do not update local state if delete failed for consistency
    }
  };

  // Function to clear all history
  const clearAllHistory = () => {
    setHomeworkHistory([]);
  };

  // Function to format relative time
  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  // Preprocess LaTeX for react-markdown
  const preprocessLaTeX = (content: string) => {
    return content
      .replace(/\\\[(.*?)\\\]/g, (_, eq) => `$$${eq}$$`)   // block math \[ ... \]
      .replace(/\\\((.*?)\\\)/g, (_, eq) => `$${eq}$`)    // inline math \( ... \)
      .replace(/\[\s*([^\[\]]+?)\s*\](?!\()/g, (_, eq) => `$$${eq}$$`); // block math [ ... ] excluding links
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
    h1: ({ children }: any) => <h1 className="text-3xl font-bold text-cyan-400 mt-8 mb-4 border-b-2 border-cyan-500/30 pb-2">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-2xl font-bold text-blue-400 mt-6 mb-3 border-b border-blue-500/30 pb-1">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-xl font-bold text-teal-400 mt-4 mb-2 bg-teal-500/10 px-3 py-2 rounded border border-teal-500/20">{children}</h3>,
    h4: ({ children }: any) => <h4 className="text-lg font-semibold text-slate-300 mt-3 mb-2">{children}</h4>,
    p: ({ children }: any) => <p className="text-slate-300 mb-4 leading-relaxed">{children}</p>,
    ul: ({ children }: any) => <ul className="list-disc list-inside mb-4 text-slate-300 space-y-1">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal list-inside mb-4 text-slate-300 space-y-1">{children}</ol>,
    li: ({ children }: any) => <li className="mb-1 pl-2">{children}</li>,
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-cyan-500 pl-4 my-4 bg-cyan-500/10 py-3 rounded-r italic text-slate-300">
        {children}
      </blockquote>
    ),
    strong: ({ children }: any) => <strong className="font-bold text-cyan-400 bg-cyan-500/10 px-1 rounded">{children}</strong>,
    em: ({ children }: any) => <em className="italic text-slate-300">{children}</em>,
    table: ({ children }: any) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border border-gray-300 rounded-lg overflow-hidden">{children}</table>
      </div>
    ),
    thead: ({ children }: any) => <thead className="bg-gray-100">{children}</thead>,
    tbody: ({ children }: any) => <tbody>{children}</tbody>,
    tr: ({ children }: any) => <tr className="border-b border-gray-200 hover:bg-gray-50">{children}</tr>,
    th: ({ children }: any) => <th className="px-4 py-2 text-left font-semibold text-gray-800">{children}</th>,
    td: ({ children }: any) => <td className="px-4 py-2 text-gray-700">{children}</td>,
    a: ({ children, href }: any) => (
      <a href={href} className="text-blue-600 hover:text-blue-800 underline font-medium" target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
    // Custom styling for step indicators that might appear in solutions
    div: ({ children, className }: any) => {
      if (typeof children === 'string' && children.toLowerCase().includes('step')) {
        return (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-4 my-4 rounded-r-lg">
            <strong className="text-blue-800 text-lg">{children}</strong>
          </div>
        );
      }
      return <div className={className}>{children}</div>;
    },
  };

  // Download functionality (same as ContentWriterComponent)
  const handleDownloadContent = (format: 'txt' | 'pdf' | 'doc') => {
    const element = document.createElement('a');
    let content = answer;
    
    // Remove any AI formatting markers, separator lines, etc.
    content = content
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/_(.*?)_/g, '$1') // Remove underline
      .replace(/==(.*?)==/g, '$1') // Remove highlight
      .replace(/\n- (.*)/g, '• $1') // Convert unordered lists
      .replace(/\n\d+\. (.*)/g, '$1') // Convert ordered lists
      .replace(/#{1,6} (.*)/g, '$1') // Remove headers
      .replace(/---/g, '') // Remove separators
      .replace(/\n/g, '\n'); // Keep newlines
      
    // Remove any AI prefixes/suffixes
    content = content
      .replace(/^(Certainly!|Here's|I've|The solution|The answer)[^]*/i, '')
      .replace(/[\r\n]+(Let me know|Hope this helps|Is there anything else)[^]*$/i, '');

    if (format === 'txt') {
      const file = new Blob([content], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = `homework-solution-${new Date().toISOString().slice(0, 10)}.txt`;
    } else if (format === 'pdf') {
      // Create PDF using jsPDF with pagination
      const doc = new jsPDF();
      const pageHeight = doc.internal.pageSize.height;
      const margin = 15;
      const lineHeight = 7;
      const fontSize = 11;
      
      doc.setFontSize(fontSize);
      
      // Split content into lines and paginate
      const textLines = doc.splitTextToSize(content, 180);
      let y = margin;
      
      for (let i = 0; i < textLines.length; i++) {
        if (y > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        
        doc.text(textLines[i], margin, y);
        y += lineHeight;
      }
      
      doc.save(`homework-solution-${new Date().toISOString().slice(0, 10)}.pdf`);
      return;
    } else if (format === 'doc') {
      // Create DOC using docx
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun(content)
              ],
            }),
          ],
        }],
      });
      
      // Use Packer to generate the document
      Packer.toBlob(doc).then(blob => {
        const file = new Blob([blob], {type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
        element.href = URL.createObjectURL(file);
        element.download = `homework-solution-${new Date().toISOString().slice(0, 10)}.docx`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      });
      return;
    }

    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Copy content functionality
  const handleCopyContent = () => {
    let content = answer;
    // Convert markdown to formatted text
    content = content
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      .replace(/==(.*?)==/g, '$1')
      .replace(/\n- (.*)/g, '• $1')
      .replace(/\n\d+\. (.*)/g, '$1')
      .replace(/#{1,6} (.*)/g, '$1')
      .replace(/\n/g, '\n');
    navigator.clipboard.writeText(content);
  };

  // Share content functionality
  const handleShareContent = () => {
    let content = answer;
    // Convert markdown to formatted text
    content = content
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/_(.*?)_/g, '$1')
      .replace(/==(.*?)==/g, '$1')
      .replace(/\n- (.*)/g, '• $1')
      .replace(/\n\d+\. (.*)/g, '$1')
      .replace(/#{1,6} (.*)/g, '$1')
      .replace(/\n/g, '\n');

    if (navigator.share) {
      navigator.share({
        title: 'Homework Solution',
        text: content,
      }).catch(console.error);
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(content);
      showSuccess('Content copied to clipboard!');
    }
  };

  // Convert PDF to images using PDF.js
  const convertPdfToImages = async (file: File): Promise<string[]> => {
    try {
      setProcessingStatus('Loading PDF...');
      
      const arrayBuffer = await file.arrayBuffer();
      
      // Initialize PDF.js with proper worker setup
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        useWorkerFetch: false,
        isEvalSupported: false,
        useSystemFonts: true
      });
      
      const pdf = await loadingTask.promise as PDFDocumentProxy;
      const images: string[] = [];
      
      setProcessingStatus(`Converting ${pdf.numPages} pages to images...`);
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        setProcessingStatus(`Converting page ${pageNum} of ${pdf.numPages}...`);
        
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better quality
        
        // Create canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        if (!context) {
          throw new Error('Could not get canvas context');
        }
        
        // Render page to canvas
        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };
        
        await page.render(renderContext).promise;
        
        // Convert canvas to base64 image
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        images.push(imageDataUrl);
      }
      
      setProcessingStatus('PDF conversion completed!');
      return images;
    } catch (error) {
      console.error('PDF conversion error:', error);
      setProcessingStatus('Error converting PDF');
      throw error;
    }
  };



  // Process uploaded files
  const processFiles = async (files: File[]) => {
    console.log('🚀 Starting processFiles - loading files for preview');
    console.log('📁 Files count:', files.length);
    
    setLoading(true);
    setProcessingStatus('Loading files for preview...');
    setAnswer(''); // Clear previous answer
    setPageSolutions([]); // Clear previous page solutions
    setOverallProcessingComplete(false);
    
    try {
      let allImageUrls: string[] = [];
      
      for (const file of files) {
        console.log('📄 Processing file:', file.name);
        
        if (file.type === 'application/pdf') {
          // Convert PDF to images
          const pdfImages = await convertPdfToImages(file);
          allImageUrls = [...allImageUrls, ...pdfImages];
        } else if (file.type.startsWith('image/')) {
          // Convert image file to data URL
          const imageDataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          allImageUrls.push(imageDataUrl);
        } else {
          console.warn('Skipping unsupported file type:', file.type);
        }
      }
      
      console.log('📸 Total images loaded:', allImageUrls.length);
      setDocumentPages(allImageUrls);
      setCurrentPage(0);
      
      // Show the Get Answer button
      setShowGetAnswerButton(true);
      setProcessingStatus(t('aiStudy.fileLoadedSuccessfully'));
      
      console.log('✅ Files loading completed');
      
    } catch (error) {
      console.error('💥 Files loading error:', error);
      setProcessingStatus('Error loading files');
      setAnswer(`Failed to load files: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setShowGetAnswerButton(false);
    } finally {
      setLoading(false);
      setTimeout(() => setProcessingStatus(''), 3000);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (e.target.files.length > 1) {
        // Multiple files selected
        const files = Array.from(e.target.files);
        // We'll store the first file as the primary "file" for now, but process all
        setFile(files[0]);
        processFiles(files);
      } else {
        // Single file
        const selectedFile = e.target.files[0];
        setFile(selectedFile);
        processFiles([selectedFile]);
      }
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setDocumentPages([]);
    setCurrentPage(0);
    setAnswer('');
    setPageSolutions([]);
    setShowGetAnswerButton(false);
    setOverallProcessingComplete(false);
    setIsProcessingStarted(false); // Reset processing state
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // New function to handle getting the answer via Webhook
  const handleGetAnswer = async () => {
    // Prevent multiple clicks
    if (loading || isProcessingStarted) return;
    
    console.log('🚀 Starting handleGetAnswer (Webhook)');
    console.log('📝 Question:', question);
    console.log('📄 Document pages:', documentPages.length);

    // Mark processing as started to prevent double clicks
    setIsProcessingStarted(true);
    setLoading(true);
    setProcessingStatus('Uploading and analyzing...');
    setAnswer(''); // Clear previous answer
    setPageSolutions([]); // Clear previous page solutions
    setOverallProcessingComplete(false);
    setShowGetAnswerButton(false); // Hide the button while processing
    
    try {
      let fileUrl = '';
      const pagesUrl: string[] = [];
      const fileType = file?.type || 'text';

      // 1. Upload original file if exists and is PDF/DOCX
      if (file && (file.type === 'application/pdf' || file.type.includes('document'))) {
        setProcessingStatus('Uploading original file...');
        const uploadedUrl = await uploadToSupabase(file, file.name);
        if (uploadedUrl) {
            fileUrl = uploadedUrl;
            console.log('✅ Original file uploaded:', fileUrl);
        }
      }

      // 2. Upload images (pages)
      if (documentPages.length > 0) {
        setProcessingStatus(`Uploading ${documentPages.length} pages...`);
        for (let i = 0; i < documentPages.length; i++) {
            const pageDataUrl = documentPages[i];
            let blob: Blob;
            
            // Convert data URL to Blob
            if (pageDataUrl.startsWith('data:')) {
                blob = base64ToBlob(pageDataUrl, 'image/jpeg');
            } else {
                try {
                    const res = await fetch(pageDataUrl);
                    blob = await res.blob();
                } catch (e) {
                    console.error('Failed to fetch page image:', e);
                    continue;
                }
            }

            const fileName = `page_${i + 1}.jpg`;
            const uploadedPageUrl = await uploadToSupabase(blob, fileName);
            if (uploadedPageUrl) {
                pagesUrl.push(uploadedPageUrl);
            }
        }
        console.log('✅ All pages uploaded:', pagesUrl.length);
      }

      // 3. Prepare payload
      const payload = {
        input_text: question || "Describe your question or problem", // User input text
        pagesUrl: pagesUrl,
        fileUrl: fileUrl, // URL of the original file (if PDF/DOCX)
        file_name: file?.name || "",
        no_of_pages: pagesUrl.length, // Number of pages
        file_type: fileType,
        uid: user?.id || 'anonymous',
        local_time: toLocalISOString(new Date())
      };

      console.log('📤 Sending webhook payload:', payload);
      setProcessingStatus('Analyzing with AI...');

      // 4. Send to Webhook
      const response = await fetch('https://n8n.matrixaiserver.com/webhook/uploadQuestion', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported by browser or response body is null');
      }

      // 5. Handle Streaming Response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let answerText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        // Split buffer by possible JSON boundaries (}{) or just try to parse progressively
        // The format is: {"type":...} {"type":...}
        // We can split by '} {' and reconstruct
        
        // Regex to match full JSON objects
        // We'll try to find complete objects and parse them
        let startIndex = 0;
        let braceCount = 0;
        let inString = false;
        let escape = false;
        
        for (let i = 0; i < buffer.length; i++) {
            const char = buffer[i];
            
            if (escape) {
                escape = false;
                continue;
            }
            
            if (char === '\\') {
                escape = true;
                continue;
            }
            
            if (char === '"') {
                inString = !inString;
                continue;
            }
            
            if (!inString) {
                if (char === '{') {
                    if (braceCount === 0) startIndex = i;
                    braceCount++;
                } else if (char === '}') {
                    braceCount--;
                    if (braceCount === 0) {
                        // Found a complete object
                        const jsonStr = buffer.substring(startIndex, i + 1);
                        try {
                            const json = JSON.parse(jsonStr);
                            if (json.type === 'item' && json.content) {
                                answerText += json.content;
                                setAnswer(prev => prev + json.content);
                            }
                        } catch (e) {
                            // Ignore parse errors for partial/malformed chunks
                            console.warn('JSON parse error:', e);
                        }
                        
                        // Advance buffer
                        buffer = buffer.substring(i + 1);
                        i = -1; // Reset loop to start of new buffer
                    }
                }
            }
        }
      }

      
      console.log('📥 Full webhook response received');

      setOverallProcessingComplete(true);
      setProcessingStatus('Analysis complete!');
      
      // Add to history (local only)
      await addToHistory(
        file?.name || 'Text Question', 
        question || 'Question', 
        answerText, 
        fileType, 
        documentPages, 
        file || undefined, 
        undefined, 
        0, 
        true
      );

    } catch (error) {
      console.error('💥 Get answer error:', error);
      setAnswer(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setShowGetAnswerButton(true); // Show button again on error
      setIsProcessingStarted(false); // Reset processing state on error
    } finally {
      setLoading(false);
      setProcessingStatus('');
    }
  };

  const buttonVariants = {
    hover: { scale: 1.05, boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.1)" },
    tap: { scale: 0.98 }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  // Function to get related knowledge
  const getRelatedKnowledge = async (questionText?: string, imageUrl?: string): Promise<RelatedKnowledge> => {
    console.log('🧠 Starting getRelatedKnowledge process');
    
    try {
      const content: any[] = [];
      
      if (imageUrl) {
        content.push({
          type: "image_url",
          image_url: {
            url: imageUrl
          }
        });
      }
      
      if (questionText) {
        content.push({
          type: "text",
          text: `Analyze this homework problem and provide the key knowledge points needed to solve it:

${questionText}

Please provide a structured breakdown of:
1. Key concepts and theories required
2. Mathematical formulas or principles needed
3. Prerequisites knowledge the student should have
4. Important points to remember

**Language Instructions**: 
- If the question is in English, respond in English
- If the question is in Chinese, respond in Chinese
- If the question is in another language, respond in that same language

Format your response as a clear, organized list of knowledge points that would help a student understand and solve this type of problem.`
        });
      } else {
        content.push({
          type: "text",
          text: `Analyze the homework problems in this image and provide the key knowledge points needed to solve them.

Please provide a structured breakdown of:
1. Key concepts and theories required
2. Mathematical formulas or principles needed
3. Prerequisites knowledge the student should have
4. Important points to remember

**Language Instructions**: 
- If the questions in the image are in English, respond in English
- If the questions in the image are in Chinese, respond in Chinese
- If the questions are in another language, respond in that same language

Format your response as a clear, organized list of knowledge points that would help a student understand and solve these types of problems.`
        });
      }
      
      const requestPayload = {
        model: "doubao-seed-1-6-vision-250815",
        messages: [
          {
            role: "system",
            content: [
              {
                type: "text", 
                text: "You are an educational knowledge assistant. Analyze homework problems and provide structured knowledge points, concepts, and prerequisites needed to solve them. Always respond in the same language as the question."
              }
            ]
          },
          {
            role: "user",
            content: content
          }
        ],
        stream: false
      };

      const response = await fetch(process.env.REACT_APP_DASHSCOPE_ENDPOINT || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_DASHSCOPE_API_KEY || 'sk-4d21243994a04bb09f431cb2471cdd6c'}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const knowledgeText = data.choices?.[0]?.message?.content || '';
      
      // Parse the knowledge text into structured format
      // This is a simple parsing - you might want to make it more sophisticated
      const lines = knowledgeText.split('\n').filter((line: string) => line.trim());
      
      return {
        content: lines.join('\n'),
        isComplete: true
      };

    } catch (error) {
      console.error('💥 Error in getRelatedKnowledge:', error);
      throw error;
    }
  };

  // Handle related knowledge button click
  const handleRelatedKnowledge = async () => {
    setLoadingKnowledge(true);
    setShowRelatedKnowledge(true);
    setRelatedKnowledge({ content: '', isComplete: false }); // Initialize with empty content
    
    try {
      let solutionToAnalyze = '';
      
      // Get the current solution to analyze
      if (pageSolutions.length > 0 && pageSolutions[currentPage]?.solution) {
        solutionToAnalyze = pageSolutions[currentPage].solution;
      } else if (answer) {
        solutionToAnalyze = answer;
      } else {
        throw new Error('No solution available to analyze');
      }
      
      // Use the streaming solution analysis API
      const knowledge = await getRelatedKnowledgeFromSolution(solutionToAnalyze);
      
      // Mark as complete
      setRelatedKnowledge({
        content: knowledge.content,
        isComplete: true
      });
    } catch (error) {
      console.error('Error getting related knowledge:', error);
      setRelatedKnowledge({
        content: 'Error loading knowledge points. Please try again.',
        isComplete: false
      });
    } finally {
      setLoadingKnowledge(false);
    }
  };

  // New function to get related knowledge from solution with streaming
  const getRelatedKnowledgeFromSolution = async (solutionText: string): Promise<RelatedKnowledge> => {
    console.log('🧠 Starting getRelatedKnowledgeFromSolution process with streaming');
    
    try {
      const content = [
        {
          type: "text",
          text: `Analyze this homework solution  give small bullet points and identify the key knowledge points, concepts, and topics that students need to understand to solve similar problems:

${solutionText}

please give small bullet points of what knowlegde is needed to solve the problems`
        }
      ];
      
      const requestPayload = {
        model: "doubao-seed-1-6-vision-250815",
        messages: [
          {
            role: "system",
            content: [
              {
                type: "text", 
                text: "You are an educational knowledge assistant. Analyze homework solutions and identify the key knowledge points, concepts, formulas, and prerequisites that students need to understand to solve similar problems. Always respond in the same language as the solution and use clear markdown formatting with proper structure."
              }
            ]
          },
          {
            role: "user",
            content: content
          }
        ],
        stream: true // Enable streaming
      };

      const response = await fetch(process.env.REACT_APP_DASHSCOPE_ENDPOINT || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_DASHSCOPE_API_KEY || 'sk-4d21243994a04bb09f431cb2471cdd6c'}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
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
            console.log('🏁 Related knowledge streaming completed');
            break;
          }

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                console.log('✅ Related knowledge stream marked as DONE');
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                const content_chunk = parsed.choices?.[0]?.delta?.content;
                
                if (content_chunk) {
                  if (isFirstChunk) {
                    console.log('📝 First related knowledge chunk received, starting real-time display');
                    isFirstChunk = false;
                  }
                  
                  fullContent += content_chunk;
                  
                  // Update related knowledge in real-time
                  setRelatedKnowledge({
                    content: fullContent,
                    isComplete: false
                  });
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

      console.log('📄 Full related knowledge content received');
      console.log('📊 Final content length:', fullContent.length);
      
      return {
        content: fullContent.trim() || 'No knowledge points could be generated',
        isComplete: true
      };

    } catch (error) {
      console.error('💥 Error in getRelatedKnowledgeFromSolution:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    handleGetAnswer();
  };

  return (
    <div className={`bg-[#0f172a]/60 backdrop-blur-md border border-white/10 rounded-xl shadow-lg overflow-hidden p-4 sm:p-6 ${className || ''}`}>
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 gap-8"
        variants={{
          hidden: { opacity: 0 },
          visible: { 
            opacity: 1,
            transition: { 
              when: "beforeChildren",
              staggerChildren: 0.1
            }
          }
        }}
        initial="hidden"
        animate="visible"
      >
        {/* Input Section */}
        <motion.div variants={itemVariants}>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-slate-400 mb-2 font-medium text-sm uppercase tracking-wider">
                {t('describeYourQuestionOrProblem')}
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full p-4 bg-[#0f172a]/60 backdrop-blur-md border border-white/10 rounded-2xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 resize-none h-40 text-slate-200 placeholder-slate-500 transition-all duration-300"
                placeholder={t('typeYourQuestionOrProblemHere')}
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-slate-400 mb-2 font-medium text-sm uppercase tracking-wider">
                {t('orUploadYourQuestion')}
              </label>
              <div 
                className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:border-indigo-500/50 hover:bg-white/[0.02] cursor-pointer transition-all duration-300 relative bg-[#0f172a]/30 group"
                onClick={() => !file && fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  multiple
                />
                {file ? (
                  <div className="text-slate-300 relative">
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile();
                      }}
                      className="absolute -top-4 -right-4 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full p-2 hover:bg-red-500 hover:text-white transition-all duration-300"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </motion.button>
                    <div className="w-16 h-16 mx-auto bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-3 text-indigo-400">
                        <IconComponent icon={AiOutlineFileText} className="h-8 w-8" />
                    </div>
                    <p className="font-medium text-white">{file.name}</p>
                    <p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div className="text-slate-400 group-hover:text-slate-300 transition-colors">
                    <div className="w-16 h-16 mx-auto bg-white/[0.05] rounded-2xl flex items-center justify-center mb-3 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-all duration-300">
                        <IconComponent icon={AiOutlineUpload} className="h-8 w-8" />
                    </div>
                    <p className="font-medium">{t('dragAndDropYourFileHereOrClickToBrowse')}</p>
                    <p className="text-sm mt-1 text-slate-500">{t('supportsPDFWordAndImages')}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between flex-wrap gap-3">
              <motion.button
                type="button"
                className="flex items-center justify-center px-5 py-2.5 bg-white/[0.05] border border-white/10 rounded-xl text-slate-300 font-medium hover:bg-white/[0.1] hover:text-white transition-all duration-300"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => setShowHistory(!showHistory)}
              >
                <IconComponent icon={AiOutlineHistory} className="h-5 w-5 mr-2 text-indigo-400" />
                {t('aiStudy.history')} ({homeworkHistory.length})
              </motion.button>
              
              <motion.button
                type="button"
                className="flex items-center justify-center px-5 py-2.5 bg-white/[0.05] border border-white/10 rounded-xl text-slate-300 font-medium hover:bg-white/[0.1] hover:text-white transition-all duration-300"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => fileInputRef.current?.click()}
              >
                <IconComponent icon={AiOutlineCamera} className="h-5 w-5 mr-2 text-indigo-400" />
                {t('takePhoto')}
              </motion.button>
              
              {/* Get Answer Button - shows when file is uploaded or question is typed */}
              {showGetAnswerButton || (question.trim() && !documentPages.length) ? (
                <motion.button
                  type="button"
                  className="flex items-center justify-center px-8 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl text-white font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex-1 md:flex-none"
                  variants={buttonVariants}
                  whileHover={!loading && !isProcessingStarted ? "hover" : {}}
                  whileTap={!loading && !isProcessingStarted ? "tap" : {}}
                  onClick={handleGetAnswer}
                  disabled={loading || isProcessingStarted}
                >
                  {loading ? t('processing') : t('getAnswer')}
                  <IconComponent icon={AiOutlineBulb} className="h-5 w-5 ml-2" />
                </motion.button>
              ) : (
                <motion.button
                  type="submit"
                  className="flex items-center justify-center px-8 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl text-white font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex-1 md:flex-none"
                  variants={buttonVariants}
                  whileHover={!loading && !isProcessingStarted ? "hover" : {}}
                  whileTap={!loading && !isProcessingStarted ? "tap" : {}}
                  disabled={loading || isProcessingStarted || (!question.trim() && documentPages.length === 0)}
                >
                  {loading ? t('processing') : t('getSolution')}
                  <IconComponent icon={AiOutlineBulb} className="h-5 w-5 ml-2" />
                </motion.button>
              )}
            </div>
          </form>
        </motion.div>
        
        {/* Results Section */}
        <motion.div variants={itemVariants}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
                <span className="w-1 h-8 bg-emerald-500 rounded-full"></span>
                {t('aiStudy.solution')}
            </h2>
            <div className="flex items-center space-x-3">
              {/* Related Knowledge Button - appears after answer is complete */}
              {((answer && !loading) || (pageSolutions.length > 0 && pageSolutions.some(ps => ps.isComplete && !ps.error))) && (
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={handleRelatedKnowledge}
                  disabled={loadingKnowledge}
                  className="flex items-center px-4 py-2 bg-purple-500/10 backdrop-blur-sm border border-purple-500/20 rounded-xl text-purple-300 font-medium hover:bg-purple-500/20 transition-colors"
                >
                  <IconComponent icon={AiOutlineBulb} className="h-4 w-4 mr-2" />
                  {loadingKnowledge ? t('aiStudy.loadingRelatedKnowledge') : t('aiStudy.relatedKnowledgeButton')}
                </motion.button>
              )}
              
              {(answer || pageSolutions.length > 0) && (
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => setFullScreenSolution(!fullScreenSolution)}
                  className="flex items-center text-slate-400 font-medium hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
                >
                  <IconComponent 
                    icon={AiOutlineFullscreen} 
                    className="h-5 w-5" 
                  />
                </motion.button>
              )}
            </div>
          </div>
          
          <motion.div
            className={`bg-[#0f172a]/40 backdrop-blur-md border border-white/10 rounded-3xl p-6 overflow-y-auto transition-all duration-300 custom-scrollbar ${
              fullScreenSolution ? 
                "fixed top-0 left-0 right-0 bottom-0 z-50 rounded-none bg-[#030712]" : 
                "h-[450px]"
            }`}
            variants={itemVariants}
            animate={(answer || pageSolutions.length > 0) ? { boxShadow: "0 0 0 1px rgba(255,255,255,0.05), 0 10px 30px -10px rgba(0,0,0,0.5)" } : {}}
            ref={!fullScreenSolution ? solutionContainerRef : undefined}
          >
            {fullScreenSolution ? (
              // Fullscreen mode with document on left and solution on right
              <div className="h-full flex flex-col">
                {/* Top navigation bar */}
                <div className="flex justify-between items-center p-4 bg-slate-800/90 backdrop-blur-sm border-b border-white/10 flex-shrink-0">
                  <div className="flex items-center space-x-4">
                    {pageSolutions.length > 0 && (
                      <>
                        <button
                          onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                          disabled={currentPage === 0}
                          className="flex items-center px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ← Previous
                        </button>
                        <span className="text-slate-300 font-medium">
                          Page {currentPage + 1} of {pageSolutions.length}
                        </span>
                        <button
                          onClick={() => setCurrentPage(Math.min(pageSolutions.length - 1, currentPage + 1))}
                          disabled={currentPage === pageSolutions.length - 1}
                          className="flex items-center px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next →
                        </button>
                      </>
                    )}
                  </div>
                  
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => setFullScreenSolution(false)}
                    className="bg-slate-600/50 backdrop-blur-sm text-slate-300 px-4 py-2 rounded-lg shadow-md hover:bg-slate-500/50 border border-white/10"
                  >
                    {t('aiStudy.exitFullscreen')}
                  </motion.button>
                </div>
                
                {/* Content area - split view */}
                <div className="flex-1 flex overflow-hidden">
                  {/* Left half - Document */}
                  {documentPages.length > 0 && (
                    <div className="w-1/2 p-4 border-r border-white/10 bg-slate-800/30 backdrop-blur-sm flex flex-col">
                      <h3 className="text-lg font-semibold text-cyan-400 mb-4 flex-shrink-0">Document - Page {currentPage + 1}</h3>
                      <div className="flex-1 bg-slate-700/50 backdrop-blur-sm rounded-lg overflow-hidden shadow-sm border border-white/10">
                        <img 
                          src={documentPages[currentPage]} 
                          alt={`Document page ${currentPage + 1}`}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Right half - Solution */}
                  <div className={`${documentPages.length > 0 ? 'w-1/2' : 'w-full'} p-4 flex flex-col`}>
                    <h3 className="text-lg font-semibold text-cyan-400 mb-4 flex-shrink-0">
                      {pageSolutions.length > 0 ? `Page ${currentPage + 1} Solution` : 'Solution'}
                    </h3>
                    <div className="flex-1 overflow-y-auto" ref={solutionContainerRef}>
                      {pageSolutions.length > 0 ? (
                        // Page solution content
                        <div>
                          {/* Page solution status */}
                          <div className="mb-4 p-3 bg-blue-500/10 backdrop-blur-sm rounded-lg border border-blue-500/20 flex-shrink-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {pageSolutions[currentPage]?.isLoading && (
                                  <div className="flex items-center text-blue-400">
                                    <motion.div
                                      className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full mr-2"
                                      animate={{ rotate: 360 }}
                                      transition={{ duration: 1, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
                                    />
                                    <span className="text-sm">{t('processing')}</span>
                                  </div>
                                )}
                                {pageSolutions[currentPage]?.isComplete && !pageSolutions[currentPage]?.error && (
                                  <span className="text-sm text-emerald-400 font-medium">✓ {t('complete')}</span>
                                )}
                                {pageSolutions[currentPage]?.error && (
                                  <span className="text-sm text-red-400 font-medium">⚠ {t('error')}</span>
                                )}
                              </div>
                            </div>
                            
                            {/* Progress indicator for all pages */}
                            <div className="mt-2">
                              <div className="flex items-center space-x-1">
                                {pageSolutions.map((ps, index) => (
                                  <div
                                    key={index}
                                    className={`w-3 h-3 rounded-full ${
                                      ps.isComplete && !ps.error
                                        ? 'bg-green-500'
                                        : ps.error
                                        ? 'bg-red-500'
                                        : ps.isLoading
                                        ? 'bg-blue-500 animate-pulse'
                                        : 'bg-slate-500'
                                    }`}
                                    title={`Page ${index + 1}: ${
                                      ps.isComplete && !ps.error
                                        ? t('complete')
                                        : ps.error
                                        ? t('error')
                                        : ps.isLoading
                                        ? t('processing')
                                        : t('pending')
                                    }`}
                                  />
                                ))}
                              </div>
                              <p className="text-xs text-slate-400 mt-1">
                                {pageSolutions.filter(ps => ps.isComplete && !ps.error).length} of {pageSolutions.length} pages completed
                              </p>
                            </div>
                          </div>
                          
                          {/* Current page solution content */}
                          <div
                            className="prose prose-lg max-w-none
                              prose-headings:text-cyan-400 
                              prose-p:text-slate-300 prose-p:leading-relaxed
                              prose-strong:text-slate-200 prose-strong:font-bold
                              prose-em:text-slate-300 prose-em:italic
                              prose-code:bg-slate-700/50 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:text-cyan-300
                              prose-pre:bg-slate-700/50 prose-pre:border prose-pre:border-slate-600
                              prose-blockquote:border-l-4 prose-blockquote:border-cyan-500 prose-blockquote:bg-cyan-500/10
                              prose-ul:space-y-1 prose-ol:space-y-1
                              prose-li:marker:text-cyan-400 prose-li:text-slate-300
                              prose-a:text-cyan-400 prose-a:font-medium
                              prose-table:border prose-table:border-slate-600
                              prose-th:bg-slate-700/50 prose-th:font-semibold prose-th:text-cyan-400
                              prose-td:border-t prose-td:border-slate-600 prose-td:text-slate-300"
                          >
                            {pageSolutions[currentPage]?.solution ? (
                              <ReactMarkdown
                                remarkPlugins={[remarkMath, remarkGfm]}
                                rehypePlugins={[rehypeKatex]}
                                components={markdownComponents}
                              >
                                {preprocessLaTeX(pageSolutions[currentPage].solution)}
                              </ReactMarkdown>
                            ) : pageSolutions[currentPage]?.isLoading ? (
                              <div className="flex items-center justify-center py-8">
                                <motion.div
                                  className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mr-3"
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
                                />
                                <span className="text-slate-300">{t('generatingSolutionForThisPage')}</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <IconComponent icon={AiOutlineBulb} className="h-12 w-12 mb-3 opacity-50" />
                                <p className="text-center">{t('yourSolutionWillAppearHere')}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : answer ? (
                        // Text question answer
                        <div
                          className="prose prose-lg max-w-none
                            prose-headings:text-cyan-400 
                            prose-p:text-slate-300 prose-p:leading-relaxed
                            prose-strong:text-slate-200 prose-strong:font-bold
                            prose-em:text-slate-300 prose-em:italic
                            prose-code:bg-slate-700/50 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:text-cyan-300
                            prose-pre:bg-slate-700/50 prose-pre:border prose-pre:border-slate-600
                            prose-blockquote:border-l-4 prose-blockquote:border-cyan-500 prose-blockquote:bg-cyan-500/10
                            prose-ul:space-y-1 prose-ol:space-y-1
                            prose-li:marker:text-cyan-400 prose-li:text-slate-300
                            prose-a:text-cyan-400 prose-a:font-medium
                            prose-table:border prose-table:border-slate-600
                            prose-th:bg-slate-700/50 prose-th:font-semibold prose-th:text-cyan-400
                            prose-td:border-t prose-td:border-slate-600 prose-td:text-slate-300"
                        >
                          <ReactMarkdown
                            remarkPlugins={[remarkMath, remarkGfm]}
                            rehypePlugins={[rehypeKatex]}
                            components={markdownComponents}
                          >
                            {preprocessLaTeX(answer)}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400">
                          <IconComponent icon={AiOutlineBulb} className="h-12 w-12 mb-3 opacity-50" />
                          <p className="text-center">{t('yourSolutionWillAppearHere')}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (!answer && loading) ? (
              // Loading state
              <div className="flex flex-col items-center justify-center h-full text-slate-300">
                <motion.div
                  className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full mb-4"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
                />
                <p className="text-center text-slate-300">{processingStatus || 'Analyzing your homework...'}</p>
              </div>
            ) : pageSolutions.length > 0 ? (
              // Show page-specific solution
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                {/* Page solution header */}
                <div className="mb-4 p-3 bg-blue-500/10 backdrop-blur-sm rounded-lg border border-blue-500/20">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-blue-100">
                      Page {currentPage + 1} Solution
                    </h3>
                    <div className="flex items-center space-x-2">
                      {pageSolutions[currentPage]?.isLoading && (
                        <div className="flex items-center text-blue-400">
                          <motion.div
                            className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full mr-2"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
                          />
                          <span className="text-sm">{t('processing')}</span>
                        </div>
                      )}
                      {pageSolutions[currentPage]?.isComplete && !pageSolutions[currentPage]?.error && (
                        <span className="text-sm text-emerald-400 font-medium">✓ {t('complete')}</span>
                      )}
                      {pageSolutions[currentPage]?.error && (
                        <span className="text-sm text-red-400 font-medium">⚠ {t('error')}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Progress indicator for all pages */}
                  <div className="mt-2">
                    <div className="flex items-center space-x-1">
                      {pageSolutions.map((ps, index) => (
                        <div
                          key={index}
                          className={`w-3 h-3 rounded-full ${
                            ps.isComplete && !ps.error
                              ? 'bg-green-500'
                              : ps.error
                              ? 'bg-red-500'
                              : ps.isLoading
                              ? 'bg-blue-500 animate-pulse'
                              : 'bg-slate-500'
                          }`}
                          title={`Page ${index + 1}: ${
                            ps.isComplete && !ps.error
                              ? t('complete')
                              : ps.error
                              ? t('error')
                              : ps.isLoading
                              ? t('processing')
                              : t('pending')
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {pageSolutions.filter(ps => ps.isComplete && !ps.error).length} of {pageSolutions.length} pages completed
                    </p>
                  </div>
                </div>
                
                {/* Current page solution content */}
                <div
                  className="prose prose-lg max-w-none
                    prose-headings:text-cyan-400 
                    prose-p:text-slate-300 prose-p:leading-relaxed
                    prose-strong:text-slate-200 prose-strong:font-bold
                    prose-em:text-slate-300 prose-em:italic
                    prose-code:bg-slate-700/50 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:text-cyan-300
                    prose-pre:bg-slate-700/50 prose-pre:border prose-pre:border-slate-600
                    prose-blockquote:border-l-4 prose-blockquote:border-cyan-500 prose-blockquote:bg-cyan-500/10
                    prose-ul:space-y-1 prose-ol:space-y-1
                    prose-li:marker:text-cyan-400 prose-li:text-slate-300
                    prose-a:text-cyan-400 prose-a:font-medium
                    prose-table:border prose-table:border-slate-600
                    prose-th:bg-slate-700/50 prose-th:font-semibold prose-th:text-cyan-400
                    prose-td:border-t prose-td:border-slate-600 prose-td:text-slate-300"
                >
                  {pageSolutions[currentPage]?.solution ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkMath, remarkGfm]}
                      rehypePlugins={[rehypeKatex]}
                      components={markdownComponents}
                    >
                      {preprocessLaTeX(pageSolutions[currentPage].solution)}
                    </ReactMarkdown>
                  ) : pageSolutions[currentPage]?.isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <motion.div
                        className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full mr-3"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
                      />
                      <span className="text-slate-300">{t('generatingSolutionForThisPage')}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                      <IconComponent icon={AiOutlineBulb} className="h-12 w-12 mb-3 opacity-50" />
                      <p className="text-center">{t('yourSolutionWillAppearHere')}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : answer ? (
              // Show text question answer
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <div
                  className="prose prose-lg max-w-none
                    prose-headings:text-cyan-400 
                    prose-p:text-slate-300 prose-p:leading-relaxed
                    prose-strong:text-slate-200 prose-strong:font-bold
                    prose-em:text-slate-300 prose-em:italic
                    prose-code:bg-slate-700/50 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:text-cyan-300
                    prose-pre:bg-slate-700/50 prose-pre:border prose-pre:border-slate-600
                    prose-blockquote:border-l-4 prose-blockquote:border-cyan-500 prose-blockquote:bg-cyan-500/10
                    prose-ul:space-y-1 prose-ol:space-y-1
                    prose-li:marker:text-cyan-400 prose-li:text-slate-300
                    prose-a:text-cyan-400 prose-a:font-medium
                    prose-table:border prose-table:border-slate-600
                    prose-th:bg-slate-700/50 prose-th:font-semibold prose-th:text-cyan-400
                    prose-td:border-t prose-td:border-slate-600 prose-td:text-slate-300"
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkMath, remarkGfm]}
                    rehypePlugins={[rehypeKatex]}
                    components={markdownComponents}
                  >
                    {preprocessLaTeX(answer)}
                  </ReactMarkdown>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <IconComponent icon={AiOutlineBulb} className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-center">{t('yourSolutionWillAppearHere')}</p>
              </div>
            )}
          </motion.div>

          {/* Action Buttons */}
          {(answer || (pageSolutions.length > 0 && pageSolutions[currentPage]?.solution)) && (
            <div className="mt-4 flex flex-wrap gap-3">
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => {
                  const contentToCopy = pageSolutions.length > 0 
                    ? pageSolutions[currentPage]?.solution || ''
                    : answer;
                  navigator.clipboard.writeText(contentToCopy.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1'));
                }}
                className="flex items-center text-sm px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700"
              >
                <IconComponent icon={FiCopy} className="mr-2" /> Copy
              </motion.button>
              
              {/* Download Buttons */}
              <div className="flex items-center space-x-2">
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => setShowDownloadOptions(!showDownloadOptions)}
                  className={`flex items-center text-sm px-4 py-2 rounded-lg transition-all duration-300 ${
                    showDownloadOptions 
                      ? 'bg-teal-600 text-white' 
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  }`}
                >
                  <IconComponent icon={FiDownload} className="mr-2" /> 
                  {showDownloadOptions ? 'Close' : 'Download'}
                </motion.button>

                <AnimatePresence>
                  {showDownloadOptions && (
                    <motion.div 
                      className="flex items-center space-x-2"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          // Set answer to current content for download
                          const currentContent = pageSolutions.length > 0 
                            ? pageSolutions[currentPage]?.solution || ''
                            : answer;
                          const originalAnswer = answer;
                          setAnswer(currentContent);
                          handleDownloadContent('pdf');
                          setAnswer(originalAnswer);
                        }}
                        className="flex items-center text-sm px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <div className="flex items-center">
                          <span className="mr-2 text-lg">📑</span>
                          <span className="font-medium">PDF</span>
                        </div>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          const currentContent = pageSolutions.length > 0 
                            ? pageSolutions[currentPage]?.solution || ''
                            : answer;
                          const originalAnswer = answer;
                          setAnswer(currentContent);
                          handleDownloadContent('doc');
                          setAnswer(originalAnswer);
                        }}
                        className="flex items-center text-sm px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <div className="flex items-center">
                          <span className="mr-2 text-lg">📝</span>
                          <span className="font-medium">DOC</span>
                        </div>
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          const currentContent = pageSolutions.length > 0 
                            ? pageSolutions[currentPage]?.solution || ''
                            : answer;
                          const originalAnswer = answer;
                          setAnswer(currentContent);
                          handleDownloadContent('txt');
                          setAnswer(originalAnswer);
                        }}
                        className="flex items-center text-sm px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <div className="flex items-center">
                          <span className="mr-2 text-lg">📄</span>
                          <span className="font-medium">TXT</span>
                        </div>
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => {
                  const contentToShare = pageSolutions.length > 0 
                    ? pageSolutions[currentPage]?.solution || ''
                    : answer;
                  const cleanContent = contentToShare.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');
                  
                  if (navigator.share) {
                    navigator.share({
                      title: 'Homework Solution',
                      text: cleanContent,
                    }).catch(console.error);
                  } else {
                    navigator.clipboard.writeText(cleanContent);
                    showSuccess('Content copied to clipboard!');
                  }
                }}
                className="flex items-center text-sm px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-700"
              >
                <IconComponent icon={FiShare2} className="mr-2" /> Share
              </motion.button>
            </div>
          )}
        </motion.div>
      </motion.div>

      {/* Document Preview Section (if file uploaded) - Always fullscreen */}
      {documentPages.length > 0 && (
        <motion.div 
          className="mt-8 bg-slate-600/30 backdrop-blur-sm border border-white/10 rounded-xl p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-cyan-400">Uploaded Document</h3>
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                <button 
                  className="px-3 py-1 bg-slate-600/50 backdrop-blur-sm text-slate-300 rounded-md disabled:opacity-50 border border-white/10"
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  Previous
                </button>
                <button 
                  className="px-3 py-1 bg-slate-600/50 backdrop-blur-sm text-slate-300 rounded-md disabled:opacity-50 border border-white/10"
                  disabled={currentPage === documentPages.length - 1}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  Next
                </button>
              </div>
              <div className="text-slate-400">
                Page {currentPage + 1} of {documentPages.length}
              </div>
            </div>
          </div>
          
          {/* Always show fullscreen image */}
          <div className="w-full h-[600px] bg-slate-700/50 backdrop-blur-sm rounded-lg overflow-hidden border border-white/10">
            <img 
              src={documentPages[currentPage]} 
              alt={`Document page ${currentPage + 1}`}
              className="w-full h-full object-contain"
            />
          </div>
        </motion.div>
      )}

      {/* History Panel */}
      <AnimatePresence>
        {showHistory && (
          <PortalModal
            isOpen={showHistory}
            onClose={() => setShowHistory(false)}
            className="bg-slate-800/90 backdrop-blur-sm border border-white/10 rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-cyan-400 flex items-center">
                <IconComponent icon={AiOutlineHistory} className="h-7 w-7 mr-3" />
                {t('homeworkHistory')}
                <span className="ml-3 text-sm bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full">
                  {homeworkHistory.length} {homeworkHistory.length !== 1 ? t('items') : t('item')}
                </span>
              </h3>
              <div className="flex items-center space-x-3">
                {homeworkHistory.length > 0 && (
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={clearAllHistory}
                    className="flex items-center px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors border border-red-500/30"
                  >
                    <IconComponent icon={FiTrash2} className="h-4 w-4 mr-2" />
                    {t('clearAll')}
                  </motion.button>
                )}
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-slate-400 hover:text-slate-300 p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(80vh-120px)]">
              {homeworkHistory.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {homeworkHistory.map((item) => (
                    <motion.div
                      key={item.id}
                      className="p-5 bg-slate-700/40 backdrop-blur-sm rounded-xl cursor-pointer hover:bg-slate-600/50 transition-all duration-300 group border border-white/10 hover:border-cyan-500/30"
                      onClick={() => loadFromHistory(item)}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex gap-4">
                        {/* Document Preview Section */}
                        {item.documentPages && item.documentPages.length > 0 ? (
                          <div className="flex-shrink-0 w-20 h-24 bg-slate-800/50 rounded-lg overflow-hidden border border-white/10 relative">
                            {item.fileType === 'application/pdf' ? (
                              // PDF Preview
                              <div className="w-full h-full flex flex-col items-center justify-center bg-red-500/20">
                                <svg className="w-8 h-8 text-red-400 mb-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                </svg>
                                <span className="text-xs text-red-400 font-bold">PDF</span>
                              </div>
                            ) : (
                              // Image Preview
                              <img 
                                src={item.documentPages[0]} 
                                alt="Document preview"
                                className="w-full h-full object-cover"
                              />
                            )}
                            {item.documentPages.length > 1 && (
                              <div className="absolute -bottom-1 -right-1 bg-cyan-500 text-white text-xs px-1 py-0.5 rounded text-center font-medium min-w-[20px]">
                                +{item.documentPages.length - 1}
                              </div>
                            )}
                          </div>
                        ) : item.fileType === 'application/pdf' || item.fileType?.startsWith('image/') ? (
                          // Show file type indicator even without documentPages
                          <div className="flex-shrink-0 w-20 h-24 bg-slate-800/50 rounded-lg overflow-hidden border border-white/10 relative flex flex-col items-center justify-center">
                            {item.fileType === 'application/pdf' ? (
                              <>
                                <svg className="w-8 h-8 text-red-400 mb-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                </svg>
                                <span className="text-xs text-red-400 font-bold">PDF</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-8 h-8 text-green-400 mb-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                </svg>
                                <span className="text-xs text-green-400 font-bold">IMG</span>
                              </>
                            )}
                          </div>
                        ) : null}
                        
                        {/* Content Section */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3 flex-1">
                              <div className="p-2 bg-cyan-500/20 rounded-lg">
                                <IconComponent 
                                  icon={item.fileType === 'text' ? AiOutlineFileText : AiOutlineUpload} 
                                  className="h-5 w-5 text-cyan-400" 
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-200 truncate">
                                  {item.fileName || 'Text Question'}
                                </p>
                                <div className="flex items-center space-x-2 mt-1">
                                  {/* File type indicator */}
                                  {item.fileType && item.fileType !== 'text' && (
                                    <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full font-medium">
                                      {item.fileType === 'application/pdf' ? 'PDF' : 
                                       item.fileType.startsWith('image/') ? 'Image' : 
                                       item.fileType.includes('document') ? 'Doc' : 'File'}
                                    </span>
                                  )}
                                  {/* Show page count for documents */}
                                  {item.documentPages && item.documentPages.length > 0 && (
                                    <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded-full font-medium">
                                      {item.documentPages.length} {item.documentPages.length > 1 ? t('pages') : t('page')}
                                    </span>
                                  )}
                                  {/* Show completion status for page solutions */}
                                  {item.pageSolutions && item.pageSolutions.length > 0 && (
                                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-medium">
                                      {item.pageSolutions.filter(ps => ps.isComplete && !ps.error).length}/{item.pageSolutions.length} {t('solved')}
                                    </span>
                                  )}
                                  <span className="text-xs text-slate-400 flex items-center">
                                    <IconComponent icon={FiClock} className="h-3 w-3 mr-1" />
                                    {formatRelativeTime(item.timestamp)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <motion.button
                              onClick={async (e) => {
                                e.stopPropagation();
                                await deleteHistoryItem(item.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-400 transition-all rounded-lg hover:bg-red-500/10 flex-shrink-0"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <IconComponent icon={FiTrash2} className="h-4 w-4" />
                            </motion.button>
                          </div>
                          
                          <div className="space-y-2">
                            <p className="text-sm text-slate-300 line-clamp-2">
                              <span className="font-medium text-cyan-400">Q:</span> {item.question.length > 120 ? `${item.question.substring(0, 120)}...` : item.question}
                            </p>
                            {/* Improved answer formatting with proper markdown rendering */}
                            <div className="text-xs text-slate-400 line-clamp-3">
                              <span className="font-medium text-green-400">A:</span> 
                              <div className="inline-block ml-1 prose prose-xs max-w-none
                                prose-headings:text-cyan-300 prose-headings:text-xs prose-headings:font-medium prose-headings:m-0
                                prose-p:text-slate-400 prose-p:text-xs prose-p:m-0 prose-p:leading-relaxed prose-p:inline
                                prose-strong:text-slate-300 prose-strong:font-semibold prose-strong:text-xs
                                prose-em:text-slate-400 prose-em:italic prose-em:text-xs
                                prose-code:bg-slate-600/50 prose-code:text-cyan-300 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                                prose-ul:text-xs prose-ul:m-0 prose-ol:text-xs prose-ol:m-0
                                prose-li:text-slate-400 prose-li:text-xs prose-li:m-0
                                prose-a:text-cyan-300 prose-a:text-xs"
                              >
                                <ReactMarkdown
                                  remarkPlugins={[remarkMath]}
                                  components={{
                                    // Simplified components for preview
                                    p: ({ children }) => <span className="text-slate-400 text-xs">{children}</span>,
                                    strong: ({ children }) => <span className="text-slate-300 font-semibold text-xs">{children}</span>,
                                    em: ({ children }) => <span className="text-slate-400 italic text-xs">{children}</span>,
                                    code: ({ children }) => <span className="bg-slate-600/50 text-cyan-300 px-1 py-0.5 rounded text-xs font-mono">{children}</span>,
                                    h1: ({ children }) => <span className="text-cyan-300 font-medium text-xs">{children}</span>,
                                    h2: ({ children }) => <span className="text-cyan-300 font-medium text-xs">{children}</span>,
                                    h3: ({ children }) => <span className="text-cyan-300 font-medium text-xs">{children}</span>,
                                    h4: ({ children }) => <span className="text-cyan-300 font-medium text-xs">{children}</span>,
                                    ul: ({ children }) => <span className="text-slate-400 text-xs">{children}</span>,
                                    ol: ({ children }) => <span className="text-slate-400 text-xs">{children}</span>,
                                    li: ({ children }) => <span className="text-slate-400 text-xs">{children}</span>,
                                    a: ({ children }) => <span className="text-cyan-300 text-xs">{children}</span>,
                                    blockquote: ({ children }) => <span className="text-slate-400 italic text-xs">{children}</span>,
                                  }}
                                >
                                  {preprocessLaTeX(item.answer.length > 200 ? `${item.answer.substring(0, 200)}...` : item.answer)}
                                </ReactMarkdown>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-600/50">
                            <div className="flex items-center space-x-2">
                              {/* Show indicators for different types of saved content */}
                              {item.overallProcessingComplete && (
                                <span className="text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2 py-1 rounded-full" title="Complete processing">
                                  ✓ {t('complete')}
                                </span>
                              )}
                              {item.pageSolutions && item.pageSolutions.length > 0 && (
                                <span className="text-xs text-blue-400 font-medium" title="Has page-by-page solutions">
                                  📄
                                </span>
                              )}
                              {item.documentPages && item.documentPages.length > 0 && (
                                <span className="text-xs text-purple-400 font-medium" title="Has document images">
                                  🖼️
                                </span>
                              )}
                            </div>
                            
                            <motion.div 
                              className="text-xs text-cyan-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center"
                              initial={{ x: 10 }}
                              animate={{ x: 0 }}
                            >
                              {t('clickToRestore')}
                              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </motion.div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-slate-400">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <IconComponent icon={AiOutlineHistory} className="mx-auto text-6xl mb-4 opacity-50" />
                    <p className="text-xl font-medium mb-2">{t('noHomeworkHistoryYet')}</p>
                    <p className="text-sm">{t('yourSolvedHomeworkProblemsWillAppearHere')}</p>
                    <p className="text-xs mt-2 text-slate-500">{t('uploadDocumentsOrAskQuestionsToGetStarted')}</p>
                  </motion.div>
                </div>
              )}
            </div>
          </PortalModal>
        )}
      </AnimatePresence>

      {/* Related Knowledge Modal */}
      <AnimatePresence>
        {showRelatedKnowledge && (
          <PortalModal
            isOpen={showRelatedKnowledge}
            onClose={() => setShowRelatedKnowledge(false)}
            className="bg-slate-800/90 backdrop-blur-sm border border-white/10 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-purple-400 flex items-center">
                <IconComponent icon={AiOutlineBulb} className="h-6 w-6 mr-2" />
                {t('relatedKnowledge')}
              </h3>
              <button
                onClick={() => setShowRelatedKnowledge(false)}
                className="text-slate-400 hover:text-slate-300 p-2 rounded-lg hover:bg-slate-700/50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {loadingKnowledge ? (
              <div className="flex items-center justify-center py-8">
                <motion.div
                  className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full mr-3"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
                />
                <span className="text-slate-300">{t('loadingKnowledgePoints')}</span>
              </div>
            ) : relatedKnowledge ? (
              <div className="space-y-6">
                {relatedKnowledge.content && (
                  <div className="prose prose-lg max-w-none
                    prose-headings:text-cyan-400 
                    prose-p:text-slate-300 prose-p:leading-relaxed
                    prose-strong:text-slate-200 prose-strong:font-bold
                    prose-em:text-slate-300 prose-em:italic
                    prose-code:bg-slate-700/50 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:text-cyan-300
                    prose-pre:bg-slate-700/50 prose-pre:border prose-pre:border-slate-600
                    prose-blockquote:border-l-4 prose-blockquote:border-cyan-500 prose-blockquote:bg-cyan-500/10
                    prose-ul:space-y-1 prose-ol:space-y-1
                    prose-li:marker:text-cyan-400 prose-li:text-slate-300
                    prose-a:text-cyan-400 prose-a:font-medium
                    prose-table:border prose-table:border-slate-600
                    prose-th:bg-slate-700/50 prose-th:font-semibold prose-th:text-cyan-400
                    prose-td:border-t prose-td:border-slate-600 prose-td:text-slate-300
                    prose-h2:text-xl prose-h2:font-bold prose-h2:text-purple-400 prose-h2:mt-6 prose-h2:mb-4 prose-h2:border-b prose-h2:border-purple-500/30 prose-h2:pb-2
                    prose-h3:text-lg prose-h3:font-semibold prose-h3:text-blue-400 prose-h3:mt-4 prose-h3:mb-3
                    prose-h4:text-base prose-h4:font-medium prose-h4:text-teal-400 prose-h4:mt-3 prose-h4:mb-2"
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkMath, remarkGfm]}
                      rehypePlugins={[rehypeKatex]}
                      components={markdownComponents}
                    >
                      {preprocessLaTeX(relatedKnowledge.content)}
                    </ReactMarkdown>
                  </div>
                )}
                
                {/* Show loading indicator if still streaming */}
                {!relatedKnowledge.isComplete && relatedKnowledge.content && (
                  <div className="flex items-center justify-center py-4">
                    <motion.div
                      className="w-6 h-6 border-3 border-purple-500 border-t-transparent rounded-full mr-2"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
                    />
                    <span className="text-slate-400 text-sm">Generating more content...</span>
                  </div>
                )}
                
                {!relatedKnowledge.content && !loadingKnowledge && (
                  <div className="text-center py-8 text-slate-400">
                    <IconComponent icon={AiOutlineBulb} className="mx-auto text-4xl mb-2 opacity-50" />
                    <p>No knowledge points available</p>
                    <p className="text-sm mt-1">Please try again</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-400">
                <IconComponent icon={AiOutlineBulb} className="mx-auto text-4xl mb-2 opacity-50" />
                <p>Failed to load knowledge points</p>
                <p className="text-sm mt-1">Please try again</p>
              </div>
            )}
          </PortalModal>
        )}
      </AnimatePresence>

      {/* Response Upgrade Modal */}
      <ResponseUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        message={upgradeMessage}
      />
    </div>
  );
};

export default UploadHomeworkComponent;
