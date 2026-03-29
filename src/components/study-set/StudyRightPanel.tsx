import React, { useState, useEffect, useRef } from 'react';
import { FaBook, FaArrowUp, FaTimes, FaPaperclip } from 'react-icons/fa';
import StudyContent from './StudyContent';
import StudyNotes from './StudyNotes';
import { supabase } from '../../utils/supabase';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../../utils/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';
import { useLanguage } from '../../utils/LanguageContext';
import coinIcon from '../../assets/assets_coin.png';
import { useResponseCheck, ResponseUpgradeModal } from '../../utils/responseChecker';

// --- Types ---

interface Message {
    id: string;
    type: 'user' | 'ai';
    content: string;
    timestamp: Date;
    subject?: string;
}

interface ChatPanelProps {
    documentId?: string;
    attachment?: { type: 'text', content: string, source: string } | null;
    onClearAttachment?: () => void;
}

// --- Sub-components for Right Panel ---

const SkeletonLoader = () => (
    <div className="w-full animate-pulse space-y-4 p-4">
        <div className="flex justify-end">
            <div className="w-2/3 h-12 bg-gray-200 dark:bg-gray-700 rounded-2xl rounded-tr-sm"></div>
        </div>
        <div className="flex justify-start">
            <div className="w-3/4 h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl rounded-tl-sm"></div>
        </div>
        <div className="flex justify-end">
            <div className="w-1/2 h-10 bg-gray-200 dark:bg-gray-700 rounded-2xl rounded-tr-sm"></div>
        </div>
         <div className="flex justify-start">
            <div className="w-full h-16 bg-gray-200 dark:bg-gray-700 rounded-2xl rounded-tl-sm"></div>
        </div>
    </div>
);

