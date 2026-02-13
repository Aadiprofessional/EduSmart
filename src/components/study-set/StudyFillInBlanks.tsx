import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabase';
import { FaChevronLeft, FaChevronRight, FaMagic, FaCheckCircle, FaTimesCircle, FaSpinner, FaCommentDots, FaRedo } from 'react-icons/fa';
import { Skeleton } from '../ui/Skeleton';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { v4 as uuidv4 } from 'uuid';
import 'katex/dist/katex.min.css';

type QuestionStatus = 'unfamiliar' | 'learning' | 'mastered';

interface BlankQuestion {
    id: string;
    before_blank: string;
    blank: string;
    after_blank: string;
    status: QuestionStatus;
    user_answer?: string;
}

interface StudyFillInBlanksProps {
    onDiscuss?: (text: string) => void;
}

const StudyFillInBlanks: React.FC<StudyFillInBlanksProps> = ({ onDiscuss }) => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [questions, setQuestions] = useState<BlankQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [hintText, setHintText] = useState<string | null>(null);
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
            setUserAnswer(currentQuestion.user_answer || '');
            setHintText(null);
            setShowResult(false);
            setIsCorrect(false);
        }
    }, [currentQuestion?.id]);

    // Reset index when filter changes
    useEffect(() => {
        setCurrentIndex(0);
    }, [filter]);

    // Preprocess LaTeX to convert OpenAI format to react-markdown format
    const preprocessLaTeX = (text: string) => {
        if (typeof text !== 'string') return '';
        
        // 1. Convert explicit delimiters
        let processed = text
            .replace(/\\\[([\s\S]*?)\\\]/g, (_, eq) => `$$${eq}$$`)
            .replace(/\\\(([\s\S]*?)\\\)/g, (_, eq) => `$${eq}$`)
            .replace(/\[\s*(\\frac|\\boxed|\\begin|\\sum|\\int|\\partial|\\sqrt|\\mathbf|\\mathrm|\\mathcal|\\mathscr|\\mathfrak|\\mathbb|\\sin|\\cos|\\tan)([\s\S]*?)\]/g, (match, cmd, rest) => `$$${cmd}${rest}$$`);

        // 2. Identify and wrap bare math words
        // We look for words containing ^, \, or { } that are NOT already inside $...$
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
                     // Ensure we don't break existing latex commands by naive wrapping
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
                    .from('fill_in_blank_documents')
                    .select('generated_json')
                    .eq('document_id', id)
                    .eq('uid', user.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (error) {
                    console.error('Error fetching data:', error);
                }

                if (isMounted) {
                    if (data && data.generated_json && Array.isArray(data.generated_json) && data.generated_json.length > 0) {
                        const processedQuestions: BlankQuestion[] = data.generated_json.map((q: any) => ({
                            before_blank: q.before_blank,
                            blank: q.blank,
                            after_blank: q.after_blank,
                            id: q.id || uuidv4(),
                            status: q.status || 'unfamiliar',
                            user_answer: q.user_answer || ''
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

    // Safety check for index
    useEffect(() => {
        if (currentIndex >= filteredQuestions.length && filteredQuestions.length > 0) {
            setCurrentIndex(Math.max(0, filteredQuestions.length - 1));
        }
    }, [filteredQuestions.length, currentIndex]);

    const updateQuestionData = async (questionId: string, updates: Partial<BlankQuestion>) => {
        if (!user || !id) return;

        const updatedQuestions = questions.map(q => q.id === questionId ? { ...q, ...updates } : q);
        setQuestions(updatedQuestions);

        const { error } = await supabase
            .from('fill_in_blank_documents')
            .update({ generated_json: updatedQuestions })
            .eq('document_id', id)
            .eq('uid', user.id);
            
        if (error) {
            console.error('Error updating data:', error);
        }
    };

    const handleResetAllMastered = async () => {
        if (!user || !id) return;
        
        const updatedQuestions = questions.map(q => 
            q.status === 'mastered' ? { ...q, status: 'unfamiliar' as QuestionStatus, user_answer: '' } : q
        );
        setQuestions(updatedQuestions);

        const { error } = await supabase
            .from('fill_in_blank_documents')
            .update({ generated_json: updatedQuestions })
            .eq('document_id', id)
            .eq('uid', user.id);
            
        if (error) {
            console.error('Error updating data:', error);
        }
    };

    const handleCheck = () => {
        if (!userAnswer.trim()) return;
        const currentQ = filteredQuestions[currentIndex];
        if (!currentQ) return;
        
        const correct = userAnswer.trim().toLowerCase() === currentQ.blank.toLowerCase();
        setIsCorrect(correct);
        setShowResult(true);

        // Just update user_answer, defer status change to user action
        updateQuestionData(currentQ.id, { user_answer: userAnswer });
    };

    const handleUnfamiliarNext = () => {
        const currentQ = filteredQuestions[currentIndex];
        if (!currentQ) return;
        
        // If incorrect and unfamiliar, move to learning
        if (!isCorrect && currentQ.status === 'unfamiliar') {
            updateQuestionData(currentQ.id, { status: 'learning' });
        } else if (isCorrect) {
            updateQuestionData(currentQ.id, { status: 'mastered' });
        } else {
            // Just move next if no status change needed
            handleNext();
        }
    };
    
    const handleLearningNext = () => {
        const currentQ = filteredQuestions[currentIndex];
        if (!currentQ) return;

        if (isCorrect) {
             updateQuestionData(currentQ.id, { status: 'mastered' });
        } else {
             handleNext();
        }
    };

    const handleReset = () => {
        setShowResult(false);
        setIsCorrect(false);
        // Keep answer or clear? User said "same fill in the blank show again".
        // Keeping it allows them to edit.
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

    const handleHint = () => {
        const currentQ = filteredQuestions[currentIndex];
        if (!currentQ) return;
        // Reveal only a small part of the answer (approx 30%), hiding the rest
        const len = currentQ.blank.length;
        const revealCount = Math.max(1, Math.floor(len * 0.3));
        setHintText(currentQ.blank.substring(0, revealCount));
    };

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-full max-w-4xl mx-auto w-full px-4">
                {/* Stats Pills */}
                <div className="flex flex-wrap justify-center gap-2 mb-12">
                    <Skeleton width={140} height={32} className="rounded-full" />
                </div>

                {/* Question Card */}
                <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-2xl p-8 md:p-12 w-full max-w-2xl flex flex-col items-center shadow-lg mb-8">
                    <Skeleton width="90%" height={32} className="mb-8" />
                    
                    <div className="w-full max-w-md space-y-4">
                        <Skeleton width="100%" height={50} className="rounded-lg" />
                        <div className="flex items-center justify-between pt-2">
                             <Skeleton width={100} height={24} />
                             <Skeleton width={140} height={40} className="rounded-lg" />
                        </div>
                    </div>
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
                    We're crafting custom fill-in-the-blank questions from your material. This usually takes just a moment!
                </p>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-full">
                <p className="text-gray-400">No questions found.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col items-center justify-center h-full max-w-4xl mx-auto w-full px-4">
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
                /* Question Card */
                <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-2xl p-8 md:p-12 w-full max-w-2xl flex flex-col items-center shadow-lg mb-8 relative overflow-hidden">
                    {showResult && (
                        <div className={`absolute top-0 left-0 right-0 h-1 ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    )}
                    
                    <div className="text-xl md:text-2xl font-medium text-center text-gray-900 dark:text-white mb-8 leading-relaxed w-full">
                        <div className="inline prose dark:prose-invert max-w-none">
                            <ReactMarkdown 
                                remarkPlugins={[remarkGfm, remarkMath]} 
                                rehypePlugins={[rehypeKatex]}
                                components={{
                                    p: ({node, ...props}) => <span {...props} />
                                }}
                            >
                                {preprocessLaTeX(currentQuestion.before_blank)}
                            </ReactMarkdown>
                        </div>
                        <span className="inline-block min-w-[100px] border-b-2 border-indigo-500 mx-2 text-indigo-600 dark:text-indigo-400 font-bold text-center px-2 transition-all duration-300">
                            {showResult || currentQuestion.status === 'mastered' ? (
                                <ReactMarkdown 
                                    remarkPlugins={[remarkGfm, remarkMath]} 
                                    rehypePlugins={[rehypeKatex]}
                                    components={{
                                        p: ({node, ...props}) => <span {...props} />
                                    }}
                                >
                                    {preprocessLaTeX(currentQuestion.blank)}
                                </ReactMarkdown>
                            ) : hintText ? (
                                <span className="text-lg md:text-xl">
                                    <span className="opacity-100">{hintText}</span>
                                    <span className="opacity-40 blur-[4px] select-none">{currentQuestion.blank.substring(hintText.length)}</span>
                                </span>
                            ) : (
                                '\u00A0'
                            )}
                        </span>
                        <div className="inline prose dark:prose-invert max-w-none">
                            <ReactMarkdown 
                                remarkPlugins={[remarkGfm, remarkMath]} 
                                rehypePlugins={[rehypeKatex]}
                                components={{
                                    p: ({node, ...props}) => <span {...props} />
                                }}
                            >
                                {preprocessLaTeX(currentQuestion.after_blank)}
                            </ReactMarkdown>
                        </div>
                    </div>

                    <div className="w-full max-w-md space-y-4">
                        {!showResult ? (
                            currentQuestion.status === 'mastered' ? (
                                <div className="text-center py-8">
                                    <div className="text-green-600 dark:text-green-400 font-bold text-xl mb-4 flex items-center justify-center gap-2">
                                        <FaCheckCircle /> Mastered
                                    </div>
                                    <div className="text-gray-600 dark:text-gray-400">
                                        You have mastered this question!
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <input 
                                        type="text" 
                                        value={userAnswer}
                                        onChange={(e) => setUserAnswer(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                                        placeholder="Type your answer" 
                                        className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-lg py-3 px-4 text-center text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                                        autoFocus
                                    />
                                    
                                    <div className="flex items-center justify-between pt-2">
                                        <button 
                                            onClick={handleHint}
                                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 text-sm font-medium flex items-center gap-2 transition-colors"
                                        >
                                            <FaMagic />
                                            Need a hint?
                                        </button>
                                        
                                        <button 
                                            onClick={handleCheck}
                                            disabled={!userAnswer.trim()}
                                            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors"
                                        >
                                            {currentQuestion.status === 'learning' ? 'Retry' : 'Check Answer'}
                                        </button>
                                    </div>
                                </>
                            )
                        ) : (
                            <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className={`flex items-center gap-2 text-lg font-bold mb-4 ${isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {isCorrect ? (
                                        <><FaCheckCircle /> Correct!</>
                                    ) : (
                                        <><FaTimesCircle /> Incorrect</>
                                    )}
                                </div>
                                
                                {!isCorrect && (
                                    <div className="text-gray-600 dark:text-gray-400 mb-6 text-center">
                                        The correct answer is: <span className="text-gray-900 dark:text-white font-bold">
                                            <div className="inline prose dark:prose-invert max-w-none">
                                                <ReactMarkdown 
                                                    remarkPlugins={[remarkGfm, remarkMath]} 
                                                    rehypePlugins={[rehypeKatex]}
                                                    components={{
                                                        p: ({node, ...props}) => <span {...props} />
                                                    }}
                                                >
                                                    {preprocessLaTeX(currentQuestion.blank)}
                                                </ReactMarkdown>
                                            </div>
                                        </span>
                                    </div>
                                )}

                                <div className="flex justify-center items-center w-full gap-4 pt-4 border-t border-gray-200 dark:border-white/10">
                                    {/* Dynamic Buttons based on Status and Result */}
                                    {currentQuestion.status === 'unfamiliar' && (
                                        <>
                                            {!isCorrect ? (
                                                <>
                                                    <button
                                                        onClick={handleReset}
                                                        className="flex items-center gap-2 px-6 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
                                                    >
                                                        <FaRedo size={12} /> Reset
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
                                    
                                    {currentQuestion.status === 'mastered' && (
                                        <button 
                                            onClick={handleNext}
                                            className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 px-6 py-2 rounded-lg font-bold transition-colors"
                                        >
                                            {currentIndex < filteredQuestions.length - 1 ? 'Next' : 'Finish'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
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
                            className="w-12 h-12 rounded-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-600 dark:text-white hover:bg-gray-50 dark:hover:bg-[#252525] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <FaChevronLeft />
                        </button>
                        <span className="text-gray-600 dark:text-gray-400 font-medium">{currentIndex + 1} / {filteredQuestions.length}</span>
                        <button 
                            onClick={handleNext}
                            disabled={currentIndex === filteredQuestions.length - 1}
                            className="w-12 h-12 rounded-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-600 dark:text-white hover:bg-gray-50 dark:hover:bg-[#252525] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <FaChevronRight />
                        </button>
                    </div>

                    {onDiscuss && (
                        <div className="absolute right-0">
                            <button
                                onClick={() => {
                                    const content = `Fill in the Blank Question: ${currentQuestion.before_blank} [${currentQuestion.blank}] ${currentQuestion.after_blank}`;
                                    onDiscuss(content);
                                }}
                                className="group/btn flex items-center gap-2 px-2 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                                title="Discuss in Chat"
                            >
                                <FaCommentDots />
                                <span className="max-w-0 overflow-hidden group-hover/btn:max-w-[120px] transition-all duration-300 whitespace-nowrap text-sm font-medium">Discuss with AI</span>
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default StudyFillInBlanks;
