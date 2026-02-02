import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabase';
import { FaPlay, FaPause, FaForward, FaBackward, FaDownload, FaMicrophone, FaCopy, FaSearch } from 'react-icons/fa';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { Skeleton } from '../ui/Skeleton';

interface TranscriptSegment {
    time: number;
    text: string;
}

const StudySpeechToText: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [transcript, setTranscript] = useState<TranscriptSegment[]>([]);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        let intervalId: NodeJS.Timeout;
        let isMounted = true;

        const fetchData = async () => {
            if (!id || !user) return;

            try {
                const { data, error } = await supabase
                    .from('speech_to_text_documents')
                    .select('transcript, audio_url')
                    .eq('document_id', id)
                    .eq('uid', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.error('Error fetching data:', error);
                }

                if (isMounted) {
                    if (data) {
                         // Parse transcript if it's a string, or use directly if JSON
                        let parsedTranscript: TranscriptSegment[] = [];
                        if (typeof data.transcript === 'string') {
                             try {
                                 parsedTranscript = JSON.parse(data.transcript);
                             } catch (e) {
                                 console.error("Error parsing transcript JSON", e);
                             }
                        } else if (Array.isArray(data.transcript)) {
                            parsedTranscript = data.transcript;
                        }

                        if (parsedTranscript.length > 0) {
                            setTranscript(parsedTranscript);
                            setAudioUrl(data.audio_url);
                            setLoading(false);
                            setIsGenerating(false);
                            if (intervalId) clearInterval(intervalId);
                        } else {
                             setIsGenerating(true);
                             setLoading(false);
                        }
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
        intervalId = setInterval(fetchData, 5000); // Poll every 5 seconds

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [id, user]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
        const handleLoadedMetadata = () => setDuration(audio.duration);
        const handleEnded = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio.removeEventListener('ended', handleEnded);
        };
    }, [audioUrl]);

    useEffect(() => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.play().catch(e => console.error("Play error:", e));
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying]);

    const togglePlay = () => {
        setIsPlaying(!isPlaying);
    };

    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!audioRef.current || !duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const newTime = percent * duration;
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
    };

    const filteredTranscript = transcript.filter(item => 
        item.text.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="h-full flex flex-col bg-[#111111] text-white overflow-hidden">
                 {/* Header Skeleton */}
                 <div className="p-6 border-b border-white/10 bg-[#1a1a1a]">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                             <Skeleton dark width={48} height={48} className="rounded-full" />
                             <div>
                                 <Skeleton dark width={140} height={24} className="mb-2" />
                                 <Skeleton dark width={80} height={16} />
                             </div>
                        </div>
                    </div>
                    {/* Controls */}
                    <div className="flex flex-col gap-4">
                        <Skeleton dark width="100%" height={6} className="rounded-full" />
                        <div className="flex justify-center gap-6">
                            <Skeleton dark width={32} height={32} className="rounded-full" />
                            <Skeleton dark width={48} height={48} className="rounded-full" />
                            <Skeleton dark width={32} height={32} className="rounded-full" />
                        </div>
                    </div>
                 </div>
                 
                 {/* Transcript Skeleton */}
                 <div className="flex-1 p-4 space-y-4">
                     {[1, 2, 3, 4, 5, 6].map((i) => (
                         <div key={i} className="flex gap-4">
                             <Skeleton dark width={40} height={20} />
                             <div className="flex-1 space-y-2">
                                 <Skeleton dark width="100%" height={16} />
                                 <Skeleton dark width="90%" height={16} />
                             </div>
                         </div>
                     ))}
                 </div>
            </div>
        );
    }

    if (isGenerating) {
        return (
            <div className="h-full flex items-center justify-center bg-[#111111] text-white">
                <div className="flex flex-col items-center gap-4">
                    <AiOutlineLoading3Quarters className="animate-spin text-[#c2410c] text-4xl" />
                    <p className="text-gray-400">Processing audio...</p>
                    <p className="text-sm text-gray-500">This may take a few minutes</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-[#111111] text-white overflow-hidden">
            {audioUrl && <audio ref={audioRef} src={audioUrl} />}
            
            {/* Audio Player Header */}
            <div className="p-6 border-b border-white/10 bg-[#1a1a1a]">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#c2410c]/20 flex items-center justify-center text-[#c2410c]">
                            <FaMicrophone size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Audio Recording</h2>
                            <p className="text-sm text-gray-400">
                                {duration > 0 ? `${formatTime(duration)} Duration` : 'Loading duration...'}
                            </p>
                        </div>
                    </div>
                    {audioUrl && (
                        <a 
                            href={audioUrl} 
                            download 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-gray-300 hover:text-white"
                        >
                            <FaDownload />
                        </a>
                    )}
                </div>

                {/* Controls */}
                <div className="flex flex-col gap-2">
                    <div 
                        className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden cursor-pointer"
                        onClick={handleSeek}
                    >
                        <div 
                            className="bg-[#c2410c] h-full transition-all duration-100" 
                            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>

                    <div className="flex items-center justify-center gap-6 mt-2">
                        <button 
                            className="text-gray-400 hover:text-white transition-colors"
                            onClick={() => {
                                if (audioRef.current) audioRef.current.currentTime -= 10;
                            }}
                        >
                            <FaBackward />
                        </button>
                        <button 
                            onClick={togglePlay}
                            className="w-12 h-12 bg-[#c2410c] hover:bg-[#9a3412] rounded-full flex items-center justify-center text-white transition-colors shadow-lg shadow-orange-900/20"
                            disabled={!audioUrl}
                        >
                            {isPlaying ? <FaPause /> : <FaPlay className="ml-1" />}
                        </button>
                        <button 
                            className="text-gray-400 hover:text-white transition-colors"
                            onClick={() => {
                                if (audioRef.current) audioRef.current.currentTime += 10;
                            }}
                        >
                            <FaForward />
                        </button>
                    </div>
                </div>
            </div>

            {/* Transcript Area */}
            <div className="flex-1 flex flex-col min-h-0">
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#111111]">
                    <h3 className="font-bold text-gray-300">Transcript</h3>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs" />
                            <input 
                                type="text" 
                                placeholder="Search transcript..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-[#1a1a1a] border border-white/10 rounded-full py-1.5 pl-8 pr-4 text-xs text-white focus:outline-none focus:border-[#c2410c]"
                            />
                        </div>
                        <button 
                            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            onClick={() => {
                                const text = transcript.map(t => t.text).join('\n');
                                navigator.clipboard.writeText(text);
                            }}
                        >
                            <FaCopy size={14} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {filteredTranscript.length > 0 ? (
                        filteredTranscript.map((item, index) => (
                            <div 
                                key={index} 
                                className={`flex gap-4 p-3 rounded-xl transition-colors cursor-pointer ${
                                    currentTime >= item.time && currentTime < (transcript[index + 1]?.time || duration)
                                    ? 'bg-[#c2410c]/10 border border-[#c2410c]/20'
                                    : 'hover:bg-white/5 border border-transparent'
                                }`}
                                onClick={() => {
                                    if (audioRef.current) {
                                        audioRef.current.currentTime = item.time;
                                        setCurrentTime(item.time);
                                        if (!isPlaying) setIsPlaying(true);
                                    }
                                }}
                            >
                                <span className="text-xs font-mono text-gray-500 mt-1 min-w-[40px]">{formatTime(item.time)}</span>
                                <p className={`text-sm leading-relaxed ${
                                    currentTime >= item.time && currentTime < (transcript[index + 1]?.time || duration)
                                    ? 'text-white'
                                    : 'text-gray-400'
                                }`}>
                                    {item.text}
                                </p>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            {transcript.length === 0 ? 'No transcript available.' : 'No matching text found.'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudySpeechToText;
