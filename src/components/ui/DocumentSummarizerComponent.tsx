import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AiOutlineUpload, AiOutlineFileText, AiOutlineBulb, AiOutlineHistory, AiOutlineFullscreen, AiOutlineCamera, AiOutlineLoading3Quarters } from 'react-icons/ai';
import { FiDownload, FiCopy, FiShare2, FiClock, FiTrash2, FiEye, FiZap, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import IconComponent from './IconComponent';
import * as pdfjsLib from 'pdfjs-dist';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { synthwave84 } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';
import * as echarts from 'echarts';
import { jsPDF } from 'jspdf';
import { Document, Paragraph, TextRun, Packer } from 'docx';
import { useResponseCheck, ResponseUpgradeModal } from '../../utils/responseChecker';

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
  // Response checking state
  const { checkAndUseResponse } = useResponseCheck();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');
  
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
  
  // Auto-scroll functionality
  const [autoScroll, setAutoScroll] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mindmapRef = useRef<HTMLDivElement>(null);
  const mindmapChart = useRef<echarts.ECharts | null>(null);
  const summaryContainerRef = useRef<HTMLDivElement>(null); // Add ref for auto-scroll

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

  // Auto-scroll to bottom of summary container
  const scrollToBottom = () => {
    if (autoScroll && summaryContainerRef.current) {
      summaryContainerRef.current.scrollTop = summaryContainerRef.current.scrollHeight;
    }
  };

  // Auto-scroll effect for streaming content - Fixed to work properly
  useEffect(() => {
    if (autoScroll && (streamingText || summary)) {
      const timeoutId = setTimeout(() => {
        scrollToBottom();
      }, 100); // Small delay to ensure DOM is updated
      
      return () => clearTimeout(timeoutId);
    }
  }, [streamingText, summary, autoScroll]);

  // Initialize mindmap chart with improved styling
  useEffect(() => {
    if (mindmapRef.current && mindmapData && (showMindmap || fullScreenView === 'mindmap')) {
      // Clean up any existing chart instance first
      if (mindmapChart.current) {
        try {
          mindmapChart.current.dispose();
          mindmapChart.current = null;
        } catch (error) {
          console.warn('Error disposing previous chart:', error);
          mindmapChart.current = null;
        }
      }
      
      // Add a small delay to ensure DOM is ready
      const timeoutId = setTimeout(() => {
        if (mindmapRef.current && (showMindmap || fullScreenView === 'mindmap')) {
          try {
            // Define branch colors for the mindmap
            const branchColors = [
              '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
              '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
              '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2'
            ];
            
            // ECharts configuration
            const option: any = {
              backgroundColor: 'transparent',
              // Enhanced color configuration
              color: branchColors,
              // Interactive toolbox for better UX
              toolbox: {
                show: true,
                feature: {
                  restore: {
                    title: 'Reset View',
                    icon: 'path://M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z'
                  },
                  saveAsImage: {
                    title: 'Save as Image',
                    backgroundColor: '#1e293b',
                    pixelRatio: 2
                  }
                },
                iconStyle: {
                  borderColor: '#06b6d4',
                  color: '#06b6d4'
                },
                emphasis: {
                  iconStyle: {
                    borderColor: '#0891b2',
                    color: '#0891b2'
                  }
                },
                right: '20',
                top: '20'
              },
              // Enhanced tooltip
              tooltip: {
                trigger: 'item' as const,
                triggerOn: 'mousemove',
                backgroundColor: 'rgba(30, 41, 59, 0.95)',
                borderColor: 'rgba(6, 182, 212, 0.8)',
                borderWidth: 2,
                borderRadius: 8,
                textStyle: {
                  color: '#f1f5f9',
                  fontSize: 14,
                  fontWeight: 'bold',
                  fontFamily: 'Inter, system-ui, sans-serif'
                },
                formatter: function(params: any) {
                  return `<div style="padding: 12px; max-width: 300px;">
                    <div style="color: #06b6d4; font-weight: bold; margin-bottom: 8px; font-size: 16px;">${params.name}</div>
                    <div style="color: #cbd5e1; font-size: 12px; line-height: 1.4;">
                      🖱️ Click to focus • 🔍 Scroll to zoom<br/>
                      ⌨️ Shift+Drag to pan • 📍 Double-click to reset
                    </div>
                  </div>`;
                }
              },
              series: [
                {
                  type: 'tree',
                  data: [mindmapData],
                  top: '5%',
                  left: '5%',
                  bottom: '5%',
                  right: '5%',
                  
                  // Node styling - make nodes more prominent
                  symbolSize: function(value: any, params: any) {
                    // Vary node size based on hierarchy level
                    const level = params.treeAncestors ? params.treeAncestors.length : 0;
                    return level === 0 ? 20 : level === 1 ? 16 : 12;
                  },
                  
                  // Enable roaming (pan and zoom)
                  roam: true,
                  scaleLimit: {
                    min: 0.2,
                    max: 5
                  },
                  
                  // IMPORTANT: Make all nodes expanded by default
                  initialTreeDepth: -1, // Show all levels
                  expandAndCollapse: false, // Disable collapse to keep everything visible
                  
                  // Enhanced layout for better visibility
                  layout: 'orthogonal',
                  orient: 'horizontal', // Horizontal layout like in the image
                  
                  // Main label styling - FIXED for readability
                  label: {
                    show: true,
                    position: 'right',
                    verticalAlign: 'middle',
                    align: 'left',
                    fontSize: function(params: any) {
                      const level = params.treeAncestors ? params.treeAncestors.length : 0;
                      return level === 0 ? 16 : level === 1 ? 14 : 12;
                    },
                    fontWeight: 'bold',
                    color: '#1f2937', // Dark text for readability on light backgrounds
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', // White background for readability
                    borderColor: function(params: any) {
                      const level = params.treeAncestors ? params.treeAncestors.length : 0;
                      return branchColors[level % branchColors.length];
                    },
                    borderWidth: 2,
                    borderRadius: 8,
                    padding: [8, 12],
                    shadowBlur: 10,
                    shadowColor: 'rgba(0, 0, 0, 0.2)'
                  },
                  
                  // Leaf nodes styling (end nodes) - FIXED for readability
                  leaves: {
                    label: {
                      show: true,
                      position: 'right',
                      verticalAlign: 'middle',
                      align: 'left',
                      fontSize: 11,
                      fontWeight: 'normal',
                      color: '#1f2937', // Dark text for readability
                      backgroundColor: 'rgba(255, 255, 255, 0.9)', // Light background
                      borderColor: function(params: any) {
                        const level = params.treeAncestors ? params.treeAncestors.length : 0;
                        return branchColors[level % branchColors.length];
                      },
                      borderWidth: 1,
                      borderRadius: 6,
                      padding: [6, 10],
                      shadowBlur: 6,
                      shadowColor: 'rgba(0, 0, 0, 0.15)'
                    }
                  },
                  
                  // Enhanced hover effects
                  emphasis: {
                    focus: 'descendant',
                    scale: 1.1,
                    itemStyle: {
                      borderWidth: 4,
                      shadowBlur: 20,
                      shadowColor: function(params: any) {
                        const level = params.treeAncestors ? params.treeAncestors.length : 0;
                        return branchColors[level % branchColors.length] + '80';
                      }
                    },
                    label: {
                      fontSize: function(params: any) {
                        const level = params.treeAncestors ? params.treeAncestors.length : 0;
                        return level === 0 ? 18 : level === 1 ? 16 : 14;
                      },
                      fontWeight: 'bold',
                      color: '#1f2937', // Keep text dark for readability
                      backgroundColor: 'rgba(255, 255, 255, 0.98)',
                      shadowBlur: 8,
                      shadowColor: 'rgba(0, 0, 0, 0.3)'
                    },
                    lineStyle: {
                      width: 8,
                      shadowBlur: 12,
                      shadowColor: function(params: any) {
                        const level = params.treeAncestors ? params.treeAncestors.length : 0;
                        return branchColors[level % branchColors.length] + '60';
                      }
                    }
                  },
                  
                  // Animation settings
                  animationDuration: 1000,
                  animationDurationUpdate: 800,
                  animationEasing: 'cubicOut',
                  
                  // Node item styling with different colors per branch
                  itemStyle: {
                    color: function(params: any) {
                      const level = params.treeAncestors ? params.treeAncestors.length : 0;
                      return branchColors[level % branchColors.length];
                    },
                    borderColor: function(params: any) {
                      const level = params.treeAncestors ? params.treeAncestors.length : 0;
                      const darkerColors = [
                        '#E55555', '#3CB5AC', '#3A9BC1', '#7FB69A', '#E6D285',
                        '#C588C5', '#7FC0B0', '#E0C55F', '#A67FB5', '#6FA9D1'
                      ];
                      return darkerColors[level % darkerColors.length];
                    },
                    borderWidth: 3,
                    shadowBlur: 12,
                    shadowColor: function(params: any) {
                      const level = params.treeAncestors ? params.treeAncestors.length : 0;
                      return branchColors[level % branchColors.length] + '50';
                    }
                  },
                  
                  // MOST IMPORTANT: Colorful connecting lines - SUPER ENFORCED
                  lineStyle: {
                    color: function(params: any) {
                      // Force specific colors for each connection - NEVER BLACK
                      const level = params.treeAncestors ? params.treeAncestors.length : 0;
                      const selectedColor = branchColors[level % branchColors.length];
                      console.log('ECharts lineStyle setting color:', selectedColor);
                      return selectedColor;
                    },
                    width: 8, // Very thick for visibility
                    curveness: 0.3,
                    shadowBlur: 10,
                    shadowColor: function(params: any) {
                      const level = params.treeAncestors ? params.treeAncestors.length : 0;
                      return branchColors[level % branchColors.length] + '60';
                    },
                    opacity: 1, // Full opacity
                    type: 'solid'
                  }
                }
              ],
              // Global text styling
              textStyle: {
                color: '#1f2937', // Dark text globally
                fontFamily: 'Inter, system-ui, sans-serif'
              }
            };
            
            // Initialize the chart
            mindmapChart.current = echarts.init(mindmapRef.current);
            (mindmapChart.current as any).setOption(option);
            
            // SUPER AGGRESSIVE COLOR ENFORCEMENT
            const forceColorfulLines = () => {
              const chartContainer = mindmapRef.current;
              if (!chartContainer) return;
              
              console.log('Forcing colorful lines...'); // Debug log
              
              // Get all SVG elements that could be lines
              const svgElements = chartContainer.querySelectorAll('svg path, svg line, svg polyline');
              console.log('Found SVG elements:', svgElements.length); // Debug log
              
              svgElements.forEach((element: any, index: number) => {
                const currentStroke = element.getAttribute('stroke');
                const colorIndex = index % branchColors.length;
                const newColor = branchColors[colorIndex];
                
                // Log current and new colors for debugging
                console.log(`Element ${index}: current stroke: ${currentStroke}, setting to: ${newColor}`);
                
                // Set attributes
                element.setAttribute('stroke', newColor);
                element.setAttribute('stroke-width', '8');
                element.setAttribute('opacity', '1');
                element.setAttribute('fill', 'none');
                
                // Also set via style for extra enforcement
                element.style.stroke = newColor;
                element.style.strokeWidth = '8px';
                element.style.opacity = '1';
                element.style.fill = 'none';
                
                // Remove any classes that might override colors
                element.removeAttribute('class');
              });
              
              // Additional targeting for any remaining black elements
              const potentialBlackElements = chartContainer.querySelectorAll(
                'svg [stroke="#000000"], svg [stroke="black"], svg [stroke="#000"], ' +
                'svg [stroke="rgba(0,0,0,0.45)"], svg path:not([stroke]), svg line:not([stroke])'
              );
              
              console.log('Found potential black elements:', potentialBlackElements.length); // Debug log
              
              potentialBlackElements.forEach((element: any, index: number) => {
                const colorIndex = index % branchColors.length;
                const newColor = branchColors[colorIndex];
                
                element.setAttribute('stroke', newColor);
                element.setAttribute('stroke-width', '8');
                element.setAttribute('opacity', '1');
                element.style.stroke = newColor;
                element.style.strokeWidth = '8px';
                element.style.opacity = '1';
              });
            };
            
            // Apply colors immediately and repeatedly
            setTimeout(() => forceColorfulLines(), 0);
            setTimeout(() => forceColorfulLines(), 50);
            setTimeout(() => forceColorfulLines(), 100);
            setTimeout(() => forceColorfulLines(), 200);
            setTimeout(() => forceColorfulLines(), 500);
            setTimeout(() => forceColorfulLines(), 1000);
            setTimeout(() => forceColorfulLines(), 2000);
            
            // Set up continuous monitoring
            const colorInterval = setInterval(() => {
              if (!mindmapRef.current || !mindmapChart.current) {
                clearInterval(colorInterval);
                return;
              }
              forceColorfulLines();
            }, 1000);
            
            // Set up MutationObserver for real-time changes
            const observer = new MutationObserver(() => {
              setTimeout(forceColorfulLines, 10);
            });
            
            if (mindmapRef.current) {
              observer.observe(mindmapRef.current, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['stroke', 'style', 'class']
              });
            }
            
            // Handle resize
            const handleResize = () => {
              if (mindmapChart.current && !mindmapChart.current.isDisposed()) {
                mindmapChart.current.resize();
                // Reapply colors after resize
                setTimeout(forceColorfulLines, 100);
              }
            };
            
            window.addEventListener('resize', handleResize);
            
            // Store cleanup function
            return () => {
              clearInterval(colorInterval);
              observer.disconnect();
              window.removeEventListener('resize', handleResize);
              if (mindmapChart.current && !mindmapChart.current.isDisposed()) {
                try {
                  mindmapChart.current.dispose();
                  mindmapChart.current = null;
                } catch (error) {
                  console.warn('Error disposing chart on cleanup:', error);
                  mindmapChart.current = null;
                }
              }
            };
          } catch (error) {
            console.error('Error initializing mindmap chart:', error);
          }
        }
      }, 100);
      
      return () => {
        clearTimeout(timeoutId);
        if (mindmapChart.current && !mindmapChart.current.isDisposed()) {
          try {
            mindmapChart.current.dispose();
            mindmapChart.current = null;
          } catch (error) {
            console.warn('Error disposing chart on unmount:', error);
            mindmapChart.current = null;
          }
        }
      };
    } else if (!showMindmap && fullScreenView !== 'mindmap' && mindmapChart.current) {
      // Clean up chart when hiding mindmap
      try {
        if (!mindmapChart.current.isDisposed()) {
          mindmapChart.current.dispose();
        }
        mindmapChart.current = null;
      } catch (error) {
        console.warn('Error disposing chart when hiding:', error);
        mindmapChart.current = null;
      }
    }
  }, [mindmapData, showMindmap, fullScreenView]);

  // Handle mindmap reinitialization when switching to fullscreen
  useEffect(() => {
    if (fullScreenView === 'mindmap' && mindmapData && mindmapChart.current) {
      // Small delay to ensure DOM is ready, then resize the chart
      const timeoutId = setTimeout(() => {
        if (mindmapChart.current && !mindmapChart.current.isDisposed()) {
          try {
            mindmapChart.current.resize();
          } catch (error) {
            console.warn('Error resizing chart for fullscreen:', error);
          }
        }
      }, 200);
      
      return () => clearTimeout(timeoutId);
    }
  }, [fullScreenView]);

  // Auto-trigger mindmap generation when summary is complete
  useEffect(() => {
    if (summaryComplete && summary && !mindmapData && !isGeneratingMindmap) {
      generateMindmapFromSummary();
    }
  }, [summaryComplete, summary, mindmapData, isGeneratingMindmap]);

  // Markdown components with colorful styling
  const markdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={synthwave84}
          language={match[1]}
          PreTag="div"
          className="rounded-lg border border-cyan-500/30 shadow-lg"
          customStyle={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.9), rgba(51, 65, 85, 0.9))',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: '8px',
            padding: '16px'
          }}
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={`${className} bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 px-3 py-1 rounded-md text-sm font-mono border border-cyan-500/30`} {...props}>
          {children}
        </code>
      );
    },
    h1: ({ children }: any) => <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mt-8 mb-4 border-b-2 border-cyan-500/30 pb-2">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mt-6 mb-3 border-b border-blue-500/30 pb-1">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-xl font-bold text-teal-300 mt-4 mb-2 bg-gradient-to-r from-teal-500/20 to-cyan-500/20 px-4 py-3 rounded-lg border border-teal-500/30 shadow-lg">{children}</h3>,
    h4: ({ children }: any) => <h4 className="text-lg font-bold text-emerald-300 mt-4 mb-2 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 px-3 py-2 rounded-lg border border-emerald-500/30">{children}</h4>,
    h5: ({ children }: any) => <h5 className="text-base font-bold text-cyan-300 mt-3 mb-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 px-3 py-2 rounded-lg border border-cyan-500/30">{children}</h5>,
    h6: ({ children }: any) => <h6 className="text-sm font-bold text-blue-300 mt-3 mb-2 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 px-3 py-2 rounded-lg border border-blue-500/30">{children}</h6>,
    p: ({ children }: any) => <p className="text-slate-200 mb-4 leading-relaxed">{children}</p>,
    ul: ({ children }: any) => <ul className="list-disc list-inside mb-4 text-slate-200 space-y-2">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal list-inside mb-4 text-slate-200 space-y-2">{children}</ol>,
    li: ({ children }: any) => <li className="mb-1 pl-2 text-slate-200">{children}</li>,
    strong: ({ children }: any) => <strong className="font-bold text-cyan-300 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 px-2 py-1 rounded-md border border-cyan-500/30">{children}</strong>,
    em: ({ children }: any) => <em className="italic text-purple-300 bg-gradient-to-r from-purple-500/10 to-pink-500/10 px-1 rounded">{children}</em>,
    blockquote: ({ children }: any) => <blockquote className="border-l-4 border-cyan-500 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 pl-4 py-2 my-4 text-slate-200 italic rounded-r-lg">{children}</blockquote>,
    table: ({ children }: any) => <div className="overflow-x-auto my-4"><table className="min-w-full bg-gradient-to-r from-slate-600/30 to-slate-700/30 rounded-lg border border-cyan-500/30">{children}</table></div>,
    th: ({ children }: any) => <th className="px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-300 font-bold border-b border-cyan-500/30">{children}</th>,
    td: ({ children }: any) => <td className="px-4 py-2 text-slate-200 border-b border-slate-600/30">{children}</td>,
    // Add additional text elements to ensure no black text
    span: ({ children }: any) => <span className="text-slate-200">{children}</span>,
    div: ({ children }: any) => <div className="text-slate-200">{children}</div>,
    // Override any default text styling
    text: ({ children }: any) => <span className="text-slate-200">{children}</span>,
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
                
                // Auto-scroll to show latest content
                if (autoScroll) {
                  setTimeout(scrollToBottom, 50);
                }
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
    
    // Check responses before generating summary
    const responseResult = await checkAndUseResponse({
      responseType: 'document_summary',
      responsesUsed: 1
    });
    if (!responseResult.canProceed) {
      setShowUpgradeModal(true);
      setUpgradeMessage(responseResult.message || 'Please upgrade to continue');
      return;
    }
    
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
                
                // Auto-scroll to show latest content
                if (autoScroll) {
                  setTimeout(scrollToBottom, 50);
                }
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
            <div>
              <h2 className="text-2xl font-bold text-cyan-400">Document Summarizer</h2>
              <p className="text-cyan-300 text-sm mt-1 font-medium">Comprehensive analysis and key insights</p>
            </div>
          </div>
          
          {/* Auto-scroll Toggle */}
          <div className="mb-4">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-2 bg-slate-600/20 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                <input
                  type="checkbox"
                  id="autoScrollSummary"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="w-4 h-4 text-cyan-600 bg-slate-600 border-slate-400 rounded focus:ring-cyan-500 focus:ring-2"
                />
                <label htmlFor="autoScrollSummary" className="text-slate-300 text-sm font-medium cursor-pointer flex items-center">
                  <IconComponent icon={AiOutlineLoading3Quarters} className="h-4 w-4 mr-1" />
                  Auto Scroll
                </label>
              </div>
            </div>
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
              <div>
                <h2 className="text-2xl font-bold text-cyan-400">Results</h2>
                <p className="text-purple-300 text-sm mt-1 font-medium">AI-powered document analysis</p>
              </div>
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
            className="bg-gradient-to-br from-slate-600/20 to-slate-700/20 backdrop-blur-sm border border-cyan-500/20 rounded-xl p-6 overflow-y-auto h-[660px] shadow-xl"
            variants={itemVariants}
            ref={summaryContainerRef} // Move ref to the scrollable container
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
              <div className="h-full bg-slate-700/30 backdrop-blur-sm rounded-lg border border-white/10">
                <div className="p-3 border-b border-white/10 bg-slate-600/30">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-cyan-400">Interactive Mind Map</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-400">🖱️ Click & drag to move • 🔍 Scroll to zoom • 📍 Double-click to reset</span>
                    </div>
                  </div>
                </div>
                <div ref={mindmapRef} className="w-full h-[calc(100%-60px)] rounded-b-lg" />
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
            
            <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar" ref={summaryContainerRef}>
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

      {/* Enhanced Fullscreen Modal - Fixed to cover whole component */}
      <AnimatePresence>
        {fullScreenView && (
          <motion.div 
            className="fixed inset-0 bg-gradient-to-br from-slate-900/98 via-slate-800/98 to-slate-900/98 backdrop-blur-xl z-[9999] flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setFullScreenView(null)}
            style={{ margin: 0, padding: 0 }}
          >
            <motion.div 
              className="bg-gradient-to-br from-slate-700/98 via-slate-800/98 to-slate-900/98 backdrop-blur-xl border-2 border-cyan-500/40 rounded-2xl w-full h-full flex flex-col shadow-2xl"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              style={{ margin: 0 }}
            >
              <div className="flex items-center justify-between p-6 border-b border-cyan-500/20 flex-shrink-0">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl shadow-lg">
                    <IconComponent 
                      icon={fullScreenView === 'mindmap' ? FiEye : AiOutlineBulb} 
                      className="h-7 w-7 text-white" 
                    />
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                      {fullScreenView === 'mindmap' ? '🧠 Interactive Mindmap' : '📄 Document Summary'}
                    </h3>
                    <p className="text-slate-300 text-base mt-2 font-medium">
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
                      className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <IconComponent icon={FiEye} className="h-5 w-5 mr-2" />
                      View Mindmap
                    </motion.button>
                  )}
                  {fullScreenView === 'mindmap' && (
                    <motion.button
                      onClick={() => setFullScreenView('summary')}
                      className="flex items-center px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <IconComponent icon={AiOutlineBulb} className="h-5 w-5 mr-2" />
                      View Summary
                    </motion.button>
                  )}
                  <motion.button
                    onClick={() => setFullScreenView(null)}
                    className="text-slate-300 hover:text-white p-3 rounded-xl bg-slate-600/50 hover:bg-slate-500/50 transition-all duration-300 border border-slate-500/30"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>
              </div>
              
              <div className="flex-1 p-6 overflow-hidden">
                {fullScreenView === 'mindmap' && mindmapData ? (
                  <div className="h-full bg-gradient-to-br from-slate-600/30 via-slate-700/30 to-slate-800/30 rounded-2xl border-2 border-cyan-500/30 shadow-inner">
                    <div className="p-3 border-b border-white/10 bg-slate-600/30 rounded-t-2xl">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-cyan-400">Interactive Mind Map</h3>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-slate-400">🖱️ Click & drag to move • 🔍 Scroll to zoom • 📍 Double-click to reset</span>
                        </div>
                      </div>
                    </div>
                    <div 
                      ref={fullScreenView === 'mindmap' ? mindmapRef : null}
                      className="w-full h-[calc(100%-60px)] rounded-b-2xl" 
                    />
                  </div>
                ) : summary ? (
                  <div className="h-full bg-gradient-to-br from-slate-600/30 via-slate-700/30 to-slate-800/30 rounded-2xl p-8 border-2 border-cyan-500/30 shadow-inner overflow-y-auto custom-scrollbar">
                    <div
                      className="prose prose-xl max-w-none
                        prose-headings:text-cyan-400 prose-headings:font-bold
                        prose-p:text-slate-200 prose-p:leading-relaxed prose-p:text-lg
                        prose-strong:text-slate-100 prose-strong:font-bold
                        prose-ul:space-y-2 prose-ol:space-y-2
                        prose-li:marker:text-cyan-400 prose-li:text-slate-200 prose-li:text-lg
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
            width: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(51, 65, 85, 0.4);
            border-radius: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: linear-gradient(45deg, #06b6d4, #8b5cf6);
            border-radius: 6px;
            border: 2px solid rgba(51, 65, 85, 0.4);
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: linear-gradient(45deg, #0891b2, #7c3aed);
          }
          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          
          /* Force override any black text in the component */
          .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
            color: inherit !important;
          }
          
          /* Ensure all text elements have proper colors */
          .prose * {
            color: inherit !important;
          }
          
          /* Force all paragraph and text content to be light colored */
          .prose p, .prose div, .prose span, .prose text {
            color: #e2e8f0 !important;
          }
          
          /* Force all list items and their content */
          .prose ul li, .prose ol li, .prose li * {
            color: #e2e8f0 !important;
          }
          
          /* Override any default markdown styling that might be black */
          .prose .markdown-body h1,
          .prose .markdown-body h2,
          .prose .markdown-body h3,
          .prose .markdown-body h4,
          .prose .markdown-body h5,
          .prose .markdown-body h6 {
            color: inherit !important;
          }
          
          .prose .markdown-body p,
          .prose .markdown-body div,
          .prose .markdown-body span,
          .prose .markdown-body li {
            color: #e2e8f0 !important;
          }
          
          /* Force all text in the document summarizer to never be black */
          [class*="DocumentSummarizerComponent"] * {
            color: inherit !important;
          }
          
          /* Specific overrides for ReactMarkdown content */
          .prose-p\\:text-slate-300 p,
          .prose-li\\:text-slate-300 li,
          .prose-strong\\:text-slate-200 strong {
            color: #e2e8f0 !important;
          }
          
          /* Override any possible black text from external libraries */
          .prose-headings\\:text-cyan-400 h1,
          .prose-headings\\:text-cyan-400 h2,
          .prose-headings\\:text-cyan-400 h3,
          .prose-headings\\:text-cyan-400 h4,
          .prose-headings\\:text-cyan-400 h5,
          .prose-headings\\:text-cyan-400 h6 {
            color: #22d3ee !important;
          }
          
          .prose-headings\\:text-purple-400 h1,
          .prose-headings\\:text-purple-400 h2,
          .prose-headings\\:text-purple-400 h3,
          .prose-headings\\:text-purple-400 h4,
          .prose-headings\\:text-purple-400 h5,
          .prose-headings\\:text-purple-400 h6 {
            color: #c084fc !important;
          }
          
          /* Enhanced Mindmap Styling - Force colorful lines and nodes */
          .echarts-for-react svg path,
          [class*="echarts"] svg path {
            stroke-width: 4 !important;
            stroke-linecap: round !important;
            stroke-linejoin: round !important;
            opacity: 0.9 !important;
          }
          
          /* Force colorful strokes for mindmap connections */
          .echarts-for-react svg path[stroke="#000000"],
          .echarts-for-react svg path[stroke="black"],
          .echarts-for-react svg path[stroke="#000"],
          .echarts-for-react svg path[stroke="rgba(0,0,0,0.45)"],
          .echarts-for-react svg line[stroke="#000000"],
          .echarts-for-react svg line[stroke="black"],
          .echarts-for-react svg line[stroke="#000"],
          [class*="echarts"] svg path[stroke="#000000"],
          [class*="echarts"] svg path[stroke="black"],
          [class*="echarts"] svg path[stroke="#000"],
          [class*="echarts"] svg line[stroke="#000000"],
          [class*="echarts"] svg line[stroke="black"],
          [class*="echarts"] svg line[stroke="#000"] {
            stroke: #FF6B6B !important;
            stroke-width: 4 !important;
            opacity: 0.9 !important;
          }
          
          /* Mindmap node styling enhancements */
          .echarts-for-react svg circle,
          [class*="echarts"] svg circle {
            stroke-width: 3 !important;
            filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3)) !important;
          }
          
          /* Mindmap text styling */
          .echarts-for-react svg text,
          [class*="echarts"] svg text {
            font-family: 'Inter', system-ui, sans-serif !important;
            font-weight: 600 !important;
            text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5) !important;
          }
          
          /* Mindmap container styling */
          .echarts-for-react,
          [class*="echarts"] {
            background: transparent !important;
          }
          
          /* Override any ECharts default black lines with colorful alternatives */
          .echarts-for-react svg path:not([stroke]),
          .echarts-for-react svg line:not([stroke]),
          [class*="echarts"] svg path:not([stroke]),
          [class*="echarts"] svg line:not([stroke]) {
            stroke: #4ECDC4 !important;
            stroke-width: 4 !important;
            opacity: 0.9 !important;
          }
          
          /* Additional color variations for different path elements */
          .echarts-for-react svg path:nth-child(2n),
          [class*="echarts"] svg path:nth-child(2n) {
            stroke: #45B7D1 !important;
          }
          
          .echarts-for-react svg path:nth-child(3n),
          [class*="echarts"] svg path:nth-child(3n) {
            stroke: #96CEB4 !important;
          }
          
          .echarts-for-react svg path:nth-child(4n),
          [class*="echarts"] svg path:nth-child(4n) {
            stroke: #FFEAA7 !important;
          }
          
          .echarts-for-react svg path:nth-child(5n),
          [class*="echarts"] svg path:nth-child(5n) {
            stroke: #DDA0DD !important;
          }
          
          /* Mindmap animation enhancements */
          .echarts-for-react svg path,
          .echarts-for-react svg circle,
          .echarts-for-react svg text,
          [class*="echarts"] svg path,
          [class*="echarts"] svg circle,
          [class*="echarts"] svg text {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
          }
          
          /* Hover effects for mindmap elements */
          .echarts-for-react svg path:hover,
          [class*="echarts"] svg path:hover {
            stroke-width: 6 !important;
            opacity: 1 !important;
            filter: drop-shadow(0 0 8px currentColor) !important;
          }
          
          .echarts-for-react svg circle:hover,
          [class*="echarts"] svg circle:hover {
            stroke-width: 4 !important;
            filter: drop-shadow(0 0 12px currentColor) !important;
            transform: scale(1.1) !important;
          }
          
          /* Ensure mindmap takes full container space */
          .echarts-for-react > div,
          [class*="echarts"] > div {
            width: 100% !important;
            height: 100% !important;
          }
          
          /* Force specific color cycling for paths */
          .echarts-for-react svg g:nth-child(1) path { stroke: #FF6B6B !important; }
          .echarts-for-react svg g:nth-child(2) path { stroke: #4ECDC4 !important; }
          .echarts-for-react svg g:nth-child(3) path { stroke: #45B7D1 !important; }
          .echarts-for-react svg g:nth-child(4) path { stroke: #96CEB4 !important; }
          .echarts-for-react svg g:nth-child(5) path { stroke: #FFEAA7 !important; }
          .echarts-for-react svg g:nth-child(6) path { stroke: #DDA0DD !important; }
          .echarts-for-react svg g:nth-child(7) path { stroke: #98D8C8 !important; }
          .echarts-for-react svg g:nth-child(8) path { stroke: #F7DC6F !important; }
          
          /* Apply same colors to any echarts container */
          [class*="echarts"] svg g:nth-child(1) path { stroke: #FF6B6B !important; }
          [class*="echarts"] svg g:nth-child(2) path { stroke: #4ECDC4 !important; }
          [class*="echarts"] svg g:nth-child(3) path { stroke: #45B7D1 !important; }
          [class*="echarts"] svg g:nth-child(4) path { stroke: #96CEB4 !important; }
          [class*="echarts"] svg g:nth-child(5) path { stroke: #FFEAA7 !important; }
          [class*="echarts"] svg g:nth-child(6) path { stroke: #DDA0DD !important; }
          [class*="echarts"] svg g:nth-child(7) path { stroke: #98D8C8 !important; }
          [class*="echarts"] svg g:nth-child(8) path { stroke: #F7DC6F !important; }
        `
      }} />
    </div>
  );
};

export default DocumentSummarizerComponent; 