import React, { useState, useRef, useEffect } from 'react';
import { FaUpload, FaFileAlt, FaChevronRight, FaArrowUp, FaExpand, FaDownload, FaFilePdf, FaCopy, FaRegEdit, FaHistory, FaTimes } from 'react-icons/fa';
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
import 'katex/dist/katex.min.css';
import coinIcon from '../assets/assets_coin.png';

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
    const pdfVersion = pdfjsLib.version;
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfVersion}/build/pdf.worker.min.mjs`;
  } catch (error) {
    console.error('Failed to load PDF worker:', error);
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
  rubric_url?: string | null;
  rubric_name?: string | null;
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

const GradePage: React.FC = () => {
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

  const [chatStarted, setChatStarted] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [chatId, setChatId] = useState<string>('');
  const [isProcessing, setIsProcessingStarted] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [history, setHistory] = useState<DBChat[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const ITEMS_PER_PAGE = 10;
  
  const [rubricFile, setRubricFile] = useState<File | null>(null);
  const [paperFile, setPaperFile] = useState<File | null>(null);
  const [showRubricModal, setShowRubricModal] = useState(false);
  const [showPaperModal, setShowPaperModal] = useState(false);
  const [showPasteModal, setShowPasteModal] = useState(false);
  const [pastedContent, setPastedContent] = useState('');
  const [pdfPageCount, setPdfPageCount] = useState(0);
  const [paperPdfPageCount, setPaperPdfPageCount] = useState(0);
  
  const { user } = useAuth();
  
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rubricInputRef = useRef<HTMLInputElement>(null);
  const paperInputRef = useRef<HTMLInputElement>(null);

  const fetchChatHistory = async (pageNumber = 0, isLoadMore = false) => {
    if (!user) return;
    if (isLoadMore) setLoadingMore(true);

    const from = pageNumber * ITEMS_PER_PAGE;
    const to = from + ITEMS_PER_PAGE - 1;

    const { data, error } = await supabase
      .from('solve_chats')
      .select('*')
      .eq('owner', user.id)
      .eq('service_type', 'grade')
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) {
      console.error('Error fetching history:', error);
    } else if (data) {
        if (data.length < ITEMS_PER_PAGE) {
            setHasMore(false);
        }
        if (isLoadMore) {
            setHistory(prev => [...prev, ...data]);
        } else {
            setHistory(data);
        }
    }
    if (isLoadMore) setLoadingMore(false);
  };

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchChatHistory(nextPage, true);
  };

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

  useEffect(() => {
    setPage(0);
    setHasMore(true);
    fetchChatHistory(0, false);
  }, [user]);

  const loadChat = async (chat: DBChat) => {
    setChatId(chat.id);
    setChatStarted(true);
    
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
          name: m.file_name || 'Attachment',
          type: m.file_type || 'unknown',
          url: m.file_url
        } : undefined,
        subject: m.created_by ? undefined : chat.metadata?.subject
      }));
      setMessages(formattedMessages);
    }
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

  const handleNewChat = () => {
    setChatStarted(false);
    setMessages([]);
    setInputValue('');
    setAttachedFile(null);
    setChatId(uuidv4());
  };

  useEffect(() => {
    // Initialize chat ID on mount
    setChatId(uuidv4());
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
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

        // Automatically start chat when file is selected
        setChatStarted(true);
      } else {
        alert('Please select a valid file (Image (no GIF), PDF, DOC, DOCX, TXT, XLSX, or CSV)');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const handleRubricSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Allow PDF and Word for rubric
      if (file.type === 'application/pdf' || 
          file.type === 'application/msword' || 
          file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        setRubricFile(file);
      } else {
        alert('Please select a PDF or Word document for the rubric');
      }
    }
  };

  const handlePaperSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg', 
        'image/png', 
        'image/webp'
      ];
      
      if (allowedTypes.includes(file.type)) {
        setPaperFile(file);

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
            setPaperPdfPageCount(pdf.numPages);
          } catch (error) {
            console.error('Error counting PDF pages:', error);
            setPaperPdfPageCount(0);
          }
        } else {
          setPaperPdfPageCount(0);
        }
      } else {
        alert('Please select a valid file (PDF, Word, or Image) for the paper');
      }
    }
  };

  const handleUploadClick = () => {
    setShowRubricModal(true);
  };

  const handleSkipRubric = () => {
    setRubricFile(null);
    setShowRubricModal(false);
    setShowPaperModal(true);
  };

  const handleNextRubric = () => {
    if (!rubricFile) {
      handleSkipRubric();
      return;
    }
    setShowRubricModal(false);
    setShowPaperModal(true);
  };

  const handleGenerateGrading = () => {
    if (!paperFile) return;
    
    // Close modal
    setShowPaperModal(false);
    
    // Start chat with specific parameters
    handleSendMessage("Grade this paper based on the provided rubric.", paperFile, rubricFile || undefined);
    setPaperFile(null);
    if (paperInputRef.current) {
      paperInputRef.current.value = '';
    }
  };

  const handlePasteClick = () => {
    setChatStarted(true);
    // User can paste in the input area of the chat interface
  };

  const handlePasteModalOpen = () => {
    setPastedContent('');
    setShowPasteModal(true);
  };

  const handlePasteSubmit = () => {
    if (!pastedContent.trim()) return;
    setShowPasteModal(false);
    handleSendMessage(pastedContent, undefined, rubricFile || undefined);
  };

  const uploadToSupabase = async (file: File | Blob, fileName: string): Promise<string | null> => {
    try {
      setProcessingStatus('Uploading file...');
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

  const convertPdfToImages = async (file: File): Promise<string[]> => {
    try {
      setProcessingStatus('Processing PDF...');
      
      const arrayBuffer = await file.arrayBuffer();
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
        };
        
        await page.render(renderContext).promise;
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        images.push(imageDataUrl);
      }
      
      setProcessingStatus('PDF conversion completed!');
      return images;
    } catch (error) {
      console.error('PDF URL conversion error:', error);
      setProcessingStatus('Error converting PDF');
      throw error;
    }
  };

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
    let processed = content.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$');
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
    doc.save('grading_report.pdf');
  };

  const handleSendMessage = async (manualContent?: string, manualFile?: File, manualRubric?: File) => {
    // Determine content and file to use
    const contentToSend = manualContent || inputValue;
    const fileToSend = manualFile || attachedFile;
    
    if (!contentToSend.trim() && !fileToSend) return;

    if (!chatStarted) {
      setChatStarted(true);
    }

    const currentChatId = chatId || uuidv4();
    if (!chatId) setChatId(currentChatId);

    const newUserMsg: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: contentToSend,
      timestamp: new Date(),
      attachment: fileToSend ? {
        name: fileToSend.name,
        type: fileToSend.type,
        url: fileToSend.type.startsWith('image/') ? URL.createObjectURL(fileToSend) : undefined
      } : undefined
    };

    const newAiMsgId = uuidv4();
    const newAiMsg: Message = {
      id: newAiMsgId,
      type: 'ai',
      content: '',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newUserMsg, newAiMsg]);
    
    setInputValue('');
    setAttachedFile(null);
    setIsProcessingStarted(true);

      let requestBody: any = {
        stream: true,
        messages: []
      };

      const userId = user?.id || '0a147ebe-af99-481b-bcaf-ae70c9aeb8d8';
      const timestamp = new Date().toISOString().replace('T', ' ').replace('Z', '');

      try {
        let currentFileUrl: string | undefined = undefined;
        let rubricUrl: string | undefined = undefined;

        // Upload Rubric if present
        if (manualRubric) {
           const rUrl = await uploadToSupabase(manualRubric, manualRubric.name);
           if (rUrl) rubricUrl = rUrl;
        }

        if (fileToSend) {
          const fileUrl = await uploadToSupabase(fileToSend, fileToSend.name);
          
          if (!fileUrl) {
            throw new Error('Failed to upload file');
          }
          currentFileUrl = fileUrl;

          // Append Rubric info to content if it exists
          let finalContent = contentToSend;
          if (rubricUrl) {
            finalContent += `\n\n[System Note: A rubric document was provided for reference: ${rubricUrl}]`;
          }

          if (fileToSend.type.startsWith('image/')) {
            requestBody.messages = [{
              uid: userId,
              type: "image",
              text: { body: finalContent },
              body: finalContent,
              content: finalContent,
              role: "user",
              roleDescription: "A versatile AI assistant for everyday tasks and questions",
              timestamp: timestamp,
              chatid: currentChatId,
              subject: "Grade",
              url: fileUrl,
              rubric_url: rubricUrl,
              attachments: [{
                url: fileUrl,
                fileName: fileToSend.name,
                fileType: "image",
                originalName: fileToSend.name,
                size: fileToSend.size
              }]
            }];
            // If Rubric exists, maybe add it to attachments array?
            if (rubricUrl && manualRubric) {
                requestBody.messages[0].attachments.push({
                    url: rubricUrl,
                    fileName: manualRubric.name,
                    fileType: "document", // Rubric is usually a doc
                    originalName: manualRubric.name,
                    size: manualRubric.size
                });
            }

          } else if (fileToSend.type === 'application/pdf') {
            const base64Images = await convertPdfToImages(fileToSend);
            const imageUrls = await uploadBase64Images(base64Images);
            const formattedImageUrls = imageUrls;

            requestBody.messages = [{
              uid: userId,
              type: "pdf_vision",
              text: { body: finalContent },
              body: finalContent,
              content: finalContent,
              role: "user",
              roleDescription: "A versatile AI assistant for everyday tasks and questions",
              timestamp: timestamp,
              chatid: currentChatId,
              subject: "Grade",
              url: fileUrl,
              rubric_url: rubricUrl,
              image_urls: formattedImageUrls,
              page_count: imageUrls.length,
              attachments: rubricUrl && manualRubric ? [{
                url: rubricUrl,
                fileName: manualRubric.name,
                fileType: "document",
                originalName: manualRubric.name,
                size: manualRubric.size
              }] : []
            }];
          } else {
            requestBody.messages = [{
              uid: userId,
              type: "document",
              text: { body: finalContent },
              body: finalContent,
              content: finalContent,
              role: "user",
              roleDescription: "A versatile AI assistant for everyday tasks and questions",
              timestamp: timestamp,
              chatid: currentChatId,
              subject: "Grade",
              url: fileUrl,
              rubric_url: rubricUrl,
              attachments: [{
                url: fileUrl,
                fileName: fileToSend.name,
                fileType: "document",
                originalName: fileToSend.name,
                size: fileToSend.size
              }]
            }];
             if (rubricUrl && manualRubric) {
                requestBody.messages[0].attachments.push({
                    url: rubricUrl,
                    fileName: manualRubric.name,
                    fileType: "document",
                    originalName: manualRubric.name,
                    size: manualRubric.size
                });
            }
          }
        } else {
          requestBody.messages = [{
            uid: userId,
            type: "text",
            text: { body: "text" }, 
            body: contentToSend,
            content: contentToSend,
            transcription: contentToSend,
            role: "user",
            roleDescription: "",
            timestamp: timestamp,
            chatid: currentChatId,
            subject: "Grade",
            rubric_url: rubricUrl,
            attachments: rubricUrl && manualRubric ? [{
                url: rubricUrl,
                fileName: manualRubric.name,
                fileType: "document",
                originalName: manualRubric.name,
                size: manualRubric.size
            }] : []
          }];
        }

        const chatExists = history.some(c => c.id === currentChatId);
        if (!chatExists) {
          const { error: chatError } = await supabase.from('solve_chats').insert({
            id: currentChatId,
            owner: user?.id,
            title: contentToSend.substring(0, 50) || (fileToSend ? fileToSend.name : 'New Grading'),
            metadata: { subject: "Grade" },
            service_type: 'grade',
            rubric_url: rubricUrl || null,
            rubric_name: manualRubric?.name || null
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
          content: contentToSend,
          status: 'done',
          created_by: user?.id,
          file_url: currentFileUrl || null,
          file_name: fileToSend?.name || null,
          file_type: fileToSend?.type || null,
          file_size: fileToSend?.size || null
        });
        if (msgError) console.error('Error saving user message:', msgError);

        console.log('Sending request to n8n:', requestBody);

        const response = await fetch('https://n8n.matrixaiserver.com/webhook/matrixEdu/gradeQuestion', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.body) {
          throw new Error('No response body');
        }

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
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (!line.trim()) continue;
          
          try {
            const json = JSON.parse(line);
            
            if (json.type === 'item' && typeof json.content === 'string') {
              aiContent += json.content;
              
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

      if (aiContent) {
        const { error: aiMsgError } = await supabase.from('solve_messages').insert({
          id: newAiMsgId,
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
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'ai',
        content: 'Sorry, I encountered an error while processing your request. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsProcessingStarted(false);
      setProcessingStatus('');
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 100 && hasMore && !loadingMore) {
      handleLoadMore();
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
  
  const calculatePaperCost = () => {
    if (paperFile) {
      if (paperFile.type === 'application/pdf') {
        return paperPdfPageCount * 2;
      } else if (paperFile.type.startsWith('image/')) {
        return 3;
      } else {
        // Documents
        return 10;
      }
    }
    return 0;
  };

  const cost = calculateCost();
  const paperCost = calculatePaperCost();
  const pasteCost = 2; // Text only

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
      
      <main className="flex-1 flex flex-col relative w-full">
         {/* Hidden File Input */}
         <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileSelect}
            accept=".jpg,.jpeg,.png,.webp,application/pdf,.doc,.docx,.txt,.xlsx,.csv"
          />

         {/* Unified Header: ME Button + New Chat/Back Navigation */}
         <div className="absolute top-6 left-6 z-30 flex items-center gap-4">
            {(!isLeftSidebarOpen || !isMobile) && (
              <button 
                onClick={() => setIsLeftSidebarOpen(true)} 
                className="w-10 h-10 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center font-bold text-sm hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-sm lg:hidden"
              >
                ME
              </button>
            )}

            {chatStarted ? (
               <button 
                 onClick={handleNewChat}
                 className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors bg-white/80 dark:bg-black/50 backdrop-blur-sm px-3 py-2 rounded-lg shadow-sm"
               >
                  <FaChevronRight className="rotate-180" size={12} /> 
                  <span className="hidden sm:inline">Back to Dashboard</span>
               </button>
            ) : (
               <button 
                  onClick={handleNewChat}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors bg-white/80 dark:bg-black/50 backdrop-blur-sm rounded-full shadow-sm"
                  title="New Chat"
                >
                   <FaRegEdit size={20} />
                </button>
            )}
         </div>

         {!chatStarted ? (
           <div 
             className="flex-1 overflow-y-auto p-8 lg:p-12"
             onScroll={handleScroll}
           >
             <div className="max-w-4xl mx-auto w-full pt-20 lg:pt-24">
             <div className="text-center mb-16">
                 <h1 className="text-4xl font-bold mb-3 text-gray-900 dark:text-white">What do you want to grade?</h1>
                 <p className="text-gray-500 dark:text-gray-400">Grade your paper based on your rubric</p>
             </div>

             {/* Action Cards */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 mb-10 lg:mb-20 max-w-2xl mx-auto">
                 <button 
                  onClick={handleUploadClick}
                  className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-2xl p-6 lg:p-8 text-left hover:bg-gray-50 dark:hover:bg-[#151515] hover:border-gray-300 dark:hover:border-white/20 transition-all group shadow-sm dark:shadow-none"
                 >
                     <div className="mb-4 text-gray-400 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                         <FaUpload size={24} />
                     </div>
                     <h3 className="text-lg font-bold mb-1 text-gray-900 dark:text-white">Upload</h3>
                     <p className="text-sm text-gray-500">PDF, Word documents</p>
                 </button>

                 <button 
                  onClick={handlePasteClick}
                  className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-2xl p-6 lg:p-8 text-left hover:bg-gray-50 dark:hover:bg-[#151515] hover:border-gray-300 dark:hover:border-white/20 transition-all group shadow-sm dark:shadow-none"
                 >
                     <div className="mb-4 text-gray-400 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                         <FaFileAlt size={24} />
                     </div>
                     <h3 className="text-lg font-bold mb-1 text-gray-900 dark:text-white">Paste</h3>
                     <p className="text-sm text-gray-500">Copy and paste text</p>
                 </button>
             </div>

             {/* Your Grades Section */}
             <div>
                 <h2 className="text-xl font-bold mb-6 text-gray-900 dark:text-white">Your grades</h2>
                 
                 {history.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      No grades yet. Upload or paste text to start.
                    </div>
                 ) : (
                    <div className="grid gap-4">
                      {history.map(item => (
                        <div 
                          key={item.id} 
                          onClick={() => loadChat(item)}
                          className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-2xl p-6 hover:border-gray-300 dark:hover:border-white/20 transition-colors cursor-pointer shadow-sm dark:shadow-none"
                        >
                             <div className="flex items-start justify-between mb-4">
                                 <div className="flex items-center gap-4">
                                     <div className="w-12 h-12 bg-gray-100 dark:bg-white rounded-lg flex items-center justify-center text-xl">
                                         ✍️
                                     </div>
                                     <div>
                                         <h3 className="font-bold mb-1 text-gray-900 dark:text-white">{item.title || 'Grading Report'}</h3>
                                         <p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleDateString()}</p>
                                     </div>
                                 </div>
                                 <button className="text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white">•••</button>
                             </div>
                             
                             <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-6 line-clamp-2">
                                 View detailed grading report and feedback...
                             </p>
        
                             <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/5">
                                 <button className="flex items-center gap-2 text-sm text-gray-900 dark:text-white font-medium hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                     View Details <FaChevronRight size={10} />
                                 </button>
                                 {item.rubric_url && (
                                     <a 
                                        href={item.rubric_url} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="flex items-center gap-1 text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors border border-indigo-100 dark:border-indigo-500/20"
                                     >
                                        <FaFileAlt size={10} />
                                        {item.rubric_name || 'Rubric'}
                                     </a>
                                 )}
                             </div>
                         </div>
                      ))}
                      
                      {loadingMore && (
                        <div className="flex justify-center mt-4 mb-4">
                            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                 )}
             </div>
           </div>
           </div>
         ) : (
           /* Chat State (Result View) */
           <div className="flex-1 flex flex-col h-full w-full max-w-5xl mx-auto px-6 pt-6 pb-6 relative overflow-hidden">

              {/* Messages Area */}
              <div 
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto pr-2 custom-scrollbar pt-10 pb-20 lg:pb-32"
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
                              <img src={msg.attachment.url} alt="Attachment" className="w-full h-full object-cover" />
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
                                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-200 dark:border-white/5">
                                  <button 
                                    onClick={() => handleCopy(msg.content)}
                                    className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                                    title="Copy to clipboard"
                                  >
                                    <FaCopy /> Copy
                                  </button>
                                  <button 
                                    onClick={() => handleExportPDF(msg.content)}
                                    className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                                    title="Export as PDF"
                                  >
                                    <FaFilePdf /> Export PDF
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

              {/* Bottom Actions Area */}
              <div className="absolute bottom-4 lg:bottom-8 left-0 right-0 z-20 flex items-center justify-center gap-2 lg:gap-4 pointer-events-none px-4">
                   <button 
                     onClick={() => setShowPaperModal(true)}
                     className="pointer-events-auto flex items-center gap-2 lg:gap-3 bg-black/40 backdrop-blur-xl border border-white/10 hover:border-white/20 hover:bg-black/60 text-white px-4 py-3 lg:px-8 lg:py-4 rounded-full transition-all group shadow-lg"
                   >
                       <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                         <FaUpload className="text-gray-300 group-hover:text-white w-3 h-3 lg:w-3.5 lg:h-3.5" />
                       </div>
                       <span className="text-xs lg:text-base font-medium">Upload Paper</span>
                   </button>
                   
                   <button 
                     onClick={handlePasteModalOpen}
                     className="pointer-events-auto flex items-center gap-2 lg:gap-3 bg-black/40 backdrop-blur-xl border border-white/10 hover:border-white/20 hover:bg-black/60 text-white px-4 py-3 lg:px-8 lg:py-4 rounded-full transition-all group shadow-lg"
                   >
                       <div className="w-6 h-6 lg:w-8 lg:h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                         <FaFileAlt className="text-gray-300 group-hover:text-white w-3 h-3 lg:w-3.5 lg:h-3.5" />
                       </div>
                       <span className="text-xs lg:text-base font-medium">Paste Paper</span>
                   </button>
              </div>

           </div>
         )}
         
      {/* Rubric Modal */}
      {showRubricModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 dark:border-white/5">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Upload Rubric</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Upload a grading rubric to help the AI grade your paper accurately.
              </p>
            </div>
            
            <div className="p-8 flex flex-col items-center justify-center border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#151515]/50">
              <input 
                type="file" 
                ref={rubricInputRef}
                className="hidden" 
                onChange={handleRubricSelect}
                accept=".pdf,.doc,.docx"
              />
              
              {rubricFile ? (
                <div className="w-full bg-white dark:bg-[#1f1f23] border border-gray-200 dark:border-white/10 rounded-xl p-4 flex items-center gap-4 shadow-sm dark:shadow-none">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <FaFileAlt className="text-blue-500 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-gray-900 dark:text-white">{rubricFile.name}</p>
                    <p className="text-xs text-gray-500">{(rubricFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button 
                    onClick={() => setRubricFile(null)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => rubricInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 dark:border-white/10 rounded-xl p-8 hover:border-indigo-500 dark:hover:border-white/20 hover:bg-white dark:hover:bg-white/5 transition-all flex flex-col items-center gap-4 group"
                >
                  <div className="w-16 h-16 bg-white dark:bg-[#1f1f23] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm dark:shadow-none">
                    <FaUpload className="text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-white" size={24} />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-gray-900 dark:text-white mb-1">Click to upload rubric</p>
                    <p className="text-xs text-gray-500">PDF or Word (Optional)</p>
                  </div>
                </button>
              )}
            </div>
            
            <div className="p-6 flex items-center justify-between bg-white dark:bg-[#111]">
              <button 
                onClick={handleSkipRubric}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm font-medium px-4 py-2"
              >
                Skip Rubric
              </button>
              <button 
                onClick={handleNextRubric}
                className="bg-gray-900 dark:bg-white text-white dark:text-black px-6 py-2 rounded-lg font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Paper Modal */}
      {showPaperModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 dark:border-white/5">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Upload Paper</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Upload the student paper or answer sheet you want to grade.
              </p>
            </div>
            
            <div className="p-8 flex flex-col items-center justify-center border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-[#151515]/50">
              <input 
                type="file" 
                ref={paperInputRef}
                className="hidden" 
                onChange={handlePaperSelect}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
              />
              
              {paperFile ? (
                <div className="w-full bg-white dark:bg-[#1f1f23] border border-gray-200 dark:border-white/10 rounded-xl p-4 flex items-center gap-4 shadow-sm dark:shadow-none">
                  <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <FaFileAlt className="text-green-500 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate text-gray-900 dark:text-white">{paperFile.name}</p>
                    <p className="text-xs text-gray-500">{(paperFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button 
                    onClick={() => setPaperFile(null)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => paperInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gray-300 dark:border-white/10 rounded-xl p-8 hover:border-indigo-500 dark:hover:border-white/20 hover:bg-white dark:hover:bg-white/5 transition-all flex flex-col items-center gap-4 group"
                >
                  <div className="w-16 h-16 bg-white dark:bg-[#1f1f23] rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm dark:shadow-none">
                    <FaUpload className="text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-white" size={24} />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-gray-900 dark:text-white mb-1">Click to upload paper</p>
                    <p className="text-xs text-gray-500">PDF, Word, or Image</p>
                  </div>
                </button>
              )}
            </div>
            
            <div className="p-6 flex items-center justify-between bg-white dark:bg-[#111]">
              <button 
                onClick={() => setShowPaperModal(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm font-medium px-4 py-2"
              >
                Cancel
              </button>
              <button 
                onClick={handleGenerateGrading}
                disabled={!paperFile}
                className="bg-gray-900 dark:bg-white text-white dark:text-black px-6 py-2 rounded-lg font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Grade Paper
                {paperFile && paperCost > 0 && (
                   <>
                     <span className="text-sm font-bold ml-1">-{paperCost}</span>
                     <img src={coinIcon} alt="coins" className="w-4 h-4" />
                   </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Paste Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-gray-100 dark:border-white/5">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Paste Paper Content</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Paste the text content of the paper you want to grade.
              </p>
            </div>
            
            <div className="p-6 bg-gray-50 dark:bg-[#151515]/50">
              <textarea
                value={pastedContent}
                onChange={(e) => setPastedContent(e.target.value)}
                placeholder="Paste your text here..."
                className="w-full h-64 bg-white dark:bg-[#1f1f23] text-gray-900 dark:text-gray-200 border border-gray-200 dark:border-white/10 rounded-xl p-4 focus:outline-none focus:border-indigo-500 dark:focus:border-white/30 resize-none"
              />
            </div>
            
            <div className="p-6 flex items-center justify-between bg-white dark:bg-[#111]">
              <button 
                onClick={() => setShowPasteModal(false)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm font-medium px-4 py-2"
              >
                Cancel
              </button>
              <button 
                onClick={handlePasteSubmit}
                disabled={!pastedContent.trim()}
                className="bg-gray-900 dark:bg-white text-white dark:text-black px-6 py-2 rounded-lg font-bold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Grade Paper
                {pastedContent.trim() && (
                   <>
                     <span className="text-sm font-bold ml-1">-{pasteCost}</span>
                     <img src={coinIcon} alt="coins" className="w-4 h-4" />
                   </>
                )}
              </button>
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
                          Download File
                       </a>
                   )}
                </div>
             )}
          </div>
        </div>
      )}
      </main>
    </div>
  );
};

export default GradePage;