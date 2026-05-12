import React, { useState, useRef, useEffect } from 'react';
import ReactDOM, { flushSync } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AiOutlineUpload, AiOutlineCamera, AiOutlineFullscreen, AiOutlineBulb, AiOutlineFileText, AiOutlineHistory, AiOutlineLoading3Quarters, AiOutlineLeft, AiOutlineRight, AiOutlineClose, AiOutlineCheckCircle, AiOutlineExclamationCircle, AiOutlineBook, AiOutlineDelete, AiOutlineExclamation } from 'react-icons/ai';
import { FiDownload, FiCopy, FiShare2, FiClock } from 'react-icons/fi';
import { FaFileAlt, FaPaperPlane } from 'react-icons/fa';
import IconComponent from './IconComponent';
import * as pdfjsLib from 'pdfjs-dist';
import html2canvas from 'html2canvas';
import * as mammoth from 'mammoth';
import { useResponseCheck, ResponseUpgradeModal } from '../../utils/responseChecker';
import { useNotification } from '../../utils/NotificationContext';
import { useLanguage } from '../../utils/LanguageContext';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabase';
import coinIcon from '../../assets/assets_coin.png';

// Import mistake check API functions
import { 
  submitMistakeCheck, 
  getMistakeCheckHistory, 
  updateMistakeCheck, 
  deleteMistakeCheck,
  getMistakeCheckById,
  type MistakeCheckSubmissionData,
  type MistakeCheckHistoryItem as APIHistoryItem
} from '../../utils/mistakeCheckAPI';

// Import markdown and math libraries
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
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

interface Mistake {
  id: number;
  incorrect: string;
  correct: string;
  type: string;
  explanation?: string;
  severity?: string;
  startIndex?: number;
  endIndex?: number;
  lineNumber?: number;
}

// Add new interface for page mistakes
interface PageMistakes {
  pageNumber: number;
  mistakes: Mistake[];
  isLoading: boolean;
  isComplete: boolean;
  error?: string;
}

// Add new interfaces for teacher marking
interface MarkingStandard {
  id: string;
  name: string;
  description: string;
  gradingScale: {
    max: number;
    passingGrade: number;
    gradeLabels: { [key: number]: string };
  };
  criteria: {
    accuracy: number;
    presentation: number;
    methodology: number;
    understanding: number;
  };
}

interface QuestionMark {
  questionNumber: number;
  maxMarks: number;
  awardedMarks: number;
  mistakes: Mistake[];
  feedback: string;
  criteria: {
    accuracy: number;
    presentation: number;
    methodology: number;
    understanding: number;
  };
}

interface PageMarking {
  pageNumber: number;
  questions: QuestionMark[];
  totalMarks: number;
  maxMarks: number;
  isLoading: boolean;
  isComplete: boolean;
  error?: string;
}

interface MarkingSummary {
  totalScore: number;
  maxScore: number;
  percentage: number;
  grade: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  studyPlan: {
    topic: string;
    priority: 'high' | 'medium' | 'low';
    description: string;
  }[];
}

// Add new interface for extracted text
interface ExtractedText {
  pageNumber: number;
  text: string;
  isLoading: boolean;
  isComplete: boolean;
  error?: string;
}

// Add new interface for highlighted text
interface HighlightedText {
  text: string;
  isHighlighted: boolean;
  mistakeType?: string;
  correction?: string;
  isSelected?: boolean;
  mistakeId?: number;
}

interface OcrBoundingBox {
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
  width: number;
  height: number;
}

interface OcrResultLine {
  text: string;
  score?: number;
  polygon?: number[][];
  bbox?: OcrBoundingBox;
}

interface OcrPageData {
  page: number;
  width: number;
  height: number;
  results: OcrResultLine[];
}

interface MarkingCriteriaBreakdown {
  accuracy?: number;
  presentation?: number;
  methodology?: number;
  understanding?: number;
  [key: string]: number | undefined;
}

interface MarkingSchemeResult {
  score: number;
  maxScore: number;
  percentage: number;
  grade?: string;
  feedback?: string;
  criteria?: MarkingCriteriaBreakdown;
}

type ViewMode = 'mistakes' | 'marking';
type DocumentView = 'image' | 'text'; // New type for document view mode
type MistakeCheckerLanguage = 'en' | 'ch';

// Marking Standards Data
const MARKING_STANDARDS: MarkingStandard[] = [
  {
    id: 'hkdse',
    name: 'HKDSE (Hong Kong)',
    description: 'Hong Kong Diploma of Secondary Education',
    gradingScale: {
      max: 5,
      passingGrade: 2,
      gradeLabels: { 5: '5**', 4: '5*', 3: '5', 2: '4', 1: '3', 0: '2' }
    },
    criteria: {
      accuracy: 40,
      presentation: 20,
      methodology: 25,
      understanding: 15
    }
  },
  {
    id: 'gaokao',
    name: 'Gaokao (China)',
    description: 'National College Entrance Examination',
    gradingScale: {
      max: 150,
      passingGrade: 90,
      gradeLabels: { 150: 'A+', 135: 'A', 120: 'B+', 105: 'B', 90: 'C', 75: 'D', 0: 'F' }
    },
    criteria: {
      accuracy: 50,
      presentation: 15,
      methodology: 25,
      understanding: 10
    }
  },
  {
    id: 'ib',
    name: 'IB (International Baccalaureate)',
    description: 'International Baccalaureate Program',
    gradingScale: {
      max: 7,
      passingGrade: 4,
      gradeLabels: { 7: '7', 6: '6', 5: '5', 4: '4', 3: '3', 2: '2', 1: '1' }
    },
    criteria: {
      accuracy: 35,
      presentation: 25,
      methodology: 25,
      understanding: 15
    }
  },
  {
    id: 'ap',
    name: 'AP (Advanced Placement)',
    description: 'College Board Advanced Placement',
    gradingScale: {
      max: 5,
      passingGrade: 3,
      gradeLabels: { 5: '5', 4: '4', 3: '3', 2: '2', 1: '1' }
    },
    criteria: {
      accuracy: 45,
      presentation: 20,
      methodology: 25,
      understanding: 10
    }
  },
  {
    id: 'alevel',
    name: 'A-Level (UK)',
    description: 'General Certificate of Education Advanced Level',
    gradingScale: {
      max: 100,
      passingGrade: 40,
      gradeLabels: { 90: 'A*', 80: 'A', 70: 'B', 60: 'C', 50: 'D', 40: 'E', 0: 'U' }
    },
    criteria: {
      accuracy: 40,
      presentation: 20,
      methodology: 30,
      understanding: 10
    }
  },
  {
    id: 'gre',
    name: 'GRE (Graduate Record Exam)',
    description: 'ETS GRE Analytical Writing',
    gradingScale: {
      max: 6,
      passingGrade: 4,
      gradeLabels: { 6: '6', 5: '5', 4: '4', 3: '3', 2: '2', 1: '1', 0: '0' }
    },
    criteria: {
      accuracy: 25,
      presentation: 25,
      methodology: 25,
      understanding: 25
    }
  }
];

const LANGUAGE_OPTIONS: Array<{ code: MistakeCheckerLanguage; label: string }> = [
  { code: 'en', label: 'English' },
  { code: 'ch', label: 'Chinese' }
];

const MAX_DOCUMENT_UPLOAD_PAGES = 15;

interface CheckMistakesComponentProps {
  className?: string;
  variant?: 'default' | 'solve';
  selectedHistoryItem?: MistakeHistoryItem | null;
  onHistoryRefresh?: () => void;
}

// Add interface for history items
interface MistakeHistoryItem {
  id: string;
  fileName: string;
  text: string;
  mistakes: Mistake[];
  markingSummary: MarkingSummary | null;
  timestamp: Date;
  fileType: string;
  documentPages?: string[];
  file?: File;
  pageMistakes?: PageMistakes[];
  currentPage?: number;
  overallProcessingComplete?: boolean;
  extractedTexts?: ExtractedText[];
  pageMarkings?: PageMarking[];
  selectedMarkingStandard?: string;
  ocrOverlayPages?: OcrPageData[];
  n8nMarkingSchemes?: Record<string, MarkingSchemeResult>;
  webhookRawResponse?: string;
  webhookNormalizedPayload?: any;
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
      // Prevent body scroll when modal is open
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

const CheckMistakesComponent: React.FC<CheckMistakesComponentProps> = ({ className = '', variant = 'default', selectedHistoryItem = null, onHistoryRefresh }) => {
  const { t } = useLanguage();
  const { user, session } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [documentPages, setDocumentPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [fullScreenDocument, setFullScreenDocument] = useState(false);
  
  // Add new state for page mistakes
  const [pageMistakes, setPageMistakes] = useState<PageMistakes[]>([]);
  const [overallProcessingComplete, setOverallProcessingComplete] = useState(false);
  
  // Remove teacher marking states and replace with integrated marking
  const [selectedMarkingStandard, setSelectedMarkingStandard] = useState<string>('hkdse');
  const [selectedLanguage, setSelectedLanguage] = useState<MistakeCheckerLanguage>('en');
  const [markingSummary, setMarkingSummary] = useState<MarkingSummary | null>(null);
  
  // Add new state variables for the requested features
  const [textExtractionEnabled, setTextExtractionEnabled] = useState(true); // Changed from false to true
  const [extractedTexts, setExtractedTexts] = useState<ExtractedText[]>([]);
  const [selectedMistakeId, setSelectedMistakeId] = useState<number | null>(null);
  const [isProcessingStarted, setIsProcessingStarted] = useState(false);
  
  // Add history functionality with database integration
  const [showHistory, setShowHistory] = useState(false);
  const [mistakeHistory, setMistakeHistory] = useState<MistakeHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  // Add confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mistakesContainerRef = useRef<HTMLDivElement>(null); // Add ref for auto-scroll
  const mistakeCardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  const languageDropdownRef = useRef<HTMLDivElement>(null);
  const [languageDropdownPosition, setLanguageDropdownPosition] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  // Response checking state
  const { checkAndUseResponse } = useResponseCheck();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');
  const { showSuccess, showError } = useNotification();

  // Add new state for text-only processing and marks summary
  const [textOnlyMode, setTextOnlyMode] = useState(false);
  const [directText, setDirectText] = useState('');
  // Add new state variables for enhanced features
  const [showCorrectedText, setShowCorrectedText] = useState(false);
  const [correctedText, setCorrectedText] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showFileViewModal, setShowFileViewModal] = useState(false);
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [streamedAiResponse, setStreamedAiResponse] = useState('');
  const [ocrOverlayPages, setOcrOverlayPages] = useState<OcrPageData[]>([]);
  const [n8nMarkingSchemes, setN8nMarkingSchemes] = useState<Record<string, MarkingSchemeResult>>({});
  const [webhookProgress, setWebhookProgress] = useState(0);
  const [webhookRemainingSeconds, setWebhookRemainingSeconds] = useState(180);
  const [overlayTextColors, setOverlayTextColors] = useState<Record<number, string>>({});

  // Add page markings state for teacher marking functionality
  const [pageMarkings, setPageMarkings] = useState<PageMarking[]>([]);

  // Add state to track history restoration
  const [isRestoringFromHistory, setIsRestoringFromHistory] = useState(false);

  const sanitizeFileName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '_');

