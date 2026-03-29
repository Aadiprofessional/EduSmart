import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
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

// Helper to extract YouTube ID
const getYouTubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

// Native Video Player Component
const NativeVideoPlayer = forwardRef((props: any, ref) => {
    const { url, playing, onProgress, onDuration, onEnded, onPlay, onPause, width, height, className } = props;
    const videoRef = useRef<HTMLVideoElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const youtubeId = getYouTubeId(url);
    const isYouTube = !!youtubeId;
    const playerInterval = useRef<NodeJS.Timeout | null>(null);
    const [ytError, setYtError] = useState<number | null>(null);

    // Expose seekTo method
    useImperativeHandle(ref, () => ({
        seekTo: (seconds: number) => {
            if (isYouTube && iframeRef.current) {
                iframeRef.current.contentWindow?.postMessage(JSON.stringify({
                    event: 'command',
                    func: 'seekTo',
                    args: [seconds, true]
                }), '*');
            } else if (videoRef.current) {
                videoRef.current.currentTime = seconds;
            }
        },
        getCurrentTime: () => {
             return videoRef.current ? videoRef.current.currentTime : 0;
        }
    }));

    // Handle Play/Pause props changes
    useEffect(() => {
        if (isYouTube && iframeRef.current) {
             const command = playing ? 'playVideo' : 'pauseVideo';
             iframeRef.current.contentWindow?.postMessage(JSON.stringify({
                event: 'command',
                func: command,
                args: []
            }), '*');
        } else if (!isYouTube && videoRef.current) {
            if (playing) {
                videoRef.current.play().catch(e => console.error("Native play error:", e));
            } else {
                videoRef.current.pause();
            }
        }
    }, [playing, isYouTube]);

    // Setup YouTube Message Listener AND Polling for Progress
    useEffect(() => {
        if (!isYouTube) return;

        // Listener for YouTube API events
        const handleMessage = (event: MessageEvent) => {
            const allowedOrigins = new Set(["https://www.youtube.com", "https://www.youtube-nocookie.com"]);
            if (!allowedOrigins.has(event.origin)) return;
            try {
                const data = JSON.parse(event.data);
                if (data.event === 'onError') {
                    const code = typeof data.info === 'number' ? data.info : (data.info?.data || data.info?.code);
                    setYtError(code ?? -1);
                    return;
                }
                if (data.event === 'infoDelivery' && data.info) {
                    if (data.info.currentTime && onProgress) {
                        onProgress({ playedSeconds: data.info.currentTime });
                    }
                    if (data.info.duration && onDuration) {
                        onDuration(data.info.duration);
                    }
                    if (data.info.playerState === 0 && onEnded) { // 0 is ended
                        onEnded();
                    }
                    if (data.info.playerState === 1 && onPlay) { // 1 is playing
                        onPlay();
                    }
                    if (data.info.playerState === 2 && onPause) { // 2 is paused
                        onPause();
                    }
                }
            } catch (e) {
                // Ignore parsing errors
            }
        };

        window.addEventListener('message', handleMessage);
        
        // POLL for current time every 500ms
        // This is crucial because YouTube doesn't always push 'infoDelivery' frequently enough for smooth subtitles
        const pollTimer = setInterval(() => {
            if (iframeRef.current && iframeRef.current.contentWindow) {
                // We can't directly read iframe state due to cross-origin,
                // BUT we can assume if the user is playing, we want to know where they are.
                // Actually, standard YouTube Embed API doesn't support "getting" via postMessage easily without the YT.Player wrapper.
                // However, we CAN'T use YT.Player wrapper as per previous instruction to use pure iframe.
                
                // WAIT! 'listening' must be enabled for infoDelivery to be sent automatically.
                // We send a 'listening' event to the iframe.
                iframeRef.current.contentWindow.postMessage(JSON.stringify({
                    event: 'listening',
                    id: youtubeId, // passing channel id or similar might be needed, but usually just JSON is enough
                    channel: 'widget' // often required
                }), '*');
            }
        }, 1000);

        return () => {
            window.removeEventListener('message', handleMessage);
            clearInterval(pollTimer);
        };
    }, [isYouTube, onProgress, onDuration, onEnded, onPlay, onPause, youtubeId]);

    if (isYouTube) {
        const errorText = (() => {
            if (ytError === 101 || ytError === 150) return 'Playback on other websites has been disabled by the video owner.';
            if (ytError === 100) return 'This video is unavailable (removed or private).';
            if (ytError === 5) return 'The HTML5 player encountered an error.';
            if (ytError === 2) return 'The video ID parameter is invalid.';
            if (ytError != null) return 'This video cannot be played here.';
            return null;
        })();
        return (
            <div className={`${className} relative`} style={{ width, height }}>
                <iframe
                    ref={iframeRef}
                    width="100%"
                    height="100%"
                    src={`https://www.youtube-nocookie.com/embed/${youtubeId}?enablejsapi=1&origin=${window.location.origin}&modestbranding=1&rel=0&showinfo=1&controls=1&playsinline=1&iv_load_policy=3`}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    referrerPolicy="origin"
                    style={{ pointerEvents: 'auto' }}
                />
                {errorText && (
                    <div className="absolute inset-0 flex items-center justify-center p-4">
                        <div className="max-w-md w-full bg-black/70 text-white rounded-lg p-4 border border-white/20">
                            <div className="font-semibold mb-2">Video unavailable</div>
                            <div className="text-sm opacity-90 mb-3">{errorText}</div>
                            {youtubeId && (
                                <a
                                    href={`https://www.youtube.com/watch?v=${youtubeId}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center px-3 py-2 bg-white text-black rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
                                >
                                    Open on YouTube
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <video
            ref={videoRef}
            src={url}
            className={`${className} object-contain bg-black`}
            style={{ width, height }}
            controls
            playsInline
            onTimeUpdate={(e) => onProgress && onProgress({ playedSeconds: e.currentTarget.currentTime })}
            onDurationChange={(e) => onDuration && onDuration(e.currentTarget.duration)}
            onEnded={onEnded}
            onPlay={onPlay}
            onPause={onPause}
        />
    );
});

interface Word {
    start: number;
    end: number;
    word: string;
}

interface RawWord {
    start: number | string;
    end: number | string;
    word?: string;
    text?: string;
}

interface AudioMetadata {
    id: number;
    uid: string;
    documentid: string;
    uploaded_at: string;
    duration: number | null;
    language: string | null;
    audio_url: string | null;
    words_data: RawWord[] | null;
    video_url: string | null;
}

// Helper to parse time string "HH:MM:SS" or "MM:SS" to seconds
const parseTime = (time: string | number): number => {
    if (typeof time === 'number') return time;
    if (!time) return 0;
    
    const parts = time.split(':').map(Number);
    if (parts.some(isNaN)) return 0;
    
    if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
    }
    return parts[0] || 0;
};

// Helper to detect YouTube URL
const isYouTubeUrl = (url: string | null) => {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be');
};

interface StudySpeechToTextProps {
    onDiscuss?: (text: string) => void;
    documentType?: string;
}

const StudySpeechToText: React.FC<StudySpeechToTextProps> = ({ onDiscuss, documentType }) => {
    // Cast ReactPlayer to any to avoid type errors with playerVars and ref
    // const VideoPlayer = ReactPlayer as any;
    const VideoPlayer = NativeVideoPlayer;
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
    const reactPlayerRef = useRef<any>(null);
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
                    if (!isMounted) return false;

                    try {
                        const { data, error } = await supabase
                            .from('audio_metadata')
                            .select('*')
                            .eq('documentid', id)
                            .eq('uid', user.id)
                            .order('uploaded_at', { ascending: false })
                            .limit(1)
                            .maybeSingle();

                        if (error) {
                            console.error('Error fetching metadata:', error);
                            return false;
                        }

                        if (data) {
                            // Data found
                            const metadata = data as AudioMetadata;
                            
                            // Determine media URL and type
                            let processedUrl = '';
                            if (metadata.video_url) {
                                processedUrl = metadata.video_url.trim();
                                setMediaUrl(processedUrl);
                                setMediaType('video');
                            } else if (metadata.audio_url) {
                                processedUrl = metadata.audio_url.trim();
                                setMediaUrl(processedUrl);
                                // Force video type if document_type indicates video/youtube or if URL is YouTube
                                if (documentType === 'video' || documentType === 'youtube' || isYouTubeUrl(processedUrl)) {
                                    setMediaType('video');
                                } else {
                                    setMediaType('audio');
                                }
                            }

                            // Set transcript
                            if (metadata.words_data && Array.isArray(metadata.words_data)) {
                                const processedWords: Word[] = metadata.words_data.map((w: RawWord) => ({
                                    start: parseTime(w.start),
                                    end: parseTime(w.end),
                                    word: w.text || w.word || ''
                                }));
                                setTranscript(processedWords);
                            }

                            // Set duration if available
                            if (metadata.duration) {
                                setDuration(metadata.duration);
                            }

                            setLoading(false);
                            setIsPolling(false);
                            return true; // Stop polling
                        }
                    } catch (err) {
                        console.error("Error in fetchMetadata:", err);
                    }
                    
                    // Keep polling
                    setIsPolling(true);
                    return false;
                };

                // Initial fetch
                const done = await fetchMetadata();
                if (!done) {
                    pollInterval = setInterval(async () => {
                        if (!isMounted) {
                            clearInterval(pollInterval);
                            return;
                        }
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
        if (mediaType === 'audio' && mediaRef.current) {
            const media = mediaRef.current;
            if (isPlaying) {
                const playPromise = media.play();
                if (playPromise !== undefined) {
                    playPromise.catch(error => {
                        // Ignore AbortError which happens when pause() is called while play() is pending
                        if (error.name !== 'AbortError') {
                            console.error("Play error:", error);
                        }
                    });
                }
            } else {
                media.pause();
            }
        }
    }, [isPlaying, mediaType]);

    const togglePlay = () => setIsPlaying(!isPlaying);

    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return "0:00";
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const newTime = percent * duration;
        
        setCurrentTime(newTime);

        if (mediaType === 'video' && reactPlayerRef.current) {
            reactPlayerRef.current.seekTo(newTime);
            // Ensure we play after seeking
            if (!isPlaying) setIsPlaying(true);
        } else if (mediaRef.current) {
            mediaRef.current.currentTime = newTime;
        }
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

    const handleSummarizeVideoToChat = () => {
        if (!onDiscuss || groupedTranscript.length === 0) return;
        const transcriptWithTimestamps = groupedTranscript
            .map((group) => `[${formatTime(group.start)} - ${formatTime(group.start + 30)}] ${group.words.map((word) => word.word).join('')}`)
            .join('\n\n');
        const maxLength = 12000;
        const clippedTranscript = transcriptWithTimestamps.length > maxLength
            ? `${transcriptWithTimestamps.slice(0, maxLength)}...`
            : transcriptWithTimestamps;
        const content = `Please summarize this video transcript. Include the main points, key takeaways, and a short timeline.\n\n${clippedTranscript}`;
        onDiscuss(content);
    };

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
        
        const isYouTube = mediaUrl ? isYouTubeUrl(mediaUrl) : false;

        // Find all matching segments
        const matches = transcript.filter(w => currentTime >= w.start && currentTime <= w.end);
        
        // If multiple match, pick the one that started most recently (handles overlaps)
        const currentWord = matches.length > 0 
            ? matches.reduce((prev, current) => (prev.start > current.start) ? prev : current)
            : undefined;
        
        // Check if the current segment is a phrase (contains spaces) or if it's YouTube
        // If so, we treat it as a complete line/sentence and show it as-is.
        const isPhrase = currentWord && currentWord.word.trim().includes(' ');

        if (isYouTube || isPhrase) {
            return currentWord ? [currentWord] : null;
        }

        // For standard word-level timestamps, use smart expansion logic
        // Find center index
        let centerIndex = -1;
        if (currentWord) {
            centerIndex = transcript.findIndex(w => w === currentWord);
        } else {
            // Find closest previous word
            centerIndex = transcript.findIndex(w => w.start > currentTime) - 1;
            // Handle edge cases
            if (centerIndex === -2) centerIndex = transcript.length - 1; // currentTime > all starts
            if (centerIndex === -1) centerIndex = 0; // currentTime < all starts
        }

        if (centerIndex !== -1 && transcript[centerIndex]) {
            // Smart expansion based on character count to keep it strictly to 1 line
            // Target roughly 40 characters for a single line on most devices
            const MAX_CHARS = 40; 
            let start = centerIndex;
            let end = centerIndex;
            let currentChars = transcript[centerIndex].word.length;

            // Expand outwards
            while (currentChars < MAX_CHARS) {
                let added = false;
                
                // Try adding left
                if (start > 0) {
                    const prevWord = transcript[start - 1];
                    if (currentChars + prevWord.word.length <= MAX_CHARS) {
                        start--;
                        currentChars += prevWord.word.length;
                        added = true;
                    }
                }
                
                // Try adding right
                if (end < transcript.length - 1) {
                    const nextWord = transcript[end + 1];
                    if (currentChars + nextWord.word.length <= MAX_CHARS) {
                        end++;
                        currentChars += nextWord.word.length;
                        added = true;
                    }
                }

                if (!added) break;
            }

            return transcript.slice(start, end + 1);
        }
        
        return null;
    }, [currentTime, transcript, mediaUrl]);

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
                                            setCurrentTime(newTime);
                                            if (mediaRef.current) {
                                                mediaRef.current.currentTime = newTime;
                                            }
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
                                            setCurrentTime(newTime);
                                            if (mediaRef.current) {
                                                mediaRef.current.currentTime = newTime;
                                            }
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
                className={`flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-800 scrollbar-track-transparent px-4 md:px-8 pb-8 transition-all duration-300 overscroll-contain ${
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
                                        className="absolute top-2 left-2 z-30 p-2 bg-black/50 text-white rounded-full cursor-move hover:bg-indigo-600 transition-colors opacity-0 group-hover:opacity-100 backdrop-blur-sm pointer-events-auto"
                                        title="Drag to move"
                                    >
                                        <FaArrowsAlt size={12} />
                                    </div>
                                )}

                                    <div className="w-full h-full bg-black relative z-20" style={{ pointerEvents: 'auto' }}>
                                        <VideoPlayer
                                            ref={reactPlayerRef}
                                            url={mediaUrl!}
                                            playing={isPlaying}
                                            width="100%"
                                            height="100%"
                                            className="react-player"
                                            onProgress={(state: any) => {
                                                if (!isDragging.current && !isResizing.current) {
                                                    setCurrentTime(state.playedSeconds);
                                                }
                                            }}
                                            onDuration={(d: number) => setDuration(d)}
                                            onEnded={() => setIsPlaying(false)}
                                            onPlay={() => setIsPlaying(true)}
                                            onPause={() => setIsPlaying(false)}
                                        />
                                    </div>
                                

                                {/* Subtitles Overlay */}
                                {currentSubtitle && (
                                    <div className={`absolute left-0 right-0 text-center pointer-events-none z-40 ${isCompact ? 'bottom-12 px-2' : 'bottom-16 px-4'}`}>
                                        <div className="inline-flex flex-wrap justify-center gap-0 bg-black/60 px-3 py-1.5 rounded-lg backdrop-blur-sm shadow-sm">
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

                                {/* Compact Mode Controls Overlay */}
                                {isCompact && (
                                    <div className="absolute top-2 right-2 z-30 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (scrollRef.current) {
                                                    scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                                                }
                                            }}
                                            className="p-2 bg-black/50 text-white rounded-full hover:bg-indigo-600 transition-colors backdrop-blur-sm"
                                            title="Expand View"
                                        >
                                            <FaVideo size={12} />
                                        </button>
                                    </div>
                                )}

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
                                                const text = group.words.map(w => w.word).join('');
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
                                            if (mediaType === 'video' && reactPlayerRef.current) {
                                                reactPlayerRef.current.seekTo(group.start);
                                                if (!isPlaying) setIsPlaying(true);
                                            } else if (mediaRef.current) {
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
                                            {preprocessLaTeX(group.words.map(w => w.word).join(''))}
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
            {mediaType === 'video' && onDiscuss && groupedTranscript.length > 0 && (
                <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none z-30">
                    <div className="pointer-events-auto">
                        <button
                            onClick={handleSummarizeVideoToChat}
                            className="px-4 py-2 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 rounded-full shadow-lg transition-all flex items-center gap-2 hover:scale-105 active:scale-95"
                        >
                            <FaVideo size={14} />
                            <span className="text-sm font-medium">Summarize Video</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudySpeechToText;
