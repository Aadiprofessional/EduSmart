import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { supabase } from '../utils/supabase';
import { 
  FaChevronDown, FaBold, FaItalic, FaUnderline, FaStrikethrough, 
  FaListUl, FaListOl, FaQuoteRight, FaCode, FaMinus, FaImage, FaEraser,
  FaFilePdf, FaAlignLeft, FaAlignCenter, FaAlignRight, FaLink, FaHighlighter,
  FaHistory, FaPenNib, FaFileAlt, FaEnvelope, FaClipboard, FaUserGraduate, FaFileContract, FaMagic,
  FaChevronLeft, FaChevronRight, FaTimes, FaTrash
} from 'react-icons/fa';
import { FiMenu, FiX, FiRefreshCw, FiCopy } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import { renderToStaticMarkup } from 'react-dom/server';
import IconComponent from '../components/ui/IconComponent';
import { useNotification } from '../utils/NotificationContext';
import SidebarLeft from '../components/dashboard/SidebarLeft';
import { useLanguage } from '../utils/LanguageContext';
import { useResponseCheck, ResponseUpgradeModal } from '../utils/responseChecker';

const ContentWriter: React.FC = () => {
  const { t } = useLanguage();
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  
  const [prompt, setPrompt] = useState('');
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState(''); // Stores HTML content
  const [isHistoryOpen, setIsHistoryOpen] = useState(false); // Right panel history state
  const [tone, setTone] = useState('professional');
  const [targetWordCount, setTargetWordCount] = useState(500);
  
  // Editor State
  const editorRef = useRef<HTMLDivElement>(null);
  const [activePopup, setActivePopup] = React.useState<'link' | 'image' | 'font' | null>(null);
  const [popupValue, setPopupValue] = React.useState('');
  const savedSelection = useRef<Range | null>(null);
  const [currentFont, setCurrentFont] = useState({ name: 'Sans Serif', value: 'Arial' });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [contentHistory, setContentHistory] = useState<{ 
    id: string,
    title: string, 
    date: string, 
    content: string,
    template: string,
    prompt: string 
  }[]>([]);

  const fetchHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_content')
        .select('*')
        .eq('uid', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching history:', error);
        return;
      }

      if (data) {
        const formattedHistory = data.map(item => ({
          id: item.id || item.created_at, // Fallback to created_at if id is missing (table issue)
          title: item.title || t('contentWriter.historyUntitled'),
          date: new Date(item.created_at).toLocaleDateString(),
          content: item.content,
          template: item.content_type || 'custom',
          prompt: item.prompt
        }));
        setContentHistory(formattedHistory);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const { showSuccess, showError } = useNotification();
  const { checkAndUseResponse } = useResponseCheck();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');

  const fonts = [
    { name: 'Sans Serif', value: 'Arial' },
    { name: 'Serif', value: 'Times New Roman' },
    { name: 'Monospace', value: 'Courier New' },
    { name: 'Georgia', value: 'Georgia' },
    { name: 'Verdana', value: 'Verdana' },
    { name: 'Comic Sans', value: 'Comic Sans MS' }
  ];

  const templates = [
    { id: 'college-app', name: t('contentWriter.templateNames.collegeApp'), icon: FaUserGraduate },
    { id: 'cover-letter', name: t('contentWriter.templateNames.coverLetter'), icon: FaFileAlt },
    { id: 'recommendation', name: t('contentWriter.templateNames.recommendation'), icon: FaEnvelope },
    { id: 'research-paper', name: t('contentWriter.templateNames.researchPaper'), icon: FaClipboard },
    { id: 'scholarship', name: t('contentWriter.templateNames.scholarship'), icon: FaFileContract },
    { id: 'personal-statement', name: t('contentWriter.templateNames.personalStatement'), icon: FaPenNib },
  ];

  useEffect(() => {
    fetchHistory();
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setIsLeftSidebarOpen(false);
      else setIsLeftSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Editor Functions (from StudyNotes) ---

  const execCmd = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) editorRef.current.focus();
    setHasUnsavedChanges(true);
  };

  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      savedSelection.current = selection.getRangeAt(0);
    }
  };

  const restoreSelection = () => {
    const selection = window.getSelection();
    if (selection && savedSelection.current) {
      selection.removeAllRanges();
      selection.addRange(savedSelection.current);
    }
  };

  const handlePopupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    restoreSelection();
    if (activePopup === 'link') execCmd('createLink', popupValue);
    else if (activePopup === 'image') execCmd('insertImage', popupValue);
    setActivePopup(null);
    setPopupValue('');
  };

  const openPopup = (type: 'link' | 'image') => {
    saveSelection();
    setActivePopup(type);
    setPopupValue('');
  };

  const ToolbarButton = ({ icon, command, value, label, onClick }: { icon: React.ReactNode, command?: string, value?: string, label?: string, onClick?: () => void }) => (
    <button 
        onMouseDown={(e) => {
            e.preventDefault();
            if (onClick) onClick();
            else if (command) execCmd(command, value);
        }}
        className={`p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded flex-shrink-0 transition-colors flex items-center gap-1 ${activePopup && (command === 'createLink' || command === 'insertImage') ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white' : ''}`}
        title={label || command}
    >
        {icon}
        {label && <span className="text-xs font-bold">{label}</span>}
    </button>
  );

  // --- Generation Logic ---

  const handleGenerateContent = async () => {
    if (!prompt.trim()) return;
    const responseCheck = await checkAndUseResponse({
      responseType: 'content_writer',
      queryData: {
        prompt,
        template: activeTemplate,
        tone,
        targetWordCount
      }
    });
    if (!responseCheck.canProceed) {
      if (responseCheck.showUpgradeModal) {
        setUpgradeMessage(responseCheck.message || 'You need an active subscription or coins to continue.');
        setShowUpgradeModal(true);
      }
      return;
    }
    
    setIsGenerating(true);
    setEditedContent(''); // Clear for streaming
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const uid = user?.id || "0a147ebe-af99-481b-bcaf-ae70c9aeb8d8";

      const response = await fetch('https://n8n.matrixaiserver.com/webhook/086f4156-4b18-4ac3-b5e1-4ad96a86b896', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            uid,
            prompt,
            contentType: activeTemplate,
            tone,
            targetWordCount,
            timestamp: new Date().toISOString()
        })
      });
      
      if (!response.body) throw new Error('No response body');
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedRaw = '';
      let accumulatedMarkdown = '';

      const updateEditorWithMarkdown = () => {
        const htmlContent = renderToStaticMarkup(
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeRaw, rehypeKatex]}
          >
            {accumulatedMarkdown}
          </ReactMarkdown>
        );
        setEditedContent(htmlContent);
      };

      const extractTextFromPayload = (payload: string): string | null => {
        const cleaned = payload.trim();
        if (!cleaned || cleaned === '[DONE]') return '';

        try {
          const parsed = JSON.parse(cleaned);
          if (typeof parsed === 'string') return parsed;
          if (typeof parsed?.content === 'string') return parsed.content;
          if (parsed?.type === 'item' && typeof parsed?.content === 'string') return parsed.content;
          if (typeof parsed?.message?.content === 'string') return parsed.message.content;
          if (typeof parsed?.delta?.content === 'string') return parsed.delta.content;
          if (typeof parsed?.choices?.[0]?.delta?.content === 'string') return parsed.choices[0].delta.content;
          if (typeof parsed?.choices?.[0]?.message?.content === 'string') return parsed.choices[0].message.content;
          if (typeof parsed?.output === 'string') return parsed.output;
          if (typeof parsed?.text === 'string') return parsed.text;
          return '';
        } catch {
          return null;
        }
      };

      const appendContent = (content: string) => {
        if (!content) return false;
        accumulatedMarkdown += content;
        updateEditorWithMarkdown();
        return true;
      };

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (!value) continue;

        const chunkValue = decoder.decode(value, { stream: true });
        let appendedInThisChunk = false;
        accumulatedRaw += chunkValue;

        const lines = accumulatedRaw.split('\n');
        accumulatedRaw = done ? '' : (lines.pop() || '');

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          const payload = trimmed.startsWith('data:') ? trimmed.slice(5).trim() : trimmed;
          const extracted = extractTextFromPayload(payload);

          if (extracted === null) continue;
          if (appendContent(extracted)) {
            appendedInThisChunk = true;
          }
        }

        if (!appendedInThisChunk) {
          const directText = extractTextFromPayload(chunkValue);
          if (directText === null) {
            appendContent(chunkValue);
          } else {
            appendContent(directText);
          }
        }
      }

      if (accumulatedRaw.trim()) {
        const tailContent = extractTextFromPayload(accumulatedRaw);
        if (tailContent === null) {
          appendContent(accumulatedRaw);
        } else {
          appendContent(tailContent);
        }
      }
      
      setHasUnsavedChanges(true);

      // Save logic removed as per user request
      /*
      if (user) {
        await supabase.from('user_content').insert({
          uid: user.id,
          prompt,
          content: accumulatedMarkdown, // Save raw markdown
          title: prompt.split(' ').slice(0, 4).join(' ') + '...',
          content_type: activeTemplate,
          tone,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        fetchHistory();
      }
      */

    } catch (error) {
      console.error('Error generating content:', error);
      showError(t('contentWriter.error'));
    } finally {
      setIsGenerating(false);
    }
  };

  const selectTemplate = (templateId: string) => {
    // If clicking the already-active template, deselect it and clear the prompt
    if (activeTemplate === templateId) {
      setActiveTemplate(null);
      setPrompt('');
      return;
    }
    setActiveTemplate(templateId);
    let templatePrompt = '';
    switch(templateId) {
      case 'college-app': templatePrompt = t('contentWriter.templatePrompts.collegeApp'); break;
      case 'cover-letter': templatePrompt = t('contentWriter.templatePrompts.coverLetter'); break;
      case 'recommendation': templatePrompt = t('contentWriter.templatePrompts.recommendation'); break;
      case 'research-paper': templatePrompt = t('contentWriter.templatePrompts.researchPaper'); break;
      case 'scholarship': templatePrompt = t('contentWriter.templatePrompts.scholarship'); break;
      case 'personal-statement': templatePrompt = t('contentWriter.templatePrompts.personalStatement'); break;
    }
    setPrompt(templatePrompt);
  };

  const handleExportPdf = async () => {
    if (!editorRef.current) return;
    try {
        const isDarkMode = document.documentElement.classList.contains('dark');
        const canvas = await html2canvas(editorRef.current, { 
            scale: 2,
            backgroundColor: isDarkMode ? '#111111' : '#ffffff',
            useCORS: true
        });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('content-writer-doc.pdf');
    } catch (error) {
        console.error('Error exporting PDF:', error);
    }
  };

  const handleCopyContent = () => {
      if (!editorRef.current) return;
      navigator.clipboard.writeText(editorRef.current.innerText);
      showSuccess(t('contentWriter.copied'));
  };

  const handleDeleteHistory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(t('contentWriter.confirmDeleteHistoryItem'))) return;
    
    try {
      // Determine if we are deleting by UUID or using created_at as fallback
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      
      let query = supabase
        .from('user_content')
        .delete();
      
      if (isUuid) {
        // If it looks like a UUID, assume column 'id' exists
        query = query.eq('id', id);
      } else {
        // Fallback: Delete by created_at and uid (since id column is likely missing)
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
           query = query.eq('uid', user.id).eq('created_at', id);
        } else {
           throw new Error('User not authenticated for deletion');
        }
      }

      const { error } = await query;

      if (error) throw error;

      setContentHistory(prev => prev.filter(item => item.id !== id));
      showSuccess(t('contentWriter.historyItemDeleted'));
    } catch (error) {
      console.error('Error deleting history:', error);
      showError(t('contentWriter.failedToDeleteHistoryItem'));
    }
  };

  const loadFromHistory = (item: any) => {
    // If content is stored as markdown, convert to HTML for the editor
    const htmlContent = renderToStaticMarkup(
        <ReactMarkdown 
            remarkPlugins={[remarkGfm, remarkMath]} 
            rehypePlugins={[rehypeRaw, rehypeKatex]}
        >
            {item.content}
        </ReactMarkdown>
    );
    setEditedContent(htmlContent);
    setActiveTemplate(item.template);
    setPrompt(item.prompt);
    setIsHistoryOpen(false);
  };

  const [mobileTab, setMobileTab] = useState<'generator' | 'editor'>('generator');

  // Switch to editor tab on mobile when generating
  useEffect(() => {
    if (isGenerating && isMobile) {
      setMobileTab('editor');
    }
  }, [isGenerating, isMobile]);

  return (
    <div className="h-screen bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-white flex font-sans overflow-hidden relative selection:bg-indigo-500/30">
      
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] rounded-full bg-indigo-600/5 blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] rounded-full bg-blue-600/5 blur-[150px]" />
        <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-purple-600/5 blur-[120px]" />
      </div>

      {/* Mobile Sidebar Overlay */}
      {(isLeftSidebarOpen && isMobile) && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 lg:hidden"
          onClick={() => setIsLeftSidebarOpen(false)}
        />
      )}

      {/* Left Sidebar */}
      <SidebarLeft 
        isOpen={isLeftSidebarOpen} 
        onClose={() => setIsLeftSidebarOpen(false)}
        className="fixed inset-y-0 left-0 z-50 lg:relative lg:z-0 shadow-2xl lg:shadow-none h-full border-r border-gray-200 dark:border-white/5 bg-white dark:bg-[#0a0a0a]"
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden z-10">
        
        {/* Header / Mobile Nav */}
        <header className="h-16 border-b border-gray-200 dark:border-white/5 bg-white/90 dark:bg-[#0a0a0a]/80 backdrop-blur-xl flex items-center justify-between px-4 lg:px-6 shrink-0 z-20">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                <button 
                    onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)} 
                    className="lg:hidden w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-900 dark:text-white flex items-center justify-center transition-colors"
                >
                    <IconComponent icon={FiMenu} className="w-5 h-5" />
                </button>
                {!isLeftSidebarOpen && (
                  <button
                    onClick={() => setIsLeftSidebarOpen(true)}
                    className="hidden lg:flex p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl border border-gray-200 dark:border-white/10 transition-colors"
                    title="Open sidebar"
                  >
                    <IconComponent icon={FiMenu} className="w-5 h-5" />
                  </button>
                )}
                </div>
                <h1 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 lg:gap-3">
                    <div className="hidden lg:flex w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
                        <FaPenNib size={14} className="text-white" />
                    </div>
                    <span className="hidden sm:inline bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-500 dark:from-white dark:to-gray-400 whitespace-nowrap">{t('contentWriter.title')}</span>
                </h1>
            </div>

            {/* Mobile Tab Switcher - Underline Style */}
            <div className="flex lg:hidden">
                <button
                    onClick={() => setMobileTab('generator')}
                    className={`relative px-5 py-1.5 text-sm font-semibold transition-colors ${mobileTab === 'generator' ? 'text-indigo-500' : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    {t('contentWriter.createTab')}
                    {mobileTab === 'generator' && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
                    )}
                </button>
                <button
                    onClick={() => setMobileTab('editor')}
                    className={`relative px-5 py-1.5 text-sm font-semibold transition-colors ${mobileTab === 'editor' ? 'text-indigo-500' : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    {t('contentWriter.editorTab')}
                    {mobileTab === 'editor' && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 rounded-full" />
                    )}
                </button>
            </div>

            {/* History Actions */}
            <div className="flex items-center gap-3">
                 <button 
                  onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all ${isHistoryOpen ? 'bg-white/10 text-white' : ''}`}
                  title={t('contentWriter.history')}
                >
                   <FaHistory size={14} />
                   <span className="hidden lg:inline">{t('contentWriter.history')}</span>
                </button>
            </div>
        </header>

        {/* Content Container */}
        <div className="flex-1 flex overflow-hidden relative">
            
            {/* GENERATOR PANEL (Left) */}
            <div className={`${mobileTab === 'generator' ? 'flex' : 'hidden'} lg:flex w-full lg:w-[360px] xl:w-[420px] flex-col border-r border-gray-200 dark:border-white/5 bg-white dark:bg-[#0a0a0a] relative z-10`}>
                <div className="flex-1 overflow-y-auto p-5 lg:p-8 space-y-8 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
                    
                    {/* Templates Grid — shown first on mobile to match image layout */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('contentWriter.templates')}</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {templates.map((template) => (
                                <button
                                    key={template.id}
                                    onClick={() => selectTemplate(template.id)}
                                    className={`p-4 rounded-2xl border text-center transition-all group relative flex flex-col items-center gap-3 ${activeTemplate === template.id ? 'bg-indigo-500/10 border-indigo-500/50 dark:border-indigo-500/50' : 'bg-white dark:bg-white/[0.03] border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/[0.05]'}`}
                                >
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeTemplate === template.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-white/15 group-hover:text-gray-700 dark:group-hover:text-gray-300'} transition-all duration-200`}>
                                        <template.icon size={16} />
                                    </div>
                                    <span className={`text-xs font-semibold leading-tight ${activeTemplate === template.id ? 'text-indigo-600 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200'}`}>
                                        {template.name}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Prompt Section */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {t('contentWriter.prompt')}
                            </label>
                            {prompt && (
                                <button 
                                    onClick={() => setPrompt('')}
                                    className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                                >
                                    {t('common.clear')}
                                </button>
                            )}
                        </div>
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl opacity-0 group-focus-within:opacity-20 transition duration-500 blur"></div>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder={t('contentWriter.promptPlaceholder')}
                                className="relative w-full p-4 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-2xl focus:outline-none focus:border-indigo-500/30 text-sm leading-relaxed min-h-[140px] resize-none placeholder-gray-400 dark:placeholder-gray-600 text-gray-800 dark:text-gray-200 transition-all"
                            />
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider pl-1">{t('contentWriter.tone')}</label>
                            <div className="relative">
                                <select 
                                    value={tone}
                                    onChange={(e) => setTone(e.target.value)}
                                    className="w-full appearance-none p-3 pl-4 pr-8 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-indigo-500/30 transition-all cursor-pointer"
                                >
                                    <option value="professional">{t('contentWriter.tones.professional')}</option>
                                    <option value="casual">{t('contentWriter.tones.informal')}</option>
                                    <option value="academic">{t('contentWriter.tones.academic')}</option>
                                    <option value="creative">{t('contentWriter.creative')}</option>
                                    <option value="enthusiastic">{t('contentWriter.enthusiastic')}</option>
                                </select>
                                <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider pl-1">{t('contentWriter.wordCount')}</label>
                            <div className="relative">
                                <select
                                    value={targetWordCount}
                                    onChange={(e) => setTargetWordCount(Number(e.target.value))}
                                    className="w-full appearance-none p-3 pl-4 pr-8 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-800 dark:text-gray-200 outline-none focus:border-indigo-500/30 transition-all cursor-pointer"
                                >
                                    <option value={100}>~100</option>
                                    <option value={250}>~250</option>
                                    <option value={500}>~500</option>
                                    <option value={750}>~750</option>
                                    <option value={1000}>~1000</option>
                                    <option value={1500}>~1500</option>
                                    <option value={2000}>~2000</option>
                                    <option value={3000}>~3000</option>
                                </select>
                                <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Generate Button */}
                    <button
                        onClick={handleGenerateContent}
                        disabled={isGenerating || !prompt.trim()}
                        className="w-full py-4 bg-gradient-to-r from-cyan-500 to-cyan-400 hover:from-cyan-400 hover:to-cyan-300 text-white rounded-2xl font-bold shadow-lg shadow-cyan-500/20 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                    >
                        {isGenerating ? <FiRefreshCw className="animate-spin text-lg" /> : <FaMagic className="text-lg group-hover:rotate-12 transition-transform" />}
                        <span className="tracking-wide text-base">{isGenerating ? t('contentWriter.contentWriterGenerating') : t('contentWriter.generateContent')}</span>
                    </button>
                </div>
            </div>

            {/* EDITOR PANEL (Right) */}
            <div className={`${mobileTab === 'editor' ? 'flex' : 'hidden'} lg:flex flex-1 relative bg-gray-50 dark:bg-[#050505] flex-col h-full overflow-hidden`}>
                
                {/* Editor Top Bar (Toolbar) */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 max-w-[95%] w-fit transition-all duration-300">
                    <div className="rounded-2xl px-2 py-1.5 border border-gray-200 dark:border-white/10 shadow-2xl backdrop-blur-xl bg-white/90 dark:bg-[#151515]/90 flex items-center gap-1 overflow-x-auto scrollbar-none max-w-full">
                        {/* Font Family */}
                        <div className="relative group/font">
                            <button 
                                onClick={() => setActivePopup(activePopup === 'font' ? null : 'font')}
                                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white rounded-xl transition-all"
                            >
                                <span className="max-w-[80px] truncate">{currentFont.name}</span>
                                <FaChevronDown size={8} className="opacity-50" />
                            </button>
                            {activePopup === 'font' && (
                                <div className="absolute top-full left-0 mt-2 py-1 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl z-50 w-48 backdrop-blur-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    {fonts.map((font) => (
                                        <button
                                            key={font.value}
                                            onClick={() => {
                                                execCmd('fontName', font.value);
                                                setCurrentFont(font);
                                                setActivePopup(null);
                                            }}
                                            className="w-full text-left px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors flex items-center justify-between group/item"
                                            style={{ fontFamily: font.value }}
                                        >
                                            {font.name}
                                            {currentFont.value === font.value && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="w-px h-5 bg-white/10 mx-1 flex-shrink-0"></div>
                        
                        <ToolbarButton icon={<FaBold size={13} />} command="bold" label="" />
                        <ToolbarButton icon={<FaItalic size={13} />} command="italic" label="" />
                        <ToolbarButton icon={<FaUnderline size={13} />} command="underline" label="" />
                        
                        <div className="hidden sm:block w-px h-5 bg-white/10 mx-1 flex-shrink-0"></div>
                        
                        <div className="hidden sm:flex items-center gap-1">
                            <ToolbarButton icon={<FaListUl size={13} />} command="insertUnorderedList" label="" />
                            <ToolbarButton icon={<FaListOl size={13} />} command="insertOrderedList" label="" />
                            <ToolbarButton icon={<FaQuoteRight size={13} />} command="formatBlock" value="blockquote" label="" />
                        </div>

                        <div className="w-px h-5 bg-white/10 mx-1 flex-shrink-0"></div>

                        <ToolbarButton icon={<FaLink size={13} />} onClick={() => openPopup('link')} label="" />
                        <ToolbarButton icon={<FaImage size={13} />} onClick={() => openPopup('image')} label="" />
                    </div>

                    {/* Popup Input */}
                    {activePopup && activePopup !== 'font' && (
                        <div className="absolute top-full left-0 mt-3 p-2 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 flex items-center gap-2 w-72 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">
                            <form onSubmit={handlePopupSubmit} className="flex items-center gap-2 w-full p-1">
                                <input
                                    type="text"
                                    value={popupValue}
                                    onChange={(e) => setPopupValue(e.target.value)}
                                    placeholder={activePopup === 'link' ? t('contentWriter.pasteLinkHere') : t('contentWriter.imageUrl')}
                                    className="flex-1 bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500/50 transition-all placeholder-gray-400 dark:placeholder-gray-600"
                                    autoFocus
                                />
                                <button type="submit" className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded-lg font-bold shadow-lg shadow-indigo-500/20 transition-all">{t('contentWriter.add')}</button>
                                <button type="button" onClick={() => setActivePopup(null)} className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg transition-colors">
                                    <FiX size={14} />
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {/* Editor Area */}
                <div className="flex-1 overflow-y-auto px-4 lg:px-8 xl:px-16 pb-32 pt-28 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
                    <div className="max-w-5xl mx-auto w-full min-h-[800px] bg-white dark:bg-[#0f0f0f] border border-gray-200 dark:border-white/5 rounded-xl p-6 lg:p-10 shadow-2xl relative transition-all duration-500 overflow-hidden">
                        {/* Subtle paper texture/noise overlay could go here */}
                        
                        <>
                                <style>{`
                                    .content-writer-editor { font-size: 1rem; color: #374151; line-height: 1.8; word-break: break-word; overflow-wrap: break-word; }
                                    .dark .content-writer-editor { color: #d4d4d8; }
                                    .content-writer-editor h1 { font-size: 2rem; font-weight: 800; margin-bottom: 1.25rem; margin-top: 1rem; color: #111827; letter-spacing: -0.02em; line-height: 1.2; word-break: break-word; }
                                    .dark .content-writer-editor h1 { color: #ffffff; }
                                    .content-writer-editor h2 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.75rem; margin-top: 1.75rem; color: #1f2937; letter-spacing: -0.01em; word-break: break-word; }
                                    .dark .content-writer-editor h2 { color: #f4f4f5; }
                                    .content-writer-editor h3 { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.5rem; margin-top: 1.25rem; color: #374151; word-break: break-word; }
                                    .dark .content-writer-editor h3 { color: #e4e4e7; }
                                    .content-writer-editor p { margin-bottom: 1.25em; word-break: break-word; overflow-wrap: break-word; }
                                    .content-writer-editor ul { list-style-type: disc; padding-left: 1.5em; margin-bottom: 1.25em; color: #4b5563; }
                                    .dark .content-writer-editor ul { color: #a1a1aa; }
                                    .content-writer-editor ol { list-style-type: decimal; padding-left: 1.5em; margin-bottom: 1.25em; color: #4b5563; }
                                    .dark .content-writer-editor ol { color: #a1a1aa; }
                                    .content-writer-editor li { margin-bottom: 0.4em; word-break: break-word; }
                                    .content-writer-editor blockquote { border-left: 3px solid #6366f1; padding-left: 1.5em; font-style: italic; margin: 1.5em 0; color: #374151; }
                                    .dark .content-writer-editor blockquote { color: #d4d4d8; }
                                    .content-writer-editor pre { background: #f3f4f6; padding: 1.25em; border-radius: 0.75rem; overflow-x: auto; margin-bottom: 1.5em; border: 1px solid #e5e7eb; font-size: 0.875em; white-space: pre-wrap; word-break: break-word; }
                                    .dark .content-writer-editor pre { background: #18181b; border-color: #27272a; }
                                    .content-writer-editor code { font-family: 'JetBrains Mono', monospace; background: #e5e7eb; padding: 0.2em 0.4em; border-radius: 0.3em; font-size: 0.85em; color: #1f2937; word-break: break-word; }
                                    .dark .content-writer-editor code { background: #27272a; color: #e4e4e7; }
                                    .content-writer-editor a { color: #818cf8; text-decoration: none; border-bottom: 1px solid rgba(129, 140, 248, 0.3); transition: border-color 0.2s; }
                                    .content-writer-editor a:hover { border-bottom-color: #818cf8; }
                                    .content-writer-editor img { max-width: 100%; border-radius: 0.75rem; margin: 1.5em 0; border: 1px solid #e5e7eb; }
                                    .dark .content-writer-editor img { border-color: #27272a; }
                                `}</style>
                                {isGenerating && (
                                    <div className="absolute top-5 right-5 z-20 px-3 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-500 dark:text-indigo-300 border border-indigo-500/20 backdrop-blur-sm flex items-center gap-2">
                                        <FiRefreshCw className="animate-spin" />
                                        <span>{t('contentWriter.contentWriterGenerating')}</span>
                                    </div>
                                )}
                                <div 
                                    ref={editorRef}
                                    className="content-writer-editor focus:outline-none min-h-[600px] break-words"
                                    contentEditable={true}
                                    suppressContentEditableWarning={true}
                                    dangerouslySetInnerHTML={{ __html: editedContent }}
                                    onInput={() => {
                                        setHasUnsavedChanges(true);
                                    }}
                                />
                                {(!editedContent && isGenerating) && (
                                    <div className="absolute top-0 left-0 right-0 bottom-0 flex flex-col items-center justify-center pointer-events-none">
                                        <div className="relative mb-8">
                                            <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 rounded-full animate-pulse"></div>
                                            <div className="relative w-20 h-20 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-3xl border border-white/10 backdrop-blur-md flex items-center justify-center shadow-inner">
                                                <FaMagic className="text-3xl text-indigo-400 animate-pulse" />
                                            </div>
                                        </div>
                                        <h2 className="text-2xl font-bold text-gray-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-white dark:to-gray-400 mb-3">{t('contentWriter.craftingYourMasterpiece')}</h2>
                                        <p className="text-gray-500 dark:text-gray-500 text-sm font-medium tracking-wide uppercase">{t('contentWriter.aiAnalyzingPatterns')}</p>
                                    </div>
                                )}
                                {(!editedContent && !isGenerating) && (
                                    <div className="absolute top-12 left-12 right-12 pointer-events-none opacity-10 select-none">
                                        <h1 className="text-5xl font-bold text-gray-500 mb-8 font-serif">{t('contentWriter.historyUntitled')}</h1>
                                        <div className="space-y-4">
                                            <div className="h-4 w-full bg-gray-500 rounded-full"></div>
                                            <div className="h-4 w-5/6 bg-gray-500 rounded-full"></div>
                                            <div className="h-4 w-4/6 bg-gray-500 rounded-full"></div>
                                        </div>
                                    </div>
                                )}
                            </>
                    </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="absolute bottom-8 left-0 right-0 flex justify-center pointer-events-none z-30">
                    <div className="flex items-center gap-1.5 pointer-events-auto bg-white/90 dark:bg-[#1a1a1a]/80 backdrop-blur-xl p-1.5 rounded-full border border-gray-200 dark:border-white/10 shadow-2xl transform hover:scale-105 transition-transform duration-300">
                        <button 
                            onClick={handleCopyContent}
                            className="px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-all flex items-center gap-2"
                        >
                            <FiCopy size={16} /> <span>{t('common.copy')}</span>
                        </button>
                        <div className="w-px h-5 bg-gray-200 dark:bg-white/10"></div>
                        <button 
                            onClick={handleExportPdf}
                            className="px-6 py-2.5 text-sm font-semibold bg-white text-black hover:bg-gray-200 rounded-full shadow-lg shadow-white/10 transition-all flex items-center gap-2"
                        >
                            <FaFilePdf size={16} /> <span>{t('common.export')}</span>
                        </button>
                    </div>
                </div>

            </div>
        </div>
      </main>

      {/* Right History Panel (Sliding) */}
      <AnimatePresence>
        {isHistoryOpen && (
          <>
             {/* Backdrop */}
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setIsHistoryOpen(false)}
               className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
             />
             
             {/* Panel */}
             <motion.div 
               initial={{ x: '100%' }}
               animate={{ x: 0 }}
               exit={{ x: '100%' }}
               transition={{ type: 'spring', damping: 30, stiffness: 300 }}
               className="fixed top-0 right-0 h-full w-80 lg:w-[450px] bg-white dark:bg-[#0a0a0a] shadow-2xl z-50 border-l border-gray-200 dark:border-white/10 flex flex-col"
             >
                <div className="p-6 border-b border-gray-200 dark:border-white/5 flex justify-between items-center bg-white/80 dark:bg-[#0a0a0a]/50 backdrop-blur-md">
                   <div>
                       <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                         <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                            <FaHistory size={18} />
                         </div>
                         {t('contentWriter.history')}
                       </h3>
                       <p className="text-xs text-gray-500 mt-1 ml-11">{t('contentWriter.yourRecentGenerations')}</p>
                   </div>
                   <button 
                     onClick={() => setIsHistoryOpen(false)}
                     className="p-2.5 text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                   >
                     <FiX size={20} />
                   </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-white dark:bg-[#0a0a0a]">
                    {contentHistory.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-4 opacity-50">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                                <FaHistory className="text-3xl" />
                            </div>
                            <p className="text-sm font-medium">{t('contentWriter.noHistoryYet')}</p>
                        </div>
                    ) : (
                        contentHistory.map((item, idx) => (
                            <div 
                                key={item.id || idx} 
                                onClick={() => loadFromHistory(item)} 
                            className="group p-5 rounded-2xl border border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/[0.04] hover:border-indigo-500/20 cursor-pointer transition-all duration-300 relative overflow-hidden shadow-sm hover:shadow-md"
                            >
                                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                
                                <div className="flex justify-between items-start mb-3 relative z-10">
                                    <h4 className="font-semibold text-gray-700 dark:text-gray-200 line-clamp-1 pr-8 text-base group-hover:text-indigo-500 dark:group-hover:text-indigo-300 transition-colors">{item.title}</h4>
                                    <span className="text-[10px] text-gray-500 font-mono bg-white/5 px-2 py-1 rounded-md">{item.date}</span>
                                </div>
                                <p className="text-xs text-gray-400 line-clamp-2 mb-4 leading-relaxed relative z-10">{item.prompt}</p>
                                <div className="flex items-center gap-2 relative z-10">
                                    <span className="text-[10px] px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/10 capitalize font-semibold tracking-wide">
                                        {item.template}
                                    </span>
                                </div>
                                
                                <button
                                    onClick={(e) => handleDeleteHistory(item.id, e)}
                                    className="absolute top-4 right-4 p-2 text-gray-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 z-20"
                                    title={t('common.delete')}
                                >
                                    <FaTrash size={12} />
                                </button>
                            </div>
                        ))
                    )}
                </div>
             </motion.div>
          </>
        )}
      </AnimatePresence>
      <ResponseUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        message={upgradeMessage}
      />
    </div>
  );
};

export default ContentWriter;
