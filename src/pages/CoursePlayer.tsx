import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../utils/AuthContext';
import { 
  FaPlay, 
  FaPause, 
  FaVolumeUp, 
  FaVolumeMute,
  FaExpand, 
  FaCompress,
  FaForward,
  FaBackward,
  FaCog,
  FaClosedCaptioning,
  FaChevronLeft, 
  FaChevronRight,
  FaBookOpen,
  FaVideo,
  FaFileAlt,
  FaQuestionCircle,
  FaDownload,
  FaCheck,
  FaClock,
  FaPlayCircle,
  FaUsers,
  FaStar,
  FaChevronDown,
  FaChevronUp,
  FaLock,
  FaBookmark,
  FaShare,
  FaTimes,
  FaBrain,
  FaLightbulb,
  FaStickyNote,
  FaRobot,
  FaEye,
  FaComments,
  FaSearch,
  FaFilter,
  FaMicrophone,
  FaKeyboard,
  FaGraduationCap,
  FaTrophy,
  FaFire,
  FaMagic,
  FaAtom,
  FaRocket,
  FaExclamationTriangle
} from 'react-icons/fa';
import IconWrapper from '../components/IconWrapper';

const API_BASE = 'http://localhost:8000/api/v2';

interface Course {
  id: string;
  title: string;
  instructor_name: string;
  total_sections: number;
  total_lectures: number;
}

interface CourseSection {
  id: string;
  title: string;
  section_order: number;
  course_lectures: CourseLecture[];
}

interface CourseLecture {
  id: string;
  title: string;
  description?: string;
  lecture_type: 'video' | 'article' | 'quiz' | 'assignment' | 'resource';
  video_url?: string;
  video_duration_seconds?: number;
  article_content?: string;
  resource_url?: string;
  lecture_order: number;
  is_preview: boolean;
  is_free: boolean;
}

interface LectureProgress {
  lecture_id: string;
  progress_percentage: number;
  completed: boolean;
  last_watched_position?: number;
}

interface AIInsight {
  id: string;
  type: 'summary' | 'question' | 'tip' | 'concept';
  content: string;
  timestamp?: number;
  confidence: number;
}

interface Note {
  id: string;
  content: string;
  timestamp: number;
  lecture_id: string;
  created_at: string;
}

