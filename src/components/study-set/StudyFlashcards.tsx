import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabase';
import { FaChevronLeft, FaChevronRight, FaImage, FaMagic, FaCommentDots, FaCheckCircle, FaRedo } from 'react-icons/fa';
import { Skeleton } from '../ui/Skeleton';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { v4 as uuidv4 } from 'uuid';
import 'katex/dist/katex.min.css';

type FlashcardStatus = 'unfamiliar' | 'learning' | 'mastered';

interface Flashcard {
    id: string;
    question: string;
    answer: string;
    status: FlashcardStatus;
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
    const [filter, setFilter] = useState<FlashcardStatus | 'all'>('unfamiliar'); // Default to 'unfamiliar' based on requirement? Or 'all'? User said "three ... will be buttons". Let's default to 'all' or 'unfamiliar'. Usually 'unfamiliar' is better for study.
    
    // Computed stats
    const stats = useMemo(() => {
        return {
            unfamiliar: flashcards.filter(f => f.status === 'unfamiliar').length,
            learning: flashcards.filter(f => f.status === 'learning').length,
            mastered: flashcards.filter(f => f.status === 'mastered').length,
            total: flashcards.length
        };
    }, [flashcards]);

    // Filtered cards
    const filteredFlashcards = useMemo(() => {
        if (filter === 'all') return flashcards;
        return flashcards.filter(card => card.status === filter);
    }, [flashcards, filter]);

    const currentCard = filteredFlashcards[currentIndex];

    // Reset index when filter changes
    useEffect(() => {
        setCurrentIndex(0);
        setFlipped(false);
    }, [filter]);

    // Reset flip when card changes
    useEffect(() => {
        setFlipped(false);
    }, [currentCard?.id]);

