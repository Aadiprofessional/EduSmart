import React from 'react';

const StudyTutorLesson: React.FC = () => {
    return (
        <div className="max-w-3xl mx-auto w-full h-full flex flex-col">
            <div className="prose prose-invert max-w-none">
                <h1 className="text-4xl font-bold mb-6">
                    Understanding a Comprehensive AI-Powered Application Architecture
                </h1>
                
                <p className="text-gray-300 leading-relaxed mb-8 text-lg">
                    This lesson explores the architecture of a sophisticated AI-powered application, breaking down its components and how they interact. We will look at the user-facing parts, the core logic that powers the system, the advanced AI models it uses, and the data storage and external services that support everything.
                </p>

                <h2 className="text-2xl font-bold mb-4 text-white">
                    User Interface and Frontend
                </h2>
                <p className="text-gray-300 leading-relaxed mb-6">
                    The <span className="italic text-white">User Interface (UI)</span> and <span className="italic text-white">Frontend</span> are what the end-user directly interacts with. It's the visual and interactive part of the application.
                </p>

                <ul className="space-y-6 text-gray-300">
                    <li className="flex gap-3">
                        <span className="text-white mt-1.5">•</span>
                        <span>
                            <strong className="text-white">User:</strong> This represents the individual using the system, sending inputs, and receiving outputs.
                        </span>
                    </li>
                    <li className="flex gap-3">
                        <span className="text-white mt-1.5">•</span>
                        <span>
                            <strong className="text-white">React App (Web / Mobile):</strong> This is the main application that users interact with. It's built using React, a popular JavaScript library for building user interfaces, and is designed to work seamlessly across both web browsers and mobile devices.
                        </span>
                    </li>
                    <li className="flex gap-3">
                        <span className="text-white mt-1.5">•</span>
                        <span>
                            <strong className="text-white">AI Chat Page:</strong> Within the React App, there's a specific page dedicated to handling conversations with AI. This is where users can engage in real-time or asynchronous chats powered by artificial intelligence.
                        </span>
                    </li>
                    <li className="flex gap-3">
                        <span className="text-white mt-1.5">•</span>
                        <span>
                            <strong className="text-white">Web Socket Client:</strong> This component within the frontend is responsible for establishing and maintaining a <span className="italic">real-time, bidirectional communication</span> channel with a WebSocket server. This is crucial for features like live chat, where messages need to be sent and received instantly without constantly refreshing the page.
                        </span>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default StudyTutorLesson;
