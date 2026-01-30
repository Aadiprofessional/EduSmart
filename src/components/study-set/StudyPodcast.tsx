import React, { useState } from 'react';
import { 
    FaPlay, FaPause, FaStepBackward, FaStepForward, 
    FaVolumeUp, FaDownload, FaHandPaper 
} from 'react-icons/fa';

const StudyPodcast: React.FC = () => {
    const [isPlaying, setIsPlaying] = useState(false);

    const transcript = [
        {
            speaker: "Michael",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael", // Placeholder or generic avatar
            text: "Hey Simon, I was looking at this system architecture diagram, and it's quite impressive. It outlines a really comprehensive AI-powered application. We should definitely talk about it today.",
            align: "left"
        },
        {
            speaker: "Simon",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Simon",
            text: "Absolutely, Michael. It looks like a well-thought-out system. The front-end, in particular, caught my eye, with the React App serving as the core user interface, supporting both web and mobile, which is essential for broad accessibility these days.",
            align: "right"
        },
        {
            speaker: "Michael",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
            text: "Definitely. And it's not just a generic app; they've got specific pages like an AI Chat Page, which likely leverages the Web Socket Client for real-time interaction, and even dedicated pages for Speech/Video to Text, Image Generation, and Video Generation. That's a lot of functionality packed into one interface.",
            align: "left"
        },
        {
            speaker: "Simon",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Simon",
            text: "It really is. The App Router and Global Context Providers indicate a robust framework for navigation and state management, which is crucial for such a feature-rich application. Plus, they've included standard features like Profile and Dashboard, and even Stripe Billing for monetization.",
            align: "right"
        }
    ];

    return (
        <div className="max-w-4xl mx-auto w-full h-full flex flex-col px-4">
            {/* Audio Player Card */}
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6 mb-8 sticky top-0 z-10 shadow-xl">
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center overflow-hidden">
                            {/* Podcast Cover Art Placeholder */}
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Podcast" alt="Podcast" className="w-full h-full object-cover opacity-80" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg">System Architecture Diagram</h3>
                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> 0:00
                            </div>
                        </div>
                    </div>
                    
                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                        <FaHandPaper />
                        Raise Hand
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>0:00</span>
                        <span>-0:00</span>
                    </div>
                    <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden cursor-pointer group">
                        <div className="h-full bg-white w-0 group-hover:bg-indigo-500 transition-colors"></div>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-gray-400">
                        <FaVolumeUp size={14} />
                        <div className="w-20 h-1 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gray-400 w-1/2"></div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <button className="text-gray-400 hover:text-white transition-colors"><FaStepBackward /></button>
                        <button 
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black hover:scale-105 transition-transform"
                        >
                            {isPlaying ? <FaPause /> : <FaPlay className="ml-1" />}
                        </button>
                        <button className="text-gray-400 hover:text-white transition-colors"><FaStepForward /></button>
                    </div>

                    <div className="flex items-center gap-4 text-gray-400 text-sm">
                        <span className="cursor-pointer hover:text-white">1x</span>
                        <button className="hover:text-white"><FaDownload /></button>
                    </div>
                </div>
            </div>

            {/* Transcript */}
            <div className="space-y-6 pb-8">
                {transcript.map((item, index) => (
                    <div key={index} className={`flex gap-4 ${item.align === 'right' ? 'flex-row-reverse' : ''}`}>
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800 flex-shrink-0 border border-white/10">
                            <img src={item.avatar} alt={item.speaker} className="w-full h-full object-cover" />
                        </div>
                        <div className={`max-w-[80%] ${item.align === 'right' ? 'items-end' : 'items-start'} flex flex-col`}>
                            <span className="text-xs text-gray-500 mb-1 px-1">{item.speaker}</span>
                            <div className={`p-4 rounded-2xl border border-white/10 text-gray-300 text-sm leading-relaxed ${
                                item.align === 'right' ? 'bg-[#1a1a1a] rounded-tr-none' : 'bg-[#1a1a1a] rounded-tl-none'
                            }`}>
                                {item.text}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StudyPodcast;
