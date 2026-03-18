import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AiOutlineBulb, AiOutlineLoading3Quarters, AiOutlineFolder, AiOutlinePlus } from 'react-icons/ai';
import { FiLayers, FiBookmark, FiTrash2, FiUpload, FiImage, FiFile, FiEdit3, FiFolderPlus, FiX, FiEye, FiEyeOff } from 'react-icons/fi';
import IconComponent from './IconComponent';
import { useResponseCheck, ResponseUpgradeModal } from '../../utils/responseChecker';
import { useNotification } from '../../utils/NotificationContext';
import { useLanguage } from '../../utils/LanguageContext';
import { flashcardService } from '../../services/flashcardService';
import { useAuth } from '../../utils/AuthContext';

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
        className="bg-[#0f172a]/80 backdrop-blur-md flex items-center justify-center p-4"
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

// Get user ID from authentication context or localStorage - proper authentication
const getUserId = (user?: any, session?: any): string | null => {
  // First try to get user ID from the provided authentication context
  if (user?.id) {
    console.log('📱 Found user ID from auth context:', user.id);
    return user.id;
  }
  
  if (session?.user?.id) {
    console.log('📱 Found user ID from session:', session.user.id);
    return session.user.id;
  }
  
  // Try to get user ID from localStorage first (common auth pattern)
  const userId = localStorage.getItem('userId') || localStorage.getItem('user_id');
  if (userId && userId !== 'undefined' && userId !== 'null') {
    console.log('📱 Found user ID in localStorage:', userId);
    return userId;
  }
  
  // Try to get from user object in localStorage
  const userStr = localStorage.getItem('user');
  if (userStr && userStr !== 'undefined' && userStr !== 'null') {
    try {
      const user = JSON.parse(userStr);
      if (user && (user.id || user.user_id || user.uid)) {
        const foundUserId = user.id || user.user_id || user.uid;
        console.log('📱 Found user ID from user object:', foundUserId);
        return foundUserId;
      }
    } catch (e) {
      console.warn('Failed to parse user from localStorage');
    }
  }
  
  // Try Supabase auth patterns
  const supabaseAuthStr = localStorage.getItem('sb-cdqrmxmqsoxncnkxiqwu-auth-token');
  if (supabaseAuthStr && supabaseAuthStr !== 'undefined' && supabaseAuthStr !== 'null') {
    try {
      const authData = JSON.parse(supabaseAuthStr);
      if (authData.user?.id) {
        console.log('📱 Found user ID from Supabase auth:', authData.user.id);
        return authData.user.id;
      }
    } catch (e) {
      console.warn('Failed to parse Supabase auth from localStorage');
    }
  }
  
  // Check other possible Supabase auth keys
  const keys = Object.keys(localStorage);
  for (const key of keys) {
    if (key.includes('supabase') || key.includes('auth')) {
      try {
        const data = localStorage.getItem(key);
        if (data && data !== 'undefined' && data !== 'null') {
          const parsed = JSON.parse(data);
          if (parsed?.user?.id) {
            console.log('📱 Found user ID from auth key:', key, parsed.user.id);
            return parsed.user.id;
          }
        }
      } catch (e) {
        // Continue to next key
      }
    }
  }
  
  // No authenticated user found
  console.warn('⚠️ No authenticated user found');
  return null;
};

