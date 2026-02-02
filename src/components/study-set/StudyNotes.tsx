import React, { useRef, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  FaChevronDown, FaBold, FaItalic, FaUnderline, FaStrikethrough, 
  FaListUl, FaListOl, FaQuoteRight, FaCode, FaMinus, FaImage, FaEraser,
  FaFilePdf, FaAlignLeft, FaAlignCenter, FaAlignRight, FaLink, FaHighlighter,
  FaSuperscript, FaSubscript
} from 'react-icons/fa';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const StudyNotes: React.FC = () => {
    const location = useLocation();
    const studySetData = location.state?.studySetData;
    const editorRef = useRef<HTMLDivElement>(null);
    const [activePopup, setActivePopup] = React.useState<'link' | 'image' | null>(null);
    const [popupValue, setPopupValue] = React.useState('');
    const savedSelection = useRef<Range | null>(null);

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
            const canvas = await html2canvas(editorRef.current, { 
                scale: 2,
                backgroundColor: '#111111', // Match dark theme
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
            className={`p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded flex-shrink-0 transition-colors flex items-center gap-1 ${activePopup && (command === 'createLink' || command === 'insertImage') ? 'bg-white/10 text-white' : ''}`}
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
                    <div className="rounded-xl overflow-hidden border border-white/10 shadow-2xl backdrop-blur-md bg-[#1a1a1a]/80 supports-[backdrop-filter]:bg-[#1a1a1a]/60">
                        <div className="flex items-center gap-1 p-2 overflow-x-auto scrollbar-none">
                            {/* Font Style */}
                            <ToolbarButton icon={<span className="text-xs font-bold">Sans Serif</span>} command="fontName" value="Arial" />
                            <div className="w-px h-4 bg-white/10 mx-1 flex-shrink-0"></div>
                            
                            {/* Basic Formatting */}
                            <ToolbarButton icon={<FaBold size={12} />} command="bold" />
                            <ToolbarButton icon={<FaItalic size={12} />} command="italic" />
                            <ToolbarButton icon={<FaUnderline size={12} />} command="underline" />
                            <ToolbarButton icon={<FaStrikethrough size={12} />} command="strikeThrough" />
                            <ToolbarButton icon={<FaHighlighter size={12} />} command="hiliteColor" value="yellow" />
                            
                            <div className="w-px h-4 bg-white/10 mx-1 flex-shrink-0"></div>
                            
                            {/* Headings */}
                            <ToolbarButton icon={<FaChevronDown size={8} />} label="H1" command="formatBlock" value="H1" />
                            <ToolbarButton icon={<FaChevronDown size={8} />} label="H2" command="formatBlock" value="H2" />
                            
                            <div className="w-px h-4 bg-white/10 mx-1 flex-shrink-0"></div>
                            
                            {/* Lists & Indent */}
                            <ToolbarButton icon={<FaListUl size={12} />} command="insertUnorderedList" />
                            <ToolbarButton icon={<FaListOl size={12} />} command="insertOrderedList" />
                            <ToolbarButton icon={<FaQuoteRight size={12} />} command="formatBlock" value="blockquote" />
                            
                            <div className="w-px h-4 bg-white/10 mx-1 flex-shrink-0"></div>
                            
                            {/* Alignment */}
                            <ToolbarButton icon={<FaAlignLeft size={12} />} command="justifyLeft" />
                            <ToolbarButton icon={<FaAlignCenter size={12} />} command="justifyCenter" />
                            <ToolbarButton icon={<FaAlignRight size={12} />} command="justifyRight" />
                            
                            <div className="w-px h-4 bg-white/10 mx-1 flex-shrink-0"></div>
                            
                            {/* Special */}
                            <ToolbarButton icon={<FaLink size={12} />} onClick={() => openPopup('link')} />
                            <ToolbarButton icon={<FaCode size={12} />} command="formatBlock" value="pre" />
                            <ToolbarButton icon={<FaSuperscript size={12} />} command="superscript" />
                            <ToolbarButton icon={<FaSubscript size={12} />} command="subscript" />
                            <ToolbarButton icon={<FaMinus size={12} />} command="insertHorizontalRule" />
                            <ToolbarButton icon={<FaImage size={12} />} onClick={() => openPopup('image')} />
                            
                            <div className="w-px h-4 bg-white/10 mx-1 flex-shrink-0"></div>
                            
                            {/* Actions */}
                            <ToolbarButton icon={<FaEraser size={12} />} command="removeFormat" />
                            <button 
                                onClick={handleExportPdf}
                                className="p-2 text-indigo-400 hover:text-indigo-300 hover:bg-white/10 rounded flex-shrink-0 transition-colors ml-auto flex items-center gap-2"
                                title="Export PDF"
                            >
                                <FaFilePdf size={12} />
                                <span className="text-xs font-bold">Export PDF</span>
                            </button>
                        </div>
                    </div>

                    {/* Popup for Link/Image */}
                    {activePopup && (
                        <div className="absolute top-full left-0 mt-2 p-3 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl z-50 flex items-center gap-2 w-64 backdrop-blur-md">
                            <form onSubmit={handlePopupSubmit} className="flex items-center gap-2 w-full">
                                <input
                                    type="text"
                                    value={popupValue}
                                    onChange={(e) => setPopupValue(e.target.value)}
                                    placeholder={activePopup === 'link' ? "Enter URL..." : "Enter Image URL..."}
                                    className="flex-1 bg-black/30 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
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
                                    className="p-1 text-gray-400 hover:text-white"
                                >
                                    <FaMinus size={10} className="rotate-45" />
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="h-full overflow-y-auto px-8 pb-8 pt-24 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                <div className="max-w-3xl mx-auto w-full min-h-full">
                    <div 
                        ref={editorRef}
                        className="prose prose-invert max-w-none focus:outline-none pb-20"
                        contentEditable
                        suppressContentEditableWarning
                    >
                        {studySetData?.document_text ? (
                            <>
                                <div className="whitespace-pre-wrap text-gray-300 leading-relaxed">
                                    {studySetData.document_text}
                                </div>
                            </>
                        ) : (
                            <>
                                <h1 className="flex items-center gap-3 text-3xl font-bold mb-6">
                                    <span className="text-4xl">🧠</span> AI System Architecture Overview
                                </h1>
                                <p className="text-gray-300 leading-relaxed mb-6">
                                    This document outlines the comprehensive system architecture of an advanced AI-powered application, detailing its various components, their interconnections, and the overall flow of data and functionality. The system leverages a <span className="text-blue-400 cursor-pointer hover:underline">React frontend</span>, a robust <span className="text-blue-400 cursor-pointer hover:underline">backend with core logic</span>, advanced <span className="text-blue-400 cursor-pointer hover:underline">AI/Deep Learning models</span>, and integrated <span className="text-blue-400 cursor-pointer hover:underline">data storage/external services</span> to deliver a wide range of AI features.
                                </p>

                                <h2 className="flex items-center gap-3 text-2xl font-bold mb-4 mt-8">
                                    <span className="text-3xl">🚀</span> User Interface / Frontend Components
                                </h2>
                                <p className="text-gray-300 leading-relaxed mb-4">
                                    The frontend serves as the primary <span className="text-blue-400 cursor-pointer hover:underline">point of interaction</span> for end-users, built for both web and mobile platforms.
                                </p>
                                <ul className="list-disc pl-6 space-y-3 text-gray-300">
                                    <li><strong className="text-blue-400">User:</strong> Represents the <strong className="text-blue-400">end-user</strong> who interacts with the system.</li>
                                    <li><strong className="text-blue-400">React App (Web / Mobile):</strong> The core application interface, providing access to all features.
                                        <ul className="list-disc pl-6 mt-2 space-y-2">
                                            <li><strong className="text-blue-400">AI Chat Page:</strong> A dedicated interface within the React App for <strong className="text-blue-400">real-time AI chat</strong> functionalities.</li>
                                            <li><strong className="text-blue-400">Web Socket Client:</strong> Facilitates <strong className="text-blue-400">real-time communication</strong> with the backend WebSocket server, crucial for interactive features like chat.</li>
                                            <li><strong className="text-blue-400">App Router:</strong> Manages <strong className="text-blue-400">navigation and routing</strong> across different sections and pages of the application.</li>
                                            <li><strong className="text-blue-400">Global Context Providers:</strong> Ensures <strong className="text-blue-400">shared data and state</strong> are accessible across various components, promoting efficient state management.</li>
                                            <li><strong className="text-blue-400">Application Pages:</strong> A collection of specialized pages offering diverse functionalities:
                                                <ul className="list-disc pl-6 mt-2 space-y-2">
                                                    <li><strong className="text-blue-400">Speech / Video -{'>'} Text:</strong> Feature for <strong className="text-blue-400">converting spoken language or video dialogue into text</strong>.</li>
                                                    <li><strong className="text-blue-400">Image Generator:</strong> Enables users to <strong className="text-blue-400">generate images</strong> based on prompts or inputs.</li>
                                                </ul>
                                            </li>
                                        </ul>
                                    </li>
                                </ul>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StudyNotes;