const CoursePlayer: React.FC = () => {
  const { courseId, lectureId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  
  // State management
  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [currentLecture, setCurrentLecture] = useState<CourseLecture | null>(null);
  const [lectureProgress, setLectureProgress] = useState<LectureProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Video player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  
  // UI state
  const [showSidebar, setShowSidebar] = useState(true);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'notes' | 'ai' | 'discussion'>('content');
  const [showSettings, setShowSettings] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  
  // AI and notes state
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (courseId) {
      fetchCourseContent();
    }
  }, [courseId]);

  useEffect(() => {
    if (lectureId && sections.length > 0) {
      findAndSetCurrentLecture(lectureId);
    }
  }, [lectureId, sections]);

  useEffect(() => {
    // Auto-hide controls after 3 seconds of inactivity
    let timeout: NodeJS.Timeout;
    if (isPlaying && showControls) {
      timeout = setTimeout(() => setShowControls(false), 3000);
    }
    return () => clearTimeout(timeout);
  }, [isPlaying, showControls]);

  useEffect(() => {
    // Generate AI insights when lecture changes
    if (currentLecture) {
      generateAIInsights();
    }
  }, [currentLecture]);

  const fetchCourseContent = async (retryCount = 0): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('=== CoursePlayer fetchCourseContent DEBUG ===');
      console.log('Course ID:', courseId);
      console.log('User ID:', user?.id);
      console.log('Retry count:', retryCount);
      
      // Fetch course details and sections
      const sectionsUrl = `${API_BASE}/courses/${courseId}/sections?uid=${user?.id}`;
      console.log('Fetching from:', sectionsUrl);
      
      const response = await fetch(sectionsUrl);
      const data = await response.json();
      
      console.log('API Response:', data);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        console.error('API request failed:', response.status, data);
        
        // If 403 and this is the first attempt, try to verify enrollment and retry
        if (response.status === 403 && retryCount < 2) {
          console.log('403 error, checking enrollment status...');
          
          const enrollmentCheckUrl = `${API_BASE}/courses/${courseId}/enrollment/${user?.id}`;
          const enrollmentResponse = await fetch(enrollmentCheckUrl);
          const enrollmentData = await enrollmentResponse.json();
          
          console.log('Enrollment check:', enrollmentData);
          
          if (enrollmentData.success && enrollmentData.data?.enrolled) {
            console.log('User is enrolled, retrying in 1 second...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            return fetchCourseContent(retryCount + 1);
          }
        }
        
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }
      
      if (data.success && data.data) {
        console.log('✅ Course content fetched successfully');
        
        // Set course info
        if (data.data.course) {
          setCourse(data.data.course);
        }
        
        // Set sections
        if (data.data.sections && Array.isArray(data.data.sections)) {
          setSections(data.data.sections);
          
          // Auto-expand first section
          if (data.data.sections.length > 0) {
            setExpandedSections([data.data.sections[0].id]);
          }
          
          // Set current lecture if not already set
          if (!currentLecture && lectureId) {
            findAndSetCurrentLecture(lectureId);
          }
        }
        
        // Set progress
        if (data.data.progress && Array.isArray(data.data.progress)) {
          setLectureProgress(data.data.progress);
        }
        
        console.log('Course data set:', {
          course: data.data.course?.title,
          sectionsCount: data.data.sections?.length || 0,
          progressCount: data.data.progress?.length || 0
        });
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error: any) {
      console.error('❌ Error fetching course content:', error);
      
      if (retryCount < 2) {
        console.log(`Retrying fetch (attempt ${retryCount + 1})...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return fetchCourseContent(retryCount + 1);
      }
      
      setError(error.message || 'Failed to load course content');
    } finally {
      setLoading(false);
    }
  };

  const findAndSetCurrentLecture = (lectureId: string) => {
    for (const section of sections) {
      const lecture = section.course_lectures.find(l => l.id === lectureId);
      if (lecture) {
        setCurrentLecture(lecture);
        break;
      }
    }
  };

  const getCurrentProgress = (): LectureProgress | undefined => {
    return currentLecture ? lectureProgress.find(p => p.lecture_id === currentLecture.id) : undefined;
  };

  const updateProgress = async (lectureId: string, progressPercentage: number, watchedPosition?: number) => {
    if (!user?.id) return;

    try {
      const response = await fetch(`${API_BASE}/courses/${courseId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          lectureId,
          progressPercentage,
          watchedPosition,
          completed: progressPercentage >= 90
        }),
      });

      if (response.ok) {
        // Update local progress state
        setLectureProgress(prev => {
          const existing = prev.find(p => p.lecture_id === lectureId);
          if (existing) {
            return prev.map(p => 
              p.lecture_id === lectureId 
                ? { ...p, progress_percentage: progressPercentage, last_watched_position: watchedPosition, completed: progressPercentage >= 90 }
                : p
            );
          } else {
            return [...prev, { lecture_id: lectureId, progress_percentage: progressPercentage, completed: progressPercentage >= 90, last_watched_position: watchedPosition }];
          }
        });
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const generateAIInsights = async () => {
    if (!currentLecture) return;
    
    // Simulate AI insights generation
    const insights: AIInsight[] = [
      {
        id: '1',
        type: 'summary',
        content: `This lecture covers ${currentLecture.title}. Key concepts include fundamental principles and practical applications.`,
        confidence: 0.95
      },
      {
        id: '2',
        type: 'tip',
        content: 'Pro tip: Take notes at key moments to better retain the information presented in this section.',
        confidence: 0.88
      },
      {
        id: '3',
        type: 'question',
        content: 'Consider: How does this concept relate to what you learned in the previous lecture?',
        confidence: 0.92
      }
    ];
    
    setAiInsights(insights);
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current && currentLecture) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setCurrentTime(current);
      
      if (total > 0) {
        const progressPercentage = (current / total) * 100;
        updateProgress(currentLecture.id, progressPercentage, current);
      }
    }
  };

  const handleVideoEnded = () => {
    if (currentLecture) {
      updateProgress(currentLecture.id, 100);
      setIsPlaying(false);
      // Auto-advance to next lecture
      goToNextLecture();
    }
  };

  const goToNextLecture = () => {
    if (!currentLecture) return;
    
    let found = false;
    let nextLecture: CourseLecture | null = null;
    
    for (const section of sections) {
      for (const lecture of section.course_lectures) {
        if (found) {
          nextLecture = lecture;
          break;
        }
        if (lecture.id === currentLecture.id) {
          found = true;
        }
      }
      if (nextLecture) break;
    }
    
    if (nextLecture) {
      navigate(`/learn/${courseId}/${nextLecture.id}`);
    }
  };

  const goToPreviousLecture = () => {
    if (!currentLecture) return;
    
    let previousLecture: CourseLecture | null = null;
    
    for (const section of sections) {
      for (const lecture of section.course_lectures) {
        if (lecture.id === currentLecture.id) {
          break;
        }
        previousLecture = lecture;
      }
    }
    
    if (previousLecture) {
      navigate(`/learn/${courseId}/${previousLecture.id}`);
    }
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerContainerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const addBookmark = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setBookmarks(prev => [...prev, time]);
    }
  };

  const addNote = () => {
    if (!newNote.trim() || !currentLecture) return;
    
    const note: Note = {
      id: Date.now().toString(),
      content: newNote,
      timestamp: currentTime,
      lecture_id: currentLecture.id,
      created_at: new Date().toISOString()
    };
    
    setNotes(prev => [...prev, note]);
    setNewNote('');
  };

  const renderVideoPlayer = () => {
    if (!currentLecture || currentLecture.lecture_type !== 'video') return null;

    return (
      <div 
        ref={playerContainerRef}
        className="relative bg-black rounded-2xl overflow-hidden group"
        onMouseMove={() => setShowControls(true)}
        onMouseLeave={() => !isPlaying || setShowControls(false)}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          src={currentLecture.video_url}
          className="w-full h-full object-contain"
          onTimeUpdate={handleVideoTimeUpdate}
          onEnded={handleVideoEnded}
          onLoadedMetadata={() => {
            if (videoRef.current) {
              setDuration(videoRef.current.duration);
              const progress = getCurrentProgress();
              if (progress?.last_watched_position) {
                videoRef.current.currentTime = progress.last_watched_position;
              }
            }
          }}
          onWaiting={() => setIsBuffering(true)}
          onCanPlay={() => setIsBuffering(false)}
        />

        {/* Loading Overlay */}
        {(loading || isBuffering) && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="flex items-center gap-3 text-white">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-lg font-medium">Loading...</span>
            </div>
          </div>
        )}

        {/* AI Insights Overlay */}
        <AnimatePresence>
          {aiInsights.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-4 right-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 rounded-xl shadow-lg max-w-sm"
            >
              <div className="flex items-center gap-2 mb-2">
                <IconWrapper icon={FaBrain} className="text-yellow-300" />
                <span className="font-semibold">AI Insight</span>
              </div>
              <p className="text-sm">{aiInsights[0]?.content}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Video Controls */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"
            >
              {/* Top Controls */}
              <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate(`/courses/${courseId}`)}
                    className="p-2 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors"
                  >
                    <IconWrapper icon={FaChevronLeft} />
                  </button>
                  <div className="text-white">
                    <h3 className="font-semibold">{currentLecture.title}</h3>
                    <p className="text-sm opacity-80">{course?.title}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={addBookmark}
                    className="p-2 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors"
                  >
                    <IconWrapper icon={FaBookmark} />
                  </button>
                  <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-2 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors"
                  >
                    <IconWrapper icon={FaCog} />
                  </button>
                </div>
              </div>

              {/* Center Play Button */}
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    onClick={togglePlayPause}
                    className="w-20 h-20 bg-white/20 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <IconWrapper icon={FaPlay} size={32} className="ml-1" />
                  </button>
                </div>
              )}

              {/* Bottom Controls */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="relative h-2 bg-white/20 rounded-full cursor-pointer group">
                    <div
                      className="absolute h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all"
                      style={{ width: `${(currentTime / duration) * 100}%` }}
                    />
                    <input
                      type="range"
                      min="0"
                      max={duration}
                      value={currentTime}
                      onChange={(e) => handleSeek(Number(e.target.value))}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    
                    {/* Bookmarks */}
                    {bookmarks.map((bookmark, index) => (
                      <div
                        key={index}
                        className="absolute top-0 w-1 h-full bg-yellow-400 rounded-full"
                        style={{ left: `${(bookmark / duration) * 100}%` }}
                      />
                    ))}
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={togglePlayPause}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <IconWrapper icon={isPlaying ? FaPause : FaPlay} size={20} />
                    </button>
                    
                    <button
                      onClick={goToPreviousLecture}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <IconWrapper icon={FaBackward} />
                    </button>
                    
                    <button
                      onClick={goToNextLecture}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <IconWrapper icon={FaForward} />
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsMuted(!isMuted)}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                      >
                        <IconWrapper icon={isMuted ? FaVolumeMute : FaVolumeUp} />
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => {
                          const newVolume = Number(e.target.value);
                          setVolume(newVolume);
                          setIsMuted(newVolume === 0);
                          if (videoRef.current) {
                            videoRef.current.volume = newVolume;
                          }
                        }}
                        className="w-20"
                      />
                    </div>

                    <span className="text-sm">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <select
                      value={playbackRate}
                      onChange={(e) => {
                        const rate = Number(e.target.value);
                        setPlaybackRate(rate);
                        if (videoRef.current) {
                          videoRef.current.playbackRate = rate;
                        }
                      }}
                      className="bg-black/50 text-white rounded px-2 py-1 text-sm"
                    >
                      <option value={0.5}>0.5x</option>
                      <option value={0.75}>0.75x</option>
                      <option value={1}>Normal</option>
                      <option value={1.25}>1.25x</option>
                      <option value={1.5}>1.5x</option>
                      <option value={2}>2x</option>
                    </select>

                    <button
                      onClick={() => setShowTranscript(!showTranscript)}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <IconWrapper icon={FaClosedCaptioning} />
                    </button>

                    <button
                      onClick={toggleFullscreen}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <IconWrapper icon={isFullscreen ? FaCompress : FaExpand} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className="absolute top-16 right-4 bg-gray-900 text-white rounded-xl p-4 shadow-2xl min-w-64"
            >
              <h4 className="font-semibold mb-3">Video Settings</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm mb-1">Quality</label>
                  <select className="w-full bg-gray-800 rounded px-3 py-2 text-sm">
                    <option>Auto (720p)</option>
                    <option>1080p</option>
                    <option>720p</option>
                    <option>480p</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1">Playback Speed</label>
                  <select 
                    value={playbackRate}
                    onChange={(e) => setPlaybackRate(Number(e.target.value))}
                    className="w-full bg-gray-800 rounded px-3 py-2 text-sm"
                  >
                    <option value={0.5}>0.5x</option>
                    <option value={0.75}>0.75x</option>
                    <option value={1}>Normal</option>
                    <option value={1.25}>1.25x</option>
                    <option value={1.5}>1.5x</option>
                    <option value={2}>2x</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderArticleContent = () => {
    if (!currentLecture?.article_content) return null;

    return (
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl overflow-hidden">
        {/* Article Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <IconWrapper icon={FaFileAlt} size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{currentLecture.title}</h2>
                <p className="text-blue-100">Article • {Math.ceil(currentLecture.article_content.length / 1000)} min read</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                <IconWrapper icon={FaBookmark} />
              </button>
              <button className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors">
                <IconWrapper icon={FaShare} />
              </button>
            </div>
          </div>
        </div>

        {/* Article Content */}
        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            {/* Reading Progress */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Reading Progress</span>
                <span>0%</span>
              </div>
              <div className="h-1 bg-gray-200 rounded-full">
                <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full w-0 transition-all"></div>
              </div>
            </div>

            {/* AI Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-4 mb-6"
            >
              <div className="flex items-center gap-2 mb-2">
                <IconWrapper icon={FaBrain} className="text-purple-600" />
                <span className="font-semibold text-purple-800">AI Summary</span>
              </div>
              <p className="text-gray-700 text-sm">
                This article covers key concepts in {currentLecture.title}. The main topics include fundamental principles, 
                practical applications, and real-world examples to help you understand the subject matter.
              </p>
            </motion.div>

            {/* Article Body */}
            <div 
              className="prose prose-lg max-w-none text-gray-800 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: currentLecture.article_content }}
            />

            {/* Article Actions */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                    <IconWrapper icon={FaCheck} />
                    Mark as Complete
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
                    <IconWrapper icon={FaStickyNote} />
                    Add Note
                  </button>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={goToPreviousLecture}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <IconWrapper icon={FaChevronLeft} />
                    Previous
                  </button>
                  <button
                    onClick={goToNextLecture}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                  >
                    Next
                    <IconWrapper icon={FaChevronRight} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderCourseSidebar = () => (
    <div className={`bg-gradient-to-b from-gray-900 to-gray-800 text-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
      sidebarCollapsed ? 'w-16' : 'w-96'
    }`}>
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <IconWrapper icon={FaGraduationCap} size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{course?.title}</h3>
                  <p className="text-sm text-gray-400">{course?.instructor_name}</p>
                </div>
              </div>
              
              {/* Progress Overview */}
              <div className="bg-gray-800 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-300">Course Progress</span>
                  <span className="text-sm font-semibold text-green-400">
                    {Math.round((lectureProgress.filter(p => p.completed).length / (course?.total_lectures || 1)) * 100)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full">
                  <div 
                    className="h-full bg-gradient-to-r from-green-400 to-blue-500 rounded-full transition-all"
                    style={{ width: `${(lectureProgress.filter(p => p.completed).length / (course?.total_lectures || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}
          
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <IconWrapper icon={sidebarCollapsed ? FaChevronRight : FaChevronLeft} />
          </button>
        </div>
      </div>

      {!sidebarCollapsed && (
        <>
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-700">
            {[
              { id: 'content', label: 'Content', icon: FaVideo },
              { id: 'notes', label: 'Notes', icon: FaStickyNote },
              { id: 'ai', label: 'AI', icon: FaBrain },
              { id: 'discussion', label: 'Q&A', icon: FaComments }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'content' | 'notes' | 'ai' | 'discussion')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <IconWrapper icon={tab.icon} size={14} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'content' && (
              <div className="h-96 overflow-y-auto">
                {/* Search */}
                <div className="p-4 border-b border-gray-700">
                  <div className="relative">
                    <IconWrapper icon={FaSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                    <input
                      type="text"
                      placeholder="Search lectures..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Course Sections */}
                <div className="space-y-2 p-2">
                  {sections.map((section) => (
                    <div key={section.id} className="border border-gray-700 rounded-xl overflow-hidden">
                      <button
                        onClick={() => {
                          setExpandedSections(prev => 
                            prev.includes(section.id) 
                              ? prev.filter(id => id !== section.id)
                              : [...prev, section.id]
                          );
                        }}
                        className="w-full p-4 bg-gray-800 hover:bg-gray-700 transition-colors flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            {section.section_order}
                          </div>
                          <div className="text-left">
                            <h4 className="font-semibold text-white">{section.title}</h4>
                            <p className="text-sm text-gray-400">{section.course_lectures.length} lectures</p>
                          </div>
                        </div>
                        <IconWrapper 
                          icon={expandedSections.includes(section.id) ? FaChevronUp : FaChevronDown} 
                          className={`transform transition-transform ${
                            expandedSections.includes(section.id) ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      
                      <AnimatePresence>
                        {expandedSections.includes(section.id) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="p-2 space-y-1">
                              {section.course_lectures.map((lecture) => {
                                const progress = lectureProgress.find(p => p.lecture_id === lecture.id);
                                const isActive = currentLecture?.id === lecture.id;
                                
                                return (
                                  <button
                                    key={lecture.id}
                                    onClick={() => navigate(`/learn/${courseId}/${lecture.id}`)}
                                    className={`w-full p-3 rounded-lg transition-all flex items-center gap-3 ${
                                      isActive 
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                                        : 'hover:bg-gray-700 text-gray-300'
                                    }`}
                                  >
                                    <div className="flex-shrink-0">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                        progress?.completed 
                                          ? 'bg-green-500 text-white' 
                                          : isActive
                                            ? 'bg-white/20 text-white'
                                            : 'bg-gray-600 text-gray-400'
                                      }`}>
                                        {progress?.completed ? (
                                          <IconWrapper icon={FaCheck} size={12} />
                                        ) : lecture.lecture_type === 'video' ? (
                                          <IconWrapper icon={FaPlay} size={12} />
                                        ) : lecture.lecture_type === 'article' ? (
                                          <IconWrapper icon={FaFileAlt} size={12} />
                                        ) : (
                                          <IconWrapper icon={FaQuestionCircle} size={12} />
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="flex-1 min-w-0 text-left">
                                      <p className="font-medium truncate">{lecture.title}</p>
                                      <div className="flex items-center gap-2 mt-1">
                                        {lecture.video_duration_seconds && (
                                          <span className="text-xs opacity-70">
                                            {formatTime(lecture.video_duration_seconds)}
                                          </span>
                                        )}
                                        {lecture.is_preview && (
                                          <span className="text-xs bg-blue-500 px-2 py-0.5 rounded">
                                            Preview
                                          </span>
                                        )}
                                        {progress && !progress.completed && progress.progress_percentage > 0 && (
                                          <div className="flex items-center gap-1">
                                            <div className="w-12 h-1 bg-gray-600 rounded-full">
                                              <div 
                                                className="h-full bg-blue-400 rounded-full"
                                                style={{ width: `${progress.progress_percentage}%` }}
                                              />
                                            </div>
                                            <span className="text-xs opacity-70">
                                              {Math.round(progress.progress_percentage)}%
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="h-96 flex flex-col">
                {/* Add Note */}
                <div className="p-4 border-b border-gray-700">
                  <div className="space-y-3">
                    <textarea
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      placeholder="Add a note at current timestamp..."
                      className="w-full h-20 p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={addNote}
                      disabled={!newNote.trim()}
                      className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Add Note
                    </button>
                  </div>
                </div>

                {/* Notes List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {notes.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <IconWrapper icon={FaStickyNote} size={32} className="mx-auto mb-2 opacity-50" />
                      <p>No notes yet</p>
                      <p className="text-sm">Add notes to remember key points</p>
                    </div>
                  ) : (
                    notes.map((note) => (
                      <div key={note.id} className="bg-gray-800 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-blue-400 font-medium">
                            {formatTime(note.timestamp)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(note.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-200 text-sm">{note.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="h-96 flex flex-col">
                {/* AI Chat Header */}
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <IconWrapper icon={FaRobot} size={16} />
                    </div>
                    <div>
                      <h4 className="font-semibold">AI Learning Assistant</h4>
                      <p className="text-xs text-gray-400">Ask questions about this lecture</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aiQuestion}
                      onChange={(e) => setAiQuestion(e.target.value)}
                      placeholder="Ask AI about this topic..."
                      className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <button className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                      <IconWrapper icon={FaRocket} size={14} />
                    </button>
                  </div>
                </div>

                {/* AI Insights */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {aiInsights.map((insight) => (
                    <motion.div
                      key={insight.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 rounded-lg ${
                        insight.type === 'summary' ? 'bg-blue-900/50 border border-blue-700' :
                        insight.type === 'tip' ? 'bg-green-900/50 border border-green-700' :
                        insight.type === 'question' ? 'bg-purple-900/50 border border-purple-700' :
                        'bg-gray-800 border border-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <IconWrapper 
                          icon={
                            insight.type === 'summary' ? FaAtom :
                            insight.type === 'tip' ? FaLightbulb :
                            insight.type === 'question' ? FaQuestionCircle :
                            FaMagic
                          } 
                          size={14}
                          className={
                            insight.type === 'summary' ? 'text-blue-400' :
                            insight.type === 'tip' ? 'text-green-400' :
                            insight.type === 'question' ? 'text-purple-400' :
                            'text-gray-400'
                          }
                        />
                        <span className="text-xs font-semibold uppercase tracking-wide">
                          {insight.type}
                        </span>
                        <div className="ml-auto flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-xs text-gray-400">
                            {Math.round(insight.confidence * 100)}%
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-200">{insight.content}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'discussion' && (
              <div className="h-96 flex flex-col">
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <IconWrapper icon={FaComments} size={32} className="mx-auto mb-2 opacity-50" />
                    <p>Discussion feature</p>
                    <p className="text-sm">Coming soon...</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center text-white"
        >
          <div className="relative mb-8">
            <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-purple-500 border-b-transparent rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <h3 className="text-2xl font-bold mb-2">Loading Course Content</h3>
          <p className="text-blue-200">Preparing your learning experience...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-gray-900 to-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-white max-w-md"
        >
          <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <IconWrapper icon={FaExclamationTriangle} size={32} />
          </div>
          <h3 className="text-2xl font-bold mb-4">Oops! Something went wrong</h3>
          <p className="text-red-200 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => fetchCourseContent()}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/courses')}
              className="w-full px-6 py-3 border border-gray-600 text-gray-300 rounded-xl font-semibold hover:bg-gray-800 transition-colors"
            >
              Back to Courses
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!currentLecture) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-white max-w-md"
        >
          <div className="w-20 h-20 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <IconWrapper icon={FaSearch} size={32} />
          </div>
          <h3 className="text-2xl font-bold mb-4">Lecture Not Found</h3>
          <p className="text-gray-300 mb-6">The requested lecture could not be found or you don't have access to it.</p>
          <button
            onClick={() => navigate('/courses')}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Back to Courses
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/courses')}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <IconWrapper icon={FaChevronLeft} size={20} />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <IconWrapper icon={FaGraduationCap} className="text-white" size={20} />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">{course?.title}</h1>
                  <p className="text-sm text-gray-400">by {course?.instructor_name}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Progress Indicator */}
              <div className="hidden md:flex items-center gap-2 text-sm text-gray-400">
                <IconWrapper icon={FaTrophy} className="text-yellow-500" />
                <span>
                  {lectureProgress.filter(p => p.completed).length} / {course?.total_lectures || 0} completed
                </span>
              </div>

              {/* Settings */}
              <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
                <IconWrapper icon={FaCog} size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6 h-[calc(100vh-140px)]">
          {/* Course Sidebar */}
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {renderCourseSidebar()}
          </motion.div>
          
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="flex-1"
            >
              {/* Video Player or Article Content */}
              <div className="h-full">
                {currentLecture.lecture_type === 'video' ? (
                  <div className="h-full flex flex-col">
                    <div className="flex-1 min-h-0">
                      {renderVideoPlayer()}
                    </div>
                    
                    {/* Lecture Info */}
                    <div className="mt-4 bg-gray-800 rounded-2xl p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h2 className="text-2xl font-bold text-white mb-2">{currentLecture.title}</h2>
                          {currentLecture.description && (
                            <p className="text-gray-300 mb-4">{currentLecture.description}</p>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <div className="flex items-center gap-1">
                              <IconWrapper icon={FaClock} />
                              <span>{currentLecture.video_duration_seconds ? formatTime(currentLecture.video_duration_seconds) : 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <IconWrapper icon={FaEye} />
                              <span>1,234 views</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <IconWrapper icon={FaStar} className="text-yellow-500" />
                              <span>4.8 rating</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">
                            <IconWrapper icon={FaBookmark} />
                            Bookmark
                          </button>
                          
                          <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors">
                            <IconWrapper icon={FaCheck} />
                            Complete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  renderArticleContent()
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* AI Assistant Floating Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1 }}
        onClick={() => setShowAIChat(!showAIChat)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 flex items-center justify-center z-50"
      >
        <IconWrapper icon={FaRobot} size={24} />
      </motion.button>

      {/* AI Chat Modal */}
      <AnimatePresence>
        {showAIChat && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAIChat(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md h-96 flex flex-col"
            >
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <IconWrapper icon={FaRobot} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">AI Learning Assistant</h3>
                    <p className="text-xs text-gray-400">Ask me anything about this course</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAIChat(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <IconWrapper icon={FaTimes} />
                </button>
              </div>
              
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                  <div className="bg-gray-800 rounded-lg p-3">
                    <p className="text-gray-200 text-sm">
                      👋 Hi! I'm your AI learning assistant. I can help you understand concepts, 
                      answer questions, and provide additional insights about this course.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t border-gray-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask me anything..."
                    className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    <IconWrapper icon={FaRocket} />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CoursePlayer; 