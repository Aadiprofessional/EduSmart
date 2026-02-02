import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabase';
import { FaChevronLeft, FaChevronRight, FaMagic, FaCheckCircle, FaTimesCircle, FaSpinner } from 'react-icons/fa';

interface BlankQuestion {
    before_blank: string;
    blank: string;
    after_blank: string;
}

const StudyFillInBlanks: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [questions, setQuestions] = useState<BlankQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [showResult, setShowResult] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);

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
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.error('Error fetching data:', error);
                }

                if (isMounted) {
                    if (data && data.generated_json && Array.isArray(data.generated_json) && data.generated_json.length > 0) {
                        setQuestions(data.generated_json);
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

    const handleCheck = () => {
        if (!userAnswer.trim()) return;
        const currentQ = questions[currentIndex];
        const correct = userAnswer.trim().toLowerCase() === currentQ.blank.toLowerCase();
        setIsCorrect(correct);
        setShowResult(true);
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setUserAnswer('');
            setShowResult(false);
            setIsCorrect(false);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setUserAnswer('');
            setShowResult(false);
            setIsCorrect(false);
        }
    };

    const handleHint = () => {
        const currentQ = questions[currentIndex];
        // Reveal first letter or first few letters
        setUserAnswer(currentQ.blank.substring(0, Math.ceil(currentQ.blank.length / 2)));
    };

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-full">
                <FaSpinner className="animate-spin text-4xl text-indigo-500 mb-4" />
                <p className="text-gray-400">Loading study session...</p>
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

    const currentQuestion = questions[currentIndex];

    return (
        <div className="flex-1 flex flex-col items-center justify-center h-full max-w-4xl mx-auto w-full px-4">
            {/* Stats Pills */}
            <div className="flex flex-wrap justify-center gap-2 mb-12">
                <div className="bg-white/5 border border-white/10 text-gray-300 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                    Question {currentIndex + 1} of {questions.length}
                </div>
            </div>

            {/* Question Card */}
            <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-8 md:p-12 w-full max-w-2xl flex flex-col items-center shadow-lg mb-8 relative overflow-hidden">
                {showResult && (
                    <div className={`absolute top-0 left-0 right-0 h-1 ${isCorrect ? 'bg-green-500' : 'bg-red-500'}`}></div>
                )}
                
                <h3 className="text-xl md:text-2xl font-medium text-center text-white mb-8 leading-relaxed">
                    {currentQuestion.before_blank}
                    <span className="inline-block min-w-[100px] border-b-2 border-indigo-500 mx-2 text-indigo-400 font-bold">
                        {showResult ? currentQuestion.blank : '_______'}
                    </span>
                    {currentQuestion.after_blank}
                </h3>

                <div className="w-full max-w-md space-y-4">
                    {!showResult ? (
                        <>
                            <input 
                                type="text" 
                                value={userAnswer}
                                onChange={(e) => setUserAnswer(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                                placeholder="Type your answer" 
                                className="w-full bg-[#111] border border-white/10 rounded-lg py-3 px-4 text-center text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
                                autoFocus
                            />
                            
                            <div className="flex items-center justify-between pt-2">
                                <button 
                                    onClick={handleHint}
                                    className="text-indigo-400 hover:text-indigo-300 text-sm font-medium flex items-center gap-2 transition-colors"
                                >
                                    <FaMagic />
                                    Need a hint?
                                </button>
                                
                                <button 
                                    onClick={handleCheck}
                                    disabled={!userAnswer.trim()}
                                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg font-medium transition-colors"
                                >
                                    Check Answer
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className={`flex items-center gap-2 text-lg font-bold mb-4 ${isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                {isCorrect ? (
                                    <><FaCheckCircle /> Correct!</>
                                ) : (
                                    <><FaTimesCircle /> Incorrect</>
                                )}
                            </div>
                            
                            {!isCorrect && (
                                <div className="text-gray-400 mb-6 text-center">
                                    The correct answer is: <span className="text-white font-bold">{currentQuestion.blank}</span>
                                </div>
                            )}

                            <button 
                                onClick={handleNext}
                                className="bg-white text-black hover:bg-gray-200 px-8 py-3 rounded-lg font-bold transition-colors"
                            >
                                {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-6">
                <button 
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="w-12 h-12 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-white hover:bg-[#252525] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    <FaChevronLeft />
                </button>
                <span className="text-gray-400 font-medium">{currentIndex + 1} / {questions.length}</span>
                <button 
                    onClick={handleNext}
                    disabled={currentIndex === questions.length - 1}
                    className="w-12 h-12 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-white hover:bg-[#252525] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    <FaChevronRight />
                </button>
            </div>
        </div>
    );
};

export default StudyFillInBlanks;
