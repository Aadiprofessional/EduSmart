import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AiOutlineUpload, AiOutlineCamera, AiOutlineFullscreen, AiOutlineBulb, AiOutlineFileText, AiOutlineHistory, AiOutlineLoading3Quarters, AiOutlineLeft, AiOutlineRight, AiOutlineClose, AiOutlineCheckCircle, AiOutlineExclamationCircle, AiOutlineBook, AiOutlineDelete } from 'react-icons/ai';
import { FiDownload, FiCopy, FiShare2, FiClock } from 'react-icons/fi';
import IconComponent from './IconComponent';
import * as pdfjsLib from 'pdfjs-dist';
import { useResponseCheck, ResponseUpgradeModal } from '../../utils/responseChecker';
import { useNotification } from '../../utils/NotificationContext';

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

interface Mistake {
  id: number;
  incorrect: string;
  correct: string;
  type: string;
  explanation?: string;
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
}

type ViewMode = 'mistakes' | 'marking';
type DocumentView = 'image' | 'text'; // New type for document view mode

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
  }
];

interface CheckMistakesComponentProps {
  className?: string;
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

const CheckMistakesComponent: React.FC<CheckMistakesComponentProps> = ({ className = '' }) => {
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
  const [markingSummary, setMarkingSummary] = useState<MarkingSummary | null>(null);
  
  // Add new state variables for the requested features
  const [autoScroll, setAutoScroll] = useState(true);
  const [textExtractionEnabled, setTextExtractionEnabled] = useState(true); // Changed from false to true
  const [extractedTexts, setExtractedTexts] = useState<ExtractedText[]>([]);
  const [selectedMistakeId, setSelectedMistakeId] = useState<number | null>(null);
  const [isProcessingStarted, setIsProcessingStarted] = useState(false);
  
  // Add history functionality
  const [showHistory, setShowHistory] = useState(false);
  const [mistakeHistory, setMistakeHistory] = useState<MistakeHistoryItem[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mistakesContainerRef = useRef<HTMLDivElement>(null); // Add ref for auto-scroll

  // Response checking state
  const { checkAndUseResponse } = useResponseCheck();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');
  const { showSuccess } = useNotification();

  // Add new state for text-only processing and marks summary
  const [textOnlyMode, setTextOnlyMode] = useState(false);
  const [directText, setDirectText] = useState('');

  // Add new state variables for enhanced features
  const [showCorrectedText, setShowCorrectedText] = useState(false);
  const [correctedText, setCorrectedText] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [showFileViewModal, setShowFileViewModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Load history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('mistakeHistory');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        setMistakeHistory(parsedHistory);
      } catch (error) {
        console.error('Error loading mistake history:', error);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('mistakeHistory', JSON.stringify(mistakeHistory));
  }, [mistakeHistory]);

  // Function to add item to history
  const addToHistory = (fileName: string, text: string, mistakes: Mistake[], markingSummary: MarkingSummary | null, fileType: string, documentPages?: string[], originalFile?: File, pageMistakes?: PageMistakes[], currentPageIndex?: number, processingComplete?: boolean) => {
    const newItem: MistakeHistoryItem = {
      id: Date.now().toString(),
      fileName,
      text,
      mistakes,
      markingSummary,
      timestamp: new Date(),
      fileType,
      documentPages,
      file: originalFile,
      pageMistakes,
      currentPage: currentPageIndex,
      overallProcessingComplete: processingComplete
    };
    setMistakeHistory(prev => [newItem, ...prev.slice(0, 19)]); // Keep only last 20 items
  };

  // Function to load from history
  const loadFromHistory = (item: MistakeHistoryItem) => {
    console.log('🔄 Loading from history:', {
      fileName: item.fileName,
      hasDocumentPages: !!item.documentPages?.length,
      hasPageMistakes: !!item.pageMistakes?.length,
      currentPage: item.currentPage,
      overallComplete: item.overallProcessingComplete
    });
    
    setShowHistory(false);
    
    // Restore document pages if available
    if (item.documentPages && item.documentPages.length > 0) {
      setDocumentPages(item.documentPages);
      setCurrentPage(item.currentPage || 0);
      setTextOnlyMode(false);
      
      // Restore complete page mistakes if available
      if (item.pageMistakes && item.pageMistakes.length > 0) {
        console.log('✅ Restoring complete page mistakes:', item.pageMistakes.length, 'pages');
        setPageMistakes(item.pageMistakes);
        setOverallProcessingComplete(item.overallProcessingComplete || true);
      }
    } else {
      console.log('📝 Loading text analysis from history');
      // Set text-only mode
      setTextOnlyMode(true);
      setDirectText(item.text);
      setDocumentPages([]);
      
      // Create page mistakes for text mode
      const textPageMistakes: PageMistakes[] = [{
        pageNumber: 1,
        mistakes: item.mistakes,
        isLoading: false,
        isComplete: true
      }];
      setPageMistakes(textPageMistakes);
      setOverallProcessingComplete(true);
    }
    
    // Restore marking summary
    setMarkingSummary(item.markingSummary);
    
    // Clear file state since we're loading from history
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Clear any processing status
    setProcessingStatus('');
    setLoading(false);
    setIsProcessingStarted(false);
    
    console.log('✅ History loaded successfully');
  };

  // Function to delete history item
  const deleteHistoryItem = (id: string) => {
    setMistakeHistory(prev => prev.filter(item => item.id !== id));
  };

  // Function to clear all history
  const clearAllHistory = () => {
    setMistakeHistory([]);
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

  const getCurrentDisplayText = () => {
    if (showCorrectedText && correctedText) {
      return correctedText;
    }
    
    if (textOnlyMode) {
      return directText;
    }
    
    return extractedTexts[currentPage]?.text || '';
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

  // Extract text from page using OCR API
  const extractTextFromPage = async (imageUrl: string, pageNumber: number): Promise<string> => {
    console.log(`📝 Starting text extraction for page ${pageNumber}`);
    
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

    // Sort mistakes by their position in the text
    const sortedMistakes = mistakes
      .map(mistake => ({
        ...mistake,
        index: text.toLowerCase().indexOf(mistake.incorrect.toLowerCase()),
        isSelected: selectedMistakeId === mistake.id
      }))
      .filter(mistake => mistake.index !== -1)
      .sort((a, b) => a.index - b.index);

    for (const mistake of sortedMistakes) {
      const startIndex = mistake.index;
      
      if (startIndex > lastIndex) {
        // Add non-highlighted text before the mistake
        highlightedParts.push({
          text: text.substring(lastIndex, startIndex),
          isHighlighted: false
        });
      }
      
      // Add highlighted mistake
      highlightedParts.push({
        text: mistake.incorrect,
        isHighlighted: true,
        mistakeType: mistake.type,
        correction: mistake.correct,
        isSelected: mistake.isSelected
      });
      
      lastIndex = startIndex + mistake.incorrect.length;
    }
    
    // Add remaining non-highlighted text
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
    if (autoScroll && mistakesContainerRef.current) {
      const container = mistakesContainerRef.current;
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 100);
    }
  };

  // Check for mistakes in a page with streaming text extraction and highlighting
  const checkMistakesForPage = async (imageUrl: string, pageNumber: number): Promise<Mistake[]> => {
    console.log(`🔄 Starting mistake checking for page ${pageNumber}`);
    
    try {
      const systemPrompt = "You are an expert proofreader with OCR capabilities. First, extract ALL text from the image exactly as it appears. Then identify ONLY actual mistakes in that text. Respond in this EXACT format:\n\nEXTRACTED_TEXT:\n[exact text from image]\n\nMISTAKES:\nMISTAKE: [incorrect text]\nCORRECTION: [corrected text]\nTYPE: [grammar/spelling/punctuation]\n\nBe precise and only show actual errors.";
      
      const userPrompt = "Extract all text from this image and then find mistakes. Use the exact format specified: first EXTRACTED_TEXT section, then MISTAKES section.";

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
                  if (autoScroll && pageNumber === currentPage + 1) {
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

  // Parse mistakes from API response text
  const parseMistakesFromText = (text: string, pageNumber: number): Mistake[] => {
    const mistakes: Mistake[] = [];
    let mistakeId = 1;
    
    // Split by lines and look for the MISTAKE/CORRECTION/TYPE pattern
    const lines = text.split('\n');
    let currentMistake: Partial<Mistake> = {};
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('MISTAKE:')) {
        // If we have a current mistake being built, save it first
        if (currentMistake.incorrect && currentMistake.correct) {
          mistakes.push({
            id: mistakeId++,
            incorrect: currentMistake.incorrect,
            correct: currentMistake.correct,
            type: currentMistake.type || 'other'
          });
        }
        
        // Start new mistake
        currentMistake = {
          incorrect: trimmedLine.replace('MISTAKE:', '').trim()
        };
      } else if (trimmedLine.startsWith('CORRECTION:')) {
        currentMistake.correct = trimmedLine.replace('CORRECTION:', '').trim();
      } else if (trimmedLine.startsWith('TYPE:')) {
        currentMistake.type = trimmedLine.replace('TYPE:', '').trim().toLowerCase();
      }
    }
    
    // Add the last mistake if it's complete
    if (currentMistake.incorrect && currentMistake.correct) {
      mistakes.push({
        id: mistakeId++,
        incorrect: currentMistake.incorrect,
        correct: currentMistake.correct,
        type: currentMistake.type || 'other'
      });
    }
    
    return mistakes;
  };

  // Parse both extracted text and mistakes from combined API response
  const parseTextAndMistakes = (text: string): { extractedText: string; mistakes: Mistake[] } => {
    let extractedText = '';
    const mistakes: Mistake[] = [];
    let mistakeId = 1;
    
    // Split the response into sections
    const extractedTextMatch = text.match(/EXTRACTED_TEXT:\s*([\s\S]*?)(?=MISTAKES:|$)/);
    if (extractedTextMatch) {
      extractedText = extractedTextMatch[1].trim();
    }
    
    // Find the mistakes section
    const mistakesMatch = text.match(/MISTAKES:\s*([\s\S]*)/);
    if (mistakesMatch) {
      const mistakesText = mistakesMatch[1];
      const lines = mistakesText.split('\n');
      let currentMistake: Partial<Mistake> = {};
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (trimmedLine.startsWith('MISTAKE:')) {
          // If we have a current mistake being built, save it first
          if (currentMistake.incorrect && currentMistake.correct) {
            mistakes.push({
              id: mistakeId++,
              incorrect: currentMistake.incorrect,
              correct: currentMistake.correct,
              type: currentMistake.type || 'other'
            });
          }
          
          // Start new mistake
          currentMistake = {
            incorrect: trimmedLine.replace('MISTAKE:', '').trim()
          };
        } else if (trimmedLine.startsWith('CORRECTION:')) {
          currentMistake.correct = trimmedLine.replace('CORRECTION:', '').trim();
        } else if (trimmedLine.startsWith('TYPE:')) {
          currentMistake.type = trimmedLine.replace('TYPE:', '').trim().toLowerCase();
        }
      }
      
      // Add the last mistake if it's complete
      if (currentMistake.incorrect && currentMistake.correct) {
        mistakes.push({
          id: mistakeId++,
          incorrect: currentMistake.incorrect,
          correct: currentMistake.correct,
          type: currentMistake.type || 'other'
        });
      }
    }
    
    return { extractedText, mistakes };
  };

  // Teacher marking functions
  const markPageForTeacher = async (imageUrl: string, pageNumber: number, markingStandard: MarkingStandard): Promise<PageMarking> => {
    console.log(`🎯 Starting teacher marking for page ${pageNumber} with ${markingStandard.name} standard`);
    
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

    try {
      let pages: string[] = [];
      
      if (file.type === 'application/pdf') {
        console.log('📄 Processing PDF file');
        pages = await convertPdfToImages(file);
        console.log('✅ PDF converted to', pages.length, 'images');
      } else if (file.type.startsWith('image/')) {
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
      } else {
        console.error('❌ Unsupported file type:', file.type);
        throw new Error('Unsupported file type. Please upload a PDF or image file.');
      }
      
      console.log('📸 Total images prepared:', pages.length);
      setDocumentPages(pages);
      setCurrentPage(0);
      setFile(file);
      
      // Initialize page mistakes but don't start processing
      const initialPageMistakes: PageMistakes[] = pages.map((_, index) => ({
        pageNumber: index + 1,
        mistakes: [],
        isLoading: false,
        isComplete: false
      }));
      setPageMistakes(initialPageMistakes);

      // Initialize extracted texts
      const initialExtractedTexts: ExtractedText[] = pages.map((_, index) => ({
        pageNumber: index + 1,
        text: '',
        isLoading: false,
        isComplete: false
      }));
      setExtractedTexts(initialExtractedTexts);
      
      setProcessingStatus('File ready - click "Check Mistakes & Get Marking" to start analysis');
      setLoading(false);

    } catch (error) {
      console.error('💥 File preparation error');
      console.error('🔴 Error message:', error instanceof Error ? error.message : String(error));
      
      setProcessingStatus('Error preparing file');
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
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
  }, [textExtractionEnabled, documentPages.length]);

  // Auto-scroll effect
  useEffect(() => {
    if (autoScroll && mistakesContainerRef.current) {
      const container = mistakesContainerRef.current;
      container.scrollTop = container.scrollHeight;
    }
  }, [pageMistakes, autoScroll, currentPage]);

  // Process text directly without file upload
  const processTextDirectly = async (text: string) => {
    if (!text.trim() || loading || isProcessingStarted) return;
    
    setIsProcessingStarted(true);
    setLoading(true);
    setTextOnlyMode(true);
    setDirectText(text);
    setDocumentPages([]); // Clear any uploaded document
    setFile(null);
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
    
    try {
      // Check mistakes for the text
      const mistakes = await checkMistakesForText(text);
      
      // Update page mistakes
      setPageMistakes([{
        pageNumber: 1,
        mistakes,
        isLoading: false,
        isComplete: true
      }]);
      
      // Generate marking summary
      const summary = generateMarksSummary(mistakes, text);
      const integratedSummary = generateIntegratedSummary(mistakes, text, selectedMarkingStandard);
      setMarkingSummary(integratedSummary);
      
      // Add to history
      addToHistory(
        'Direct Text Input',
        text,
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
        true
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
                  if (autoScroll) {
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

  // New function to start processing after button click
  const startProcessing = async () => {
    if (!file || !documentPages.length || isProcessingStarted) return;

    // Check responses before proceeding
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
    setProcessingStatus(`Processing all ${documentPages.length} pages...`);
    
    const processStartTime = Date.now();
    console.log('⏰ Processing start time:', new Date(processStartTime).toISOString());

    try {
      // Update all pages to loading state
      setPageMistakes(prev => prev.map(pm => ({ ...pm, isLoading: true })));
      setExtractedTexts(prev => prev.map(et => ({ ...et, isLoading: true })));
      
      // Process all pages in parallel
      console.log('🔄 Starting parallel processing of all pages for mistake checking');
      const processingPromises = documentPages.map(async (imageUrl, index) => {
        const pageNumber = index + 1;
        console.log(`🚀 Starting processing for page ${pageNumber}`);
        
        try {
          // Check for mistakes with combined text extraction
          const mistakes = await checkMistakesForPage(imageUrl, pageNumber);
          
          // Update page mistakes
          setPageMistakes(prev => prev.map(pm => 
            pm.pageNumber === pageNumber 
              ? { ...pm, mistakes, isLoading: false, isComplete: true }
              : pm
          ));

          console.log(`✅ Page ${pageNumber} processing completed successfully`);
          return { pageNumber, mistakes };
        } catch (error) {
          console.error(`❌ Error processing page ${pageNumber}:`, error);
          setPageMistakes(prev => prev.map(pm => 
            pm.pageNumber === pageNumber 
              ? { ...pm, isLoading: false, isComplete: true, error: 'Processing failed' }
              : pm
          ));
          return null;
        }
      });

      // Wait for all pages to complete
      console.log('⏳ Waiting for all pages to complete processing...');
      const results = await Promise.allSettled(processingPromises);
      const successfulResults = results
        .filter((result): result is PromiseFulfilledResult<{pageNumber: number, mistakes: Mistake[]} | null> => 
          result.status === 'fulfilled' && result.value !== null
        )
        .map(result => result.value!);

      setOverallProcessingComplete(true);
      setProcessingStatus('All pages processed successfully!');

      // Generate integrated summary with marking assessment
      if (successfulResults.length > 0 && selectedMarkingStandard) {
        const allMistakes = successfulResults.flatMap(result => result.mistakes);
        const allText = extractedTexts.map(et => et.text).join('\n\n');
        
        const summary = generateIntegratedSummary(allMistakes, allText, selectedMarkingStandard);
        setMarkingSummary(summary);
        
        // Add to history
        if (file) {
          addToHistory(
            file.name, 
            allText, 
            allMistakes, 
            summary, 
            file.type, 
            documentPages, 
            file, 
            pageMistakes, 
            currentPage, 
            true
          );
        }
      }

      const totalProcessTime = Date.now() - processStartTime;
      console.log('🎉 Processing completed successfully');
      console.log('⏱️ Total processing time:', totalProcessTime + 'ms');

    } catch (error) {
      const totalProcessTime = Date.now() - processStartTime;
      console.error('💥 Processing error after', totalProcessTime + 'ms');
      console.error('🔴 Error message:', error instanceof Error ? error.message : String(error));
      
      setProcessingStatus('Error processing file');
      setOverallProcessingComplete(true);
      setIsProcessingStarted(false); // Reset on error
    } finally {
      setLoading(false);
      setTimeout(() => setProcessingStatus(''), 3000);
      console.log('🏁 startProcessing function completed');
    }
  };

  // If no file is uploaded, show upload interface
  if (!file) {
    return (
      <div className={className}>
        <motion.div 
          className="max-w-4xl mx-auto px-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="bg-slate-600/30 backdrop-blur-sm border border-white/10 rounded-xl p-4 lg:p-8 shadow-sm"
            whileHover={{ boxShadow: "0 8px 32px rgba(6, 182, 212, 0.1)" }}
          >
            <div className="text-center mb-6 lg:mb-8">
              <h2 className="text-2xl lg:text-3xl font-bold text-cyan-400 mb-2">
                Check Mistakes & Get Marked
              </h2>
              <p className="text-slate-300 text-sm lg:text-base">
                Upload your document to check for grammar, spelling, and punctuation mistakes, then get a detailed marking assessment
              </p>
            </div>

            {/* Control Settings */}
            <div className="flex items-center justify-center mb-4">
              <div className="flex items-center space-x-4 bg-slate-600/20 backdrop-blur-sm rounded-lg p-3 lg:p-4 border border-white/10">
                {/* Auto Scroll Toggle */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoScroll"
                    checked={autoScroll}
                    onChange={(e) => setAutoScroll(e.target.checked)}
                    className="w-4 h-4 text-cyan-600 bg-slate-600 border-slate-400 rounded focus:ring-cyan-500 focus:ring-2"
                  />
                  <label htmlFor="autoScroll" className="text-slate-300 text-xs lg:text-sm font-medium cursor-pointer flex items-center">
                    <IconComponent icon={AiOutlineLoading3Quarters} className="h-4 w-4 mr-1" />
                    Auto Scroll
                  </label>
                </div>
              </div>
            </div>

            {/* Marking Standard Selector */}
            <div className="flex items-center justify-center mb-4 lg:mb-6">
              <div className="bg-slate-600/20 backdrop-blur-sm rounded-lg p-3 lg:p-4 border border-white/10 w-full max-w-md">
                <label className="block text-xs lg:text-sm font-medium text-slate-300 mb-2 text-center">
                  Select Marking Standard
                </label>
                <select
                  value={selectedMarkingStandard}
                  onChange={(e) => setSelectedMarkingStandard(e.target.value)}
                  className="w-full px-3 lg:px-4 py-2 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm lg:text-base"
                >
                  {MARKING_STANDARDS.map(standard => (
                    <option key={standard.id} value={standard.id} className="bg-slate-700">
                      {standard.name} - {standard.description}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-2 text-center">
                  {MARKING_STANDARDS.find(s => s.id === selectedMarkingStandard)?.description}
                </p>
              </div>
            </div>
            
            <div className="mb-4 lg:mb-6">
              <div 
                className="border-2 border-dashed border-white/20 rounded-lg p-8 lg:p-12 text-center hover:border-cyan-500/50 cursor-pointer transition-colors relative bg-slate-600/20 backdrop-blur-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                <div className="text-slate-400">
                  <IconComponent icon={AiOutlineUpload} className="h-10 w-10 lg:h-12 lg:w-12 mx-auto mb-4 text-cyan-400" />
                  <p className="text-base lg:text-lg font-medium text-slate-300 mb-2">Drag and drop your file here, or click to browse</p>
                  <p className="text-xs lg:text-sm">Supports PDF, Word documents, and images</p>
                </div>
              </div>
            </div>

            {/* Text Input Option */}
            <div className="mb-4 lg:mb-6">
              <div className="text-center mb-4">
                <span className="text-slate-400 text-xs lg:text-sm">or</span>
              </div>
              <div className="bg-slate-600/20 backdrop-blur-sm rounded-lg p-3 lg:p-4 border border-white/10">
                <label className="block text-slate-300 mb-3 font-medium text-sm lg:text-base">
                  Paste your text directly
                </label>
                <textarea
                  placeholder="Paste your text here for mistake checking..."
                  className="w-full h-24 lg:h-32 p-3 bg-slate-600/30 backdrop-blur-sm border border-white/10 rounded-lg text-slate-300 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-sm lg:text-base"
                  onPaste={(e) => {
                    const text = e.clipboardData.getData('text');
                    if (text.trim()) {
                      // Process text directly without file upload
                      processTextDirectly(text.trim());
                    }
                  }}
                  onChange={(e) => {
                    const text = e.target.value;
                    if (text.trim()) {
                      // Process text directly
                      processTextDirectly(text.trim());
                    }
                  }}
                />
                <p className="text-xs text-slate-400 mt-2">
                  Text will be processed automatically as you type or paste
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-center">
              <motion.button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className={`flex items-center justify-center px-6 lg:px-8 py-3 lg:py-4 rounded-lg text-white font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all bg-gradient-to-r from-cyan-500 to-blue-500 text-sm lg:text-base`}
                whileHover={!loading ? { scale: 1.02 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
              >
                {loading ? (
                  <>
                    <motion.div
                      className="w-4 h-4 lg:w-5 lg:h-5 border-2 border-white border-t-transparent rounded-full mr-2 lg:mr-3"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    Processing...
                  </>
                ) : (
                  <>
                    Check for Mistakes & Get Marking
                    <IconComponent icon={AiOutlineBulb} className="h-4 w-4 lg:h-5 lg:w-5 ml-2" />
                  </>
                )}
              </motion.button>
            </div>

            {/* History Button */}
            <div className="mt-4 lg:mt-6 flex items-center justify-center">
              <motion.button
                type="button"
                className="flex items-center justify-center px-4 py-2 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg text-slate-300 font-medium hover:bg-slate-500/50 transition-colors text-sm lg:text-base"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowHistory(!showHistory)}
              >
                <IconComponent icon={AiOutlineHistory} className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
                History ({mistakeHistory.length})
              </motion.button>
            </div>
            
            {processingStatus && (
              <motion.div
                className="mt-4 lg:mt-6 p-3 lg:p-4 bg-blue-500/10 backdrop-blur-sm rounded-lg border border-blue-500/20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <p className="text-xs lg:text-sm text-blue-400 flex items-center justify-center">
                  <motion.div
                    className="w-3 h-3 lg:w-4 lg:h-4 border-2 border-blue-400 border-t-transparent rounded-full mr-2"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
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
            className="bg-slate-600/30 backdrop-blur-sm border border-white/10 rounded-xl p-8 shadow-sm"
            whileHover={{ boxShadow: "0 8px 32px rgba(6, 182, 212, 0.1)" }}
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-cyan-400 mb-2">
                Document Ready for Analysis
              </h2>
              <p className="text-slate-300 mb-4">
                {file.name} - {documentPages.length} page{documentPages.length > 1 ? 's' : ''} ready
              </p>
              <p className="text-slate-400">
                Using {MARKING_STANDARDS.find(s => s.id === selectedMarkingStandard)?.name} marking standard
              </p>
            </div>

            {/* Document Preview */}
            <div className="mb-6 flex justify-center">
              <div className="w-64 h-80 bg-slate-700/30 rounded-lg overflow-hidden border border-white/10">
                <img 
                  src={documentPages[0]} 
                  alt="Document preview"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            {/* Control Settings */}
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center space-x-4 bg-slate-600/20 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                {/* Auto Scroll Toggle */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoScroll"
                    checked={autoScroll}
                    onChange={(e) => setAutoScroll(e.target.checked)}
                    className="w-4 h-4 text-cyan-600 bg-slate-600 border-slate-400 rounded focus:ring-cyan-500 focus:ring-2"
                  />
                  <label htmlFor="autoScroll" className="text-slate-300 text-sm font-medium cursor-pointer flex items-center">
                    <IconComponent icon={AiOutlineLoading3Quarters} className="h-4 w-4 mr-1" />
                    Auto Scroll
                  </label>
                </div>
              </div>
            </div>

            {/* Marking Standard Selector */}
            <div className="flex items-center justify-center mb-6">
              <div className="bg-slate-600/20 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <label className="block text-sm font-medium text-slate-300 mb-2 text-center">
                  Marking Standard
                </label>
                <select
                  value={selectedMarkingStandard}
                  onChange={(e) => setSelectedMarkingStandard(e.target.value)}
                  className="px-4 py-2 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 min-w-[250px]"
                >
                  {MARKING_STANDARDS.map(standard => (
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
                className="flex items-center px-6 py-3 bg-slate-600/50 hover:bg-slate-500/50 rounded-lg text-slate-300 transition-colors border border-white/10"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <IconComponent icon={AiOutlineLeft} className="h-4 w-4 mr-2" />
                Change File
              </motion.button>

              <motion.button
                onClick={startProcessing}
                disabled={loading}
                className={`flex items-center justify-center px-8 py-4 rounded-lg text-white font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all bg-gradient-to-r from-cyan-500 to-blue-500`}
                whileHover={!loading ? { scale: 1.02 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
              >
                {loading ? (
                  <>
                    <motion.div
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-3"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    Starting Analysis...
                  </>
                ) : (
                  <>
                    Check Mistakes & Get Marking
                    <IconComponent icon={AiOutlineBulb} className="h-5 w-5 ml-2" />
                  </>
                )}
              </motion.button>
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
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
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
    <div className={className}>
      {/* Mobile-Responsive Header */}
      <div className="mb-6">
        {/* Desktop Header */}
        <div className="hidden lg:flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <motion.button
              onClick={handleRemoveFile}
              className="flex items-center px-4 py-2 bg-slate-600/50 backdrop-blur-sm hover:bg-slate-500/50 rounded-lg text-slate-300 transition-colors border border-white/10"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <IconComponent icon={AiOutlineLeft} className="h-4 w-4 mr-2" />
              Back to Upload
            </motion.button>
            <div>
              <h1 className="text-2xl font-bold text-cyan-400">
                Check Mistakes & Assessment
              </h1>
              <p className="text-slate-300">{file.name}</p>
              <p className="text-sm text-slate-400">
                Using {MARKING_STANDARDS.find(s => s.id === selectedMarkingStandard)?.name} standard
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Page Navigation */}
            {documentPages.length > 1 && (
              <div className="flex items-center space-x-4">
                <button 
                  className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-cyan-400 border border-cyan-500/30"
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  Previous
                </button>
                <span className="text-slate-300 font-medium">
                  Page {currentPage + 1} of {documentPages.length}
                </span>
                <button 
                  className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-cyan-400 border border-cyan-500/30"
                  disabled={currentPage === documentPages.length - 1}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  Next
                </button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              {/* View File Button */}
              <motion.button
                onClick={() => setShowFileViewModal(true)}
                className="flex items-center px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400 transition-colors border border-blue-500/30"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <IconComponent icon={AiOutlineFileText} className="h-4 w-4 mr-1" />
                View File
              </motion.button>

              {/* Auto Correct Button */}
              {(pageMistakes.some(pm => pm.mistakes.length > 0)) && (
                <motion.button
                  onClick={applyAutoCorrect}
                  className="flex items-center px-3 py-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-green-400 transition-colors border border-green-500/30"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <IconComponent icon={AiOutlineCheckCircle} className="h-4 w-4 mr-1" />
                  Auto Correct
                </motion.button>
              )}

              {/* View Report Button */}
              {markingSummary && overallProcessingComplete && (
                <motion.button
                  onClick={() => setShowReportModal(true)}
                  className="flex items-center px-3 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 rounded-lg text-purple-400 transition-colors border border-purple-500/30"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <IconComponent icon={AiOutlineFileText} className="h-4 w-4 mr-1" />
                  View Report
                </motion.button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between mb-4">
            <motion.button
              onClick={handleRemoveFile}
              className="flex items-center px-3 py-2 bg-slate-600/50 backdrop-blur-sm hover:bg-slate-500/50 rounded-lg text-slate-300 transition-colors border border-white/10"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <IconComponent icon={AiOutlineLeft} className="h-4 w-4 mr-2" />
              Back
            </motion.button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 bg-slate-600/50 backdrop-blur-sm hover:bg-slate-500/50 rounded-lg text-slate-300 transition-colors border border-white/10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          <div className="mb-4">
            <h1 className="text-xl font-bold text-cyan-400 mb-1">
              Check Mistakes & Assessment
            </h1>
            <p className="text-slate-300 text-sm truncate">{file.name}</p>
            <p className="text-xs text-slate-400">
              Using {MARKING_STANDARDS.find(s => s.id === selectedMarkingStandard)?.name} standard
            </p>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-slate-600/30 backdrop-blur-sm rounded-lg border border-white/10 p-4 mb-4"
              >
                <div className="space-y-3">
                  {/* Page Navigation for Mobile */}
                  {documentPages.length > 1 && (
                    <div className="flex items-center justify-between">
                      <button 
                        className="px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-cyan-400 border border-cyan-500/30 text-sm"
                        disabled={currentPage === 0}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                      >
                        Previous
                      </button>
                      <span className="text-slate-300 font-medium text-sm">
                        Page {currentPage + 1} of {documentPages.length}
                      </span>
                      <button 
                        className="px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-cyan-400 border border-cyan-500/30 text-sm"
                        disabled={currentPage === documentPages.length - 1}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                      >
                        Next
                      </button>
                    </div>
                  )}

                  {/* Action Buttons for Mobile */}
                  <div className="grid grid-cols-1 gap-2">
                    {/* View File Button */}
                    <motion.button
                      onClick={() => {
                        setShowFileViewModal(true);
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center justify-center px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400 transition-colors border border-blue-500/30 text-sm"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <IconComponent icon={AiOutlineFileText} className="h-4 w-4 mr-2" />
                      View Original File
                    </motion.button>

                    {/* Auto Correct Button */}
                    {(pageMistakes.some(pm => pm.mistakes.length > 0)) && (
                      <motion.button
                        onClick={() => {
                          applyAutoCorrect();
                          setIsMobileMenuOpen(false);
                        }}
                        className="flex items-center justify-center px-3 py-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg text-green-400 transition-colors border border-green-500/30 text-sm"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <IconComponent icon={AiOutlineCheckCircle} className="h-4 w-4 mr-2" />
                        Apply Auto Corrections
                      </motion.button>
                    )}

                    {/* Toggle Corrected/Original Text */}
                    {correctedText && (
                      <motion.button
                        onClick={() => {
                          setShowCorrectedText(!showCorrectedText);
                          setIsMobileMenuOpen(false);
                        }}
                        className="flex items-center justify-center px-3 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-lg text-yellow-400 transition-colors border border-yellow-500/30 text-sm"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <IconComponent icon={AiOutlineExclamationCircle} className="h-4 w-4 mr-2" />
                        {showCorrectedText ? 'Show Original' : 'Show Corrected'}
                      </motion.button>
                    )}

                    {/* View Report Button */}
                    {markingSummary && overallProcessingComplete && (
                      <motion.button
                        onClick={() => {
                          setShowReportModal(true);
                          setIsMobileMenuOpen(false);
                        }}
                        className="flex items-center justify-center px-3 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 rounded-lg text-purple-400 transition-colors border border-purple-500/30 text-sm"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <IconComponent icon={AiOutlineFileText} className="h-4 w-4 mr-2" />
                        View Full Report
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile-Responsive Split View: Document and Content */}
      <div className="flex flex-col lg:grid lg:grid-cols-2 gap-6 min-h-[calc(100vh-300px)]">
        {/* Left Side - Document (Full width on mobile, half on desktop) */}
        <div className="bg-slate-600/30 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg overflow-hidden order-2 lg:order-1">
          <div className="bg-slate-700/50 backdrop-blur-sm px-4 lg:px-6 py-3 lg:py-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-cyan-400">Document</h2>
            
            {/* Desktop Text Toggle */}
            {correctedText && (
              <div className="hidden lg:flex items-center space-x-2">
                <span className="text-sm text-slate-400">Show:</span>
                <button
                  onClick={() => setShowCorrectedText(!showCorrectedText)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    showCorrectedText 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-slate-600/50 text-slate-300 border border-white/10'
                  }`}
                >
                  {showCorrectedText ? 'Corrected' : 'Original'}
                </button>
              </div>
            )}
          </div>
          
          {/* Mobile Text Toggle */}
          {correctedText && (
            <div className="lg:hidden bg-slate-700/30 px-4 py-2 border-b border-white/10">
              <div className="flex items-center justify-center space-x-4">
                <span className="text-sm text-slate-400">View:</span>
                <div className="flex bg-slate-600/50 rounded-lg p-1">
                  <button
                    onClick={() => setShowCorrectedText(false)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      !showCorrectedText 
                        ? 'bg-slate-500/50 text-slate-200'
                        : 'text-slate-400'
                    }`}
                  >
                    Original
                  </button>
                  <button
                    onClick={() => setShowCorrectedText(true)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      showCorrectedText 
                        ? 'bg-green-500/30 text-green-400'
                        : 'text-slate-400'
                    }`}
                  >
                    Corrected
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div className="h-64 lg:h-full p-4 relative">
            <div className="w-full h-full bg-slate-700/30 backdrop-blur-sm rounded-lg overflow-hidden border border-white/10 relative">
              {textOnlyMode ? (
                /* Direct Text Display */
                <div className="w-full h-full overflow-auto p-4">
                  <div className="text-slate-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                    {getCurrentDisplayText() ? (
                      showCorrectedText && correctedText ? (
                        <div className="space-y-2">
                          <div className="text-green-400 text-xs font-medium mb-2 bg-green-500/10 px-2 py-1 rounded">
                            ✅ Corrected Text
                          </div>
                          {correctedText}
                        </div>
                      ) : (
                        highlightMistakesInText(
                          directText, 
                          pageMistakes[0]?.mistakes || []
                        ).map((part, index) => (
                          part.isHighlighted ? (
                            <span
                              key={index}
                              className={`${
                                part.mistakeType === 'grammar' ? 'bg-red-500/30 border-b-2 border-red-500' :
                                part.mistakeType === 'spelling' ? 'bg-yellow-500/30 border-b-2 border-yellow-500' :
                                part.mistakeType === 'punctuation' ? 'bg-blue-500/30 border-b-2 border-blue-500' :
                                'bg-orange-500/30 border-b-2 border-orange-500'
                              } ${
                                part.isSelected ? 'ring-2 ring-cyan-400 bg-cyan-500/20 shadow-lg animate-pulse' : ''
                              } rounded px-1 cursor-help transition-all hover:bg-opacity-50`}
                              title={`${part.mistakeType?.toUpperCase()}: ${part.text} → ${part.correction}`}
                              onClick={() => {
                                const mistakeId = pageMistakes[0]?.mistakes.find(m => m.incorrect === part.text)?.id;
                                if (mistakeId) {
                                  setSelectedMistakeId(selectedMistakeId === mistakeId ? null : mistakeId);
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
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <IconComponent icon={AiOutlineFileText} className="h-8 w-8 mb-2 opacity-50" />
                        <p className="text-sm">No text to display</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Image with Text Overlay */
                <div className="relative w-full h-full">
                  {/* Background Image with Low Opacity */}
                  <img 
                    src={documentPages[currentPage]} 
                    alt={`Document page ${currentPage + 1}`}
                    className="absolute inset-0 w-full h-full object-contain opacity-20"
                  />
                  
                  {/* Text Overlay */}
                  <div className="absolute inset-0 w-full h-full overflow-auto p-4 z-10">
                    {extractedTexts[currentPage] && extractedTexts[currentPage].isLoading && !extractedTexts[currentPage].text ? (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <motion.div
                          className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full mb-2"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        <p className="text-sm">Extracting text...</p>
                      </div>
                    ) : extractedTexts[currentPage] && extractedTexts[currentPage].error ? (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <div className="text-red-400 mb-2">⚠</div>
                        <p className="text-sm">Error extracting text</p>
                        <p className="text-xs text-slate-500">{extractedTexts[currentPage].error}</p>
                      </div>
                    ) : extractedTexts[currentPage] && extractedTexts[currentPage].text ? (
                      <>
                        <div className="text-slate-100 whitespace-pre-wrap font-mono text-sm leading-relaxed mb-4 bg-slate-900/40 backdrop-blur-sm rounded-lg p-4">
                          {showCorrectedText && correctedText ? (
                            <div className="space-y-2">
                              <div className="text-green-400 text-xs font-medium mb-2 bg-green-500/10 px-2 py-1 rounded">
                                ✅ Auto-Corrected Text
                              </div>
                              {correctedText}
                            </div>
                          ) : (
                            highlightMistakesInText(
                              extractedTexts[currentPage].text, 
                              pageMistakes[currentPage]?.mistakes || []
                            ).map((part, index) => (
                              part.isHighlighted ? (
                                <span
                                  key={index}
                                  className={`${
                                    part.mistakeType === 'grammar' ? 'bg-red-500/50 border-b-2 border-red-400' :
                                    part.mistakeType === 'spelling' ? 'bg-yellow-500/50 border-b-2 border-yellow-400' :
                                    part.mistakeType === 'punctuation' ? 'bg-blue-500/50 border-b-2 border-blue-400' :
                                    'bg-orange-500/50 border-b-2 border-orange-400'
                                  } ${
                                    part.isSelected ? 'ring-2 ring-cyan-400 bg-cyan-500/30 shadow-lg animate-pulse' : ''
                                  } rounded px-1 cursor-help transition-all hover:bg-opacity-70`}
                                  title={`${part.mistakeType?.toUpperCase()}: ${part.text} → ${part.correction}`}
                                  onClick={() => {
                                    const mistakeId = pageMistakes[currentPage]?.mistakes.find(m => m.incorrect === part.text)?.id;
                                    if (mistakeId) {
                                      setSelectedMistakeId(selectedMistakeId === mistakeId ? null : mistakeId);
                                    }
                                  }}
                                >
                                  {part.text}
                                </span>
                              ) : (
                                <span key={index}>{part.text}</span>
                              )
                            ))
                          )}
                        </div>
                        
                        {/* Color Legend */}
                        {pageMistakes[currentPage]?.mistakes && pageMistakes[currentPage].mistakes.length > 0 && (
                          <div className="mt-4 p-3 bg-slate-900/60 backdrop-blur-sm rounded-lg border border-white/20">
                            <h4 className="text-sm font-medium text-slate-200 mb-2">Mistake Types:</h4>
                            <div className="flex flex-wrap gap-3 text-xs">
                              <div className="flex items-center">
                                <div className="w-3 h-3 bg-red-500/50 border-b-2 border-red-400 rounded mr-2"></div>
                                <span className="text-slate-300">Grammar</span>
                              </div>
                              <div className="flex items-center">
                                <div className="w-3 h-3 bg-yellow-500/50 border-b-2 border-yellow-400 rounded mr-2"></div>
                                <span className="text-slate-300">Spelling</span>
                              </div>
                              <div className="flex items-center">
                                <div className="w-3 h-3 bg-blue-500/50 border-b-2 border-blue-400 rounded mr-2"></div>
                                <span className="text-slate-300">Punctuation</span>
                              </div>
                              <div className="flex items-center">
                                <div className="w-3 h-3 bg-orange-500/50 border-b-2 border-orange-400 rounded mr-2"></div>
                                <span className="text-slate-300">Other</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    ) : !isProcessingStarted ? (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <IconComponent icon={AiOutlineFileText} className="h-8 w-8 mb-2 opacity-50" />
                        <p className="text-sm">Click "Check Mistakes" to start analysis</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <IconComponent icon={AiOutlineFileText} className="h-8 w-8 mb-2 opacity-50" />
                        <p className="text-sm">Processing...</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Content (Full width on mobile, half on desktop) */}
        <div className="bg-slate-600/30 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg overflow-hidden flex flex-col order-1 lg:order-2">
          <div className="bg-slate-700/50 backdrop-blur-sm px-4 lg:px-6 py-3 lg:py-4 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-base lg:text-lg font-semibold text-cyan-400">Mistakes & Assessment</h2>
              {pageMistakes[currentPage] && (
                <div className="flex items-center space-x-2">
                  {pageMistakes[currentPage].isLoading && (
                    <div className="flex items-center text-cyan-400">
                      <motion.div
                        className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full mr-2"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
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
                <p className="text-xs text-slate-400 mt-1">
                  {pageMistakes.filter(pm => pm.isComplete && !pm.error).length} of {pageMistakes.length} pages completed
                </p>
              </div>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 max-h-64 lg:max-h-none" ref={mistakesContainerRef}>
            {loading ? (
              <div className="flex flex-col items-center justify-center h-32 lg:h-full text-slate-400">
                <motion.div
                  className="w-12 h-12 lg:w-16 lg:h-16 border-4 border-cyan-500 border-t-transparent rounded-full mb-4"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <p className="text-center text-sm">{processingStatus || 'Checking for mistakes...'}</p>
              </div>
            ) : (
              <>
                {/* Integrated Marking Summary (shown when processing is complete) */}
                {markingSummary && overallProcessingComplete && (
                  <motion.div 
                    className="mb-4 lg:mb-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-lg p-4 lg:p-6 border border-purple-500/20"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    <h3 className="text-lg lg:text-xl font-semibold text-purple-400 mb-3 lg:mb-4 flex items-center">
                      <IconComponent icon={AiOutlineFileText} className="h-4 w-4 lg:h-5 lg:w-5 mr-2" />
                      Assessment Summary
                    </h3>
                    
                    {/* Score Display */}
                    <div className="mb-4 lg:mb-6 text-center">
                      <div className="text-2xl lg:text-4xl font-bold text-green-400 mb-2">
                        {markingSummary.totalScore}/{markingSummary.maxScore}
                      </div>
                      <div className="text-lg lg:text-xl font-semibold text-green-300 mb-3">
                        Grade: {markingSummary.grade} ({Math.round(markingSummary.percentage)}%)
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-3 lg:h-4">
                        <motion.div 
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 lg:h-4 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${markingSummary.percentage}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                        ></motion.div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3 lg:gap-4 mb-4">
                      {/* Strengths */}
                      {markingSummary.strengths.length > 0 && (
                        <div className="bg-green-500/10 rounded-lg p-3 lg:p-4 border border-green-500/20">
                          <h4 className="text-sm font-semibold text-green-400 mb-2 flex items-center">
                            ✓ Strengths
                          </h4>
                          <ul className="space-y-1">
                            {markingSummary.strengths.slice(0, 2).map((strength, index) => (
                              <li key={index} className="text-xs text-green-300">• {strength}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Areas for Improvement */}
                      {markingSummary.weaknesses.length > 0 && (
                        <div className="bg-red-500/10 rounded-lg p-3 lg:p-4 border border-red-500/20">
                          <h4 className="text-sm font-semibold text-red-400 mb-2 flex items-center">
                            ! Areas to Improve
                          </h4>
                          <ul className="space-y-1">
                            {markingSummary.weaknesses.slice(0, 2).map((weakness, index) => (
                              <li key={index} className="text-xs text-red-300">• {weakness}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    {/* Study Plan Preview */}
                    {markingSummary.studyPlan.length > 0 && (
                      <div className="bg-blue-500/10 rounded-lg p-3 lg:p-4 border border-blue-500/20">
                        <h4 className="text-sm font-semibold text-blue-400 mb-2">📚 Study Plan (Preview)</h4>
                        <div className="space-y-2">
                          {markingSummary.studyPlan.slice(0, 1).map((item, index) => (
                            <div key={index} className="flex items-center justify-between">
                              <span className="text-xs text-blue-300">{item.topic}</span>
                              <span className={`px-2 py-1 rounded text-xs ${
                                item.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                                item.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-green-500/20 text-green-400'
                              }`}>
                                {item.priority}
                              </span>
                            </div>
                          ))}
                          {markingSummary.studyPlan.length > 1 && (
                            <p className="text-xs text-slate-400">+ {markingSummary.studyPlan.length - 1} more items</p>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Mistakes Content */}
                {pageMistakes[currentPage] && pageMistakes[currentPage].mistakes.length > 0 ? (
                  <div className="space-y-3 lg:space-y-4">
                    <div className="mb-3 lg:mb-4 p-3 bg-teal-500/10 backdrop-blur-sm rounded-lg border border-teal-500/20">
                      <h3 className="text-base lg:text-lg font-semibold text-teal-400">
                        {textOnlyMode ? 'Text Analysis' : `Page ${currentPage + 1}`} - {pageMistakes[currentPage].mistakes.length} mistake(s) found
                      </h3>
                    </div>
                    
                    {pageMistakes[currentPage].mistakes.map((mistake) => (
                      <motion.div
                        key={mistake.id}
                        className={`bg-slate-700/30 backdrop-blur-sm rounded-lg p-3 lg:p-4 border cursor-pointer transition-all ${
                          selectedMistakeId === mistake.id 
                            ? 'border-cyan-500/50 bg-cyan-500/10' 
                            : 'border-white/10 hover:border-cyan-500/30'
                        }`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: mistake.id * 0.1 }}
                        onClick={() => {
                          setSelectedMistakeId(selectedMistakeId === mistake.id ? null : mistake.id);
                        }}
                      >
                        <div className="mb-2">
                          <span className="inline-block px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded border border-yellow-500/30">
                            {mistake.type}
                          </span>
                        </div>
                        
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-red-400 mb-1">Incorrect:</h4>
                          <div className="bg-red-500/10 border-l-4 border-red-500 p-2 lg:p-3 rounded-r">
                            <p className="text-slate-300 font-mono text-sm">{mistake.incorrect}</p>
                          </div>
                        </div>
                        
                        <div className="mb-2">
                          <h4 className="text-sm font-medium text-green-400 mb-1">Correction:</h4>
                          <div className="bg-green-500/10 border-l-4 border-green-500 p-2 lg:p-3 rounded-r">
                            <p className="text-slate-300 font-mono text-sm">{mistake.correct}</p>
                          </div>
                        </div>
                        
                        {mistake.explanation && (
                          <div className="mt-3 p-2 lg:p-3 bg-blue-500/10 rounded border border-blue-500/20">
                            <p className="text-sm text-blue-400">{mistake.explanation}</p>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : pageMistakes[currentPage] && pageMistakes[currentPage].isComplete ? (
                  <div className="flex flex-col items-center justify-center h-32 lg:h-full text-slate-400">
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
                  <div className="flex flex-col items-center justify-center h-32 lg:h-full text-slate-400">
                    <IconComponent icon={AiOutlineBulb} className="h-8 w-8 lg:h-12 lg:w-12 mb-3 opacity-50" />
                    <p className="text-center text-sm">Mistakes and assessment will appear here after processing your document.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Assessment Summary Section - REMOVED - Now only appears in modal */}
      
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
            className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl relative"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-3xl font-bold text-gray-800 flex items-center">
                <IconComponent icon={AiOutlineFileText} className="h-8 w-8 mr-3 text-blue-600" />
                Assessment Report
              </h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="overflow-y-auto max-h-[calc(90vh-120px)] space-y-6">
              {/* Score Overview */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <div className="text-center mb-6">
                  <div className="text-6xl font-bold text-blue-600 mb-2">
                    {markingSummary.totalScore}/{markingSummary.maxScore}
                  </div>
                  <div className="text-2xl font-semibold text-blue-800 mb-4">
                    Grade: {markingSummary.grade} ({Math.round(markingSummary.percentage)}%)
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-6">
                    <motion.div 
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-6 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${markingSummary.percentage}%` }}
                      transition={{ duration: 1 }}
                    ></motion.div>
                  </div>
                  <p className="text-gray-600 mt-2">
                    Assessed using {MARKING_STANDARDS.find(s => s.id === selectedMarkingStandard)?.name} standards
                  </p>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Strengths */}
                <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                  <h3 className="text-xl font-semibold text-green-800 mb-4 flex items-center">
                    <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white mr-2">✓</span>
                    Strengths
                  </h3>
                  <ul className="space-y-3">
                    {markingSummary.strengths.map((strength, index) => (
                      <li key={index} className="text-green-700 flex items-start">
                        <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Areas for Improvement */}
                <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
                  <h3 className="text-xl font-semibold text-orange-800 mb-4 flex items-center">
                    <span className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-white mr-2">!</span>
                    Areas for Improvement
                  </h3>
                  <ul className="space-y-3">
                    {markingSummary.weaknesses.length > 0 ? (
                      markingSummary.weaknesses.map((weakness, index) => (
                        <li key={index} className="text-orange-700 flex items-start">
                          <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          {weakness}
                        </li>
                      ))
                    ) : (
                      <li className="text-orange-700">No major areas of concern identified</li>
                    )}
                  </ul>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <IconComponent icon={AiOutlineBulb} className="w-6 h-6 mr-2 text-yellow-500" />
                  Recommendations
                </h3>
                <ul className="space-y-4">
                  {markingSummary.recommendations.map((rec, index) => (
                    <li key={index} className="text-gray-700 flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Study Plan */}
              <div className="bg-purple-50 rounded-xl p-6 border border-purple-200">
                <h3 className="text-xl font-semibold text-purple-800 mb-4 flex items-center">
                  <IconComponent icon={AiOutlineBook} className="w-6 h-6 mr-2 text-purple-600" />
                  Personalized Study Plan
                </h3>
                <div className="space-y-4">
                  {markingSummary.studyPlan.map((item, index) => (
                    <div key={index} className="bg-white border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-purple-800">{item.topic}</h4>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          item.priority === 'high' ? 'bg-red-100 text-red-800' :
                          item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {item.priority} priority
                        </span>
                      </div>
                      <p className="text-purple-700 text-sm">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Export Options */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <IconComponent icon={FiDownload} className="h-4 w-4 mr-2" />
                  Download PDF
                </button>
                <button className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                  <IconComponent icon={FiCopy} className="h-4 w-4 mr-2" />
                  Copy Report
                </button>
                <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
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
            className="bg-slate-800 rounded-xl p-6 max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-white/10 relative"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-cyan-400 flex items-center">
                <IconComponent icon={AiOutlineFileText} className="h-6 w-6 mr-3" />
                Original Document: {file.name}
              </h3>
              <button
                onClick={() => setShowFileViewModal(false)}
                className="text-slate-400 hover:text-slate-300 p-2 rounded-lg hover:bg-slate-700 transition-colors"
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
                    <div className="flex items-center justify-center space-x-4 bg-slate-700/30 rounded-lg p-4">
                      <button 
                        className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-cyan-400 border border-cyan-500/30"
                        disabled={currentPage === 0}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                      >
                        Previous
                      </button>
                      <span className="text-slate-300 font-medium">
                        Page {currentPage + 1} of {documentPages.length}
                      </span>
                      <button 
                        className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-cyan-400 border border-cyan-500/30"
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
                    />
                  </div>

                  {/* Document Info */}
                  <div className="bg-slate-700/30 rounded-lg p-4 space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">File Name:</span>
                        <span className="text-slate-200 ml-2">{file.name}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">File Type:</span>
                        <span className="text-slate-200 ml-2">{file.type}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">File Size:</span>
                        <span className="text-slate-200 ml-2">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : textOnlyMode ? (
                <div className="bg-slate-700/30 rounded-lg p-6">
                  <h4 className="text-cyan-400 mb-4 font-semibold">Original Text:</h4>
                  <div className="bg-slate-800/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="text-slate-300 whitespace-pre-wrap text-sm font-mono">
                      {directText}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <IconComponent icon={AiOutlineFileText} className="h-16 w-16 mb-4 opacity-50" />
                  <p>No document to display</p>
                </div>
              )}
            </div>
          </PortalModal>
        )}
      </AnimatePresence>

      {/* History Modal */}
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
                    onClick={clearAllHistory}
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
                            deleteHistoryItem(item.id);
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
                    <p className="text-xl font-medium mb-2">No mistake check history yet</p>
                    <p className="text-sm">Your analyzed documents will appear here</p>
                    <p className="text-xs mt-2 text-slate-500">Upload documents or enter text to get started</p>
                  </motion.div>
                </div>
              )}
            </div>
          </PortalModal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CheckMistakesComponent; 