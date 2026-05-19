import React, { useState, useEffect, useRef, useContext, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
// @ts-ignore
import rehypeRaw from 'rehype-raw';

import DOMPurify from 'dompurify';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

import katex from 'katex';
import 'katex/dist/katex.min.css';
import { 
  FiMessageSquare, FiSend, FiUser, FiCpu, FiChevronDown, FiPlus, FiClock, FiX,
  FiCopy, FiShare2, FiVolume2, FiPause, FiPlay, FiDownload, FiUpload, FiImage,
  FiMaximize, FiMinimize, FiSettings, FiChevronLeft, FiChevronRight, FiMoon, FiSun,
  FiCreditCard, FiBookmark, FiStar, FiEdit, FiEdit2, FiTrash2, FiCheck, FiRotateCcw, FiVolumeX,
  FiMenu, FiHome, FiMic, FiFileText, FiVideo, FiZap, FiTrendingUp, FiTarget, FiSquare,
  FiVolume, FiFile, FiPaperclip, FiSidebar, FiAlertCircle, FiRefreshCw, FiSearch, FiGlobe
} from 'react-icons/fi';
import { ThemeContext } from '../contexts/MockThemeContext';
import { useAuth, User as AuthUser } from '../utils/AuthContext';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../utils/supabase';
import { userService } from '../services/mockServices';
import { getNewUserChats, getNewUserChatsPaginated, getNewChatMessages, getChatMessagesLazy, getLatestChatMessages, supabaseMessageToFrontend, SupabaseChat, createNewChat, addUserMessage, addUserMessageWithAttachment, deleteNewChat, FrontendMessage } from '../services/chatService';
import { ProFeatureAlert, ImageSkeleton, IntelligentImageGeneration, IntelligentImageThinking } from '../components/ChatComponents';
import { AuthRequiredButton } from '../components/ChatComponents';
import { ThinkingIndicator } from '../components/ChatComponents';
import { ChartGenerationBox } from '../components/ChatComponents';
import { LinkCirclesButton, LinkCitationsPanel } from '../components/ChatComponents';

import { intelligentImageStorage } from '../services/mockServices';
import { streamingImageService, StreamChunk } from '../services/mockServices';
import { imageReplacementService } from '../services/mockServices';
import { documentProcessingService } from '../services/mockServices';
import { useAlert } from '../contexts/MockAlertContext';
import { FilePreviewModal } from '../components/ChatComponents';
import { FileUploadPopup } from '../components/ChatComponents';
import { uploadFileToStorage, FileUploadResult, validateFile, formatFileSize, getFileIcon } from '../utils/chatUtils';
import { extractPlainTextFromHTML, extractTextForSharing } from '../utils/chatUtils';
import { CodeBlock } from '../components/ChatComponents';
import { extractLinksFromText } from '../utils/chatUtils';
import { UserMessageAttachments } from '../components/ChatComponents';
import { BotMessageAttachments } from '../components/ChatComponents';
import { chartService, ChartConfig } from '../services/mockServices';
import { getCurrentLocalTimeFormatted } from '../utils/chatUtils';
import coinIcon from '../assets/Logo.png';
import matrixLogo from '../assets/matrixedu-logo.svg';

import { AIImageStrip } from '../components/ChatComponents';
import { ChargeModal } from '../components/ChatComponents';

// HTML text formatting will be implemented from scratch

const transformCustomImageTags = (text: string): string => {
  if (!text) return text;
  try {
    const tagRegex = /<\s*(?:Image|image)\s*>([\s\S]*?)<\s*\/\s*(?:Image|image)\s*>/gi;
    const matches: Array<{ start: number; end: number; url: string }> = [];
    let m: RegExpExecArray | null;
    while ((m = tagRegex.exec(text)) !== null) {
      const inner = String(m[1] || '');
      const cleaned = inner.replace(/[`'"]/g, '').trim();
      const urlMatch = cleaned.match(/https?:\/\/[^\s<>'"]+/);
      const url = urlMatch ? urlMatch[0] : cleaned;
      matches.push({ start: m.index, end: m.index + m[0].length, url });
    }
    if (matches.length === 0) return text;
    let out = '';
    let cursor = 0;
    let i = 0;
    while (i < matches.length) {
      const groupStart = i;
      let groupEnd = i;
      const urls: string[] = [matches[i].url];
      while (groupEnd + 1 < matches.length) {
        const between = text.slice(matches[groupEnd].end, matches[groupEnd + 1].start);
        const cleanedBetween = between.replace(/[`'"\s]/g, '');
        if (cleanedBetween.length === 0) {
          groupEnd += 1;
          urls.push(matches[groupEnd].url);
        } else {
          break;
        }
      }
      const startIdx = matches[groupStart].start;
      const endIdx = matches[groupEnd].end;
      out += text.slice(cursor, startIdx);
      if (urls.length >= 2) {
        const encoded = encodeURIComponent(JSON.stringify(urls));
        out += `<ai-images data-urls="${encoded}"></ai-images>`;
      } else {
        const safeUrl = urls[0].replace(/"/g, '&quot;');
        out += `<img src="${safeUrl}" alt="Image" style="width:400px;height:280px;border-radius:8px;object-fit:cover;cursor:zoom-in;" />`;
      }
      cursor = endIdx;
      i = groupEnd + 1;
    }
    out += text.slice(cursor);
    return out;
  } catch {
    return text;
  }
};

const normalizeDoctypeHTML = (content: string): string => {
  if (!content || typeof content !== 'string') return content;
  try {
    let out = content;
    out = out.replace(/<!DOCTYPE[^>]*>/gi, '');
    out = out.replace(/<\/?html[^>]*>/gi, '');
    out = out.replace(/<head[\s\S]*?<\/head>/gi, '');
    out = out.replace(/<style[\s\S]*?<\/style>/gi, '');
    out = out.replace(/<script[\s\S]*?<\/script>/gi, '');
    const bodyMatch = out.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) {
      out = bodyMatch[1];
    }
    return out.trim();
  } catch {
    return content;
  }
};

const unwrapHtmlCodeFence = (text: string): string => {
  if (!text) return text;
  try {
    const fenceRegex = /```[^\n]*\n([\s\S]*?)```/g;
    return text.replace(fenceRegex, (match, inner) => {
      if (/(<!DOCTYPE|<html\b|<body\b|<head\b)/i.test(inner)) {
        return inner;
      }
      return match;
    });
  } catch {
    return text;
  }
};

const hasCustomImageTag = (text: string): boolean => {
  if (!text) return false;
  return /<\s*(?:Image|image)\s*>[\s\S]*?<\s*\/\s*(?:Image|image)\s*>/i.test(text);
};

const isImageAttachment = (att: { fileType?: string; url?: string }): boolean => {
  const ft = (att.fileType || '').toLowerCase();
  if (ft.startsWith('image/')) return true;
  const u = att.url || '';
  return /\.(png|jpg|jpeg|gif|webp)(\?.*)?$/i.test(u);
};

// Function to process LaTeX math expressions using KaTeX
// Improved to avoid processing single letters and simple words as math expressions
const processMathExpressions = (text: string): string => {
  if (!text) return text;
  
  try {
    // Process display math expressions \[ ... \]
    text = text.replace(/\\\[([\s\S]*?)\\\]/g, (match, mathContent) => {
      try {
        const html = katex.renderToString(mathContent.trim(), {
          displayMode: true,
          throwOnError: false,
          strict: false
        });
        return `<div class="katex-display">${html}</div>`;
      } catch (error) {
        console.warn('KaTeX display math error:', error);
        return match; // Return original if rendering fails
      }
    });
    
    // Process inline math expressions \( ... \)
    text = text.replace(/\\\(([\s\S]*?)\\\)/g, (match, mathContent) => {
      try {
        const html = katex.renderToString(mathContent.trim(), {
          displayMode: false,
          throwOnError: false,
          strict: false
        });
        return `<span class="katex-inline">${html}</span>`;
      } catch (error) {
        console.warn('KaTeX inline math error:', error);
        return match; // Return original if rendering fails
      }
    });
    
    // Process dollar sign math expressions $$ ... $$ (display)
    text = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, mathContent) => {
      const trimmedContent = mathContent.trim();
      
      // Skip if it's just simple text without mathematical content
      if (trimmedContent.length === 0) {
        return match; // Return original for empty content
      }
      
      // Only process if it contains mathematical operators, numbers, or LaTeX commands
      const hasMathContent = /[\+\-\*\/\=\^\{\}\(\)\[\]\\\_\d]|\\[a-zA-Z]+/.test(trimmedContent);
      
      if (!hasMathContent && /^[a-zA-Z\s]+$/.test(trimmedContent)) {
        return match; // Return original if it's just plain text
      }
      
      try {
        const html = katex.renderToString(trimmedContent, {
          displayMode: true,
          throwOnError: false,
          strict: false
        });
        return `<div class="katex-display">${html}</div>`;
      } catch (error) {
        console.warn('KaTeX display math error:', error);
        return match; // Return original if rendering fails
      }
    });
    
    // Process single dollar sign math expressions $ ... $ (inline)
    // Only process if it contains mathematical operators, numbers, or multiple characters
    text = text.replace(/\$([^$\n]+?)\$/g, (match, mathContent) => {
      const trimmedContent = mathContent.trim();
      
      // Skip if it's just a single letter or simple word without math operators
      if (trimmedContent.length === 1 && /^[a-zA-Z]$/.test(trimmedContent)) {
        return match; // Return original dollar signs for single letters
      }
      
      // Skip if it's just a simple word without mathematical content
      if (/^[a-zA-Z]+$/.test(trimmedContent) && trimmedContent.length <= 4) {
        return match; // Return original for simple words
      }
      
      // Only process if it contains mathematical operators, numbers, or complex expressions
      const hasMathContent = /[\+\-\*\/\=\^\{\}\(\)\[\]\\\_\d]|[a-zA-Z]{2,}|\\[a-zA-Z]+/.test(trimmedContent);
      
      if (!hasMathContent) {
        return match; // Return original if no mathematical content detected
      }
      
      try {
        const html = katex.renderToString(trimmedContent, {
          displayMode: false,
          throwOnError: false,
          strict: false
        });
        return `<span class="katex-inline">${html}</span>`;
      } catch (error) {
        console.warn('KaTeX inline math error:', error);
        return match; // Return original if rendering fails
      }
    });
    
    return text;
  } catch (error) {
    console.error('Error processing math expressions:', error);
    return text; // Return original text if processing fails
  }
};

// Define interface for message types
interface Message {
  id: number;
  message_id?: string;
  role: string;
  content: string;
  timestamp: string;
  fileContent?: string;
  fileName?: string;
  sender?: string;
  text?: string;
  isStreaming?: boolean;
  image_url?: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  isGenerating?: boolean;
  generationType?: 'image' | 'spreadsheet' | 'document';
  attachments?: {
    url: string;
    fileName: string;
    fileType: string;
    originalName?: string;
    size?: number;
  }[];
  // Intelligent image generation properties
  intelligentImage?: {
    isGenerating: boolean;
    stage: 'analyzing' | 'generating_description' | 'calling_api' | 'completed' | 'error';
    imageUrl?: string;
    description?: string;
    error?: string;
    generationId?: string;
    coinCost?: number;
  };
  // Graph generation properties
  chartConfig?: any;
  chartId?: string;
}

// Define interface for chat type
interface Chat {
  id: string;
  title: string;
  messages: Message[];
  role?: string;
  roleDescription?: string;
  description?: string;
}

// Sample role options for the AI assistant
// Sample role options for the AI assistant - will be moved inside component

// Sample messages for welcome panel or returning users
// Initial messages will be created inside component to access t function

// Empty array for new chats - this should be used whenever creating a new chat
const emptyInitialMessages: Message[] = [];

const ChatPage: React.FC = () => {
  const { t } = useTranslation();
  const { userData, isPro, refreshUserData } = useUser();
  const { user } = useAuth();
  const { showSuccess, showError, showWarning, showConfirmation } = useAlert();
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  const [showGenerationButtons, setShowGenerationButtons] = useState(false);
  const interactingWithGenerationButtonsRef = useRef(false);
  
  // All formatting components removed - HTML formatting will be implemented from scratch







// Enhanced text processing with chart generation boxes and hidden code blocks
const processTextWithCharts = (text: string, darkMode: boolean, messageId: string, isStreaming: boolean = false) => {
  if (!text) return { processedText: '', chartConfigs: [], pendingCharts: [] };
  
  const chartConfigs: Array<{id: string, config: ChartConfig, position: number}> = [];
  const pendingCharts: Array<{id: string, position: number, isComplete: boolean}> = [];
  let processedText = text;
  const protectedRanges: Array<{ start: number; end: number }> = [];
  
  // Detect chart code blocks - both complete and incomplete
  // Updated to also support <chartjs>...</chartjs> tags and skip other code blocks
  const chartRegex = /```chart(?:js)?\s*([\s\S]*?)```|```[\s\S]*?```|<chartjs>([\s\S]*?)<\/chartjs>/g;
  const incompleteChartRegex = /```chart(?:js)?\s*([\s\S]*?)$|<chartjs>([\s\S]*?)$/g;
  
  let match: RegExpExecArray | null;
  let offset = 0;

  try {
    const htmlDocRegex = /<!DOCTYPE[^>]*>[\s\S]*?<\/html>/gi;
    let htmlMatch: RegExpExecArray | null;
    while ((htmlMatch = htmlDocRegex.exec(text)) !== null) {
      const htmlBlock = htmlMatch[0];
      const cfg = chartService.parseChartJsHtml(htmlBlock);
      if (!cfg) continue;

      const chartId = `chart-${messageId}-${chartConfigs.length + pendingCharts.length}`;
      chartConfigs.push({
        id: chartId,
        config: cfg,
        position: htmlMatch.index - offset,
      });

      const placeholder = `<div class="chart-generation-placeholder" data-chart-id="${chartId}" data-is-generating="false"></div>`;
      processedText =
        processedText.substring(0, htmlMatch.index - offset) +
        placeholder +
        processedText.substring(htmlMatch.index - offset + htmlBlock.length);

      protectedRanges.push({ start: htmlMatch.index, end: htmlMatch.index + htmlBlock.length });
      offset += htmlBlock.length - placeholder.length;
    }
  } catch {}
  
  // Process complete chart blocks
  while ((match = chartRegex.exec(text)) !== null) {
    const matchIndex = match.index;
    // If it's a generic code block (no capture groups 1 or 2), skip it
    if (!match[1] && !match[2]) {
      continue;
    }
    if (protectedRanges.some(r => matchIndex >= r.start && matchIndex < r.end)) {
      continue;
    }

    try {
      const chartCode = (match[1] || match[2] || '').trim();
      const chartId = `chart-${messageId}-${chartConfigs.length + pendingCharts.length}`;
      
      if (chartCode) {
        try {
          const chartConfig = JSON.parse(chartCode) as ChartConfig;
          
          chartConfigs.push({
            id: chartId,
            config: chartConfig,
            position: matchIndex - offset
          });
          
          // Replace the chart code block with a placeholder for the ChartGenerationBox
          const placeholder = `<div class="chart-generation-placeholder" data-chart-id="${chartId}" data-is-generating="false"></div>`;
          processedText = processedText.substring(0, matchIndex - offset) + 
                        placeholder + 
                        processedText.substring(matchIndex - offset + match[0].length);
          
          // Update offset for next replacements
          offset += match[0].length - placeholder.length;
          
        } catch (parseError) {
          console.warn('Chart config parsing error:', parseError);
          // If parsing fails, treat as incomplete chart
          pendingCharts.push({
            id: chartId,
            position: matchIndex - offset,
            isComplete: false
          });
          
          const placeholder = `<div class="chart-generation-placeholder" data-chart-id="${chartId}" data-is-generating="true"></div>`;
          processedText = processedText.substring(0, matchIndex - offset) + 
                        placeholder + 
                        processedText.substring(matchIndex - offset + match[0].length);
          
          offset += match[0].length - placeholder.length;
        }
      } else {
        // Empty chart block - treat as generating
        pendingCharts.push({
          id: chartId,
          position: matchIndex - offset,
          isComplete: false
        });
        
        const placeholder = `<div class="chart-generation-placeholder" data-chart-id="${chartId}" data-is-generating="true"></div>`;
        processedText = processedText.substring(0, matchIndex - offset) + 
                      placeholder + 
                      processedText.substring(matchIndex - offset + match[0].length);
        
        offset += match[0].length - placeholder.length;
      }
      
    } catch (error) {
      console.error('Error processing chart block:', error);
    }
  }
  
  // Process incomplete chart blocks (streaming)
  if (isStreaming) {
    const incompleteMatch = incompleteChartRegex.exec(text);
    if (incompleteMatch && !chartRegex.test(text.substring(incompleteMatch.index))) {
      const chartId = `chart-${messageId}-${chartConfigs.length + pendingCharts.length}`;
      
      pendingCharts.push({
        id: chartId,
        position: incompleteMatch.index - offset,
        isComplete: false
      });
      
      const placeholder = `<div class="chart-generation-placeholder" data-chart-id="${chartId}" data-is-generating="true"></div>`;
      processedText = processedText.substring(0, incompleteMatch.index - offset) + 
                    placeholder + 
                    processedText.substring(incompleteMatch.index - offset + incompleteMatch[0].length);
    }
  }
  
  // Clip URLs inside incomplete <Image> tags during streaming so raw URLs never show
  if (isStreaming) {
    try {
      const openTag = /<\s*(?:Image|image)\s*>/gi;
      const closeTag = /<\s*\/\s*(?:Image|image)\s*>/gi;
      let lastIndex = 0;
      let out = '';
      while (true) {
        const openMatch = openTag.exec(processedText);
        if (!openMatch) {
          out += processedText.slice(lastIndex);
          break;
        }
        const start = openMatch.index;
        const afterOpen = processedText.slice(start);
        const closeMatchLocal = closeTag.exec(afterOpen);
        if (!closeMatchLocal) {
          // No closing tag yet: drop everything from open to end (hide URL until close arrives)
          out += processedText.slice(lastIndex, start);
          processedText = out; // truncate at first incomplete image tag
          break;
        } else {
          // Closing tag exists later in the text; keep segment intact for full transform, move cursor
          const absoluteCloseIndex = start + closeMatchLocal.index + closeMatchLocal[0].length;
          out += processedText.slice(lastIndex, absoluteCloseIndex);
          lastIndex = absoluteCloseIndex;
          // Reset regex positions relative to full string
          openTag.lastIndex = lastIndex;
          closeTag.lastIndex = 0;
        }
      }
    } catch {}
  }
  
  return { processedText, chartConfigs, pendingCharts };
};

// Enhanced Markdown text formatting function
const renderTextWithHTML = (text: string, darkMode: boolean, textStyle?: any) => {
  if (!text) return null;
  
  try {
    let processedText = text;
    processedText = unwrapHtmlCodeFence(processedText);
    processedText = normalizeDoctypeHTML(processedText);
    processedText = transformCustomImageTags(processedText);
    processedText = processMathExpressions(processedText);
    const sanitizedText = DOMPurify.sanitize(processedText, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's',
        'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'div', 'span', 'img', 'hr', 'sub', 'sup', 'math', 'semantics', 'mrow', 'mi', 'mo', 'mn', 'mfrac', 'msup', 'msub', 'msubsup', 'munder', 'mover', 'munderover', 'mtext', 'mspace', 'mpadded', 'mphantom', 'mfenced', 'menclose', 'mstyle', 'mlabeledtr', 'mtable', 'mtr', 'mtd', 'maligngroup', 'malignmark', 'maction', 'ai-images'
      ],
      ALLOWED_ATTR: ['class', 'id', 'src', 'alt', 'title', 'border', 'cellpadding', 'cellspacing', 'style', 'aria-hidden', 'xmlns', 'data-urls']
    });

    return (
      <MarkdownContentWithControls 
        source={sanitizedText} 
        darkMode={darkMode} 
        textStyle={textStyle} 
      />
    );
  } catch (error) {
    console.error('Error rendering text with HTML:', error);
    return (
      <div 
        className={`ai-response-content ai-message-text ${darkMode ? 'dark' : ''}`} 
        style={textStyle}
      >
        {text}
      </div>
    );
  }
};

const MarkdownContentWithControls: React.FC<{ source: string; darkMode: boolean; textStyle?: React.CSSProperties }> = ({ source, darkMode, textStyle }) => {
  const { showSuccess, showError } = useAlert();
  const containerRef = useRef<HTMLDivElement>(null);
  const setupControls = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const existing = container.querySelectorAll('.matrix-table-controls');
    existing.forEach(el => el.remove());
    if (!container.getAttribute('data-img-listener')) {
      container.setAttribute('data-img-listener', 'true');
      const openViewer = (url: string) => {
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.background = 'rgba(0,0,0,0.8)';
        overlay.style.zIndex = '1000';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        const box = document.createElement('div');
        box.style.position = 'relative';
        box.style.maxWidth = '90vw';
        box.style.maxHeight = '90vh';
        box.addEventListener('click', (e) => e.stopPropagation());
        const img = document.createElement('img');
        img.src = url;
        img.alt = 'Preview';
        img.style.maxWidth = '90vw';
        img.style.maxHeight = '90vh';
        img.style.objectFit = 'contain';
        img.style.borderRadius = '8px';
        img.style.boxShadow = '0 10px 30px rgba(0,0,0,0.4)';
        const btn = document.createElement('button');
        btn.textContent = 'Close';
        btn.style.position = 'absolute';
        btn.style.top = '8px';
        btn.style.right = '8px';
        btn.style.background = darkMode ? '#111' : '#fff';
        btn.style.color = darkMode ? '#eee' : '#111';
        btn.style.border = `1px solid ${darkMode ? '#333' : '#ddd'}`;
        btn.style.borderRadius = '6px';
        btn.style.padding = '6px 10px';
        btn.style.fontSize = '12px';
        btn.style.cursor = 'pointer';
        let closed = false;
        const close = () => {
          if (closed) return;
          closed = true;
          if (overlay && overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
        };
        btn.addEventListener('click', close);
        overlay.addEventListener('click', close);
        document.addEventListener('keydown', function esc(e) {
          if (e.key === 'Escape') {
            close();
            document.removeEventListener('keydown', esc);
          }
        });
        box.appendChild(img);
        box.appendChild(btn);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
      };
      container.addEventListener('click', (e) => {
        const t = e.target as HTMLElement;
        if (t && t.tagName === 'IMG') {
          // Skip images that are already managed by a dedicated viewer
          const managedAncestor = t.closest('[data-matrix-image-managed]');
          if (managedAncestor) return;
          const src = (t as HTMLImageElement).src;
          if (src) openViewer(src);
        }
      });
    }
    const tables = Array.from(container.querySelectorAll('table'));
    tables.forEach((table, idx) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'matrix-table-wrapper w-full my-2';
      const controls = document.createElement('div');
      controls.className = 'matrix-table-controls flex justify-end gap-2 mb-2';
      const downloadBtn = document.createElement('button');
      downloadBtn.className = `${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} px-2 sm:px-3 py-1 text-xs rounded-md transition-colors flex items-center justify-center`;
      downloadBtn.setAttribute('aria-label', 'Download Table');
      const dlIcon = document.createElement('span');
      dlIcon.className = 'inline-flex';
      dlIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"/></svg>`;
      const dlText = document.createElement('span');
      dlText.className = 'ml-1';
      dlText.textContent = 'Download Table';
      downloadBtn.appendChild(dlIcon);
      downloadBtn.appendChild(dlText);
      const shareBtn = document.createElement('button');
      shareBtn.className = `${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'} px-2 sm:px-3 py-1 text-xs rounded-md transition-colors flex items-center justify-center`;
      shareBtn.setAttribute('aria-label', 'Share Table');
      const shIcon = document.createElement('span');
      shIcon.className = 'inline-flex';
      shIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 12v.01M12 20v.01M20 12v.01M12 4v.01M8.464 8.464l7.072 7.072"/></svg>`;
      const shText = document.createElement('span');
      shText.className = 'ml-1';
      shText.textContent = 'Share';
      shareBtn.appendChild(shIcon);
      shareBtn.appendChild(shText);
      controls.appendChild(downloadBtn);
      controls.appendChild(shareBtn);
      if (table.parentElement) {
        table.parentElement.insertBefore(wrapper, table);
        wrapper.appendChild(controls);
        wrapper.appendChild(table);
      }
      const generateCanvas = async () => {
        const temp = document.createElement('div');
        temp.style.position = 'absolute';
        temp.style.left = '-10000px';
        temp.style.top = '0';
        temp.style.backgroundColor = darkMode ? '#1f2937' : '#ffffff';
        temp.style.padding = '16px';
        temp.className = `ChatPage ${darkMode ? 'dark' : ''} ai-response-content markdown-content`;
        const clone = table.cloneNode(true) as HTMLTableElement;
        clone.style.borderCollapse = 'collapse';
        const cells = clone.querySelectorAll('th, td');
        cells.forEach((cell) => {
          const el = cell as HTMLElement;
          el.style.border = `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`;
          el.style.padding = el.style.padding || '8px 12px';
        });
        temp.appendChild(clone);
        document.body.appendChild(temp);
        const html2canvas = await import('html2canvas');
        const canvas = await html2canvas.default(temp, { backgroundColor: darkMode ? '#1f2937' : '#ffffff', scale: Math.max(2, window.devicePixelRatio || 2), useCORS: true, allowTaint: true });
        document.body.removeChild(temp);
        return canvas;
      };
      downloadBtn.addEventListener('click', async () => {
        try {
          const canvas = await generateCanvas();
          const blob = await new Promise<Blob>((resolve) => canvas.toBlob(b => resolve(b!), 'image/png', 0.95));
          const link = document.createElement('a');
          link.download = `matcos.ai-table-${Date.now()}.png`;
          link.href = URL.createObjectURL(blob);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
          showSuccess('Table downloaded as PNG');
        } catch (e) {
          showError('Failed to download table');
        }
      });
      shareBtn.addEventListener('click', async () => {
        try {
          const canvas = await generateCanvas();
          const blob = await new Promise<Blob>((resolve) => canvas.toBlob(b => resolve(b!), 'image/png', 0.95));
          const file = new File([blob], `matcos.ai-table-${idx + 1}.png`, { type: 'image/png' });
          if ((navigator as any).canShare && (navigator as any).canShare({ files: [file] }) && navigator.share) {
            await navigator.share({ files: [file], title: 'matcos.ai Table' });
            showSuccess('Table shared');
          } else if ((window as any).ClipboardItem && navigator.clipboard) {
            const item = new (window as any).ClipboardItem({ 'image/png': blob });
            await navigator.clipboard.write([item]);
            showSuccess('Table image copied to clipboard');
          } else {
            const link = document.createElement('a');
            link.download = `matcos.ai-table-${Date.now()}.png`;
            link.href = URL.createObjectURL(blob);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
            showSuccess('Table downloaded as PNG');
          }
        } catch (e) {
          showError('Failed to share table');
        }
      });
    });
  }, [darkMode, showSuccess, showError]);
  useEffect(() => {
    setupControls();
  }, [source, setupControls]);
  return (
    <div 
      className={`ai-response-content ai-message-text ${darkMode ? 'dark' : ''}`} 
      style={textStyle}
    >
      <div ref={containerRef} className="markdown-content">
        {(() => {
          const isMostlyHTML = /<!DOCTYPE|<html\b|<body\b|<head\b|<h1\b|<p\b|<div\b|<table\b|<ul\b|<ol\b|<img\b|<ai-images\b|<svg\b/i.test(source);
          if (isMostlyHTML) {
            return <div dangerouslySetInnerHTML={{ __html: source }} />;
          }
          const mdComponents: any = {
            ['ai-images']: ({ node, ...props }: any) => {
              const data = props['data-urls'] || '';
              let urls: string[] = [];
              try {
                urls = JSON.parse(decodeURIComponent(String(data)));
              } catch {}
              return <AIImageStrip urls={urls} darkMode={darkMode} />;
            },
            code: ({ node, inline, className, children, ...props }: any) => {
              const match = /language-(\w+)/.exec(className || '');
              const language = match ? match[1] : '';
              const codeString = String(children).replace(/\n$/, '');
              if (language === 'svg') {
                const safeSvg = DOMPurify.sanitize(codeString, { USE_PROFILES: { svg: true, svgFilters: true } });
                return (
                  <div
                    className="my-2 overflow-x-auto"
                    dangerouslySetInnerHTML={{ __html: safeSvg }}
                  />
                );
              }
              if (!inline && (language || codeString.includes('\n'))) {
                return (
                  <CodeBlock
                    code={codeString}
                    language={language || 'text'}
                    theme={darkMode ? 'dark' : 'light'}
                    {...props}
                  />
                );
              }
              return (
                <code {...props}>
                  {children}
                </code>
              );
            },
            pre: ({ children }: any) => <div className="overflow-auto">{children}</div>,
          };
          return (
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex, rehypeRaw]}
              components={mdComponents}
            >
              {source}
            </ReactMarkdown>
          );
        })()}
      </div>
    </div>
  );
};

