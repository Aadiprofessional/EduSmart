import React from 'react';
import { 
  FaChevronDown, FaBold, FaItalic, FaUnderline, FaStrikethrough, 
  FaListUl, FaListOl, FaQuoteRight, FaCode, FaMinus, FaImage, FaEraser
} from 'react-icons/fa';

const StudyNotes: React.FC = () => {
    return (
        <div className="max-w-3xl mx-auto w-full h-full flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 bg-[#1a1a1a] rounded-lg mb-6 sticky top-0 z-10 border border-white/5 overflow-x-auto">
                 <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded flex-shrink-0"><span className="text-xs font-bold">Sans Serif</span> <FaChevronDown size={8} className="inline ml-1" /></button>
                 <div className="w-px h-4 bg-white/10 mx-1 flex-shrink-0"></div>
                 <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded flex-shrink-0"><FaBold size={12} /></button>
                 <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded flex-shrink-0"><FaItalic size={12} /></button>
                 <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded flex-shrink-0"><FaUnderline size={12} /></button>
                 <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded flex-shrink-0"><FaStrikethrough size={12} /></button>
                 <div className="w-px h-4 bg-white/10 mx-1 flex-shrink-0"></div>
                 <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded flex-shrink-0 flex items-center gap-1"><span className="text-xs font-bold">H1</span> <FaChevronDown size={8} /></button>
                 <div className="w-px h-4 bg-white/10 mx-1 flex-shrink-0"></div>
                 <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded flex-shrink-0"><FaListUl size={12} /></button>
                 <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded flex-shrink-0"><FaListOl size={12} /></button>
                 <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded flex-shrink-0"><FaQuoteRight size={12} /></button>
                 <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded flex-shrink-0"><FaCode size={12} /></button>
                 <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded flex-shrink-0"><FaMinus size={12} /></button>
                 <div className="w-px h-4 bg-white/10 mx-1 flex-shrink-0"></div>
                 <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded flex-shrink-0"><FaImage size={12} /></button>
                 <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded flex-shrink-0"><FaEraser size={12} /></button>
            </div>

            {/* Document Content */}
            <div className="prose prose-invert max-w-none">
                <h1 className="flex items-center gap-3 text-3xl font-bold mb-6">
                    <span className="text-4xl">🧠</span> AI System Architecture Overview
                </h1>
                <p className="text-gray-300 leading-relaxed mb-6">
                    This document outlines the comprehensive system architecture of an advanced AI-powered application, detailing its various components, their interconnections, and the overall flow of data and functionality. The system leverages a <span className="text-blue-400 cursor-pointer hover:underline">React frontend</span>, a robust <span className="text-blue-400 cursor-pointer hover:underline">backend with core logic</span>, advanced <span className="text-blue-400 cursor-pointer hover:underline">AI/Deep Learning models</span>, and integrated <span className="text-blue-400 cursor-pointer hover:underline">data storage/external services</span> to deliver a wide range of AI features.
                </p>

                <h2 className="flex items-center gap-3 text-2xl font-bold mb-4 mt-8">
                    <span className="text-3xl">🚀</span> User Interface / Frontend Components
                </h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                    The frontend serves as the primary <span className="text-blue-400 cursor-pointer hover:underline">point of interaction</span> for end-users, built for both web and mobile platforms.
                </p>
                <ul className="list-disc pl-6 space-y-3 text-gray-300">
                    <li><strong className="text-blue-400">User:</strong> Represents the <strong className="text-blue-400">end-user</strong> who interacts with the system.</li>
                    <li><strong className="text-blue-400">React App (Web / Mobile):</strong> The core application interface, providing access to all features.
                        <ul className="list-disc pl-6 mt-2 space-y-2">
                            <li><strong className="text-blue-400">AI Chat Page:</strong> A dedicated interface within the React App for <strong className="text-blue-400">real-time AI chat</strong> functionalities.</li>
                            <li><strong className="text-blue-400">Web Socket Client:</strong> Facilitates <strong className="text-blue-400">real-time communication</strong> with the backend WebSocket server, crucial for interactive features like chat.</li>
                            <li><strong className="text-blue-400">App Router:</strong> Manages <strong className="text-blue-400">navigation and routing</strong> across different sections and pages of the application.</li>
                            <li><strong className="text-blue-400">Global Context Providers:</strong> Ensures <strong className="text-blue-400">shared data and state</strong> are accessible across various components, promoting efficient state management.</li>
                            <li><strong className="text-blue-400">Application Pages:</strong> A collection of specialized pages offering diverse functionalities:
                                <ul className="list-disc pl-6 mt-2 space-y-2">
                                    <li><strong className="text-blue-400">Speech / Video -{'>'} Text:</strong> Feature for <strong className="text-blue-400">converting spoken language or video dialogue into text</strong>.</li>
                                    <li><strong className="text-blue-400">Image Generator:</strong> Enables users to <strong className="text-blue-400">generate images</strong> based on prompts or inputs.</li>
                                </ul>
                            </li>
                        </ul>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default StudyNotes;
