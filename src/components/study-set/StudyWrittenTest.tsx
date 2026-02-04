import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaMagic } from 'react-icons/fa';
import { Skeleton } from '../ui/Skeleton';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabase';

interface TestQuestion {
    question: string;
    correct_answer: string;
}

const StudyWrittenTest: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [questions, setQuestions] = useState<TestQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [userAnswers, setUserAnswers] = useState<{[key: number]: string}>({});
    const [showAnswer, setShowAnswer] = useState(false);

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
                    if (data && data.test_data) {
                        setQuestions(data.test_data);
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

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
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
        setUserAnswers({
            ...userAnswers,
            [currentIndex]: e.target.value
        });
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

    const currentQuestion = questions[currentIndex];

    return (
        <div className="flex-1 flex flex-col items-center justify-center h-full max-w-4xl mx-auto w-full px-4 overflow-y-auto py-8">
            {/* Stats Pills - Static for now as logic wasn't requested */}
            <div className="flex flex-wrap justify-center gap-2 mb-12">
                <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div> {questions.length - Object.keys(userAnswers).length} Remaining
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div> {Object.keys(userAnswers).length} Answered
                </div>
            </div>

            {/* Question Card */}
            <div className="w-full max-w-3xl mb-8">
                <h3 className="text-xl md:text-2xl font-medium text-center text-gray-900 dark:text-white mb-8 leading-relaxed">
                    {currentQuestion.question}
                </h3>

                <div className="w-full space-y-4">
                    {!showAnswer ? (
                        <>
                            <textarea 
                                placeholder="Type your answer here..." 
                                className="w-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 rounded-xl p-4 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors h-48 resize-none"
                                value={userAnswers[currentIndex] || ''}
                                onChange={handleAnswerChange}
                            ></textarea>
                            
                            <div className="flex justify-end">
                                <button 
                                    onClick={() => setShowAnswer(true)}
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
                                <p className="text-gray-900 dark:text-white text-lg">{userAnswers[currentIndex]}</p>
                            </div>
                            
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/20 rounded-xl p-6">
                                <h4 className="text-sm font-bold text-green-600 dark:text-green-400 uppercase mb-2">Correct Answer</h4>
                                <p className="text-gray-700 dark:text-gray-200 text-lg leading-relaxed">{currentQuestion.correct_answer}</p>
                            </div>

                            <div className="flex justify-end">
                                <button 
                                    onClick={handleNext}
                                    className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 px-6 py-2 rounded-lg font-bold transition-colors"
                                >
                                    {currentIndex === questions.length - 1 ? 'Finish' : 'Next Question'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-6">
                <button 
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className={`w-12 h-12 rounded-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-600 dark:text-white transition-colors ${currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-[#252525]'}`}
                >
                    <FaChevronLeft />
                </button>
                <span className="text-gray-600 dark:text-gray-400 font-medium">{currentIndex + 1} / {questions.length}</span>
                <button 
                    onClick={handleNext}
                    disabled={currentIndex === questions.length - 1}
                    className={`w-12 h-12 rounded-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-600 dark:text-white transition-colors ${currentIndex === questions.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-[#252525]'}`}
                >
                    <FaChevronRight />
                </button>
            </div>
        </div>
    );
};

export default StudyWrittenTest;