// Component for rendering text with embedded charts using ChartGenerationBox
const TextWithCharts: React.FC<{
  text: string;
  darkMode: boolean;
  messageId: string;
  isStreaming?: boolean;
  textStyle?: any;
}> = React.memo(({ text, darkMode, messageId, isStreaming = false, textStyle }) => {
  console.log('🔍 DEBUG: TextWithCharts component re-rendered for messageId:', messageId, 'isStreaming:', isStreaming);
  
  const { processedText, chartConfigs, pendingCharts } = useMemo(() => {
    console.log('🔍 DEBUG: processTextWithCharts called for messageId:', messageId);
    const result = processTextWithCharts(text, darkMode, messageId, isStreaming);
    console.log('🔍 DEBUG: processTextWithCharts result - chartConfigs count:', result.chartConfigs?.length || 0, 'pendingCharts count:', result.pendingCharts?.length || 0);
    return result;
  }, [text, darkMode, messageId, isStreaming]);
  
  // Create a custom renderer that replaces chart placeholders with ChartGenerationBox components
  const renderTextWithChartBoxes = useCallback(() => {
    if (!processedText) return renderTextWithHTML(text, darkMode, textStyle);
    
    // Split the processed text by chart placeholders
    const parts = processedText.split(/<div class="chart-generation-placeholder"[^>]*><\/div>/g);
    const placeholders = processedText.match(/<div class="chart-generation-placeholder"[^>]*><\/div>/g) || [];
    
    const elements: React.ReactNode[] = [];
    
    parts.forEach((part, index) => {
      // Add the text part
      if (part.trim()) {
        elements.push(
          <div key={`text-${index}`}>
            {renderTextWithHTML(part, darkMode, textStyle)}
          </div>
        );
      }
      
      // Add the chart component if there's a corresponding placeholder
      if (index < placeholders.length) {
        const placeholder = placeholders[index];
        const chartIdMatch = placeholder.match(/data-chart-id="([^"]+)"/);
        const isGeneratingMatch = placeholder.match(/data-is-generating="([^"]+)"/);
        
        if (chartIdMatch) {
          const chartId = chartIdMatch[1];
          const isGenerating = isGeneratingMatch?.[1] === 'true';
          
          // Find the corresponding chart config
          const chartConfig = chartConfigs.find(c => c.id === chartId);
          
          elements.push(
            <div key={`chart-${chartId}`} className="my-4">
              <ChartGenerationBox
                chartId={chartId}
                chartConfig={chartConfig?.config || {} as ChartConfig}
                darkMode={darkMode}
                isGenerating={isGenerating || !chartConfig}
                onGenerationComplete={() => {
                  console.log('Chart generation completed for:', chartId);
                }}
              />
            </div>
          );
        }
      }
    });
    
    return <div className="space-y-2">{elements}</div>;
  }, [processedText, chartConfigs, pendingCharts, text, darkMode, textStyle]);

  return renderTextWithChartBoxes();
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  // Only re-render if the actual props that matter have changed
  return (
    prevProps.text === nextProps.text &&
    prevProps.darkMode === nextProps.darkMode &&
    prevProps.messageId === nextProps.messageId &&
    prevProps.isStreaming === nextProps.isStreaming
  );
});

  // Role options with translations
  const roleOptions = [
    { id: 'general', name: t('chat.roles.general.name'), description: t('chat.roles.general.description') },
    { id: 'analyst', name: t('chat.roles.analyst.name'), description: t('chat.roles.analyst.description') },
    { id: 'doctor', name: t('chat.roles.doctor.name'), description: t('chat.roles.doctor.description') },
    { id: 'lawyer', name: t('chat.roles.lawyer.name'), description: t('chat.roles.lawyer.description') },
    { id: 'teacher', name: t('chat.roles.teacher.name'), description: t('chat.roles.teacher.description') },
    { id: 'programmer', name: t('chat.roles.programmer.name'), description: t('chat.roles.programmer.description') },
    { id: 'psychologist', name: t('chat.roles.psychologist.name'), description: t('chat.roles.psychologist.description') },
    { id: 'engineer', name: t('chat.roles.engineer.name'), description: t('chat.roles.engineer.description') },
    { id: 'surveyor', name: t('chat.roles.surveyor.name'), description: t('chat.roles.surveyor.description') },
    { id: 'architect', name: t('chat.roles.architect.name'), description: t('chat.roles.architect.description') },
    { id: 'financial', name: t('chat.roles.financial.name'), description: t('chat.roles.financial.description') },
  ];
  
  // Removed createInitialMessages function - using empty arrays for truly empty chats
  const location = useLocation();
  const { chatId: routeChatId } = useParams<{ chatId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedRole, setSelectedRole] = useState(roleOptions[0]);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [showChatHistory, setShowChatHistory] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<number | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [isMessageLimitReached, setIsMessageLimitReached] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isIntentionallyAborted, setIsIntentionallyAborted] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(process.env.REACT_APP_DEFAULT_AI_MODEL || 'qwen-max');
  
  // Word counting state variables
  const [wordCount, setWordCount] = useState(0);
  const [showWordWarning, setShowWordWarning] = useState(false);
  
  // Word limit constants
  const MAX_WORDS = 5000;
  const WARNING_THRESHOLD = 4500;
  
  // Word counting utility functions
  const countWords = (text: string): number => {
    if (!text.trim()) return 0;
    return text.trim().split(/\s+/).length;
  };
  
  const truncateToWordLimit = (text: string, maxWords: number): string => {
    if (!text.trim()) return text;
    const words = text.trim().split(/\s+/);
    if (words.length <= maxWords) return text;
    return words.slice(0, maxWords).join(' ');
  };

  const getLocalDayDiff = (dateInput: string | Date): number => {
    const d = typeof dateInput === 'string' ? new Date(dateInput) : new Date(dateInput);
    const now = new Date();
    const dMid = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const nowMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffMs = nowMid.getTime() - dMid.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  };
  
  // Touch state for swipe-to-close functionality
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  
  // Mobile keyboard detection state
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  
  // Lazy loading state
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);
  const [oldestMessagePosition, setOldestMessagePosition] = useState<number | undefined>(undefined);
  
  // Function to load more messages for lazy loading
  const loadMoreMessages = async () => {
    if (!chatId || isLoadingMoreMessages || !hasMoreMessages || oldestMessagePosition === undefined) {
      return;
    }

    setIsLoadingMoreMessages(true);
    try {
      const olderMessages = await getChatMessagesLazy(chatId, 10, oldestMessagePosition);
      
      if (olderMessages.length > 0) {
        // Convert to frontend format
        const processedMessages = olderMessages.map((msg: any) => {
          return supabaseMessageToFrontend(msg) as unknown as Message;
        }).filter((msg): msg is Message => Boolean(msg));
        
        // Prepend older messages to the beginning
        setMessages(prev => [...processedMessages, ...prev]);
        
        // Update oldest position
        setOldestMessagePosition(olderMessages[0]?.position);
        
        // Check if there are more messages
        setHasMoreMessages(olderMessages.length === 10);
      } else {
        setHasMoreMessages(false);
      }
    } catch (error) {
      console.error('Error loading more messages:', error);
    } finally {
      setIsLoadingMoreMessages(false);
    }
  };

  // Scroll event handler for lazy loading
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop } = messagesContainerRef.current;
      
      // If user scrolled to near the top (within 100px), load more messages
      if (scrollTop <= 100 && hasMoreMessages && !isLoadingMoreMessages) {
        loadMoreMessages();
      }
    }
  };

  // Chat history lazy loading: load next 10 chats when reaching bottom
  const handleChatHistoryScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const nearBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 100;
    if (nearBottom && hasMoreChatsList && !isLoadingMoreChats) {
      loadMoreChatsList();
    }
  };

  const loadMoreChatsList = async () => {
    try {
      if (isLoadingMoreChats) return;
      setIsLoadingMoreChats(true);

      // Resolve user id from context or session
      let userId = user?.id;
      if (!userId) {
        const { data: { session } } = await supabase.auth.getSession();
        userId = session?.user?.id || undefined;
      }
      if (!userId) {
        setIsLoadingMoreChats(false);
        return;
      }

      const nextBatch = await getNewUserChatsPaginated(userId, CHAT_LIST_PAGE_SIZE, chatListOffset);

      // Map to Chat objects without messages
      const newChats: Chat[] = nextBatch.map(chat => ({
        id: chat.id,
        title: chat.title || 'New Chat',
        messages: [],
        role: chat.role || 'general',
        roleDescription: '',
        description: ''
      }));

      // Deduplicate by id
      const existingIds = new Set(chats.map(c => c.id));
      const deduped = newChats.filter(c => !existingIds.has(c.id));

      if (deduped.length > 0) {
        setChats(prev => [...prev, ...deduped]);

        // Update groupedChatHistory with new chats
        setGroupedChatHistory(prev => {
          const findUseAt = (id: string) => (nextBatch.find(c => c.id === id) as any)?.use_at || nextBatch.find(c => c.id === id)?.created_at || new Date().toISOString();
          const addToGroup = (group: {id: string, title: string, role: string, roleName?: string}[], chat: Chat) => {
            const roleName = getRoleName(chat.role || 'general');
            return [...group, { id: chat.id, title: chat.title, role: chat.role || 'general', roleName }];
          };
          let today = [...prev.today];
          let yesterday = [...prev.yesterday];
          let lastWeek = [...prev.lastWeek];
          let lastMonth = [...prev.lastMonth];
          let older = [...prev.older];
          deduped.forEach(chat => {
            const ts = findUseAt(chat.id);
            const daysDiff = getLocalDayDiff(ts);
            if (daysDiff < 1) {
              today = addToGroup(today, chat);
            } else if (daysDiff < 2) {
              yesterday = addToGroup(yesterday, chat);
            } else if (daysDiff < 7) {
              lastWeek = addToGroup(lastWeek, chat);
            } else if (daysDiff < 30) {
              lastMonth = addToGroup(lastMonth, chat);
            } else {
              older = addToGroup(older, chat);
            }
          });
          return { today, yesterday, lastWeek, lastMonth, older };
        });
      }

      setChatListOffset(prev => prev + nextBatch.length);
      setHasMoreChatsList(nextBatch.length === CHAT_LIST_PAGE_SIZE);
    } catch (err) {
      console.error('Error loading more chats:', err);
    } finally {
      setIsLoadingMoreChats(false);
    }
  };

  // Add scroll listener for lazy loading
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [hasMoreMessages, isLoadingMoreMessages]);

  // Set CSS variables for sidebar widths on component mount
  useEffect(() => {
    document.documentElement.style.setProperty('--sidebar-width', '256px');
    document.documentElement.style.setProperty('--collapsed-sidebar-width', '64px');
    
    // Clean up when component unmounts
    return () => {
      document.documentElement.style.removeProperty('--sidebar-width');
      document.documentElement.style.removeProperty('--collapsed-sidebar-width');
    };
  }, []);

  // Mobile keyboard detection
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) { // Mobile breakpoint
        const viewportHeight = window.visualViewport?.height || window.innerHeight;
        const windowHeight = window.innerHeight;
        const heightDifference = windowHeight - viewportHeight;
        
        // Keyboard is considered open if viewport height is significantly smaller
        const keyboardOpen = heightDifference > 150;
        setIsKeyboardOpen(keyboardOpen);
      } else {
        setIsKeyboardOpen(false);
      }
    };

    // Listen to both resize and visual viewport changes
    window.addEventListener('resize', handleResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }

    // Initial check
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !(window as any).customElements) return;
    if (!window.customElements.get('ai-images')) {
      class AiImagesElement extends HTMLElement {
        connectedCallback() {
          const data = this.getAttribute('data-urls') || '[]';
          let urls: string[] = [];
          try {
            urls = JSON.parse(decodeURIComponent(String(data)));
          } catch {}
          const container = document.createElement('div');
          container.style.display = 'flex';
          container.style.flexWrap = 'nowrap';
          container.style.gap = '8px';
          container.style.overflowX = 'auto';
          // Mark as managed so global image handler ignores clicks inside
          container.setAttribute('data-matrix-image-managed', 'true');
          const removed: string[] = [];
          urls.forEach(u => {
            if (typeof u === 'string' && u) {
              const img = document.createElement('img');
              img.src = u;
              img.alt = 'Image';
              img.style.width = '400px';
              img.style.height = '280px';
              img.style.borderRadius = '8px';
              img.style.objectFit = 'cover';
              img.style.cursor = 'zoom-in';
              img.addEventListener('error', () => {
                if (img.parentNode) img.parentNode.removeChild(img);
                removed.push(u);
              });
              img.addEventListener('click', () => {
                const overlay = document.createElement('div');
                overlay.style.position = 'fixed';
                overlay.style.inset = '0';
                overlay.style.background = 'rgba(0,0,0,0.8)';
                overlay.style.zIndex = '1000';
                overlay.style.display = 'flex';
                overlay.style.alignItems = 'center';
                overlay.style.justifyContent = 'center';
                const box = document.createElement('div');
                box.style.position = 'relative';
                box.style.maxWidth = '90vw';
                box.style.maxHeight = '90vh';
                box.addEventListener('click', (e) => e.stopPropagation());
                const big = document.createElement('img');
                big.src = u;
                big.alt = 'Preview';
                big.style.maxWidth = '90vw';
                big.style.maxHeight = '90vh';
                big.style.objectFit = 'contain';
                big.style.borderRadius = '8px';
                big.style.boxShadow = '0 10px 30px rgba(0,0,0,0.4)';
                const btn = document.createElement('button');
                btn.textContent = 'Close';
                btn.style.position = 'absolute';
                btn.style.top = '8px';
                btn.style.right = '8px';
                btn.style.background = '#fff';
                btn.style.color = '#111';
                btn.style.border = '1px solid #ddd';
                btn.style.borderRadius = '6px';
                btn.style.padding = '6px 10px';
                btn.style.fontSize = '12px';
                btn.style.cursor = 'pointer';
                let closed = false;
                const close = () => {
                  if (closed) return;
                  closed = true;
                  if (overlay && overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                  }
                };
                btn.addEventListener('click', close);
                overlay.addEventListener('click', close);
                document.addEventListener('keydown', function esc(e) {
                  if (e.key === 'Escape') {
                    close();
                    document.removeEventListener('keydown', esc);
                  }
                });
                box.appendChild(big);
                box.appendChild(btn);
                overlay.appendChild(box);
                document.body.appendChild(overlay);
              });
              container.appendChild(img);
            }
          });
          while (this.firstChild) this.removeChild(this.firstChild);
          this.appendChild(container);
        }
      }
      window.customElements.define('ai-images', AiImagesElement as any);
    }
  }, []);

  // Drag and drop event handlers

  // Add global drag and drop event listeners
  useEffect(() => {
    const onDragOver = (e: DragEvent) => {
      if (isFileUploadPopupOpenRef.current) return;
      const types = e.dataTransfer?.types;
      if (types && Array.from(types).includes('Files')) {
        e.preventDefault();
        setIsFileUploadPopupOpen(true);
      }
    };
    const onDrop = (e: DragEvent) => {
      if (isFileUploadPopupOpenRef.current) return;
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        e.preventDefault();
        const file = files[0];
        setInitialDroppedFile(file);
        setIsFileUploadPopupOpen(true);
      }
    };
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', onDrop);
    };
  }, []);

  // Function to calculate coin cost based on current state
  const calculateCoinCost = () => {
    // Check for PDF vision first (highest priority for accurate cost calculation)
    if (pendingPdfFile && pendingPdfFile.pdfVisionData?.page_count) {
      return pendingPdfFile.pdfVisionData.page_count * 2; // pages * 2 coins for PDF vision
    }
    
    // Check for generation types (high priority)
    if (selectedGenerationType === 'sheet_generate' || selectedGenerationType === 'document_generate') {
      return 3; // -3 coins for xlsx/docx generation
    }
    
    // Check for file attachments
    if (selectedFile) {
      // Check if it's an image
      if (selectedFile.type.startsWith('image/')) {
        return 3; // -3 coins for images
      }
      // For other files (documents, PDFs, etc.)
      return 10; // -10 coins for file attachments
    }
    
    // Check for uploaded files
    if (uploadedFiles.length > 0) {
      // Check if any uploaded file is an image
      const hasImage = uploadedFiles.some(file => file.fileType === 'image');
      if (hasImage && uploadedFiles.length === 1 && uploadedFiles[0].fileType === 'image') {
        return 3; // -3 coins for single image
      }
      return 10; // -10 coins for file attachments
    }
    
    // Check for current uploaded file
    if (currentUploadedFile) {
      if (currentUploadedFile.fileType === 'image') {
        return 3; // -3 coins for images
      }
      return 10; // -10 coins for documents
    }

    // If Search is armed for a text-only message, charge 0 coins
    if (
      isSearchQueued &&
      !selectedGenerationType &&
      !selectedFile &&
      uploadedFiles.length === 0 &&
      !currentUploadedFile &&
      !pendingPdfFile
    ) {
      return 0;
    }
    
    // Default for text messages
    return 1; // -1 coin for simple text
  };
  

  const [groupedChatHistory, setGroupedChatHistory] = useState<{
    today: { id: string, title: string, role: string, roleName?: string }[],
    yesterday: { id: string, title: string, role: string, roleName?: string }[],
    lastWeek: { id: string, title: string, role: string, roleName?: string }[],
    lastMonth: { id: string, title: string, role: string, roleName?: string }[],
    older: { id: string, title: string, role: string, roleName?: string }[]
  }>({
    today: [],
    yesterday: [],
    lastWeek: [],
    lastMonth: [],
    older: []
  });
  const [messageHistory, setMessageHistory] = useState<{ role: string, content: string }[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [chatId, setChatId] = useState<string | null>(routeChatId || null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<number | null>(null);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(false);
  const [displayedText, setDisplayedText] = useState<{[key: number]: string}>({});
  const [isTyping, setIsTyping] = useState<{[key: number]: boolean}>({});
  const [currentLineIndex, setCurrentLineIndex] = useState<{[key: number]: number}>({});
  const [processingStatus, setProcessingStatus] = useState<{
    isProcessing: boolean;
    currentPage: number;
    totalPages: number;
    fileName: string;
  } | null>(null);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState<boolean>(false);
  const [currentWordIndex, setCurrentWordIndex] = useState<{[key: number]: number}>({});
  const [wordChunks, setWordChunks] = useState<{[key: number]: string[][]}>({});
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [isLoadingChats, setIsLoadingChats] = useState(true);

  // Debug function to log loading state changes
  const debugSetIsLoadingChats = useCallback((value: boolean) => {
    console.log(`🔄 Setting isLoadingChats to: ${value}`);
    setIsLoadingChats(value);
  }, []);

  // Override setIsLoadingChats with debug version
  const setIsLoadingChatsDebug = debugSetIsLoadingChats;
  const [isInitialRouteResolving, setIsInitialRouteResolving] = useState<boolean>(true);
  const [chats, setChats] = useState<Chat[]>([]);
  const [showProAlert, setShowProAlert] = useState(false);
  const CHAT_LIST_PAGE_SIZE = 10;
  const [chatListOffset, setChatListOffset] = useState<number>(0);
  const [hasMoreChatsList, setHasMoreChatsList] = useState<boolean>(true);
  const [isLoadingMoreChats, setIsLoadingMoreChats] = useState<boolean>(false);
  
  // Drag and drop state
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedGenerationType, setSelectedGenerationType] = useState<string | null>(null);
  const [coinsUsed, setCoinsUsed] = useState<{[key: number]: number}>({});
  // Queue search type for the next text-only send
  const [isSearchQueued, setIsSearchQueued] = useState<boolean>(false);
  // UI-only toggle to visually activate the search button (no functionality)
  const [isSearchActive, setIsSearchActive] = useState<boolean>(false);
  const [isFilePreviewOpen, setIsFilePreviewOpen] = useState(false);
  const [previewFileUrl, setPreviewFileUrl] = useState('');
  const [previewFileName, setPreviewFileName] = useState('');
  const [previewFileType, setPreviewFileType] = useState<'spreadsheet' | 'document'>('spreadsheet');
  
  // File upload states
  const [isFileUploadPopupOpen, setIsFileUploadPopupOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{
    url: string;
    fileName: string;
    fileType: 'image' | 'document' | 'pdf_vision';
    originalName: string;
    size: number;
  }[]>([]);
  const [isChargeModalOpen, setIsChargeModalOpen] = useState(false);
  
  // Thinking indicator states
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingContent, setThinkingContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentUploadedFile, setCurrentUploadedFile] = useState<FileUploadResult | null>(null);
  const [uploadingFileName, setUploadingFileName] = useState('');
  const [pendingPdfFile, setPendingPdfFile] = useState<FileUploadResult | null>(null);
  const [initialDroppedFile, setInitialDroppedFile] = useState<File | null>(null);
  const isFileUploadPopupOpenRef = useRef(false);
  useEffect(() => {
    isFileUploadPopupOpenRef.current = isFileUploadPopupOpen;
  }, [isFileUploadPopupOpen]);

  // Right panel state management
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [rightPanelWidth, setRightPanelWidth] = useState(320);
  const [isDragging, setIsDragging] = useState(false);
  const [citationsOpen, setCitationsOpen] = useState(false);
  const [citationsLinks, setCitationsLinks] = useState<string[]>([]);

  // Intelligent image generation state
  const [intelligentImageGenerations, setIntelligentImageGenerations] = useState<Map<number, {
    isGenerating: boolean;
    stage: 'analyzing' | 'generating_description' | 'calling_api' | 'completed' | 'error';
    imageUrl?: string;
    description?: string;
    error?: string;
    generationId?: string;
    coinCost?: number;
  }>>(new Map());

  // Force refresh state for chat history
  const [chatHistoryRefreshKey, setChatHistoryRefreshKey] = useState(0);

  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const chatInputAreaRef = useRef<HTMLDivElement>(null);
  const historyDropdownRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const sseAbortRef = useRef<AbortController | null>(null);
  const chunksChannelRef = useRef<any>(null);
  const mobileChatHistoryRef = useRef<HTMLDivElement>(null);
  const desktopChatHistoryRef = useRef<HTMLDivElement>(null);
  // Holds the next text-only message type override (e.g., 'search')
  const nextMessageTypeRef = useRef<string | null>(null);
  // Interval ref for rotating search placeholders during queued search
  const searchPlaceholderIntervalRef = useRef<number | null>(null);
  const initialLoadDoneRef = useRef(false);
  const [isChatSwitching, setIsChatSwitching] = useState(false);
  const shouldSyncChatIdToUrlRef = useRef<boolean>(!!routeChatId);
  const updateUrlToChatId = (id: string) => {
    if (!shouldSyncChatIdToUrlRef.current) return;
    if (location.pathname !== `/chat/${id}`) {
      navigate(`/chat/${id}`, { replace: true });
    }
  };
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const updateMobileInputHeight = () => {
      if (window.innerWidth > 768) return;
      if (!chatInputAreaRef.current) return;
      const rect = chatInputAreaRef.current.getBoundingClientRect();
      const height = Math.max(0, Math.round(rect.height));
      document.documentElement.style.setProperty('--mobile-input-height', `${height}px`);
    };
    updateMobileInputHeight();
    window.addEventListener('resize', updateMobileInputHeight);
    return () => {
      window.removeEventListener('resize', updateMobileInputHeight);
    };
  }, [
    showGenerationButtons,
    isGenerating,
    selectedFile,
    currentUploadedFile,
    uploadedFiles.length,
    pendingPdfFile,
    isKeyboardOpen
  ]);

 

  // Function to detect and extract file URLs from bot responses
  const extractFileUrlFromBotResponse = (content: string): {
    cleanContent: string;
    fileUrl: string | null;
    fileName: string | null;
    fileType: string | null;
  } => {
    if (!content || typeof content !== 'string') {
      return { cleanContent: content, fileUrl: null, fileName: null, fileType: null };
    }

    // Helper function to extract file info from URL
    const extractFileInfo = (fileUrl: string) => {
      let fileName = 'Downloaded File';
      let fileType = 'application/octet-stream';
      
      try {
        const urlParts = fileUrl.split('/');
        const lastPart = urlParts[urlParts.length - 1];
        
        if (lastPart.includes('.')) {
          fileName = lastPart;
          const extension = lastPart.split('.').pop()?.toLowerCase();
          
          // Determine file type based on extension
          if (extension === 'xlsx') {
            fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            fileName = fileName || 'Generated Spreadsheet.xlsx';
          } else if (extension === 'docx') {
            fileType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
            fileName = fileName || 'Generated Document.docx';
          } else if (extension === 'pdf') {
            fileType = 'application/pdf';
            fileName = fileName || 'Generated Document.pdf';
          } else if (extension === 'csv') {
            fileType = 'text/csv';
            fileName = fileName || 'Generated Data.csv';
          } else if (extension === 'txt') {
            fileType = 'text/plain';
            fileName = fileName || 'Generated Text.txt';
          } else if (extension === 'json') {
            fileType = 'application/json';
            fileName = fileName || 'Generated Data.json';
          } else if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(extension || '')) {
            fileType = `image/${extension === 'jpg' ? 'jpeg' : extension}`;
            fileName = fileName || `Generated Image.${extension}`;
          }
        }
      } catch (error) {
        console.error('Error parsing file URL:', error);
      }
      
      return { fileName, fileType };
    };

    // Pattern 1: Look for the pattern: "The file is ready. You can download it using the following link: `URL`"
    const fileReadyPattern = /The file is ready\.\s*You can download it using the following link:\s*`([^`]+)`/i;
    const match = content.match(fileReadyPattern);
    
    if (match) {
      const fileUrl = match[1].replace(/<[^>]*>/g, '').replace(/[`'"]/g, '').trim();
      const { fileName, fileType } = extractFileInfo(fileUrl);
      const isXlsx = (fileType || '').includes('spreadsheetml.sheet');
      const isDocx = (fileType || '').includes('wordprocessingml.document');
      const isImage = (fileType || '').startsWith('image/');
      
      const cleanContent = content.replace(fileReadyPattern, isImage ? `<Image>${fileUrl}</Image>` : '').trim();
      
      if (isXlsx || isDocx) {
        return {
          cleanContent: cleanContent || 'File generated successfully!',
          fileUrl,
          fileName,
          fileType
        };
      }
      if (isImage) {
        return {
          cleanContent: cleanContent || `<Image>${fileUrl}</Image>`,
          fileUrl: null,
          fileName,
          fileType
        };
      }
      return {
        cleanContent,
        fileUrl: null,
        fileName,
        fileType
      };
    }

    // Pattern 2: Look for URLs in backticks (like the user's example)
    const backtickUrlPattern = /`(https?:\/\/[^`\s]+)`/g;
    const backtickMatches = Array.from(content.matchAll(backtickUrlPattern)) as RegExpMatchArray[];
    if (backtickMatches.length > 0) {
      const imageOpenRegex = /<\s*(?:Image|image)\b[^>]*>/gi;
      const imageCloseRegex = /<\s*\/\s*(?:Image|image)\s*>/gi;
      const imageRanges: Array<{ start: number; end: number }> = [];
      let mOpen: RegExpExecArray | null;
      let mClose: RegExpExecArray | null;
      const opens: number[] = [];
      const closes: number[] = [];
      while ((mOpen = imageOpenRegex.exec(content)) !== null) {
        opens.push(mOpen.index);
      }
      while ((mClose = imageCloseRegex.exec(content)) !== null) {
        closes.push(mClose.index);
      }
      for (let i = 0; i < opens.length; i++) {
        const start = opens[i];
        const end = closes.find(c => c > start);
        if (end !== undefined) {
          imageRanges.push({ start, end });
        }
      }
      const isInsideImageRange = (idx: number) =>
        imageRanges.some(r => idx > r.start && idx < r.end);
      const isInsideTag = (idx: number) => {
        const lastLt = content.lastIndexOf('<', idx);
        const lastGt = content.lastIndexOf('>', idx);
        return lastLt > lastGt;
      };
      const candidate = backtickMatches.find(mt => {
        const idx = mt.index ?? content.indexOf(mt[0]);
        if (idx < 0) return false;
        if (isInsideImageRange(idx)) return false;
        if (isInsideTag(idx)) return false;
        return true;
      });
      if (candidate) {
        const raw = candidate[1];
        const fileUrl = raw.replace(/<[^>]*>/g, '').replace(/[`'"]/g, '').trim();
        const { fileName, fileType } = extractFileInfo(fileUrl);
        const matchText = candidate[0];
        const isXlsx = (fileType || '').includes('spreadsheetml.sheet');
        const isDocx = (fileType || '').includes('wordprocessingml.document');
        const isImage = (fileType || '').startsWith('image/');
        const cleanContent = content.replace(matchText, isImage ? `<Image>${fileUrl}</Image>` : '').trim();
        if (isXlsx || isDocx) {
          return {
            cleanContent: cleanContent || 'File is available for download!',
            fileUrl,
            fileName,
            fileType
          };
        }
        if (isImage) {
          return {
            cleanContent: cleanContent || `<Image>${fileUrl}</Image>`,
            fileUrl: null,
            fileName,
            fileType
          };
        }
        return {
          cleanContent,
          fileUrl: null,
          fileName,
          fileType
        };
      }
    }

    // Pattern 3: Look for anchor tags with href pointing to downloadable files
    try {
      const anchorRegex = /<a\b[^>]*href\s*=\s*([`"'])([\s\S]*?)\1[^>]*>/ig;
      const anchorMatch = anchorRegex.exec(content);
      if (anchorMatch) {
        let href = (anchorMatch[2] || '').replace(/[`'"]/g, '').trim();
        href = href.replace(/\s+/g, ' ').trim();
        href = href.replace(/\\$/g, '').trim();
        if (/^https?:\/\//i.test(href)) {
          const { fileName, fileType } = extractFileInfo(href);
          const isXlsx = (fileType || '').includes('spreadsheetml.sheet');
          const isDocx = (fileType || '').includes('wordprocessingml.document');
          const isImage = (fileType || '').startsWith('image/');
          if (isXlsx || isDocx) {
            return {
              cleanContent: content,
              fileUrl: href,
              fileName,
              fileType
            };
          }
          if (isImage) {
            const replaced = content.replace(anchorRegex, `<Image>${href}</Image>`);
            return {
              cleanContent: replaced,
              fileUrl: null,
              fileName,
              fileType
            };
          }
          const removed = content.replace(anchorRegex, '').trim();
          return { cleanContent: removed, fileUrl: null, fileName, fileType };
        }
      }
    } catch {}

    // Pattern 4: Look for direct Supabase storage URLs (not in backticks)
    const supabaseUrlPattern = /(https:\/\/[^\/]+\.supabase\.co\/storage\/v1\/object\/public\/[^\s<>"'`]+?)(?=\s|<|$)/i;
    const supabaseMatch = content.match(supabaseUrlPattern);
    
    if (supabaseMatch) {
      const fileUrl = supabaseMatch[1];
      const { fileName, fileType } = extractFileInfo(fileUrl);
      const isXlsx = (fileType || '').includes('spreadsheetml.sheet');
      const isDocx = (fileType || '').includes('wordprocessingml.document');
      const isImage = (fileType || '').startsWith('image/');
      const cleanContent = content.replace(supabaseUrlPattern, isImage ? `<Image>${fileUrl}</Image>` : '').trim();
      if (isXlsx || isDocx) {
        return {
          cleanContent: cleanContent || 'File is ready for download!',
          fileUrl,
          fileName,
          fileType
        };
      }
      if (isImage) {
        return {
          cleanContent: cleanContent || `<Image>${fileUrl}</Image>`,
          fileUrl: null,
          fileName,
          fileType
        };
      }
      return { cleanContent, fileUrl: null, fileName, fileType };
    }

    // Pattern 5: Markdown image syntax ![alt](url)
    const markdownImagePattern = /!\[.*?\]\((https?:\/\/[^)]+)\)/;
    const markdownMatch = content.match(markdownImagePattern);
    if (markdownMatch) {
      const fileUrl = markdownMatch[1];
      const { fileName, fileType } = extractFileInfo(fileUrl);
      const cleanContent = content.replace(markdownImagePattern, `<Image>${fileUrl}</Image>`).trim();
      return {
        cleanContent: cleanContent || `<Image>${fileUrl}</Image>`,
        fileUrl: null,
        fileName,
        fileType: fileType || 'image/png'
      };
    }

    // Pattern 6: Generic image extensions (raw URLs)
    // Matches http/https URLs ending with common image extensions
    const imageExtensionPattern = /(https?:\/\/[^\s<>"'`]+?\.(?:png|jpg|jpeg|gif|webp))(?=\s|<|$)/i;
    const imageMatch = content.match(imageExtensionPattern);
    if (imageMatch) {
      const fileUrl = imageMatch[1];
      const { fileName, fileType } = extractFileInfo(fileUrl);
      const cleanContent = content.replace(imageExtensionPattern, `<Image>${fileUrl}</Image>`).trim();
      return {
        cleanContent: cleanContent || `<Image>${fileUrl}</Image>`,
        fileUrl: null,
        fileName,
        fileType: fileType || 'image/png'
      };
    }
    
    return { cleanContent: content, fileUrl: null, fileName: null, fileType: null };
  };

  // Fetch user chats from database without updating current messages
  const fetchUserChatsWithoutMessageUpdate = useCallback(async () => {
    try {
      console.log('🔄 fetchUserChatsWithoutMessageUpdate - Starting chat fetch without message update');
      
      // Get user session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user?.id) {
        console.log('⚠️ fetchUserChatsWithoutMessageUpdate - No valid Supabase session found');
        return [];
      }
      
      const userId = session.user.id;
      
      // Get first page of chats using the new paginated chat service
      const supabaseChats = await getNewUserChatsPaginated(userId, CHAT_LIST_PAGE_SIZE, 0);
      
      if (!supabaseChats || supabaseChats.length === 0) {
        console.log('⚠️ fetchUserChatsWithoutMessageUpdate - No chats found');
        return [];
      }
      
      console.log('📊 fetchUserChatsWithoutMessageUpdate - Fetched chats count:', supabaseChats.length);
      
      // Convert to Chat objects without messages
      const formattedChats: Chat[] = supabaseChats.map(chat => ({
        id: chat.id,
        title: chat.title || 'New Chat',
        messages: [],
        role: chat.role || 'general',
        roleDescription: '',
        description: ''
      }));

      const today: {id: string, title: string, role: string}[] = [];
      const yesterday: {id: string, title: string, role: string}[] = [];
      const lastWeek: {id: string, title: string, role: string}[] = [];
      const lastMonth: {id: string, title: string, role: string}[] = [];

      const useAtMap = new Map<string, string>();
      supabaseChats.forEach(c => {
        const ts = (c as any).use_at || c.created_at;
        if (ts) useAtMap.set(c.id, ts);
      });

      formattedChats.forEach(chat => {
        const ts = useAtMap.get(chat.id) || new Date().toISOString();
        const daysDiff = getLocalDayDiff(ts);
        const chatInfo = { id: chat.id, title: chat.title, role: chat.role || 'general' };
        if (daysDiff < 1) {
          today.push(chatInfo);
        } else if (daysDiff < 2) {
          yesterday.push(chatInfo);
        } else if (daysDiff < 7) {
          lastWeek.push(chatInfo);
        } else {
          lastMonth.push(chatInfo);
        }
      });

      setGroupedChatHistory({ today, yesterday, lastWeek, lastMonth, older: [] });
      setChats(formattedChats);
      setChatListOffset(supabaseChats.length);
      setHasMoreChatsList(supabaseChats.length === CHAT_LIST_PAGE_SIZE);

      return formattedChats;
      
    } catch (error) {
      console.error('Error fetching chats for real-time update:', error);
      return [];
    }
  }, []);

  // Fetch user chats from database
  const fetchUserChats = useCallback(async () => {
    try {
      console.log('=== FETCH USER CHATS START ===');
      console.log('🔍 DEBUG: fetchUserChats called - this should NOT happen when typing!');
      console.log('AuthContext user:', user);
      console.log('Route chat ID:', routeChatId);
      setIsLoadingChatsDebug(true);
      
      // First check if we have a user from AuthContext
      if (user && user.id) {
        console.log('✅ Using authenticated user from AuthContext:', user.id);
        console.log('User object:', JSON.stringify(user, null, 2));
        
        // Use new chat service to get user chats
        console.log('🔍 Fetching chats using new chat service for user:', user.id);
        
        const userChats = await getNewUserChatsPaginated(user.id, CHAT_LIST_PAGE_SIZE, 0);
        
        console.log('📊 Fetched chats count from new service:', userChats?.length || 0);
        console.log('📋 Raw chats data:', JSON.stringify(userChats, null, 2));
        
        if (userChats && userChats.length > 0) {
          console.log('✅ Found chats, formatting for UI...');
          
          // Format chats for UI without loading messages
          const formattedChats = userChats.map(chat => ({
            id: chat.id,
            title: chat.title || 'New Chat',
            messages: [],
            role: chat.role || 'general',
            roleDescription: (chat.metadata as any)?.roleDescription || '',
            description: (chat.metadata as any)?.description || ''
          }));
          
          // Convert FrontendMessage to Message format for UI compatibility
          const convertedChats = formattedChats.map(chat => {
            console.log('📝 Processing chat:', chat.id, 'with', chat.messages?.length || 0, 'messages');
            
            // Convert FrontendMessage format to Message format
            const convertedMessages = (chat.messages || []).map((msg: any, index: number) => {
              // Create unique numeric ID for Message interface
              const numericId = msg.message_id ? parseInt(msg.message_id.replace(/\D/g, '')) || index : index;
              
              // Convert FrontendMessage to Message format
              return {
                id: numericId,
                role: msg.role || 'user',
                content: msg.content || '',
                timestamp: msg.timestamp || new Date().toISOString(),
                fileContent: msg.fileContent,
                fileName: msg.fileName,
                sender: msg.role === 'assistant' ? 'bot' : 'user',
                text: msg.content,
                isStreaming: msg.isStreaming || false,
                // Include attachment fields from Supabase
                file_url: msg.file_url,
                file_name: msg.file_name,
                file_type: msg.file_type,
                file_size: msg.file_size
              };
            });
            
            return {
              id: chat.id,
              title: chat.title,
              messages: convertedMessages,
              role: chat.role || 'general',
              roleDescription: chat.roleDescription || '',
              description: chat.description || ''
            };
          });
          
          // Group chats by recency
           const todayChats: {id: string, title: string, role: string}[] = [];
           const yesterdayChats: {id: string, title: string, role: string}[] = [];
           const lastWeekChats: {id: string, title: string, role: string}[] = [];
           const lastMonthChats: {id: string, title: string, role: string}[] = [];
           const olderChats: {id: string, title: string, role: string}[] = [];
           
          const useAtMap = new Map<string, string>();
          userChats.forEach(c => {
            const ts = (c as any).use_at || c.created_at;
            if (ts) useAtMap.set(c.id, ts);
          });

          convertedChats.forEach(chat => {
            const chatInfo = {
              id: chat.id,
              title: chat.title,
              role: chat.role || 'general'
            };
            const ts = useAtMap.get(chat.id) || new Date().toISOString();
            const daysDiff = getLocalDayDiff(ts);
            if (daysDiff < 1) {
              todayChats.push(chatInfo);
            } else if (daysDiff < 2) {
              yesterdayChats.push(chatInfo);
            } else if (daysDiff < 7) {
              lastWeekChats.push(chatInfo);
            } else if (daysDiff < 30) {
              lastMonthChats.push(chatInfo);
            } else {
              olderChats.push(chatInfo);
            }
          });
          
          // Update state with grouped chat history
           setGroupedChatHistory({
             today: todayChats,
             yesterday: yesterdayChats,
             lastWeek: lastWeekChats,
             lastMonth: lastMonthChats,
             older: olderChats
           });
          
          // Update chats state with all converted chats
          setChats(formattedChats);

          // Pagination state for chat list
          setChatListOffset(userChats.length);
          setHasMoreChatsList(userChats.length === CHAT_LIST_PAGE_SIZE);
          
          // If a specific chat ID was provided in the route, load that chat
          if (routeChatId) {
            console.log('🎯 Selecting chat from URL:', routeChatId);
            await selectChat(routeChatId);
          } else if (formattedChats.length > 0) {
            const mostRecentChat = formattedChats[0];
            console.log('📅 Selecting most recent chat:', mostRecentChat.id);
            await selectChat(mostRecentChat.id);
          }

          setIsLoadingChatsDebug(false);
          setIsInitialRouteResolving(false);
          return; // Exit early since we've handled everything
        } else {
          const lastChat = chats.length > 0 ? chats[chats.length - 1] : null;
          const lastChatHasMessages = !!lastChat && (lastChat.messages?.length || 0) > 0;
          const shouldCreateNew = chats.length === 0 || lastChatHasMessages;
          if (shouldCreateNew) {
            const newChatId = routeChatId || crypto.randomUUID();
            setChatId(newChatId);
            setMessages([]);
            setSelectedRole(roleOptions[0]);
            setGroupedChatHistory({
              today: [],
              yesterday: [],
              lastWeek: [],
              lastMonth: [],
              older: []
            });
            setChats([]);
          }
          setIsLoadingChatsDebug(false);
          setIsInitialRouteResolving(false);
          return;
        }
      } else {
        console.log('⚠️ No user in AuthContext, trying Supabase session...');
      }
      
      // Fallback to Supabase session if AuthContext user didn't work
      console.log('🔄 Falling back to Supabase session...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('📋 Supabase session:', session);
      
      if (sessionError) {
        console.error('❌ Authentication error:', sessionError);
        setIsLoadingChatsDebug(false);
        
        // Use local chat in case of auth error
        const localChatId = routeChatId || crypto.randomUUID();
        setChatId(localChatId);
        setChats([{
          id: localChatId,
          title: 'Local Chat',
          messages: [],
          role: 'general',
          description: 'Offline mode'
        }]);
        
        return;
      }
      
        if (!session?.user?.id) {
          console.log('⚠️ No authenticated user found, using local chat');
          setIsLoadingChatsDebug(false);
          
          // Set up a local chat when not authenticated
          const localChatId = routeChatId || crypto.randomUUID();
          setChatId(localChatId);
          setChats([{
            id: localChatId,
            title: 'Local Chat',
            messages: [],
            role: 'general',
            description: 'Guest mode'
          }]);
          
          // Set empty groups for history
          setGroupedChatHistory({
            today: [],
            yesterday: [],
            lastWeek: [],
            lastMonth: [],
            older: []
          });
          
          setIsInitialRouteResolving(false);
          return;
        }
      
      // Get the user ID from the session
      const userId = session.user.id;
      console.log('🆔 fetchUserChats - User ID from session:', userId);
      
      // Query all chats for this user
      console.log('🔍 Querying chats table with session user_id:', userId);
      const userChats = await getNewUserChatsPaginated(userId, CHAT_LIST_PAGE_SIZE, 0);
      const chatsError = userChats.length === 0 ? null : null; // Simplified error handling
      
      console.log('📊 fetchUserChats - Fetched chats count:', userChats?.length || 0);
      console.log('📋 Session chats data:', JSON.stringify(userChats, null, 2));
      if (chatsError) {
        console.error('❌ fetchUserChats - Error details:', chatsError);
      }
      
      if (chatsError) {
        console.error('Error fetching user chats:', chatsError);
        setIsLoadingChatsDebug(false);
        
        // Use local chat in case of fetch error
        const localChatId = routeChatId || crypto.randomUUID();
        setChatId(localChatId);
        setChats([{
          id: localChatId,
          title: 'Local Chat',
          messages: [],
          role: 'general',
          description: 'Connection error - working offline'
        }]);
        
        setIsInitialRouteResolving(false);
        return;
      }
      
      if (userChats && userChats.length > 0) {
        // Format chats for our UI using new structure
        const formattedChats = userChats.map(chat => {
          return {
            id: chat.id,
            title: chat.title || 'New Chat',
            messages: [], // Messages will be loaded separately when needed
            role: 'general', // Default role for new structure
            roleDescription: '',
            description: ''
          };
        });
        
        // Group chats by recency
        const today: {id: string, title: string, role: string}[] = [];
        const yesterday: {id: string, title: string, role: string}[] = [];
        const lastWeek: {id: string, title: string, role: string}[] = [];
        const lastMonth: {id: string, title: string, role: string}[] = [];
        
        const useAtMap = new Map<string, string>();
        userChats.forEach(c => {
          const ts = (c as any).use_at || c.created_at;
          if (ts) useAtMap.set(c.id, ts);
        });
        formattedChats.forEach(chat => {
          const chatRole = chat.role || 'general';
          const roleName = getRoleName(chatRole);
          const chatObj = { id: chat.id, title: chat.title, role: chatRole, roleName };
          const ts = useAtMap.get(chat.id) || new Date().toISOString();
          const daysDiff = getLocalDayDiff(ts);
          if (daysDiff < 1) {
            today.push(chatObj);
          } else if (daysDiff < 2) {
            yesterday.push(chatObj);
          } else if (daysDiff < 7) {
            lastWeek.push(chatObj);
          } else {
            lastMonth.push(chatObj);
          }
        });
        
        setGroupedChatHistory({
          today,
          yesterday,
          lastWeek,
          lastMonth,
          older: []
        });
        
        setChats(formattedChats);
        setChatListOffset(userChats.length);
        setHasMoreChatsList(userChats.length === CHAT_LIST_PAGE_SIZE);
        
        // If a specific chat ID was provided in the route, load that chat
          if (routeChatId) {
            await selectChat(routeChatId);
          } else if (formattedChats.length > 0) {
            await selectChat(formattedChats[0].id);
          } else {
            const lastChat = chats.length > 0 ? chats[chats.length - 1] : null;
            const lastChatHasMessages = !!lastChat && (lastChat.messages?.length || 0) > 0;
            const shouldCreateNew = chats.length === 0 || lastChatHasMessages;
            if (shouldCreateNew) {
              const newChatId = crypto.randomUUID();
              startNewChat(newChatId);
            }
          }
        } else {
          const lastChat = chats.length > 0 ? chats[chats.length - 1] : null;
          const lastChatHasMessages = !!lastChat && (lastChat.messages?.length || 0) > 0;
          const shouldCreateNew = chats.length === 0 || lastChatHasMessages;
          if (shouldCreateNew) {
            const newChatId = crypto.randomUUID();
            startNewChat(newChatId);
            setGroupedChatHistory({
              today: [],
              yesterday: [],
              lastWeek: [],
              lastMonth: [],
              older: []
            });
          }
        }
      
      setIsLoadingChatsDebug(false);
      setIsInitialRouteResolving(false);
    } catch (error) {
      console.error('Error fetching chats:', error);
      setIsLoadingChatsDebug(false);
      
      // Use local chat in case of any error
      const localChatId = routeChatId || crypto.randomUUID();
      setChatId(localChatId);
      setChats([{
          id: localChatId,
          title: 'Local Chat',
          messages: [],
          role: 'general',
          description: 'Error mode - working offline'
        }]);
      setIsInitialRouteResolving(false);
    }
  }, [routeChatId, user?.id]);

  // Save chat message to database using new chat service
  // Function to update chat title with first 2-3 words of user's first message
  const updateChatTitleFromMessage = async (messageText: string, chatId: string, userId: string) => {
    try {
      let text = (messageText || '').replace(/;;%%;;.*?;;%%;;/g, '').trim();
      text = text.replace(/\s+/g, ' ');
      const newTitle = text.slice(0, 16);
      
      // Only update if we have meaningful content
      if (newTitle && newTitle.length > 0) {
        // Import the updateNewChatTitle function from chatService
        const { updateNewChatTitle } = await import('../services/chatService');
        const success = await updateNewChatTitle(chatId, userId, newTitle);
        
        if (success) {
          console.log('✅ Chat title updated successfully:', newTitle);
          
          // Update local state to reflect the new title
          setGroupedChatHistory(prev => {
            const updateChatTitle = (group: {id: string, title: string, role: string}[]) => 
              group.map(chat => 
                chat.id === chatId ? { ...chat, title: newTitle } : chat
              );
            
            return {
              today: updateChatTitle(prev.today),
              yesterday: updateChatTitle(prev.yesterday),
              lastWeek: updateChatTitle(prev.lastWeek),
              lastMonth: updateChatTitle(prev.lastMonth),
              older: updateChatTitle(prev.older)
            };
          });
          
          // Also update chats state
          setChats(prevChats => 
            prevChats.map(chat => 
              chat.id === chatId ? { ...chat, title: newTitle } : chat
            )
          );
        }
      }
    } catch (error) {
      console.error('Error updating chat title:', error);
    }
  };

  const saveChatToDatabase = async (messageContent: string | any, role: string) => {
    try {
      if (!chatId) {
        console.log('No chatId yet, skipping database save');
        return;
      }
      // Use AuthContext user for database operations
      if (!user?.id) {
        console.log('No authenticated user, skipping database save');
        return;
      }
      
      const userId = user.id;
      console.log('Using AuthContext user ID for database save:', userId);
      
      // Handle both string and structured message formats
      const isStructuredMessage = typeof messageContent === 'object' && messageContent !== null;
      
      console.log('💾 saveChatToDatabase called:', {
        role,
        isStructuredMessage,
        messageType: typeof messageContent,
        hasAttachment: isStructuredMessage && messageContent.attachment,
        hasChart: isStructuredMessage && messageContent.chartConfig,
        preview: isStructuredMessage ? messageContent.text?.substring(0, 100) : messageContent?.substring(0, 100)
      });
      
      // Parse message content to separate text, image data, and chart data
      let textContent;
      let imageData = null;
      let chartData = null;
      
      if (isStructuredMessage) {
        // Handle new structured format
        textContent = messageContent.text || '';
        if (messageContent.attachment) {
          imageData = messageContent.attachment;
        }
        if (messageContent.chartConfig) {
          chartData = {
            chartConfig: messageContent.chartConfig,
            chartId: messageContent.chartId,
            equation: messageContent.equation
          };
        }
      } else {
        // Handle legacy string format
        textContent = messageContent;
        
        // Check if message contains image with %%% delimiters
        if (messageContent && messageContent.includes('%%%')) {
          const imageMatch = messageContent.match(/%%%(.*?)%%%/);
          if (imageMatch) {
            imageData = {
              url: imageMatch[1],
              fileName: 'Image',
              fileType: 'image'
            };
            // Remove image URL from text content
            textContent = messageContent.replace(/%%%.*?%%%/g, '').trim();
          }
        }
      }
      
      // Check if this will be the first user message (before saving the message)
      let shouldUpdateTitle = false;
      if (role === 'user' && textContent && textContent.trim().length > 0) {
        const { data: existingUserMessages } = await supabase
          .from('messages')
          .select('id')
          .eq('chat_id', chatId)
          .eq('role', 'user')
          .limit(1);
        
        shouldUpdateTitle = !existingUserMessages || existingUserMessages.length === 0;
        if (shouldUpdateTitle) {
          console.log('🏷️ This will be the first user message, will update title after saving...');
        }
      }
      
      // Check if chat exists using direct database query
      const { data: existingChats } = await supabase
        .from('chats')
        .select('*')
        .eq('id', chatId)
        .eq('owner', userId);
      
      const isNewChat = !existingChats || existingChats.length === 0;
      
      if (isNewChat) {
        // Chat doesn't exist - create new chat automatically using direct database insert
        console.log('Chat does not exist, creating new chat automatically...');
      const { data: newChat, error: chatError } = await supabase
        .from('chats')
        .insert({
          id: chatId,
          owner: userId,
          title: 'New Chat',
          position_counter: 0,
          metadata: (() => {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const offset = -new Date().getTimezoneOffset();
            const d = new Date();
            const two = (n: number) => (n < 10 ? `0${n}` : `${n}`);
            const localIso = `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())} ${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())}`;
            return { created_at_local: localIso, timezone: tz, timezone_offset_minutes: offset };
          })(),
          role: selectedRole.id,
          use_at: getCurrentLocalTimeFormatted()
        })
        .select()
        .single();
        
        if (chatError) {
          console.error('Failed to create new chat:', chatError);
          return;
        }
        console.log('✅ New chat created successfully:', newChat);
      }
      
      // Get current message count for position
      const { data: messageCount } = await supabase
        .from('messages')
        .select('position', { count: 'exact' })
        .eq('chat_id', chatId)
        .order('position', { ascending: false })
        .limit(1);
      
      const nextPosition = messageCount && messageCount.length > 0 ? messageCount[0].position + 1 : 1;
      
      // Add message using direct database insert
      const messageData: any = {
        chat_id: chatId,
        role: role,
        content: textContent || '',
        status: 'done',
        position: nextPosition,
        metadata: { 
          test: false, 
          message_type: role === 'user' ? 'user_message' : 'assistant_reply',
          ...(chartData && { chart: chartData })
        }
      };
      
      // For assistant messages with attachments, include file fields directly
      if (imageData && imageData.url && role !== 'user') {
        messageData.file_url = imageData.url;
        messageData.file_name = imageData.fileName || 'Attachment';
        messageData.file_type = imageData.fileType || 'application/octet-stream';
        if (imageData.size) {
          messageData.file_size = imageData.size;
        }
      }
      
      // Use the new addUserMessageWithAttachment function if there's attachment data
       let newMessage;
       let messageError;
       
       if (imageData && imageData.url && role === 'user') {
         // Use the new attachment-aware function for user messages with attachments
         newMessage = await addUserMessageWithAttachment(
           chatId,
           userId,
           textContent || '',
           imageData.url,
           imageData.fileName || 'attachment',
           imageData.fileType || 'image',
           imageData.size || null
         );
         
         if (!newMessage) {
           messageError = { message: 'Failed to create message with attachment' };
         }
       } else {
         // Use regular insert for messages without attachments
         const result = await supabase
           .from('messages')
           .insert(messageData)
           .select()
           .single();
         
         newMessage = result.data;
         messageError = result.error;
       }
      
      if (messageError) {
        console.error('Failed to save message:', messageError);
        return;
      }
      
      console.log('✅ Message saved successfully:', newMessage);
      
      // Check if this was the first user message in the chat (check was done before saving)
      if (shouldUpdateTitle) {
        console.log('🏷️ This was the first user message, updating chat title...');
        await updateChatTitleFromMessage(textContent, chatId, userId);
      }

      if (role === 'user') {
        const ts = getCurrentLocalTimeFormatted();
        await supabase.from('chats').update({ use_at: ts }).eq('id', chatId);
        setGroupedChatHistory(prev => {
          const remove = (g: {id: string, title: string, role: string, roleName?: string}[]) => g.filter(c => c.id !== chatId);
          const currentTitle = chats.find(c => c.id === chatId)?.title || 'New Chat';
          const chatRole = selectedRole.id;
          const roleName = getRoleName(chatRole);
          return {
            today: [{ id: chatId, title: currentTitle, role: chatRole, roleName }, ...remove(prev.today)],
            yesterday: remove(prev.yesterday),
            lastWeek: remove(prev.lastWeek),
            lastMonth: remove(prev.lastMonth),
            older: remove(prev.older)
          };
        });
        setChats(prev => {
          const current = prev.find(c => c.id === chatId);
          const others = prev.filter(c => c.id !== chatId);
          return current ? [current, ...others] : prev;
        });
      }

    } catch (error) {
      console.error('Error saving to database:', error);
    }
  };

  // Handle share functionality
  const handleShareMessage = async (content: string, attachments?: { url: string; fileName: string; fileType?: string; originalName?: string }[]) => {
    try {
      // Extract plain text from HTML content, removing chart code blocks
      const plainText = extractTextForSharing(content, true);
      const sanitizedText = removeUrlsFromText(plainText);
      
      const files: File[] = [];
      
      if (attachments && attachments.length > 0) {
        // Try to fetch images and create File objects
        for (const attachment of attachments) {
             if (attachment.fileType?.startsWith('image/') || attachment.url.match(/\.(png|jpg|jpeg|gif|webp)(\?.*)?$/i)) {
                 try {
                     const response = await fetch(attachment.url);
                     const blob = await response.blob();
                     // Use original name or default, ensure it has extension
                     let fileName = attachment.fileName || attachment.originalName || 'image.png';
                     if (!fileName.includes('.')) fileName += '.png';
                     
                     const file = new File([blob], fileName, { type: blob.type });
                     files.push(file);
                 } catch (e) {
                     console.error("Failed to fetch image for sharing", e);
                 }
             }
        }
      }

      if (navigator.share) {
        const shareData: ShareData = {
          title: 'Shared from AI Chat',
          text: sanitizedText,
        };
        
        if (files.length > 0 && navigator.canShare && navigator.canShare({ files })) {
             shareData.files = files;
        }
        
        await navigator.share(shareData);
      } else {
        // Fallback for browsers that don't support the Web Share API
        await navigator.clipboard.writeText(sanitizedText);
        showSuccess('Message copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
              showError('Failed to share message');
    }
  };

  // Delete chat from database
  const deleteChat = async (chatIdToDelete: string) => {
    try {
      // Only use Supabase session for database operations to comply with RLS policies
      // AuthContext user IDs don't work with Supabase RLS policies
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user?.id) {
        console.log('⚠️ No valid Supabase session found, skipping database deletion');
        console.log('📝 Chat will be removed from local state only');
        // Still update local state even if we can't delete from database
      } else {
        const userId = session.user.id;
        console.log('✅ Using Supabase session user ID for chat deletion:', userId);
        
        // Delete from database using new service
        const success = await deleteNewChat(chatIdToDelete, userId);
        
        if (!success) {
          console.error('Error deleting chat');
          return;
        }
      }
      
      // Update local state
      setGroupedChatHistory(prev => {
        const removeFromGroup = (group: {id: string, title: string, role: string}[]) => 
          group.filter(chat => chat.id !== chatIdToDelete);
        
        return {
          today: removeFromGroup(prev.today),
          yesterday: removeFromGroup(prev.yesterday),
          lastWeek: removeFromGroup(prev.lastWeek),
          lastMonth: removeFromGroup(prev.lastMonth),
          older: removeFromGroup(prev.older)
        };
      });
      
      // Update chats state
      setChats(prevChats => prevChats.filter(chat => chat.id !== chatIdToDelete));
      
      // If the deleted chat was the current one, create a new chat or load another
      if (chatId === chatIdToDelete) {
        const remainingChats = chats.filter(chat => chat.id !== chatIdToDelete);
        if (remainingChats.length > 0) {
          // Select the most recent chat
          const newCurrentChat = remainingChats[0];
          // Clear current state completely before switching
          setMessages([]);
          setMessageHistory([]);
          setInputMessage('');
          setSelectedFile(null);
          setUploadedFiles([]); // Clear uploaded files after sending
          setDisplayedText({});
          setIsTyping({});
          setEditingMessageId(null);
          setEditingContent('');
          
          setChatId(newCurrentChat.id);
          setMessages(newCurrentChat.messages || []);
          setSelectedRole(roleOptions.find(role => role.id === newCurrentChat.role) || roleOptions[0]);
          updateUrlToChatId(newCurrentChat.id);
        } else {
          // No remaining chats, create a completely new one
          const newChatId = crypto.randomUUID();
          setMessages([]);
          setMessageHistory([]);
          setInputMessage('');
          setSelectedFile(null);
          setDisplayedText({});
          setIsTyping({});
          setEditingMessageId(null);
          setEditingContent('');
          
          setChatId(newChatId);
          setMessages([]);
          setSelectedRole(roleOptions[0]);
          updateUrlToChatId(newChatId);
        }
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  // Automatically scroll to bottom of messages
  useEffect(() => {
    console.log('🔍 DEBUG: Auto-scroll useEffect triggered! Messages length:', messages.length);
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  

  // Handle click outside to close history dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (historyDropdownRef.current && !historyDropdownRef.current.contains(event.target as Node)) {
        setShowHistoryDropdown(false);
      }
    };

    if (showHistoryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showHistoryDropdown]);

  // Fetch chats on component mount and handle default navigation
  useEffect(() => {
    console.log('🔍 DEBUG: useEffect for fetchUserChats triggered!');
    console.log('🔍 DEBUG: Dependencies - user?.id:', user?.id);

    const handleInitialNavigation = async () => {
      if (!initialLoadDoneRef.current) {
        if (chats.length === 0) {
          console.log('🔄 Loading chats for the first time');
          await fetchUserChats();
        }

        if (routeChatId) {
          if (routeChatId !== chatId) {
            console.log('🎯 Selecting chat from URL:', routeChatId);
            await selectChat(routeChatId);
          }
        }

        initialLoadDoneRef.current = true;
      }
    };

    handleInitialNavigation();
    
    // Setup real-time subscription for chat updates (only once)
    const chatSubscription = supabase
      .channel('chats_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chats'
      }, (payload) => {
        console.log('Real-time update received:', payload);
        // Refresh chats list when database changes occur
        setTimeout(async () => {
          console.log('🔄 Real-time refresh triggered');
          await fetchUserChats();
        }, 100);
      })
      .subscribe();

    // Setup real-time subscription with specific uid filter
    const specificUserSubscription = user?.id ? supabase
      .channel('specific_user_channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'users',
        filter: `uid=eq.${user.id}`
      }, (payload) => {
        console.log('Specific user real-time update received:', payload);
        // Handle specific user updates here
        // You can add custom logic for this specific user
      })
      .subscribe() : null;
    
    // Clear any pending message drafts or uploads on page load
    setInputMessage('');
    setSelectedFile(null);
    setMessageHistory([]);
    
    // Cleanup subscriptions on unmount
    return () => {
      chatSubscription.unsubscribe();
      specificUserSubscription?.unsubscribe();
      stopSpeech();
    };
  }, [user?.id]);

  // Auto-stop speaking when navigating away
  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, []);

  // Auto-resize the textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputMessage]);

  useEffect(() => {
    setShowGenerationButtons(messages.length === 0);
  }, [messages]);

  // Monitor location changes to stop speech
  useEffect(() => {
    stopSpeech();
  }, [location.pathname]);

  // Handle chart rendering when messages change
  useEffect(() => {
    console.log('🔍 DEBUG: Chart rendering useEffect triggered! Messages length:', messages.length);
    const renderCharts = async () => {
      for (const message of messages) {
        if (message.chartConfig && message.chartId) {
          try {
            // Wait a bit for the DOM to be ready
            setTimeout(() => {
              chartService.renderChart(message.chartId!, message.chartConfig!);
            }, 100);
          } catch (error) {
            console.error('Error rendering chart:', error);
          }
        }
      }
    };

    renderCharts();
  }, [messages]);

  // Function to detect if the text contains a URL
  const containsUrl = (text?: string): boolean => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return !!text && urlRegex.test(text);
  };
  
  const removeUrlsFromText = (text: string): string => {
    if (!text) return '';
    let cleaned = text.replace(/\(\s*(?:https?:\/\/|www\.)[^\s)]+\s*\)/gi, '');
    cleaned = cleaned.replace(/(?:https?:\/\/|www\.)\S+/gi, '');
    cleaned = cleaned.replace(/\s{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
    return cleaned;
  };

  // Function to detect if a chart should be generated based on AI response
  const shouldGenerateChart = (content: string): boolean => {
    return content.includes('```chartjs') || 
           (content.includes('```json') && content.toLowerCase().includes('chart'));
  };

  // Function to extract chart configuration from chartjs code block
  const extractChartConfig = (content: string): ChartConfig | null => {
    try {
      // Look for chartjs code block
      const chartjsMatch = content.match(/```chartjs\s*\n([\s\S]*?)\n```/);
      if (chartjsMatch) {
        const configText = chartjsMatch[1].trim();
        const config = JSON.parse(configText);
        return config as ChartConfig;
      }
      
      // Fallback: look for json code block that might contain chart config
      const jsonMatch = content.match(/```json\s*\n([\s\S]*?)\n```/);
      if (jsonMatch && content.toLowerCase().includes('chart')) {
        const configText = jsonMatch[1].trim();
        const config = JSON.parse(configText);
        if (config.type && config.data) {
          return config as ChartConfig;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error parsing chart config:', error);
      return null;
    }
  };

  // Helper function to convert blob URL to base64
  const blobUrlToBase64 = async (blobUrl: string): Promise<string> => {
    try {
      const response = await fetch(blobUrl);
      const blob = await response.blob();
      
      // Check if the blob is a valid image type
      if (!blob.type.startsWith('image/')) {
        console.error('❌ Invalid image type:', blob.type);
        return '';
      }
      
      // Limit image size to prevent API errors (max 4MB)
      if (blob.size > 4 * 1024 * 1024) {
        console.error('❌ Image too large:', (blob.size / (1024 * 1024)).toFixed(2) + 'MB');
        return '';
      }
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result as string;
          // Verify we have a valid base64 image
          if (base64String && base64String.startsWith('data:image/')) {
            console.log('✅ Successfully converted blob to base64 image');
            resolve(base64String);
          } else {
            console.error('❌ Invalid base64 format after conversion');
            resolve('');
          }
        };
        reader.onerror = (error) => {
          console.error('❌ Error reading file:', error);
          resolve('');
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('❌ Error converting blob URL to base64:', error);
      return '';
    }
  };

  // Function to pause streaming
  const pauseStreaming = () => {
    if (sseAbortRef.current) {
      sseAbortRef.current.abort();
      sseAbortRef.current = null;
    }
    if (wsRef.current) {
      try { wsRef.current.close(); } catch {}
      wsRef.current = null;
    }
    try {
      // No global chunk channels to unsubscribe after removal
    } catch {}
    setIsStreaming(false);
    setIsPaused(true);
    setIsSending(false);
    setIsLoading(false);
  };

  const startWebSocketStreaming = async (input: string | {
    content: string;
    type?: string;
    url?: string;
    attachments?: {
      url?: string;
      fileName?: string;
      fileType?: string;
      size?: number;
    }[];
    image_urls?: string[];
    page_count?: number;
  }, onChunk?: (chunk: string) => void): Promise<void> => {
    const base = typeof input === 'string' ? { content: input, type: 'text' } : input;
    const content = base.content || '';

    // Build study-chat request body
    const requestBody: any = {
      stream: true,
      coins: calculateCoinCost(),
      messages: [{
        uid: user?.id || 'anonymous',
        content,
        timestamp: Math.floor(Date.now() / 1000),
        chatid: chatId || ''
      }]
    };

    // Attach file references
    const attachments = (base as any).attachments;
    if (attachments?.length > 0) {
      const first = attachments[0];
      const ft = (first.fileType || '').toLowerCase();
      if (ft === 'image') {
        requestBody.imageUrl = first.url;
      } else if (ft === 'pdf_vision' || ft === 'pdf') {
        requestBody.pdfUrl = first.url;
      } else {
        requestBody.docxUrl = first.url;
      }
    } else if ((base as any).image_urls?.length > 0) {
      requestBody.pdfUrl = (base as any).url;
    } else if ((base as any).url && (base as any).type === 'image') {
      requestBody.imageUrl = (base as any).url;
    } else if ((base as any).url) {
      requestBody.imageUrl = (base as any).url;
    }

    setIsStreaming(true);
    setIsPaused(false);
    setIsIntentionallyAborted(false);

    const controller = new AbortController();
    sseAbortRef.current = controller;

    return new Promise(async (resolve, reject) => {
      try {
        const response = await fetch('https://server.matrixedu.ai/api/study-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        if (!response.body) throw new Error('No response body');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            let str = line.trim();
            if (!str || str === 'data: [DONE]' || str === '[DONE]') continue;
            if (str.startsWith('data: ')) str = str.slice(6).trim();
            if (!str || str === '[DONE]') continue;
            try {
              const json = JSON.parse(str);
              const chunk =
                (typeof json.content === 'string' && json.content) ||
                (typeof json.text === 'string' && json.text) ||
                (json.type === 'chunk' && typeof json.text === 'string' && json.text) ||
                null;
              if (chunk && onChunk) onChunk(chunk);
            } catch {
              // Non-JSON line; ignore
            }
          }
        }

        setIsStreaming(false);
        setIsPaused(false);
        sseAbortRef.current = null;
        resolve();
      } catch (e: any) {
        setIsStreaming(false);
        setIsPaused(false);
        sseAbortRef.current = null;
        if (e?.name === 'AbortError') {
          resolve();
        } else {
          reject(e);
        }
      }
    });
  };

  const subscribeToChatStream = async (cid: string, cursor: number, targetMessageId: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        setIsStreaming(true);
        setIsPaused(false);
        setIsIntentionallyAborted(false);
        const ws = new WebSocket('wss://main.matrixaiserver.com/ws/chat');
        wsRef.current = ws;
        let accumulated = (messages.find(m => m.id === targetMessageId)?.content || '') as string;
        ws.onopen = () => {
          const payload = { type: 'subscribe', chatid: cid, cursor: cursor || 0 };
          ws.send(JSON.stringify(payload));
        };
        ws.onmessage = (evt) => {
          try {
            const raw = typeof evt.data === 'string' ? evt.data : '';
            const obj = JSON.parse(raw);
            if (obj && obj.type === 'chunk' && typeof obj.text === 'string') {
              accumulated += obj.text;
              setMessages(prev => prev.map(msg => 
                msg.id === targetMessageId 
                  ? { ...msg, content: accumulated }
                  : msg
              ));
              setDisplayedText(prev => ({ ...prev, [targetMessageId]: accumulated }));
              setTimeout(() => {
                if (messagesContainerRef.current) {
                  messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
                }
              }, 50);
            } else if (obj && obj.type === 'done') {
              setMessages(prev => prev.map(msg => 
                msg.id === targetMessageId 
                  ? { ...msg, isStreaming: false }
                  : msg
              ));
              try { ws.close(); } catch {}
            }
          } catch {
            // Ignore malformed frames
          }
        };
        ws.onerror = () => {
          setIsStreaming(false);
          setIsPaused(false);
          wsRef.current = null;
          reject(new Error('WebSocket error'));
        };
        ws.onclose = () => {
          setIsStreaming(false);
          setIsPaused(false);
          wsRef.current = null;
          resolve();
        };
      } catch (e) {
        reject(e as any);
      }
    });
  };

 


 

 

 


 

 

  const handleSendMessage = async () => {
    const messageText = inputMessage;
    const hasText = messageText.trim().length > 0;
    if (!hasText && !selectedFile && uploadedFiles.length === 0 && !currentUploadedFile && !pendingPdfFile) return;
    const hadUserMessagesBefore = messages.some(m => m.role === 'user');
    const pendingPdfSnapshot = pendingPdfFile;
    
    // Prevent multiple simultaneous sends
    if (isSending || isLoading) return;
    
    // Check if a chat exists - prevent sending messages without a chat
    if (!chatId) {
      showWarning('Please create a new chat first before sending messages.');
      return;
    }
    
    setIsSending(true);
    
    // Clear input immediately on send click
    setInputMessage('');
    if (pendingPdfSnapshot) {
      setPendingPdfFile(null);
    }
    
    // If a generation type is selected, route to generation API
    if (selectedGenerationType) {
      const messageToSend = messageText.trim() || 'Generate content';
      
      // Don't clear file here - wait until after successful processing
      
      try {
        await sendGenerationRequest(selectedGenerationType, messageToSend);
      } finally {
        setIsSending(false);
        nextMessageTypeRef.current = null;
        setIsSearchQueued(false);
        setIsSearchActive(false);
      }
      return;
    }
    
    // Check if 40-message limit is reached for this chat
    const currentUserMessages = messages.filter(m => m.role === 'user').length;
    if (currentUserMessages >= 40) {
      setIsMessageLimitReached(true);
      showWarning('You have reached the 40-message limit for this chat. Please start a new chat to continue.');
      setIsSending(false);
      return;
    }
    
    try {
      const requiredCoins = isSearchActive ? 2 : calculateCoinCost();
      const availableCoins = userData?.coins || 0;
      if (requiredCoins > availableCoins) {
        setIsLoading(false);
        setIsSending(false);
        setIsChargeModalOpen(true);
        setInputMessage(messageText);
        if (pendingPdfSnapshot) {
          setPendingPdfFile(pendingPdfSnapshot);
        }
        showWarning('Not enough coins. Please recharge to continue.');
        return;
      }
    } catch {}
    
    setIsLoading(true);
    let imageUrl: string | null = null;
    let userMessageContent = messageText;
    let userMessageAdded = false; // Track if user message has been added to prevent duplicates
    
    try {
      // If there's a file, process it
      if (selectedFile) {
        try {
          // Determine file type
          const fileType = selectedFile.type;
          const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase() || '';
          const isPdf = fileType === 'application/pdf' || fileExtension === 'pdf';
          const isDoc = fileType === 'application/msword' || 
                       fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                       fileExtension === 'doc' || fileExtension === 'docx';
          const isImage = fileType.startsWith('image/');
          
          // Get file type label for message
          let fileTypeLabel = 'file';
          if (isPdf) fileTypeLabel = 'PDF';
          else if (isDoc) fileTypeLabel = 'document';
          else if (isImage) fileTypeLabel = 'image';
          
          // If we're not authenticated, fall back to local display
          const { data: { session } } = await supabase.auth.getSession();
          
          // For PDF and DOC files, convert to images and process
          if (isPdf || isDoc) {
            try {
              // Show processing status
              setProcessingStatus({
                isProcessing: true,
                currentPage: 0,
                totalPages: 0,
                fileName: selectedFile.name
              });
              
              // Get page count for PDF or convert DOC to images
              let pageCount: number;
              let imageFiles: File[] = [];
              
              if (isPdf) {
                pageCount = await getPdfPageCount(selectedFile);
              } else {
                imageFiles = await convertDocToImages(selectedFile);
                pageCount = imageFiles.length;
                
                if (imageFiles.length === 0) {
                  setProcessingStatus(null);
                  throw new Error(`Failed to extract images from ${fileTypeLabel}`);
                }
              }
              
              // Update processing status with total pages
              setProcessingStatus(prev => prev ? {
                ...prev,
                totalPages: pageCount
              } : null);
              
              // Skip coin enforcement for previews; only display estimated cost in UI elsewhere
              
              const localPdfUrl = URL.createObjectURL(selectedFile);
              const fileUrlInfo = `;;%%;;${localPdfUrl};;%%;; `;
              userMessageContent = messageText ? `${messageText}${fileUrlInfo}` : fileUrlInfo;
              const userMessage = {
                id: messages.length + 1,
                role: 'user',
                content: userMessageContent,
                timestamp: getCurrentLocalTimeFormatted(),
                fileName: selectedFile.name,
                attachments: [{
                  url: localPdfUrl,
                  fileName: selectedFile.name,
                  fileType: selectedFile.type || 'application/pdf',
                  size: selectedFile.size
                }]
              };
              setMessages(prev => [...prev, userMessage]);
              
              // Mark that user message has been added to prevent duplicates
              userMessageAdded = true;
              
              setSelectedFile(null);
              if (!hadUserMessagesBefore && user?.id && chatId) {
                const titleSource = messageText.trim().length > 0 ? messageText : selectedFile.name;
                await updateChatTitleFromMessage(titleSource, chatId, user.id);
              }
              

              
              // Extract text from PDF images using OCR
              let extractedText = '';
              
              // Show processing message
              const processingMessage = {
                id: messages.length + 2,
                role: 'assistant',
                content: `Extracting text from ${fileTypeLabel} (${pageCount} pages)`,
                timestamp: getCurrentLocalTimeFormatted()
              };
              
              setMessages(prev => [...prev, processingMessage]);
              
              // Extract text from each page
              for (let i = 0; i < pageCount; i++) {
                // Update processing status for current page
                setProcessingStatus(prev => prev ? {
                  ...prev,
                  currentPage: i + 1
                } : null);
                
                // For DOC files, use the image file; for PDF, just process page number
                const imageFile = isPdf ? null : imageFiles[i];
                
                try {
                   // For now, show a placeholder message since OCR setup needs more configuration
                   // In a production environment, you would set up proper OCR service
                   const placeholderText = `[Text content from page ${i + 1} - OCR processing would extract actual text here]`;
                   
                   // Add page text to extracted text
                   extractedText += `\n\n--- Page ${i + 1} ---\n${placeholderText}`;
                 } catch (error) {
                   console.error(`Error processing page ${i + 1}:`, error);
                   extractedText += `\n\n--- Page ${i + 1} ---\n[Error processing this page]`;
                 }
              }
              
              // Clear processing status when done
              setProcessingStatus(null);
              
              // Create final response with extracted text
              const finalResponse = `Text extracted from PDF "${selectedFile.name}":\n${extractedText}`;
              
              // Update the processing message with final extracted text
              setMessages(prev => prev.map(msg => 
                msg.id === processingMessage.id
                  ? { ...msg, content: finalResponse }
                  : msg
              ));
              
              // Don't save to database as requested - just show the text
              showSuccess(`Text extracted from PDF: ${selectedFile.name}`);
              
              // Chat history is handled by saveChatToDatabase function
              
              setIsLoading(false);
      setIsSending(false);
      return; // Exit early since we've handled the PDF case
            } catch (pdfError) {
              console.error('Error processing PDF:', pdfError);
              setProcessingStatus(null);
              const errorMessage = pdfError instanceof Error ? pdfError.message : 'Unknown error occurred';
              showError(`Failed to process ${fileTypeLabel}: ${errorMessage}`);
              setIsLoading(false);
              setIsSending(false);
              return;
            }
          }
          
          // Regular file processing for non-PDF files or if PDF processing failed
          if (!session?.user?.id) {
            // Create a local URL for the file
            const localUrl = URL.createObjectURL(selectedFile);
            
            // Store only the text content and file URL, display info will be handled by UserMessageAttachments component
            const fileUrlInfo = `;;%%;;${localUrl};;%%;; `;
            
            userMessageContent = messageText 
              ? `${messageText}${fileUrlInfo}` 
              : fileUrlInfo;
            
            // Add user message with file
            const userMessage = {
              id: messages.length + 1,
              role: 'user',
              content: userMessageContent,
              timestamp: getCurrentLocalTimeFormatted(),
              fileContent: localUrl,
              fileName: selectedFile.name
            };
            
            setMessages(prev => [...prev, userMessage]);
            
            // Mark that user message has been added to prevent duplicates
            userMessageAdded = true;
            
            // Input was already cleared at send click; keep file until processing is complete
            // setSelectedFile(null); // Don't clear file yet
            

            
            // Use local URL for AI processing
            imageUrl = localUrl;
          } else {
            // Determine file type
            const fileType = selectedFile.type;
            const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase() || '';
            const isPdf = fileType === 'application/pdf' || fileExtension === 'pdf';
            const isDoc = fileType === 'application/msword' || 
                         fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                         fileExtension === 'doc' || fileExtension === 'docx';
            const isImage = fileType.startsWith('image/') || isPdf || isDoc; // Treat PDFs and DOCs as images for processing
            
            // Get file type label for message
            let fileTypeLabel = 'file';
            if (isPdf) fileTypeLabel = 'PDF';
            else if (isDoc) fileTypeLabel = 'document';
            else if (isImage) fileTypeLabel = 'image';
            
            // Read file content as base64
            const reader = new FileReader();
            const fileContent = await new Promise<string>((resolve) => {
              reader.onload = (e) => {
                const result = e.target?.result as string;
                resolve(result || '');
              };
              reader.readAsDataURL(selectedFile);
            });
            
            // For images, use new structured format with attachment field
            if (isImage && fileType.startsWith('image/')) {
              // Add user message with structured format - separate text and image
              setMessages(prev => {
                const textContent = messageText || ''; // Only the text part
                const userMessage = {
                  id: prev.length + 1,
                  role: 'user',
                  content: textContent,
                  timestamp: getCurrentLocalTimeFormatted(),
                  fileContent: fileContent,
                  fileName: selectedFile.name
                };
                return [...prev, userMessage];
              });
              
              // Mark that user message has been added to prevent duplicates
              userMessageAdded = true;
              
              // Save user message to database with new structured format
              console.log('🖼️ Saving image message to database with structured format:', {
                textContent: messageText || '(no text)',
                fileName: selectedFile.name,
                chatId: chatId
              });
              
              // Create message object with attachment field for database
              const messageWithAttachment = {
                text: messageText || '',
                sender: 'user',
                timestamp: getCurrentLocalTimeFormatted(),
                attachment: {
                  url: fileContent,
                  fileName: selectedFile.name,
                  fileType: selectedFile.type
                }
              };
              
              // Log the attachment being saved
              console.log('🖼️ Saving image attachment to database:', {
                fileName: selectedFile.name,
                fileType: selectedFile.type,
                hasUrl: !!fileContent
              });
              
              // Make sure the attachment is properly saved to the database
              // Removed database save for user image messages
              
              // Use base64 data URL for AI processing
              imageUrl = fileContent;
            } else {
              // For non-image files, keep the original Supabase upload logic
              // Create a unique file path
              const userId = session.user.id;
              // Use the file extension from earlier declaration
              const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExtension}`;
              const filePath = `${userId}/${fileName}`;
              
              // Upload to Supabase storage
              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('user-uploads')
                .upload(filePath, selectedFile, {
                  contentType: selectedFile.type,
                  upsert: false
                });
              
              if (uploadError) {
                throw new Error(`Upload error: ${uploadError.message}`);
              }
              
              // Get the URL for the uploaded file
              const { data: { publicUrl } } = supabase.storage
                .from('user-uploads')
                .getPublicUrl(filePath);
              
              // Add file information to message content
              userMessageContent = messageText 
                ? `${messageText}\n\n[Attached ${fileTypeLabel}: ${selectedFile.name}]` 
                : `[Attached ${fileTypeLabel}: ${selectedFile.name}]`;
              
              // Add user message with file using functional update
              setMessages(prev => {
                const userMessage = {
                  id: prev.length + 1,
                  role: 'user',
                  content: userMessageContent,
                  timestamp: new Date().toISOString(),
                  fileContent: publicUrl,
                  fileName: selectedFile.name,
                  attachments: [{
                    url: publicUrl,
                    fileName: selectedFile.name,
                    fileType: selectedFile.type || fileTypeLabel.toLowerCase(),
                    size: selectedFile.size
                  }]
                };
                return [...prev, userMessage];
              });
              
              // Mark that user message has been added to prevent duplicates
              userMessageAdded = true;
              if (!hadUserMessagesBefore && user?.id && chatId) {
                const titleSource = messageText.trim().length > 0 ? messageText : selectedFile.name;
                await updateChatTitleFromMessage(titleSource, chatId, user.id);
              }
              
              // Save user message with attachment to database
              const messageWithAttachment = {
                text: messageText.trim() || `[Attached ${fileTypeLabel}: ${selectedFile.name}]`,
                attachment: {
                  url: publicUrl,
                  fileName: selectedFile.name,
                  fileType: fileTypeLabel.toLowerCase(),
                  size: selectedFile.size
                }
              };
              // Removed database save for user file messages
              
              // Use public URL for AI processing
              imageUrl = publicUrl;
            }
            
            // Input was already cleared at send click; now clear file selection
            setSelectedFile(null);
          }
        } catch (error) {
          console.error('Error processing file:', error);
          showError('Error uploading file. Please try again.');
          setIsLoading(false);
          setIsSending(false);
          return;
        }
      } else {
          // Consolidate all message creation into one place to prevent duplicates
          if (!userMessageAdded) {
            let attachments: any[] = [];
            let messageToSave: any = null;
            
            // Priority 1: Handle uploadedFiles (from drag & drop or file picker)
            if (uploadedFiles.length > 0) {
              attachments = uploadedFiles.map(file => ({
                url: file.url,
                fileName: file.fileName,
                fileType: file.fileType,
                originalName: file.originalName,
                size: file.size
              }));
              
              // For database saving, use the first attachment
              const firstAttachment = uploadedFiles[0];
              messageToSave = {
                text: userMessageContent,
                attachment: {
                  url: firstAttachment.url,
                  fileName: firstAttachment.fileName || firstAttachment.originalName,
                  fileType: firstAttachment.fileType,
                  size: firstAttachment.size
                }
              };
            }
            // Priority 2: Handle currentUploadedFile (from n8n webhook case)
            else if (currentUploadedFile) {
              attachments = [{
                url: currentUploadedFile.publicUrl,
                fileName: currentUploadedFile.fileName,
                fileType: currentUploadedFile.fileType,
                originalName: currentUploadedFile.originalName,
                size: currentUploadedFile.size
              }];
              
              messageToSave = {
                text: userMessageContent,
                attachment: {
                  url: currentUploadedFile.publicUrl,
                  fileName: currentUploadedFile.originalName,
                  fileType: currentUploadedFile.fileType,
                  size: currentUploadedFile.size || null
                }
              };
            }
            // Priority 3: Handle pendingPdfFile (PDF vision with text)
            else if (pendingPdfSnapshot) {
              const pdfUrl = pendingPdfSnapshot.pdfVisionData?.pdf_url || pendingPdfSnapshot.publicUrl || '';
              attachments = [{
                url: pdfUrl,
                fileName: pendingPdfSnapshot.fileName,
                fileType: 'application/pdf',
                originalName: pendingPdfSnapshot.originalName,
                size: pendingPdfSnapshot.size
              }];
              
              messageToSave = {
                text: userMessageContent,
                attachment: {
                  url: pdfUrl,
                  fileName: pendingPdfSnapshot.originalName,
                  fileType: 'application/pdf',
                  size: pendingPdfSnapshot.size || null
                }
              };
            }
            // Priority 4: Text-only message
            else {
              messageToSave = userMessageContent;
            }
            
            // Add single user message to state
            setMessages(prev => {
              const userMessage = {
                id: prev.length + 1,
                role: 'user',
                content: userMessageContent,
                timestamp: new Date().toISOString(),
                ...(attachments.length > 0 && { attachments })
              };
              return [...prev, userMessage];
            });
            
             // Removed database save for user messages
             
              // Mark that user message has been added
              userMessageAdded = true;
            if (!hadUserMessagesBefore && user?.id && chatId && attachments.length === 0) {
              await updateChatTitleFromMessage(messageText, chatId, user.id);
            }
            if (!hadUserMessagesBefore && user?.id && chatId && attachments.length > 0) {
              const titleSource = messageText.trim().length > 0 ? messageText : (attachments[0]?.fileName || '');
              await updateChatTitleFromMessage(titleSource, chatId, user.id);
            }
            if (pendingPdfSnapshot && !hadUserMessagesBefore && user?.id && chatId) {
              const titleSource = messageText.trim().length > 0 ? messageText : (pendingPdfSnapshot.pdfVisionData?.original_filename || pendingPdfSnapshot.originalName || 'PDF');
              await updateChatTitleFromMessage(titleSource, chatId, user.id);
            }
            if (pendingPdfSnapshot) {
              setPendingPdfFile(null);
            }
          }
          
          // Clear input and files
          setInputMessage('');
          setUploadedFiles([]);
          setCurrentUploadedFile(null);
          // Note: pendingPdfFile is cleared in the API call section after successful sending
        }
        
        // Create a streaming bot message that will be updated in real-time
        // Calculate the streaming message ID using current messages state
        let streamingMessageId: number = 0;
        let streamingContent = '';
        let assistantMessageId: string | null = null;
        
        // Note: Removed startAssistantMessage to prevent empty database rows
        // Content will be saved via saveChatToDatabase when streaming completes
        
        // Add initial empty streaming message using functional update
        setMessages(prev => {
          streamingMessageId = prev.length + 1;
          const initialStreamingMessage = {
            id: streamingMessageId,
            role: 'assistant',
            content: '',
            timestamp: new Date().toISOString(),
            isStreaming: true
          };
          return [...prev, initialStreamingMessage];
        });

        // If search mode is queued for a text-only request, show rotating placeholders
        const isSimpleTextQuestion = !imageUrl && !selectedGenerationType && !selectedFile && uploadedFiles.length === 0 && !currentUploadedFile && !pendingPdfSnapshot;
        const isSearchTextOnly = isSimpleTextQuestion && (isSearchQueued || nextMessageTypeRef.current === 'search');
        if (isSearchTextOnly) {
          const placeholders = [
            'Searching your message online',
            'Looking up sources',
            'Crawling relevant pages',
            'Gathering evidence and facts',
            'Checking news and datasets'
          ];
          let idx = 0;
          const setPlaceholder = (text: string) => {
            setMessages(prev => prev.map(msg =>
              msg.id === streamingMessageId ? { ...msg, content: text } : msg
            ));
            setDisplayedText(prev => ({ ...prev, [streamingMessageId]: text }));
          };
          setPlaceholder(placeholders[idx]);
          searchPlaceholderIntervalRef.current = window.setInterval(() => {
            idx = (idx + 1) % placeholders.length;
            setPlaceholder(placeholders[idx]);
          }, 1500);
        }

        // Initialize image replacement session
        const imageSessionId = `chat_${chatId}_msg_${streamingMessageId}`;
        imageReplacementService.initializeSession(imageSessionId, user?.id || 'anonymous');
      
      // Define chunk handler for real-time updates
      const handleChunk = (chunk: string) => {
        // Stop rotating placeholders once actual content arrives
        if (chunk !== '__RESET__' && !chunk.startsWith('__RESET__')) {
          const intervalId = searchPlaceholderIntervalRef.current;
          if (typeof intervalId === 'number') {
            clearInterval(intervalId);
            searchPlaceholderIntervalRef.current = null;
          }
        }
        // Check for reset signal
        if (chunk === '__RESET__') {
          streamingContent = '';
          return; // Don't add the reset signal to content
        }
        if (chunk.startsWith('__RESET__')) {
          streamingContent = '';
          chunk = chunk.substring(9); // Remove the reset signal
        }
        
        // Filter out unwanted JSON output content
        try {
          // Check if chunk contains the unwanted JSON output format
          if (chunk.includes('{"output":')) {
            const jsonMatch = chunk.match(/\{"output":".*?"\}/);
            if (jsonMatch) {
              // Skip this chunk entirely as it contains unwanted technical document content
              return;
            }
          }
        } catch (error) {
          // If parsing fails, continue with normal processing
        }
        
        streamingContent += chunk;
        
        // Note: Removed appendMessageChunk to prevent empty database operations
        // Content will be saved via saveChatToDatabase when streaming completes
        
        // Update the streaming message in real-time
        if (isMountedRef.current) {
          setMessages(prev => prev.map(msg => 
            msg.id === streamingMessageId 
              ? { ...msg, content: streamingContent }
              : msg
          ));
          setDisplayedText(prev => ({
            ...prev,
            [streamingMessageId]: streamingContent
          }));
          setTimeout(() => {
            if (messagesContainerRef.current) {
              messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
            }
          }, 50);
        }
      };

        try {
        {
          let wsType = 'text';
          const isSimpleTextQuestion = !imageUrl && !selectedGenerationType && !selectedFile && uploadedFiles.length === 0 && !currentUploadedFile && !pendingPdfSnapshot;
          const isSearchTextOnly = isSimpleTextQuestion && (isSearchQueued || nextMessageTypeRef.current === 'search');
          if (isSearchTextOnly) {
            wsType = 'search';
          } else if (pendingPdfSnapshot) {
            wsType = 'pdf_vision';
          } else if (currentUploadedFile) {
            const ft = (currentUploadedFile.fileType || '').toLowerCase();
            wsType =
              ft === 'document'
                ? 'document'
                : ft === 'pdf_vision'
                ? 'pdf_vision'
                : ft === 'image'
                ? 'image'
                : 'text';
          } else if (uploadedFiles.length > 0) {
            const hasDocument = uploadedFiles.some(f => (f.fileType || '').toLowerCase() === 'document');
            const hasPdfVision = uploadedFiles.some(f => (f.fileType || '').toLowerCase() === 'pdf_vision');
            const hasImage = uploadedFiles.some(f => (f.fileType || '').toLowerCase() === 'image');
            wsType = hasDocument ? 'document' : hasPdfVision ? 'pdf_vision' : hasImage ? 'image' : 'text';
          } else if (imageUrl) {
            wsType = 'image';
          }
          const wsInput: any = { content: userMessageContent, type: wsType };
          if (pendingPdfSnapshot && pendingPdfSnapshot.pdfVisionData) {
            wsInput.image_urls = pendingPdfSnapshot.pdfVisionData.image_urls || [];
            wsInput.page_count = pendingPdfSnapshot.pdfVisionData.page_count || 0;
            wsInput.url = pendingPdfSnapshot.pdfVisionData.pdf_url || '';
          } else {
            let attachments: any[] = [];
            if (uploadedFiles.length > 0) {
              attachments = uploadedFiles.map(file => ({
                url: file.url,
                fileName: file.fileName,
                fileType: file.fileType,
                originalName: file.originalName,
                size: file.size
              }));
            } else if (currentUploadedFile) {
              attachments = [{
                url: currentUploadedFile.publicUrl,
                fileName: currentUploadedFile.fileName,
                fileType: currentUploadedFile.fileType,
                originalName: currentUploadedFile.originalName,
                size: currentUploadedFile.size
              }];
            } else if (imageUrl && selectedFile) {
              attachments = [{
                url: imageUrl,
                fileName: selectedFile.name,
                fileType: selectedFile.type || 'image'
              }];
            }
            if (attachments.length > 0) {
              wsInput.attachments = attachments;
              wsInput.url = attachments[0].url;
            }
            }
            await startWebSocketStreaming(wsInput, handleChunk);
          }
        setMessages(prev => prev.map(msg => 
          msg.id === streamingMessageId 
            ? { ...msg, isStreaming: false, isGenerating: false } 
            : msg
        ));
        

        
        // Cleanup image replacement session
        imageReplacementService.cleanupSession(imageSessionId);
        
        // Clear uploaded file and selected file after successful sending
        if (currentUploadedFile) {
          setCurrentUploadedFile(null);
        }
        if (selectedFile) {
          setSelectedFile(null);
        }
        if (pendingPdfFile) {
          setPendingPdfFile(null);
        }
        // Clear uploaded files array after successful sending
        setUploadedFiles([]);
        
        // Chat history is handled by saveChatToDatabase function
      } catch (error) {
        console.error('Error calling streaming AI API:', error);
        
        
        
        // Check if this was an intentional pause - if so, keep the partial content
        if (isPaused || isIntentionallyAborted) {
          console.log('🔸 Request was paused by user, keeping partial content');
          // Finalize the message with whatever content was streamed before pause
          setMessages(prev => prev.map(msg => 
            msg.id === streamingMessageId 
              ? { 
                  ...msg, 
                  content: streamingContent || 'Message paused by user.', 
                  isStreaming: false
                }
              : msg
          ));
        } else {
        }
         
         // Cleanup image replacement session
         imageReplacementService.cleanupSession(imageSessionId);
      }
    } catch (error) {
      console.error('Error in message handling:', error);
      showError('An error occurred while sending your message. Please try again.');
    } finally {
      // Ensure any placeholder interval is cleared
      // Note: searchPlaceholderInterval is in outer scope; guard for existence
      try {
        const intervalId = searchPlaceholderIntervalRef.current;
        if (typeof intervalId === 'number') {
          clearInterval(intervalId);
          searchPlaceholderIntervalRef.current = null;
        }
      } catch {}
      setIsLoading(false);
      setIsSending(false);
      // Reset any message type override after send completes
      nextMessageTypeRef.current = null;
      // Reset queued search state
      setIsSearchQueued(false);
      setIsSearchActive(false);
    }
  };

  // When a role is changed, update the current chat's role instead of creating a new chat
  const handleRoleChange = async (role: typeof roleOptions[0]) => {
    setSelectedRole(role);
    setShowRoleSelector(false);
    
    // Stop any ongoing speech
    stopSpeech();
    
    try {
      if (!chatId) {
        showError('No chat selected');
        return;
      }
      // Use AuthContext user for consistency
      if (user?.id) {
        const userId = user.id;
        const timestamp = new Date().toISOString();
        
        // Import updateChatRole from chatService
        const { updateChatRole } = await import('../services/chatService');
        
        // Update the current chat's role in the database using the service
        const success = await updateChatRole(chatId, userId, role.id);
        
        if (!success) {
          console.error('Error updating chat role');
          showError('Failed to change role. Please try again.');
          return;
        }
        
        // Update local chats state
        setChats(prev => prev.map(chat => 
          chat.id === chatId 
            ? { ...chat, role: role.id, roleDescription: role.description }
            : chat
        ));
        
        // Update grouped chat history
        setGroupedChatHistory(prev => {
          const updateChatInGroup = (group: {id: string, title: string, role: string, roleName?: string}[]) => 
            group.map(chat => 
              chat.id === chatId 
                ? { ...chat, role: role.id, roleName: role.name }
                : chat
            );
          
          return {
            today: updateChatInGroup(prev.today),
            yesterday: updateChatInGroup(prev.yesterday),
            lastWeek: updateChatInGroup(prev.lastWeek),
            lastMonth: updateChatInGroup(prev.lastMonth),
            older: updateChatInGroup(prev.older)
          };
        });
        
        // Check if there are existing messages in the chat
         // If yes, add a new assistant message announcing the role change
         if (messages.length > 0) {
           const roleChangeMessage = `Hello! I've switched to the role of ${role.name}. ${role.description} How can I assist you in this new capacity?`;
           
           // Add the role change message to local state immediately
           const newAssistantMessage: Message = {
             id: Date.now(),
             role: 'assistant',
             content: roleChangeMessage,
             timestamp: new Date().toISOString(),
             isStreaming: false
           };
           
           setMessages(prev => [...prev, newAssistantMessage]);
           
           console.log('✅ Role change assistant message added');
         }
      }
      
      // Show success message
      showSuccess(`Role changed to ${role.name}`);
    } catch (error) {
      console.error('Error in role change:', error);
      showError('Failed to change role. Please try again.');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isSending && !isLoading) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (text: string) => {
    // Extract plain text from HTML content, removing chart code blocks
    const plainText = extractPlainTextFromHTML(text);
    const sanitized = removeUrlsFromText(plainText);
    navigator.clipboard.writeText(sanitized);
    // Could add a toast notification here
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };





  // Handle edit message functionality
  const handleEditMessage = (messageId: number, content: string) => {
    setEditingMessageId(messageId);
    setEditingContent(content);
  };

  const handleSaveEdit = async () => {
    if (editingMessageId && editingContent.trim()) {
      const editedMessage = messages.find(msg => msg.id === editingMessageId);
      if (!editedMessage) return;

      // Skip coin enforcement for editing; proceed with UI-only cost display

      // If editing a user message, remove all subsequent messages and regenerate AI response
      if (editedMessage.role === 'user') {
        const editedMessageIndex = messages.findIndex(msg => msg.id === editingMessageId);
        const messagesUpToEdit = messages.slice(0, editedMessageIndex);
        
        // Add the edited user message
        const updatedUserMessage = { ...editedMessage, content: editingContent.trim() };
        const newMessages = [...messagesUpToEdit, updatedUserMessage];
        setMessages(newMessages);
        
        // Clear editing state
        setEditingMessageId(null);
        setEditingContent('');
        
        // Generate new AI response
        setIsLoading(true);
        try {
          let streamingId = Date.now() + 1;
          setMessages(prev => [...prev, { id: streamingId, role: 'assistant', content: '', timestamp: new Date().toISOString(), isStreaming: true }]);
          let acc = '';
          const onEditChunk = (chunk: string) => {
            acc += chunk;
            setMessages(prev => prev.map(m => m.id === streamingId ? { ...m, content: acc } : m));
          };
          await startWebSocketStreaming(editingContent.trim(), onEditChunk);
          setMessages(prev => prev.map(m => m.id === streamingId ? { ...m, isStreaming: false, isGenerating: false } : m));
          
          // No assistant message saving on frontend
        } catch (error) {
          console.error('Error generating AI response:', error);
          showError('Failed to generate AI response');
        } finally {
          setIsLoading(false);
        }
      } else {
        // If editing an AI message, just update it
        setMessages(prev => prev.map(msg => 
          msg.id === editingMessageId 
            ? { ...msg, content: editingContent.trim() }
            : msg
        ));
        
        // Clear editing state
        setEditingMessageId(null);
        setEditingContent('');
        
        // Save to database if user is logged in
        try {
          // Only use Supabase session for database operations to comply with RLS policies
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user?.id) {
            const userId = session.user.id;
            const updatedMessages = messages.map(msg => 
              msg.id === editingMessageId 
                ? { ...msg, content: editingContent.trim() }
                : msg
            );
            
            // Note: Message editing with new structure would require
            // updating individual messages in the messages table
            // For now, we'll skip this update as it requires more complex logic
            console.log('Message editing saved to local state only');
          }
        } catch (error) {
          console.error('Error saving edited message:', error);
        }
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent('');
  };

  // Handle deleting a chat from history
  const handleDeleteChat = async (chatIdToDelete: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent chat selection when clicking delete
    
    if (!user?.id) {
      showError('You must be logged in to delete chats');
      return;
    }

    try {
      // Delete from Supabase using new service
      const success = await deleteNewChat(chatIdToDelete, user.id);

      if (!success) {
        console.error('Error deleting chat: deleteNewChat returned false');
        showError('Failed to delete chat');
        return;
      }

      // Remove from local state
      setChats(prev => prev.filter(chat => chat.id !== chatIdToDelete));
      
      // Remove from grouped chat history
      setGroupedChatHistory(prev => ({
        today: prev.today.filter(chat => chat.id !== chatIdToDelete),
        yesterday: prev.yesterday.filter(chat => chat.id !== chatIdToDelete),
        lastWeek: prev.lastWeek.filter(chat => chat.id !== chatIdToDelete),
        lastMonth: prev.lastMonth.filter(chat => chat.id !== chatIdToDelete),
        older: prev.older.filter(chat => chat.id !== chatIdToDelete)
      }));

      // If the deleted chat is the current chat, navigate to a new chat
      if (chatIdToDelete === chatId) {
        const newChatId = crypto.randomUUID();
        updateUrlToChatId(newChatId);
        setChatId(newChatId);
        setMessages([]);
      }

      showSuccess('Chat deleted successfully');
    } catch (error) {
      console.error('Error deleting chat:', error);
      showError('Failed to delete chat');
    }
  };

  // Handle file upload with better error reporting
  const handleFileUpload = async () => {
    // Skip coin enforcement; only display estimated cost in UI
    
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle file change with preview support
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file using the same validation as FileUploadPopup
      const validation = validateFile(file);
      
      if (!validation.isValid) {
        showWarning(validation.error || 'Invalid file');
        return;
      }
      
      setSelectedFile(file);
      // Clear generation type when file is attached
      setSelectedGenerationType(null);
    }
  };

  // New file upload popup functions
  const handleOpenFileUploadPopup = () => {
    setIsFileUploadPopupOpen(true);
  };

  const handleCloseFileUploadPopup = () => {
    setIsFileUploadPopupOpen(false);
  };


  
  // Get PDF page count without creating images
  const getPdfPageCount = async (pdfFile: File): Promise<number> => {
    try {
      // Import pdfjs-dist dynamically
      const pdfjsLib = await import('pdfjs-dist');
      
      // Set worker source for PDF.js version 5.x
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.54/pdf.worker.min.mjs`;
      
      // Convert file to array buffer
      const arrayBuffer = await pdfFile.arrayBuffer();
      
      // Load PDF document
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      return pdf.numPages;
    } catch (error) {
      console.error('Error getting PDF page count:', error);
      throw new Error('Failed to get PDF page count');
    }
  };

  // Convert PDF to array of images
  const convertPdfToImages = async (pdfFile: File): Promise<File[]> => {
    try {
      // Import pdfjs-dist dynamically
      const pdfjsLib = await import('pdfjs-dist');
      
      // Set worker source to the correct CDN URL for version 5.4.54
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.54/pdf.worker.min.mjs';
      
      // Convert file to array buffer
      const arrayBuffer = await pdfFile.arrayBuffer();
      
      // Load the PDF document
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const imageFiles: File[] = [];
      
      // Convert each page to an image
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const scale = 2.0; // Higher scale for better quality
        const viewport = page.getViewport({ scale });
        
        // Create canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) {
          throw new Error('Failed to get canvas context');
        }
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Render page to canvas
        await page.render({
          canvas,
          canvasContext: context,
          viewport
        }).promise;
        
        // Convert canvas to blob and then to File
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => resolve(blob!), 'image/png');
        });
        
        const imageFile = new File(
          [blob],
          `${pdfFile.name.replace(/\.pdf$/i, '')}_page_${pageNum}.png`,
          { type: 'image/png' }
        );
        
        imageFiles.push(imageFile);
      }
      
      return imageFiles;
    } catch (error) {
      console.error('Error converting PDF to images:', error);
      throw new Error('Failed to convert PDF to images');
    }
  };

  // Convert DOC/DOCX to array of images
  const convertDocToImages = async (docFile: File): Promise<File[]> => {
    try {
      const mammoth = await import('mammoth');
      
      // Read DOC/DOCX file as array buffer
      const arrayBuffer = await docFile.arrayBuffer();
      
      // Convert to HTML
      const result = await mammoth.convertToHtml({ arrayBuffer });
      const htmlContent = result.value;
      
      // Create a temporary div to render the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.width = '800px';
      tempDiv.style.padding = '40px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.fontSize = '14px';
      tempDiv.style.lineHeight = '1.6';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.color = 'black';
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      
      // Add to document temporarily
      document.body.appendChild(tempDiv);
      
      // Use html2canvas to convert to image
      const html2canvas = await import('html2canvas');
      const canvas = await html2canvas.default(tempDiv, {
        backgroundColor: 'white',
        scale: 2,
        useCORS: true,
        allowTaint: true
      });
      
      // Remove temporary div
      document.body.removeChild(tempDiv);
      
      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png', 0.9);
      });
      
      // Create file from blob
      const imageFile = new File(
        [blob],
        `${docFile.name.replace(/\.(doc|docx)$/i, '')}_converted.png`,
        { type: 'image/png' }
      );
      
      return [imageFile];
    } catch (error) {
      console.error('Error converting DOC to images:', error);
      throw new Error('Failed to convert document to images');
    }
  };



  const handleCloseFilePreview = () => {
    setIsFilePreviewOpen(false);
    setPreviewFileUrl('');
    setPreviewFileName('');
  };

  // Function to show image in full screen


  // Define proper types for the startNewChat function
  const startNewChat = async (customChatId?: string) => {
    stopSpeech();
    const newChatId = customChatId || crypto.randomUUID();
    setChatId(newChatId);
    
    // Clear all state completely to prevent any leakage
    setMessageHistory([]);
    setInputMessage('');
    setSelectedFile(null);
    setDisplayedText({});
    setIsTyping({});
    setEditingMessageId(null);
    setEditingContent('');
    setIsSearchActive(false);
    setIsSearchQueued(false);
    nextMessageTypeRef.current = null;
    try {
      const intervalId = searchPlaceholderIntervalRef.current;
      if (typeof intervalId === 'number') {
        clearInterval(intervalId);
        searchPlaceholderIntervalRef.current = null;
      }
    } catch {}
    
    // Start with empty messages - no initial message
    setMessages([]);
    setSelectedRole(roleOptions[0]);
    
    // Update URL without reloading
    updateUrlToChatId(newChatId);
    
    try {
      // Use AuthContext user for database operations
      if (!user?.id) {
        console.log('⚠️ No AuthContext user found, skipping database creation');
        console.log('📝 Chat will work in local mode until user authenticates');
        return;
      }
      
      const userId = user.id;
      console.log('✅ Using AuthContext user ID for new chat:', userId);
      
      // Create empty chat in database using direct database insert
      console.log('🔄 Creating new chat in database with ID:', newChatId);
      
      const { data: createdChat, error: chatError } = await supabase
        .from('chats')
        .insert({
          id: newChatId,
          owner: userId,
          title: 'New Chat',
          position_counter: 0,
          metadata: (() => {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const offset = -new Date().getTimezoneOffset();
            const d = new Date();
            const two = (n: number) => (n < 10 ? `0${n}` : `${n}`);
            const localIso = `${d.getFullYear()}-${two(d.getMonth() + 1)}-${two(d.getDate())} ${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())}`;
            return { created_at_local: localIso, timezone: tz, timezone_offset_minutes: offset };
          })(),
          role: selectedRole.id,
          use_at: getCurrentLocalTimeFormatted()
        })
        .select()
        .single();
      
      if (chatError) {
        console.error('❌ Error creating new chat:', chatError);
        // Don't throw error, just log it and continue with local state
      } else {
        console.log('✅ Successfully created new chat in database:', createdChat);
        
        // Update local state with the new chat
        setChats(prev => [{
          id: newChatId,
          title: 'New Chat',
          messages: [],
          role: roleOptions[0].id,
          roleDescription: roleOptions[0].description,
          description: 'New conversation'
        }, ...prev]);
        
        // Update chat history groups
        setGroupedChatHistory(prev => ({
          ...prev,
          today: [{ 
            id: newChatId, 
            title: 'New Chat', 
            role: roleOptions[0].id,
            roleName: roleOptions[0].name
          }, ...prev.today]
        }));
      }
    } catch (error) {
      console.error('❌ Error in startNewChat:', error);
      // Continue with local state even if database operation fails
    }
  };

  // Add a wrapper function for onClick event
  const handleStartNewChat = async () => {
    // Ensure the speech is stopped
    stopSpeech();
    
    // Create a new chat ID first
    const newChatId = crypto.randomUUID();
    
    // Clear all message state completely
    setMessages([]);
    setMessageHistory([]);
    setInputMessage('');
    setSelectedFile(null);
    setDisplayedText({});
    setIsTyping({});
    setEditingMessageId(null);
    setEditingContent('');
    setUserMessageCount(0);
    setIsMessageLimitReached(false);
    setIsSearchActive(false);
    setIsSearchQueued(false);
    nextMessageTypeRef.current = null;
    try {
      const intervalId = searchPlaceholderIntervalRef.current;
      if (typeof intervalId === 'number') {
        clearInterval(intervalId);
        searchPlaceholderIntervalRef.current = null;
      }
    } catch {}
    
    // Reset to default role
    setSelectedRole(roleOptions[0]);
    
    // Update chat ID state immediately
    setChatId(newChatId);
    
    // Close mobile sidebar if open
    setShowChatHistory(false);
    
    // Navigate immediately to show the new chat
    updateUrlToChatId(newChatId);
    setIsInitialRouteResolving(false);
    
    try {
      // Use AuthContext user instead of Supabase session
      if (!user?.id) {
        console.log('⚠️ No AuthContext user found, using local chat');
        return;
      }
      
      // For logged in users, create the new chat in the database in background
      console.log('🔄 Creating new chat in database with ID:', newChatId);
      await startNewChat(newChatId);
      
      console.log('✅ Successfully created new chat in database with ID:', newChatId);
      
      // Refresh the chat history to show the new chat
      setTimeout(async () => {
        console.log('🔄 Refreshing chat history after database creation');
        await fetchUserChatsWithoutMessageUpdate(); // Use the version that doesn't update messages/navigation
        
        // Ensure the new chat is selected and visible after refresh
        setTimeout(() => {
          console.log('✅ Ensuring new chat is selected:', newChatId);
          // Force re-selection to ensure proper highlighting
          if (chatId === newChatId) {
            console.log('🎯 New chat is already selected and should be highlighted');
          }
        }, 200);
      }, 500);
      
    } catch (error) {
      console.error('❌ Error creating chat in database:', error);
      // Chat is already available locally, so this doesn't affect user experience
    }
  };

  // Calculate remaining messages for display
  const currentUserMessages = messages.filter(m => m.role === 'user').length;

  // Load voices when component mounts
  useEffect(() => {
    // Function to load and preload voices
    const loadVoices = () => {
      // Preload voices
      window.speechSynthesis.getVoices();
    };
    
    // Chrome requires the voices to be loaded asynchronously
    setTimeout(loadVoices, 100);
    
    // Also set up the onvoiceschanged event
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    // Fix for Chrome's bug where it cuts off speech
    let utteranceChunks: SpeechSynthesisUtterance[] = [];
    
    // Chrome speech synthesis bug fix
    const fixChromeSpeechBug = () => {
      // Chrome has a bug where the speech synthesis stops after ~15 seconds
      // This keeps it alive by pausing and resuming at intervals
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
        setTimeout(fixChromeSpeechBug, 5000);
      }
    };
    
    // Start the fix if we're on Chrome
    if (/Chrome/.test(navigator.userAgent) && !/Edge/.test(navigator.userAgent)) {
      setTimeout(fixChromeSpeechBug, 5000);
    }
    
    // Ensure speech is stopped when component unmounts
    return () => {
      if (window.speechSynthesis.speaking) {
        try {
          window.speechSynthesis.cancel();
        } catch (error) {
          console.error('Error stopping speech on unmount:', error);
        }
      }
    };
  }, []);

  // Function to speak the assistant message
  const handleTextToSpeech = (text: string, messageId: number) => {
    // If this message is already speaking, stop it
    if (speakingMessageId === messageId && window.speechSynthesis.speaking) {
      stopSpeech();
      return;
    }
    
    // Stop any current speech before starting new one
    stopSpeech();
    
    // Extract plain text from HTML/markdown content for speech synthesis
    const plainText = extractPlainTextFromHTML(text);
    
    // Create speech synthesis utterance with plain text
    const utterance = new SpeechSynthesisUtterance(plainText);
    
    // Set language (default to English)
    utterance.lang = 'en-US';
    
    // Check if we're on macOS
    const isMacOS = /Macintosh|MacIntel|MacPPC|Mac68K/.test(navigator.userAgent);
    
    // Get available voices
    const voices = window.speechSynthesis.getVoices();
    
    // Try to find a high-quality voice
    // MacOS has different preferred voices than Windows
    const preferredVoices = isMacOS ? 
      ["Samantha", "Karen", "Daniel", "Alex", "Fred"] : 
      ["Google UK English Male", "Microsoft David", "Microsoft Mark", "Daniel", "Alex"];
    
    let selectedVoice = null;
    
    // First try exact matches from our preferred list
    for (const voiceName of preferredVoices) {
      const voice = voices.find(v => v.name === voiceName && v.lang.includes('en'));
      if (voice) {
        selectedVoice = voice;
        break;
      }
    }
    
    // If no exact match, try partial matches
    if (!selectedVoice) {
      selectedVoice = voices.find(v => 
        (preferredVoices.some(pv => v.name.includes(pv)) ||
        v.name.includes('Male')) && 
        v.lang.includes('en')
      );
    }
    
    // If still no match, just use any English voice
    if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.includes('en'));
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    // Set other properties - use more conservative settings on macOS
    utterance.rate = isMacOS ? 1.0 : 0.95;
    utterance.pitch = 1.0; // Use neutral pitch to avoid issues
    utterance.volume = 1.0; // Full volume
    
    // Add event listeners
    utterance.onstart = () => {
      setIsSpeaking(true);
      setSpeakingMessageId(messageId);
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingMessageId(null);
      
      // If auto-speak is enabled, speak the next message
      if (autoSpeak) {
        const assistantMessages = messages
          .filter(m => m.role === 'assistant' && !isTyping[m.id])
          .sort((a, b) => a.id - b.id);
        
        const currentIndex = assistantMessages.findIndex(m => m.id === messageId);
        if (currentIndex >= 0 && currentIndex < assistantMessages.length - 1) {
          const nextMessage = assistantMessages[currentIndex + 1];
          handleTextToSpeech(nextMessage.content, nextMessage.id);
        }
      }
    };
    
    utterance.onerror = (event) => {
      console.error('SpeechSynthesis error:', event);
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    };
    
    // Speak the entire text at once
    window.speechSynthesis.speak(utterance);
  };
  
  // Function to stop any ongoing speech
  const stopSpeech = () => {
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      try {
        window.speechSynthesis.cancel();
      } catch (error) {
        console.error('Error stopping speech:', error);
      }
      setIsSpeaking(false);
      setSpeakingMessageId(null);
    }
  };

  // Toggle auto speak function
  const toggleAutoSpeak = () => {
    const newAutoSpeakState = !autoSpeak;
    setAutoSpeak(newAutoSpeakState);
    
    // If turning off auto-speak, stop any ongoing speech
    if (!newAutoSpeakState) {
      stopSpeech();
    } else {
      // If turning on auto-speak and no speech is currently happening,
      // find the last assistant message and start speaking from there
      if (!isSpeaking) {
        const assistantMessages = messages
          .filter(m => m.role === 'assistant' && !isTyping[m.id])
          .sort((a, b) => a.id - b.id);
        
        if (assistantMessages.length > 0) {
          const lastAssistantMessage = assistantMessages[assistantMessages.length - 1];
          handleTextToSpeech(lastAssistantMessage.content, lastAssistantMessage.id);
        }
      }
    }
  };

  const getUserInitial = () => {
    if (userData && userData.name) {
      return userData.name.split(' ').map((word: string) => word[0]).join('').toUpperCase();
    }
    return '';
  };

  const getUserDisplayName = () => {
    if (userData && userData.name) {
      return userData.name;
    }
    return 'User';
  };

  // Get role name from role ID
  const getRoleName = (roleId: string): string => {
    if (!roleId) return 'General Assistant';
    
    const role = roleOptions.find(r => r.id === roleId);
    return role ? role.name : 'General Assistant';
  };

  // Chat history skeleton component
  const ChatHistorySkeleton = () => {
    // Generate more skeleton items to fill the area
    const skeletonCount = 8; // Increased from 3 to fill more area
    
    return (
      <div className="space-y-3">
        {[...Array(skeletonCount)].map((_, index) => (
          <div key={index} className={`group relative mx-2 mb-3 p-4 rounded-xl animate-pulse ${
            darkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-gray-50/50 border-gray-200/50'
          } border`}>
            <div className="flex items-start gap-3">
              {/* Chat Icon Skeleton */}
              <div className={`flex-shrink-0 w-10 h-10 rounded-lg ${
                darkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}></div>
              
              <div className="flex-1 min-w-0">
                {/* Chat Title Skeleton */}
                <div className={`h-4 rounded mb-2 ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`} style={{ width: `${60 + Math.random() * 30}%` }}></div>
                
                {/* Role Badge Skeleton */}
                <div className="flex items-center gap-2 mb-2">
                  <div className={`h-6 rounded-full ${
                    darkMode ? 'bg-gray-700' : 'bg-gray-200'
                  }`} style={{ width: '80px' }}></div>
                </div>
                
                {/* Timestamp Skeleton */}
                <div className={`h-3 rounded ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`} style={{ width: '60px' }}></div>
              </div>
              
              {/* Delete button skeleton */}
              <div className={`w-6 h-6 rounded ${
                darkMode ? 'bg-gray-700' : 'bg-gray-200'
              }`}></div>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  // Modify renderChatHistoryItem to include role information
  const renderChatHistoryItem = (chat: {id: string, title: string, role: string, roleName?: string}, timeframe: string) => {
    const isSelected = chat.id === chatId;
    // Use pre-computed roleName if available, otherwise compute it
    const roleName = chat.roleName || getRoleName(chat.role);
    
    return (
      <div 
        key={chat.id}
        className={`group relative mx-2 mb-3 p-3 sm:p-4 rounded-xl cursor-pointer transition-all duration-300 ${
          isSelected 
            ? `${darkMode ? 'bg-blue-600/20 border-blue-500/50 shadow-lg' : 'bg-blue-50 border-blue-200 shadow-md'} border-2` 
            : `${darkMode ? 'bg-gray-800/50 hover:bg-gray-700/70 border-gray-700/50' : 'bg-gray-50/50 hover:bg-white border-gray-200/50'} border hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-lg`
        } transform hover:scale-[1.02] hover:-translate-y-1`}
        onClick={() => selectChat(chat.id)}
      >
        {/* Active indicator */}
        {isSelected && (
          <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-10 rounded-r-full ${
            darkMode ? 'bg-blue-500' : 'bg-blue-600'
          }`} />
        )}
        
        <div className="flex items-start gap-2 sm:gap-3">
          {/* Chat Icon */}
          <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${
            isSelected 
              ? `${darkMode ? 'bg-blue-600' : 'bg-blue-500'} text-white` 
              : `${darkMode ? 'bg-gray-700' : 'bg-gray-200'} ${darkMode ? 'text-gray-300' : 'text-gray-600'}`
          } transition-all duration-200`}>
            <FiMessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            {/* Chat Title */}
            <div className={`font-semibold text-xs sm:text-sm mb-1 truncate ${
              isSelected
                ? `${darkMode ? 'text-blue-300' : 'text-blue-700'}`
                : `${darkMode ? 'text-gray-200' : 'text-gray-900'}`
            }`}>
              {chat.title}
            </div>
            
            {/* Role Badge */}
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${
                isSelected
                  ? `${darkMode ? 'bg-blue-700/50 text-blue-200' : 'bg-blue-100 text-blue-700'}`
                  : `${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`
              }`}>
                {roleName}
              </span>
            </div>
            
            {/* Timestamp */}
            <div className={`text-[11px] sm:text-xs ${
              isSelected
                ? `${darkMode ? 'text-blue-200/70' : 'text-blue-600/70'}`
                : `${darkMode ? 'text-gray-500' : 'text-gray-500'}`
            }`}>
              {timeframe}
            </div>
          </div>
          
          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              showConfirmation('Are you sure you want to delete this chat?', () => {
                handleDeleteChat(chat.id, e);
              });
            }}
            className={`opacity-0 group-hover:opacity-100 p-2 rounded-lg transition-all duration-200 ${
              darkMode 
                ? 'hover:bg-red-600/20 text-gray-500 hover:text-red-400' 
                : 'hover:bg-red-50 text-gray-400 hover:text-red-600'
            } transform hover:scale-110`}
            title="Delete chat"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // Function to select a chat
  const selectChat = async (selectedChatId: string) => {
    if (selectedChatId === chatId) {
      // Same chat selected, no need to reload
      console.log('🔄 Same chat selected, skipping reload');
      return;
    }
    
    stopSpeech(); // Stop any ongoing speech
    // Ensure streaming is stopped and connection closed when switching chats
    if (sseAbortRef.current) {
      try { sseAbortRef.current.abort(); } catch {}
      sseAbortRef.current = null;
    }
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch {}
      wsRef.current = null;
    }
    setIsStreaming(false);
    setIsPaused(false);
    setIsIntentionallyAborted(false);
    setIsSending(false);
    setIsLoading(false);
    
    setIsChatSwitching(true);
    setIsLoading(true);
    setMessages([]);
    
    setChatId(selectedChatId);
    setShowHistoryDropdown(false);
    setShowChatHistory(false); // Close mobile sidebar when selecting a chat
    
    

    // Check if we already have this chat in our local state
    const existingChat = chats.find(chat => chat.id === selectedChatId);
    if (existingChat && existingChat.messages && existingChat.messages.length > 0) {
      console.log('✅ Found chat in local state with messages, loading directly');
      setMessages(existingChat.messages);
      setSelectedRole(roleOptions.find(role => role.id === existingChat.role) || roleOptions[0]);
      updateUrlToChatId(selectedChatId);
      setIsInitialRouteResolving(false);
      setIsChatSwitching(false);
      setIsLoading(false);
      return;
    }
    
    // Only fetch from database if chat not found locally
    try {
      console.log('🎯 selectChat - Loading chat from database for ID:', selectedChatId);
      // Only use Supabase session for database operations to comply with RLS policies
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user?.id) {
        console.log('❌ selectChat - No session found, attempting unauthenticated fetch');
        // Try fetching messages even without session (anon key + permissive RLS or public data)
        const chatMessages = await getLatestChatMessages(selectedChatId, 10);
        const chatData = chatMessages.length > 0 ? { messages: chatMessages, role: existingChat?.role || 'general' } : null;
        const chatError = chatMessages.length === 0 ? 'Chat not found or no access' : null;

        setIsLoadingMoreMessages(false);
        if (chatMessages.length > 0) {
          setOldestMessagePosition(chatMessages[0]?.position);
          setHasMoreMessages(chatMessages.length === 10);
        } else {
          setOldestMessagePosition(undefined);
          setHasMoreMessages(false);
        }

        console.log('📋 selectChat (no session) - Query result:', { chatData, chatError });

        if (!chatData) {
          // Keep empty state but stop loading
          setSelectedRole(roleOptions.find(role => role.id === (existingChat?.role || 'general')) || roleOptions[0]);
          updateUrlToChatId(selectedChatId);
          setIsInitialRouteResolving(false);
          setIsChatSwitching(false);
          setIsLoading(false);
          return;
        }

        const processedMessages = (chatData.messages || []).map((msg: any, index: number) => {
          const fm: FrontendMessage = supabaseMessageToFrontend(msg);
          const numericId = parseInt(fm.message_id || '') || Date.now() + index;
          return {
            id: numericId,
            role: fm.role || 'user',
            content: fm.content || '',
            timestamp: fm.timestamp || new Date().toISOString(),
            fileContent: fm.fileContent,
            fileName: fm.fileName,
            sender: fm.role === 'assistant' ? 'bot' : 'user',
            text: fm.content,
            isStreaming: fm.isStreaming || false,
            attachments: fm.attachments,
            file_url: fm.file_url,
            file_name: fm.file_name,
            file_type: fm.file_type,
            file_size: fm.file_size,
            chartConfig: fm.chartConfig,
            chartId: fm.chartId
          } as Message;
        });

        setMessages(processedMessages.filter((msg): msg is Message => Boolean(msg)));
        try {
          const latestAssistant = (() => {
            for (let i = processedMessages.length - 1; i >= 0; i--) {
              const m = processedMessages[i];
              if (m && (m.role === 'assistant' || m.role === 'bot')) return m;
            }
            return null;
          })();
          if (latestAssistant && latestAssistant.isStreaming) {
            const initialCursor = (latestAssistant.content || '').length;
            await subscribeToChatStream(selectedChatId, initialCursor, latestAssistant.id);
          }
        } catch {}
        setSelectedRole(roleOptions.find(role => role.id === chatData.role) || roleOptions[0]);
        updateUrlToChatId(selectedChatId);
        setIsInitialRouteResolving(false);
        setIsChatSwitching(false);
        setIsLoading(false);
        return;
      }
      
      const userId = session.user.id;
      console.log('✅ selectChat - Using Supabase session user ID:', userId);
      
      // Fetch specific chat directly from database using new lazy loading service
      console.log('🔍 selectChat - Querying database for chat_id:', selectedChatId, 'user_id:', userId);
      const chatMessages = await getLatestChatMessages(selectedChatId, 10);
      const chatData = chatMessages.length > 0 ? { messages: chatMessages, role: 'general' } : null;
      const chatError = chatMessages.length === 0 ? 'Chat not found' : null;
      
      // Set lazy loading state
      setIsLoadingMoreMessages(false); // Reset loading state
      if (chatMessages.length > 0) {
        setOldestMessagePosition(chatMessages[0]?.position);
        setHasMoreMessages(chatMessages.length === 10); // Assume more if we got full batch
      } else {
        setOldestMessagePosition(undefined);
        setHasMoreMessages(false);
      }
      
      console.log('📋 selectChat - Query result:', { chatData, chatError });
      
      if (chatError || !chatData) {
        // Chat not found, create new one
        console.log('❌ selectChat - Chat not found in database, creating new chat with ID:', selectedChatId);
        console.log('🔧 selectChat - Error details:', chatError);
        setSelectedRole(roleOptions[0]);
        updateUrlToChatId(selectedChatId);
        setIsInitialRouteResolving(false);
        setIsChatSwitching(false);
        setIsLoading(false);
        return;
      }
      
      // Process messages from database using shared converter
      console.log('✅ selectChat - Chat found! Processing', chatData.messages?.length || 0, 'messages');
      console.log('📋 selectChat - Raw chat data:', JSON.stringify(chatData, null, 2));
      
      const processedMessages = (chatData.messages || []).map((msg: any, index: number) => {
        const fm: FrontendMessage = supabaseMessageToFrontend(msg);
        const numericId = parseInt(fm.message_id || '') || Date.now() + index;
        return {
          id: numericId,
          role: fm.role || 'user',
          content: fm.content || '',
          timestamp: fm.timestamp || new Date().toISOString(),
          fileContent: fm.fileContent,
          fileName: fm.fileName,
          sender: fm.role === 'assistant' ? 'bot' : 'user',
          text: fm.content,
          isStreaming: fm.isStreaming || false,
          attachments: fm.attachments,
          file_url: fm.file_url,
          file_name: fm.file_name,
          file_type: fm.file_type,
          file_size: fm.file_size,
          chartConfig: fm.chartConfig,
          chartId: fm.chartId
        } as Message;
      });
      
      console.log('🔄 selectChat - Processed messages:', processedMessages.length);
      console.log('📱 selectChat - Setting messages in state:', JSON.stringify(processedMessages, null, 2));
      
      // Set fresh messages from database only
      setMessages(processedMessages.filter((msg): msg is Message => Boolean(msg)));
      try {
        const latestAssistant = (() => {
          for (let i = processedMessages.length - 1; i >= 0; i--) {
            const m = processedMessages[i];
            if (m && (m.role === 'assistant' || m.role === 'bot')) return m;
          }
          return null;
        })();
        if (latestAssistant && latestAssistant.isStreaming) {
          const initialCursor = (latestAssistant.content || '').length;
          await subscribeToChatStream(selectedChatId, initialCursor, latestAssistant.id);
        }
      } catch {}
      setSelectedRole(roleOptions.find(role => role.id === chatData.role) || roleOptions[0]);

      console.log('🎯 selectChat - Chat loaded successfully with', processedMessages.length, 'messages');
      // Update URL
      updateUrlToChatId(selectedChatId);
      setIsInitialRouteResolving(false);
      setIsChatSwitching(false);
      setIsLoading(false);

    } catch (error) {
      console.error('Error fetching chat from database:', error);
      // Fallback to empty chat
      setSelectedRole(roleOptions[0]);
      updateUrlToChatId(selectedChatId);
      setIsInitialRouteResolving(false);
      setIsChatSwitching(false);
      setIsLoading(false);
    }
  };

  // Right panel drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const newWidth = window.innerWidth - e.clientX;
    const minWidth = 280;
    const maxWidth = 600;
    
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setRightPanelWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  // Toggle right panel
  const toggleRightPanel = () => {
    setIsRightPanelOpen(!isRightPanelOpen);
  };

  // Create new chat handler
  const handleNewChat = async () => {
    // Use the same logic as handleStartNewChat for consistency
    await handleStartNewChat();
  };

  // Generation button selection handlers
  const handleImageGenerate = () => {
    setSelectedGenerationType('image_generate');
    // Clear file attachment when generation is selected
    setSelectedFile(null);
    setCurrentUploadedFile(null);
    setUploadedFiles([]);
  };

  const handleXLSXGenerate = () => {
    // Toggle selection - if already selected, unselect it
    if (selectedGenerationType === 'sheet_generate') {
      setSelectedGenerationType(null);
    } else {
      setSelectedGenerationType('sheet_generate');
      // Clear file attachment when generation is selected
      setSelectedFile(null);
      setCurrentUploadedFile(null);
      setUploadedFiles([]);
    }
  };

  const handleDocsGenerate = () => {
    // Toggle selection - if already selected, unselect it
    if (selectedGenerationType === 'document_generate') {
      setSelectedGenerationType(null);
    } else {
      setSelectedGenerationType('document_generate');
      // Clear file attachment when generation is selected
      setSelectedFile(null);
      setCurrentUploadedFile(null);
      setUploadedFiles([]);
    }
  };

  // Function to send generation request based on selected type
  const sendGenerationRequest = async (type: string, message: string) => {
    setIsGenerating(true);
    
    // Skip coin enforcement for generation; proceed and display estimated cost in UI
    
    // Add user message to chat immediately
    const userMessage: Message = {
      id: Date.now(),
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      sender: 'user'
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Removed database save for user message
    
    // Add initial bot message for streaming response
    const botMessageId = Date.now() + 1;
    const generationType = type === 'image_generate' ? 'image' : 
                          type === 'sheet_generate' ? 'spreadsheet' : 'document';
    const initialBotMessage: Message = {
      id: botMessageId,
      role: 'assistant',
      content: type === 'image_generate' ? 'Generating your image' : 
               type === 'sheet_generate' ? 'Generating your spreadsheet' : 'Generating your document',
      timestamp: new Date().toISOString(),
      sender: 'bot',
      isStreaming: true,
      isGenerating: true,
      generationType: generationType as 'image' | 'spreadsheet' | 'document'
    };
    
    setMessages(prev => [...prev, initialBotMessage]);
    
    try {
      if (type === 'document_generate' || type === 'sheet_generate') {
        const withSearch = isSearchActive || isSearchQueued || nextMessageTypeRef.current === 'search';
        if (withSearch) {
          const nType = type === 'sheet_generate' ? 'xlsx_with_search' : 'docx_with_search';
          let accumulated = '';
          const handleGenChunk = (chunk: string) => {
            accumulated += chunk;
            setMessages(prev => prev.map(msg => 
              msg.id === botMessageId 
                ? { ...msg, content: accumulated }
                : msg
            ));
          };
          await startWebSocketStreaming({ content: message, type: nType }, handleGenChunk);
          setMessages(prev => prev.map(msg => 
            msg.id === botMessageId 
              ? { ...msg, isStreaming: false, isGenerating: false } 
              : msg
          ));
          setInputMessage('');
          setSelectedGenerationType(null);
          setIsSearchActive(false);
          setIsSearchQueued(false);
          nextMessageTypeRef.current = null;
        } else {
          const baseType = type === 'sheet_generate' ? 'xlsx' : 'docx';
          let accumulated = '';
          const handleGenChunk = (chunk: string) => {
            accumulated += chunk;
            setMessages(prev => prev.map(msg => 
              msg.id === botMessageId 
                ? { ...msg, content: accumulated }
                : msg
            ));
          };
          await startWebSocketStreaming({ content: message, type: baseType }, handleGenChunk);
          setMessages(prev => prev.map(msg => 
            msg.id === botMessageId 
              ? { ...msg, isStreaming: false, isGenerating: false } 
              : msg
          ));
        }
      } else {
        let accumulated = '';
        const handleGenChunk = (chunk: string) => {
          accumulated += chunk;
          setMessages(prev => prev.map(msg => 
            msg.id === botMessageId 
              ? { ...msg, content: accumulated }
              : msg
          ));
        };
        await startWebSocketStreaming({ content: message, type }, handleGenChunk);
        setMessages(prev => prev.map(msg => 
          msg.id === botMessageId 
            ? { ...msg, isStreaming: false, isGenerating: false } 
            : msg
        ));
      }
      
      setInputMessage('');
      setSelectedGenerationType(null);
      
    } catch (error) {
      console.error('Error in generation request:', error);
      
      
      
      // Determine error type and message
      let errorMessage = 'An unexpected error occurred. Please try again.';
      let detailedError = '';
      
      if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Network connection failed. Please check your internet connection.';
          detailedError = 'Unable to connect to the generation service.';
        } else if (error.message.includes('401') || error.message.includes('403')) {
          errorMessage = 'Authentication failed. Please log in again.';
          detailedError = 'Your session may have expired.';
        } else if (error.message.includes('429')) {
          errorMessage = 'Too many requests. Please wait a moment before trying again.';
          detailedError = 'Rate limit exceeded.';
        } else if (error.message.includes('500')) {
          errorMessage = 'Server error. Our team has been notified.';
          detailedError = 'The generation service is temporarily unavailable.';
        } else {
          errorMessage = error.message;
        }
      }
      
      const typeNames = {
        'image_generate': 'image',
        'sheet_generate': 'spreadsheet', 
        'document_generate': 'document'
      };
      
      const contentType = typeNames[type as keyof typeof typeNames] || 'content';
      
      // Update bot message with detailed error
      setMessages(prev => prev.map(msg => 
        msg.id === botMessageId 
          ? { 
              ...msg, 
              content: `❌ **${contentType.charAt(0).toUpperCase() + contentType.slice(1)} Generation Failed**\n\n${errorMessage}${detailedError ? `\n\n*${detailedError}*` : ''}\n\nPlease try again or contact support if the problem persists.`,
              isStreaming: false,
              isGenerating: false 
            }
          : msg
      ));
      
      showError(`Failed to generate ${contentType}. ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Separate streaming and completed messages for better performance
  const { completedMessages, streamingMessage } = useMemo(() => {
    // Add safety check for messages array
    if (!messages || !Array.isArray(messages)) {
      return { completedMessages: [], streamingMessage: null };
    }
    
    const completed = messages.filter(msg => msg && !msg.isStreaming);
    const streaming = messages.find(msg => msg && msg.isStreaming);
    return { completedMessages: completed, streamingMessage: streaming };
  }, [messages]);

  // Memoize completed messages rendering to prevent unnecessary re-renders during streaming
  const memoizedCompletedMessages = useMemo(() => {
    console.log('🔄 DEBUG: Completed messages re-rendered. Count:', completedMessages?.length || 0);
    
    // Add safety check for completedMessages array
    if (!completedMessages || !Array.isArray(completedMessages)) {
      return [];
    }
    
    // Find the first user message index for mobile spacing fix
    const firstUserMessageIndex = completedMessages.findIndex(msg => msg && msg.role === 'user');
    
    return completedMessages.filter(message => message && message.id).map((message, index) => {
      
      // Process message to handle delimiter format and create attachments array
      let processedMessage = { ...message };
      
      // Create attachments array for UserMessageAttachments component
      if (message.role === 'user') {
        // Initialize attachments array
        const attachments: {
          url: string;
          fileName: string;
          fileType: string;
          originalName?: string;
          size?: number;
        }[] = [];
        
        // Priority 1: Use existing attachments if they exist (from uploadedFiles)
        if (message.attachments && message.attachments.length > 0) {
          attachments.push(...message.attachments);
        }
        // Priority 2: Check for ;;%%;; delimited URLs in content (database format) ONLY if no attachments exist
        else if (message.content && typeof message.content === 'string' && message.content.includes(';;%%;;')) {
          const urlMatch = message.content.match(/;;%%;;(.*?);;%%;;/);
          if (urlMatch) {
            const fileUrl = urlMatch[1].trim();
            attachments.push({
              url: fileUrl,
              fileName: message.fileName || 'Attachment',
              fileType: 'application/octet-stream',
              originalName: message.fileName || undefined,
              size: undefined
            });
            processedMessage.fileContent = fileUrl;
            processedMessage.fileName = message.fileName || 'Attachment';
          }
        }
        // Priority 3: Check for file_url fields (database format)
        else if (message.file_url) {
          attachments.push({
            url: message.file_url,
            fileName: message.file_name || 'Attachment',
            fileType: message.file_type || 'application/octet-stream',
            originalName: message.file_name || undefined,
            size: message.file_size || undefined
          });
        }
        
        // Only set attachments if we found any
        if (attachments.length > 0) {
          processedMessage.attachments = attachments;
        }
      }
      
    // Process bot messages for file attachments
    if (message.role === 'assistant' || message.role === 'bot') {
      if (message.attachments && message.attachments.length > 0) {
        const allowed = (message.attachments || []).filter(att => {
          const t = (att.fileType || '').toLowerCase();
          return (
            t.includes('openxmlformats-officedocument.spreadsheetml.sheet') ||
            t.includes('openxmlformats-officedocument.wordprocessingml.document') ||
            t.includes('.xlsx') ||
            t.includes('.docx')
          );
        });
        if (allowed.length > 0) {
          processedMessage.attachments = allowed;
        }
      } else {
        const fileExtraction = extractFileUrlFromBotResponse(message.content || '');
        if (fileExtraction.fileUrl) {
          processedMessage.attachments = [{
            url: fileExtraction.fileUrl,
            fileName: fileExtraction.fileName || 'Generated File',
            fileType: fileExtraction.fileType || 'application/octet-stream',
            originalName: fileExtraction.fileName || undefined,
            size: undefined
          }];
          processedMessage.content = fileExtraction.cleanContent;
        }
      }
    }

      {
        const textToCheck = (processedMessage.content || message.content || '') as string;
        if (hasCustomImageTag(textToCheck) && processedMessage.attachments && processedMessage.attachments.length > 0) {
          processedMessage.attachments = processedMessage.attachments.filter(a => !isImageAttachment(a));
        }
      }

      // Check if this is the first user message for mobile spacing
      const isFirstUserMessage = message.role === 'user' && index === firstUserMessageIndex;
      const originalText = (processedMessage.content || message.content || '') as string;
      const fileExtraction = extractFileUrlFromBotResponse(originalText);
      const extracted = extractLinksFromText(fileExtraction.cleanContent);
      const finalClean = hasCustomImageTag(fileExtraction.cleanContent) ? extracted.cleanContent : removeUrlsFromText(extracted.cleanContent);
      const linkData = { cleanContent: finalClean, links: extracted.links };

      return (
        <div key={message.id || `message-${index}`} className={`mb-6 ${message.role === 'user' ? 'ml-auto' : 'mr-auto'} ${isFirstUserMessage ? 'first-user-message' : ''}`}>
          {message.role === 'user' ? (
            <div className="flex justify-end">
              <div className="flex flex-col items-end max-w-full">
                {/* User message attachments */}
                {processedMessage.attachments && processedMessage.attachments.length > 0 && (
                  <UserMessageAttachments 
                    attachments={processedMessage.attachments}
                    darkMode={darkMode}
                  />
                )}
                
                {/* User message content */}
                <div className={`relative rounded-xl sm:rounded-2xl px-3 sm:px-6 py-3 sm:py-4 max-w-full break-words ${
                  darkMode 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                    : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                }`} style={{
                  borderTopRightRadius: '4px'
                }}>
                  {/* Chat bubble tail */}
                  
                  {editingMessageId === message.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        className={`w-full p-3 rounded-lg border resize-none ${
                          darkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                        }`}
                        rows={3}
                        placeholder={t('chat.editMessage.placeholder') || 'Edit your message'}
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSaveEdit()}
                          className={`px-4 py-2 rounded-lg text-sm font-medium ${
                            darkMode 
                              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                          }`}
                        >
                          {t('chat.editMessage.save') || 'Save'}
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className={`px-4 py-2 rounded-lg text-sm font-medium ${
                            darkMode 
                              ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                              : 'bg-gray-500 hover:bg-gray-600 text-white'
                          }`}
                        >
                          {t('chat.editMessage.cancel') || 'Cancel'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
                      {removeUrlsFromText((processedMessage.content?.replace(/;;%%;;.*?;;%%;;/g, '').trim() || (message.content as string) || '') as string)}
                    </div>
                  )}
                </div>
                
                {/* User message actions */}
                {editingMessageId !== message.id && (
                  <div className="flex items-center space-x-2 mt-2">
                    <button 
                      onClick={() => copyToClipboard((processedMessage.content || message.content || '') as string)}
                      className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-600'}`}
                      aria-label={t('chat.copyMessage')}
                    >
                      <FiCopy size={12} className="sm:w-3.5 sm:h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleShareMessage(processedMessage.content || message.content || '', processedMessage.attachments)}
                      className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-600'}`}
                      aria-label={t('chat.shareMessage')}
                    >
                      <FiShare2 size={12} className="sm:w-3.5 sm:h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="relative group">
              {/* Logo positioned at the top, aligned to left */}
              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 mb-2">
                <img 
                  src={matrixLogo} 
                  alt="matcos.ai Logo" 
                  className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover"
                />
              </div>
              {/* Bot message attachments */}
              {processedMessage.attachments && processedMessage.attachments.length > 0 && (
                <div className="mb-3">
                  <BotMessageAttachments 
                    attachments={processedMessage.attachments}
                    darkMode={darkMode}
                  />
                </div>
              )}
              
              {/* Text content positioned below logo, aligned to left with no background */}
              <div className="w-full">
                <div className="prose prose-sm sm:prose max-w-4xl">
                  <TextWithCharts 
                    text={linkData.cleanContent} 
                    darkMode={darkMode}
                    messageId={message.id.toString()}
                    isStreaming={false}
                    textStyle={{
                      color: darkMode ? '#e5e7eb' : '#374151',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      margin: '0'
                    }}
                  />
                </div>
              </div>
              
              
                
              {/* Assistant message actions */}
                  <div className="flex items-center justify-between mt-2 ml-0">
                    <div className="flex items-center space-x-2 flex-nowrap">
                      <button 
                        onClick={() => copyToClipboard(processedMessage.content)}
                        className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                        aria-label={t('chat.copyMessage')}
                      >
                        <FiCopy size={12} className="sm:w-3.5 sm:h-3.5" />
                      </button>

                    <button 
                      onClick={() => handleDeleteChat(message.id.toString(), {} as React.MouseEvent)}
                      className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                      aria-label={t('chat.deleteMessage')}
                    >
                      <FiTrash2 size={12} className="sm:w-3.5 sm:h-3.5" />
                    </button>
                    {processedMessage.content && (
                      <>
                        <button 
                          onClick={() => handleTextToSpeech(processedMessage.content, processedMessage.id)}
                          className={`p-1 rounded-full ${
                            speakingMessageId === processedMessage.id 
                              ? (darkMode ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-600')
                              : (darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500')
                          }`}
                          aria-label={speakingMessageId === processedMessage.id ? t('chat.stopSpeaking') : t('chat.speakMessage')}
                        >
                          {speakingMessageId === processedMessage.id ? 
                            <FiSquare size={12} className="sm:w-3.5 sm:h-3.5" /> : 
                            <FiVolume2 size={12} className="sm:w-3.5 sm:h-3.5" />
                          }
                        </button>
                        <button 
                          onClick={() => handleShareMessage(processedMessage.content, processedMessage.attachments)}
                          className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                          aria-label={t('chat.shareMessage')}
                        >
                          <FiShare2 size={12} className="sm:w-3.5 sm:h-3.5" />
                        </button>
                        {linkData.links && linkData.links.length > 0 && (
                          <LinkCirclesButton
                            links={linkData.links}
                            darkMode={darkMode}
                            onClick={() => {
                              setCitationsLinks(linkData.links);
                              setCitationsOpen(true);
                            }}
                          />
                        )}
                      </>
                    )}
                  </div>
                  <span className="text-xs">{formatTimestamp(processedMessage.timestamp)}</span>
                </div>
            </div>
          )}
        </div>
      );
    });
  }, [completedMessages, darkMode, editingMessageId, editingContent, speakingMessageId]);

  // Render streaming message separately to avoid re-rendering completed messages
  const renderStreamingMessage = useCallback(() => {
    if (!streamingMessage) return null;
    console.log('📡 DEBUG: Streaming message re-rendered. Content length:', streamingMessage.content?.length || 0);

    const message = streamingMessage;
    // Process message to handle delimiter format and create attachments array
    let processedMessage = { ...message };
    
    // Create attachments array for UserMessageAttachments component
    if (message.role === 'user') {
      // Initialize attachments array
      const attachments: {
        url: string;
        fileName: string;
        fileType: string;
        originalName?: string;
        size?: number;
      }[] = [];
      
      // Priority 1: Use existing attachments if they exist (from uploadedFiles)
      if (message.attachments && message.attachments.length > 0) {
        attachments.push(...message.attachments);
      }
      // Priority 2: Check for ;;%%;; delimited URLs in content (database format) ONLY if no attachments exist
      else if (message.content && typeof message.content === 'string' && message.content.includes(';;%%;;')) {
        const urlMatch = message.content.match(/;;%%;;(.*?);;%%;;/);
        if (urlMatch) {
          const fileUrl = urlMatch[1].trim();
          attachments.push({
            url: fileUrl,
            fileName: message.fileName || 'Attachment',
            fileType: 'application/octet-stream',
            originalName: message.fileName || undefined,
            size: undefined
          });
          processedMessage.fileContent = fileUrl;
          processedMessage.fileName = message.fileName || 'Attachment';
        }
      }
      // Priority 3: Check for file_url fields (database format)
      else if (message.file_url) {
        attachments.push({
          url: message.file_url,
          fileName: message.file_name || 'Attachment',
          fileType: message.file_type || 'application/octet-stream',
          originalName: message.file_name || undefined,
          size: message.file_size || undefined
        });
      }
      
      // Only set attachments if we found any
      if (attachments.length > 0) {
        processedMessage.attachments = attachments;
      }
    }
    
    // Process bot messages for file attachments
    if (message.role === 'assistant' || message.role === 'bot') {
      // Priority: use existing attachments on the message if present
      if (message.attachments && message.attachments.length > 0) {
        const allowed = (message.attachments || []).filter(att => {
          const t = (att.fileType || '').toLowerCase();
          return t.includes('openxmlformats-officedocument.spreadsheetml.sheet') || t.includes('openxmlformats-officedocument.wordprocessingml.document');
        });
        if (allowed.length > 0) {
          processedMessage.attachments = allowed;
        }
      } else {
        const fileExtraction = extractFileUrlFromBotResponse(message.content || '');
        if (fileExtraction.fileUrl) {
          processedMessage.attachments = [{
            url: fileExtraction.fileUrl,
            fileName: fileExtraction.fileName || 'Generated File',
            fileType: fileExtraction.fileType || 'application/octet-stream',
            originalName: fileExtraction.fileName || undefined,
            size: undefined
          }];
          processedMessage.content = fileExtraction.cleanContent;
        }
      }
    }

    {
      const textToCheck = (processedMessage.content || message.content || '') as string;
      if (hasCustomImageTag(textToCheck) && processedMessage.attachments && processedMessage.attachments.length > 0) {
        processedMessage.attachments = processedMessage.attachments.filter(a => !isImageAttachment(a));
      }
    }

    const originalText = (processedMessage.content || message.content || '') as string;
    const fileExtraction = extractFileUrlFromBotResponse(originalText);
    const extracted = extractLinksFromText(fileExtraction.cleanContent);
    const finalClean = hasCustomImageTag(fileExtraction.cleanContent) ? extracted.cleanContent : removeUrlsFromText(extracted.cleanContent);
    const linkData = { cleanContent: finalClean, links: extracted.links };

    return (
      <div key={message.id} className={`mb-6 ${message.role === 'user' ? 'ml-auto' : 'mr-auto'}`}>
        {message.role === 'user' ? (
          <div className="flex justify-end">
            <div className="relative group flex flex-col items-end max-w-full">
              {/* User message attachments */}
              {processedMessage.attachments && processedMessage.attachments.length > 0 && (
                <UserMessageAttachments 
                  attachments={processedMessage.attachments}
                  darkMode={darkMode}
                />
              )}
              
              {/* User message content */}
              <div className={`rounded-xl sm:rounded-2xl px-3 sm:px-6 py-3 sm:py-4 max-w-full break-words ${
                darkMode 
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
              }`}>
                <div className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
                  {removeUrlsFromText((processedMessage.content?.replace(/;;%%;;.*?;;%%;;/g, '').trim() || (message.content as string) || '') as string)}
                </div>
              </div>
              
            </div>
          </div>
        ) : (
          <div className="relative group">
            {/* Logo positioned at the top, aligned to left */}
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 mb-2">
              <img 
                src={matrixLogo} 
                alt="matcos.ai Logo" 
                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover"
              />
            </div>
            
            {/* Bot message attachments */}
            {processedMessage.attachments && processedMessage.attachments.length > 0 && (
              <div className="mb-3">
                <BotMessageAttachments 
                  attachments={processedMessage.attachments}
                  darkMode={darkMode}
                />
              </div>
            )}
            
            {/* Text content positioned below logo, aligned to left with no background */}
            <div className="w-full">
              <div className="prose prose-sm sm:prose max-w-4xl">
                <TextWithCharts 
                  text={linkData.cleanContent}
                  darkMode={darkMode}
                  messageId={`streaming-${Date.now()}`}
                  isStreaming={true}
                  textStyle={{
                    color: darkMode ? '#e5e7eb' : '#374151',
                    fontSize: '14px',
                    lineHeight: '1.6',
                    margin: '0'
                  }}
                  />
                  <div className="inline-flex ml-1 mt-1 items-center space-x-1">
                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${darkMode ? 'bg-blue-400' : 'bg-blue-500'}`} style={{ animationDelay: '0ms', animationDuration: '1s' }}></span>
                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${darkMode ? 'bg-blue-400' : 'bg-blue-500'}`} style={{ animationDelay: '200ms', animationDuration: '1s' }}></span>
                    <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${darkMode ? 'bg-blue-400' : 'bg-blue-500'}`} style={{ animationDelay: '400ms', animationDuration: '1s' }}></span>
                  </div>
                  {linkData.links && linkData.links.length > 0 && (
                    <div className="mt-2">
                      <LinkCirclesButton
                        links={linkData.links}
                        darkMode={darkMode}
                        onClick={() => {
                          setCitationsLinks(linkData.links);
                          setCitationsOpen(true);
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              
              
            </div>
        )}
      </div>
    );
  }, [streamingMessage, darkMode]);

  // Combine completed and streaming messages
  const memoizedMessages = useMemo(() => {
    const completedElements = memoizedCompletedMessages;
    const streamingElement = renderStreamingMessage();
    
    return streamingElement ? [...completedElements, streamingElement] : completedElements;
  }, [memoizedCompletedMessages, renderStreamingMessage]);

  

  return (
    <>
      <div className={`ChatPage flex h-screen overflow-hidden ${isKeyboardOpen ? 'keyboard-open' : ''}`}>
      
      
      {/* Mobile sidebar/chat history - Enhanced design */}
      {showChatHistory && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div 
            className="bg-black bg-opacity-60 flex-1"
            onClick={() => setShowChatHistory(false)}
          ></div>
          <div 
            className={`w-80 ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border-l shadow-2xl flex flex-col h-full transition-transform duration-300 ease-out`}
            onTouchStart={(e) => {
              const touch = e.touches[0];
              setTouchStart({ x: touch.clientX, y: touch.clientY });
            }}
            onTouchMove={(e) => {
              if (!touchStart) return;
              const touch = e.touches[0];
              const deltaX = touch.clientX - touchStart.x;
              const deltaY = touch.clientY - touchStart.y;
              
              // Only handle horizontal swipes (right direction to close)
              if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 50) {
                setShowChatHistory(false);
                setTouchStart(null);
              }
            }}
            onTouchEnd={() => {
              setTouchStart(null);
            }}
          >
            {/* Enhanced Mobile Header */}
            <div className={`px-4 py-4 border-b ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'} flex items-center justify-between sticky top-16 z-[1001]`}>
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${darkMode ? 'bg-blue-600' : 'bg-blue-500'}`}>
                  <FiMessageSquare className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className={`font-semibold text-base sm:text-lg ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    {t('chat.chatHistory')}
                  </h2>
                  <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {groupedChatHistory.today.length + groupedChatHistory.yesterday.length + groupedChatHistory.lastWeek.length + groupedChatHistory.lastMonth.length} conversations
                  </p>
                </div>
              </div>
              <AuthRequiredButton 
                onClick={() => setShowChatHistory(false)}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  darkMode 
                    ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' 
                    : 'hover:bg-gray-200 text-gray-600 hover:text-gray-800'
                }`}
              >
                <FiX className="w-5 h-5" />
              </AuthRequiredButton>
            </div>
            
            {/* Enhanced Mobile Content */}
            <div
              key={`chat-history-${chatHistoryRefreshKey}`}
              ref={mobileChatHistoryRef}
              onScroll={handleChatHistoryScroll}
              className={`flex-1 overflow-y-auto py-4 ${darkMode ? 'bg-gray-900' : 'bg-white'} custom-scrollbar`}
            >
              {/* Today */}
              {groupedChatHistory.today.length > 0 && (
                <div className="mb-6">
                  <div className={`flex items-center gap-3 px-4 py-3 mb-3 ${darkMode ? 'bg-gray-800/30' : 'bg-gray-100/50'} rounded-lg mx-2`}>
                    <div className={`w-2 h-2 rounded-full ${darkMode ? 'bg-green-500' : 'bg-green-600'}`} />
                    <h4 className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'} tracking-wide`}>
                      {t('chat.today')}
                    </h4>
                    <div className={`ml-auto text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                      {groupedChatHistory.today.length}
                    </div>
                  </div>
                  {groupedChatHistory.today.map(chat => renderChatHistoryItem(chat, t('chat.today')))}
                </div>
              )}
              
              {/* Yesterday */}
              {groupedChatHistory.yesterday.length > 0 && (
                <div className="mb-6">
                  <div className={`flex items-center gap-3 px-4 py-3 mb-3 ${darkMode ? 'bg-gray-800/30' : 'bg-gray-100/50'} rounded-lg mx-2`}>
                    <div className={`w-2 h-2 rounded-full ${darkMode ? 'bg-yellow-500' : 'bg-yellow-600'}`} />
                    <h4 className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'} tracking-wide`}>
                      {t('chat.yesterday')}
                    </h4>
                    <div className={`ml-auto text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                      {groupedChatHistory.yesterday.length}
                    </div>
                  </div>
                  {groupedChatHistory.yesterday.map(chat => renderChatHistoryItem(chat, t('chat.yesterday')))}
                </div>
              )}

              {/* Last Week */}
              {groupedChatHistory.lastWeek.length > 0 && (
                <div className="mb-6">
                  <div className={`flex items-center gap-3 px-4 py-3 mb-3 ${darkMode ? 'bg-gray-800/30' : 'bg-gray-100/50'} rounded-lg mx-2`}>
                    <div className={`w-2 h-2 rounded-full ${darkMode ? 'bg-blue-500' : 'bg-blue-600'}`} />
                    <h4 className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'} tracking-wide`}>
                      {t('chat.lastWeek')}
                    </h4>
                    <div className={`ml-auto text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                      {groupedChatHistory.lastWeek.length}
                    </div>
                  </div>
                  {groupedChatHistory.lastWeek.map(chat => renderChatHistoryItem(chat, t('chat.lastWeek')))}
                </div>
              )}
              
              {/* Last Month */}
              {groupedChatHistory.lastMonth.length > 0 && (
                <div className="mb-6">
                  <div className={`flex items-center gap-3 px-4 py-3 mb-3 ${darkMode ? 'bg-gray-800/30' : 'bg-gray-100/50'} rounded-lg mx-2`}>
                    <div className={`w-2 h-2 rounded-full ${darkMode ? 'bg-purple-500' : 'bg-purple-600'}`} />
                    <h4 className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'} tracking-wide`}>
                      {t('chat.lastMonth')}
                    </h4>
                    <div className={`ml-auto text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                      {groupedChatHistory.lastMonth.length}
                    </div>
                  </div>
                  {groupedChatHistory.lastMonth.map(chat => renderChatHistoryItem(chat, t('chat.lastMonth')))}
                </div>
              )}

              {/* Older */}
              {groupedChatHistory.older.length > 0 && (
                <div className="mb-6">
                  <div className={`flex items-center gap-3 px-4 py-3 mb-3 ${darkMode ? 'bg-gray-800/30' : 'bg-gray-100/50'} rounded-lg mx-2`}>
                    <div className={`w-2 h-2 rounded-full ${darkMode ? 'bg-gray-500' : 'bg-gray-600'}`} />
                    <h4 className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'} tracking-wide`}>
                      {t('chat.older')}
                    </h4>
                    <div className={`ml-auto text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                      {groupedChatHistory.older.length}
                    </div>
                  </div>
                  {groupedChatHistory.older.map(chat => renderChatHistoryItem(chat, t('chat.older')))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="flex-1 flex h-screen overflow-hidden chat-layout-container">
        <div className="flex-1 flex flex-col h-screen overflow-hidden chat-main-content relative">
          {(!chatId || isInitialRouteResolving) && (
            <div className={`${darkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-800'} absolute inset-0 z-[9999]`}>
              <div className="flex-1 flex flex-col">
                <div className={`${darkMode ? 'border-gray-700' : 'border-gray-200'} px-4 py-3 border-b`}>
                  <div className="animate-pulse flex items-center gap-3">
                    <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-300'} w-8 h-8 rounded-full`}></div>
                    <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-300'} h-4 w-40 rounded`}></div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-4 py-4">
                  <div className="animate-pulse space-y-6 max-w-2xl">
                    {[...Array(3)].map((_, i) => (
                      <div key={`user-${i}`} className="flex items-start gap-3">
                        <div className={`${darkMode ? 'bg-blue-900' : 'bg-blue-200'} w-10 h-10 rounded-full`}></div>
                        <div className={`${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} flex-1 rounded-2xl px-4 py-4 shadow-sm`}>
                          <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-200'} h-4 w-3/5 rounded`}></div>
                          <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-100'} mt-2 h-3 w-4/5 rounded`}></div>
                          <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-100'} mt-2 h-3 w-2/3 rounded`}></div>
                        </div>
                      </div>
                    ))}
                    {[...Array(2)].map((_, i) => (
                      <div key={`bot-${i}`} className="flex items-start gap-3">
                        <div className={`${darkMode ? 'bg-purple-900' : 'bg-purple-200'} w-10 h-10 rounded-full`}></div>
                        <div className={`${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} flex-1 rounded-2xl px-4 py-4 shadow-sm`}>
                          <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-200'} h-4 w-2/5 rounded`}></div>
                          <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-100'} mt-2 h-3 w-3/5 rounded`}></div>
                          <div className={`${darkMode ? 'bg-gray-800' : 'bg-gray-100'} mt-2 h-3 w-1/2 rounded`}></div>
                        </div>
                      </div>
                    ))}
                    <div className={`${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} rounded-xl px-4 py-3 border`}>
                      <div className="flex items-center gap-3">
                        <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-200'} h-10 flex-1 rounded`}></div>
                        <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-200'} w-10 h-10 rounded`}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        {/* Main content area */}
        <div className={`flex-1 flex flex-col overflow-hidden ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <div className="flex-1 overflow-hidden relative">
            {/* Show pro alert */}
            <AnimatePresence>
              {showProAlert && (
                <>
                  {console.log('🎯 ProFeatureAlert is rendering - showProAlert:', showProAlert)}
                  <ProFeatureAlert 
                    featureName={t('chat.title')}
                    onClose={() => {
                      console.log('❌ ProFeatureAlert closed');
                      setShowProAlert(false);
                    }}
                  />
                </>
              )}
            </AnimatePresence>
            
            {/* Main chat container - responsive to right panel state */}
            <div className={`h-full w-full px-0 pt-0 pb-0 flex flex-col transition-all duration-300`}>
              <div className="bg-opacity-80 backdrop-blur-sm rounded-lg sm:rounded-xl shadow-xl overflow-hidden flex-1 flex flex-col">
                {/* Chat interface */}
                <div ref={chatContainerRef} className="flex flex-col h-full">
                  {/* Chat header with role selector */}
                  <div className={`px-2 sm:px-6 py-1 sm:py-3 flex flex-row justify-between items-center border-b min-h-[40px] sm:min-h-[56px] mt-16 sm:mt-0 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <div className="relative">
                      <AuthRequiredButton 
                        onClick={() => setShowRoleSelector(!showRoleSelector)} 
                        className={`flex items-center space-x-1.5 px-1.5 sm:px-3 py-0.5 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium border ${
                          darkMode ? 'text-gray-200 hover:bg-gray-700 border-gray-600' : 'text-gray-700 hover:bg-gray-50 border-gray-300'
                        }`}
                      >
                        <FiCpu className="text-blue-500 mr-2" />
                        <span>{selectedRole.name}</span>
                        <FiChevronDown className={`transition-transform ${showRoleSelector ? 'rotate-180' : ''}`} />
                      </AuthRequiredButton>
                      
                      {/* Role Selector Dropdown */}
                      {showRoleSelector && (
                        <div className={`absolute top-full left-0 mt-1 w-56 sm:w-64 rounded-md shadow-lg z-10 ${
                          darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                        }`}>
                          <div className="py-1 max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200 dark:scrollbar-thumb-gray-600 dark:scrollbar-track-gray-800">
                            {roleOptions.map(role => (
                              <button
                                key={role.id}
                                className={`w-full text-left px-3 py-1.5 text-sm transition-colors duration-150 ${
                                  darkMode 
                                    ? 'hover:bg-gray-700 text-gray-200' 
                                    : 'hover:bg-gray-100 text-gray-700'
                                }`}
                                onClick={() => handleRoleChange(role)}
                              >
                                <div className="font-medium text-sm">{role.name}</div>
                                <div className={`text-xs leading-tight mt-0.5 ${
                                  darkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  {role.description}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-1 sm:space-x-2">

                      
                      {/* Mobile chat history button */}
                      <AuthRequiredButton 
                        onClick={() => setShowChatHistory(!showChatHistory)}
                        className={`md:hidden p-1 sm:p-2 rounded-lg ${
                          showChatHistory
                            ? (darkMode ? 'bg-gray-700 text-gray-200' : 'bg-gray-200 text-gray-700') 
                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                        title={t('chat.toggleChatHistory')}
                      >
                        <FiMessageSquare className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                      </AuthRequiredButton>
                      

                      
                      <AuthRequiredButton 
                        onClick={handleStartNewChat}
                        className="p-1 sm:p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        title={t('chat.newChat')}
                      >
                        <FiPlus className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                      </AuthRequiredButton>
                      

                      
                      {/* Auto-speak toggle */}
                      <AuthRequiredButton 
                        onClick={toggleAutoSpeak}
                        className={`p-1 sm:p-2 rounded ${
                          autoSpeak
                            ? (darkMode ? 'bg-blue-700 text-white' : 'bg-blue-100 text-blue-600')
                            : (darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700')
                        }`}
                        title={autoSpeak ? t('chat.autoSpeakOn') : t('chat.autoSpeakOff')}
                      >
                        {autoSpeak ? <FiVolume2 className="w-3.5 h-3.5 sm:w-5 sm:h-5" /> : <FiVolume className="w-3.5 h-3.5 sm:w-5 sm:h-5" />}
                      </AuthRequiredButton>

                      {/* Right panel toggle button - only show when panel is closed */}
                      {!isRightPanelOpen && (
                        <AuthRequiredButton 
                          onClick={toggleRightPanel}
                          className={`p-1 sm:p-2 rounded ${
                            darkMode ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                          }`}
                          title={t('chat.showChatHistory')}
                        >
                          <FiSidebar className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                        </AuthRequiredButton>
                      )}
                      
                      {/* Call button */}
                    
                    </div>
                  </div>
                  
                  {/* Messages container with improved markdown */}
                  <div ref={messagesContainerRef} className="messages-area flex-1 overflow-y-auto px-2 sm:px-4 pt-2 sm:pt-4 pb-0">
                    <div className="space-y-3 sm:space-y-6">
                      {/* Loading indicator for lazy loading */}
                      {isLoadingMoreMessages && (
                        <div className="flex justify-center py-4">
                          <div className={`animate-spin rounded-full h-6 w-6 border-b-2 ${
                            darkMode ? 'border-blue-400' : 'border-blue-600'
                          }`}></div>
                        </div>
                      )}
                      {/* Empty state when no messages */}
                      {messages.length === 0 && !isLoading && (
                        <div className="flex flex-col items-center justify-start pt-20 min-h-[300px] text-center">
                          <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mb-4 sm:mb-6 ${
                            darkMode ? 'bg-gradient-to-r from-blue-900 to-purple-900 text-white' : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                          }`}>
                            <FiCpu className="w-8 h-8 sm:w-10 sm:h-10" />
                          </div>
                          <h3 className={`text-lg sm:text-xl font-semibold mb-2 ${
                            darkMode ? 'text-gray-200' : 'text-gray-800'
                          }`}>
                            {t('chat.emptyState.title') || 'Start a new conversation'}
                          </h3>
                          <p className={`text-sm sm:text-base mb-6 max-w-md ${
                            darkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {t('chat.emptyState.description') || 'Ask me anything! I\'m here to help with your questions and tasks.'}
                          </p>
                          <div className={`text-xs sm:text-sm ${
                            darkMode ? 'text-gray-500' : 'text-gray-500'
                          }`}>
                            {selectedRole.name && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                <img 
                                  src={matrixLogo} 
                                  alt="matcos.ai Logo"
                                  className="w-3 h-3 mr-1 rounded-full object-cover"
                                />
                                {selectedRole.name}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {memoizedMessages}
                      
                      {/* Loading indicator - only show when there are no messages */}
                      {isLoading && messages.length === 0 && !isStreaming && (
                        <div className="flex justify-start mt-10 md:mt-0">
                          <div className="flex flex-row">
                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 mr-2 sm:mr-3 ${darkMode ? 'bg-gradient-to-r from-blue-900 to-purple-900 text-white' : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'}`}>
                              <FiCpu />
                            </div>
                            <div className={`rounded-xl sm:rounded-2xl px-3 sm:px-6 py-3 sm:py-4 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm'}`}>
                              <div className="flex space-x-2">
                                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      
                      
                      <div ref={messagesEndRef} />
                    </div>
                  </div>
                  
                    {/* Input area */}
                  <div ref={chatInputAreaRef} className={`chat-input-area p-0 sm:p-4 mt-0 md:mt-0 sm:border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    
                    {/* File Upload Status */}
                    {isUploading && (
                      <div className={`mb-3 p-3 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center space-x-3">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                Uploading {uploadingFileName}
                              </span>
                              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {uploadProgress}%
                              </span>
                            </div>
                            <div className={`w-full bg-gray-200 rounded-full h-2 ${darkMode ? 'bg-gray-700' : ''}`}>
                              <div 
                                className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                                style={{ width: `${uploadProgress}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Uploaded File Display */}
                    {currentUploadedFile && !isUploading && (
                      <div className={`mb-3 p-3 rounded-lg border ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-white'}`}>
                              {currentUploadedFile.fileType === 'image' ? (
                                <FiImage className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                              ) : (
                                <FiFileText className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
                              )}
                            </div>
                            <div>
                              <div className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                {currentUploadedFile.originalName}
                              </div>
                              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {currentUploadedFile.fileType === 'image' ? 'Image' : 'Document'} • {formatFileSize(currentUploadedFile.size || 0)}
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => setCurrentUploadedFile(null)}
                            className={`p-1 rounded-full hover:bg-gray-200 ${darkMode ? 'hover:bg-gray-600 text-gray-400' : 'text-gray-500'}`}
                          >
                            <FiX className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Fixed Generation Buttons */}
                    {showGenerationButtons && (!isGenerating && !selectedFile && !currentUploadedFile && uploadedFiles.length === 0 && !pendingPdfFile) && (
                      <div
                        className="mb-3"
                        onMouseDown={() => { interactingWithGenerationButtonsRef.current = true; }}
                        onMouseUp={() => { interactingWithGenerationButtonsRef.current = false; }}
                        onTouchStart={() => { interactingWithGenerationButtonsRef.current = true; }}
                        onTouchEnd={() => { interactingWithGenerationButtonsRef.current = false; }}
                      >
                        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto pb-2 flex-nowrap">


                        <AuthRequiredButton
                          onClick={handleXLSXGenerate}
                          disabled={isGenerating}
                          className={`flex items-center justify-center gap-x-2 px-2.5 py-1.5 md:px-3 md:py-2 rounded-xl text-xs md:text-sm font-semibold transition-all min-w-[80px] md:min-w-[160px] ${
                            selectedGenerationType === 'sheet_generate'
                              ? (darkMode ? 'bg-green-700 border-2 border-green-500 text-white' : 'bg-green-600 border-2 border-green-400 text-white')
                              : isGenerating
                              ? (darkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
                              : (darkMode ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white' : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white')
                          }`}
                        >
                          <FiFileText className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                      
                          <span className="hidden md:inline">Generate XLSX</span>
                          {selectedGenerationType === 'sheet_generate' && !isGenerating && (
                            <FiCheck className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          )}
                        </AuthRequiredButton>

                        <AuthRequiredButton
                          onClick={handleDocsGenerate}
                          disabled={isGenerating}
                          className={`flex items-center justify-center gap-x-2 px-2.5 py-1.5 md:px-3 md:py-2 rounded-xl text-xs md:text-sm font-semibold transition-all min-w-[80px] md:min-w-[160px] ${
                            selectedGenerationType === 'document_generate'
                              ? (darkMode ? 'bg-blue-700 border-2 border-blue-500 text-white' : 'bg-blue-600 border-2 border-blue-400 text-white')
                              : isGenerating
                              ? (darkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
                              : (darkMode ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white' : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white')
                          }`}
                        >
                          <FiFile className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
                       
                          <span className="hidden md:inline">Generate Document</span>
                          {selectedGenerationType === 'document_generate' && !isGenerating && (
                            <FiCheck className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                          )}
                          {isGenerating && selectedGenerationType === 'document_generate' && (
                            <div className="hidden sm:block animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border border-white border-t-transparent flex-shrink-0"></div>
                          )}
                        </AuthRequiredButton>
                      </div>
                    </div>
                    )}

                    {/* Message limit warning */}
                    {isMessageLimitReached && (
                      <div className={`mb-3 p-3 rounded-lg border ${darkMode ? 'bg-red-900/20 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700'}`}>
                        <div className="flex items-center space-x-2">
                          <FiMessageSquare className="w-4 h-4" />
                          <span className="text-sm font-medium">
                            You have reached the 40-message limit for this chat. Please start a new chat to continue.
                          </span>
                        </div>
                        <button
                          onClick={handleStartNewChat}
                          className={`mt-2 px-3 py-1 text-xs rounded-md ${darkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                        >
                          Start New Chat
                        </button>
                      </div>
                    )}
                    
                    {/* Processing Status Indicator */}
                    {processingStatus?.isProcessing && (
                      <div className={`mb-2 p-3 rounded-lg border-l-4 border-blue-500 ${darkMode ? 'bg-blue-900/20 border-blue-400' : 'bg-blue-50 border-blue-500'}`}>
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                          <span className={`text-sm font-medium ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                            Processing {processingStatus?.fileName}
                          </span>
                        </div>
                        <div className={`mt-2 text-xs ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                          Page {processingStatus?.currentPage} of {processingStatus?.totalPages}
                        </div>
                        <div className={`mt-1 w-full bg-gray-200 rounded-full h-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${((processingStatus?.currentPage || 0) / (processingStatus?.totalPages || 1)) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    {selectedFile && (
                      <div className={`mb-2 p-2 rounded-lg flex items-center space-x-2 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <FiFile className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} w-4 h-4`} />
                        <span className="text-xs sm:text-sm truncate flex-1">{selectedFile.name}</span>
                        <AuthRequiredButton 
                          onClick={() => setSelectedFile(null)}
                          className={`p-1 rounded-full ${darkMode ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}
                        >
                          <FiX size={14} className="sm:w-4 sm:h-4" />
                        </AuthRequiredButton>
                      </div>
                    )}
                    
                    {uploadedFiles.length > 0 && (
                      <div className={`mb-2 p-2 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <div className="flex items-center space-x-2 mb-2">
                          <FiUpload className={`${darkMode ? 'text-gray-300' : 'text-gray-600'} w-4 h-4`} />
                          <span className="text-xs sm:text-sm font-medium">{uploadedFiles.length} file(s) attached</span>
                        </div>
                        <div className="space-y-1">
                          {uploadedFiles.map((file, index) => (
                            <div key={index} className="flex items-center space-x-2">
                               {file.fileType === 'image' ? (
                                 <FiImage className={`${darkMode ? 'text-blue-400' : 'text-blue-600'} w-3 h-3`} />
                               ) : (
                                 <FiFileText className={`${darkMode ? 'text-green-400' : 'text-green-600'} w-3 h-3`} />
                               )}
                               <span className="text-xs truncate flex-1">{file.originalName}</span>
                              <AuthRequiredButton 
                                onClick={() => {
                                  const newFiles = uploadedFiles.filter((_, i) => i !== index);
                                  setUploadedFiles(newFiles);
                                }}
                                className={`p-0.5 rounded-full ${darkMode ? 'hover:bg-gray-600 text-gray-400' : 'hover:bg-gray-200 text-gray-500'}`}
                              >
                                <FiX size={12} />
                              </AuthRequiredButton>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {pendingPdfFile && (
                      <div className={`mb-2 p-2 rounded-lg border-2 border-dashed ${darkMode ? 'bg-indigo-900/20 border-indigo-500/50' : 'bg-indigo-50 border-indigo-300'}`}>
                        <div className="flex items-center space-x-2 mb-2">
                          <FiFileText className={`${darkMode ? 'text-indigo-400' : 'text-indigo-600'} w-4 h-4`} />
                          <span className="text-xs sm:text-sm font-medium text-indigo-600 dark:text-indigo-400">PDF ready for analysis</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FiFileText className={`${darkMode ? 'text-indigo-400' : 'text-indigo-600'} w-3 h-3`} />
                          <span className="text-xs truncate flex-1">{pendingPdfFile.pdfVisionData?.original_filename}</span>
                          <span className="text-xs text-indigo-600 dark:text-indigo-400">
                            {pendingPdfFile.pdfVisionData?.page_count} pages
                          </span>
                          <AuthRequiredButton 
                            onClick={() => setPendingPdfFile(null)}
                            className={`p-0.5 rounded-full ${darkMode ? 'hover:bg-indigo-800 text-indigo-400' : 'hover:bg-indigo-200 text-indigo-600'}`}
                          >
                            <FiX size={12} />
                          </AuthRequiredButton>
                        </div>
                        <div className="mt-1 text-xs text-indigo-600 dark:text-indigo-400">
                          Type your message to analyze this PDF
                        </div>
                      </div>
                    )}

                    

                    <div className={`flex flex-col rounded-lg sm:rounded-xl ${darkMode ? 'bg-black/40 sm:border-gray-600 backdrop-blur-sm' : 'bg-white/80 sm:border sm:border-gray-300 backdrop-blur-sm'} focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 ${isMessageLimitReached ? 'opacity-50' : ''}`}>
                      <textarea
                        ref={textareaRef}
                        value={inputMessage}
                        onChange={(e) => {
                          console.log('🔍 DEBUG: Input changed to:', e.target.value);
                          const inputValue = e.target.value;
                          const currentWordCount = countWords(inputValue);
                          
                          if (currentWordCount > MAX_WORDS) {
                            // Auto-truncate to preserve only first 5000 words
                            const truncatedText = truncateToWordLimit(inputValue, MAX_WORDS);
                            setInputMessage(truncatedText);
                            setWordCount(MAX_WORDS);
                            setShowWordWarning(true);
                            // Show popup notification
                            showWarning('Chat input limit reached. Text has been truncated to 5000 words.');
                          } else {
                            setInputMessage(inputValue);
                            setWordCount(currentWordCount);
                            setShowWordWarning(false);
                          }
                        }}
                        onKeyDown={handleKeyDown}
                        onFocus={() => {
                          setShowGenerationButtons(true);
                        }}
                        onBlur={(e) => {
                          if (interactingWithGenerationButtonsRef.current) return;
                          if (!selectedGenerationType) {
                            setShowGenerationButtons(messages.length === 0);
                          }
                        }}
                        placeholder={
                          isMessageLimitReached
                            ? 'Message limit reached. Start a new chat to continue.'
                            : selectedGenerationType === 'image_generate'
                            ? 'Describe your image'
                            : selectedGenerationType === 'sheet_generate'
                            ? 'Describe your spreadsheet'
                            : selectedGenerationType === 'document_generate'
                            ? 'Describe your document'
                            : t('chat.askAnything') || 'Ask Anything'
                        }
                        rows={1}
                        disabled={isMessageLimitReached}
                        className={`w-full py-2 sm:py-4 px-2 sm:px-4 bg-transparent focus:outline-none resize-none max-h-[200px] text-sm sm:text-base ${darkMode ? 'text-white placeholder-gray-400' : 'text-gray-700 placeholder-gray-400'} ${isMessageLimitReached ? 'cursor-not-allowed' : ''}`}
                      />
                      <div className="flex flex-nowrap items-center justify-between w-full px-2 pb-2 gap-x-2 overflow-x-auto">
                        <input 
                          type="file"
                          ref={fileInputRef}
                          className="hidden"
                          onChange={handleFileChange}
                          accept="image/*,.pdf,.doc,.docx"
                        />
                        {/* Left controls: group Search and Attachment closely */}
                        <div className="flex-none flex items-center space-x-1">
                          {!isSearchActive && (
                            <AuthRequiredButton 
                              onClick={() => setIsFileUploadPopupOpen(true)}
                              className={`flex-none p-1.5 sm:p-2 rounded-full ${darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}
                              aria-label="Attach files"
                            >
                              <FiFile className="w-4 h-4 sm:w-5 sm:h-5" />
                            </AuthRequiredButton>
                          )}

                          {!(selectedFile || uploadedFiles.length > 0 || currentUploadedFile || pendingPdfFile) && (
                            <AuthRequiredButton
                              onClick={() => {
                                setIsSearchActive(prev => {
                                  const next = !prev;
                                  setIsSearchQueued(next);
                                  nextMessageTypeRef.current = next ? 'search' : null;
                                  return next;
                                });
                              }}
                              disabled={false}
                              className={`inline-flex flex-none items-center px-2 py-1 text-xs sm:px-3 sm:py-2 sm:text-sm rounded-full transition-colors ${
                                isSearchActive
                                  ? (darkMode
                                      ? 'text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                                      : 'text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600')
                                  : (darkMode ? 'text-gray-300 bg-gray-800/40 hover:bg-gray-700/50 border border-gray-700' : 'text-gray-800 bg-white hover:bg-gray-50 border border-gray-300')
                              }`}
                              aria-label="Search"
                              title="Search"
                            >
                              <FiGlobe className="w-4 h-4 sm:w-5 sm:h-5" />
                              <span className="ml-1 hidden sm:inline text-xs">{t('transcription.chat.search') || 'Search'}</span>
                            </AuthRequiredButton>
                          )}
                        </div>
                        <div className="flex-none flex items-center space-x-1">
                          <div className="relative">
                            <AuthRequiredButton
                              onClick={isStreaming ? pauseStreaming : handleSendMessage}
                              disabled={(!isStreaming && ((!inputMessage.trim() && !selectedFile && !selectedGenerationType && uploadedFiles.length === 0) || isMessageLimitReached || isSending))}
                              className={`p-1 sm:p-2 rounded-full flex items-center justify-center min-w-[36px] ${
                                  isStreaming
                                    ? (darkMode ? 'text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800' : 'text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700')
                                    : (!inputMessage.trim() && !selectedFile && !selectedGenerationType && uploadedFiles.length === 0) || isMessageLimitReached
                                    ? (darkMode ? 'text-gray-500 bg-gray-800' : 'text-gray-400 bg-gray-100') 
                                    : (darkMode ? 'text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' : 'text-white bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600')
                                }`}
                              aria-label={isStreaming ? 'Pause streaming' : t('chat.sendMessage')}
                            >
                              {isStreaming ? (
                                <FiSquare className="w-4 h-4 sm:w-5 sm:h-5" />
                              ) : (
                                <FiSend className="w-4 h-4 sm:w-5 sm:h-5" />
                              )}
                              {!isStreaming && !isMessageLimitReached && (((inputMessage.trim() || selectedFile || selectedGenerationType || uploadedFiles.length > 0)) || isSearchActive) && (
                                <span className="ml-1 text-xs bg-indigo-500/20 px-1.5 py-0.5 rounded-full flex items-center">
                                  -{isSearchActive ? 2 : calculateCoinCost()}
                                  <img src={coinIcon} alt="coin" className="w-3 h-3 ml-1" />
                                </span>
                              )}
                            </AuthRequiredButton>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Hidden Word Counter - Only show warning when limit is reached */}
                    {showWordWarning && wordCount >= MAX_WORDS && (
                      <div className="flex items-center justify-end mt-2 px-1">
                        <div className={`text-xs flex items-center space-x-1 ${
                          darkMode ? 'text-red-400' : 'text-red-600'
                        }`}>
                          <FiAlertCircle className="w-3 h-3" />
                          <span>Chat input limit reached</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
    <LinkCitationsPanel
      links={citationsLinks}
      open={citationsOpen}
      onClose={() => setCitationsOpen(false)}
      darkMode={darkMode}
    />

    {isChargeModalOpen && (
      <ChargeModal
        isOpen={isChargeModalOpen}
        onClose={() => setIsChargeModalOpen(false)}
        currentCoins={userData?.coins || 0}
      />
    )}

    {/* File Preview Modal */}
      {isFilePreviewOpen && (
        <FilePreviewModal
          isOpen={isFilePreviewOpen}
          onClose={handleCloseFilePreview}
          fileUrl={previewFileUrl}
          fileName={previewFileName}
          fileType={previewFileType}
        />
      )}

      {/* File Upload Popup */}
      {isFileUploadPopupOpen && (
        <FileUploadPopup
          isOpen={isFileUploadPopupOpen}
          onClose={handleCloseFileUploadPopup}
          initialDroppedFile={initialDroppedFile || undefined}
          onFileSelect={async (uploadedFile: any, type: any) => {
            try {
              setIsFileUploadPopupOpen(false);
              setInitialDroppedFile(null);
              
              if (type === 'pdf_vision') {
                // Handle PDF Vision Understanding - File is already uploaded
                setPendingPdfFile(uploadedFile);
                showSuccess(`PDF uploaded successfully! ${uploadedFile.pdfVisionData?.page_count || 1} pages ready. Type your message and send to analyze the PDF.`);
              } else {
                // Handle regular file uploads (image/document) - File is already uploaded
                setCurrentUploadedFile(uploadedFile);
                showSuccess(`File uploaded successfully! Ready to send.`);
              }
              
            } catch (error) {
              console.error('Error handling uploaded file:', error);
              showError('Failed to process uploaded file. Please try again.');
            }
          }}
        />
      )}

      {/* Pro Feature Alert */}
      {showProAlert && (
        <ProFeatureAlert
          featureName={t('chat.title')}
          onClose={() => setShowProAlert(false)}
        />
      )}
        
        {/* Desktop Right Sidebar for Chat History */}
        <div 
          className={`hidden md:block chat-right-sidebar transition-all duration-300 ${
            isRightPanelOpen ? 'translate-x-0' : 'translate-x-full closed'
          } ${darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border-l shadow-lg`}
          style={{ width: isRightPanelOpen ? `${rightPanelWidth}px` : '0px' }}
        >
          {/* Drag handle */}
          <div 
            className={`absolute left-0 top-0 w-1 h-full cursor-col-resize hover:bg-blue-500 transition-colors duration-200 ${
              isDragging ? 'bg-blue-500' : 'bg-transparent hover:bg-blue-400'
            }`}
            onMouseDown={handleMouseDown}
          />
          
          <div className="h-full flex flex-col ml-1">
            {/* Enhanced Header */}
            <div className={`px-4 py-4 border-b ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-gray-50'} flex items-center justify-between`}>
              <div className="flex items-center space-x-3">
                {/* Logo/Icon */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${darkMode ? 'bg-blue-600' : 'bg-blue-500'}`}>
                  <FiMessageSquare className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className={`font-semibold text-lg ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    {t('chat.chatHistory')}
                  </h2>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {groupedChatHistory.today.length + groupedChatHistory.yesterday.length + groupedChatHistory.lastWeek.length + groupedChatHistory.lastMonth.length} conversations
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                {/* New Chat Button - Enhanced */}
                <AuthRequiredButton
                  onClick={handleNewChat}
                  className={`p-2.5 rounded-lg transition-all duration-200 ${
                    darkMode 
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg'
                  } transform hover:scale-105`}
                  title={t('chat.newChat')}
                >
                  <FiPlus className="w-4 h-4" />
                </AuthRequiredButton>
                
                {/* Toggle Panel Button */}
                <AuthRequiredButton
                  onClick={toggleRightPanel}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    darkMode 
                      ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-200' 
                      : 'hover:bg-gray-200 text-gray-600 hover:text-gray-800'
                  }`}
                  title={t('chat.togglePanel')}
                >
                  <FiX className="w-4 h-4" />
                </AuthRequiredButton>
              </div>
            </div>
            <div
              key={`desktop-chat-history-${chatHistoryRefreshKey}`}
              ref={desktopChatHistoryRef}
              onScroll={handleChatHistoryScroll}
              className={`flex-1 overflow-y-auto py-4 ${darkMode ? 'bg-gray-900' : 'bg-white'} custom-scrollbar`}
            >
              {isLoadingChats ? (
                <ChatHistorySkeleton />
              ) : (
                <>
                  {/* Today */}
                  {groupedChatHistory.today.length > 0 && (
                    <div className="mb-6">
                      <div className={`flex items-center gap-3 px-4 py-3 mb-3 ${darkMode ? 'bg-gray-800/30' : 'bg-gray-100/50'} rounded-lg mx-2`}>
                        <div className={`w-2 h-2 rounded-full ${darkMode ? 'bg-green-500' : 'bg-green-600'}`} />
                        <h4 className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'} tracking-wide`}>
                          {t('chat.today')}
                        </h4>
                        <div className={`ml-auto text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                          {groupedChatHistory.today.length}
                        </div>
                      </div>
                      {groupedChatHistory.today.map(chat => renderChatHistoryItem(chat, t('chat.today')))}
                    </div>
                  )}
                  
                  {/* Yesterday */}
                  {groupedChatHistory.yesterday.length > 0 && (
                    <div className="mb-6">
                      <div className={`flex items-center gap-3 px-4 py-3 mb-3 ${darkMode ? 'bg-gray-800/30' : 'bg-gray-100/50'} rounded-lg mx-2`}>
                        <div className={`w-2 h-2 rounded-full ${darkMode ? 'bg-yellow-500' : 'bg-yellow-600'}`} />
                        <h4 className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'} tracking-wide`}>
                          {t('chat.yesterday')}
                        </h4>
                        <div className={`ml-auto text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                          {groupedChatHistory.yesterday.length}
                        </div>
                      </div>
                      {groupedChatHistory.yesterday.map(chat => renderChatHistoryItem(chat, t('chat.yesterday')))}
                    </div>
                  )}
                  
                  {/* Last Week */}
                  {groupedChatHistory.lastWeek.length > 0 && (
                    <div className="mb-6">
                      <div className={`flex items-center gap-3 px-4 py-3 mb-3 ${darkMode ? 'bg-gray-800/30' : 'bg-gray-100/50'} rounded-lg mx-2`}>
                        <div className={`w-2 h-2 rounded-full ${darkMode ? 'bg-blue-500' : 'bg-blue-600'}`} />
                        <h4 className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'} tracking-wide`}>
                          {t('chat.lastWeek')}
                        </h4>
                        <div className={`ml-auto text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                          {groupedChatHistory.lastWeek.length}
                        </div>
                      </div>
                      {groupedChatHistory.lastWeek.map(chat => renderChatHistoryItem(chat, t('chat.lastWeek')))}
                    </div>
                  )}
                  
                  {/* Last Month */}
                  {groupedChatHistory.lastMonth.length > 0 && (
                    <div className="mb-6">
                      <div className={`flex items-center gap-3 px-4 py-3 mb-3 ${darkMode ? 'bg-gray-800/30' : 'bg-gray-100/50'} rounded-lg mx-2`}>
                        <div className={`w-2 h-2 rounded-full ${darkMode ? 'bg-purple-500' : 'bg-purple-600'}`} />
                        <h4 className={`text-sm font-semibold ${darkMode ? 'text-gray-200' : 'text-gray-800'} tracking-wide`}>
                          {t('chat.lastMonth')}
                        </h4>
                        <div className={`ml-auto text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                          {groupedChatHistory.lastMonth.length}
                        </div>
                      </div>
                      {groupedChatHistory.lastMonth.map(chat => renderChatHistoryItem(chat, t('chat.lastMonth')))}
                    </div>
                  )}
                  
                  {/* Empty state */}
                  {groupedChatHistory.today.length === 0 && 
                   groupedChatHistory.yesterday.length === 0 && 
                   groupedChatHistory.lastWeek.length === 0 && 
                  groupedChatHistory.lastMonth.length === 0 && (
                    <div className={`text-center py-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {t('chat.noHistory') || 'No chat history'}
                    </div>
                  )}
                  </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default ChatPage;
