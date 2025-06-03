import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AiOutlineUpload, AiOutlineCamera, AiOutlineFullscreen, AiOutlineBulb, AiOutlineFileText, AiOutlineLoading3Quarters } from 'react-icons/ai';
import { FiDownload, FiCopy, FiShare2 } from 'react-icons/fi';
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

const UploadHomeworkComponent: React.FC<UploadHomeworkComponentProps> = ({ className = '' }) => {
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState('');
  const [documentPages, setDocumentPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [fullScreenSolution, setFullScreenSolution] = useState(false);
  const [fullScreenDocument, setFullScreenDocument] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [extractedTexts, setExtractedTexts] = useState<string[]>([]);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      
      // Handle headers with proper hierarchy
      .replace(/^#{6}\s+(.*$)/gim, '<h6 class="text-sm font-medium text-gray-700 mt-4 mb-2">$1</h6>')
      .replace(/^#{5}\s+(.*$)/gim, '<h5 class="text-base font-medium text-gray-800 mt-4 mb-2">$1</h5>')
      .replace(/^#{4}\s+(.*$)/gim, '<h4 class="text-lg font-semibold text-gray-800 mt-4 mb-3">$1</h4>')
      .replace(/^#{3}\s+(.*$)/gim, '<h3 class="text-xl font-semibold text-teal-800 mt-6 mb-3">$1</h3>')
      .replace(/^#{2}\s+(.*$)/gim, '<h2 class="text-2xl font-bold text-teal-800 mt-6 mb-4">$1</h2>')
      .replace(/^#{1}\s+(.*$)/gim, '<h1 class="text-3xl font-bold text-teal-900 mt-8 mb-4">$1</h1>')
      
      // Handle bold and italic formatting
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em class="italic text-gray-800">$1</em>') // Italic
      .replace(/_(.*?)_/g, '<u class="underline">$1</u>') // Underline
      .replace(/==(.*?)==/g, '<mark class="bg-yellow-200 px-1 rounded">$1</mark>') // Highlight
      
      // Handle numbered lists (improved)
      .replace(/^(\d+)\.(\d+)\.(\d+)\s+(.*$)/gim, '<div class="ml-8 mb-2"><span class="font-medium text-teal-700">$1.$2.$3</span> $4</div>')
      .replace(/^(\d+)\.(\d+)\s+(.*$)/gim, '<div class="ml-4 mb-2"><span class="font-medium text-teal-600">$1.$2</span> $4</div>')
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

  // Clean up AI response formatting (same as ContentWriterComponent)
  const cleanAIResponse = (content: string) => {
    return content
      .replace(/^(I am [^.]*(AI|LLM|Assistant|GPT|language model)[^.]*\.)/i, '') // Remove AI self-identification
      .replace(/^(Here'?s?( is)?( a| an| your| the)?( \d+[-\s]word)? (solution|response|text|content|output|answer)[:.]\s*)/i, '') // Remove "Here's a solution:" type text
      .replace(/^(In response to your request|As requested|Based on your prompt)[^.]*/i, '') // Remove other common AI prefixes
      .replace(/^[\s\n]*/, '') // Remove leading whitespace
      .replace(/\n*$/g, '') // Remove trailing newlines
      .replace(/(Let me know if you|Hope this|If you need any|Do you want me to)[^]*$/i, '') // Remove trailing questions
      .trim();
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

  // Extract text from image using OCR API
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

      const apiResponse = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer 95fad12c-0768-4de2-a4c2-83247337ea89',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "doubao-vision-pro-32k-241028",
          messages: [
            {
              role: "system",
              content: "You are an OCR assistant. Extract all text from the image exactly as it appears, maintaining line breaks and formatting. Only return the extracted text, nothing else."
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Please extract all text from this image exactly as it appears, maintaining the original formatting and line breaks."
                },
                {
                  type: "image_url",
                  image_url: {
                    url: base64Image
                  }
                }
              ]
            }
          ],
          max_tokens: 4000,
          temperature: 0.1
        })
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}));
        console.error('OCR API Error:', errorData);
        throw new Error(`OCR API failed: ${apiResponse.status} ${apiResponse.statusText}`);
      }

      const data = await apiResponse.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('Unexpected API response structure:', data);
        return 'Error: Unable to extract text from image';
      }

      return data.choices[0].message.content || 'No text found in image';
    } catch (error) {
      console.error('OCR Error:', error);
      return `Error extracting text: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  };

  // Solve homework using the same chat API
  const solveHomework = async (text: string): Promise<string> => {
    try {
      const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer 95fad12c-0768-4de2-a4c2-83247337ea89',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "doubao-vision-pro-32k-241028",
          messages: [
            {
              role: "system",
              content: "You are an expert homework tutor. Provide detailed, step-by-step solutions to homework problems. Explain concepts clearly and show all working steps. Format your response in a clear, educational manner."
            },
            {
              role: "user",
              content: `Please solve this homework problem with detailed step-by-step explanations:

${text}

Please provide:
1. A clear understanding of what the problem is asking
2. Step-by-step solution with explanations
3. Final answer
4. Any relevant concepts or formulas used

Make sure to explain each step so the student can learn from the solution.`
            }
          ],
          max_tokens: 4000,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        console.error('Homework API Error:', response.status, response.statusText);
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const rawContent = data.choices?.[0]?.message?.content || 'Unable to generate solution. Please try again.';
      
      // Clean up the AI response
      return cleanAIResponse(rawContent);
    } catch (error) {
      console.error('Homework solving error:', error);
      return `Error solving homework: ${error instanceof Error ? error.message : 'Unknown error'}`;
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
      
      // Extract text from all pages
      const allTexts: string[] = [];
      
      setProcessingStatus('Extracting text from document...');
      
      for (let i = 0; i < imageUrls.length; i++) {
        setProcessingStatus(`Processing page ${i + 1} of ${imageUrls.length}...`);
        
        try {
          const extractedText = await extractTextFromImage(imageUrls[i]);
          allTexts.push(extractedText);
        } catch (pageError) {
          console.error(`Error processing page ${i + 1}:`, pageError);
          allTexts.push(`Error processing page ${i + 1}`);
        }
        
        // Add a small delay between API calls to avoid rate limiting
        if (i < imageUrls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      setExtractedTexts(allTexts);
      
      // Combine all extracted text for homework solving
      const combinedText = allTexts.filter(text => !text.startsWith('Error')).join('\n\n');
      
      if (combinedText.trim()) {
        setProcessingStatus('Solving homework problem...');
        const solution = await solveHomework(combinedText);
        setAnswer(solution);
      } else {
        setAnswer('No text could be extracted from the uploaded file. Please try uploading a clearer image or PDF.');
      }
      
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!file && !question) || loading) return;
    
    setLoading(true);
    setProcessingStatus('Solving homework problem...');
    
    try {
      if (question.trim()) {
        // Solve text-based question
        const solution = await solveHomework(question);
        setAnswer(solution);
      } else if (file) {
        // File is already processed in handleFileChange
        return;
      }
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
          <h2 className="text-2xl font-semibold text-teal-800 mb-6">Submit Your Homework</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-gray-700 mb-2 font-medium">
                Describe your homework problem
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none h-40"
                placeholder="Type your homework question or problem here..."
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 mb-2 font-medium">
                Or upload your assignment
              </label>
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-teal-500 cursor-pointer transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
                {file ? (
                  <div className="text-gray-700">
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

      {/* Document Preview Section (if file uploaded) */}
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
          </div>
          
          <div className={`relative ${
            fullScreenDocument ? 
              "fixed top-0 left-0 right-0 bottom-0 z-50 bg-gray-900 flex items-center justify-center p-4" : 
              "aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden max-w-2xl mx-auto"
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
          
          {/* Extracted Text Preview */}
          {extractedTexts.length > 0 && extractedTexts[currentPage] && (
            <div className="mt-4 bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Extracted Text (Page {currentPage + 1}):</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap max-h-32 overflow-y-auto">
                {extractedTexts[currentPage]}
              </p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default UploadHomeworkComponent; 