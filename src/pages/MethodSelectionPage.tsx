import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    FaCheck,
    FaChalkboardTeacher
} from 'react-icons/fa';
import { useAuth } from '../utils/AuthContext';

// --- Sidebar Component (Duplicate for independence, could be refactored) ---
const SelectionSidebar: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const methods = [
        { id: 'notes', label: 'Notes', icon: <FaBook /> },
        { id: 'multiple-choice', label: 'Multiple Choice', icon: <FaListUl /> },
        { id: 'flashcards', label: 'Flashcards', icon: <FaLayerGroup /> },
        { id: 'podcast', label: 'Podcast', icon: <FaPodcast /> },
        { id: 'fill-blanks', label: 'Fill in the Blanks', icon: <FaEdit /> },
        { id: 'written-tests', label: 'Written Test', icon: <FaPencilAlt /> },
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

            {/* Methods List (Visual only for selection page) */}
            <nav className="flex-1 overflow-y-auto p-2 space-y-1">
                {methods.map((method) => (
                    <div
                        key={method.id}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 cursor-default"
                    >
                        <span>{method.icon}</span>
                        <span>{method.label}</span>
                    </div>
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

// --- Main Page Component ---
const MethodSelectionPage: React.FC = () => {
    const navigate = useNavigate();
    const [selectedMethods, setSelectedMethods] = useState<string[]>(['tutor-lesson']); // Default selection as per screenshot

    const methods = [
        { id: 'notes', label: 'Notes', icon: <FaBook /> },
        { id: 'multiple-choice', label: 'Multiple Choice', icon: <FaListUl /> },
        { id: 'flashcards', label: 'Flashcards', icon: <FaLayerGroup /> },
        { id: 'podcast', label: 'Podcast', icon: <FaPodcast /> },
        { id: 'tutor-lesson', label: 'Tutor Lesson', icon: <FaChalkboardTeacher /> },
        { id: 'written-tests', label: 'Written Tests', icon: <FaPencilAlt /> },
        { id: 'fill-blanks', label: 'Fill in the Blanks', icon: <FaEdit /> },
    ];

    const toggleMethod = (id: string) => {
        if (selectedMethods.includes(id)) {
            setSelectedMethods(selectedMethods.filter(m => m !== id));
        } else {
            setSelectedMethods([...selectedMethods, id]);
        }
    };

    const handleGenerate = () => {
        // Navigate to the study material page
        navigate('/study-set/1'); 
    };

    return (
        <div className="min-h-screen bg-[#111111] text-white flex font-sans overflow-hidden">
            <SelectionSidebar />

            <main className="flex-1 flex flex-col relative">
                {/* Header */}
                <div className="h-16 border-b border-white/5 flex items-center px-8 flex-shrink-0">
                     <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-white mr-4">
                        <FaArrowLeft size={12} />
                     </button>
                     <h1 className="font-bold text-lg text-white">System Architecture Diagram</h1>
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col items-center justify-center p-8 overflow-y-auto">
                    <div className="max-w-4xl w-full">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold text-white mb-3">What would you like to include?</h2>
                            <p className="text-gray-400">Choose all the methods you want included in your study set:</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
                            {methods.map((method) => {
                                const isSelected = selectedMethods.includes(method.id);
                                return (
                                    <div 
                                        key={method.id}
                                        onClick={() => toggleMethod(method.id)}
                                        className={`flex items-center p-6 rounded-xl border cursor-pointer transition-all h-24 ${
                                            isSelected 
                                            ? 'bg-[#1a1a1a] border-white/20' 
                                            : 'bg-[#0f0f0f] border-white/5 hover:border-white/10'
                                        }`}
                                    >
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center mr-4 transition-colors ${
                                            isSelected ? 'bg-[#c2410c]/20 text-[#c2410c]' : 'bg-gray-800/50 text-gray-500'
                                        }`}>
                                            {isSelected ? (
                                                 method.id === 'tutor-lesson' ? <FaChalkboardTeacher size={20} /> : <FaCheck size={16} />
                                            ) : method.icon}
                                        </div>
                                        <span className={`font-medium text-lg ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                                            {method.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex justify-between items-center pt-6">
                            {/* Language Selector */}
                            <div className="relative">
                                <button className="flex items-center gap-2 bg-[#1a1a1a] border border-white/10 px-4 py-2.5 rounded-lg text-sm text-white hover:bg-[#252525] transition-colors min-w-[140px] justify-between">
                                    <div className="flex items-center gap-2">
                                        <span>🇺🇸</span>
                                        <span>English</span>
                                    </div>
                                    <FaChevronDown size={10} className="text-gray-500" />
                                </button>
                            </div>

                            <button 
                                onClick={handleGenerate}
                                className="bg-[#c2410c] hover:bg-[#9a3412] text-white px-12 py-3 rounded-lg font-bold transition-colors"
                            >
                                Generate
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MethodSelectionPage;
