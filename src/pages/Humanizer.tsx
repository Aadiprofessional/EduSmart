import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { supabase } from '../utils/supabase';
import { 
  FaChevronDown, FaBold, FaItalic, FaUnderline, FaStrikethrough, 
  FaListUl, FaListOl, FaQuoteRight, FaCode, FaMinus, FaImage, FaEraser,
  FaFilePdf, FaAlignLeft, FaAlignCenter, FaAlignRight, FaLink, FaHighlighter,
  FaHistory, FaUserCheck, FaFileAlt, FaEnvelope, FaClipboard, FaUserGraduate, FaFileContract, FaMagic, FaPenNib,
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

const Humanizer: React.FC = () => {
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(window.innerWidth >= 1024);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  
  const [prompt, setPrompt] = useState('');
  const [activeTemplate, setActiveTemplate] = useState('standard');
  const [editedContent, setEditedContent] = useState(''); // Stores HTML content
  const [isHistoryOpen, setIsHistoryOpen] = useState(false); // Right panel history state
  const [tone, setTone] = useState('natural');
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
        .eq('content_type', 'humanizer') // Filter for humanizer content if possible, or just all content
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching history:', error);
        return;
      }

      if (data) {
        const formattedHistory = data.map(item => ({
          id: item.id || item.created_at,
          title: item.title || 'Untitled',
          date: new Date(item.created_at).toLocaleDateString(),
          content: item.content,
          template: item.content_type || 'custom',
          prompt: item.prompt
        }));
        console.log('History loaded:', formattedHistory);
        setContentHistory(formattedHistory);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const { showSuccess, showError } = useNotification();

  const fonts = [
    { name: 'Sans Serif', value: 'Arial' },
    { name: 'Serif', value: 'Times New Roman' },
    { name: 'Monospace', value: 'Courier New' },
    { name: 'Georgia', value: 'Georgia' },
    { name: 'Verdana', value: 'Verdana' },
    { name: 'Comic Sans', value: 'Comic Sans MS' }
  ];

  const templates = [
    { id: 'standard', name: 'Standard Human', icon: FaUserCheck },
    { id: 'academic', name: 'Academic Human', icon: FaUserGraduate },
    { id: 'creative', name: 'Creative Human', icon: FaMagic },
    { id: 'professional', name: 'Professional Human', icon: FaFileContract },
    { id: 'casual', name: 'Casual Conversation', icon: FaFileAlt },
    { id: 'story', name: 'Storytelling', icon: FaPenNib },
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

  // --- Editor Functions ---

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
    
    setIsGenerating(true);
    setEditedContent(''); // Clear for streaming
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const uid = user?.id || "0a147ebe-af99-481b-bcaf-ae70c9aeb8d8";

      // Prepend instruction for humanization
      const augmentedPrompt = `Humanize the following text to make it sound more ${tone} and less AI-generated, using the ${activeTemplate} style: \n\n${prompt}`;

      const response = await fetch('https://n8n.matrixaiserver.com/webhook/086f4156-4b18-4ac3-b5e1-4ad96a86b896', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            uid,
            prompt: augmentedPrompt,
            contentType: 'humanizer', // specific type for tracking
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
      
      while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) {
              const chunkValue = decoder.decode(value, { stream: true });
              accumulatedRaw += chunkValue;
              
              // Split by potential JSON boundaries
              const parts = accumulatedRaw.split(/(?<=})\s*(?=\{)/);
              
              // If not done, keep the last part in buffer
              const partsToProcess = done ? parts : parts.slice(0, -1);
              
              if (!done) {
                  accumulatedRaw = parts[parts.length - 1];
              } else {
                  accumulatedRaw = '';
              }

              for (const part of partsToProcess) {
                  try {
                      const parsed = JSON.parse(part);
                      // Extract content based on n8n response structure
                      if (parsed.type === 'item' && parsed.content) {
                          accumulatedMarkdown += parsed.content;
                      } else if (parsed.content) {
                          accumulatedMarkdown += parsed.content;
                      }
                  } catch (e) {
                      // Skip invalid chunks
                  }
              }
              
              const htmlContent = renderToStaticMarkup(
                <ReactMarkdown 
                    remarkPlugins={[remarkGfm, remarkMath]} 
                    rehypePlugins={[rehypeRaw, rehypeKatex]}
                >
                    {accumulatedMarkdown}
                </ReactMarkdown>
              );
              setEditedContent(htmlContent);
          }
      }
      
      setHasUnsavedChanges(true);

    } catch (error) {
      console.error('Error generating content:', error);
      showError('Failed to humanize content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const selectTemplate = (templateId: string) => {
    setActiveTemplate(templateId);
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
        pdf.save('humanized-content.pdf');
    } catch (error) {
        console.error('Error exporting PDF:', error);
    }
  };

  const handleCopyContent = () => {
      if (!editorRef.current) return;
      navigator.clipboard.writeText(editorRef.current.innerText);
      showSuccess('Content copied to clipboard!');
  };

  const handleDeleteHistory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this history item?')) return;
    
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      
      let query = supabase
        .from('user_content')
        .delete();
      
      if (isUuid) {
        query = query.eq('id', id);
      } else {
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
      showSuccess('History item deleted');
    } catch (error) {
      console.error('Error deleting history:', error);
      showError('Failed to delete history item');
    }
  };

  const loadFromHistory = (item: any) => {
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

  useEffect(() => {
    if (isGenerating && isMobile) {
      setMobileTab('editor');
    }
  }, [isGenerating, isMobile]);

  return (
    <div className="h-screen bg-[#050505] text-white flex font-sans overflow-hidden relative selection:bg-indigo-500/30">
      
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
        className="fixed inset-y-0 left-0 z-50 lg:relative lg:z-0 shadow-2xl lg:shadow-none h-full border-r border-white/5 bg-[#0a0a0a]"
      />

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full relative overflow-hidden z-10">
        
        {/* Header / Mobile Nav */}
        <header className="h-16 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl flex items-center justify-between px-4 lg:px-6 shrink-0 z-20">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setIsLeftSidebarOpen(!isLeftSidebarOpen)} 
                    className="lg:hidden w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors"
                >
                    <IconComponent icon={FiMenu} className="w-5 h-5" />
                </button>
                <h1 className="text-lg lg:text-xl font-bold text-white flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <FaUserCheck size={14} className="text-white" />
                    </div>
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Humanizer</span>
                </h1>
            </div>

            {/* Mobile Tab Switcher */}
            <div className="flex lg:hidden bg-white/5 p-1 rounded-full border border-white/5 relative">
                <div 
                    className={`absolute inset-y-1 rounded-full bg-indigo-600 shadow-lg shadow-indigo-500/20 transition-all duration-300 ease-out ${mobileTab === 'generator' ? 'left-1 w-[calc(50%-4px)]' : 'left-[calc(50%)] w-[calc(50%-4px)]'}`}
                />
                <button 
                    onClick={() => setMobileTab('generator')}
                    className={`relative z-10 px-5 py-1.5 text-xs font-semibold rounded-full transition-colors ${mobileTab === 'generator' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                >
                    Input
                </button>
                <button 
                    onClick={() => setMobileTab('editor')}
                    className={`relative z-10 px-5 py-1.5 text-xs font-semibold rounded-full transition-colors ${mobileTab === 'editor' ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                >
                    Result
                </button>
            </div>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-3">
                 <button 
                  onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all ${isHistoryOpen ? 'bg-white/10 text-white' : ''}`}
                  title="History"
                >
                   <FaHistory size={14} />
                   <span>History</span>
                </button>
            </div>
        </header>

        {/* Content Container */}
        <div className="flex-1 flex overflow-hidden relative">
            
            {/* GENERATOR PANEL (Left) */}
            <div className={`${mobileTab === 'generator' ? 'flex' : 'hidden'} lg:flex w-full lg:w-[400px] flex-col border-r border-white/5 bg-[#0a0a0a] relative z-10`}>
                <div className="flex-1 overflow-y-auto p-5 lg:p-8 space-y-8 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
                    
                    {/* Prompt Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                                <FaMagic className="text-indigo-400" size={12} />
                                Text to Humanize
                            </label>
                            {prompt && (
                                <button 
                                    onClick={() => setPrompt('')}
                                    className="text-xs text-gray-500 hover:text-white transition-colors"
                                >
                                    Clear
                                </button>
                            )}
                        </div>
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl opacity-0 group-focus-within:opacity-20 transition duration-500 blur"></div>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Paste the AI-generated text you want to humanize here..."
                                className="relative w-full p-5 bg-white/[0.03] border border-white/10 rounded-2xl focus:outline-none focus:border-indigo-500/30 text-sm leading-relaxed min-h-[160px] resize-none placeholder-gray-600 text-gray-200 transition-all shadow-inner"
                            />
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Tone</label>
                            <div className="relative group">
                                <select 
                                    value={tone}
                                    onChange={(e) => setTone(e.target.value)}
                                    className="w-full appearance-none p-3 pl-4 pr-10 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-gray-200 outline-none focus:border-indigo-500/30 focus:bg-white/[0.05] transition-all cursor-pointer shadow-sm"
                                >
                                    <option value="natural">Natural</option>
                                    <option value="professional">Professional</option>
                                    <option value="casual">Casual</option>
                                    <option value="academic">Academic</option>
                                    <option value="enthusiastic">Enthusiastic</option>
                                </select>
                                <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 text-xs pointer-events-none group-hover:text-gray-400 transition-colors" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Target Length</label>
                            <div className="relative group">
                                <input 
                                    type="number"
                                    value={targetWordCount}
                                    onChange={(e) => setTargetWordCount(Number(e.target.value))}
                                    className="w-full p-3 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-gray-200 outline-none focus:border-indigo-500/30 focus:bg-white/[0.05] transition-all shadow-sm"
                                    step={100}
                                    min={100}
                                    max={3000}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-600 font-medium">words</span>
                            </div>
                        </div>
                    </div>

                    {/* Generate Button */}
                    <button
                        onClick={handleGenerateContent}
                        disabled={isGenerating || !prompt.trim()}
                        className="w-full py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] hover:bg-right text-white rounded-xl font-bold shadow-xl shadow-indigo-500/20 transition-all duration-500 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden transform hover:-translate-y-0.5"
                    >
                        {isGenerating ? <FiRefreshCw className="animate-spin text-lg" /> : <FaUserCheck className="text-lg group-hover:scale-110 transition-transform" />}
                        <span className="relative tracking-wide">{isGenerating ? 'Humanizing...' : 'Humanize Text'}</span>
                    </button>

                    {/* Templates Grid */}
                    <div className="pt-6 border-t border-white/5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Style</h3>
                            <span className="text-[10px] bg-white/5 px-2 py-1 rounded-md text-gray-500">Select</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {templates.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => selectTemplate(t.id)}
                                    className={`p-4 rounded-xl border text-left transition-all group relative overflow-hidden flex flex-col gap-3 ${activeTemplate === t.id ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]'}`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${activeTemplate === t.id ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-white/5 text-gray-500 group-hover:bg-white/10 group-hover:text-gray-300'} transition-all duration-300`}>
                                        <t.icon size={14} />
                                    </div>
                                    <div>
                                        <span className={`block text-xs font-bold mb-0.5 ${activeTemplate === t.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>{t.name}</span>
                                        <span className="block text-[10px] text-gray-600 group-hover:text-gray-500">Select style</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* EDITOR PANEL (Right) */}
            <div className={`${mobileTab === 'editor' ? 'flex' : 'hidden'} lg:flex flex-1 relative bg-[#050505] flex-col h-full overflow-hidden`}>
                
                {/* Editor Top Bar (Toolbar) */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 max-w-[95%] w-fit transition-all duration-300">
                    <div className="rounded-2xl px-2 py-1.5 border border-white/10 shadow-2xl backdrop-blur-xl bg-[#151515]/90 flex items-center gap-1 overflow-x-auto scrollbar-none max-w-full">
                        {/* Font Family */}
                        <div className="relative group/font">
                            <button 
                                onClick={() => setActivePopup(activePopup === 'font' ? null : 'font')}
                                className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-300 hover:bg-white/10 hover:text-white rounded-xl transition-all"
                            >
                                <span className="max-w-[80px] truncate">{currentFont.name}</span>
                                <FaChevronDown size={8} className="opacity-50" />
                            </button>
                            {activePopup === 'font' && (
                                <div className="absolute top-full left-0 mt-2 py-1 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 w-48 backdrop-blur-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                    {fonts.map((font) => (
                                        <button
                                            key={font.value}
                                            onClick={() => {
                                                execCmd('fontName', font.value);
                                                setCurrentFont(font);
                                                setActivePopup(null);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors font-medium"
                                            style={{ fontFamily: font.value }}
                                        >
                                            {font.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="w-px h-6 bg-white/10 mx-1" />

                        <ToolbarButton icon={<FaBold />} command="bold" label="B" />
                        <ToolbarButton icon={<FaItalic />} command="italic" label="I" />
                        <ToolbarButton icon={<FaUnderline />} command="underline" label="U" />
                        
                        <div className="w-px h-6 bg-white/10 mx-1" />
                        
                        <ToolbarButton icon={<FaAlignLeft />} command="justifyLeft" />
                        <ToolbarButton icon={<FaAlignCenter />} command="justifyCenter" />
                        <ToolbarButton icon={<FaAlignRight />} command="justifyRight" />

                        <div className="w-px h-6 bg-white/10 mx-1" />

                        <ToolbarButton icon={<FaListUl />} command="insertUnorderedList" />
                        <ToolbarButton icon={<FaListOl />} command="insertOrderedList" />

                        <div className="w-px h-6 bg-white/10 mx-1" />
                        
                        <div className="relative">
                            <ToolbarButton icon={<FaLink />} onClick={() => openPopup('link')} />
                            {activePopup === 'link' && (
                                <form onSubmit={handlePopupSubmit} className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 flex items-center gap-2 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
                                    <input
                                        type="url"
                                        value={popupValue}
                                        onChange={(e) => setPopupValue(e.target.value)}
                                        placeholder="https://..."
                                        className="bg-black/20 border border-white/10 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:border-indigo-500/50 w-48"
                                        autoFocus
                                    />
                                    <button type="submit" className="p-1 bg-indigo-600 rounded-lg text-white hover:bg-indigo-500">
                                        <FaLink size={12} />
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>

                {/* Editor Content Area */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-12 relative" onClick={() => editorRef.current?.focus()}>
                    <div className="max-w-[850px] mx-auto bg-white min-h-[1000px] shadow-2xl rounded-xl overflow-hidden relative group">
                         {/* Paper Texture/Effects */}
                         <div className="absolute inset-0 bg-white" />
                         <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none" />
                         
                         {/* Header/Title within Paper */}
                         <div className="relative px-12 pt-12 pb-4 border-b border-gray-100">
                            <h1 className="text-3xl font-bold text-gray-900 placeholder:text-gray-300 outline-none" contentEditable suppressContentEditableWarning>
                                {activeTemplate === 'standard' ? 'Humanized Content' : 
                                 activeTemplate === 'academic' ? 'Academic Rewrite' : 
                                 activeTemplate === 'creative' ? 'Creative Adaptation' : 
                                 'Untitled Document'}
                            </h1>
                            <div className="flex items-center gap-4 mt-4 text-xs text-gray-400 font-medium uppercase tracking-wider">
                                <span>{new Date().toLocaleDateString()}</span>
                                <span>•</span>
                                <span>{tone} Tone</span>
                            </div>
                         </div>

                         {/* Actual Editable Content */}
                         <div 
                            ref={editorRef}
                            contentEditable
                            className="relative px-12 py-8 text-gray-800 text-lg leading-relaxed outline-none min-h-[800px] prose prose-lg max-w-none prose-p:font-serif prose-headings:font-sans"
                            onInput={() => setHasUnsavedChanges(true)}
                            dangerouslySetInnerHTML={{ __html: editedContent }}
                            style={{ fontFamily: currentFont.value }}
                         />
                    </div>
                    <div className="h-20" /> {/* Bottom spacer */}
                </div>

                {/* Bottom Action Bar */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
                    <button 
                        onClick={handleCopyContent}
                        className="px-4 py-2 bg-[#1a1a1a]/80 backdrop-blur-md border border-white/10 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2 shadow-lg"
                    >
                        <FiCopy />
                        <span>Copy</span>
                    </button>
                    <button 
                        onClick={handleExportPdf}
                        className="px-4 py-2 bg-[#1a1a1a]/80 backdrop-blur-md border border-white/10 rounded-xl text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-all flex items-center gap-2 shadow-lg"
                    >
                        <FaFilePdf />
                        <span>PDF</span>
                    </button>
                    {hasUnsavedChanges && (
                         <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-lg text-xs font-medium text-green-400 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                            Editing
                         </div>
                    )}
                </div>
            </div>

            {/* HISTORY SIDEBAR (Right) */}
            <AnimatePresence>
                {isHistoryOpen && (
                    <motion.div 
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="absolute inset-y-0 right-0 z-50 w-full md:w-80 bg-[#0a0a0a] border-l border-white/5 shadow-2xl flex flex-col"
                    >
                        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#0f0f0f]">
                            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                <FaHistory className="text-indigo-500" />
                                History
                            </h2>
                            <button 
                                onClick={() => setIsHistoryOpen(false)}
                                className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <FiX />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10">
                            {contentHistory.length === 0 ? (
                                <div className="text-center py-10 text-gray-500 text-sm">
                                    No history found
                                </div>
                            ) : (
                                contentHistory.map((item) => (
                                    <div 
                                        key={item.id}
                                        onClick={() => loadFromHistory(item)}
                                        className="group p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer relative"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className="text-sm font-medium text-gray-200 line-clamp-1">{item.title}</h3>
                                            <button 
                                                onClick={(e) => handleDeleteHistory(item.id, e)}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-all"
                                                title="Delete"
                                            >
                                                <FaTrash size={10} />
                                            </button>
                                        </div>
                                        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{item.prompt}</p>
                                        <div className="flex items-center gap-2 text-[10px] text-gray-600">
                                            <span className="bg-black/20 px-1.5 py-0.5 rounded">{item.template}</span>
                                            <span>{item.date}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
      </main>
    </div>
  );
};

export default Humanizer;
