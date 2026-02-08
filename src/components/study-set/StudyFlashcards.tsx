import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabase';
import { FaChevronLeft, FaChevronRight, FaImage, FaMagic, FaCommentDots } from 'react-icons/fa';
import { Skeleton } from '../ui/Skeleton';

interface Flashcard {
    question: string;
    answer: string;
}

interface StudyFlashcardsProps {
    onDiscuss?: (content: string) => void;
}

const StudyFlashcards: React.FC<StudyFlashcardsProps> = ({ onDiscuss }) => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [flipped, setFlipped] = useState(false);
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [stats, setStats] = useState({
        unfamiliar: 0,
        learning: 0,
        familiar: 0,
        mastered: 0
    });

    useEffect(() => {
        let intervalId: NodeJS.Timeout;
        let isMounted = true;

        const fetchData = async () => {
            if (!id || !user) return;

            try {
                const { data, error } = await supabase
                    .from('flashcard_documents')
                    .select('flashcards_data')
                    .eq('document_id', id)
                    .eq('uid', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.error('Error fetching data:', error);
                }

                if (isMounted) {
                    if (data && data.flashcards_data && Array.isArray(data.flashcards_data) && data.flashcards_data.length > 0) {
                        setFlashcards(data.flashcards_data);
                        setStats(prev => ({ ...prev, unfamiliar: data.flashcards_data.length }));
                        setLoading(false);
                        setIsGenerating(false);
                        if (intervalId) clearInterval(intervalId);
                    } else {
                        // Data not ready yet, keep polling
                        setIsGenerating(true);
                        setLoading(false);
                    }
                }
            } catch (err) {
                console.error('Unexpected error:', err);
            }
        };

        fetchData();
        intervalId = setInterval(fetchData, 10000); // Retry every 10 seconds

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [id, user]);

    const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentIndex < flashcards.length - 1) {
            setFlipped(false);
            setTimeout(() => setCurrentIndex(prev => prev + 1), 300);
        }
    };

    const handlePrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (currentIndex > 0) {
            setFlipped(false);
            setTimeout(() => setCurrentIndex(prev => prev - 1), 300);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-full max-w-4xl mx-auto w-full px-4">
                {/* Stats Pills Skeleton */}
                <div className="flex flex-wrap justify-center gap-2 mb-8">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} width={100} height={32} className="rounded-full" />
                    ))}
                </div>

                {/* Flashcard Skeleton */}
                <div className="w-full aspect-[16/9] mb-8">
                     <Skeleton width="100%" height="100%" className="rounded-2xl" />
                </div>

                {/* Controls Skeleton */}
                <div className="flex items-center gap-6">
                    <Skeleton width={48} height={48} className="rounded-full" />
                    <Skeleton width={60} height={24} />
                    <Skeleton width={48} height={48} className="rounded-full" />
                </div>
            </div>
        );
    }

    if (isGenerating) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-full">
                <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                    <FaMagic className="relative text-5xl text-indigo-500 dark:text-indigo-400 mb-6 animate-bounce" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Generating Flashcards...</h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-md text-center">
                    We're using AI to create smart flashcards from your document. This might take a few moments!
                </p>
            </div>
        );
    }

    if (flashcards.length === 0 && !loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-full">
                <p className="text-gray-500">No flashcards found.</p>
            </div>
        );
    }

    const currentCard = flashcards[currentIndex];

    return (
        <div className="flex-1 flex flex-col items-center justify-center h-full max-w-4xl mx-auto w-full px-4">
            {/* Stats Pills */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
                <div className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div> {stats.unfamiliar} Unfamiliar
                </div>
                <div className="bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div> {stats.learning} Learning
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div> {stats.familiar} Familiar
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-500/20 text-green-700 dark:text-green-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div> {stats.mastered} Mastered
                </div>
            </div>

            {/* Flashcard */}
            <div 
                className="w-full aspect-[16/9] min-h-[300px] mb-8 cursor-pointer group" 
                onClick={() => setFlipped(!flipped)}
                style={{ perspective: '1000px' }}
            >
                 <div 
                    className="relative w-full h-full transition-transform duration-500"
                    style={{ 
                        transformStyle: 'preserve-3d',
                        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                    }}
                 >
                     {/* Front */}
                     <div 
                        className="absolute inset-0 bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-2xl p-8 md:p-12 flex flex-col items-center justify-center group-hover:border-gray-300 dark:group-hover:border-white/20 transition-colors shadow-xl dark:shadow-2xl shadow-gray-200/50 dark:shadow-black/50"
                        style={{ backfaceVisibility: 'hidden' }}
                     >
                         <div className="absolute top-6 left-6 text-gray-400 dark:text-gray-500"><FaImage /></div>
                         <h3 className="text-xl md:text-2xl font-medium text-center leading-relaxed select-none text-gray-900 dark:text-white">{currentCard?.question}</h3>
                         
                         <div className="absolute bottom-6 flex flex-col items-center gap-2">
                            <span className="text-sm text-gray-500">Click to flip</span>
                            <span className="bg-gray-100 dark:bg-[#1a1a1a] px-2 py-1 rounded text-xs text-gray-500 dark:text-gray-400 font-mono border border-gray-200 dark:border-white/5">space</span>
                         </div>
                         
                         <div className="absolute bottom-6 left-6 text-gray-400 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                             </svg>
                         </div>
                     </div>

                     {/* Back */}
                     <div 
                        className="absolute inset-0 bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-2xl p-8 md:p-12 flex flex-col items-center justify-center group-hover:border-gray-300 dark:group-hover:border-white/20 transition-colors shadow-xl dark:shadow-2xl shadow-gray-200/50 dark:shadow-black/50"
                        style={{ 
                            backfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)'
                        }}
                     >
                         <h3 className="text-xl md:text-2xl font-medium text-center text-blue-600 dark:text-blue-400 mb-4 select-none">Answer</h3>
                         <p className="text-gray-600 dark:text-gray-400 text-center max-w-lg leading-relaxed select-none">{currentCard?.answer}</p>
                     </div>
                 </div>
            </div>

            {/* Controls */}
            <div className="relative w-full flex justify-center items-center">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={handlePrev}
                        disabled={currentIndex === 0}
                        className={`w-12 h-12 rounded-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-700 dark:text-white transition-colors ${currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-[#252525]'}`}
                    >
                        <FaChevronLeft />
                    </button>
                    <span className="text-gray-600 dark:text-gray-400 font-medium">{currentIndex + 1} / {flashcards.length}</span>
                    <button 
                        onClick={handleNext}
                        disabled={currentIndex === flashcards.length - 1}
                        className={`w-12 h-12 rounded-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-700 dark:text-white transition-colors ${currentIndex === flashcards.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-[#252525]'}`}
                    >
                        <FaChevronRight />
                    </button>
                </div>

                {onDiscuss && (
                    <div className="absolute right-0">
                        <button
                            onClick={() => {
                                const content = `Flashcard Question: ${currentCard.question}\nAnswer: ${currentCard.answer}`;
                                onDiscuss(content);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                            title="Discuss in Chat"
                        >
                            <FaCommentDots />
                            <span className="text-sm font-medium hidden sm:inline">Discuss</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudyFlashcards;
