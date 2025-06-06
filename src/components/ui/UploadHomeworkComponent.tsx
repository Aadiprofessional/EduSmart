import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AiOutlineUpload, AiOutlineCamera, AiOutlineFullscreen, AiOutlineBulb, AiOutlineFileText, AiOutlineLoading3Quarters, AiOutlineHistory } from 'react-icons/ai';
import { FiDownload, FiCopy, FiShare2, FiClock, FiTrash2 } from 'react-icons/fi';
import IconComponent from './IconComponent';
import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
import { Document, Paragraph, TextRun, Packer } from 'docx';

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
  const [extractedTexts, setExtractedTexts] = useState<string[]>([]);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [homeworkHistory, setHomeworkHistory] = useState<HomeworkHistoryItem[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Function to add item to history
  const addToHistory = (fileName: string, question: string, answer: string, fileType: string) => {
    const newItem: HomeworkHistoryItem = {
      id: Date.now().toString(),
      fileName,
      question,
      answer,
      timestamp: new Date(),
      fileType
    };
    setHomeworkHistory(prev => [newItem, ...prev.slice(0, 19)]); // Keep only last 20 items
  };

  // Function to load from history
  const loadFromHistory = (item: HomeworkHistoryItem) => {
    setQuestion(item.question);
    setAnswer(item.answer);
    setShowHistory(false);
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

  // Add custom CSS for mathematical expressions
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .math-inline {
        font-family: 'Times New Roman', serif;
        font-style: italic;
        background-color: #f0f9ff;
        padding: 2px 4px;
        border-radius: 3px;
        border: 1px solid #e0f2fe;
        margin: 0 2px;
        display: inline-block;
      }
      
      .math-block {
        font-family: 'Times New Roman', serif;
        font-style: italic;
        background-color: #f8fafc;
        padding: 12px 16px;
        border-radius: 8px;
        border-left: 4px solid #0891b2;
        margin: 12px 0;
        text-align: center;
        font-size: 1.1em;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .solution-content {
        line-height: 1.8;
        font-size: 16px;
      }
      
      .solution-content h1, .solution-content h2, .solution-content h3, .solution-content h4 {
        margin-top: 1.5rem;
        margin-bottom: 0.75rem;
      }
      
      .solution-content .math-inline {
        font-size: 1.05em;
      }
      
      .solution-content .math-block {
        font-size: 1.15em;
        line-height: 1.6;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Function to convert content text to HTML with proper formatting (enhanced for math content)
  const contentToHTML = (text: string) => {
    return text
      // Handle LaTeX math expressions first
      .replace(/\\\((.*?)\\\)/g, '<span class="math-inline">$1</span>') // Inline math \( \)
      .replace(/\\\[(.*?)\\\]/g, '<div class="math-block">$1</div>') // Block math \[ \]
      .replace(/\$\$(.*?)\$\$/g, '<div class="math-block">$1</div>') // Block math $$ $$
      .replace(/\$(.*?)\$/g, '<span class="math-inline">$1</span>') // Inline math $ $
      
      // Handle bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-teal-800">$1</strong>')
      
      // Handle italic text
      .replace(/\*(.*?)\*/g, '<em class="italic text-teal-700">$1</em>')
      
      // Handle underlined text
      .replace(/_(.*?)_/g, '<u class="underline text-teal-700">$1</u>')
      
      // Handle highlighted text
      .replace(/==(.*?)==/g, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>')
      
      // Handle headers
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold text-teal-800 mt-6 mb-3">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-teal-800 mt-8 mb-4">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-teal-800 mt-10 mb-5">$1</h1>')
      
      // Handle numbered lists
      .replace(/^(\d+)\.\s+(.*$)/gim, '<div class="mb-3"><span class="font-semibold text-teal-800">$1.</span> $2</div>')
      
      // Handle bullet points
      .replace(/^[-•]\s+(.*$)/gim, '<div class="ml-4 mb-2 flex items-start"><span class="text-teal-600 mr-2">•</span><span>$1</span></div>')
      
      // Handle question formatting
      .replace(/^(Question\s+\d+(?:\.\d+)*)/gim, '<h3 class="text-xl font-bold text-teal-800 mt-8 mb-4 border-b-2 border-teal-200 pb-2">$1</h3>')
      
      // Handle final answers section
      .replace(/^(Final answers?:)/gim, '<h4 class="text-lg font-semibold text-green-800 mt-6 mb-3 bg-green-50 p-3 rounded-lg border-l-4 border-green-500">$1</h4>')
      
      // Handle concepts section
      .replace(/^(Concepts? and formulas? used:)/gim, '<h4 class="text-lg font-semibold text-blue-800 mt-6 mb-3 bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">$1</h4>')
      
      // Handle step indicators
      .replace(/^(Step \d+:)/gim, '<div class="font-semibold text-teal-700 mt-4 mb-2 bg-teal-50 p-2 rounded">$1</div>')
      
      // Handle solution indicators
      .replace(/^(Solution:)/gim, '<div class="font-semibold text-orange-700 mt-4 mb-2 bg-orange-50 p-2 rounded border-l-4 border-orange-500">$1</div>')
      
      // Convert line breaks to proper spacing
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>')
      
      // Add proper spacing for mathematical expressions
      .replace(/(<\/span>|<\/div>)(<span class="math|<div class="math)/g, '$1 $2')
      .replace(/(<span class="math-inline">.*?<\/span>)/g, ' $1 ');
  };

  // Clean AI response function
  const cleanAIResponse = (content: string) => {
    // Remove any AI formatting markers, separator lines, etc.
    return content
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/_(.*?)_/g, '$1') // Remove underline
      .replace(/==(.*?)==/g, '$1') // Remove highlight
      .replace(/\n- (.*)/g, '• $1') // Convert unordered lists
      .replace(/\n\d+\. (.*)/g, '$1') // Convert ordered lists
      .replace(/#{1,6} (.*)/g, '$1') // Remove headers
      .replace(/---/g, '') // Remove separators
      .replace(/\n/g, '\n'); // Keep newlines
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
      alert('Content copied to clipboard!');
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

  // Combined function to extract text and solve homework with streaming
  const extractAndSolveHomework = async (imageUrl: string): Promise<string> => {
    try {
      const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer sk-80beadf6603b4832981d0d65896b1ae0',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "qvq-max",
          messages: [
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
                  text: `Please analyze this image and solve any homework problems you find. Follow these steps:

1. First, extract and read all text from the image
2. Identify the homework questions or problems
3. Provide detailed step-by-step solutions with explanations
4. Show your reasoning process and provide comprehensive explanations

Please provide:
- A clear understanding of what each problem is asking
- Step-by-step solution with explanations for each problem
- Final answers
- Any relevant concepts or formulas used

Make sure to explain each step so the student can learn from the solution.`
                }
              ]
            }
          ],
          stream: true
        })
      });

      if (!response.ok) {
        console.error('QVQ Combined API Error:', response.status, response.statusText);
        throw new Error(`API request failed: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      let solutionContent = '';
      let isAnswering = false;

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
                const content = parsed.choices?.[0]?.delta?.content;
                
                if (content) {
                  solutionContent += content;
                  isAnswering = true;
                  
                  // Update the answer in real-time for streaming effect
                  setAnswer(solutionContent);
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

      return solutionContent.trim() || 'No solution could be generated';
    } catch (error) {
      console.error('Combined API Error:', error);
      return `Error processing image and solving homework: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  };

  // Solve homework using QVQ model with streaming (for text questions)
  const solveHomework = async (text: string): Promise<string> => {
    try {
      const response = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer sk-80beadf6603b4832981d0d65896b1ae0',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "qvq-max",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Please solve this homework problem with detailed step-by-step explanations:

${text}

Please provide:
1. A clear understanding of what the problem is asking
2. Step-by-step solution with explanations
3. Final answer
4. Any relevant concepts or formulas used

Make sure to explain each step so the student can learn from the solution. Show your reasoning process and provide comprehensive explanations.`
                }
              ]
            }
          ],
          stream: true
        })
      });

      if (!response.ok) {
        console.error('QVQ Homework API Error:', response.status, response.statusText);
        throw new Error(`API request failed: ${response.status}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      let solutionContent = '';
      let isAnswering = false;

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
                const content = parsed.choices?.[0]?.delta?.content;
                
                if (content) {
                  solutionContent += content;
                  isAnswering = true;
                  
                  // Update the answer in real-time for streaming effect
                  setAnswer(solutionContent);
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

      const rawContent = solutionContent.trim() || 'Unable to generate solution. Please try again.';
      
      // Clean up the AI response
      return cleanAIResponse(rawContent);
    } catch (error) {
      console.error('QVQ Homework solving error:', error);
      return `Error solving homework: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  };

  // Process uploaded file with combined extraction and solving
  const processFile = async (file: File) => {
    setLoading(true);
    setProcessingStatus('Starting file processing...');
    setAnswer(''); // Clear previous answer
    
    try {
      let imageUrls: string[] = [];
      
      if (file.type === 'application/pdf') {
        // Convert PDF to images
        imageUrls = await convertPdfToImages(file);
      } else if (file.type.startsWith('image/')) {
        // Convert image file to data URL
        setProcessingStatus('Processing image...');
        const imageDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        imageUrls = [imageDataUrl];
      } else {
        throw new Error('Unsupported file type. Please upload a PDF or image file.');
      }
      
      setDocumentPages(imageUrls);
      setCurrentPage(0);
      
      setProcessingStatus('Analyzing and solving homework problems...');
      
      // Process all pages and combine solutions
      let combinedSolution = '';
      
      for (let i = 0; i < imageUrls.length; i++) {
        setProcessingStatus(`Processing page ${i + 1} of ${imageUrls.length}...`);
        
        try {
          const solution = await extractAndSolveHomework(imageUrls[i]);
          if (imageUrls.length > 1) {
            combinedSolution += `\n\n--- Page ${i + 1} ---\n\n${solution}`;
          } else {
            combinedSolution = solution;
          }
        } catch (pageError) {
          console.error(`Error processing page ${i + 1}:`, pageError);
          combinedSolution += `\n\nError processing page ${i + 1}: ${pageError instanceof Error ? pageError.message : 'Unknown error'}`;
        }
        
        // Add a small delay between API calls to avoid rate limiting
        if (i < imageUrls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      setAnswer(combinedSolution);
      
      // Add to history
      addToHistory(file.name, 'Image/PDF Analysis', combinedSolution, file.type);
      
      setProcessingStatus('Processing completed!');
      
    } catch (error) {
      console.error('File processing error:', error);
      setProcessingStatus('Error processing file');
      setAnswer(`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
      setTimeout(() => setProcessingStatus(''), 3000);
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
    setExtractedTexts([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loading) return;
    
    setLoading(true);
    setProcessingStatus('Solving homework problem...');
    setAnswer(''); // Clear previous answer
    
    try {
      // Use the streaming solve function for text questions
      const solution = await solveHomework(question);
      setAnswer(solution);
      
      // Add to history
      addToHistory('Text Question', question, solution, 'text');
    } catch (error) {
      console.error('Submit error:', error);
      setAnswer(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          <h2 className="text-2xl font-semibold text-teal-800 mb-6">Submit Your Question</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-gray-700 mb-2 font-medium">
                Describe your question or problem
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none h-40"
                placeholder="Type your question or problem here..."
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 mb-2 font-medium">
                Or upload your question
              </label>
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-teal-500 cursor-pointer transition-colors relative"
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
                  <div className="text-gray-700 relative">
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
                    <IconComponent icon={AiOutlineFileText} className="h-8 w-8 mx-auto mb-2 text-teal-600" />
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div className="text-gray-500">
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
                className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
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
                className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => fileInputRef.current?.click()}
              >
                <IconComponent icon={AiOutlineCamera} className="h-5 w-5 mr-2" />
                Take Photo
              </motion.button>
              
              <motion.button
                type="submit"
                className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-teal-600 to-teal-700 rounded-lg text-white font-medium shadow-md hover:shadow-lg"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Get Solution'}
                <IconComponent icon={AiOutlineBulb} className="h-5 w-5 ml-2" />
              </motion.button>
            </div>
          </form>
        </motion.div>
        
        {/* Results Section */}
        <motion.div variants={itemVariants}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-teal-800">Solution</h2>
            {answer && (
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => setFullScreenSolution(!fullScreenSolution)}
                className="flex items-center text-teal-600 font-medium"
              >
                <IconComponent 
                  icon={AiOutlineFullscreen} 
                  className="h-5 w-5 mr-1" 
                />
                {fullScreenSolution ? "Exit Fullscreen" : "Fullscreen"}
              </motion.button>
            )}
          </div>
          
          <motion.div
            className={`bg-gray-50 rounded-xl p-6 overflow-y-auto transition-all duration-300 ${
              fullScreenSolution ? 
                "fixed top-0 left-0 right-0 bottom-0 z-50 rounded-none" : 
                "h-[450px]"
            }`}
            variants={itemVariants}
            animate={answer ? { boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)" } : {}}
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <motion.div
                  className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full mb-4"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <p className="text-center">{processingStatus || 'Analyzing your homework...'}</p>
              </div>
            ) : answer ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                {fullScreenSolution && (
                  <div className="sticky top-2 right-2 flex justify-end mb-4">
                    <motion.button
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      onClick={() => setFullScreenSolution(false)}
                      className="bg-white text-gray-700 p-2 rounded-full shadow-md"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </motion.button>
                  </div>
                )}
                <div 
                  className="solution-content prose prose-teal max-w-none"
                  dangerouslySetInnerHTML={{ __html: contentToHTML(answer) }}
                />
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <IconComponent icon={AiOutlineBulb} className="h-12 w-12 mb-3 opacity-50" />
                <p className="text-center">Your solution will appear here after submitting your homework problem.</p>
              </div>
            )}
          </motion.div>

          {/* Action Buttons */}
          {answer && (
            <div className="mt-4 flex flex-wrap gap-3">
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={handleCopyContent}
                className="flex items-center text-sm px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
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
                        onClick={() => handleDownloadContent('pdf')}
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
                        onClick={() => handleDownloadContent('doc')}
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
                        onClick={() => handleDownloadContent('txt')}
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
                onClick={handleShareContent}
                className="flex items-center text-sm px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
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
          className="mt-8 bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-teal-800">Uploaded Document</h3>
            <div className="flex items-center space-x-4">
              <div className="flex space-x-2">
                <button 
                  className="px-3 py-1 bg-gray-200 rounded-md disabled:opacity-50"
                  disabled={currentPage === 0}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  Previous
                </button>
                <button 
                  className="px-3 py-1 bg-gray-200 rounded-md disabled:opacity-50"
                  disabled={currentPage === documentPages.length - 1}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  Next
                </button>
              </div>
              <div className="text-gray-600">
                Page {currentPage + 1} of {documentPages.length}
              </div>
            </div>
          </div>
          
          {/* Always show fullscreen image */}
          <div className="w-full h-[600px] bg-gray-100 rounded-lg overflow-hidden">
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
            className="mt-8 bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-teal-800">Homework History</h3>
              <div className="flex items-center space-x-2">
                {homeworkHistory.length > 0 && (
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={clearAllHistory}
                    className="px-3 py-1 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
                  >
                    Clear All
                  </motion.button>
                )}
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-sm text-gray-400 hover:text-gray-600"
                >
                  Hide
                </button>
              </div>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {homeworkHistory.length > 0 ? (
                homeworkHistory.map((item) => (
                  <motion.div
                    key={item.id}
                    className="p-4 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors group"
                    onClick={() => loadFromHistory(item)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <IconComponent 
                            icon={item.fileType === 'text' ? AiOutlineFileText : AiOutlineUpload} 
                            className="h-4 w-4 text-teal-600" 
                          />
                          <p className="text-sm font-medium text-gray-700 truncate">
                            {item.fileName}
                          </p>
                          <span className="text-xs text-gray-400">
                            <IconComponent icon={FiClock} className="h-3 w-3 inline mr-1" />
                            {formatRelativeTime(item.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate mb-2">
                          {item.question.length > 100 ? `${item.question.substring(0, 100)}...` : item.question}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          Solution: {item.answer.length > 80 ? `${item.answer.substring(0, 80)}...` : item.answer}
                        </p>
                      </div>
                      
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteHistoryItem(item.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <IconComponent icon={FiTrash2} className="h-4 w-4" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <IconComponent icon={AiOutlineHistory} className="mx-auto text-4xl mb-2" />
                  <p>No homework history yet</p>
                  <p className="text-sm mt-1">Your solved homework will appear here</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UploadHomeworkComponent; 