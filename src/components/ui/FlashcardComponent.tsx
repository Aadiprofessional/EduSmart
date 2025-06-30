import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AiOutlineBulb, AiOutlineLoading3Quarters, AiOutlineFolder, AiOutlinePlus } from 'react-icons/ai';
import { FiLayers, FiBookmark, FiTrash2, FiUpload, FiImage, FiFile, FiEdit3, FiFolderPlus } from 'react-icons/fi';
import IconComponent from './IconComponent';
import { useResponseCheck, ResponseUpgradeModal } from '../../utils/responseChecker';
import { useNotification } from '../../utils/NotificationContext';
import { useLanguage } from '../../utils/LanguageContext';
import { flashcardService } from '../../services/flashcardService';

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  mastered: boolean;
}

export interface FlashcardSet {
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
  userId?: string;
  onGenerateFromNotes?: () => Promise<any>;
  onGenerateFromPDF?: (file: File) => Promise<any>;
}

// Portal Modal Component - renders at document.body level
interface PortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

const PortalModal: React.FC<PortalModalProps> = ({ isOpen, onClose, children, className = '' }) => {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <AnimatePresence>
      <motion.div 
        className="bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9999
        }}
      >
        <motion.div 
          className={className}
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            maxWidth: '90vw',
            maxHeight: '90vh'
          }}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

