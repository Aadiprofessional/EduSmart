import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabase';
import { 
    FaPlay, FaPause, FaStepBackward, FaStepForward, 
    FaVolumeUp, FaDownload, FaMagic, FaRedo, FaCommentDots 
} from 'react-icons/fa';
import { Skeleton } from '../ui/Skeleton';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css'; // Ensure katex styles are available

interface PodcastSegment {
    text: string;
    speaker: string;
    end_seconds: number;
    start_seconds: number;
    end_time_formatted: string;
    start_time_formatted: string;
}

interface StudyPodcastProps {
    onDiscuss?: (text: string) => void;
}

const StudyPodcast: React.FC<StudyPodcastProps> = ({ onDiscuss }) => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [transcript, setTranscript] = useState<PodcastSegment[]>([]);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isCompact, setIsCompact] = useState(false);
    const isUserScrolling = useRef(false);
    const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
    const isAutoScrolling = useRef(false);

    // Preprocess LaTeX to convert various formats to react-markdown compatible format
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

    // Scroll listener for compact mode
    useEffect(() => {
        const handleScroll = () => {
            if (scrollRef.current) {
                const currentScroll = scrollRef.current.scrollTop;

                // Trigger compact mode
                // We use a larger threshold to prevent oscillation/loops when layout shifts
                // The shift is approx 140px (Audio)
                const shift = 180;
                
                setIsCompact(prev => {
                    if (!prev && currentScroll > shift) {
                        return true;
                    } else if (prev && currentScroll < 20) {
                        return false;
                    }
                    return prev;
                });

                // Detect user scrolling vs auto-scrolling
                if (!isAutoScrolling.current) {
                    isUserScrolling.current = true;
                    if (scrollTimeout.current) {
                        clearTimeout(scrollTimeout.current);
                    }
                    // Reset user scrolling state after 3 seconds of inactivity
                    scrollTimeout.current = setTimeout(() => {
                        isUserScrolling.current = false;
                    }, 3000);
                }
            }
        };
        const scrollElement = scrollRef.current;
        if (scrollElement) {
            scrollElement.addEventListener('scroll', handleScroll);
        }
        return () => {
            if (scrollElement) {
                scrollElement.removeEventListener('scroll', handleScroll);
            }
            if (scrollTimeout.current) {
                clearTimeout(scrollTimeout.current);
            }
        };
    }, [loading, isGenerating, audioUrl]);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;
        let isMounted = true;

        const fetchData = async () => {
            if (!id || !user) return;

            try {
                const { data, error } = await supabase
                    .from('podcast_documents')
                    .select('podcast_data, audio_url')
                    .eq('document_id', id)
                    .eq('uid', user.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (error) {
                    console.error('Error fetching data:', error);
                }

                if (isMounted) {
                    if (data && data.podcast_data && Array.isArray(data.podcast_data) && data.podcast_data.length > 0) {
                        setTranscript(data.podcast_data);
                        if (data.audio_url) {
                            setAudioUrl(data.audio_url);
                        }
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

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const vol = parseFloat(e.target.value);
        setVolume(vol);
        if (audioRef.current) {
            audioRef.current.volume = vol;
        }
    };

    const handleSkip = (seconds: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime += seconds;
        }
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    // Auto-scroll to active segment
    useEffect(() => {
        // Skip if user is manually scrolling
        if (isUserScrolling.current) return;

        const activeSegment = transcript.findIndex(
            (seg) => currentTime >= seg.start_seconds && currentTime < seg.end_seconds
        );
        
        if (activeSegment !== -1 && scrollRef.current) {
            const activeElement = scrollRef.current.children[activeSegment] as HTMLElement;
            if (activeElement) {
                isAutoScrolling.current = true;
                // Use scrollTo instead of scrollIntoView to prevent whole page scrolling
                const container = scrollRef.current;
                const elementTop = activeElement.offsetTop;
                const elementHeight = activeElement.offsetHeight;
                const containerHeight = container.clientHeight;
                
                const targetScrollTop = elementTop - (containerHeight / 2) + (elementHeight / 2);

                container.scrollTo({
                    top: targetScrollTop,
                    behavior: 'smooth'
                });
                // Reset auto-scrolling flag after animation (approx 1s)
                setTimeout(() => {
                    isAutoScrolling.current = false;
                }, 1000);
            }
        }
    }, [currentTime, transcript]);

    if (loading) {
        return (
             <div className="max-w-4xl mx-auto w-full h-full relative overflow-hidden">
                {/* Player Card Skeleton */}
                <div className="absolute top-0 left-0 right-0 z-20 p-4">
                    <div className="backdrop-blur-md bg-white/80 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-xl">
                        <div className="flex items-start justify-between mb-6">
                             <div className="flex items-center gap-4">
                                <Skeleton width={48} height={48} className="rounded-full" />
                                <div>
                                    <Skeleton width={120} height={24} className="mb-2" />
                                    <Skeleton width={80} height={16} />
                                </div>
                             </div>
                             <Skeleton width={100} height={36} className="rounded-lg" />
                        </div>
                        {/* Progress and Controls */}
                         <div className="space-y-4">
                            <Skeleton width="100%" height={8} className="rounded-full" />
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Skeleton width={24} height={24} className="rounded-full" />
                                    <Skeleton width={24} height={24} className="rounded-full" />
                                    <Skeleton width={32} height={32} className="rounded-full" />
                                    <Skeleton width={24} height={24} className="rounded-full" />
                                    <Skeleton width={24} height={24} className="rounded-full" />
                                </div>
                                <div className="flex items-center gap-2">
                                     <Skeleton width={24} height={24} />
                                     <Skeleton width={64} height={8} className="rounded-full" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Transcript Skeleton */}
                 <div className="h-full overflow-y-auto pt-[220px] pb-32 px-4 space-y-6">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex gap-4">
                            <Skeleton width={40} height={40} className="rounded-full flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="flex justify-between">
                                    <Skeleton width={100} height={20} />
                                    <Skeleton width={40} height={16} />
                                </div>
                                <Skeleton width="100%" height={16} />
                                <Skeleton width="95%" height={16} />
                                <Skeleton width="90%" height={16} />
                            </div>
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
                <h2 className="text-2xl font-bold text-white mb-2">Generating Podcast...</h2>
                <p className="text-gray-400 max-w-md text-center">
                    We're converting your document into an engaging audio discussion. This might take a few minutes!
                </p>
            </div>
        );
    }

    if (!audioUrl && !loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-full">
                <p className="text-gray-400">Podcast generation failed or audio not available.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto w-full flex-1 min-h-0 relative overflow-hidden">
            <audio
                ref={audioRef}
                src={audioUrl || ''}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
            />

            {/* Audio Player Card - Fixed Top */}
            <div className={`absolute top-0 left-0 right-0 z-20 transition-all duration-300 ${isCompact ? 'p-2' : 'p-4'}`}>
                <div className={`backdrop-blur-md bg-white/90 dark:bg-black/80 border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl transition-all duration-300 overflow-hidden ${isCompact ? 'p-3' : 'p-6'}`}>
                    
                    {isCompact ? (
                        // Compact View
                        <div className="flex items-center gap-3 w-full">
                            {/* Icon */}
                             <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center overflow-hidden flex-shrink-0">
                                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Podcast" alt="Podcast" className="w-full h-full object-cover opacity-80" />
                            </div>
                            
                            {/* Controls */}
                             <div className="flex-1 flex flex-col justify-center min-w-0">
                                <div className="flex items-center justify-between mb-2">
                                     <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono w-10 text-left">{formatTime(currentTime)}</span>

                                     <div className="flex items-center gap-4">
                                         <button onClick={() => handleSkip(-10)} className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white"><FaRedo size={12} className="transform -scale-x-100" /></button>
                                         <button onClick={togglePlay} className="text-indigo-600 dark:text-white hover:scale-110 transition-transform">
                                            <div className="w-8 h-8 bg-gray-900 dark:bg-white rounded-full flex items-center justify-center text-white dark:text-black">
                                                {isPlaying ? <FaPause size={10}/> : <FaPlay size={10} className="ml-0.5"/>}
                                            </div>
                                        </button>
                                         <button onClick={() => handleSkip(10)} className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-white"><FaRedo size={12} /></button>
                                     </div>

                                     <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono w-10 text-right">{formatTime(duration)}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max={duration || 100}
                                    value={currentTime}
                                    onChange={handleSeek}
                                    className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-indigo-600 dark:[&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:bg-indigo-500 transition-all"
                                    style={{
                                        backgroundImage: `linear-gradient(to right, #6366f1 ${(currentTime / (duration || 1)) * 100}%, ${document.documentElement.classList.contains('dark') ? '#1f2937' : '#e5e7eb'} ${(currentTime / (duration || 1)) * 100}%)`
                                    }}
                                />
                             </div>
                        </div>
                    ) : (
                        // Expanded View
                        <div className="w-full">
                            <div className="flex flex-col md:flex-row items-center md:items-start justify-between mb-4 md:mb-6 gap-4">
                                <div className="flex items-center gap-4 w-full">
                                    <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-lg">
                                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Podcast" alt="Podcast" className="w-full h-full object-cover opacity-80" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-bold text-gray-900 dark:text-white text-lg md:text-xl truncate">Study Podcast</h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            {isPlaying && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                                            {formatTime(currentTime)} / {formatTime(duration)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Progress Bar - Podcast */}
                            <div className="mb-4 md:mb-6 group">
                                <input
                                    type="range"
                                    min="0"
                                    max={duration || 100}
                                    value={currentTime}
                                    onChange={handleSeek}
                                    className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-indigo-600 dark:[&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:bg-indigo-500 transition-all"
                                    style={{
                                        backgroundImage: `linear-gradient(to right, #6366f1 ${(currentTime / (duration || 1)) * 100}%, ${document.documentElement.classList.contains('dark') ? '#1f2937' : '#e5e7eb'} ${(currentTime / (duration || 1)) * 100}%)`
                                    }}
                                />
                            </div>

                            {/* Controls Row */}
                            <div className="flex items-center justify-between gap-4">
                                {/* Volume (Hidden on small mobile) */}
                                <div className="hidden sm:flex items-center gap-3 text-gray-500 dark:text-gray-400 w-24">
                                    <FaVolumeUp size={14} />
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.01"
                                        value={volume}
                                        onChange={handleVolumeChange}
                                        className="w-full h-1 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-gray-400 [&::-webkit-slider-thumb]:rounded-full"
                                    />
                                </div>

                                {/* Main Controls (Centered) */}
                                <div className="flex items-center justify-center gap-6 md:gap-8 flex-1">
                                    <button onClick={() => handleSkip(-10)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full"><FaRedo className="transform -scale-x-100 text-lg md:text-xl" /></button>
                                    <button 
                                        onClick={togglePlay}
                                        className="w-14 h-14 md:w-16 md:h-16 bg-gray-900 dark:bg-white rounded-full flex items-center justify-center text-white dark:text-black hover:scale-105 transition-transform shadow-xl"
                                    >
                                        {isPlaying ? <FaPause className="text-xl md:text-2xl" /> : <FaPlay className="ml-1 text-xl md:text-2xl" />}
                                    </button>
                                    <button onClick={() => handleSkip(10)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full"><FaRedo className="text-lg md:text-xl" /></button>
                                </div>

                                {/* Extras */}
                                <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400 text-sm w-24 justify-end">
                                    <span className="cursor-pointer hover:text-gray-900 dark:hover:text-white font-medium hidden sm:block">1x</span>
                                    <button className="hover:text-gray-900 dark:hover:text-white p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"><FaDownload /></button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Transcript */}
            <div ref={scrollRef} className={`absolute inset-0 overflow-y-auto custom-scrollbar px-4 md:px-8 pb-8 transition-all duration-300 overscroll-contain ${isCompact ? 'pt-[100px]' : 'pt-[280px] md:pt-[280px]'}`}>
                {transcript.map((item, index) => {
                    const isActive = currentTime >= item.start_seconds && currentTime < item.end_seconds;
                    return (
                        <div 
                            key={index} 
                            className={`flex gap-4 transition-opacity duration-300 ${index === 0 ? 'mt-6' : ''} ${item.speaker === 'Sam' ? 'flex-row-reverse' : ''} ${isActive ? 'opacity-100 scale-[1.02]' : 'opacity-50 hover:opacity-80'}`}
                        >
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800 flex-shrink-0 border border-white/10">
                                <img 
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.speaker}`} 
                                    alt={item.speaker} 
                                    className="w-full h-full object-cover" 
                                />
                            </div>
                            <div className={`max-w-[80%] ${item.speaker === 'Sam' ? 'items-end' : 'items-start'} flex flex-col relative`}>
                                <span className="text-xs text-gray-500 mb-1 px-1">{item.speaker}</span>
                                <div 
                                    className={`p-4 rounded-2xl border text-xs md:text-sm leading-relaxed transition-colors duration-300 cursor-pointer relative ${
                                        item.speaker === 'Sam' ? 'rounded-tr-none' : 'rounded-tl-none'
                                    } ${
                                        isActive 
                                            ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-500/50 text-indigo-700 dark:text-white shadow-lg shadow-indigo-500/10 dark:shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
                                            : 'bg-white dark:bg-[#1a1a1a] border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252525]'
                                    }`}
                                    onClick={() => {
                                        if (audioRef.current) {
                                            audioRef.current.currentTime = item.start_seconds;
                                            audioRef.current.play();
                                            setIsPlaying(true);
                                        }
                                    }}
                                >
                                    <div className="prose dark:prose-invert max-w-none prose-p:my-0 prose-headings:my-2">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkMath]}
                                            rehypePlugins={[rehypeKatex]}
                                        >
                                            {preprocessLaTeX(item.text)}
                                        </ReactMarkdown>
                                    </div>
                                    
                                    {isActive && onDiscuss && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const content = `Context from Podcast (${item.speaker} at ${formatTime(item.start_seconds)}): "${item.text}"`;
                                                onDiscuss(content);
                                            }}
                                            className={`absolute -top-3 ${item.speaker === 'Sam' ? '-left-3' : '-right-3'} group/btn flex items-center gap-2 bg-indigo-600 text-white p-2 rounded-full shadow-lg hover:bg-indigo-700 transition-all duration-200 z-10`}
                                            title="Discuss in Chat"
                                        >
                                            <FaCommentDots size={12} />
                                            <span className="max-w-0 overflow-hidden group-hover/btn:max-w-[120px] transition-all duration-300 whitespace-nowrap text-xs font-medium">Discuss with AI</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default StudyPodcast;
