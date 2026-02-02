import React, { useState, useEffect } from 'react';
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
  FaProjectDiagram
} from 'react-icons/fa';
import { useAuth } from '../utils/AuthContext';

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

// --- Components ---

interface StudySidebarProps {
    activeMethod: string;
    onSelectMethod: (id: string) => void;
    allowedMethods?: Record<string, boolean>;
}

const StudySidebar: React.FC<StudySidebarProps> = ({ activeMethod, onSelectMethod, allowedMethods }) => {
    const navigate = useNavigate();
    const { user } = useAuth();

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
        { id: 'content', label: 'Content', icon: <FaFileAlt />, key: 'content' }, // Assuming content is always true or has a key
    ];

    const methods = allMethods.filter(method => {
        if (!allowedMethods) return true; // Show all if no config provided (legacy/direct access)
        if (method.id === 'content') return true; // Always show content? Or check key? User listed Content.
        return allowedMethods[method.key];
    });

    return (
        <aside className="w-64 bg-[#111111] border-r border-white/10 flex flex-col h-screen flex-shrink-0">
            {/* Header */}
            <div className="p-4 border-b border-white/5">
                <div className="flex items-center gap-2 mb-6 cursor-pointer" onClick={() => navigate('/dashboard')}>
                   <div className="text-indigo-500 text-xl font-bold">MatrixEdu</div>
                </div>
                
                <button 
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium mb-2"
                >
                    <FaArrowLeft size={10} />
                    <span>Back</span>
                </button>
            </div>

            {/* Methods List */}
            <nav className="flex-1 overflow-y-auto p-2 space-y-1">
                {methods.map((method) => (
                    <button
                        key={method.id}
                        onClick={() => onSelectMethod(method.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                            activeMethod === method.id 
                            ? 'bg-[#1a1a1a] text-white' 
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        <span className={activeMethod === method.id ? 'text-white' : 'text-gray-500'}>{method.icon}</span>
                        <span>{method.label}</span>
                    </button>
                ))}

                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:text-white hover:bg-white/5 transition-colors mt-4">
                    <FaPlus size={12} />
                    <span>ADD METHOD</span>
                </button>
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-white/5">
                <div className="flex items-center gap-3 px-2 py-2 cursor-pointer hover:bg-white/5 rounded transition-colors">
                    <div className="w-8 h-8 rounded-full bg-cyan-600 flex items-center justify-center text-xs font-bold text-white">
                        {user?.email?.substring(0, 2).toUpperCase() || 'AI'}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium truncate text-white">{user?.email?.split('@')[0] || 'User'}</p>
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
    const studySetData = location.state?.studySetData;
    const [activeMethod, setActiveMethod] = useState('notes');

    // Mock Content
    const title = studySetData?.title || "System Architecture Diagram"; // Use title from data if available

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
                return <StudyMultipleChoice />;
            case 'flashcards':
                return <StudyFlashcards />;
            case 'podcast':
                return <StudyPodcast />;
            case 'speech-to-text':
                return <StudySpeechToText />;
            case 'mindmap':
                return <StudyMindmap />;
            case 'fill-blanks':
                return <StudyFillInBlanks />;
            case 'written-tests':
                return <StudyWrittenTest />;
            case 'tutor-lesson':
                return <StudyTutorLesson />;
            case 'content':
                return <StudyContent />;
            default:
                return (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        Select a method to view content
                    </div>
                );
        }
    };

    return (
        <div className="h-screen bg-[#111111] text-white flex font-sans overflow-hidden">
            <StudySidebar 
                activeMethod={activeMethod} 
                onSelectMethod={setActiveMethod} 
                allowedMethods={studySetData}
            />
            
            <main className="flex-1 flex flex-col min-w-0 h-full">
                {/* Top Bar */}
                <div className="h-16 border-b border-white/5 flex items-center justify-between px-8 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-white">
                            <FaChevronLeft size={12} />
                        </button>
                        <h1 className="font-bold text-lg truncate">{title}</h1>
                    </div>
                    
                    <div className="flex items-center gap-4">
                         <button className="text-gray-400 hover:text-white text-sm font-medium flex items-center gap-2">
                             <span className="w-4 h-4 rounded border border-gray-600 flex items-center justify-center"><span className="text-[10px]">T</span></span>
                             Filter by Topic
                         </button>
                         <button className="text-gray-400 hover:text-white text-sm font-medium flex items-center gap-2">
                             <FaPencilAlt size={12} />
                             Edit Cards
                         </button>
                         <button className="text-gray-400 hover:text-white text-sm font-medium flex items-center gap-2">
                             Hide sidebar
                             <FaChevronRight size={10} />
                         </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className={`flex-1 relative ${activeMethod === 'notes' ? 'flex flex-col overflow-hidden' : 'overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent'}`}>
                    {renderContent()}
                </div>
            </main>

            <StudyRightPanel />
        </div>
    );
};

export default StudyMaterialPage;
