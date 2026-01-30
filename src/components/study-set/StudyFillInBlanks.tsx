import React from 'react';
import { FaChevronLeft, FaChevronRight, FaMagic } from 'react-icons/fa';

const StudyFillInBlanks: React.FC = () => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center h-full max-w-4xl mx-auto w-full px-4">
            {/* Stats Pills */}
            <div className="flex flex-wrap justify-center gap-2 mb-12">
                <div className="bg-red-900/30 border border-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div> 34 Unfamiliar
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

            {/* Question Card */}
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8 md:p-12 w-full max-w-2xl flex flex-col items-center shadow-lg mb-8">
                <h3 className="text-xl md:text-2xl font-medium text-center text-white mb-8 leading-relaxed">
                    The primary application interface for users, accessible via web and mobile platforms, is the
                    <span className="inline-block w-24 border-b-2 border-gray-600 mx-2"></span>.
                </h3>

                <div className="w-full max-w-md space-y-4">
                    <input 
                        type="text" 
                        placeholder="Type your answer" 
                        className="w-full bg-[#111] border border-white/10 rounded-lg py-3 px-4 text-center text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    
                    <div className="flex items-center justify-between pt-2">
                        <button className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center gap-2 transition-colors">
                            <FaMagic />
                            Need a hint?
                        </button>
                        
                        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                            Submit
                        </button>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-6">
                <button className="w-12 h-12 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-white hover:bg-[#252525] transition-colors">
                    <FaChevronLeft />
                </button>
                <span className="text-gray-400 font-medium">1 / 34</span>
                <button className="w-12 h-12 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-white hover:bg-[#252525] transition-colors">
                    <FaChevronRight />
                </button>
            </div>
        </div>
    );
};

export default StudyFillInBlanks;
