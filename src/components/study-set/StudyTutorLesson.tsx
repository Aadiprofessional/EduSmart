import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabase';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeRaw from 'rehype-raw';
import rehypeKatex from 'rehype-katex';
import { 
    FaMagic, FaCopy, FaShareAlt, FaEllipsisV, FaEdit,
    FaChevronDown, FaBold, FaItalic, FaUnderline, FaStrikethrough,
    FaListUl, FaListOl, FaQuoteRight, FaCode, FaMinus, FaEraser,
    FaAlignLeft, FaAlignCenter, FaAlignRight, FaLink, FaHighlighter,
    FaSuperscript, FaSubscript, FaSave
} from 'react-icons/fa';
import { Skeleton } from '../ui/Skeleton';

const StudyTutorLesson: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [lessonContent, setLessonContent] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<HTMLDivElement>(null);

    // Edit mode state
    const [isEditMode, setIsEditMode] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editableHtml, setEditableHtml] = useState<string>('');
    const menuRef = useRef<HTMLDivElement>(null);

    // Toolbar state
    const [activePopup, setActivePopup] = React.useState<'link' | 'font' | null>(null);
    const [popupValue, setPopupValue] = React.useState('');
    const savedSelection = useRef<Range | null>(null);
    const fonts = [
        { name: 'Sans Serif', value: 'Arial' },
        { name: 'Serif', value: 'Times New Roman' },
        { name: 'Monospace', value: 'Courier New' },
        { name: 'Georgia', value: 'Georgia' },
        { name: 'Verdana', value: 'Verdana' },
    ];
    const [currentFont, setCurrentFont] = useState(fonts[0]);

    const handleCopy = async () => {
        const text = (isEditMode ? editorRef.current?.innerText : contentRef.current?.innerText) || lessonContent;
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            const ta = document.createElement('textarea');
            ta.value = text;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
    };

    const handleShare = async () => {
        const text = contentRef.current?.innerText || editorRef.current?.innerText || lessonContent;
        if (navigator.share) {
            try {
                await navigator.share({ title: 'Lesson', text });
            } catch { /* user cancelled */ }
        } else {
            await handleCopy();
        }
    };

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Toolbar helpers
    const execCmd = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        if (editorRef.current) editorRef.current.focus();
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
        setActivePopup(null);
        setPopupValue('');
    };

    const openPopup = (type: 'link') => {
        saveSelection();
        setActivePopup(type);
        setPopupValue('');
    };

    const handleSave = async () => {
        if (!editorRef.current || !user || !id) return;
        setIsSaving(true);
        try {
            const content = editorRef.current.innerHTML;
            await supabase
                .from('tutor_tools')
                .update({ lesson_data: { content } })
                .eq('document_id', id)
                .eq('uid', user.id);
            setHasUnsavedChanges(false);
        } catch (err) {
            console.error('Error saving lesson:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const enterEditMode = () => {
        if (editableHtml) {
            setIsEditMode(true);
            return;
        }
        // Convert markdown to HTML for editing
        try {
            const html = renderToStaticMarkup(
                <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeRaw, rehypeKatex]}
                >
                    {preprocessLaTeX(lessonContent)}
                </ReactMarkdown>
            );
            setEditableHtml(html);
        } catch {
            setEditableHtml(`<p>${lessonContent}</p>`);
        }
        setIsEditMode(true);
    };

    const ToolbarButton = ({ icon, command, value, label, onClick }: { icon: React.ReactNode, command?: string, value?: string, label?: string, onClick?: () => void }) => (
        <button
            onMouseDown={(e) => {
                e.preventDefault();
                if (onClick) { onClick(); }
                else if (command) { execCmd(command, value); }
            }}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 rounded flex-shrink-0 transition-colors flex items-center gap-1"
            title={label || command}
        >
            {icon}
            {label && <span className="text-xs font-bold">{label}</span>}
        </button>
    );

    // Preprocess LaTeX to convert various formats to react-markdown compatible format
    const preprocessLaTeX = (text: string) => {
        if (typeof text !== 'string') return '';
        return text
            // Standard LaTeX block \[ ... \] -> $$ ... $$
            .replace(/\\\[([\s\S]*?)\\\]/g, (_, eq) => `$$${eq}$$`)
            // Standard LaTeX inline \( ... \) -> $ ... $
            .replace(/\\\(([\s\S]*?)\\\)/g, (_, eq) => `$${eq}$`)
            // Heuristic: [ \command... ] -> $$ \command... $$
            .replace(/\[\s*(\\frac|\\boxed|\\begin|\\sum|\\int|\\partial|\\sqrt|\\mathbf|\\mathrm|\\mathcal|\\mathscr|\\mathfrak|\\mathbb|\\sin|\\cos|\\tan)([\s\S]*?)\]/g, (match, cmd, rest) => `$$${cmd}${rest}$$`);
    };

    useEffect(() => {
        let intervalId: NodeJS.Timeout;
        let isMounted = true;

        const fetchData = async () => {
            if (!id || !user) return;

            try {
                const { data, error } = await supabase
                    .from('tutor_lesson_documents')
                    .select('lesson_text')
                    .eq('document_id', id)
                    .eq('uid', user.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (error && error.code !== 'PGRST116') {
                    console.error('Error fetching data:', error);
                }

                if (isMounted) {
                    if (data && data.lesson_text) {
                        // Ensure newlines are handled correctly if they come as escaped string
                        const formattedContent = data.lesson_text.replace(/\\n/g, '\n');
                        setLessonContent(prev => {
                            if (prev === formattedContent) return prev;
                            return formattedContent;
                        });
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
        intervalId = setInterval(fetchData, 10000); // Check every 10 seconds

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [id, user]);

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="h-12 shrink-0 flex items-center justify-between px-4 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#111111] z-20">
                <div className="flex items-center gap-2">
                    <FaMagic size={13} className="text-indigo-500" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">Study Tutor</span>
                    {isEditMode && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-medium">Editing</span>
                    )}
                </div>
                {/* Three-dot Menu */}
                <div ref={menuRef} className="relative">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    >
                        <FaEllipsisV size={14} />
                    </button>
                    {isMenuOpen && (
                        <div className="absolute top-full right-0 mt-1 w-36 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                            <button
                                onClick={() => { handleCopy(); setIsMenuOpen(false); }}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                            >
                                <FaCopy size={13} />
                                Copy
                            </button>
                            <button
                                onClick={() => { handleShare(); setIsMenuOpen(false); }}
                                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                            >
                                <FaShareAlt size={13} />
                                Share
                            </button>
                            <div className="h-px bg-gray-200 dark:bg-white/10 mx-2" />
                            <button
                                onClick={() => { if (!isEditMode) enterEditMode(); else setIsEditMode(false); setIsMenuOpen(false); }}
                                className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${isEditMode ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                            >
                                <FaEdit size={13} />
                                {isEditMode ? 'Done Editing' : 'Edit'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Toolbar — only in edit mode, inline in flex column */}
            {isEditMode && (
                <div className="shrink-0 border-b border-gray-200 dark:border-white/10 bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur-md relative z-10">
                    <div className="flex items-center gap-1 p-2 overflow-x-auto scrollbar-none">
                        <div className="relative">
                            <ToolbarButton
                                icon={<div className="flex items-center gap-1"><span className="text-xs font-bold whitespace-nowrap">{currentFont.name}</span><FaChevronDown size={8} /></div>}
                                onClick={() => setActivePopup(activePopup === 'font' ? null : 'font')}
                            />
                            {activePopup === 'font' && (
                                <div className="absolute top-full left-0 mt-2 p-1 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl z-50 w-40">
                                    {fonts.map((font) => (
                                        <button
                                            key={font.value}
                                            onClick={() => { execCmd('fontName', font.value); setCurrentFont(font); setActivePopup(null); }}
                                            className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 rounded transition-colors"
                                            style={{ fontFamily: font.value }}
                                        >
                                            {font.name}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1 flex-shrink-0" />
                        <ToolbarButton icon={<FaBold size={12} />} command="bold" />
                        <ToolbarButton icon={<FaItalic size={12} />} command="italic" />
                        <ToolbarButton icon={<FaUnderline size={12} />} command="underline" />
                        <ToolbarButton icon={<FaStrikethrough size={12} />} command="strikeThrough" />
                        <ToolbarButton icon={<FaHighlighter size={12} />} command="hiliteColor" value="yellow" />
                        <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1 flex-shrink-0" />
                        <ToolbarButton icon={<FaChevronDown size={8} />} label="H1" command="formatBlock" value="H1" />
                        <ToolbarButton icon={<FaChevronDown size={8} />} label="H2" command="formatBlock" value="H2" />
                        <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1 flex-shrink-0" />
                        <ToolbarButton icon={<FaListUl size={12} />} command="insertUnorderedList" />
                        <ToolbarButton icon={<FaListOl size={12} />} command="insertOrderedList" />
                        <ToolbarButton icon={<FaQuoteRight size={12} />} command="formatBlock" value="blockquote" />
                        <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1 flex-shrink-0" />
                        <ToolbarButton icon={<FaAlignLeft size={12} />} command="justifyLeft" />
                        <ToolbarButton icon={<FaAlignCenter size={12} />} command="justifyCenter" />
                        <ToolbarButton icon={<FaAlignRight size={12} />} command="justifyRight" />
                        <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1 flex-shrink-0" />
                        <ToolbarButton icon={<FaLink size={12} />} onClick={() => openPopup('link')} />
                        <ToolbarButton icon={<FaCode size={12} />} command="formatBlock" value="pre" />
                        <ToolbarButton icon={<FaSuperscript size={12} />} command="superscript" />
                        <ToolbarButton icon={<FaSubscript size={12} />} command="subscript" />
                        <ToolbarButton icon={<FaMinus size={12} />} command="insertHorizontalRule" />
                        <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1 flex-shrink-0" />
                        <ToolbarButton icon={<FaEraser size={12} />} command="removeFormat" />
                    </div>
                    {activePopup === 'link' && (
                        <div className="absolute top-full left-4 mt-1 p-3 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl z-50 flex items-center gap-2 w-64">
                            <form onSubmit={handlePopupSubmit} className="flex items-center gap-2 w-full">
                                <input
                                    type="text"
                                    value={popupValue}
                                    onChange={(e) => setPopupValue(e.target.value)}
                                    placeholder="Enter URL..."
                                    className="flex-1 bg-gray-100 dark:bg-black/30 border border-gray-200 dark:border-white/10 rounded px-2 py-1 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-blue-500"
                                    autoFocus
                                />
                                <button type="submit" className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded font-medium transition-colors">Add</button>
                                <button type="button" onClick={() => setActivePopup(null)} className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                                    <FaMinus size={10} className="rotate-45" />
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            )}

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-8 pb-8 pt-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-800 scrollbar-track-transparent">
                <div className="max-w-3xl mx-auto w-full min-h-full">
                    {loading || isGenerating ? (
                        <div className="space-y-6">
                            <Skeleton width="60%" height={48} className="mb-8" />
                            <div className="space-y-4">
                                <Skeleton width="100%" height={20} />
                                <Skeleton width="100%" height={20} />
                                <Skeleton width="90%" height={20} />
                                <Skeleton width="95%" height={20} />
                            </div>
                            <div className="space-y-4 mt-8">
                                <Skeleton width="40%" height={32} className="mb-4" />
                                <Skeleton width="100%" height={20} />
                                <Skeleton width="100%" height={20} />
                                <Skeleton width="85%" height={20} />
                            </div>
                             <div className="space-y-4 mt-8">
                                <Skeleton width="100%" height={20} />
                                <Skeleton width="90%" height={20} />
                                <Skeleton width="95%" height={20} />
                            </div>
                        </div>
                    ) : isEditMode ? (
                        <div
                            ref={editorRef}
                            className="prose dark:prose-invert max-w-none focus:outline-none pb-20 min-h-[300px]"
                            contentEditable={true}
                            suppressContentEditableWarning={true}
                            dangerouslySetInnerHTML={{ __html: editableHtml }}
                            onInput={() => setHasUnsavedChanges(true)}
                        />
                    ) : (
                        <div ref={contentRef} className="prose dark:prose-invert max-w-none focus:outline-none pb-4">
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
                                {preprocessLaTeX(lessonContent)}
                            </ReactMarkdown>
                        </div>
                    )}
                </div>

                {/* Save Changes bar — shown when editing with unsaved changes */}
                {!loading && !isGenerating && lessonContent && hasUnsavedChanges && isEditMode && (
                    <div className="sticky bottom-4 flex justify-center pointer-events-none z-30 mt-4">
                        <div className="pointer-events-auto">
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 hover:scale-105 active:scale-95"
                            >
                                <FaSave size={14} className={isSaving ? 'animate-spin' : ''} />
                                <span className="text-sm font-medium">{isSaving ? 'Saving...' : 'Save Changes'}</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(StudyTutorLesson);
