import React, { useState, useRef, useEffect } from 'react';
import { FaPlay, FaPause, FaForward, FaBackward, FaDownload, FaMicrophone, FaCopy, FaSearch } from 'react-icons/fa';

const StudySpeechToText: React.FC = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(180); // Mock 3 minutes
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Mock Transcript Data
    const transcript = [
        { time: 0, text: "Welcome to this lecture on AI System Architecture." },
        { time: 5, text: "Today we will be discussing the core components that make up a modern AI application." },
        { time: 12, text: "First, let's look at the Frontend, which is typically built with React." },
        { time: 18, text: "The frontend communicates with the backend via REST APIs and WebSockets." },
        { time: 25, text: "This ensures real-time updates for features like chat and notifications." },
        { time: 32, text: "Next, we have the Backend services, often microservices." },
        { time: 40, text: "These handle authentication, data processing, and business logic." },
        { time: 55, text: "Crucially, the AI models sit at the heart of this system." },
        { time: 65, text: "We use NLP models for text processing and diffusion models for image generation." },
        { time: 80, text: "Finally, data storage is handled by a combination of SQL and Vector databases." }
    ];

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const filteredTranscript = transcript.filter(item => 
        item.text.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="h-full flex flex-col bg-[#111111] text-white overflow-hidden">
            {/* Audio Player Header */}
            <div className="p-6 border-b border-white/10 bg-[#1a1a1a]">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#c2410c]/20 flex items-center justify-center text-[#c2410c]">
                            <FaMicrophone size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Lecture_Audio_Recording.mp3</h2>
                            <p className="text-sm text-gray-400">Processed on Feb 14, 2025 • 3:00 Duration</p>
                        </div>
                    </div>
                    <button className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-gray-300 hover:text-white">
                        <FaDownload />
                    </button>
                </div>

                {/* Controls */}
                <div className="flex flex-col gap-2">
                    <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden cursor-pointer">
                        <div 
                            className="bg-[#c2410c] h-full" 
                            style={{ width: `${(currentTime / duration) * 100}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>

                    <div className="flex items-center justify-center gap-6 mt-2">
                        <button className="text-gray-400 hover:text-white transition-colors"><FaBackward /></button>
                        <button 
                            onClick={togglePlay}
                            className="w-12 h-12 bg-[#c2410c] hover:bg-[#9a3412] rounded-full flex items-center justify-center text-white transition-colors shadow-lg shadow-orange-900/20"
                        >
                            {isPlaying ? <FaPause /> : <FaPlay className="ml-1" />}
                        </button>
                        <button className="text-gray-400 hover:text-white transition-colors"><FaForward /></button>
                    </div>
                </div>
            </div>

            {/* Transcript Area */}
            <div className="flex-1 flex flex-col min-h-0">
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#111111]">
                    <h3 className="font-bold text-gray-300">Transcript</h3>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs" />
                            <input 
                                type="text" 
                                placeholder="Search transcript..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-[#1a1a1a] border border-white/10 rounded-full py-1.5 pl-8 pr-4 text-xs text-white focus:outline-none focus:border-[#c2410c]"
                            />
                        </div>
                        <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">
                            <FaCopy size={14} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {filteredTranscript.length > 0 ? (
                        filteredTranscript.map((item, index) => (
                            <div 
                                key={index} 
                                className={`flex gap-4 p-3 rounded-xl transition-colors cursor-pointer ${
                                    currentTime >= item.time && currentTime < (transcript[index + 1]?.time || duration)
                                    ? 'bg-[#c2410c]/10 border border-[#c2410c]/20'
                                    : 'hover:bg-white/5 border border-transparent'
                                }`}
                                onClick={() => setCurrentTime(item.time)}
                            >
                                <span className="text-xs font-mono text-gray-500 mt-1 min-w-[40px]">{formatTime(item.time)}</span>
                                <p className={`text-sm leading-relaxed ${
                                    currentTime >= item.time && currentTime < (transcript[index + 1]?.time || duration)
                                    ? 'text-white'
                                    : 'text-gray-400'
                                }`}>
                                    {item.text}
                                </p>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            No matching text found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudySpeechToText;
