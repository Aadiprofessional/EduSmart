import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabase';
import { FaChevronLeft, FaChevronRight, FaMagic, FaCommentDots, FaRedo, FaFileAlt, FaChartBar, FaTimes, FaSpinner } from 'react-icons/fa';
import { Skeleton } from '../ui/Skeleton';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { v4 as uuidv4 } from 'uuid';
import 'katex/dist/katex.min.css';
import coinImage from '../../assets/assets_coin.png';

type QuestionStatus = 'unfamiliar' | 'submitted';

interface TestQuestion {
    id: string;
    question: string;
    correct_answer: string;
    status: QuestionStatus;
    user_answer?: string;
    score?: number;
    suggestion?: string;
}

interface StudyWrittenTestProps {
    onDiscuss?: (text: string) => void;
}

const StudyWrittenTest: React.FC<StudyWrittenTestProps> = ({ onDiscuss }) => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [questions, setQuestions] = useState<TestQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [userAnswers, setUserAnswers] = useState<{[key: string]: string}>({});
    const [showAnswer, setShowAnswer] = useState(false);
    const [filter, setFilter] = useState<QuestionStatus | 'all'>('unfamiliar');
    const [isGeneratingResult, setIsGeneratingResult] = useState(false);
    const [showResult, setShowResult] = useState(false);

    // Computed stats
    const stats = useMemo(() => {
        return {
            unfamiliar: questions.filter(q => q.status === 'unfamiliar').length,
            submitted: questions.filter(q => q.status === 'submitted').length,
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

    // Reset index when filter changes
    useEffect(() => {
        setCurrentIndex(0);
        setShowAnswer(false);
    }, [filter]);

    // Ensure index is valid when list changes
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

        // 2. Smartly wrap bare math expressions
        // Match sequences of non-whitespace characters OR brace-enclosed groups
        // This prevents splitting "m^{-2 \times 6}" at the space inside the braces
        return processed.replace(/((?:[^\s{]|\{[^}]*\})+)/g, (word) => {
             // Check if 'word' looks like math and isn't already wrapped
             if (word.includes('$')) return word;
             
             // Heuristic: contains ^, \, or ( _ AND { )
             const isMath = word.includes('^') || word.includes('\\') || (word.includes('_') && word.includes('{'));
             
             if (isMath) {
                 // Handle trailing punctuation
                 const match = word.match(/^(.+?)([.,;:]?)$/);
                 if (match) {
                     const [_, core, punct] = match;
                     return `$${core}$${punct}`;
                 }
                 return `$${word}$`;
             }
             return word;
        });
    };

    useEffect(() => {
        let intervalId: NodeJS.Timeout;
        let isMounted = true;

        const fetchData = async () => {
            if (!id || !user) return;

            try {
                // Try querying by test_id first, if that fails we might need to try document_id
                // based on the user's provided JSON structure, the column is likely test_id
                // but usually the ID in the URL is the document_id.
                // We'll assume the URL id corresponds to the test_id in the table for now
                // as per the user's JSON example showing "test_id": "uuid..."
                const { data, error } = await supabase
                    .from('written_test_documents')
                    .select('test_data')
                    .eq('document_id', id)
                    .eq('uid', user.id)
                    .maybeSingle();

                if (error && error.code !== 'PGRST116') {
                    console.error('Error fetching data:', error);
                }

                if (isMounted) {
                    if (data && data.test_data && Array.isArray(data.test_data) && data.test_data.length > 0) {
                        const processedQuestions: TestQuestion[] = data.test_data.map((q: any) => ({
                            question: q.question,
                            correct_answer: q.correct_answer,
                            id: q.id || uuidv4(),
                            status: q.status || 'unfamiliar',
                            user_answer: q.user_answer || ''
                        }));
                        setQuestions(processedQuestions);
                        
                        // Initialize user answers
                        const initialAnswers: {[key: string]: string} = {};
                        processedQuestions.forEach(q => {
                            if (q.user_answer) initialAnswers[q.id] = q.user_answer;
                        });
                        setUserAnswers(prev => ({...prev, ...initialAnswers}));

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
        intervalId = setInterval(fetchData, 10000); // Check every 10 seconds

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [id, user]);

    const updateQuestionData = async (questionId: string, updates: Partial<TestQuestion>) => {
        if (!user || !id) return;

        const updatedQuestions = questions.map(q => q.id === questionId ? { ...q, ...updates } : q);
        setQuestions(updatedQuestions);

        const { error } = await supabase
            .from('written_test_documents')
            .update({ test_data: updatedQuestions })
            .eq('document_id', id)
            .eq('uid', user.id);
            
        if (error) {
            console.error('Error updating data:', error);
        }
    };

    const handleNext = () => {
        if (currentIndex < filteredQuestions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setShowAnswer(false);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setShowAnswer(false);
        }
    };

    const handleAnswerChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const currentQ = filteredQuestions[currentIndex];
        if (!currentQ) return;
        
        setUserAnswers({
            ...userAnswers,
            [currentQ.id]: e.target.value
        });
    };

    const handleCheckAnswer = () => {
        setShowAnswer(true);
    };

    const handleSubmit = async () => {
        const currentQ = filteredQuestions[currentIndex];
        if (!currentQ) return;

        await updateQuestionData(currentQ.id, { 
            status: 'submitted',
            user_answer: userAnswers[currentQ.id] || '' 
        });
        
        // If we have more questions, go to next. If not, maybe show finish screen or just stay?
        // Usually Next button handles movement. Submit button might just submit and stay or go next?
        // User said: "next button which also submit the answer".
        // So "Submit" button probably just submits. "Next" submits and moves.
        // But if I submit, it disappears from 'unfamiliar' list!
        // So we should probably handle navigation if the list shrinks.
    };

    const handleNextSubmit = async () => {
        const currentQ = filteredQuestions[currentIndex];
        if (!currentQ) return;

        await updateQuestionData(currentQ.id, { 
            status: 'submitted',
            user_answer: userAnswers[currentQ.id] || '' 
        });
        
        // Navigation is handled by the list updating (current index might point to next one now)
        // But we need to be careful about index bounds.
        // The existing handleNext logic increments index.
        // If the item is removed from the filtered list, the index might point to the next item automatically.
        // We should probably check if we need to adjust index.
        setShowAnswer(false);
    };

    const handleReset = () => {
        const currentQ = filteredQuestions[currentIndex];
        if (!currentQ) return;
        
        setUserAnswers({
            ...userAnswers,
            [currentQ.id]: ''
        });
        setShowAnswer(false);
    };

    const handleRestartTest = async () => {
        if (!user || !id) return;
        
        const updatedQuestions = questions.map(q => 
            q.status === 'submitted' ? { 
                ...q, 
                status: 'unfamiliar' as QuestionStatus, 
                user_answer: '',
                score: undefined,
                suggestion: undefined
            } : q
        );
        setQuestions(updatedQuestions);
        setUserAnswers({}); // Clear local answers too? Or keep them? User said "make all the submit go away to unfamilier", usually implies fresh start.

        const { error } = await supabase
            .from('written_test_documents')
            .update({ test_data: updatedQuestions })
            .eq('document_id', id)
            .eq('uid', user.id);
            
        if (error) {
            console.error('Error restarting test:', error);
        }
        setFilter('unfamiliar');
    };

    const handleGenerateResult = async () => {
        if (!user) return;
        setIsGeneratingResult(true);

        const now = new Date();
        const timestamp = now.getFullYear() + '-' + 
            String(now.getMonth() + 1).padStart(2, '0') + '-' + 
            String(now.getDate()).padStart(2, '0') + ' ' + 
            String(now.getHours()).padStart(2, '0') + ':' + 
            String(now.getMinutes()).padStart(2, '0') + ':' + 
            String(now.getSeconds()).padStart(2, '0') + '.' + 
            String(now.getMilliseconds()).padStart(3, '0');

        const submittedQuestions = questions.filter(q => q.status === 'submitted');
        const payload = {
            uid: user.id,
            timestamp: timestamp,
            data: submittedQuestions.map(q => ({
                question: q.question,
                correct_answer: q.correct_answer,
                user_answer: q.user_answer || ''
            }))
        };

        try {
            const response = await fetch('https://n8n.matrixaiserver.com/webhook/a43e532c-cd7a-43e9-8d22-4ab81006c5bb', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Network response was not ok');

            const resultData = await response.json();
            
            let parsedResults: any[] = [];
            if (Array.isArray(resultData) && resultData.length > 0 && resultData[0].data) {
                parsedResults = resultData[0].data;
            } else if (resultData.data) {
                 parsedResults = resultData.data;
            }

            if (parsedResults.length > 0) {
                 const updatedQuestions = [...questions];
                 
                 submittedQuestions.forEach((q, idx) => {
                     if (parsedResults[idx] && parsedResults[idx].output) {
                         const output = parsedResults[idx].output;
                         const qIndex = updatedQuestions.findIndex(uq => uq.id === q.id);
                         if (qIndex !== -1) {
                             updatedQuestions[qIndex] = {
                                 ...updatedQuestions[qIndex],
                                 score: output.score,
                                 suggestion: output.suggestion
                             };
                         }
                     }
                 });
                 
                 setQuestions(updatedQuestions);
                 
                 if (id) {
                     await supabase
                        .from('written_test_documents')
                        .update({ test_data: updatedQuestions })
                        .eq('document_id', id)
                        .eq('uid', user.id);
                 }
                 
                 // setShowResult(true); // User requested not to open automatically
            } else {
                alert('Received empty result data.');
            }
        } catch (error) {
            console.error('Error generating result:', error);
            alert('Failed to generate result. Please try again.');
        } finally {
            setIsGeneratingResult(false);
        }
    };

    if (loading) {
        return (
             <div className="flex-1 flex flex-col items-center justify-center h-full max-w-4xl mx-auto w-full px-4 py-8">
                {/* Stats Pills */}
                <div className="flex flex-wrap justify-center gap-2 mb-12">
                     <Skeleton width={120} height={32} className="rounded-full" />
                     <Skeleton width={120} height={32} className="rounded-full" />
                </div>

                {/* Question Card */}
                <div className="w-full max-w-3xl mb-8">
                     <Skeleton width="90%" height={32} className="mx-auto mb-4" />
                     <Skeleton width="80%" height={32} className="mx-auto mb-8" />
                     
                     <div className="w-full space-y-4">
                        <Skeleton width="100%" height={192} className="rounded-xl" />
                        <div className="flex justify-end">
                             <Skeleton width={120} height={40} className="rounded-lg" />
                        </div>
                     </div>
                </div>

                {/* Navigation */}
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
            <div className="flex flex-col items-center justify-center h-full pt-20">
                <div className="relative">
                    <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                    <FaMagic className="relative text-5xl text-indigo-400 mb-6 animate-bounce" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Generating Written Test...</h2>
                <p className="text-gray-400 max-w-md text-center">
                    AI is crafting challenging questions for you. Ready your keyboard!
                </p>
            </div>
        );
    }

    if (questions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <p className="text-gray-400">No questions found for this test.</p>
            </div>
        );
    }

    if (showResult) {
        const submittedQuestions = questions.filter(q => q.status === 'submitted');
        const totalScore = submittedQuestions.reduce((sum, q) => sum + (q.score || 0), 0);
        const maxScore = submittedQuestions.length * 5;
        const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;

        return (
            <div className="flex-1 flex flex-col items-center h-full max-w-4xl mx-auto w-full px-4 py-8 overflow-y-auto">
                <div className="w-full max-w-3xl mb-8">
                    <button 
                        onClick={() => setShowResult(false)}
                        className="mb-6 flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <FaChevronLeft /> Back to Questions
                    </button>

                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">Test Results</h2>

                    {/* Score Card */}
                    <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-2xl p-8 mb-8 text-center relative overflow-hidden shadow-sm">
                        <div className="relative z-10">
                            <div className="text-gray-500 dark:text-gray-400 font-medium mb-2 uppercase tracking-wide">Total Score</div>
                            <div className="text-6xl font-bold text-indigo-600 dark:text-indigo-400 mb-2">
                                {totalScore}<span className="text-3xl text-gray-400 dark:text-gray-600">/{maxScore}</span>
                            </div>
                            <div className="inline-block px-4 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                                {percentage}% Score
                            </div>
                        </div>
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>
                    </div>

                    {/* Breakdown */}
                    <div className="space-y-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Question Breakdown</h3>
                        {submittedQuestions.map((q, idx) => (
                            <div key={q.id} className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-sm">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">Question {idx + 1}</span>
                                    <div className={`px-3 py-1 rounded-lg font-bold text-sm ${
                                        (q.score || 0) === 5 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                        (q.score || 0) >= 3 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    }`}>
                                        {q.score || 0}/5 Marks
                                    </div>
                                </div>
                                
                                <div className="mb-4 text-gray-900 dark:text-white prose dark:prose-invert max-w-none">
                                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                        {preprocessLaTeX(q.question)}
                                    </ReactMarkdown>
                                </div>

                                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg mb-4">
                                    <div className="text-xs font-bold text-gray-500 uppercase mb-2">Feedback</div>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        {q.suggestion || 'No feedback provided.'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col items-center h-full max-w-4xl mx-auto w-full px-4 overflow-y-auto py-8">
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
                    onClick={() => setFilter('submitted')}
                    className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all ${
                        filter === 'submitted' 
                        ? 'bg-green-100 dark:bg-green-900/50 border-green-500 text-green-700 dark:text-green-400 ring-2 ring-green-500/20' 
                        : 'bg-gray-100 dark:bg-gray-800 border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                >
                    <div className={`w-2 h-2 rounded-full ${filter === 'submitted' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    {stats.submitted} Submitted
                </button>
            </div>

            {filteredQuestions.length > 0 && currentQuestion ? (
                /* Question Card */
                <div className="w-full max-w-3xl mb-8 relative">

                    {onDiscuss && (
                        <button
                            onClick={() => {
                                const content = `Written Test Question: ${currentQuestion.question}\nCorrect Answer: ${currentQuestion.correct_answer}`;
                                onDiscuss(content);
                            }}
                            className="absolute top-0 right-0 group/btn flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 p-2 rounded-full hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                            title="Discuss in Chat"
                        >
                            <FaCommentDots />
                            <span className="max-w-0 overflow-hidden group-hover/btn:max-w-[120px] transition-all duration-300 whitespace-nowrap text-sm font-medium">Discuss with AI</span>
                        </button>
                    )}
                    <h3 className="text-xl md:text-2xl font-medium text-center text-gray-900 dark:text-white mb-8 leading-relaxed pt-8 prose dark:prose-invert max-w-none w-full">
                        <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {preprocessLaTeX(currentQuestion.question)}
                        </ReactMarkdown>
                    </h3>

                    <div className="w-full space-y-4">
                        {filter === 'submitted' ? (
                            <div className="space-y-4">
                                <textarea 
                                    readOnly
                                    className="w-full bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-700 dark:text-gray-300 focus:outline-none h-48 resize-none cursor-not-allowed"
                                    value={currentQuestion.user_answer || ''}
                                ></textarea>
                                
                                {currentQuestion.suggestion && (
                                    <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl p-6 animate-in fade-in slide-in-from-bottom-2">
                                        <div className="flex justify-between items-center mb-3">
                                            <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase">AI Feedback</h4>
                                            <div className={`px-3 py-1 rounded-lg font-bold text-sm ${
                                                (currentQuestion.score || 0) === 5 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                (currentQuestion.score || 0) >= 3 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                            }`}>
                                                {currentQuestion.score || 0}/5 Marks
                                            </div>
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300">
                                            {currentQuestion.suggestion}
                                        </p>
                                    </div>
                                )}

                                <div className="flex justify-end gap-2">
                                    {questions.some(q => q.status === 'submitted' && q.score !== undefined) ? (
                                        <>
                                            <button
                                                onClick={() => setShowResult(true)}
                                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors text-sm font-medium"
                                            >
                                                <FaChartBar size={14} /> View Score
                                            </button>
                                            <button
                                                onClick={handleGenerateResult}
                                                disabled={isGeneratingResult}
                                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isGeneratingResult ? <FaSpinner className="animate-spin" size={14} /> : <FaFileAlt size={14} />}
                                                {isGeneratingResult ? 'Regenerating...' : 'Regenerate Result'}
                                                <div className="flex items-center gap-1 bg-white dark:bg-black/20 px-2 py-0.5 rounded-full ml-1">
                                                    <img src={coinImage} alt="Coin" className="w-4 h-4" />
                                                    <span className="text-xs font-bold">-1</span>
                                                </div>
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={handleGenerateResult}
                                            disabled={isGeneratingResult}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {isGeneratingResult ? <FaSpinner className="animate-spin" size={14} /> : <FaFileAlt size={14} />}
                                            {isGeneratingResult ? 'Generating...' : 'Generate Result'}
                                            <div className="flex items-center gap-1 bg-white dark:bg-black/20 px-2 py-0.5 rounded-full ml-1">
                                                <img src={coinImage} alt="Coin" className="w-4 h-4" />
                                                <span className="text-xs font-bold">-1</span>
                                            </div>
                                        </button>
                                    )}
                                    <button
                                        onClick={handleRestartTest}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium"
                                    >
                                        <FaRedo size={14} /> Restart Test
                                    </button>
                                </div>
                            </div>
                        ) : (
                            !showAnswer ? (
                                <>
                                    <textarea 
                                        placeholder="Type your answer here..." 
                                        className="w-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors h-48 resize-none"
                                        value={userAnswers[currentQuestion.id] || ''}
                                        onChange={handleAnswerChange}
                                        maxLength={1000}
                                    ></textarea>
                                    
                                    <div className="flex justify-between items-center">
                                        <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                                            {(userAnswers[currentQuestion.id] || '').length}/1000
                                        </div>
                                        <button 
                                            onClick={handleCheckAnswer}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                                        >
                                            Check Answer
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl p-6">
                                        <h4 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Your Answer</h4>
                                        <div className="text-gray-900 dark:text-white text-lg prose dark:prose-invert max-w-none">
                                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                                {preprocessLaTeX(userAnswers[currentQuestion.id])}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/20 rounded-xl p-6">
                                        <h4 className="text-sm font-bold text-green-600 dark:text-green-400 uppercase mb-2">Correct Answer</h4>
                                        <div className="text-gray-700 dark:text-gray-200 text-lg leading-relaxed prose dark:prose-invert max-w-none">
                                            <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                                {preprocessLaTeX(currentQuestion.correct_answer)}
                                            </ReactMarkdown>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-white/10">
                                        <button
                                            onClick={handleReset}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm font-medium"
                                        >
                                            <FaRedo size={14} /> Reset
                                        </button>

                                        <div className="flex gap-3">
                                            <button 
                                                onClick={handleSubmit}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold transition-colors"
                                            >
                                                Submit
                                            </button>
                                            <button 
                                                onClick={handleNextSubmit}
                                                className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 px-6 py-2 rounded-lg font-bold transition-colors"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
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
                            className={`w-12 h-12 rounded-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-600 dark:text-white transition-colors ${currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-[#252525]'}`}
                        >
                            <FaChevronLeft />
                        </button>
                        <span className="text-gray-600 dark:text-gray-400 font-medium">{currentIndex + 1} / {filteredQuestions.length}</span>
                        <button 
                            onClick={handleNext}
                            disabled={currentIndex === filteredQuestions.length - 1}
                            className={`w-12 h-12 rounded-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-600 dark:text-white transition-colors ${currentIndex === filteredQuestions.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-[#252525]'}`}
                        >
                            <FaChevronRight />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudyWrittenTest;
