import React, { useState, useEffect, useRef } from 'react';
import { FaBook, FaArrowLeft } from 'react-icons/fa';
import StudyContent from './StudyContent';
import StudyNotes from './StudyNotes';

// --- Sub-components for Right Panel ---

const ChatPanel: React.FC = () => {
    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500 dark:text-gray-400">
                <div className="w-16 h-16 bg-gray-100 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center mb-4">
                    <FaBook className="text-gray-400 dark:text-gray-600" />
                </div>
                <p className="text-sm">Ask me anything about the material...</p>
            </div>
            
            <div className="p-4 border-t border-gray-200 dark:border-white/5">
                <div className="relative">
                    <input 
                       type="text" 
                       placeholder="Ask me anything..." 
                       className="w-full bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl py-3 pl-4 pr-10 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-600 focus:outline-none focus:border-indigo-500 dark:focus:border-white/20"
                    />
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-gray-600 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600">
                        <FaArrowLeft size={10} className="rotate-90" />
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Main Right Panel Component ---

interface StudyRightPanelProps {
    activeMethod?: string;
}

const StudyRightPanel: React.FC<StudyRightPanelProps> = ({ activeMethod }) => {
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

    // Handle tab switching logic based on activeMethod
    useEffect(() => {
        // If the current tab becomes invalid for the new method, switch it
        if (activeMethod === 'content' && activeTab === 'content') {
            setActiveTab('notes');
        } else if (activeMethod !== 'content' && activeTab === 'notes') {
            setActiveTab('content');
        }
    }, [activeMethod, activeTab]);

    const handleSecondTabClick = () => {
        if (activeMethod === 'content') {
            setActiveTab('notes');
        } else {
            setActiveTab('content');
        }
    };

    const isSecondTabActive = activeTab === 'content' || activeTab === 'notes';

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
                    Chat
                </button>
                <button 
                    onClick={handleSecondTabClick}
                    className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
                        isSecondTabActive
                        ? 'border-indigo-500 text-indigo-600 dark:text-white' 
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                    {activeMethod === 'content' ? 'Notes' : 'Content'}
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto bg-white dark:bg-[#111111]">
                {activeTab === 'chat' && <ChatPanel />}
                {activeTab === 'content' && <div className="p-6"><StudyContent /></div>}
                {activeTab === 'notes' && <div className="p-0 h-full"><StudyNotes /></div>}
            </div>
        </aside>
    );
};

export default StudyRightPanel;