const FlashcardComponent: React.FC<FlashcardComponentProps> = ({ 
  className = '', 
  userId,
  onGenerateFromNotes, 
  onGenerateFromPDF 
}) => {
  const { t } = useLanguage();
  const { user, session } = useAuth();
  
  // Response checking state
  const { checkAndUseResponse } = useResponseCheck();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');
  const { showError, showWarning, showSuccess } = useNotification();

  // Get current user ID dynamically using the auth context
  const currentUserId = userId || getUserId(user, session);

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

  // Add state for progress sidebar
  const [showProgressSidebar, setShowProgressSidebar] = useState(false);

  // Add state for fullscreen mode
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Add state for showing/hiding passed questions
  const [showPassedQuestions, setShowPassedQuestions] = useState(true);
  
  // Reset current flashcard when filter changes
  useEffect(() => {
    setCurrentFlashcard(0);
    setShowAnswer(false);
  }, [showPassedQuestions]);

  const activeSet = flashcardSets.find(set => set.id === activeSetId) || flashcardSets[0];
  const allFlashcards = activeSet?.flashcards || [];
  const flashcards = showPassedQuestions 
    ? allFlashcards 
    : allFlashcards.filter(card => !card.mastered);

  // Helper function to calculate progress statistics
  const getProgressStats = (flashcards: Flashcard[]) => {
    const total = flashcards.length;
    const mastered = flashcards.filter(card => card.mastered).length;
    const remaining = total - mastered;
    const percentage = total > 0 ? Math.round((mastered / total) * 100) : 0;
    return { total, mastered, remaining, percentage };
  };

  // Function to find first unmarked card index
  const findFirstUnmarkedCard = (cards: Flashcard[]): number => {
    const unmarkedIndex = cards.findIndex(card => !card.mastered);
    return unmarkedIndex >= 0 ? unmarkedIndex : 0; // If all are mastered, start from 0
  };

  // Load flashcard sets on component mount
  useEffect(() => {
    if (currentUserId) {
      console.log('Loading flashcard sets for user:', currentUserId);
      loadFlashcardSets();
    } else {
      console.warn('⚠️ No authenticated user found in FlashcardComponent');
      showError('Please log in to access flashcards');
    }
  }, [currentUserId]);

  const loadFlashcardSets = async () => {
    if (!currentUserId) {
      showError('Please log in to load flashcard sets');
      return;
    }

    try {
      setIsLoading(true);
      console.log('Fetching flashcard sets from API...');
      const sets = await flashcardService.getUserFlashcardSets(currentUserId);
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

        const response = await fetch(process.env.REACT_APP_DASHSCOPE_ENDPOINT || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_DASHSCOPE_API_KEY || ''}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: "doubao-seed-1-6-vision-250815",
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
    if (!currentUserId) {
      showError('Please log in to generate flashcards');
      return;
    }

    try {
      setIsGenerating(true);

      const response = await fetch(process.env.REACT_APP_DASHSCOPE_ENDPOINT || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_DASHSCOPE_API_KEY || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "doubao-seed-1-6-vision-250815",
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
        currentUserId,
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
    if (!currentUserId) {
      showError('Please log in to generate flashcards');
      return;
    }

    try {
      setIsGeneratingFromPrompt(true);

      const response = await fetch(process.env.REACT_APP_DASHSCOPE_ENDPOINT || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_DASHSCOPE_API_KEY || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "doubao-seed-1-6-vision-250815",
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
        currentUserId,
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
    if (!currentUserId) {
      showError('Please log in to update flashcard progress');
      return;
    }

    if (!activeSet || flashcards.length === 0) return;

    try {
      const currentCard = flashcards[currentFlashcard];
      const updatedCard = await flashcardService.updateFlashcard(
        currentUserId,
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
    if (!currentUserId) {
      showError('Please log in to add flashcards');
      return;
    }

    e.preventDefault();
    if (!newFlashcard.question.trim() || !newFlashcard.answer.trim() || !activeSetId) return;
    
    try {
      const newCard = await flashcardService.addFlashcard(
        currentUserId,
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
    if (!currentUserId) {
      showError('Please log in to delete flashcards');
      return;
    }

    // Add confirmation dialog
    const confirmed = window.confirm('Are you sure you want to delete this flashcard? This action cannot be undone.');
    if (!confirmed) return;

    try {
      await flashcardService.deleteFlashcard(currentUserId, id);
      
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
    if (!currentUserId) {
      showError('Please log in to delete flashcard sets');
      return;
    }

    if (flashcardSets.length <= 1) return; // Don't delete the last set
    
    // Add confirmation dialog
    const setToDelete = flashcardSets.find(set => set.id === setId);
    const confirmed = window.confirm(`Are you sure you want to delete the flashcard set "${setToDelete?.name}"? This will delete all ${setToDelete?.flashcards.length || 0} flashcards in this set. This action cannot be undone.`);
    if (!confirmed) return;
    
    try {
      await flashcardService.deleteFlashcardSet(currentUserId, setId);
      
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
    if (!currentUserId) {
      showError('Please log in to create flashcard sets');
      return;
    }

    if (!newSetName.trim()) return;
    
    try {
      const newSet = await flashcardService.createFlashcardSet(
        currentUserId,
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
      <div className="flex items-center justify-center py-8">
        <motion.div
          className="w-8 h-8 mr-3"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
        >
          <IconComponent icon={AiOutlineLoading3Quarters} className="h-8 w-8 text-cyan-400" />
        </motion.div>
        <span className="text-slate-300">Loading flashcard sets...</span>
      </div>
    );
  }

  return (
    <div className={`bg-[#0f172a]/60 backdrop-blur-md border border-white/10 rounded-xl shadow-lg overflow-hidden p-4 sm:p-6 ${className || ''}`}>
      {/* Header - Mobile Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-2">
          <motion.button
            onClick={() => setShowProgressSidebar(!showProgressSidebar)}
            className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg flex items-center justify-center font-medium text-sm sm:text-base transition-all border ${
              showProgressSidebar 
                ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400' 
                : 'bg-slate-600/30 border-white/10 text-slate-300 hover:bg-slate-600/50'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Progress
          </motion.button>
          <motion.button
            onClick={() => setShowCreateSet(true)}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg flex items-center justify-center font-medium text-sm sm:text-base"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <IconComponent icon={FiFolderPlus} className="mr-2 h-4 w-4" />
            {t('aiStudy.newSet')}
          </motion.button>
        </div>
      </div>

      {/* Progress Sidebar */}
      <AnimatePresence>
        {showProgressSidebar && (
          <motion.div
            className="mb-6 bg-[#0f172a]/60 backdrop-blur-md border border-white/10 rounded-xl p-4 sm:p-6 shadow-sm"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-blue-400 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Study Progress
              </h3>
              <motion.button
                onClick={() => setShowProgressSidebar(false)}
                className="p-1 text-slate-400 hover:text-slate-300 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <IconComponent icon={FiX} className="h-4 w-4" />
              </motion.button>
            </div>

            {/* Overall Statistics */}
            {flashcardSets.length > 0 && (
              <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
                <h4 className="text-sm font-medium text-slate-300 mb-2">Overall Progress</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div>
                    <div className="text-lg font-bold text-cyan-400">
                      {flashcardSets.length}
                    </div>
                    <div className="text-xs text-slate-400">Sets</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-400">
                      {flashcardSets.reduce((total, set) => total + set.flashcards.length, 0)}
                    </div>
                    <div className="text-xs text-slate-400">Total Cards</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-emerald-400">
                      {flashcardSets.reduce((total, set) => total + set.flashcards.filter(card => card.mastered).length, 0)}
                    </div>
                    <div className="text-xs text-slate-400">Mastered</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-indigo-400">
                      {flashcardSets.reduce((total, set) => total + set.flashcards.filter(card => !card.mastered).length, 0)}
                    </div>
                    <div className="text-xs text-slate-400">Remaining</div>
                  </div>
                </div>
              </div>
            )}

            {/* Individual Set Progress */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-slate-300">Progress by Set</h4>
              {flashcardSets.length === 0 ? (
                <div className="text-center py-6 text-slate-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <p className="text-sm">No flashcard sets yet</p>
                  <p className="text-xs mt-1 opacity-75">Create your first set to start tracking progress</p>
                </div>
              ) : (
                flashcardSets.map((set) => {
                  const stats = getProgressStats(set.flashcards);
                  return (
                    <motion.div
                      key={set.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        set.id === activeSetId
                          ? 'bg-cyan-500/20 border-cyan-500/30'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                      onClick={() => {
                        setActiveSetId(set.id);
                        setCurrentFlashcard(findFirstUnmarkedCard(set.flashcards));
                        setShowAnswer(false);
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Set Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium text-slate-200 truncate text-sm">
                            {set.name}
                          </h5>
                          <p className="text-xs text-slate-400 mt-1">
                            {stats.mastered} of {stats.total} cards mastered
                          </p>
                        </div>
                        <div className="ml-3 text-right">
                          <div className={`text-lg font-bold ${
                            stats.percentage === 100 ? 'text-emerald-400' :
                            stats.percentage >= 75 ? 'text-green-400' :
                            stats.percentage >= 50 ? 'text-yellow-400' :
                            stats.percentage >= 25 ? 'text-indigo-400' :
                            'text-red-400'
                          }`}>
                            {stats.percentage}%
                          </div>
                          <div className="text-xs text-slate-400">
                            {stats.remaining} left
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="relative w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${
                            stats.percentage === 100 ? 'bg-gradient-to-r from-emerald-500 to-green-500' :
                            stats.percentage >= 75 ? 'bg-gradient-to-r from-green-500 to-lime-500' :
                            stats.percentage >= 50 ? 'bg-gradient-to-r from-yellow-500 to-indigo-500' :
                            stats.percentage >= 25 ? 'bg-gradient-to-r from-indigo-500 to-red-500' :
                            'bg-gradient-to-r from-red-500 to-pink-500'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${stats.percentage}%` }}
                          transition={{ duration: 0.8, ease: [0, 0, 0.58, 1] as const }}
                        />
                        
                        {/* Progress Shine Effect */}
                        {stats.percentage > 0 && (
                          <motion.div
                            className="absolute top-0 left-0 h-full w-8 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                            initial={{ x: '-100%' }}
                            animate={{ x: '400%' }}
                            transition={{ duration: 2, repeat: Infinity, ease: [0.42, 0, 0.58, 1] as const }}
                          />
                        )}
                      </div>

                      {/* Quick Stats */}
                      <div className="flex justify-between items-center mt-2 text-xs">
                        <span className="text-emerald-400">
                          ✓ {stats.mastered} mastered
                        </span>
                        {stats.remaining > 0 && (
                          <span className="text-indigo-400">
                            {stats.remaining} to study
                          </span>
                        )}
                        {stats.percentage === 100 && (
                          <span className="text-emerald-400 font-medium">
                            🎉 Complete!
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile: Stack vertically with different order, Desktop: Side by side */}
      <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-8">
        {/* Flashcard Viewer - Full width on mobile, no container on mobile */}
        <div className="order-1">
          {/* Mobile: No container, Desktop: Container */}
          <div className="sm:bg-[#0f172a]/60 sm:backdrop-blur-md sm:border sm:border-white/10 sm:rounded-xl p-0 sm:p-6 sm:shadow-sm">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-medium text-blue-400 flex items-center">
                <IconComponent icon={FiLayers} className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> {t('aiStudy.studyCards')}
              </h3>
              
              <div className="flex items-center space-x-2">
                {/* Show/Hide Passed Questions Button */}
                <motion.button
                  onClick={() => setShowPassedQuestions(!showPassedQuestions)}
                  className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all border flex items-center ${
                    showPassedQuestions 
                      ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
                      : 'bg-slate-600/30 border-white/10 text-slate-300 hover:bg-slate-600/50'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title={showPassedQuestions ? "Hide passed questions" : "Show passed questions"}
                >
                  <IconComponent 
                    icon={showPassedQuestions ? FiEyeOff : FiEye} 
                    className="h-3 w-3 sm:h-4 sm:w-4 mr-1" 
                  />
                  <span className="hidden sm:inline">
                    {showPassedQuestions ? "Hide Passed" : "Show Passed"}
                  </span>
                </motion.button>
                
                {/* Fullscreen Button */}
                <motion.button
                  onClick={() => setIsFullscreen(true)}
                  className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all border bg-cyan-500/20 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/30 flex items-center"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="Open in fullscreen"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                  <span className="hidden sm:inline">Fullscreen</span>
                </motion.button>
              </div>
            </div>
            
            {flashcards.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {/* Flashcard Display - No additional container on mobile */}
                <div className="bg-black/20 backdrop-blur-md rounded-xl p-4 sm:p-6 min-h-[200px] sm:min-h-[250px] flex flex-col justify-center border border-white/10">
                  <div className="text-center">
                    {/* Card Counter */}
                    <div className="mb-3 sm:mb-4">
                      <span className="text-xs sm:text-sm text-cyan-400 font-medium">
                        {t('aiStudy.card')} {currentFlashcard + 1} of {flashcards.length}
                      </span>
                      {flashcards[currentFlashcard]?.mastered && (
                        <span className="ml-2 bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full text-xs border border-emerald-500/30">
                          {t('aiStudy.mastered')}
                        </span>
                      )}
                    </div>
                    
                    {/* Question and Answer */}
                    <div className="mb-4 sm:mb-6">
                      <p className="text-base sm:text-lg font-medium text-slate-200 mb-3 sm:mb-4 leading-relaxed">
                        {flashcards[currentFlashcard]?.question}
                      </p>
                      
                      {showAnswer && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-slate-600/50 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-white/10"
                        >
                          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                            {flashcards[currentFlashcard]?.answer}
                          </p>
                        </motion.div>
                      )}
                    </div>
                    
                    {/* Action Buttons - Mobile Optimized */}
                    <div className="flex justify-center">
                      {!showAnswer ? (
                        <motion.button
                          variants={buttonVariants}
                          whileHover="hover"
                          whileTap="tap"
                          onClick={() => setShowAnswer(true)}
                          className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-medium text-sm sm:text-base"
                        >
                          {t('aiStudy.showAnswer')}
                        </motion.button>
                      ) : (
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                          <motion.button
                            variants={buttonVariants}
                            whileHover="hover"
                            whileTap="tap"
                            onClick={toggleFlashcardMastery}
                            className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base ${
                              flashcards[currentFlashcard]?.mastered
                                ? 'bg-white/10 text-slate-300 border border-white/10'
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
                            className="bg-white/10 text-slate-300 px-3 sm:px-4 py-2 rounded-lg font-medium border border-white/10 text-sm sm:text-base"
                          >
                            {t('aiStudy.hideAnswer')}
                          </motion.button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Navigation Controls - Mobile Optimized */}
                <div className="flex justify-between items-center gap-2">
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={handlePrevFlashcard}
                    className="bg-slate-700/50 border border-white/10 text-slate-300 px-3 sm:px-4 py-2 rounded-lg flex items-center backdrop-blur-sm text-sm sm:text-base flex-1 justify-center sm:flex-initial sm:justify-start"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span className="hidden sm:inline">{t('aiStudy.previous')}</span>
                    <span className="sm:hidden">Prev</span>
                  </motion.button>
                  
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => deleteFlashcard(flashcards[currentFlashcard]?.id)}
                    className="bg-red-500/20 border border-red-500/30 text-red-400 px-3 sm:px-4 py-2 rounded-lg flex items-center backdrop-blur-sm hover:bg-red-500/30 text-sm sm:text-base"
                  >
                    <IconComponent icon={FiTrash2} className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline ml-1">{t('aiStudy.delete')}</span>
                  </motion.button>
                  
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={handleNextFlashcard}
                    className="bg-slate-700/50 border border-white/10 text-slate-300 px-3 sm:px-4 py-2 rounded-lg flex items-center backdrop-blur-sm text-sm sm:text-base flex-1 justify-center sm:flex-initial sm:justify-start"
                  >
                    <span className="hidden sm:inline">{t('aiStudy.next')}</span>
                    <span className="sm:hidden">Next</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8 text-slate-400">
                <IconComponent icon={FiLayers} className="mx-auto text-3xl sm:text-4xl mb-2" />
                <p className="text-sm sm:text-base">{t('aiStudy.noFlashcardsInThisSet')}</p>
                <p className="text-xs sm:text-sm mt-1">{t('aiStudy.createYourFirstFlashcardToStartStudying')}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Create New Flashcards - Mobile Optimized, no container on mobile */}
        <div className="order-2">
          {/* Mobile: No container, Desktop: Container */}
          <div className="sm:bg-[#0f172a]/60 sm:backdrop-blur-md sm:border sm:border-white/10 sm:rounded-xl p-0 sm:p-6 sm:shadow-sm">
            <h3 className="text-base sm:text-lg font-medium text-blue-400 mb-3 sm:mb-4 flex items-center">
              <IconComponent icon={FiBookmark} className="mr-2 h-4 w-4 sm:h-5 sm:w-5" /> {t('aiStudy.createFlashcards')}
            </h3>
            
            {/* Creation Buttons - Stacked on mobile */}
            <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
              <motion.button 
                onClick={generateFlashcardsFromTopics}
                disabled={isGenerating || isGeneratingFromPrompt}
                className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg flex items-center justify-center font-medium disabled:opacity-50 text-sm sm:text-base"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {(isGenerating || isGeneratingFromPrompt) ? (
                  <motion.div
                    className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
                  >
                    <IconComponent icon={AiOutlineLoading3Quarters} className="h-4 w-4 sm:h-5 sm:w-5" />
                  </motion.div>
                ) : (
                  <IconComponent icon={AiOutlineBulb} className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                )}
                {t('aiStudy.generateFromAI')}
              </motion.button>
              
              <motion.button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full py-2.5 sm:py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg flex items-center justify-center font-medium disabled:opacity-50 text-sm sm:text-base"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isUploading ? (
                  <motion.div
                    className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
                  >
                    <IconComponent icon={AiOutlineLoading3Quarters} className="h-4 w-4 sm:h-5 sm:w-5" />
                  </motion.div>
                ) : (
                  <IconComponent icon={FiUpload} className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                )}
                <span className="hidden sm:inline">{t('aiStudy.uploadFilePDFImageDoc')}</span>
                <span className="sm:hidden">Upload File</span>
              </motion.button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
            
            {/* Divider */}
            <div className="text-center relative my-3 sm:my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20"></div>
              </div>
              <span className="relative bg-slate-800 px-2 text-xs sm:text-sm text-slate-400">{t('aiStudy.orCreateManually')}</span>
            </div>
            
            {/* Manual Creation Form - Mobile Optimized */}
            <form onSubmit={handleAddFlashcard}>
              <div className="mb-2 sm:mb-3">
                <label className="block text-slate-300 mb-1 text-xs sm:text-sm font-medium">
                  {t('aiStudy.question')}
                </label>
                <textarea
                  className="w-full p-2 sm:p-3 bg-black/20 backdrop-blur-sm border border-white/10 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none h-16 sm:h-20 text-slate-200 placeholder-slate-400 text-sm sm:text-base"
                  placeholder={t('aiStudy.enterYourQuestionHere')}
                  value={newFlashcard.question}
                  onChange={(e) => setNewFlashcard({...newFlashcard, question: e.target.value})}
                />
              </div>
              
              <div className="mb-3 sm:mb-4">
                <label className="block text-slate-300 mb-1 text-xs sm:text-sm font-medium">
                  {t('aiStudy.answer')}
                </label>
                <textarea
                  className="w-full p-2 sm:p-3 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none h-16 sm:h-20 text-slate-200 placeholder-slate-400 text-sm sm:text-base"
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
                className="w-full bg-gradient-to-r from-emerald-500 to-green-500 text-white py-2 sm:py-2.5 rounded-lg font-medium text-sm sm:text-base"
              >
                {t('aiStudy.addFlashcard')}
              </motion.button>
            </form>
          </div>
        </div>
      </div>

      {/* Flashcard Sets Selector - Mobile Responsive - Moved to bottom on mobile */}
      <div className="mt-6 sm:mt-8 order-3">
        <div className="flex items-center space-x-2 mb-3">
          <IconComponent icon={AiOutlineFolder} className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-400" />
          <span className="text-base sm:text-lg font-medium text-blue-400">{t('aiStudy.studySets')}</span>
        </div>
        {/* Mobile: Single column, Desktop: Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
          {flashcardSets.map((set) => (
            <motion.div
              key={set.id}
              className={`group p-3 sm:p-4 rounded-lg cursor-pointer transition-all border ${
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
                  <h4 className="font-medium truncate text-sm sm:text-base">{set.name}</h4>
                  <p className="text-xs opacity-75 mt-1">{set.flashcards.length} cards</p>
                  <p className="text-xs opacity-60 mt-1 line-clamp-2">{set.description}</p>
                </div>
                {flashcardSets.length > 1 && (
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFlashcardSet(set.id);
                    }}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 ml-2"
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

      {/* Create New Set Modal - Mobile Responsive */}
      <PortalModal 
        isOpen={showCreateSet}
        onClose={() => setShowCreateSet(false)}
        className="bg-[#0f172a] rounded-xl p-4 sm:p-6 max-w-md w-full mx-4 border border-white/10 shadow-2xl"
      >
        <h3 className="text-lg sm:text-xl font-semibold text-cyan-400 mb-3 sm:mb-4">{t('aiStudy.createNewFlashcardSet')}</h3>
        
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-slate-300 mb-1 text-xs sm:text-sm font-medium">
              {t('aiStudy.setName')}
            </label>
            <input
              type="text"
              value={newSetName}
              onChange={(e) => setNewSetName(e.target.value)}
              className="w-full p-2 sm:p-3 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-slate-200 placeholder-slate-400 text-sm sm:text-base"
              placeholder={t('aiStudy.enterSetName')}
            />
          </div>
          
          <div>
            <label className="block text-slate-300 mb-1 text-xs sm:text-sm font-medium">
              {t('aiStudy.descriptionOptional')}
            </label>
            <textarea
              value={newSetDescription}
              onChange={(e) => setNewSetDescription(e.target.value)}
              className="w-full p-2 sm:p-3 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none h-16 sm:h-20 text-slate-200 placeholder-slate-400 text-sm sm:text-base"
              placeholder={t('aiStudy.enterDescription')}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <motion.button
              onClick={createNewSet}
              disabled={!newSetName.trim()}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-2 sm:py-2.5 rounded-lg font-medium disabled:opacity-50 text-sm sm:text-base"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {t('aiStudy.createSet')}
            </motion.button>
            
            <motion.button
              onClick={() => setShowCreateSet(false)}
              className="flex-1 bg-slate-600/50 text-slate-300 py-2 sm:py-2.5 rounded-lg font-medium border border-white/10 text-sm sm:text-base"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {t('aiStudy.cancel')}
            </motion.button>
          </div>
        </div>
      </PortalModal>
      
      {/* AI Generation Modal - Mobile Responsive */}
      <PortalModal 
        isOpen={showAIModal}
        onClose={() => {
          setShowAIModal(false);
          setAiPrompt('');
        }}
        className="bg-[#0f172a] rounded-xl p-4 sm:p-6 max-w-2xl w-full mx-4 border border-white/10 shadow-2xl"
      >
        <h3 className="text-lg sm:text-xl font-semibold text-cyan-400 mb-3 sm:mb-4 flex items-center">
          <IconComponent icon={AiOutlineBulb} className="mr-2 h-5 w-5" />
          Generate AI Flashcards
        </h3>
        
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-slate-300 mb-2 text-xs sm:text-sm font-medium">
              What topic would you like to create flashcards for?
            </label>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              className="w-full p-2 sm:p-3 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 resize-none h-20 sm:h-24 text-slate-200 placeholder-slate-400 text-sm sm:text-base"
              placeholder="Enter a topic, subject, or specific area you want to study (e.g., 'React Hooks', 'World War 2', 'Calculus derivatives')..."
            />
          </div>
          
          <div>
            <p className="text-slate-300 mb-2 sm:mb-3 text-xs sm:text-sm font-medium">Or choose from quick topics:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 sm:max-h-40 overflow-y-auto">
              {quickTopics.map((topic) => (
                <motion.button
                  key={topic}
                  onClick={() => setAiPrompt(topic)}
                  className="p-2 bg-slate-600/30 border border-white/10 rounded-lg text-left text-slate-300 hover:bg-slate-600/50 hover:border-cyan-500/30 transition-all text-xs sm:text-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {topic}
                </motion.button>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <motion.button
              onClick={() => generateFlashcardsFromPrompt(aiPrompt)}
              disabled={!aiPrompt.trim() || isGeneratingFromPrompt}
              className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-2 sm:py-2.5 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center text-sm sm:text-base"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isGeneratingFromPrompt ? (
                <motion.div
                  className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: [0, 0, 1, 1] as const }}
                >
                  <IconComponent icon={AiOutlineLoading3Quarters} className="h-4 w-4 sm:h-5 sm:w-5" />
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
              className="flex-1 bg-slate-600/50 text-slate-300 py-2 sm:py-2.5 rounded-lg font-medium border border-white/10 text-sm sm:text-base"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {t('aiStudy.cancel')}
            </motion.button>
          </div>
        </div>
      </PortalModal>
      
      {/* Fullscreen Modal */}
      <PortalModal 
        isOpen={isFullscreen}
        onClose={() => setIsFullscreen(false)}
        className="bg-[#0f172a] backdrop-blur-xl border border-white/10 rounded-2xl w-full h-full flex flex-col shadow-2xl"
      >
        <div className="bg-[#0f172a]/60 backdrop-blur-md px-6 py-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center">
              <IconComponent icon={FiLayers} className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-cyan-400">Flashcard Study Session</h2>
              <p className="text-slate-300 text-sm">
                {activeSet?.name || 'Study Mode'} - {flashcards.length} cards
              </p>
            </div>
          </div>
          <motion.button
            onClick={() => setIsFullscreen(false)}
            className="text-slate-300 hover:text-white p-3 rounded-xl bg-slate-600/50 hover:bg-slate-500/50 transition-all duration-300 border border-slate-500/30"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <IconComponent icon={FiX} className="w-6 h-6" />
          </motion.button>
        </div>
        
        <div className="flex-1 p-8 overflow-hidden flex items-center justify-center">
          {flashcards.length > 0 ? (
            <div className="max-w-4xl w-full">
              {/* Large Flashcard Display */}
              <div className="bg-black/20 backdrop-blur-md rounded-2xl p-8 min-h-[400px] flex flex-col justify-center border border-white/10 shadow-2xl">
                <div className="text-center">
                  {/* Card Counter */}
                  <div className="mb-6">
                    <span className="text-lg text-cyan-400 font-medium">
                      Card {currentFlashcard + 1} of {flashcards.length}
                    </span>
                    {flashcards[currentFlashcard]?.mastered && (
                      <span className="ml-3 bg-emerald-500/20 text-emerald-400 px-3 py-2 rounded-full text-sm border border-emerald-500/30">
                        Mastered
                      </span>
                    )}
                  </div>
                  
                  {/* Question and Answer */}
                  <div className="mb-8">
                    <p className="text-2xl font-medium text-slate-200 mb-6 leading-relaxed">
                      {flashcards[currentFlashcard]?.question}
                    </p>
                    
                    {showAnswer && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-600/50 backdrop-blur-sm rounded-xl p-6 border border-white/10"
                      >
                        <p className="text-xl text-slate-300 leading-relaxed">
                          {flashcards[currentFlashcard]?.answer}
                        </p>
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex justify-center">
                    {!showAnswer ? (
                      <motion.button
                        variants={buttonVariants}
                        whileHover="hover"
                        whileTap="tap"
                        onClick={() => setShowAnswer(true)}
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-12 py-4 rounded-xl font-medium text-lg"
                      >
                        Show Answer
                      </motion.button>
                    ) : (
                      <div className="flex space-x-4">
                        <motion.button
                          variants={buttonVariants}
                          whileHover="hover"
                          whileTap="tap"
                          onClick={toggleFlashcardMastery}
                          className={`px-6 py-3 rounded-xl font-medium text-lg ${
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
                          className="bg-slate-600/50 text-slate-300 px-6 py-3 rounded-xl font-medium border border-white/10 text-lg"
                        >
                          Hide Answer
                        </motion.button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Navigation Controls */}
              <div className="flex justify-between items-center mt-6">
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={handlePrevFlashcard}
                  className="bg-slate-700/50 border border-white/10 text-slate-300 px-8 py-3 rounded-xl flex items-center backdrop-blur-sm text-lg"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </motion.button>
                
                <div className="flex items-center space-x-4">
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => deleteFlashcard(flashcards[currentFlashcard]?.id)}
                    className="bg-red-500/20 border border-red-500/30 text-red-400 px-6 py-3 rounded-xl flex items-center backdrop-blur-sm hover:bg-red-500/30 text-lg"
                  >
                    <IconComponent icon={FiTrash2} className="h-5 w-5 mr-2" />
                    Delete
                  </motion.button>
                </div>
                
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={handleNextFlashcard}
                  className="bg-slate-700/50 border border-white/10 text-slate-300 px-8 py-3 rounded-xl flex items-center backdrop-blur-sm text-lg"
                >
                  Next
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <IconComponent icon={FiLayers} className="h-16 w-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300 mb-2">No flashcards available</h3>
              <p className="text-slate-400">Generate some flashcards to start studying!</p>
            </div>
          )}
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
