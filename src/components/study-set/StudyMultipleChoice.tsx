import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const StudyMultipleChoice: React.FC = () => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center h-full max-w-5xl mx-auto w-full px-4">
            {/* Stats Pills */}
            <div className="flex flex-wrap justify-center gap-2 mb-12">
                <div className="bg-red-900/30 border border-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div> 24 Unfamiliar
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

            {/* Question */}
            <h2 className="text-xl md:text-2xl font-medium text-center text-white mb-12 max-w-3xl leading-relaxed">
                What is the primary function of the 'Web Socket Client' within the User Interface/Frontend section of the system architecture?
            </h2>

            {/* Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-12">
                <button className="bg-[#1a1a1a] border border-white/10 hover:border-white/20 hover:bg-[#252525] rounded-xl p-4 flex items-center gap-4 text-left transition-all group">
                    <div className="w-8 h-8 rounded bg-indigo-900/50 text-indigo-500 font-bold flex items-center justify-center flex-shrink-0 border border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white transition-colors">1</div>
                    <span className="text-gray-300 group-hover:text-white text-sm md:text-base">It processes user authentication requests from various providers.</span>
                </button>
                <button className="bg-[#1a1a1a] border border-white/10 hover:border-white/20 hover:bg-[#252525] rounded-xl p-4 flex items-center gap-4 text-left transition-all group">
                    <div className="w-8 h-8 rounded bg-indigo-900/50 text-indigo-500 font-bold flex items-center justify-center flex-shrink-0 border border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white transition-colors">2</div>
                    <span className="text-gray-300 group-hover:text-white text-sm md:text-base">It manages the overall application routing and user navigation.</span>
                </button>
                <button className="bg-[#1a1a1a] border border-white/10 hover:border-white/20 hover:bg-[#252525] rounded-xl p-4 flex items-center gap-4 text-left transition-all group">
                    <div className="w-8 h-8 rounded bg-indigo-900/50 text-indigo-500 font-bold flex items-center justify-center flex-shrink-0 border border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white transition-colors">3</div>
                    <span className="text-gray-300 group-hover:text-white text-sm md:text-base">It connects to an external database for secure user data storage.</span>
                </button>
                <button className="bg-[#1a1a1a] border border-white/10 hover:border-white/20 hover:bg-[#252525] rounded-xl p-4 flex items-center gap-4 text-left transition-all group">
                    <div className="w-8 h-8 rounded bg-indigo-900/50 text-indigo-500 font-bold flex items-center justify-center flex-shrink-0 border border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white transition-colors">4</div>
                    <span className="text-gray-300 group-hover:text-white text-sm md:text-base">It establishes a secure, real-time connection to a WebSocket server.</span>
                </button>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-6">
                <button className="w-12 h-12 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-white hover:bg-[#252525] transition-colors">
                    <FaChevronLeft />
                </button>
                <span className="text-gray-400 font-medium">2 / 24</span>
                <button className="w-12 h-12 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-white hover:bg-[#252525] transition-colors">
                    <FaChevronRight />
                </button>
            </div>
        </div>
    );
};

export default StudyMultipleChoice;
