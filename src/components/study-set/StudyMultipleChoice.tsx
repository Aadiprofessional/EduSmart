import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabase';
import { FaChevronLeft, FaChevronRight, FaMagic, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { Skeleton } from '../ui/Skeleton';

interface MultipleChoiceQuestion {
    question: string;
    options: { [key: string]: string };
    correct_option: string;
    explanation?: string;
}

const StudyMultipleChoice: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [questions, setQuestions] = useState<MultipleChoiceQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [showResult, setShowResult] = useState(false);
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
                    .from('mcq_documents')
                    .select('mcq_data')
                    .eq('document_id', id)
                    .eq('uid', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.error('Error fetching data:', error);
                }

                if (isMounted) {
                    if (data && data.mcq_data && Array.isArray(data.mcq_data) && data.mcq_data.length > 0) {
                        setQuestions(data.mcq_data);
                        setStats(prev => ({ ...prev, unfamiliar: data.mcq_data.length }));
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

    const handleOptionSelect = (option: string) => {
        if (showResult) return;
        setSelectedOption(option);
        setShowResult(true);
        
        // Update stats logic could go here
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(null);
            setShowResult(false);
        }
    };

    const handlePrev = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
            setSelectedOption(null);
            setShowResult(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-full max-w-5xl mx-auto w-full px-4">
                {/* Stats Pills Skeleton */}
                <div className="flex flex-wrap justify-center gap-2 mb-12">
                    {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} dark width={120} height={32} className="rounded-full" />
                    ))}
                </div>

                {/* Question Skeleton */}
                <div className="w-full max-w-3xl mb-12 flex flex-col items-center gap-3">
                    <Skeleton dark width="90%" height={32} />
                    <Skeleton dark width="60%" height={32} />
                </div>

                {/* Options Grid Skeleton */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-12">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-[#1a1a1a] border border-white/10 rounded-xl p-4 flex items-center gap-4">
                            <Skeleton dark width={32} height={32} className="rounded flex-shrink-0" />
                            <Skeleton dark width="70%" height={24} />
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

    const currentQuestion = questions[currentIndex];

    return (
        <div className="flex-1 flex flex-col items-center justify-center h-full max-w-5xl mx-auto w-full px-4">
            {/* Stats Pills */}
            <div className="flex flex-wrap justify-center gap-2 mb-12">
                <div className="bg-red-900/30 border border-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div> {stats.unfamiliar} Unfamiliar
                </div>
                <div className="bg-indigo-900/30 border border-indigo-500/20 text-indigo-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500"></div> {stats.learning} Learning
                </div>
                <div className="bg-blue-900/30 border border-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div> {stats.familiar} Familiar
                </div>
                <div className="bg-green-900/30 border border-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div> {stats.mastered} Mastered
                </div>
            </div>

            {/* Question */}
            <h2 className="text-xl md:text-2xl font-medium text-center text-white mb-12 max-w-3xl leading-relaxed">
                {currentQuestion?.question}
            </h2>

            {/* Options Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-12">
                {currentQuestion?.options && (
                    Object.entries(currentQuestion.options).map(([key, value]) => {
                    const isSelected = selectedOption === key;
                    const isCorrect = key === currentQuestion.correct_option;
                    
                    let borderClass = "border-white/10 hover:border-white/20";
                    let bgClass = "bg-[#1a1a1a] hover:bg-[#252525]";
                    let textClass = "text-gray-300 group-hover:text-white";
                    
                    if (showResult) {
                        if (isCorrect) {
                            borderClass = "border-green-500/50";
                            bgClass = "bg-green-900/20";
                            textClass = "text-green-200";
                        } else if (isSelected) {
                            borderClass = "border-red-500/50";
                            bgClass = "bg-red-900/20";
                            textClass = "text-red-200";
                        }
                    }

                    return (
                        <button 
                            key={key}
                            onClick={() => handleOptionSelect(key)}
                            disabled={showResult}
                            className={`${bgClass} border ${borderClass} rounded-xl p-4 flex items-center gap-4 text-left transition-all group`}
                        >
                            <div className={`w-8 h-8 rounded ${showResult && isCorrect ? 'bg-green-500 text-white' : (showResult && isSelected ? 'bg-red-500 text-white' : 'bg-indigo-900/50 text-indigo-500')} font-bold flex items-center justify-center flex-shrink-0 border border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white transition-colors`}>
                                {key}
                            </div>
                            <span className={`${textClass} text-sm md:text-base flex-1`}>{value}</span>
                            {showResult && isCorrect && <FaCheckCircle className="text-green-500" />}
                            {showResult && isSelected && !isCorrect && <FaTimesCircle className="text-red-500" />}
                        </button>
                    );
                })
                )}
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-6">
                <button 
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className={`w-12 h-12 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-white transition-colors ${currentIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#252525]'}`}
                >
                    <FaChevronLeft />
                </button>
                <span className="text-gray-400 font-medium">{currentIndex + 1} / {questions.length}</span>
                <button 
                    onClick={handleNext}
                    disabled={currentIndex === questions.length - 1}
                    className={`w-12 h-12 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-white transition-colors ${currentIndex === questions.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#252525]'}`}
                >
                    <FaChevronRight />
                </button>
            </div>
        </div>
    );
};

export default StudyMultipleChoice;
