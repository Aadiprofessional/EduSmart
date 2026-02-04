import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabase';
import { FaPlay, FaPause, FaForward, FaBackward, FaDownload, FaMicrophone, FaVideo } from 'react-icons/fa';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { Skeleton } from '../ui/Skeleton';

interface Word {
    start: number;
    end: number;
    word: string;
}

interface AudioMetadata {
    id: number;
    uid: string;
    documentid: string;
    uploaded_at: string;
    duration: number | null;
    language: string | null;
    audio_url: string | null;
    words_data: Word[] | null;
    video_url: string | null;
}

const StudySpeechToText: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    
    // Playback state
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    
    // Data state
    const [searchQuery, setSearchQuery] = useState('');
    const [transcript, setTranscript] = useState<Word[]>([]);
    const [mediaUrl, setMediaUrl] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<'audio' | 'video'>('audio');
    const [loading, setLoading] = useState(true);
    const [isPolling, setIsPolling] = useState(false);
    
    // Refs
    const mediaRef = useRef<HTMLMediaElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Initial check and polling
    useEffect(() => {
        let pollInterval: NodeJS.Timeout;
        let isMounted = true;

        const checkAndPoll = async () => {
            if (!id || !user) return;

            try {
                // Poll audio_metadata
                const fetchMetadata = async () => {
                    if (!isMounted) return;

                    const { data, error } = await supabase
                        .from('audio_metadata')
                        .select('*')
                        .eq('documentid', id)
                        .eq('uid', user.id)
                        .single();

                    if (data) {
                        // Data found
                        const metadata = data as AudioMetadata;
                        
                        // Determine media URL and type
                        if (metadata.video_url) {
                            setMediaUrl(metadata.video_url);
                            setMediaType('video');
                        } else if (metadata.audio_url) {
                            setMediaUrl(metadata.audio_url);
                            setMediaType('audio');
                        }

                        // Set transcript
                        if (metadata.words_data && Array.isArray(metadata.words_data)) {
                            setTranscript(metadata.words_data);
                        }

                        // Set duration if available
                        if (metadata.duration) {
                            setDuration(metadata.duration);
                        }

                        setLoading(false);
                        setIsPolling(false);
                        return true; // Stop polling
                    }
                    
                    // Keep polling
                    setIsPolling(true);
                    return false;
                };

                // Initial fetch
                const done = await fetchMetadata();
                if (!done) {
                    pollInterval = setInterval(async () => {
                        const stop = await fetchMetadata();
                        if (stop) clearInterval(pollInterval);
                    }, 10000); // 10 seconds
                }

            } catch (err) {
                console.error("Error in checkAndPoll:", err);
                setLoading(false);
            }
        };

        checkAndPoll();

        return () => {
            isMounted = false;
            if (pollInterval) clearInterval(pollInterval);
        };
    }, [id, user]);

    // Media event listeners
    useEffect(() => {
        const media = mediaRef.current;
        if (!media) return;

        const handleTimeUpdate = () => setCurrentTime(media.currentTime);
        const handleLoadedMetadata = () => {
            if (!duration && media.duration) setDuration(media.duration);
        };
        const handleEnded = () => setIsPlaying(false);

        media.addEventListener('timeupdate', handleTimeUpdate);
        media.addEventListener('loadedmetadata', handleLoadedMetadata);
        media.addEventListener('ended', handleEnded);

        return () => {
            media.removeEventListener('timeupdate', handleTimeUpdate);
            media.removeEventListener('loadedmetadata', handleLoadedMetadata);
            media.removeEventListener('ended', handleEnded);
        };
    }, [mediaUrl, mediaType]); // Re-bind if media source changes

    // Play/Pause effect
    useEffect(() => {
        if (mediaRef.current) {
            if (isPlaying) {
                mediaRef.current.play().catch(e => console.error("Play error:", e));
            } else {
                mediaRef.current.pause();
            }
        }
    }, [isPlaying]);

    const togglePlay = () => setIsPlaying(!isPlaying);

    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!mediaRef.current || !duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const newTime = percent * duration;
        mediaRef.current.currentTime = newTime;
        setCurrentTime(newTime);
    };

    // Group words into 30s paragraphs
    const groupedTranscript = React.useMemo(() => {
        const groups: { start: number; words: Word[] }[] = [];
        let currentGroup: Word[] = [];
        let groupStartTime = 0;

        transcript.forEach((word) => {
            // Check if word belongs to next 30s block
            // Actually, requirements say "in para of 30 sec each".
            // We can group based on absolute time chunks: 0-30, 30-60, etc.
            const chunkIndex = Math.floor(word.start / 30);
            const chunkStartTime = chunkIndex * 30;

            if (chunkStartTime !== groupStartTime) {
                if (currentGroup.length > 0) {
                    groups.push({ start: groupStartTime, words: currentGroup });
                }
                currentGroup = [];
                groupStartTime = chunkStartTime;
            }
            currentGroup.push(word);
        });
        
        if (currentGroup.length > 0) {
            groups.push({ start: groupStartTime, words: currentGroup });
        }

        return groups;
    }, [transcript]);

    // Auto-scroll to active group
    useEffect(() => {
        const activeGroupIndex = groupedTranscript.findIndex(
            (group) => currentTime >= group.start && currentTime < group.start + 30
        );
        
        if (activeGroupIndex !== -1 && scrollRef.current) {
            const activeElement = scrollRef.current.children[activeGroupIndex] as HTMLElement;
            if (activeElement) {
                activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [currentTime, groupedTranscript]);

    if (loading || isPolling) {
        // Show skeleton or loading state
        // If polling, we might want to show "Processing..." state
        if (isPolling && !mediaUrl) {
             return (
                <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-[#111111] text-gray-900 dark:text-white">
                    <div className="flex flex-col items-center gap-4">
                        <AiOutlineLoading3Quarters className="animate-spin text-indigo-600 dark:text-[#c2410c] text-4xl" />
                        <p className="text-gray-600 dark:text-gray-400">Processing media...</p>
                        <p className="text-sm text-gray-500">Waiting for transcription (checking every 10s)...</p>
                    </div>
                </div>
            );
        }
        // Normal loading
        if (loading) {
             return (
                <div className="h-full flex flex-col bg-gray-50 dark:bg-[#111111] text-gray-900 dark:text-white overflow-hidden p-6">
                     <Skeleton width="100%" height={200} className="mb-6" />
                     <div className="space-y-4">
                         {[1,2,3].map(i => <Skeleton key={i} width="100%" height={60} />)}
                     </div>
                </div>
            );
        }
    }

    if (!mediaUrl && !loading) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-50 dark:bg-[#111111] text-gray-900 dark:text-white">
                <p className="text-gray-500 dark:text-gray-400">No media found for this document.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto w-full h-full relative overflow-hidden">
            {/* Hidden Media Element (Audio only, Video is rendered visibly) */}
            {mediaType === 'audio' && (
                <audio 
                    ref={mediaRef as React.RefObject<HTMLAudioElement>} 
                    src={mediaUrl!} 
                    onTimeUpdate={() => setCurrentTime(mediaRef.current?.currentTime || 0)}
                    onLoadedMetadata={() => setDuration(mediaRef.current?.duration || 0)}
                    onEnded={() => setIsPlaying(false)}
                />
            )}
            
            {/* Player Card - Fixed Top */}
            <div className="absolute top-0 left-0 right-0 z-20 p-4">
                <div className="backdrop-blur-md bg-white/80 dark:bg-black/40 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4 w-full">
                            {mediaType === 'video' ? (
                                // Video Player within the card
                                <div className="w-full max-w-md aspect-video bg-black rounded-xl overflow-hidden relative group mx-auto border border-gray-200 dark:border-white/10">
                                    <video 
                                        src={mediaUrl!}
                                        className="w-full h-full object-contain"
                                        ref={mediaRef as React.RefObject<HTMLVideoElement>}
                                        onClick={togglePlay}
                                        onTimeUpdate={() => setCurrentTime(mediaRef.current?.currentTime || 0)}
                                        onLoadedMetadata={() => setDuration(mediaRef.current?.duration || 0)}
                                        onEnded={() => setIsPlaying(false)}
                                    />
                                    {!isPlaying && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                                            <div className="w-12 h-12 bg-indigo-600/90 dark:bg-[#c2410c]/90 rounded-full flex items-center justify-center text-white">
                                                <FaPlay className="ml-1 text-xl" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // Audio Icon / Info
                                <>
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-orange-500 dark:to-red-500 flex items-center justify-center overflow-hidden shadow-lg shadow-indigo-900/20 dark:shadow-orange-900/20">
                                        <FaMicrophone className="text-white text-xl" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">Audio Transcription</h3>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                            {isPlaying && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                                            {formatTime(currentTime)} / {formatTime(duration)}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        
                        {mediaUrl && (
                            <a 
                                href={mediaUrl} 
                                download 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="bg-gray-100 dark:bg-[#1a1a1a] hover:bg-gray-200 dark:hover:bg-[#252525] text-gray-700 dark:text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors border border-gray-200 dark:border-white/10"
                            >
                                <FaDownload size={14} />
                            </a>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4 group">
                        <input
                            type="range"
                            min="0"
                            max={duration || 100}
                            value={currentTime}
                            onChange={(e) => {
                                const newTime = parseFloat(e.target.value);
                                if (mediaRef.current) mediaRef.current.currentTime = newTime;
                                setCurrentTime(newTime);
                            }}
                            className="w-full h-1 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-indigo-600 dark:[&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:bg-indigo-500 dark:hover:[&::-webkit-slider-thumb]:bg-[#c2410c] transition-all"
                            style={{
                                backgroundImage: `linear-gradient(to right, ${document.documentElement.classList.contains('dark') ? '#c2410c' : '#4f46e5'} ${(currentTime / (duration || 1)) * 100}%, ${document.documentElement.classList.contains('dark') ? '#1f2937' : '#e5e7eb'} ${(currentTime / (duration || 1)) * 100}%)`
                            }}
                        />
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-center gap-6">
                        <button 
                            onClick={() => {
                                if (mediaRef.current) mediaRef.current.currentTime -= 10;
                            }} 
                            className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full"
                        >
                            <FaBackward />
                        </button>
                        <button 
                            onClick={togglePlay}
                            className="w-12 h-12 bg-indigo-600 dark:bg-white rounded-full flex items-center justify-center text-white dark:text-black hover:scale-105 transition-transform shadow-lg shadow-indigo-600/20 dark:shadow-white/10"
                        >
                            {isPlaying ? <FaPause /> : <FaPlay className="ml-1" />}
                        </button>
                        <button 
                            onClick={() => {
                                if (mediaRef.current) mediaRef.current.currentTime += 10;
                            }} 
                            className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full"
                        >
                            <FaForward />
                        </button>
                    </div>
                </div>
            </div>

            {/* Transcript Area */}
            <div 
                ref={scrollRef} 
                className={`absolute inset-0 overflow-y-auto custom-scrollbar px-4 pb-8 ${mediaType === 'video' ? 'pt-[420px]' : 'pt-[240px]'}`}
            >
                {groupedTranscript.length > 0 ? (
                    groupedTranscript.map((group, groupIndex) => {
                        const isGroupActive = currentTime >= group.start && currentTime < group.start + 30;
                        return (
                            <div 
                                key={groupIndex} 
                                className={`mb-4 transition-all duration-500 ${isGroupActive ? 'opacity-100 scale-[1.01]' : 'opacity-60 hover:opacity-80'}`}
                            >
                                <div className="text-xs text-gray-500 font-mono mb-2 ml-1">
                                    {formatTime(group.start)} - {formatTime(group.start + 30)}
                                </div>
                                <div 
                                    className={`p-6 rounded-2xl border text-base leading-loose transition-all duration-300 ${
                                        isGroupActive 
                                            ? 'bg-indigo-50 dark:bg-orange-900/10 border-indigo-200 dark:border-orange-500/30 text-gray-900 dark:text-gray-100 shadow-[0_0_20px_rgba(79,70,229,0.1)] dark:shadow-[0_0_20px_rgba(194,65,12,0.1)]' 
                                            : 'bg-white dark:bg-[#1a1a1a]/50 border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'
                                    }`}
                                >
                                    {group.words.map((word, wordIndex) => {
                                        const isActive = currentTime >= word.start && currentTime <= word.end;
                                        return (
                                            <span 
                                                key={wordIndex}
                                                className={`cursor-pointer transition-colors duration-200 inline-block mr-1 rounded px-0.5 -mx-0.5 ${
                                                    isActive ? 'text-indigo-600 dark:text-[#c2410c] font-bold bg-indigo-100 dark:bg-[#c2410c]/10' : 'hover:text-gray-900 dark:hover:text-gray-200'
                                                }`}
                                                onClick={() => {
                                                    if (mediaRef.current) {
                                                        mediaRef.current.currentTime = word.start;
                                                        if (!isPlaying) setIsPlaying(true);
                                                    }
                                                }}
                                            >
                                                {word.word}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-12 text-gray-500 flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                            <FaMicrophone className="text-2xl text-gray-600" />
                        </div>
                        <p>No transcript available yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudySpeechToText;
