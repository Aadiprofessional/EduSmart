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
      
      // Process all pages in parallel
      console.log('🔄 Starting parallel processing of all pages');
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
              <h2 className="text-3xl font-bold text-cyan-400 mb-2">Check Mistakes</h2>
              <p className="text-slate-300">Upload your document to check for grammar, spelling, and punctuation mistakes</p>
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
                onClick={() => file && processFile(file)}
                disabled={!file || loading}
                className="flex items-center justify-center px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg text-white font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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
                    Check for Mistakes
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
            <h1 className="text-2xl font-bold text-cyan-400">Check Mistakes</h1>
            <p className="text-slate-300">{file.name}</p>
          </div>
        </div>
        
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
      </div>

      {/* Split View: Document on Left, Mistakes on Right */}
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

        {/* Right Side - Mistakes */}
        <div className="bg-slate-600/30 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg overflow-hidden flex flex-col">
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
        </div>
      </div>
    </div>
  );
};

export default CheckMistakesComponent; 