import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabase';
import { 
    FaPlay, FaPause, FaStepBackward, FaStepForward, 
    FaVolumeUp, FaDownload, FaHandPaper, FaMagic, FaRedo 
} from 'react-icons/fa';
import { Skeleton } from '../ui/Skeleton';

interface PodcastSegment {
    text: string;
    speaker: string;
    end_seconds: number;
    start_seconds: number;
    end_time_formatted: string;
    start_time_formatted: string;
}

const StudyPodcast: React.FC = () => {
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
                    .single();

                if (error && error.code !== 'PGRST116') {
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
        const activeSegment = transcript.findIndex(
            (seg) => currentTime >= seg.start_seconds && currentTime < seg.end_seconds
        );
        
        if (activeSegment !== -1 && scrollRef.current) {
            const activeElement = scrollRef.current.children[activeSegment] as HTMLElement;
            if (activeElement) {
                activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
        <div className="max-w-4xl mx-auto w-full h-full relative overflow-hidden">
            <audio
                ref={audioRef}
                src={audioUrl || ''}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={() => setIsPlaying(false)}
            />

            {/* Audio Player Card - Fixed Top */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4">
                <div className="backdrop-blur-md bg-white/90 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center overflow-hidden">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Podcast" alt="Podcast" className="w-full h-full object-cover opacity-80" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Study Podcast</h3>
                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                {isPlaying && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </div>
                        </div>
                    </div>
                    
                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                        <FaHandPaper />
                        Raise Hand
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="mb-4 group">
                    <input
                        type="range"
                        min="0"
                        max={duration || 100}
                        value={currentTime}
                        onChange={handleSeek}
                        className="w-full h-1 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-indigo-600 dark:[&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:bg-indigo-500 transition-all"
                        style={{
                            backgroundImage: `linear-gradient(to right, #6366f1 ${(currentTime / duration) * 100}%, ${document.documentElement.classList.contains('dark') ? '#1f2937' : '#e5e7eb'} ${(currentTime / duration) * 100}%)`
                        }}
                    />
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                        <FaVolumeUp size={14} />
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={volume}
                            onChange={handleVolumeChange}
                            className="w-20 h-1 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-gray-400 [&::-webkit-slider-thumb]:rounded-full"
                        />
                    </div>

                    <div className="flex items-center gap-6">
                        <button onClick={() => handleSkip(-10)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"><FaRedo className="transform -scale-x-100" /></button>
                        <button 
                            onClick={togglePlay}
                            className="w-12 h-12 bg-gray-900 dark:bg-white rounded-full flex items-center justify-center text-white dark:text-black hover:scale-105 transition-transform"
                        >
                            {isPlaying ? <FaPause /> : <FaPlay className="ml-1" />}
                        </button>
                        <button onClick={() => handleSkip(10)} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"><FaRedo /></button>
                    </div>

                    <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400 text-sm">
                        <span className="cursor-pointer hover:text-gray-900 dark:hover:text-white">1x</span>
                        <button className="hover:text-gray-900 dark:hover:text-white"><FaDownload /></button>
                    </div>
                </div>
            </div>
            </div>

            {/* Transcript */}
            <div ref={scrollRef} className="absolute inset-0 overflow-y-auto custom-scrollbar px-4 pt-[280px] pb-8">
                {transcript.map((item, index) => {
                    const isActive = currentTime >= item.start_seconds && currentTime < item.end_seconds;
                    return (
                        <div 
                            key={index} 
                            className={`flex gap-4 transition-opacity duration-300 ${item.speaker === 'Sam' ? 'flex-row-reverse' : ''} ${isActive ? 'opacity-100 scale-[1.02]' : 'opacity-50 hover:opacity-80'}`}
                        >
                            <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800 flex-shrink-0 border border-white/10">
                                <img 
                                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.speaker}`} 
                                    alt={item.speaker} 
                                    className="w-full h-full object-cover" 
                                />
                            </div>
                            <div className={`max-w-[80%] ${item.speaker === 'Sam' ? 'items-end' : 'items-start'} flex flex-col`}>
                                <span className="text-xs text-gray-500 mb-1 px-1">{item.speaker}</span>
                                <div 
                                    className={`p-4 rounded-2xl border text-sm leading-relaxed transition-colors duration-300 cursor-pointer ${
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
                                    {item.text}
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
