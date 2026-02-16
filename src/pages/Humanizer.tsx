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
  FaChevronLeft, FaChevronRight, FaTimes, FaTrash, FaGlobe, FaBriefcase, FaSync
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
  const [tone, setTone] = useState('Standard');
  const [targetWordCount, setTargetWordCount] = useState(500);

  // New State Variables
  const [detector, setDetector] = useState('turnitin');
  const [rephrase, setRephrase] = useState(true);
  const [mode, setMode] = useState('Medium');
  const [business, setBusiness] = useState(false);
  const [isMultilingual, setIsMultilingual] = useState(false);
  
  const supportedDetectors = [ 
    'turnitin', 'originality', 'zerogpt', 'winston', 'copyleaks', 'sapling', 'gptzero', 'writer' 
  ];

  const modes = ['Low', 'Medium', 'High', 'Aggressive'];

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
        .from('user_humanization')
        .select('*')
        .eq('uid', user.id)
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
          content: item.humanized_text,
          template: item.tags && item.tags.length > 0 ? item.tags[0] : 'Standard', // Use tag or default
          prompt: item.original_text
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

  const [inputCharCount, setInputCharCount] = useState(0);

  useEffect(() => {
    setInputCharCount(prompt.length);
  }, [prompt]);

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
    if (prompt.length > 10000) {
        showError('Character limit exceeded (max 10,000)');
        return;
    }
    
    setIsGenerating(true);
    setEditedContent(''); // Clear for streaming
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const uid = user?.id || "0a147ebe-af99-481b-bcaf-ae70c9aeb8d8";

      // Using the new API endpoint
      const response = await fetch('http://localhost:8000/api/humanizer/createHumanization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            uid,
            timestamp: new Date().toISOString().replace('T', ' ').replace('Z', ''), // Formatting to match example roughly if needed, or ISO
            prompt,
            rephrase,
            tone,
            mode,
            business,
            isMultilingual,
            detector
        })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Assuming the API returns the humanized text in a field like 'humanized_text' or 'result' or just 'text'
      // Since the user didn't specify the response format, I'll look for common fields
      let generatedText = '';
      if (data.humanized_text) generatedText = data.humanized_text;
      else if (data.text) generatedText = data.text;
      else if (data.result) generatedText = data.result;
      else if (typeof data === 'string') generatedText = data;
      else generatedText = JSON.stringify(data); // Fallback

      const htmlContent = renderToStaticMarkup(
        <ReactMarkdown 
            remarkPlugins={[remarkGfm, remarkMath]} 
            rehypePlugins={[rehypeRaw, rehypeKatex]}
        >
            {generatedText}
        </ReactMarkdown>
      );
      setEditedContent(htmlContent);
      setHasUnsavedChanges(true);
      
      // Refresh history
      fetchHistory();

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
      const { error } = await supabase
        .from('user_humanization')
        .delete()
        .eq('id', id);

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

        {/* Content Container - Split View */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative p-4 lg:p-6 gap-4 lg:gap-6">
            
            {/* LEFT PANEL: INPUT & CONTROLS */}
            <div className={`${mobileTab === 'generator' ? 'flex' : 'hidden'} lg:flex w-full lg:w-1/2 flex-col gap-4 relative z-10 h-full overflow-y-auto`}>
                
                {/* Input Card */}
                <div className="flex-1 bg-[#111] border border-white/10 rounded-2xl p-1 flex flex-col shadow-xl min-h-[300px]">
                    <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></span>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Source Content</span>
                         </div>
                         <div className="flex items-center gap-3">
                            <span className={`text-xs font-mono ${inputCharCount > 10000 ? 'text-red-500' : 'text-gray-500'}`}>
                                {inputCharCount}/10000 chars
                            </span>
                            {prompt && (
                                <button 
                                    onClick={() => setPrompt('')}
                                    className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1"
                                >
                                    <FaTrash size={10} /> Clear
                                </button>
                            )}
                         </div>
                    </div>
                    <textarea
                        value={prompt}
                        onChange={(e) => {
                            if (e.target.value.length <= 10000) {
                                setPrompt(e.target.value);
                            }
                        }}
                        placeholder="Paste the AI-generated text you want to humanize here..."
                        className="flex-1 w-full p-4 bg-transparent border-none focus:ring-0 resize-none text-gray-300 placeholder-gray-600 text-sm leading-relaxed scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20"
                        spellCheck={false}
                    />
                </div>

                {/* Controls Card */}
                <div className="bg-[#111] border border-white/10 rounded-2xl p-5 shadow-xl space-y-5 shrink-0">
                    
                    <div className="grid grid-cols-2 gap-4">
                        {/* Detector Select */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Detector</label>
                            <div className="relative group">
                                <select 
                                    value={detector}
                                    onChange={(e) => setDetector(e.target.value)}
                                    className="w-full appearance-none p-3 pl-4 pr-10 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-gray-200 outline-none focus:border-indigo-500/30 focus:bg-white/[0.05] transition-all cursor-pointer shadow-sm hover:border-indigo-500/30 capitalize"
                                >
                                    {supportedDetectors.map(d => (
                                        <option key={d} value={d}>{d}</option>
                                    ))}
                                </select>
                                <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 text-xs pointer-events-none group-hover:text-indigo-400 transition-colors" />
                            </div>
                        </div>

                        {/* Mode Select */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Mode</label>
                            <div className="relative group">
                                <select 
                                    value={mode}
                                    onChange={(e) => setMode(e.target.value)}
                                    className="w-full appearance-none p-3 pl-4 pr-10 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-gray-200 outline-none focus:border-indigo-500/30 focus:bg-white/[0.05] transition-all cursor-pointer shadow-sm hover:border-indigo-500/30"
                                >
                                    {modes.map(m => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                                <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 text-xs pointer-events-none group-hover:text-indigo-400 transition-colors" />
                            </div>
                        </div>

                        {/* Tone Select */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider pl-1">Tone</label>
                            <div className="relative group">
                                <select 
                                    value={tone}
                                    onChange={(e) => setTone(e.target.value)}
                                    className="w-full appearance-none p-3 pl-4 pr-10 bg-white/[0.03] border border-white/10 rounded-xl text-sm text-gray-200 outline-none focus:border-indigo-500/30 focus:bg-white/[0.05] transition-all cursor-pointer shadow-sm hover:border-indigo-500/30"
                                >
                                    <option value="Standard">Standard</option>
                                    <option value="Natural">Natural</option>
                                    <option value="Professional">Professional</option>
                                    <option value="Casual">Casual</option>
                                    <option value="Academic">Academic</option>
                                </select>
                                <FaChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 text-xs pointer-events-none group-hover:text-indigo-400 transition-colors" />
                            </div>
                        </div>
                    </div>

                    {/* Toggles */}
                    <div className="flex flex-wrap gap-4 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div className={`w-10 h-6 rounded-full p-1 transition-colors ${rephrase ? 'bg-indigo-600' : 'bg-white/10'}`}>
                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${rephrase ? 'translate-x-4' : 'translate-x-0'}`} />
                            </div>
                            <input type="checkbox" checked={rephrase} onChange={e => setRephrase(e.target.checked)} className="hidden" />
                            <span className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors">Rephrase</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div className={`w-10 h-6 rounded-full p-1 transition-colors ${business ? 'bg-indigo-600' : 'bg-white/10'}`}>
                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${business ? 'translate-x-4' : 'translate-x-0'}`} />
                            </div>
                            <input type="checkbox" checked={business} onChange={e => setBusiness(e.target.checked)} className="hidden" />
                            <span className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors">Business</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isMultilingual ? 'bg-indigo-600' : 'bg-white/10'}`}>
                                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${isMultilingual ? 'translate-x-4' : 'translate-x-0'}`} />
                            </div>
                            <input type="checkbox" checked={isMultilingual} onChange={e => setIsMultilingual(e.target.checked)} className="hidden" />
                            <span className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors">Multilingual</span>
                        </label>
                    </div>

                    <button
                        onClick={handleGenerateContent}
                        disabled={isGenerating || !prompt.trim() || prompt.length > 10000}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2 group relative overflow-hidden"
                    >
                        {isGenerating ? (
                            <>
                                <FiRefreshCw className="animate-spin" />
                                <span>Humanizing...</span>
                            </>
                        ) : (
                            <>
                                <FaMagic className="group-hover:rotate-12 transition-transform" />
                                <span>Humanize Text</span>
                            </>
                        )}
                        
                        {/* Shimmer effect */}
                        {!isGenerating && <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent z-10" />}
                    </button>

                </div>
            </div>

            {/* RIGHT PANEL: OUTPUT */}
            <div className={`${mobileTab === 'editor' ? 'flex' : 'hidden'} lg:flex w-full lg:w-1/2 flex-col relative z-10 h-full`}>
                <div className="flex-1 bg-[#111] border border-white/10 rounded-2xl flex flex-col shadow-xl overflow-hidden relative">
                    
                    {/* Output Header */}
                    <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-white/[0.02] shrink-0">
                        <div className="flex items-center gap-2">
                             <div className={`w-2 h-2 rounded-full ${editedContent ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-gray-600'}`}></div>
                             <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Humanized Result</span>
                        </div>
                        
                        {/* Minimal Toolbar */}
                        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-0.5 border border-white/5">
                            <ToolbarButton icon={<FaBold size={12} />} command="bold" label="" />
                            <ToolbarButton icon={<FaItalic size={12} />} command="italic" label="" />
                            <ToolbarButton icon={<FaUnderline size={12} />} command="underline" label="" />
                            <div className="w-px h-4 bg-white/10 mx-1"></div>
                            <ToolbarButton icon={<FaListUl size={12} />} command="insertUnorderedList" label="" />
                        </div>

                        <div className="flex items-center gap-2">
                             <button 
                                onClick={handleCopyContent}
                                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                title="Copy"
                             >
                                <FiCopy size={14} />
                             </button>
                             <button 
                                onClick={handleExportPdf}
                                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                title="Export PDF"
                             >
                                <FaFilePdf size={14} />
                             </button>
                        </div>
                    </div>

                    {/* Output Content */}
                    <div className="flex-1 relative bg-[#0a0a0a] overflow-hidden">
                        {!editedContent && !isGenerating ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 p-8 text-center">
                                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                                    <FaUserCheck size={24} className="text-gray-600" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-400 mb-2">Ready to Humanize</h3>
                                <p className="text-sm text-gray-600 max-w-xs">Paste your AI-generated text on the left and click "Humanize Text" to get started.</p>
                            </div>
                        ) : (
                            <div 
                                ref={editorRef}
                                className="absolute inset-0 p-6 lg:p-8 overflow-y-auto focus:outline-none prose prose-invert prose-sm lg:prose-base max-w-none scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20"
                                contentEditable
                                suppressContentEditableWarning
                                onInput={(e) => {
                                    setEditedContent(e.currentTarget.innerHTML);
                                    setHasUnsavedChanges(true);
                                }}
                                dangerouslySetInnerHTML={{ __html: editedContent }}
                                style={{ fontFamily: currentFont.value }}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* History Panel (Slide-over) */}
             <AnimatePresence>
                {isHistoryOpen && (
                    <motion.div
                        initial={{ x: '100%', opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: '100%', opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="absolute inset-y-0 right-0 z-50 w-full lg:w-80 bg-[#111] border-l border-white/10 shadow-2xl"
                    >
                        <div className="flex flex-col h-full">
                            <div className="p-4 border-b border-white/5 flex items-center justify-center relative">
                                <h3 className="font-semibold text-white flex items-center gap-2">
                                    <FaHistory className="text-indigo-400" />
                                    History
                                </h3>
                                <button 
                                    onClick={() => setIsHistoryOpen(false)}
                                    className="absolute right-4 p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg"
                                >
                                    <FiX />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {contentHistory.length === 0 ? (
                                    <div className="text-center text-gray-500 py-10">
                                        <p className="text-sm">No history yet.</p>
                                    </div>
                                ) : (
                                    contentHistory.map((item) => (
                                        <div 
                                            key={item.id}
                                            onClick={() => loadFromHistory(item)}
                                            className="group p-3 rounded-xl bg-white/5 border border-white/5 hover:border-indigo-500/30 hover:bg-white/10 transition-all cursor-pointer relative"
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="text-sm font-medium text-gray-200 line-clamp-1 pr-6">{item.prompt || 'Untitled'}</h4>
                                                <button 
                                                    onClick={(e) => handleDeleteHistory(item.id, e)}
                                                    className="text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 absolute right-2 top-2"
                                                >
                                                    <FaTrash size={12} />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <span>{item.date}</span>
                                                <span>•</span>
                                                <span className="capitalize">{item.template}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
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
