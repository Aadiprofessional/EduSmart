import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRobot, FaTimes, FaPaperPlane, FaQuestion, FaGraduationCap, FaCalendarAlt, FaInfo } from 'react-icons/fa';
import IconComponent from './IconComponent';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

const preDefinedCommands = [
  { command: 'help', description: 'Display available commands', icon: <IconComponent icon={FaQuestion} /> },
  { command: 'courses', description: 'Show featured courses', icon: <IconComponent icon={FaGraduationCap} /> },
  { command: 'schedule', description: 'View upcoming events', icon: <IconComponent icon={FaCalendarAlt} /> },
  { command: 'about', description: 'Learn about EduSmart', icon: <IconComponent icon={FaInfo} /> },
];

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: 'Hello! How can I assist you with EduSmart today?', sender: 'bot' },
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat window when new messages appear
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const processCommand = (command: string): string => {
    const lowercaseCommand = command.toLowerCase().trim();
    
    switch (lowercaseCommand) {
      case 'help':
        return 'Available commands: help, courses, schedule, about';
      case 'courses':
        return 'Featured Courses: Advanced AI, Machine Learning Fundamentals, Data Science with Python, Web Development Bootcamp';
      case 'schedule':
        return 'Upcoming Events: AI Symposium (May 15), Career Fair (June 2), Programming Workshop (June 10)';
      case 'about':
        return 'EduSmart is your one-stop platform for educational resources, courses, scholarships, and career planning. We help students and professionals navigate their learning journey with smart tools and curated content.';
      default:
        return `I don't recognize that command. Type 'help' to see available commands.`;
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!inputValue.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
    };
    
    setMessages((prev) => [...prev, userMessage]);
    
    // Process and add bot response
    setTimeout(() => {
      const botResponse: Message = {
        id: messages.length + 2,
        text: processCommand(inputValue),
        sender: 'bot',
      };
      
      setMessages((prev) => [...prev, botResponse]);
    }, 500);
    
    setInputValue('');
  };

  const handleQuickCommand = (command: string) => {
    setInputValue(command);
    
    // Trigger submit
    const userMessage: Message = {
      id: messages.length + 1,
      text: command,
      sender: 'user',
    };
    
    setMessages((prev) => [...prev, userMessage]);
    
    setTimeout(() => {
      const botResponse: Message = {
        id: messages.length + 2,
        text: processCommand(command),
        sender: 'bot',
      };
      
      setMessages((prev) => [...prev, botResponse]);
    }, 500);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Bot toggle button */}
      <motion.button
        onClick={toggleChat}
        className="bg-teal-700 hover:bg-teal-800 text-white p-4 rounded-full shadow-lg"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {isOpen ? <IconComponent icon={FaTimes} size={20} /> : <IconComponent icon={FaRobot} size={20} />}
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ type: 'spring', damping: 25 }}
            className="absolute bottom-16 right-0 w-80 h-96 bg-white rounded-lg shadow-xl overflow-hidden"
          >
            {/* Chat header */}
            <div className="bg-teal-700 text-white p-3">
              <h3 className="font-bold flex items-center">
                <IconComponent icon={FaRobot} className="mr-2" /> EduSmart Assistant
              </h3>
            </div>

            {/* Chat messages */}
            <div className="p-3 h-64 overflow-y-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`mb-3 ${
                    message.sender === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  <div
                    className={`inline-block p-2 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick commands */}
            <div className="px-3 pb-2">
              <div className="flex space-x-2 mb-2 overflow-x-auto pb-1">
                {preDefinedCommands.map((cmd) => (
                  <button
                    key={cmd.command}
                    onClick={() => handleQuickCommand(cmd.command)}
                    className="flex items-center bg-gray-100 hover:bg-gray-200 rounded-full px-3 py-1 text-sm whitespace-nowrap"
                  >
                    <span className="mr-1">{cmd.icon}</span>
                    {cmd.command}
                  </button>
                ))}
              </div>
            </div>

            {/* Input field */}
            <form onSubmit={handleSubmit} className="p-3 pt-0">
              <div className="flex">
                <input
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  placeholder="Type a message..."
                  className="flex-grow p-2 border border-gray-300 rounded-l-lg focus:outline-none focus:border-teal-500"
                />
                <button
                  type="submit"
                  className="bg-teal-700 text-white p-2 rounded-r-lg"
                >
                  <IconComponent icon={FaPaperPlane} />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatBot; 