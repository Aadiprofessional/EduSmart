import React, { useState, useEffect, useRef } from 'react';
import { FaBook, FaArrowLeft } from 'react-icons/fa';
import StudyContent from './StudyContent';
import StudyNotes from './StudyNotes';

// --- Sub-components for Right Panel ---

const ChatPanel: React.FC = () => {
    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
                <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-4">
                    <FaBook className="text-gray-600" />
                </div>
                <p className="text-sm">Ask me anything about the material...</p>
            </div>
            
            <div className="p-4 border-t border-white/5">
                <div className="relative">
                    <input 
                       type="text" 
                       placeholder="Ask me anything..." 
                       className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl py-3 pl-4 pr-10 text-white placeholder-gray-600 focus:outline-none focus:border-white/20"
                    />
                    <button className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center text-white hover:bg-gray-600">
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
    const [width, setWidth] = useState(450);
    const [isResizing, setIsResizing] = useState(false);
    const sidebarRef = useRef<HTMLDivElement>(null);

    const startResizing = (e: React.MouseEvent) => {
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
            className="bg-[#111111] border-l border-white/10 flex flex-col h-screen flex-shrink-0 relative hidden lg:flex"
            style={{ width: `${width}px` }}
        >
            {/* Resize Handle */}
            <div 
                className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-blue-500/50 z-50 group flex items-center justify-center"
                onMouseDown={startResizing}
            >
                <div className="h-8 w-1 bg-gray-700 rounded-full group-hover:bg-blue-500 transition-colors opacity-0 group-hover:opacity-100" />
            </div>

            {/* Tabs */}
            <div className="p-4 border-b border-white/5 flex gap-2">
                <button 
                   onClick={() => setActiveTab('chat')}
                   className={`flex-1 py-1.5 rounded text-sm font-medium transition-colors ${activeTab === 'chat' ? 'bg-[#1a1a1a] text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    Chat
                </button>
                <button 
                   onClick={handleSecondTabClick}
                   className={`flex-1 py-1.5 rounded text-sm font-medium transition-colors ${isSecondTabActive ? 'bg-[#1a1a1a] text-white' : 'text-gray-500 hover:text-gray-300'}`}
                >
                    {activeMethod === 'content' ? 'Notes' : 'Content'}
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'chat' && <ChatPanel />}
                
                {activeTab === 'content' && (
                    <div className="w-full h-full overflow-y-auto">
                        <StudyContent />
                    </div>
                )}
                
                {activeTab === 'notes' && (
                    <div className="w-full h-full overflow-y-auto">
                        <StudyNotes />
                    </div>
                )}
            </div>
        </aside>
    );
};

export default StudyRightPanel;
