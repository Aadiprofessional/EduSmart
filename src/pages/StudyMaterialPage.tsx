import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaBook, 
  FaListUl, 
  FaLayerGroup, 
  FaPodcast, 
  FaEdit, 
  FaPencilAlt, 
  FaFileAlt, 
  FaPlus,
  FaChevronDown,
  FaChevronRight,
  FaChevronLeft,
  FaGraduationCap,
  FaMicrophone,
  FaProjectDiagram,
  FaBars,
    FaTimes,
    FaCommentDots,
    FaStopwatch
} from 'react-icons/fa';
import { useAuth } from '../utils/AuthContext';
import { supabase } from '../utils/supabase';

// Import Study Set Components
import StudyNotes from '../components/study-set/StudyNotes';
import StudyMultipleChoice from '../components/study-set/StudyMultipleChoice';
import StudyFlashcards from '../components/study-set/StudyFlashcards';
import StudyPodcast from '../components/study-set/StudyPodcast';
import StudyFillInBlanks from '../components/study-set/StudyFillInBlanks';
import StudyWrittenTest from '../components/study-set/StudyWrittenTest';
import StudyTutorLesson from '../components/study-set/StudyTutorLesson';
import StudyContent from '../components/study-set/StudyContent';
import StudyRightPanel from '../components/study-set/StudyRightPanel';
import StudyMindmap from '../components/study-set/StudyMindmap';
import StudySpeechToText from '../components/study-set/StudySpeechToText';
import StudyTimer from '../components/study-set/StudyTimer';
import { AddMethodModal } from '../components/study-set/AddMethodModal';

// --- Components ---

interface StudySidebarProps {
    activeMethod: string;
    onSelectMethod: (id: string) => void;
    onAddMethod: () => void;
    allowedMethods?: Record<string, boolean>;
    isOpen: boolean;
    onClose: () => void;
}

const allMethods = [
    { id: 'notes', label: 'Notes', icon: <FaBook />, key: 'notes' },
    { id: 'multiple-choice', label: 'Multiple Choice', icon: <FaListUl />, key: 'multiple_choice' },
    { id: 'flashcards', label: 'Flashcards', icon: <FaLayerGroup />, key: 'flashcards' },
    { id: 'podcast', label: 'Podcast', icon: <FaPodcast />, key: 'podcast' },
    { id: 'speech-to-text', label: 'Speech to Text', icon: <FaMicrophone />, key: 'speech_to_text' },
    { id: 'mindmap', label: 'Mindmap', icon: <FaProjectDiagram />, key: 'mindmap' },
    { id: 'fill-blanks', label: 'Fill in the Blanks', icon: <FaEdit />, key: 'fill_in_the_blanks' },
    { id: 'written-tests', label: 'Written Test', icon: <FaPencilAlt />, key: 'written_tests' },
    { id: 'tutor-lesson', label: 'Tutor Lesson', icon: <FaGraduationCap />, key: 'tutor_lesson' },
    { id: 'content', label: 'Content', icon: <FaFileAlt />, key: 'content' },
];

