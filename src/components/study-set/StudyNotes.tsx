import React, { useRef, useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabase';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import { 
  FaChevronDown, FaBold, FaItalic, FaUnderline, FaStrikethrough, 
  FaListUl, FaListOl, FaQuoteRight, FaCode, FaMinus, FaImage, FaEraser,
  FaFilePdf, FaAlignLeft, FaAlignCenter, FaAlignRight, FaLink, FaHighlighter,
  FaSuperscript, FaSubscript, FaMagic, FaBook, FaSave
} from 'react-icons/fa';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Skeleton } from '../ui/Skeleton';

const StudyNotes: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const location = useLocation();
    const studySetData = location.state?.studySetData;
    const editorRef = useRef<HTMLDivElement>(null);
    const [activePopup, setActivePopup] = React.useState<'link' | 'image' | 'font' | null>(null);
    const [popupValue, setPopupValue] = React.useState('');
    const savedSelection = useRef<Range | null>(null);

    const [notesContent, setNotesContent] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const fonts = [
        { name: 'Sans Serif', value: 'Arial' },
        { name: 'Serif', value: 'Times New Roman' },
        { name: 'Monospace', value: 'Courier New' },
        { name: 'Georgia', value: 'Georgia' },
        { name: 'Verdana', value: 'Verdana' },
        { name: 'Comic Sans', value: 'Comic Sans MS' }
    ];
    const [currentFont, setCurrentFont] = useState(fonts[0]);

    useEffect(() => {
        // We prioritize fetching fresh data from Supabase over navigation state
        // if (studySetData?.document_text) {
        //     setNotesContent(studySetData.document_text);
        //     setLoading(false);
        //     return;
        // }

        let intervalId: NodeJS.Timeout;
        let isMounted = true;

        const fetchData = async () => {
            if (!id || !user) return;

            try {
                const { data, error } = await supabase
                    .from('notes_tools')
                    .select('notes_data')
                    .eq('document_id', id)
                    .eq('uid', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.error('Error fetching data:', error);
                }

                if (isMounted) {
                    if (data && data.notes_data) {
                        // Handle if notes_data is a string or an object with content
                        let content = typeof data.notes_data === 'string' 
                            ? data.notes_data 
                            : (data.notes_data.content || data.notes_data.note || JSON.stringify(data.notes_data));
                        
                        // Parse Markdown if it looks like markdown
                        if (typeof content === 'string' && !content.trim().startsWith('<') && (content.includes('#') || content.includes('**') || content.includes('- ') || content.includes('|') || content.includes('\\(') || content.includes('\\['))) {
                            try {
                                // Preprocess LaTeX to convert various formats to react-markdown compatible format
                                const preprocessLaTeX = (text: string) => {
                                    if (typeof text !== 'string') return '';
                                    return text
                                        // Standard LaTeX block \[ ... \] -> $$ ... $$
                                        .replace(/\\\[([\s\S]*?)\\\]/g, (_, eq) => `$$${eq}$$`)
                                        // Standard LaTeX inline \( ... \) -> $ ... $
                                        .replace(/\\\(([\s\S]*?)\\\)/g, (_, eq) => `$${eq}$`)
                                        // Heuristic: [ \command... ] -> $$ \command... $$ (matches likely block math without standard delimiters)
                                        .replace(/\[\s*(\\frac|\\boxed|\\begin|\\sum|\\int|\\partial|\\sqrt|\\mathbf|\\mathrm|\\mathcal|\\mathscr|\\mathfrak|\\mathbb|\\sin|\\cos|\\tan)([\s\S]*?)\]/g, (match, cmd, rest) => `$$${cmd}${rest}$$`);
                                };

                                content = renderToStaticMarkup(
                                    <ReactMarkdown 
                                        remarkPlugins={[remarkGfm, remarkMath]} 
                                        rehypePlugins={[rehypeRaw, rehypeKatex]}
                                        components={{
                                            h1: ({node, ...props}) => <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 mt-6 border-b border-gray-200 dark:border-gray-700 pb-2" {...props} />,
                                            h2: ({node, ...props}) => <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3 mt-5" {...props} />,
                                            h3: ({node, ...props}) => <h3 className="text-xl font-medium text-gray-800 dark:text-gray-200 mb-2 mt-4" {...props} />,
                                            ul: ({node, ...props}) => <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300" {...props} />,
                                            ol: ({node, ...props}) => <ol className="list-decimal pl-6 space-y-2 text-gray-700 dark:text-gray-300" {...props} />,
                                            li: ({node, ...props}) => <li className="pl-1" {...props} />,
                                            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-indigo-500 pl-4 italic text-gray-600 dark:text-gray-400 my-4" {...props} />,
                                            table: ({node, ...props}) => <div className="overflow-x-auto my-6"><table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700 border border-gray-300 dark:border-gray-700 rounded-lg" {...props} /></div>,
                                            thead: ({node, ...props}) => <thead className="bg-gray-100 dark:bg-gray-800" {...props} />,
                                            th: ({node, ...props}) => <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider border-b border-gray-300 dark:border-gray-700" {...props} />,
                                            td: ({node, ...props}) => <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 border-b border-gray-300 dark:border-gray-700" {...props} />,
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
                                        {preprocessLaTeX(content)}
                                    </ReactMarkdown>
                                );
                            } catch (e) {
                                console.error('Error rendering markdown:', e);
                                // Fallback to raw content if rendering fails
                            }
                        }

                        setNotesContent(content);
                        setLoading(false);
                        setIsGenerating(false);
                        if (intervalId) clearInterval(intervalId);
                    } else {
                        // Data not ready yet, keep polling
                        setIsGenerating(true);
                        setLoading(false);
                    }
                }
            } catch (err) {
                console.error('Unexpected error:', err);
            }
        };

        fetchData();
        intervalId = setInterval(fetchData, 3000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [id, user]);

    const execCmd = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        if (editorRef.current) {
            editorRef.current.focus();
        }
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
        if (activePopup === 'link') {
            execCmd('createLink', popupValue);
        } else if (activePopup === 'image') {
            execCmd('insertImage', popupValue);
        }
        setActivePopup(null);
        setPopupValue('');
    };

    const openPopup = (type: 'link' | 'image') => {
        saveSelection();
        setActivePopup(type);
        setPopupValue('');
    };

    const handleExportPdf = async () => {
        if (!editorRef.current) return;
        
        try {
            const isDarkMode = document.documentElement.classList.contains('dark');
            const canvas = await html2canvas(editorRef.current, { 
                scale: 2,
                backgroundColor: isDarkMode ? '#111111' : '#ffffff', // Match theme
                useCORS: true
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
            
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save('study-notes.pdf');
        } catch (error) {
            console.error('Error exporting PDF:', error);
        }
    };

    const handleSave = async () => {
        if (!editorRef.current || !user || !id) return;
        
        setIsSaving(true);
        try {
            const content = editorRef.current.innerHTML;
            
            const { error } = await supabase
                .from('notes_tools')
                .update({ 
                    notes_data: { content: content }
                })
                .eq('document_id', id)
                .eq('uid', user.id);

            if (error) throw error;
            
            // Optional: show a small indicator or toast
            // console.log('Notes saved successfully');
        } catch (err) {
            console.error('Error saving notes:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const ToolbarButton = ({ icon, command, value, label, onClick }: { icon: React.ReactNode, command?: string, value?: string, label?: string, onClick?: () => void }) => (
        <button 
            onMouseDown={(e) => {
                e.preventDefault();
                if (onClick) {
                    onClick();
                } else if (command) {
                    execCmd(command, value);
                }
            }}
            className={`p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded flex-shrink-0 transition-colors flex items-center gap-1 ${activePopup && (command === 'createLink' || command === 'insertImage') ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white' : ''}`}
            title={label || command}
        >
            {icon}
            {label && <span className="text-xs font-bold">{label}</span>}
        </button>
    );

    return (
        <div className="h-full relative">
            {/* Floating Toolbar */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-center pointer-events-none">
                <div className="max-w-3xl w-full relative pointer-events-auto">
                    {/* Glassmorphism Toolbar */}
                    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-2xl backdrop-blur-md bg-white/80 dark:bg-[#1a1a1a]/80 supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-[#1a1a1a]/60">
                        <div className="flex items-center gap-1 p-2 overflow-x-auto scrollbar-none">
                            {/* Font Style Dropdown */}
                            <div className="relative">
                                <ToolbarButton 
                                    icon={<div className="flex items-center gap-1"><span className="text-xs font-bold whitespace-nowrap">{currentFont.name}</span><FaChevronDown size={8} /></div>}
                                    onClick={() => setActivePopup(activePopup === 'font' ? null : 'font')}
                                />
                                {activePopup === 'font' && (
                                    <div className="absolute top-full left-0 mt-2 p-1 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl z-50 w-40 backdrop-blur-md">
                                        {fonts.map((font) => (
                                            <button
                                                key={font.value}
                                                onClick={() => {
                                                    execCmd('fontName', font.value);
                                                    setCurrentFont(font);
                                                    setActivePopup(null);
                                                }}
                                                className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded transition-colors"
                                                style={{ fontFamily: font.value }}
                                            >
                                                {font.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1 flex-shrink-0"></div>
                            
                            {/* Basic Formatting */}
                            <ToolbarButton icon={<FaBold size={12} />} command="bold" />
                            <ToolbarButton icon={<FaItalic size={12} />} command="italic" />
                            <ToolbarButton icon={<FaUnderline size={12} />} command="underline" />
                            <ToolbarButton icon={<FaStrikethrough size={12} />} command="strikeThrough" />
                            <ToolbarButton icon={<FaHighlighter size={12} />} command="hiliteColor" value="yellow" />
                            
                            <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1 flex-shrink-0"></div>
                            
                            {/* Headings */}
                            <ToolbarButton icon={<FaChevronDown size={8} />} label="H1" command="formatBlock" value="H1" />
                            <ToolbarButton icon={<FaChevronDown size={8} />} label="H2" command="formatBlock" value="H2" />
                            
                            <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1 flex-shrink-0"></div>
                            
                            {/* Lists & Indent */}
                            <ToolbarButton icon={<FaListUl size={12} />} command="insertUnorderedList" />
                            <ToolbarButton icon={<FaListOl size={12} />} command="insertOrderedList" />
                            <ToolbarButton icon={<FaQuoteRight size={12} />} command="formatBlock" value="blockquote" />
                            
                            <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1 flex-shrink-0"></div>
                            
                            {/* Alignment */}
                            <ToolbarButton icon={<FaAlignLeft size={12} />} command="justifyLeft" />
                            <ToolbarButton icon={<FaAlignCenter size={12} />} command="justifyCenter" />
                            <ToolbarButton icon={<FaAlignRight size={12} />} command="justifyRight" />
                            
                            <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1 flex-shrink-0"></div>
                            
                            {/* Special */}
                            <ToolbarButton icon={<FaLink size={12} />} onClick={() => openPopup('link')} />
                            <ToolbarButton icon={<FaCode size={12} />} command="formatBlock" value="pre" />
                            <ToolbarButton icon={<FaSuperscript size={12} />} command="superscript" />
                            <ToolbarButton icon={<FaSubscript size={12} />} command="subscript" />
                            <ToolbarButton icon={<FaMinus size={12} />} command="insertHorizontalRule" />
                            <ToolbarButton icon={<FaImage size={12} />} onClick={() => openPopup('image')} />
                            
                            <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1 flex-shrink-0"></div>
                            
                            {/* Actions */}
                            <ToolbarButton icon={<FaEraser size={12} />} command="removeFormat" />
                            <button 
                                onClick={handleSave}
                                disabled={isSaving}
                                className="p-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded flex-shrink-0 transition-colors ml-auto flex items-center gap-2 disabled:opacity-50"
                                title="Save Notes"
                            >
                                <FaSave size={12} className={isSaving ? 'animate-spin' : ''} />
                                <span className="text-xs font-bold">{isSaving ? 'Saving...' : 'Save'}</span>
                            </button>
                            <button 
                                onClick={handleExportPdf}
                                className="p-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded flex-shrink-0 transition-colors flex items-center gap-2"
                                title="Export PDF"
                            >
                                <FaFilePdf size={12} />
                                <span className="text-xs font-bold">Export PDF</span>
                            </button>
                        </div>
                    </div>

                    {/* Popup for Link/Image */}
                    {activePopup && (
                        <div className="absolute top-full left-0 mt-2 p-3 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl z-50 flex items-center gap-2 w-64 backdrop-blur-md">
                            <form onSubmit={handlePopupSubmit} className="flex items-center gap-2 w-full">
                                <input
                                    type="text"
                                    value={popupValue}
                                    onChange={(e) => setPopupValue(e.target.value)}
                                    placeholder={activePopup === 'link' ? "Enter URL..." : "Enter Image URL..."}
                                    className="flex-1 bg-gray-100 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded px-2 py-1 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                                    autoFocus
                                />
                                <button 
                                    type="submit"
                                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded font-medium transition-colors"
                                >
                                    Add
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setActivePopup(null)}
                                    className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                >
                                    <FaMinus size={10} className="rotate-45" />
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="h-full overflow-y-auto px-8 pb-8 pt-24 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-800 scrollbar-track-transparent overscroll-contain">
                <div className="max-w-3xl mx-auto w-full min-h-full">
                    {isGenerating ? (
                        <div className="flex flex-col items-center justify-center h-full pt-20">
                            <div className="relative">
                                <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                                <FaMagic className="relative text-5xl text-indigo-500 dark:text-indigo-400 mb-6 animate-bounce" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Generating with AI magic...</h2>
                            <p className="text-gray-500 dark:text-gray-400 max-w-md text-center">
                                We're crafting your study notes. This usually takes just a moment!
                            </p>
                        </div>
                    ) : loading ? (
                        <div className="space-y-6 pt-6">
                            <Skeleton width="60%" height={48} className="mb-8" />
                            <div className="space-y-3">
                                <Skeleton width="100%" height={20} />
                                <Skeleton width="100%" height={20} />
                                <Skeleton width="90%" height={20} />
                            </div>
                            <Skeleton width="40%" height={32} className="mt-8 mb-4" />
                            <div className="space-y-3">
                                <Skeleton width="100%" height={20} />
                                <Skeleton width="95%" height={20} />
                                <Skeleton width="98%" height={20} />
                            </div>
                            <div className="space-y-4 mt-8">
                                <Skeleton width="100%" height={20} />
                                <div className="pl-6 space-y-2">
                                    <Skeleton width="80%" height={20} />
                                    <Skeleton width="75%" height={20} />
                                    <Skeleton width="85%" height={20} />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div 
                            ref={editorRef}
                            className="prose prose-gray dark:prose-invert max-w-none focus:outline-none pb-20 min-h-[300px]"
                            contentEditable={true}
                            suppressContentEditableWarning={true}
                            dangerouslySetInnerHTML={{ __html: notesContent }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudyNotes;
