import React, { useState, useRef, useEffect } from 'react';
import { FaArrowUp, FaChevronRight, FaChevronLeft, FaRegEdit, FaHistory, FaImage, FaFileAlt, FaTimes, FaCopy, FaFilePdf, FaExpand, FaDownload } from 'react-icons/fa';
import SidebarLeft from '../components/dashboard/SidebarLeft';
import { supabase } from '../utils/supabase';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../utils/AuthContext';
import * as pdfjsLib from 'pdfjs-dist';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from 'jspdf';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css'; // Ensure katex CSS is imported for math rendering
import coinIcon from '../assets/assets_coin.png';
import { useLanguage } from '../utils/LanguageContext';
import { useResponseCheck, ResponseUpgradeModal } from '../utils/responseChecker';

// Type definitions for PDF.js
interface PDFPageProxy {
  getViewport(params: { scale: number }): any;
  render(renderContext: any): { promise: Promise<void> };
}

interface PDFDocumentProxy {
  numPages: number;
  getPage(pageNumber: number): Promise<PDFPageProxy>;
}

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  try {
    // Force specific version to match the installed package or what's loaded
    // We'll use the version property from the library itself to ensure consistency
    const pdfVersion = pdfjsLib.version;
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfVersion}/build/pdf.worker.min.mjs`;
  } catch (error) {
    console.error('Failed to load PDF worker:', error);
    // Fallback to a hardcoded recent version if version detection fails, but this is risky
    // Better to rely on the dynamic version
  }
}

const sanitizeFileName = (name: string) => {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
};

interface Message {
  id: string;
  type: 'user' | 'ai';
  content: string;
  attachment?: {
    name: string;
    type: string;
    url?: string;
  };
  subject?: string;
  timestamp: Date;
}

interface DBChat {
  id: string;
  owner: string | null;
  title: string | null;
  created_at: string;
  metadata: any;
  service_type?: string;
}

interface DBMessage {
  id: string;
  chat_id: string;
  position: number;
  content: string;
  status: string;
  created_by: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
}

const SolvePage: React.FC = () => {
  const { t } = useLanguage();
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsLeftSidebarOpen(false);
      } else {
        setIsLeftSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const subjects = [
    { id: 'Psychology', label: t('solvePage.subjects.psychology') },
    { id: 'Physics', label: t('solvePage.subjects.physics') },
    { id: 'Biology', label: t('solvePage.subjects.biology') },
    { id: 'Math', label: t('solvePage.subjects.math') },
    { id: 'General', label: t('solvePage.subjects.general') },
    { id: 'Chemistry', label: t('solvePage.subjects.chemistry') },
    { id: 'Language', label: t('solvePage.subjects.language') },
    { id: 'History', label: t('solvePage.subjects.history') },
    { id: 'Economics', label: t('solvePage.subjects.economics') }
  ];
  const [selectedSubject, setSelectedSubject] = useState('General');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<any>(null);

  const PDFThumbnail = ({ url }: { url: string }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const renderThumb = async () => {
        if (!url) return;
        try {
          const loadingTask = pdfjsLib.getDocument(url);
          const pdf = await loadingTask.promise;
          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: 0.5 });
          const canvas = canvasRef.current;
          if (canvas) {
            const context = canvas.getContext('2d');
            if (context) {
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                const renderContext: any = { canvasContext: context, viewport };
                await page.render(renderContext).promise;
            }
          }
          setLoading(false);
        } catch (e) {
          console.error("Error rendering PDF thumbnail:", e);
          setLoading(false);
        }
      };
      renderThumb();
    }, [url]);

    return (
       <div className="w-full h-full flex items-center justify-center bg-gray-100 overflow-hidden relative">
          <canvas ref={canvasRef} className="w-full h-full object-cover" />
          {loading && <div className="absolute inset-0 flex items-center justify-center bg-black/10"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>}
       </div>
    );
  };

  const [chatStarted, setChatStarted] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [chatId, setChatId] = useState<string>('');
  const [isProcessing, setIsProcessingStarted] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [history, setHistory] = useState<DBChat[]>([]);
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const ITEMS_PER_PAGE = 10;
  const { checkAndUseResponse } = useResponseCheck();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');
  const [upgradeCtaType, setUpgradeCtaType] = useState<'coins' | 'subscription'>('subscription');
  
  const { user } = useAuth();
  
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const subjectsContainerRef = useRef<HTMLDivElement>(null);
  const subjectRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialInputRef = useRef<HTMLTextAreaElement>(null);
  const followUpInputRef = useRef<HTMLTextAreaElement>(null);

  const resizeInputTextarea = (textarea: HTMLTextAreaElement | null) => {
    if (!textarea) return;
    const computedStyle = window.getComputedStyle(textarea);
    const lineHeight = parseFloat(computedStyle.lineHeight) || 24;
    const verticalPadding =
      (parseFloat(computedStyle.paddingTop) || 0) +
      (parseFloat(computedStyle.paddingBottom) || 0);
    const baseHeight = Number(textarea.dataset.baseHeight || textarea.offsetHeight);
    const twoLineHeight = lineHeight * 2 + verticalPadding;
    const maxHeight = lineHeight * 4 + verticalPadding;
    if (!textarea.dataset.baseHeight) {
      textarea.dataset.baseHeight = `${baseHeight}`;
    }

    textarea.style.height = 'auto';
    const nextHeight =
      textarea.scrollHeight <= twoLineHeight
        ? baseHeight
        : Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
  };

  useEffect(() => {
    resizeInputTextarea(initialInputRef.current);
    resizeInputTextarea(followUpInputRef.current);
  }, [inputValue, chatStarted]);

  const fetchChatHistory = async (pageNumber = 0, isLoadMore = false) => {
    if (!user) return;
    if (isLoadMore) setLoadingMore(true);

    const from = pageNumber * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data, error } = await supabase
      .from('solve_chats')
      .select('*')
      .eq('owner', user.id)
      .eq('service_type', 'solve')
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) {
      console.error('Error fetching history:', error);
    } else if (data) {
      if (isLoadMore) {
        setHistory(prev => [...prev, ...data]);
      } else {
        setHistory(data);
      }

      if (data.length < ITEMS_PER_PAGE) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    }
    
    if (isLoadMore) setLoadingMore(false);
  };

  useEffect(() => {
    setPage(0);
    fetchChatHistory(0, false);
  }, [user]);

  const loadChat = async (chat: DBChat) => {
    setChatId(chat.id);
    setChatStarted(true);
    if (chat.metadata?.subject) {
      setSelectedSubject(chat.metadata.subject);
    }
    
    const { data, error } = await supabase
      .from('solve_messages')
      .select('*')
      .eq('chat_id', chat.id)
      .order('created_at', { ascending: true });

    if (data) {
      const formattedMessages: Message[] = data.map(m => ({
        id: m.id,
        type: m.created_by ? 'user' : 'ai',
        content: m.content,
        timestamp: new Date(m.created_at),
        attachment: m.file_url ? {
          name: m.file_name || t('solvePage.attachment'),
          type: m.file_type || 'unknown',
          url: m.file_url
        } : undefined,
        subject: m.created_by ? undefined : chat.metadata?.subject
      }));
      setMessages(formattedMessages);
    }
    
    setIsHistoryOpen(false);
  };

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      const { scrollHeight, clientHeight } = messagesContainerRef.current;
      messagesContainerRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, chatStarted]);

  // Auto-center selected subject
  useEffect(() => {
    const selectedBtn = subjectRefs.current[selectedSubject];
    if (selectedBtn) {
      selectedBtn.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest'
      });
    }
  }, [selectedSubject]);

  const handleScrollSubject = (direction: 'left' | 'right') => {
    if (subjectsContainerRef.current) {
      const scrollAmount = 200;
      subjectsContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleNewChat = () => {
    setChatStarted(false);
    setMessages([]);
    setInputValue('');
    setSelectedSubject('General');
    setAttachedFile(null);
    setChatId(uuidv4());
  };

  useEffect(() => {
    // Initialize chat ID on mount
    setChatId(uuidv4());
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const responseCheck = await checkAndUseResponse({
        responseType: 'solve_upload_access',
        queryData: { type: 'file_upload' },
        consumeCredits: false
      });
      if (!responseCheck.canProceed) {
        if (responseCheck.showUpgradeModal) {
          setUpgradeMessage(responseCheck.message || 'You need an active subscription or coins to upload files.');
          setUpgradeCtaType(responseCheck.ctaType || 'subscription');
          setShowUpgradeModal(true);
        }
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      const file = e.target.files[0];
      const allowedTypes = [
        'image/jpeg', 
        'image/png', 
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv'
      ];
      
      // Check if file type is allowed (either exact match or starts with image/ for other image types)
      const isAllowed = allowedTypes.includes(file.type) || (file.type.startsWith('image/') && file.type !== 'image/gif');
      
      if (isAllowed) {
        setAttachedFile(file);
        
        // Calculate PDF pages if needed
        if (file.type === 'application/pdf') {
          try {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({
              data: arrayBuffer,
              useWorkerFetch: false,
              isEvalSupported: false,
              useSystemFonts: true
            });
            const pdf = await loadingTask.promise;
            setPdfPageCount(pdf.numPages);
          } catch (error) {
            console.error('Error counting PDF pages:', error);
            setPdfPageCount(0);
          }
        } else {
          setPdfPageCount(0);
        }
      } else {
        alert(t('solvePage.invalidFileType'));
        // Reset input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  // Helper to upload file to Supabase
  const uploadToSupabase = async (file: File | Blob, fileName: string): Promise<string | null> => {
    try {
      setProcessingStatus(t('solvePage.uploadingFile'));
      // Use chat-attachments bucket
      const sanitizedFileName = sanitizeFileName(fileName);
      const filePath = `${user?.id || 'anonymous'}/${Date.now()}_${sanitizedFileName}`;
      const { data, error } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file);

      if (error) {
        console.error('Supabase upload error:', error);
        return null;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Upload to Supabase failed:', error);
      return null;
    }
  };

  // Convert PDF to images using PDF.js
  const convertPdfToImages = async (file: File): Promise<string[]> => {
    try {
      setProcessingStatus(t('solvePage.processingPdf'));
      
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
      
      setProcessingStatus(t('solvePage.convertingPagesToImages', { values: { pages: pdf.numPages } }));
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        setProcessingStatus(t('solvePage.convertingPage', { values: { page: pageNum, total: pdf.numPages } }));
        
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
      
      setProcessingStatus(t('solvePage.pdfConversionCompleted'));
      return images;
    } catch (error) {
      console.error('PDF URL conversion error:', error);
      setProcessingStatus(t('solvePage.errorConvertingPdf'));
      throw error;
    }
  };

  // Helper to upload base64 images to Supabase
  const uploadBase64Images = async (base64Images: string[]): Promise<string[]> => {
    const urls: string[] = [];
    for (let i = 0; i < base64Images.length; i++) {
      const base64 = base64Images[i];
      const res = await fetch(base64);
      const blob = await res.blob();
      const fileName = `page_${i + 1}_${Date.now()}.jpg`;
      const url = await uploadToSupabase(blob, fileName);
      if (url) urls.push(url);
    }
    return urls;
  };

  const preprocessMath = (content: string) => {
    if (!content) return '';
    // Replace \[ ... \] with $$ ... $$ for block math
    let processed = content.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$');
    // Replace \( ... \) with $ ... $ for inline math
    processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');
    return processed;
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleExportPDF = (content: string) => {
    const doc = new jsPDF();
    const splitText = doc.splitTextToSize(content, 180);
    doc.text(splitText, 10, 10);
    doc.save(t('solvePage.solutionFileName'));
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() && !attachedFile) return;
    const responseCheck = await checkAndUseResponse({
      responseType: 'solve',
      queryData: {
        message: inputValue,
        subject: selectedSubject,
        hasAttachment: !!attachedFile
      },
      requireCoins: true,
      noCoinsMessage: 'Please buy more coins to continue.'
    });
    if (!responseCheck.canProceed) {
      if (responseCheck.showUpgradeModal) {
        setUpgradeMessage(responseCheck.message || 'You need an active subscription or coins to continue.');
        setUpgradeCtaType(responseCheck.ctaType || 'subscription');
        setShowUpgradeModal(true);
      }
      return;
    }

    if (!chatStarted) {
      setChatStarted(true);
    }

    const currentChatId = chatId || uuidv4();
    if (!chatId) setChatId(currentChatId);

    const newUserMsg: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
      attachment: attachedFile ? {
        name: attachedFile.name,
        type: attachedFile.type,
        url: URL.createObjectURL(attachedFile)
      } : undefined
    };

    // Create a placeholder for AI response immediately
    const newAiMsgId = uuidv4();
    const newAiMsg: Message = {
      id: newAiMsgId,
      type: 'ai',
      content: '',
      subject: selectedSubject,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newUserMsg, newAiMsg]);
    
    setInputValue('');
    setAttachedFile(null); // Clear attachment after sending
    setIsProcessingStarted(true);

      // Prepare request body
      let requestBody: any = {
        stream: true,
        messages: []
      };

      const userId = user?.id || '0a147ebe-af99-481b-bcaf-ae70c9aeb8d8'; // Use authenticated user ID or fallback
      const timestamp = new Date().toISOString().replace('T', ' ').replace('Z', ''); // Format: "2026-01-31 01:22:57.175"

      try {
        let currentFileUrl: string | undefined = undefined;

        if (attachedFile) {
          // Handle attachments
          const fileUrl = await uploadToSupabase(attachedFile, attachedFile.name);
          
          if (!fileUrl) {
            throw new Error('Failed to upload file');
          }
          currentFileUrl = fileUrl;

          if (attachedFile.type.startsWith('image/')) {
            // Image Attachment
            requestBody.uploadedFileType = 'image';
            requestBody.messages = [{
              uid: userId,
              type: "image",
              text: { body: newUserMsg.content },
              body: newUserMsg.content,
              content: newUserMsg.content,
              role: "user",
              roleDescription: "A versatile AI assistant for everyday tasks and questions",
              timestamp: timestamp,
              chatid: currentChatId,
              subject: selectedSubject,
              url: fileUrl,
              attachments: [{
                url: fileUrl,
                fileName: attachedFile.name,
                fileType: "image",
                originalName: attachedFile.name,
                size: attachedFile.size
              }]
            }];
          } else if (attachedFile.type === 'application/pdf') {
            // PDF Attachment
            const base64Images = await convertPdfToImages(attachedFile);
            const imageUrls = await uploadBase64Images(base64Images);
            // Just use the URLs directly without backticks/spaces
            const formattedImageUrls = imageUrls;

            requestBody.uploadedFileType = 'pdf_vision';
            requestBody.messages = [{
              uid: userId,
              type: "pdf_vision",
              text: { body: newUserMsg.content },
              body: newUserMsg.content,
              content: newUserMsg.content,
              role: "user",
              roleDescription: "A versatile AI assistant for everyday tasks and questions",
              timestamp: timestamp,
              chatid: currentChatId,
              subject: selectedSubject,
              url: fileUrl,
              image_urls: formattedImageUrls,
              page_count: imageUrls.length
            }];
          } else {
            // Other Documents (docx, etc.)
            requestBody.uploadedFileType = 'document';
            requestBody.messages = [{
              uid: userId,
              type: "document",
              text: { body: newUserMsg.content },
              body: newUserMsg.content,
              content: newUserMsg.content,
              role: "user",
              roleDescription: "A versatile AI assistant for everyday tasks and questions",
              timestamp: timestamp,
              chatid: currentChatId,
              subject: selectedSubject,
              url: fileUrl,
              attachments: [{
                url: fileUrl,
                fileName: attachedFile.name,
                fileType: "document",
                originalName: attachedFile.name,
                size: attachedFile.size
              }]
            }];
          }
        } else {
          // Text Only
          requestBody.uploadedFileType = 'text';
          requestBody.messages = [{
            uid: userId,
            type: "text",
            text: { body: "text" }, 
            body: newUserMsg.content,
            content: newUserMsg.content,
            transcription: newUserMsg.content,
            role: "user",
            roleDescription: "",
            timestamp: timestamp,
            chatid: currentChatId,
            subject: selectedSubject
          }];
        }

        // Persist Chat and Message to Supabase
        const chatExists = history.some(c => c.id === currentChatId);
        if (!chatExists) {
          const { error: chatError } = await supabase.from('solve_chats').insert({
            id: currentChatId,
            owner: user?.id,
            title: inputValue.substring(0, 50) || (attachedFile ? attachedFile.name : t('solvePage.newChat')),
            metadata: { subject: selectedSubject },
            service_type: 'solve'
          });
          if (!chatError) {
            fetchChatHistory();
          } else {
            console.error('Error creating chat:', chatError);
          }
        }

        const userMsgId = uuidv4();
        const { error: msgError } = await supabase.from('solve_messages').insert({
          id: userMsgId,
          chat_id: currentChatId,
          position: 0,
          content: inputValue,
          status: 'done',
          created_by: user?.id,
          file_url: currentFileUrl || null,
          file_name: attachedFile?.name || null,
          file_type: attachedFile?.type || null,
          file_size: attachedFile?.size || null
        });
        if (msgError) console.error('Error saving user message:', msgError);

        console.log('Sending request to n8n:', requestBody);

        // Send to webhook
        const response = await fetch('https://n8n.matrixaiserver.com/webhook/matrixEdu/solveQuestion', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.body) {
          throw new Error('No response body');
        }

        // Stream handling
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let aiContent = '';
        let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last partial line
        
        for (const line of lines) {
          if (!line.trim()) continue;
          
          try {
            // Try to parse the line as JSON
            const json = JSON.parse(line);
            
            // Check if it's an item with content
            if (json.type === 'item' && typeof json.content === 'string') {
              aiContent += json.content;
              
              // Update the last message with new content
              setMessages(prev => {
                const newMessages = [...prev];
                const lastMessageIndex = newMessages.findIndex(m => m.id === newAiMsgId);
                if (lastMessageIndex !== -1) {
                  newMessages[lastMessageIndex] = {
                    ...newMessages[lastMessageIndex],
                    content: aiContent
                  };
                }
                return newMessages;
              });
            }
          } catch (e) {
            console.warn('Skipping invalid JSON line in stream:', line);
          }
        }
      }

      // Save AI Message to DB
      if (aiContent) {
        const { error: aiMsgError } = await supabase.from('solve_messages').insert({
          id: newAiMsgId, // Use the same ID as in UI (though UI used Date.now().toString(), ideally should be UUID)
          // Ideally I should have used UUID for newAiMsgId too. 
          // But DB is uuid type. Date.now().toString() is NOT a valid UUID.
          // I MUST change newAiMsgId to be a UUID.
          // Wait, I can't change previous code easily without another SearchReplace.
          // I'll assume I can just use uuidv4() here and it's fine if UI ID differs from DB ID, 
          // BUT it's better if they match.
          // Let's generate a UUID for the AI message at the start.
          chat_id: currentChatId,
          position: 0,
          content: aiContent,
          status: 'done',
          created_by: null
        });
        if (aiMsgError) console.error('Error saving AI message:', aiMsgError);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      // Add error message to chat
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'ai',
        content: t('solvePage.processingErrorMessage'),
        timestamp: new Date()
      }]);
    } finally {
      setIsProcessingStarted(false);
      setProcessingStatus('');
    }
  };

  const isSendDisabled = !inputValue.trim() && !attachedFile;

  const calculateCost = () => {
    if (attachedFile) {
      if (attachedFile.type === 'application/pdf') {
        return pdfPageCount * 2;
      } else if (attachedFile.type.startsWith('image/')) {
        return 3;
      } else {
        // Documents
        return 10;
      }
    } else if (inputValue.trim()) {
      return 2;
    }
    return 0;
  };

  const cost = calculateCost();

  const handleHistoryScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50 && hasMore && !loadingMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchChatHistory(nextPage, true);
    }
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-[#111111] text-gray-900 dark:text-white flex font-sans overflow-hidden relative">
      {/* Mobile Sidebar Overlay */}
      {(isLeftSidebarOpen && isMobile) && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsLeftSidebarOpen(false)}
        />
      )}

      <SidebarLeft 
        isOpen={isLeftSidebarOpen} 
        onClose={() => setIsLeftSidebarOpen(false)}
        className="fixed inset-y-0 left-0 z-50 lg:relative lg:z-0 shadow-2xl lg:shadow-none h-full"
      />
      
      <div className="flex-1 flex relative w-full">
        <main className={`flex-1 flex flex-col relative transition-all duration-300 w-full ${isHistoryOpen ? 'mr-0' : 'mr-0'}`}>
           {/* Top Icons - Absolute Positioned */}
           <div className="absolute top-6 left-6 z-20 flex items-center gap-4">
             {(!isLeftSidebarOpen || !isMobile) && (
                <button 
                  onClick={() => setIsLeftSidebarOpen(true)} 
                  className="w-10 h-10 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center font-bold text-sm hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-sm lg:hidden"
                >
                  ME
                </button>
             )}
             <button 
               onClick={handleNewChat}
               className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
               title={t('solvePage.newChat')}
             >
                <FaRegEdit size={22} />
             </button>
           </div>
           
           <button 
             onClick={() => setIsHistoryOpen(!isHistoryOpen)}
             className={`absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors z-20 ${isHistoryOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
             title={t('solvePage.history')}
           >
              <FaHistory size={22} />
           </button>

           {/* Main Content Area */}
           {!chatStarted ? (
             /* Initial State - Left Aligned Text, Centered Layout */
             <div className="flex-1 flex flex-col items-center justify-start pt-32 p-8 w-full overflow-y-auto">
               <div className="max-w-3xl w-full flex flex-col items-center">
                   
                   {/* Header Section */}
                  <div className="w-full flex justify-center items-center mb-16 px-4">
                      <h1 className="text-4xl font-bold text-center mt-2 tracking-tight">{t('solvePage.whatDoYouWantToSolve')}</h1>
                   </div>

                   {/* Subject Pills */}
                   <div className="flex items-center justify-center gap-4 mb-12 w-full max-w-2xl relative">
                       <button onClick={() => handleScrollSubject('left')} className="text-gray-500 hover:text-gray-300 transition-colors p-1 z-10">
                           <FaChevronLeft size={12} />
                       </button>
                       
                       <div 
                        ref={subjectsContainerRef}
                        className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth px-2"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                       >
                           {subjects.map((subject) => (
                               <button 
                                 key={subject.id}
                                 ref={el => subjectRefs.current[subject.id] = el}
                                 onClick={() => setSelectedSubject(subject.id)}
                                 className={`px-5 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                                   selectedSubject === subject.id
                                    ? 'bg-gray-900 text-white dark:bg-[#27272a] dark:text-white' 
                                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                                }`}
                               >
                                  {subject.label}
                               </button>
                           ))}
                       </div>
                       
                       <button onClick={() => handleScrollSubject('right')} className="text-gray-500 hover:text-gray-300 transition-colors p-1 z-10">
                           <FaChevronRight size={12} />
                       </button>
                   </div>

                   {/* Input Area */}
                   <div className="w-full relative flex flex-col items-center">
                       
                       {/* Drag & Drop Zone */}
                      <div 
                        onClick={handleDropZoneClick}
                        className="w-[98%] bg-white dark:bg-[#111111] border border-dashed border-gray-300 dark:border-gray-800 rounded-t-3xl rounded-b-lg h-24 lg:h-32 flex flex-col items-center justify-start pt-3 lg:pt-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 hover:border-gray-400 dark:hover:border-gray-600 transition-all group z-0 mb-[-18px] lg:mb-[-45px]"
                      >
                          <input 
                           type="file" 
                           ref={fileInputRef} 
                           className="hidden" 
                           onChange={handleFileSelect}
                           accept=".jpg,.jpeg,.png,.webp,application/pdf,.doc,.docx,.txt,.xlsx,.csv"
                         />
                          <div className="mb-1 lg:mb-2 relative">
                             {attachedFile ? (
                               <FaFileAlt className="text-gray-900 dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-200 transition-colors w-4 h-4 lg:w-5 lg:h-5" />
                             ) : (
                               <FaImage className="text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors w-4 h-4 lg:w-5 lg:h-5" />
                             )}
                          </div>
                          <span className="text-[10px] lg:text-sm text-center px-4 text-gray-500 dark:text-gray-300 group-hover:text-gray-600 dark:group-hover:text-gray-200 transition-colors leading-tight">
                            {attachedFile 
                              ? t('solvePage.attachedFile', { values: { name: attachedFile.name } })
                              : t('solvePage.dragDropUpload')}
                          </span>
                      </div>
                       
                       {/* Input Box */}
                       <div className="w-full bg-white dark:bg-black/40 backdrop-blur-xl rounded-[32px] p-2 border border-blue-500 shadow-xl dark:shadow-2xl z-10 relative">
                           <div className="relative w-full">
                               <textarea 
                                ref={initialInputRef}
                                 value={inputValue}
                                 onChange={(e) => setInputValue(e.target.value)}
                                 onKeyDown={(e) => {
                                   if (e.key === 'Enter' && !e.shiftKey) {
                                     e.preventDefault();
                                     if (!isSendDisabled) handleSendMessage();
                                   }
                                 }}
                                placeholder={t('solvePage.typeYourQuestionHere')}
                                 className="w-full bg-transparent text-gray-800 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none text-lg resize-none py-4 px-4 pr-16 min-h-[64px]"
                                 rows={1}
                               />
                              <div className="absolute top-1/2 -translate-y-1/2 right-4">
                                 <button 
                                   onClick={handleSendMessage}
                                   disabled={isSendDisabled}
                                   className={`relative p-2 rounded-full transition-all duration-200 flex items-center justify-center w-8 h-8 ${
                                     isSendDisabled 
                                       ? 'bg-gray-100 dark:bg-[#27272a] text-gray-400 dark:text-gray-600 cursor-not-allowed' 
                                       : 'bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200'
                                   }`}
                                 >
                                   {!isSendDisabled && cost > 0 && (
                                     <span className="absolute -top-2 -right-2 z-10 inline-flex items-center gap-1 bg-[#ff5500] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                       -{cost}
                                       <img src={coinIcon} alt="coins" className="w-3 h-3" />
                                     </span>
                                   )}
                                   <FaArrowUp size={14} />
                                 </button>
                              </div>
                           </div>
                       </div>
                   </div>
               </div>
             </div>
           ) : (
             /* Chat State */
             <div className="flex-1 flex flex-col h-full w-full max-w-5xl mx-auto px-6 pt-20 pb-6 relative">
                
                {/* Messages Area */}
                <div 
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto pb-32 pr-2 custom-scrollbar"
                >
                  {messages.map((msg) => (
                    <div key={msg.id} className={`mb-8 flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] ${msg.type === 'user' ? 'flex flex-col items-end' : 'w-full'}`}>
                        
                        {/* Attachment (User) */}
                        {msg.type === 'user' && msg.attachment && (
                          <div 
                            className="mb-3 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 w-64 h-32 cursor-pointer hover:border-gray-300 dark:hover:border-white/30 transition-all bg-gray-100 dark:bg-[#1f1f23] relative group"
                            onClick={() => setPreviewAttachment(msg.attachment)}
                          >
                            {msg.attachment.type.startsWith('image/') && msg.attachment.url ? (
                              <>
                                <img src={msg.attachment.url} alt={t('solvePage.attachment')} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                  <FaExpand className="text-white opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all" size={24} />
                                </div>
                              </>
                            ) : msg.attachment.type === 'application/pdf' && msg.attachment.url ? (
                               <>
                                 <PDFThumbnail url={msg.attachment.url} />
                                 <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                   <FaExpand className="text-white opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all" size={24} />
                                 </div>
                               </>
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-4">
                                  <FaFileAlt className="text-blue-400" size={32} />
                                <span className="text-xs text-gray-300 font-medium truncate w-full text-center px-2">
                                  {msg.attachment.name}
                                </span>
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <FaDownload className="text-gray-400 hover:text-white" size={14} />
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Message Content */}
                        <div className={`
                          ${msg.type === 'user' 
                            ? 'bg-gray-100 dark:bg-[#27272a] text-gray-900 dark:text-white px-5 py-3 rounded-2xl rounded-tr-sm' 
                            : 'text-gray-900 dark:text-gray-200 w-full'
                          }
                        `}>
                          {msg.type === 'ai' && msg.subject && (
                             <span className="inline-block bg-[#ff5500] text-white text-xs font-bold px-2 py-0.5 rounded mb-3">
                               {msg.subject.toUpperCase()}
                             </span>
                          )}
                          
                          {msg.type === 'ai' ? (
                            <div className="w-full">
                              {!msg.content && isProcessing && msg.id === messages[messages.length-1].id ? (
                                <div className="flex space-x-2 items-center h-6 px-2">
                                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                              ) : (
                                <>
                                <div className="prose dark:prose-invert max-w-none text-gray-900 dark:text-gray-200 text-left">
                                    <ReactMarkdown 
                                      remarkPlugins={[remarkGfm, remarkMath]}
                                      rehypePlugins={[rehypeRaw, rehypeKatex]}
                                      components={{
                                        h1: ({node, ...props}) => <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 mt-6 border-b border-gray-200 dark:border-gray-700 pb-2" {...props} />,
                                        h2: ({node, ...props}) => <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-3 mt-8 border-b border-gray-200 dark:border-gray-800 pb-2" {...props} />,
                                        h3: ({node, ...props}) => <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-2 mt-6" {...props} />,
                                        p: ({node, ...props}) => <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6 text-lg" {...props} />,
                                        ul: ({node, ...props}) => <ul className="list-disc pl-6 space-y-3 text-gray-600 dark:text-gray-300 my-4" {...props} />,
                                        ol: ({node, ...props}) => <ol className="list-decimal pl-6 space-y-3 text-gray-600 dark:text-gray-300 my-4" {...props} />,
                                        li: ({node, ...props}) => <li className="pl-1" {...props} />,
                                        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-indigo-500 pl-4 italic text-gray-600 dark:text-gray-400 my-6 bg-gray-50 dark:bg-white/5 p-4 rounded-r" {...props} />,
                                        hr: ({node, ...props}) => <hr className="border-gray-200 dark:border-gray-700 my-8" {...props} />,
                                        strong: ({node, ...props}) => <strong className="font-bold text-gray-900 dark:text-white" {...props} />,
                                        em: ({node, ...props}) => <em className="italic text-gray-700 dark:text-gray-200" {...props} />,
                                        table: ({node, ...props}) => <div className="overflow-x-auto my-8"><table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg" {...props} /></div>,
                                        thead: ({node, ...props}) => <thead className="bg-gray-50 dark:bg-gray-800" {...props} />,
                                        th: ({node, ...props}) => <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700" {...props} />,
                                        td: ({node, ...props}) => <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700" {...props} />,
                                        a: ({node, ...props}) => <a className="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 underline" {...props} />,
                                        code: ({node, className, children, ...props}) => {
                                            const match = /language-(\w+)/.exec(className || '');
                                            return !match ? (
                                                <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm text-indigo-600 dark:text-indigo-300" {...props}>
                                                    {children}
                                                </code>
                                            ) : (
                                                <code className={className} {...props}>
                                                    {children}
                                                </code>
                                            );
                                        }
                                      }}
                                    >
                                      {preprocessMath(msg.content)}
                                    </ReactMarkdown>
                                  </div>
                                  
                                  {/* AI Toolbar */}
                                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/5">
                                    <button 
                                      onClick={() => handleCopy(msg.content)}
                                      className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors"
                                      title={t('solvePage.copyToClipboard')}
                                    >
                                      <FaCopy /> {t('solvePage.copy')}
                                    </button>
                                    <button 
                                      onClick={() => handleExportPDF(msg.content)}
                                      className="flex items-center gap-2 text-xs text-gray-500 hover:text-white transition-colors"
                                      title={t('solvePage.exportAsPdf')}
                                    >
                                      <FaFilePdf /> {t('solvePage.exportPdf')}
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ) : (
                            <div className="whitespace-pre-wrap leading-relaxed">
                              {msg.content}
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  ))}
                </div>

                {/* Bottom Input Area (Sticky) */}
                <div className="absolute bottom-6 left-6 right-6 bg-white/80 dark:bg-black/40 backdrop-blur-xl rounded-[32px] p-2 border border-blue-500 shadow-2xl z-20">
                     <div className="relative w-full">
                         <textarea 
                          ref={followUpInputRef}
                           value={inputValue}
                           onChange={(e) => setInputValue(e.target.value)}
                           onKeyDown={(e) => {
                             if (e.key === 'Enter' && !e.shiftKey) {
                               e.preventDefault();
                               if (!isSendDisabled) handleSendMessage();
                             }
                           }}
                           placeholder={t('solvePage.askFollowUpQuestion')}
                          className="w-full bg-transparent text-gray-800 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none text-lg resize-none py-3 px-4 pr-16 min-h-[56px]"
                           rows={1}
                         />
                        <div className="absolute top-1/2 -translate-y-1/2 right-4">
                           <button 
                             onClick={handleSendMessage}
                             disabled={isSendDisabled}
                             className={`relative p-2 rounded-full transition-all duration-200 flex items-center justify-center w-8 h-8 ${
                               isSendDisabled 
                                 ? 'bg-[#27272a] text-gray-600 cursor-not-allowed' 
                                 : 'bg-white text-black hover:bg-gray-200'
                             }`}
                           >
                             {!isSendDisabled && cost > 0 && (
                               <span className="absolute -top-2 -right-2 z-10 inline-flex items-center gap-1 bg-[#ff5500] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                 -{cost}
                                 <img src={coinIcon} alt="coins" className="w-3 h-3" />
                               </span>
                             )}
                             <FaArrowUp size={14} />
                           </button>
                        </div>
                     </div>
                </div>

             </div>
           )}
        {/* Preview Modal */}
      {previewAttachment && (
        <div className="fixed inset-0 bg-black/90 z-[60] flex flex-col items-center justify-center p-4" onClick={() => setPreviewAttachment(null)}>
          <button onClick={() => setPreviewAttachment(null)} className="absolute top-4 right-4 text-white/70 hover:text-white p-2 z-50">
             <FaTimes size={24} />
          </button>
          
          <div className="w-full h-full max-w-6xl max-h-[90vh] flex items-center justify-center relative" onClick={e => e.stopPropagation()}>
             {previewAttachment.type.startsWith('image/') && previewAttachment.url ? (
                <img src={previewAttachment.url} alt={previewAttachment.name} className="max-w-full max-h-full object-contain" />
             ) : previewAttachment.type === 'application/pdf' && previewAttachment.url ? (
                <iframe src={previewAttachment.url} className="w-full h-full rounded-lg bg-white" title={previewAttachment.name}></iframe>
             ) : (
                <div className="text-white text-center">
                   <FaFileAlt size={64} className="mx-auto mb-4 text-gray-400" />
                   <p className="text-xl font-medium">{previewAttachment.name}</p>
                   {previewAttachment.url && (
                       <a href={previewAttachment.url} target="_blank" rel="noopener noreferrer" className="inline-block mt-4 bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-gray-200 transition-colors">
                          {t('solvePage.downloadFile')}
                       </a>
                   )}
                </div>
             )}
          </div>
        </div>
      )}
      </main>

        {/* History Sidebar - Right */}
      <div 
        className={`
          fixed top-0 right-0 h-full w-80 bg-white dark:bg-[#0c0c0c] border-l border-gray-200 dark:border-white/5 transform transition-transform duration-300 ease-in-out z-30
          ${isHistoryOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('solvePage.solveHistory')}</h2>
            <button 
              onClick={() => setIsHistoryOpen(false)}
              className="text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <div className="flex items-center text-sm font-medium">
                 <span className="mr-1 text-lg">»</span> 
              </div>
            </button>
          </div>

          <div 
            className="flex-1 overflow-y-auto"
            onScroll={handleHistoryScroll}
          >
            {history.map(item => (
               <div key={item.id} onClick={() => loadChat(item)} className="group cursor-pointer mb-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-white/5">
                  <div className="flex gap-3">
                     <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-md overflow-hidden flex-shrink-0">
                       <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-600">
                           <FaImage />
                       </div>
                     </div>
                     <div className="flex-1 min-w-0">
                       <div className="flex items-center justify-between mb-1">
                         <span className="text-[#ff5500] text-[10px] font-bold uppercase tracking-wider">{item.metadata?.subject || t('solvePage.subjects.general')}</span>
                          <span className="text-gray-500 dark:text-gray-600 text-[10px]">{new Date(item.created_at).toLocaleDateString()}</span>
                       </div>
                       <h3 className="text-gray-900 dark:text-gray-200 text-sm font-medium truncate mb-1">{item.title || t('solvePage.untitledChat')}</h3>
                       <p className="text-gray-500 text-xs truncate">{t('solvePage.viewConversation')}</p>
                     </div>
                  </div>
               </div>
            ))}
            
            {loadingMore && (
              <div className="flex justify-center mt-2 mb-2">
                 <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>
      </div>
      <ResponseUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        message={upgradeMessage}
        ctaType={upgradeCtaType}
      />
      </div>
    </div>
  );
};

export default SolvePage;