const StudySidebar: React.FC<StudySidebarProps> = ({ activeMethod, onSelectMethod, onAddMethod, allowedMethods, isOpen, onClose }) => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const methods = allMethods.filter(method => {
        if (!allowedMethods) return true; 
        if (method.id === 'content') return true; 
        return allowedMethods[method.key];
    });

    return (
        <aside className={`
            fixed inset-y-0 left-0 z-50 lg:relative lg:z-0
            w-64 bg-white dark:bg-[#111111] border-r border-gray-200 dark:border-white/10 
            flex flex-col h-full flex-shrink-0 transition-transform duration-300
            ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-white/5 flex justify-between items-center">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1 cursor-pointer" onClick={() => navigate('/dashboard')}>
                           <div className="text-indigo-600 dark:text-indigo-500 text-xl font-bold">MatrixEdu</div>
                        </div>
                        
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm font-medium"
                        >
                            <FaArrowLeft size={10} />
                            <span>Back</span>
                        </button>
                    </div>
                    {/* Close Button on Mobile */}
                    <button onClick={onClose} className="lg:hidden text-gray-500 dark:text-gray-400">
                        <FaTimes size={20} />
                    </button>
                </div>

                {/* Methods List */}
                <nav className="flex-1 overflow-y-auto p-2 space-y-1">
                    {methods.map((method) => (
                        <button
                            key={method.id}
                            onClick={() => {
                                onSelectMethod(method.id);
                                if (window.innerWidth < 1024) onClose();
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                                activeMethod === method.id 
                                ? 'bg-indigo-50 dark:bg-[#1a1a1a] text-indigo-600 dark:text-white font-medium' 
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
                            }`}
                        >
                            <span className={activeMethod === method.id ? 'text-indigo-600 dark:text-white' : 'text-gray-500'}>{method.icon}</span>
                            <span>{method.label}</span>
                        </button>
                    ))}

                    <button 
                        onClick={onAddMethod}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors mt-4"
                    >
                        <FaPlus size={12} />
                        <span>ADD METHOD</span>
                    </button>
                </nav>

                {/* User Profile */}
                <div className="p-4 border-t border-gray-200 dark:border-white/5">
                    <div className="flex items-center gap-3 px-2 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 rounded transition-colors">
                        <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-xs font-bold text-white">
                            {user?.email?.substring(0, 2).toUpperCase() || 'AI'}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium truncate text-gray-900 dark:text-white">{user?.email?.split('@')[0] || 'User'}</p>
                        </div>
                        <FaChevronDown size={12} className="text-gray-500" />
                    </div>
                </div>
            </aside>
    );
};

// --- Main Page ---

const StudyMaterialPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [studySetData, setStudySetData] = useState(location.state?.studySetData);
    const [pollingMethods, setPollingMethods] = useState<string[]>([]);

    const [activeMethod, setActiveMethod] = useState(() => {
        if (studySetData?.document_type === 'audio' || studySetData?.document_type === 'youtube' || studySetData?.document_type === 'video') {
            return 'speech-to-text';
        }
        return 'notes';
    });
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
    const [isRightPanelOpen, setIsRightPanelOpen] = useState(window.innerWidth >= 1280);
    const [isAddMethodModalOpen, setIsAddMethodModalOpen] = useState(false);
    const [isTimerOpen, setIsTimerOpen] = useState(false);
    const [chatAttachment, setChatAttachment] = useState<{ type: 'text', content: string, source: string } | null>(null);
    const [selectionButton, setSelectionButton] = useState<{ x: number, y: number, text: string, source: string } | null>(null);

    // Polling for updates when new methods are added
    useEffect(() => {
        if (pollingMethods.length === 0) return;

        const fetchUpdates = async () => {
            if (!id) return;
            const { data } = await supabase
                .from('upload_document')
                .select('*')
                .eq('document_id', id)
                .single();
            
            if (data) {
                // Merge pending methods as 'true' into the data for UI (optimistic)
                const mergedData = { ...data };
                pollingMethods.forEach(mId => {
                    const method = allMethods.find(m => m.id === mId);
                    if (method) mergedData[method.key] = true;
                });
                
                setStudySetData(mergedData);
                
                // Check if pending methods are now available in the REAL data
                const stillPending = pollingMethods.filter(methodId => {
                    const method = allMethods.find(m => m.id === methodId);
                    // If method key exists and is true, we are done with this one
                    // The key in database is usually like 'notes', 'multiple_choice' etc.
                    return method && !data[method.key];
                });
                
                if (stillPending.length !== pollingMethods.length) {
                    setPollingMethods(stillPending);
                }
            }
        };
        
        // Initial fetch immediately
        fetchUpdates();

        const interval = setInterval(fetchUpdates, 2000);
        return () => clearInterval(interval);
    }, [pollingMethods, id]);

    // Helper to get source label
    const getSourceLabel = (methodId: string) => {
        const method = allMethods.find(m => m.id === methodId);
        return method ? method.label : 'Study Material';
    };

    // Handle text selection
    useEffect(() => {
        const handleSelectionChange = () => {
            // Skip if forbidden methods
            if (['flashcards', 'multiple-choice'].includes(activeMethod)) {
                setSelectionButton(null);
                return;
            }

            const selection = window.getSelection();
            if (!selection || selection.isCollapsed || !selection.toString().trim()) {
                setSelectionButton(null);
                return;
            }

            // Check if selection is inside the main content area
            const anchorNode = selection.anchorNode;
            const focusNode = selection.focusNode;
            
            const isInsideMain = (node: Node | null) => {
                if (!node) return false;
                const element = node.nodeType === 1 ? node as Element : node.parentElement;
                return element?.closest('main') !== null;
            };

            if (!isInsideMain(anchorNode) || !isInsideMain(focusNode)) {
                setSelectionButton(null);
                return;
            }

            const text = selection.toString().trim();
            if (text.length > 0) {
                const range = selection.getRangeAt(0);
                const rect = range.getBoundingClientRect();
                
                // Show button above the selection
                setSelectionButton({
                    x: rect.left + (rect.width / 2),
                    y: rect.top - 50, // Position above selection
                    text,
                    source: getSourceLabel(activeMethod)
                });
            }
        };

        document.addEventListener('mouseup', handleSelectionChange);
        document.addEventListener('keyup', handleSelectionChange);
        
        return () => {
            document.removeEventListener('mouseup', handleSelectionChange);
            document.removeEventListener('keyup', handleSelectionChange);
        };
    }, [activeMethod]);

    // Add to Chat Helper
    const addToChat = (text: string, source: string = 'Study Material') => {
        setChatAttachment({ type: 'text', content: text, source });
        setSelectionButton(null);
        setIsRightPanelOpen(true);
        // Clear selection
        window.getSelection()?.removeAllRanges();
    };

    // Handle Command+U
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'u') {
                e.preventDefault();
                
                // Skip if forbidden methods
                if (['flashcards', 'multiple-choice'].includes(activeMethod)) return;

                const selection = window.getSelection();
                if (selection && !selection.isCollapsed) {
                    const text = selection.toString().trim();
                    if (text) {
                        addToChat(text, getSourceLabel(activeMethod));
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeMethod]);

    // Handle resize
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsSidebarOpen(false);
            } else {
                setIsSidebarOpen(true);
            }
            if (window.innerWidth < 1280) {
                setIsRightPanelOpen(false);
            } else {
                setIsRightPanelOpen(true);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch data if missing (e.g. on refresh)
    useEffect(() => {
        if (!studySetData && id) {
             const fetchData = async () => {
                const { data, error } = await supabase
                    .from('upload_document')
                    .select('*')
                    .eq('document_id', id)
                    .single();
                if (data) {
                    setStudySetData(data);
                }
                if (error) console.error("Error fetching study set:", error);
             };
             fetchData();
        }
    }, [id, studySetData]);

    // Determine title
    const title = studySetData?.document_name || (studySetData?.document_type ? studySetData.document_type.charAt(0).toUpperCase() + studySetData.document_type.slice(1) : (studySetData?.title || studySetData?.file_name || studySetData?.name || "Study Set"));

    const methods = allMethods.filter(method => {
        if (!studySetData) return true; 
        if (method.id === 'content') return true; 
        return studySetData[method.key];
    });

    // Scroll active method into view on mobile
    useEffect(() => {
        if (window.innerWidth < 1024) {
            const activeEl = document.getElementById(`mobile-nav-${activeMethod}`);
            if (activeEl) {
                activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            }
        }
    }, [activeMethod]);

    // If we have studySetData, ensure the activeMethod is one of the allowed ones
    useEffect(() => {
        if (studySetData) {
            // Mapping of keys to ids
            const keyToId: Record<string, string> = {
                'notes': 'notes',
                'multiple_choice': 'multiple-choice',
                'flashcards': 'flashcards',
                'podcast': 'podcast',
                'speech_to_text': 'speech-to-text',
                'mindmap': 'mindmap',
                'fill_in_the_blanks': 'fill-blanks',
                'written_tests': 'written-tests',
                'tutor_lesson': 'tutor-lesson',
                'content': 'content'
            };
            
            // If current active method is not allowed, switch to the first allowed one
            // This is a bit complex because we need to check if the 'activeMethod' (id) corresponds to a true key
            // Simplification: just check if the current activeMethod is valid.
            
            // Reverse map id to key
            const idToKey: Record<string, string> = {};
            Object.entries(keyToId).forEach(([k, v]) => idToKey[v] = k);
            
            const currentKey = idToKey[activeMethod];
            if (currentKey && studySetData[currentKey] === false && activeMethod !== 'content') {
                 // Find first allowed method
                 const firstAllowed = Object.entries(keyToId).find(([k, v]) => studySetData[k] === true);
                 if (firstAllowed) {
                     setActiveMethod(firstAllowed[1]);
                 } else {
                     setActiveMethod('content');
                 }
            }
        }
    }, [studySetData, activeMethod]);

    const renderContent = () => {
        switch (activeMethod) {
            case 'notes':
                return <StudyNotes />;
            case 'multiple-choice':
                return <StudyMultipleChoice onDiscuss={(text) => addToChat(text, 'Multiple Choice')} />;
            case 'flashcards':
                return <StudyFlashcards onDiscuss={(text) => addToChat(text, 'Flashcard')} />;
            case 'podcast':
                return <StudyPodcast onDiscuss={(text) => addToChat(text, 'Podcast')} />;
            case 'speech-to-text':
                return <StudySpeechToText onDiscuss={(text) => addToChat(text, 'Speech to Text')} documentType={studySetData?.document_type} />;
            case 'mindmap':
                return <StudyMindmap />;
            case 'fill-blanks':
                return <StudyFillInBlanks onDiscuss={(text) => addToChat(text, 'Fill in the Blanks')} />;
            case 'written-tests':
                return <StudyWrittenTest onDiscuss={(text) => addToChat(text, 'Written Test')} />;
            case 'tutor-lesson':
                return <StudyTutorLesson />;
            case 'content':
                return <StudyContent />;
            default:
                return (
                    <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                        Select a method to view content
                    </div>
                );
        }
    };

    return (
        <div className="h-[100dvh] bg-gray-50 dark:bg-[#111111] text-gray-900 dark:text-white flex font-sans overflow-hidden relative">
            {/* Mobile Overlays */}
            {(isSidebarOpen && window.innerWidth < 1024) && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}
            {(isRightPanelOpen && window.innerWidth < 1280) && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 xl:hidden"
                    onClick={() => setIsRightPanelOpen(false)}
                />
            )}

            <StudySidebar 
                    activeMethod={activeMethod} 
                    onSelectMethod={setActiveMethod} 
                    onAddMethod={() => setIsAddMethodModalOpen(true)}
                    allowedMethods={studySetData}
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                />
            
            <main className="flex-1 flex flex-col min-w-0 h-full relative">
                {/* Top Bar */}
                <div className="h-16 border-b border-gray-200 dark:border-white/5 flex items-center justify-between px-4 md:px-8 flex-shrink-0 bg-white dark:bg-[#111111]">
                    <div className="flex items-center gap-4">
                        {/* Left Sidebar Toggle */}
                        {!isSidebarOpen && (
                            <button 
                                onClick={() => setIsSidebarOpen(true)}
                                className="hidden lg:block p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
                            >
                                <FaBars size={18} />
                            </button>
                        )}

                        <button onClick={() => navigate('/dashboard')} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hidden md:block">
                            <FaChevronLeft size={12} />
                        </button>
                        <h1 className="font-bold text-lg truncate text-gray-900 dark:text-white">{title}</h1>
                    </div>
                    
                    <div className="flex items-center gap-2 md:gap-4">
                        {/* Timer Button */}
                        <button
                            onClick={() => setIsTimerOpen(!isTimerOpen)}
                            className={`p-2 rounded-lg transition-colors ${isTimerOpen ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'}`}
                            title="Study Timer"
                        >
                            <FaStopwatch size={18} />
                        </button>

                         {/* Right Panel Toggle */}
                         {!isRightPanelOpen && (
                            <button 
                                onClick={() => setIsRightPanelOpen(true)}
                                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm font-medium flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                            >
                                <FaBook size={14} />
                                <span className="hidden sm:inline">Resources</span>
                            </button>
                         )}
                    </div>
                </div>

                {/* Mobile Navigation */}
                <div className="lg:hidden bg-white dark:bg-[#111111] border-b border-gray-200 dark:border-white/5 overflow-x-auto no-scrollbar">
                    <div className="flex items-center px-4 py-2 gap-2 min-w-max">
                        {methods.map((method) => (
                            <button
                                key={method.id}
                                id={`mobile-nav-${method.id}`}
                                onClick={() => setActiveMethod(method.id)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                                    activeMethod === method.id 
                                    ? 'bg-indigo-600 text-white shadow-sm' 
                                    : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
                                }`}
                            >
                                <span>{method.icon}</span>
                                <span>{method.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className={`flex-1 relative bg-gray-50 dark:bg-[#111111] ${['notes', 'podcast', 'speech-to-text', 'tutor-lesson'].includes(activeMethod) ? 'flex flex-col overflow-hidden' : 'overflow-y-auto p-4 md:p-8 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-800 scrollbar-track-transparent'}`}>
                    {renderContent()}
                </div>
            </main>

            {/* Right Panel */}
            <div className={`
                fixed inset-y-0 right-0 z-50 xl:relative xl:z-0
                bg-white dark:bg-[#111111] border-l border-gray-200 dark:border-white/10
                transition-transform duration-300 shadow-2xl xl:shadow-none
                ${isRightPanelOpen ? 'translate-x-0' : 'translate-x-full xl:translate-x-0 xl:hidden'}
            `}>
                <div className="h-full flex flex-col relative">
                     {/* Close Button on Mobile */}
                     <button 
                        onClick={() => setIsRightPanelOpen(false)} 
                        className="absolute top-4 right-4 z-50 xl:hidden text-gray-500 dark:text-gray-400 p-2 rounded-full bg-gray-100 dark:bg-[#1a1a1a]"
                    >
                        <FaTimes size={16} />
                    </button>
                    <StudyRightPanel 
                        activeMethod={activeMethod} 
                        documentId={id} 
                        attachment={chatAttachment}
                        onClearAttachment={() => setChatAttachment(null)}
                    />
                </div>
            </div>

            {/* Floating Add to Chat Button */}
            {selectionButton && (
                <button
                    style={{
                        position: 'fixed',
                        left: selectionButton.x,
                        top: selectionButton.y,
                        transform: 'translate(-50%, 0)',
                        zIndex: 100
                    }}
                    onClick={(e) => {
                        e.stopPropagation();
                        addToChat(selectionButton.text, selectionButton.source);
                    }}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-indigo-700 transition-all animate-in fade-in zoom-in duration-200"
                >
                    <FaCommentDots />
                    <span className="text-sm font-medium">Add to Chat</span>
                    <span className="text-xs opacity-75 bg-indigo-800 px-1.5 py-0.5 rounded ml-1">⌘U</span>
                </button>
            )}

            {/* Study Timer */}
            <StudyTimer isOpen={isTimerOpen} onClose={() => setIsTimerOpen(false)} />

            {/* Add Method Modal */}
            <AddMethodModal
                isOpen={isAddMethodModalOpen}
                onClose={() => setIsAddMethodModalOpen(false)}
                studySetData={studySetData}
                documentId={id!}
                onMethodAdded={(methods) => {
                    setPollingMethods(prev => [...prev, ...methods]);
                    if (methods.length > 0) {
                        setActiveMethod(methods[0]); // Switch immediately
                    }
                    
                    // Initial optimistic update
                    setStudySetData((prev: any) => {
                         if (!prev) return prev;
                         const newData = { ...prev };
                         methods.forEach(mId => {
                             const method = allMethods.find(m => m.id === mId);
                             if (method) newData[method.key] = true;
                         });
                         return newData;
                    });
                }}
            />
        </div>
    );
};

export default StudyMaterialPage;
