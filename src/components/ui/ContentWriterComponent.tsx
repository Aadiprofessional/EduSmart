import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import { Document, Paragraph, TextRun, Packer } from 'docx';
import { FiEdit, FiDownload, FiShare2, FiSave, FiSettings, FiRotateCw, FiRefreshCw, FiCopy, FiTrash, FiBook, FiFileText, FiMail, FiClipboard, FiX, FiPlus, FiMinus } from 'react-icons/fi';
import { AiOutlineFontSize, AiOutlineHighlight, AiOutlineAlignLeft, AiOutlineAlignCenter, AiOutlineAlignRight, AiOutlineBold, AiOutlineItalic, AiOutlineUnderline, AiOutlineOrderedList, AiOutlineUnorderedList, AiOutlineLink, AiOutlineRobot, AiOutlineBulb, AiOutlineHistory, AiOutlineLoading3Quarters, AiOutlinePlus, AiOutlineMinus } from 'react-icons/ai';
import { BsQuote } from 'react-icons/bs';
import IconComponent from './IconComponent';
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

const ContentWriterComponent: React.FC = () => {
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
        <code className={`${className} bg-slate-700/50 px-2 py-1 rounded text-sm font-mono text-cyan-300`} {...props}>
          {children}
        </code>
      );
    },
    h1: ({ children }: any) => <h1 className="text-2xl font-bold text-cyan-400 mt-6 mb-4 border-b-2 border-cyan-500/30 pb-2">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-xl font-bold text-cyan-400 mt-5 mb-3 border-b border-cyan-500/20 pb-1">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-lg font-bold text-blue-400 mt-4 mb-2 bg-blue-500/10 px-3 py-2 rounded border border-blue-500/20">{children}</h3>,
    h4: ({ children }: any) => <h4 className="text-base font-semibold text-slate-300 mt-3 mb-2">{children}</h4>,
    p: ({ children }: any) => <p className="text-slate-300 mb-4 leading-relaxed">{children}</p>,
    ul: ({ children }: any) => <ul className="list-disc list-inside mb-4 text-slate-300 space-y-1">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal list-inside mb-4 text-slate-300 space-y-1">{children}</ol>,
    li: ({ children }: any) => <li className="mb-1 pl-2">{children}</li>,
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-cyan-500 pl-4 my-4 bg-cyan-500/10 py-3 rounded-r italic text-slate-300 backdrop-blur-sm">
        {children}
      </blockquote>
    ),
    strong: ({ children }: any) => <strong className="font-bold text-slate-200 bg-yellow-500/20 px-1 rounded">{children}</strong>,
    em: ({ children }: any) => <em className="italic text-slate-300">{children}</em>,
    table: ({ children }: any) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border border-slate-600 rounded-lg overflow-hidden bg-slate-700/30 backdrop-blur-sm">{children}</table>
      </div>
    ),
    thead: ({ children }: any) => <thead className="bg-slate-600/50">{children}</thead>,
    tbody: ({ children }: any) => <tbody>{children}</tbody>,
    tr: ({ children }: any) => <tr className="border-b border-slate-600 hover:bg-slate-600/30">{children}</tr>,
    th: ({ children }: any) => <th className="px-4 py-2 text-left font-semibold text-cyan-400">{children}</th>,
    td: ({ children }: any) => <td className="px-4 py-2 text-slate-300">{children}</td>,
    a: ({ children, href }: any) => (
      <a href={href} className="text-cyan-400 hover:text-cyan-300 underline font-medium" target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
  };

  const [prompt, setPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState('college-app');
  const [editedContent, setEditedContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [showAskAIButton, setShowAskAIButton] = useState(false);
  const [selectionData, setSelectionData] = useState<{text: string, start: number, end: number} | null>(null);
  const [showAskAIModal, setShowAskAIModal] = useState(false);
  const [askAIInstruction, setAskAIInstruction] = useState('');
  const [askAISuggestion, setAskAISuggestion] = useState('');
  const [isProcessingSelection, setIsProcessingSelection] = useState(false);
  const askAIButtonRef = useRef<HTMLDivElement>(null);
  
  // Add missing state variables for content generation
  const [contentType, setContentType] = useState('essay');
  const [wordCount, setWordCount] = useState(500);
  const [tone, setTone] = useState('academic');
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<'analyzing' | 'generating' | 'finalizing'>('analyzing');
  
  const [contentHistory, setContentHistory] = useState<{ 
    title: string, 
    date: string, 
    content: string,
    template: string,
    prompt: string 
  }[]>([
    { 
      title: "College Application Essay", 
      date: "3 days ago", 
      content: "As I reflect on my journey through high school...",
      template: "college-app",
      prompt: "Write a compelling college application essay about my passion for computer science"
    },
    { 
      title: "Research Paper Outline", 
      date: "1 week ago", 
      content: "The impact of technology on modern education...",
      template: "research-paper",
      prompt: "Generate an outline for a research paper on the impact of artificial intelligence in education"
    },
  ]);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [showAIEditModal, setShowAIEditModal] = useState(false);
  const [editInstructions, setEditInstructions] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editProgress, setEditProgress] = useState(0);
  const [highlightedSections, setHighlightedSections] = useState<{start: number, end: number, original: string, updated: string}[]>([]);
  const [editStep, setEditStep] = useState<'analyzing' | 'searching' | 'updating' | 'completed'>('analyzing');
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageHeight = 650; // Approximate height of a standard A4 page with given font size
  const linesPerPage = Math.floor(pageHeight / (fontSize * 1.5)); // Estimate lines per page based on font size
  const itemsPerPage = linesPerPage;
  
  // Response checking state
  const { checkAndUseResponse } = useResponseCheck();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');
  const { showSuccess } = useNotification();
  
  // Calculate total pages based on content length
  const calculateTotalPages = () => {
    const contentLines = editedContent.split('\n').length;
    return Math.max(1, Math.ceil(contentLines / linesPerPage));
  };
  
  const totalPages = calculateTotalPages();

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const buttonVariants = {
    hover: { scale: 1.05, boxShadow: "0px 3px 10px rgba(0, 0, 0, 0.2)" },
    tap: { scale: 0.98 }
  };

  const templates = [
    { id: 'college-app', name: 'College Application Essay', icon: FiBook },
    { id: 'cover-letter', name: 'Cover Letter', icon: FiFileText },
    { id: 'recommendation', name: 'Recommendation Letter', icon: FiMail },
    { id: 'research-paper', name: 'Research Paper', icon: FiClipboard },
    { id: 'scholarship', name: 'Scholarship Application', icon: FiClipboard },
    { id: 'personal-statement', name: 'Personal Statement', icon: FiFileText },
  ];

  // Interface for parsed result
  interface AnalysisResult {
    sections: string[];
    updates: string[];
    explanation?: string;
  }

  // Add delay between API calls to avoid rate limits
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Helper function to make API calls with streaming and retry logic
  const makeAPICall = async (
    prompt: string, 
    retries = 3, 
    onChunk?: (chunk: string) => void
  ): Promise<string> => {
    console.log('🔄 Starting Content Writer API request');
    console.log('📝 Prompt:', prompt.substring(0, 200) + '...');
    
    for (let i = 0; i < retries; i++) {
      try {
        // Add delay between retries
        if (i > 0) {
          await delay(2000 * i); // Exponential backoff
        }

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
                    text: "You are a professional academic writing assistant. Generate high-quality, well-structured content based on user prompts. Focus on clarity, coherence, and academic standards. Use proper markdown formatting for better readability."
                  }
                ]
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: `Please help me create well-written content based on this request:

${prompt}

Please provide:
1. Well-structured and organized content
2. Clear and engaging writing style
3. Proper grammar and formatting
4. Relevant examples and details where appropriate

Format your response with:
- Use **bold** for important terms and concepts
- Use proper headings and subheadings for structure
- Use bullet points for lists and key points
- Provide comprehensive, high-quality content
- Make it engaging and informative

Create professional, academic-quality content that meets the request requirements.`
                  }
                ]
              }
            ],
            stream: true
          })
        });

        console.log('📊 API Response status:', response.status);

        if (!response.ok) {
          console.error('❌ API request failed:', response.status, response.statusText);
          throw new Error(`API call failed: ${response.status} ${response.statusText}`);
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
              console.log('🏁 Streaming completed');
              break;
            }
            
            const chunk = new TextDecoder().decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  console.log('✅ Stream marked as DONE');
                  continue;
                }
                
                try {
                  const parsed = JSON.parse(data);
                  const content_chunk = parsed.choices?.[0]?.delta?.content;
                  
                  if (content_chunk) {
                    if (isFirstChunk) {
                      console.log('📝 First content chunk received');
                      isFirstChunk = false;
                    }
                    
                    fullContent += content_chunk;
                    
                    // Call the chunk callback if provided for real-time updates
                    if (onChunk) {
                      onChunk(content_chunk);
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

        console.log('✅ Content Writer API request completed successfully');
        console.log('📊 Final content length:', fullContent.length);
        
        return fullContent.trim() || 'I apologize, but I could not generate content. Please try again.';
      } catch (error) {
        console.error(`💥 Error in makeAPICall attempt ${i + 1}:`, error);
        
        if (i === retries - 1) {
          throw new Error(`Failed to generate content after ${retries} attempts. Please try again.`);
        }
      }
    }
    
    return '';
  };

  // Generate content with streaming
  const generateContent = async () => {
    if (!prompt.trim()) return;
    
    // Check responses before generating content
    const responseResult = await checkAndUseResponse({
      responseType: 'content_generation',
      responsesUsed: 1
    });
    if (!responseResult.canProceed) {
      setShowUpgradeModal(true);
      setUpgradeMessage(responseResult.message || 'Please upgrade to continue');
      return;
    }
    
    setIsGenerating(true);
    setProgress(0);
    setCurrentStep('analyzing');
    setGeneratedContent(''); // Clear previous content
    setEditedContent(''); // Clear edited content too
    
    try {
      const fullPrompt = `Generate ${contentType} content about: ${prompt}
      
      ${contentType === 'essay' ? 'Please write a well-structured essay with introduction, body paragraphs, and conclusion.' : ''}
      ${contentType === 'article' ? 'Please write an informative article with clear headings and sections.' : ''}
      ${contentType === 'blog' ? 'Please write an engaging blog post with a catchy introduction and conclusion.' : ''}
      ${contentType === 'report' ? 'Please write a professional report with executive summary and detailed analysis.' : ''}
      ${contentType === 'summary' ? 'Please write a concise summary highlighting the key points.' : ''}
      ${contentType === 'outline' ? 'Please create a detailed outline with main points and sub-points.' : ''}
      
      Target length: ${wordCount} words
      Tone: ${tone}
      
      Please provide high-quality, original content that is well-researched and properly structured.`;

      setCurrentStep('generating');
      setProgress(25);

      let fullContent = '';
      
      // Use streaming API call with real-time updates
      await makeAPICall(fullPrompt, 3, (chunk: string) => {
        fullContent += chunk;
        
        // Update content in real-time for streaming effect
        setGeneratedContent(fullContent);
        setEditedContent(fullContent);
        
        // Update progress based on content length
        const estimatedProgress = Math.min(25 + (fullContent.length / (wordCount * 6)) * 65, 90);
        setProgress(estimatedProgress);
      });

      setCurrentStep('finalizing');
      setProgress(95);
      
      // Clean up the AI response to remove unwanted text
      let cleanedContent = fullContent
        .replace(/^(I am [^.]*(AI|LLM|Assistant|GPT|language model)[^.]*\.)/i, '') // Remove AI self-identification
        .replace(/^(Here'?s?( is)?( a| an| your| the)?( \d+[-\s]word)? (essay|response|text|content|output)[:.]\s*)/i, '') // Remove "Here's an essay:" type text
        .replace(/^(In response to your request|As requested|Based on your prompt)[^.]*/i, '') // Remove other common AI prefixes
        .replace(/^[\s\n]*/, '') // Remove leading whitespace
        .replace(/\n*$/g, '') // Remove trailing newlines
        .replace(/(Let me know if you|Hope this|If you need any|Do you want me to)[^]*$/i, '') // Remove trailing questions
        .replace(/#{1,6}\s*/g, '') // Remove markdown headers
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown but keep text
        .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown but keep text
        .replace(/_(.*?)_/g, '$1') // Remove underline markdown but keep text
        .replace(/==(.*?)==/g, '$1') // Remove highlight markdown but keep text
        .trim();
        
      // Extract title if it exists 
      let title = '';
      const titleMatch = cleanedContent.match(/^(?:Title:?\s*)(.*?)(?:\n|$)/i);
      if (titleMatch && titleMatch[1]) {
        title = titleMatch[1].trim();
      }
        
      // Add title back if it was removed
      if (title && !cleanedContent.includes(title)) {
        cleanedContent = `Title: ${title}\n\n${cleanedContent}`;
      }
        
      // Final update with cleaned content
      setGeneratedContent(cleanedContent);
      setEditedContent(cleanedContent);
      
      // Add to history with template and prompt information
      const newHistoryItem = {
        title: title || getHistoryTitle(prompt),
        date: 'Just now',
        content: cleanedContent,
        template: activeTemplate,
        prompt: prompt
      };
      setContentHistory([newHistoryItem, ...contentHistory]);
      
      setProgress(100);
      
      // Small delay to show completion
      setTimeout(() => {
        setIsGenerating(false);
        setProgress(0);
        setCurrentStep('analyzing');
      }, 500);
      
    } catch (error) {
      console.error('Error generating content:', error);
      setGeneratedContent('Error generating content. Please try again.');
      setEditedContent('Error generating content. Please try again.');
      setIsGenerating(false);
      setProgress(0);
      setCurrentStep('analyzing');
    }
  };

  const handleGenerateContent = async () => {
    if (!prompt.trim()) return;
    
    // Check responses before generating content
    const responseResult = await checkAndUseResponse({
      responseType: 'content_generation',
      responsesUsed: 1
    });
    if (!responseResult.canProceed) {
      setShowUpgradeModal(true);
      setUpgradeMessage(responseResult.message || 'Please upgrade to continue');
      return;
    }
    
    setIsGenerating(true);
    setProgress(0);
    setCurrentStep('analyzing');
    setGeneratedContent(''); // Clear previous content
    setEditedContent(''); // Clear edited content too
    
    try {
      const fullPrompt = `Generate ${contentType} content about: ${prompt}
      
      ${contentType === 'essay' ? 'Please write a well-structured essay with introduction, body paragraphs, and conclusion.' : ''}
      ${contentType === 'article' ? 'Please write an informative article with clear headings and sections.' : ''}
      ${contentType === 'blog' ? 'Please write an engaging blog post with a catchy introduction and conclusion.' : ''}
      ${contentType === 'report' ? 'Please write a professional report with executive summary and detailed analysis.' : ''}
      ${contentType === 'summary' ? 'Please write a concise summary highlighting the key points.' : ''}
      ${contentType === 'outline' ? 'Please create a detailed outline with main points and sub-points.' : ''}
      
      Target length: ${wordCount} words
      Tone: ${tone}
      
      Please provide high-quality, original content that is well-researched and properly structured.`;

      setCurrentStep('generating');
      setProgress(25);

      let fullContent = '';
      
      // Use streaming API call with real-time updates
      await makeAPICall(fullPrompt, 3, (chunk: string) => {
        fullContent += chunk;
        
        // Update content in real-time for streaming effect
        setGeneratedContent(fullContent);
        setEditedContent(fullContent);
        
        // Update progress based on content length
        const estimatedProgress = Math.min(25 + (fullContent.length / (wordCount * 6)) * 65, 90);
        setProgress(estimatedProgress);
      });

      setCurrentStep('finalizing');
      setProgress(95);
      
      // Clean up the AI response to remove unwanted text
      let cleanedContent = fullContent
        .replace(/^(I am [^.]*(AI|LLM|Assistant|GPT|language model)[^.]*\.)/i, '') // Remove AI self-identification
        .replace(/^(Here'?s?( is)?( a| an| your| the)?( \d+[-\s]word)? (essay|response|text|content|output)[:.]\s*)/i, '') // Remove "Here's an essay:" type text
        .replace(/^(In response to your request|As requested|Based on your prompt)[^.]*/i, '') // Remove other common AI prefixes
        .replace(/^[\s\n]*/, '') // Remove leading whitespace
        .replace(/\n*$/g, '') // Remove trailing newlines
        .replace(/(Let me know if you|Hope this|If you need any|Do you want me to)[^]*$/i, '') // Remove trailing questions
        .replace(/#{1,6}\s*/g, '') // Remove markdown headers
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown but keep text
        .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown but keep text
        .replace(/_(.*?)_/g, '$1') // Remove underline markdown but keep text
        .replace(/==(.*?)==/g, '$1') // Remove highlight markdown but keep text
        .trim();
        
      // Extract title if it exists 
      let title = '';
      const titleMatch = cleanedContent.match(/^(?:Title:?\s*)(.*?)(?:\n|$)/i);
      if (titleMatch && titleMatch[1]) {
        title = titleMatch[1].trim();
      }
        
      // Add title back if it was removed
      if (title && !cleanedContent.includes(title)) {
        cleanedContent = `Title: ${title}\n\n${cleanedContent}`;
      }
        
      // Final update with cleaned content
      setGeneratedContent(cleanedContent);
      setEditedContent(cleanedContent);
      
      // Add to history with template and prompt information
      const newHistoryItem = {
        title: title || getHistoryTitle(prompt),
        date: 'Just now',
        content: cleanedContent,
        template: activeTemplate,
        prompt: prompt
      };
      setContentHistory([newHistoryItem, ...contentHistory]);
      
      setProgress(100);
      
      // Small delay to show completion
      setTimeout(() => {
        setIsGenerating(false);
        setProgress(0);
        setCurrentStep('analyzing');
      }, 500);
      
    } catch (error) {
      console.error('Error generating content:', error);
      setGeneratedContent('Error generating content. Please try again.');
      setEditedContent('Error generating content. Please try again.');
      setIsGenerating(false);
      setProgress(0);
      setCurrentStep('analyzing');
    }
  };

  const getHistoryTitle = (promptText: string) => {
    // Extract a title from the prompt
    return promptText.split(' ').slice(0, 4).join(' ') + '...';
  };

  const selectTemplate = (templateId: string) => {
    setActiveTemplate(templateId);
    
    // Set default prompts based on template
    let templatePrompt = '';
    switch(templateId) {
      case 'college-app':
        templatePrompt = 'Write a compelling college application essay about my passion for computer science and how it has shaped my future goals.';
        break;
      case 'cover-letter':
        templatePrompt = 'Create a professional cover letter for an internship position at a tech company highlighting my skills in programming and teamwork.';
        break;
      case 'recommendation':
        templatePrompt = 'Write a recommendation letter for a student applying to graduate school, emphasizing their research abilities and academic achievements.';
        break;
      case 'research-paper':
        templatePrompt = 'Generate an outline for a research paper on the impact of artificial intelligence in education.';
        break;
      case 'scholarship':
        templatePrompt = 'Create a scholarship application essay discussing my financial needs and academic achievements.';
        break;
      case 'personal-statement':
        templatePrompt = 'Write a personal statement explaining my motivation to study medical sciences and my career aspirations.';
        break;
    }
    
    setPrompt(templatePrompt);
  };

  const handleCopyContent = () => {
    let content = editedContent;
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
  
  const handleDownloadContent = (format: 'txt' | 'pdf' | 'doc') => {
    const element = document.createElement('a');
    let content = editedContent;
    
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
      
    // Remove any AI prefixes/suffixes like "Certainly!" or "Let me know if you need anything else"
    content = content
      .replace(/^(Certainly!|Here's|I've|The edited|The updated)[^]*/i, '')
      .replace(/[\r\n]+(Let me know|Hope this helps|Is there anything else)[^]*$/i, '');

    if (format === 'txt') {
      const file = new Blob([content], {type: 'text/plain'});
      element.href = URL.createObjectURL(file);
      element.download = `content-${new Date().toISOString().slice(0, 10)}.txt`;
    } else if (format === 'pdf') {
      // Create PDF using jsPDF with pagination
      const doc = new jsPDF();
      const pageHeight = doc.internal.pageSize.height;
      const margin = 15;
      const lineHeight = 7;
      const fontSize = 11;
      const linesPerPage = Math.floor((pageHeight - 2 * margin) / lineHeight);
      
      doc.setFontSize(fontSize);
      
      // Split content into lines and paginate
      const textLines = doc.splitTextToSize(content, 180);
      let curPage = 1;
      let y = margin;
      
      for (let i = 0; i < textLines.length; i++) {
        if (y > pageHeight - margin) {
          doc.addPage();
          curPage++;
          y = margin;
        }
        
        doc.text(textLines[i], margin, y);
        y += lineHeight;
      }
      
      doc.save(`content-${new Date().toISOString().slice(0, 10)}.pdf`);
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
        element.download = `content-${new Date().toISOString().slice(0, 10)}.docx`;
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

  const handleShareContent = () => {
    let content = editedContent;
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
        title: 'Generated Content',
        text: content,
      }).catch(console.error);
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(content);
      showSuccess('Content copied to clipboard!');
    }
  };

  // Get content for the current page with proper HTML handling
  const getCurrentPageContent = () => {
    const contentLines = editedContent.split('\n');
    const startLine = (currentPage - 1) * linesPerPage;
    const endLine = Math.min(startLine + linesPerPage, contentLines.length);
    
    return contentLines.slice(startLine, endLine).join('\n');
  };
  
  // Basic formatting functionality
  const applyFormatting = (format: string) => {
    if (!editorRef.current) return;
    
    const start = editorRef.current.selectionStart;
    const end = editorRef.current.selectionEnd;
    const selectedText = editedContent.substring(start, end);
    
    let formattedText = '';
    
    switch(format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'underline':
        formattedText = `_${selectedText}_`;
        break;
      case 'list-ordered':
        formattedText = `\n1. ${selectedText}`;
        break;
      case 'list-unordered':
        formattedText = `\n- ${selectedText}`;
        break;
      case 'highlight':
        formattedText = `==${selectedText}==`;
        break;
    }
    
    const newContent = 
      editedContent.substring(0, start) + 
      formattedText + 
      editedContent.substring(end);
    
    setEditedContent(newContent);
  };

  const changeFontSize = (delta: number) => {
    setFontSize(Math.max(12, Math.min(24, fontSize + delta)));
  };

  const loadFromHistory = (item: { title: string, date: string, content: string, template: string, prompt: string }) => {
    setEditedContent(item.content);
    setActiveTemplate(item.template);
    setPrompt(item.prompt);
    setShowHistory(false);
  };

  // Add the AI Edit functionality with streaming
  const handleAIEdit = async () => {
    if (!editInstructions.trim() || !editedContent.trim()) return;
    
    setIsEditing(true);
    setEditProgress(0);
    setEditStep('analyzing');
    
    try {
      const prompt = `Please edit the following content based on these instructions:

Instructions: ${editInstructions}

Content to edit:
${editedContent}

Please return the edited content with the requested changes applied. Maintain the original structure and formatting while implementing the specified modifications.`;

      setEditStep('updating');
      setEditProgress(50);

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
                  text: `You are a professional content editor. Apply the requested changes to the content while maintaining quality and coherence.

${prompt}`
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

      let editedResult = '';
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
                    // This is the thinking process, we can skip it for editing
                    continue;
                  } else if (delta.content) {
                    // This is the actual answer content
                    if (!isAnswering && delta.content.trim() !== '') {
                      isAnswering = true;
                    }
                    if (isAnswering) {
                      editedResult += delta.content;
                      // Update progress
                      setEditProgress(50 + (editedResult.length / editedContent.length) * 40);
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

      // Clean up markdown formatting
      editedResult = editedResult
        .replace(/#{1,6}\s*/g, '') // Remove markdown headers
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown but keep text
        .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown but keep text
        .replace(/_(.*?)_/g, '$1') // Remove underline markdown but keep text
        .replace(/==(.*?)==/g, '$1') // Remove highlight markdown but keep text
        .trim();

      setEditedContent(editedResult || editedContent);
      setEditProgress(100);
      setEditStep('completed');
      
      // Reset after a delay
      setTimeout(() => {
        setIsEditing(false);
        setEditProgress(0);
        setEditStep('analyzing');
        setEditInstructions('');
      }, 1000);

    } catch (error) {
      console.error('AI Edit error:', error);
      setIsEditing(false);
      setEditProgress(0);
      setEditStep('analyzing');
    }
  };

  useEffect(() => {
    // Improved handler for text selection to show Ask AI button
    const handleSelectionChange = () => {
      if (!editorRef.current) return;
      
      // Check if we're in edit mode (not preview)
      if (showPreview) {
        setShowAskAIButton(false);
        setSelectionData(null);
        return;
      }
      
      const textarea = editorRef.current;
      const selStart = textarea.selectionStart;
      const selEnd = textarea.selectionEnd;
      
      // Only proceed if there's an actual selection
      if (selStart !== selEnd) {
        const selectedText = editedContent.substring(selStart, selEnd).trim();
        if (selectedText && selectedText.length > 1) {  // Ensure meaningful selection
          setSelectionData({
            text: selectedText,
            start: selStart,
            end: selEnd
          });
          setShowAskAIButton(true);
        } else {
          setShowAskAIButton(false);
          setSelectionData(null);
        }
      } else {
        setShowAskAIButton(false);
        setSelectionData(null);
      }
    };
    
    // Add a slight delay to selection handling for better UI experience
    const delayedSelectionChange = () => {
      setTimeout(handleSelectionChange, 50);
    };
    
    // Handle clicks outside the editor to cancel selection
    const handleClickOutside = (e: MouseEvent) => {
      // Keep button visible when clicking on the Ask AI button or when modal is open
      if (
        askAIButtonRef.current?.contains(e.target as Node) ||
        showAskAIModal
      ) {
        e.stopPropagation();
        return;
      }
      
      // Otherwise hide the button when clicking outside
      if (!editorRef.current?.contains(e.target as Node)) {
        setShowAskAIButton(false);
        setSelectionData(null);
      }
    };
    
    // Add listeners to detect selection
    if (editorRef.current) {
      editorRef.current.addEventListener('mouseup', delayedSelectionChange);
      editorRef.current.addEventListener('keyup', delayedSelectionChange);
      // Also detect selection on mousedown to catch selection via double-click
      editorRef.current.addEventListener('mousedown', delayedSelectionChange);
      document.addEventListener('mousedown', handleClickOutside, true);
    }
    
    return () => {
      if (editorRef.current) {
        editorRef.current.removeEventListener('mouseup', delayedSelectionChange);
        editorRef.current.removeEventListener('keyup', delayedSelectionChange);
        editorRef.current.removeEventListener('mousedown', delayedSelectionChange);
      }
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [showPreview, editedContent, showAskAIModal]);
  
  // Handle the Ask AI feature for selected text
  const handleAskAIForSelection = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!selectionData || !selectionData.text || isProcessingSelection) return;
    
    // Open the modal and keep the selection
    setShowAskAIModal(true);
  };
  
  // Process the AI instruction for selected text with streaming
  const processAskAIRequest = async () => {
    if (!askAIInstruction.trim() || !selectionData) return;
    
    setIsProcessingSelection(true);
    try {
      const selectedText = selectionData.text;
      const instruction = askAIInstruction;
      
      const prompt = `Please help me with the following text selection:

Selected text: "${selectedText}"

Instruction: ${instruction}

Please provide a helpful response or suggestion for improving this text.`;

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
                  text: `You are a helpful writing assistant. Provide concise, actionable suggestions for improving text based on user instructions.

${prompt}`
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

      let suggestion = '';
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
                    // This is the thinking process, we can skip it for suggestions
                    continue;
                  } else if (delta.content) {
                    // This is the actual answer content
                    if (!isAnswering && delta.content.trim() !== '') {
                      isAnswering = true;
                    }
                    if (isAnswering) {
                      suggestion += delta.content;
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
      
      // Clean up markdown formatting from the suggestion
      suggestion = suggestion
        .replace(/#{1,6}\s*/g, '') // Remove markdown headers
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown but keep text
        .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown but keep text
        .replace(/_(.*?)_/g, '$1') // Remove underline markdown but keep text
        .replace(/==(.*?)==/g, '$1') // Remove highlight markdown but keep text
        .trim();

      setAskAISuggestion(suggestion || 'No suggestion available');
    } catch (error) {
      console.error('Ask AI error:', error);
      setAskAISuggestion('Error getting AI suggestion. Please try again.');
    } finally {
      setIsProcessingSelection(false);
    }
  };

  // Add a reset function to clear selection state when editor focus changes
  const resetSelection = () => {
    setShowAskAIButton(false);
    setSelectionData(null);
  };

  const handleEditorFocus = () => {
    // Reset on focus to ensure clean state
    resetSelection();
  };

  // Update askAIButtonRef position
  useEffect(() => {
    if (showAskAIButton && selectionData && editorRef.current && askAIButtonRef.current) {
      const textarea = editorRef.current;
      const textareaRect = textarea.getBoundingClientRect();
      
      // Position the button at a fixed offset from the editor to make it easier to click
      const buttonTop = textareaRect.top + 50;
      const buttonLeft = textareaRect.left + textareaRect.width/2 - 55;
      
      // Set position as fixed rather than absolute for better clickability
      askAIButtonRef.current.style.position = 'fixed';
      askAIButtonRef.current.style.top = `${buttonTop}px`;
      askAIButtonRef.current.style.left = `${buttonLeft}px`;
      askAIButtonRef.current.style.zIndex = '9999';
    }
  }, [showAskAIButton, selectionData]);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="bg-gradient-to-br from-slate-900 via-blue-900 to-teal-900 p-4 min-h-screen"
    >
      <div className="container mx-auto">
        {/* Header Section */}
        <motion.div variants={itemVariants} className="mb-6">
          <h1 className="text-3xl font-bold text-cyan-400">
            AI Content Writer
            <span className="ml-2 text-lg font-normal text-slate-300">for Students</span>
          </h1>
          <p className="text-slate-400 mt-1">
            Generate professional content for applications, essays, letters, and more.
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Panel - Template Selection & Input */}
          <motion.div variants={itemVariants} className="w-full lg:w-1/3">
            <div className="bg-slate-600/30 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-cyan-400 mb-4 flex items-center">
                <IconComponent icon={FiFileText} className="mr-2" /> Templates
              </h2>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {templates.map((template) => (
                  <motion.button
                    key={template.id}
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => selectTemplate(template.id)}
                    className={`flex flex-col items-center justify-center p-4 rounded-lg transition-colors border ${
                      activeTemplate === template.id 
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md border-cyan-500/30' 
                        : 'bg-slate-600/30 backdrop-blur-sm text-slate-300 hover:bg-slate-500/30 border-white/10'
                    }`}
                  >
                    <IconComponent icon={template.icon} className="text-2xl mb-2" />
                    <span className="text-sm text-center">{template.name}</span>
                  </motion.button>
                ))}
              </div>

              <h2 className="text-xl font-bold text-cyan-400 mb-4 flex items-center">
                <IconComponent icon={AiOutlineRobot} className="mr-2" /> Prompt
              </h2>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want to generate... For example: Write a compelling college application essay about my passion for computer science."
                className="w-full h-40 p-4 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg text-slate-300 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none"
              />
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={handleGenerateContent}
                disabled={isGenerating}
                className="mt-4 w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:shadow-lg text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center transition-all disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <IconComponent icon={FiRotateCw} className="animate-spin mr-2" /> 
                    Generating...
                  </>
                ) : (
                  <>
                    <IconComponent icon={AiOutlineBulb} className="mr-2" /> 
                    Generate Content
                  </>
                )}
              </motion.button>

              {/* History Button */}
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => setShowHistory(!showHistory)}
                className="mt-3 w-full bg-slate-600/50 backdrop-blur-sm border border-white/10 text-slate-300 font-medium py-2 px-6 rounded-lg flex items-center justify-center hover:bg-slate-500/50 transition-colors"
              >
                <IconComponent icon={AiOutlineHistory} className="mr-2" /> 
                View History
              </motion.button>
            </div>

            {/* Tips Section */}
            <motion.div variants={itemVariants} className="bg-slate-600/30 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-cyan-400 mb-4 flex items-center">
                <IconComponent icon={FiBook} className="mr-2" /> Tips
              </h2>
              <ul className="space-y-3 text-slate-300">
                <li className="flex items-start">
                  <span className="bg-teal-500/20 text-teal-400 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0 text-xs border border-teal-500/30">1</span>
                  <span>Be specific in your prompt for better results</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-teal-500/20 text-teal-400 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0 text-xs border border-teal-500/30">2</span>
                  <span>Edit the generated content to personalize it</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-teal-500/20 text-teal-400 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0 text-xs border border-teal-500/30">3</span>
                  <span>Use formatting tools to improve readability</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-teal-500/20 text-teal-400 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0 text-xs border border-teal-500/30">4</span>
                  <span>Always review and personalize AI-generated content</span>
                </li>
              </ul>
            </motion.div>
          </motion.div>

          {/* Right Panel - Editor */}
          <motion.div variants={itemVariants} className="w-full lg:w-2/3">
            <div className="bg-slate-600/30 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg overflow-hidden">
              {/* Toolbar */}
              <div className="bg-slate-700/50 backdrop-blur-sm p-3 border-b border-white/10 flex flex-wrap items-center gap-2">
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => applyFormatting('bold')}
                  className="p-2 rounded hover:bg-slate-600/50 text-slate-300 transition-colors"
                  title="Bold"
                >
                  <IconComponent icon={AiOutlineBold} />
                </motion.button>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => applyFormatting('italic')}
                  className="p-2 rounded hover:bg-slate-600/50 text-slate-300 transition-colors"
                  title="Italic"
                >
                  <IconComponent icon={AiOutlineItalic} />
                </motion.button>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => applyFormatting('underline')}
                  className="p-2 rounded hover:bg-slate-600/50 text-slate-300 transition-colors"
                  title="Underline"
                >
                  <IconComponent icon={AiOutlineUnderline} />
                </motion.button>
                <div className="h-6 w-px bg-white/20 mx-1"></div>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => applyFormatting('list-ordered')}
                  className="p-2 rounded hover:bg-slate-600/50 text-slate-300 transition-colors"
                  title="Ordered List"
                >
                  <IconComponent icon={AiOutlineOrderedList} />
                </motion.button>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => applyFormatting('list-unordered')}
                  className="p-2 rounded hover:bg-slate-600/50 text-slate-300 transition-colors"
                  title="Unordered List"
                >
                  <IconComponent icon={AiOutlineUnorderedList} />
                </motion.button>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => applyFormatting('quote')}
                  className="p-2 rounded hover:bg-slate-600/50 text-slate-300 transition-colors"
                  title="Quote"
                >
                  <IconComponent icon={BsQuote} />
                </motion.button>
                <div className="h-6 w-px bg-white/20 mx-1"></div>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => changeFontSize(2)}
                  className="p-2 rounded hover:bg-slate-600/50 text-slate-300 transition-colors"
                  title="Increase Font Size"
                >
                  <IconComponent icon={AiOutlinePlus} />
                </motion.button>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => changeFontSize(-2)}
                  className="p-2 rounded hover:bg-slate-600/50 text-slate-300 transition-colors"
                  title="Decrease Font Size"
                >
                  <IconComponent icon={AiOutlineMinus} />
                </motion.button>
                <div className="h-6 w-px bg-white/20 mx-1"></div>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={handleCopyContent}
                  className="p-2 rounded hover:bg-slate-600/50 text-slate-300 transition-colors"
                  title="Copy Content"
                >
                  <IconComponent icon={FiCopy} />
                </motion.button>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => handleDownloadContent('txt')}
                  className="p-2 rounded hover:bg-slate-600/50 text-slate-300 transition-colors"
                  title="Download"
                >
                  <IconComponent icon={FiDownload} />
                </motion.button>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={handleShareContent}
                  className="p-2 rounded hover:bg-slate-600/50 text-slate-300 transition-colors"
                  title="Share"
                >
                  <IconComponent icon={FiShare2} />
                </motion.button>
              </div>

              {/* Editor Content */}
              <div className="flex h-[600px]">
                {/* Editor */}
                <div className="w-1/2 border-r border-white/10">
                  <div className="h-full relative">
                    <textarea
                      ref={editorRef}
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      onFocus={handleEditorFocus}
                      placeholder="Start writing or generate content using AI..."
                      className="w-full h-full p-6 bg-slate-700/30 backdrop-blur-sm text-slate-300 placeholder-slate-400 resize-none focus:outline-none border-none"
                      style={{ fontSize: `${fontSize}px`, lineHeight: '1.6' }}
                    />
                    
                    {/* Ask AI Button */}
                    {showAskAIButton && selectionData && (
                      <motion.button
                        ref={askAIButtonRef as any}
                        onClick={handleAskAIForSelection}
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-3 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all text-sm font-medium flex items-center space-x-2"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <IconComponent icon={AiOutlineRobot} className="h-4 w-4" />
                        <span>Ask AI</span>
                      </motion.button>
                    )}
                  </div>
                </div>

                {/* Preview */}
                <div className="w-1/2 bg-slate-700/20 backdrop-blur-sm overflow-y-auto">
                  <div className="p-6">
                    <div className="prose prose-invert max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath, remarkGfm]}
                        rehypePlugins={[rehypeKatex]}
                        components={markdownComponents}
                      >
                        {preprocessLaTeX(getCurrentPageContent())}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-slate-700/50 backdrop-blur-sm px-6 py-3 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-slate-400">
                    Words: {editedContent.split(/\s+/).filter(word => word.length > 0).length}
                  </span>
                  <span className="text-sm text-slate-400">
                    Characters: {editedContent.length}
                  </span>
                  <span className="text-sm text-slate-400">
                    Pages: {calculateTotalPages()}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {calculateTotalPages() > 1 && (
                    <>
                      <motion.button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 bg-slate-600/50 backdrop-blur-sm hover:bg-slate-500/50 rounded text-slate-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-white/10"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Previous
                      </motion.button>
                      <span className="text-sm text-slate-400">
                        Page {currentPage} of {calculateTotalPages()}
                      </span>
                      <motion.button
                        onClick={() => setCurrentPage(p => Math.min(calculateTotalPages(), p + 1))}
                        disabled={currentPage === calculateTotalPages()}
                        className="px-3 py-1 bg-slate-600/50 backdrop-blur-sm hover:bg-slate-500/50 rounded text-slate-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-white/10"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Next
                      </motion.button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* History Panel */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-slate-600/30 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg max-w-4xl w-full max-h-[80vh] overflow-hidden"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <div className="bg-slate-700/50 backdrop-blur-sm px-6 py-4 border-b border-white/10 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-cyan-400">Content History</h3>
                  <motion.button
                    onClick={() => setShowHistory(false)}
                    className="p-2 bg-slate-600/50 backdrop-blur-sm hover:bg-slate-500/50 rounded-lg text-slate-300 transition-colors border border-white/10"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <IconComponent icon={FiX} className="h-5 w-5" />
                  </motion.button>
                </div>
                
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                  {contentHistory.length === 0 ? (
                    <div className="text-center py-12">
                      <IconComponent icon={AiOutlineHistory} className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                      <h3 className="text-lg font-medium text-slate-300 mb-2">No history yet</h3>
                      <p className="text-slate-400">Generated content will appear here for easy access.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {contentHistory.map((item, index) => (
                        <motion.div
                          key={index}
                          className="bg-slate-700/30 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:bg-slate-600/30 transition-colors cursor-pointer"
                          onClick={() => loadFromHistory(item)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-cyan-400 mb-1">{item.title}</h4>
                              <p className="text-sm text-slate-400 mb-2">{item.date}</p>
                              <p className="text-sm text-slate-300 line-clamp-2">{item.content.substring(0, 150)}...</p>
                            </div>
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/30">
                              {item.template}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ask AI Modal */}
        <AnimatePresence>
          {showAskAIModal && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-slate-600/30 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg max-w-2xl w-full"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <div className="bg-slate-700/50 backdrop-blur-sm px-6 py-4 border-b border-white/10 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-cyan-400">Ask AI about Selection</h3>
                  <motion.button
                    onClick={() => setShowAskAIModal(false)}
                    className="p-2 bg-slate-600/50 backdrop-blur-sm hover:bg-slate-500/50 rounded-lg text-slate-300 transition-colors border border-white/10"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <IconComponent icon={FiX} className="h-5 w-5" />
                  </motion.button>
                </div>
                
                <div className="p-6">
                  {selectionData && (
                    <div className="mb-4 p-3 bg-slate-700/30 backdrop-blur-sm rounded-lg border border-white/10">
                      <p className="text-sm text-slate-400 mb-1">Selected text:</p>
                      <p className="text-slate-300 italic">"{selectionData.text}"</p>
                    </div>
                  )}
                  
                  <textarea
                    value={askAIInstruction}
                    onChange={(e) => setAskAIInstruction(e.target.value)}
                    placeholder="What would you like to know about this text? (e.g., 'Improve this paragraph', 'Make it more formal', 'Explain this concept')"
                    className="w-full h-32 p-4 bg-slate-700/50 backdrop-blur-sm border border-white/10 rounded-lg text-slate-300 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none"
                  />
                  
                  <div className="flex items-center justify-end space-x-3 mt-4">
                    <motion.button
                      onClick={() => setShowAskAIModal(false)}
                      className="px-4 py-2 bg-slate-600/50 backdrop-blur-sm hover:bg-slate-500/50 rounded-lg text-slate-300 transition-colors border border-white/10"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      onClick={processAskAIRequest}
                      disabled={!askAIInstruction.trim() || isProcessingSelection}
                      className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:shadow-lg rounded-lg text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isProcessingSelection ? (
                        <>
                          <IconComponent icon={AiOutlineLoading3Quarters} className="animate-spin mr-2" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <IconComponent icon={AiOutlineRobot} className="mr-2" />
                          Ask AI
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Response Modal */}
        <AnimatePresence>
          {showAskAIModal && (
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-slate-600/30 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg max-w-4xl w-full max-h-[80vh] overflow-hidden"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <div className="bg-slate-700/50 backdrop-blur-sm px-6 py-4 border-b border-white/10 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-cyan-400">AI Response</h3>
                  <motion.button
                    onClick={() => setShowAskAIModal(false)}
                    className="p-2 bg-slate-600/50 backdrop-blur-sm hover:bg-slate-500/50 rounded-lg text-slate-300 transition-colors border border-white/10"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <IconComponent icon={FiX} className="h-5 w-5" />
                  </motion.button>
                </div>
                
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                  <div className="prose prose-invert max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath, remarkGfm]}
                      rehypePlugins={[rehypeKatex]}
                      components={markdownComponents}
                    >
                      {preprocessLaTeX(askAISuggestion)}
                    </ReactMarkdown>
                  </div>
                </div>
                
                <div className="bg-slate-700/50 backdrop-blur-sm px-6 py-4 border-t border-white/10 flex items-center justify-end space-x-3">
                  <motion.button
                    onClick={() => {
                      navigator.clipboard.writeText(askAISuggestion);
                      // You could add a toast notification here
                    }}
                    className="px-4 py-2 bg-slate-600/50 backdrop-blur-sm hover:bg-slate-500/50 rounded-lg text-slate-300 transition-colors border border-white/10 flex items-center"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <IconComponent icon={FiCopy} className="mr-2 h-4 w-4" />
                    Copy
                  </motion.button>
                  <motion.button
                    onClick={() => setShowAskAIModal(false)}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:shadow-lg rounded-lg text-white font-medium transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Close
                  </motion.button>
                </div>
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
    </motion.div>
  );
};

export { ContentWriterComponent };
export default ContentWriterComponent;