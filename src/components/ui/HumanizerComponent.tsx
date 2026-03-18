import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
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
import { useLanguage } from '../../utils/LanguageContext';
import { useAuth } from '../../utils/AuthContext';
import { API_BASE } from '../../config/api';

// Import markdown and math libraries
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';

// API Configuration
const API_BASE_URL = API_BASE;

// Get user ID from authentication context or localStorage - proper authentication
const getUserId = (user?: any, session?: any): string | null => {
  // First try to get user ID from the provided authentication context
  if (user?.id) {
    console.log('📱 Found user ID from auth context:', user.id);
    return user.id;
  }
  
  if (session?.user?.id) {
    console.log('📱 Found user ID from session:', session.user.id);
    return session.user.id;
  }
  
  // Try to get user ID from localStorage first (common auth pattern)
  const userId = localStorage.getItem('userId') || localStorage.getItem('user_id');
  if (userId && userId !== 'undefined' && userId !== 'null') {
    console.log('📱 Found user ID in localStorage:', userId);
    return userId;
  }
  
  // Try to get from user object in localStorage
  const userStr = localStorage.getItem('user');
  if (userStr && userStr !== 'undefined' && userStr !== 'null') {
    try {
      const user = JSON.parse(userStr);
      if (user && (user.id || user.user_id || user.uid)) {
        const foundUserId = user.id || user.user_id || user.uid;
        console.log('📱 Found user ID from user object:', foundUserId);
        return foundUserId;
      }
    } catch (e) {
      console.warn('Failed to parse user from localStorage');
    }
  }
  
  // Try Supabase auth patterns
  const supabaseAuthStr = localStorage.getItem('sb-cdqrmxmqsoxncnkxiqwu-auth-token');
  if (supabaseAuthStr && supabaseAuthStr !== 'undefined' && supabaseAuthStr !== 'null') {
    try {
      const authData = JSON.parse(supabaseAuthStr);
      if (authData.user?.id) {
        console.log('📱 Found user ID from Supabase auth:', authData.user.id);
        return authData.user.id;
      }
    } catch (e) {
      console.warn('Failed to parse Supabase auth from localStorage');
    }
  }
  
  // Check other possible Supabase auth keys
  const keys = Object.keys(localStorage);
  for (const key of keys) {
    if (key.includes('supabase') || key.includes('auth')) {
      try {
        const data = localStorage.getItem(key);
        if (data && data !== 'undefined' && data !== 'null') {
          const parsed = JSON.parse(data);
          if (parsed?.user?.id) {
            console.log('📱 Found user ID from auth key:', key, parsed.user.id);
            return parsed.user.id;
          }
        }
      } catch (e) {
        // Continue to next key
      }
    }
  }
  
  // No authenticated user found
  console.warn('⚠️ No authenticated user found');
  return null;
};


// Content Writer API Interface
interface ContentItem {
  id: string;
  user_id: string;
  title: string;
  prompt: string;
  generated_content: string;
  template_type: string;
  content_type: string;
  word_count: number;
  tone: string;
  font_size: number;
  metadata: any;
  created_at: string;
  updated_at: string;
}

