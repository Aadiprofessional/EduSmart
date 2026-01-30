import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  FaGraduationCap
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

// --- Components ---

const StudySidebar: React.FC<{ activeMethod: string; onSelectMethod: (id: string) => void }> = ({ activeMethod, onSelectMethod }) => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const methods = [
        { id: 'notes', label: 'Notes', icon: <FaBook /> },
        { id: 'multiple-choice', label: 'Multiple Choice', icon: <FaListUl /> },
        { id: 'flashcards', label: 'Flashcards', icon: <FaLayerGroup /> },
        { id: 'podcast', label: 'Podcast', icon: <FaPodcast /> },
        { id: 'fill-blanks', label: 'Fill in the Blanks', icon: <FaEdit /> },
        { id: 'written-tests', label: 'Written Test', icon: <FaPencilAlt /> },
        { id: 'tutor-lesson', label: 'Tutor Lesson', icon: <FaGraduationCap /> },
        { id: 'content', label: 'Content', icon: <FaFileAlt /> },
    ];

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

const StudyRightSidebar: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'chat' | 'content'>('chat');

    return (
        <aside className="w-80 bg-[#111111] border-l border-white/10 flex flex-col h-screen flex-shrink-0 hidden lg:flex">
             <div className="p-4 border-b border-white/5 flex gap-2">
                 <button 
                    onClick={() => setActiveTab('chat')}
                    className={`flex-1 py-1.5 rounded text-sm font-medium transition-colors ${activeTab === 'chat' ? 'bg-[#1a1a1a] text-white' : 'text-gray-500 hover:text-gray-300'}`}
                 >
                     Chat
                 </button>
                 <button 
                    onClick={() => setActiveTab('content')}
                    className={`flex-1 py-1.5 rounded text-sm font-medium transition-colors ${activeTab === 'content' ? 'bg-[#1a1a1a] text-white' : 'text-gray-500 hover:text-gray-300'}`}
                 >
                     Content
                 </button>
             </div>

             <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-500">
                 {activeTab === 'chat' ? (
                     <>
                        <div className="w-16 h-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-4">
                            <FaBook className="text-gray-600" />
                        </div>
                        <p className="text-sm">Ask me anything about the material...</p>
                     </>
                 ) : (
                    <div className="w-full h-full p-4">
                        <div className="bg-[#1a1a1a] border border-white/10 rounded-lg p-3">
                            <h4 className="text-white text-sm font-bold mb-2">Content</h4>
                            <div className="w-8 h-8 bg-blue-500/20 text-blue-400 rounded flex items-center justify-center">?</div>
                        </div>
                    </div>
                 )}
             </div>
             
             {activeTab === 'chat' && (
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
             )}
        </aside>
    );
};

// --- Main Page ---

const StudyMaterialPage: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeMethod, setActiveMethod] = useState('notes');

    // Mock Content
    const title = "System Architecture Diagram";

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
        <div className="min-h-screen bg-[#111111] text-white flex font-sans overflow-hidden">
            <StudySidebar activeMethod={activeMethod} onSelectMethod={setActiveMethod} />
            
            <main className="flex-1 flex flex-col min-w-0">
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
                <div className="flex-1 overflow-y-auto p-8 relative scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                    {renderContent()}
                </div>
            </main>

            <StudyRightSidebar />
        </div>
    );
};

export default StudyMaterialPage;
