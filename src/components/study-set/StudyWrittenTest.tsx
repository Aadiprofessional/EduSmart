import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const StudyWrittenTest: React.FC = () => {
    return (
        <div className="flex-1 flex flex-col items-center justify-center h-full max-w-4xl mx-auto w-full px-4">
            {/* Stats Pills */}
            <div className="flex flex-wrap justify-center gap-2 mb-12">
                <div className="bg-red-900/30 border border-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div> 20 Unfamiliar
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
            <div className="w-full max-w-3xl mb-8">
                <h3 className="text-xl md:text-2xl font-medium text-center text-white mb-8 leading-relaxed">
                    What is the primary function of the React App in this system architecture?
                </h3>

                <div className="w-full space-y-4">
                    <textarea 
                        placeholder="Type your answer here... (Press Enter to submit)" 
                        className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors h-48 resize-none"
                    ></textarea>
                    
                    <div className="flex justify-end">
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
                <span className="text-gray-400 font-medium">1 / 20</span>
                <button className="w-12 h-12 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-white hover:bg-[#252525] transition-colors">
                    <FaChevronRight />
                </button>
            </div>
        </div>
    );
};

export default StudyWrittenTest;
