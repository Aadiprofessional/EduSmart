import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AiOutlineUpload, AiOutlineCamera, AiOutlineFullscreen, AiOutlineBulb, AiOutlineFileText, AiOutlineHistory } from 'react-icons/ai';
import { FiDownload, FiCopy, FiShare2, FiClock, FiTrash2 } from 'react-icons/fi';
import IconComponent from './IconComponent';
import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
import { Document, Paragraph, TextRun, Packer } from 'docx';
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

interface UploadHomeworkComponentProps {
  className?: string;
}

interface HomeworkHistoryItem {
  id: string;
  fileName: string;
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

const UploadHomeworkComponent: React.FC<UploadHomeworkComponentProps> = ({ className = '' }) => {
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

  // Response checking state
  const { checkAndUseResponse } = useResponseCheck();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');
  const { showSuccess } = useNotification();

  // Load history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('homeworkHistory');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        setHomeworkHistory(parsedHistory);
      } catch (error) {
        console.error('Error loading homework history:', error);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('homeworkHistory', JSON.stringify(homeworkHistory));
  }, [homeworkHistory]);

  // Function to add item to history - updated to include complete page solutions and state
  const addToHistory = (fileName: string, question: string, answer: string, fileType: string, documentPages?: string[], originalFile?: File, pageSolutions?: PageSolution[], currentPageIndex?: number, processingComplete?: boolean) => {
    const newItem: HomeworkHistoryItem = {
      id: Date.now().toString(),
      fileName,
      question,
      answer,
      timestamp: new Date(),
      fileType,
      documentPages,
      file: originalFile,
      pageSolutions,
      currentPage: currentPageIndex,
      overallProcessingComplete: processingComplete
    };
    setHomeworkHistory(prev => [newItem, ...prev.slice(0, 19)]); // Keep only last 20 items
  };

  // Function to load from history - updated to restore complete state including all page solutions
  const loadFromHistory = (item: HomeworkHistoryItem) => {
    console.log('🔄 Loading from history:', {
      fileName: item.fileName,
      hasDocumentPages: !!item.documentPages?.length,
      hasPageSolutions: !!item.pageSolutions?.length,
      currentPage: item.currentPage,
      overallComplete: item.overallProcessingComplete
    });
    
    setQuestion(item.question);
    setAnswer(item.answer);
    setShowHistory(false);
    
    // Restore document pages if available
    if (item.documentPages && item.documentPages.length > 0) {
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
    } else {
      console.log('📝 Loading text question from history');
      // Clear document-related state for text questions
      setDocumentPages([]);
      setPageSolutions([]);
      setShowGetAnswerButton(false);
      setOverallProcessingComplete(false);
    }
    
    // Clear file state since we're loading from history
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Clear any processing status
    setProcessingStatus('');
    setLoading(false);
    
    console.log('✅ History loaded successfully');
  };

  // Function to delete history item
  const deleteHistoryItem = (id: string) => {
    setHomeworkHistory(prev => prev.filter(item => item.id !== id));
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

  // Combined function to extract text and solve homework - works for both images and text
  const extractAndSolveHomework = async (imageUrl?: string, textQuestion?: string, pageNumber?: number): Promise<string> => {
    console.log(`🔄 Starting extractAndSolveHomework process for page ${pageNumber || 'text'}`);
    console.log('📸 Image URL received:', imageUrl ? 'Image URL present' : 'No image URL');
    console.log('📝 Text question received:', textQuestion ? `Text question: ${textQuestion.substring(0, 100)}...` : 'No text question');
    console.log('⏰ Process start time:', new Date().toISOString());
    
    try {
      console.log('📡 Preparing API request to Qwen VL Max');
      console.log('🔗 API Endpoint: https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions');
      console.log('🤖 Model: qwen-vl-max');
      
      // Build content array based on whether we have image or text
      const content: any[] = [];
      
      if (imageUrl) {
        content.push({
          type: "image_url",
          image_url: {
            url: imageUrl
          }
        });
      }
      
      if (textQuestion) {
        content.push({
          type: "text",
          text: `Please solve this homework problem with detailed step-by-step explanations:

${textQuestion}

Please provide:
1. A clear understanding of what the problem is asking
2. Step-by-step solution with explanations
3. Final answer
4. Any relevant concepts or formulas used

**Language Instructions**: 
- If the question is in English, respond in English
- If the question is in Chinese, respond in Chinese
- If the question is in another language, respond in that same language
- If no specific language is detected, default to English

Make sure to explain each step so the student can learn from the solution. Show your reasoning process and provide comprehensive explanations.

Format your response with:
- Use **bold** for important terms and concepts
- Use proper mathematical notation with LaTeX format for equations
- Structure your solution with clear headings and numbered steps
- Highlight final answers prominently
- Use bullet points for lists and key points`
        });
      } else {
        content.push({
          type: "text",
          text: `Please analyze this image and solve any homework problems you find. Follow these steps:

1. First, extract and read all text from the image
2. Identify the homework questions or problems
3. Provide detailed step-by-step solutions with explanations
4. Show your reasoning process and provide comprehensive explanations

**Language Instructions**: 
- If the questions in the image are in English, respond in English
- If the questions in the image are in Chinese, respond in Chinese
- If the questions are in another language, respond in that same language
- If no specific language is detected, default to English

Please provide:
- A clear understanding of what each problem is asking
- Step-by-step solution with explanations for each problem
- Final answers
- Any relevant concepts or formulas used

Make sure to explain each step so the student can learn from the solution and only give the solution to the homework problems.

Format your response with:
- Use **bold** for important terms and concepts
- Use proper mathematical notation with LaTeX format for equations
- Structure your solution with clear headings and numbered steps
- Highlight final answers prominently
- Use bullet points for lists and key points`
        });
      }
      
      const requestPayload = {
        model: "qwen-vl-max",
        messages: [
          {
            role: "system",
            content: [
              {
                type: "text", 
                text: "You are a helpful homework assistant. Analyze images containing homework problems or solve text-based homework problems and provide detailed step-by-step solutions with explanations. Always respond in the same language as the question - English for English questions, Chinese for Chinese questions, etc. Format your responses clearly with proper mathematical notation using LaTeX syntax when needed."
              }
            ]
          },
          {
            role: "user",
            content: content
          }
        ],
        stream: true
      };

      console.log('📤 Request payload prepared');
      console.log('📋 Payload details:', {
        model: requestPayload.model,
        messagesCount: requestPayload.messages.length,
        hasImage: content.some(c => c.type === 'image_url'),
        hasText: content.some(c => c.type === 'text'),
        contentItems: content.length,
        textPromptLength: content.find(c => c.type === 'text')?.text?.length || 0,
        streamEnabled: true,
        pageNumber: pageNumber || 'N/A'
      });

      const apiStartTime = Date.now();
      console.log(`🚀 Sending streaming API request for page ${pageNumber || 'text'} at:`, new Date(apiStartTime).toISOString());

      const response = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer sk-0d874843ff2542c38940adcbeb2b2cc4',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload)
      });

      const apiResponseTime = Date.now();
      const responseTimeMs = apiResponseTime - apiStartTime;
      console.log(`📥 Streaming API response received for page ${pageNumber || 'text'}`);
      console.log('⏱️ Initial response time:', responseTimeMs + 'ms');
      console.log('📊 Response status:', response.status, response.statusText);

      if (!response.ok) {
        console.error(`❌ API request failed for page ${pageNumber || 'text'}`);
        console.error('🔴 Status:', response.status);
        console.error('🔴 Status text:', response.statusText);
        
        let errorBody = '';
        try {
          errorBody = await response.text();
          console.error('🔴 Error response body:', errorBody);
        } catch (e) {
          console.error('🔴 Could not read error response body:', e);
        }
        
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      console.log(`✅ API request successful for page ${pageNumber || 'text'}, starting stream processing`);
      console.log('📖 Reading streaming response body...');

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
            console.log(`🏁 Streaming completed for page ${pageNumber || 'text'}`);
            break;
          }

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                console.log(`✅ Stream marked as DONE for page ${pageNumber || 'text'}`);
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                const content_chunk = parsed.choices?.[0]?.delta?.content;
                
                if (content_chunk) {
                  if (isFirstChunk) {
                    console.log(`📝 First content chunk received for page ${pageNumber || 'text'}, starting real-time display`);
                    isFirstChunk = false;
                  }
                  
                  fullContent += content_chunk;
                  
                  // Update page solution in real-time if pageNumber is provided
                  if (pageNumber !== undefined) {
                    setPageSolutions(prev => prev.map(ps => 
                      ps.pageNumber === pageNumber 
                        ? { ...ps, solution: fullContent, isLoading: true }
                        : ps
                    ));
                  } else {
                    // For text questions, update answer directly
                    setAnswer(fullContent);
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

      const totalProcessTime = Date.now() - apiStartTime;
      console.log(`📄 Full content received for page ${pageNumber || 'text'}`);
      console.log('📊 Final content length:', fullContent.length);
      console.log('📝 Content preview (first 200 chars):', fullContent.substring(0, 200) + '...');
      console.log('⏰ Total streaming time:', totalProcessTime + 'ms');
      console.log(`🎯 Streaming process completed successfully for page ${pageNumber || 'text'}`);

      return fullContent.trim() || 'No solution could be generated';

    } catch (error) {
      console.error(`💥 Error in extractAndSolveHomework for page ${pageNumber || 'text'}`);
      console.error('🔴 Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('🔴 Error message:', error instanceof Error ? error.message : String(error));
      console.error('🔴 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('⏰ Error occurred at:', new Date().toISOString());
      
      throw error;
    }
  };

  // Process uploaded file - now just loads the file and shows Get Answer button
  const processFile = async (file: File) => {
    console.log('🚀 Starting processFile - loading file for preview');
    console.log('📁 File details:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: new Date(file.lastModified).toISOString()
    });
    
    setLoading(true);
    setProcessingStatus('Loading file for preview...');
    setAnswer(''); // Clear previous answer
    setPageSolutions([]); // Clear previous page solutions
    setOverallProcessingComplete(false);
    
    const processStartTime = Date.now();
    console.log('⏰ File loading start time:', new Date(processStartTime).toISOString());
    
    try {
      let imageUrls: string[] = [];
      
      if (file.type === 'application/pdf') {
        console.log('📄 Processing PDF file');
        // Convert PDF to images
        imageUrls = await convertPdfToImages(file);
        console.log('✅ PDF converted to', imageUrls.length, 'images');
      } else if (file.type.startsWith('image/')) {
        console.log('🖼️ Processing image file');
        // Convert image file to data URL
        setProcessingStatus('Loading image...');
        
        const imageProcessStartTime = Date.now();
        console.log('⏰ Image conversion start time:', new Date(imageProcessStartTime).toISOString());
        
        const imageDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            console.log('✅ Image converted to data URL');
            console.log('📊 Data URL length:', result.length);
            console.log('📊 Data URL preview:', result.substring(0, 100) + '...');
            resolve(result);
          };
          reader.onerror = (error) => {
            console.error('❌ Error converting image to data URL:', error);
            reject(error);
          };
          reader.readAsDataURL(file);
        });
        
        const imageProcessTime = Date.now() - imageProcessStartTime;
        console.log('⏱️ Image conversion time:', imageProcessTime + 'ms');
        
        imageUrls = [imageDataUrl];
      } else {
        console.error('❌ Unsupported file type:', file.type);
        throw new Error('Unsupported file type. Please upload a PDF or image file.');
      }
      
      console.log('📸 Total images loaded:', imageUrls.length);
      setDocumentPages(imageUrls);
      setCurrentPage(0);
      
      // Show the Get Answer button instead of auto-processing
      setShowGetAnswerButton(true);
      setProcessingStatus('File loaded successfully! You can now add additional questions or click "Get Answer" to solve.');
      
      const totalProcessTime = Date.now() - processStartTime;
      console.log('✅ File loading completed');
      console.log('⏱️ Total file loading time:', totalProcessTime + 'ms');
      
    } catch (error) {
      const totalProcessTime = Date.now() - processStartTime;
      console.error('💥 File loading error after', totalProcessTime + 'ms');
      console.error('🔴 Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('🔴 Error message:', error instanceof Error ? error.message : String(error));
      console.error('🔴 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      setProcessingStatus('Error loading file');
      setAnswer(`Failed to load file: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setShowGetAnswerButton(false);
    } finally {
      setLoading(false);
      setTimeout(() => setProcessingStatus(''), 3000);
      console.log('🏁 processFile function completed');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      processFile(selectedFile);
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

  // New function to handle getting the answer (combines document + text question)
  const handleGetAnswer = async () => {
    // Prevent multiple clicks
    if (loading || isProcessingStarted) return;
    
    console.log('🚀 Starting handleGetAnswer');
    console.log('📝 Question:', question);
    console.log('📄 Document pages:', documentPages.length);

    // Check responses before proceeding
    const responseResult = await checkAndUseResponse({
      responseType: 'homework_solution',
      queryData: { 
        hasDocument: documentPages.length > 0, 
        pageCount: documentPages.length,
        questionLength: question.length 
      },
      responsesUsed: 1
    });

    if (!responseResult.canProceed) {
      setUpgradeMessage(responseResult.message || 'Unable to process request');
      setShowUpgradeModal(true);
      return;
    }
    
    // Mark processing as started to prevent double clicks
    setIsProcessingStarted(true);
    setLoading(true);
    setProcessingStatus('Analyzing and solving...');
    setAnswer(''); // Clear previous answer
    setPageSolutions([]); // Clear previous page solutions
    setOverallProcessingComplete(false);
    setShowGetAnswerButton(false); // Hide the button while processing
    
    try {
      if (documentPages.length > 0) {
        // Process document with optional additional question
        console.log('🔄 Processing document with', documentPages.length, 'pages');
        
        // Initialize page solutions for all pages
        const initialPageSolutions: PageSolution[] = documentPages.map((_, index) => ({
          pageNumber: index + 1,
          solution: '',
          isLoading: true,
          isComplete: false
        }));
        setPageSolutions(initialPageSolutions);
        
        setProcessingStatus(`Processing all ${documentPages.length} pages in parallel...`);
        setLoading(false); // Set loading to false so user can navigate pages
        
        // Process all pages in parallel
        console.log('🔄 Starting parallel processing of all pages');
        const processingPromises = documentPages.map(async (imageUrl, index) => {
          const pageNumber = index + 1;
          console.log(`🚀 Starting processing for page ${pageNumber}`);
          
          try {
            // Combine image with additional text question if provided
            const combinedQuestion = question.trim() ? question : undefined;
            const solution = await extractAndSolveHomework(imageUrl, combinedQuestion, pageNumber);
            
            // Mark page as complete
            setPageSolutions(prev => prev.map(ps => 
              ps.pageNumber === pageNumber 
                ? { ...ps, solution, isLoading: false, isComplete: true }
                : ps
            ));
            
            console.log(`✅ Page ${pageNumber} processing completed successfully`);
            return { pageNumber, solution, success: true };
          } catch (error) {
            console.error(`❌ Error processing page ${pageNumber}:`, error);
            
            // Mark page as error
            setPageSolutions(prev => prev.map(ps => 
              ps.pageNumber === pageNumber 
                ? { 
                    ...ps, 
                    solution: `Error processing page ${pageNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    isLoading: false, 
                    isComplete: true,
                    error: error instanceof Error ? error.message : 'Unknown error'
                  }
                : ps
            ));
            
            return { pageNumber, error: error instanceof Error ? error.message : 'Unknown error', success: false };
          }
        });
        
        // Wait for all pages to complete
        console.log('⏳ Waiting for all pages to complete processing...');
        const results = await Promise.allSettled(processingPromises);
        
        console.log('✅ All pages processing completed');
        
        // Get the final page solutions state after all processing
        const finalPageSolutions = await new Promise<PageSolution[]>((resolve) => {
          // Use a small timeout to ensure state is updated
          setTimeout(() => {
            setPageSolutions(currentSolutions => {
              resolve(currentSolutions);
              return currentSolutions;
            });
          }, 100);
        });
        
        // Create combined solution for history using final solutions
        const completedSolutions = finalPageSolutions.filter(ps => ps.isComplete && !ps.error);
        let combinedSolution = '';
        if (completedSolutions.length > 0) {
          if (documentPages.length > 1) {
            combinedSolution = completedSolutions.map(ps => 
              `--- Page ${ps.pageNumber} ---\n\n${ps.solution}`
            ).join('\n\n');
          } else {
            combinedSolution = completedSolutions[0]?.solution || '';
          }
        }
        
        // Add to history with final page solutions and complete state
        if (combinedSolution && file) {
          addToHistory(file.name, question || 'Document Analysis', combinedSolution, file.type, documentPages, file, finalPageSolutions, currentPage, true);
          console.log('💾 Added to history with complete page solutions');
        }
        
        setOverallProcessingComplete(true);
        setProcessingStatus('All pages processed successfully!');
        
      } else if (question.trim()) {
        // Process text question only
        console.log('🔄 Processing text question only');
        const solution = await extractAndSolveHomework(undefined, question);
        setAnswer(solution);
        
        // Add to history
        addToHistory('Text Question', question, solution, 'text', undefined, undefined, undefined, undefined, undefined);
        console.log('✅ Text question processed successfully');
      } else {
        throw new Error('Please provide a question or upload a document');
      }
      
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
        model: "qwen-vl-max",
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

      const response = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer sk-0d874843ff2542c38940adcbeb2b2cc4',
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
        model: "qwen-vl-max",
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

      const response = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer sk-0d874843ff2542c38940adcbeb2b2cc4',
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
    
    // If we have a document uploaded, use handleGetAnswer instead
    if (documentPages.length > 0) {
      handleGetAnswer();
      return;
    }
    
    // Only handle pure text questions here
    if (!question.trim() || loading || isProcessingStarted) return;
    
    console.log('🚀 Starting text question submission');
    console.log('📝 Question:', question);

    // Check responses before proceeding
    const responseResult = await checkAndUseResponse({
      responseType: 'homework_solution',
      queryData: { 
        hasDocument: false, 
        questionLength: question.length 
      },
      responsesUsed: 1
    });

    if (!responseResult.canProceed) {
      setUpgradeMessage(responseResult.message || 'Unable to process request');
      setShowUpgradeModal(true);
      return;
    }
    
    // Mark processing as started
    setIsProcessingStarted(true);
    setLoading(true);
    setProcessingStatus('Solving homework problem...');
    setAnswer(''); // Clear previous answer
    setPageSolutions([]); // Clear page solutions for text questions
    
    try {
      // Use the same API function for text questions
      const solution = await extractAndSolveHomework(undefined, question);
      setAnswer(solution);
      
      // Add to history
      addToHistory('Text Question', question, solution, 'text', undefined, undefined, undefined, undefined, undefined);
      console.log('✅ Text question processed successfully');
    } catch (error) {
      console.error('💥 Text submission error:', error);
      setAnswer(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsProcessingStarted(false); // Reset on error
    } finally {
      setLoading(false);
      setProcessingStatus('');
    }
  };

  return (
    <div className={className}>
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
          <h2 className="text-2xl font-semibold text-cyan-400 mb-6">Submit Your Question</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-slate-300 mb-2 font-medium">
                Describe your question or problem
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full p-4 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none h-40 text-slate-200 placeholder-slate-400"
                placeholder="Type your question or problem here..."
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-slate-300 mb-2 font-medium">
                Or upload your question
              </label>
              <div 
                className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-cyan-500/50 cursor-pointer transition-colors relative bg-slate-600/30 backdrop-blur-sm"
                onClick={() => !file && fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {file ? (
                  <div className="text-slate-300 relative">
                    <motion.button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile();
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </motion.button>
                    <IconComponent icon={AiOutlineFileText} className="h-8 w-8 mx-auto mb-2 text-cyan-400" />
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div className="text-slate-400">
                    <IconComponent icon={AiOutlineUpload} className="h-8 w-8 mx-auto mb-2" />
                    <p>Drag and drop your file here, or click to browse</p>
                    <p className="text-sm mt-1">Supports PDF, Word, and images</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between flex-wrap gap-2">
              <motion.button
                type="button"
                className="flex items-center justify-center px-4 py-2 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg text-slate-300 font-medium hover:bg-slate-500/50"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => setShowHistory(!showHistory)}
              >
                <IconComponent icon={AiOutlineHistory} className="h-5 w-5 mr-2" />
                History ({homeworkHistory.length})
              </motion.button>
              
              <motion.button
                type="button"
                className="flex items-center justify-center px-4 py-2 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg text-slate-300 font-medium hover:bg-slate-500/50"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => fileInputRef.current?.click()}
              >
                <IconComponent icon={AiOutlineCamera} className="h-5 w-5 mr-2" />
                Take Photo
              </motion.button>
              
              {/* Get Answer Button - shows when file is uploaded or question is typed */}
              {showGetAnswerButton || (question.trim() && !documentPages.length) ? (
                <motion.button
                  type="button"
                  className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg text-white font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  variants={buttonVariants}
                  whileHover={!loading && !isProcessingStarted ? "hover" : {}}
                  whileTap={!loading && !isProcessingStarted ? "tap" : {}}
                  onClick={handleGetAnswer}
                  disabled={loading || isProcessingStarted}
                >
                  {loading ? 'Processing...' : 'Get Answer'}
                  <IconComponent icon={AiOutlineBulb} className="h-5 w-5 ml-2" />
                </motion.button>
              ) : (
                <motion.button
                  type="submit"
                  className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg text-white font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  variants={buttonVariants}
                  whileHover={!loading && !isProcessingStarted ? "hover" : {}}
                  whileTap={!loading && !isProcessingStarted ? "tap" : {}}
                  disabled={loading || isProcessingStarted || (!question.trim() && documentPages.length === 0)}
                >
                  {loading ? 'Processing...' : 'Get Solution'}
                  <IconComponent icon={AiOutlineBulb} className="h-5 w-5 ml-2" />
                </motion.button>
              )}
            </div>
          </form>
        </motion.div>
        
        {/* Results Section */}
        <motion.div variants={itemVariants}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-cyan-400">Solution</h2>
            <div className="flex items-center space-x-3">
              {/* Related Knowledge Button - appears after answer is complete */}
              {((answer && !loading) || (pageSolutions.length > 0 && pageSolutions.some(ps => ps.isComplete && !ps.error))) && (
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={handleRelatedKnowledge}
                  disabled={loadingKnowledge}
                  className="flex items-center px-4 py-2 bg-purple-600/50 backdrop-blur-sm border border-purple-500/30 rounded-lg text-purple-200 font-medium hover:bg-purple-500/50 transition-colors"
                >
                  <IconComponent icon={AiOutlineBulb} className="h-4 w-4 mr-2" />
                  {loadingKnowledge ? 'Loading...' : 'Related Knowledge'}
                </motion.button>
              )}
              
              {(answer || pageSolutions.length > 0) && (
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => setFullScreenSolution(!fullScreenSolution)}
                  className="flex items-center text-cyan-400 font-medium hover:text-cyan-300"
                >
                  <IconComponent 
                    icon={AiOutlineFullscreen} 
                    className="h-5 w-5 mr-1" 
                  />
                  {fullScreenSolution ? "Exit Fullscreen" : "Fullscreen"}
                </motion.button>
              )}
            </div>
          </div>
          
          <motion.div
            className={`bg-slate-600/30 backdrop-blur-sm border border-white/10 rounded-xl p-6 overflow-y-auto transition-all duration-300 ${
              fullScreenSolution ? 
                "fixed top-0 left-0 right-0 bottom-0 z-50 rounded-none bg-slate-900" : 
                "h-[450px]"
            }`}
            variants={itemVariants}
            animate={(answer || pageSolutions.length > 0) ? { boxShadow: "0 4px 20px rgba(6, 182, 212, 0.1)" } : {}}
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
                    Exit Fullscreen
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
                    <div className="flex-1 overflow-y-auto">
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
                                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    />
                                    <span className="text-sm">Processing...</span>
                                  </div>
                                )}
                                {pageSolutions[currentPage]?.isComplete && !pageSolutions[currentPage]?.error && (
                                  <span className="text-sm text-emerald-400 font-medium">✓ Complete</span>
                                )}
                                {pageSolutions[currentPage]?.error && (
                                  <span className="text-sm text-red-400 font-medium">⚠ Error</span>
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
                                        ? 'Complete'
                                        : ps.error
                                        ? 'Error'
                                        : ps.isLoading
                                        ? 'Processing'
                                        : 'Pending'
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
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                />
                                <span className="text-slate-300">Generating solution for this page...</span>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <IconComponent icon={AiOutlineBulb} className="h-12 w-12 mb-3 opacity-50" />
                                <p className="text-center">Your solution will appear here after submitting your homework problem.</p>
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
                          <p className="text-center">Your solution will appear here after submitting your homework problem.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : loading ? (
              // Loading state
              <div className="flex flex-col items-center justify-center h-full text-slate-300">
                <motion.div
                  className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full mb-4"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
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
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          <span className="text-sm">Processing...</span>
                        </div>
                      )}
                      {pageSolutions[currentPage]?.isComplete && !pageSolutions[currentPage]?.error && (
                        <span className="text-sm text-emerald-400 font-medium">✓ Complete</span>
                      )}
                      {pageSolutions[currentPage]?.error && (
                        <span className="text-sm text-red-400 font-medium">⚠ Error</span>
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
                              ? 'Complete'
                              : ps.error
                              ? 'Error'
                              : ps.isLoading
                              ? 'Processing'
                              : 'Pending'
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
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      <span className="text-slate-300">Generating solution for this page...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                      <IconComponent icon={AiOutlineBulb} className="h-12 w-12 mb-3 opacity-50" />
                      <p className="text-center">Your solution will appear here after submitting your homework problem.</p>
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
                <p className="text-center">Your solution will appear here after submitting your homework problem.</p>
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
          <motion.div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowHistory(false)}
          >
            <motion.div 
              className="bg-slate-800/90 backdrop-blur-sm border border-white/10 rounded-xl p-6 max-w-4xl w-full max-h-[80vh] overflow-hidden shadow-2xl"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold text-cyan-400 flex items-center">
                  <IconComponent icon={AiOutlineHistory} className="h-7 w-7 mr-3" />
                  Homework History
                  <span className="ml-3 text-sm bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full">
                    {homeworkHistory.length} item{homeworkHistory.length !== 1 ? 's' : ''}
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
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-cyan-500/20 rounded-lg">
                              <IconComponent 
                                icon={item.fileType === 'text' ? AiOutlineFileText : AiOutlineUpload} 
                                className="h-5 w-5 text-cyan-400" 
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-200 truncate">
                                {item.fileName}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                {/* Show page count for documents */}
                                {item.documentPages && item.documentPages.length > 0 && (
                                  <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded-full font-medium">
                                    {item.documentPages.length} page{item.documentPages.length > 1 ? 's' : ''}
                                  </span>
                                )}
                                {/* Show completion status for page solutions */}
                                {item.pageSolutions && item.pageSolutions.length > 0 && (
                                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-medium">
                                    {item.pageSolutions.filter(ps => ps.isComplete && !ps.error).length}/{item.pageSolutions.length} solved
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
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteHistoryItem(item.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-400 transition-all rounded-lg hover:bg-red-500/10"
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
                          <p className="text-xs text-slate-400 line-clamp-2">
                            <span className="font-medium text-green-400">A:</span> {item.answer.length > 150 ? `${item.answer.substring(0, 150)}...` : item.answer}
                          </p>
                        </div>
                        
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-600/50">
                          <div className="flex items-center space-x-2">
                            {/* Show indicators for different types of saved content */}
                            {item.overallProcessingComplete && (
                              <span className="text-xs text-emerald-400 font-medium bg-emerald-500/10 px-2 py-1 rounded-full" title="Complete processing">
                                ✓ Complete
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
                            Click to restore
                            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </motion.div>
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
                      <p className="text-xl font-medium mb-2">No homework history yet</p>
                      <p className="text-sm">Your solved homework problems will appear here</p>
                      <p className="text-xs mt-2 text-slate-500">Upload documents or ask questions to get started</p>
                    </motion.div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Related Knowledge Modal */}
      <AnimatePresence>
        {showRelatedKnowledge && (
          <motion.div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowRelatedKnowledge(false)}
          >
            <motion.div 
              className="bg-slate-800/90 backdrop-blur-sm border border-white/10 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-purple-400 flex items-center">
                  <IconComponent icon={AiOutlineBulb} className="h-6 w-6 mr-2" />
                  Related Knowledge
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
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                  <span className="text-slate-300">Loading knowledge points...</span>
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
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
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
            </motion.div>
          </motion.div>
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