import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import { Document, Paragraph, TextRun, Packer } from 'docx';
import { FiEdit, FiDownload, FiShare2, FiSave, FiSettings, FiRotateCw, FiRefreshCw, FiCopy, FiTrash, FiBook, FiFileText, FiMail, FiClipboard } from 'react-icons/fi';
import { AiOutlineFontSize, AiOutlineHighlight, AiOutlineAlignLeft, AiOutlineAlignCenter, AiOutlineAlignRight, AiOutlineBold, AiOutlineItalic, AiOutlineUnderline, AiOutlineOrderedList, AiOutlineUnorderedList, AiOutlineLink, AiOutlineRobot, AiOutlineBulb, AiOutlineHistory } from 'react-icons/ai';
import IconComponent from './IconComponent';

const ContentWriterComponent: React.FC = () => {
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
    for (let i = 0; i < retries; i++) {
      try {
        // Add delay between retries
        if (i > 0) {
          await delay(2000 * i); // Exponential backoff
        }

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
                    text: `You are a professional academic writing assistant. Generate high-quality, well-structured content based on user prompts. Focus on clarity, coherence, and academic standards.

User request: ${prompt}`
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
                      // This is the thinking process, we can skip it for content writing
                      continue;
                    } else if (delta.content) {
                      // This is the actual answer content
                      if (!isAnswering && delta.content.trim() !== '') {
                        isAnswering = true;
                      }
                      if (isAnswering) {
                        fullContent += delta.content;
                        // Call the chunk callback if provided
                        if (onChunk) {
                          onChunk(delta.content);
                        }
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

        return fullContent.trim() || 'Error generating content';
      } catch (error) {
        if (i === retries - 1) throw error; // Throw on last retry
        console.warn('API call failed, retrying...', error);
      }
    }
    throw new Error('API call failed after retries');
  };

  // Generate content with streaming
  const generateContent = async () => {
    if (!prompt.trim()) return;
    
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
      alert('Content copied to clipboard!');
    }
  };

  // Get content for the current page with proper HTML handling
  const getCurrentPageContent = () => {
    const contentLines = editedContent.split('\n');
    const startLine = (currentPage - 1) * linesPerPage;
    const endLine = Math.min(startLine + linesPerPage, contentLines.length);
    
    return contentLines.slice(startLine, endLine).join('\n');
  };
  
  // Function to convert content text to HTML with proper formatting
  const contentToHTML = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
      .replace(/_(.*?)_/g, '<u>$1</u>') // Underline
      .replace(/==(.*?)==/g, '<mark>$1</mark>') // Highlight
      .replace(/\n- (.*)/g, '<ul><li>$1</li></ul>') // Unordered list
      .replace(/\n\d+\. (.*)/g, '<ol><li>$1</li></ol>') // Ordered list
      .replace(/#{1,6} (.*)/g, '<h3>$1</h3>') // Headers
      .replace(/\n/g, '<br />'); // Newlines
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
      className="bg-gradient-to-b from-teal-50 to-white p-4"
    >
      <div className="container mx-auto">
        {/* Header Section */}
        <motion.div variants={itemVariants} className="mb-6">
          <h1 className="text-3xl font-bold text-primary">
            AI Content Writer
            <span className="ml-2 text-lg font-normal text-teal-600">for Students</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Generate professional content for applications, essays, letters, and more.
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Panel - Template Selection & Input */}
          <motion.div variants={itemVariants} className="w-full lg:w-1/3">
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-primary mb-4 flex items-center">
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
                    className={`flex flex-col items-center justify-center p-4 rounded-lg transition-colors
                      ${activeTemplate === template.id 
                        ? 'bg-primary text-white shadow-md' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  >
                    <IconComponent icon={template.icon} className="text-2xl mb-2" />
                    <span className="text-sm text-center">{template.name}</span>
                  </motion.button>
                ))}
              </div>

              <h2 className="text-xl font-bold text-primary mb-4 flex items-center">
                <IconComponent icon={AiOutlineRobot} className="mr-2" /> Prompt
              </h2>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want to generate... For example: Write a compelling college application essay about my passion for computer science."
                className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={handleGenerateContent}
                disabled={isGenerating}
                className="mt-4 w-full bg-secondary hover:bg-secondary-light text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
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
                className="mt-3 w-full bg-white border border-gray-300 text-gray-700 font-medium py-2 px-6 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                <IconComponent icon={AiOutlineHistory} className="mr-2" /> 
                View History
              </motion.button>
            </div>

            {/* Tips Section */}
            <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-primary mb-4 flex items-center">
                <IconComponent icon={FiBook} className="mr-2" /> Tips
              </h2>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="bg-teal-100 text-teal-700 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">1</span>
                  <span>Be specific in your prompt for better results</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-teal-100 text-teal-700 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">2</span>
                  <span>Edit the generated content to personalize it</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-teal-100 text-teal-700 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">3</span>
                  <span>Use formatting tools to improve readability</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-teal-100 text-teal-700 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">4</span>
                  <span>Always review and personalize AI-generated content</span>
                </li>
              </ul>
            </motion.div>
          </motion.div>

          {/* Right Panel - Editor */}
          <motion.div variants={itemVariants} className="w-full lg:w-2/3">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Toolbar */}
              <div className="bg-gray-100 p-3 border-b border-gray-200 flex flex-wrap items-center gap-2">
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => applyFormatting('bold')}
                  className="p-2 rounded hover:bg-gray-200"
                  title="Bold"
                >
                  <IconComponent icon={AiOutlineBold} />
                </motion.button>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => applyFormatting('italic')}
                  className="p-2 rounded hover:bg-gray-200"
                  title="Italic"
                >
                  <IconComponent icon={AiOutlineItalic} />
                </motion.button>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => applyFormatting('underline')}
                  className="p-2 rounded hover:bg-gray-200"
                  title="Underline"
                >
                  <IconComponent icon={AiOutlineUnderline} />
                </motion.button>
                <div className="h-6 w-px bg-gray-300 mx-1"></div>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => applyFormatting('list-ordered')}
                  className="p-2 rounded hover:bg-gray-200"
                  title="Ordered List"
                >
                  <IconComponent icon={AiOutlineOrderedList} />
                </motion.button>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => applyFormatting('list-unordered')}
                  className="p-2 rounded hover:bg-gray-200"
                  title="Unordered List"
                >
                  <IconComponent icon={AiOutlineUnorderedList} />
                </motion.button>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => applyFormatting('highlight')}
                  className="p-2 rounded hover:bg-gray-200"
                  title="Highlight"
                >
                  <IconComponent icon={AiOutlineHighlight} />
                </motion.button>
                <div className="h-6 w-px bg-gray-300 mx-1"></div>
                <div className="flex items-center">
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => changeFontSize(-1)}
                    className="p-2 rounded hover:bg-gray-200"
                    title="Decrease font size"
                  >
                    <IconComponent icon={AiOutlineFontSize} className="text-sm" />
                  </motion.button>
                  <span className="text-sm mx-1">{fontSize}px</span>
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => changeFontSize(1)}
                    className="p-2 rounded hover:bg-gray-200"
                    title="Increase font size"
                  >
                    <IconComponent icon={AiOutlineFontSize} className="text-lg" />
                  </motion.button>
                </div>
                
                <div className="flex-grow"></div>
                
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => setShowPreview(!showPreview)}
                  className={`px-3 py-1 rounded text-sm font-medium ${showPreview ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  title="Toggle Preview"
                >
                  {showPreview ? 'Edit Mode' : 'Preview'}
                </motion.button>
                
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => setShowAIEditModal(true)}
                  className="flex items-center px-3 py-1 rounded text-sm font-medium bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700"
                >
                  <IconComponent icon={AiOutlineRobot} className="mr-2" />
                  AI Edit
                </motion.button>
              </div>

              {/* Content Panel */}
              <div className="p-6">
                {showPreview ? (
                  <div className="flex flex-col items-center">
                    <div 
                      className="min-h-[800px] w-full max-w-[650px] p-8 border border-gray-200 rounded-lg prose max-w-none bg-white shadow-md mx-auto"
                      style={{ 
                        fontSize: `${fontSize}px`,
                        height: `${pageHeight}px`,
                        overflow: 'hidden',
                        position: 'relative',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                      }}
                    >
                      <div 
                        style={{ 
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          padding: '2.5rem',
                          overflowY: 'hidden'
                        }}
                        dangerouslySetInnerHTML={{ __html: contentToHTML(getCurrentPageContent()) }}
                      />
                      
                      {/* Page number indicator */}
                      <div className="absolute bottom-4 right-4 text-gray-500 text-sm font-medium">
                        Page {currentPage} of {totalPages}
                      </div>
                    </div>
                    
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                      <div className="flex justify-center mt-6">
                        <div className="flex space-x-4 items-center">
                          <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50 flex items-center"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Previous
                          </button>
                          <span className="px-4 py-2 bg-gray-100 rounded-lg font-medium">
                            {currentPage} / {totalPages}
                          </span>
                          <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-gray-50 flex items-center"
                          >
                            Next
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    <textarea
                      ref={editorRef}
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      onFocus={handleEditorFocus}
                      placeholder="Your content will appear here after generation. You can edit it as needed."
                      className="w-full min-h-[400px] p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono resize-none"
                      style={{ fontSize: `${fontSize}px` }}
                    />
                    {/* Ask AI Button that appears when text is selected */}
                    {showAskAIButton && selectionData && (
                      <div 
                        className="fixed z-50" 
                        ref={askAIButtonRef}
                        style={{
                          pointerEvents: 'auto',
                        }}
                      >
                        <motion.button
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          onClick={handleAskAIForSelection}
                          className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-lg shadow-lg hover:from-purple-700 hover:to-indigo-800 transition-all"
                          style={{
                            minWidth: '110px',
                            minHeight: '40px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                            cursor: 'pointer',
                          }}
                        >
                          <IconComponent icon={AiOutlineRobot} className="mr-2 text-lg" />
                          <span className="font-medium">Ask AI</span>
                        </motion.button>
                      </div>
                    )}
                    {highlightedSections.map((section, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute left-0 right-0 bg-purple-100 bg-opacity-30 pointer-events-none"
                        style={{
                          top: `${section.start * 1.5}em`,
                          height: `${(section.end - section.start) * 1.5}em`
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
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
                          ? 'bg-primary text-white' 
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
                  
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    className="flex items-center text-sm px-4 py-2 bg-primary text-white hover:bg-primary-light rounded-lg ml-auto"
                  >
                    <IconComponent icon={FiSave} className="mr-2" /> Save
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* History Drawer */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              className="fixed top-0 right-0 w-full md:w-96 h-full bg-white shadow-lg z-50 overflow-y-auto"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-primary">Your Content History</h2>
                  <button 
                    onClick={() => setShowHistory(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="space-y-4">
                  {contentHistory.map((item, index) => (
                    <motion.div
                      key={index}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      className="p-4 border border-gray-200 rounded-lg hover:border-primary cursor-pointer transition-colors"
                      onClick={() => loadFromHistory(item)}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-800">{item.title}</h3>
                        <span className="text-xs text-gray-500">{item.date}</span>
                      </div>
                      <div className="mt-2">
                        <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full mb-2">
                          {templates.find(t => t.id === item.template)?.name || 'Custom'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{item.content.substring(0, 100)}...</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Edit Modal */}
        <AnimatePresence>
          {showAIEditModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl"
              >
                <h2 className="text-2xl font-bold text-primary mb-4">AI Content Editor</h2>
                <p className="text-gray-600 mb-4">
                  Describe what specific changes you want to make. For example: "Change all mentions of MIT to Stanford" or "Update the basketball reference to football"
                </p>
                
                <textarea
                  value={editInstructions}
                  onChange={(e) => setEditInstructions(e.target.value)}
                  placeholder="Example: Change all mentions of MIT to Stanford, or update the basketball reference to football..."
                  className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none mb-4"
                />
                
                {isEditing && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">
                        {editStep === 'analyzing' && 'Analyzing content and instructions...'}
                        {editStep === 'searching' && 'Identifying sections to update...'}
                        {editStep === 'updating' && 'Applying changes and checking consistency...'}
                      </span>
                      <span className="text-sm font-medium">{Math.round(editProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <motion.div
                        className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2.5 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${editProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Ask Modal */}
        <AnimatePresence>
          {showAskAIModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
              onClick={() => {
                setShowAskAIModal(false);
                setAskAIInstruction('');
              }}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold text-primary">Ask AI to Modify Text</h2>
                  <button 
                    onClick={() => {
                      setShowAskAIModal(false);
                      setAskAIInstruction('');
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <p className="text-gray-600 mb-2">Selected text:</p>
                <div className="p-3 bg-gray-100 rounded-lg mb-4 text-gray-800 max-h-32 overflow-y-auto">
                  {selectionData?.text}
                </div>
                
                <textarea
                  value={askAIInstruction}
                  onChange={(e) => setAskAIInstruction(e.target.value)}
                  placeholder="What would you like to do with this text? E.g., 'Make it more formal', 'Fix grammar', 'Simplify the language'"
                  className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none mb-4"
                  autoFocus
                />
                
                <div className="flex justify-end gap-3">
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => {
                      setShowAskAIModal(false);
                      setAskAIInstruction('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={processAskAIRequest}
                    disabled={isProcessingSelection || !askAIInstruction.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-700 text-white rounded-lg disabled:opacity-50"
                  >
                    {isProcessingSelection ? 'Processing...' : 'Apply Changes'}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export { ContentWriterComponent };
export default ContentWriterComponent;