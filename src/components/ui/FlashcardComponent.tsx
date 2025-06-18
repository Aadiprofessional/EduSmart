import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AiOutlineBulb, AiOutlineLoading3Quarters, AiOutlineFolder, AiOutlinePlus } from 'react-icons/ai';
import { FiLayers, FiBookmark, FiTrash2, FiUpload, FiImage, FiFile, FiEdit3, FiFolderPlus } from 'react-icons/fi';
import IconComponent from './IconComponent';
import { useResponseCheck, ResponseUpgradeModal } from '../../utils/responseChecker';

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  mastered: boolean;
}

interface FlashcardSet {
  id: string;
  name: string;
  description: string;
  flashcards: Flashcard[];
  createdAt: Date;
  source?: 'manual' | 'ai-generated' | 'file-upload';
  sourceFile?: string;
}

interface FlashcardComponentProps {
  className?: string;
  onGenerateFromNotes?: () => Promise<any>;
  onGenerateFromPDF?: (file: File) => Promise<any>;
}

const FlashcardComponent: React.FC<FlashcardComponentProps> = ({ className = '', onGenerateFromNotes, onGenerateFromPDF }) => {
  // Response checking state
  const { checkAndUseResponse } = useResponseCheck();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');

  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([
    {
      id: '1',
      name: 'General Knowledge',
      description: 'Basic science and math concepts',
      createdAt: new Date(),
      source: 'manual',
      flashcards: [
        {
          id: '1',
          question: 'What is photosynthesis?',
          answer: 'The process by which green plants and some other organisms use sunlight to synthesize nutrients from carbon dioxide and water.',
          mastered: false
        },
        {
          id: '2',
          question: 'What is Newton\'s First Law?',
          answer: 'An object at rest stays at rest and an object in motion stays in motion with the same speed and in the same direction unless acted upon by an unbalanced force.',
          mastered: true
        },
        {
          id: '3',
          question: 'What is the Pythagorean theorem?',
          answer: 'In a right-angled triangle, the square of the hypotenuse equals the sum of squares of the other two sides: a² + b² = c².',
          mastered: false
        }
      ]
    }
  ]);

  const [activeSetId, setActiveSetId] = useState('1');
  const [currentFlashcard, setCurrentFlashcard] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [newFlashcard, setNewFlashcard] = useState({ question: '', answer: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCreateSet, setShowCreateSet] = useState(false);
  const [newSetName, setNewSetName] = useState('');
  const [newSetDescription, setNewSetDescription] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeSet = flashcardSets.find(set => set.id === activeSetId) || flashcardSets[0];
  const flashcards = activeSet?.flashcards || [];

  const buttonVariants = {
    hover: { scale: 1.05, boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.1)" },
    tap: { scale: 0.98 }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  // Handle file upload and text extraction
  const handleFileUpload = async (file: File): Promise<string> => {
    try {
      if (file.type.startsWith('image/')) {
        // Handle image files
        const base64Image = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const response = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer sk-0d874843ff2542c38940adcbeb2b2cc4',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: "qwen-vl-max",
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "image_url",
                    image_url: { url: base64Image }
                  },
                  {
                    type: "text",
                    text: "Please extract all text from this image exactly as it appears, maintaining line breaks and formatting. Focus on accuracy and completeness."
                  }
                ]
              }
            ],
            stream: false
          })
        });

        if (!response.ok) {
          throw new Error(`API call failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
      } else {
        // For other file types (PDF, DOC, etc.), we'll simulate text extraction
        // In a real implementation, you'd use libraries like pdf-parse or mammoth
        return `Content extracted from ${file.name}. This is a placeholder for the actual text extraction functionality.`;
      }
    } catch (error) {
      console.error('Error extracting text from file:', error);
      throw new Error('Failed to extract text from file. Please try again.');
    }
  };

  // Generate flashcards from uploaded content
  const generateFlashcardsFromContent = async (content: string, fileName: string) => {
    try {
      setIsGenerating(true);

      const response = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer sk-0d874843ff2542c38940adcbeb2b2cc4',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "qwen-vl-max",
          messages: [
            {
              role: "system",
              content: [
                {
                  type: "text", 
                  text: "You are an AI assistant that creates educational flashcards. Generate 5-10 high-quality flashcards based on the provided content. Each flashcard should have a clear question and a comprehensive answer. Format your response as a JSON array with objects containing 'question' and 'answer' fields. Make sure the JSON is valid and properly formatted."
                }
              ]
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Please generate educational flashcards from this content:\n\n${content}\n\nCreate questions that test understanding of key concepts, definitions, and important facts. Make sure each question is clear and each answer is informative but concise.`
                }
              ]
            }
          ],
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content_text = data.choices[0].message.content;
      
      // Try to extract JSON from the response
      let flashcardsData;
      try {
        // Look for JSON array in the response
        const jsonMatch = content_text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          flashcardsData = JSON.parse(jsonMatch[0]);
        } else {
          // If no JSON array found, try to parse the entire response
          flashcardsData = JSON.parse(content_text);
        }
      } catch (parseError) {
        console.error('Failed to parse JSON, trying to extract manually:', parseError);
        // Fallback: try to extract questions and answers manually
        const lines = content_text.split('\n').filter((line: string) => line.trim());
        flashcardsData = [];
        
        for (let i = 0; i < lines.length - 1; i += 2) {
          if (lines[i] && lines[i + 1]) {
            flashcardsData.push({
              question: lines[i].replace(/^\d+\.\s*/, '').replace(/^Q:\s*/, '').trim(),
              answer: lines[i + 1].replace(/^A:\s*/, '').trim()
            });
          }
        }
      }

      if (!Array.isArray(flashcardsData) || flashcardsData.length === 0) {
        throw new Error('No valid flashcards generated from content');
      }

      // Create new flashcard set
      const newFlashcards: Flashcard[] = flashcardsData.map((item: any, index: number) => ({
        id: `${Date.now()}-${index}`,
        question: item.question || `Question ${index + 1}`,
        answer: item.answer || `Answer ${index + 1}`,
        mastered: false
      }));

      const newSet: FlashcardSet = {
        id: Date.now().toString(),
        name: `Flashcards from ${fileName}`,
        description: `Generated from uploaded file: ${fileName}`,
        createdAt: new Date(),
        source: 'file-upload',
        sourceFile: fileName,
        flashcards: newFlashcards
      };

      setFlashcardSets(prev => [newSet, ...prev]);
      setActiveSetId(newSet.id);
      setCurrentFlashcard(0);
      setShowAnswer(false);

      console.log('Generated flashcards:', newFlashcards);
      return newFlashcards;
    } catch (error) {
      console.error('Error generating flashcards:', error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    // Check responses before processing file
    const responseResult = await checkAndUseResponse({
      responseType: 'flashcard_file_upload',
      responsesUsed: 1
    });
    if (!responseResult.canProceed) {
      setShowUpgradeModal(true);
      setUpgradeMessage(responseResult.message || 'Please upgrade to continue');
      return;
    }

    try {
      setIsUploading(true);
      setUploadedFile(file);
      
      // Extract text from file
      const extractedText = await handleFileUpload(file);
      
      // Generate flashcards from extracted text
      await generateFlashcardsFromContent(extractedText, file.name);
      
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Failed to process file. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadedFile(null);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Generate flashcards from general topics
  const generateFlashcardsFromTopics = async () => {
    // Check responses before generating flashcards
    const responseResult = await checkAndUseResponse({
      responseType: 'flashcard_ai_generation',
      responsesUsed: 1
    });
    if (!responseResult.canProceed) {
      setShowUpgradeModal(true);
      setUpgradeMessage(responseResult.message || 'Please upgrade to continue');
      return;
    }

    try {
      setIsGenerating(true);

      const response = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer sk-0d874843ff2542c38940adcbeb2b2cc4',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "qwen-vl-max",
          messages: [
            {
              role: "system",
              content: [
                {
                  type: "text", 
                  text: "You are an AI assistant that creates educational flashcards. Generate 8-12 high-quality flashcards covering important concepts in science, mathematics, history, and literature. Each flashcard should have a clear question and a comprehensive answer. Format your response as a JSON array with objects containing 'question' and 'answer' fields."
                }
              ]
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Please generate educational flashcards covering important concepts across different subjects. Include topics like basic science principles, mathematical concepts, historical events, and literary terms. Make sure the questions are clear and the answers are informative but concise."
                }
              ]
            }
          ],
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const content_text = data.choices[0].message.content;
      
      // Try to extract JSON from the response
      let flashcardsData;
      try {
        const jsonMatch = content_text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          flashcardsData = JSON.parse(jsonMatch[0]);
        } else {
          flashcardsData = JSON.parse(content_text);
        }
      } catch (parseError) {
        console.error('Failed to parse JSON:', parseError);
        throw new Error('Failed to parse generated flashcards');
      }

      if (!Array.isArray(flashcardsData) || flashcardsData.length === 0) {
        throw new Error('No valid flashcards generated');
      }

      // Create new flashcard set
      const newFlashcards: Flashcard[] = flashcardsData.map((item: any, index: number) => ({
        id: `${Date.now()}-${index}`,
        question: item.question || `Question ${index + 1}`,
        answer: item.answer || `Answer ${index + 1}`,
        mastered: false
      }));

      const newSet: FlashcardSet = {
        id: Date.now().toString(),
        name: 'AI Generated Study Set',
        description: 'Generated flashcards covering various academic topics',
        createdAt: new Date(),
        source: 'ai-generated',
        flashcards: newFlashcards
      };

      setFlashcardSets(prev => [newSet, ...prev]);
      setActiveSetId(newSet.id);
      setCurrentFlashcard(0);
      setShowAnswer(false);

      console.log('Generated flashcards:', newFlashcards);
    } catch (error) {
      console.error('Error generating flashcards:', error);
      alert('Failed to generate flashcards. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNextFlashcard = () => {
    setShowAnswer(false);
    setCurrentFlashcard(prev => 
      prev === flashcards.length - 1 ? 0 : prev + 1
    );
  };

  const handlePrevFlashcard = () => {
    setShowAnswer(false);
    setCurrentFlashcard(prev => 
      prev === 0 ? flashcards.length - 1 : prev - 1
    );
  };

  const toggleFlashcardMastery = () => {
    setFlashcardSets(prev => 
      prev.map(set => 
        set.id === activeSetId 
          ? {
              ...set,
              flashcards: set.flashcards.map((card, i) => 
                i === currentFlashcard ? {...card, mastered: !card.mastered} : card
              )
            }
          : set
      )
    );
  };

  const handleAddFlashcard = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newFlashcard.question.trim() || !newFlashcard.answer.trim()) return;
    
    const newCard: Flashcard = {
      id: Date.now().toString(),
      question: newFlashcard.question,
      answer: newFlashcard.answer,
      mastered: false
    };
    
    setFlashcardSets(prev => 
      prev.map(set => 
        set.id === activeSetId 
          ? { ...set, flashcards: [...set.flashcards, newCard] }
          : set
      )
    );
    
    setNewFlashcard({ question: '', answer: '' });
    setCurrentFlashcard(flashcards.length);
  };

  const deleteFlashcard = (id: string) => {
    setFlashcardSets(prev => 
      prev.map(set => 
        set.id === activeSetId 
          ? { ...set, flashcards: set.flashcards.filter(card => card.id !== id) }
          : set
      )
    );
    
    if (currentFlashcard >= flashcards.length - 1) {
      setCurrentFlashcard(Math.max(0, flashcards.length - 2));
    }
  };

  const deleteFlashcardSet = (setId: string) => {
    if (flashcardSets.length <= 1) return; // Don't delete the last set
    
    setFlashcardSets(prev => prev.filter(set => set.id !== setId));
    
    if (setId === activeSetId) {
      const remainingSets = flashcardSets.filter(set => set.id !== setId);
      if (remainingSets.length > 0) {
        setActiveSetId(remainingSets[0].id);
        setCurrentFlashcard(0);
      }
    }
  };

  const createNewSet = () => {
    if (!newSetName.trim()) return;
    
    const newSet: FlashcardSet = {
      id: Date.now().toString(),
      name: newSetName,
      description: newSetDescription,
      createdAt: new Date(),
      source: 'manual',
      flashcards: []
    };
    
    setFlashcardSets(prev => [newSet, ...prev]);
    setActiveSetId(newSet.id);
    setCurrentFlashcard(0);
    setShowAnswer(false);
    setShowCreateSet(false);
    setNewSetName('');
    setNewSetDescription('');
  };

  return (
    <div className={`bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-cyan-400">Flashcards</h2>
        <motion.button
          onClick={() => setShowCreateSet(true)}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-lg flex items-center font-medium"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <IconComponent icon={FiFolderPlus} className="mr-2 h-4 w-4" />
          New Set
        </motion.button>
      </div>

      {/* Flashcard Sets Selector */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-3">
          <IconComponent icon={AiOutlineFolder} className="h-5 w-5 text-cyan-400" />
          <span className="text-lg font-medium text-blue-400">Study Sets</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {flashcardSets.map((set) => (
            <motion.div
              key={set.id}
              className={`p-4 rounded-lg cursor-pointer transition-all border ${
                set.id === activeSetId
                  ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400'
                  : 'bg-slate-600/30 border-white/10 text-slate-300 hover:bg-slate-600/50'
              }`}
              onClick={() => {
                setActiveSetId(set.id);
                setCurrentFlashcard(0);
                setShowAnswer(false);
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{set.name}</h4>
                  <p className="text-xs opacity-75 mt-1">{set.flashcards.length} cards</p>
                  <p className="text-xs opacity-60 mt-1">{set.description}</p>
                </div>
                {flashcardSets.length > 1 && (
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFlashcardSet(set.id);
                    }}
                    className="p-1 text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <IconComponent icon={FiTrash2} className="h-3 w-3" />
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Flashcard Viewer */}
        <motion.div 
          variants={itemVariants}
          className="bg-slate-700/50 backdrop-blur-sm border border-white/10 rounded-xl p-6 shadow-sm"
        >
          <h3 className="text-lg font-medium text-blue-400 mb-4 flex items-center">
            <IconComponent icon={FiLayers} className="mr-2" /> Study Cards
          </h3>
          
          {flashcards.length > 0 ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-blue-900/30 to-teal-900/30 backdrop-blur-sm rounded-xl p-6 min-h-[200px] flex flex-col justify-center border border-white/10">
                <div className="text-center">
                  <div className="mb-4">
                    <span className="text-sm text-cyan-400 font-medium">
                      Card {currentFlashcard + 1} of {flashcards.length}
                    </span>
                    {flashcards[currentFlashcard]?.mastered && (
                      <span className="ml-2 bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full text-xs border border-emerald-500/30">
                        Mastered
                      </span>
                    )}
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-lg font-medium text-slate-200 mb-4">
                      {flashcards[currentFlashcard]?.question}
                    </p>
                    
                    {showAnswer && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-600/50 backdrop-blur-sm rounded-lg p-4 border border-white/10"
                      >
                        <p className="text-slate-300">
                          {flashcards[currentFlashcard]?.answer}
                        </p>
                      </motion.div>
                    )}
                  </div>
                  
                  <div className="flex justify-center space-x-3">
                    {!showAnswer ? (
                      <motion.button
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                        onClick={() => setShowAnswer(true)}
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-2 rounded-lg font-medium"
                      >
                        Show Answer
                      </motion.button>
                    ) : (
                      <div className="flex space-x-2">
                        <motion.button
                          variants={buttonVariants}
                          whileHover="hover"
                          whileTap="tap"
                          onClick={toggleFlashcardMastery}
                          className={`px-4 py-2 rounded-lg font-medium ${
                            flashcards[currentFlashcard]?.mastered
                              ? 'bg-slate-600/50 text-slate-300 border border-white/10'
                              : 'bg-gradient-to-r from-emerald-500 to-green-500 text-white'
                          }`}
                        >
                          {flashcards[currentFlashcard]?.mastered ? 'Unmark' : 'Mark as Mastered'}
                        </motion.button>
                        
                        <motion.button
                          variants={buttonVariants}
                          whileHover="hover"
                          whileTap="tap"
                          onClick={() => setShowAnswer(false)}
                          className="bg-slate-600/50 text-slate-300 px-4 py-2 rounded-lg font-medium border border-white/10"
                        >
                          Hide Answer
                        </motion.button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={handlePrevFlashcard}
                  className="bg-slate-700/50 border border-white/10 text-slate-300 px-4 py-2 rounded-lg flex items-center backdrop-blur-sm"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </motion.button>
                
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => deleteFlashcard(flashcards[currentFlashcard]?.id)}
                  className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg flex items-center backdrop-blur-sm hover:bg-red-500/30"
                >
                  <IconComponent icon={FiTrash2} className="h-4 w-4 mr-1" />
                  Delete
                </motion.button>
                
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={handleNextFlashcard}
                  className="bg-slate-700/50 border border-white/10 text-slate-300 px-4 py-2 rounded-lg flex items-center backdrop-blur-sm"
                >
                  Next
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <IconComponent icon={FiLayers} className="mx-auto text-4xl mb-2" />
              <p>No flashcards in this set</p>
              <p className="text-sm mt-1">Create your first flashcard to start studying</p>
            </div>
          )}
        </motion.div>
        
        {/* Create New Flashcards */}
        <motion.div 
          variants={itemVariants}
          className="bg-slate-700/50 backdrop-blur-sm border border-white/10 rounded-xl p-6 shadow-sm"
        >
          <h3 className="text-lg font-medium text-blue-400 mb-4 flex items-center">
            <IconComponent icon={FiBookmark} className="mr-2" /> Create Flashcards
          </h3>
          
          <div className="space-y-3 mb-4">
            <motion.button 
              onClick={generateFlashcardsFromTopics}
              disabled={isGenerating}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg flex items-center justify-center font-medium disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isGenerating ? (
                <motion.div
                  className="w-5 h-5 mr-2"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <IconComponent icon={AiOutlineLoading3Quarters} className="h-5 w-5" />
                </motion.div>
              ) : (
                <IconComponent icon={AiOutlineBulb} className="mr-2" />
              )}
              Generate from AI
            </motion.button>
            
            <motion.button 
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg flex items-center justify-center font-medium disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isUploading ? (
                <motion.div
                  className="w-5 h-5 mr-2"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <IconComponent icon={AiOutlineLoading3Quarters} className="h-5 w-5" />
                </motion.div>
              ) : (
                <IconComponent icon={FiUpload} className="mr-2" />
              )}
              Upload File (PDF, Image, Doc)
            </motion.button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
          
          <div className="text-center relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <span className="relative bg-slate-800 px-2 text-sm text-slate-400">or create manually</span>
          </div>
          
          <form onSubmit={handleAddFlashcard}>
            <div className="mb-3">
              <label className="block text-slate-300 mb-1 text-sm font-medium">
                Question
              </label>
              <textarea
                className="w-full p-2 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none h-20 text-slate-200 placeholder-slate-400"
                placeholder="Enter your question here"
                value={newFlashcard.question}
                onChange={(e) => setNewFlashcard({...newFlashcard, question: e.target.value})}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-slate-300 mb-1 text-sm font-medium">
                Answer
              </label>
              <textarea
                className="w-full p-2 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none h-20 text-slate-200 placeholder-slate-400"
                placeholder="Enter the answer here"
                value={newFlashcard.answer}
                onChange={(e) => setNewFlashcard({...newFlashcard, answer: e.target.value})}
              />
            </div>
            
            <motion.button
              type="submit"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              className="w-full bg-gradient-to-r from-emerald-500 to-green-500 text-white py-2 rounded-lg font-medium"
            >
              Add Flashcard
            </motion.button>
          </form>
        </motion.div>
      </div>

      {/* Create New Set Modal */}
      <AnimatePresence>
        {showCreateSet && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCreateSet(false)}
          >
            <motion.div
              className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 border border-white/10"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold text-cyan-400 mb-4">Create New Flashcard Set</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-300 mb-1 text-sm font-medium">
                    Set Name
                  </label>
                  <input
                    type="text"
                    value={newSetName}
                    onChange={(e) => setNewSetName(e.target.value)}
                    className="w-full p-2 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-slate-200 placeholder-slate-400"
                    placeholder="Enter set name"
                  />
                </div>
                
                <div>
                  <label className="block text-slate-300 mb-1 text-sm font-medium">
                    Description (optional)
                  </label>
                  <textarea
                    value={newSetDescription}
                    onChange={(e) => setNewSetDescription(e.target.value)}
                    className="w-full p-2 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none h-20 text-slate-200 placeholder-slate-400"
                    placeholder="Enter description"
                  />
                </div>
                
                <div className="flex space-x-3">
                  <motion.button
                    onClick={createNewSet}
                    disabled={!newSetName.trim()}
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-2 rounded-lg font-medium disabled:opacity-50"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Create Set
                  </motion.button>
                  
                  <motion.button
                    onClick={() => setShowCreateSet(false)}
                    className="flex-1 bg-slate-600/50 text-slate-300 py-2 rounded-lg font-medium border border-white/10"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Response Upgrade Modal */}
      <ResponseUpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        message={upgradeMessage}
      />
    </div>
  );
};

export default FlashcardComponent; 