const ChatPanel: React.FC<ChatPanelProps> = ({ documentId, attachment, onClearAttachment }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { user } = useAuth();
    const { t } = useLanguage();
    const { checkAndUseResponse } = useResponseCheck();
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const cost = 1;
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [upgradeMessage, setUpgradeMessage] = useState('');
    const [upgradeCtaType, setUpgradeCtaType] = useState<'coins' | 'subscription'>('subscription');

    // Focus input when attachment is added
    useEffect(() => {
        if (attachment) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [attachment]);

    useEffect(() => {
        if (!inputRef.current) return;
        const textarea = inputRef.current;
        const computedStyle = window.getComputedStyle(textarea);
        const lineHeight = parseFloat(computedStyle.lineHeight) || 20;
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
    }, [inputValue]);

    // Scroll to bottom whenever messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            // Find the scrollable container (parent of the messages area)
            // The structure is: div (flex-col) -> div (flex-1 overflow-y-auto) -> messages... -> div (ref)
            // So the scroll container is the parent of messagesEndRef.current
            const scrollContainer = messagesEndRef.current.parentElement;
            if (scrollContainer) {
                const { scrollHeight, clientHeight } = scrollContainer;
                // Only scroll if content overflows
                if (scrollHeight > clientHeight) {
                    scrollContainer.scrollTo({
                        top: scrollHeight,
                        behavior: 'smooth'
                    });
                }
            }
        }
    }, [messages]);

    // Fetch Chat History
    useEffect(() => {
        const fetchHistory = async () => {
            if (!documentId) return;
            setIsLoadingHistory(true);
            
            const { data, error } = await supabase
                .from('solve_messages')
                .select('*')
                .eq('chat_id', documentId)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error fetching chat history:', error);
            } else if (data) {
                const formattedMessages: Message[] = data.map(m => ({
                    id: m.id,
                    type: m.created_by ? 'user' : 'ai',
                    content: m.content,
                    timestamp: new Date(m.created_at)
                }));
                setMessages(formattedMessages);
            }
            setIsLoadingHistory(false);
        };

        fetchHistory();
    }, [documentId]);

    const handleSendMessage = async () => {
        if ((!inputValue.trim() && !attachment) || !documentId) return;
        const responseCheck = await checkAndUseResponse({
            responseType: 'study_right_panel_chat',
            queryData: {
                documentId,
                messageLength: inputValue.trim().length,
                hasAttachment: !!attachment
            },
            requireCoins: true,
            noCoinsMessage: 'Please buy more coins to continue.'
        });
        if (!responseCheck.canProceed) {
            if (responseCheck.showUpgradeModal) {
                setUpgradeMessage(responseCheck.message || 'Please buy more coins to continue.');
                setUpgradeCtaType(responseCheck.ctaType || 'coins');
                setShowUpgradeModal(true);
            }
            return;
        }

        const messageContent = inputValue.trim();
        // Combine attachment with message for the AI
        let finalContent = messageContent;
        if (attachment) {
            finalContent = `Context from ${attachment.source}:\n${attachment.content}\n\nUser Question:\n${messageContent}`;
        }
        
        setInputValue('');
        if (onClearAttachment) onClearAttachment();
        
        // Optimistic update
        const userMsgId = uuidv4();
        const newUserMsg: Message = {
            id: userMsgId,
            type: 'user',
            content: finalContent, // Show full content in chat history? Or just message? 
            // Usually showing context is good for history, but maybe visually separate it?
            // For now, let's just show it all as text.
            timestamp: new Date()
        };
        
        const aiMsgId = uuidv4();
        const newAiMsg: Message = {
            id: aiMsgId,
            type: 'ai',
            content: '',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, newUserMsg, newAiMsg]);
        setIsProcessing(true);

        try {
            // 1. Ensure chat exists (idempotent-ish)
            // We try to insert, if it fails (duplicate), we ignore.
            // Note: If documentId is not a valid UUID, this might fail if the column is UUID type.
            // Assuming documentId is a UUID from previous context.
             const { error: chatError } = await supabase.from('solve_chats').insert({
                id: documentId,
                owner: user?.id,
                title: t('studyRightPanel.defaultChatTitle'),
                service_type: 'study_chat',
                metadata: { type: 'study_set_chat' }
            }).select();
            
            // Ignore duplicate key error (code 23505)
            if (chatError && chatError.code !== '23505') {
                 console.error('Error creating/checking chat:', chatError);
            }

            // 2. Save User Message
            await supabase.from('solve_messages').insert({
                id: userMsgId,
                chat_id: documentId,
                position: 0,
                content: finalContent,
                status: 'done',
                created_by: user?.id
            });

            // 3. Prepare Request Body
            const userId = user?.id || 'anonymous';
            const timestamp = new Date().toISOString().replace('T', ' ').replace('Z', '');
            
            const requestBody = {
                stream: true,
                uploadedFileType: 'text',
                messages: [{
                    uid: userId,
                    type: "text",
                    text: { body: "text" }, 
                    body: finalContent,
                    content: finalContent,
                    transcription: finalContent,
                    role: "user",
                    roleDescription: "",
                    timestamp: timestamp,
                    chatid: documentId,
                    subject: t('studyRightPanel.defaultSubject')
                }]
            };

            // 4. Send to Webhook
            const response = await fetch('https://n8n.matrixaiserver.com/webhook/282d6827-c241-4e4e-b7ff-cc957e2b81d0', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            if (!response.body) throw new Error('No response body');

            // 5. Handle Stream
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let aiContent = '';
            let buffer = '';

            const processLine = (line: string) => {
                if (!line.trim()) return;
                try {
                    const json = JSON.parse(line);
                    let newContent = '';

                    // Handle array format with output field
                    if (Array.isArray(json) && json.length > 0 && json[0]?.output) {
                        newContent = json[0].output;
                    } 
                    // Handle streaming format
                    else if (json.type === 'item' && typeof json.content === 'string') {
                        newContent = json.content;
                    }

                    if (newContent) {
                        aiContent += newContent;
                        setMessages(prev => {
                            const newMessages = [...prev];
                            const lastMsgIndex = newMessages.findIndex(m => m.id === aiMsgId);
                            if (lastMsgIndex !== -1) {
                                newMessages[lastMsgIndex] = {
                                    ...newMessages[lastMsgIndex],
                                    content: aiContent
                                };
                            }
                            return newMessages;
                        });
                    }
                } catch (e) {
                    // Ignore parse errors for partial lines
                }
            };

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                buffer += chunk;
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    processLine(line);
                }
            }

            // Process any remaining buffer
            if (buffer.trim()) {
                processLine(buffer);
            }

            // 6. Save AI Message
            if (aiContent) {
                await supabase.from('solve_messages').insert({
                    id: aiMsgId,
                    chat_id: documentId,
                    position: 0,
                    content: aiContent,
                    status: 'done',
                    created_by: null
                });
            }

        } catch (error) {
            console.error('Error in chat:', error);
            setMessages(prev => [...prev, {
                id: uuidv4(),
                type: 'ai',
                content: t('studyRightPanel.chatError'),
                timestamp: new Date()
            }]);
        } finally {
            setIsProcessing(false);
        }
    };

    const preprocessMath = (content: string) => {
        if (!content) return '';
        let processed = content.replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$');
        processed = processed.replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$');
        return processed;
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-[#111111]">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                {isLoadingHistory ? (
                    <SkeletonLoader />
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400 p-8">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center mb-4">
                            <FaBook className="text-gray-400 dark:text-gray-600" size={24} />
                        </div>
                        <p className="text-sm">{t('studyRightPanel.askAboutStudySet')}</p>
                    </div>
                ) : (
                    messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[90%] ${msg.type === 'user' ? 'bg-gray-100 dark:bg-[#27272a] text-gray-900 dark:text-white rounded-2xl rounded-tr-sm px-5 py-3' : 'w-full'}`}>
                                {msg.type === 'ai' ? (
                                    <div className="prose dark:prose-invert max-w-none text-sm text-gray-900 dark:text-gray-200">
                                        {!msg.content && isProcessing && msg.id === messages[messages.length-1].id ? (
                                            <div className="flex space-x-2 items-center h-6">
                                                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                <div className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                            </div>
                                        ) : (
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
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                                )}
                            </div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>
            
            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 dark:border-white/5 bg-white dark:bg-[#111111]">
                {/* Attachment Pill */}
                {attachment && (
                    <div className="mb-3 flex flex-col gap-2 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-500/30 rounded-xl p-3 animate-in slide-in-from-bottom-2 duration-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center flex-shrink-0 text-indigo-600 dark:text-indigo-300">
                                    <FaPaperclip size={10} />
                                </div>
                                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 truncate">{attachment.source}</span>
                            </div>
                            <button 
                                onClick={onClearAttachment}
                                className="p-1.5 text-indigo-400 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-200 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-800/50 transition-colors"
                            >
                                <FaTimes size={12} />
                            </button>
                        </div>
                        <div className="pl-8">
                            <p className="text-xs text-indigo-900/80 dark:text-indigo-200/80 line-clamp-3 leading-relaxed font-medium">
                                "{attachment.content}"
                            </p>
                        </div>
                    </div>
                )}
                <div className="relative">
                    <textarea 
                       ref={inputRef}
                       value={inputValue}
                       onChange={(e) => setInputValue(e.target.value)}
                       onKeyDown={(e) => {
                           if (e.key === 'Enter' && !e.shiftKey) {
                               e.preventDefault();
                               handleSendMessage();
                           }
                       }}
                       placeholder={t('studyRightPanel.askAnything')}
                       disabled={isProcessing}
                       className="w-full bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl py-3 pl-4 pr-14 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-600 focus:outline-none focus:border-indigo-500 dark:focus:border-white/20 disabled:opacity-50 resize-none min-h-[48px]"
                       rows={1}
                    />
                    <div className="absolute inset-y-0 right-2 flex items-center">
                        <button 
                            onClick={handleSendMessage}
                            disabled={!inputValue.trim() || isProcessing}
                            className="relative w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {!isProcessing && inputValue.trim() && cost > 0 && (
                                <span className="absolute -top-2 -right-2 z-10 inline-flex items-center gap-1 bg-[#ff5500] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                    -{cost}
                                    <img src={coinIcon} alt="coins" className="w-3 h-3" />
                                </span>
                            )}
                            <FaArrowUp size={12} />
                        </button>
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
    );
};

// --- Main Right Panel Component ---

interface StudyRightPanelProps {
    activeMethod?: string;
    documentId?: string;
    attachment?: { type: 'text', content: string, source: string } | null;
    onClearAttachment?: () => void;
    hasNotes?: boolean;
}

const StudyRightPanel: React.FC<StudyRightPanelProps> = ({ activeMethod, documentId, attachment, onClearAttachment, hasNotes = false }) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'chat' | 'content' | 'notes'>('chat');
    // Initialize width based on screen size, max 450px on desktop, full width on mobile
    const [width, setWidth] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth < 1280 ? window.innerWidth : 450;
        }
        return 450;
    });
    const [isResizing, setIsResizing] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);

    // Switch to chat tab if attachment is present
    useEffect(() => {
        if (attachment) {
            setActiveTab('chat');
        }
    }, [attachment]);


    // Update width on window resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1280) {
                setWidth(window.innerWidth);
            } else if (width === window.innerWidth) {
                // If previously full width (mobile), reset to default desktop width
                setWidth(450);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [width]);

    const startResizing = (e: React.MouseEvent) => {
        // Disable resizing on mobile
        if (window.innerWidth < 1280) return;
        setIsResizing(true);
        e.preventDefault();
    };

    useEffect(() => {
        const stopResizing = () => setIsResizing(false);

        const resize = (e: MouseEvent) => {
            if (isResizing) {
                const newWidth = window.innerWidth - e.clientX;
                if (newWidth >= 250 && newWidth <= 600) {
                    setWidth(newWidth);
                }
            }
        };

        if (isResizing) {
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResizing);
        }

        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [isResizing]);

    const showNotesTab = activeMethod === 'content' && hasNotes;
    const showContentTab = activeMethod !== 'content' || !hasNotes;

    useEffect(() => {
        if (!showNotesTab && activeTab === 'notes') {
            setActiveTab('content');
        }
        if (!showContentTab && activeTab === 'content') {
            setActiveTab('notes');
        }
    }, [showNotesTab, showContentTab, activeTab]);

    return (
        <aside 
            ref={sidebarRef}
            className="bg-white dark:bg-[#111111] border-l border-gray-200 dark:border-white/10 flex flex-col h-full flex-shrink-0 relative"
            style={{ width: `${width}px` }}
        >
            {/* Resize Handle */}
            <div 
                className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-indigo-500/50 z-10 transition-colors"
                onMouseDown={startResizing}
            />

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-white/10">
                <button 
                    onClick={() => setActiveTab('chat')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
                        activeTab === 'chat' 
                        ? 'border-indigo-500 text-indigo-600 dark:text-white' 
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                    {t('studyRightPanel.chatTab')}
                </button>
                {showContentTab && (
                    <button 
                        onClick={() => setActiveTab('content')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
                            activeTab === 'content'
                            ? 'border-indigo-500 text-indigo-600 dark:text-white' 
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        {t('studyRightPanel.contentTab')}
                    </button>
                )}
                {showNotesTab && (
                    <button 
                        onClick={() => setActiveTab('notes')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
                            activeTab === 'notes'
                            ? 'border-indigo-500 text-indigo-600 dark:text-white' 
                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                    >
                        {t('studyRightPanel.notesTab')}
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 bg-white dark:bg-[#111111]">
                {activeTab === 'chat' && <ChatPanel documentId={documentId} attachment={attachment} onClearAttachment={onClearAttachment} />}
                {activeTab === 'content' && showContentTab && <div className="h-full min-h-0"><StudyContent /></div>}
                {activeTab === 'notes' && showNotesTab && <div className="h-full min-h-0"><StudyNotes /></div>}
            </div>
        </aside>
    );
};

export default StudyRightPanel;
