import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AiOutlineUpload, AiOutlineCamera, AiOutlineFullscreen, AiOutlineBulb, AiOutlineFileText, AiOutlineHistory, AiOutlineLoading3Quarters, AiOutlineLeft, AiOutlineRight, AiOutlineClose, AiOutlineCheckCircle, AiOutlineExclamationCircle, AiOutlineBook } from 'react-icons/ai';
import { FiDownload, FiCopy, FiShare2, FiClock, FiTrash2 } from 'react-icons/fi';
import IconComponent from './IconComponent';
import * as pdfjsLib from 'pdfjs-dist';
import { useResponseCheck, ResponseUpgradeModal } from '../../utils/responseChecker';

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
  const [documentView, setDocumentView] = useState<DocumentView>('image'); // Start with image view
  const [selectedMistakeId, setSelectedMistakeId] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false); // New state for animation
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mistakesContainerRef = useRef<HTMLDivElement>(null); // Add ref for auto-scroll

  // Response checking state
  const { checkAndUseResponse } = useResponseCheck();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');

  // Add new state for text-only processing and marks summary
  const [textOnlyMode, setTextOnlyMode] = useState(false);
  const [directText, setDirectText] = useState('');
  const [marksSummary, setMarksSummary] = useState<{
    totalMistakes: number;
    mistakesByType: { [key: string]: number };
    score: number;
    maxScore: number;
    suggestions: string[];
    overallFeedback: string;
  } | null>(null);

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

  // Check for mistakes in a page with concise response
  const checkMistakesForPage = async (imageUrl: string, pageNumber: number): Promise<Mistake[]> => {
    console.log(`🔄 Starting mistake checking for page ${pageNumber}`);
    
    try {
      // If text extraction is enabled, use a combined prompt that extracts text AND finds mistakes
      const systemPrompt = textExtractionEnabled 
        ? "You are an expert proofreader with OCR capabilities. First, extract ALL text from the image exactly as it appears. Then identify ONLY actual mistakes in that text. Respond in this EXACT format:\n\nEXTRACTED_TEXT:\n[exact text from image]\n\nMISTAKES:\nMISTAKE: [incorrect text]\nCORRECTION: [corrected text]\nTYPE: [grammar/spelling/punctuation]\n\nBe precise and only show actual errors."
        : "You are a precise proofreader. Analyze the image and identify ONLY actual mistakes. For each mistake found, provide EXACTLY in this format:\n\nMISTAKE: [incorrect text]\nCORRECTION: [corrected text]\nTYPE: [grammar/spelling/punctuation]\n\nBe concise and only show actual errors. Do not provide explanations or analysis.";
      
      const userPrompt = textExtractionEnabled
        ? "Extract all text from this image and then find mistakes. Use the exact format specified: first EXTRACTED_TEXT section, then MISTAKES section."
        : "Analyze this image and find mistakes. For each mistake, respond ONLY in this exact format:\n\nMISTAKE: [exact incorrect text]\nCORRECTION: [exact corrected text]\nTYPE: [mistake type]\n\nDo not include any other text, explanations, or analysis. Just list the mistakes in the specified format.";

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
                  
                  // If text extraction is enabled, parse and update both text and mistakes
                  if (textExtractionEnabled) {
                    const { extractedText, mistakes } = parseTextAndMistakes(fullContent);
                    
                    // Update extracted text
                    if (extractedText) {
                      setExtractedTexts(prev => prev.map(et => 
                        et.pageNumber === pageNumber 
                          ? { ...et, text: extractedText, isLoading: false, isComplete: true }
                          : et
                      ));
                    }
                    
                    // Update mistakes
                    setPageMistakes(prev => prev.map(pm => 
                      pm.pageNumber === pageNumber 
                        ? { ...pm, mistakes, isLoading: true }
                        : pm
                    ));
                  } else {
                    // Update page mistakes in real-time (text extraction disabled)
                    setPageMistakes(prev => prev.map(pm => 
                      pm.pageNumber === pageNumber 
                        ? { 
                            ...pm, 
                            mistakes: parseMistakesFromText(fullContent, pageNumber),
                            isLoading: true 
                          }
                        : pm
                    ));
                  }
                  
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
      let finalMistakes: Mistake[];
      
      if (textExtractionEnabled) {
        const { mistakes } = parseTextAndMistakes(fullContent);
        finalMistakes = mistakes;
      } else {
        finalMistakes = parseMistakesFromText(fullContent, pageNumber);
      }
      
      return finalMistakes;

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
    console.log('🚀 Starting processFile with parallel mistake checking');
    console.log('📁 File details:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    });

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

    setLoading(true);
    setProcessingStatus('Starting file processing...');
    setPageMistakes([]);
    setMarkingSummary(null);
    setDocumentView('image'); // Start with image view
    setIsTransitioning(false);
    setOverallProcessingComplete(false);

    const processStartTime = Date.now();
    console.log('⏰ File processing start time:', new Date(processStartTime).toISOString());

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
      
      console.log('📸 Total images to process:', pages.length);
      setDocumentPages(pages);
      setCurrentPage(0);
      setFile(file);
      
      // Initialize page mistakes
      const initialPageMistakes: PageMistakes[] = pages.map((_, index) => ({
        pageNumber: index + 1,
        mistakes: [],
        isLoading: true,
        isComplete: false
      }));
      setPageMistakes(initialPageMistakes);

      // Trigger magical transition after 10 seconds
      setTimeout(() => {
        setIsTransitioning(true);
        setTimeout(() => {
          setDocumentView('text');
          setIsTransitioning(false);
        }, 1500); // Transition duration
      }, 10000); // 10 seconds after upload

      // Initialize extracted texts if text extraction is enabled
      if (textExtractionEnabled) {
        const initialExtractedTexts: ExtractedText[] = pages.map((_, index) => ({
          pageNumber: index + 1,
          text: '',
          isLoading: true,
          isComplete: false
        }));
        setExtractedTexts(initialExtractedTexts);
      }
      
      setProcessingStatus(`Processing all ${pages.length} pages in parallel...`);
      setLoading(false); // Set loading to false so user can navigate pages
      
      // Process all pages in parallel
      console.log('🔄 Starting parallel processing of all pages for mistake checking');
      const processingPromises = pages.map(async (imageUrl, index) => {
        const pageNumber = index + 1;
        console.log(`🚀 Starting processing for page ${pageNumber}`);
        
        try {
          // Update page status to loading
          setPageMistakes(prev => prev.map(pm => 
            pm.pageNumber === pageNumber ? { ...pm, isLoading: true } : pm
          ));

          // Extract text from page
          const extractedText = await extractTextFromPage(imageUrl, pageNumber);
          
          // Update extracted texts
          if (textExtractionEnabled) {
            const extractedTextObj: ExtractedText = {
              pageNumber,
              text: extractedText,
              isLoading: false,
              isComplete: true
            };
            setExtractedTexts(prev => prev.map(et => 
              et.pageNumber === pageNumber ? extractedTextObj : et
            ));
          }

          // Check for mistakes
          const mistakes = await checkMistakesForPage(imageUrl, pageNumber);
          
          // Update page mistakes
          setPageMistakes(prev => prev.map(pm => 
            pm.pageNumber === pageNumber 
              ? { ...pm, mistakes, isLoading: false, isComplete: true }
              : pm
          ));

          console.log(`✅ Page ${pageNumber} processing completed successfully`);
          return { pageNumber, mistakes, extractedText };
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
        .filter((result): result is PromiseFulfilledResult<{pageNumber: number, mistakes: Mistake[], extractedText: string} | null> => 
          result.status === 'fulfilled' && result.value !== null
        )
        .map(result => result.value!);

      setOverallProcessingComplete(true);
      setProcessingStatus('All pages processed successfully!');

      // Generate integrated summary with marking assessment
      if (successfulResults.length > 0 && selectedMarkingStandard) {
        const allMistakes = successfulResults.flatMap(result => result.mistakes);
        const allText = successfulResults.map(result => result.extractedText).join('\n\n');
        
        const summary = generateIntegratedSummary(allMistakes, allText, selectedMarkingStandard);
        setMarkingSummary(summary);
      }

      const totalProcessTime = Date.now() - processStartTime;
      console.log('🎉 File processing completed successfully');
      console.log('⏱️ Total file processing time:', totalProcessTime + 'ms');

    } catch (error) {
      const totalProcessTime = Date.now() - processStartTime;
      console.error('💥 File processing error after', totalProcessTime + 'ms');
      console.error('🔴 Error message:', error instanceof Error ? error.message : String(error));
      
      setProcessingStatus('Error processing file');
      setOverallProcessingComplete(true);
    } finally {
      setTimeout(() => setProcessingStatus(''), 3000);
      console.log('🏁 processFile function completed');
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
    setMarkingSummary(null);
    setExtractedTexts([]);
    setDocumentView('image');
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
    console.log('🔤 Starting direct text processing');
    console.log('📝 Text length:', text.length);

    // Check responses before proceeding
    const responseResult = await checkAndUseResponse({
      responseType: 'mistake_checker',
      queryData: { 
        textLength: text.length,
        mode: 'text_direct'
      },
      responsesUsed: 1
    });

    if (!responseResult.canProceed) {
      setUpgradeMessage(responseResult.message || 'Unable to process request');
      setShowUpgradeModal(true);
      return;
    }

    setTextOnlyMode(true);
    setDirectText(text);
    setLoading(true);
    setProcessingStatus('Checking text for mistakes...');
    setPageMistakes([]); // Clear previous mistakes
    setOverallProcessingComplete(false);
    
    const processStartTime = Date.now();
    console.log('⏰ Text processing start time:', new Date(processStartTime).toISOString());
    
    try {
      // Create a single "page" for the text
      setDocumentPages(['text-only']);
      setCurrentPage(0);
      
      // Initialize page mistakes for text
      const initialPageMistakes: PageMistakes[] = [{
        pageNumber: 1,
        mistakes: [],
        isLoading: true,
        isComplete: false
      }];
      setPageMistakes(initialPageMistakes);
      
      // Check mistakes for the text
      const mistakes = await checkMistakesForText(text);
      
      // Update page mistakes
      setPageMistakes([{
        pageNumber: 1,
        mistakes,
        isLoading: false,
        isComplete: true
      }]);
      
      // Generate marks summary
      const summary = generateMarksSummary(mistakes, text);
      setMarksSummary(summary);
      
      setOverallProcessingComplete(true);
      setProcessingStatus('Text analysis completed!');
      
      const totalProcessTime = Date.now() - processStartTime;
      console.log('🎉 Direct text processing completed successfully');
      console.log('⏱️ Total text processing time:', totalProcessTime + 'ms');
      
    } catch (error) {
      const totalProcessTime = Date.now() - processStartTime;
      console.error('💥 Text processing error after', totalProcessTime + 'ms');
      console.error('🔴 Error message:', error instanceof Error ? error.message : String(error));
      
      setProcessingStatus('Error processing text');
      setPageMistakes([{
        pageNumber: 1,
        mistakes: [],
        isLoading: false,
        isComplete: true,
        error: error instanceof Error ? error.message : 'Unknown error'
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => setProcessingStatus(''), 3000);
      console.log('🏁 processTextDirectly function completed');
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

  // Generate marks summary based on mistakes
  const generateMarksSummary = (mistakes: Mistake[], text: string) => {
    const totalWords = text.trim().split(/\s+/).length;
    const totalMistakes = mistakes.length;
    
    // Calculate mistakes by type
    const mistakesByType = mistakes.reduce((acc, mistake) => {
      acc[mistake.type] = (acc[mistake.type] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
    
    // Calculate score (out of 100)
    // Scoring logic: Start with 100, deduct points based on mistake density
    let score = 100;
    const mistakeRate = totalMistakes / totalWords;
    
    if (mistakeRate > 0.1) { // More than 10% mistake rate
      score = Math.max(0, 100 - (mistakeRate * 400)); // Heavily penalize
    } else if (mistakeRate > 0.05) { // 5-10% mistake rate
      score = Math.max(20, 100 - (mistakeRate * 300));
    } else if (mistakeRate > 0.02) { // 2-5% mistake rate
      score = Math.max(40, 100 - (mistakeRate * 200));
    } else if (mistakeRate > 0.01) { // 1-2% mistake rate
      score = Math.max(60, 100 - (mistakeRate * 150));
    } else { // Less than 1% mistake rate
      score = Math.max(80, 100 - (mistakeRate * 100));
    }
    
    score = Math.round(score);
    
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
    } else if (totalMistakes <= 3) {
      suggestions.push('Great job! Only minor errors detected');
    }
    
    // Generate overall feedback
    let overallFeedback = '';
    if (score >= 90) {
      overallFeedback = 'Excellent work! Your writing demonstrates strong command of language with minimal errors.';
    } else if (score >= 80) {
      overallFeedback = 'Good work! Your writing is clear with only minor errors that can be easily corrected.';
    } else if (score >= 70) {
      overallFeedback = 'Decent work! Some errors present but overall communication is effective. Focus on the suggested areas.';
    } else if (score >= 60) {
      overallFeedback = 'Fair work! Multiple errors detected that may affect clarity. Review the suggestions for improvement.';
    } else {
      overallFeedback = 'Needs improvement! Significant errors detected that impact readability. Focus on fundamental language skills.';
    }
    
    return {
      totalMistakes,
      mistakesByType,
      score,
      maxScore: 100,
      suggestions,
      overallFeedback
    };
  };

  // Generate integrated summary combining mistakes and marking
  const generateIntegratedSummary = (mistakes: Mistake[], text: string, markingStandardId: string): MarkingSummary => {
    const standard = MARKING_STANDARDS.find(s => s.id === markingStandardId)!;
    const totalWords = text.trim().split(/\s+/).length;
    const totalMistakes = mistakes.length;
    
    // Calculate mistake density and base score
    const mistakeRate = totalMistakes / Math.max(totalWords, 1);
    let baseScore = 100;
    
    if (mistakeRate > 0.1) {
      baseScore = Math.max(0, 100 - (mistakeRate * 400));
    } else if (mistakeRate > 0.05) {
      baseScore = Math.max(20, 100 - (mistakeRate * 300));
    } else if (mistakeRate > 0.02) {
      baseScore = Math.max(40, 100 - (mistakeRate * 200));
    } else if (mistakeRate > 0.01) {
      baseScore = Math.max(60, 100 - (mistakeRate * 150));
    } else {
      baseScore = Math.max(80, 100 - (mistakeRate * 100));
    }
    
    // Scale to marking standard
    const scaledScore = Math.round((baseScore / 100) * standard.gradingScale.max);
    const percentage = (scaledScore / standard.gradingScale.max) * 100;
    
    // Determine grade
    let grade = 'F';
    const gradeLabels = standard.gradingScale.gradeLabels;
    for (const [threshold, label] of Object.entries(gradeLabels).reverse()) {
      if (scaledScore >= parseInt(threshold)) {
        grade = label;
        break;
      }
    }
    
    // Analyze mistake types for criteria assessment
    const mistakesByType = mistakes.reduce((acc, mistake) => {
      acc[mistake.type] = (acc[mistake.type] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
    
    // Generate strengths and weaknesses
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];
    const studyPlan: { topic: string; priority: 'high' | 'medium' | 'low'; description: string }[] = [];
    
    if (totalMistakes === 0) {
      strengths.push('Perfect accuracy - no mistakes detected');
      strengths.push('Excellent command of language');
      strengths.push('Strong attention to detail');
    } else {
      if (mistakesByType.grammar || 0 < totalMistakes * 0.3) {
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
      
      if (mistakesByType.spelling || 0 < totalMistakes * 0.2) {
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
      
      if (mistakesByType.punctuation || 0 < totalMistakes * 0.2) {
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
    } else if (percentage < 50) {
      weaknesses.push('Significant improvement needed in multiple areas');
      recommendations.push('Consider additional writing practice and tutoring');
      studyPlan.push({
        topic: 'Comprehensive Writing Review',
        priority: 'high',
        description: 'Work on fundamental writing skills across all areas'
      });
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

  // If no file is uploaded, show upload interface
  if (!file) {
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
                Check Mistakes & Get Marked
              </h2>
              <p className="text-slate-300">
                Upload your document to check for grammar, spelling, and punctuation mistakes, then get a detailed marking assessment
              </p>
            </div>

            {/* Control Settings */}
            <div className="flex items-center justify-center mb-4">
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
                  Select Marking Standard
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
                <p className="text-xs text-slate-400 mt-2 text-center">
                  {MARKING_STANDARDS.find(s => s.id === selectedMarkingStandard)?.description}
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <div 
                className="border-2 border-dashed border-white/20 rounded-lg p-12 text-center hover:border-cyan-500/50 cursor-pointer transition-colors relative bg-slate-600/20 backdrop-blur-sm"
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
                  <IconComponent icon={AiOutlineUpload} className="h-12 w-12 mx-auto mb-4 text-cyan-400" />
                  <p className="text-lg font-medium text-slate-300 mb-2">Drag and drop your file here, or click to browse</p>
                  <p className="text-sm">Supports PDF, Word documents, and images</p>
                </div>
              </div>
            </div>

            {/* Text Input Option */}
            <div className="mb-6">
              <div className="text-center mb-4">
                <span className="text-slate-400 text-sm">or</span>
              </div>
              <div className="bg-slate-600/20 backdrop-blur-sm rounded-lg p-4 border border-white/10">
                <label className="block text-slate-300 mb-3 font-medium">
                  Paste your text directly
                </label>
                <textarea
                  placeholder="Paste your text here for mistake checking..."
                  className="w-full h-32 p-3 bg-slate-600/30 backdrop-blur-sm border border-white/10 rounded-lg text-slate-300 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
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
                    Processing...
                  </>
                ) : (
                  <>
                    Check for Mistakes & Get Marking
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
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

        {/* Show Full Summary Button */}
        {markingSummary && overallProcessingComplete && (
          <motion.button
            onClick={() => {
              // You can add a detailed modal view here if needed
              console.log('Full summary:', markingSummary);
            }}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-medium shadow-md hover:shadow-lg transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            View Full Report
            <IconComponent icon={AiOutlineHistory} className="h-4 w-4 ml-2" />
          </motion.button>
        )}
      </div>

      {/* Split View: Document on Left, Content on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
        {/* Left Side - Document */}
        <div className="bg-slate-600/30 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg overflow-hidden">
          <div className="bg-slate-700/50 backdrop-blur-sm px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-cyan-400">Document</h2>
            
            {/* Document View Toggle (only show if text extraction is enabled and we have extracted text) */}
            {textExtractionEnabled && extractedTexts[currentPage] && extractedTexts[currentPage].isComplete && !extractedTexts[currentPage].error && (
              <div className="flex items-center bg-slate-600/30 backdrop-blur-sm rounded-lg p-1 border border-white/10">
                <button
                  onClick={() => setDocumentView('image')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    documentView === 'image'
                      ? 'bg-cyan-500 text-white shadow-md'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center">
                    <IconComponent icon={AiOutlineCamera} className="h-4 w-4 mr-1" />
                    Image
                  </div>
                </button>
                <button
                  onClick={() => setDocumentView('text')}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    documentView === 'text'
                      ? 'bg-cyan-500 text-white shadow-md'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-center">
                    <IconComponent icon={AiOutlineFileText} className="h-4 w-4 mr-1" />
                    Text
                  </div>
                </button>
              </div>
            )}
          </div>
          <div className="h-full p-4 relative">
            <div className="w-full h-full bg-slate-700/30 backdrop-blur-sm rounded-lg overflow-hidden border border-white/10 relative">
              {/* Magical Transition Overlay */}
              <AnimatePresence>
                {isTransitioning && (
                  <motion.div
                    className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-purple-900/90 via-blue-900/90 to-cyan-900/90 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    {/* Magical particles */}
                    <div className="absolute inset-0 overflow-hidden">
                      {[...Array(20)].map((_, i) => (
                        <motion.div
                          key={i}
                          className="absolute w-2 h-2 bg-cyan-400 rounded-full"
                          initial={{
                            x: Math.random() * window.innerWidth,
                            y: Math.random() * window.innerHeight,
                            scale: 0,
                            opacity: 0
                          }}
                          animate={{
                            x: Math.random() * window.innerWidth,
                            y: Math.random() * window.innerHeight,
                            scale: [0, 1, 0],
                            opacity: [0, 1, 0]
                          }}
                          transition={{
                            duration: 2,
                            delay: i * 0.1,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                      ))}
                    </div>
                    
                    {/* Central AI magic effect */}
                    <div className="relative z-10 text-center">
                      <motion.div
                        className="mb-6"
                        initial={{ scale: 0, rotate: 0 }}
                        animate={{ scale: 1, rotate: 360 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      >
                        <div className="relative">
                          {/* Outer rotating ring */}
                          <motion.div
                            className="w-24 h-24 border-4 border-cyan-400/30 rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          />
                          
                          {/* Inner rotating ring */}
                          <motion.div
                            className="absolute inset-2 w-20 h-20 border-4 border-purple-400/50 rounded-full"
                            animate={{ rotate: -360 }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                          />
                          
                          {/* Central AI icon */}
                          <motion.div
                            className="absolute inset-0 flex items-center justify-center"
                            animate={{ 
                              scale: [1, 1.2, 1],
                              opacity: [0.7, 1, 0.7]
                            }}
                            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <IconComponent icon={AiOutlineFileText} className="h-8 w-8 text-cyan-400" />
                          </motion.div>
                        </div>
                      </motion.div>
                      
                      <motion.h3
                        className="text-2xl font-bold text-white mb-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                      >
                        ✨ AI Magic in Progress ✨
                      </motion.h3>
                      
                      <motion.p
                        className="text-cyan-300"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7, duration: 0.5 }}
                      >
                        Transforming image to intelligent text view...
                      </motion.p>
                      
                      {/* Pulse effect */}
                      <motion.div
                        className="absolute inset-0 bg-cyan-400/10 rounded-lg"
                        animate={{ 
                          opacity: [0, 0.3, 0],
                          scale: [0.8, 1.2, 0.8]
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {textOnlyMode ? (
                /* Direct Text Display */
                <div className="w-full h-full overflow-auto p-4">
                  <div className="text-slate-300 whitespace-pre-wrap font-mono text-sm leading-relaxed">
                    {directText ? (
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
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <IconComponent icon={AiOutlineFileText} className="h-8 w-8 mb-2 opacity-50" />
                        <p className="text-sm">No text to display</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : documentView === 'image' ? (
                <motion.img 
                  src={documentPages[currentPage]} 
                  alt={`Document page ${currentPage + 1}`}
                  className="w-full h-full object-contain"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                />
              ) : (
                /* Text View with Highlighted Mistakes */
                <motion.div 
                  className="w-full h-full overflow-auto p-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {extractedTexts[currentPage] && extractedTexts[currentPage].isLoading ? (
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
                      <div className="text-slate-300 whitespace-pre-wrap font-mono text-sm leading-relaxed mb-4">
                        {highlightMistakesInText(
                          extractedTexts[currentPage].text, 
                          pageMistakes[currentPage]?.mistakes || []
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
                        ))}
                      </div>
                      
                      {/* Color Legend */}
                      {pageMistakes[currentPage]?.mistakes && pageMistakes[currentPage].mistakes.length > 0 && (
                        <div className="mt-4 p-3 bg-slate-600/30 rounded-lg border border-white/10">
                          <h4 className="text-sm font-medium text-slate-300 mb-2">Mistake Types:</h4>
                          <div className="flex flex-wrap gap-3 text-xs">
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-red-500/30 border-b-2 border-red-500 rounded mr-2"></div>
                              <span className="text-slate-400">Grammar</span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-yellow-500/30 border-b-2 border-yellow-500 rounded mr-2"></div>
                              <span className="text-slate-400">Spelling</span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-blue-500/30 border-b-2 border-blue-500 rounded mr-2"></div>
                              <span className="text-slate-400">Punctuation</span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-3 h-3 bg-orange-500/30 border-b-2 border-orange-500 rounded mr-2"></div>
                              <span className="text-slate-400">Other</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                      <IconComponent icon={AiOutlineFileText} className="h-8 w-8 mb-2 opacity-50" />
                      <p className="text-sm">No text extracted</p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Mistakes and Marking */}
        <div className="bg-slate-600/30 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg overflow-hidden flex flex-col">
          <div className="bg-slate-700/50 backdrop-blur-sm px-6 py-4 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-cyan-400">Mistakes & Assessment</h2>
              {pageMistakes[currentPage] && (
                <div className="flex items-center space-x-2">
                  {pageMistakes[currentPage].isLoading && (
                    <div className="flex items-center text-cyan-400">
                      <motion.div
                        className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full mr-2"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      <span className="text-sm">Processing...</span>
                    </div>
                  )}
                  {pageMistakes[currentPage].isComplete && !pageMistakes[currentPage].error && (
                    <span className="text-sm text-green-400 font-medium">✓ Complete</span>
                  )}
                  {pageMistakes[currentPage].error && (
                    <span className="text-sm text-red-400 font-medium">⚠ Error</span>
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
                      className={`w-3 h-3 rounded-full ${
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
          
          <div className="flex-1 overflow-y-auto p-6" ref={mistakesContainerRef}>
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <motion.div
                  className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full mb-4"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <p className="text-center">{processingStatus || 'Checking for mistakes...'}</p>
              </div>
            ) : (
              <>
                {/* Integrated Marking Summary (shown when processing is complete) */}
                {markingSummary && overallProcessingComplete && (
                  <motion.div 
                    className="mb-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-lg p-6 border border-purple-500/20"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    <h3 className="text-xl font-semibold text-purple-400 mb-4 flex items-center">
                      <IconComponent icon={AiOutlineFileText} className="h-5 w-5 mr-2" />
                      Assessment Summary ({MARKING_STANDARDS.find(s => s.id === selectedMarkingStandard)?.name})
                    </h3>
                    
                    {/* Score Display */}
                    <div className="mb-6 text-center">
                      <div className="text-4xl font-bold text-green-400 mb-2">
                        {markingSummary.totalScore}/{markingSummary.maxScore}
                      </div>
                      <div className="text-xl font-semibold text-green-300 mb-3">
                        Grade: {markingSummary.grade} ({Math.round(markingSummary.percentage)}%)
                      </div>
                      <div className="w-full bg-slate-600 rounded-full h-4">
                        <motion.div 
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-4 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${markingSummary.percentage}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                        ></motion.div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* Strengths */}
                      {markingSummary.strengths.length > 0 && (
                        <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
                          <h4 className="text-sm font-semibold text-green-400 mb-2 flex items-center">
                            ✓ Strengths
                          </h4>
                          <ul className="space-y-1">
                            {markingSummary.strengths.slice(0, 3).map((strength, index) => (
                              <li key={index} className="text-xs text-green-300">• {strength}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Areas for Improvement */}
                      {markingSummary.weaknesses.length > 0 && (
                        <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
                          <h4 className="text-sm font-semibold text-red-400 mb-2 flex items-center">
                            ! Areas to Improve
                          </h4>
                          <ul className="space-y-1">
                            {markingSummary.weaknesses.slice(0, 3).map((weakness, index) => (
                              <li key={index} className="text-xs text-red-300">• {weakness}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    
                    {/* Study Plan Preview */}
                    {markingSummary.studyPlan.length > 0 && (
                      <div className="bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                        <h4 className="text-sm font-semibold text-blue-400 mb-2">📚 Study Plan</h4>
                        <div className="space-y-2">
                          {markingSummary.studyPlan.slice(0, 2).map((item, index) => (
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
                          {markingSummary.studyPlan.length > 2 && (
                            <p className="text-xs text-slate-400">+ {markingSummary.studyPlan.length - 2} more items</p>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Mistakes Content */}
                {pageMistakes[currentPage] && pageMistakes[currentPage].mistakes.length > 0 ? (
                  <div className="space-y-4">
                    <div className="mb-4 p-3 bg-teal-500/10 backdrop-blur-sm rounded-lg border border-teal-500/20">
                      <h3 className="text-lg font-semibold text-teal-400">
                        {textOnlyMode ? 'Text Analysis' : `Page ${currentPage + 1}`} - {pageMistakes[currentPage].mistakes.length} mistake(s) found
                      </h3>
                    </div>
                    
                    {pageMistakes[currentPage].mistakes.map((mistake) => (
                      <motion.div
                        key={mistake.id}
                        className={`bg-slate-700/30 backdrop-blur-sm rounded-lg p-4 border cursor-pointer transition-all ${
                          selectedMistakeId === mistake.id 
                            ? 'border-cyan-500/50 bg-cyan-500/10' 
                            : 'border-white/10 hover:border-cyan-500/30'
                        }`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: mistake.id * 0.1 }}
                        onClick={() => {
                          setSelectedMistakeId(selectedMistakeId === mistake.id ? null : mistake.id);
                          if (textExtractionEnabled && extractedTexts[currentPage]) {
                            setDocumentView('text'); // Switch to text view to show highlighting
                          }
                        }}
                      >
                        <div className="mb-2">
                          <span className="inline-block px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium rounded border border-yellow-500/30">
                            {mistake.type}
                          </span>
                        </div>
                        
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-red-400 mb-1">Incorrect:</h4>
                          <div className="bg-red-500/10 border-l-4 border-red-500 p-3 rounded-r">
                            <p className="text-slate-300 font-mono">{mistake.incorrect}</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-green-400 mb-1">Correction:</h4>
                          <div className="bg-green-500/10 border-l-4 border-green-500 p-3 rounded-r">
                            <p className="text-slate-300 font-mono">{mistake.correct}</p>
                          </div>
                        </div>
                        
                        {mistake.explanation && (
                          <div className="mt-3 p-3 bg-blue-500/10 rounded border border-blue-500/20">
                            <p className="text-sm text-blue-400">{mistake.explanation}</p>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : pageMistakes[currentPage] && pageMistakes[currentPage].isComplete ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <div className="text-6xl mb-4">✅</div>
                    <h3 className="text-xl font-semibold text-green-400 mb-2">No Mistakes Found!</h3>
                    <p className="text-center">This page appears to be error-free. Great job!</p>
                    
                    {/* Show summary even when no mistakes found */}
                    {markingSummary && overallProcessingComplete && (
                      <div className="mt-6 text-center">
                        <div className="text-2xl font-bold text-green-400 mb-2">
                          Perfect Score: {markingSummary.totalScore}/{markingSummary.maxScore}
                        </div>
                        <div className="text-lg text-green-300">
                          Grade: {markingSummary.grade} (Excellent!)
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <IconComponent icon={AiOutlineBulb} className="h-12 w-12 mb-3 opacity-50" />
                    <p className="text-center">Mistakes and assessment will appear here after processing your document.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Assessment Summary Section - Regular Box Below Content */}
      {markingSummary && overallProcessingComplete && (
        <motion.div
          className="mt-8 bg-white rounded-2xl p-8 shadow-2xl border border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-800">📊 Assessment Summary</h2>
            <p className="text-gray-600 mt-2">Complete analysis of your document with marking assessment</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Score Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-6 rounded-xl">
              <div className="text-center">
                <div className="text-4xl font-bold text-indigo-600 mb-2">
                  {markingSummary.grade}
                </div>
                <div className="text-2xl font-semibold text-gray-700 mb-1">
                  {markingSummary.percentage.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">
                  {markingSummary.totalScore}/{markingSummary.maxScore} marks
                </div>
                {/* Animated score bar */}
                <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
                  <motion.div
                    className="bg-gradient-to-r from-indigo-500 to-blue-600 h-3 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${markingSummary.percentage}%` }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>

            {/* Strengths */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-100 p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center">
                <IconComponent icon={AiOutlineCheckCircle} className="w-5 h-5 mr-2" />
                Strengths
              </h3>
              <ul className="space-y-2">
                {markingSummary.strengths.map((strength, index) => (
                  <li key={index} className="text-sm text-green-700 flex items-start">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>

            {/* Areas for Improvement */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-100 p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-orange-800 mb-3 flex items-center">
                <IconComponent icon={AiOutlineFileText} className="w-5 h-5 mr-2" />
                Areas for Improvement
              </h3>
              <ul className="space-y-2">
                {markingSummary.weaknesses.length > 0 ? (
                  markingSummary.weaknesses.map((weakness, index) => (
                    <li key={index} className="text-sm text-orange-700 flex items-start">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {weakness}
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-orange-700">No major areas of concern identified</li>
                )}
              </ul>
            </div>
          </div>

          {/* Recommendations */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <IconComponent icon={AiOutlineBulb} className="w-5 h-5 mr-2 text-yellow-500" />
              Recommendations
            </h3>
            <div className="bg-gray-50 rounded-xl p-4">
              <ul className="space-y-3">
                {markingSummary.recommendations.map((rec, index) => (
                  <li key={index} className="text-gray-700 flex items-start">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Study Plan */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <IconComponent icon={AiOutlineBook} className="w-5 h-5 mr-2 text-purple-500" />
              Study Plan
            </h3>
            <div className="space-y-3">
              {markingSummary.studyPlan.map((item, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-800">{item.topic}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.priority === 'high' ? 'bg-red-100 text-red-800' :
                      item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {item.priority} priority
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
              ))}
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
    </div>
  );
};

export default CheckMistakesComponent; 