import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaRobot, FaPaperPlane } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import IconComponent from '../components/ui/IconComponent';
import AnimatedSection from '../components/ui/AnimatedSection';
import { useLanguage } from '../utils/LanguageContext';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

const ChatBotPage: React.FC = () => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: t('chatBot.welcomeMessage'), sender: 'bot' },
    { id: 2, text: t('chatBot.helpMessage'), sender: 'bot' },
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat window when new messages appear
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const generateBotResponse = (userMessage: string): string => {
    const lowerMsg = userMessage.toLowerCase();
    
    if (lowerMsg.includes('course') || lowerMsg.includes('class') || lowerMsg.includes('learn')) {
      return 'We offer various courses including AI Development, Data Science, Web Development, and more. Visit our Courses page for details.';
    } else if (lowerMsg.includes('scholarship') || lowerMsg.includes('financial') || lowerMsg.includes('aid')) {
      return 'MatrixEdu provides information on various scholarships and financial aid options. Check our Scholarships page for the latest opportunities.';
    } else if (lowerMsg.includes('application') || lowerMsg.includes('apply') || lowerMsg.includes('track')) {
      return 'You can track your applications using our Application Tracker. It helps you organize deadlines and requirements for educational opportunities.';
    } else if (lowerMsg.includes('ai') || lowerMsg.includes('artificial intelligence')) {
      return 'We have specialized courses and resources. Our Courses section provides cutting-edge content in machine learning, deep learning, and AI ethics.';
    } else if (lowerMsg.includes('resource') || lowerMsg.includes('material') || lowerMsg.includes('tool')) {
      return 'MatrixEdu offers various educational resources including e-books, tutorials, and interactive tools. Check our Resources page.';
    } else if (lowerMsg.includes('blog') || lowerMsg.includes('article') || lowerMsg.includes('news')) {
      return 'Our blog features articles on education trends, learning tips, and technology insights. Visit the Blog section for the latest posts.';
    } else if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('hey')) {
      return 'Hello! How can I assist you with your educational journey today?';
    } else if (lowerMsg.includes('thank')) {
      return "You're welcome! Feel free to ask if you need any other assistance.";
    } else {
      return "I'm not sure I understand. Could you rephrase your question? I can help with courses, scholarships, applications, resources, and more.";
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
    
    // Generate and add bot response with typing effect
    setTimeout(() => {
      const botResponse: Message = {
        id: messages.length + 2,
        text: generateBotResponse(inputValue),
        sender: 'bot',
      };
      
      setMessages((prev) => [...prev, botResponse]);
    }, 1000);
    
    setInputValue('');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <AnimatedSection>
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center mb-6">
              <Link to="/" className="mr-4">
                <motion.div 
                  whileHover={{ scale: 1.1 }} 
                  whileTap={{ scale: 0.9 }}
                  className="p-2 bg-teal-100 rounded-full"
                >
                  <IconComponent icon={FaArrowLeft} className="text-teal-700" />
                </motion.div>
              </Link>
              <h1 className="text-3xl font-bold flex items-center">
                <IconComponent icon={FaRobot} className="mr-2 text-teal-700" /> 
                <span>{t('chatBot.title')}</span>
              </h1>
            </div>
            
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-teal-700 text-white p-4">
                <h2 className="font-bold">{t('chatBot.chatTitle')}</h2>
                <p className="text-sm opacity-80">{t('chatBot.chatSubtitle')}</p>
              </div>
              
              <div className="p-4 h-[60vh] overflow-y-auto bg-gray-50">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`mb-4 ${
                      message.sender === 'user' ? 'text-right' : 'text-left'
                    }`}
                  >
                    <div
                      className={`inline-block p-3 rounded-lg max-w-[80%] ${
                        message.sender === 'user'
                          ? 'bg-orange-500 text-white rounded-br-none'
                          : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none shadow-sm'
                      }`}
                    >
                      {message.text}
                    </div>
                    <div className={`text-xs mt-1 ${message.sender === 'user' ? 'text-gray-500' : 'text-gray-500'}`}>
                      {message.sender === 'user' ? t('chatBot.you') : t('chatBot.aiAssistant')}
                    </div>
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              
              <form onSubmit={handleSubmit} className="p-4 border-t">
                <div className="flex">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder={t('chatBot.messagePlaceholder')}
                    className="flex-grow p-3 border border-gray-300 rounded-l-lg focus:outline-none focus:border-teal-500"
                  />
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="bg-teal-700 hover:bg-teal-800 text-white p-3 px-6 rounded-r-lg font-medium"
                  >
                    <IconComponent icon={FaPaperPlane} />
                  </motion.button>
                </div>
              </form>
            </div>
          </div>
        </AnimatedSection>
      </main>
      
      <Footer />
    </div>
  );
};

export default ChatBotPage; 