const FlashcardComponent: React.FC<FlashcardComponentProps> = ({ 
  className = '', 
  userId = 'b846c59e-7422-4be3-a4f6-dd20145e8400', // Default user ID for testing
  onGenerateFromNotes, 
  onGenerateFromPDF 
}) => {
  const { t } = useLanguage();
  // Response checking state
  const { checkAndUseResponse } = useResponseCheck();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');
  const { showError, showWarning, showSuccess } = useNotification();

  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([]);
  const [activeSetId, setActiveSetId] = useState('');
  const [currentFlashcard, setCurrentFlashcard] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [newFlashcard, setNewFlashcard] = useState({ question: '', answer: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCreateSet, setShowCreateSet] = useState(false);
  const [newSetName, setNewSetName] = useState('');
  const [newSetDescription, setNewSetDescription] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add states for AI generation modal
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingFromPrompt, setIsGeneratingFromPrompt] = useState(false);

  const activeSet = flashcardSets.find(set => set.id === activeSetId) || flashcardSets[0];
  const flashcards = activeSet?.flashcards || [];

  // Function to find first unmarked card index
  const findFirstUnmarkedCard = (cards: Flashcard[]): number => {
    const unmarkedIndex = cards.findIndex(card => !card.mastered);
    return unmarkedIndex >= 0 ? unmarkedIndex : 0; // If all are mastered, start from 0
  };

  // Load flashcard sets on component mount
  useEffect(() => {
    if (userId) {
      console.log('Loading flashcard sets for user:', userId);
      loadFlashcardSets();
    }
  }, [userId]);

  const loadFlashcardSets = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching flashcard sets from API...');
      const sets = await flashcardService.getUserFlashcardSets(userId);
      console.log('Received flashcard sets:', sets);
      setFlashcardSets(sets);
      if (sets.length > 0 && !activeSetId) {
        const firstSet = sets[0];
        setActiveSetId(firstSet.id);
        setCurrentFlashcard(findFirstUnmarkedCard(firstSet.flashcards));
      }
    } catch (error) {
      console.error('Error loading flashcard sets:', error);
      showError('Failed to load flashcard sets');
    } finally {
      setIsLoading(false);
    }
  };

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

      // Create new flashcard set using API
      const newFlashcards = flashcardsData.map((item: any) => ({
        question: item.question || 'Question',
        answer: item.answer || 'Answer',
        mastered: false
      }));

      const newSet = await flashcardService.createFlashcardSet(
        userId,
        `Flashcards from ${fileName}`,
        `Generated from uploaded file: ${fileName}`,
        'file-upload',
        fileName,
        newFlashcards
      );

      // Update local state
      setFlashcardSets(prev => [newSet, ...prev]);
      setActiveSetId(newSet.id);
      setCurrentFlashcard(0);
      setShowAnswer(false);
      showSuccess(`Created flashcard set with ${newFlashcards.length} cards`);

      console.log('Generated flashcards:', newFlashcards);
      return newFlashcards;
    } catch (error) {
      console.error('Error generating flashcards:', error);
      showError(error instanceof Error ? error.message : 'Failed to generate flashcards');
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Check file size
    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
      showError('File size must be less than 10MB');
      return;
    }

    setUploadedFile(selectedFile);
    
    try {
      setIsUploading(true);
      const extractedText = await handleFileUpload(selectedFile);
      await generateFlashcardsFromContent(extractedText, selectedFile.name);
    } catch (error) {
      console.error('Error processing file:', error);
      showError('Failed to process file. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Generate flashcards from general topics
  const generateFlashcardsFromTopics = async () => {
    setShowAIModal(true);
  };

  // Generate flashcards from custom prompt
  const generateFlashcardsFromPrompt = async (prompt: string) => {
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
      setIsGeneratingFromPrompt(true);

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
                  text: "You are an AI assistant that creates educational flashcards. Generate 8-15 high-quality flashcards based on the provided topic or prompt. Each flashcard should have a clear question and a comprehensive answer. Format your response as a JSON array with objects containing 'question' and 'answer' fields. Make sure the JSON is valid and properly formatted."
                }
              ]
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Please generate educational flashcards for the following topic: "${prompt}". Create questions that test understanding of key concepts, definitions, important facts, and practical applications related to this topic. Make sure each question is clear and each answer is informative but concise.`
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
      
      // Parse AI response
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
        showError('Failed to parse AI response');
        return;
      }

      if (!Array.isArray(flashcardsData) || flashcardsData.length === 0) {
        throw new Error('No valid flashcards generated');
      }

      // Create new flashcard set using API
      const newFlashcards = flashcardsData.map((item: any) => ({
        question: item.question || 'Question',
        answer: item.answer || 'Answer',
        mastered: false
      }));

      const newSet = await flashcardService.createFlashcardSet(
        userId,
        `${prompt} - Flashcards`,
        `AI generated flashcards for: ${prompt}`,
        'ai-generated',
        undefined,
        newFlashcards
      );

      // Update local state
      setFlashcardSets(prev => [newSet, ...prev]);
      setActiveSetId(newSet.id);
      setCurrentFlashcard(0);
      setShowAnswer(false);
      setShowAIModal(false);
      setAiPrompt('');
      showSuccess(`Created flashcard set with ${newFlashcards.length} cards`);

      console.log('Generated flashcards:', newFlashcards);
    } catch (error) {
      console.error('Error generating flashcards:', error);
      showError('Failed to generate flashcards. Please try again.');
    } finally {
      setIsGeneratingFromPrompt(false);
    }
  };

  // Quick topic suggestions
  const quickTopics = [
    'JavaScript Fundamentals',
    'React Hooks',
    'World History',
    'Biology Cell Structure',
    'Mathematics Algebra',
    'Chemistry Periodic Table',
    'Physics Mechanics',
    'Computer Science Algorithms',
    'English Grammar',
    'Psychology Basics'
  ];

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

  const toggleFlashcardMastery = async () => {
    if (!flashcards[currentFlashcard]) return;

    try {
      const currentCard = flashcards[currentFlashcard];
      const updatedCard = await flashcardService.updateFlashcard(
        userId,
        currentCard.id,
        undefined,
        undefined,
        !currentCard.mastered
      );

      // Update local state
      setFlashcardSets(prev => 
        prev.map(set => 
          set.id === activeSetId 
            ? {
                ...set,
                flashcards: set.flashcards.map((card) => 
                  card.id === currentCard.id ? updatedCard : card
                )
              }
            : set
        )
      );
    } catch (error) {
      console.error('Error updating flashcard mastery:', error);
      showError('Failed to update flashcard');
    }
  };

  const handleAddFlashcard = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newFlashcard.question.trim() || !newFlashcard.answer.trim()) return;
    if (!activeSetId) return;
    
    try {
      const newCard = await flashcardService.addFlashcard(
        userId,
        activeSetId,
        newFlashcard.question,
        newFlashcard.answer,
        false
      );
      
      // Update local state
      setFlashcardSets(prev => 
        prev.map(set => 
          set.id === activeSetId 
            ? { ...set, flashcards: [...set.flashcards, newCard] }
            : set
        )
      );
      
      setNewFlashcard({ question: '', answer: '' });
      setCurrentFlashcard(flashcards.length);
      showSuccess('Flashcard added successfully');
    } catch (error) {
      console.error('Error adding flashcard:', error);
      showError('Failed to add flashcard');
    }
  };

  const deleteFlashcard = async (id: string) => {
    // Add confirmation dialog
    const confirmed = window.confirm('Are you sure you want to delete this flashcard? This action cannot be undone.');
    if (!confirmed) return;

    try {
      await flashcardService.deleteFlashcard(userId, id);
      
      // Update local state
      setFlashcardSets(prev => 
        prev.map(set => 
          set.id === activeSetId 
            ? { ...set, flashcards: set.flashcards.filter(card => card.id !== id) }
            : set
        )
      );
      
      // Adjust current flashcard index if needed
      const updatedFlashcards = flashcards.filter(card => card.id !== id);
      if (currentFlashcard >= updatedFlashcards.length) {
        setCurrentFlashcard(Math.max(0, updatedFlashcards.length - 1));
      }
      
      // Reset answer state
      setShowAnswer(false);
      
      showSuccess('Flashcard deleted successfully');
    } catch (error) {
      console.error('Error deleting flashcard:', error);
      showError('Failed to delete flashcard');
    }
  };

  const deleteFlashcardSet = async (setId: string) => {
    if (flashcardSets.length <= 1) return; // Don't delete the last set
    
    // Add confirmation dialog
    const setToDelete = flashcardSets.find(set => set.id === setId);
    const confirmed = window.confirm(`Are you sure you want to delete the flashcard set "${setToDelete?.name}"? This will delete all ${setToDelete?.flashcards.length || 0} flashcards in this set. This action cannot be undone.`);
    if (!confirmed) return;
    
    try {
      await flashcardService.deleteFlashcardSet(userId, setId);
      
      // Update local state
      setFlashcardSets(prev => prev.filter(set => set.id !== setId));
      
      if (setId === activeSetId) {
        const remainingSets = flashcardSets.filter(set => set.id !== setId);
        if (remainingSets.length > 0) {
          setActiveSetId(remainingSets[0].id);
          setCurrentFlashcard(0);
          setShowAnswer(false);
        }
      }
      showSuccess('Flashcard set deleted successfully');
    } catch (error) {
      console.error('Error deleting flashcard set:', error);
      showError('Failed to delete flashcard set');
    }
  };

  const createNewSet = async () => {
    if (!newSetName.trim()) return;
    
    try {
      const newSet = await flashcardService.createFlashcardSet(
        userId,
        newSetName,
        newSetDescription,
        'manual'
      );
      
      // Update local state
      setFlashcardSets(prev => [newSet, ...prev]);
      setActiveSetId(newSet.id);
      setCurrentFlashcard(0);
      setShowAnswer(false);
      setShowCreateSet(false);
      setNewSetName('');
      setNewSetDescription('');
      showSuccess('Flashcard set created successfully');
    } catch (error) {
      console.error('Error creating flashcard set:', error);
      showError('Failed to create flashcard set');
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <motion.div
            className="w-8 h-8 mr-3"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <IconComponent icon={AiOutlineLoading3Quarters} className="h-8 w-8 text-cyan-400" />
          </motion.div>
          <span className="text-slate-300">Loading flashcard sets...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-white/10 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-cyan-400">{t('aiStudy.flashcards')}</h2>
        <motion.button
          onClick={() => setShowCreateSet(true)}
          className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-2 rounded-lg flex items-center font-medium"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <IconComponent icon={FiFolderPlus} className="mr-2 h-4 w-4" />
          {t('aiStudy.newSet')}
        </motion.button>
      </div>

      {/* Flashcard Sets Selector */}
      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-3">
          <IconComponent icon={AiOutlineFolder} className="h-5 w-5 text-cyan-400" />
          <span className="text-lg font-medium text-blue-400">{t('aiStudy.studySets')}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {flashcardSets.map((set) => (
            <motion.div
              key={set.id}
              className={`group p-4 rounded-lg cursor-pointer transition-all border ${
                set.id === activeSetId
                  ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400'
                  : 'bg-slate-600/30 border-white/10 text-slate-300 hover:bg-slate-600/50'
              }`}
              onClick={() => {
                setActiveSetId(set.id);
                setCurrentFlashcard(findFirstUnmarkedCard(set.flashcards));
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
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title={`Delete "${set.name}" flashcard set`}
                  >
                    <IconComponent icon={FiTrash2} className="h-4 w-4" />
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
            <IconComponent icon={FiLayers} className="mr-2" /> {t('aiStudy.studyCards')}
          </h3>
          
          {flashcards.length > 0 ? (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-blue-900/30 to-teal-900/30 backdrop-blur-sm rounded-xl p-6 min-h-[200px] flex flex-col justify-center border border-white/10">
                <div className="text-center">
                  <div className="mb-4">
                    <span className="text-sm text-cyan-400 font-medium">
                      {t('aiStudy.card')} {currentFlashcard + 1} of {flashcards.length}
                    </span>
                    {flashcards[currentFlashcard]?.mastered && (
                      <span className="ml-2 bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full text-xs border border-emerald-500/30">
                        {t('aiStudy.mastered')}
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
                        {t('aiStudy.showAnswer')}
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
                          {flashcards[currentFlashcard]?.mastered ? t('aiStudy.unmark') : t('aiStudy.markAsMastered')}
                        </motion.button>
                        
                        <motion.button
                          variants={buttonVariants}
                          whileHover="hover"
                          whileTap="tap"
                          onClick={() => setShowAnswer(false)}
                          className="bg-slate-600/50 text-slate-300 px-4 py-2 rounded-lg font-medium border border-white/10"
                        >
                          {t('aiStudy.hideAnswer')}
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
                  {t('aiStudy.previous')}
                </motion.button>
                
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => deleteFlashcard(flashcards[currentFlashcard]?.id)}
                  className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg flex items-center backdrop-blur-sm hover:bg-red-500/30"
                >
                  <IconComponent icon={FiTrash2} className="h-4 w-4 mr-1" />
                  {t('aiStudy.delete')}
                </motion.button>
                
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={handleNextFlashcard}
                  className="bg-slate-700/50 border border-white/10 text-slate-300 px-4 py-2 rounded-lg flex items-center backdrop-blur-sm"
                >
                  {t('aiStudy.next')}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <IconComponent icon={FiLayers} className="mx-auto text-4xl mb-2" />
              <p>{t('aiStudy.noFlashcardsInThisSet')}</p>
              <p className="text-sm mt-1">{t('aiStudy.createYourFirstFlashcardToStartStudying')}</p>
            </div>
          )}
        </motion.div>
        
        {/* Create New Flashcards */}
        <motion.div 
          variants={itemVariants}
          className="bg-slate-700/50 backdrop-blur-sm border border-white/10 rounded-xl p-6 shadow-sm"
        >
          <h3 className="text-lg font-medium text-blue-400 mb-4 flex items-center">
            <IconComponent icon={FiBookmark} className="mr-2" /> {t('aiStudy.createFlashcards')}
          </h3>
          
          <div className="space-y-3 mb-4">
            <motion.button 
              onClick={generateFlashcardsFromTopics}
              disabled={isGenerating || isGeneratingFromPrompt}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg flex items-center justify-center font-medium disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {(isGenerating || isGeneratingFromPrompt) ? (
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
              {t('aiStudy.generateFromAI')}
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
              {t('aiStudy.uploadFilePDFImageDoc')}
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
            <span className="relative bg-slate-800 px-2 text-sm text-slate-400">{t('aiStudy.orCreateManually')}</span>
          </div>
          
          <form onSubmit={handleAddFlashcard}>
            <div className="mb-3">
              <label className="block text-slate-300 mb-1 text-sm font-medium">
                {t('aiStudy.question')}
              </label>
              <textarea
                className="w-full p-2 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none h-20 text-slate-200 placeholder-slate-400"
                placeholder={t('aiStudy.enterYourQuestionHere')}
                value={newFlashcard.question}
                onChange={(e) => setNewFlashcard({...newFlashcard, question: e.target.value})}
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-slate-300 mb-1 text-sm font-medium">
                {t('aiStudy.answer')}
              </label>
              <textarea
                className="w-full p-2 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none h-20 text-slate-200 placeholder-slate-400"
                placeholder={t('aiStudy.enterTheAnswerHere')}
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
              {t('aiStudy.addFlashcard')}
            </motion.button>
          </form>
        </motion.div>
      </div>

      {/* Create New Set Modal */}
      <PortalModal 
        isOpen={showCreateSet}
        onClose={() => setShowCreateSet(false)}
        className="bg-slate-800 rounded-xl p-6 max-w-md w-full mx-4 border border-white/10"
      >
        <h3 className="text-xl font-semibold text-cyan-400 mb-4">{t('aiStudy.createNewFlashcardSet')}</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-slate-300 mb-1 text-sm font-medium">
              {t('aiStudy.setName')}
            </label>
            <input
              type="text"
              value={newSetName}
              onChange={(e) => setNewSetName(e.target.value)}
              className="w-full p-2 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-slate-200 placeholder-slate-400"
              placeholder={t('aiStudy.enterSetName')}
            />
          </div>
          
          <div>
            <label className="block text-slate-300 mb-1 text-sm font-medium">
              {t('aiStudy.descriptionOptional')}
            </label>
            <textarea
              value={newSetDescription}
              onChange={(e) => setNewSetDescription(e.target.value)}
              className="w-full p-2 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none h-20 text-slate-200 placeholder-slate-400"
              placeholder={t('aiStudy.enterDescription')}
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
              {t('aiStudy.createSet')}
            </motion.button>
            
            <motion.button
              onClick={() => setShowCreateSet(false)}
              className="flex-1 bg-slate-600/50 text-slate-300 py-2 rounded-lg font-medium border border-white/10"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {t('aiStudy.cancel')}
            </motion.button>
          </div>
        </div>
      </PortalModal>
      
      {/* AI Generation Modal */}
      <PortalModal 
        isOpen={showAIModal}
        onClose={() => {
          setShowAIModal(false);
          setAiPrompt('');
        }}
        className="bg-slate-800 rounded-xl p-6 max-w-2xl w-full mx-4 border border-white/10"
      >
        <h3 className="text-xl font-semibold text-cyan-400 mb-4 flex items-center">
          <IconComponent icon={AiOutlineBulb} className="mr-2" />
          Generate AI Flashcards
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-slate-300 mb-2 text-sm font-medium">
              What topic would you like to create flashcards for?
            </label>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="w-full p-3 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none h-24 text-slate-200 placeholder-slate-400"
              placeholder="Enter a topic, subject, or specific area you want to study (e.g., 'React Hooks', 'World War 2', 'Calculus derivatives')..."
            />
          </div>
          
          <div>
            <p className="text-slate-300 mb-3 text-sm font-medium">Or choose from quick topics:</p>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
              {quickTopics.map((topic) => (
                <motion.button
                  key={topic}
                  onClick={() => setAiPrompt(topic)}
                  className="p-2 bg-slate-600/30 border border-white/10 rounded-lg text-left text-slate-300 hover:bg-slate-600/50 hover:border-cyan-500/30 transition-all text-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {topic}
                </motion.button>
              ))}
            </div>
          </div>
          
          <div className="flex space-x-3">
            <motion.button
              onClick={() => generateFlashcardsFromPrompt(aiPrompt)}
              disabled={!aiPrompt.trim() || isGeneratingFromPrompt}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-2 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isGeneratingFromPrompt ? (
                <motion.div
                  className="w-5 h-5 mr-2"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <IconComponent icon={AiOutlineLoading3Quarters} className="h-5 w-5" />
                </motion.div>
              ) : (
                <IconComponent icon={AiOutlineBulb} className="mr-2 h-4 w-4" />
              )}
              Generate Flashcards
            </motion.button>
            
            <motion.button
              onClick={() => {
                setShowAIModal(false);
                setAiPrompt('');
              }}
              className="flex-1 bg-slate-600/50 text-slate-300 py-2 rounded-lg font-medium border border-white/10"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {t('aiStudy.cancel')}
            </motion.button>
          </div>
        </div>
      </PortalModal>
      
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