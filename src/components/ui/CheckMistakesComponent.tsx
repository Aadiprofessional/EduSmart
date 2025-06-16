import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AiOutlineUpload, AiOutlineCamera, AiOutlineFullscreen, AiOutlineBulb, AiOutlineFileText, AiOutlineHistory, AiOutlineLoading3Quarters, AiOutlineLeft, AiOutlineRight } from 'react-icons/ai';
import { FiDownload, FiCopy, FiShare2, FiClock, FiTrash2 } from 'react-icons/fi';
import IconComponent from './IconComponent';
import * as pdfjsLib from 'pdfjs-dist';

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

type ViewMode = 'mistakes' | 'marking';

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
  
  // Add new state for teacher marking mode
  const [viewMode, setViewMode] = useState<ViewMode>('mistakes');
  const [selectedMarkingStandard, setSelectedMarkingStandard] = useState<string>('hkdse');
  const [pageMarkings, setPageMarkings] = useState<PageMarking[]>([]);
  const [markingSummary, setMarkingSummary] = useState<MarkingSummary | null>(null);
  const [isGeneratingMarking, setIsGeneratingMarking] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Check for mistakes in a page with concise response
  const checkMistakesForPage = async (imageUrl: string, pageNumber: number): Promise<Mistake[]> => {
    console.log(`🔄 Starting mistake checking for page ${pageNumber}`);
    
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
                  text: "You are a precise proofreader. Analyze the image and identify ONLY actual mistakes. For each mistake found, provide EXACTLY in this format:\n\nMISTAKE: [incorrect text]\nCORRECTION: [corrected text]\nTYPE: [grammar/spelling/punctuation]\n\nBe concise and only show actual errors. Do not provide explanations or analysis."
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
                  text: "Analyze this image and find mistakes. For each mistake, respond ONLY in this exact format:\n\nMISTAKE: [exact incorrect text]\nCORRECTION: [exact corrected text]\nTYPE: [mistake type]\n\nDo not include any other text, explanations, or analysis. Just list the mistakes in the specified format."
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
                  
                  // Update page mistakes in real-time
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
      const finalMistakes = parseMistakesFromText(fullContent, pageNumber);
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
                  setPageMarkings(prev => prev.map(pm => 
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
    const totalScore = pageMarkings.reduce((sum, pm) => sum + pm.totalMarks, 0);
    const maxScore = pageMarkings.reduce((sum, pm) => sum + pm.maxMarks, 0);
    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;
    
    // Determine grade based on marking standard
    let grade = 'F';
    const gradeLabels = markingStandard.gradingScale.gradeLabels;
    const scaledScore = (percentage / 100) * markingStandard.gradingScale.max;
    
    for (const [threshold, label] of Object.entries(gradeLabels).reverse()) {
      if (scaledScore >= parseInt(threshold)) {
        grade = label;
        break;
      }
    }

    // Analyze strengths and weaknesses
    const allQuestions = pageMarkings.flatMap(pm => pm.questions);
    const avgCriteria = {
      accuracy: allQuestions.reduce((sum, q) => sum + q.criteria.accuracy, 0) / allQuestions.length,
      presentation: allQuestions.reduce((sum, q) => sum + q.criteria.presentation, 0) / allQuestions.length,
      methodology: allQuestions.reduce((sum, q) => sum + q.criteria.methodology, 0) / allQuestions.length,
      understanding: allQuestions.reduce((sum, q) => sum + q.criteria.understanding, 0) / allQuestions.length
    };

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];
    const studyPlan: { topic: string; priority: 'high' | 'medium' | 'low'; description: string }[] = [];

    // Analyze each criteria
    Object.entries(avgCriteria).forEach(([criteria, score]) => {
      const maxCriteriaScore = markingStandard.criteria[criteria as keyof typeof markingStandard.criteria];
      const criteriaPercentage = (score / maxCriteriaScore) * 100;
      
      if (criteriaPercentage >= 80) {
        strengths.push(`Strong ${criteria} skills`);
      } else if (criteriaPercentage < 60) {
        weaknesses.push(`Needs improvement in ${criteria}`);
        recommendations.push(`Focus on developing ${criteria} skills`);
        studyPlan.push({
          topic: `${criteria.charAt(0).toUpperCase() + criteria.slice(1)} Skills`,
          priority: criteriaPercentage < 40 ? 'high' : 'medium',
          description: `Practice exercises to improve ${criteria} in problem-solving`
        });
      }
    });

    return {
      totalScore,
      maxScore,
      percentage,
      grade,
      strengths,
      weaknesses,
      recommendations,
      studyPlan
    };
  };

  const handleSwitchToMarking = async () => {
    if (!documentPages.length) return;
    
    setViewMode('marking');
    setIsGeneratingMarking(true);
    
    const selectedStandard = MARKING_STANDARDS.find(s => s.id === selectedMarkingStandard)!;
    
    // Initialize page markings
    const initialPageMarkings: PageMarking[] = documentPages.map((_, index) => ({
      pageNumber: index + 1,
      questions: [],
      totalMarks: 0,
      maxMarks: 0,
      isLoading: true,
      isComplete: false
    }));
    setPageMarkings(initialPageMarkings);
    
    try {
      // Process all pages in parallel for marking
      const markingPromises = documentPages.map(async (imageUrl, index) => {
        const pageNumber = index + 1;
        try {
          const pageMarking = await markPageForTeacher(imageUrl, pageNumber, selectedStandard);
          
          setPageMarkings(prev => prev.map(pm => 
            pm.pageNumber === pageNumber ? pageMarking : pm
          ));
          
          return pageMarking;
        } catch (error) {
          console.error(`Error marking page ${pageNumber}:`, error);
          setPageMarkings(prev => prev.map(pm => 
            pm.pageNumber === pageNumber 
              ? { ...pm, isLoading: false, isComplete: true, error: 'Marking failed' }
              : pm
          ));
          return null;
        }
      });
      
      const results = await Promise.allSettled(markingPromises);
      const successfulMarkings = results
        .filter((result): result is PromiseFulfilledResult<PageMarking> => 
          result.status === 'fulfilled' && result.value !== null
        )
        .map(result => result.value);
      
      // Generate summary
      if (successfulMarkings.length > 0) {
        const summary = generateMarkingSummary(successfulMarkings, selectedStandard);
        setMarkingSummary(summary);
      }
      
    } catch (error) {
      console.error('Error in marking process:', error);
    } finally {
      setIsGeneratingMarking(false);
    }
  };

  const processFile = async (file: File) => {
    console.log('🚀 Starting processFile with parallel mistake checking');
    console.log('📁 File details:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    });
    
    setLoading(true);
    setProcessingStatus('Starting file processing...');
    setPageMistakes([]); // Clear previous page mistakes
    setOverallProcessingComplete(false);
    
    const processStartTime = Date.now();
    console.log('⏰ File processing start time:', new Date(processStartTime).toISOString());
    
    try {
      let imageUrls: string[] = [];
      
      if (file.type === 'application/pdf') {
        console.log('📄 Processing PDF file');
        imageUrls = await convertPdfToImages(file);
        console.log('✅ PDF converted to', imageUrls.length, 'images');
      } else if (file.type.startsWith('image/')) {
        console.log('🖼️ Processing image file');
        setProcessingStatus('Processing image...');
        
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
        
        imageUrls = [imageDataUrl];
      } else {
        console.error('❌ Unsupported file type:', file.type);
        throw new Error('Unsupported file type. Please upload a PDF or image file.');
      }
      
      console.log('📸 Total images to process:', imageUrls.length);
      setDocumentPages(imageUrls);
      setCurrentPage(0);
      setFile(file);
      
      // Initialize page mistakes for all pages
      const initialPageMistakes: PageMistakes[] = imageUrls.map((_, index) => ({
        pageNumber: index + 1,
        mistakes: [],
        isLoading: true,
        isComplete: false
      }));
      setPageMistakes(initialPageMistakes);
      
      setProcessingStatus(`Processing all ${imageUrls.length} pages in parallel...`);
      setLoading(false); // Set loading to false so user can navigate pages
      
      // Process based on selected mode
      if (viewMode === 'mistakes') {
        // Process all pages in parallel for mistake checking
        console.log('🔄 Starting parallel processing of all pages for mistake checking');
        const processingPromises = imageUrls.map(async (imageUrl, index) => {
          const pageNumber = index + 1;
          console.log(`🚀 Starting processing for page ${pageNumber}`);
          
          try {
            const mistakes = await checkMistakesForPage(imageUrl, pageNumber);
            
            // Mark page as complete
            setPageMistakes(prev => prev.map(pm => 
              pm.pageNumber === pageNumber 
                ? { ...pm, mistakes, isLoading: false, isComplete: true }
                : pm
            ));
            
            console.log(`✅ Page ${pageNumber} processing completed successfully`);
            return { pageNumber, mistakes, success: true };
          } catch (error) {
            console.error(`❌ Error processing page ${pageNumber}:`, error);
            
            // Mark page as error
            setPageMistakes(prev => prev.map(pm => 
              pm.pageNumber === pageNumber 
                ? { 
                    ...pm, 
                    mistakes: [],
                    isLoading: false, 
                    isComplete: true,
                    error: error instanceof Error ? error.message : 'Unknown error'
                  }
                : pm
            ));
            
            return { pageNumber, error: error instanceof Error ? error.message : 'Unknown error', success: false };
          }
        });
        
        // Wait for all pages to complete
        console.log('⏳ Waiting for all pages to complete processing...');
        const results = await Promise.allSettled(processingPromises);
        
        const totalProcessTime = Date.now() - processStartTime;
        console.log('✅ All pages processing completed');
        console.log('⏱️ Total file processing time:', totalProcessTime + 'ms');
        
        setOverallProcessingComplete(true);
        setProcessingStatus('All pages processed successfully!');
        console.log('🎉 File processing completed successfully');
      } else {
        // Start marking process
        console.log('🎯 Starting marking process');
        setIsGeneratingMarking(true);
        
        const selectedStandard = MARKING_STANDARDS.find(s => s.id === selectedMarkingStandard)!;
        
        // Initialize page markings
        const initialPageMarkings: PageMarking[] = imageUrls.map((_, index) => ({
          pageNumber: index + 1,
          questions: [],
          totalMarks: 0,
          maxMarks: 0,
          isLoading: true,
          isComplete: false
        }));
        setPageMarkings(initialPageMarkings);
        
        try {
          // Process all pages in parallel for marking
          const markingPromises = imageUrls.map(async (imageUrl, index) => {
            const pageNumber = index + 1;
            try {
              const pageMarking = await markPageForTeacher(imageUrl, pageNumber, selectedStandard);
              
              setPageMarkings(prev => prev.map(pm => 
                pm.pageNumber === pageNumber ? pageMarking : pm
              ));
              
              return pageMarking;
            } catch (error) {
              console.error(`Error marking page ${pageNumber}:`, error);
              setPageMarkings(prev => prev.map(pm => 
                pm.pageNumber === pageNumber 
                  ? { ...pm, isLoading: false, isComplete: true, error: 'Marking failed' }
                  : pm
              ));
              return null;
            }
          });
          
          const results = await Promise.allSettled(markingPromises);
          const successfulMarkings = results
            .filter((result): result is PromiseFulfilledResult<PageMarking> => 
              result.status === 'fulfilled' && result.value !== null
            )
            .map(result => result.value);
          
          // Generate summary
          if (successfulMarkings.length > 0) {
            const summary = generateMarkingSummary(successfulMarkings, selectedStandard);
            setMarkingSummary(summary);
          }
          
          const totalProcessTime = Date.now() - processStartTime;
          console.log('✅ All pages marking completed');
          console.log('⏱️ Total marking time:', totalProcessTime + 'ms');
          
          setOverallProcessingComplete(true);
          setProcessingStatus('All pages marked successfully!');
          console.log('🎉 Marking process completed successfully');
          
        } catch (error) {
          console.error('Error in marking process:', error);
          setProcessingStatus('Error in marking process');
        } finally {
          setIsGeneratingMarking(false);
        }
      }
      
    } catch (error) {
      const totalProcessTime = Date.now() - processStartTime;
      console.error('💥 File processing error after', totalProcessTime + 'ms');
      console.error('🔴 Error message:', error instanceof Error ? error.message : String(error));
      
      setProcessingStatus('Error processing file');
      setLoading(false);
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
    setViewMode('mistakes');
    setPageMarkings([]);
    setMarkingSummary(null);
    setIsGeneratingMarking(false);
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
                {viewMode === 'mistakes' ? 'Check Mistakes' : 'Teacher Marking'}
              </h2>
              <p className="text-slate-300">
                {viewMode === 'mistakes' 
                  ? 'Upload your document to check for grammar, spelling, and punctuation mistakes'
                  : 'Upload student work to mark and provide detailed feedback'
                }
              </p>
            </div>

            {/* Mode Selection */}
            <div className="mb-6">
              <div className="flex items-center justify-center mb-4">
                <div className="flex items-center bg-slate-600/30 backdrop-blur-sm rounded-lg p-1 border border-white/10">
                  <button
                    onClick={() => setViewMode('mistakes')}
                    className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'mistakes'
                        ? 'bg-cyan-500 text-white shadow-md'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center">
                      <IconComponent icon={AiOutlineBulb} className="h-4 w-4 mr-2" />
                      Check Mistakes
                    </div>
                  </button>
                  <button
                    onClick={() => setViewMode('marking')}
                    className={`px-6 py-3 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'marking'
                        ? 'bg-cyan-500 text-white shadow-md'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center">
                      <IconComponent icon={AiOutlineFileText} className="h-4 w-4 mr-2" />
                      Teacher Marking
                    </div>
                  </button>
                </div>
              </div>

              {/* Marking Standard Selector (only show in marking mode) */}
              {viewMode === 'marking' && (
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
              )}
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
            
            <div className="flex items-center justify-center">
              <motion.button
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className={`flex items-center justify-center px-8 py-4 rounded-lg text-white font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                  viewMode === 'mistakes' 
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                    : 'bg-gradient-to-r from-green-500 to-emerald-500'
                }`}
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
                    {viewMode === 'mistakes' ? 'Check for Mistakes' : 'Start Marking'}
                    <IconComponent 
                      icon={viewMode === 'mistakes' ? AiOutlineBulb : AiOutlineFileText} 
                      className="h-5 w-5 ml-2" 
                    />
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
              {viewMode === 'mistakes' ? 'Check Mistakes' : 'Teacher Marking'}
            </h1>
            <p className="text-slate-300">{file.name}</p>
            {viewMode === 'marking' && (
              <p className="text-sm text-slate-400">
                Using {MARKING_STANDARDS.find(s => s.id === selectedMarkingStandard)?.name} standard
              </p>
            )}
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

          {/* Show Summary Button for Marking Mode */}
          {viewMode === 'marking' && markingSummary && (
            <motion.button
              onClick={() => setMarkingSummary(markingSummary)}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-medium shadow-md hover:shadow-lg transition-all"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              View Summary
              <IconComponent icon={AiOutlineHistory} className="h-4 w-4 ml-2" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Split View: Document on Left, Content on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
        {/* Left Side - Document */}
        <div className="bg-slate-600/30 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg overflow-hidden">
          <div className="bg-slate-700/50 backdrop-blur-sm px-6 py-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-cyan-400">Document</h2>
          </div>
          <div className="h-full p-4">
            <div className="w-full h-full bg-slate-700/30 backdrop-blur-sm rounded-lg overflow-hidden border border-white/10">
              <img 
                src={documentPages[currentPage]} 
                alt={`Document page ${currentPage + 1}`}
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>

        {/* Right Side - Content (Mistakes or Marking) */}
        <div className="bg-slate-600/30 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg overflow-hidden flex flex-col">
          {viewMode === 'mistakes' ? (
            // Mistakes View
            <>
              <div className="bg-slate-700/50 backdrop-blur-sm px-6 py-4 border-b border-white/10 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-cyan-400">Mistakes Found</h2>
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
              
              <div className="flex-1 overflow-y-auto p-6">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <motion.div
                      className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full mb-4"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <p className="text-center">{processingStatus || 'Checking for mistakes...'}</p>
                  </div>
                ) : pageMistakes[currentPage] && pageMistakes[currentPage].mistakes.length > 0 ? (
                  <div className="space-y-4">
                    <div className="mb-4 p-3 bg-teal-500/10 backdrop-blur-sm rounded-lg border border-teal-500/20">
                      <h3 className="text-lg font-semibold text-teal-400">
                        Page {currentPage + 1} - {pageMistakes[currentPage].mistakes.length} mistake(s) found
                      </h3>
                    </div>
                    
                    {pageMistakes[currentPage].mistakes.map((mistake) => (
                      <motion.div
                        key={mistake.id}
                        className="bg-slate-700/30 backdrop-blur-sm rounded-lg p-4 border border-white/10"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: mistake.id * 0.1 }}
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
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <IconComponent icon={AiOutlineBulb} className="h-12 w-12 mb-3 opacity-50" />
                    <p className="text-center">Mistakes will appear here after processing your document.</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            // Marking View
            <>
              <div className="bg-slate-700/50 backdrop-blur-sm px-6 py-4 border-b border-white/10 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-cyan-400">Teacher Marking</h2>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-slate-400">
                      {MARKING_STANDARDS.find(s => s.id === selectedMarkingStandard)?.name}
                    </span>
                    {pageMarkings[currentPage] && (
                      <>
                        {pageMarkings[currentPage].isLoading && (
                          <div className="flex items-center text-cyan-400">
                            <motion.div
                              className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full mr-2"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                            <span className="text-sm">Marking...</span>
                          </div>
                        )}
                        {pageMarkings[currentPage].isComplete && !pageMarkings[currentPage].error && (
                          <span className="text-sm text-green-400 font-medium">✓ Complete</span>
                        )}
                        {pageMarkings[currentPage].error && (
                          <span className="text-sm text-red-400 font-medium">⚠ Error</span>
                        )}
                      </>
                    )}
                  </div>
                </div>
                
                {/* Progress indicator for marking */}
                {pageMarkings.length > 0 && (
                  <div className="mt-3">
                    <div className="flex items-center space-x-1">
                      {pageMarkings.map((pm, index) => (
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
                              ? 'Marking'
                              : 'Pending'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {pageMarkings.filter(pm => pm.isComplete && !pm.error).length} of {pageMarkings.length} pages marked
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                {isGeneratingMarking && pageMarkings.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <motion.div
                      className="w-16 h-16 border-4 border-green-500 border-t-transparent rounded-full mb-4"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <p className="text-center">Starting marking process...</p>
                  </div>
                ) : pageMarkings[currentPage] && pageMarkings[currentPage].questions.length > 0 ? (
                  <div className="space-y-6">
                    {/* Page Score Summary */}
                    <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm rounded-lg p-4 border border-green-500/20">
                      <h3 className="text-lg font-semibold text-green-400 mb-2">
                        Page {currentPage + 1} Score: {pageMarkings[currentPage].totalMarks}/{pageMarkings[currentPage].maxMarks}
                      </h3>
                      <div className="w-full bg-slate-600 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-1000"
                          style={{ 
                            width: `${pageMarkings[currentPage].maxMarks > 0 ? 
                              (pageMarkings[currentPage].totalMarks / pageMarkings[currentPage].maxMarks) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                      <p className="text-sm text-green-300 mt-2">
                        {pageMarkings[currentPage].maxMarks > 0 ? 
                          Math.round((pageMarkings[currentPage].totalMarks / pageMarkings[currentPage].maxMarks) * 100) : 0}%
                      </p>
                    </div>
                    
                    {/* Individual Questions */}
                    {pageMarkings[currentPage].questions.map((question, index) => (
                      <motion.div
                        key={index}
                        className="bg-slate-700/30 backdrop-blur-sm rounded-lg p-4 border border-white/10"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-lg font-semibold text-cyan-400">
                            Question {question.questionNumber}
                          </h4>
                          <div className="flex items-center space-x-2">
                            <span className="text-lg font-bold text-green-400">
                              {question.awardedMarks}/{question.maxMarks}
                            </span>
                            <div className="w-16 bg-slate-600 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                                style={{ 
                                  width: `${question.maxMarks > 0 ? (question.awardedMarks / question.maxMarks) * 100 : 0}%` 
                                }}
                              ></div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Criteria Breakdown */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-blue-500/10 rounded p-2 border border-blue-500/20">
                            <div className="text-xs text-blue-400 font-medium">Accuracy</div>
                            <div className="text-sm text-blue-300">
                              {question.criteria.accuracy}/{MARKING_STANDARDS.find(s => s.id === selectedMarkingStandard)?.criteria.accuracy}
                            </div>
                          </div>
                          <div className="bg-purple-500/10 rounded p-2 border border-purple-500/20">
                            <div className="text-xs text-purple-400 font-medium">Presentation</div>
                            <div className="text-sm text-purple-300">
                              {question.criteria.presentation}/{MARKING_STANDARDS.find(s => s.id === selectedMarkingStandard)?.criteria.presentation}
                            </div>
                          </div>
                          <div className="bg-orange-500/10 rounded p-2 border border-orange-500/20">
                            <div className="text-xs text-orange-400 font-medium">Methodology</div>
                            <div className="text-sm text-orange-300">
                              {question.criteria.methodology}/{MARKING_STANDARDS.find(s => s.id === selectedMarkingStandard)?.criteria.methodology}
                            </div>
                          </div>
                          <div className="bg-teal-500/10 rounded p-2 border border-teal-500/20">
                            <div className="text-xs text-teal-400 font-medium">Understanding</div>
                            <div className="text-sm text-teal-300">
                              {question.criteria.understanding}/{MARKING_STANDARDS.find(s => s.id === selectedMarkingStandard)?.criteria.understanding}
                            </div>
                          </div>
                        </div>
                        
                        {/* Feedback */}
                        {question.feedback && (
                          <div className="bg-slate-600/30 rounded p-3 border border-slate-500/30">
                            <h5 className="text-sm font-medium text-slate-300 mb-1">Teacher Feedback:</h5>
                            <p className="text-sm text-slate-400">{question.feedback}</p>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : pageMarkings[currentPage] && pageMarkings[currentPage].isComplete ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <div className="text-6xl mb-4">📝</div>
                    <h3 className="text-xl font-semibold text-yellow-400 mb-2">No Questions Found</h3>
                    <p className="text-center">No questions were detected on this page for marking.</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <IconComponent icon={AiOutlineFileText} className="h-12 w-12 mb-3 opacity-50" />
                    <p className="text-center">Click "Start Marking" to begin the marking process.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Marking Summary Modal */}
      <AnimatePresence>
        {markingSummary && viewMode === 'marking' && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMarkingSummary(null)}
          >
            <motion.div
              className="bg-slate-700/90 backdrop-blur-sm rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/10"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-cyan-400">Marking Summary</h2>
                <button
                  onClick={() => setMarkingSummary(null)}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <IconComponent icon={AiOutlineLeft} className="h-6 w-6" />
                </button>
              </div>
              
              {/* Overall Score */}
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg p-6 mb-6 border border-green-500/30">
                <div className="text-center">
                  <h3 className="text-3xl font-bold text-green-400 mb-2">
                    {markingSummary.totalScore}/{markingSummary.maxScore}
                  </h3>
                  <div className="text-xl font-semibold text-green-300 mb-2">
                    {Math.round(markingSummary.percentage)}% - Grade {markingSummary.grade}
                  </div>
                  <div className="w-full bg-slate-600 rounded-full h-4">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-4 rounded-full transition-all duration-1000"
                      style={{ width: `${markingSummary.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Strengths */}
                <div className="bg-green-500/10 rounded-lg p-4 border border-green-500/20">
                  <h4 className="text-lg font-semibold text-green-400 mb-3">Strengths</h4>
                  <ul className="space-y-2">
                    {markingSummary.strengths.map((strength, index) => (
                      <li key={index} className="text-green-300 flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Areas for Improvement */}
                <div className="bg-red-500/10 rounded-lg p-4 border border-red-500/20">
                  <h4 className="text-lg font-semibold text-red-400 mb-3">Areas for Improvement</h4>
                  <ul className="space-y-2">
                    {markingSummary.weaknesses.map((weakness, index) => (
                      <li key={index} className="text-red-300 flex items-center">
                        <span className="text-red-500 mr-2">!</span>
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {/* Recommendations */}
              <div className="mt-6 bg-blue-500/10 rounded-lg p-4 border border-blue-500/20">
                <h4 className="text-lg font-semibold text-blue-400 mb-3">Recommendations</h4>
                <ul className="space-y-2">
                  {markingSummary.recommendations.map((recommendation, index) => (
                    <li key={index} className="text-blue-300 flex items-center">
                      <span className="text-blue-500 mr-2">→</span>
                      {recommendation}
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Study Plan */}
              <div className="mt-6 bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
                <h4 className="text-lg font-semibold text-purple-400 mb-3">Personalized Study Plan</h4>
                <div className="space-y-3">
                  {markingSummary.studyPlan.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-600/30 rounded border border-slate-500/30">
                      <div>
                        <h5 className="font-medium text-slate-200">{item.topic}</h5>
                        <p className="text-sm text-slate-400">{item.description}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        item.priority === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        item.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        'bg-green-500/20 text-green-400 border border-green-500/30'
                      }`}>
                        {item.priority.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CheckMistakesComponent; 