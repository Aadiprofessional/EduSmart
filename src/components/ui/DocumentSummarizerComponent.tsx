import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AiOutlineUpload, AiOutlineFileText, AiOutlineBulb, AiOutlineHistory, AiOutlineLoading3Quarters, AiOutlineFullscreen, AiOutlineSearch, AiOutlineRobot } from 'react-icons/ai';
import { FiDownload, FiCopy, FiShare2, FiChevronLeft, FiChevronRight, FiEye, FiTrash2, FiZap, FiClock } from 'react-icons/fi';
import IconComponent from './IconComponent';
import * as pdfjsLib from 'pdfjs-dist';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { synthwave84 } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';
import * as echarts from 'echarts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Document, Paragraph, TextRun, Packer } from 'docx';
import { useResponseCheck, ResponseUpgradeModal } from '../../utils/responseChecker';
import { useNotification } from '../../utils/NotificationContext';
import { useLanguage } from '../../utils/LanguageContext';
import { useAuth } from '../../utils/AuthContext';
import { documentSummarizerService, FrontendSummaryItem } from '../../services/documentSummarizerService';

// Set up PDF.js worker with a more reliable approach
if (typeof window !== 'undefined') {
  try {
    // First try to use the local worker file with correct extension
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/js/pdf.worker.min.mjs';
  } catch (error) {
    try {
      // Fallback to CDN with exact version match
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    } catch (fallbackError) {
      try {
        // Try alternative CDN
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      } catch (finalError) {
        // Final fallback - disable worker (will use main thread)
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

interface DocumentSummarizerComponentProps {
  className?: string;
}

interface SummaryHistoryItem {
  id: string;
  title: string;
  summary: string;
  mindmapData: any;
  timestamp: Date;
  sourceType: 'file' | 'text';
  fileName?: string;
  documentPages?: string[];
  pageSummaries?: PageSummary[];
  file?: File;
}

interface PageSummary {
  pageNumber: number;
  summary: string;
  isLoading: boolean;
  isComplete: boolean;
  error?: string;
}

interface MindmapNode {
  name: string;
  children?: MindmapNode[];
  value?: number;
  category?: string;
}

// Animation variants for framer-motion
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: [0, 0, 0.58, 1] as const }
  }
};

const buttonVariants = {
  hover: { scale: 1.05, transition: { duration: 0.2 } },
  tap: { scale: 0.95, transition: { duration: 0.1 } }
};

// Portal Modal Component - renders at document.body level
interface PortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const PortalModal: React.FC<PortalModalProps> = ({ isOpen, onClose, children, className = '', style = {} }) => {
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
        className="bg-[#0f172a]/80 backdrop-blur-md flex items-center justify-center p-4"
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
            maxHeight: '90vh',
            ...style
          }}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

// Get user ID from authentication context - updated for better Supabase integration
const getUserId = (user?: any, session?: any): string | null => {
  console.log('🔍 DocumentSummarizer - Getting user ID from auth context...', {
    hasUser: !!user,
    hasSession: !!session,
    userId: user?.id,
    sessionUserId: session?.user?.id,
    userEmail: user?.email || session?.user?.email
  });

  // Priority 1: Supabase session user ID (most reliable)
  if (session?.user?.id) {
    console.log('✅ Found user ID from Supabase session:', session.user.id);
    return session.user.id;
  }
  
  // Priority 2: Direct user object ID
  if (user?.id) {
    console.log('✅ Found user ID from auth user context:', user.id);
    return user.id;
  }

  // Priority 3: Try current Supabase session from client
  try {
    const supabaseClient = (window as any).supabase;
    if (supabaseClient) {
      const currentSession = supabaseClient.auth.getSession();
      if (currentSession?.data?.session?.user?.id) {
        console.log('✅ Found user ID from current Supabase session:', currentSession.data.session.user.id);
        return currentSession.data.session.user.id;
      }
    }
  } catch (e) {
    console.warn('Could not access Supabase client from window');
  }

  // Priority 4: Try Supabase auth from localStorage (recent format)
  const keys = Object.keys(localStorage);
  for (const key of keys) {
    if (key.startsWith('sb-') && key.includes('auth-token')) {
      try {
        const authStr = localStorage.getItem(key);
        if (authStr && authStr !== 'undefined' && authStr !== 'null') {
          const authData = JSON.parse(authStr);
          if (authData?.user?.id) {
            console.log('✅ Found user ID from Supabase localStorage:', key, authData.user.id);
            return authData.user.id;
          }
        }
      } catch (e) {
        continue;
      }
    }
  }
  
  // Priority 5: Legacy auth patterns (fallback)
  const userId = localStorage.getItem('userId') || localStorage.getItem('user_id');
  if (userId && userId !== 'undefined' && userId !== 'null') {
    console.log('⚠️ Found user ID from legacy localStorage:', userId);
    return userId;
  }
  
  // Priority 6: User object in localStorage (fallback)
  const userStr = localStorage.getItem('user');
  if (userStr && userStr !== 'undefined' && userStr !== 'null') {
    try {
      const storedUser = JSON.parse(userStr);
      if (storedUser && (storedUser.id || storedUser.user_id || storedUser.uid)) {
        const foundUserId = storedUser.id || storedUser.user_id || storedUser.uid;
        console.log('⚠️ Found user ID from stored user object:', foundUserId);
        return foundUserId;
      }
    } catch (e) {
      console.warn('Failed to parse user from localStorage');
    }
  }
  
  console.error('❌ No user ID found - user must be authenticated to use Document Summarizer');
  return null;
};

