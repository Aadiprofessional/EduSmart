import React, { useRef, useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useLanguage } from '../../utils/LanguageContext';
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
  FaSuperscript, FaSubscript, FaMagic, FaBook, FaSave, FaCopy, FaShareAlt,
  FaEllipsisV, FaEdit
} from 'react-icons/fa';
import { Skeleton } from '../ui/Skeleton';

const StudyNotes: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const { t } = useLanguage();
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
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = React.useRef<HTMLDivElement>(null);

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
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (error) {
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

                                // Post-process to make math elements atomic/non-editable
                                // This prevents contentEditable operations (like alignment) from breaking the internal HTML structure of KaTeX
                                content = content
                                    .replace(/class="katex"/g, 'class="katex" contentEditable="false"')
                                    .replace(/class="katex-display"/g, 'class="katex-display" contentEditable="false"');

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

    const handleExportPdf = () => {
        if (!editorRef.current) return;

        // Clone and strip every Tailwind/dark-mode class & inline style
        const clone = editorRef.current.cloneNode(true) as HTMLElement;
        clone.querySelectorAll('*').forEach(el => {
            el.removeAttribute('class');
            el.removeAttribute('style');
            el.removeAttribute('contenteditable');
            el.removeAttribute('data-placeholder');
        });
        const html = clone.innerHTML;

        const iframe = document.createElement('iframe');
        iframe.setAttribute('aria-hidden', 'true');
        Object.assign(iframe.style, {
            position: 'fixed', top: '0', left: '-9999px',
            width: '210mm', height: '297mm', border: 'none', visibility: 'hidden'
        });
        document.body.appendChild(iframe);

        const doc = iframe.contentDocument;
        if (!doc) return;
        doc.open();
        doc.write(`<!DOCTYPE html>
<html lang="zh">
<head>
<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700&family=Noto+Sans:wght@400;700&display=swap" rel="stylesheet">
<style>
  @page { margin: 20mm; size: A4 portrait; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: "Noto Sans SC", "Noto Sans", Arial, sans-serif;
    font-size: 11pt;
    line-height: 1.75;
    color: #111 !important;
    background: #fff !important;
    word-break: break-word;
    overflow-wrap: break-word;
  }
  * { color: #111 !important; background-color: transparent !important; }
  h1 { font-size: 20pt; font-weight: 700; margin: 16pt 0 8pt; }
  h2 { font-size: 15pt; font-weight: 700; margin: 14pt 0 6pt; border-bottom: 1pt solid #ddd; padding-bottom: 3pt; }
  h3 { font-size: 13pt; font-weight: 700; margin: 11pt 0 5pt; }
  h4, h5, h6 { font-size: 11pt; font-weight: 700; margin: 8pt 0 4pt; }
  p  { margin-bottom: 7pt; }
  ul, ol { padding-left: 20pt; margin-bottom: 7pt; }
  li { margin-bottom: 3pt; }
  blockquote { margin: 6pt 0 6pt 12pt; font-style: italic; border-left: 3pt solid #aaa; padding-left: 8pt; }
  table { width: 100%; border-collapse: collapse; margin: 8pt 0; font-size: 10pt; page-break-inside: auto; }
  tr { page-break-inside: avoid; }
  th, td { border: 1pt solid #bbb !important; padding: 5pt 8pt; text-align: left; word-break: break-word; white-space: normal; vertical-align: top; }
  th { background: #eee !important; font-weight: 700; }
  pre { font-family: "Courier New", Courier, monospace; font-size: 9pt; white-space: pre-wrap; word-break: break-all; background: #f4f4f4 !important; padding: 7pt; margin: 5pt 0; }
  code { font-family: "Courier New", Courier, monospace; font-size: 9pt; background: #f4f4f4 !important; padding: 1pt 3pt; }
  hr { border: none; border-top: 1pt solid #ddd; margin: 10pt 0; }
  img { max-width: 100%; height: auto; display: block; }
  strong, b { font-weight: 700; }
  em, i { font-style: italic; }
</style>
</head>
<body>${html}</body>
</html>`);
        doc.close();

        // Wait for Noto Sans SC to finish loading before triggering print
        // so all CJK glyphs are embedded in the PDF
        const tryPrint = () => {
            try {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();
            } catch (e) {
                console.error('Print failed:', e);
            }
            setTimeout(() => iframe.parentNode?.removeChild(iframe), 3000);
        };

        const fonts = (iframe.contentDocument as any)?.fonts;
        if (fonts && typeof fonts.ready?.then === 'function') {
            fonts.ready.then(() => setTimeout(tryPrint, 200));
        } else {
            // Fallback: give fonts 2s to load
            setTimeout(tryPrint, 2000);
        }
    };

    const handleCopy = async () => {
        if (!editorRef.current) return;
        try {
            await navigator.clipboard.writeText(editorRef.current.innerText);
        } catch {
            // fallback
            const ta = document.createElement('textarea');
            ta.value = editorRef.current.innerText;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
        }
    };

    const handleShare = async () => {
        if (!editorRef.current) return;
        const text = editorRef.current.innerText;
        if (navigator.share) {
            try {
                await navigator.share({ title: 'Study Notes', text });
            } catch { /* user cancelled */ }
        } else {
            // Fallback: copy to clipboard
            await handleCopy();
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
            
            setHasUnsavedChanges(false);
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
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="h-12 shrink-0 flex items-center justify-between px-4 border-b border-gray-200 dark:border-white/10 bg-white dark:bg-[#111111] z-20">
                <div className="flex items-center gap-2">
                    <FaBook size={13} className="text-indigo-500" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">Study Notes</span>
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
                                onClick={() => { setIsEditMode(!isEditMode); setIsMenuOpen(false); }}
                                className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors ${isEditMode ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'}`}
                            >
                                <FaEdit size={13} />
                                {isEditMode ? 'Done Editing' : 'Edit'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Toolbar — only visible in edit mode, inline in flex column */}
            {isEditMode && (
                <div className="shrink-0 border-b border-gray-200 dark:border-white/10 bg-white/90 dark:bg-[#1a1a1a]/90 backdrop-blur-md relative z-10">
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
                        <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1 flex-shrink-0"></div>
                        <ToolbarButton icon={<FaBold size={12} />} command="bold" />
                        <ToolbarButton icon={<FaItalic size={12} />} command="italic" />
                        <ToolbarButton icon={<FaUnderline size={12} />} command="underline" />
                        <ToolbarButton icon={<FaStrikethrough size={12} />} command="strikeThrough" />
                        <ToolbarButton icon={<FaHighlighter size={12} />} command="hiliteColor" value="yellow" />
                        <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1 flex-shrink-0"></div>
                        <ToolbarButton icon={<FaChevronDown size={8} />} label="H1" command="formatBlock" value="H1" />
                        <ToolbarButton icon={<FaChevronDown size={8} />} label="H2" command="formatBlock" value="H2" />
                        <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1 flex-shrink-0"></div>
                        <ToolbarButton icon={<FaListUl size={12} />} command="insertUnorderedList" />
                        <ToolbarButton icon={<FaListOl size={12} />} command="insertOrderedList" />
                        <ToolbarButton icon={<FaQuoteRight size={12} />} command="formatBlock" value="blockquote" />
                        <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1 flex-shrink-0"></div>
                        <ToolbarButton icon={<FaAlignLeft size={12} />} command="justifyLeft" />
                        <ToolbarButton icon={<FaAlignCenter size={12} />} command="justifyCenter" />
                        <ToolbarButton icon={<FaAlignRight size={12} />} command="justifyRight" />
                        <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1 flex-shrink-0"></div>
                        <ToolbarButton icon={<FaLink size={12} />} onClick={() => openPopup('link')} />
                        <ToolbarButton icon={<FaCode size={12} />} command="formatBlock" value="pre" />
                        <ToolbarButton icon={<FaSuperscript size={12} />} command="superscript" />
                        <ToolbarButton icon={<FaSubscript size={12} />} command="subscript" />
                        <ToolbarButton icon={<FaMinus size={12} />} command="insertHorizontalRule" />
                        <div className="w-px h-4 bg-gray-200 dark:bg-white/10 mx-1 flex-shrink-0"></div>
                        <ToolbarButton icon={<FaEraser size={12} />} command="removeFormat" />
                    </div>
                    {/* Link Popup */}
                    {activePopup === 'link' && (
                        <div className="absolute top-full left-4 mt-1 p-3 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl z-50 flex items-center gap-2 w-64 backdrop-blur-md">
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
            <div className="flex-1 overflow-y-auto px-8 pb-8 pt-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-800 scrollbar-track-transparent overscroll-contain relative">
                <div className="max-w-3xl mx-auto w-full min-h-full">
                    {isGenerating ? (
                        <div className="flex flex-col items-center justify-center h-full pt-20">
                            <div className="relative">
                                <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                                <FaMagic className="relative text-5xl text-indigo-500 dark:text-indigo-400 mb-6 animate-bounce" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('aiStudy.loading.generatingWithAiMagic')}</h2>
                            <p className="text-gray-500 dark:text-gray-400 max-w-md text-center">
                                {t('aiStudy.loading.craftingStudyNotes')}
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
                        <>
                            <style>{`
                                .study-notes-editor h1 {
                                    font-size: 1.875rem;
                                    font-weight: 700;
                                    margin-bottom: 1rem;
                                    margin-top: 1.5rem;
                                    border-bottom: 1px solid #e5e7eb;
                                    padding-bottom: 0.5rem;
                                    color: #111827;
                                }
                                .dark .study-notes-editor h1 {
                                    color: white;
                                    border-color: #374151;
                                }
                                .study-notes-editor h2 {
                                    font-size: 1.5rem;
                                    font-weight: 600;
                                    margin-bottom: 0.75rem;
                                    margin-top: 1.25rem;
                                    color: #111827;
                                }
                                .dark .study-notes-editor h2 {
                                    color: white;
                                }
                                .katex, .katex-display { user-select: text; }
                                .katex-display { margin: 1em 0; overflow-x: auto; overflow-y: hidden; }
                            `}</style>
                            <div
                                ref={editorRef}
                                className={`study-notes-editor prose prose-gray dark:prose-invert max-w-none focus:outline-none pb-20 min-h-[300px] ${!isEditMode ? 'cursor-default select-text' : ''}`}
                                contentEditable={isEditMode}
                                suppressContentEditableWarning={true}
                                dangerouslySetInnerHTML={{ __html: notesContent }}
                                onInput={() => isEditMode && setHasUnsavedChanges(true)}
                            />
                        </>
                    )}
                </div>

                {/* Bottom Action Bar */}
                <div className="sticky bottom-4 flex justify-center pointer-events-none z-30 mt-4">
                    <div className="flex items-center gap-2 pointer-events-auto">
                        {hasUnsavedChanges && isEditMode && (
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 hover:scale-105 active:scale-95"
                            >
                                <FaSave size={14} className={isSaving ? 'animate-spin' : ''} />
                                <span className="text-sm font-medium">{isSaving ? 'Saving...' : 'Save Changes'}</span>
                            </button>
                        )}
                        <button
                            onClick={handleExportPdf}
                            className="px-4 py-2 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 rounded-full shadow-lg transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
                            title="Export as PDF"
                        >
                            <FaFilePdf size={14} />
                            <span className="text-sm font-medium">Export PDF</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudyNotes;
