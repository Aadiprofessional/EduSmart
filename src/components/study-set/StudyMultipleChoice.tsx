import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabase';
import { FaChevronLeft, FaChevronRight, FaMagic, FaCheckCircle, FaTimesCircle, FaCommentDots, FaRedo } from 'react-icons/fa';
import { Skeleton } from '../ui/Skeleton';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { v4 as uuidv4 } from 'uuid';

type QuestionStatus = 'unfamiliar' | 'learning' | 'mastered';

interface MultipleChoiceQuestion {
    id: string;
    question: string;
    options: { [key: string]: string };
    correct_option: string;
    explanation?: string;
    status: QuestionStatus;
    user_answer?: string;
}

interface StudyMultipleChoiceProps {
    onDiscuss?: (content: string) => void;
}

const StudyMultipleChoice: React.FC<StudyMultipleChoiceProps> = ({ onDiscuss }) => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [questions, setQuestions] = useState<MultipleChoiceQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [filter, setFilter] = useState<QuestionStatus | 'all'>('unfamiliar');

    // Computed stats
    const stats = useMemo(() => {
        return {
            unfamiliar: questions.filter(q => q.status === 'unfamiliar').length,
            learning: questions.filter(q => q.status === 'learning').length,
            mastered: questions.filter(q => q.status === 'mastered').length,
            total: questions.length
        };
    }, [questions]);

    // Filtered questions
    const filteredQuestions = useMemo(() => {
        if (filter === 'all') return questions;
        return questions.filter(q => q.status === filter);
    }, [questions, filter]);

    const currentQuestion = useMemo(() => {
        return filteredQuestions[currentIndex];
    }, [filteredQuestions, currentIndex]);

    // Reset state when question changes
    useEffect(() => {
        if (currentQuestion) {
            setSelectedOption(currentQuestion.user_answer || null);
            setShowResult(false);
            setIsCorrect(false);
        }
    }, [currentQuestion?.id]);

    // Reset index when filter changes
    useEffect(() => {
        setCurrentIndex(0);
    }, [filter]);

    // Safety check for index
    useEffect(() => {
        if (currentIndex >= filteredQuestions.length && filteredQuestions.length > 0) {
            setCurrentIndex(Math.max(0, filteredQuestions.length - 1));
        }
    }, [filteredQuestions.length, currentIndex]);

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
                    .from('mcq_documents')
                    .select('mcq_data')
                    .eq('document_id', id)
                    .eq('uid', user.id)
                    .maybeSingle();

                if (error) {
                    console.error('Error fetching data:', error);
                }

                if (isMounted) {
                    if (data && data.mcq_data && Array.isArray(data.mcq_data) && data.mcq_data.length > 0) {
                        const processedQuestions: MultipleChoiceQuestion[] = data.mcq_data.map((q: any) => ({
                            ...q,
                            id: q.id || uuidv4(),
                            status: q.status || 'unfamiliar',
                            user_answer: q.user_answer || undefined
                        }));
                        setQuestions(processedQuestions);
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
        intervalId = setInterval(fetchData, 3000);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [id, user]);

    const updateQuestionData = async (questionId: string, updates: Partial<MultipleChoiceQuestion>) => {
        if (!user || !id) return;

        const updatedQuestions = questions.map(q => q.id === questionId ? { ...q, ...updates } : q);
        setQuestions(updatedQuestions);

        const { error } = await supabase
            .from('mcq_documents')
            .update({ mcq_data: updatedQuestions })
            .eq('document_id', id)
            .eq('uid', user.id);
            
        if (error) {
            console.error('Error updating data:', error);
        }
    };

    const handleOptionSelect = (option: string) => {
        if (showResult || !currentQuestion) return;
        
        setSelectedOption(option);
        const correct = option === currentQuestion.correct_option;
        setIsCorrect(correct);
        setShowResult(true);
        
        updateQuestionData(currentQuestion.id, { user_answer: option });
    };

    const handleResetAllMastered = async () => {
        if (!user || !id) return;
        
        const updatedQuestions = questions.map(q => 
            q.status === 'mastered' ? { ...q, status: 'unfamiliar' as QuestionStatus, user_answer: undefined } : q
        );
        setQuestions(updatedQuestions);

        const { error } = await supabase
            .from('mcq_documents')
            .update({ mcq_data: updatedQuestions })
            .eq('document_id', id)
            .eq('uid', user.id);
            
        if (error) {
            console.error('Error updating data:', error);
        }
    };

    const handleUnfamiliarNext = () => {
        if (!currentQuestion) return;
        
        // If incorrect and unfamiliar, move to learning
        if (!isCorrect && currentQuestion.status === 'unfamiliar') {
            updateQuestionData(currentQuestion.id, { status: 'learning' });
        } else if (isCorrect) {
            updateQuestionData(currentQuestion.id, { status: 'mastered' });
        } else {
            // Just move next if no status change needed
            handleNext();
        }
    };

    const handleLearningNext = () => {
        if (!currentQuestion) return;

        if (isCorrect) {
             updateQuestionData(currentQuestion.id, { status: 'mastered' });
        } else {
             handleNext();
        }
    };

    const handleReset = () => {
        setShowResult(false);
        setIsCorrect(false);
        setSelectedOption(null);
    };

    const handleNext = () => {
        if (currentIndex < filteredQuestions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    if (loading) {

        return (
            <div className="flex-1 flex flex-col items-center justify-center h-full max-w-5xl mx-auto w-full px-4">
                {/* Stats Pills Skeleton */}
                <div className="flex flex-wrap justify-center gap-2 mb-12">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} width={120} height={32} className="rounded-full" />
                    ))}
                </div>

                {/* Question Skeleton */}
                <div className="w-full max-w-3xl mb-12 flex flex-col items-center gap-3">
                    <Skeleton width="90%" height={32} />
                    <Skeleton width="60%" height={32} />
                </div>

                {/* Options Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-12">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl p-4 flex items-center gap-4">
                            <Skeleton width={32} height={32} className="rounded flex-shrink-0" />
                            <Skeleton width="70%" height={24} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (isGenerating) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-full">
                <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                    <FaMagic className="relative text-5xl text-indigo-400 mb-6 animate-bounce" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Generating with AI magic...</h2>
                <p className="text-gray-400 max-w-md text-center">
                    We're crafting challenging multiple choice questions from your material. This usually takes just a moment!
                </p>
            </div>
        );
    }

    if (questions.length === 0 && !loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-full">
                <p className="text-gray-400">No questions found.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col items-center justify-center h-full max-w-5xl mx-auto w-full px-4">
            {/* Stats Filter Buttons */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
                <button
                    onClick={() => setFilter('unfamiliar')}
                    className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${
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
                    className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${
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
                    className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${
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

            {filteredQuestions.length > 0 && currentQuestion ? (
                <>
                    {/* Question */}
                    <div className="text-xl md:text-2xl font-medium text-center text-gray-900 dark:text-white mb-12 max-w-3xl leading-relaxed prose dark:prose-invert max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {preprocessLaTeX(currentQuestion?.question)}
                        </ReactMarkdown>
                    </div>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-8">
                        {currentQuestion?.options && (
                            Object.entries(currentQuestion.options).map(([key, value]) => {
                            // If mastered, show result immediately
                            const isMastered = currentQuestion.status === 'mastered';
                            const effectiveShowResult = showResult || isMastered;
                            
                            const isSelected = selectedOption === key;
                            const isCorrectOption = key === currentQuestion.correct_option;
                            
                            let borderClass = "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20";
                            let bgClass = "bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-[#252525]";
                            let textClass = "text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white";
                            
                            if (effectiveShowResult) {
                                if (isCorrectOption) {
                                    borderClass = "border-green-500/50";
                                    bgClass = "bg-green-50 dark:bg-green-900/20";
                                    textClass = "text-green-700 dark:text-green-200";
                                } else if (isSelected && !isCorrectOption && !isMastered) {
                                    // Only show red for selected wrong answer if not just viewing mastered
                                    borderClass = "border-red-500/50";
                                    bgClass = "bg-red-50 dark:bg-red-900/20";
                                    textClass = "text-red-700 dark:text-red-200";
                                } else {
                                    // Dim other options
                                    bgClass = "bg-gray-50 dark:bg-[#111] opacity-50";
                                }
                            }

                            return (
                                <button 
                                    key={key}
                                    onClick={() => handleOptionSelect(key)}
                                    disabled={effectiveShowResult}
                                    className={`${bgClass} border ${borderClass} rounded-xl p-4 flex items-center gap-4 text-left transition-all group`}
                                >
                                    <div className={`w-8 h-8 rounded ${effectiveShowResult && isCorrectOption ? 'bg-green-500 text-white' : (effectiveShowResult && isSelected && !isMastered ? 'bg-red-500 text-white' : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-500')} font-bold flex items-center justify-center flex-shrink-0 border border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white transition-colors`}>
                                        {key}
                                    </div>
                                    <div className={`${textClass} text-sm md:text-base flex-1 prose dark:prose-invert max-w-none`}>
                                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                            {preprocessLaTeX(value)}
                                        </ReactMarkdown>
                                    </div>
                                    {effectiveShowResult && isCorrectOption && <FaCheckCircle className="text-green-500 flex-shrink-0" />}
                                    {effectiveShowResult && isSelected && !isCorrectOption && !isMastered && <FaTimesCircle className="text-red-500 flex-shrink-0" />}
                                </button>
                            );
                        })
                        )}
                    </div>

                    {/* Explanation */}
                    {(showResult || currentQuestion.status === 'mastered') && currentQuestion.explanation && (
                        <div className="w-full max-w-3xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-500/20 rounded-xl p-6 mb-8 animate-in fade-in slide-in-from-bottom-4">
                            <h3 className="text-blue-800 dark:text-blue-300 font-semibold mb-2 flex items-center gap-2">
                                <FaMagic className="text-blue-500" /> Explanation
                            </h3>
                            <div className="text-blue-900 dark:text-blue-200 leading-relaxed prose dark:prose-invert max-w-none">
                                 <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                    {preprocessLaTeX(currentQuestion.explanation)}
                                </ReactMarkdown>
                            </div>
                        </div>
                    )}
                    
                    {/* Action Buttons Footer */}
                    {(showResult || currentQuestion.status === 'mastered') && (
                        <div className="flex justify-center items-center w-full gap-4 pb-8">
                             {/* Unfamiliar Actions */}
                             {currentQuestion.status === 'unfamiliar' && (
                                <>
                                    {!isCorrect ? (
                                        <>
                                            <button
                                                onClick={handleReset}
                                                className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
                                            >
                                                <FaRedo size={12} /> Retry
                                            </button>
                                            <button
                                                onClick={handleUnfamiliarNext}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                                            >
                                                Next
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={handleUnfamiliarNext}
                                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                                        >
                                            Continue <FaChevronRight size={12} />
                                        </button>
                                    )}
                                </>
                            )}

                            {/* Learning Actions */}
                            {currentQuestion.status === 'learning' && (
                                <>
                                    {!isCorrect ? (
                                        <button
                                            onClick={handleReset}
                                            className="flex items-center gap-2 px-6 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors font-medium"
                                        >
                                            <FaRedo size={12} /> Retry
                                        </button>
                                    ) : (
                                        <button
                                            onClick={handleLearningNext}
                                            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                                        >
                                            Continue <FaChevronRight size={12} />
                                        </button>
                                    )}
                                </>
                            )}
                            
                            {/* Mastered Actions */}
                            {currentQuestion.status === 'mastered' && (
                                <button 
                                    onClick={handleNext}
                                    className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 px-6 py-2 rounded-lg font-bold transition-colors"
                                >
                                    {currentIndex < filteredQuestions.length - 1 ? 'Next' : 'Finish'}
                                </button>
                            )}
                        </div>
                    )}
                </>
            ) : (
                 <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[300px] text-center">
                    <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">No questions in this category.</p>
                    {filter !== 'all' && (
                        <button 
                            onClick={() => setFilter('all')}
                            className="text-indigo-500 hover:text-indigo-600 font-medium"
                        >
                            View all questions
                        </button>
                    )}
                </div>
            )}

            {/* Navigation */}
            {filteredQuestions.length > 0 && (
                <div className="relative w-full flex justify-center items-center">
                    <div className="flex items-center gap-6">
                        <button 
                            onClick={handlePrev}
                            disabled={currentIndex === 0}
                            className={`w-12 h-12 rounded-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-900 dark:text-white transition-colors ${currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-[#252525]'}`}
                        >
                            <FaChevronLeft />
                        </button>
                        <span className="text-gray-400 font-medium">{currentIndex + 1} / {filteredQuestions.length}</span>
                        <button 
                            onClick={handleNext}
                            disabled={currentIndex === filteredQuestions.length - 1}
                            className={`w-12 h-12 rounded-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-900 dark:text-white transition-colors ${currentIndex === filteredQuestions.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-[#252525]'}`}
                        >
                            <FaChevronRight />
                        </button>
                    </div>

                    {onDiscuss && currentQuestion && (
                        <div className="absolute right-0">
                            <button
                                onClick={() => {
                                    const optionsStr = Object.entries(currentQuestion.options)
                                        .map(([k, v]) => `${k}: ${v}`)
                                        .join('\n');
                                    const content = `Multiple Choice Question: ${currentQuestion.question}\nOptions:\n${optionsStr}\nCorrect Answer: ${currentQuestion.correct_option}`;
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

export default StudyMultipleChoice;