const DocumentSummarizerComponent: React.FC<DocumentSummarizerComponentProps> = ({ className = '' }) => {
  const { t } = useLanguage();
  const { user, session, loading: authLoading } = useAuth();
  
  // API and user states
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSavingToHistory, setIsSavingToHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
  const [apiDebugLog, setApiDebugLog] = useState<string[]>([]);
  const [showDebugConsole, setShowDebugConsole] = useState(false);
  
  // Response checking state
  const { checkAndUseResponse } = useResponseCheck();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');
  
  const [file, setFile] = useState<File | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isLoadingMindmap, setIsLoadingMindmap] = useState(false);
  const [summary, setSummary] = useState('');
  const [mindmapData, setMindmapData] = useState<any>(null);
  const [mindmapError, setMindmapError] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [showHistory, setShowHistory] = useState(false);
  const [summaryHistory, setSummaryHistory] = useState<SummaryHistoryItem[]>([]);
  const [showMindmap, setShowMindmap] = useState(false);
  const [fullScreenView, setFullScreenView] = useState<'summary' | 'mindmap' | null>(null);
  const [isGeneratingMindmap, setIsGeneratingMindmap] = useState(false);
  const [summaryComplete, setSummaryComplete] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  
  // New states for page-by-page processing
  const [documentPages, setDocumentPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSummaries, setPageSummaries] = useState<PageSummary[]>([]);
  const [showGetSummaryButton, setShowGetSummaryButton] = useState(false);
  const [overallProcessingComplete, setOverallProcessingComplete] = useState(false);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  
  // Auto-scroll functionality
  const [autoScroll, setAutoScroll] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mindmapRef = useRef<HTMLDivElement>(null);
  const mindmapChart = useRef<echarts.ECharts | null>(null);
  const summaryContainerRef = useRef<HTMLDivElement>(null); // Add ref for auto-scroll

  // Check authentication status and provide user feedback
  const isAuthenticated = !!(user?.id || session?.user?.id);
  const currentUserId = getUserId(user, session);

  // Load history from API with authentication
  useEffect(() => {
    const loadHistoryFromAPI = async () => {
      // Only load history if user is authenticated
      if (!currentUserId) {
        console.log('🚫 No authenticated user - clearing history');
        setSummaryHistory([]);
        setIsLoadingHistory(false);
        return;
      }

      setIsLoadingHistory(true);
      setHistoryError(null);
      
      try {
        console.log('📚 Loading document summary history from API...');
        addDebugLog('📚 Loading history from API...');
        
        if (!currentUserId) {
          throw new Error('No authenticated user ID found');
        }
        
        const response = await documentSummarizerService.getDocumentSummaryHistory(currentUserId);
        
        if (response.success && response.documentHistory) {
          const frontendHistory = response.documentHistory.map(item => 
            documentSummarizerService.convertToFrontendFormat(item)
          );
          setSummaryHistory(frontendHistory);
          console.log('✅ Loaded document summary history:', frontendHistory.length, 'items');
          addDebugLog(`✅ Loaded ${frontendHistory.length} items from API`);
        } else {
          throw new Error('Invalid API response format');
        }
      } catch (error) {
        console.error('❌ Error loading history from API:', error);
        setHistoryError('Failed to load history from server');
        addDebugLog(`❌ History load failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        // Do not fallback to localStorage for security reasons
        setSummaryHistory([]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistoryFromAPI();
  }, [currentUserId, user?.id, session?.user?.id]);

  // Remove the old localStorage auto-save effect since we'll save manually to API
  // The old effect was: useEffect(() => { localStorage.setItem('summaryHistory', JSON.stringify(summaryHistory)); }, [summaryHistory]);

  // Auto-scroll to bottom of summary container
  const scrollToBottom = () => {
    if (autoScroll && summaryContainerRef.current) {
      summaryContainerRef.current.scrollTop = summaryContainerRef.current.scrollHeight;
    }
  };

  // Auto-scroll effect for streaming content - Fixed to work properly
  useEffect(() => {
    if (autoScroll && (streamingText || summary)) {
      const timeoutId = setTimeout(() => {
        scrollToBottom();
      }, 100); // Small delay to ensure DOM is updated
      
      return () => clearTimeout(timeoutId);
    }
  }, [streamingText, summary, autoScroll]);

  // Initialize mindmap chart with improved styling
  useEffect(() => {
    if (mindmapRef.current && mindmapData && (showMindmap || fullScreenView === 'mindmap')) {
      // Clean up any existing chart instance first
      if (mindmapChart.current) {
        try {
          mindmapChart.current.dispose();
          mindmapChart.current = null;
        } catch (error) {
          console.warn('Error disposing previous chart:', error);
          mindmapChart.current = null;
        }
      }
      
      // Add a small delay to ensure DOM is ready
      const timeoutId = setTimeout(() => {
        if (mindmapRef.current && (showMindmap || fullScreenView === 'mindmap')) {
          try {
            // Define vibrant colors for the mindmap branches
            const chartColors = ['#5470C6', '#91CC75', '#EE6666', '#FAC858', '#73C0DE', '#3BA272', '#FC8452', '#9A60B4', '#EA7CCC'];
            
            // Function to assign colors to tree nodes recursively
            const assignColors = (node: any, index = 0): any => {
              const coloredNode = {
                ...node,
                lineStyle: { 
                  color: chartColors[index % chartColors.length],
                  width: 3,
                  curveness: 0.5
                },
                itemStyle: {
                  color: chartColors[index % chartColors.length],
                  borderWidth: 2,
                  shadowBlur: 5,
                  shadowColor: 'rgba(0, 0, 0, 0.3)'
                }
              };
              
              if (node.children) {
                coloredNode.children = node.children.map((child: any, idx: number) => 
                  assignColors(child, idx)
                );
              }
              
              return coloredNode;
            };

            // Apply colors to the mindmap data
            const coloredGraphData = assignColors(mindmapData);
            
            // ECharts configuration
            const option: any = {
              backgroundColor: 'transparent',
              tooltip: { 
                trigger: 'item', 
                triggerOn: 'mousemove',
                backgroundColor: 'rgba(30, 41, 59, 0.95)',
                borderColor: 'rgba(6, 182, 212, 0.8)',
                borderWidth: 2,
                borderRadius: 8,
                textStyle: {
                  color: '#f1f5f9',
                  fontSize: 14,
                  fontWeight: 'bold',
                  fontFamily: 'Inter, system-ui, sans-serif'
                }
              },
              series: [{
                type: 'tree',
                data: [coloredGraphData],
                top: '5%',
                left: '10%',
                bottom: '5%',
                right: '25%',
                symbolSize: 8,
                orient: 'LR',
                roam: true,
                zoom: 1,
                scaleLimit: {
                  min: 0.3,
                  max: 4
                },
                initialTreeDepth: 3,
                label: {
                  position: 'left',
                  verticalAlign: 'middle',
                  align: 'right',
                  fontSize: 14,
                  color: '#1f2937',
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: 6,
                  padding: [6, 10],
                  shadowBlur: 6,
                  shadowColor: 'rgba(0, 0, 0, 0.15)'
                },
                leaves: {
                  label: {
                    position: 'right',
                    verticalAlign: 'middle',
                    align: 'left',
                    color: '#1f2937',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: 6,
                    padding: [6, 10],
                    distance: 15
                  }
                },
                emphasis: { 
                  focus: 'descendant',
                  itemStyle: {
                    shadowBlur: 10,
                    shadowColor: 'rgba(0, 0, 0, 0.3)'
                  }
                },
                expandAndCollapse: true,
                animationDuration: 550,
                animationEasing: 'cubicOut',
                lineStyle: {
                  width: 3,
                  curveness: 0.5
                }
              }]
            };
            
            // Initialize the chart
            mindmapRef.current.style.touchAction = 'none';
            mindmapChart.current = echarts.init(mindmapRef.current);
            mindmapChart.current.setOption(option);
            
            // Handle resize
            const handleResize = () => {
              if (mindmapChart.current && !mindmapChart.current.isDisposed()) {
                mindmapChart.current.resize();
              }
            };
            
            window.addEventListener('resize', handleResize);
            
            // Store cleanup function
            return () => {
              window.removeEventListener('resize', handleResize);
              if (mindmapChart.current && !mindmapChart.current.isDisposed()) {
                try {
                  mindmapChart.current.dispose();
                  mindmapChart.current = null;
                } catch (error) {
                  console.warn('Error disposing chart on cleanup:', error);
                  mindmapChart.current = null;
                }
              }
            };
          } catch (error) {
            console.error('Error initializing mindmap chart:', error);
          }
        }
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
        if (mindmapChart.current && !mindmapChart.current.isDisposed()) {
          try {
            mindmapChart.current.dispose();
            mindmapChart.current = null;
          } catch (error) {
            console.warn('Error disposing chart on unmount:', error);
            mindmapChart.current = null;
          }
        }
      };
    } else if (!showMindmap && fullScreenView !== 'mindmap' && mindmapChart.current) {
      // Clean up chart when hiding mindmap
      try {
        if (!mindmapChart.current.isDisposed()) {
          mindmapChart.current.dispose();
        }
        mindmapChart.current = null;
      } catch (error) {
        console.warn('Error disposing chart when hiding:', error);
        mindmapChart.current = null;
      }
    }
  }, [mindmapData, showMindmap, fullScreenView]);

  // Handle mindmap reinitialization when switching to fullscreen
  useEffect(() => {
    if (fullScreenView === 'mindmap' && mindmapData && mindmapChart.current) {
      // Small delay to ensure DOM is ready, then resize the chart
      const timeoutId = setTimeout(() => {
        if (mindmapChart.current && !mindmapChart.current.isDisposed()) {
          try {
            mindmapChart.current.resize();
          } catch (error) {
            console.warn('Error resizing chart for fullscreen:', error);
          }
        }
      }, 200);
      
      return () => clearTimeout(timeoutId);
    }
  }, [fullScreenView]);

  // Auto-trigger mindmap generation when summary is complete
  useEffect(() => {
    if (summaryComplete && summary && !mindmapData && !isGeneratingMindmap) {
      generateMindmapFromSummary();
    }
  }, [summaryComplete, summary, mindmapData, isGeneratingMindmap]);

  // Markdown components with colorful styling
  const markdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={synthwave84}
          language={match[1]}
          PreTag="div"
          className="rounded-lg border border-cyan-500/30 shadow-lg"
          customStyle={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(51, 65, 85, 0.9))',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: '8px',
            padding: '16px'
          }}
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={`${className} bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 px-3 py-1 rounded-md text-sm font-mono border border-cyan-500/30`} {...props}>
          {children}
        </code>
      );
    },
    h1: ({ children }: any) => <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mt-8 mb-4 border-b-2 border-cyan-500/30 pb-2">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mt-6 mb-3 border-b border-blue-500/30 pb-1">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-xl font-bold text-teal-300 mt-4 mb-2 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 px-4 py-3 rounded-lg border border-teal-500/30 shadow-lg">{children}</h3>,
    h4: ({ children }: any) => <h4 className="text-lg font-bold text-emerald-300 mt-4 mb-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-3 py-2 rounded-lg border border-emerald-500/30">{children}</h4>,
    h5: ({ children }: any) => <h5 className="text-base font-bold text-cyan-300 mt-3 mb-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 px-3 py-2 rounded-lg border border-cyan-500/30">{children}</h5>,
    h6: ({ children }: any) => <h6 className="text-sm font-bold text-blue-300 mt-3 mb-2 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 px-3 py-2 rounded-lg border border-blue-500/30">{children}</h6>,
    p: ({ children }: any) => <p className="text-slate-200 mb-4 leading-relaxed">{children}</p>,
    ul: ({ children }: any) => <ul className="list-disc list-inside mb-4 text-slate-200 space-y-2">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal list-inside mb-4 text-slate-200 space-y-2">{children}</ol>,
    li: ({ children }: any) => <li className="mb-1 pl-2 text-slate-200">{children}</li>,
    strong: ({ children }: any) => <strong className="font-bold text-cyan-300 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 px-2 py-1 rounded-md border border-cyan-500/30">{children}</strong>,
    em: ({ children }: any) => <em className="italic text-purple-300 bg-gradient-to-r from-purple-500/10 to-pink-500/10 px-1 rounded">{children}</em>,
    blockquote: ({ children }: any) => <blockquote className="border-l-4 border-cyan-500 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 pl-4 py-2 my-4 text-slate-200 italic rounded-r-lg">{children}</blockquote>,
    table: ({ children }: any) => <div className="overflow-x-auto my-4"><table className="min-w-full bg-gradient-to-r from-slate-600/30 to-slate-700/30 rounded-lg border border-cyan-500/30">{children}</table></div>,
    th: ({ children }: any) => <th className="px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 font-bold border-b border-cyan-500/30">{children}</th>,
    td: ({ children }: any) => <td className="px-4 py-2 text-slate-200 border-b border-slate-600/30">{children}</td>,
    // Add additional text elements to ensure no black text
    span: ({ children }: any) => <span className="text-slate-200">{children}</span>,
    div: ({ children }: any) => <div className="text-slate-200">{children}</div>,
    // Override any default text styling
    text: ({ children }: any) => <span className="text-slate-200">{children}</span>,
  };

  // Preprocess LaTeX for react-markdown
  const preprocessLaTeX = (content: string) => {
    return content
      .replace(/\\\[(.*?)\\\]/g, (_, eq) => `$$${eq}$$`)
      .replace(/\\\((.*?)\\\)/g, (_, eq) => `$${eq}$`);
  };

  // Extract text from PDF
  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
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
  };

  // Simple extractive text summarization function
  const extractiveSummarize = (text: string, sentences: number = 5): string => {
    if (!text.trim()) return '';
    
    // Split into sentences
    const sentenceArray = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    if (sentenceArray.length <= sentences) {
      return text;
    }
    
    // Score sentences based on word frequency and position
    const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    const wordFreq: { [key: string]: number } = {};
    
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });
    
    // Score each sentence
    const sentenceScores = sentenceArray.map((sentence, index) => {
      const sentenceWords = sentence.toLowerCase().split(/\W+/).filter(w => w.length > 3);
      const score = sentenceWords.reduce((sum, word) => sum + (wordFreq[word] || 0), 0) / sentenceWords.length;
      const positionWeight = index < sentenceArray.length * 0.3 ? 1.2 : 1; // Boost early sentences
      return { sentence: sentence.trim(), score: score * positionWeight, index };
    });
    
    // Get top sentences
    const topSentences = sentenceScores
      .sort((a, b) => b.score - a.score)
      .slice(0, sentences)
      .sort((a, b) => a.index - b.index);
    
    return topSentences.map(s => s.sentence).join('. ') + '.';
  };

  // Generate mindmap structure from text
  const generateMindmapStructure = (text: string): any => {
    if (!text.trim()) return null;
    
    // Extract key topics from headers and keywords
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines.filter(line => line.startsWith('#') || line.includes(':') || line.length < 80);
    
    // If no clear structure, create topic-based mindmap
    if (headers.length < 2) {
      const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 4);
      const wordFreq: { [key: string]: number } = {};
      
      words.forEach(word => {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      });
      
      const topWords = Object.entries(wordFreq)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 8)
        .map(([word]) => ({ name: word.charAt(0).toUpperCase() + word.slice(1) }));
      
      return {
        name: "Document Summary",
        children: [
          {
            name: "Key Topics",
            children: topWords.slice(0, 4)
          },
          {
            name: "Additional Concepts", 
            children: topWords.slice(4, 8)
          }
        ]
      };
    }
    
    // Create structured mindmap from headers
    const topics = headers.slice(0, 6).map(header => {
      const cleanHeader = header.replace(/^#+\s*/, '').replace(/[:\.]+$/, '').trim();
      return { name: cleanHeader || "Topic" };
    });
    
    const midpoint = Math.ceil(topics.length / 2);
    
    return {
      name: "Document Overview",
      children: [
        {
          name: "Main Topics",
          children: topics.slice(0, midpoint)
        },
        {
          name: "Additional Points",
          children: topics.slice(midpoint)
        }
      ]
    };
  };

  // Improved summarize text with live streaming simulation
  const summarizeText = async (text: string): Promise<string> => {
    if (!text.trim()) {
      throw new Error('Please enter some text to summarize');
    }

    setIsLoadingSummary(true);
    setErrorMessage('');
    setCurrentDocumentId(null); // Reset for new document
    setStreamingText('');

    try {
      // Generate summary using extractive method
      const generatedSummary = extractiveSummarize(text, 5);
      
      // Enhance with basic formatting
      const formattedSummary = `# Document Summary\n\n## Key Points:\n\n${generatedSummary}\n\n## Overview:\nThis summary was generated from your input text, highlighting the most important sentences and concepts.`;
      
      // Simulate streaming for better UX
      let currentText = '';
      const words = formattedSummary.split(' ');
      
      for (let i = 0; i < words.length; i++) {
        currentText += words[i] + ' ';
        setStreamingText(currentText);
        await new Promise(resolve => setTimeout(resolve, 50)); // Simulate processing delay
      }
      
      setSummary(formattedSummary);
      setSummaryComplete(true);
      
      // Save summary immediately after generation and wait for completion
      try {
        await saveSummaryRealTime(
          'Text Summary - ' + new Date().toLocaleDateString(),
          formattedSummary,
          'text',
          text
        );
      } catch (saveError) {
        console.warn('API save failed but continuing workflow:', saveError);
        addDebugLog('⚠️ API save failed, using localStorage fallback');
        // Continue with localStorage save
        const historyItem: SummaryHistoryItem = {
          id: Date.now().toString(),
          title: 'Text Summary - ' + new Date().toLocaleDateString(),
          summary: formattedSummary,
          mindmapData: null,
          timestamp: new Date(),
          sourceType: 'text',
        };
        setSummaryHistory(prev => [historyItem, ...prev]);
        localStorage.setItem('documentSummarizerHistory', JSON.stringify([historyItem, ...summaryHistory]));
      }
      
      // Auto-generate mindmap after summary is saved
      setTimeout(() => {
        generateMindmapFromSummary();
      }, 200); // Small delay to ensure save is complete
      
      console.log('✅ Text summarization completed');
      return formattedSummary;
      
    } catch (error) {
      console.error('Error summarizing text:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to summarize text';
      setErrorMessage(errorMsg);
      throw error;
    } finally {
      setIsLoadingSummary(false);
    }
  };

  // Generate mindmap data from summary
  const generateMindmapFromSummary = async () => {
    if (!summary.trim()) {
      setErrorMessage('Please generate a summary first before creating a mind map');
      return;
    }

    setIsLoadingMindmap(true);
    setMindmapError('');

    try {
      // Generate mindmap structure
      const mindmapStructure = generateMindmapStructure(summary);
      
      if (mindmapStructure) {
        setMindmapData(mindmapStructure);
        
        // Save mindmap immediately after generation (non-blocking)
        saveMindmapRealTime(mindmapStructure).catch(error => {
          console.warn('Mindmap API save failed but continuing workflow:', error);
        });
        
        console.log('✅ Mind map generated successfully');
      } else {
        throw new Error('Unable to generate mindmap from summary');
      }
      
    } catch (error) {
      console.error('Error generating mindmap:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to generate mind map';
      setMindmapError(errorMsg);
      setErrorMessage(errorMsg);
    } finally {
      setIsLoadingMindmap(false);
    }
  };

  // Add to history with enhanced data structure - now saves to API
  const addToHistory = async (
    title: string, 
    summary: string, 
    mindmapData: any, 
    sourceType: 'file' | 'text',
    fileName?: string, 
    documentPages?: string[], 
    pageSummaries?: PageSummary[], 
    originalFile?: File,
    textInput?: string
  ) => {
    // Require authentication for saving history
    if (!currentUserId) {
      console.warn('⚠️ Cannot save document summary - user not authenticated');
      return;
    }

    const newEntry: FrontendSummaryItem = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      summary,
      mindmapData,
      timestamp: new Date(),
      sourceType,
      fileName,
      documentPages,
      pageSummaries,
      file: originalFile,
    };

    // Update local state immediately for responsive UI
    setSummaryHistory(prev => [newEntry, ...prev]);

    // Try to save to API (non-blocking)
    try {
      const savedId = await saveToAPIRealTime(
        title, 
        summary, 
        mindmapData, 
        sourceType,
        textInput,
        fileName, 
        documentPages, 
        pageSummaries, 
        originalFile
      );
      
      if (savedId) {
        // Update the entry with the actual API ID
        newEntry.id = savedId;
        setSummaryHistory(prev => 
          prev.map(item => item.id === newEntry.id ? { ...item, id: savedId } : item)
        );
      }
    } catch (error) {
      console.error('❌ API save failed - authentication required:', error);
      addDebugLog('⚠️ API save failed, using localStorage fallback');
      // Remove from local state if API save fails (require authentication)
      setSummaryHistory(prev => prev.filter(item => item.id !== newEntry.id));
    }
  };

  // Add debug log function
  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setApiDebugLog(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 9)]); // Keep last 10 messages
  };

  // Save summary immediately when generated (before mindmap) - non-blocking
  const saveSummaryRealTime = async (title: string, summary: string, sourceType: 'file' | 'text', textInput?: string, fileName?: string, documentPages?: string[], pageSummaries?: PageSummary[], originalFile?: File) => {
    console.log('💾 Saving summary in real-time...');
    addDebugLog('💾 Starting summary save...');
    
    try {
      const savedId = await saveToAPIRealTime(
        title, 
        summary, 
        {}, // Empty mindmap for now
        sourceType,
        textInput,
        fileName, 
        documentPages, 
        pageSummaries, 
        originalFile,
        false // New document
      );
      
      if (savedId) {
        setCurrentDocumentId(savedId);
        console.log('✅ Summary saved with ID:', savedId);
        addDebugLog(`✅ Summary saved (ID: ${savedId.substring(0, 8)}...)`);
      }
    } catch (error) {
      console.warn('Summary save failed:', error);
      addDebugLog(`❌ Summary save failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Update with mindmap when generated - non-blocking
  const saveMindmapRealTime = async (mindmapData: any) => {
    console.log('🗺️ Saving mindmap in real-time...');
    addDebugLog('🗺️ Starting mindmap save...');
    
    // Don't block the UI - run in background
    setTimeout(async () => {
      try {
        if (currentDocumentId) {
          await saveToAPIRealTime(
            '', // Title not needed for update
            '', // Summary not needed for update
            mindmapData,
            'text', // Dummy value for update
            undefined,
            undefined,
            undefined,
            undefined,
            undefined,
            true // This is an update
          );
          console.log('✅ Mindmap saved successfully');
          addDebugLog('✅ Mindmap saved successfully');
          
          // Update the mindmap in local history as well
          setSummaryHistory(prev => prev.map(item => {
            if (item.id === currentDocumentId) {
              return { ...item, mindmapData };
            }
            return item;
          }));
        } else {
          console.log('No current document ID for mindmap update');
          addDebugLog('⚠️ No document ID available for mindmap save');
        }
      } catch (error) {
        console.warn('Mindmap save failed:', error);
        addDebugLog(`❌ Mindmap save failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }, 100); // Small delay to ensure document ID is set
  };

  // Delete from history with API integration
  const deleteFromHistory = async (itemId: string) => {
    // Require authentication for deleting
    if (!currentUserId) {
      console.warn('⚠️ Cannot delete document summary - user not authenticated');
      return;
    }

    // Remove from local state immediately for responsive UI
    setSummaryHistory(prev => prev.filter(item => item.id !== itemId));

    // Try to delete from API
    try {
      await documentSummarizerService.deleteDocumentSummary(itemId, currentUserId);
      console.log('✅ Successfully deleted from API');
    } catch (error) {
      console.error('❌ Error deleting from API:', error);
      // Add the item back to local state if API delete failed
      // (This requires re-fetching history or storing the item temporarily)
      // For now, we'll just log the error
    }
  };

  // Load from history with enhanced restoration
  const loadFromHistory = (item: SummaryHistoryItem) => {
    setSummary(item.summary);
    setMindmapData(item.mindmapData);
    setShowHistory(false);
    setShowMindmap(false);
    setSummaryComplete(true);
    
    // Restore document pages and page summaries if available
    if (item.documentPages && item.documentPages.length > 0) {
      setDocumentPages(item.documentPages);
      setCurrentPage(0);
      setShowGetSummaryButton(true);
      
      if (item.pageSummaries) {
        setPageSummaries(item.pageSummaries);
      }
    } else {
      setDocumentPages([]);
      setPageSummaries([]);
      setShowGetSummaryButton(false);
    }
    
    // Clear file state since we're loading from history
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Convert PDF to images for page-by-page processing
  const convertPdfToImages = async (file: File): Promise<string[]> => {
    let retryCount = 0;
    const maxRetries = 2;
    
    while (retryCount <= maxRetries) {
      try {
        setProcessingStatus(retryCount > 0 ? t('aiStudy.retryingPdfConversion').replace('{attempt}', (retryCount + 1).toString()) : t('aiStudy.loadingPdf'));
        
        const arrayBuffer = await file.arrayBuffer();
        
        // Enhanced PDF.js configuration for better compatibility
        const loadingTask = pdfjsLib.getDocument({
          data: arrayBuffer,
          useWorkerFetch: false,
          isEvalSupported: false,
          useSystemFonts: true,
          // Add compatibility options
          verbosity: 0, // Reduce console output
          cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
          // Disable problematic features for compatibility
          disableFontFace: false,
          disableRange: false,
          disableStream: false,
          disableAutoFetch: false
        });
        
        const pdf = await loadingTask.promise as PDFDocumentProxy;
        const images: string[] = [];
        
        setProcessingStatus(t('aiStudy.convertingPagesToImages').replace('{total}', pdf.numPages.toString()));
        
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          setProcessingStatus(t('aiStudy.convertingPage').replace('{current}', pageNum.toString()).replace('{total}', pdf.numPages.toString()));
          
          try {
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
              // Add rendering options for better compatibility
              intent: 'display',
              enableWebGL: false,
              renderInteractiveForms: false,
              transform: null,
              background: 'white'
            };
            
            await page.render(renderContext).promise;
            
            const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
            images.push(imageDataUrl);
            
            // Clean up page resources - removed page.cleanup() as it's not available in current version
          } catch (pageError) {
            console.error(`Error processing page ${pageNum}:`, pageError);
            // Continue with other pages even if one fails
            setProcessingStatus(t('aiStudy.warningCouldNotProcessPage').replace('{page}', pageNum.toString()));
          }
        }
        
        if (images.length === 0) {
          throw new Error('No pages could be processed from the PDF');
        }
        
        setProcessingStatus(t('aiStudy.pdfConversionCompleted').replace('{count}', images.length.toString()));
        return images;
        
      } catch (error) {
        console.error(`PDF conversion error (attempt ${retryCount + 1}):`, error);
        
        // Check if it's a worker version mismatch error
        if (error instanceof Error && (error.message.includes('API version') || error.message.includes('Worker version'))) {
          if (retryCount < maxRetries) {
            // Try to fix worker configuration and retry
            try {
              pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
              retryCount++;
              continue;
            } catch (workerError) {
              // Disable worker and retry
              pdfjsLib.GlobalWorkerOptions.workerSrc = '';
              retryCount++;
              continue;
            }
          }
        }
        
        // If we've exhausted retries or it's a different error
        let errorMessage = 'Error converting PDF';
        if (error instanceof Error) {
          if (error.message.includes('API version') || error.message.includes('Worker version')) {
            errorMessage = 'PDF.js version compatibility issue. Please refresh the page and try again.';
          } else if (error.message.includes('Invalid PDF')) {
            errorMessage = 'Invalid or corrupted PDF file. Please try a different file.';
          } else if (error.message.includes('Password')) {
            errorMessage = 'Password-protected PDFs are not supported. Please use an unprotected PDF.';
          } else {
            errorMessage = `PDF processing error: ${error.message}`;
          }
        }
        
        setProcessingStatus(errorMessage);
        throw new Error(errorMessage);
      }
    }
    
    // This should never be reached, but just in case
    throw new Error('PDF conversion failed after all retry attempts');
  };

  // Process file for page-by-page summarization
  const processFile = async (file: File) => {
    setLoading(true);
    setProcessingStatus(t('aiStudy.loadingFileForPreview'));
    setSummary('');
    setPageSummaries([]);
    setOverallProcessingComplete(false);
    
    try {
      let imageUrls: string[] = [];
      
      if (file.type === 'application/pdf') {
        imageUrls = await convertPdfToImages(file);
      } else if (file.type.startsWith('image/')) {
        setProcessingStatus(t('aiStudy.loadingImage'));
        
        const imageDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        
        imageUrls = [imageDataUrl];
      } else if (file.type.startsWith('text/') || file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // For text files, read content directly
        const text = await file.text();
        setTextInput(text);
        setProcessingStatus(t('aiStudy.textFileLoadedSuccessfully'));
        setShowGetSummaryButton(false); // For text files, use direct summarization
        return;
      } else {
        throw new Error('Unsupported file type. Please upload a PDF, image, or text file.');
      }
      
      setDocumentPages(imageUrls);
      setCurrentPage(0);
      setShowGetSummaryButton(true);
      setProcessingStatus(t('aiStudy.fileLoadedSuccessfully'));
      
    } catch (error) {
      setProcessingStatus(t('aiStudy.errorLoadingFile'));
      console.error('File processing error:', error);
    } finally {
      setLoading(false);
      setTimeout(() => setProcessingStatus(''), 3000);
    }
  };

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      await processFile(selectedFile);
    }
  };

  // Handle file removal
  const handleRemoveFile = () => {
    setFile(null);
    setDocumentPages([]);
    setCurrentPage(0);
    setSummary('');
    setPageSummaries([]);
    setShowGetSummaryButton(false);
    setOverallProcessingComplete(false);
    setMindmapData(null);
    setShowMindmap(false);
    setSummaryComplete(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle text-only summarization
  const handleSummarize = async () => {
    if (!textInput.trim() || loading) return;
    
    setLoading(true);
    setSummaryComplete(false);
    setProcessingStatus(t('aiStudy.analyzingText'));
    setSummary('');
    setStreamingText('');
    setMindmapData(null);
    setShowMindmap(false);
    
    try {
      await summarizeText(textInput);
    } catch (error) {
      console.error('Error generating summary:', error);
      setSummary(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setProcessingStatus(t('aiStudy.errorGeneratingSummary'));
      setSummaryComplete(false);
    } finally {
      setLoading(false);
    }
  };

  // Summarize individual page content
  const summarizePageContent = async (pageImage: string, pageNumber: number): Promise<string> => {
    const requestPayload = {
      model: "doubao-seed-1-6-vision-250815",
      messages: [
        {
          role: "system",
          content: [
            {
              type: "text", 
              text: "You are an expert document analysis assistant. Analyze the provided page image and create a comprehensive summary of its content. Focus on extracting key information, main concepts, important details, and any structured data. Use clear markdown formatting."
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: pageImage
              }
            },
            {
              type: "text",
              text: `Please analyze this document page (Page ${pageNumber}) and provide a comprehensive summary. Include:

## 📄 Page ${pageNumber} Summary

### 🎯 Main Content
- Key topics and concepts
- Important information and data
- Main arguments or points

### 📊 Details
- Specific facts, figures, or statistics
- Important names, dates, or references
- Any structured information (tables, lists, etc.)

### 💡 Key Insights
- Important conclusions or takeaways
- Critical information for understanding

Please provide a well-structured summary using proper markdown formatting.`
            }
          ]
        }
      ],
      stream: true
    };

    const response = await fetch(process.env.REACT_APP_DASHSCOPE_ENDPOINT || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.REACT_APP_DASHSCOPE_API_KEY || ''}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body reader available');
    }

    let fullContent = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content_chunk = parsed.choices?.[0]?.delta?.content;
              
              if (content_chunk) {
                fullContent += content_chunk;
                
                // Update the specific page summary in real-time
                setPageSummaries(prev => prev.map(ps => 
                  ps.pageNumber === pageNumber 
                    ? { ...ps, summary: fullContent }
                    : ps
                ));
              }
            } catch (parseError) {
              continue;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return fullContent.trim();
  };

  // Handle comprehensive document summarization with page-by-page processing
  const handleGetSummary = async () => {
    if ((!documentPages.length && !textInput.trim()) || loading) return;
    
    // Check responses before generating summary
    const responseResult = await checkAndUseResponse({
      responseType: 'document_summary',
      responsesUsed: 1
    });
    if (!responseResult.canProceed) {
      setShowUpgradeModal(true);
      setUpgradeMessage(responseResult.message || 'Please upgrade to continue');
      return;
    }
    
    setLoading(true);
    setSummaryComplete(false);
    setProcessingStatus(t('aiStudy.startingDocumentAnalysis'));
    setSummary('');
    setStreamingText('');
    setMindmapData(null);
    setShowMindmap(false);
    
    try {
      // If we have document pages, process them page by page
      if (documentPages.length > 0) {
        // Initialize page summaries
        const initialPageSummaries: PageSummary[] = documentPages.map((_, index) => ({
          pageNumber: index + 1,
          summary: '',
          isLoading: true,
          isComplete: false
        }));
        setPageSummaries(initialPageSummaries);
        
        setProcessingStatus(t('aiStudy.processingPagesInParallel').replace('{count}', documentPages.length.toString()));
        
        // Process all pages in parallel
        const pagePromises = documentPages.map(async (pageImage, index) => {
          const pageNumber = index + 1;
          
          try {
            setProcessingStatus(t('aiStudy.analyzingPage').replace('{page}', pageNumber.toString()));
            const pageSummary = await summarizePageContent(pageImage, pageNumber);
            
            // Update page summary as complete
            setPageSummaries(prev => prev.map(ps => 
              ps.pageNumber === pageNumber 
                ? { ...ps, summary: pageSummary, isLoading: false, isComplete: true }
                : ps
            ));
            
            return { pageNumber, summary: pageSummary };
          } catch (error) {
            console.error(`Error processing page ${pageNumber}:`, error);
            
            // Mark page as error
            setPageSummaries(prev => prev.map(ps => 
              ps.pageNumber === pageNumber 
                ? { ...ps, isLoading: false, isComplete: false, error: error instanceof Error ? error.message : 'Unknown error' }
                : ps
            ));
            
            return { pageNumber, summary: `Error processing page ${pageNumber}: ${error instanceof Error ? error.message : 'Unknown error'}` };
          }
        });
        
        // Wait for all pages to complete
        const pageResults = await Promise.all(pagePromises);
        
        setProcessingStatus(t('aiStudy.generatingComprehensiveSummary'));
        
        // Generate comprehensive summary from all page summaries
        const allPageSummaries = pageResults.map(result => result.summary).join('\n\n');
        const contextText = textInput.trim() ? `\n\nAdditional Context:\n${textInput}` : '';
        const fullText = allPageSummaries + contextText;
        
        await generateComprehensiveSummary(fullText, file?.name || 'Document');
        
      } else if (textInput.trim()) {
        // Process text-only input
        await summarizeText(textInput);
      }
      
    } catch (error) {
      console.error('Error in document processing:', error);
      setSummary(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setProcessingStatus(t('aiStudy.errorProcessingDocument'));
      setSummaryComplete(false);
    } finally {
      setLoading(false);
    }
  };

  // Generate comprehensive summary from all page summaries
  const generateComprehensiveSummary = async (allPageContent: string, documentTitle: string) => {
    if (!allPageContent.trim()) {
      setErrorMessage('No content available to summarize');
      return;
    }

    setIsLoadingSummary(true);
    setErrorMessage('');
    setCurrentDocumentId(null); // Reset for new document
    setStreamingText('');

    try {
      // Generate summary using extractive method
      const generatedSummary = extractiveSummarize(allPageContent, 8); // More sentences for files
      
      // Enhance with structured formatting for documents
      const formattedSummary = `# ${documentTitle || 'Document Summary'}\n\n## Executive Summary:\n\n${generatedSummary}\n\n## Document Analysis:\nThis summary was generated from ${pageSummaries.length} page(s) of content, extracting the most relevant and important information from your document.`;
      
      // Simulate streaming for better UX
      let currentText = '';
      const words = formattedSummary.split(' ');
      
      for (let i = 0; i < words.length; i++) {
        currentText += words[i] + ' ';
        setStreamingText(currentText);
        await new Promise(resolve => setTimeout(resolve, 30)); // Faster for longer content
      }
      
      setSummary(formattedSummary);
    setSummaryComplete(true);
      
      // Save summary immediately after generation and wait for completion
      try {
        await saveSummaryRealTime(
          documentTitle || 'Document Summary - ' + new Date().toLocaleDateString(),
          formattedSummary,
        'file',
          undefined, // No text input for file
          file?.name || 'uploaded_document',
        documentPages,
        pageSummaries,
        file || undefined
      );
      } catch (saveError) {
        console.warn('API save failed but continuing workflow:', saveError);
        addDebugLog('⚠️ API save failed, using localStorage fallback');
        // Continue with localStorage save
        const historyItem: SummaryHistoryItem = {
          id: Date.now().toString(),
          title: documentTitle || 'Document Summary - ' + new Date().toLocaleDateString(),
          summary: formattedSummary,
          mindmapData: null,
          timestamp: new Date(),
          sourceType: 'file',
          fileName: file?.name || 'uploaded_document',
          documentPages,
          pageSummaries,
        };
        setSummaryHistory(prev => [historyItem, ...prev]);
        localStorage.setItem('documentSummarizerHistory', JSON.stringify([historyItem, ...summaryHistory]));
      }
      
      // Automatically generate mind map after summary is saved
      setTimeout(() => {
        generateMindmapFromSummary();
      }, 200); // Small delay to ensure save is complete
      
      console.log('✅ Comprehensive summary generated successfully');
      
    } catch (error) {
      console.error('Error generating comprehensive summary:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to generate summary';
      setErrorMessage(errorMsg);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  // Download content in different formats
  const handleDownloadContent = (format: 'txt' | 'pdf' | 'doc') => {
    const content = summary || streamingText;
    if (!content) return;

    const fileName = file ? file.name.replace(/\.[^/.]+$/, '') : 'document-summary';
    
    switch (format) {
      case 'txt':
        downloadSummaryAsText(fileName);
        break;
        
      case 'pdf':
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
          putOnlyUsedFonts: true
        });
        const lines = content.split('\n');
        let yPosition = 20;
        const margin = 10;
        const pageHeight = pdf.internal.pageSize.height;
        const lineHeight = 7;
        const maxY = pageHeight - margin;
        
        // Set font size and type for better readability
        pdf.setFontSize(11);
        
        // Use a font that supports Unicode characters
        pdf.addFont('Helvetica', 'Helvetica', 'normal');
        pdf.setFont('Helvetica');
        
        lines.forEach(line => {
          // Check if we need a new page
          if (yPosition > maxY) {
            pdf.addPage();
            yPosition = 20;
          }
          
          // Handle long lines by wrapping text
          if (line.length > 80) {
            const splitLines = pdf.splitTextToSize(line, pdf.internal.pageSize.width - (margin * 2));
            splitLines.forEach((splitLine: string) => {
              // Use the text method with encoding option
              pdf.text(splitLine, margin, yPosition, { 
                charSpace: 0,
                lineHeightFactor: 1.15,
                maxWidth: pdf.internal.pageSize.width - (margin * 2)
              });
              yPosition += lineHeight;
              
              // Check if we need a new page after adding a wrapped line
              if (yPosition > maxY) {
                pdf.addPage();
                yPosition = 20;
              }
            });
          } else {
            // Use the text method with encoding option
            pdf.text(line, margin, yPosition, { 
              charSpace: 0,
              lineHeightFactor: 1.15,
              maxWidth: pdf.internal.pageSize.width - (margin * 2)
            });
            yPosition += lineHeight;
          }
        });
        
        pdf.save(`${fileName}-summary.pdf`);
        break;
        
      case 'doc':
        const doc = new Document({
          sections: [{
            properties: {},
            children: content.split('\n').map(line => 
              new Paragraph({
                children: [new TextRun(line)]
              })
            )
          }]
        });
        
        Packer.toBlob(doc).then(blob => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${fileName}-summary.docx`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        });
        break;
    }
    
    setShowDownloadOptions(false);
  };
  
  // Download summary as text file
  const downloadSummaryAsText = (fileName: string = 'document-summary') => {
    const content = summary || streamingText;
    if (!content) return;
    
    // Clean the filename to ensure it's valid
    const cleanFileName = fileName.replace(/[\/:*?"<>|]/g, '-');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
    const safeFileName = `${cleanFileName}-summary-${timestamp}.txt`;
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = safeFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Log the download for analytics
    console.log('✅ Summary downloaded as text file');
    addDebugLog(`📄 Summary downloaded as text: ${safeFileName}`);
  };
  
  // Download mindmap as image
  const downloadMindmapAsImage = () => {
    if (!mindmapData || !mindmapChart.current) return;
    
    try {
      // Use the chart instance directly from the ref
      const chart = mindmapChart.current;
      if (!chart) {
        console.error('Cannot find ECharts instance');
        return;
      }
      
      // Get the data URL of the chart with higher quality settings
      const dataURL = chart.getDataURL({
        type: 'png',
        pixelRatio: 3, // Increased from 2 to 3 for higher quality
        backgroundColor: '#1e293b',
        excludeComponents: ['toolbox'] // Exclude toolbox from the exported image
      });
      
      // Create a link to download the image
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
      link.download = `mindmap-${timestamp}.png`;
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setShowDownloadOptions(false);
      
      // Log the download for analytics
      console.log('✅ Mindmap downloaded as image');
      addDebugLog('🖼️ Mindmap downloaded as image');
    } catch (error) {
      console.error('Error downloading mindmap as image:', error);
      setErrorMessage('Failed to download mindmap as image');
    }
  };

  // Copy content to clipboard
  const handleCopyContent = () => {
    const content = summary || streamingText;
    navigator.clipboard.writeText(content).then(() => {
      setProcessingStatus(t('aiStudy.summaryCopiedToClipboard'));
      setTimeout(() => setProcessingStatus(''), 2000);
    });
  };

  // Share content
  const handleShareContent = () => {
    const content = summary || streamingText;
    if (navigator.share) {
      navigator.share({
        title: 'Document Summary',
        text: content,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(content);
      setProcessingStatus(t('aiStudy.summaryCopiedForSharing'));
      setTimeout(() => setProcessingStatus(''), 2000);
    }
  };

  // Clear all data
  const handleClear = () => {
    setFile(null);
    setTextInput('');
    setSummary('');
    setStreamingText('');
    setMindmapData(null);
    setShowMindmap(false);
    setSummaryComplete(false);
    setIsGeneratingMindmap(false);
    setDocumentPages([]);
    setCurrentPage(0);
    setPageSummaries([]);
    setShowGetSummaryButton(false);
    setOverallProcessingComplete(false);
    setShowDownloadOptions(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Real-time save function - saves immediately when content is generated
  const saveToAPIRealTime = async (
    title: string, 
    summary: string, 
    mindmapData: any, 
    sourceType: 'file' | 'text',
    textInput?: string,
    fileName?: string, 
    documentPages?: string[], 
    pageSummaries?: PageSummary[], 
    originalFile?: File,
    isUpdate: boolean = false
  ): Promise<string | null> => {
    if (!currentUserId) {
      console.log('📱 No user ID available for API save');
      return null;
    }

    try {
      setIsSavingToHistory(true);
      
      const metadata = {
        hasDocumentPages: !!documentPages?.length,
        pageCount: documentPages?.length || 0,
        completedPages: pageSummaries?.filter(ps => ps.isComplete)?.length || 0,
        savedAt: new Date().toISOString(),
        aiModel: 'client-side-processing',
        processingTime: 0,
      };

      if (isUpdate && currentDocumentId) {
        // Update existing document
        const updateData = {
          uid: currentUserId,
          title,
          summary,
          mindmapData,
          metadata,
        };
        
        const response = await documentSummarizerService.updateDocumentSummary(currentDocumentId, updateData);
        console.log('✅ Successfully updated document in API:', response.documentSummary.id);
        return response.documentSummary.id;
      } else {
        // Create new document - don't send documentPages to avoid payload size issues
        const saveData = {
          uid: currentUserId,
          title,
          summary,
          sourceType,
          textInput,
          fileName: sourceType === 'file' ? (fileName || originalFile?.name || 'uploaded_document') : undefined,
          fileType: originalFile?.type,
          fileSize: originalFile?.size,
          // Don't send documentPages (base64 images are too large)
          // documentPages,
          pageSummaries: pageSummaries?.map(ps => ({
            pageNumber: ps.pageNumber,
            summary: ps.summary,
            isLoading: ps.isLoading,
            isComplete: ps.isComplete,
          })),
          mindmapData,
          metadata,
        };
        
        const response = await documentSummarizerService.saveDocumentSummary(saveData);
        console.log('✅ Successfully saved document to API:', response.documentSummary.id);
        setCurrentDocumentId(response.documentSummary.id);
        return response.documentSummary.id;
      }
    } catch (error) {
      console.error('❌ Error saving to API:', error);
      return null;
    } finally {
      setIsSavingToHistory(false);
    }
  };

  // Early return if user is not authenticated (after all hooks)
  if (!authLoading && !isAuthenticated) {
    return (
    <div className={`bg-[#0f172a]/60 backdrop-blur-md border border-white/10 rounded-xl shadow-lg overflow-hidden p-4 sm:p-6 ${className || ''}`}>
      <motion.div 
          className="bg-[#0f172a]/60 backdrop-blur-md border border-indigo-500/20 rounded-xl p-8 text-center shadow-xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <IconComponent icon={AiOutlineRobot} className="h-16 w-16 mx-auto mb-4 text-indigo-400" />
          </motion.div>
          <h2 className="text-2xl font-bold text-indigo-400 mb-4">Authentication Required</h2>
          <p className="text-slate-300 mb-6 text-lg leading-relaxed">
            Please sign in to your account to use the Document Summarizer. This feature requires authentication to save your summaries and provide personalized assistance.
          </p>
          <div className="space-y-4">
            <motion.button
              onClick={() => window.location.href = '/login'}
              className="px-8 py-3 bg-gradient-to-r from-indigo-500 to-red-500 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 mx-auto block"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Sign In to Continue
            </motion.button>
            <p className="text-slate-400 text-sm">
              Don't have an account? <a href="/signup" className="text-indigo-400 hover:text-indigo-300 underline">Sign up here</a>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  // Loading state for authentication
  if (authLoading) {
    return (
      <div className={className}>
        <motion.div 
          className="bg-[#0f172a]/60 backdrop-blur-md border border-cyan-500/20 rounded-xl p-8 text-center shadow-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full mx-auto mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
          />
          <p className="text-slate-300 text-lg">Checking authentication...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`bg-[#0f172a]/60 backdrop-blur-md border border-white/10 rounded-xl shadow-lg overflow-hidden p-4 sm:p-6 ${className || ''}`}>
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
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
        {/* Input Section - Enhanced UI */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg">
              <IconComponent icon={AiOutlineBulb} className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-cyan-300 text-sm mt-1 font-medium">{t('aiStudy.documentSummarizerDescription')}</p>
            </div>
          </div>
          
          {/* Auto-scroll Toggle */}
          <div className="mb-4">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-2 bg-slate-600/20 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                <input
                  type="checkbox"
                  id="autoScrollSummary"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="w-4 h-4 text-cyan-600 bg-slate-600 border-slate-400 rounded focus:ring-cyan-500 focus:ring-2"
                />
                <label htmlFor="autoScrollSummary" className="text-slate-300 text-sm font-medium cursor-pointer flex items-center">
                  <IconComponent icon={AiOutlineLoading3Quarters} className="h-4 w-4 mr-1" />
                  {t('aiStudy.autoScroll')}
                </label>
              </div>
            </div>
          </div>
          
          {/* Enhanced File Upload */}
          <div className="mb-6">
            <div 
              className="border-2 border-dashed border-cyan-500/30 rounded-xl p-8 text-center hover:border-cyan-400/50 cursor-pointer transition-all duration-300 relative bg-black/20 backdrop-blur-sm hover:bg-black/30"
              onClick={() => !file && fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.txt,.doc,.docx,image/*"
              />
              {file ? (
                <div className="text-slate-300 relative">
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile();
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                  <div className="bg-cyan-500/10 rounded-lg p-4 border border-cyan-500/20">
                    <IconComponent icon={AiOutlineFileText} className="h-10 w-10 mx-auto mb-3 text-cyan-400" />
                    <p className="font-medium text-cyan-300">{file.name}</p>
                    <p className="text-sm text-slate-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    {documentPages.length > 0 && (
                      <p className="text-sm text-cyan-300 mt-2">{documentPages.length} {t('aiStudy.pagesLoaded')}</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-slate-400">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: [0.42, 0, 0.58, 1] as const }}
                  >
                    <IconComponent icon={AiOutlineUpload} className="h-12 w-12 mx-auto mb-4 text-cyan-400" />
                  </motion.div>
                  <p className="text-lg font-medium text-slate-300 mb-2">{t('aiStudy.dragDropText')}</p>
                  <p className="text-sm">{t('aiStudy.orClickToBrowse')}</p>
                  <div className="flex items-center justify-center space-x-4 mt-4 text-xs text-slate-500">
                    <span className="bg-slate-600/50 px-2 py-1 rounded">PDF</span>
                    <span className="bg-slate-600/50 px-2 py-1 rounded">Images</span>
                    <span className="bg-slate-600/50 px-2 py-1 rounded">TXT</span>
                    <span className="bg-slate-600/50 px-2 py-1 rounded">DOC</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Document Preview with Page Navigation */}
          {documentPages.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-slate-300 font-medium flex items-center">
                  <IconComponent icon={FiEye} className="h-5 w-5 mr-2 text-cyan-400" />
                  {t('aiStudy.documentPreview')}
                </label>
                <div className="flex items-center space-x-2">
                  <motion.button
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="p-2 bg-slate-600/40 rounded-lg text-slate-300 hover:bg-slate-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <IconComponent icon={FiChevronLeft} className="h-4 w-4" />
                  </motion.button>
                  <span className="text-sm text-slate-300 px-3 py-1 bg-slate-600/30 rounded-lg">
                    {currentPage + 1} / {documentPages.length}
                  </span>
                  <motion.button
                    onClick={() => setCurrentPage(Math.min(documentPages.length - 1, currentPage + 1))}
                    disabled={currentPage === documentPages.length - 1}
                    className="p-2 bg-slate-600/40 rounded-lg text-slate-300 hover:bg-slate-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <IconComponent icon={FiChevronRight} className="h-4 w-4" />
                  </motion.button>
                </div>
              </div>
              <div className="bg-slate-600/20 rounded-xl p-4 border border-cyan-500/20">
                <img 
                  src={documentPages[currentPage]} 
                  alt={`Page ${currentPage + 1}`}
                  className="w-full h-auto max-h-96 object-contain rounded-lg shadow-lg"
                />
              </div>
            </div>
          )}

          {/* Enhanced Text Input */}
          <div className="mb-6">
            <label className="block text-slate-300 mb-3 font-medium flex items-center">
              <IconComponent icon={AiOutlineFileText} className="h-5 w-5 mr-2 text-cyan-400" />
              {documentPages.length > 0 ? t('aiStudy.additionalContext') : t('aiStudy.pasteTextHere')}
            </label>
            <div className="relative">
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="w-full p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none h-64 text-slate-200 placeholder-slate-400 transition-all duration-300"
                placeholder={documentPages.length > 0 ? 
                  t('aiStudy.addContextPlaceholder') : 
                  t('aiStudy.pasteTextPlaceholder')
                }
              />
              <div className="absolute bottom-3 right-3 text-xs text-slate-500">
                {textInput.length} {t('aiStudy.characters')}
              </div>
            </div>
          </div>

          {/* Enhanced Action Buttons */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-3">
              <motion.button
                type="button"
                className="flex items-center justify-center px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-slate-300 font-medium hover:bg-white/10 transition-all duration-300"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => setShowHistory(!showHistory)}
              >
                <IconComponent icon={AiOutlineHistory} className="h-5 w-5 mr-2" />
                {t('aiStudy.history')} ({summaryHistory.length})
              </motion.button>
              
              <motion.button
                type="button"
                className="flex items-center justify-center px-4 py-2 bg-red-500/10 backdrop-blur-sm border border-red-500/20 rounded-lg text-red-300 font-medium hover:bg-red-500/20 transition-all duration-300"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={handleRemoveFile}
              >
                <IconComponent icon={FiTrash2} className="h-5 w-5 mr-2" />
                {t('aiStudy.clear')}
              </motion.button>
            </div>
            
            {/* Conditional Action Button */}
            {showGetSummaryButton ? (
              <motion.button
                type="button"
                className="flex items-center justify-center px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={handleGetSummary}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <motion.div
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
                    />
                    {t('common.processing')}
                  </>
                ) : (
                  <>
                    <IconComponent icon={FiZap} className="h-5 w-5 mr-2" />
                    {t('aiStudy.getSummary')}
                  </>
                )}
              </motion.button>
            ) : (
              <motion.button
                type="button"
                className="flex items-center justify-center px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={handleGetSummary}
                disabled={loading || !textInput.trim()}
              >
                {loading ? (
                  <>
                    <motion.div
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
                    />
                    {t('common.processing')}
                  </>
                ) : (
                  <>
                    <IconComponent icon={FiZap} className="h-5 w-5 mr-2" />
                    {t('aiStudy.getSummary')}
                  </>
                )}
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Enhanced Results Section */}
        <motion.div variants={itemVariants}>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                <IconComponent icon={AiOutlineBulb} className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-cyan-400">{t('aiStudy.results')}</h2>
                <p className="text-purple-300 text-sm mt-1 font-medium">{t('aiStudy.aiPoweredAnalysis')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Show mindmap button only when summary is complete and mindmap is generated */}
              {summaryComplete && mindmapData && (
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => setShowMindmap(!showMindmap)}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-medium shadow-lg transition-all duration-300"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <IconComponent icon={FiEye} className="h-4 w-4 mr-2" />
                  {showMindmap ? t('aiStudy.showSummary') : t('aiStudy.showMindmap')}
                </motion.button>
              )}
              
              {(summary || streamingText) && (
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => setFullScreenView(showMindmap ? 'mindmap' : 'summary')}
                  className="flex items-center text-cyan-400 font-medium hover:text-cyan-300 transition-colors"
                >
                  <IconComponent icon={AiOutlineFullscreen} className="h-5 w-5 mr-1" />
                  {t('aiStudy.fullscreen')}
                </motion.button>
              )}
            </div>
          </div>
          
          <motion.div
            className="bg-[#0f172a]/60 backdrop-blur-md border border-cyan-500/20 rounded-xl p-6 overflow-y-auto h-[660px] shadow-xl"
            variants={itemVariants}
            ref={summaryContainerRef} // Move ref to the scrollable container
          >
            {loading && !streamingText && pageSummaries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-300">
                <motion.div
                  className="w-20 h-20 border-4 border-cyan-500 border-t-transparent rounded-full mb-6"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
                />
                <motion.p 
                  className="text-center text-slate-300 text-lg font-medium"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {processingStatus || 'Processing document...'}
                </motion.p>
              </div>
            ) : pageSummaries.length > 0 && !showMindmap ? (
              // Show page-by-page summaries
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-cyan-400">Page-by-Page Analysis</h3>
                  <span className="text-sm text-slate-400">
                    {pageSummaries.filter(ps => ps.isComplete).length} / {pageSummaries.length} completed
                  </span>
                </div>
                
                {pageSummaries.map((pageSummary, index) => (
                  <motion.div
                    key={pageSummary.pageNumber}
                    className="bg-slate-600/30 rounded-lg p-4 border border-cyan-500/20"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-md font-semibold text-cyan-300 flex items-center">
                        <IconComponent icon={AiOutlineFileText} className="h-4 w-4 mr-2" />
                        Page {pageSummary.pageNumber}
                      </h4>
                      {pageSummary.isLoading ? (
                        <div className="flex items-center text-sm text-slate-400">
                          <motion.div
                            className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full mr-2"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
                          />
                          Processing...
                        </div>
                      ) : pageSummary.error ? (
                        <span className="text-sm text-red-400">Error</span>
                      ) : (
                        <span className="text-sm text-green-400">✓ Complete</span>
                      )}
                    </div>
                    
                    {pageSummary.summary && (
                      <div className="prose prose-sm max-w-none prose-headings:text-cyan-400 prose-p:text-slate-300 prose-strong:text-slate-200">
                        <ReactMarkdown
                          remarkPlugins={[remarkMath, remarkGfm]}
                          rehypePlugins={[rehypeKatex]}
                          components={markdownComponents}
                        >
                          {preprocessLaTeX(pageSummary.summary)}
                        </ReactMarkdown>
                      </div>
                    )}
                  </motion.div>
                ))}
                
                {/* Show comprehensive summary when available */}
                {(summary || streamingText) && (
                  <motion.div
                    className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-6 border border-purple-500/30 mt-8"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="flex items-center mb-4">
                      <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mr-3">
                        <IconComponent icon={AiOutlineBulb} className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-purple-400">Comprehensive Summary</h3>
                      {loading && streamingText && (
                        <motion.div 
                          className="inline-block w-2 h-5 bg-purple-400 ml-3"
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                      )}
                    </div>
                    
                    <div className="prose prose-lg max-w-none prose-headings:text-purple-400 prose-p:text-slate-300 prose-strong:text-slate-200">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath, remarkGfm]}
                        rehypePlugins={[rehypeKatex]}
                        components={markdownComponents}
                      >
                        {preprocessLaTeX(summary || streamingText)}
                      </ReactMarkdown>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : showMindmap && mindmapData ? (
              <div className="h-full bg-slate-700/30 backdrop-blur-sm rounded-lg border border-white/10">
                <div className="p-3 border-b border-white/10 bg-slate-600/30">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-cyan-400">Interactive Mind Map</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-400">🤏 Pinch to zoom • 🖱️ Drag to move • 📍 Double-click to reset</span>
                    </div>
                  </div>
                </div>
                <div ref={mindmapRef} className="w-full h-[calc(100%-60px)] rounded-b-lg" style={{ touchAction: 'none' }} />
              </div>
            ) : (summary || streamingText) ? (
              <div className="relative">
                {/* Show streaming status at the top when loading */}
                {loading && streamingText && (
                  <div className="mb-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg flex items-center">
                    <motion.div
                      className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full mr-3"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
                    />
                    <span className="text-cyan-300 text-sm font-medium">
                      {processingStatus || '🚀 Generating summary in real-time...'}
                    </span>
                  </div>
                )}
                
                <div
                  className="prose prose-lg max-w-none
                    prose-headings:text-cyan-400 
                    prose-p:text-slate-300 prose-p:leading-relaxed
                    prose-strong:text-slate-200 prose-strong:font-bold
                    prose-ul:space-y-1 prose-ol:space-y-1
                    prose-li:marker:text-cyan-400 prose-li:text-slate-300"
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkMath, remarkGfm]}
                    rehypePlugins={[rehypeKatex]}
                    components={markdownComponents}
                  >
                    {preprocessLaTeX(summary || streamingText)}
                  </ReactMarkdown>
                  {/* Show streaming cursor indicator */}
                  {loading && streamingText && (
                    <motion.div 
                      className="inline-block w-2 h-5 bg-cyan-400 ml-1"
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <IconComponent icon={AiOutlineBulb} className="h-16 w-16 mb-4 opacity-50 text-cyan-400" />
                </motion.div>
                <p className="text-center text-lg font-medium text-slate-300 mb-2">Ready to Summarize</p>
                <p className="text-center text-sm">Your document summary will appear here after processing.</p>
              </div>
            )}
          </motion.div>

          {/* Enhanced Action Buttons for Summary */}
          {(summary || streamingText || pageSummaries.some(ps => ps.isComplete)) && (
            <motion.div 
              className="mt-6 flex flex-wrap gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={handleCopyContent}
                className="flex items-center text-sm px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-lg text-white font-medium shadow-lg transition-all duration-300"
              >
                <IconComponent icon={FiCopy} className="mr-2" /> Copy Summary
              </motion.button>
              
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={handleShareContent}
                className="flex items-center text-sm px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 rounded-lg text-white font-medium shadow-lg transition-all duration-300"
              >
                <IconComponent icon={FiShare2} className="mr-2" /> Share
              </motion.button>

              <div className="relative">
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => setShowDownloadOptions(!showDownloadOptions)}
                  className="flex items-center text-sm px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white font-medium shadow-lg transition-all duration-300"
                >
                  <IconComponent icon={FiDownload} className="mr-2" /> {t('common.download')}
                </motion.button>
                
                <AnimatePresence>
                  {showDownloadOptions && (
                    <motion.div
                      className="absolute top-full left-0 mt-2 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-10"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      {/* Summary download options */}
                      {!showMindmap && (
                        <>
                          <div className="px-4 py-2 text-xs text-slate-400 border-b border-slate-600 rounded-t-lg">Summary Options</div>
                          <button
                            onClick={() => handleDownloadContent('txt')}
                            className="block w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-600 transition-colors"
                          >
                            {t('common.download')} as TXT
                          </button>
                          <button
                            onClick={() => handleDownloadContent('pdf')}
                            className="block w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-600 transition-colors"
                          >
                            {t('common.download')} as PDF
                          </button>
                          <button
                            onClick={() => handleDownloadContent('doc')}
                            className="block w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-600 rounded-b-lg transition-colors"
                          >
                            {t('common.download')} as DOCX
                          </button>
                        </>
                      )}
                      
                      {/* Mindmap download options */}
                      {showMindmap && (
                        <>
                          <div className="px-4 py-2 text-xs text-slate-400 border-b border-slate-600 rounded-t-lg">Mindmap Options</div>
                          <button
                            onClick={downloadMindmapAsImage}
                            className="block w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-600 transition-colors"
                          >
                            {t('common.download')} as PNG
                          </button>
                          <button
                            onClick={() => downloadSummaryAsText()}
                            className="block w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-600 rounded-b-lg transition-colors"
                          >
                            {t('common.download')} Summary as TXT
                          </button>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Processing status indicator */}
              {(isGeneratingMindmap || processingStatus) && (
                <div className="flex items-center text-sm px-4 py-2 bg-slate-600/40 rounded-lg text-slate-300">
                  {isGeneratingMindmap && (
                    <motion.div
                      className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full mr-2"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
                    />
                  )}
                  {processingStatus}
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* Enhanced History Panel */}
      <AnimatePresence>
        {showHistory && (
          <motion.div 
            className="mt-8 bg-[#0f172a]/60 backdrop-blur-md border border-cyan-500/20 rounded-xl p-6 shadow-xl"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                  <IconComponent icon={AiOutlineHistory} className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-cyan-400">Summary History</h3>
                <span className="bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full text-sm font-medium">
                  {summaryHistory.length} items
                </span>
                {isLoadingHistory && (
                  <div className="flex items-center space-x-2 bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm font-medium">
                    <IconComponent icon={AiOutlineLoading3Quarters} className="h-4 w-4 animate-spin" />
                    <span>Loading...</span>
                  </div>
                )}
                {isSavingToHistory && (
                  <div className="flex items-center space-x-2 bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm font-medium">
                    <IconComponent icon={AiOutlineLoading3Quarters} className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </div>
                )}
              </div>
              <motion.button
                onClick={() => setShowHistory(false)}
                className="text-slate-400 hover:text-slate-300 p-2 rounded-lg hover:bg-slate-600/40 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>
            
            {/* Error Message */}
            {historyError && (
              <motion.div 
                className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="flex items-center space-x-2">
                  <IconComponent icon={FiTrash2} className="h-4 w-4" />
                  <span>Error: {historyError}</span>
                </div>
              </motion.div>
            )}
            
            <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar" ref={summaryContainerRef}>
              {summaryHistory.length > 0 ? (
                summaryHistory.map((item, index) => (
                  <motion.div
                    key={item.id}
                    className="p-5 bg-black/20 backdrop-blur-sm rounded-xl cursor-pointer hover:bg-black/30 transition-all duration-300 group border border-cyan-500/10 hover:border-cyan-500/30"
                    onClick={() => loadFromHistory(item)}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="p-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg border border-cyan-500/30">
                            <IconComponent 
                              icon={item.sourceType === 'file' ? AiOutlineFileText : AiOutlineUpload} 
                              className="h-4 w-4 text-cyan-400" 
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-200 truncate">
                              {item.title}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs text-slate-400 flex items-center">
                                <IconComponent icon={FiClock} className="h-3 w-3 mr-1" />
                                {item.timestamp.toLocaleDateString()} at {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                item.sourceType === 'file' 
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                                  : 'bg-green-500/20 text-green-300 border border-green-500/30'
                              }`}>
                                {item.sourceType === 'file' ? 'File' : 'Text'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {item.summary.length > 150 ? `${item.summary.substring(0, 150)}...` : item.summary}
                        </p>
                      </div>
                      
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFromHistory(item.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-300 ml-3"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <IconComponent icon={FiTrash2} className="h-4 w-4" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-400">
                  {isLoadingHistory ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
                    >
                      <IconComponent icon={AiOutlineLoading3Quarters} className="mx-auto text-6xl mb-4 opacity-50" />
                    </motion.div>
                  ) : (
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <IconComponent icon={AiOutlineHistory} className="mx-auto text-6xl mb-4 opacity-50" />
                  </motion.div>
                  )}
                  <p className="text-lg font-medium text-slate-300 mb-2">
                    {isLoadingHistory ? 'Loading history...' : 'No summary history yet'}
                  </p>
                  <p className="text-sm">
                    {isLoadingHistory 
                      ? 'Please wait while we fetch your document summaries'
                      : 'Your document summaries will appear here after processing'
                    }
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Fullscreen Modal - Fixed to cover whole component */}
      <PortalModal 
        isOpen={!!fullScreenView}
        onClose={() => setFullScreenView(null)}
        className="bg-[#0f172a] backdrop-blur-xl border border-white/10 rounded-2xl w-full h-full flex flex-col shadow-2xl"
        style={{ margin: 0 }}
      >
        <div className="flex items-center justify-between p-6 border-b border-cyan-500/20 flex-shrink-0">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl shadow-lg">
              <IconComponent 
                icon={fullScreenView === 'mindmap' ? FiEye : AiOutlineBulb} 
                className="h-7 w-7 text-white" 
              />
            </div>
            <div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {fullScreenView === 'mindmap' ? '🧠 Interactive Mindmap' : '📄 Document Summary'}
              </h3>
              <p className="text-slate-300 text-base mt-2 font-medium">
                {fullScreenView === 'mindmap' 
                  ? 'Explore the hierarchical structure of your document' 
                  : 'Comprehensive analysis and key insights'
                }
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {fullScreenView === 'summary' && summaryComplete && mindmapData && (
              <motion.button
                onClick={() => setFullScreenView('mindmap')}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <IconComponent icon={FiEye} className="h-5 w-5 mr-2" />
                View Mindmap
              </motion.button>
            )}
            {fullScreenView === 'mindmap' && (
              <motion.button
                onClick={() => setFullScreenView('summary')}
                className="flex items-center px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <IconComponent icon={AiOutlineBulb} className="h-5 w-5 mr-2" />
                View Summary
              </motion.button>
            )}
            <motion.button
              onClick={() => setFullScreenView(null)}
              className="text-slate-300 hover:text-white p-3 rounded-xl bg-slate-600/50 hover:bg-slate-500/50 transition-all duration-300 border border-slate-500/30"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </motion.button>
          </div>
        </div>
        
        <div className="flex-1 p-6 overflow-hidden">
          {fullScreenView === 'mindmap' && mindmapData ? (
            <div className="h-full bg-black/20 rounded-2xl border border-white/10 shadow-inner">
              <div className="p-3 border-b border-white/10 bg-slate-600/30 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-cyan-400">Interactive Mind Map</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-400">🤏 Pinch to zoom • 🖱️ Drag to move • 📍 Double-click to reset</span>
                  </div>
                </div>
              </div>
              <div 
                ref={fullScreenView === 'mindmap' ? mindmapRef : null}
                className="w-full h-[calc(100%-60px)] rounded-b-2xl"
                style={{ touchAction: 'none' }}
              />
            </div>
          ) : summary ? (
            <div className="h-full bg-gradient-to-br from-slate-600/30 via-slate-700/30 to-slate-800/30 rounded-2xl p-8 border-2 border-cyan-500/30 shadow-inner overflow-y-auto custom-scrollbar">
              <div
                className="prose prose-xl max-w-none
                  prose-headings:text-cyan-400 prose-headings:font-bold
                  prose-p:text-slate-200 prose-p:leading-relaxed prose-p:text-lg
                  prose-strong:text-slate-100 prose-strong:font-bold
                  prose-ul:space-y-2 prose-ol:space-y-2
                  prose-li:marker:text-cyan-400 prose-li:text-slate-200 prose-li:text-lg
                  prose-code:bg-slate-600/50 prose-code:text-cyan-300 prose-code:px-2 prose-code:py-1 prose-code:rounded"
              >
                <ReactMarkdown
                  remarkPlugins={[remarkMath, remarkGfm]}
                  rehypePlugins={[rehypeKatex]}
                  components={markdownComponents}
                >
                  {preprocessLaTeX(summary)}
                </ReactMarkdown>
              </div>
            </div>
          ) : null}
        </div>
      </PortalModal>

      {/* Debug Console for API Status */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50">
          <motion.button
            onClick={() => setShowDebugConsole(!showDebugConsole)}
            className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg shadow-lg transition-all duration-200 text-sm font-medium mb-2 block ml-auto"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {showDebugConsole ? '🐛 Hide Debug' : '🐛 Show Debug'}
          </motion.button>
          
          {showDebugConsole && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-slate-800/95 backdrop-blur-sm border border-slate-600 rounded-lg p-4 w-80 max-h-60 overflow-y-auto shadow-xl"
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-cyan-400 font-medium text-sm">API Debug Console</h4>
                <button
                  onClick={() => setApiDebugLog([])}
                  className="text-slate-400 hover:text-white text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                >
                  Clear
                </button>
              </div>
              <div className="space-y-1">
                {apiDebugLog.length === 0 ? (
                  <p className="text-slate-400 text-xs">No API activity yet...</p>
                ) : (
                  apiDebugLog.map((log, index) => (
                    <div
                      key={index}
                      className={`text-xs p-2 rounded ${
                        log.includes('✅') 
                          ? 'bg-green-900/30 text-green-300' 
                          : log.includes('❌') 
                          ? 'bg-red-900/30 text-red-300'
                          : log.includes('⚠️')
                          ? 'bg-yellow-900/30 text-yellow-300'
                          : 'bg-slate-700/50 text-slate-300'
                      }`}
                    >
                      {log}
                    </div>
                  ))
                )}
              </div>
              <div className="mt-3 pt-2 border-t border-slate-600">
                <p className="text-xs text-slate-400">
                  Current Doc ID: {currentDocumentId ? currentDocumentId.substring(0, 8) + '...' : 'None'}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Custom Scrollbar Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .custom-scrollbar::-webkit-scrollbar {
            width: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(51, 65, 85, 0.4);
            border-radius: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: linear-gradient(45deg, #06b6d4, #8b5cf6);
            border-radius: 6px;
            border: 2px solid rgba(51, 65, 85, 0.4);
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(45deg, #0891b2, #7c3aed);
          }
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          /* Force override any black text in the component */
          .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
            color: inherit !important;
          }
          
          /* Ensure all text elements have proper colors */
          .prose * {
            color: inherit !important;
          }
          
          /* Force all paragraph and text content to be light colored */
          .prose p, .prose div, .prose span, .prose text {
            color: #e2e8f0 !important;
          }
          
          /* Force all list items and their content */
          .prose ul li, .prose ol li, .prose li * {
            color: #e2e8f0 !important;
          }
          
          /* Override any default markdown styling that might be black */
          .prose .markdown-body h1,
          .prose .markdown-body h2,
          .prose .markdown-body h3,
          .prose .markdown-body h4,
          .prose .markdown-body h5,
          .prose .markdown-body h6 {
            color: inherit !important;
          }
          
          .prose .markdown-body p,
          .prose .markdown-body div,
          .prose .markdown-body span,
          .prose .markdown-body li {
            color: #e2e8f0 !important;
          }
          
          /* Force all text in the document summarizer to never be black */
          [class*="DocumentSummarizerComponent"] * {
            color: inherit !important;
          }
          
          /* Specific overrides for ReactMarkdown content */
          .prose-p\\:text-slate-300 p,
          .prose-li\\:text-slate-300 li,
          .prose-strong\\:text-slate-200 strong {
            color: #e2e8f0 !important;
          }
          
          /* Override any possible black text from external libraries */
          .prose-headings\\:text-cyan-400 h1,
          .prose-headings\\:text-cyan-400 h2,
          .prose-headings\\:text-cyan-400 h3,
          .prose-headings\\:text-cyan-400 h4,
          .prose-headings\\:text-cyan-400 h5,
          .prose-headings\\:text-cyan-400 h6 {
            color: #22d3ee !important;
          }
          
          .prose-headings\\:text-purple-400 h1,
          .prose-headings\\:text-purple-400 h2,
          .prose-headings\\:text-purple-400 h3,
          .prose-headings\\:text-purple-400 h4,
          .prose-headings\\:text-purple-400 h5,
          .prose-headings\\:text-purple-400 h6 {
            color: #c084fc !important;
          }
          
          /* Enhanced Mindmap Styling - Basic styling only */
          .echarts-for-react,
          [class*="echarts"] {
            background: transparent !important;
          }
          
          /* Ensure mindmap takes full container space */
          .echarts-for-react > div,
          [class*="echarts"] > div {
            width: 100% !important;
            height: 100% !important;
          }
          
          /* Mindmap text styling */
          .echarts-for-react svg text,
          [class*="echarts"] svg text {
            font-family: 'Inter', system-ui, sans-serif !important;
            font-weight: 600 !important;
          }
          
          /* Smooth transitions for mindmap elements */
          .echarts-for-react svg path,
          .echarts-for-react svg circle,
          .echarts-for-react svg text,
          [class*="echarts"] svg path,
          [class*="echarts"] svg circle,
          [class*="echarts"] svg text {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }
        `
      }} />
    </div>
  );
};

export default DocumentSummarizerComponent;
