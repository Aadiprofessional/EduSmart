import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabase';
import { FaPlay, FaPause, FaForward, FaBackward, FaDownload, FaMicrophone, FaVideo, FaCommentDots, FaExpand, FaCompress, FaArrowsAlt } from 'react-icons/fa';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { Skeleton } from '../ui/Skeleton';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

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

interface StudySpeechToTextProps {
    onDiscuss?: (text: string) => void;
    documentType?: string;
}

const StudySpeechToText: React.FC<StudySpeechToTextProps> = ({ onDiscuss, documentType }) => {
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
    const [isCompact, setIsCompact] = useState(false);
    const isUserScrolling = useRef(false);
    const scrollTimeout = useRef<NodeJS.Timeout | null>(null);
    const isAutoScrolling = useRef(false);
    
    // Refs for state accessible in event listeners
    const currentTimeRef = useRef(currentTime);
    const groupedTranscriptRef = useRef<any[]>([]);
    
    // Update refs when state changes
    useEffect(() => {
        currentTimeRef.current = currentTime;
    }, [currentTime]);

    // groupedTranscriptRef will be updated in a separate effect after groupedTranscript is defined

    // Scroll Logic Helper Ref (to avoid circular dependencies or moving code)
    const scrollToActiveGroupRef = useRef<() => void>(() => {});

    // Scroll listener for compact mode
    useEffect(() => {
        // For video, we track scroll to show/hide the floating player
        // For audio, we track scroll to collapse the header
        
        const handleScroll = () => {
            if (scrollRef.current) {
                const currentScroll = scrollRef.current.scrollTop;
                
                // For Video: If scrolled past 300px (roughly video height), enable compact mode (floating)
                if (mediaType === 'video') {
                     const shouldBeCompact = currentScroll > 300;
                     if (shouldBeCompact !== isCompact) {
                         setIsCompact(shouldBeCompact);
                         // Reset position/size when toggling compact mode
                         if (!shouldBeCompact) {
                             setCompactPosition(null);
                             // Optional: reset size too? 
                             // setCompactSize(null); 
                         }
                     }
                     return;
                }

                // Audio Logic
                // Trigger compact mode earlier on mobile (scrolled > 20px)
                // Added hysteresis to prevent loops
                setIsCompact(prev => {
                    if (!prev && currentScroll > 20) {
                        return true;
                    } else if (prev && currentScroll < 10) {
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
                        // Snap back to active group
                        if (scrollToActiveGroupRef.current) {
                            scrollToActiveGroupRef.current();
                        }
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
    }, [loading, isPolling, mediaUrl, mediaType, isCompact]);

    // Fullscreen and Draggable/Resizable state
    const [isFullscreen, setIsFullscreen] = useState(false);
    const videoContainerRef = useRef<HTMLDivElement>(null);
    const [compactPosition, setCompactPosition] = useState<{ x: number, y: number } | null>(null);
    const [compactSize, setCompactSize] = useState<{ width: number } | null>(null);
    
    // Dragging logic refs
    const isDragging = useRef(false);
    const dragStart = useRef({ x: 0, y: 0 });
    const initialPos = useRef({ x: 0, y: 0 });

    // Resizing logic refs
    const isResizing = useRef(false);
    const resizeStart = useRef({ x: 0, y: 0 });
    const initialSize = useRef({ width: 0 });

    const toggleFullScreen = () => {
        if (!videoContainerRef.current) return;
        
        if (!document.fullscreenElement) {
            videoContainerRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Drag handlers
    const handleDragStart = (e: React.MouseEvent) => {
        if (!isCompact || isFullscreen) return;
        // Only drag if clicking the handle or specific area, but here we might wrap a handle
        // e.preventDefault(); // Don't prevent default immediately, might be clicking a button
        e.stopPropagation();
        
        isDragging.current = true;
        dragStart.current = { x: e.clientX, y: e.clientY };
        
        // Initialize position if null (first drag)
        if (!compactPosition && videoContainerRef.current) {
            const rect = videoContainerRef.current.getBoundingClientRect();
            initialPos.current = { x: rect.left, y: rect.top };
            setCompactPosition({ x: rect.left, y: rect.top });
        } else if (compactPosition) {
            initialPos.current = { x: compactPosition.x, y: compactPosition.y };
        }
        
        document.addEventListener('mousemove', handleDragMove);
        document.addEventListener('mouseup', handleDragEnd);
    };
    
    const handleDragMove = (e: MouseEvent) => {
        if (!isDragging.current) return;
        e.preventDefault(); // Prevent selection while dragging
        
        const dx = e.clientX - dragStart.current.x;
        const dy = e.clientY - dragStart.current.y;
        
        setCompactPosition({
            x: initialPos.current.x + dx,
            y: initialPos.current.y + dy
        });
    };
    
    const handleDragEnd = () => {
        isDragging.current = false;
        document.removeEventListener('mousemove', handleDragMove);
        document.removeEventListener('mouseup', handleDragEnd);
    };

    // Resize handlers
    const handleResizeStart = (e: React.MouseEvent) => {
        if (!isCompact || isFullscreen) return;
        e.preventDefault();
        e.stopPropagation();

        isResizing.current = true;
        resizeStart.current = { x: e.clientX, y: e.clientY };
        
        if (!compactSize && videoContainerRef.current) {
            const rect = videoContainerRef.current.getBoundingClientRect();
            initialSize.current = { width: rect.width };
            setCompactSize({ width: rect.width });
        } else if (compactSize) {
            initialSize.current = { width: compactSize.width };
        } else {
            // Default width if not set yet (should be 320 aka w-80)
            initialSize.current = { width: 320 };
            setCompactSize({ width: 320 });
        }

        document.addEventListener('mousemove', handleResizeMove);
        document.addEventListener('mouseup', handleResizeEnd);
    };

    const handleResizeMove = (e: MouseEvent) => {
        if (!isResizing.current) return;
        e.preventDefault();
        
        const dx = e.clientX - resizeStart.current.x;
        // Standard resize: handle on right side grows width
        const newWidth = Math.max(200, Math.min(800, initialSize.current.width + dx));
        setCompactSize({ width: newWidth });
    };

    const handleResizeEnd = () => {
        isResizing.current = false;
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
    };

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
                            // Force video type if document_type indicates video/youtube
                            if (documentType === 'video' || documentType === 'youtube') {
                                setMediaType('video');
                            } else {
                                setMediaType('audio');
                            }
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
    }, [id, user, documentType]);

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

    // Update groupedTranscriptRef
    useEffect(() => {
        groupedTranscriptRef.current = groupedTranscript;
    }, [groupedTranscript]);

    // Define scrollToActiveGroup logic
    useEffect(() => {
        scrollToActiveGroupRef.current = () => {
            if (!scrollRef.current) return;
            
            const cTime = currentTimeRef.current;
            const groups = groupedTranscriptRef.current;
            
            const activeGroupIndex = groups.findIndex(
                (group) => cTime >= group.start && cTime < group.start + 30
            );
    
            if (activeGroupIndex !== -1) {
                const activeElement = scrollRef.current.children[activeGroupIndex] as HTMLElement;
                if (activeElement) {
                    isAutoScrolling.current = true;
                    
                    const container = scrollRef.current;
                    const elementTop = activeElement.offsetTop;
                    const elementHeight = activeElement.offsetHeight;
                    const containerHeight = container.clientHeight;
                    
                    const targetScrollTop = elementTop - (containerHeight / 2) + (elementHeight / 2);
    
                    container.scrollTo({
                        top: targetScrollTop,
                        behavior: 'smooth'
                    });
    
                    setTimeout(() => {
                        isAutoScrolling.current = false;
                    }, 1000);
                }
            }
        };
    }, []); // Refs are stable, no deps needed really, or empty deps to set it once

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in an input
            if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

            if (e.key.toLowerCase() === 'f') {
                e.preventDefault();
                toggleFullScreen();
            } else if (e.key === ' ') {
                e.preventDefault();
                togglePlay();
            } else if (e.key === 'Escape') {
                // If in fullscreen, it exits automatically by browser.
                // But we can also handle extra logic if needed.
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [togglePlay]); // toggleFullScreen is stable? defined inside component but uses ref, should be fine. actually better include it or make it stable.

    // Auto-scroll to active group
    const lastActiveGroupIndex = useRef<number>(-1);
    
    useEffect(() => {
        // Skip if user is manually scrolling
        if (isUserScrolling.current) return;

        const activeGroupIndex = groupedTranscript.findIndex(
            (group) => currentTime >= group.start && currentTime < group.start + 30
        );
        
        // Only scroll if the active group CHANGED
        if (activeGroupIndex !== -1 && activeGroupIndex !== lastActiveGroupIndex.current && scrollRef.current) {
            lastActiveGroupIndex.current = activeGroupIndex;
            
            const activeElement = scrollRef.current.children[activeGroupIndex] as HTMLElement;
            if (activeElement) {
                isAutoScrolling.current = true;
                
                // Use scrollTo instead of scrollIntoView to prevent whole page scrolling
                const container = scrollRef.current;
                const elementTop = activeElement.offsetTop;
                const elementHeight = activeElement.offsetHeight;
                const containerHeight = container.clientHeight;
                
                // Calculate position to center the element
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
    }, [currentTime, groupedTranscript]);

    // Get current transcript text for subtitles
    const currentSubtitle = React.useMemo(() => {
        if (!transcript || transcript.length === 0) return null;
        
        // Find current word
        const currentWord = transcript.find(w => currentTime >= w.start && currentTime <= w.end);
        
        // If we have a current word (or even if not, just find the segment based on time)
        // Let's create static segments of ~8 words
        const SEGMENT_SIZE = 8;
        
        // Find which index in the transcript corresponds to current time
        // If exact word match:
        let currentIndex = -1;
        if (currentWord) {
            currentIndex = transcript.findIndex(w => w === currentWord);
        } else {
            // Find closest word before current time
             currentIndex = transcript.findIndex(w => w.start > currentTime) - 1;
             if (currentIndex === -2) currentIndex = transcript.length - 1; // Time is past end
             if (currentIndex === -1) currentIndex = 0; // Time is before start
        }

        if (currentIndex !== -1) {
            const segmentIndex = Math.floor(currentIndex / SEGMENT_SIZE);
            const start = segmentIndex * SEGMENT_SIZE;
            const end = Math.min(transcript.length, start + SEGMENT_SIZE);
            return transcript.slice(start, end);
        }
        
        return null;
    }, [currentTime, transcript]);

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
        <div className="max-w-4xl mx-auto w-full flex-1 min-h-0 relative overflow-hidden flex flex-col">
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
            
            {/* Audio Player Card - Fixed Top (Only for Audio) */}
            {mediaType === 'audio' && (
                <div className={`absolute top-0 left-0 right-0 z-20 transition-all duration-300 ${isCompact ? 'p-2' : 'p-4'}`}>
                    {/* AUDIO PLAYER UI (Original Card Style) */}
                    <div className={`backdrop-blur-md bg-white/90 dark:bg-black/80 border border-gray-200 dark:border-white/10 rounded-2xl shadow-xl transition-all duration-300 overflow-hidden ${isCompact ? 'p-3' : 'p-6'}`}>
                        {/* Compact View */}
                        {isCompact ? (
                             <div className="flex items-center gap-3 w-full">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-orange-500 dark:to-red-500 flex items-center justify-center flex-shrink-0">
                                    <FaMicrophone className="text-white text-xs" />
                                </div>

                                {/* Controls & Progress - Compact */}
                                <div className="flex-1 flex flex-col justify-center min-w-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono w-10 text-left">{formatTime(currentTime)}</span>
                                        
                                        <div className="flex items-center gap-4">
                                             <button onClick={() => { if(mediaRef.current) mediaRef.current.currentTime -= 10; }} className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-[#c2410c]"><FaBackward size={12}/></button>
                                             <button onClick={togglePlay} className="text-indigo-600 dark:text-[#c2410c] hover:scale-110 transition-transform">
                                                <div className="w-8 h-8 bg-indigo-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                                                    {isPlaying ? <FaPause size={10}/> : <FaPlay size={10} className="ml-0.5"/>}
                                                </div>
                                            </button>
                                             <button onClick={() => { if(mediaRef.current) mediaRef.current.currentTime += 10; }} className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-[#c2410c]"><FaForward size={12}/></button>
                                        </div>

                                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono w-10 text-right">{formatTime(duration)}</span>
                                    </div>
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
                                        className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-indigo-600 dark:[&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:bg-indigo-500 dark:hover:[&::-webkit-slider-thumb]:bg-[#c2410c] transition-all"
                                        style={{
                                            backgroundImage: `linear-gradient(to right, ${document.documentElement.classList.contains('dark') ? '#c2410c' : '#4f46e5'} ${(currentTime / (duration || 1)) * 100}%, ${document.documentElement.classList.contains('dark') ? '#1f2937' : '#e5e7eb'} ${(currentTime / (duration || 1)) * 100}%)`
                                        }}
                                    />
                                </div>
                            </div>
                        ) : (
                            // Expanded View
                            <div className="w-full">
                                <div className="flex flex-col md:flex-row items-center md:items-start justify-between mb-4 md:mb-6 gap-4">
                                    <div className="flex items-center gap-4 w-full">
                                        <div className="flex items-center gap-3 w-full">
                                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-orange-500 dark:to-red-500 flex items-center justify-center overflow-hidden shadow-lg shadow-indigo-900/20 dark:shadow-orange-900/20 flex-shrink-0">
                                                <FaMicrophone className="text-white text-lg md:text-xl" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-bold text-gray-900 dark:text-white text-base md:text-lg truncate">Audio Transcription</h3>
                                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                    {isPlaying && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>}
                                                    {formatTime(currentTime)} / {formatTime(duration)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {mediaUrl && (
                                        <a 
                                            href={mediaUrl} 
                                            download 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="hidden md:flex bg-gray-100 dark:bg-[#1a1a1a] hover:bg-gray-200 dark:hover:bg-[#252525] text-gray-700 dark:text-white px-3 py-2 rounded-lg text-sm font-medium items-center gap-2 transition-colors border border-gray-200 dark:border-white/10"
                                        >
                                            <FaDownload size={14} />
                                        </a>
                                    )}
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-4 md:mb-6 group">
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
                                        className="w-full h-2 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-indigo-600 dark:[&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:bg-indigo-500 dark:hover:[&::-webkit-slider-thumb]:bg-[#c2410c] transition-all"
                                        style={{
                                            backgroundImage: `linear-gradient(to right, ${document.documentElement.classList.contains('dark') ? '#c2410c' : '#4f46e5'} ${(currentTime / (duration || 1)) * 100}%, ${document.documentElement.classList.contains('dark') ? '#1f2937' : '#e5e7eb'} ${(currentTime / (duration || 1)) * 100}%)`
                                        }}
                                    />
                                </div>

                                {/* Controls */}
                                <div className="flex items-center justify-center gap-8 md:gap-12">
                                    <button 
                                        onClick={() => {
                                            if (mediaRef.current) mediaRef.current.currentTime -= 10;
                                        }} 
                                        className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-3 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full"
                                    >
                                        <FaBackward className="text-lg md:text-xl" />
                                    </button>
                                    <button 
                                        onClick={togglePlay}
                                        className="w-14 h-14 md:w-16 md:h-16 bg-indigo-600 dark:bg-[#c2410c] rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform shadow-lg shadow-indigo-600/20 dark:shadow-orange-900/20"
                                    >
                                        {isPlaying ? <FaPause className="text-xl md:text-2xl" /> : <FaPlay className="ml-1 text-xl md:text-2xl" />}
                                    </button>
                                    <button 
                                        onClick={() => {
                                            if (mediaRef.current) mediaRef.current.currentTime += 10;
                                        }} 
                                        className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-3 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full"
                                    >
                                        <FaForward className="text-lg md:text-xl" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Transcript Area - Scrollable */}
            <div 
                ref={scrollRef} 
                className={`flex-1 overflow-y-auto custom-scrollbar px-4 md:px-8 pb-8 transition-all duration-300 overscroll-contain ${
                    mediaType === 'audio' 
                        ? (isCompact ? 'pt-[100px]' : 'pt-[240px] md:pt-[240px]')
                        : 'pt-6'
                }`}
            >
                {/* Video Player - Static Top (Only for Video) */}
                {mediaType === 'video' && (
                    <>
                        {/* Placeholder to prevent layout jump when floating */}
                        <div className="mx-auto max-w-3xl mb-8 transition-all duration-300" style={{ height: isCompact ? '200px' : '0', opacity: isCompact ? 1 : 0, marginBottom: isCompact ? '2rem' : '0' }}>
                             <div className="w-full aspect-video bg-black/5 rounded-xl border border-gray-200 dark:border-white/10 relative overflow-hidden">
                                {/* This is just a placeholder to keep space, or we can just hide it and let content jump up? 
                                    Better to keep it or have a smooth transition. 
                                    If we move the ACTUAL video element, it will reload.
                                    So we must keep the video element in a fixed container that CHANGES position.
                                */}
                             </div>
                        </div>

                        {/* Actual Video Player Container - Changes position based on isCompact */}
                        <div 
                            ref={videoContainerRef}
                            className={`z-50 shadow-2xl overflow-hidden bg-black
                                ${isCompact 
                                    ? 'rounded-xl border border-white/20' 
                                    : 'relative mx-auto max-w-3xl rounded-xl border border-gray-200 dark:border-white/10 aspect-video w-full mb-8'
                                }
                                ${isCompact && !compactPosition ? 'fixed bottom-6 right-6 w-80 transition-all duration-500' : ''}
                                ${isCompact && compactPosition ? 'fixed' : 'transition-all duration-500'}
                            `}
                            style={
                                isCompact && compactPosition 
                                    ? { 
                                        left: compactPosition.x, 
                                        top: compactPosition.y, 
                                        width: compactSize ? compactSize.width : 320,
                                        height: 'auto'
                                      } 
                                    : (isCompact && compactSize ? { width: compactSize.width } : {})
                            }
                        >
                             <div className={`relative w-full h-full group ${isCompact ? 'aspect-video' : ''}`}>
                                {/* Drag Handle - Only in Compact Mode */}
                                {isCompact && !isFullscreen && (
                                    <div 
                                        onMouseDown={handleDragStart}
                                        className="absolute top-2 left-2 z-30 p-2 bg-black/50 text-white rounded-full cursor-move hover:bg-indigo-600 transition-colors opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                                        title="Drag to move"
                                    >
                                        <FaArrowsAlt size={12} />
                                    </div>
                                )}

                                <video 
                                    src={mediaUrl!}
                                    className="w-full h-full object-contain bg-black"
                                    ref={mediaRef as React.RefObject<HTMLVideoElement>}
                                    onClick={togglePlay}
                                    onTimeUpdate={() => setCurrentTime(mediaRef.current?.currentTime || 0)}
                                    onLoadedMetadata={() => setDuration(mediaRef.current?.duration || 0)}
                                    onEnded={() => setIsPlaying(false)}
                                />
                                
                                {/* Play Overlay (Center) */}
                                {!isPlaying && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none z-10">
                                        <div className={`bg-indigo-600/90 dark:bg-[#c2410c]/90 rounded-full flex items-center justify-center text-white backdrop-blur-sm shadow-xl ${isCompact ? 'w-10 h-10' : 'w-16 h-16'}`}>
                                            <FaPlay className={`${isCompact ? 'ml-0.5 text-lg' : 'ml-1 text-3xl'}`} />
                                        </div>
                                    </div>
                                )}

                                {/* Subtitles Overlay */}
                                {currentSubtitle && (
                                    <div className={`absolute left-0 right-0 text-center pointer-events-none z-10 ${isCompact ? 'bottom-12 px-2' : 'bottom-16 px-4'}`}>
                                        <div className="inline-flex flex-wrap justify-center gap-1 bg-black/60 px-3 py-1.5 rounded-lg backdrop-blur-sm shadow-sm">
                                            {(currentSubtitle as any as Word[]).map((w, i) => {
                                                const isCurrentWord = currentTime >= w.start && currentTime <= w.end;
                                                return (
                                                    <span 
                                                        key={i} 
                                                        className={`transition-colors duration-100 ${
                                                            isCompact ? 'text-xs' : 'text-sm md:text-base'
                                                        } ${
                                                            isCurrentWord 
                                                                ? 'text-yellow-400 font-bold scale-105' 
                                                                : 'text-white/90 font-medium'
                                                        }`}
                                                    >
                                                        {w.word}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Video Controls Overlay (Bottom) */}
                                <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 flex flex-col justify-end gap-2 ${isCompact ? 'p-2' : 'p-4'} ${!isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                    {/* Progress Bar */}
                                    <div className="w-full relative group/progress h-2 flex items-center">
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
                                            className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
                                        />
                                        <div className="w-full h-1 bg-white/30 rounded-full overflow-hidden relative">
                                            <div 
                                                className="h-full bg-indigo-500 dark:bg-[#c2410c] absolute top-0 left-0"
                                                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                                            />
                                        </div>
                                        {/* Handle only visible on hover or large mode */}
                                        <div 
                                            className={`w-3 h-3 bg-white rounded-full absolute top-1/2 -translate-y-1/2 z-10 shadow-sm transition-transform pointer-events-none ${isCompact ? 'scale-0' : 'scale-0 group-hover/progress:scale-100'}`}
                                            style={{ left: `${(currentTime / (duration || 1)) * 100}%` }}
                                        />
                                    </div>

                                    {/* Control Buttons */}
                                    <div className="flex items-center justify-between text-white">
                                        <div className="flex items-center gap-2 md:gap-4">
                                            <button onClick={togglePlay} className="hover:text-indigo-400 transition-colors">
                                                {isPlaying ? <FaPause size={isCompact ? 10 : 14} /> : <FaPlay size={isCompact ? 10 : 14} />}
                                            </button>
                                            
                                            {!isCompact && (
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => { if(mediaRef.current) mediaRef.current.currentTime -= 10; }} className="hover:text-indigo-400 transition-colors">
                                                        <FaBackward size={12} />
                                                    </button>
                                                    <button onClick={() => { if(mediaRef.current) mediaRef.current.currentTime += 10; }} className="hover:text-indigo-400 transition-colors">
                                                        <FaForward size={12} />
                                                    </button>
                                                </div>
                                            )}

                                            <span className={`${isCompact ? 'text-[10px]' : 'text-xs'} font-mono opacity-80`}>
                                                {formatTime(currentTime)} / {formatTime(duration)}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {/* Extra controls (Download) */}
                                            {mediaUrl && !isCompact && (
                                                <a href={mediaUrl} download target="_blank" rel="noopener noreferrer" className="hover:text-indigo-400 transition-colors">
                                                    <FaDownload size={14} />
                                                </a>
                                            )}
                                            
                                            {/* Full Screen Button */}
                                            <button 
                                                onClick={toggleFullScreen}
                                                className="hover:text-indigo-400 transition-colors"
                                                title={isFullscreen ? "Exit Full Screen" : "Full Screen"}
                                            >
                                                {isFullscreen ? <FaCompress size={isCompact ? 12 : 14} /> : <FaExpand size={isCompact ? 12 : 14} />}
                                            </button>

                                            {/* Expand button for compact mode */}
                                            {isCompact && (
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        // Scroll back to top
                                                        if (scrollRef.current) {
                                                            scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                                                        }
                                                    }}
                                                    className="hover:text-indigo-400 transition-colors"
                                                >
                                                    <FaVideo size={12} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Resize Handle - Only in Compact Mode */}
                                {isCompact && !isFullscreen && (
                                    <div 
                                        onMouseDown={handleResizeStart}
                                        className="absolute bottom-0 right-0 z-40 w-6 h-6 cursor-nwse-resize flex items-end justify-end p-1 opacity-0 group-hover:opacity-100"
                                        title="Drag to resize"
                                    >
                                        <div className="w-2 h-2 border-r-2 border-b-2 border-white/70 rounded-br-sm mb-0.5 mr-0.5"></div>
                                    </div>
                                )}
                             </div>
                        </div>
                    </>
                )}
                
                {groupedTranscript.length > 0 ? (
                    groupedTranscript.map((group, groupIndex) => {
                        const isGroupActive = currentTime >= group.start && currentTime < group.start + 30;
                        return (
                            <div 
                                key={groupIndex} 
                                className={`mb-4 transition-all duration-500 relative group ${groupIndex === 0 ? 'mt-6' : ''} ${isGroupActive ? 'opacity-100 scale-[1.01]' : 'opacity-60 hover:opacity-80'}`}
                            >
                                <div className="text-xs text-gray-500 font-mono mb-2 ml-1">
                                    {formatTime(group.start)} - {formatTime(group.start + 30)}
                                </div>
                                <div 
                                    className={`p-6 rounded-2xl border text-sm md:text-base leading-relaxed md:leading-loose transition-all duration-300 pr-12 ${
                                        isGroupActive 
                                            ? 'bg-indigo-50 dark:bg-orange-900/10 border-indigo-200 dark:border-orange-500/30 text-gray-900 dark:text-gray-100 shadow-[0_0_20px_rgba(79,70,229,0.1)] dark:shadow-[0_0_20px_rgba(194,65,12,0.1)]' 
                                            : 'bg-white dark:bg-[#1a1a1a]/50 border-gray-200 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'
                                    }`}
                                >
                                    {isGroupActive && onDiscuss && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const text = group.words.map(w => w.word).join(' ');
                                                const content = `Context from Speech to Text (${formatTime(group.start)} - ${formatTime(group.start + 30)}): "${text}"`;
                                                onDiscuss(content);
                                            }}
                                            className="absolute top-8 right-4 group/btn flex items-center gap-2 bg-white/90 dark:bg-black/50 text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-200 p-2 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-full transition-all duration-300 shadow-sm border border-indigo-100 dark:border-indigo-500/20"
                                            title="Discuss in Chat"
                                        >
                                            <FaCommentDots />
                                            <span className="max-w-0 overflow-hidden group-hover/btn:max-w-[120px] transition-all duration-300 whitespace-nowrap text-sm font-medium">Discuss with AI</span>
                                        </button>
                                    )}
                                    <div 
                                        className="prose dark:prose-invert max-w-none prose-p:my-0 cursor-pointer"
                                        onClick={() => {
                                            if (mediaRef.current) {
                                                mediaRef.current.currentTime = group.start;
                                                if (!isPlaying) setIsPlaying(true);
                                            }
                                        }}
                                    >
                                        <ReactMarkdown
                                            remarkPlugins={[remarkMath]}
                                            rehypePlugins={[rehypeKatex]}
                                            components={{
                                                p: ({node, ...props}) => <span {...props} />
                                            }}
                                        >
                                            {preprocessLaTeX(group.words.map(w => w.word).join(' '))}
                                        </ReactMarkdown>
                                    </div>
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