  const uploadToSupabase = async (uploadFile: File | Blob, fileName: string): Promise<string | null> => {
    try {
      const sanitizedFileName = sanitizeFileName(fileName);
      const filePath = `${user?.id || 'anonymous'}/${Date.now()}_${sanitizedFileName}`;
      const { error } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, uploadFile);

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

  // Close language dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(e.target as Node)) {
        setIsLanguageDropdownOpen(false);
      }
    };
    if (isLanguageDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLanguageDropdownOpen]);

  // Load history from database on component mount
  useEffect(() => {
    loadHistoryFromDatabase();
  }, []);

  // Add useEffect to monitor state after history restoration
  useEffect(() => {
    if (isRestoringFromHistory && isProcessingStarted && overallProcessingComplete) {
      console.log('🔄 State synchronized after history restoration:', {
        file: !!file,
        isProcessingStarted,
        overallProcessingComplete,
        documentPages: documentPages.length,
        extractedTexts: extractedTexts.length,
        pageMistakes: pageMistakes.length,
        markingSummary: !!markingSummary,
        textOnlyMode
      });
      
      // Mark restoration as complete
      setIsRestoringFromHistory(false);
    }
  }, [isRestoringFromHistory, isProcessingStarted, overallProcessingComplete, file, documentPages, extractedTexts, pageMistakes, markingSummary, textOnlyMode]);

  // Helper function to show confirmation modal
  const showConfirmation = (message: string, action: () => void) => {
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    if (confirmAction) {
      confirmAction();
    }
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmMessage('');
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmMessage('');
  };

  // Load history from database
  const loadHistoryFromDatabase = async () => {
    // Only load history if user is authenticated
    if (!user && !session) {
      console.log('🚫 No authenticated user - clearing history');
      setMistakeHistory([]);
      setIsLoadingHistory(false);
      return;
    }

    setIsLoadingHistory(true);
    try {
      console.log('📚 Loading mistake check history from database...');
      const result = await getMistakeCheckHistory(user, session);
      
      if (result.success && result.history) {
        console.log('✅ Loaded mistake check history:', result.history.length, 'items');
        setMistakeHistory(result.history);
      } else {
        console.error('❌ Failed to load mistake check history:', result.error);
        // Do not fallback to localStorage for security reasons
        setMistakeHistory([]);
        if (mistakeHistory.length === 0) {
          showError(result.error || 'Failed to load history from database');
        }
      }
    } catch (error) {
      console.error('❌ Error loading history from database:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Do not fallback to localStorage for security reasons
      setMistakeHistory([]);
      
      // Only show error if no history is available
      if (mistakeHistory.length === 0) {
        showError(`Failed to load history: ${errorMessage}`);
      }
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Function to save to database (enhanced from addToHistory)
  const saveToDatabase = async (fileName: string, text: string, mistakes: Mistake[], markingSummary: MarkingSummary | null, fileType: string, documentPages?: string[], originalFile?: File, pageMistakes?: PageMistakes[], currentPageIndex?: number, processingComplete?: boolean, extractedTexts?: ExtractedText[], pageMarkings?: PageMarking[], ocrPages?: OcrPageData[], markingSchemes?: Record<string, MarkingSchemeResult>, webhookRawResponse?: string, webhookNormalizedPayload?: any) => {
    // Require authentication for saving
    if (!user && !session) {
      console.warn('⚠️ Cannot save mistake check - user not authenticated');
      return;
    }

    try {
      console.log('💾 Saving mistake check to database...');
      
      const submissionData: MistakeCheckSubmissionData = {
        text,
        fileName,
        file: originalFile,
        fileType,
        documentPages,
        mistakes,
        pageMistakes,
        extractedTexts,
        pageMarkings,
        ocrOverlayPages: ocrPages,
        n8nMarkingSchemes: markingSchemes,
        webhookRawResponse,
        webhookNormalizedPayload,
        markingSummary,
        selectedMarkingStandard,
        currentPage: currentPageIndex || 0,
        overallProcessingComplete: processingComplete || false
      };

      console.log('🔄 Submitting data to backend...', {
        fileName,
        fileType,
        mistakesCount: mistakes.length,
        hasFile: !!originalFile,
        textLength: text.length
      });

      const result = await submitMistakeCheck(submissionData, user, session);
      
      if (result.success) {
        console.log('✅ Successfully saved to database');
        // Silent auto-save - no user notification
        
        // Reload history to include the new item (silently)
        loadHistoryFromDatabase();
        onHistoryRefresh?.();
      } else {
        console.error('❌ Failed to save to database:', result.error);
        const errorMessage = `Failed to save to database: ${result.error || 'Unknown error'}`;
        showError(errorMessage);
        // Do not save to localStorage as fallback - require authentication
      }
    } catch (error) {
      console.error('❌ Database save error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      showError(`Failed to save to database: ${errorMessage}`);
      // Do not save to localStorage as fallback - require authentication
    }
  };

  // Enhanced function to add to history (now uses database only)
  const addToHistory = (fileName: string, text: string, mistakes: Mistake[], markingSummary: MarkingSummary | null, fileType: string, documentPages?: string[], originalFile?: File, pageMistakes?: PageMistakes[], currentPageIndex?: number, processingComplete?: boolean, extractedTexts?: ExtractedText[], pageMarkings?: PageMarking[], ocrPages?: OcrPageData[], markingSchemes?: Record<string, MarkingSchemeResult>, webhookRawResponse?: string, webhookNormalizedPayload?: any) => {
    // Save to database - authentication required
    saveToDatabase(fileName, text, mistakes, markingSummary, fileType, documentPages, originalFile, pageMistakes, currentPageIndex, processingComplete, extractedTexts, pageMarkings, ocrPages, markingSchemes, webhookRawResponse, webhookNormalizedPayload);
  };

  // Function to load from history - Enhanced to properly restore view state
  const loadFromHistory = (item: MistakeHistoryItem) => {
    console.log('🔄 Loading from history:', {
      fileName: item.fileName,
      mistakesCount: item.mistakes?.length || 0,
      hasDocumentPages: !!item.documentPages?.length,
      hasExtractedTexts: !!item.extractedTexts?.length,
      hasPageMistakes: !!item.pageMistakes?.length,
      hasPageMarkings: !!item.pageMarkings?.length,
      hasMarkingSummary: !!item.markingSummary,
      overallComplete: item.overallProcessingComplete,
      currentPage: item.currentPage,
      selectedStandard: item.selectedMarkingStandard
    });

    // IMPORTANT: Set restoration flag first to prevent useEffect interference
    setIsRestoringFromHistory(true);
    
    // Clear loading state immediately to show results
    setLoading(false);
    setProcessingStatus('');

    // Close history modal first
    setShowHistory(false);

    // Reset selection states
    setSelectedMistakeId(null);
    setShowCorrectedText(false);
    setTextOnlyMode(false);
    
    // For text-only mode restoration
    if (!item.documentPages?.length && item.text) {
      console.log('📝 Restoring text-only mode from history');
      setTextOnlyMode(true);
      setFile(null);
      setDocumentPages([]);
      setOcrOverlayPages([]);
      setN8nMarkingSchemes(item.n8nMarkingSchemes || {});
      setDirectText(item.text || '');
      
      // Restore mistakes for text mode
      if (item.mistakes?.length) {
        const mistakes: Mistake[] = item.mistakes.map(mistake => ({
          id: mistake.id,
          incorrect: mistake.incorrect,
          correct: mistake.correct,
          type: mistake.type,
          explanation: mistake.explanation
        }));
        
        // Create page mistakes for text mode (single page)
        const textPageMistakes: PageMistakes = {
          pageNumber: 1,
          mistakes: mistakes,
          isLoading: false,
          isComplete: true
        };
        setPageMistakes([textPageMistakes]);
        setCurrentPage(0);
      }
      
      // Restore marking summary
      if (item.markingSummary) {
        setMarkingSummary(item.markingSummary);
      }
      
      // Restore selected marking standard
      if (item.selectedMarkingStandard) {
        setSelectedMarkingStandard(item.selectedMarkingStandard);
      }
      
      setIsProcessingStarted(true);
      setOverallProcessingComplete(true);
      
      // Clear restoration flag
      setTimeout(() => {
        setIsRestoringFromHistory(false);
        console.log('🎯 Text-only restoration completed');
      }, 100);
      
      return;
    }

    // For document-based history items
    if (item.documentPages?.length) {
      console.log('📄 Restoring document mode from history with', item.documentPages.length, 'pages');
      setDocumentPages(item.documentPages);
      setCurrentPage(item.currentPage || 0);
      setTextOnlyMode(false);
      setOcrOverlayPages(item.ocrOverlayPages || []);
      setN8nMarkingSchemes(item.n8nMarkingSchemes || {});
      
      // Create or restore file state
      if (item.file) {
        setFile(item.file);
      } else {
        // Create a pseudo-file for document-based items
        const pseudoFile = new File([''], item.fileName, { 
          type: item.fileType || 'application/pdf',
          lastModified: item.timestamp.getTime()
        });
        setFile(pseudoFile);
      }
    } else {
      // Clear document states if no document pages
      setDocumentPages([]);
      setFile(null);
      setOcrOverlayPages([]);
      setN8nMarkingSchemes(item.n8nMarkingSchemes || {});
    }

    // Restore extracted texts
    if (item.extractedTexts?.length) {
      console.log('📝 Restoring extracted texts:', item.extractedTexts.length, 'pages');
      const restoredTexts: ExtractedText[] = item.extractedTexts.map(text => ({
        pageNumber: text.pageNumber,
        text: text.text || '',
        isLoading: false,
        isComplete: true,
        error: text.error
      }));
      setExtractedTexts(restoredTexts);
    } else {
      setExtractedTexts([]);
    }

    // Restore page mistakes
    if (item.pageMistakes?.length) {
      console.log('🚨 Restoring page mistakes:', item.pageMistakes.length, 'pages');
      const restoredPageMistakes: PageMistakes[] = item.pageMistakes.map(pm => ({
        pageNumber: pm.pageNumber,
        mistakes: pm.mistakes || [],
        isLoading: false,
        isComplete: true,
        error: pm.error
      }));
      setPageMistakes(restoredPageMistakes);
    } else if (item.mistakes?.length) {
      // Fallback: Create page mistakes from legacy mistakes array
      const legacyPageMistakes: PageMistakes = {
        pageNumber: 1,
        mistakes: item.mistakes,
        isLoading: false,
        isComplete: true
      };
      setPageMistakes([legacyPageMistakes]);
    } else {
      setPageMistakes([]);
    }

    // Restore page markings
    if (item.pageMarkings?.length) {
      console.log('📊 Restoring page markings:', item.pageMarkings.length, 'pages');
      const restoredPageMarkings: PageMarking[] = item.pageMarkings.map(pm => ({
        pageNumber: pm.pageNumber,
        questions: pm.questions || [],
        totalMarks: pm.totalMarks || 0,
        maxMarks: pm.maxMarks || 0,
        isLoading: false,
        isComplete: true,
        error: pm.error
      }));
      setPageMarkings(restoredPageMarkings);
    } else {
      setPageMarkings([]);
    }

    // Restore marking summary
    if (item.markingSummary) {
      console.log('📊 Restoring marking summary');
      setMarkingSummary(item.markingSummary);
    } else {
      setMarkingSummary(null);
    }

    // Restore selected marking standard
    if (item.selectedMarkingStandard) {
      setSelectedMarkingStandard(item.selectedMarkingStandard);
    }

    // Set processing states - CRITICAL for showing results
    setIsProcessingStarted(true);
    setOverallProcessingComplete(true);
    
    // Generate corrected text if mistakes exist
    if (item.mistakes?.length) {
      const allText = item.text || item.extractedTexts?.map(et => et.text).join('\n') || '';
      if (allText) {
        const corrected = generateCorrectedText(allText, item.mistakes);
        setCorrectedText(corrected);
      }
    }

    // Final state synchronization with extended timeout
    setTimeout(() => {
      console.log('🎯 Final restoration state set:', {
        hasData: !!(item.mistakes?.length || item.markingSummary),
        mistakesCount: item.mistakes?.length || 0,
        documentMode: !!item.documentPages?.length,
        textOnlyMode: !item.documentPages?.length,
        hasDocumentPages: !!item.documentPages?.length,
        isProcessingStarted: true,
        restorationComplete: true,
        currentPage: item.currentPage || 0
      });
      
      // Clear restoration flag
      setIsRestoringFromHistory(false);
      
      // Final check that loading is false and content should be visible
      console.log('🔍 Post-restoration final state check:', {
        loading: false, // Should be false
        isProcessingStarted: true, // Should be true
        overallProcessingComplete: true, // Should be true  
        file: !!item.documentPages?.length || !!item.file, // Should be true for docs
        documentPages: item.documentPages?.length || 0,
        extractedTexts: item.extractedTexts?.length || 0,
        pageMistakes: item.pageMistakes?.length || 0,
        markingSummary: !!item.markingSummary,
        textOnlyMode: !item.documentPages?.length,
        isRestoringFromHistory: false
      });
    }, 500);
    
  };

  useEffect(() => {
    if (selectedHistoryItem) {
      loadFromHistory(selectedHistoryItem);
    }
  }, [selectedHistoryItem]);

  // Function to delete history item from database
  const deleteHistoryItem = async (id: string) => {
    try {
      console.log('🗑️ Deleting history item from database:', id);
      
      // First update UI optimistically for better UX
      const itemToDelete = mistakeHistory.find(item => item.id === id);
      if (itemToDelete) {
        setMistakeHistory(prev => prev.filter(item => item.id !== id));
        console.log('🎯 Optimistically removed item from UI:', itemToDelete.fileName);
      }
      
      const result = await deleteMistakeCheck(id, user, session);
      console.log('🗑️ Delete API result:', result);
      
      if (result.success) {
        console.log('✅ Successfully deleted from database');
        
        // Also remove from localStorage for backward compatibility
        const updatedHistory = mistakeHistory.filter(item => item.id !== id);
        localStorage.setItem('mistakeHistory', JSON.stringify(updatedHistory));
        
        showSuccess(`Successfully deleted "${itemToDelete?.fileName || 'item'}"`);
      } else {
        console.error('❌ Failed to delete from database:', result.error);
        
        // Revert the optimistic update since delete failed
        if (itemToDelete) {
          setMistakeHistory(prev => {
            const exists = prev.find(item => item.id === id);
            return exists ? prev : [...prev, itemToDelete].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
          });
        }
        
        showError('Failed to delete from database: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Delete error:', error);
      
      // Revert the optimistic update since delete failed
      const itemToRestore = mistakeHistory.find(item => item.id === id);
      if (itemToRestore) {
        setMistakeHistory(prev => {
          const exists = prev.find(item => item.id === id);
          return exists ? prev : [...prev, itemToRestore].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        });
      }
      
      showError('Failed to delete history item: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Function to clear all history
  const clearAllHistory = async () => {
    try {
      console.log('🗑️ Clearing all history...');
      
      // Delete all items from database in parallel
      const deletePromises = mistakeHistory.map(item => deleteMistakeCheck(item.id, user, session));
      const results = await Promise.allSettled(deletePromises);
      
      const successCount = results.filter(result => 
        result.status === 'fulfilled' && result.value.success
      ).length;
      
      console.log(`✅ Successfully deleted ${successCount}/${mistakeHistory.length} items from database`);
      
      // Clear local state regardless of database results
      setMistakeHistory([]);
      localStorage.removeItem('mistakeHistory');
      
      if (successCount === mistakeHistory.length) {
        showSuccess('All history cleared successfully!');
      } else if (successCount > 0) {
        showSuccess(`Cleared ${successCount} items, some items may have failed to delete from database`);
      } else {
        showError('Failed to clear history from database, but cleared locally');
      }
    } catch (error) {
      console.error('❌ Clear all history error:', error);
      
      // Fallback: clear locally
      setMistakeHistory([]);
      localStorage.removeItem('mistakeHistory');
      showError('Failed to clear database history, but cleared locally');
    }
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

  // Auto-correct functionality
  const generateCorrectedText = (originalText: string, mistakes: Mistake[]): string => {
    let corrected = originalText;
    
    // Sort mistakes by position (longest incorrect text first to avoid replacement conflicts)
    const sortedMistakes = [...mistakes].sort((a, b) => b.incorrect.length - a.incorrect.length);
    
    sortedMistakes.forEach(mistake => {
      // Use global replace to fix all instances of the mistake
      const regex = new RegExp(mistake.incorrect.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      corrected = corrected.replace(regex, mistake.correct);
    });
    
    return corrected;
  };

  const applyAutoCorrect = () => {
    if (textOnlyMode && directText && pageMistakes[0]?.mistakes) {
      const corrected = generateCorrectedText(directText, pageMistakes[0].mistakes);
      setCorrectedText(corrected);
      setShowCorrectedText(true);
      showSuccess('Auto-corrections applied successfully!');
    } else if (extractedTexts.length > 0) {
      // For document mode, apply corrections to all pages
      const allMistakes = pageMistakes.flatMap(pm => pm.mistakes);
      const allText = extractedTexts.map(et => et.text).join('\n\n--- Page Break ---\n\n');
      const corrected = generateCorrectedText(allText, allMistakes);
      setCorrectedText(corrected);
      setShowCorrectedText(true);
      showSuccess('Auto-corrections applied to all pages!');
    }
  };

  const focusMistake = (mistakeId: number) => {
    setSelectedMistakeId(selectedMistakeId === mistakeId ? null : mistakeId);
    requestAnimationFrame(() => {
      const key = `${currentPage}-${mistakeId}`;
      const target = mistakeCardRefs.current[key];
      target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  const getCurrentDisplayText = () => {
    if (showCorrectedText && correctedText) {
      return correctedText;
    }
    
    if (textOnlyMode) {
      return extractedTexts[0]?.text || directText;
    }
    
    return extractedTexts[currentPage]?.text || '';
  };

  const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const collectMistakeMatches = (text: string, mistakes: Mistake[]) => {
    if (!text || mistakes.length === 0) return [] as Array<{ start: number; end: number; mistake: Mistake }>;
    const loweredText = text.toLowerCase();
    const rawMatches: Array<{ start: number; end: number; mistake: Mistake }> = [];

    mistakes.forEach((mistake) => {
      const incorrect = typeof mistake.incorrect === 'string' ? mistake.incorrect.trim() : '';
      if (!incorrect) return;
      const target = incorrect.toLowerCase();
      let fromIndex = 0;
      while (fromIndex < loweredText.length) {
        const foundIndex = loweredText.indexOf(target, fromIndex);
        if (foundIndex === -1) break;
        rawMatches.push({
          start: foundIndex,
          end: foundIndex + target.length,
          mistake
        });
        fromIndex = foundIndex + Math.max(1, target.length);
      }
    });

    return rawMatches
      .sort((a, b) => {
        if (a.start !== b.start) return a.start - b.start;
        return (b.end - b.start) - (a.end - a.start);
      })
      .reduce((acc: Array<{ start: number; end: number; mistake: Mistake }>, match) => {
        const last = acc[acc.length - 1];
        if (!last || match.start >= last.end) {
          acc.push(match);
        }
        return acc;
      }, []);
  };

  const getOverlayLineHighlight = (lineText: string, mistakes: Mistake[], applyCorrection = false) => {
    if (!lineText || mistakes.length === 0) {
      return {
        hasMistake: false,
        type: 'other',
        displayText: lineText,
        tooltip: '',
        matchedMistakeId: null as number | null,
        ranges: [] as Array<{ start: number; end: number; type: string; mistakeId: number }>
      };
    }
    const lineMatches = collectMistakeMatches(lineText, mistakes);
    const matchedMistakes = lineMatches.map((match) => match.mistake);

    if (matchedMistakes.length === 0) {
      return {
        hasMistake: false,
        type: 'other',
        displayText: lineText,
        tooltip: '',
        matchedMistakeId: null as number | null,
        ranges: [] as Array<{ start: number; end: number; type: string; mistakeId: number }>
      };
    }

    let correctedLine = lineText;
    if (applyCorrection) {
      matchedMistakes.forEach((mistake) => {
        correctedLine = correctedLine.replace(
          new RegExp(escapeRegExp(mistake.incorrect), 'gi'),
          mistake.correct
        );
      });
    }

    const type = normalizeMistakeType(matchedMistakes[0]?.type);
    const tooltip = matchedMistakes.map((mistake) => `${mistake.incorrect} → ${mistake.correct}`).join(' | ');
    const ranges = lineMatches.map((match) => ({
      start: match.start,
      end: match.end,
      type: normalizeMistakeType(match.mistake.type),
      mistakeId: match.mistake.id
    }));

    return {
      hasMistake: true,
      type,
      displayText: applyCorrection ? correctedLine : lineText,
      tooltip,
      matchedMistakeId: ranges[0]?.mistakeId || null,
      ranges
    };
  };

  const injectHighlightMarkup = (value: string, mistakes: Mistake[], mode: 'original' | 'corrected') => {
    if (!value || mistakes.length === 0) return value;
    let output = value;
    const sorted = [...mistakes].sort((a, b) => {
      const aLen = mode === 'corrected' ? a.correct.length : a.incorrect.length;
      const bLen = mode === 'corrected' ? b.correct.length : b.incorrect.length;
      return bLen - aLen;
    });
    sorted.forEach((mistake) => {
      const target = mode === 'corrected' ? mistake.correct : mistake.incorrect;
      if (!target) return;
      const className = mode === 'corrected'
        ? 'bg-emerald-500/25 border-b-2 border-emerald-500 rounded px-1'
        : 'bg-red-500/25 border-b-2 border-red-500 rounded px-1';
      output = output.replace(new RegExp(escapeRegExp(target), 'g'), `<span class="${className}">${target}</span>`);
    });
    return output;
  };

  const renderMarkdownText = (value: string, className: string, mistakes: Mistake[] = [], mode: 'original' | 'corrected' = 'original') => (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex]}
      >
        {injectHighlightMarkup(
          value
          .replace(/\\\[([\s\S]*?)\\\]/g, (_, eq) => `$$${eq}$$`)
          .replace(/\\\(([\s\S]*?)\\\)/g, (_, eq) => `$${eq}$`),
          mistakes,
          mode
        )}
      </ReactMarkdown>
    </div>
  );

  const isLikelyMarkdown = (text: string) => {
    if (!text) return false;
    return /(^|\n)\s*#{1,6}\s+|(\*\*|__|`{1,3}|^\s*[-*+]\s+|^\s*\d+\.\s+|\[[^\]]+\]\([^)]+\)|\|.+\||\\\(|\\\[)/m.test(text);
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

  const convertDocxToImages = async (file: File): Promise<string[]> => {
    setProcessingStatus('Loading DOCX...');
    const buffer = await file.arrayBuffer();
    const offscreenContainer = document.createElement('div');
    offscreenContainer.style.position = 'fixed';
    offscreenContainer.style.left = '-100000px';
    offscreenContainer.style.top = '0';
    offscreenContainer.style.width = '900px';
    offscreenContainer.style.background = '#ffffff';
    offscreenContainer.style.zIndex = '-1';
    document.body.appendChild(offscreenContainer);

    try {
      const extracted = await mammoth.extractRawText({ arrayBuffer: buffer });
      const pageTexts = extracted.value
        .split('\f')
        .map((page: string) => page.trim())
        .filter((page: string) => page.length > 0);
      const targetPages = pageTexts.length > 0 ? pageTexts : [extracted.value.trim() || file.name];
      const images: string[] = [];

      for (let index = 0; index < targetPages.length; index++) {
        const pageBlock = document.createElement('div');
        pageBlock.style.width = '800px';
        pageBlock.style.minHeight = '1120px';
        pageBlock.style.background = '#ffffff';
        pageBlock.style.border = '1px solid #e5e7eb';
        pageBlock.style.borderRadius = '8px';
        pageBlock.style.padding = '48px 56px';
        pageBlock.style.whiteSpace = 'pre-wrap';
        pageBlock.style.fontFamily = 'Arial, sans-serif';
        pageBlock.style.fontSize = '16px';
        pageBlock.style.lineHeight = '1.5';
        pageBlock.style.color = '#111827';
        pageBlock.textContent = targetPages[index];
        offscreenContainer.appendChild(pageBlock);
        setProcessingStatus(`Converting DOCX page ${index + 1} of ${targetPages.length}...`);
        const canvas = await html2canvas(pageBlock, {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
          logging: false
        });
        images.push(canvas.toDataURL('image/jpeg', 0.92));
        offscreenContainer.removeChild(pageBlock);
      }

      setProcessingStatus('DOCX conversion completed!');
      return images;
    } catch (error) {
      console.error('DOCX conversion error:', error);
      setProcessingStatus('Error converting DOCX');
      throw error;
    } finally {
      document.body.removeChild(offscreenContainer);
    }
  };

  const getPdfPageCount = async (targetFile: File): Promise<number> => {
    const arrayBuffer = await targetFile.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true
    });
    const pdf = await loadingTask.promise as PDFDocumentProxy;
    return pdf.numPages;
  };

  const getWordDocumentPageCount = async (targetFile: File): Promise<number> => {
    const arrayBuffer = await targetFile.arrayBuffer();
    const extracted = await mammoth.extractRawText({ arrayBuffer });
    const rawText = (extracted.value || '').trim();
    const explicitPages = rawText
      .split('\f')
      .map((page: string) => page.trim())
      .filter((page: string) => page.length > 0);

    if (explicitPages.length > 0) {
      return explicitPages.length;
    }

    if (!rawText) {
      return 1;
    }

    const words = rawText.split(/\s+/).filter(Boolean).length;
    const estimatedByWords = Math.ceil(words / 450);
    const estimatedByChars = Math.ceil(rawText.length / 2500);
    return Math.max(1, estimatedByWords, estimatedByChars);
  };

  // Extract text from page using OCR API
  const extractTextFromPage = async (imageUrl: string, pageNumber: number): Promise<string> => {
    console.log(`📝 Starting text extraction for page ${pageNumber}`);
    
    try {
      const response = await fetch(process.env.REACT_APP_DASHSCOPE_ENDPOINT || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_DASHSCOPE_API_KEY || ''}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: "doubao-seed-1-6-vision-250815",
          messages: [
            {
              role: "system",
              content: [
                {
                  type: "text",
                  text: "You are an OCR (Optical Character Recognition) system. Extract ALL text from the image exactly as it appears, maintaining the original formatting, spacing, and structure. Do not add any explanations, corrections, or analysis. Only return the extracted text."
                }
              ]
            },
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: imageUrl
                  }
                },
                {
                  type: "text",
                  text: "Extract all text from this image exactly as it appears. Maintain original formatting and structure. Return only the extracted text with no additional commentary."
                }
              ]
            }
          ],
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const extractedText = data.choices?.[0]?.message?.content || '';
      
      console.log(`✅ Text extraction completed for page ${pageNumber}`);
      return extractedText;

    } catch (error) {
      console.error(`💥 Error in extractTextFromPage for page ${pageNumber}:`, error);
      throw new Error(`Failed to extract text: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Highlight mistakes in extracted text
  const highlightMistakesInText = (text: string, mistakes: Mistake[]): HighlightedText[] => {
    if (!text || mistakes.length === 0) {
      return [{ text, isHighlighted: false }];
    }

    let highlightedParts: HighlightedText[] = [];
    let lastIndex = 0;

    const matchedRanges = collectMistakeMatches(text, mistakes);

    for (const match of matchedRanges) {
      const startIndex = match.start;

      if (startIndex > lastIndex) {
        highlightedParts.push({
          text: text.substring(lastIndex, startIndex),
          isHighlighted: false
        });
      }

      highlightedParts.push({
        text: text.substring(match.start, match.end),
        isHighlighted: true,
        mistakeType: match.mistake.type,
        correction: match.mistake.correct,
        isSelected: selectedMistakeId === match.mistake.id,
        mistakeId: match.mistake.id
      });

      lastIndex = match.end;
    }

    if (lastIndex < text.length) {
      highlightedParts.push({
        text: text.substring(lastIndex),
        isHighlighted: false
      });
    }
    
    return highlightedParts.filter(part => part.text.length > 0);
  };

  // Auto-scroll to bottom of mistakes container
  const scrollToBottom = () => {
    if (mistakesContainerRef.current) {
      const container = mistakesContainerRef.current;
      setTimeout(() => {
        // Scroll to bottom with a little extra padding
        container.scrollTop = container.scrollHeight + 50;
      }, 100);
    }
  };

  // Check for mistakes in a page with streaming text extraction and highlighting
  const checkMistakesForPage = async (imageUrl: string, pageNumber: number): Promise<Mistake[]> => {
    console.log(`🔄 Starting mistake checking for page ${pageNumber}`);
    
    try {
      const systemPrompt = "You are an expert proofreader with OCR capabilities. First, extract ALL text from the image exactly as it appears. Then identify ONLY actual mistakes in that text. Respond in this EXACT format:\n\nEXTRACTED_TEXT:\n[exact text from image]\n\nMISTAKES:\nMISTAKE: [incorrect text]\nCORRECTION: [corrected text]\nTYPE: [grammar/spelling/punctuation]\n\nBe precise and only show actual errors.";
      
      const userPrompt = "Extract all text from this image and then find mistakes. Use the exact format specified: first EXTRACTED_TEXT section, then MISTAKES section.";

      const response = await fetch(process.env.REACT_APP_DASHSCOPE_ENDPOINT || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_DASHSCOPE_API_KEY || ''}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: "doubao-seed-1-6-vision-250815",
          messages: [
            {
              role: "system",
              content: [
                {
                  type: "text",
                  text: systemPrompt
                }
              ]
            },
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: imageUrl
                  }
                },
                {
                  type: "text",
                  text: userPrompt
                }
              ]
            }
          ],
          stream: true
        })
      });

      console.log(`📊 API Response status for page ${pageNumber}:`, response.status);

      if (!response.ok) {
        console.error(`❌ API request failed for page ${pageNumber}:`, response.status, response.statusText);
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      let fullContent = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log(`🏁 Streaming completed for page ${pageNumber}`);
            break;
          }

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                console.log(`✅ Stream marked as DONE for page ${pageNumber}`);
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                const content_chunk = parsed.choices?.[0]?.delta?.content;

                if (content_chunk) {
                  fullContent += content_chunk;
                  
                  // Parse and update both text and mistakes in real-time
                  const { extractedText, mistakes } = parseTextAndMistakes(fullContent);
                  
                  // Update extracted text
                  if (extractedText) {
                    setExtractedTexts(prev => prev.map(et => 
                      et.pageNumber === pageNumber 
                        ? { ...et, text: extractedText, isLoading: true, isComplete: false }
                        : et
                    ));
                  }
                  
                  // Update mistakes
                  setPageMistakes(prev => prev.map(pm => 
                    pm.pageNumber === pageNumber 
                      ? { ...pm, mistakes, isLoading: true }
                      : pm
                  ));
                  
                  // Auto-scroll to show latest content
                  if (mistakesContainerRef.current && pageNumber === currentPage + 1) {
                    setTimeout(scrollToBottom, 100);
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

      console.log(`✅ Mistake checking completed for page ${pageNumber}`);
      console.log('📊 Final content length:', fullContent.length);

      // Parse the final response to extract structured mistakes
      const { extractedText, mistakes } = parseTextAndMistakes(fullContent);
      
      // Final update for extracted text
      setExtractedTexts(prev => prev.map(et => 
        et.pageNumber === pageNumber 
          ? { ...et, text: extractedText, isLoading: false, isComplete: true }
          : et
      ));
      
      return mistakes;

    } catch (error) {
      console.error(`💥 Error in checkMistakesForPage for page ${pageNumber}:`, error);
      throw new Error(`Failed to check mistakes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const normalizeMistakeType = (value: string | undefined) => {
    const normalized = (value || 'other').toLowerCase();
    if (normalized === 'grammar' || normalized === 'spelling' || normalized === 'punctuation' || normalized === 'other') {
      return normalized;
    }
    return 'other';
  };

  const parseJsonBlock = (input: string): any | null => {
    const trimmed = input.trim();
    if (!trimmed) return null;
    try {
      return JSON.parse(trimmed);
    } catch {}

    const fencedMatch = trimmed.match(/```json\s*([\s\S]*?)```/i) || trimmed.match(/```\s*([\s\S]*?)```/i);
    if (fencedMatch?.[1]) {
      try {
        return JSON.parse(fencedMatch[1].trim());
      } catch {}
    }

    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(trimmed.slice(start, end + 1));
      } catch {}
    }
    const arrayStart = trimmed.indexOf('[');
    const arrayEnd = trimmed.lastIndexOf(']');
    if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
      try {
        return JSON.parse(trimmed.slice(arrayStart, arrayEnd + 1));
      } catch {}
    }
    return null;
  };

  const normalizeOcrPages = (value: any): OcrPageData[] => {
    if (!Array.isArray(value)) return [];

    const parseNumber = (input: any) => (typeof input === 'number' && Number.isFinite(input) ? input : 0);

    return value
      .map((entry: any, index: number): OcrPageData | null => {
        if (!entry || typeof entry !== 'object') return null;
        const width = parseNumber(entry.width);
        const height = parseNumber(entry.height);
        const page = parseNumber(entry.page) || index + 1;
        const rawResults = Array.isArray(entry.results) ? entry.results : [];

        const results = rawResults
          .map((line: any): OcrResultLine | null => {
            if (!line || typeof line !== 'object' || typeof line.text !== 'string') return null;
            const rawBbox = line.bbox && typeof line.bbox === 'object' ? line.bbox : null;
            const bbox = rawBbox
              ? {
                  x_min: parseNumber(rawBbox.x_min),
                  y_min: parseNumber(rawBbox.y_min),
                  x_max: parseNumber(rawBbox.x_max),
                  y_max: parseNumber(rawBbox.y_max),
                  width: parseNumber(rawBbox.width),
                  height: parseNumber(rawBbox.height)
                }
              : undefined;
            const polygon = Array.isArray(line.polygon)
              ? line.polygon
                  .filter((point: any) => Array.isArray(point) && point.length >= 2)
                  .map((point: any) => [parseNumber(point[0]), parseNumber(point[1])])
              : undefined;

            return {
              text: line.text,
              score: typeof line.score === 'number' ? line.score : undefined,
              polygon,
              bbox
            };
          })
          .filter((line: OcrResultLine | null): line is OcrResultLine => Boolean(line));

        return {
          page,
          width,
          height,
          results
        };
      })
      .filter((page: OcrPageData | null): page is OcrPageData => Boolean(page));
  };

  const extractTextFromOcrPages = (ocrPages: OcrPageData[]): string => {
    if (!Array.isArray(ocrPages) || ocrPages.length === 0) return '';
    return ocrPages
      .slice()
      .sort((a, b) => a.page - b.page)
      .map((page) => page.results.map((line) => line.text).filter(Boolean).join('\n').trim())
      .filter(Boolean)
      .join('\n\n');
  };

  const renderOcrPagesToImages = async (ocrPages: OcrPageData[]): Promise<string[]> => {
    const pages = ocrPages.slice().sort((a, b) => a.page - b.page);
    const images: string[] = [];
    for (const page of pages) {
      const width = page.width > 0 ? page.width : 1200;
      const height = page.height > 0 ? page.height : 1600;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#111827';
      page.results.forEach((line) => {
        const bbox = line.bbox;
        const fontSize = bbox && bbox.height > 8 ? Math.min(42, Math.max(11, Math.round(bbox.height * 0.8))) : 18;
        ctx.font = `${fontSize}px Arial`;
        const x = bbox ? Math.max(4, bbox.x_min) : 20;
        const y = bbox ? Math.max(fontSize, bbox.y_max) : 40;
        ctx.fillText(line.text, x, y);
      });
      images.push(canvas.toDataURL('image/jpeg', 0.92));
    }
    return images;
  };

  const normalizeMarkingSchemes = (value: any): Record<string, MarkingSchemeResult> => {
    if (!value || typeof value !== 'object') return {};
    const entries = Object.entries(value);
    const output: Record<string, MarkingSchemeResult> = {};

    const mapSchemeKey = (rawKey: string) => {
      const normalized = rawKey.toLowerCase().replace(/[\s_-]+/g, '');
      if (normalized === 'hkdse') return 'hkdse';
      if (normalized === 'alevel' || normalized === 'gcealevel') return 'alevel';
      if (normalized === 'gre') return 'gre';
      return rawKey.toLowerCase();
    };

    const toNumber = (input: any) => (typeof input === 'number' && Number.isFinite(input) ? input : 0);

    entries.forEach(([key, rawValue]) => {
      if (!rawValue || typeof rawValue !== 'object') return;
      const score = toNumber((rawValue as any).score ?? (rawValue as any).totalScore);
      const maxScore = toNumber((rawValue as any).maxScore || (rawValue as any).total);
      const explicitPercentage = toNumber((rawValue as any).percentage);
      const percentage = explicitPercentage || (maxScore > 0 ? (score / maxScore) * 100 : 0);
      const criteriaRaw = (rawValue as any).criteria;
      const criteria: MarkingCriteriaBreakdown | undefined = criteriaRaw && typeof criteriaRaw === 'object'
        ? Object.entries(criteriaRaw).reduce((acc, [criteriaKey, criteriaValue]) => {
            if (typeof criteriaValue === 'number' && Number.isFinite(criteriaValue)) {
              acc[criteriaKey] = criteriaValue;
            }
            return acc;
          }, {} as MarkingCriteriaBreakdown)
        : undefined;

      output[mapSchemeKey(key)] = {
        score,
        maxScore,
        percentage,
        grade: typeof (rawValue as any).grade === 'string' ? (rawValue as any).grade : undefined,
        feedback: typeof (rawValue as any).feedback === 'string' ? (rawValue as any).feedback : undefined,
        criteria
      };
    });

    return output;
  };

  const parseWebhookPayload = (text: string): { rootPayload: any; normalizedPayload: any; ocrPages: OcrPageData[]; markingSchemes: Record<string, MarkingSchemeResult> } => {
    const parsedJson = parseJsonBlock(text);
    let rootPayload: any = parsedJson;
    if (Array.isArray(rootPayload) && rootPayload.length > 0) {
      rootPayload = rootPayload[0];
    }

    let normalizedPayload: any = rootPayload;
    if (normalizedPayload && typeof normalizedPayload === 'object' && typeof normalizedPayload.output === 'string') {
      const nestedPayload = parseJsonBlock(normalizedPayload.output as string);
      if (nestedPayload && typeof nestedPayload === 'object') {
        normalizedPayload = nestedPayload;
      }
    }

    const ocrPages = normalizeOcrPages(rootPayload?.data) || [];
    const rootMarking = normalizeMarkingSchemes(rootPayload?.markingSchemes || rootPayload?.marking?.schemes || rootPayload?.marking);
    const nestedMarking = normalizeMarkingSchemes(normalizedPayload?.markingSchemes || normalizedPayload?.marking?.schemes || normalizedPayload?.marking);
    const markingSchemes = Object.keys(nestedMarking).length > 0 ? nestedMarking : rootMarking;
    if (ocrPages.length === 0) {
      return {
        rootPayload,
        normalizedPayload,
        ocrPages: normalizeOcrPages(normalizedPayload?.data),
        markingSchemes
      };
    }
    return { rootPayload, normalizedPayload, ocrPages, markingSchemes };
  };

  const parseTextAndMistakes = (text: string): { extractedText: string; mistakes: Mistake[]; ocrPages: OcrPageData[]; markingSchemes: Record<string, MarkingSchemeResult>; normalizedPayload?: any; rootPayload?: any } => {
    const { rootPayload, normalizedPayload, ocrPages, markingSchemes } = parseWebhookPayload(text);

    if (normalizedPayload && typeof normalizedPayload === 'object') {
      const ocrDerivedText = extractTextFromOcrPages(ocrPages);
      const extractedText = typeof normalizedPayload.extractedText === 'string'
        ? normalizedPayload.extractedText
        : typeof normalizedPayload.extracted_text === 'string'
          ? normalizedPayload.extracted_text
          : typeof normalizedPayload.text === 'string'
            ? normalizedPayload.text
            : ocrDerivedText;

      const candidateMistakes = Array.isArray(normalizedPayload.mistakes)
        ? normalizedPayload.mistakes
        : Array.isArray(normalizedPayload.errors)
          ? normalizedPayload.errors
          : [];

      const mistakes = candidateMistakes
        .map((item: any, index: number): Mistake | null => {
          const incorrect = typeof item?.incorrect === 'string'
            ? item.incorrect
            : typeof item?.mistake === 'string'
              ? item.mistake
              : typeof item?.original === 'string'
                ? item.original
                : '';
          const correct = typeof item?.correction === 'string'
            ? item.correction
            : typeof item?.correct === 'string'
              ? item.correct
              : typeof item?.suggestion === 'string'
                ? item.suggestion
                : '';
          if (!incorrect || !correct) return null;
          return {
            id: index + 1,
            incorrect: incorrect.trim(),
            correct: correct.trim(),
            type: normalizeMistakeType(item?.type),
            explanation: typeof item?.explanation === 'string' ? item.explanation : undefined,
            severity: typeof item?.severity === 'string' ? item.severity : undefined,
            startIndex: typeof item?.startIndex === 'number' ? item.startIndex : undefined,
            endIndex: typeof item?.endIndex === 'number' ? item.endIndex : undefined,
            lineNumber: typeof item?.lineNumber === 'number' ? item.lineNumber : undefined
          };
        })
        .filter((mistake: Mistake | null): mistake is Mistake => Boolean(mistake));

      return { extractedText: extractedText.trim(), mistakes, ocrPages, markingSchemes, normalizedPayload, rootPayload };
    }

    let extractedText = '';
    const mistakes: Mistake[] = [];
    let mistakeId = 1;
    const extractedTextMatch = text.match(/EXTRACTED_TEXT:\s*([\s\S]*?)(?=MISTAKES:|$)/);
    if (extractedTextMatch) {
      extractedText = extractedTextMatch[1].trim();
    }
    const mistakesMatch = text.match(/MISTAKES:\s*([\s\S]*)/);
    if (mistakesMatch) {
      const mistakesText = mistakesMatch[1];
      const lines = mistakesText.split('\n');
      let currentMistake: Partial<Mistake> = {};
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('MISTAKE:')) {
          if (currentMistake.incorrect && currentMistake.correct) {
            mistakes.push({
              id: mistakeId++,
              incorrect: currentMistake.incorrect,
              correct: currentMistake.correct,
              type: normalizeMistakeType(currentMistake.type)
            });
          }
          currentMistake = {
            incorrect: trimmedLine.replace('MISTAKE:', '').trim()
          };
        } else if (trimmedLine.startsWith('CORRECTION:')) {
          currentMistake.correct = trimmedLine.replace('CORRECTION:', '').trim();
        } else if (trimmedLine.startsWith('TYPE:')) {
          currentMistake.type = trimmedLine.replace('TYPE:', '').trim();
        }
      }
      if (currentMistake.incorrect && currentMistake.correct) {
        mistakes.push({
          id: mistakeId++,
          incorrect: currentMistake.incorrect,
          correct: currentMistake.correct,
          type: normalizeMistakeType(currentMistake.type)
        });
      }
    }
    return { extractedText: extractedText || extractTextFromOcrPages(ocrPages), mistakes, ocrPages, markingSchemes, normalizedPayload, rootPayload };
  };

  const parseMistakesFromText = (text: string, pageNumber: number): Mistake[] => {
    return parseTextAndMistakes(text).mistakes;
  };

  // Teacher marking functions
  const markPageForTeacher = async (imageUrl: string, pageNumber: number, markingStandard: MarkingStandard): Promise<PageMarking> => {
    console.log(`🎯 Starting teacher marking for page ${pageNumber} with ${markingStandard.name} standard`);
    
    try {
      const response = await fetch(process.env.REACT_APP_DASHSCOPE_ENDPOINT || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_DASHSCOPE_API_KEY || ''}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: "doubao-seed-1-6-vision-250815",
          messages: [
            {
              role: "system",
              content: [
                {
                  type: "text",
                  text: `You are an experienced teacher using the ${markingStandard.name} marking standard. 

Marking Criteria (out of 100%):
- Accuracy: ${markingStandard.criteria.accuracy}%
- Presentation: ${markingStandard.criteria.presentation}%
- Methodology: ${markingStandard.criteria.methodology}%
- Understanding: ${markingStandard.criteria.understanding}%

Grade Scale: ${markingStandard.gradingScale.max} (max), ${markingStandard.gradingScale.passingGrade} (passing)

For each question in the image, provide marks in this EXACT format:

QUESTION: [question number]
MAX_MARKS: [total marks for this question]
AWARDED_MARKS: [marks given]
ACCURACY: [score out of ${markingStandard.criteria.accuracy}]
PRESENTATION: [score out of ${markingStandard.criteria.presentation}]
METHODOLOGY: [score out of ${markingStandard.criteria.methodology}]
UNDERSTANDING: [score out of ${markingStandard.criteria.understanding}]
MISTAKES: [list any mistakes found]
FEEDBACK: [specific feedback for improvement]

Be thorough and fair in your assessment.`
                }
              ]
            },
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: imageUrl
                  }
                },
                {
                  type: "text",
                  text: `Please mark this page according to ${markingStandard.name} standards. Identify each question, assess the student's work, and provide detailed marking with feedback. Use the exact format specified in the system message.`
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
                  
                  // Update page markings in real-time
                  setPageMistakes(prev => prev.map(pm => 
                    pm.pageNumber === pageNumber 
                      ? { 
                          ...pm, 
                          questions: parseMarkingFromText(fullContent, markingStandard),
                          isLoading: true 
                        }
                      : pm
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

      // Parse the final response
      const questions = parseMarkingFromText(fullContent, markingStandard);
      const totalMarks = questions.reduce((sum, q) => sum + q.awardedMarks, 0);
      const maxMarks = questions.reduce((sum, q) => sum + q.maxMarks, 0);

      return {
        pageNumber,
        questions,
        totalMarks,
        maxMarks,
        isLoading: false,
        isComplete: true
      };

    } catch (error) {
      console.error(`Error marking page ${pageNumber}:`, error);
      throw error;
    }
  };

  const parseMarkingFromText = (text: string, markingStandard: MarkingStandard): QuestionMark[] => {
    const questions: QuestionMark[] = [];
    const lines = text.split('\n');
    let currentQuestion: Partial<QuestionMark> = {};
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('QUESTION:')) {
        // Save previous question if complete
        if (currentQuestion.questionNumber && currentQuestion.maxMarks && currentQuestion.awardedMarks !== undefined) {
          questions.push({
            questionNumber: currentQuestion.questionNumber,
            maxMarks: currentQuestion.maxMarks,
            awardedMarks: currentQuestion.awardedMarks,
            mistakes: currentQuestion.mistakes || [],
            feedback: currentQuestion.feedback || '',
            criteria: currentQuestion.criteria || { accuracy: 0, presentation: 0, methodology: 0, understanding: 0 }
          });
        }
        
        // Start new question
        currentQuestion = {
          questionNumber: parseInt(trimmedLine.replace('QUESTION:', '').trim()) || 1,
          criteria: { accuracy: 0, presentation: 0, methodology: 0, understanding: 0 },
          mistakes: []
        };
      } else if (trimmedLine.startsWith('MAX_MARKS:')) {
        currentQuestion.maxMarks = parseInt(trimmedLine.replace('MAX_MARKS:', '').trim()) || 0;
      } else if (trimmedLine.startsWith('AWARDED_MARKS:')) {
        currentQuestion.awardedMarks = parseInt(trimmedLine.replace('AWARDED_MARKS:', '').trim()) || 0;
      } else if (trimmedLine.startsWith('ACCURACY:')) {
        if (currentQuestion.criteria) {
          currentQuestion.criteria.accuracy = parseInt(trimmedLine.replace('ACCURACY:', '').trim()) || 0;
        }
      } else if (trimmedLine.startsWith('PRESENTATION:')) {
        if (currentQuestion.criteria) {
          currentQuestion.criteria.presentation = parseInt(trimmedLine.replace('PRESENTATION:', '').trim()) || 0;
        }
      } else if (trimmedLine.startsWith('METHODOLOGY:')) {
        if (currentQuestion.criteria) {
          currentQuestion.criteria.methodology = parseInt(trimmedLine.replace('METHODOLOGY:', '').trim()) || 0;
        }
      } else if (trimmedLine.startsWith('UNDERSTANDING:')) {
        if (currentQuestion.criteria) {
          currentQuestion.criteria.understanding = parseInt(trimmedLine.replace('UNDERSTANDING:', '').trim()) || 0;
        }
      } else if (trimmedLine.startsWith('FEEDBACK:')) {
        currentQuestion.feedback = trimmedLine.replace('FEEDBACK:', '').trim();
      }
    }
    
    // Add the last question
    if (currentQuestion.questionNumber && currentQuestion.maxMarks && currentQuestion.awardedMarks !== undefined) {
      questions.push({
        questionNumber: currentQuestion.questionNumber,
        maxMarks: currentQuestion.maxMarks,
        awardedMarks: currentQuestion.awardedMarks,
        mistakes: currentQuestion.mistakes || [],
        feedback: currentQuestion.feedback || '',
        criteria: currentQuestion.criteria || { accuracy: 0, presentation: 0, methodology: 0, understanding: 0 }
      });
    }
    
    return questions;
  };

  const generateMarkingSummary = (pageMarkings: PageMarking[], markingStandard: MarkingStandard): MarkingSummary => {
    const totalMarks = pageMarkings.reduce((sum, pm) => sum + pm.totalMarks, 0);
    const maxMarks = pageMarkings.reduce((sum, pm) => sum + pm.maxMarks, 0);
    const percentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;

    // Determine grade based on percentage and marking standard
    const { gradingScale } = markingStandard;
    let grade = 'F';
    
    for (const [threshold, gradeLabel] of Object.entries(gradingScale.gradeLabels).reverse()) {
      if (percentage >= parseInt(threshold)) {
        grade = gradeLabel;
        break;
      }
    }

    // Analyze mistakes for strengths and weaknesses
    const allMistakes = pageMarkings.flatMap(pm => 
      pm.questions.flatMap(q => q.mistakes)
    );

    const mistakeTypes = allMistakes.reduce((acc, mistake) => {
      acc[mistake.type] = (acc[mistake.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (mistakeTypes['grammar'] === 0 || !mistakeTypes['grammar']) {
      strengths.push('Excellent grammar usage');
    } else if (mistakeTypes['grammar'] > 5) {
      weaknesses.push('Grammar needs improvement');
    }

    if (mistakeTypes['spelling'] === 0 || !mistakeTypes['spelling']) {
      strengths.push('Strong spelling accuracy');
    } else if (mistakeTypes['spelling'] > 3) {
      weaknesses.push('Spelling requires attention');
    }

    if (mistakeTypes['punctuation'] === 0 || !mistakeTypes['punctuation']) {
      strengths.push('Proper punctuation usage');
    } else if (mistakeTypes['punctuation'] > 4) {
      weaknesses.push('Punctuation needs work');
    }

    // Generate recommendations
    const recommendations = [
      'Review and practice areas of weakness',
      'Continue building on demonstrated strengths',
      'Seek additional help for challenging concepts'
    ];

    if (weaknesses.includes('Grammar needs improvement')) {
      recommendations.push('Focus on grammar exercises and rules');
    }
    if (weaknesses.includes('Spelling requires attention')) {
      recommendations.push('Use spell-check tools and practice spelling');
    }
    if (weaknesses.includes('Punctuation needs work')) {
      recommendations.push('Study punctuation rules and practice');
    }

    // Study plan
    const studyPlan = [
      {
        topic: 'Review marked work',
        priority: 'high' as const,
        description: 'Go through all marked sections and understand corrections'
      },
      {
        topic: 'Practice weak areas',
        priority: 'high' as const,
        description: 'Focus extra time on areas identified as needing improvement'
      },
      {
        topic: 'Maintain strengths',
        priority: 'medium' as const,
        description: 'Continue practicing areas where you performed well'
      }
    ];

    return {
      totalScore: totalMarks,
      maxScore: maxMarks,
      percentage,
      grade,
      strengths,
      weaknesses,
      recommendations,
      studyPlan
    };
  };

  const processFile = async (file: File) => {
    console.log('🚀 Preparing file for processing');
    console.log('📁 File details:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    });

    setLoading(true);
    setProcessingStatus('Preparing file...');
    setPageMistakes([]);
    setMarkingSummary(null);
    setOverallProcessingComplete(false);
    setIsProcessingStarted(false);
    setStreamedAiResponse('');
    setOcrOverlayPages([]);
    setN8nMarkingSchemes({});

    try {
      let pages: string[] = [];
      const isImageFile = file.type.startsWith('image/') && file.type !== 'image/gif';
      
      if (file.type === 'application/pdf') {
        console.log('📄 Processing PDF file');
        pages = await convertPdfToImages(file);
        setPdfPageCount(pages.length);
        console.log('✅ PDF converted to', pages.length, 'images');
      } else if (isImageFile) {
        console.log('🖼️ Processing image file');
        setProcessingStatus('Processing image...');
        
        // Convert image to base64 data URL instead of object URL
        const imageDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            console.log('✅ Image converted to data URL');
            resolve(result);
          };
          reader.onerror = (error) => {
            console.error('❌ Error converting image to data URL:', error);
            reject(error);
          };
          reader.readAsDataURL(file);
        });
        
        pages = [imageDataUrl];
        setPdfPageCount(0);
      } else {
        pages = [];
        setPdfPageCount(0);
      }
      
      console.log('📸 Total images prepared:', pages.length);
      setDocumentPages(pages);
      setCurrentPage(0);
      setFile(file);
      
      // Initialize page mistakes but don't start processing
      const totalAnalysisPages = pages.length > 0 ? pages.length : 1;
      const initialPageMistakes: PageMistakes[] = Array.from({ length: totalAnalysisPages }, (_, index) => ({
        pageNumber: index + 1,
        mistakes: [],
        isLoading: false,
        isComplete: false
      }));
      setPageMistakes(initialPageMistakes);

      // Initialize extracted texts
      const initialExtractedTexts: ExtractedText[] = Array.from({ length: totalAnalysisPages }, (_, index) => ({
        pageNumber: index + 1,
        text: '',
        isLoading: false,
        isComplete: false
      }));
      setExtractedTexts(initialExtractedTexts);
      
      setProcessingStatus('File ready - click "Check Mistakes" to start analysis');
      setLoading(false);

    } catch (error) {
      console.error('💥 File preparation error');
      console.error('🔴 Error message:', error instanceof Error ? error.message : String(error));
      
      setProcessingStatus('Error preparing file');
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      const isAllowed = allowedTypes.includes(selectedFile.type) || (selectedFile.type.startsWith('image/') && selectedFile.type !== 'image/gif');
      if (!isAllowed) {
        showError('Unsupported file type. Please upload image, PDF, DOC, or DOCX files.');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      let detectedPageCount = 0;
      const isPdfOrWord =
        selectedFile.type === 'application/pdf' ||
        selectedFile.type === 'application/msword' ||
        selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

      if (isPdfOrWord) {
        setProcessingStatus('Validating document pages...');
        try {
          if (selectedFile.type === 'application/pdf') {
            detectedPageCount = await getPdfPageCount(selectedFile);
          } else {
            detectedPageCount = await getWordDocumentPageCount(selectedFile);
          }
        } catch (error) {
          showError('Unable to read document pages. Please upload a valid PDF, DOC, or DOCX file.');
          if (fileInputRef.current) fileInputRef.current.value = '';
          setProcessingStatus('');
          return;
        }

        if (detectedPageCount > MAX_DOCUMENT_UPLOAD_PAGES) {
          showError(`Maximum allowed document length is ${MAX_DOCUMENT_UPLOAD_PAGES} pages. This file has ${detectedPageCount} pages.`);
          if (fileInputRef.current) fileInputRef.current.value = '';
          setProcessingStatus('');
          return;
        }
      }

      setFile(selectedFile);
      setDocumentPages([]);
      setCurrentPage(0);
      setPageMistakes([]);
      setExtractedTexts([]);
      setMarkingSummary(null);
      setOverallProcessingComplete(false);
      setIsProcessingStarted(false);
      setTextOnlyMode(false);
      setDirectText('');
      setStreamedAiResponse('');
      setOcrOverlayPages([]);
      setN8nMarkingSchemes({});
      setPdfPageCount(detectedPageCount);
      setProcessingStatus('');
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setDocumentPages([]);
    setCurrentPage(0);
    setPageMistakes([]);
    setExtractedTexts([]);
    setMarkingSummary(null);
    setOverallProcessingComplete(false);
    setIsProcessingStarted(false); // Reset processing state
    setTextOnlyMode(false);
    setDirectText('');
    setStreamedAiResponse('');
    setOcrOverlayPages([]);
    setN8nMarkingSchemes({});
    setPdfPageCount(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  // Handle text extraction when toggle is enabled
  useEffect(() => {
    // IMPORTANT: Don't run this effect during history restoration to avoid overwriting restored data
    if (isRestoringFromHistory) {
      console.log('⚠️ Skipping text extraction useEffect during history restoration');
      return;
    }
    
    if (textExtractionEnabled && documentPages.length > 0 && extractedTexts.length === 0) {
      // Initialize extracted texts
      const initialExtractedTexts: ExtractedText[] = documentPages.map((_, index) => ({
        pageNumber: index + 1,
        text: '',
        isLoading: true,
        isComplete: false
      }));
      setExtractedTexts(initialExtractedTexts);
      
      // Extract text from all pages in parallel
      console.log('📝 Starting text extraction after toggle enabled');
      const textExtractionPromises = documentPages.map(async (imageUrl, index) => {
        const pageNumber = index + 1;
        try {
          const extractedText = await extractTextFromPage(imageUrl, pageNumber);
          
          setExtractedTexts(prev => prev.map(et => 
            et.pageNumber === pageNumber 
              ? { ...et, text: extractedText, isLoading: false, isComplete: true }
              : et
          ));
          
          return { pageNumber, text: extractedText, success: true };
        } catch (error) {
          console.error(`❌ Error extracting text from page ${pageNumber}:`, error);
          
          setExtractedTexts(prev => prev.map(et => 
            et.pageNumber === pageNumber 
              ? { 
                  ...et, 
                  text: '',
                  isLoading: false, 
                  isComplete: true,
                  error: error instanceof Error ? error.message : 'Unknown error'
                }
              : et
          ));
          
          return { pageNumber, error: error instanceof Error ? error.message : 'Unknown error', success: false };
        }
      });
      
      Promise.allSettled(textExtractionPromises).then(() => {
        console.log('✅ Text extraction after toggle completed');
      });
    }
  }, [textExtractionEnabled, documentPages.length, isRestoringFromHistory]);

  // Auto-scroll effect
  useEffect(() => {
    // Don't auto-scroll during history restoration to avoid interference
    if (isRestoringFromHistory) {
      return;
    }
    
    if (mistakesContainerRef.current) {
      const container = mistakesContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [pageMistakes, currentPage, isRestoringFromHistory]);

  useEffect(() => {
    if (!overallProcessingComplete) return;
    const combinedMistakes = pageMistakes.flatMap((page) => page.mistakes || []);
    const combinedText = extractedTexts.map((textItem) => textItem.text || '').join('\n\n').trim();
    if (!combinedText && combinedMistakes.length === 0) return;
    const summary = getMarkingSummaryFromN8n(n8nMarkingSchemes, combinedMistakes, combinedText, selectedMarkingStandard);
    setMarkingSummary(summary);
  }, [selectedMarkingStandard]);

  const invokeMistakeCheckerWebhook = async (content: string, targetFile: File | null) => {
    const maxWebhookWaitMs = 180000;
    const chatId = `mistake-check-${Date.now()}`;
    const timestamp = new Date().toISOString().replace('T', ' ').replace('Z', '');
    const message = content.trim() || 'Check this content for mistakes';
    const userId = user?.id || '0a147ebe-af99-481b-bcaf-ae70c9aeb8d8';

    let requestBody: any = {
      stream: true,
      language: selectedLanguage,
      messages: []
    };

    if (targetFile) {
      const uploadedFileUrl = await uploadToSupabase(targetFile, targetFile.name);
      if (!uploadedFileUrl) {
        throw new Error('Failed to upload file to storage');
      }
      const isImageFile = targetFile.type.startsWith('image/');
      const uploadedFileType = isImageFile ? 'image' : 'document';
      requestBody = {
        ...requestBody,
        uploadedFileType,
        messages: [{
          uid: userId,
          type: uploadedFileType,
          text: { body: message },
          body: message,
          content: message,
          role: 'user',
          roleDescription: 'A versatile AI assistant for everyday tasks and questions',
          timestamp,
          chatid: chatId,
          subject: 'mistake_checker',
          languageCode: selectedLanguage,
          url: uploadedFileUrl,
          attachments: [{
            url: uploadedFileUrl,
            fileName: targetFile.name,
            fileType: uploadedFileType,
            mimeType: targetFile.type,
            originalName: targetFile.name,
            size: targetFile.size
          }]
        }]
      };
    } else {
      requestBody = {
        ...requestBody,
        uploadedFileType: 'text',
        messages: [{
          uid: userId,
          type: 'text',
          text: { body: 'text' },
          body: message,
          content: message,
          transcription: message,
          role: 'user',
          roleDescription: '',
          timestamp,
          chatid: chatId,
          subject: 'mistake_checker',
          languageCode: selectedLanguage
        }]
      };
    }

    const controller = new AbortController();
    const startedAt = Date.now();
    setWebhookProgress(0);
    setWebhookRemainingSeconds(Math.ceil(maxWebhookWaitMs / 1000));
    setProcessingStatus('Waiting for analysis response... 180s');

    const progressInterval = window.setInterval(() => {
      const elapsedMs = Date.now() - startedAt;
      const ratio = Math.min(1, elapsedMs / maxWebhookWaitMs);
      const progress = Math.min(95, Math.round(ratio * 95));
      const remaining = Math.max(0, Math.ceil((maxWebhookWaitMs - elapsedMs) / 1000));
      setWebhookProgress(progress);
      setWebhookRemainingSeconds(remaining);
      setProcessingStatus(`Waiting for analysis response... ${remaining}s`);
    }, 500);

    const timeoutId = window.setTimeout(() => controller.abort(), maxWebhookWaitMs);

    try {
      const response = await fetch('https://n8n.matrixaiserver.com/webhook/matrixEdu/mistakeChecker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Mistake checker webhook failed: ${response.status} ${response.statusText}`);
      }
      const rawResponseText = await response.text();
      const fullText = rawResponseText.trim();
      setWebhookProgress(100);
      setWebhookRemainingSeconds(0);
      setProcessingStatus('Response received. Finalizing results...');
      setStreamedAiResponse(fullText);

      const parsedResult = parseTextAndMistakes(fullText);
      const parsedMistakes = parsedResult.mistakes;
      const parsedText = parsedResult.extractedText || extractTextFromOcrPages(parsedResult.ocrPages);
      setOcrOverlayPages(parsedResult.ocrPages);
      setN8nMarkingSchemes(parsedResult.markingSchemes);

      setPageMistakes(prev => prev.map((pm, index) => (
        index === 0 ? { ...pm, mistakes: parsedMistakes, isLoading: true } : pm
      )));
      setExtractedTexts(prev => prev.map((et, index) => (
        index === 0 ? { ...et, text: parsedText || et.text, isLoading: true } : et
      )));

      return fullText;
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') {
        throw new Error('Analysis service did not respond within 3 minutes. Please try again.');
      }
      throw error;
    } finally {
      clearInterval(progressInterval);
      clearTimeout(timeoutId);
    }
  };

  const processTextDirectly = async (text: string) => {
    if (!text.trim() || loading || isProcessingStarted || isRestoringFromHistory) return;
    
    setIsProcessingStarted(true);
    setLoading(true);
    setTextOnlyMode(true);
    setDirectText(text);
    setDocumentPages([]); // Clear any uploaded document
    setFile(null);
    setStreamedAiResponse('');
    setOcrOverlayPages([]);
    setN8nMarkingSchemes({});
    setWebhookProgress(0);
    setWebhookRemainingSeconds(180);
    setPageMistakes([]);
    setExtractedTexts([]);
    
    // Initialize page mistakes for text mode
    const initialPageMistakes: PageMistakes[] = [{
      pageNumber: 1,
      mistakes: [],
      isLoading: true,
      isComplete: false
    }];
    setPageMistakes(initialPageMistakes);
    setExtractedTexts([{
      pageNumber: 1,
      text: text,
      isLoading: true,
      isComplete: false
    }]);
    
    try {
      const fullAiText = await invokeMistakeCheckerWebhook(text, null);
      const parsedResult = parseTextAndMistakes(fullAiText);
      const mistakes = parsedResult.mistakes;
      const extractedText = parsedResult.extractedText || text;
      setN8nMarkingSchemes(parsedResult.markingSchemes);
      
      // Update page mistakes
      setPageMistakes([{
        pageNumber: 1,
        mistakes,
        isLoading: false,
        isComplete: true
      }]);
      setExtractedTexts([{
        pageNumber: 1,
        text: extractedText,
        isLoading: false,
        isComplete: true
      }]);
      
      // Generate marking summary
      const integratedSummary = getMarkingSummaryFromN8n(parsedResult.markingSchemes, mistakes, extractedText, selectedMarkingStandard);
      setMarkingSummary(integratedSummary);
      
      // Add to history
      addToHistory(
        'Direct Text Input',
        extractedText,
        mistakes,
        integratedSummary,
        'text',
        undefined,
        undefined,
        [{
          pageNumber: 1,
          mistakes,
          isLoading: false,
          isComplete: true
        }],
        0,
        true,
        undefined, // extractedTexts - not used for text mode
        undefined,  // pageMarkings - not used for text mode
        parsedResult.ocrPages,
        parsedResult.markingSchemes,
        fullAiText,
        parsedResult.normalizedPayload
      );
      
      setOverallProcessingComplete(true);
      
    } catch (error) {
      console.error('Error processing text:', error);
      setPageMistakes([{
        pageNumber: 1,
        mistakes: [],
        isLoading: false,
        isComplete: true,
        error: 'Processing failed'
      }]);
      setExtractedTexts([{
        pageNumber: 1,
        text,
        isLoading: false,
        isComplete: true
      }]);
      setIsProcessingStarted(false); // Reset on error
    } finally {
      setLoading(false);
    }
  };

  // Check mistakes in text directly
  const checkMistakesForText = async (text: string): Promise<Mistake[]> => {
    console.log('🔄 Starting mistake checking for direct text');
    
    try {
      const systemPrompt = "You are a precise proofreader. Analyze the provided text and identify ONLY actual mistakes. For each mistake found, provide EXACTLY in this format:\n\nMISTAKE: [incorrect text]\nCORRECTION: [corrected text]\nTYPE: [grammar/spelling/punctuation]\n\nBe concise and only show actual errors. Do not provide explanations or analysis.";
      
      const userPrompt = `Analyze this text and find mistakes. For each mistake, respond ONLY in this exact format:\n\nMISTAKE: [exact incorrect text]\nCORRECTION: [exact corrected text]\nTYPE: [mistake type]\n\nText to analyze:\n\n${text}`;

      const response = await fetch(process.env.REACT_APP_DASHSCOPE_ENDPOINT || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_DASHSCOPE_API_KEY || ''}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: "doubao-seed-1-6-vision-250815",
          messages: [
            {
              role: "system",
              content: [{ type: "text", text: systemPrompt }]
            },
            {
              role: "user",
              content: [{ type: "text", text: userPrompt }]
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
                  
                  // Update mistakes in real-time
                  setPageMistakes(prev => prev.map(pm => 
                    pm.pageNumber === 1 
                      ? { 
                          ...pm, 
                          mistakes: parseMistakesFromText(fullContent, 1),
                          isLoading: true 
                        }
                      : pm
                  ));
                  
                  // Auto-scroll to show latest content
                  if (mistakesContainerRef.current) {
                    setTimeout(scrollToBottom, 100);
                  }
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

      // Parse final mistakes
      const finalMistakes = parseMistakesFromText(fullContent, 1);
      return finalMistakes;

    } catch (error) {
      console.error('💥 Error in checkMistakesForText:', error);
      throw error;
    }
  };

  // Generate marks summary based on mistakes - IMPROVED SCORING ACCURACY
  const generateMarksSummary = (mistakes: Mistake[], text: string) => {
    const totalWords = Math.max(text.trim().split(/\s+/).filter(word => word.length > 0).length, 1);
    const totalMistakes = mistakes.length;
    
    // Calculate mistakes by type
    const mistakesByType = mistakes.reduce((acc, mistake) => {
      acc[mistake.type] = (acc[mistake.type] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
    
    // IMPROVED SCORING LOGIC: More accurate calculation
    let score = 100;
    
    // Calculate error rate per 100 words for consistency
    const errorRatePer100Words = (totalMistakes / totalWords) * 100;
    
    // Score based on error density with more precise thresholds
    if (errorRatePer100Words >= 15) { // 15+ errors per 100 words - Very Poor
      score = Math.max(0, 20 - (errorRatePer100Words - 15) * 2);
    } else if (errorRatePer100Words >= 10) { // 10-15 errors per 100 words - Poor
      score = Math.max(20, 40 - (errorRatePer100Words - 10) * 4);
    } else if (errorRatePer100Words >= 6) { // 6-10 errors per 100 words - Fair
      score = Math.max(40, 60 - (errorRatePer100Words - 6) * 5);
    } else if (errorRatePer100Words >= 3) { // 3-6 errors per 100 words - Good
      score = Math.max(60, 80 - (errorRatePer100Words - 3) * 6.67);
    } else if (errorRatePer100Words >= 1) { // 1-3 errors per 100 words - Very Good
      score = Math.max(80, 95 - (errorRatePer100Words - 1) * 7.5);
    } else if (errorRatePer100Words > 0) { // Less than 1 error per 100 words - Excellent
      score = Math.max(95, 100 - errorRatePer100Words * 5);
    } else { // No errors - Perfect
      score = 100;
    }
    
    // Apply penalty based on mistake severity
    const grammarPenalty = (mistakesByType.grammar || 0) * 1.5; // Grammar mistakes are more severe
    const spellingPenalty = (mistakesByType.spelling || 0) * 1.2; // Spelling mistakes
    const punctuationPenalty = (mistakesByType.punctuation || 0) * 1.0; // Punctuation mistakes
    const otherPenalty = (mistakesByType.other || 0) * 1.1; // Other mistakes
    
    const totalPenalty = grammarPenalty + spellingPenalty + punctuationPenalty + otherPenalty;
    score = Math.max(0, score - (totalPenalty * 0.5)); // Apply weighted penalty
    
    score = Math.round(score * 100) / 100; // Round to 2 decimal places for accuracy
    
    // Generate suggestions based on mistake types
    const suggestions: string[] = [];
    if (mistakesByType.grammar > 0) {
      suggestions.push('Review grammar rules and sentence structure');
    }
    if (mistakesByType.spelling > 0) {
      suggestions.push('Use spell-check tools and expand vocabulary');
    }
    if (mistakesByType.punctuation > 0) {
      suggestions.push('Study punctuation rules and practice their application');
    }
    if (totalMistakes === 0) {
      suggestions.push('Excellent work! Your text is error-free');
    } else if (totalMistakes <= 2 && totalWords >= 50) {
      suggestions.push('Great job! Only minor errors detected');
    } else if (errorRatePer100Words <= 3) {
      suggestions.push('Good work! Low error rate detected');
    }
    
    // Generate overall feedback based on precise scoring
    let overallFeedback = '';
    if (score >= 95) {
      overallFeedback = 'Excellent work! Your writing demonstrates exceptional command of language with minimal to no errors.';
    } else if (score >= 85) {
      overallFeedback = 'Very good work! Your writing is clear and well-structured with only minor errors.';
    } else if (score >= 75) {
      overallFeedback = 'Good work! Your writing is generally effective with some errors that can be easily corrected.';
    } else if (score >= 65) {
      overallFeedback = 'Fair work! Some errors present that may affect clarity. Focus on the suggested areas for improvement.';
    } else if (score >= 50) {
      overallFeedback = 'Needs improvement! Multiple errors detected that impact readability. Review the suggestions carefully.';
    } else {
      overallFeedback = 'Significant improvement needed! Many errors detected that seriously impact communication effectiveness.';
    }
    
    return {
      totalMistakes,
      mistakesByType,
      score,
      maxScore: 100,
      suggestions,
      overallFeedback,
      errorRatePer100Words: Math.round(errorRatePer100Words * 100) / 100,
      totalWords
    };
  };

  // Generate integrated summary combining mistakes and marking - IMPROVED SCORING
  const generateIntegratedSummary = (mistakes: Mistake[], text: string, markingStandardId: string): MarkingSummary => {
    const standard = MARKING_STANDARDS.find(s => s.id === markingStandardId)!;
    const totalWords = Math.max(text.trim().split(/\s+/).filter(word => word.length > 0).length, 1);
    const totalMistakes = mistakes.length;
    
    // Use the improved scoring from generateMarksSummary
    const marksSummary = generateMarksSummary(mistakes, text);
    const baseScore = marksSummary.score; // This is out of 100
    
    // Scale to marking standard more accurately
    const scaledScore = Math.round((baseScore / 100) * standard.gradingScale.max * 100) / 100;
    const percentage = Math.round((baseScore) * 100) / 100; // Use base score for percentage, not scaled
    
    // FIXED: Determine grade based on percentage, not scaled score
    let grade = 'F';
    const gradeLabels = standard.gradingScale.gradeLabels;
    
    // Sort thresholds in descending order and use percentage for comparison
    const gradeThresholds = Object.keys(gradeLabels)
      .map(Number)
      .sort((a, b) => b - a);
    
    // Convert thresholds to percentage scale for proper comparison
    for (const threshold of gradeThresholds) {
      const thresholdPercentage = (threshold / standard.gradingScale.max) * 100;
      if (percentage >= thresholdPercentage) {
        grade = gradeLabels[threshold];
        break;
      }
    }
    
    // If no grade found (very low score), assign the lowest grade
    if (grade === 'F' && gradeThresholds.length > 0) {
      const lowestThreshold = gradeThresholds[gradeThresholds.length - 1];
      grade = gradeLabels[lowestThreshold];
    }
    
    // Analyze mistake types for criteria assessment
    const mistakesByType = mistakes.reduce((acc, mistake) => {
      acc[mistake.type] = (acc[mistake.type] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
    
    // Generate strengths and weaknesses - always provide content
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];
    const studyPlan: { topic: string; priority: 'high' | 'medium' | 'low'; description: string }[] = [];
    
    // Always provide recommendations and study plan
    recommendations.push('Review your work carefully before submission');
    recommendations.push('Practice writing regularly to improve skills');
    recommendations.push('Read extensively to enhance vocabulary and grammar');
    
    studyPlan.push({
      topic: 'Writing Practice',
      priority: 'medium',
      description: 'Dedicate time daily to writing exercises and practice'
    });
    
    studyPlan.push({
      topic: 'Reading Comprehension',
      priority: 'medium',
      description: 'Read diverse materials to improve language understanding'
    });
    
    if (totalMistakes === 0) {
      strengths.push('Perfect accuracy - no mistakes detected');
      strengths.push('Excellent command of language');
      strengths.push('Strong attention to detail');
      
      recommendations.push('Maintain this excellent standard');
      recommendations.push('Consider helping others with their writing');
      
      studyPlan.push({
        topic: 'Advanced Writing Techniques',
        priority: 'low',
        description: 'Explore advanced writing styles and techniques'
      });
    } else {
      // Grammar analysis
      const grammarMistakes = mistakesByType.grammar || 0;
      if (grammarMistakes < totalMistakes * 0.3) {
        strengths.push('Good grammatical structure overall');
      } else {
        weaknesses.push('Grammar needs improvement');
        recommendations.push('Review basic grammar rules and sentence construction');
        studyPlan.push({
          topic: 'Grammar Fundamentals',
          priority: 'high',
          description: 'Focus on sentence structure, verb tenses, and agreement'
        });
      }
      
      // Spelling analysis
      const spellingMistakes = mistakesByType.spelling || 0;
      if (spellingMistakes < totalMistakes * 0.2) {
        strengths.push('Generally good spelling ability');
      } else {
        weaknesses.push('Spelling accuracy needs work');
        recommendations.push('Use spell-check tools and expand vocabulary');
        studyPlan.push({
          topic: 'Spelling and Vocabulary',
          priority: 'medium',
          description: 'Practice common word patterns and expand vocabulary'
        });
      }
      
      // Punctuation analysis
      const punctuationMistakes = mistakesByType.punctuation || 0;
      if (punctuationMistakes < totalMistakes * 0.2) {
        strengths.push('Adequate punctuation usage');
      } else {
        weaknesses.push('Punctuation requires attention');
        recommendations.push('Study punctuation rules and their applications');
        studyPlan.push({
          topic: 'Punctuation Mastery',
          priority: 'medium',
          description: 'Learn proper use of commas, periods, and other punctuation marks'
        });
      }
    }
    
    // Add performance-based strengths/weaknesses
    if (percentage >= 90) {
      strengths.push('Exceptional overall performance');
      strengths.push('Demonstrates mastery of writing conventions');
    } else if (percentage >= 70) {
      strengths.push('Good overall performance with room for improvement');
      recommendations.push('Focus on consistency in writing quality');
    } else if (percentage < 50) {
      weaknesses.push('Significant improvement needed in multiple areas');
      recommendations.push('Consider additional writing practice and tutoring');
      studyPlan.push({
        topic: 'Comprehensive Writing Review',
        priority: 'high',
        description: 'Work on fundamental writing skills across all areas'
      });
    }
    
    // Ensure we always have at least some content
    if (strengths.length === 0) {
      strengths.push('Shows effort in completing the work');
    }
    
    if (weaknesses.length === 0) {
      weaknesses.push('Continue maintaining current standards');
    }
    
    return {
      totalScore: scaledScore,
      maxScore: standard.gradingScale.max,
      percentage,
      grade,
      strengths,
      weaknesses,
      recommendations,
      studyPlan
    };
  };

  const getMarkingSummaryFromN8n = (
    schemes: Record<string, MarkingSchemeResult>,
    mistakes: Mistake[],
    text: string,
    markingStandardId: string
  ): MarkingSummary => {
    const schemeKey = markingStandardId === 'alevel' ? 'alevel' : markingStandardId;
    const selectedScheme = schemes[schemeKey];
    if (!selectedScheme) {
      return generateIntegratedSummary(mistakes, text, markingStandardId);
    }
    const score = typeof selectedScheme.score === 'number' ? selectedScheme.score : 0;
    const maxScore = typeof selectedScheme.maxScore === 'number' && selectedScheme.maxScore > 0 ? selectedScheme.maxScore : 100;
    const percentage = typeof selectedScheme.percentage === 'number'
      ? Math.max(0, Math.min(100, selectedScheme.percentage))
      : Math.max(0, Math.min(100, (score / maxScore) * 100));
    const criteriaValues = selectedScheme.criteria
      ? Object.entries(selectedScheme.criteria).filter(([, value]) => typeof value === 'number')
      : [];
    const criteriaPercentages = criteriaValues.map(([key, value]) => {
      const numericValue = value as number;
      const normalized = numericValue > 1 && numericValue <= 100 ? numericValue : numericValue * 100;
      return { key, percentage: Math.max(0, Math.min(100, normalized)) };
    });
    const strengths = criteriaPercentages
      .filter((item) => item.percentage >= 70)
      .map((item) => `${item.key.charAt(0).toUpperCase()}${item.key.slice(1)}: ${Math.round(item.percentage)}%`);
    const weaknesses = criteriaPercentages
      .filter((item) => item.percentage < 55)
      .map((item) => `${item.key.charAt(0).toUpperCase()}${item.key.slice(1)}: ${Math.round(item.percentage)}%`);
    const recommendations = typeof selectedScheme.feedback === 'string' && selectedScheme.feedback.trim().length > 0
      ? selectedScheme.feedback.split('\n').map((line) => line.trim()).filter(Boolean)
      : [];
    return {
      totalScore: Math.round(score * 100) / 100,
      maxScore,
      percentage: Math.round(percentage * 100) / 100,
      grade: selectedScheme.grade || 'N/A',
      strengths,
      weaknesses,
      recommendations,
      studyPlan: []
    };
  };

  const startProcessing = async () => {
    if (!file || isProcessingStarted) return;

    const responseResult = await checkAndUseResponse({
      responseType: 'mistake_checker',
      queryData: { 
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        mode: 'mistakes'
      },
      responsesUsed: 1
    });

    if (!responseResult.canProceed) {
      setUpgradeMessage(responseResult.message || 'Unable to process request');
      setShowUpgradeModal(true);
      return;
    }

    setIsProcessingStarted(true);
    setLoading(true);
    setTextOnlyMode(!file);
    setStreamedAiResponse('');
    setOcrOverlayPages([]);
    setN8nMarkingSchemes({});
    setWebhookProgress(0);
    setWebhookRemainingSeconds(180);
    setProcessingStatus('Analyzing...');
    
    const processStartTime = Date.now();
    console.log('⏰ Processing start time:', new Date(processStartTime).toISOString());

    try {
      let preparedPages: string[] = [];
      const initialExtractedText = '';

      if (file?.type === 'application/pdf') {
        preparedPages = await convertPdfToImages(file);
        setPdfPageCount(preparedPages.length);
      } else if (file?.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        preparedPages = await convertDocxToImages(file);
        setPdfPageCount(preparedPages.length);
      } else if (file?.type === 'application/msword') {
        throw new Error('DOC preview is not supported. Please convert .doc to .docx for page preview.');
      } else if (file?.type?.startsWith('image/')) {
        const imageDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        preparedPages = [imageDataUrl];
      }

      setDocumentPages(preparedPages);
      setCurrentPage(0);
      const totalPages = preparedPages.length > 0 ? preparedPages.length : 1;
      const initialPageMistakes: PageMistakes[] = Array.from({ length: totalPages }, (_, index) => ({
        pageNumber: index + 1,
        mistakes: [],
        isLoading: true,
        isComplete: false
      }));
      const initialExtractedTexts: ExtractedText[] = Array.from({ length: totalPages }, (_, index) => ({
        pageNumber: index + 1,
        text: index === 0 ? initialExtractedText : '',
        isLoading: true,
        isComplete: false
      }));
      setPageMistakes(initialPageMistakes);
      setExtractedTexts(initialExtractedTexts);

      const fullAiText = await invokeMistakeCheckerWebhook('', file);
      const parsedResult = parseTextAndMistakes(fullAiText);
      const parsedMistakes = parsedResult.mistakes;
      const parsedText = parsedResult.extractedText || initialExtractedText;
      const sortedOcrPages = parsedResult.ocrPages.slice().sort((a, b) => a.page - b.page);
      const ocrPageTexts = sortedOcrPages.map((page) => page.results.map((line) => line.text).filter(Boolean).join('\n').trim());
      const fallbackPageCount = ocrPageTexts.length;
      const resolvedTotalPages = preparedPages.length > 0
        ? preparedPages.length
        : (fallbackPageCount > 0 ? fallbackPageCount : 1);
      const resolvedDocumentPages = preparedPages.length > 0
        ? preparedPages
        : await renderOcrPagesToImages(sortedOcrPages);
      setOcrOverlayPages(parsedResult.ocrPages);
      setN8nMarkingSchemes(parsedResult.markingSchemes);
      setDocumentPages(resolvedDocumentPages);
      setCurrentPage(0);

      const mistakesByPage = Array.from({ length: resolvedTotalPages }, () => [] as Mistake[]);
      parsedMistakes.forEach((mistake) => {
        const normalizedIncorrect = typeof mistake.incorrect === 'string' ? mistake.incorrect.trim().toLowerCase() : '';
        let targetPageIndex = 0;
        if (normalizedIncorrect && ocrPageTexts.length > 0) {
          const foundIndex = ocrPageTexts.findIndex((pageText) => pageText.toLowerCase().includes(normalizedIncorrect));
          if (foundIndex >= 0) {
            targetPageIndex = foundIndex;
          }
        }
        const boundedIndex = Math.min(Math.max(targetPageIndex, 0), resolvedTotalPages - 1);
        mistakesByPage[boundedIndex].push(mistake);
      });

      const finalPageMistakes: PageMistakes[] = Array.from({ length: resolvedTotalPages }, (_, index) => ({
        pageNumber: index + 1,
        mistakes: mistakesByPage[index],
        isLoading: false,
        isComplete: true,
        error: undefined
      }));
      const finalExtractedTexts: ExtractedText[] = Array.from({ length: resolvedTotalPages }, (_, index) => ({
        pageNumber: index + 1,
        text: ocrPageTexts[index] || (index === 0 ? parsedText : ''),
        isLoading: false,
        isComplete: true,
        error: undefined
      }));
      const normalizedParsedText = finalExtractedTexts
        .map((item) => item.text.trim())
        .filter(Boolean)
        .join('\n\n')
        .trim() || parsedText;

      setPageMistakes(finalPageMistakes);
      setExtractedTexts(finalExtractedTexts);
      setOverallProcessingComplete(true);
      setProcessingStatus('Analysis completed');

      const summary = getMarkingSummaryFromN8n(parsedResult.markingSchemes, parsedMistakes, normalizedParsedText, selectedMarkingStandard);
      setMarkingSummary(summary);

      addToHistory(
        file.name, 
        normalizedParsedText, 
        parsedMistakes, 
        summary, 
        file.type, 
        resolvedDocumentPages, 
        file, 
        finalPageMistakes, 
        0, 
        true,
        finalExtractedTexts,
        pageMarkings,
        parsedResult.ocrPages,
        parsedResult.markingSchemes,
        fullAiText,
        parsedResult.normalizedPayload
      );

      const totalProcessTime = Date.now() - processStartTime;
      console.log('🎉 Processing completed successfully');
      console.log('⏱️ Total processing time:', totalProcessTime + 'ms');

    } catch (error) {
      const totalProcessTime = Date.now() - processStartTime;
      console.error('💥 Processing error after', totalProcessTime + 'ms');
      console.error('🔴 Error message:', error instanceof Error ? error.message : String(error));
      
      setProcessingStatus('Error processing');
      setOverallProcessingComplete(true);
      setIsProcessingStarted(false); // Reset on error
    } finally {
      setLoading(false);
      setTimeout(() => setProcessingStatus(''), 3000);
      console.log('🏁 startProcessing function completed');
    }
  };

  const handleCheckText = () => {
    if (loading) return;
    if (!file) {
      showError('Please upload a file before sending.');
      return;
    }
    startProcessing();
  };

  const calculateCost = () => {
    if (file) {
      if (file.type === 'application/pdf') {
        return 10;
      }
      if (file.type.startsWith('image/')) {
        return 3;
      }
      return 10;
    }
    return 0;
  };

  const formatFileSize = (bytes: number) => {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / Math.pow(1024, unitIndex);
    const precision = unitIndex === 0 ? 0 : 1;
    return `${value.toFixed(precision)} ${units[unitIndex]}`;
  };

  const selectedLanguageLabel = LANGUAGE_OPTIONS.find((language) => language.code === selectedLanguage)?.label || 'English';
  const cost = calculateCost();
  const currentOcrOverlay = ocrOverlayPages.find((page) => page.page === currentPage + 1) || ocrOverlayPages[currentPage];
  const currentMistakes = pageMistakes[currentPage]?.mistakes || [];
  const hasOcrOverlay = Boolean(currentOcrOverlay && currentOcrOverlay.width > 0 && currentOcrOverlay.height > 0);
  const overlayWidth = hasOcrOverlay ? currentOcrOverlay!.width : 1;
  const overlayHeight = hasOcrOverlay ? currentOcrOverlay!.height : 1;
  const overlayLineRects = hasOcrOverlay && currentOcrOverlay
    ? currentOcrOverlay.results
      .map((line, index) => {
        const polygon = Array.isArray(line.polygon) ? line.polygon : [];
        const xValues = polygon.map((point) => point[0]).filter((value) => Number.isFinite(value));
        const yValues = polygon.map((point) => point[1]).filter((value) => Number.isFinite(value));
        const polygonBounds = xValues.length > 0 && yValues.length > 0
          ? {
              x: Math.min(...xValues),
              y: Math.min(...yValues),
              width: Math.max(...xValues) - Math.min(...xValues),
              height: Math.max(...yValues) - Math.min(...yValues)
            }
          : null;
        const x = line.bbox?.x_min ?? polygonBounds?.x ?? 0;
        const y = line.bbox?.y_min ?? polygonBounds?.y ?? 0;
        const width = line.bbox?.width ?? polygonBounds?.width ?? 0;
        const height = line.bbox?.height ?? polygonBounds?.height ?? 0;
        if (!line.text || width <= 0 || height <= 0) {
          return null;
        }
        return { index, x, y, width, height };
      })
      .filter((item): item is { index: number; x: number; y: number; width: number; height: number } => Boolean(item))
    : [];
  const mergedOverlayRects = (() => {
    const merged: Array<{ x: number; y: number; width: number; height: number }> = [];
    const canMerge = (a: { x: number; y: number; width: number; height: number }, b: { x: number; y: number; width: number; height: number }) =>
      a.x <= b.x + b.width + 2 &&
      a.x + a.width >= b.x - 2 &&
      a.y <= b.y + b.height + 2 &&
      a.y + a.height >= b.y - 2;

    overlayLineRects.forEach((rect) => {
      let current = { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
      let mergedIntoExisting = true;
      while (mergedIntoExisting) {
        mergedIntoExisting = false;
        for (let i = 0; i < merged.length; i += 1) {
          if (canMerge(current, merged[i])) {
            const left = Math.min(current.x, merged[i].x);
            const top = Math.min(current.y, merged[i].y);
            const right = Math.max(current.x + current.width, merged[i].x + merged[i].width);
            const bottom = Math.max(current.y + current.height, merged[i].y + merged[i].height);
            current = { x: left, y: top, width: right - left, height: bottom - top };
            merged.splice(i, 1);
            mergedIntoExisting = true;
            break;
          }
        }
      }
      merged.push(current);
    });
    return merged;
  })();
  const availableMarkingSchemes = MARKING_STANDARDS.filter((standard) => standard.id === 'hkdse' || standard.id === 'alevel' || standard.id === 'gre');
  const selectedN8nScheme = n8nMarkingSchemes[selectedMarkingStandard] || (selectedMarkingStandard === 'alevel' ? n8nMarkingSchemes.alevel : selectedMarkingStandard === 'gre' ? n8nMarkingSchemes.gre : undefined);
  const mistakeTypeCounts = currentMistakes.reduce((acc, mistake) => {
    const type = normalizeMistakeType(mistake.type);
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const summaryStrengths = (markingSummary?.strengths || []).filter((item) => item.trim().length > 0);
  const summaryWeaknesses = (markingSummary?.weaknesses || []).filter((item) => item.trim().length > 0);
  const summaryRecommendations = (markingSummary?.recommendations || []).filter((item) => item.trim().length > 0);
  const hasSummaryInsights = summaryStrengths.length > 0 || summaryWeaknesses.length > 0 || summaryRecommendations.length > 0;
  const grammarCount = (mistakeTypeCounts.grammar || 0);
  const spellingCount = (mistakeTypeCounts.spelling || 0);
  const styleCount = (mistakeTypeCounts.punctuation || 0) + (mistakeTypeCounts.other || 0);
  const totalMistakesCount = currentMistakes.length;

  useEffect(() => {
    if (!hasOcrOverlay || !currentOcrOverlay || !documentPages[currentPage]) {
      setOverlayTextColors({});
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = overlayWidth;
      canvas.height = overlayHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        if (!cancelled) {
          setOverlayTextColors({});
        }
        return;
      }

      ctx.drawImage(img, 0, 0, overlayWidth, overlayHeight);
      const nextColors: Record<number, string> = {};

      currentOcrOverlay.results.forEach((line, index) => {
        const polygon = Array.isArray(line.polygon) ? line.polygon : [];
        const xValues = polygon.map((point) => point[0]).filter((value) => Number.isFinite(value));
        const yValues = polygon.map((point) => point[1]).filter((value) => Number.isFinite(value));
        const polygonBounds = xValues.length > 0 && yValues.length > 0
          ? {
              x: Math.min(...xValues),
              y: Math.min(...yValues),
              width: Math.max(...xValues) - Math.min(...xValues),
              height: Math.max(...yValues) - Math.min(...yValues)
            }
          : null;

        const bboxX = Math.max(0, Math.floor(line.bbox?.x_min ?? polygonBounds?.x ?? 0));
        const bboxY = Math.max(0, Math.floor(line.bbox?.y_min ?? polygonBounds?.y ?? 0));
        const bboxWidth = Math.max(1, Math.floor(line.bbox?.width ?? polygonBounds?.width ?? 1));
        const bboxHeight = Math.max(1, Math.floor(line.bbox?.height ?? polygonBounds?.height ?? 1));

        const safeWidth = Math.max(1, Math.min(bboxWidth, overlayWidth - bboxX));
        const safeHeight = Math.max(1, Math.min(bboxHeight, overlayHeight - bboxY));
        let luminance = 255;

        try {
          const data = ctx.getImageData(bboxX, bboxY, safeWidth, safeHeight).data;
          let sum = 0;
          let count = 0;
          for (let i = 0; i < data.length; i += 4) {
            const alpha = data[i + 3] / 255;
            if (alpha <= 0) continue;
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            sum += (0.2126 * r + 0.7152 * g + 0.0722 * b) * alpha;
            count += 1;
          }
          if (count > 0) {
            luminance = sum / count;
          }
        } catch {
          luminance = 255;
        }

        nextColors[index] = luminance < 140 ? '#f8fafc' : '#0f172a';
      });

      if (!cancelled) {
        setOverlayTextColors(nextColors);
      }
    };

    img.onerror = () => {
      if (!cancelled) {
        setOverlayTextColors({});
      }
    };

    img.src = documentPages[currentPage];

    return () => {
      cancelled = true;
    };
  }, [currentPage, currentOcrOverlay, documentPages, hasOcrOverlay, overlayHeight, overlayWidth]);

  if (!isProcessingStarted && !overallProcessingComplete) {
    return (
      <div className={`mistake-checker-premium ${className}`}>
        <div className="mistake-checker-premium-topline" />
        <div className="h-full flex flex-col">
          <div className="flex flex-1 overflow-hidden items-center justify-center">
            <div className="w-full flex flex-col justify-center max-w-[680px] mx-auto px-4 py-10 lg:py-14">
              <div className="w-full text-center mb-8">
                <h1
                  className="mistake-checker-title"
                  style={{ fontFamily: '"DM Serif Display", serif' }}
                >
                  AI Mistake Checker
                </h1>
                <div className="mistake-checker-divider" aria-hidden="true">
                  <span />
                </div>
                <p
                  className="mistake-checker-subtitle"
                  style={{ fontFamily: '"DM Sans", sans-serif' }}
                >
                  Upload any document. Get precise corrections instantly.
                </p>
              </div>

              <div className="mistake-checker-card">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`mistake-checker-upload-zone group ${file ? 'is-file-selected' : ''}`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.webp,application/pdf,.doc,.docx"
                  />
                  {file ? (
                    <>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          handleRemoveFile();
                        }}
                        className="mistake-checker-remove-button"
                        aria-label="Remove uploaded file"
                      >
                        <IconComponent icon={AiOutlineClose} className="w-3 h-3" />
                      </button>
                      <div className="flex items-center gap-3">
                        <FaFileAlt className="w-6 h-6 text-[var(--accent)]" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-[var(--accent)] break-all">{file.name}</p>
                          <p className="text-xs text-[var(--text-muted)]">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <svg
                        className="mistake-checker-upload-icon"
                        width="36"
                        height="36"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path d="M12 16V7" strokeWidth="1.7" strokeLinecap="round" />
                        <path d="M8.5 10.5L12 7L15.5 10.5" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M4.5 16.5V17C4.5 18.3807 5.61929 19.5 7 19.5H17C18.3807 19.5 19.5 18.3807 19.5 17V16.5" strokeWidth="1.7" strokeLinecap="round" />
                      </svg>
                      <p className="mistake-checker-upload-primary">Drop your file here</p>
                      <p className="mistake-checker-upload-secondary">Supports PDF, DOC, DOCX, and images</p>
                      <span className="mistake-checker-upload-pill">or click to browse</span>
                    </>
                  )}
                </div>

                <div className="mistake-checker-controls">
                  <div ref={languageDropdownRef} className="relative" style={{ fontFamily: '"DM Sans", sans-serif' }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (languageDropdownRef.current) {
                          const rect = languageDropdownRef.current.getBoundingClientRect();
                          setLanguageDropdownPosition({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
                        }
                        setIsLanguageDropdownOpen((v) => !v);
                      }}
                      className="mistake-checker-language-btn"
                      aria-label="Select language"
                      aria-expanded={isLanguageDropdownOpen}
                    >
                      <span>{LANGUAGE_OPTIONS.find(l => l.code === selectedLanguage)?.label}</span>
                      <svg className={`mistake-checker-language-chevron ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} width="14" height="14" viewBox="0 0 20 20" fill="none">
                        <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    {/* Render dropdown in portal to avoid clipping by overflow:hidden ancestors */}
                    {isLanguageDropdownOpen && languageDropdownPosition && ReactDOM.createPortal(
                      <div
                        className="mistake-checker-language-dropdown"
                        role="listbox"
                        onMouseDown={(e) => e.stopPropagation()}
                        style={{
                          position: 'fixed',
                          top: languageDropdownPosition.top + languageDropdownPosition.height + 6,
                          left: languageDropdownPosition.left,
                          width: languageDropdownPosition.width,
                          zIndex: 9999
                        }}
                      >
                        {LANGUAGE_OPTIONS.map((language) => (
                          <button
                            key={language.code}
                            type="button"
                            role="option"
                            aria-selected={selectedLanguage === language.code}
                            onClick={() => { setSelectedLanguage(language.code); setIsLanguageDropdownOpen(false); }}
                            className={`mistake-checker-language-option ${selectedLanguage === language.code ? 'is-selected' : ''}`}
                          >
                            <span>{language.label}</span>
                            {selectedLanguage === language.code && (
                              <svg className="ml-auto" width="14" height="14" viewBox="0 0 20 20" fill="none">
                                <path d="M4 10l5 5 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </button>
                        ))}
                      </div>,
                      document.body
                    )}
                  </div>

                  <button
                    onClick={handleCheckText}
                    disabled={loading || !file}
                    className="mistake-checker-send-button"
                    style={{ fontFamily: '"DM Sans", sans-serif' }}
                  >
                    {loading ? (
                      <span className="mistake-checker-loading-ring" />
                    ) : (
                      <>
                        <FaPaperPlane size={13} />
                        <span>Send</span>
                        {cost > 0 && (
                          <span className="mistake-checker-coin-pill">
                            -{cost}
                            <img src={coinIcon} alt="coins" className="w-3 h-3" />
                          </span>
                        )}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {processingStatus && (
                <motion.div
                  className="mt-6 p-4 bg-blue-500/10 backdrop-blur-sm rounded-lg border border-blue-500/20"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <p className="text-sm text-blue-400 flex items-center justify-center">
                    <motion.div
                      className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full mr-2"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
                    />
                    {processingStatus}
                  </p>
                </motion.div>
              )}

              {variant !== 'solve' && (
                <div className="flex items-center justify-center mt-6">
                  <motion.button
                    onClick={() => setShowHistory(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-[#27272a] hover:bg-gray-200 dark:hover:bg-[#313136] border border-gray-200 dark:border-white/10 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <IconComponent icon={AiOutlineHistory} className="h-5 w-5" />
                    <span>History</span>
                    {mistakeHistory.length > 0 && (
                      <span className="bg-[#8b5cf6] text-white text-xs px-2 py-1 rounded-full">
                        {mistakeHistory.length}
                      </span>
                    )}
                  </motion.button>
                </div>
              )}
            </div>
          </div>

          {variant !== 'solve' && (
            <PortalModal 
              isOpen={showHistory} 
              onClose={() => setShowHistory(false)}
              className="w-full max-w-6xl h-[80vh] bg-slate-800/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden"
            >
            <div className="h-full flex flex-col">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                    <IconComponent icon={AiOutlineHistory} className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">History</h2>
                    <p className="text-slate-400 text-sm">Your previous mistake checks and assessments</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {mistakeHistory.length > 0 && (
                    <motion.button
                      onClick={() => {
                        showConfirmation('Are you sure you want to clear all history? This action cannot be undone.', clearAllHistory);
                      }}
                      className="px-3 py-1.5 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg border border-red-500/20 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Clear All
                    </motion.button>
                  )}
                  <motion.button
                    onClick={() => setShowHistory(false)}
                    className="p-2 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <IconComponent icon={AiOutlineClose} className="h-5 w-5" />
                  </motion.button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-hidden">
                {mistakeHistory.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <IconComponent icon={AiOutlineHistory} className="mx-auto text-6xl mb-4 text-slate-500" />
                      <h3 className="text-xl font-semibold text-slate-300 mb-2">No History Yet</h3>
                      <p className="text-slate-400">Your checked documents will appear here</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 h-full overflow-y-auto">
                    <div className="grid gap-4">
                      {mistakeHistory.map((item) => (
                        <motion.div
                          key={item.id}
                          className="bg-slate-700/30 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-slate-700/50 transition-all cursor-pointer"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => loadFromHistory(item)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center border border-cyan-500/20">
                                  <IconComponent 
                                    icon={item.fileType.includes('pdf') ? AiOutlineFileText : 
                                          item.fileType.includes('image') ? AiOutlineCamera : AiOutlineFileText} 
                                    className="h-5 w-5 text-cyan-400" 
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="text-lg font-semibold text-white truncate">
                                    {item.fileName || 'Text Analysis'}
                                  </h3>
                                  <p className="text-slate-400 text-sm">
                                    {formatRelativeTime(item.timestamp)}
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <div className="bg-slate-600/30 rounded-lg p-3">
                                  <div className="text-sm text-slate-400 mb-1">Mistakes Found</div>
                                  <div className="text-xl font-bold text-red-400">
                                    {item.mistakes?.length || 0}
                                  </div>
                                </div>
                                
                                {item.markingSummary && (
                                  <div className="bg-slate-600/30 rounded-lg p-3">
                                    <div className="text-sm text-slate-400 mb-1">Grade</div>
                                    <div className="text-xl font-bold text-green-400">
                                      {item.markingSummary.grade} ({Math.round(item.markingSummary.percentage)}%)
                                    </div>
                                  </div>
                                )}

                                <div className="bg-slate-600/30 rounded-lg p-3">
                                  <div className="text-sm text-slate-400 mb-1">Document Type</div>
                                  <div className="text-sm font-medium text-slate-300 capitalize">
                                    {item.documentPages?.length ? `${item.documentPages.length} Page PDF` : 'Text Analysis'}
                                  </div>
                                </div>
                              </div>

                              {item.text && (
                                <div className="bg-slate-600/20 rounded-lg p-3 mb-3">
                                  <div className="text-sm text-slate-400 mb-2">Content Preview</div>
                                  <p className="text-slate-300 text-sm line-clamp-2">
                                    {item.text.substring(0, 150)}...
                                  </p>
                                </div>
                              )}

                              {item.markingSummary?.strengths && item.markingSummary.strengths.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded border border-green-500/20">
                                    ✓ {item.markingSummary.strengths[0]}
                                  </span>
                                  {item.markingSummary.weaknesses[0] && (
                                    <span className="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
                                      ⚠ {item.markingSummary.weaknesses[0]}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center space-x-2 ml-4">
                              <motion.button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  showConfirmation('Are you sure you want to delete this history item?', () => deleteHistoryItem(item.id));
                                }}
                                className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <IconComponent icon={AiOutlineDelete} className="h-4 w-4" />
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            </PortalModal>
          )}
        </div>
      </div>
    );
  }

  // If file is uploaded but processing hasn't started, show the check button
  if (file && !isProcessingStarted) {
    return (
      <div className={className}>
        <motion.div 
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
          className={`rounded-xl p-8 shadow-sm border ${
            variant === 'solve'
              ? 'bg-white dark:bg-[#111111] border-gray-200 dark:border-white/10'
              : 'bg-slate-600/30 backdrop-blur-sm border-white/10'
          }`}
            whileHover={{ boxShadow: "0 8px 32px rgba(6, 182, 212, 0.1)" }}
          >
            <div className="text-center mb-8">
              <h2 className={`text-3xl font-bold mb-2 ${variant === 'solve' ? 'text-gray-900 dark:text-white' : 'text-cyan-400'}`}>
                Document Ready for Analysis
              </h2>
              <p className={`${variant === 'solve' ? 'text-gray-600 dark:text-gray-300' : 'text-slate-300'} mb-4`}>
                {file?.name} - {file?.type === 'application/pdf'
                  ? `${documentPages.length} page${documentPages.length > 1 ? 's' : ''} ready`
                  : file?.type.startsWith('image/')
                    ? '1 image ready'
                    : 'file ready'}
              </p>
              <p className={variant === 'solve' ? 'text-gray-500 dark:text-gray-400' : 'text-slate-400'}>
                Language: {selectedLanguageLabel}
              </p>
            </div>

            {/* Document Preview */}
            <div className="mb-6 flex justify-center">
              <div className={`w-64 h-80 rounded-lg overflow-hidden border ${
                variant === 'solve' ? 'bg-gray-50 dark:bg-[#151518] border-gray-200 dark:border-white/10' : 'bg-slate-700/30 border-white/10'
              }`}>
                {documentPages.length > 0 ? (
                  <img 
                    src={documentPages[0]} 
                    alt="Document preview"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      console.log('🖼️ Document preview image failed to load - likely expired blob URL from history');
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center px-4 text-center">
                    <IconComponent icon={AiOutlineFileText} className="h-12 w-12 mb-3 text-gray-400 dark:text-gray-500" />
                    <p className="text-sm text-gray-600 dark:text-gray-300 break-all">{file?.name}</p>
                  </div>
                )}
              </div>
            </div>

                {/* Marking Standard Selector */}
            <div className="flex items-center justify-center mb-6">
              <div className={`rounded-lg p-4 border ${
                variant === 'solve' ? 'bg-gray-50 dark:bg-[#151518] border-gray-200 dark:border-white/10' : 'bg-slate-600/20 backdrop-blur-sm border-white/10'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <label className={`block text-sm font-medium text-center flex-1 ${variant === 'solve' ? 'text-gray-700 dark:text-gray-300' : 'text-slate-300'}`}>
                    {t('aiStudy.selectMarkingStandard')}
                  </label>
                </div>
                <select
                  value={selectedMarkingStandard}
                  onChange={(e) => setSelectedMarkingStandard(e.target.value)}
                  className={`px-4 py-2 rounded-lg min-w-[250px] focus:outline-none focus:ring-2 ${
                    variant === 'solve'
                      ? 'bg-white dark:bg-[#111111] border border-gray-300 dark:border-white/10 text-gray-800 dark:text-gray-300 focus:ring-[#8b5cf6]'
                      : 'bg-slate-600/50 backdrop-blur-sm border border-white/10 text-slate-300 focus:ring-cyan-500'
                  }`}
                >
                  {availableMarkingSchemes.map((standard) => (
                    <option key={standard.id} value={standard.id} className="bg-slate-700">
                      {standard.name} - {standard.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex items-center justify-center space-x-4">
              <motion.button
                onClick={handleRemoveFile}
                className={`flex items-center px-6 py-3 rounded-lg transition-colors border ${
                  variant === 'solve'
                    ? 'bg-gray-100 hover:bg-gray-200 dark:bg-[#27272a] dark:hover:bg-[#313136] text-gray-700 dark:text-gray-200 border-gray-200 dark:border-white/10'
                    : 'bg-slate-600/50 hover:bg-slate-500/50 text-slate-300 border-white/10'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <IconComponent icon={AiOutlineLeft} className="h-4 w-4 mr-2" />
                Change File
              </motion.button>

              <motion.button
                onClick={startProcessing}
                disabled={loading}
                className={`flex items-center justify-center px-8 py-4 rounded-lg text-white font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                  variant === 'solve' ? 'bg-[#8b5cf6] hover:bg-[#7c3aed]' : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                }`}
                whileHover={!loading ? { scale: 1.02 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
              >
                {loading ? (
                  <>
                    <motion.div
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
                    />
                    Starting Analysis...
                  </>
                ) : (
                  <>
                    Check Mistakes
                    <IconComponent icon={AiOutlineBulb} className="h-5 w-5 ml-2" />
                  </>
                )}
              </motion.button>
            </div>
            {cost > 0 && (
              <div className="flex items-center justify-center mt-4">
                <div className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full bg-gray-100 text-gray-700 dark:bg-[#1f1f22] dark:text-gray-300 border border-gray-200 dark:border-white/10">
                  <img src={coinIcon} alt="coin" className="w-5 h-5 rounded-full" />
                  <span>{cost} Coins</span>
                </div>
              </div>
            )}
            
            {processingStatus && (
              <motion.div
                className={`mt-6 p-4 rounded-lg border ${
                  variant === 'solve' ? 'bg-gray-50 dark:bg-[#151518] border-gray-200 dark:border-white/10' : 'bg-blue-500/10 backdrop-blur-sm border-blue-500/20'
                }`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p className={`text-sm flex items-center justify-center ${variant === 'solve' ? 'text-gray-700 dark:text-gray-300' : 'text-blue-400'}`}>
                  <motion.div
                    className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full mr-2"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
                  />
                  {processingStatus}
                </p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // After file upload, show split view with document on left and mistakes on right
  return (
    <div className={`mistake-checker-premium ${className || ''} lg:h-full lg:min-h-0 lg:flex lg:flex-col lg:overflow-hidden`}>
      {/* ── Compact single-row header ─────────────────────────────── */}
      <div className={`mb-3 lg:flex-shrink-0 rounded-2xl border px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2 ${
        variant === 'solve'
          ? 'bg-white dark:bg-[#151518] border-gray-200 dark:border-white/10'
          : 'bg-gradient-to-br from-slate-700/40 via-slate-800/40 to-slate-900/40 backdrop-blur-sm border-white/10'
      }`}>
        {/* Left: status + counts + filename */}
        <div className="flex items-center gap-3 flex-1 min-w-0 flex-wrap">
          {overallProcessingComplete && (
            <div className="flex items-center gap-1.5 text-[var(--text-primary)] shrink-0">
              <IconComponent icon={AiOutlineCheckCircle} className="h-4 w-4 text-[var(--success)]" />
              <span className="text-sm font-semibold whitespace-nowrap">Analysis Complete</span>
            </div>
          )}
          {overallProcessingComplete && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-xs ${variant === 'solve' ? 'text-gray-500 dark:text-gray-400' : 'text-slate-400'}`}>{totalMistakesCount} total</span>
              <span className="mistake-checker-tag grammar">Grammar {grammarCount}</span>
              <span className="mistake-checker-tag spelling">Spelling {spellingCount}</span>
              <span className="mistake-checker-tag style">Style {styleCount}</span>
            </div>
          )}
          <div className="flex items-center gap-2 min-w-0">
            <div className="min-w-0">
              <span className={`text-xs uppercase tracking-widest mr-1 ${variant === 'solve' ? 'text-gray-400 dark:text-gray-500' : 'text-cyan-300/60'}`}>Workspace</span>
              <span className={`text-sm font-semibold truncate ${variant === 'solve' ? 'text-gray-900 dark:text-white' : 'text-white'}`}>
                {file?.name || 'Uploaded document'}
              </span>
            </div>
            <span className={`text-xs shrink-0 ${variant === 'solve' ? 'text-gray-400 dark:text-gray-500' : 'text-slate-400'}`}>· {selectedLanguageLabel}</span>
          </div>
          {/* Page navigation */}
          {documentPages.length > 1 && (
            <div className={`flex items-center rounded-lg px-1.5 py-0.5 border ${
              variant === 'solve' ? 'bg-gray-50 dark:bg-[#1f1f22] border-gray-200 dark:border-white/10' : 'bg-slate-900/50 border-white/10'
            }`}>
              <button
                className={`p-1 rounded disabled:opacity-50 ${variant === 'solve' ? 'hover:bg-gray-200 dark:hover:bg-[#2a2a2f] text-gray-700 dark:text-gray-200' : 'hover:bg-cyan-500/20 text-cyan-300'}`}
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(prev => prev - 1)}
              >
                <IconComponent icon={AiOutlineLeft} className="h-3 w-3" />
              </button>
              <span className={`text-xs font-medium px-1.5 ${variant === 'solve' ? 'text-gray-700 dark:text-gray-300' : 'text-slate-200'}`}>
                {currentPage + 1}/{documentPages.length}
              </span>
              <button
                className={`p-1 rounded disabled:opacity-50 ${variant === 'solve' ? 'hover:bg-gray-200 dark:hover:bg-[#2a2a2f] text-gray-700 dark:text-gray-200' : 'hover:bg-cyan-500/20 text-cyan-300'}`}
                disabled={currentPage === documentPages.length - 1}
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                <IconComponent icon={AiOutlineRight} className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <motion.button
            onClick={() => setShowFileViewModal(true)}
            className={`flex items-center px-2.5 py-1.5 rounded-lg border text-xs ${
              variant === 'solve'
                ? 'bg-gray-100 hover:bg-gray-200 dark:bg-[#27272a] dark:hover:bg-[#313136] text-gray-700 dark:text-gray-200 border-gray-200 dark:border-white/10'
                : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border-blue-500/30'
            }`}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          >
            <IconComponent icon={AiOutlineFileText} className="h-3.5 w-3.5 mr-1" />
            View
          </motion.button>
          {pageMistakes.some(pm => pm.mistakes.length > 0) && (
            <motion.button
              onClick={applyAutoCorrect}
              className={`flex items-center px-2.5 py-1.5 rounded-lg border text-xs ${
                variant === 'solve'
                  ? 'bg-gray-100 hover:bg-gray-200 dark:bg-[#27272a] dark:hover:bg-[#313136] text-gray-700 dark:text-gray-200 border-gray-200 dark:border-white/10'
                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/30'
              }`}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            >
              <IconComponent icon={AiOutlineCheckCircle} className="h-3.5 w-3.5 mr-1" />
              Correct
            </motion.button>
          )}
          {markingSummary && overallProcessingComplete && (
            <motion.button
              onClick={() => setShowReportModal(true)}
              className={`flex items-center px-2.5 py-1.5 rounded-lg border text-xs ${
                variant === 'solve'
                  ? 'bg-[#8b5cf6] hover:bg-[#7c3aed] text-white border-transparent'
                  : 'bg-gradient-to-r from-purple-500/30 to-pink-500/30 hover:from-purple-500/40 hover:to-pink-500/40 text-white border-purple-500/30'
              }`}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            >
              <IconComponent icon={AiOutlineFileText} className="h-3.5 w-3.5 mr-1" />
              Report
            </motion.button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-1 lg:min-h-0 lg:grid lg:grid-cols-2 lg:overflow-hidden">
        {/* Left Side - Document (Full width on mobile, half on desktop) */}
        <div className={`rounded-xl shadow-lg overflow-hidden lg:min-h-0 order-1 lg:order-1 border ${
          variant === 'solve'
            ? 'bg-white dark:bg-[#111111] border-gray-200 dark:border-white/10'
            : 'bg-[#0f172a]/60 backdrop-blur-md border-white/10'
        }`}>
          <div className={`px-4 lg:px-6 py-3 lg:py-4 border-b flex items-center justify-between ${
            variant === 'solve'
              ? 'bg-gray-50 dark:bg-[#151518] border-gray-200 dark:border-white/10'
              : 'bg-[#0f172a]/60 backdrop-blur-md border-white/10'
          }`}>
            <h2 className={`text-lg font-semibold ${variant === 'solve' ? 'text-gray-900 dark:text-white' : 'text-cyan-400'}`}>Document</h2>
            <motion.button
              onClick={() => setShowFileViewModal(true)}
              className={`lg:hidden flex items-center px-3 py-1.5 rounded-lg border text-xs ${
                variant === 'solve'
                  ? 'bg-gray-100 hover:bg-gray-200 dark:bg-[#27272a] dark:hover:bg-[#313136] text-gray-700 dark:text-gray-200 border-gray-200 dark:border-white/10'
                  : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border-blue-500/30'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <IconComponent icon={AiOutlineFileText} className="h-3.5 w-3.5 mr-1" />
              Full Screen
            </motion.button>
            
          </div>
          
          <div className="h-64 lg:h-full p-4 relative overflow-hidden">
            <div className={`w-full h-full rounded-lg overflow-hidden border relative ${
              variant === 'solve'
                ? 'bg-gray-50 dark:bg-[#111111] border-gray-200 dark:border-white/10'
                : 'bg-black/20 backdrop-blur-md border-white/10'
            }`}>
              {textOnlyMode ? (
                /* Direct Text Display */
                <div className="w-full h-full overflow-auto lg:overflow-hidden p-4">
                  <div className={`whitespace-pre-wrap font-mono text-sm leading-relaxed ${variant === 'solve' ? 'text-gray-700 dark:text-gray-300' : 'text-slate-300'}`}>
                    {getCurrentDisplayText() ? (
                      showCorrectedText && correctedText ? (
                        <div className="space-y-2">
                          <div className="text-green-400 text-xs font-medium mb-2 bg-green-500/10 px-2 py-1 rounded">
                            ✅ Corrected Text
                          </div>
                          {renderMarkdownText(correctedText, variant === 'solve' ? 'prose prose-sm max-w-none dark:prose-invert text-gray-700 dark:text-gray-300' : 'prose prose-sm max-w-none dark:prose-invert text-slate-300', pageMistakes[0]?.mistakes || [], 'corrected')}
                        </div>
                      ) : (
                        ((pageMistakes[0]?.mistakes?.length || 0) === 0 || isLikelyMarkdown(getCurrentDisplayText())) ? (
                          renderMarkdownText(getCurrentDisplayText(), variant === 'solve' ? 'prose prose-sm max-w-none dark:prose-invert text-gray-700 dark:text-gray-300' : 'prose prose-sm max-w-none dark:prose-invert text-slate-300', pageMistakes[0]?.mistakes || [], 'original')
                        ) : (
                          highlightMistakesInText(
                            getCurrentDisplayText(), 
                            pageMistakes[0]?.mistakes || []
                          ).map((part, index) => (
                            part.isHighlighted ? (
                              <span
                                key={index}
                                className={`${
                                  part.mistakeType === 'grammar' ? 'bg-red-500/30 border-b-2 border-red-500' :
                                  part.mistakeType === 'spelling' ? 'bg-yellow-400/30 border-b-2 border-yellow-400/90' :
                                  part.mistakeType === 'punctuation' ? 'bg-red-400/25 border-b-2 border-red-400/90' :
                                  'bg-yellow-300/25 border-b-2 border-yellow-300/90'
                                } ${
                                  part.isSelected ? 'ring-2 ring-yellow-400 bg-yellow-400/20 shadow-lg animate-pulse' : ''
                                } rounded px-1 cursor-help transition-all hover:bg-opacity-50`}
                                title={`${part.mistakeType?.toUpperCase()}: ${part.text} → ${part.correction}`}
                                onClick={() => {
                                  const mistakeId = part.mistakeId;
                                  if (mistakeId) {
                                      focusMistake(mistakeId);
                                  }
                                }}
                              >
                                {part.text}
                              </span>
                            ) : (
                              <span key={index}>{part.text}</span>
                            )
                          ))
                        )
                      )
                    ) : (
                      <div className={`flex flex-col items-center justify-center h-full ${variant === 'solve' ? 'text-gray-500 dark:text-gray-400' : 'text-slate-400'}`}>
                        <IconComponent icon={AiOutlineFileText} className="h-8 w-8 mb-2 opacity-50" />
                        <p className="text-sm">No text to display</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : documentPages.length === 0 ? (
                <div className="w-full h-full overflow-auto lg:overflow-hidden p-4">
                  <div className="mb-4 flex items-center gap-3">
                    <IconComponent icon={AiOutlineFileText} className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    <p className={`text-sm ${variant === 'solve' ? 'text-gray-700 dark:text-gray-300' : 'text-slate-300'}`}>{file?.name}</p>
                  </div>
                  {extractedTexts[0]?.text ? (
                    <div className={`whitespace-pre-wrap font-mono text-sm leading-relaxed rounded-lg p-4 ${
                      variant === 'solve'
                        ? 'text-gray-800 dark:text-gray-200 bg-white dark:bg-[#151518] border border-gray-200 dark:border-white/10'
                        : 'text-slate-100 bg-slate-900/40 backdrop-blur-sm'
                    }`}>
                      {((pageMistakes[0]?.mistakes?.length || 0) === 0 || isLikelyMarkdown(extractedTexts[0].text)) ? (
                        renderMarkdownText(extractedTexts[0].text, variant === 'solve' ? 'prose prose-sm max-w-none dark:prose-invert text-gray-800 dark:text-gray-200' : 'prose prose-sm max-w-none dark:prose-invert text-slate-100', pageMistakes[0]?.mistakes || [], 'original')
                      ) : (
                        highlightMistakesInText(
                          extractedTexts[0].text,
                          pageMistakes[0]?.mistakes || []
                        ).map((part, index) => (
                          part.isHighlighted ? (
                            <span
                              key={index}
                              className={`${
                                part.mistakeType === 'grammar' ? 'bg-red-500/50 border-b-2 border-red-400' :
                                part.mistakeType === 'spelling' ? 'bg-yellow-400/45 border-b-2 border-yellow-300/90' :
                                part.mistakeType === 'punctuation' ? 'bg-red-400/40 border-b-2 border-red-300/90' :
                                'bg-yellow-300/40 border-b-2 border-yellow-300/90'
                              } rounded px-1`}
                            >
                              {part.text}
                            </span>
                          ) : (
                            <span key={index}>{part.text}</span>
                          )
                        ))
                      )}
                    </div>
                  ) : (
                    <div className={`flex flex-col items-center justify-center h-[70%] ${variant === 'solve' ? 'text-gray-500 dark:text-gray-400' : 'text-slate-400'}`}>
                      <p className="text-sm">{isProcessingStarted ? 'Processing...' : 'Click "Check Mistakes" to start analysis'}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex flex-col overflow-hidden">
                  <div className="w-full flex-1 min-h-0 px-4 pt-4 pb-2">
                    <div
                      className="relative w-full h-full rounded-lg overflow-hidden bg-black/20"
                      style={hasOcrOverlay ? { aspectRatio: `${overlayWidth} / ${overlayHeight}` } : undefined}
                    >
                      {hasOcrOverlay ? (
                        <svg
                          className="absolute inset-0 w-full h-full"
                          viewBox={`0 0 ${overlayWidth} ${overlayHeight}`}
                          preserveAspectRatio="xMidYMid meet"
                        >
                          <image
                            href={documentPages[currentPage]}
                            x={0}
                            y={0}
                            width={overlayWidth}
                            height={overlayHeight}
                            preserveAspectRatio="none"
                          />
                          {currentOcrOverlay!.results.map((line, index) => {
                            const polygon = Array.isArray(line.polygon) ? line.polygon : [];
                            const xValues = polygon.map((point) => point[0]).filter((value) => Number.isFinite(value));
                            const yValues = polygon.map((point) => point[1]).filter((value) => Number.isFinite(value));
                            const polygonBounds = xValues.length > 0 && yValues.length > 0
                              ? {
                                  x: Math.min(...xValues),
                                  y: Math.min(...yValues),
                                  width: Math.max(...xValues) - Math.min(...xValues),
                                  height: Math.max(...yValues) - Math.min(...yValues)
                                }
                              : null;
                            const bboxX = line.bbox?.x_min ?? polygonBounds?.x ?? 0;
                            const bboxY = line.bbox?.y_min ?? polygonBounds?.y ?? 0;
                            const bboxWidth = line.bbox?.width ?? polygonBounds?.width ?? 0;
                            const bboxHeight = line.bbox?.height ?? polygonBounds?.height ?? 0;
                            if (!line.text || bboxWidth <= 0 || bboxHeight <= 0) {
                              return null;
                            }

                            const highlight = getOverlayLineHighlight(line.text, currentMistakes, showCorrectedText);
                            const matchedMistakeId = highlight.matchedMistakeId;
                            const horizontalPadding = 6;
                            const availableWidth = Math.max(8, bboxWidth - horizontalPadding * 2);
                            const getMistakeIdFromClickPosition = (clientX: number) => {
                              if (highlight.ranges.length === 0) return null;
                              const relativeX = Math.max(0, Math.min(availableWidth, clientX - (bboxX + horizontalPadding)));
                              const totalChars = Math.max(1, highlight.displayText.length);
                              const charIndex = Math.floor((relativeX / availableWidth) * totalChars);
                              const clickedRange = highlight.ranges.find((range) => charIndex >= range.start && charIndex < range.end);
                              return clickedRange?.mistakeId || matchedMistakeId;
                            };

                            // Only render if there are actual mistake highlights
                            if (highlight.ranges.length === 0) return null;

                            return (
                              <g
                                key={`ocr-line-${currentPage}-${index}`}
                                onClick={(event) => {
                                  const selectedId = getMistakeIdFromClickPosition(event.clientX);
                                  if (selectedId) {
                                    focusMistake(selectedId);
                                  }
                                }}
                                className={matchedMistakeId ? 'cursor-pointer' : ''}
                              >
                                {highlight.tooltip && <title>{highlight.tooltip}</title>}
                                {highlight.ranges.map((range, rangeIndex) => {
                                  const totalChars = Math.max(1, highlight.displayText.length);
                                  const highlightX = bboxX + horizontalPadding + (range.start / totalChars) * availableWidth;
                                  const highlightWidth = Math.max(8, ((range.end - range.start) / totalChars) * availableWidth);
                                  const segmentFill = range.type === 'grammar'
                                    ? 'rgba(239,68,68,0.35)'
                                    : range.type === 'spelling'
                                      ? 'rgba(234,179,8,0.4)'
                                      : range.type === 'punctuation'
                                        ? 'rgba(249,115,22,0.35)'
                                        : 'rgba(168,85,247,0.35)';
                                  const segmentStroke = range.type === 'grammar'
                                    ? '#ef4444'
                                    : range.type === 'spelling'
                                      ? '#eab308'
                                      : range.type === 'punctuation'
                                        ? '#f97316'
                                        : '#a855f7';
                                  return (
                                    <rect
                                      key={`ocr-highlight-${currentPage}-${index}-${rangeIndex}`}
                                      x={highlightX}
                                      y={bboxY}
                                      width={highlightWidth}
                                      height={bboxHeight}
                                      rx={4}
                                      fill={segmentFill}
                                      stroke={segmentStroke}
                                      strokeWidth={1.5}
                                      className="cursor-pointer"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        focusMistake(range.mistakeId);
                                      }}
                                    />
                                  );
                                })}
                              </g>
                            );
                          })}
                        </svg>
                      ) : (
                        <img 
                          src={documentPages[currentPage]} 
                          alt={`Document page ${currentPage + 1}`}
                          className="absolute inset-0 w-full h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            console.log('🖼️ Image failed to load for page', currentPage + 1, '- likely expired blob URL from history');
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Content (Full width on mobile, half on desktop) */}
        <div className={`rounded-xl shadow-lg overflow-hidden lg:min-h-0 flex flex-col order-2 lg:order-2 border ${
          variant === 'solve'
            ? 'bg-white dark:bg-[#111111] border-gray-200 dark:border-white/10'
            : 'bg-slate-600/30 backdrop-blur-sm border-white/10'
        }`}>
          <div className={`px-4 lg:px-6 py-3 lg:py-4 border-b flex-shrink-0 ${
            variant === 'solve'
              ? 'bg-gray-50 dark:bg-[#151518] border-gray-200 dark:border-white/10'
              : 'bg-slate-700/50 backdrop-blur-sm border-white/10'
          }`}>
            <div className="flex items-center justify-between">
              <h2 className={`text-base lg:text-lg font-semibold ${variant === 'solve' ? 'text-gray-900 dark:text-white' : 'text-cyan-400'}`}>Mistakes & Assessment</h2>
              {pageMistakes[currentPage] && (
                <div className="flex items-center space-x-2">
                  {pageMistakes[currentPage].isLoading && (
                    <div className="flex items-center text-cyan-400">
                      <motion.div
                        className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full mr-2"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
                      />
                      <span className="text-xs lg:text-sm">Processing...</span>
                    </div>
                  )}
                  {pageMistakes[currentPage].isComplete && !pageMistakes[currentPage].error && (
                    <span className="text-xs lg:text-sm text-green-400 font-medium">✓ Complete</span>
                  )}
                  {pageMistakes[currentPage].error && (
                    <span className="text-xs lg:text-sm text-red-400 font-medium">⚠ Error</span>
                  )}
                </div>
              )}
            </div>
            
            {/* Progress indicator for all pages */}
            {pageMistakes.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center space-x-1">
                  {pageMistakes.map((pm, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 lg:w-3 lg:h-3 rounded-full ${
                        pm.isComplete && !pm.error
                          ? 'bg-green-500'
                          : pm.error
                          ? 'bg-red-500'
                          : pm.isLoading
                          ? 'bg-cyan-500 animate-pulse'
                          : 'bg-slate-500'
                      }`}
                      title={`Page ${index + 1}: ${
                        pm.isComplete && !pm.error
                          ? 'Complete'
                          : pm.error
                          ? 'Error'
                          : pm.isLoading
                          ? 'Processing'
                          : 'Pending'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs mt-1 ${variant === 'solve' ? 'text-gray-500 dark:text-gray-400' : 'text-slate-400'}`}>
                  {pageMistakes.filter(pm => pm.isComplete && !pm.error).length} of {pageMistakes.length} pages completed
                </p>
              </div>
            )}
          </div>
          
          <div className="flex-1 p-4 lg:p-6 lg:min-h-0 lg:overflow-y-auto" ref={mistakesContainerRef}>
            {loading ? (
              <div className={`flex flex-col items-center justify-center h-32 lg:h-full ${variant === 'solve' ? 'text-gray-500 dark:text-gray-400' : 'text-slate-400'}`}>
                <motion.div
                  className="w-12 h-12 lg:w-16 lg:h-16 border-4 border-cyan-500 border-t-transparent rounded-full mb-4"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
                />
                <p className="text-center text-sm">{processingStatus || 'Checking for mistakes...'}</p>
                <div className={`w-full max-w-xs mt-3 h-2 rounded-full overflow-hidden ${variant === 'solve' ? 'bg-gray-200 dark:bg-[#27272a]' : 'bg-slate-700/60'}`}>
                  <motion.div
                    className="h-full bg-cyan-500"
                    animate={{ width: `${webhookProgress}%` }}
                    transition={{ ease: 'easeOut', duration: 0.3 }}
                  />
                </div>
                <p className="text-xs mt-2 text-center">
                  {webhookProgress >= 100 ? 'Finalizing result...' : `${webhookProgress}% • up to ${webhookRemainingSeconds}s`}
                </p>
              </div>
            ) : (
              <>
                <div className={`mb-4 lg:mb-6 rounded-xl p-4 border ${
                  variant === 'solve'
                    ? 'bg-gray-50 dark:bg-[#151518] border-gray-200 dark:border-white/10'
                    : 'bg-slate-700/40 backdrop-blur-sm border-white/10'
                }`}>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h3 className={`text-sm font-semibold ${variant === 'solve' ? 'text-gray-800 dark:text-gray-100' : 'text-slate-100'}`}>Marking Scheme</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      variant === 'solve'
                        ? 'bg-gray-200 text-gray-600 dark:bg-[#27272a] dark:text-gray-300'
                        : 'bg-slate-800/80 text-slate-300 border border-white/10'
                    }`}>
                      {selectedMarkingStandard.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {availableMarkingSchemes.map((scheme) => (
                      <button
                        key={scheme.id}
                        onClick={() => setSelectedMarkingStandard(scheme.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          selectedMarkingStandard === scheme.id
                            ? (variant === 'solve' ? 'bg-[#8b5cf6] text-white shadow-sm' : 'bg-cyan-500 text-slate-900')
                            : (variant === 'solve' ? 'bg-white text-gray-700 border border-gray-200 dark:bg-[#1f1f22] dark:text-gray-200 dark:border-white/10' : 'bg-slate-800/70 text-slate-200 border border-white/10')
                        }`}
                      >
                        {scheme.name}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className={`rounded-lg p-3 border ${variant === 'solve' ? 'bg-white dark:bg-[#1a1a1d] border-gray-200 dark:border-white/10' : 'bg-slate-900/50 border-white/10'}`}>
                      <div className="text-xs opacity-70 mb-1">Mistakes</div>
                      <div className="font-semibold">{currentMistakes.length}</div>
                    </div>
                    <div className={`rounded-lg p-3 border ${variant === 'solve' ? 'bg-white dark:bg-[#1a1a1d] border-gray-200 dark:border-white/10' : 'bg-slate-900/50 border-white/10'}`}>
                      <div className="text-xs opacity-70 mb-1">Current Page</div>
                      <div className="font-semibold">{textOnlyMode ? 'Text' : `Page ${currentPage + 1}`}</div>
                    </div>
                    <div className={`rounded-lg p-3 border ${variant === 'solve' ? 'bg-white dark:bg-[#1a1a1d] border-gray-200 dark:border-white/10' : 'bg-slate-900/50 border-white/10'}`}>
                      <div className="text-xs opacity-70 mb-1">Scheme Score</div>
                      <div className="font-semibold">
                        {selectedN8nScheme ? `${selectedN8nScheme.score}/${selectedN8nScheme.maxScore}` : 'Internal Model'}
                      </div>
                    </div>
                    <div className={`rounded-lg p-3 border ${variant === 'solve' ? 'bg-white dark:bg-[#1a1a1d] border-gray-200 dark:border-white/10' : 'bg-slate-900/50 border-white/10'}`}>
                      <div className="text-xs opacity-70 mb-1">Grade</div>
                      <div className="font-semibold">
                        {selectedN8nScheme ? `${selectedN8nScheme.grade || 'N/A'} (${Math.round(selectedN8nScheme.percentage)}%)` : 'Pending AI rubric'}
                      </div>
                    </div>
                  </div>
                  {selectedN8nScheme?.feedback && (
                    <div className={`mt-3 rounded-lg p-3 text-xs border ${variant === 'solve' ? 'bg-white dark:bg-[#1a1a1d] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300' : 'bg-slate-900/50 border-white/10 text-slate-300'}`}>
                      {selectedN8nScheme.feedback}
                    </div>
                  )}
                </div>

                {/* Integrated Marking Summary (shown when processing is complete) */}
                {markingSummary && overallProcessingComplete && (
                  <motion.div 
                    className={`mb-4 lg:mb-6 rounded-xl p-4 lg:p-6 border ${
                      variant === 'solve'
                        ? 'bg-gray-50 dark:bg-[#151518] border-gray-200 dark:border-white/10'
                        : 'bg-gradient-to-br from-purple-500/10 via-slate-900/20 to-cyan-500/10 backdrop-blur-sm border-purple-500/20'
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    <h3 className={`text-lg lg:text-xl font-semibold mb-4 flex items-center ${variant === 'solve' ? 'text-gray-900 dark:text-white' : 'text-purple-300'}`}>
                      <IconComponent icon={AiOutlineFileText} className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
                      Assessment Summary
                    </h3>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className={`rounded-lg p-3 border ${variant === 'solve' ? 'bg-white dark:bg-[#1a1a1d] border-gray-200 dark:border-white/10' : 'bg-slate-900/50 border-white/10'}`}>
                        <p className="text-xs opacity-70 mb-1">Total Score</p>
                        <p className="text-lg font-semibold">{markingSummary.totalScore}/{markingSummary.maxScore}</p>
                      </div>
                      <div className={`rounded-lg p-3 border ${variant === 'solve' ? 'bg-white dark:bg-[#1a1a1d] border-gray-200 dark:border-white/10' : 'bg-slate-900/50 border-white/10'}`}>
                        <p className="text-xs opacity-70 mb-1">Grade</p>
                        <p className="text-lg font-semibold">{markingSummary.grade} ({Math.round(markingSummary.percentage)}%)</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs opacity-70">Assessment Progress</span>
                        <span className="text-xs font-medium">{Math.round(markingSummary.percentage)}%</span>
                      </div>
                      <div className={`w-full rounded-full h-2.5 ${variant === 'solve' ? 'bg-gray-200 dark:bg-[#27272a]' : 'bg-slate-700/80'}`}>
                        <motion.div 
                          className={`h-2.5 rounded-full ${variant === 'solve' ? 'bg-[#8b5cf6]' : 'bg-gradient-to-r from-cyan-500 to-purple-500'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${markingSummary.percentage}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                        ></motion.div>
                      </div>
                    </div>

                    {hasSummaryInsights && (
                      <div className="grid grid-cols-1 gap-3 mb-4">
                        {summaryStrengths.length > 0 && (
                          <div className={`rounded-lg p-3 border ${variant === 'solve' ? 'bg-green-50 dark:bg-green-500/10 border-green-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
                            <h4 className={`text-sm font-semibold mb-2 ${variant === 'solve' ? 'text-green-700 dark:text-green-300' : 'text-green-300'}`}>Strengths</h4>
                            <ul className="space-y-1">
                              {summaryStrengths.slice(0, 3).map((strength, index) => (
                                <li key={index} className={`text-xs ${variant === 'solve' ? 'text-green-700 dark:text-green-200' : 'text-green-200'}`}>• {strength}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {summaryWeaknesses.length > 0 && (
                          <div className={`rounded-lg p-3 border ${variant === 'solve' ? 'bg-rose-50 dark:bg-rose-500/10 border-rose-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
                            <h4 className={`text-sm font-semibold mb-2 ${variant === 'solve' ? 'text-rose-700 dark:text-rose-300' : 'text-rose-300'}`}>Needs Work</h4>
                            <ul className="space-y-1">
                              {summaryWeaknesses.slice(0, 3).map((weakness, index) => (
                                <li key={index} className={`text-xs ${variant === 'solve' ? 'text-rose-700 dark:text-rose-200' : 'text-rose-200'}`}>• {weakness}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {summaryRecommendations.length > 0 && (
                          <div className={`rounded-lg p-3 border ${variant === 'solve' ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-500/20' : 'bg-blue-500/10 border-blue-500/20'}`}>
                            <h4 className={`text-sm font-semibold mb-2 ${variant === 'solve' ? 'text-blue-700 dark:text-blue-300' : 'text-blue-300'}`}>AI Recommendations</h4>
                            <ul className="space-y-1">
                              {summaryRecommendations.slice(0, 3).map((item, index) => (
                                <li key={index} className={`text-xs ${variant === 'solve' ? 'text-blue-700 dark:text-blue-200' : 'text-blue-200'}`}>• {item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {markingSummary.studyPlan.length > 0 && (
                      <div className={`rounded-lg p-3 border ${variant === 'solve' ? 'bg-white dark:bg-[#1a1a1d] border-gray-200 dark:border-white/10' : 'bg-slate-900/50 border-white/10'}`}>
                        <h4 className={`text-sm font-semibold mb-2 ${variant === 'solve' ? 'text-gray-800 dark:text-gray-100' : 'text-cyan-300'}`}>Study Plan</h4>
                        <div className="space-y-2">
                          {markingSummary.studyPlan.slice(0, 2).map((item, index) => (
                            <div key={index} className="flex items-center justify-between gap-3">
                              <span className={`text-xs ${variant === 'solve' ? 'text-gray-600 dark:text-gray-300' : 'text-slate-200'}`}>{item.topic}</span>
                              <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                                item.priority === 'high'
                                  ? 'bg-red-500/20 text-red-400'
                                  : item.priority === 'medium'
                                    ? 'bg-yellow-500/20 text-yellow-400'
                                    : 'bg-emerald-500/20 text-emerald-400'
                              }`}>
                                {item.priority}
                              </span>
                            </div>
                          ))}
                          {markingSummary.studyPlan.length > 2 && (
                            <p className={`text-xs ${variant === 'solve' ? 'text-gray-500 dark:text-gray-400' : 'text-slate-400'}`}>+ {markingSummary.studyPlan.length - 2} more items</p>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {pageMistakes[currentPage] && pageMistakes[currentPage].mistakes.length > 0 ? (
                  <div className="space-y-3 lg:space-y-4">
                    <div className={`rounded-xl p-4 border ${
                      variant === 'solve'
                        ? 'bg-gray-50 dark:bg-[#151518] border-gray-200 dark:border-white/10'
                        : 'bg-teal-500/10 backdrop-blur-sm border-teal-500/20'
                    }`}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className={`text-base lg:text-lg font-semibold ${variant === 'solve' ? 'text-gray-900 dark:text-white' : 'text-teal-300'}`}>
                          {textOnlyMode ? 'Text Analysis' : `Page ${currentPage + 1}`} · {pageMistakes[currentPage].mistakes.length} mistakes
                        </h3>
                        <div className="flex items-center gap-2 text-xs">
                          <span className={`px-2 py-1 rounded-full ${variant === 'solve' ? 'bg-white border border-gray-200 text-gray-600 dark:bg-[#1f1f22] dark:border-white/10 dark:text-gray-300' : 'bg-slate-900/60 border border-white/10 text-slate-300'}`}>
                            Grammar {mistakeTypeCounts.grammar || 0}
                          </span>
                          <span className={`px-2 py-1 rounded-full ${variant === 'solve' ? 'bg-white border border-gray-200 text-gray-600 dark:bg-[#1f1f22] dark:border-white/10 dark:text-gray-300' : 'bg-slate-900/60 border border-white/10 text-slate-300'}`}>
                            Spelling {mistakeTypeCounts.spelling || 0}
                          </span>
                          <span className={`px-2 py-1 rounded-full ${variant === 'solve' ? 'bg-white border border-gray-200 text-gray-600 dark:bg-[#1f1f22] dark:border-white/10 dark:text-gray-300' : 'bg-slate-900/60 border border-white/10 text-slate-300'}`}>
                            Style {(mistakeTypeCounts.punctuation || 0) + (mistakeTypeCounts.other || 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {pageMistakes[currentPage].mistakes.map((mistake) => {
                      const normalizedType = normalizeMistakeType(mistake.type);
                      const accentColor = normalizedType === 'grammar' ? '#c0392b' : normalizedType === 'spelling' ? '#8b5cf6' : '#6366f1';

                      return (
                        <motion.div
                          key={mistake.id}
                          ref={(el) => {
                            mistakeCardRefs.current[`${currentPage}-${mistake.id}`] = el;
                          }}
                          className={`rounded-xl p-4 border cursor-pointer transition-all ${
                            selectedMistakeId === mistake.id
                              ? (variant === 'solve' ? 'border-cyan-400/60 bg-gradient-to-r from-violet-500/10 via-cyan-400/10 to-sky-400/10 shadow-md' : 'border-cyan-400/70 bg-gradient-to-r from-cyan-500/15 via-blue-500/10 to-violet-500/15')
                              : (variant === 'solve' ? 'bg-[var(--surface)] border-[var(--border)] hover:border-[#8b5cf6]/60 hover:shadow-sm' : 'bg-slate-700/30 backdrop-blur-sm border-white/10 hover:border-cyan-500/30')
                          }`}
                          style={{ borderLeftWidth: 4, borderLeftColor: accentColor }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: mistake.id * 0.08 }}
                          onClick={() => {
                            focusMistake(mistake.id);
                          }}
                        >
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <span className="inline-block px-2 py-1 text-xs font-medium rounded border border-[#2a2a2a] text-[var(--text-secondary)] bg-[var(--surface-2)]">
                              {mistake.type}
                            </span>
                            <span className={`text-xs ${variant === 'solve' ? 'text-[var(--text-muted)]' : 'text-slate-400'}`}>Mistake #{mistake.id}</span>
                          </div>

                          <div className="space-y-3">
                            <div className="rounded-lg border border-[#2a2a2a] bg-[var(--surface-2)] p-2.5">
                              <p className="text-sm text-[#d76a63] line-through">{mistake.incorrect}</p>
                            </div>
                            <div className="rounded-lg border border-[#2a2a2a] bg-[var(--surface-2)] p-2.5">
                              <p className="text-sm text-[#6fd39a]">{mistake.correct}</p>
                            </div>
                          </div>

                          {mistake.explanation && (
                            <div className="mt-3 p-2.5 rounded-lg border border-[#2a2a2a] bg-[var(--surface-2)]">
                              <p className="text-xs text-[var(--text-secondary)]">{mistake.explanation}</p>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                ) : pageMistakes[currentPage] && pageMistakes[currentPage].isComplete ? (
                  <div className={`flex flex-col items-center justify-center h-32 lg:h-full ${variant === 'solve' ? 'text-gray-500 dark:text-gray-400' : 'text-slate-400'}`}>
                    <div className="text-4xl lg:text-6xl mb-4">✅</div>
                    <h3 className="text-lg lg:text-xl font-semibold text-green-400 mb-2">No Mistakes Found!</h3>
                    <p className="text-center text-sm">This page appears to be error-free. Great job!</p>
                    
                    {/* Show summary even when no mistakes found */}
                    {markingSummary && overallProcessingComplete && (
                      <div className="mt-6 text-center">
                        <div className="text-xl lg:text-2xl font-bold text-green-400 mb-2">
                          Perfect Score: {markingSummary.totalScore}/{markingSummary.maxScore}
                        </div>
                        <div className="text-base lg:text-lg text-green-300">
                          Grade: {markingSummary.grade} (Excellent!)
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`flex flex-col items-center justify-center h-32 lg:h-full ${variant === 'solve' ? 'text-gray-500 dark:text-gray-400' : 'text-slate-400'}`}>
                    <IconComponent icon={AiOutlineBulb} className="h-8 w-8 lg:h-12 lg:w-12 mb-3 opacity-50" />
                    <p className="text-center text-sm">Mistakes and assessment will appear here after processing your document.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Assessment Summary Section - Now displayed below the main component */}
      {variant !== 'solve' && markingSummary && overallProcessingComplete && (
        <motion.div 
          className="mt-8 max-w-6xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-700/50 backdrop-blur-sm border border-white/10 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-cyan-400 flex items-center">
                <IconComponent icon={AiOutlineFileText} className="h-6 w-6 mr-3" />
                Assessment Summary
              </h3>
              <div className="text-right">
                <div className="text-2xl font-bold text-cyan-400">
                  {markingSummary.totalScore}/{markingSummary.maxScore}
                </div>
                <div className="text-sm text-slate-300">
                  Grade: {markingSummary.grade} ({Math.round(markingSummary.percentage)}%)
                </div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-slate-600/30 rounded-full h-3 mb-6">
              <motion.div 
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${markingSummary.percentage}%` }}
                transition={{ duration: 1 }}
              ></motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Strengths */}
              {markingSummary.strengths.length > 0 && (
                <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
                  <h4 className="text-green-400 font-semibold mb-3 flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Strengths
                  </h4>
                  <ul className="space-y-2">
                    {markingSummary.strengths.slice(0, 2).map((strength, index) => (
                      <li key={index} className="text-sm text-slate-300 flex items-start">
                        <span className="text-green-400 mr-2">•</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Areas for Improvement */}
              {markingSummary.weaknesses.length > 0 && (
                <div className="bg-indigo-500/10 rounded-lg p-4 border border-indigo-500/20">
                  <h4 className="text-indigo-400 font-semibold mb-3 flex items-center">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
                    Areas for Improvement
                  </h4>
                  <ul className="space-y-2">
                    {markingSummary.weaknesses.slice(0, 2).map((weakness, index) => (
                      <li key={index} className="text-sm text-slate-300 flex items-start">
                        <span className="text-indigo-400 mr-2">•</span>
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Study Plan */}
              {markingSummary.studyPlan.length > 0 && (
                <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
                  <h4 className="text-purple-400 font-semibold mb-3 flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                    Study Plan
                  </h4>
                  <div className="space-y-2">
                    {markingSummary.studyPlan.slice(0, 1).map((item, index) => (
                      <div key={index} className="text-sm">
                        <div className="text-purple-400 font-medium">{item.topic}</div>
                        <div className="text-slate-300 text-xs">{item.description}</div>
                      </div>
                    ))}
                    {markingSummary.studyPlan.length > 1 && (
                      <p className="text-xs text-slate-400">+ {markingSummary.studyPlan.length - 1} more items</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* View Full Report Button */}
            <div className="mt-6 text-center">
              <motion.button
                onClick={() => setShowReportModal(true)}
                className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 rounded-lg text-purple-400 transition-colors border border-purple-500/30 mx-auto"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <IconComponent icon={AiOutlineFileText} className="h-5 w-5 mr-2" />
                View Full Assessment Report
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Response Upgrade Modal */}
      <ResponseUpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        message={upgradeMessage}
      />

      {/* Report Modal */}
      <AnimatePresence>
        {showReportModal && markingSummary && (
          <PortalModal 
            isOpen={showReportModal}
            onClose={() => setShowReportModal(false)}
            className={`rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl relative ${
              variant === 'solve'
                ? 'bg-white dark:bg-[#0f0f10] border border-gray-200 dark:border-white/10'
                : 'bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
                <IconComponent icon={AiOutlineFileText} className="h-8 w-8 mr-3 text-[#8b5cf6]" />
                Assessment Report
              </h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(90vh-120px)] space-y-6">
              {/* Score Overview */}
              <div className="bg-gray-50 dark:bg-[#151518] rounded-xl p-6 border border-gray-200 dark:border-white/10">
                <div className="text-center mb-6">
                  <div className="text-6xl font-bold text-[#8b5cf6] mb-2">
                    {markingSummary.totalScore}/{markingSummary.maxScore}
                  </div>
                  <div className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
                    Grade: {markingSummary.grade} ({Math.round(markingSummary.percentage)}%)
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-[#27272a] rounded-full h-6">
                    <motion.div 
                      className="bg-[#8b5cf6] h-6 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${markingSummary.percentage}%` }}
                      transition={{ duration: 1 }}
                    ></motion.div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mt-2">
                    Assessed using {MARKING_STANDARDS.find(s => s.id === selectedMarkingStandard)?.name} standards
                  </p>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Strengths */}
                <div className="bg-white dark:bg-[#151518] rounded-xl p-6 border border-gray-200 dark:border-white/10">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white mr-2">✓</span>
                    Strengths
                  </h3>
                  <ul className="space-y-3">
                    {markingSummary.strengths.map((strength, index) => (
                      <li key={index} className="text-gray-700 dark:text-gray-300 flex items-start">
                        <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Areas for Improvement */}
                <div className="bg-white dark:bg-[#151518] rounded-xl p-6 border border-gray-200 dark:border-white/10">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <span className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white mr-2">!</span>
                    Areas for Improvement
                  </h3>
                  <ul className="space-y-3">
                    {markingSummary.weaknesses.length > 0 ? (
                      markingSummary.weaknesses.map((weakness, index) => (
                        <li key={index} className="text-gray-700 dark:text-gray-300 flex items-start">
                          <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          {weakness}
                        </li>
                      ))
                    ) : (
                      <li className="text-gray-700 dark:text-gray-300">No major areas of concern identified</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-white dark:bg-[#151518] rounded-xl p-6 border border-gray-200 dark:border-white/10">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <IconComponent icon={AiOutlineBulb} className="w-6 h-6 mr-2 text-yellow-500" />
                  Recommendations
                </h3>
                <ul className="space-y-4">
                  {markingSummary.recommendations.map((rec, index) => (
                    <li key={index} className="text-gray-700 dark:text-gray-300 flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Study Plan */}
              <div className="bg-white dark:bg-[#151518] rounded-xl p-6 border border-gray-200 dark:border-white/10">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <IconComponent icon={AiOutlineBook} className="w-6 h-6 mr-2 text-purple-600" />
                  Personalized Study Plan
                </h3>
                <div className="space-y-4">
                  {markingSummary.studyPlan.map((item, index) => (
                    <div key={index} className="bg-gray-50 dark:bg-[#111111] border border-gray-200 dark:border-white/10 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white">{item.topic}</h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          item.priority === 'high' ? 'bg-red-100 text-red-800' :
                          item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {item.priority} priority
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Export Options */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-white/10">
                <button className="flex items-center px-4 py-2 bg-[#8b5cf6] text-white rounded-lg hover:bg-[#7c3aed] transition-colors">
                  <IconComponent icon={FiDownload} className="h-4 w-4 mr-2" />
                  Download PDF
                </button>
                <button className="flex items-center px-4 py-2 bg-gray-700 dark:bg-[#27272a] text-white rounded-lg hover:bg-gray-800 dark:hover:bg-[#313136] transition-colors">
                  <IconComponent icon={FiCopy} className="h-4 w-4 mr-2" />
                  Copy Report
                </button>
                <button className="flex items-center px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg hover:bg-black dark:hover:bg-gray-200 transition-colors">
                  <IconComponent icon={FiShare2} className="h-4 w-4 mr-2" />
                  Share Report
                </button>
              </div>
            </div>
          </PortalModal>
        )}
      </AnimatePresence>

      {/* File View Modal */}
      <AnimatePresence>
        {showFileViewModal && (
          <PortalModal 
            isOpen={showFileViewModal}
            onClose={() => setShowFileViewModal(false)}
            className={`rounded-xl p-6 max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl relative ${
              variant === 'solve'
                ? 'bg-white dark:bg-[#0f0f10] border border-gray-200 dark:border-white/10'
                : 'bg-slate-800 border border-white/10'
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-2xl font-bold flex items-center ${variant === 'solve' ? 'text-gray-900 dark:text-white' : 'text-cyan-400'}`}>
                <IconComponent icon={AiOutlineFileText} className="h-6 w-6 mr-3" />
                Original Document: {file?.name}
              </h3>
              <button
                onClick={() => setShowFileViewModal(false)}
                className={`p-2 rounded-lg transition-colors ${
                  variant === 'solve'
                    ? 'text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                    : 'text-slate-400 hover:text-slate-300 hover:bg-slate-700'
                }`}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
              {documentPages.length > 0 ? (
                <div className="space-y-6">
                  {/* Page Navigation for Multiple Pages */}
                  {documentPages.length > 1 && (
                    <div className={`flex items-center justify-center space-x-4 rounded-lg p-4 ${
                      variant === 'solve' ? 'bg-gray-50 dark:bg-[#151518] border border-gray-200 dark:border-white/10' : 'bg-slate-700/30'
                    }`}>
                      <button 
                        className={`px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                          variant === 'solve'
                            ? 'bg-gray-100 hover:bg-gray-200 dark:bg-[#27272a] dark:hover:bg-[#313136] text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/10'
                            : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30'
                        }`}
                        disabled={currentPage === 0}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                      >
                        Previous
                      </button>
                      <span className={`font-medium ${variant === 'solve' ? 'text-gray-700 dark:text-gray-200' : 'text-slate-300'}`}>
                        Page {currentPage + 1} of {documentPages.length}
                      </span>
                      <button 
                        className={`px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                          variant === 'solve'
                            ? 'bg-gray-100 hover:bg-gray-200 dark:bg-[#27272a] dark:hover:bg-[#313136] text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/10'
                            : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30'
                        }`}
                        disabled={currentPage === documentPages.length - 1}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                      >
                        Next
                      </button>
                    </div>
                  )}

                  {/* Document Display */}
                  <div className="bg-white rounded-lg p-4 flex justify-center">
                    <img 
                      src={documentPages[currentPage]} 
                      alt={`Document page ${currentPage + 1}`}
                      className="max-w-full max-h-[70vh] object-contain shadow-lg"
                      onError={(e) => {
                        // Handle broken image URLs (e.g., expired blob URLs from history)
                        e.currentTarget.style.display = 'none';
                        console.log('🖼️ File view modal image failed to load for page', currentPage + 1, '- likely expired blob URL from history');
                      }}
                    />
                  </div>

                  {/* Document Info */}
                  <div className={`rounded-lg p-4 space-y-2 ${
                    variant === 'solve' ? 'bg-gray-50 dark:bg-[#151518] border border-gray-200 dark:border-white/10' : 'bg-slate-700/30'
                  }`}>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className={variant === 'solve' ? 'text-gray-500 dark:text-gray-400' : 'text-slate-400'}>File Name:</span>
                        <span className={variant === 'solve' ? 'text-gray-800 dark:text-gray-200 ml-2' : 'text-slate-200 ml-2'}>{file?.name}</span>
                      </div>
                      <div>
                        <span className={variant === 'solve' ? 'text-gray-500 dark:text-gray-400' : 'text-slate-400'}>File Type:</span>
                        <span className={variant === 'solve' ? 'text-gray-800 dark:text-gray-200 ml-2' : 'text-slate-200 ml-2'}>{file?.type}</span>
                      </div>
                      <div>
                        <span className={variant === 'solve' ? 'text-gray-500 dark:text-gray-400' : 'text-slate-400'}>File Size:</span>
                        <span className={variant === 'solve' ? 'text-gray-800 dark:text-gray-200 ml-2' : 'text-slate-200 ml-2'}>{file?.size ? (file.size / 1024 / 1024).toFixed(2) : '0'} MB</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : textOnlyMode ? (
                <div className={`rounded-lg p-6 ${variant === 'solve' ? 'bg-gray-50 dark:bg-[#151518] border border-gray-200 dark:border-white/10' : 'bg-slate-700/30'}`}>
                  <h4 className={`mb-4 font-semibold ${variant === 'solve' ? 'text-gray-900 dark:text-white' : 'text-cyan-400'}`}>Original Text:</h4>
                  <div className={`rounded-lg p-4 max-h-96 overflow-y-auto ${variant === 'solve' ? 'bg-white dark:bg-[#111111] border border-gray-200 dark:border-white/10' : 'bg-slate-800/50'}`}>
                    <pre className={`whitespace-pre-wrap text-sm font-mono ${variant === 'solve' ? 'text-gray-700 dark:text-gray-300' : 'text-slate-300'}`}>
                      {directText}
                    </pre>
                  </div>
                </div>
              ) : file ? (
                <div className={`rounded-lg p-6 ${variant === 'solve' ? 'bg-gray-50 dark:bg-[#151518] border border-gray-200 dark:border-white/10' : 'bg-slate-700/30'}`}>
                  <div className="flex flex-col items-center justify-center text-center">
                    <IconComponent icon={AiOutlineFileText} className="h-16 w-16 mb-4 opacity-60" />
                    <p className={`font-medium mb-2 ${variant === 'solve' ? 'text-gray-900 dark:text-white' : 'text-slate-200'}`}>{file.name}</p>
                    <p className={`text-sm ${variant === 'solve' ? 'text-gray-500 dark:text-gray-400' : 'text-slate-400'}`}>
                      Preview is not available for this file type in modal.
                    </p>
                  </div>
                </div>
              ) : (
                <div className={`flex flex-col items-center justify-center h-64 ${variant === 'solve' ? 'text-gray-500 dark:text-gray-400' : 'text-slate-400'}`}>
                  <IconComponent icon={AiOutlineFileText} className="h-16 w-16 mb-4 opacity-50" />
                  <p>No document to display</p>
                </div>
              )}
            </div>
          </PortalModal>
        )}
      </AnimatePresence>

      {variant !== 'solve' && (
        <AnimatePresence>
          {showHistory && (
            <PortalModal 
              isOpen={showHistory}
              onClose={() => setShowHistory(false)}
              className="bg-slate-800/90 backdrop-blur-sm border border-white/10 rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-2xl relative"
            >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-cyan-400 flex items-center">
                <IconComponent icon={AiOutlineHistory} className="h-7 w-7 mr-3" />
                Mistake Check History
                <span className="ml-3 text-sm bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full">
                  {mistakeHistory.length} item{mistakeHistory.length !== 1 ? 's' : ''}
                </span>
              </h3>
              <div className="flex items-center space-x-3">
                {mistakeHistory.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => showConfirmation('Are you sure you want to clear all history? This action cannot be undone.', clearAllHistory)}
                    className="flex items-center px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors border border-red-500/30"
                  >
                    <IconComponent icon={AiOutlineDelete} className="h-4 w-4 mr-2" />
                    Clear All
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
              {mistakeHistory.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {mistakeHistory.map((item) => (
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
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="flex items-center space-x-2">
                              <div className={`w-2 h-2 rounded-full ${
                                item.fileType === 'text' ? 'bg-green-500' : 
                                item.fileType.includes('pdf') ? 'bg-red-500' : 
                                'bg-blue-500'
                              }`} />
                              <span className="text-sm font-medium text-slate-200 truncate max-w-[200px]">
                                {item.fileName}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded border border-yellow-500/30">
                                {item.mistakes.length} mistake{item.mistakes.length !== 1 ? 's' : ''}
                              </span>
                              {item.markingSummary && (
                                <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded border border-purple-500/30">
                                  {item.markingSummary.grade}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400 flex items-center">
                              <IconComponent icon={FiClock} className="h-3 w-3 mr-1" />
                              {formatRelativeTime(item.timestamp)}
                            </span>
                          </div>
                        </div>
                        
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            showConfirmation('Are you sure you want to delete this history item?', () => deleteHistoryItem(item.id));
                          }}
                          className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-400 transition-all rounded-lg hover:bg-red-500/10"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <IconComponent icon={AiOutlineDelete} className="h-4 w-4" />
                        </motion.button>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm text-slate-300 line-clamp-3">
                          {item.text.length > 150 ? `${item.text.substring(0, 150)}...` : item.text}
                        </p>
                        {item.markingSummary && (
                          <div className="flex items-center space-x-2 text-xs">
                            <span className="text-slate-400">Score:</span>
                            <span className="text-cyan-400 font-medium">
                              {item.markingSummary.percentage.toFixed(1)}%
                            </span>
                            <span className="text-slate-400">•</span>
                            <span className="text-slate-400">
                              {item.markingSummary.totalScore}/{item.markingSummary.maxScore}
                            </span>
                          </div>
                        )}
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
                    <p className="text-xl font-medium mb-2">{t('aiStudy.noMistakeCheckHistoryYet')}</p>
                    <p className="text-sm">{t('aiStudy.analyzedDocumentsWillAppearHere')}</p>
                    <p className="text-xs mt-2 text-slate-500">Upload a document to get started.</p>
                  </motion.div>
                </div>
              )}
            </div>
            </PortalModal>
          )}
        </AnimatePresence>
      )}

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <PortalModal 
            isOpen={showConfirmModal}
            onClose={handleCancel}
            className={`backdrop-blur-sm rounded-xl p-6 max-w-md w-full shadow-2xl ${
              variant === 'solve'
                ? 'bg-white dark:bg-[#0f0f10] border border-gray-200 dark:border-white/10'
                : 'bg-slate-800/95 border border-white/10'
            }`}
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <IconComponent icon={AiOutlineExclamation} className="h-6 w-6 text-red-400" />
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${variant === 'solve' ? 'text-gray-900 dark:text-white' : 'text-white'}`}>Confirm Action</h3>
              <p className={`${variant === 'solve' ? 'text-gray-600 dark:text-gray-300' : 'text-slate-300'} mb-6`}>{confirmMessage}</p>
              <div className="flex space-x-3 justify-center">
                <motion.button
                  onClick={handleCancel}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    variant === 'solve'
                      ? 'bg-gray-100 hover:bg-gray-200 dark:bg-[#27272a] dark:hover:bg-[#313136] text-gray-700 dark:text-gray-200'
                      : 'bg-slate-600/50 hover:bg-slate-600/70 text-slate-300'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleConfirm}
                  className="px-4 py-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Confirm
                </motion.button>
              </div>
            </div>
          </PortalModal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CheckMistakesComponent;
