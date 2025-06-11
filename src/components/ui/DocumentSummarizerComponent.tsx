import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AiOutlineUpload, AiOutlineFileText, AiOutlineBulb, AiOutlineHistory, AiOutlineFullscreen, AiOutlineCamera } from 'react-icons/ai';
import { FiDownload, FiCopy, FiShare2, FiClock, FiTrash2, FiEye, FiZap, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import IconComponent from './IconComponent';
import * as pdfjsLib from 'pdfjs-dist';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';
import * as echarts from 'echarts';
import { jsPDF } from 'jspdf';
import { Document, Paragraph, TextRun, Packer } from 'docx';

// Set up PDF.js worker with a more reliable approach
if (typeof window !== 'undefined') {
  try {
    // First try to use the local worker file with correct extension
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/js/pdf.worker.min.mjs';
  } catch (error) {
    try {
      // Fallback to CDN with exact version match
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    } catch (fallbackError) {
      try {
        // Try alternative CDN
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
      } catch (finalError) {
        // Final fallback - disable worker (will use main thread)
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

interface DocumentSummarizerComponentProps {
  className?: string;
}

interface SummaryHistoryItem {
  id: string;
  title: string;
  summary: string;
  mindmapData: any;
  timestamp: Date;
  sourceType: 'file' | 'text';
  fileName?: string;
  documentPages?: string[];
  pageSummaries?: PageSummary[];
  file?: File;
}

interface PageSummary {
  pageNumber: number;
  summary: string;
  isLoading: boolean;
  isComplete: boolean;
  error?: string;
}

interface MindmapNode {
  name: string;
  children?: MindmapNode[];
  value?: number;
  category?: string;
}

// Animation variants for framer-motion
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" }
  }
};

const buttonVariants = {
  hover: { scale: 1.05, transition: { duration: 0.2 } },
  tap: { scale: 0.95, transition: { duration: 0.1 } }
};

const DocumentSummarizerComponent: React.FC<DocumentSummarizerComponentProps> = ({ className = '' }) => {
  const [file, setFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [mindmapData, setMindmapData] = useState<any>(null);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [showHistory, setShowHistory] = useState(false);
  const [summaryHistory, setSummaryHistory] = useState<SummaryHistoryItem[]>([]);
  const [showMindmap, setShowMindmap] = useState(false);
  const [fullScreenView, setFullScreenView] = useState<'summary' | 'mindmap' | null>(null);
  const [isGeneratingMindmap, setIsGeneratingMindmap] = useState(false);
  const [summaryComplete, setSummaryComplete] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  
  // New states for page-by-page processing
  const [documentPages, setDocumentPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSummaries, setPageSummaries] = useState<PageSummary[]>([]);
  const [showGetSummaryButton, setShowGetSummaryButton] = useState(false);
  const [overallProcessingComplete, setOverallProcessingComplete] = useState(false);
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mindmapRef = useRef<HTMLDivElement>(null);
  const mindmapChart = useRef<echarts.ECharts | null>(null);

  // Load history from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('summaryHistory');
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }));
        setSummaryHistory(parsedHistory);
      } catch (error) {
        console.error('Error loading summary history:', error);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('summaryHistory', JSON.stringify(summaryHistory));
  }, [summaryHistory]);

  // Initialize mindmap chart with improved styling
  useEffect(() => {
    if (mindmapRef.current && mindmapData && showMindmap) {
      if (mindmapChart.current) {
        mindmapChart.current.dispose();
      }
      
      mindmapChart.current = echarts.init(mindmapRef.current);
      
      const option = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'item',
          triggerOn: 'mousemove',
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          borderColor: 'rgba(6, 182, 212, 0.5)',
          borderWidth: 1,
          textStyle: {
            color: '#e2e8f0',
            fontSize: 12
          },
          formatter: function(params: any) {
            return `<div style="padding: 8px;">
              <div style="color: #06b6d4; font-weight: bold; margin-bottom: 4px;">${params.name}</div>
              <div style="color: #94a3b8; font-size: 11px;">Click to expand/collapse</div>
            </div>`;
          }
        },
        series: [
          {
            type: 'tree',
            data: [mindmapData],
            top: '5%',
            left: '7%',
            bottom: '5%',
            right: '20%',
            symbolSize: [14, 14],
            label: {
              position: 'left',
              verticalAlign: 'middle',
              align: 'right',
              fontSize: 13,
              color: '#e2e8f0',
              fontWeight: 'bold',
              backgroundColor: 'rgba(15, 23, 42, 0.8)',
              borderColor: 'rgba(6, 182, 212, 0.3)',
              borderWidth: 1,
              borderRadius: 4,
              padding: [4, 8]
            },
            leaves: {
              label: {
                position: 'right',
                verticalAlign: 'middle',
                align: 'left',
                color: '#94a3b8',
                fontSize: 12,
                backgroundColor: 'rgba(15, 23, 42, 0.6)',
                borderColor: 'rgba(148, 163, 184, 0.2)',
                borderWidth: 1,
                borderRadius: 3,
                padding: [3, 6]
              }
            },
            emphasis: {
              focus: 'descendant',
              itemStyle: {
                color: '#0891b2',
                borderColor: '#06b6d4',
                borderWidth: 3,
                shadowBlur: 10,
                shadowColor: 'rgba(6, 182, 212, 0.5)'
              }
            },
            expandAndCollapse: true,
            animationDuration: 750,
            animationDurationUpdate: 1000,
            itemStyle: {
              color: '#06b6d4',
              borderColor: '#0891b2',
              borderWidth: 2,
              shadowBlur: 5,
              shadowColor: 'rgba(6, 182, 212, 0.3)'
            },
            lineStyle: {
              color: '#475569',
              width: 2,
              curveness: 0.3,
              shadowBlur: 3,
              shadowColor: 'rgba(71, 85, 105, 0.5)'
            }
          }
        ]
      };
      
      mindmapChart.current.setOption(option as any);
      
      // Handle resize
      const handleResize = () => {
        if (mindmapChart.current) {
          mindmapChart.current.resize();
        }
      };
      
      window.addEventListener('resize', handleResize);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        if (mindmapChart.current) {
          mindmapChart.current.dispose();
        }
      };
    }
  }, [mindmapData, showMindmap]);

  // Auto-trigger mindmap generation when summary is complete
  useEffect(() => {
    if (summaryComplete && summary && !mindmapData && !isGeneratingMindmap) {
      generateMindmapFromSummary();
    }
  }, [summaryComplete, summary, mindmapData, isGeneratingMindmap]);

  // Markdown components (same as UploadHomeworkComponent)
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
    p: ({ children }: any) => <p className="text-slate-300 mb-4 leading-relaxed">{children}</p>,
    ul: ({ children }: any) => <ul className="list-disc list-inside mb-4 text-slate-300 space-y-1">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal list-inside mb-4 text-slate-300 space-y-1">{children}</ol>,
    li: ({ children }: any) => <li className="mb-1 pl-2">{children}</li>,
    strong: ({ children }: any) => <strong className="font-bold text-cyan-400 bg-cyan-500/10 px-1 rounded">{children}</strong>,
  };

  // Preprocess LaTeX for react-markdown
  const preprocessLaTeX = (content: string) => {
    return content
      .replace(/\\\[(.*?)\\\]/g, (_, eq) => `$$${eq}$$`)
      .replace(/\\\((.*?)\\\)/g, (_, eq) => `$${eq}$`);
  };

  // Extract text from PDF
  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }
    
    return fullText;
  };

  // Improved summarize text with live streaming
  const summarizeText = async (text: string): Promise<string> => {
    const requestPayload = {
      model: "qwen-vl-max",
      messages: [
        {
          role: "system",
          content: [
            {
              type: "text", 
              text: "You are an expert document summarization assistant. Create comprehensive, well-structured summaries that capture key points, main ideas, and important details. Use clear markdown formatting with headers, bullet points, numbered lists, and proper structure. Make the summary engaging and easy to read."
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Please create a comprehensive and well-formatted summary of the following text. Structure your summary with:

## 📋 Executive Summary
Brief overview of the main topic and key findings

## 🎯 Key Points
- Main ideas and concepts
- Important details and facts
- Critical insights

## 📊 Detailed Analysis
More in-depth breakdown of the content with subsections as needed

## 💡 Key Takeaways
- Summary of implications
- Important conclusions
- Actionable insights

**Text to summarize:**
${text}

Please provide a well-structured, informative summary using proper markdown formatting with emojis and clear sections.`
            }
          ]
        }
      ],
      stream: true
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

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body reader available');
    }

    let fullContent = '';
    setStreamingText('');

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
                setStreamingText(fullContent);
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

    setSummary(fullContent.trim());
    setSummaryComplete(true);
    return fullContent.trim();
  };

  // Generate mindmap data from summary using XML format
  const generateMindmapFromSummary = async () => {
    if (!summary || isGeneratingMindmap) return;
    
    setIsGeneratingMindmap(true);
    setProcessingStatus('🧠 Creating key points structure...');

    try {
      // First, generate key points in XML format
      const xmlRequestPayload = {
        model: "qwen-vl-max",
        messages: [
          {
            role: "system",
            content: [
              {
                type: "text", 
                text: "You are an expert content structuring assistant. Convert document summaries into hierarchical XML structures with headings, sub-headings, and sub-sub-headings. Create a clear, logical hierarchy that represents the document's key points and structure."
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Please analyze the following document summary and create a hierarchical XML structure with key points organized as:
- Main headings (level 1)
- Sub headings (level 2) 
- Sub sub headings (level 3)

Return ONLY the XML structure in this exact format:

<document>
  <heading level="1" title="Main Topic 1">
    <heading level="2" title="Subtopic 1.1">
      <heading level="3" title="Key Point 1.1.1"/>
      <heading level="3" title="Key Point 1.1.2"/>
    </heading>
    <heading level="2" title="Subtopic 1.2">
      <heading level="3" title="Key Point 1.2.1"/>
    </heading>
  </heading>
  <heading level="1" title="Main Topic 2">
    <heading level="2" title="Subtopic 2.1">
      <heading level="3" title="Key Point 2.1.1"/>
      <heading level="3" title="Key Point 2.1.2"/>
    </heading>
  </heading>
</document>

Document Summary to Structure:
${summary}

Return only the XML structure, no additional text or explanation.`
              }
            ]
          }
        ],
        stream: false
      };

      setProcessingStatus('🔍 Analyzing document structure...');

      const xmlResponse = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer sk-0d874843ff2542c38940adcbeb2b2cc4',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(xmlRequestPayload)
      });

      if (!xmlResponse.ok) {
        throw new Error(`XML API request failed: ${xmlResponse.status} ${xmlResponse.statusText}`);
      }

      const xmlData = await xmlResponse.json();
      const xmlContent = xmlData.choices?.[0]?.message?.content || '';
      
      setProcessingStatus('🗂️ Converting to interactive mindmap...');

      // Now convert the XML structure to mindmap JSON
      const mindmapRequestPayload = {
        model: "qwen-vl-max",
        messages: [
          {
            role: "system",
            content: [
              {
                type: "text", 
                text: "You are a mindmap data converter. Convert XML hierarchical structures into JSON format suitable for interactive tree visualization. Create a well-structured tree with proper nesting and clear relationships."
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Convert the following XML structure into a hierarchical JSON mindmap format. Return ONLY valid JSON in this exact format:

{
  "name": "Document Overview",
  "children": [
    {
      "name": "Main Topic 1",
      "children": [
        {
          "name": "Subtopic 1.1",
          "children": [
            {"name": "Key Point 1.1.1"},
            {"name": "Key Point 1.1.2"}
          ]
        },
        {
          "name": "Subtopic 1.2",
          "children": [
            {"name": "Key Point 1.2.1"}
          ]
        }
      ]
    },
    {
      "name": "Main Topic 2",
      "children": [
        {
          "name": "Subtopic 2.1",
          "children": [
            {"name": "Key Point 2.1.1"},
            {"name": "Key Point 2.1.2"}
          ]
        }
      ]
    }
  ]
}

XML Structure to Convert:
${xmlContent}

Return only the JSON structure, no additional text or explanation.`
              }
            ]
          }
        ],
        stream: false
      };

      const mindmapResponse = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer sk-0d874843ff2542c38940adcbeb2b2cc4',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mindmapRequestPayload)
      });

      if (!mindmapResponse.ok) {
        throw new Error(`Mindmap API request failed: ${mindmapResponse.status} ${mindmapResponse.statusText}`);
      }

      const mindmapData = await mindmapResponse.json();
      const mindmapText = mindmapData.choices?.[0]?.message?.content || '';
      
      try {
        const jsonMatch = mindmapText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedData = JSON.parse(jsonMatch[0]);
          setMindmapData(parsedData);
          setProcessingStatus('✅ Interactive mindmap generated successfully!');
        } else {
          throw new Error('No valid JSON found in mindmap response');
        }
      } catch (error) {
        console.error('Error parsing mindmap JSON:', error);
        
        // Enhanced fallback structure based on summary content
        const summaryLines = summary.split('\n').filter(line => line.trim());
        const headings = summaryLines.filter(line => line.startsWith('#'));
        
        let fallbackData;
        
        if (headings.length > 0) {
          // Create structure based on actual headings from summary
          const children = headings.slice(0, 6).map((heading, index) => {
            const cleanHeading = heading.replace(/^#+\s*/, '').replace(/[📋🎯📊🔍💡✨]/g, '').trim();
            return {
              name: cleanHeading || `Section ${index + 1}`,
              children: [
                { name: "Key Concept" },
                { name: "Important Details" },
                { name: "Main Insights" }
              ]
            };
          });
          
          fallbackData = {
            name: file?.name?.replace(/\.[^/.]+$/, '') || "Document Summary",
            children: children
          };
        } else {
          // Default fallback structure
          fallbackData = {
            name: file?.name?.replace(/\.[^/.]+$/, '') || "Document Summary",
            children: [
              {
                name: "Executive Summary",
                children: [
                  { name: "Main Purpose" },
                  { name: "Key Findings" },
                  { name: "Primary Objectives" }
                ]
              },
              {
                name: "Key Points",
                children: [
                  { name: "Important Concept 1" },
                  { name: "Important Concept 2" },
                  { name: "Critical Insights" }
                ]
              },
              {
                name: "Analysis",
                children: [
                  { name: "Detailed Breakdown" },
                  { name: "Supporting Evidence" },
                  { name: "Implications" }
                ]
              },
              {
                name: "Conclusions",
                children: [
                  { name: "Key Takeaways" },
                  { name: "Recommendations" },
                  { name: "Next Steps" }
                ]
              }
            ]
          };
        }
        
        setMindmapData(fallbackData);
        setProcessingStatus('⚠️ Using enhanced fallback mindmap structure');
      }
    } catch (error) {
      console.error('Error generating mindmap:', error);
      setProcessingStatus('❌ Error generating mindmap');
      
      // Fallback mindmap based on document type
      const fallbackData = {
        name: file?.name?.replace(/\.[^/.]+$/, '') || "Document Analysis",
        children: [
          {
            name: "Document Overview",
            children: [
              { name: "Main Topic" },
              { name: "Document Type" },
              { name: "Key Purpose" }
            ]
          },
          {
            name: "Content Analysis",
            children: [
              { name: "Primary Themes" },
              { name: "Important Data" },
              { name: "Key Arguments" }
            ]
          },
          {
            name: "Insights",
            children: [
              { name: "Main Conclusions" },
              { name: "Critical Points" },
              { name: "Implications" }
            ]
          }
        ]
      };
      setMindmapData(fallbackData);
    } finally {
      setIsGeneratingMindmap(false);
      setTimeout(() => setProcessingStatus(''), 3000);
    }
  };

  // Add to history with enhanced data structure
  const addToHistory = (title: string, summary: string, mindmapData: any, sourceType: 'file' | 'text', fileName?: string, documentPages?: string[], pageSummaries?: PageSummary[], originalFile?: File) => {
    const newItem: SummaryHistoryItem = {
      id: Date.now().toString(),
      title,
      summary,
      mindmapData,
      timestamp: new Date(),
      sourceType,
      fileName,
      documentPages,
      pageSummaries,
      file: originalFile
    };
    setSummaryHistory(prev => [newItem, ...prev.slice(0, 19)]);
  };

  // Load from history with enhanced restoration
  const loadFromHistory = (item: SummaryHistoryItem) => {
    setSummary(item.summary);
    setMindmapData(item.mindmapData);
    setShowHistory(false);
    setShowMindmap(false);
    setSummaryComplete(true);
    
    // Restore document pages and page summaries if available
    if (item.documentPages && item.documentPages.length > 0) {
      setDocumentPages(item.documentPages);
      setCurrentPage(0);
      setShowGetSummaryButton(true);
      
      if (item.pageSummaries) {
        setPageSummaries(item.pageSummaries);
      }
    } else {
      setDocumentPages([]);
      setPageSummaries([]);
      setShowGetSummaryButton(false);
    }
    
    // Clear file state since we're loading from history
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Convert PDF to images for page-by-page processing
  const convertPdfToImages = async (file: File): Promise<string[]> => {
    let retryCount = 0;
    const maxRetries = 2;
    
    while (retryCount <= maxRetries) {
      try {
        setProcessingStatus(retryCount > 0 ? `Retrying PDF conversion (attempt ${retryCount + 1})...` : 'Loading PDF...');
        
        const arrayBuffer = await file.arrayBuffer();
        
        // Enhanced PDF.js configuration for better compatibility
        const loadingTask = pdfjsLib.getDocument({
          data: arrayBuffer,
          useWorkerFetch: false,
          isEvalSupported: false,
          useSystemFonts: true,
          // Add compatibility options
          verbosity: 0, // Reduce console output
          cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
          // Disable problematic features for compatibility
          disableFontFace: false,
          disableRange: false,
          disableStream: false,
          disableAutoFetch: false
        });
        
        const pdf = await loadingTask.promise as PDFDocumentProxy;
        const images: string[] = [];
        
        setProcessingStatus(`Converting ${pdf.numPages} pages to images...`);
        
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          setProcessingStatus(`Converting page ${pageNum} of ${pdf.numPages}...`);
          
          try {
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale: 2.0 });
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            if (!context) {
              throw new Error('Could not get canvas context');
            }
            
            const renderContext = {
              canvasContext: context,
              viewport: viewport,
              // Add rendering options for better compatibility
              intent: 'display',
              enableWebGL: false,
              renderInteractiveForms: false,
              transform: null,
              background: 'white'
            };
            
            await page.render(renderContext).promise;
            
            const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
            images.push(imageDataUrl);
            
            // Clean up page resources - removed page.cleanup() as it's not available in current version
          } catch (pageError) {
            console.error(`Error processing page ${pageNum}:`, pageError);
            // Continue with other pages even if one fails
            setProcessingStatus(`Warning: Could not process page ${pageNum}, continuing...`);
          }
        }
        
        if (images.length === 0) {
          throw new Error('No pages could be processed from the PDF');
        }
        
        setProcessingStatus(`PDF conversion completed! Processed ${images.length} pages.`);
        return images;
        
      } catch (error) {
        console.error(`PDF conversion error (attempt ${retryCount + 1}):`, error);
        
        // Check if it's a worker version mismatch error
        if (error instanceof Error && (error.message.includes('API version') || error.message.includes('Worker version'))) {
          if (retryCount < maxRetries) {
            // Try to fix worker configuration and retry
            try {
              pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
              retryCount++;
              continue;
            } catch (workerError) {
              // Disable worker and retry
              pdfjsLib.GlobalWorkerOptions.workerSrc = '';
              retryCount++;
              continue;
            }
          }
        }
        
        // If we've exhausted retries or it's a different error
        let errorMessage = 'Error converting PDF';
        if (error instanceof Error) {
          if (error.message.includes('API version') || error.message.includes('Worker version')) {
            errorMessage = 'PDF.js version compatibility issue. Please refresh the page and try again.';
          } else if (error.message.includes('Invalid PDF')) {
            errorMessage = 'Invalid or corrupted PDF file. Please try a different file.';
          } else if (error.message.includes('Password')) {
            errorMessage = 'Password-protected PDFs are not supported. Please use an unprotected PDF.';
          } else {
            errorMessage = `PDF processing error: ${error.message}`;
          }
        }
        
        setProcessingStatus(errorMessage);
        throw new Error(errorMessage);
      }
    }
    
    // This should never be reached, but just in case
    throw new Error('PDF conversion failed after all retry attempts');
  };

  // Process file for page-by-page summarization
  const processFile = async (file: File) => {
    setLoading(true);
    setProcessingStatus('Loading file for preview...');
    setSummary('');
    setPageSummaries([]);
    setOverallProcessingComplete(false);
    
    try {
      let imageUrls: string[] = [];
      
      if (file.type === 'application/pdf') {
        imageUrls = await convertPdfToImages(file);
      } else if (file.type.startsWith('image/')) {
        setProcessingStatus('Loading image...');
        
        const imageDataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        
        imageUrls = [imageDataUrl];
      } else if (file.type.startsWith('text/') || file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // For text files, read content directly
        const text = await file.text();
        setTextInput(text);
        setProcessingStatus('Text file loaded successfully! You can now click "Generate Summary" to summarize.');
        setShowGetSummaryButton(false); // For text files, use direct summarization
        return;
      } else {
        throw new Error('Unsupported file type. Please upload a PDF, image, or text file.');
      }
      
      setDocumentPages(imageUrls);
      setCurrentPage(0);
      setShowGetSummaryButton(true);
      setProcessingStatus('File loaded successfully! You can now add additional context or click "Generate Summary" to summarize.');
      
    } catch (error) {
      setProcessingStatus('Error loading file');
      console.error('File processing error:', error);
    } finally {
      setLoading(false);
      setTimeout(() => setProcessingStatus(''), 3000);
    }
  };

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      await processFile(selectedFile);
    }
  };

  // Handle file removal
  const handleRemoveFile = () => {
    setFile(null);
    setDocumentPages([]);
    setCurrentPage(0);
    setSummary('');
    setPageSummaries([]);
    setShowGetSummaryButton(false);
    setOverallProcessingComplete(false);
    setMindmapData(null);
    setShowMindmap(false);
    setSummaryComplete(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle text-only summarization
  const handleSummarize = async () => {
    if (!textInput.trim() || loading) return;
    
    setLoading(true);
    setSummaryComplete(false);
    setProcessingStatus('🚀 Analyzing text...');
    setSummary('');
    setStreamingText('');
    setMindmapData(null);
    setShowMindmap(false);
    
    try {
      await summarizeText(textInput);
    } catch (error) {
      console.error('Error generating summary:', error);
      setSummary(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setProcessingStatus('❌ Error generating summary');
      setSummaryComplete(false);
    } finally {
      setLoading(false);
    }
  };

  // Summarize individual page content
  const summarizePageContent = async (pageImage: string, pageNumber: number): Promise<string> => {
    const requestPayload = {
      model: "qwen-vl-max",
      messages: [
        {
          role: "system",
          content: [
            {
              type: "text", 
              text: "You are an expert document analysis assistant. Analyze the provided page image and create a comprehensive summary of its content. Focus on extracting key information, main concepts, important details, and any structured data. Use clear markdown formatting."
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: pageImage
              }
            },
            {
              type: "text",
              text: `Please analyze this document page (Page ${pageNumber}) and provide a comprehensive summary. Include:

## 📄 Page ${pageNumber} Summary

### 🎯 Main Content
- Key topics and concepts
- Important information and data
- Main arguments or points

### 📊 Details
- Specific facts, figures, or statistics
- Important names, dates, or references
- Any structured information (tables, lists, etc.)

### 💡 Key Insights
- Important conclusions or takeaways
- Critical information for understanding

Please provide a well-structured summary using proper markdown formatting.`
            }
          ]
        }
      ],
      stream: true
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
                
                // Update the specific page summary in real-time
                setPageSummaries(prev => prev.map(ps => 
                  ps.pageNumber === pageNumber 
                    ? { ...ps, summary: fullContent }
                    : ps
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

    return fullContent.trim();
  };

  // Handle comprehensive document summarization with page-by-page processing
  const handleGetSummary = async () => {
    if ((!documentPages.length && !textInput.trim()) || loading) return;
    
    setLoading(true);
    setSummaryComplete(false);
    setProcessingStatus('🚀 Starting document analysis...');
    setSummary('');
    setStreamingText('');
    setMindmapData(null);
    setShowMindmap(false);
    
    try {
      // If we have document pages, process them page by page
      if (documentPages.length > 0) {
        // Initialize page summaries
        const initialPageSummaries: PageSummary[] = documentPages.map((_, index) => ({
          pageNumber: index + 1,
          summary: '',
          isLoading: true,
          isComplete: false
        }));
        setPageSummaries(initialPageSummaries);
        
        setProcessingStatus(`📄 Processing ${documentPages.length} pages in parallel...`);
        
        // Process all pages in parallel
        const pagePromises = documentPages.map(async (pageImage, index) => {
          const pageNumber = index + 1;
          
          try {
            setProcessingStatus(`🔍 Analyzing page ${pageNumber}...`);
            const pageSummary = await summarizePageContent(pageImage, pageNumber);
            
            // Update page summary as complete
            setPageSummaries(prev => prev.map(ps => 
              ps.pageNumber === pageNumber 
                ? { ...ps, summary: pageSummary, isLoading: false, isComplete: true }
                : ps
            ));
            
            return { pageNumber, summary: pageSummary };
          } catch (error) {
            console.error(`Error processing page ${pageNumber}:`, error);
            
            // Mark page as error
            setPageSummaries(prev => prev.map(ps => 
              ps.pageNumber === pageNumber 
                ? { ...ps, isLoading: false, isComplete: false, error: error instanceof Error ? error.message : 'Unknown error' }
                : ps
            ));
            
            return { pageNumber, summary: `Error processing page ${pageNumber}: ${error instanceof Error ? error.message : 'Unknown error'}` };
          }
        });
        
        // Wait for all pages to complete
        const pageResults = await Promise.all(pagePromises);
        
        setProcessingStatus('📝 Generating comprehensive summary...');
        
        // Generate comprehensive summary from all page summaries
        const allPageSummaries = pageResults.map(result => result.summary).join('\n\n');
        const contextText = textInput.trim() ? `\n\nAdditional Context:\n${textInput}` : '';
        const fullText = allPageSummaries + contextText;
        
        await generateComprehensiveSummary(fullText, file?.name || 'Document');
        
      } else if (textInput.trim()) {
        // Process text-only input
        await summarizeText(textInput);
      }
      
    } catch (error) {
      console.error('Error in document processing:', error);
      setSummary(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setProcessingStatus('❌ Error processing document');
      setSummaryComplete(false);
    } finally {
      setLoading(false);
    }
  };

  // Generate comprehensive summary from all page summaries
  const generateComprehensiveSummary = async (allPageContent: string, documentTitle: string) => {
    const requestPayload = {
      model: "qwen-vl-max",
      messages: [
        {
          role: "system",
          content: [
            {
              type: "text", 
              text: "You are an expert document summarization assistant. Create a comprehensive, well-structured summary that synthesizes information from multiple pages of a document. Focus on creating a cohesive narrative that captures the document's main themes, key insights, and important details while maintaining logical flow and structure."
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Please create a comprehensive summary of this document by synthesizing the page-by-page analysis provided below. Structure your summary as follows:

## 📋 Executive Summary
Brief overview of the document's main purpose and key findings

## 🎯 Key Themes & Topics
Main themes and topics covered throughout the document

## 📊 Important Information
- Critical facts, data, and insights
- Key arguments and conclusions
- Important references or citations

## 🔍 Detailed Analysis
More in-depth breakdown of the content with subsections as needed

## 💡 Key Takeaways
- Summary of main conclusions
- Important implications
- Actionable insights

**Document Title:** ${documentTitle}

**Page-by-page content to synthesize:**
${allPageContent}

Please provide a well-structured, comprehensive summary that creates a cohesive understanding of the entire document.`
            }
          ]
        }
      ],
      stream: true
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

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body reader available');
    }

    let fullContent = '';
    setStreamingText('');

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
                setStreamingText(fullContent);
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

    setSummary(fullContent.trim());
    setSummaryComplete(true);
    setProcessingStatus('✅ Comprehensive summary generated!');
    
    // Add to history with enhanced data
    if (fullContent.trim()) {
      addToHistory(
        documentTitle || 'Document Summary',
        fullContent.trim(),
        null, // mindmap will be generated automatically
        'file',
        file?.name,
        documentPages,
        pageSummaries,
        file || undefined
      );
    }
    
    return fullContent.trim();
  };

  // Download content in different formats
  const handleDownloadContent = (format: 'txt' | 'pdf' | 'doc') => {
    const content = summary || streamingText;
    if (!content) return;

    const fileName = file ? file.name.replace(/\.[^/.]+$/, '') : 'document-summary';
    
    switch (format) {
      case 'txt':
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}-summary.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        break;
        
      case 'pdf':
        const pdf = new jsPDF();
        const lines = content.split('\n');
        let yPosition = 20;
        
        lines.forEach(line => {
          if (yPosition > 280) {
            pdf.addPage();
            yPosition = 20;
          }
          pdf.text(line, 10, yPosition);
          yPosition += 7;
        });
        
        pdf.save(`${fileName}-summary.pdf`);
        break;
        
      case 'doc':
        const doc = new Document({
          sections: [{
            properties: {},
            children: content.split('\n').map(line => 
              new Paragraph({
                children: [new TextRun(line)]
              })
            )
          }]
        });
        
        Packer.toBlob(doc).then(blob => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${fileName}-summary.docx`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        });
        break;
    }
    
    setShowDownloadOptions(false);
  };

  // Copy content to clipboard
  const handleCopyContent = () => {
    const content = summary || streamingText;
    navigator.clipboard.writeText(content).then(() => {
      setProcessingStatus('✅ Summary copied to clipboard!');
      setTimeout(() => setProcessingStatus(''), 2000);
    });
  };

  // Share content
  const handleShareContent = () => {
    const content = summary || streamingText;
    if (navigator.share) {
      navigator.share({
        title: 'Document Summary',
        text: content,
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(content);
      setProcessingStatus('✅ Summary copied to clipboard for sharing!');
      setTimeout(() => setProcessingStatus(''), 2000);
    }
  };

  // Clear all data
  const handleClear = () => {
    setFile(null);
    setTextInput('');
    setSummary('');
    setStreamingText('');
    setMindmapData(null);
    setShowMindmap(false);
    setSummaryComplete(false);
    setIsGeneratingMindmap(false);
    setDocumentPages([]);
    setCurrentPage(0);
    setPageSummaries([]);
    setShowGetSummaryButton(false);
    setOverallProcessingComplete(false);
    setShowDownloadOptions(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={className}>
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
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
        {/* Input Section - Enhanced UI */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg">
              <IconComponent icon={AiOutlineBulb} className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-cyan-400">Document Summarizer</h2>
          </div>
          
          {/* Enhanced File Upload */}
          <div className="mb-6">
            <label className="block text-slate-300 mb-3 font-medium flex items-center">
              <IconComponent icon={AiOutlineUpload} className="h-5 w-5 mr-2 text-cyan-400" />
              Upload Document
            </label>
            <div 
              className="border-2 border-dashed border-cyan-500/30 rounded-xl p-8 text-center hover:border-cyan-400/50 cursor-pointer transition-all duration-300 relative bg-gradient-to-br from-slate-600/20 to-slate-700/20 backdrop-blur-sm hover:from-slate-600/30 hover:to-slate-700/30"
              onClick={() => !file && fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,.txt,.doc,.docx,image/*"
              />
              {file ? (
                <div className="text-slate-300 relative">
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveFile();
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-lg"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                  <div className="bg-cyan-500/10 rounded-lg p-4 border border-cyan-500/20">
                    <IconComponent icon={AiOutlineFileText} className="h-10 w-10 mx-auto mb-3 text-cyan-400" />
                    <p className="font-medium text-cyan-300">{file.name}</p>
                    <p className="text-sm text-slate-400 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    {documentPages.length > 0 && (
                      <p className="text-sm text-cyan-300 mt-2">{documentPages.length} pages loaded</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-slate-400">
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <IconComponent icon={AiOutlineUpload} className="h-12 w-12 mx-auto mb-4 text-cyan-400" />
                  </motion.div>
                  <p className="text-lg font-medium text-slate-300 mb-2">Drag and drop your document here</p>
                  <p className="text-sm">or click to browse</p>
                  <div className="flex items-center justify-center space-x-4 mt-4 text-xs text-slate-500">
                    <span className="bg-slate-600/50 px-2 py-1 rounded">PDF</span>
                    <span className="bg-slate-600/50 px-2 py-1 rounded">Images</span>
                    <span className="bg-slate-600/50 px-2 py-1 rounded">TXT</span>
                    <span className="bg-slate-600/50 px-2 py-1 rounded">DOC</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Document Preview with Page Navigation */}
          {documentPages.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-slate-300 font-medium flex items-center">
                  <IconComponent icon={FiEye} className="h-5 w-5 mr-2 text-cyan-400" />
                  Document Preview
                </label>
                <div className="flex items-center space-x-2">
                  <motion.button
                    onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                    className="p-2 bg-slate-600/40 rounded-lg text-slate-300 hover:bg-slate-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <IconComponent icon={FiChevronLeft} className="h-4 w-4" />
                  </motion.button>
                  <span className="text-sm text-slate-300 px-3 py-1 bg-slate-600/30 rounded-lg">
                    {currentPage + 1} / {documentPages.length}
                  </span>
                  <motion.button
                    onClick={() => setCurrentPage(Math.min(documentPages.length - 1, currentPage + 1))}
                    disabled={currentPage === documentPages.length - 1}
                    className="p-2 bg-slate-600/40 rounded-lg text-slate-300 hover:bg-slate-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <IconComponent icon={FiChevronRight} className="h-4 w-4" />
                  </motion.button>
                </div>
              </div>
              <div className="bg-slate-600/20 rounded-xl p-4 border border-cyan-500/20">
                <img 
                  src={documentPages[currentPage]} 
                  alt={`Page ${currentPage + 1}`}
                  className="w-full h-auto max-h-96 object-contain rounded-lg shadow-lg"
                />
              </div>
            </div>
          )}

          {/* Enhanced Text Input */}
          <div className="mb-6">
            <label className="block text-slate-300 mb-3 font-medium flex items-center">
              <IconComponent icon={AiOutlineFileText} className="h-5 w-5 mr-2 text-cyan-400" />
              {documentPages.length > 0 ? 'Additional Context (Optional)' : 'Or paste your text here'}
            </label>
            <div className="relative">
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="w-full p-4 bg-slate-600/30 backdrop-blur-sm border border-cyan-500/20 rounded-xl focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none h-64 text-slate-200 placeholder-slate-400 transition-all duration-300"
                placeholder={documentPages.length > 0 ? 
                  "Add any additional context or specific questions about the document..." : 
                  "Paste your text content here for summarization..."
                }
              />
              <div className="absolute bottom-3 right-3 text-xs text-slate-500">
                {textInput.length} characters
              </div>
            </div>
          </div>

          {/* Enhanced Action Buttons */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-3">
              <motion.button
                type="button"
                className="flex items-center justify-center px-4 py-2 bg-slate-600/40 backdrop-blur-sm border border-slate-500/30 rounded-lg text-slate-300 font-medium hover:bg-slate-500/40 transition-all duration-300"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => setShowHistory(!showHistory)}
              >
                <IconComponent icon={AiOutlineHistory} className="h-5 w-5 mr-2" />
                History ({summaryHistory.length})
              </motion.button>
              
              <motion.button
                type="button"
                className="flex items-center justify-center px-4 py-2 bg-red-600/40 backdrop-blur-sm border border-red-500/30 rounded-lg text-red-300 font-medium hover:bg-red-500/40 transition-all duration-300"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={handleRemoveFile}
              >
                <IconComponent icon={FiTrash2} className="h-5 w-5 mr-2" />
                Clear
              </motion.button>
            </div>
            
            {/* Conditional Action Button */}
            {showGetSummaryButton ? (
              <motion.button
                type="button"
                className="flex items-center justify-center px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={handleGetSummary}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <motion.div
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    Processing...
                  </>
                ) : (
                  <>
                    <IconComponent icon={FiZap} className="h-5 w-5 mr-2" />
                    Generate Summary
                  </>
                )}
              </motion.button>
            ) : (
              <motion.button
                type="button"
                className="flex items-center justify-center px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={handleGetSummary}
                disabled={loading || !textInput.trim()}
              >
                {loading ? (
                  <>
                    <motion.div
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    Processing...
                  </>
                ) : (
                  <>
                    <IconComponent icon={FiZap} className="h-5 w-5 mr-2" />
                    Generate Summary
                  </>
                )}
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Enhanced Results Section */}
        <motion.div variants={itemVariants}>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                <IconComponent icon={AiOutlineBulb} className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-cyan-400">Results</h2>
            </div>
            <div className="flex items-center space-x-3">
              {/* Show mindmap button only when summary is complete and mindmap is generated */}
              {summaryComplete && mindmapData && (
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => setShowMindmap(!showMindmap)}
                  className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-medium shadow-lg transition-all duration-300"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <IconComponent icon={FiEye} className="h-4 w-4 mr-2" />
                  {showMindmap ? 'Show Summary' : 'Show Mindmap'}
                </motion.button>
              )}
              
              {(summary || streamingText) && (
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => setFullScreenView(showMindmap ? 'mindmap' : 'summary')}
                  className="flex items-center text-cyan-400 font-medium hover:text-cyan-300 transition-colors"
                >
                  <IconComponent icon={AiOutlineFullscreen} className="h-5 w-5 mr-1" />
                  Fullscreen
                </motion.button>
              )}
            </div>
          </div>
          
          <motion.div
            className="bg-gradient-to-br from-slate-600/20 to-slate-700/20 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6 overflow-y-auto h-[500px] shadow-xl"
            variants={itemVariants}
          >
            {loading && !streamingText && pageSummaries.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-300">
                <motion.div
                  className="w-20 h-20 border-4 border-cyan-500 border-t-transparent rounded-full mb-6"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <motion.p 
                  className="text-center text-slate-300 text-lg font-medium"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {processingStatus || 'Processing document...'}
                </motion.p>
              </div>
            ) : pageSummaries.length > 0 && !showMindmap ? (
              // Show page-by-page summaries
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-cyan-400">Page-by-Page Analysis</h3>
                  <span className="text-sm text-slate-400">
                    {pageSummaries.filter(ps => ps.isComplete).length} / {pageSummaries.length} completed
                  </span>
                </div>
                
                {pageSummaries.map((pageSummary, index) => (
                  <motion.div
                    key={pageSummary.pageNumber}
                    className="bg-slate-600/30 rounded-lg p-4 border border-cyan-500/20"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-md font-semibold text-cyan-300 flex items-center">
                        <IconComponent icon={AiOutlineFileText} className="h-4 w-4 mr-2" />
                        Page {pageSummary.pageNumber}
                      </h4>
                      {pageSummary.isLoading ? (
                        <div className="flex items-center text-sm text-slate-400">
                          <motion.div
                            className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full mr-2"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          Processing...
                        </div>
                      ) : pageSummary.error ? (
                        <span className="text-sm text-red-400">Error</span>
                      ) : (
                        <span className="text-sm text-green-400">✓ Complete</span>
                      )}
                    </div>
                    
                    {pageSummary.summary && (
                      <div className="prose prose-sm max-w-none prose-headings:text-cyan-400 prose-p:text-slate-300 prose-strong:text-slate-200">
                        <ReactMarkdown
                          remarkPlugins={[remarkMath, remarkGfm]}
                          rehypePlugins={[rehypeKatex]}
                          components={markdownComponents}
                        >
                          {preprocessLaTeX(pageSummary.summary)}
                        </ReactMarkdown>
                      </div>
                    )}
                  </motion.div>
                ))}
                
                {/* Show comprehensive summary when available */}
                {(summary || streamingText) && (
                  <motion.div
                    className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-6 border border-purple-500/30 mt-8"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="flex items-center mb-4">
                      <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg mr-3">
                        <IconComponent icon={AiOutlineBulb} className="h-5 w-5 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-purple-400">Comprehensive Summary</h3>
                      {loading && streamingText && (
                        <motion.div 
                          className="inline-block w-2 h-5 bg-purple-400 ml-3"
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 1, repeat: Infinity }}
                        />
                      )}
                    </div>
                    
                    <div className="prose prose-lg max-w-none prose-headings:text-purple-400 prose-p:text-slate-300 prose-strong:text-slate-200">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath, remarkGfm]}
                        rehypePlugins={[rehypeKatex]}
                        components={markdownComponents}
                      >
                        {preprocessLaTeX(summary || streamingText)}
                      </ReactMarkdown>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : showMindmap && mindmapData ? (
              <div className="h-full">
                <div ref={mindmapRef} className="w-full h-full rounded-lg" />
              </div>
            ) : (summary || streamingText) ? (
              <div className="relative">
                {/* Show streaming status at the top when loading */}
                {loading && streamingText && (
                  <div className="mb-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg flex items-center">
                    <motion.div
                      className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full mr-3"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                    <span className="text-cyan-300 text-sm font-medium">
                      {processingStatus || '🚀 Generating summary in real-time...'}
                    </span>
                  </div>
                )}
                
                <div
                  className="prose prose-lg max-w-none
                    prose-headings:text-cyan-400 
                    prose-p:text-slate-300 prose-p:leading-relaxed
                    prose-strong:text-slate-200 prose-strong:font-bold
                    prose-ul:space-y-1 prose-ol:space-y-1
                    prose-li:marker:text-cyan-400 prose-li:text-slate-300"
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkMath, remarkGfm]}
                    rehypePlugins={[rehypeKatex]}
                    components={markdownComponents}
                  >
                    {preprocessLaTeX(summary || streamingText)}
                  </ReactMarkdown>
                  {/* Show streaming cursor indicator */}
                  {loading && streamingText && (
                    <motion.div 
                      className="inline-block w-2 h-5 bg-cyan-400 ml-1"
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <IconComponent icon={AiOutlineBulb} className="h-16 w-16 mb-4 opacity-50 text-cyan-400" />
                </motion.div>
                <p className="text-center text-lg font-medium text-slate-300 mb-2">Ready to Summarize</p>
                <p className="text-center text-sm">Your document summary will appear here after processing.</p>
              </div>
            )}
          </motion.div>

          {/* Enhanced Action Buttons for Summary */}
          {(summary || streamingText || pageSummaries.some(ps => ps.isComplete)) && (
            <motion.div 
              className="mt-6 flex flex-wrap gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={handleCopyContent}
                className="flex items-center text-sm px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-lg text-white font-medium shadow-lg transition-all duration-300"
              >
                <IconComponent icon={FiCopy} className="mr-2" /> Copy Summary
              </motion.button>
              
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={handleShareContent}
                className="flex items-center text-sm px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 rounded-lg text-white font-medium shadow-lg transition-all duration-300"
              >
                <IconComponent icon={FiShare2} className="mr-2" /> Share
              </motion.button>

              <div className="relative">
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => setShowDownloadOptions(!showDownloadOptions)}
                  className="flex items-center text-sm px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-white font-medium shadow-lg transition-all duration-300"
                >
                  <IconComponent icon={FiDownload} className="mr-2" /> Download
                </motion.button>
                
                <AnimatePresence>
                  {showDownloadOptions && (
                    <motion.div
                      className="absolute top-full left-0 mt-2 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-10"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <button
                        onClick={() => handleDownloadContent('txt')}
                        className="block w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-600 rounded-t-lg transition-colors"
                      >
                        Download as TXT
                      </button>
                      <button
                        onClick={() => handleDownloadContent('pdf')}
                        className="block w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-600 transition-colors"
                      >
                        Download as PDF
                      </button>
                      <button
                        onClick={() => handleDownloadContent('doc')}
                        className="block w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-600 rounded-b-lg transition-colors"
                      >
                        Download as DOCX
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Processing status indicator */}
              {(isGeneratingMindmap || processingStatus) && (
                <div className="flex items-center text-sm px-4 py-2 bg-slate-600/40 rounded-lg text-slate-300">
                  {isGeneratingMindmap && (
                    <motion.div
                      className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full mr-2"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                  {processingStatus}
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* Enhanced History Panel */}
      <AnimatePresence>
        {showHistory && (
          <motion.div 
            className="mt-8 bg-gradient-to-br from-slate-600/20 to-slate-700/20 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6 shadow-xl"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg">
                  <IconComponent icon={AiOutlineHistory} className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-cyan-400">Summary History</h3>
                <span className="bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full text-sm font-medium">
                  {summaryHistory.length} items
                </span>
              </div>
              <motion.button
                onClick={() => setShowHistory(false)}
                className="text-slate-400 hover:text-slate-300 p-2 rounded-lg hover:bg-slate-600/40 transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
              {summaryHistory.length > 0 ? (
                summaryHistory.map((item, index) => (
                  <motion.div
                    key={item.id}
                    className="p-5 bg-gradient-to-r from-slate-600/30 to-slate-700/30 backdrop-blur-sm rounded-xl cursor-pointer hover:from-slate-600/40 hover:to-slate-700/40 transition-all duration-300 group border border-cyan-500/10 hover:border-cyan-500/30"
                    onClick={() => loadFromHistory(item)}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="p-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg border border-cyan-500/30">
                            <IconComponent 
                              icon={item.sourceType === 'file' ? AiOutlineFileText : AiOutlineUpload} 
                              className="h-4 w-4 text-cyan-400" 
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-200 truncate">
                              {item.title}
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs text-slate-400 flex items-center">
                                <IconComponent icon={FiClock} className="h-3 w-3 mr-1" />
                                {item.timestamp.toLocaleDateString()} at {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                item.sourceType === 'file' 
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' 
                                  : 'bg-green-500/20 text-green-300 border border-green-500/30'
                              }`}>
                                {item.sourceType === 'file' ? 'File' : 'Text'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {item.summary.length > 150 ? `${item.summary.substring(0, 150)}...` : item.summary}
                        </p>
                      </div>
                      
                      <motion.button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSummaryHistory(prev => prev.filter(h => h.id !== item.id));
                        }}
                        className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-300 ml-3"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <IconComponent icon={FiTrash2} className="h-4 w-4" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <IconComponent icon={AiOutlineHistory} className="mx-auto text-6xl mb-4 opacity-50" />
                  </motion.div>
                  <p className="text-lg font-medium text-slate-300 mb-2">No summary history yet</p>
                  <p className="text-sm">Your document summaries will appear here after processing</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Fullscreen Modal */}
      <AnimatePresence>
        {fullScreenView && (
          <motion.div 
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFullScreenView(null)}
          >
            <motion.div 
              className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-sm border border-cyan-500/30 rounded-2xl p-8 max-w-7xl w-full max-h-[95vh] overflow-hidden shadow-2xl"
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl">
                    <IconComponent 
                      icon={fullScreenView === 'mindmap' ? FiEye : AiOutlineBulb} 
                      className="h-7 w-7 text-white" 
                    />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-cyan-400">
                      {fullScreenView === 'mindmap' ? '🧠 Interactive Mindmap' : '📄 Document Summary'}
                    </h3>
                    <p className="text-slate-400 text-sm mt-1">
                      {fullScreenView === 'mindmap' 
                        ? 'Explore the hierarchical structure of your document' 
                        : 'Comprehensive analysis and key insights'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {fullScreenView === 'summary' && summaryComplete && mindmapData && (
                    <motion.button
                      onClick={() => setFullScreenView('mindmap')}
                      className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <IconComponent icon={FiEye} className="h-4 w-4 mr-2" />
                      View Mindmap
                    </motion.button>
                  )}
                  {fullScreenView === 'mindmap' && (
                    <motion.button
                      onClick={() => setFullScreenView('summary')}
                      className="flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg text-white font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <IconComponent icon={AiOutlineBulb} className="h-4 w-4 mr-2" />
                      View Summary
                    </motion.button>
                  )}
                  <motion.button
                    onClick={() => setFullScreenView(null)}
                    className="text-slate-400 hover:text-slate-300 p-3 rounded-xl hover:bg-slate-700/50 transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>
              </div>
              
              <div className="overflow-y-auto max-h-[calc(95vh-12rem)] custom-scrollbar">
                {fullScreenView === 'mindmap' && mindmapData ? (
                  <div className="h-[75vh] bg-gradient-to-br from-slate-700/20 to-slate-800/20 rounded-xl border border-cyan-500/20">
                    <div ref={mindmapRef} className="w-full h-full rounded-xl" />
                  </div>
                ) : summary ? (
                  <div className="bg-gradient-to-br from-slate-700/20 to-slate-800/20 rounded-xl p-8 border border-cyan-500/20">
                    <div
                      className="prose prose-xl max-w-none
                        prose-headings:text-cyan-400 
                        prose-p:text-slate-300 prose-p:leading-relaxed prose-p:text-lg
                        prose-strong:text-slate-200 prose-strong:font-bold
                        prose-ul:space-y-2 prose-ol:space-y-2
                        prose-li:marker:text-cyan-400 prose-li:text-slate-300 prose-li:text-lg
                        prose-code:bg-slate-600/50 prose-code:text-cyan-300 prose-code:px-2 prose-code:py-1 prose-code:rounded"
                    >
                      <ReactMarkdown
                        remarkPlugins={[remarkMath, remarkGfm]}
                        rehypePlugins={[rehypeKatex]}
                        components={markdownComponents}
                      >
                        {preprocessLaTeX(summary)}
                      </ReactMarkdown>
                    </div>
                  </div>
                ) : null}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Scrollbar Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(51, 65, 85, 0.3);
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(6, 182, 212, 0.5);
            border-radius: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(6, 182, 212, 0.7);
          }
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `
      }} />
    </div>
  );
};

export default DocumentSummarizerComponent; 