    // Handle spacebar to flip
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' && !isGenerating && !loading && flashcards.length > 0) {
                e.preventDefault(); // Prevent scrolling
                handleFlip();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [flipped, isGenerating, loading, flashcards.length]); // Add dependencies needed for handleFlip closure if not using functional state update or stable ref

    // Preprocess LaTeX to convert OpenAI format to react-markdown format
    const preprocessLaTeX = (text: string) => {
        if (typeof text !== 'string') return '';
        
        // 1. Convert explicit delimiters
        let processed = text
            .replace(/\\\[([\s\S]*?)\\\]/g, (_, eq) => `$$${eq}$$`)
            .replace(/\\\(([\s\S]*?)\\\)/g, (_, eq) => `$${eq}$`)
            .replace(/\[\s*(\\frac|\\boxed|\\begin|\\sum|\\int|\\partial|\\sqrt|\\mathbf|\\mathrm|\\mathcal|\\mathscr|\\mathfrak|\\mathbb|\\sin|\\cos|\\tan)([\s\S]*?)\]/g, (match, cmd, rest) => `$$${cmd}${rest}$$`);

        // 2. Identify and wrap bare math words
        return processed.split(/(\s+)/).map(part => {
             if (part.trim() === '') return part; // Preserve whitespace
             
             // Check if it's already wrapped
             if (part.includes('$')) return part;

             // Heuristic: contains ^ or \ or ( _ AND { )
             const isMath = part.includes('^') || part.includes('\\') || (part.includes('_') && part.includes('{'));
             
             if (isMath) {
                 // Handle trailing punctuation
                 const match = part.match(/^(.+?)([.,;:]?)$/);
                 if (match) {
                     const [_, core, punct] = match;
                     return `$${core}$${punct}`;
                 }
                 return `$${part}$`;
             }
             return part;
        }).join('');
    };

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
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (error) {
                    console.error('Error fetching data:', error);
                }

                if (isMounted) {
                    if (data && data.flashcards_data && Array.isArray(data.flashcards_data) && data.flashcards_data.length > 0) {
                        // Ensure each card has an ID and status
                        const processedCards: Flashcard[] = data.flashcards_data.map((card: any) => ({
                            question: card.question,
                            answer: card.answer,
                            id: card.id || uuidv4(),
                            status: card.status || 'unfamiliar'
                        }));
                        
                        setFlashcards(processedCards);
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

    const updateFlashcardStatus = async (cardId: string, newStatus: FlashcardStatus) => {
        if (!user || !id) return;

        const updatedCards = flashcards.map(c => c.id === cardId ? { ...c, status: newStatus } : c);
        setFlashcards(updatedCards);

        const { error } = await supabase
            .from('flashcard_documents')
            .update({ flashcards_data: updatedCards })
            .eq('document_id', id)
            .eq('uid', user.id);
            
        if (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleResetAllMastered = async () => {
        if (!user || !id) return;
        
        const updatedCards = flashcards.map(c => 
            c.status === 'mastered' ? { ...c, status: 'unfamiliar' as FlashcardStatus } : c
        );
        setFlashcards(updatedCards);

        const { error } = await supabase
            .from('flashcard_documents')
            .update({ flashcards_data: updatedCards })
            .eq('document_id', id)
            .eq('uid', user.id);
            
        if (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleFlip = () => {
        setFlipped(!flipped);
    };

    // Ensure index is valid when list changes
    useEffect(() => {
        if (currentIndex >= filteredFlashcards.length && filteredFlashcards.length > 0) {
            setCurrentIndex(Math.max(0, filteredFlashcards.length - 1));
        }
    }, [filteredFlashcards.length, currentIndex]);

    const handleNext = async (e: React.MouseEvent) => {
        e.stopPropagation();

        // Auto-promote Unfamiliar -> Learning if flipped
        if (currentCard && currentCard.status === 'unfamiliar' && flipped) {
            await updateFlashcardStatus(currentCard.id, 'learning');
            
            // If filter is 'unfamiliar', card will be removed from view, so we don't need to advance.
            // But if filter is 'all', the card stays, so we should advance.
            if (filter !== 'unfamiliar') {
                if (currentIndex < filteredFlashcards.length - 1) {
                    setFlipped(false);
                    setTimeout(() => setCurrentIndex(prev => prev + 1), 300);
                }
            }
            return;
        }

        if (currentIndex < filteredFlashcards.length - 1) {
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
                    {[1, 2, 3].map((i) => (
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

    return (
        <div className="flex-1 flex flex-col items-center justify-center h-full max-w-4xl mx-auto w-full px-4">
            {/* Stats Filter Buttons */}
            <div className="flex flex-wrap justify-center items-center gap-3 mb-8">
                <button
                    onClick={() => setFilter('unfamiliar')}
                    className={`px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                        filter === 'unfamiliar' 
                        ? 'bg-red-100 dark:bg-red-900/50 border-red-500 text-red-700 dark:text-red-400 ring-2 ring-red-500/20' 
                        : 'bg-gray-100 dark:bg-gray-800 border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                >
                    <div className={`w-2 h-2 rounded-full ${filter === 'unfamiliar' ? 'bg-red-500' : 'bg-gray-400'}`}></div>
                    {stats.unfamiliar} Unfamiliar
                </button>
                <button
                    onClick={() => setFilter('learning')}
                    className={`px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                        filter === 'learning' 
                        ? 'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-500 text-indigo-700 dark:text-indigo-400 ring-2 ring-indigo-500/20' 
                        : 'bg-gray-100 dark:bg-gray-800 border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                >
                    <div className={`w-2 h-2 rounded-full ${filter === 'learning' ? 'bg-indigo-500' : 'bg-gray-400'}`}></div>
                    {stats.learning} Learning
                </button>
                <button
                    onClick={() => setFilter('mastered')}
                    className={`px-4 py-1.5 rounded-full text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                        filter === 'mastered' 
                        ? 'bg-green-100 dark:bg-green-900/50 border-green-500 text-green-700 dark:text-green-400 ring-2 ring-green-500/20' 
                        : 'bg-gray-100 dark:bg-gray-800 border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                >
                    <div className={`w-2 h-2 rounded-full ${filter === 'mastered' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    {stats.mastered} Mastered
                </button>
            </div>

            {/* Reset All Mastered Button */}
            {filter === 'mastered' && stats.mastered > 0 && (
                <div className="mb-6 flex justify-center">
                    <button
                        onClick={handleResetAllMastered}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium border border-red-200 dark:border-red-900/50"
                    >
                        <FaRedo /> Reset All Mastered to Unfamiliar
                    </button>
                </div>
            )}

            {/* Flashcard */}
            {filteredFlashcards.length > 0 ? (
                <div 
                    className="w-full aspect-[16/9] min-h-[300px] mb-8 cursor-pointer group" 
                    onClick={handleFlip}
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
                             <div className="text-xl md:text-2xl font-medium text-center leading-relaxed select-none text-gray-900 dark:text-white prose dark:prose-invert max-w-none">
                                    <ReactMarkdown 
                                        remarkPlugins={[remarkGfm, remarkMath]} 
                                        rehypePlugins={[rehypeKatex]}
                                        components={{
                                            p: ({node, ...props}) => <span {...props} />
                                        }}
                                    >
                                        {preprocessLaTeX(currentCard?.question)}
                                    </ReactMarkdown>
                                </div>
                             
                             <div className="absolute bottom-6 flex flex-col items-center gap-2">
                                <span className="text-sm text-gray-500">Click to flip</span>
                                <span className="bg-gray-100 dark:bg-[#1a1a1a] px-2 py-1 rounded text-xs text-gray-500 dark:text-gray-400 font-mono border border-gray-200 dark:border-white/5">space</span>
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
                             <div className="text-gray-600 dark:text-gray-400 text-center max-w-lg leading-relaxed select-none prose dark:prose-invert max-w-none">
                                    <ReactMarkdown 
                                        remarkPlugins={[remarkGfm, remarkMath]} 
                                        rehypePlugins={[rehypeKatex]}
                                        components={{
                                            p: ({node, ...props}) => <span {...props} />
                                        }}
                                    >
                                        {preprocessLaTeX(currentCard?.answer)}
                                    </ReactMarkdown>
                                </div>

                            {/* Action Buttons on Back */}
                            <div className="absolute bottom-6 flex items-center gap-3" onClick={e => e.stopPropagation()}>
                                {currentCard.status === 'unfamiliar' && (
                                    <>
                                        <button
                                            onClick={() => updateFlashcardStatus(currentCard.id, 'learning')}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors text-xs font-medium whitespace-nowrap"
                                        >
                                            <FaRedo size={12} /> Still Learning
                                        </button>
                                        <button
                                            onClick={() => updateFlashcardStatus(currentCard.id, 'mastered')}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors text-xs font-medium whitespace-nowrap"
                                        >
                                            <FaCheckCircle size={12} /> Know it
                                        </button>
                                    </>
                                )}
                                {currentCard.status === 'learning' && (
                                    <>
                                        <button
                                            onClick={() => updateFlashcardStatus(currentCard.id, 'learning')}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors text-xs font-medium whitespace-nowrap"
                                        >
                                            <FaRedo size={12} /> Still Learning
                                        </button>
                                        <button
                                            onClick={() => updateFlashcardStatus(currentCard.id, 'mastered')}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors text-xs font-medium whitespace-nowrap"
                                        >
                                            <FaCheckCircle size={12} /> Know it
                                        </button>
                                    </>
                                )}
                                {currentCard.status === 'mastered' && (
                                    <button
                                        onClick={() => updateFlashcardStatus(currentCard.id, 'unfamiliar')}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-xs font-medium whitespace-nowrap"
                                    >
                                        <FaRedo size={12} /> Reset to Unfamiliar
                                    </button>
                                )}
                            </div>
                         </div>
                     </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                    <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">No cards in this category.</p>
                    {filter !== 'all' && (
                        <button 
                            onClick={() => setFilter('all')}
                            className="text-indigo-500 hover:text-indigo-600 font-medium"
                        >
                            View all cards
                        </button>
                    )}
                </div>
            )}

            {/* Controls */}
            {filteredFlashcards.length > 0 && (
                <div className="relative w-full flex justify-center items-center">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={handlePrev}
                            disabled={currentIndex === 0}
                            className={`w-12 h-12 rounded-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-700 dark:text-white transition-colors ${currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-[#252525]'}`}
                        >
                            <FaChevronLeft />
                        </button>
                        <span className="text-gray-600 dark:text-gray-400 font-medium">{currentIndex + 1} / {filteredFlashcards.length}</span>
                        <button 
                            onClick={handleNext}
                            disabled={currentIndex === filteredFlashcards.length - 1}
                            className={`w-12 h-12 rounded-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-700 dark:text-white transition-colors ${currentIndex === filteredFlashcards.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-[#252525]'}`}
                        >
                            <FaChevronRight />
                        </button>
                    </div>

                    {onDiscuss && currentCard && (
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
            )}
        </div>
    );
};

export default StudyFlashcards;