interface ContentHistoryResponse {
  contentHistory: ContentItem[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
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
        className="bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
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

interface HumanizerComponentProps {
  className?: string;
}

const HumanizerComponent: React.FC<HumanizerComponentProps> = ({ className = '' }) => {
  const { t } = useLanguage();
  const { user, session } = useAuth();
  
  // Get current user ID dynamically
  const currentUserId = getUserId(user, session);

  // Check if user is authenticated
  useEffect(() => {
    if (!currentUserId) {
      console.warn('⚠️ No authenticated user found in ContentWriterComponent');
    }
  }, [currentUserId]);

  // Add CSS styles for the range slider
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      /* Range slider styles */
      .slider::-webkit-slider-thumb {
        appearance: none;
        height: 20px;
        width: 20px;
        border-radius: 50%;
        background: linear-gradient(135deg, #06b6d4, #3b82f6);
        cursor: pointer;
        border: 2px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }
      
      .slider::-moz-range-thumb {
        height: 20px;
        width: 20px;
        border-radius: 50%;
        background: linear-gradient(135deg, #06b6d4, #3b82f6);
        cursor: pointer;
        border: 2px solid rgba(255, 255, 255, 0.2);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }
      
      .slider::-webkit-slider-track {
        height: 8px;
        border-radius: 4px;
        background: rgba(71, 85, 105, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .slider::-moz-range-track {
        height: 8px;
        border-radius: 4px;
        background: rgba(71, 85, 105, 0.5);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .slider:focus {
        outline: none;
      }
      
      .slider:focus::-webkit-slider-thumb {
        box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.3);
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

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
    h1: ({ children }: any) => <h1 className="text-2xl font-bold text-cyan-400 mt-6 mb-4 border-b-2 border-cyan-500/30 pb-2" style={{color: '#22d3ee !important'}}>{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-xl font-bold text-cyan-400 mt-5 mb-3 border-b border-cyan-500/20 pb-1" style={{color: '#22d3ee !important'}}>{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-lg font-bold text-blue-400 mt-4 mb-2 bg-blue-500/10 px-3 py-2 rounded border border-blue-500/20" style={{color: '#60a5fa !important'}}>{children}</h3>,
    h4: ({ children }: any) => <h4 className="text-base font-semibold text-slate-300 mt-3 mb-2" style={{color: '#cbd5e1 !important'}}>{children}</h4>,
    h5: ({ children }: any) => <h5 className="text-sm font-semibold text-slate-300 mt-3 mb-2" style={{color: '#cbd5e1 !important'}}>{children}</h5>,
    h6: ({ children }: any) => <h6 className="text-sm font-semibold text-slate-300 mt-3 mb-2" style={{color: '#cbd5e1 !important'}}>{children}</h6>,
    p: ({ children }: any) => <p className="text-slate-300 mb-4 leading-relaxed" style={{color: '#cbd5e1 !important'}}>{children}</p>,
    ul: ({ children }: any) => <ul className="list-disc list-inside mb-4 text-slate-300 space-y-1" style={{color: '#cbd5e1 !important'}}>{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal list-inside mb-4 text-slate-300 space-y-1" style={{color: '#cbd5e1 !important'}}>{children}</ol>,
    li: ({ children }: any) => <li className="mb-1 pl-2 text-slate-300" style={{color: '#cbd5e1 !important'}}>{children}</li>,
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-cyan-500 pl-4 my-4 bg-cyan-500/10 py-3 rounded-r italic text-slate-300 backdrop-blur-sm" style={{color: '#cbd5e1 !important'}}>
        {children}
      </blockquote>
    ),
    strong: ({ children }: any) => <strong className="font-bold text-slate-200 bg-yellow-500/20 px-1 rounded" style={{color: '#e2e8f0 !important'}}>{children}</strong>,
    em: ({ children }: any) => <em className="italic text-slate-300" style={{color: '#cbd5e1 !important'}}>{children}</em>,
    table: ({ children }: any) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full border border-slate-600 rounded-lg overflow-hidden bg-slate-700/30 backdrop-blur-sm">{children}</table>
      </div>
    ),
    thead: ({ children }: any) => <thead className="bg-slate-600/50">{children}</thead>,
    tbody: ({ children }: any) => <tbody>{children}</tbody>,
    tr: ({ children }: any) => <tr className="border-b border-slate-600 hover:bg-slate-600/30">{children}</tr>,
    th: ({ children }: any) => <th className="px-4 py-2 text-left font-semibold text-cyan-400" style={{color: '#22d3ee !important'}}>{children}</th>,
    td: ({ children }: any) => <td className="px-4 py-2 text-slate-300" style={{color: '#cbd5e1 !important'}}>{children}</td>,
    a: ({ children, href }: any) => (
      <a href={href} className="text-cyan-400 hover:text-cyan-300 underline font-medium" target="_blank" rel="noopener noreferrer" style={{color: '#22d3ee !important'}}>
        {children}
      </a>
    ),
  };

  const [prompt, setPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState('standard');
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
  
  // Add missing state variables for content generation
  const [contentType, setContentType] = useState('essay');
  const [wordCount, setWordCount] = useState(500);
  const [tone, setTone] = useState('academic');
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState<'analyzing' | 'generating' | 'finalizing'>('analyzing');
  
  // Updated contentHistory to use API data structure
  const [contentHistory, setContentHistory] = useState<ContentItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [historyPagination, setHistoryPagination] = useState({
    totalItems: 0,
    totalPages: 0,
    currentPage: 1,
    itemsPerPage: 10
  });
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
    { id: 'standard', name: 'Standard', icon: FiFileText },
    { id: 'fluent', name: 'Fluent', icon: FiEdit },
    { id: 'creative', name: 'Creative', icon: AiOutlineBulb },
    { id: 'academic', name: 'Academic', icon: FiBook },
    { id: 'simple', name: 'Simple', icon: FiRotateCw },
    { id: 'shorten', name: 'Shorten', icon: FiMinus },
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
                    text: "You are a professional content humanizer and editor. Your primary task is to rewrite the provided text to make it sound more natural, human-like, engaging, and less robotic, while preserving the original meaning and intent. Focus on improving flow, readability, and tone. If the user provides specific instructions along with the text, follow them. If only text is provided, humanize it."
                  }
                ]
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: prompt
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
      // Create a much more specific and strict prompt for humanization
      const fullPrompt = `
TASK: Humanize and rewrite the following text to sound more natural and human-like.
MODE: ${activeTemplate}
TONE: ${tone}
CONTENT TYPE: ${contentType}

TEXT TO HUMANIZE:
${prompt}

INSTRUCTIONS:
1. Preserve the original meaning.
2. Improve flow and readability.
3. Remove robotic phrasing.
4. Match the requested mode and tone.
5. If word count is specified as target, aim for ${wordCount} words (±10%).
`;

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
      
      // Save the RAW AI response to database (not cleaned)
      const rawContent = fullContent.trim() || 'I apologize, but I could not generate content. Please try again.';
      
      // Extract title if it exists for saving
      let title = '';
      const titleMatch = rawContent.match(/^(?:Title:?\s*)(.*?)(?:\n|$)/i);
      if (titleMatch && titleMatch[1]) {
        title = titleMatch[1].trim();
      }
      
      // Save RAW content to API
      const savedContent = await saveContentToAPI(
        title || getHistoryTitle(prompt),
        prompt,
        rawContent, // Save the raw AI response
        activeTemplate
      );
      
      // Clean up the content ONLY for display purposes
      let cleanedContent = rawContent
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
        
      // Add title back if it was removed
      if (title && !cleanedContent.includes(title)) {
        cleanedContent = `Title: ${title}\n\n${cleanedContent}`;
      }
        
      // Final update with cleaned content for display
      setGeneratedContent(cleanedContent);
      setEditedContent(cleanedContent);
      
      // Log actual word count for debugging
      const actualWordCount = cleanedContent.split(/\s+/).filter(word => word.length > 0).length;
      console.log(`📊 Requested: ${wordCount} words, Generated: ${actualWordCount} words`);
      
      if (savedContent) {
        // Refresh history to get the latest data
        await fetchContentHistory();
      }
      
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

  // Delete content from history
  const deleteContentFromHistory = async (contentId: string) => {
    try {
      if (!currentUserId) {
        showSuccess('Please log in to delete content.', 'error');
        return;
      }

      const response = await axios.delete(`${API_BASE_URL}/content-writer/${contentId}?uid=${currentUserId}`);
      
      if (response.data && response.data.success) {
        showSuccess('Content deleted successfully!');
        // Refresh history to update the list
        await fetchContentHistory();
      } else {
        throw new Error('Failed to delete content');
      }
    } catch (error) {
      console.error('Error deleting content:', error);
      showSuccess('Error deleting content. Please try again.', 'error');
    }
  };

  // Show confirmation dialog for delete
  const confirmDeleteContent = (contentId: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      deleteContentFromHistory(contentId);
    }
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

  const loadFromHistory = (item: ContentItem) => {
    setEditedContent(item.generated_content);
    setActiveTemplate(item.template_type);
    setPrompt(item.prompt);
    setContentType(item.content_type);
    setWordCount(item.word_count);
    setTone(item.tone);
    setFontSize(item.font_size);
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
      // Don't hide the button if modal is open or about to open
      if (showAskAIModal) {
        return;
      }
      
      // Only hide the button when clicking outside both the editor and the toolbar
      if (!editorRef.current?.contains(e.target as Node)) {
        // Check if the click was on the Ask AI button in the toolbar
        const askAIButton = document.querySelector('[data-ask-ai-button]');
        if (askAIButton?.contains(e.target as Node)) {
          return; // Don't hide if clicking on the Ask AI button
        }
        
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

      const response = await fetch(process.env.REACT_APP_DASHSCOPE_ENDPOINT || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_DASHSCOPE_API_KEY || ''}`,
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


  // API Functions
  const saveContentToAPI = async (
    title: string, 
    prompt: string, 
    generatedContent: string, 
    templateType: string = activeTemplate
  ): Promise<ContentItem | null> => {
    try {
      if (!currentUserId) {
        showSuccess('Please log in to save content.', 'error');
        return null;
      }

      setIsSaving(true);
      
      const response = await axios.post(`${API_BASE_URL}/content-writer/save`, {
        uid: currentUserId,
        title,
        prompt,
        generatedContent,
        templateType,
        contentType,
        wordCount,
        tone,
        fontSize,
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0'
        }
      });

      if (response.data && response.data.content) {
        showSuccess('Content saved successfully!');
        return response.data.content;
      }
      
      return null;
    } catch (error) {
      console.error('Error saving content:', error);
      showSuccess('Error saving content. Please try again.', 'error');
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const fetchContentHistory = async (page: number = 1, limit: number = 10): Promise<void> => {
    try {
      if (!currentUserId) {
        console.warn('No authenticated user for fetching content history');
        return;
      }

      setIsLoadingHistory(true);
      
      const response = await axios.get<ContentHistoryResponse>(
        `${API_BASE_URL}/content-writer/history/${currentUserId}?page=${page}&limit=${limit}`
      );

      if (response.data) {
        const apiHistory = response.data.contentHistory.map(item => ({
          ...item,
          date: formatDate(item.created_at)
        }));
        
        setContentHistory(apiHistory);
        setHistoryPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching content history:', error);
      showSuccess('Error loading content history.', 'error');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Helper function to format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)} days ago`;
    
    return date.toLocaleDateString();
  };

  // Load content history on component mount
  useEffect(() => {
    fetchContentHistory();
  }, []);

  // Manual save function for edited content
  const handleManualSave = async () => {
    if (!editedContent.trim()) {
      showSuccess('No content to save.', 'error');
      return;
    }

    if (!currentUserId) {
      showSuccess('Please log in to save content.', 'error');
      return;
    }

    const title = getHistoryTitle(editedContent);
    const savedContent = await saveContentToAPI(
      title,
      prompt || 'Manually saved content',
      editedContent,
      activeTemplate
    );

    if (savedContent) {
      await fetchContentHistory();
    }
  };

  const getHistoryTitle = (promptText: string) => {
    // Extract a title from the prompt
    return promptText.split(' ').slice(0, 4).join(' ') + '...';
  };

  const selectTemplate = (templateId: string) => {
    setActiveTemplate(templateId);
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className={`bg-[#0f172a]/60 backdrop-blur-md border border-white/10 rounded-xl shadow-lg overflow-hidden p-4 sm:p-6 ${className || ''}`}
    >
      <div className="container mx-auto">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Panel - Template Selection & Input */}
          <motion.div variants={itemVariants} className="w-full lg:w-1/3">
            <div className="bg-[#0f172a]/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-6 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <IconComponent icon={FiSettings} className="mr-2 text-indigo-400" /> Humanizer Modes
              </h2>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {templates.map((template) => (
                  <motion.button
                    key={template.id}
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => selectTemplate(template.id)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200 border ${
                      activeTemplate === template.id 
                        ? 'bg-indigo-600/20 text-white border-indigo-500/50 shadow-lg shadow-indigo-500/10' 
                        : 'bg-white/5 text-slate-400 hover:bg-white/10 border-white/5 hover:text-slate-200'
                    }`}
                  >
                    <IconComponent icon={template.icon} className={`text-2xl mb-2 ${activeTemplate === template.id ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <span className="text-sm text-center font-medium">{template.name}</span>
                  </motion.button>
                ))}
              </div>

              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <IconComponent icon={AiOutlineRobot} className="mr-2 text-indigo-400" /> Text to Humanize
              </h2>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Paste the text you want to humanize here... (You can also add specific instructions like 'Make it more casual' or 'Keep it professional')"
                className="w-full h-40 p-4 bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none transition-all"
              />
              
              {/* Content Settings */}
              <div className="mt-6 space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <IconComponent icon={FiSettings} className="mr-2 text-indigo-400" /> Content Settings
                </h3>
                
                {/* Word Count */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Word Count: <span className="text-indigo-400">{wordCount}</span> words
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="range"
                      min="50"
                      max="2000"
                      step="50"
                      value={wordCount}
                      onChange={(e) => setWordCount(parseInt(e.target.value))}
                      className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <input
                      type="number"
                      min="50"
                      max="2000"
                      value={wordCount}
                      onChange={(e) => setWordCount(Math.max(50, Math.min(2000, parseInt(e.target.value) || 100)))}
                      className="w-20 px-2 py-1 bg-slate-900/50 border border-white/10 rounded-lg text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-center"
                    />
                  </div>
                </div>
                
                {/* Content Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Content Type</label>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                  >
                    <option value="essay">Essay</option>
                    <option value="article">Article</option>
                    <option value="blog">Blog Post</option>
                    <option value="report">Report</option>
                    <option value="summary">Summary</option>
                    <option value="outline">Outline</option>
                  </select>
                </div>
                
                {/* Tone */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Tone</label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-900/50 backdrop-blur-sm border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none"
                  >
                    <option value="academic">Academic</option>
                    <option value="professional">Professional</option>
                    <option value="casual">Casual</option>
                    <option value="formal">Formal</option>
                    <option value="conversational">Conversational</option>
                    <option value="persuasive">Persuasive</option>
                    <option value="creative">Creative</option>
                  </select>
                </div>
              </div>
              
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={handleGenerateContent}
                disabled={isGenerating}
                className="mt-6 w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <IconComponent icon={FiRotateCw} className="animate-spin mr-2" /> 
                    {t('aiStudy.generating')}
                  </>
                ) : (
                  <>
                    <IconComponent icon={AiOutlineBulb} className="mr-2" /> 
                    {t('aiStudy.generateContent')}
                  </>
                )}
              </motion.button>

              {/* History Button */}
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => setShowHistory(!showHistory)}
                className="mt-3 w-full bg-white/5 border border-white/10 text-slate-300 font-medium py-2.5 px-6 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                <IconComponent icon={AiOutlineHistory} className="mr-2" /> 
                {t('aiStudy.viewHistory')} ({contentHistory.length})
              </motion.button>
            </div>

            {/* Tips Section */}
            <motion.div variants={itemVariants} className="bg-[#0f172a]/60 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                <IconComponent icon={FiBook} className="mr-2 text-indigo-400" /> Tips
              </h2>
              <ul className="space-y-3 text-slate-400">
                <li className="flex items-start">
                  <span className="bg-indigo-500/20 text-indigo-400 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0 text-xs border border-indigo-500/30">1</span>
                  <span>{t('aiStudy.beSpecificInYourPromptForBetterResults')}</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-indigo-500/20 text-indigo-400 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0 text-xs border border-indigo-500/30">2</span>
                  <span>{t('aiStudy.editTheGeneratedContentToPersonalizeIt')}</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-indigo-500/20 text-indigo-400 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0 text-xs border border-indigo-500/30">3</span>
                  <span>{t('aiStudy.useFormattingToolsToImproveReadability')}</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-indigo-500/20 text-indigo-400 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0 text-xs border border-indigo-500/30">4</span>
                  <span>{t('aiStudy.alwaysReviewAndPersonalizeAIGeneratedContent')}</span>
                </li>
              </ul>
            </motion.div>
          </motion.div>

          {/* Right Panel - Editor */}
          <motion.div variants={itemVariants} className="w-full lg:w-2/3">
            <div className="bg-[#0f172a]/60 backdrop-blur-md border border-white/10 rounded-2xl shadow-xl overflow-hidden flex flex-col h-full min-h-[800px]">
              {/* Toolbar */}
              <div className="bg-white/5 backdrop-blur-md p-3 border-b border-white/10 flex flex-wrap items-center gap-2">
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => applyFormatting('bold')}
                  className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  title={t('aiStudy.bold')}
                >
                  <IconComponent icon={AiOutlineBold} />
                </motion.button>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => applyFormatting('italic')}
                  className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  title={t('aiStudy.italic')}
                >
                  <IconComponent icon={AiOutlineItalic} />
                </motion.button>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => applyFormatting('underline')}
                  className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  title={t('aiStudy.underline')}
                >
                  <IconComponent icon={AiOutlineUnderline} />
                </motion.button>
                <div className="h-6 w-px bg-white/10 mx-1"></div>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => applyFormatting('list-ordered')}
                  className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  title={t('aiStudy.orderedList')}
                >
                  <IconComponent icon={AiOutlineOrderedList} />
                </motion.button>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => applyFormatting('list-unordered')}
                  className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  title={t('aiStudy.unorderedList')}
                >
                  <IconComponent icon={AiOutlineUnorderedList} />
                </motion.button>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => applyFormatting('quote')}
                  className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  title={t('aiStudy.quote')}
                >
                  <IconComponent icon={BsQuote} />
                </motion.button>
                <div className="h-6 w-px bg-white/10 mx-1"></div>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => changeFontSize(2)}
                  className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  title={t('aiStudy.increaseFontSize')}
                >
                  <IconComponent icon={AiOutlinePlus} />
                </motion.button>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => changeFontSize(-2)}
                  className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  title={t('aiStudy.decreaseFontSize')}
                >
                  <IconComponent icon={AiOutlineMinus} />
                </motion.button>
                <div className="h-6 w-px bg-white/10 mx-1"></div>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={handleCopyContent}
                  className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  title={t('aiStudy.copyContent')}
                >
                  <IconComponent icon={FiCopy} />
                </motion.button>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={handleManualSave}
                  disabled={isSaving || !editedContent.trim()}
                  className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Save Content"
                >
                  {isSaving ? (
                    <IconComponent icon={AiOutlineLoading3Quarters} className="animate-spin" />
                  ) : (
                    <IconComponent icon={FiSave} />
                  )}
                </motion.button>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => handleDownloadContent('txt')}
                  className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  title={t('aiStudy.download')}
                >
                  <IconComponent icon={FiDownload} />
                </motion.button>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={handleShareContent}
                  className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  title={t('aiStudy.share')}
                >
                  <IconComponent icon={FiShare2} />
                </motion.button>
                
                {/* Flexible spacer to push AI Edit button to the right */}
                <div className="flex-grow"></div>
                
                {/* Ask AI Button - appears when text is selected */}
                {showAskAIButton && selectionData && (
                  <AnimatePresence>
                    <motion.button
                      onClick={handleAskAIForSelection}
                      data-ask-ai-button="true"
                      className="flex items-center px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg shadow-lg hover:shadow-xl transition-all text-sm font-medium space-x-2"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <IconComponent icon={AiOutlineRobot} className="h-4 w-4" />
                      <span>{t('aiStudy.askAI')}</span>
                    </motion.button>
                  </AnimatePresence>
                )}
              </div>

              {/* Editor Content */}
              <div className="flex flex-1 min-h-0">
                {/* Editor */}
                <div className="w-1/2 border-r border-white/10 flex flex-col">
                  <div className="flex-1 relative">
                    <textarea
                      ref={editorRef}
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      onFocus={handleEditorFocus}
                      placeholder={t('aiStudy.startWritingOrGenerateContentUsingAI')}
                      className="w-full h-full p-6 bg-transparent text-slate-200 placeholder-slate-500 resize-none focus:outline-none border-none custom-scrollbar"
                      style={{ fontSize: `${fontSize}px`, lineHeight: '1.6' }}
                    />
                  </div>
                </div>

                {/* Preview */}
                <div className="w-1/2 bg-black/20 overflow-y-auto custom-scrollbar">
                  <div className="p-6">
                    <div className="prose prose-invert max-w-none prose-headings:text-indigo-400 prose-a:text-indigo-400 hover:prose-a:text-indigo-300 prose-strong:text-white prose-code:text-indigo-300 prose-blockquote:border-indigo-500">
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
              <div className="bg-white/5 backdrop-blur-md px-6 py-3 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-xs font-medium text-slate-400 bg-white/5 px-2 py-1 rounded-md">
                    Words: <span className="text-indigo-400">{editedContent.split(/\s+/).filter(word => word.length > 0).length}</span>
                  </span>
                  <span className="text-xs font-medium text-slate-400 bg-white/5 px-2 py-1 rounded-md">
                    Chars: <span className="text-indigo-400">{editedContent.length}</span>
                  </span>
                  <span className="text-xs font-medium text-slate-400 bg-white/5 px-2 py-1 rounded-md">
                    Pages: <span className="text-indigo-400">{calculateTotalPages()}</span>
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {calculateTotalPages() > 1 && (
                    <>
                      <motion.button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 text-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-white/10"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {t('aiStudy.previous')}
                      </motion.button>
                      <span className="text-xs text-slate-400 font-medium">
                        {t('aiStudy.page')} {currentPage} {t('aiStudy.of')} {calculateTotalPages()}
                      </span>
                      <motion.button
                        onClick={() => setCurrentPage(p => Math.min(calculateTotalPages(), p + 1))}
                        disabled={currentPage === calculateTotalPages()}
                        className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 text-xs disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-white/10"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {t('aiStudy.next')}
                      </motion.button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* History Panel */}
        <PortalModal 
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          className="bg-slate-600/30 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg max-w-4xl w-full max-h-[80vh] overflow-hidden"
        >
          <div className="bg-slate-700/50 backdrop-blur-sm px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-cyan-400">{t('aiStudy.contentHistory')}</h3>
              <p className="text-sm text-slate-400">
                {historyPagination.totalItems} {historyPagination.totalItems === 1 ? 'item' : 'items'} total
              </p>
            </div>
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
            {isLoadingHistory ? (
              <div className="text-center py-12">
                <IconComponent icon={AiOutlineLoading3Quarters} className="h-12 w-12 mx-auto mb-4 text-cyan-400 animate-spin" />
                <h3 className="text-lg font-medium text-slate-300 mb-2">Loading history...</h3>
                <p className="text-slate-400">Please wait while we fetch your content history.</p>
              </div>
            ) : contentHistory.length === 0 ? (
              <div className="text-center py-12">
                <IconComponent icon={AiOutlineHistory} className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                <h3 className="text-lg font-medium text-slate-300 mb-2">{t('aiStudy.noHistoryYet')}</h3>
                <p className="text-slate-400">{t('aiStudy.generatedContentWillAppearHereForEasyAccess')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {contentHistory.map((item, index) => (
                  <motion.div
                    key={item.id}
                    className="bg-slate-700/30 backdrop-blur-sm border border-white/10 rounded-lg p-4 hover:bg-slate-600/30 transition-colors cursor-pointer"
                    onClick={() => loadFromHistory(item)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-cyan-400 mb-1">{item.title}</h4>
                        <p className="text-sm text-slate-400 mb-2">{formatDate(item.created_at)}</p>
                        <p className="text-sm text-slate-300 line-clamp-2">{item.generated_content.substring(0, 150)}...</p>
                        <div className="flex items-center mt-2 space-x-2">
                          <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded border border-blue-500/30">
                            {item.template_type}
                          </span>
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded border border-green-500/30">
                            {item.content_type}
                          </span>
                          <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-1 rounded border border-purple-500/30">
                            {item.word_count} words
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering loadFromHistory
                            confirmDeleteContent(item.id, item.title);
                          }}
                          className="px-2 py-1 bg-red-500/50 hover:bg-red-600 rounded text-white transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          title="Delete content"
                        >
                          <IconComponent icon={FiTrash} className="h-4 w-4" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
                
                {/* Pagination */}
                {historyPagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                    <div className="text-sm text-slate-400">
                      Showing {(historyPagination.currentPage - 1) * historyPagination.itemsPerPage + 1} to{' '}
                      {Math.min(historyPagination.currentPage * historyPagination.itemsPerPage, historyPagination.totalItems)} of{' '}
                      {historyPagination.totalItems} items
                    </div>
                    <div className="flex items-center space-x-2">
                      <motion.button
                        onClick={() => fetchContentHistory(historyPagination.currentPage - 1)}
                        disabled={historyPagination.currentPage === 1}
                        className="px-3 py-1 bg-slate-600/50 backdrop-blur-sm hover:bg-slate-500/50 rounded text-slate-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-white/10"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Previous
                      </motion.button>
                      <span className="text-sm text-slate-400">
                        Page {historyPagination.currentPage} of {historyPagination.totalPages}
                      </span>
                      <motion.button
                        onClick={() => fetchContentHistory(historyPagination.currentPage + 1)}
                        disabled={historyPagination.currentPage === historyPagination.totalPages}
                        className="px-3 py-1 bg-slate-600/50 backdrop-blur-sm hover:bg-slate-500/50 rounded text-slate-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-white/10"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Next
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </PortalModal>

        {/* Ask AI Modal */}
        <PortalModal 
          isOpen={showAskAIModal}
          onClose={() => setShowAskAIModal(false)}
          className="bg-slate-600/30 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg max-w-2xl w-full"
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
            
            {/* Show input form if no suggestion yet */}
            {!askAISuggestion && (
              <>
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
                        {t('aiStudy.processing')}
                      </>
                    ) : (
                      <>
                        <IconComponent icon={AiOutlineRobot} className="mr-2" />
                        {t('aiStudy.askAI')}
                      </>
                    )}
                  </motion.button>
                </div>
              </>
            )}
            
            {/* Show AI response if available */}
            {askAISuggestion && (
              <>
                <div className="mb-4">
                  <h4 className="text-lg font-medium text-cyan-400 mb-2">{t('aiStudy.aiResponse')}</h4>
                  <div className="prose prose-invert max-w-none bg-slate-700/30 backdrop-blur-sm rounded-lg border border-white/10 p-4">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath, remarkGfm]}
                      rehypePlugins={[rehypeKatex]}
                      components={markdownComponents}
                    >
                      {preprocessLaTeX(askAISuggestion)}
                    </ReactMarkdown>
                  </div>
                </div>
                
                <div className="flex items-center justify-end space-x-3">
                  <motion.button
                    onClick={() => {
                      navigator.clipboard.writeText(askAISuggestion);
                      // Reset for next use
                      setAskAISuggestion('');
                      setAskAIInstruction('');
                    }}
                    className="px-4 py-2 bg-slate-600/50 backdrop-blur-sm hover:bg-slate-500/50 rounded-lg text-slate-300 transition-colors border border-white/10 flex items-center"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <IconComponent icon={FiCopy} className="mr-2 h-4 w-4" />
                    {t('aiStudy.copy')}
                  </motion.button>
                  <motion.button
                    onClick={() => {
                      setShowAskAIModal(false);
                      setAskAISuggestion('');
                      setAskAIInstruction('');
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:shadow-lg rounded-lg text-white font-medium transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {t('aiStudy.close')}
                  </motion.button>
                </div>
              </>
            )}
          </div>
        </PortalModal>
        
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

export { HumanizerComponent };
export default HumanizerComponent;
