import React, { useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaImage } from 'react-icons/fa';

const StudyFlashcards: React.FC = () => {
    const [flipped, setFlipped] = useState(false);

    return (
        <div className="flex-1 flex flex-col items-center justify-center h-full max-w-4xl mx-auto w-full px-4">
            {/* Stats Pills */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
                <div className="bg-red-900/30 border border-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div> 22 Unfamiliar
                </div>
                <div className="bg-indigo-900/30 border border-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div> 0 Learning
                </div>
                <div className="bg-blue-900/30 border border-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div> 0 Familiar
                </div>
                <div className="bg-green-900/30 border border-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div> 0 Mastered
                </div>
            </div>

            {/* Flashcard */}
            <div className="w-full aspect-[16/9] perspective-1000 mb-8 cursor-pointer group" onClick={() => setFlipped(!flipped)}>
                 <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${flipped ? 'rotate-y-180' : ''}`}>
                     {/* Front */}
                     <div className="absolute inset-0 bg-[#111] border border-white/10 rounded-2xl p-8 md:p-12 flex flex-col items-center justify-center backface-hidden group-hover:border-white/20 transition-colors shadow-2xl shadow-black/50">
                         <div className="absolute top-6 left-6 text-gray-500"><FaImage /></div>
                         <h3 className="text-xl md:text-2xl font-medium text-center leading-relaxed">What is the primary user interface for the system?</h3>
                         
                         <div className="absolute bottom-6 flex flex-col items-center gap-2">
                            <span className="text-sm text-gray-500">Click to flip</span>
                            <span className="bg-[#1a1a1a] px-2 py-1 rounded text-xs text-gray-400 font-mono border border-white/5">space</span>
                         </div>
                         
                         <div className="absolute bottom-6 left-6 text-gray-600 hover:text-red-400 transition-colors">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                             </svg>
                         </div>
                     </div>

                     {/* Back */}
                     <div className="absolute inset-0 bg-[#111] border border-white/10 rounded-2xl p-8 md:p-12 flex flex-col items-center justify-center backface-hidden rotate-y-180 group-hover:border-white/20 transition-colors shadow-2xl shadow-black/50">
                         <h3 className="text-xl md:text-2xl font-medium text-center text-blue-400 mb-4">React App (Web / Mobile)</h3>
                         <p className="text-gray-400 text-center max-w-lg leading-relaxed">The core application interface, providing access to all features.</p>
                     </div>
                 </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-6">
                <button className="w-12 h-12 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-white hover:bg-[#252525] transition-colors">
                    <FaChevronLeft />
                </button>
                <span className="text-gray-400 font-medium">1 / 22</span>
                <button className="w-12 h-12 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-white hover:bg-[#252525] transition-colors">
                    <FaChevronRight />
                </button>
            </div>
        </div>
    );
};

export default StudyFlashcards;
