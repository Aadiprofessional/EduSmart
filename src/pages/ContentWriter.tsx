import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { FiEdit, FiDownload, FiShare2, FiSave, FiSettings, FiRotateCw, FiRefreshCw, FiCopy, FiTrash, FiBook, FiFileText, FiMail, FiClipboard } from 'react-icons/fi';
import { AiOutlineFontSize, AiOutlineHighlight, AiOutlineAlignLeft, AiOutlineAlignCenter, AiOutlineAlignRight, AiOutlineBold, AiOutlineItalic, AiOutlineUnderline, AiOutlineOrderedList, AiOutlineUnorderedList, AiOutlineLink, AiOutlineRobot, AiOutlineBulb, AiOutlineHistory } from 'react-icons/ai';
import IconComponent from '../components/ui/IconComponent';

const ContentWriter: React.FC = () => {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState('college-app');
  const [editedContent, setEditedContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [contentHistory, setContentHistory] = useState<{ title: string, date: string, content: string }[]>([
    { title: "College Application Essay", date: "3 days ago", content: "As I reflect on my journey through high school..." },
    { title: "Research Paper Outline", date: "1 week ago", content: "The impact of technology on modern education..." },
  ]);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const buttonVariants = {
    hover: { scale: 1.05, boxShadow: "0px 3px 10px rgba(0, 0, 0, 0.2)" },
    tap: { scale: 0.98 }
  };

  const templates = [
    { id: 'college-app', name: 'College Application Essay', icon: FiBook },
    { id: 'cover-letter', name: 'Cover Letter', icon: FiFileText },
    { id: 'recommendation', name: 'Recommendation Letter', icon: FiMail },
    { id: 'research-paper', name: 'Research Paper', icon: FiClipboard },
    { id: 'scholarship', name: 'Scholarship Application', icon: FiClipboard },
    { id: 'personal-statement', name: 'Personal Statement', icon: FiFileText },
  ];

  const handleGenerateContent = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    try {
      const response = await axios.post(
        'https://ddtgdhehxhgarkonvpfq.supabase.co/functions/v1/createContent',
        {
          prompt: prompt
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Set the generated content from API response
      const content = response.data.output.text;
      setGeneratedContent(content);
      setEditedContent(content);
      
      // Add to history
      const newHistoryItem = {
        title: getHistoryTitle(prompt),
        date: 'Just now',
        content: content
      };
      setContentHistory([newHistoryItem, ...contentHistory]);
    } catch (error) {
      console.error('Error generating content:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getHistoryTitle = (promptText: string) => {
    // Extract a title from the prompt
    return promptText.split(' ').slice(0, 4).join(' ') + '...';
  };

  const selectTemplate = (templateId: string) => {
    setActiveTemplate(templateId);
    
    // Set default prompts based on template
    let templatePrompt = '';
    switch(templateId) {
      case 'college-app':
        templatePrompt = 'Write a compelling college application essay about my passion for computer science and how it has shaped my future goals.';
        break;
      case 'cover-letter':
        templatePrompt = 'Create a professional cover letter for an internship position at a tech company highlighting my skills in programming and teamwork.';
        break;
      case 'recommendation':
        templatePrompt = 'Write a recommendation letter for a student applying to graduate school, emphasizing their research abilities and academic achievements.';
        break;
      case 'research-paper':
        templatePrompt = 'Generate an outline for a research paper on the impact of artificial intelligence in education.';
        break;
      case 'scholarship':
        templatePrompt = 'Create a scholarship application essay discussing my financial needs and academic achievements.';
        break;
      case 'personal-statement':
        templatePrompt = 'Write a personal statement explaining my motivation to study medical sciences and my career aspirations.';
        break;
    }
    
    setPrompt(templatePrompt);
  };

  const handleCopyContent = () => {
    navigator.clipboard.writeText(editedContent || generatedContent);
  };

  const handleDownloadContent = () => {
    const element = document.createElement('a');
    const file = new Blob([editedContent || generatedContent], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `content-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const loadFromHistory = (content: string) => {
    setEditedContent(content);
    setShowHistory(false);
  };

  // Rich text formatting functions
  const applyFormatting = (format: string) => {
    if (!editorRef.current) return;
    
    const start = editorRef.current.selectionStart;
    const end = editorRef.current.selectionEnd;
    const selectedText = editedContent.substring(start, end);
    
    let formattedText = '';
    let cursorPosition = start;
    
    switch(format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        cursorPosition = start + 2;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        cursorPosition = start + 1;
        break;
      case 'underline':
        formattedText = `_${selectedText}_`;
        cursorPosition = start + 1;
        break;
      case 'list-ordered':
        formattedText = `\n1. ${selectedText}`;
        cursorPosition = start + 4;
        break;
      case 'list-unordered':
        formattedText = `\n- ${selectedText}`;
        cursorPosition = start + 3;
        break;
      case 'highlight':
        formattedText = `==${selectedText}==`;
        cursorPosition = start + 2;
        break;
    }
    
    const newContent = 
      editedContent.substring(0, start) + 
      formattedText + 
      editedContent.substring(end);
    
    setEditedContent(newContent);
    
    // Reset cursor position
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus();
        editorRef.current.selectionStart = end + (formattedText.length - selectedText.length);
        editorRef.current.selectionEnd = end + (formattedText.length - selectedText.length);
      }
    }, 0);
  };

  // Increase/decrease font size
  const changeFontSize = (delta: number) => {
    setFontSize(Math.max(12, Math.min(24, fontSize + delta)));
  };

  return (
    <>
      <Header />
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="min-h-screen bg-gradient-to-b from-teal-50 to-white"
      >
        <div className="container mx-auto px-4 py-8">
          {/* Header Section */}
          <motion.div variants={itemVariants} className="mb-8">
            <h1 className="text-4xl font-bold text-primary">
              AI Content Writer
              <span className="ml-2 text-xl font-normal text-teal-600">for Students</span>
            </h1>
            <p className="text-gray-600 mt-2">
              Generate professional content for applications, essays, letters, and more.
            </p>
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left Panel - Template Selection & Input */}
            <motion.div variants={itemVariants} className="w-full lg:w-1/3">
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 className="text-xl font-bold text-primary mb-4 flex items-center">
                  <IconComponent icon={FiFileText} className="mr-2" /> Templates
                </h2>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {templates.map((template) => (
                    <motion.button
                      key={template.id}
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      onClick={() => selectTemplate(template.id)}
                      className={`flex flex-col items-center justify-center p-4 rounded-lg transition-colors
                        ${activeTemplate === template.id 
                          ? 'bg-primary text-white shadow-md' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                    >
                      <IconComponent icon={template.icon} className="text-2xl mb-2" />
                      <span className="text-sm text-center">{template.name}</span>
                    </motion.button>
                  ))}
                </div>

                <h2 className="text-xl font-bold text-primary mb-4 flex items-center">
                  <IconComponent icon={AiOutlineRobot} className="mr-2" /> Prompt
                </h2>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe what you want to generate... For example: Write a compelling college application essay about my passion for computer science."
                  className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={handleGenerateContent}
                  disabled={isGenerating}
                  className="mt-4 w-full bg-secondary hover:bg-secondary-light text-white font-medium py-3 px-6 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <IconComponent icon={FiRotateCw} className="animate-spin mr-2" /> 
                      Generating...
                    </>
                  ) : (
                    <>
                      <IconComponent icon={AiOutlineBulb} className="mr-2" /> 
                      Generate Content
                    </>
                  )}
                </motion.button>

                {/* History Button */}
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => setShowHistory(!showHistory)}
                  className="mt-3 w-full bg-white border border-gray-300 text-gray-700 font-medium py-2 px-6 rounded-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                >
                  <IconComponent icon={AiOutlineHistory} className="mr-2" /> 
                  View History
                </motion.button>
              </div>

              {/* Tips Section */}
              <motion.div variants={itemVariants} className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-primary mb-4 flex items-center">
                  <IconComponent icon={FiBook} className="mr-2" /> Tips
                </h2>
                <ul className="space-y-3 text-gray-700">
                  <li className="flex items-start">
                    <span className="bg-teal-100 text-teal-700 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">1</span>
                    <span>Be specific in your prompt for better results</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-teal-100 text-teal-700 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">2</span>
                    <span>Edit the generated content to personalize it</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-teal-100 text-teal-700 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">3</span>
                    <span>Use formatting tools to improve readability</span>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-teal-100 text-teal-700 rounded-full w-5 h-5 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">4</span>
                    <span>Always review and personalize AI-generated content</span>
                  </li>
                </ul>
              </motion.div>
            </motion.div>

            {/* Right Panel - Editor */}
            <motion.div variants={itemVariants} className="w-full lg:w-2/3">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Toolbar */}
                <div className="bg-gray-100 p-3 border-b border-gray-200 flex flex-wrap items-center gap-2">
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => applyFormatting('bold')}
                    className="p-2 rounded hover:bg-gray-200"
                    title="Bold"
                  >
                    <IconComponent icon={AiOutlineBold} />
                  </motion.button>
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => applyFormatting('italic')}
                    className="p-2 rounded hover:bg-gray-200"
                    title="Italic"
                  >
                    <IconComponent icon={AiOutlineItalic} />
                  </motion.button>
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => applyFormatting('underline')}
                    className="p-2 rounded hover:bg-gray-200"
                    title="Underline"
                  >
                    <IconComponent icon={AiOutlineUnderline} />
                  </motion.button>
                  <div className="h-6 w-px bg-gray-300 mx-1"></div>
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => applyFormatting('list-ordered')}
                    className="p-2 rounded hover:bg-gray-200"
                    title="Ordered List"
                  >
                    <IconComponent icon={AiOutlineOrderedList} />
                  </motion.button>
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => applyFormatting('list-unordered')}
                    className="p-2 rounded hover:bg-gray-200"
                    title="Unordered List"
                  >
                    <IconComponent icon={AiOutlineUnorderedList} />
                  </motion.button>
                  <div className="h-6 w-px bg-gray-300 mx-1"></div>
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => applyFormatting('highlight')}
                    className="p-2 rounded hover:bg-gray-200"
                    title="Highlight"
                  >
                    <IconComponent icon={AiOutlineHighlight} />
                  </motion.button>
                  <div className="h-6 w-px bg-gray-300 mx-1"></div>
                  <div className="flex items-center">
                    <motion.button
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      onClick={() => changeFontSize(-1)}
                      className="p-2 rounded hover:bg-gray-200"
                      title="Decrease font size"
                    >
                      <IconComponent icon={AiOutlineFontSize} className="text-sm" />
                    </motion.button>
                    <span className="text-sm mx-1">{fontSize}px</span>
                    <motion.button
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      onClick={() => changeFontSize(1)}
                      className="p-2 rounded hover:bg-gray-200"
                      title="Increase font size"
                    >
                      <IconComponent icon={AiOutlineFontSize} className="text-lg" />
                    </motion.button>
                  </div>
                  
                  <div className="flex-grow"></div>
                  
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => setShowPreview(!showPreview)}
                    className={`px-3 py-1 rounded text-sm font-medium ${showPreview ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    title="Toggle Preview"
                  >
                    {showPreview ? 'Edit Mode' : 'Preview'}
                  </motion.button>
                </div>

                {/* Content Panel */}
                <div className="p-6">
                  {showPreview ? (
                    <div 
                      className="min-h-[500px] p-4 border border-gray-200 rounded-lg prose max-w-none"
                      style={{ fontSize: `${fontSize}px` }}
                      dangerouslySetInnerHTML={{ 
                        __html: editedContent
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                          .replace(/_(.*?)_/g, '<u>$1</u>')
                          .replace(/==(.*?)==/g, '<mark>$1</mark>')
                          .replace(/\n- (.*)/g, '<ul><li>$1</li></ul>')
                          .replace(/\n\d+\. (.*)/g, '<ol><li>$1</li></ol>')
                          .replace(/\n/g, '<br />') 
                          .replace(/#{1,6} (.*)/g, '<h3>$1</h3>')
                      }}
                    />
                  ) : (
                    <textarea
                      ref={editorRef}
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      placeholder="Your content will appear here after generation. You can edit it as needed."
                      className="w-full min-h-[500px] p-4 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent font-mono resize-none"
                      style={{ fontSize: `${fontSize}px` }}
                    />
                  )}

                  {/* Action Buttons */}
                  <div className="mt-4 flex flex-wrap gap-3">
                    <motion.button
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      onClick={handleCopyContent}
                      className="flex items-center text-sm px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                    >
                      <IconComponent icon={FiCopy} className="mr-2" /> Copy
                    </motion.button>
                    <motion.button
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      onClick={handleDownloadContent}
                      className="flex items-center text-sm px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                    >
                      <IconComponent icon={FiDownload} className="mr-2" /> Download
                    </motion.button>
                    <motion.button
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      className="flex items-center text-sm px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
                    >
                      <IconComponent icon={FiShare2} className="mr-2" /> Share
                    </motion.button>
                    <motion.button
                      variants={buttonVariants}
                      whileHover="hover"
                      whileTap="tap"
                      className="flex items-center text-sm px-4 py-2 bg-primary text-white hover:bg-primary-light rounded-lg ml-auto"
                    >
                      <IconComponent icon={FiSave} className="mr-2" /> Save
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* History Drawer */}
        <motion.div
          className={`fixed top-0 right-0 w-full md:w-96 h-full bg-white shadow-lg z-50 overflow-y-auto transform transition-transform duration-300 ease-in-out ${showHistory ? 'translate-x-0' : 'translate-x-full'}`}
          initial={false}
        >
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-primary">Your Content History</h2>
              <button 
                onClick={() => setShowHistory(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {contentHistory.map((item, index) => (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="p-4 border border-gray-200 rounded-lg hover:border-primary cursor-pointer"
                  onClick={() => loadFromHistory(item.content)}
                >
                  <h3 className="font-medium text-gray-800">{item.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{item.date}</p>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{item.content.substring(0, 100)}...</p>
                </motion.div>
              ))}
              
              {contentHistory.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <IconComponent icon={AiOutlineHistory} className="mx-auto text-4xl mb-2" />
                  <p>No content history yet</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
      <Footer />
    </>
  );
};

export default ContentWriter; 