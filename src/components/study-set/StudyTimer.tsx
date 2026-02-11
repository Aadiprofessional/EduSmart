import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FaStopwatch, FaPlay, FaPause, FaRedo, FaHourglassStart, FaTimes, FaExpand, FaCompress, FaExternalLinkAlt, FaGripHorizontal } from 'react-icons/fa';
import { motion, useDragControls } from 'framer-motion';

type TimerMode = 'stopwatch' | 'timer';

interface StudyTimerProps {
    isOpen?: boolean;
    onClose?: () => void;
    isStandalone?: boolean;
}

const StudyTimer: React.FC<StudyTimerProps> = ({ isOpen: externalIsOpen, onClose, isStandalone = false }) => {
    // If externalIsOpen is provided, use it (controlled mode), otherwise use internal state
    const [internalIsOpen, setInternalIsOpen] = useState(false);
    const isVisible = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
    
    const [mode, setMode] = useState<TimerMode>('stopwatch');
    const [time, setTime] = useState(0); // in milliseconds
    const [isActive, setIsActive] = useState(false);
    const [initialTimerTime, setInitialTimerTime] = useState(0); // To track progress for timer
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showCustomInput, setShowCustomInput] = useState(false);
    const [customMinutes, setCustomMinutes] = useState('');
    
    // Portal / External Window State
    const [externalWindow, setExternalWindow] = useState<Window | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const dragControls = useDragControls();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const playAlarm = () => {
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioContextClass) return;
            
            const ctx = new AudioContextClass();
            const now = ctx.currentTime;
            
            // Create a pleasant digital beep sequence (High-Low-High)
            const playTone = (freq: number, startTime: number, duration: number, type: OscillatorType = 'sine') => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                
                osc.connect(gain);
                gain.connect(ctx.destination);
                
                osc.type = type;
                osc.frequency.setValueAtTime(freq, startTime);
                
                // Smooth envelope
                gain.gain.setValueAtTime(0, startTime);
                gain.gain.linearRampToValueAtTime(0.15, startTime + 0.02);
                gain.gain.setValueAtTime(0.15, startTime + duration - 0.02);
                gain.gain.linearRampToValueAtTime(0, startTime + duration);
                
                osc.start(startTime);
                osc.stop(startTime + duration);
            };

            // Play sequence: Beep... Beep... Beep...
            for (let i = 0; i < 4; i++) {
                const start = now + (i * 0.6);
                playTone(880, start, 0.15, 'sine'); // A5
                playTone(1760, start, 0.15, 'triangle'); // A6 (adds some texture)
            }

        } catch (e) {
            console.error("Audio playback failed", e);
        }
    };

    // Update current time every second
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (isActive) {
            intervalRef.current = setInterval(() => {
                setTime((prevTime) => {
                    if (mode === 'timer') {
                        if (prevTime <= 10) {
                            setIsActive(false);
                            playAlarm();
                            return 0;
                        }
                        return prevTime - 10;
                    } else {
                        return prevTime + 10;
                    }
                });
            }, 10);
        } else {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isActive, mode]);

    const formatTime = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const milliseconds = Math.floor((ms % 1000) / 10);

        return {
            minutes: minutes.toString().padStart(2, '0'),
            seconds: seconds.toString().padStart(2, '0'),
            milliseconds: milliseconds.toString().padStart(2, '0')
        };
    };

    const handleStartPause = () => {
        setIsActive(!isActive);
    };

    const handleReset = () => {
        setIsActive(false);
        setTime(mode === 'timer' ? initialTimerTime : 0);
    };

    const setTimer = (minutes: number) => {
        const ms = minutes * 60 * 1000;
        setTime(ms);
        setInitialTimerTime(ms);
        setIsActive(false);
        setMode('timer');
        setShowCustomInput(false);
    };

    const handleCustomSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const mins = parseInt(customMinutes);
        if (!isNaN(mins) && mins > 0) {
            setTimer(mins);
            setCustomMinutes('');
        }
    };

    const handleFullscreen = () => {
        if (externalWindow) {
             // In external window, fullscreen might mean maximizing the window or using API on that doc
             if (!externalWindow.document.fullscreenElement) {
                 externalWindow.document.body.requestFullscreen().catch(err => console.error(err));
                 setIsFullscreen(true);
             } else {
                 externalWindow.document.exitFullscreen();
                 setIsFullscreen(false);
             }
             return;
        }

        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // Listen for fullscreen change events
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        const handleExternalFullscreenChange = () => {
             setIsFullscreen(!!externalWindow?.document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        if (externalWindow) {
            externalWindow.document.addEventListener('fullscreenchange', handleExternalFullscreenChange);
        }
        
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            if (externalWindow) {
                externalWindow.document.removeEventListener('fullscreenchange', handleExternalFullscreenChange);
            }
        };
    }, [externalWindow]);

    const copyStyles = (targetDoc: Document) => {
        Array.from(document.styleSheets).forEach(styleSheet => {
            try {
                if (styleSheet.href) {
                    const link = targetDoc.createElement('link');
                    link.rel = 'stylesheet';
                    link.href = styleSheet.href;
                    targetDoc.head.appendChild(link);
                } else if (styleSheet.cssRules) {
                    const style = targetDoc.createElement('style');
                    Array.from(styleSheet.cssRules).forEach(rule => {
                        style.appendChild(targetDoc.createTextNode(rule.cssText));
                    });
                    targetDoc.head.appendChild(style);
                }
            } catch (e) {
                // Ignore CORS errors for external stylesheets
                console.warn('Could not copy stylesheet:', e);
            }
        });
        
        // Explicitly copy Tailwind base styles if they are in style tags
        Array.from(document.querySelectorAll('style')).forEach(styleNode => {
            targetDoc.head.appendChild(styleNode.cloneNode(true));
        });
    };

    const handleExtract = async () => {
        // 1. Try Document Picture-in-Picture API
        if ('documentPictureInPicture' in window) {
            try {
                const dPip = (window as any).documentPictureInPicture;
                const win = await dPip.requestWindow({
                    width: 400,
                    height: 600
                });

                copyStyles(win.document);
                
                // Add a class to body to ensure dark mode works if applied to body
                if (document.documentElement.classList.contains('dark')) {
                    win.document.documentElement.classList.add('dark');
                }

                // Force full height and no margin
                const style = win.document.createElement('style');
                style.textContent = `
                    html, body { 
                        height: 100%; 
                        margin: 0; 
                        padding: 0; 
                        overflow: hidden; 
                    }
                    #root, .portal-container {
                        height: 100%;
                    }
                `;
                win.document.head.appendChild(style);

                win.addEventListener('pagehide', () => {
                    setExternalWindow(null);
                });

                setExternalWindow(win);
                return;
            } catch (err) {
                console.error("Failed to open PiP window:", err);
            }
        }

        // 2. Fallback to standard popup
        const width = 400;
        const height = 600;
        const left = window.screen.availWidth / 2 - width / 2;
        const top = window.screen.availHeight / 2 - height / 2;
        
        const win = window.open(
            '', 
            'StudyTimerWindow', 
            `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=yes`
        );

        if (win) {
            win.document.write('<!DOCTYPE html><html lang="en"><head><title>Study Timer</title></head><body class="bg-white dark:bg-[#1a1a1a]"></body></html>');
            win.document.close();
            
            copyStyles(win.document);

            if (document.documentElement.classList.contains('dark')) {
                win.document.documentElement.classList.add('dark');
            }

            // Force full height and no margin
            const style = win.document.createElement('style');
            style.textContent = `
                html, body { 
                    height: 100%; 
                    margin: 0; 
                    padding: 0; 
                    overflow: hidden; 
                }
            `;
            win.document.head.appendChild(style);

            // Polling to detect close (more reliable than onbeforeunload for popups in some cases)
            const timer = setInterval(() => {
                if (win.closed) {
                    clearInterval(timer);
                    setExternalWindow(null);
                }
            }, 500);

            win.onbeforeunload = () => {
                setExternalWindow(null);
            };

            setExternalWindow(win);
        }
    };

    const { minutes, seconds, milliseconds } = formatTime(time);

    if (!isVisible && !externalWindow) return null;

    const isFS = isFullscreen;
    const isExt = !!externalWindow;

    const content = (
        <div 
            className={`
                flex flex-col bg-white dark:bg-[#1a1a1a] shadow-2xl border-gray-100 dark:border-white/10
                ${isExt ? 'w-full h-full' : (isFullscreen ? 'w-full h-full rounded-none justify-center' : 'rounded-2xl w-80 sm:w-96 resize-both min-w-[300px] min-h-[400px] border')}
                ${isStandalone ? 'w-full h-full max-w-md max-h-[800px] rounded-2xl' : ''}
            `}
            // Only apply framer motion props if NOT external and NOT fullscreen
            {...(!isExt && !isFullscreen && !isStandalone ? {
                component: motion.div,
                ref: containerRef,
                drag: true,
                dragControls: dragControls,
                dragListener: false,
                dragMomentum: false,
                initial: { opacity: 0, scale: 0.9 },
                animate: { opacity: 1, scale: 1 },
                exit: { opacity: 0, scale: 0.9 },
                style: { pointerEvents: 'auto' }
            } as any : { ref: containerRef })}
        >
            {/* Drag Handle & Header */}
            <div 
                onPointerDown={(e) => {
                    if (!isStandalone && !isFullscreen && !isExt) {
                        dragControls.start(e);
                    }
                }}
                className={`flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5 ${!isStandalone && !isFullscreen && !isExt ? 'cursor-grab active:cursor-grabbing' : ''} flex-shrink-0`}
            >
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <FaGripHorizontal className="opacity-50" />
                    <span className="text-xs font-bold uppercase tracking-wider">Study Timer</span>
                </div>
                
                <div className="flex items-center gap-2">
                     {!isStandalone && !isExt && (
                        <button 
                            onClick={handleExtract}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            title="Open in floating window"
                        >
                            <FaExternalLinkAlt size={12} />
                        </button>
                    )}
                    
                    {!isExt && (
                        <button 
                            onClick={handleFullscreen}
                            className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                        >
                            {isFullscreen ? <FaCompress size={12} /> : <FaExpand size={12} />}
                        </button>
                    )}

                    {!isStandalone && !isExt && onClose && (
                        <button 
                            onClick={onClose}
                            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors ml-1"
                        >
                            <FaTimes size={14} />
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100 dark:border-white/5 flex-shrink-0">
                <button 
                    onClick={() => { setMode('stopwatch'); setIsActive(false); setTime(0); }}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === 'stopwatch' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-white/5' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                >
                    Stopwatch
                </button>
                <button 
                    onClick={() => { setMode('timer'); setIsActive(false); setTime(0); setInitialTimerTime(0); }}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === 'timer' ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-white/5' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
                >
                    Timer
                </button>
            </div>

            {/* Content */}
            <div className={`p-6 flex flex-col items-center flex-1 ${isFS || isExt ? 'justify-center w-full max-w-4xl mx-auto' : ''}`}>
                {/* Current Time Widget */}
                <div className={`mb-6 font-medium text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-white/5 rounded-full ${isFS ? 'text-xl px-6 py-2' : 'text-sm px-4 py-1.5'}`}>
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>

                {/* Digital Display */}
                <div className={`${isFS ? 'text-9xl mb-8' : 'text-6xl mb-2'} font-mono font-bold text-gray-800 dark:text-white tracking-wider tabular-nums transition-all duration-300`}>
                    {minutes}:{seconds}
                    <span className={`${isFS ? 'text-5xl' : 'text-3xl'} text-gray-400 dark:text-gray-600 ml-1 transition-all duration-300`}>.{milliseconds}</span>
                </div>
                
                {/* Mode Label */}
                <div className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-8">
                    {mode === 'timer' && time === 0 && initialTimerTime === 0 ? 'Set Timer' : (isActive ? 'Running' : 'Paused')}
                </div>

                {/* Controls */}
                <div className={`grid grid-cols-[1fr_auto_1fr] items-center w-full max-w-[300px] mb-8 ${isFS ? 'scale-125' : ''}`}>
                    <div className="flex justify-end pr-6">
                        <button 
                            onClick={handleReset}
                            className="p-4 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10 transition-all"
                            title="Reset"
                        >
                            <FaRedo size={20} />
                        </button>
                    </div>
                    
                    <button 
                        onClick={handleStartPause}
                        className={`w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 transition-all transform hover:scale-105 active:scale-95 ${isActive ? 'bg-orange-500 hover:bg-orange-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                        {isActive ? <FaPause size={28} /> : <FaPlay size={28} className="ml-1" />}
                    </button>
                    
                    <div className="flex justify-start pl-6">
                        {/* Spacer for alignment */}
                    </div>
                </div>

                {/* Timer Presets */}
                {mode === 'timer' && (
                    <div className={`w-full pt-6 border-t border-gray-100 dark:border-white/5 ${isFS ? 'max-w-xl' : ''}`}>
                        {showCustomInput ? (
                            <form onSubmit={handleCustomSubmit} className="flex gap-2 w-full">
                                <input
                                    type="number"
                                    value={customMinutes}
                                    onChange={(e) => setCustomMinutes(e.target.value)}
                                    placeholder="Min"
                                    className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 outline-none focus:border-indigo-500 dark:text-white"
                                    autoFocus
                                    min="1"
                                />
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
                                >
                                    Set
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowCustomInput(false)}
                                    className="px-4 py-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                    Cancel
                                </button>
                            </form>
                        ) : (
                            <div className="grid grid-cols-4 gap-2">
                                {[15, 30, 60].map(min => (
                                    <button 
                                        key={min}
                                        onClick={() => setTimer(min)}
                                        className={`rounded-xl font-medium bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors ${isFS ? 'py-4 text-lg' : 'py-2.5 px-2 text-sm'}`}
                                    >
                                        {min}m
                                    </button>
                                ))}
                                <button 
                                    onClick={() => setShowCustomInput(true)}
                                    className={`rounded-xl font-medium bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors ${isFS || isExt ? 'py-4 text-lg' : 'py-2.5 px-2 text-sm'}`}
                                >
                                    Custom
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    if (externalWindow) {
        return createPortal(content, externalWindow.document.body);
    }

    return (
        <div className={`fixed z-[100] ${isStandalone ? 'inset-0 flex items-center justify-center' : 'bottom-auto right-auto top-24 left-1/2'}`} style={isStandalone ? {} : { transform: 'translateX(-50%)', pointerEvents: 'none' }}>
            <motion.div 
                ref={containerRef}
                drag={!isStandalone && !isFullscreen}
                dragControls={dragControls}
                dragListener={false}
                dragMomentum={false}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={{ pointerEvents: 'auto' }}
                className="w-auto h-auto"
            >
                {content}
            </motion.div>
        </div>
    );
};

export default StudyTimer;
