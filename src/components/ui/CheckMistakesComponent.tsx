import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { AiOutlineUpload, AiOutlineCamera, AiOutlineFullscreen, AiOutlineSearch, AiOutlineLoading3Quarters } from 'react-icons/ai';
import IconComponent from './IconComponent';
import * as pdfjsLib from 'pdfjs-dist';

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
  line: string;
  correction: string;
  type: string;
  lineNumber?: number;
}

interface CheckMistakesComponentProps {
  className?: string;
}

const CheckMistakesComponent: React.FC<CheckMistakesComponentProps> = ({ className = '' }) => {
  const [documentPages, setDocumentPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [loading, setLoading] = useState(false);
  const [fullScreenDocument, setFullScreenDocument] = useState(false);
  const [extractedTexts, setExtractedTexts] = useState<string[]>([]);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convert file to base64 for direct API usage
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Extract just the base64 part without the data URL prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
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

  // Extract text from image using QVQ model with streaming
  const extractTextFromImage = async (imageUrl: string): Promise<string> => {
    try {
      // Ensure we have the correct format for the API
      let base64Image = imageUrl;
      
      // If it's a data URL, extract the base64 part
      if (imageUrl.startsWith('data:')) {
        base64Image = imageUrl;
      } else {
        // If it's a blob URL, convert it to base64
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
        const reader = new FileReader();
        base64Image = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      }

      const apiResponse = await fetch('https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
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
                    url: base64Image
                  }
                },
                {
                  type: "text",
                  text: "Please extract all text from this image exactly as it appears, maintaining line breaks and formatting. Focus on accuracy and completeness. If there are any visual elements or formatting that affects the text meaning, please describe them."
                }
              ]
            }
          ],
          stream: true
        })
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}));
        console.error('QVQ API Error:', errorData);
        throw new Error(`QVQ API failed: ${apiResponse.status} ${apiResponse.statusText}`);
      }

      // Handle streaming response
      const reader = apiResponse.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      let extractedContent = '';
      let isAnswering = false;
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n').filter(line => line.trim() !== '');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta) {
                  const delta = parsed.choices[0].delta;
                  
                  // Skip reasoning content, only collect the final answer
                  if (delta.reasoning_content) {
                    // This is the thinking process, we can skip it for OCR
                    continue;
                  } else if (delta.content) {
                    // This is the actual answer content
                    if (!isAnswering && delta.content.trim() !== '') {
                      isAnswering = true;
                    }
                    if (isAnswering) {
                      extractedContent += delta.content;
                    }
                  }
                }
              } catch (parseError) {
                // Skip invalid JSON chunks
                continue;
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      return extractedContent.trim() || 'No text found in image';
    } catch (error) {
      console.error('QVQ OCR Error:', error);
      return `Error extracting text: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  };

  // Check for mistakes using QVQ model with streaming
  const checkMistakes = async (text: string, pageNumber: number): Promise<Mistake[]> => {
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
                  text: `Please analyze the following text for grammar mistakes, spelling errors, and other writing issues. 

IMPORTANT: Format your response ONLY as XML with the following structure:
<mistakes>
  <mistake>
    <original>the incorrect text</original>
    <corrected>the corrected text</corrected>
    <type>Grammar|Spelling|Punctuation|Style</type>
    <line>line number</line>
  </mistake>
</mistakes>

If no mistakes are found, respond with:
<mistakes>
  <message>No mistakes found in the text.</message>
</mistakes>

Text to analyze (Page ${pageNumber}):
${text}

Please identify specific mistakes and provide corrections. Focus on:
1. Grammar errors
2. Spelling mistakes  
3. Punctuation issues
4. Word usage errors

Use your reasoning capabilities to thoroughly analyze the text and provide accurate corrections. Respond ONLY with the XML format above, no additional text.`
                }
              ]
            }
          ],
          stream: true
        })
      });

      if (!response.ok) {
        console.error('QVQ Grammar API Error:', response.status, response.statusText);
        return [];
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      let analysisContent = '';
      let isAnswering = false;
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n').filter(line => line.trim() !== '');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta) {
                  const delta = parsed.choices[0].delta;
                  
                  // Skip reasoning content, only collect the final answer
                  if (delta.reasoning_content) {
                    // This is the thinking process - we could optionally use this for better analysis
                    continue;
                  } else if (delta.content) {
                    // This is the actual analysis content
                    if (!isAnswering && delta.content.trim() !== '') {
                      isAnswering = true;
                    }
                    if (isAnswering) {
                      analysisContent += delta.content;
                    }
                  }
                }
              } catch (parseError) {
                // Skip invalid JSON chunks
                continue;
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      const analysisText = analysisContent.trim();
      console.log(`QVQ Analysis Response for page ${pageNumber}:`, analysisText);
      
      // Parse XML response
      const mistakes: Mistake[] = [];
      
      try {
        // Simple XML parsing for mistakes
        const mistakeMatches = analysisText.match(/<mistake>[\s\S]*?<\/mistake>/g);
        
        if (mistakeMatches) {
          mistakeMatches.forEach((mistakeXml: string, index: number) => {
            const originalMatch = mistakeXml.match(/<original>([\s\S]*?)<\/original>/);
            const correctedMatch = mistakeXml.match(/<corrected>([\s\S]*?)<\/corrected>/);
            const typeMatch = mistakeXml.match(/<type>([\s\S]*?)<\/type>/);
            const lineMatch = mistakeXml.match(/<line>([\s\S]*?)<\/line>/);
            
            if (originalMatch && correctedMatch && typeMatch) {
              mistakes.push({
                id: Date.now() + index + pageNumber * 1000,
                line: originalMatch[1].trim(),
                correction: correctedMatch[1].trim(),
                type: typeMatch[1].trim(),
                lineNumber: lineMatch ? parseInt(lineMatch[1].trim()) : index + 1
              });
            }
          });
        } else {
          // Check if it's a "no mistakes" message
          const messageMatch = analysisText.match(/<message>([\s\S]*?)<\/message>/);
          if (messageMatch) {
            mistakes.push({
              id: Date.now() + pageNumber * 1000,
              line: `Page ${pageNumber} analysis completed`,
              correction: messageMatch[1].trim(),
              type: 'Info',
              lineNumber: 1
            });
          } else {
            // Fallback: try to extract any useful information from the response
            const lines = text.split('\n');
            let foundMistakes = false;
            
            // Enhanced pattern matching for common mistakes
            lines.forEach((line, index) => {
              const lineNumber = index + 1;
              
              // Common spelling mistakes
              const spellingPatterns = [
                { wrong: /\brecieve\b/gi, correct: 'receive' },
                { wrong: /\balot\b/gi, correct: 'a lot' },
                { wrong: /\bdefinately\b/gi, correct: 'definitely' },
                { wrong: /\boccured\b/gi, correct: 'occurred' },
                { wrong: /\bseperate\b/gi, correct: 'separate' },
                { wrong: /\bneccessary\b/gi, correct: 'necessary' },
                { wrong: /\baccommodate\b/gi, correct: 'accommodate' },
                { wrong: /\bexistance\b/gi, correct: 'existence' },
                { wrong: /\bmaintainance\b/gi, correct: 'maintenance' },
                { wrong: /\bprivelege\b/gi, correct: 'privilege' }
              ];
              
              spellingPatterns.forEach(pattern => {
                if (pattern.wrong.test(line)) {
                  mistakes.push({
                    id: Date.now() + Math.random() + pageNumber * 1000,
                    line: line.trim(),
                    correction: line.replace(pattern.wrong, pattern.correct),
                    type: 'Spelling',
                    lineNumber: lineNumber
                  });
                  foundMistakes = true;
                }
              });
              
              // Grammar patterns
              const grammarPatterns = [
                { wrong: /\bthere going\b/gi, correct: "they're going", type: 'Grammar' },
                { wrong: /\byour going\b/gi, correct: "you're going", type: 'Grammar' },
                { wrong: /\bits going\b/gi, correct: "it's going", type: 'Grammar' },
                { wrong: /\bwho's\b/gi, correct: 'whose', type: 'Grammar' },
                { wrong: /\bshould of\b/gi, correct: 'should have', type: 'Grammar' },
                { wrong: /\bcould of\b/gi, correct: 'could have', type: 'Grammar' },
                { wrong: /\bwould of\b/gi, correct: 'would have', type: 'Grammar' }
              ];
              
              grammarPatterns.forEach(pattern => {
                if (pattern.wrong.test(line)) {
                  mistakes.push({
                    id: Date.now() + Math.random() + pageNumber * 1000,
                    line: line.trim(),
                    correction: line.replace(pattern.wrong, pattern.correct),
                    type: pattern.type,
                    lineNumber: lineNumber
                  });
                  foundMistakes = true;
                }
              });
            });
            
            // If no mistakes found with patterns, add a general message
            if (!foundMistakes) {
              mistakes.push({
                id: Date.now() + pageNumber * 1000,
                line: `Page ${pageNumber} analysis completed`,
                correction: 'No obvious spelling or grammar mistakes detected. The text appears to be well-written.',
                type: 'Info',
                lineNumber: 1
              });
            }
          }
        }
      } catch (parseError) {
        console.error('XML parsing error:', parseError);
        mistakes.push({
          id: Date.now() + pageNumber * 1000,
          line: `Page ${pageNumber} parsing error`,
          correction: 'Unable to parse AI response. Please try again.',
          type: 'Error',
          lineNumber: 1
        });
      }

      return mistakes;
    } catch (error) {
      console.error('QVQ Grammar check error:', error);
      return [{
        id: Date.now() + pageNumber * 1000,
        line: `Page ${pageNumber} API Error`,
        correction: `Error checking grammar: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'Error',
        lineNumber: 1
      }];
    }
  };

  // Process uploaded file
  const processFile = async (file: File) => {
    setLoading(true);
    setProcessingStatus('Starting file processing...');
    
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
      
      // Extract text from all pages and check for mistakes
      const allTexts: string[] = [];
      const allMistakes: Mistake[] = [];
      
      setProcessingStatus('Extracting text and analyzing mistakes...');
      
      for (let i = 0; i < imageUrls.length; i++) {
        setProcessingStatus(`Processing page ${i + 1} of ${imageUrls.length}...`);
        
        try {
          const extractedText = await extractTextFromImage(imageUrls[i]);
          allTexts.push(extractedText);
          
          if (extractedText && !extractedText.startsWith('Error')) {
            const pageMistakes = await checkMistakes(extractedText, i + 1);
            allMistakes.push(...pageMistakes);
          } else {
            // Add error info to mistakes if text extraction failed
            allMistakes.push({
              id: Date.now() + i * 1000,
              line: `Page ${i + 1} processing error`,
              correction: extractedText.startsWith('Error') ? extractedText : 'Failed to extract text from this page',
              type: 'Error',
              lineNumber: 1
            });
          }
        } catch (pageError) {
          console.error(`Error processing page ${i + 1}:`, pageError);
          allTexts.push(`Error processing page ${i + 1}`);
          allMistakes.push({
            id: Date.now() + i * 1000,
            line: `Page ${i + 1} processing error`,
            correction: `Failed to process page: ${pageError instanceof Error ? pageError.message : 'Unknown error'}`,
            type: 'Error',
            lineNumber: 1
          });
        }
        
        // Add a small delay between API calls to avoid rate limiting
        if (i < imageUrls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      setExtractedTexts(allTexts);
      setMistakes(allMistakes);
      setProcessingStatus('Processing completed!');
      
    } catch (error) {
      console.error('File processing error:', error);
      setProcessingStatus('Error processing file');
      setMistakes([{
        id: Date.now(),
        line: 'Error processing file',
        correction: `Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'Error',
        lineNumber: 1
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => setProcessingStatus(''), 3000);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
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
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
      />
      
      {documentPages.length > 0 ? (
        <div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-4">
            <div className="lg:col-span-2">
              <div className="flex justify-between items-center mb-4">
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
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => setFullScreenDocument(!fullScreenDocument)}
                  className="flex items-center text-teal-600"
                >
                  <IconComponent icon={AiOutlineFullscreen} className="h-5 w-5 mr-1" />
                  <span className="hidden sm:inline">Fullscreen</span>
                </motion.button>
              </div>
              
              <div className={`relative ${
                fullScreenDocument ? 
                  "fixed top-0 left-0 right-0 bottom-0 z-50 bg-gray-900 flex items-center justify-center p-4" : 
                  "aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden"
              }`}>
                {fullScreenDocument && (
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => setFullScreenDocument(false)}
                    className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-md z-10"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                )}
                <img 
                  src={documentPages[currentPage]} 
                  alt={`Document page ${currentPage + 1}`}
                  className={`${fullScreenDocument ? 'max-h-full max-w-full object-contain' : 'w-full h-full object-cover'}`}
                />
                
                {loading && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg p-4 flex items-center">
                      <IconComponent icon={AiOutlineLoading3Quarters} className="h-6 w-6 animate-spin mr-2 text-teal-600" />
                      <span>{processingStatus}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm h-full">
                <h3 className="text-lg font-medium text-teal-800 mb-4 flex items-center">
                  <IconComponent icon={AiOutlineSearch} className="mr-2" /> 
                  Identified Mistakes
                </h3>
                
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <IconComponent icon={AiOutlineLoading3Quarters} className="h-12 w-12 mb-3 animate-spin text-teal-600" />
                    <p className="text-center">{processingStatus}</p>
                  </div>
                ) : mistakes.length > 0 ? (
                  <div className="space-y-4 overflow-y-auto" style={{ maxHeight: "500px" }}>
                    {mistakes.map((mistake) => (
                      <motion.div
                        key={mistake.id}
                        variants={itemVariants}
                        className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow"
                        whileHover={{ y: -2 }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            mistake.type === 'Grammar' ? 'bg-red-100 text-red-800' :
                            mistake.type === 'Spelling' ? 'bg-orange-100 text-orange-800' :
                            mistake.type === 'Error' ? 'bg-red-100 text-red-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {mistake.type}
                          </span>
                          {mistake.lineNumber && (
                            <span className="text-xs text-gray-500">Line {mistake.lineNumber}</span>
                          )}
                        </div>
                        <div className="mt-2">
                          <p className="text-sm line-through text-gray-500">{mistake.line}</p>
                          <p className="text-sm font-medium text-green-700 mt-1">{mistake.correction}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <IconComponent icon={AiOutlineSearch} className="h-12 w-12 mb-3 opacity-50" />
                    <p className="text-center">No mistakes found on this page.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg mt-6">
            <h3 className="text-lg font-medium text-teal-800 mb-3">Upload Document to Check</h3>
            <div className="flex flex-wrap gap-4">
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                className="flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg"
                onClick={() => fileInputRef.current?.click()}
              >
                <IconComponent icon={AiOutlineUpload} className="mr-2" />
                Upload New Document
              </motion.button>
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg"
                onClick={() => fileInputRef.current?.click()}
              >
                <IconComponent icon={AiOutlineCamera} className="mr-2" />
                Take Photo
              </motion.button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <div className="bg-gray-100 rounded-full p-6 mb-4">
            <IconComponent icon={AiOutlineUpload} className="h-12 w-12 opacity-70" />
          </div>
          <h3 className="text-xl font-medium text-gray-700 mb-2">No Documents Uploaded</h3>
          <p className="text-gray-500 mb-6 text-center max-w-md">
            Upload a document or take a photo to check for mistakes, grammar issues, and suggestions.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              className="flex items-center px-6 py-3 bg-teal-600 text-white rounded-lg shadow-md"
              onClick={() => fileInputRef.current?.click()}
            >
              <IconComponent icon={AiOutlineUpload} className="mr-2" />
              Upload Document
            </motion.button>
            <motion.button
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              className="flex items-center px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg"
              onClick={() => fileInputRef.current?.click()}
            >
              <IconComponent icon={AiOutlineCamera} className="mr-2" />
              Take Photo
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckMistakesComponent; 