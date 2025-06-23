import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../utils/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';
import { 
  FaPlay, 
  FaPause, 
  FaVolumeUp, 
  FaVolumeMute,
  FaExpand, 
  FaCompress,
  FaBackward, 
  FaForward,
  FaBookmark,
  FaCog,
  FaChevronLeft,
  FaChevronRight,
  FaChevronUp,
  FaChevronDown,
  FaVideo,
  FaFileAlt,
  FaCheck,
  FaPlayCircle,
  FaLock,
  FaGraduationCap,
  FaListUl,
  FaUser,
  FaRobot,
  FaTimes,
  FaRocket,
  FaStickyNote,
  FaTrash,
  FaCopy,
  FaLightbulb,
  FaBrain,
  FaQuestionCircle,
  FaChartLine,
  FaClock,
  FaShare,
  FaClosedCaptioning,
  FaEdit,
  FaEye
} from 'react-icons/fa';
import IconWrapper from '../components/IconWrapper';
import NotificationModal from '../components/ui/NotificationModal';
import DraggableModal from '../components/ui/DraggableModal';
import AIAssistantModal from '../components/ui/AIAssistantModal';
import { API_BASE_URL } from '../config/api';
import { API_BASE, API_V2_BASE, getAuthHeaders } from '../config/api';

// Use API_V2_BASE for enhanced course functionality
const API_COURSE_BASE = API_V2_BASE;

// Remove the local API_BASE declaration
// const API_BASE = `${API_BASE_URL}/api`;

// Simple ID generator
const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

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
  summary?: string;
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

interface AIMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface QuickQuestion {
  id: string;
  question: string;
  category: 'concept' | 'detail' | 'application' | 'summary';
}

interface FormattedSummary {
  mainTopic: string;
  keyConcepts: string[];
  learningObjectives: string[];
  importantDetails: string[];
  conclusion: string;
}

// Notification interface
interface NotificationState {
  isOpen: boolean;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
}

// Note editing interface
interface NoteEditState {
  isOpen: boolean;
  noteId: string | null;
  content: string;
  mode: 'view' | 'edit';
}

const CoursePlayer: React.FC = (): JSX.Element => {
  const { courseId, lectureId } = useParams();
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const aiChatRef = useRef<HTMLDivElement>(null);
  
  // State variables
  const [course, setCourse] = useState<Course | null>(null);
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [currentLecture, setCurrentLecture] = useState<CourseLecture | null>(null);
  const [lectureProgress, setLectureProgress] = useState<LectureProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [aiQuestion, setAiQuestion] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [activeTab, setActiveTab] = useState<'content' | 'notes' | 'insights'>('content');
  const [streamingText, setStreamingText] = useState('');
  const [showTranscript, setShowTranscript] = useState(false);
  
  // Note editing state
  const [noteEditState, setNoteEditState] = useState<NoteEditState>({
    isOpen: false,
    noteId: null,
    content: '',
    mode: 'view'
  });
  
  // Notification state
  const [notification, setNotification] = useState<NotificationState>({
    isOpen: false,
    type: 'info',
    message: ''
  });
  
  // Video player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isBuffering, setIsBuffering] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  
  // AI and summary state
  const [formattedSummary, setFormattedSummary] = useState<FormattedSummary | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [quickQuestions, setQuickQuestions] = useState<QuickQuestion[]>([]);

  // Show notification helper function
  const showNotification = (type: 'success' | 'error' | 'warning' | 'info', message: string, title?: string) => {
    setNotification({
      isOpen: true,
      type,
      message,
      title
    });
  };

  // Auto-play functionality
  useEffect(() => {
    if (currentLecture?.lecture_type === 'video' && videoRef.current) {
      const video = videoRef.current;
      
      // Auto-play when lecture changes
      const playVideo = async () => {
        try {
          await video.play();
          setIsPlaying(true);
        } catch (error) {
          console.log('Auto-play prevented by browser:', error);
          setIsPlaying(false);
        }
      };

      // Small delay to ensure video is loaded
      const timer = setTimeout(playVideo, 500);
      return () => clearTimeout(timer);
    }
  }, [currentLecture]);

  // Send welcome message when AI chat is opened for the first time
  useEffect(() => {
    if (showAIChat && aiMessages.length === 0) {
      const welcomeMessage: AIMessage = {
        id: generateId(),
        type: 'assistant',
        content: "Welcome to MatrixEdu! I'm your AI-powered educational assistant. How can I help you today?",
        timestamp: new Date()
      };
      setAiMessages([welcomeMessage]);
    }
  }, [showAIChat, aiMessages.length]);

  // Load bookmark and completion status from localStorage
  useEffect(() => {
    if (currentLecture && user?.id) {
      const bookmarkedLectures = JSON.parse(localStorage.getItem('bookmarkedLectures') || '[]');
      const completedLectures = JSON.parse(localStorage.getItem('completedLectures') || '[]');
      
      setIsBookmarked(bookmarkedLectures.includes(currentLecture.id));
      setIsCompleted(completedLectures.includes(currentLecture.id));
    }
  }, [currentLecture, user?.id]);

  // AI Functions with proper streaming
  const generateAISummary = async (summaryText: string): Promise<string> => {
    const requestPayload = {
      model: "qwen-vl-max",
      messages: [
        {
          role: "system",
          content: [
            {
              type: "text", 
              text: "You are an expert educational content assistant. Create comprehensive, well-structured summaries of lecture content that help students understand key concepts. Use clear markdown formatting with headers, bullet points, and proper structure. Make the summary engaging and educational."
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Please create a comprehensive and well-formatted summary of this lecture content. Structure your summary with:

## 🎯 Main Topic
Brief overview of the lecture's primary focus

## 📚 Key Concepts
- Important ideas and principles
- Core concepts to understand
- Critical terminology

## 💡 Learning Objectives  
What students should learn from this lecture

## 📊 Important Details
- Key facts and information
- Examples and case studies
- Practical applications

## 🔍 Deep Dive
More detailed explanation of complex topics

## ✅ Key Takeaways
- Main conclusions
- Important points to remember
- Action items for students

**Lecture Content:**
${summaryText}

Please provide a well-structured, educational summary using proper markdown formatting with emojis and clear sections.`
            }
          ]
        }
      ],
      stream: true
    };

    const response = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer sk-0d874843ff2542c38940adcbeb2b2cc4',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body reader available');
    }

    let fullContent = '';
    setStreamingText('');

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content_chunk = parsed.choices?.[0]?.delta?.content;
              
              if (content_chunk) {
                fullContent += content_chunk;
                setStreamingText(fullContent);
              }
            } catch (parseError) {
              continue;
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return fullContent.trim();
  };

  const generateQuickQuestions = async (lectureContent: string): Promise<QuickQuestion[]> => {
    const requestPayload = {
      model: "qwen-vl-max",
      messages: [
        {
          role: "system",
          content: [
            {
              type: "text", 
              text: "You are an educational assistant that creates engaging questions to help students better understand lecture content. Generate 4-6 quick questions that encourage deeper thinking about the material."
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Based on this lecture content, generate 4-6 quick questions that students might ask. Return them in this exact JSON format:

[
  {"question": "What is the main concept explained?", "category": "concept"},
  {"question": "Can you give me a practical example?", "category": "application"},
  {"question": "What are the key details I should remember?", "category": "detail"},
  {"question": "Can you summarize this in simple terms?", "category": "summary"}
]

Categories should be: concept, detail, application, or summary

Lecture content: ${lectureContent.substring(0, 1000)}...`
            }
          ]
        }
      ],
      stream: false
    };

    try {
      const response = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer sk-0d874843ff2542c38940adcbeb2b2cc4',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '[]';
      
      try {
        const questions = JSON.parse(content);
        return questions.map((q: any, index: number) => ({
          id: generateId(),
          question: q.question,
          category: q.category || 'concept'
        }));
      } catch (parseError) {
        // Fallback questions if parsing fails
        return [
          { id: generateId(), question: "What are the main concepts covered?", category: "concept" as const },
          { id: generateId(), question: "Can you explain this in simpler terms?", category: "summary" as const },
          { id: generateId(), question: "What practical applications does this have?", category: "application" as const },
          { id: generateId(), question: "What details should I focus on?", category: "detail" as const }
        ];
      }
    } catch (error) {
      console.error('Error generating quick questions:', error);
      return [];
    }
  };

  const sendAIMessage = async (message: string, isQuickQuestion: boolean = false) => {
    if (!message.trim() || !currentLecture) return;
    
    // Add user message
    const userMessage: AIMessage = {
      id: generateId(),
      type: 'user',
      content: message.trim(),
      timestamp: new Date()
    };
    
    setAiMessages(prev => [...prev, userMessage]);
    setAiQuestion('');
    setIsAiTyping(true);
    setStreamingText('');
    
    // Add streaming assistant message
    const assistantMessage: AIMessage = {
      id: generateId(),
      type: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };
    
    setAiMessages(prev => [...prev, assistantMessage]);

    try {
      // Prepare context with lecture information
      let context = `Current lecture: "${currentLecture.title}"`;
      if (currentLecture.description) {
        context += `\nDescription: ${currentLecture.description}`;
      }
      if (currentLecture.summary) {
        context += `\nLecture Summary: ${currentLecture.summary}`;
      }
      if (currentLecture.article_content) {
        context += `\nLecture Content: ${currentLecture.article_content.substring(0, 1000)}...`;
      }

      // Determine response format based on question type
      let systemPrompt = `You are an expert educational AI assistant helping students understand lecture content. 

Format your responses using markdown with clear structure:
- Use **bold** for key concepts
- Use *italics* for emphasis  
- Use bullet points for lists
- Use numbered lists for steps/procedures
- Use > blockquotes for important notes
- Use ### for section headings

Provide clear, helpful, and educational responses that encourage learning.`;

      // Customize prompt based on question keywords
      if (message.toLowerCase().includes('summarize') || message.toLowerCase().includes('summary')) {
        systemPrompt += `\n\nFor summaries, structure your response as:
### 📚 Lecture Summary
**Main Topic:** [brief description]

**Key Concepts:**
- Concept 1: explanation
- Concept 2: explanation

**Important Points:**
- Point 1
- Point 2

**Learning Objectives:**
- What students should understand
- What students should be able to do

> **Quick Tip:** [helpful study tip or real-world application]`;
      } else if (message.toLowerCase().includes('concept') || message.toLowerCase().includes('explain')) {
        systemPrompt += `\n\nFor concept explanations, structure your response as:
### 🧠 Concept Explanation
**Definition:** [clear definition]

**Key Points:**
- Important aspect 1
- Important aspect 2

**Example:** [practical example or analogy]

**Why It Matters:** [relevance and applications]

> **Study Tip:** [how to remember or apply this concept]`;
      } else if (message.toLowerCase().includes('question') || message.toLowerCase().includes('quiz') || message.toLowerCase().includes('practice')) {
        systemPrompt += `\n\nFor practice questions, structure your response as:
### 📝 Practice Questions

**Multiple Choice:**
1. Question text
   - A) Option A
   - B) Option B
   - C) Option C ✓
   - D) Option D

**Short Answer:**
1. Question text
   *Answer: Brief explanation*

**Discussion Questions:**
- Thought-provoking question 1
- Thought-provoking question 2

> **Study Strategy:** [tips for using these questions effectively]`;
      }

      const requestPayload = {
        model: "qwen-vl-max",
        messages: [
          {
            role: "system",
            content: [
              {
                type: "text", 
                text: systemPrompt
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Context: ${context}

Student Question: ${message}

Please provide a helpful, well-structured educational response using the markdown formatting guidelines. Make it engaging and supportive for the student's learning journey.`
              }
            ]
          }
        ],
        stream: true
      };

      const response = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer sk-0d874843ff2542c38940adcbeb2b2cc4',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      let fullContent = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content_chunk = parsed.choices?.[0]?.delta?.content;
                
                if (content_chunk) {
                  fullContent += content_chunk;
                  
                  // Update the streaming message
                  setAiMessages(prev => prev.map(msg => 
                    msg.id === assistantMessage.id 
                      ? { ...msg, content: fullContent, isStreaming: true }
                      : msg
                  ));
                }
              } catch (parseError) {
                continue;
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      // Mark streaming as complete
      setAiMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id 
          ? { ...msg, content: fullContent, isStreaming: false }
          : msg
      ));
      
    } catch (error) {
      console.error('Error sending AI message:', error);
      
      // Update with error message
      setAiMessages(prev => prev.map(msg => 
        msg.id === assistantMessage.id 
          ? { ...msg, content: `### ❌ Error\n\nSorry, I encountered an error while processing your request. Please try again.\n\n> **Tip:** Make sure your question is clear and specific for the best results!`, isStreaming: false }
          : msg
      ));
    } finally {
      setIsAiTyping(false);
      setStreamingText('');
    }
  };

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
    // Generate quick questions when lecture changes
    if (currentLecture?.summary) {
      generateQuickQuestions(currentLecture.summary).then(setQuickQuestions);
    }
  }, [currentLecture]);

  useEffect(() => {
    // Check if current lecture is bookmarked/completed
    if (currentLecture) {
      const progress = getCurrentProgress();
      setIsCompleted(progress?.completed || false);
      // Check bookmark status from localStorage or API
      const bookmarkedLectures = JSON.parse(localStorage.getItem('bookmarkedLectures') || '[]');
      setIsBookmarked(bookmarkedLectures.includes(currentLecture.id));
    }
  }, [currentLecture, lectureProgress]);

  useEffect(() => {
    // Generate AI insights when lecture changes
    if (currentLecture) {
      generateAIInsights();
    }
  }, [currentLecture]);

  useEffect(() => {
    // Format AI summary when lecture changes
    if (currentLecture?.summary) {
      formatAISummary(currentLecture.summary);
    } else {
      setFormattedSummary(null);
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
      const sectionsUrl = `${API_COURSE_BASE}/courses/${courseId}/sections?uid=${user?.id}`;
      console.log('Fetching from:', sectionsUrl);
      
      // Add authentication headers for V2 API
      const headers = getAuthHeaders(user, session);
      const response = await fetch(sectionsUrl, { headers });
      const data = await response.json();
      
      console.log('API Response:', data);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        console.error('API request failed:', response.status, data);
        
        // If 403 and this is the first attempt, try to verify enrollment and retry
        if (response.status === 403 && retryCount < 2) {
          console.log('403 error, checking enrollment status...');
          
          const enrollmentCheckUrl = `${API_COURSE_BASE}/courses/${courseId}/enrollment/${user?.id}`;
          const enrollmentResponse = await fetch(enrollmentCheckUrl, { headers });
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
      // Add authentication headers for V2 API
      const headers = getAuthHeaders(user, session);
      const response = await fetch(`${API_COURSE_BASE}/courses/${courseId}/progress`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId: user.id,
          lectureId,
          watchTimeSeconds: watchedPosition || 0,
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

  // Bookmark functionality
  const toggleBookmark = async () => {
    if (!currentLecture || !user?.id) return;

    try {
      setIsBookmarked(!isBookmarked);
      
      // Update localStorage
      const bookmarkedLectures = JSON.parse(localStorage.getItem('bookmarkedLectures') || '[]');
      if (isBookmarked) {
        const updated = bookmarkedLectures.filter((id: string) => id !== currentLecture.id);
        localStorage.setItem('bookmarkedLectures', JSON.stringify(updated));
      } else {
        bookmarkedLectures.push(currentLecture.id);
        localStorage.setItem('bookmarkedLectures', JSON.stringify(bookmarkedLectures));
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  // Complete functionality
  const markAsComplete = async () => {
    if (!currentLecture || !user?.id) return;

    try {
      setIsCompleted(!isCompleted);
      
      // Update progress to 100% when marking as complete
      await updateProgress(currentLecture.id, isCompleted ? 0 : 100);
      
      // Update localStorage for completion status
      const completedLectures = JSON.parse(localStorage.getItem('completedLectures') || '[]');
      if (isCompleted) {
        const updated = completedLectures.filter((id: string) => id !== currentLecture.id);
        localStorage.setItem('completedLectures', JSON.stringify(updated));
      } else {
        completedLectures.push(currentLecture.id);
        localStorage.setItem('completedLectures', JSON.stringify(completedLectures));
      }
      
      // Auto-advance to next lecture if marking as complete
      if (!isCompleted) {
        setTimeout(() => {
          goToNextLecture();
        }, 1500);
      }
    } catch (error) {
      console.error('Error marking as complete:', error);
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

  const addBookmarkAtTime = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setBookmarks(prev => [...prev, time]);
    }
  };

  const addNote = () => {
    if (!newNote.trim() || !currentLecture) return;
    
    const note: Note = {
      id: generateId(),
      content: newNote.trim(),
      timestamp: currentTime,
      lecture_id: currentLecture.id,
      created_at: new Date().toISOString()
    };
    
    setNotes(prev => [note, ...prev]);
    setNewNote('');
    
    // Save to localStorage
    const savedNotes = JSON.parse(localStorage.getItem('lectureNotes') || '{}');
    if (!savedNotes[currentLecture.id]) {
      savedNotes[currentLecture.id] = [];
    }
    savedNotes[currentLecture.id].push(note);
    localStorage.setItem('lectureNotes', JSON.stringify(savedNotes));
  };

  const deleteNote = (noteId: string) => {
    if (!currentLecture) return;
    
    setNotes(prev => prev.filter(note => note.id !== noteId));
    
    // Update localStorage
    const savedNotes = JSON.parse(localStorage.getItem('lectureNotes') || '{}');
    if (savedNotes[currentLecture.id]) {
      savedNotes[currentLecture.id] = savedNotes[currentLecture.id].filter((note: Note) => note.id !== noteId);
      localStorage.setItem('lectureNotes', JSON.stringify(savedNotes));
    }
  };

  // Note editing handlers
  const openNoteModal = (note: Note, mode: 'view' | 'edit' = 'view') => {
    setNoteEditState({
      isOpen: true,
      noteId: note.id,
      content: note.content,
      mode
    });
  };

  const closeNoteModal = () => {
    setNoteEditState({
      isOpen: false,
      noteId: null,
      content: '',
      mode: 'view'
    });
  };

  const saveNoteEdit = () => {
    if (!noteEditState.noteId || !currentLecture) return;
    
    const updatedContent = noteEditState.content.trim();
    if (!updatedContent) return;
    
    // Update notes state
    setNotes(prev => prev.map(note => 
      note.id === noteEditState.noteId 
        ? { ...note, content: updatedContent }
        : note
    ));
    
    // Update localStorage
    const savedNotes = JSON.parse(localStorage.getItem('lectureNotes') || '{}');
    if (savedNotes[currentLecture.id]) {
      savedNotes[currentLecture.id] = savedNotes[currentLecture.id].map((note: Note) =>
        note.id === noteEditState.noteId
          ? { ...note, content: updatedContent }
          : note
      );
      localStorage.setItem('lectureNotes', JSON.stringify(savedNotes));
    }
    
    closeNoteModal();
    showNotification('success', 'Note updated successfully!');
  };

  const jumpToNoteTime = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
      setCurrentTime(timestamp);
      
      // Play the video if it's not already playing
      if (!isPlaying) {
        togglePlayPause();
      }
    }
  };

  // Navigation helper functions
  const canGoPrevious = (): boolean => {
    if (!currentLecture || sections.length === 0) return false;
    
    for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
      const section = sections[sectionIndex];
      const lectureIndex = section.course_lectures.findIndex(l => l.id === currentLecture.id);
      
      if (lectureIndex !== -1) {
        // Check if there's a previous lecture in the same section
        if (lectureIndex > 0) return true;
        
        // Check if there's a previous section with lectures
        if (sectionIndex > 0) {
          const prevSection = sections[sectionIndex - 1];
          return prevSection.course_lectures.length > 0;
        }
      }
    }
    
    return false;
  };

  const canGoNext = (): boolean => {
    if (!currentLecture || sections.length === 0) return false;
    
    for (let sectionIndex = 0; sectionIndex < sections.length; sectionIndex++) {
      const section = sections[sectionIndex];
      const lectureIndex = section.course_lectures.findIndex(l => l.id === currentLecture.id);
      
      if (lectureIndex !== -1) {
        // Check if there's a next lecture in the same section
        if (lectureIndex < section.course_lectures.length - 1) return true;
        
        // Check if there's a next section with lectures
        if (sectionIndex < sections.length - 1) {
          for (let nextSectionIndex = sectionIndex + 1; nextSectionIndex < sections.length; nextSectionIndex++) {
            if (sections[nextSectionIndex].course_lectures.length > 0) return true;
          }
        }
      }
    }
    
    return false;
  };

  // Load notes when lecture changes
  useEffect(() => {
    if (currentLecture) {
      const savedNotes = JSON.parse(localStorage.getItem('lectureNotes') || '{}');
      const lectureNotes = savedNotes[currentLecture.id] || [];
      setNotes(lectureNotes);
    }
  }, [currentLecture]);

  // Add custom CSS for line-clamp and other utilities
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .line-clamp-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      .line-clamp-3 {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Custom markdown components for AI responses
  const markdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match[1]}
          PreTag="div"
          className="rounded-lg my-2"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className="bg-gray-800 px-2 py-1 rounded text-sm font-mono text-blue-300" {...props}>
          {children}
        </code>
      );
    },
    h1: ({ children }: any) => <h1 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-xl font-bold text-blue-300 mb-3 flex items-center gap-2">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-lg font-semibold text-purple-300 mb-2">{children}</h3>,
    p: ({ children }: any) => <p className="text-gray-200 mb-3 leading-relaxed">{children}</p>,
    ul: ({ children }: any) => <ul className="list-disc list-inside text-gray-200 mb-3 space-y-1">{children}</ul>,
    ol: ({ children }: any) => <ol className="list-decimal list-inside text-gray-200 mb-3 space-y-1">{children}</ol>,
    li: ({ children }: any) => <li className="text-gray-200">{children}</li>,
    strong: ({ children }: any) => <strong className="text-white font-semibold">{children}</strong>,
    em: ({ children }: any) => <em className="text-blue-300 italic">{children}</em>,
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-4 border-blue-500 pl-4 py-2 bg-gray-800/50 rounded-r-lg mb-3 italic text-gray-300">
        {children}
      </blockquote>
    ),
  };

  const formatAISummary = (summaryText: string) => {
    try {
      // Clean markdown formatting from the text
      const cleanMarkdown = (text: string) => {
        return text
          .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown **text**
          .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown *text*
          .replace(/`(.*?)`/g, '$1') // Remove code markdown `text`
          .replace(/#{1,6}\s*/g, '') // Remove headers # ## ### etc
          .replace(/^\s*[-*+]\s*/gm, '') // Remove bullet points
          .replace(/^\s*\d+\.\s*/gm, '') // Remove numbered lists
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links [text](url)
          .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1') // Remove images ![alt](url)
          .trim();
      };

      // Parse the AI-generated summary into structured format
      const lines = summaryText.split('\n').filter(line => line.trim());
      
      let mainTopic = '';
      let keyConcepts: string[] = [];
      let learningObjectives: string[] = [];
      let importantDetails: string[] = [];
      let conclusion = '';
      
      let currentSection = '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Skip empty lines
        if (!trimmedLine) continue;
        
        // Detect sections
        if (trimmedLine.toLowerCase().includes('main topic') || 
            trimmedLine.toLowerCase().includes('overview') ||
            trimmedLine.toLowerCase().includes('introduction')) {
          currentSection = 'main';
          continue;
        } else if (trimmedLine.toLowerCase().includes('key concept') ||
                   trimmedLine.toLowerCase().includes('important concept')) {
          currentSection = 'concepts';
          continue;
        } else if (trimmedLine.toLowerCase().includes('learning objective') ||
                   trimmedLine.toLowerCase().includes('what you will learn')) {
          currentSection = 'objectives';
          continue;
        } else if (trimmedLine.toLowerCase().includes('important detail') ||
                   trimmedLine.toLowerCase().includes('key point')) {
          currentSection = 'details';
          continue;
        } else if (trimmedLine.toLowerCase().includes('conclusion') ||
                   trimmedLine.toLowerCase().includes('summary')) {
          currentSection = 'conclusion';
          continue;
        }
        
        // Extract content based on current section and clean markdown
        const cleanLine = cleanMarkdown(trimmedLine);
        
        if (currentSection === 'main' && !mainTopic && cleanLine.length > 5) {
          mainTopic = cleanLine;
        } else if (currentSection === 'concepts' && cleanLine.length > 5) {
          keyConcepts.push(cleanLine);
        } else if (currentSection === 'objectives' && cleanLine.length > 5) {
          learningObjectives.push(cleanLine);
        } else if (currentSection === 'details' && cleanLine.length > 5) {
          importantDetails.push(cleanLine);
        } else if (currentSection === 'conclusion' && !conclusion && cleanLine.length > 5) {
          conclusion = cleanLine;
        } else if (!mainTopic && cleanLine.length > 20) {
          // If no main topic found yet, use the first substantial line
          mainTopic = cleanLine;
        }
      }
      
      // Fallback: if no structured content found, use the first few lines
      if (!mainTopic && lines.length > 0) {
        mainTopic = cleanMarkdown(lines[0]);
      }
      
      // If still no structured content, parse as general text
      if (keyConcepts.length === 0 && learningObjectives.length === 0) {
        const cleanedText = cleanMarkdown(summaryText);
        const sentences = cleanedText.split(/[.!?]+/).filter(s => s.trim().length > 10);
        keyConcepts = sentences.slice(1, 4).map(s => s.trim());
        if (sentences.length > 4) {
          conclusion = sentences[sentences.length - 1].trim();
        }
      }
      
      setFormattedSummary({
        mainTopic: mainTopic || 'AI-generated summary available',
        keyConcepts: keyConcepts.slice(0, 5), // Limit to 5 concepts
        learningObjectives: learningObjectives.slice(0, 5), // Limit to 5 objectives
        importantDetails: importantDetails.slice(0, 5), // Limit to 5 details
        conclusion: conclusion || 'This lecture provides valuable insights for your learning journey.'
      });
    } catch (error) {
      console.error('Error formatting AI summary:', error);
      // Fallback formatting with cleaned text
      const cleanText = summaryText
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`(.*?)`/g, '$1')
        .replace(/#{1,6}\s*/g, '')
        .trim();
        
      setFormattedSummary({
        mainTopic: cleanText.substring(0, 200) + (cleanText.length > 200 ? '...' : ''),
        keyConcepts: [],
        learningObjectives: [],
        importantDetails: [],
        conclusion: 'AI summary is available for this lecture.'
      });
    }
  };

  const renderSummarySidePanel = () => (
    <AnimatePresence>
      {showSummaryModal && (
        <DraggableModal
          isOpen={showSummaryModal}
          onClose={() => setShowSummaryModal(false)}
          title="Lecture Summary"
          initialWidth={500}
          initialHeight={600}
          initialX={window.innerWidth - 600}
          initialY={100}
          className="z-[60]"
        >
          {formattedSummary ? (
            <div className="p-4 space-y-4">
              {/* Main Topic */}
              <div className="bg-gradient-to-r from-blue-900/30 to-blue-800/30 rounded-xl p-4 border border-blue-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <IconWrapper icon={FaLightbulb} className="text-white" size={12} />
                  </div>
                  <h4 className="text-sm font-bold text-blue-400">Main Topic</h4>
                </div>
                <p className="text-gray-200 text-sm leading-relaxed">{formattedSummary.mainTopic}</p>
              </div>

              {/* Key Concepts */}
              {formattedSummary.keyConcepts && formattedSummary.keyConcepts.length > 0 && (
                <div className="bg-gradient-to-r from-green-900/30 to-green-800/30 rounded-xl p-4 border border-green-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                      <IconWrapper icon={FaBrain} className="text-white" size={12} />
                    </div>
                    <h4 className="text-sm font-bold text-green-400">Key Concepts</h4>
                  </div>
                  <ul className="space-y-2">
                    {formattedSummary.keyConcepts.map((concept, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-gray-200 text-sm"
                      >
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="leading-relaxed">{concept}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Learning Objectives */}
              {formattedSummary.learningObjectives && formattedSummary.learningObjectives.length > 0 && (
                <div className="bg-gradient-to-r from-yellow-900/30 to-yellow-800/30 rounded-xl p-4 border border-yellow-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                      <IconWrapper icon={FaGraduationCap} className="text-white" size={12} />
                    </div>
                    <h4 className="text-sm font-bold text-yellow-400">Learning Objectives</h4>
                  </div>
                  <ul className="space-y-2">
                    {formattedSummary.learningObjectives.map((objective, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-gray-200 text-sm"
                      >
                        <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="leading-relaxed">{objective}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Important Details */}
              {formattedSummary.importantDetails && formattedSummary.importantDetails.length > 0 && (
                <div className="bg-gradient-to-r from-pink-900/30 to-pink-800/30 rounded-xl p-4 border border-pink-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-pink-600 rounded-lg flex items-center justify-center">
                      <IconWrapper icon={FaQuestionCircle} className="text-white" size={12} />
                    </div>
                    <h4 className="text-sm font-bold text-pink-400">Important Details</h4>
                  </div>
                  <ul className="space-y-2">
                    {formattedSummary.importantDetails.map((detail, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-gray-200 text-sm"
                      >
                        <div className="w-1.5 h-1.5 bg-pink-400 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="leading-relaxed">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Conclusion */}
              <div className="bg-gradient-to-r from-indigo-900/30 to-indigo-800/30 rounded-xl p-4 border border-indigo-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <IconWrapper icon={FaChartLine} className="text-white" size={12} />
                  </div>
                  <h4 className="text-sm font-bold text-indigo-400">Conclusion</h4>
                </div>
                <p className="text-gray-200 text-sm leading-relaxed">{formattedSummary.conclusion}</p>
              </div>
            </div>
          ) : (
            <div className="p-4 text-center py-8">
              <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-xl p-6 border border-gray-600/30">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <IconWrapper icon={FaBrain} size={18} className="text-white" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">No Summary Available</h4>
                <p className="text-gray-400 mb-4 text-sm leading-relaxed">
                  This lecture doesn't have a summary yet. Would you like to generate one using AI?
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (currentLecture?.summary) {
                      formatAISummary(currentLecture.summary);
                    }
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-300 font-medium shadow-lg text-sm"
                >
                  <div className="flex items-center gap-2">
                    <IconWrapper icon={FaRobot} size={14} />
                    Generate AI Summary
                  </div>
                </motion.button>
              </div>
            </div>
          )}
        </DraggableModal>
      )}
    </AnimatePresence>
  );

  const renderVideoPlayer = () => {
    if (!currentLecture || currentLecture.lecture_type !== 'video') return null;

    return (
      <div className="h-full p-6 overflow-hidden">
        <div 
          ref={playerContainerRef}
          className="relative bg-gradient-to-br from-gray-900 to-black rounded-2xl overflow-hidden group shadow-2xl h-full"
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
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm">
              <div className="flex items-center gap-4 text-white">
                <div className="relative">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="absolute inset-0 w-12 h-12 border-4 border-purple-500 border-b-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
              </div>
                <div>
                  <span className="text-xl font-semibold">Loading...</span>
                  <p className="text-sm text-gray-300">Preparing your video</p>
            </div>
                </div>
            </div>
            )}

          {/* Video Controls */}
          <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/50"
              >
                {/* Top Controls */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => navigate(`/courses/${courseId}`)}
                      className="p-3 bg-black/50 text-white rounded-xl hover:bg-black/70 transition-all duration-200 backdrop-blur-sm"
                    >
                      <IconWrapper icon={FaChevronLeft} size={18} />
                    </button>
                    
                    <div className="text-white">
                      <h3 className="font-bold text-lg">{currentLecture.title}</h3>
                      <p className="text-sm text-gray-300">{course?.title}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={toggleBookmark}
                      className={`p-3 rounded-xl transition-all duration-200 backdrop-blur-sm ${
                        isBookmarked 
                          ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/25' 
                          : 'bg-black/50 text-white hover:bg-black/70'
                      }`}
                    >
                      <IconWrapper icon={FaBookmark} size={16} />
                    </button>
                    
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className="p-3 bg-black/50 text-white rounded-xl hover:bg-black/70 transition-all duration-200 backdrop-blur-sm"
                    >
                      <IconWrapper icon={FaCog} size={16} />
                    </button>
                  </div>
                </div>

                {/* Center Play Button */}
                {!isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <motion.button
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={togglePlayPause}
                      className="w-24 h-24 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-300 shadow-2xl"
                    >
                      <IconWrapper icon={FaPlay} size={32} className="ml-2" />
                    </motion.button>
                  </div>
                )}

                {/* Bottom Controls */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  {/* Progress Bar with Note Markers */}
                  <div className="mb-6">
                    <div className="relative h-3 bg-white/20 rounded-full cursor-pointer group backdrop-blur-sm">
                      {/* Main Progress Bar */}
                      <div
                        className="absolute h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300"
                        style={{ width: `${(currentTime / duration) * 100}%` }}
                      />
                      
                      {/* Seek Input */}
                      <input
                        type="range"
                        min="0"
                        max={duration}
                        value={currentTime}
                        onChange={(e) => handleSeek(Number(e.target.value))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      
                      {/* Note Markers */}
                      {notes.map((note) => {
                        const position = (note.timestamp / duration) * 100;
                        return (
                          <div
                            key={note.id}
                            className="absolute top-0 w-1 h-full bg-yellow-400 rounded-full cursor-pointer group/note transform -translate-x-0.5 hover:w-2 transition-all duration-200"
                            style={{ left: `${position}%` }}
                            onClick={() => jumpToNoteTime(note.timestamp)}
                          >
                            {/* Note Tooltip */}
                            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white p-3 rounded-lg shadow-xl opacity-0 group-hover/note:opacity-100 transition-opacity duration-200 pointer-events-none min-w-64 max-w-80 z-10">
                              <div className="flex items-center gap-2 mb-2">
                                <IconWrapper icon={FaStickyNote} className="text-yellow-400" size={12} />
                                <span className="text-xs text-yellow-400 font-medium">
                                  {formatTime(note.timestamp)}
                                </span>
                              </div>
                              <p className="text-sm text-gray-200 line-clamp-3">{note.content}</p>
                              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                                <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Bookmark Markers */}
                      {bookmarks.map((bookmark, index) => (
                        <div
                          key={index}
                          className="absolute top-0 w-1 h-full bg-blue-400 rounded-full cursor-pointer hover:w-2 transition-all duration-200"
                          style={{ left: `${(bookmark / duration) * 100}%` }}
                          onClick={() => handleSeek(bookmark)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Control Buttons */}
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={togglePlayPause}
                        className="p-3 hover:bg-white/20 rounded-xl transition-all duration-200 backdrop-blur-sm"
                      >
                        <IconWrapper icon={isPlaying ? FaPause : FaPlay} size={20} />
                      </button>
                      
                      <button
                        onClick={goToPreviousLecture}
                        className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200"
                      >
                        <IconWrapper icon={FaBackward} size={16} />
                      </button>
                      
                      <button
                        onClick={goToNextLecture}
                        className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200"
                      >
                        <IconWrapper icon={FaForward} size={16} />
                      </button>

                      <button
                        onClick={() => setShowSummaryModal(true)}
                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 backdrop-blur-sm font-medium text-sm flex items-center gap-2"
                      >
                        <IconWrapper icon={FaBrain} size={14} />
                        View Summary
                      </button>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setIsMuted(!isMuted)}
                          className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200"
                        >
                          <IconWrapper icon={isMuted ? FaVolumeMute : FaVolumeUp} size={16} />
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
                          className="w-24 accent-blue-500"
                        />
                      </div>

                      <span className="text-sm font-medium bg-black/30 px-3 py-1 rounded-lg backdrop-blur-sm">
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
                        className="bg-black/50 text-white rounded-lg px-3 py-2 text-sm backdrop-blur-sm border border-white/20 focus:border-blue-500 focus:outline-none"
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
                        className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200"
                      >
                        <IconWrapper icon={FaClosedCaptioning} size={16} />
                      </button>

                      <button
                        onClick={toggleFullscreen}
                        className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200"
                      >
                        <IconWrapper icon={isFullscreen ? FaCompress : FaExpand} size={16} />
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
                className="absolute top-16 right-4 bg-gray-900/95 backdrop-blur-md text-white rounded-2xl p-6 shadow-2xl min-w-80 border border-gray-700"
              >
                <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <IconWrapper icon={FaCog} className="text-blue-400" />
                  Video Settings
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Quality</label>
                    <select className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none">
                      <option>Auto (720p)</option>
                      <option>1080p</option>
                      <option>720p</option>
                      <option>480p</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Playback Speed</label>
                    <select 
                      value={playbackRate}
                      onChange={(e) => setPlaybackRate(Number(e.target.value))}
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    >
                      <option value={0.5}>0.5x</option>
                      <option value={0.75}>0.75x</option>
                      <option value={1}>Normal</option>
                      <option value={1.25}>1.25x</option>
                      <option value={1.5}>1.5x</option>
                      <option value={2}>2x</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Volume</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={(e) => setVolume(Number(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        
        </div>
      </div>
    );
  };

  const renderArticleContent = () => {
    if (!currentLecture?.article_content) return null;

    return (
      <div className="h-full p-6 overflow-y-auto">
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl overflow-hidden max-w-5xl mx-auto">
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
                <button 
                  onClick={toggleBookmark}
                  className={`p-2 rounded-lg transition-colors ${
                    isBookmarked ? 'bg-yellow-500 text-white' : 'bg-white/20 hover:bg-white/30'
                  }`}
                >
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
                    <button 
                      onClick={markAsComplete}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                    >
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
                      disabled={!canGoPrevious()}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <IconWrapper icon={FaChevronLeft} />
                      Previous
                    </button>
                    <button
                      onClick={goToNextLecture}
                      disabled={!canGoNext()}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
      </div>
    );
  };



  const renderCourseSidebar = () => (
    <div className={`${
      sidebarCollapsed ? 'w-16' : 'w-96'
    } h-full bg-gradient-to-b from-gray-900/95 via-gray-800/95 to-gray-900/95 backdrop-blur-xl border-r border-gray-700/50 transition-all duration-300 flex flex-col shadow-2xl`}>
      
      {/* Sidebar Header */}
      <div className="p-6 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/60 to-gray-700/60 flex-shrink-0">
        <div className="flex items-center justify-between">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                <IconWrapper icon={FaGraduationCap} className="text-white" size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Course Content</h3>
                {course && sections.length > 0 && (
                  <p className="text-sm text-gray-400">
                    {sections.reduce((acc, section) => acc + section.course_lectures.length, 0)} lectures
                  </p>
                )}
              </div>
            </div>
          )}
          <motion.button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300"
          >
            <IconWrapper icon={sidebarCollapsed ? FaChevronRight : FaChevronLeft} size={16} />
          </motion.button>
        </div>
      </div>

      {!sidebarCollapsed && (
        <>
          {/* Quick Notes Section */}
          <div className="p-4 border-b border-gray-700/30 flex-shrink-0">
            <div className="flex items-center gap-2 mb-3">
              <IconWrapper icon={FaStickyNote} className="text-yellow-400" size={16} />
              <h4 className="font-semibold text-white text-sm">Quick Notes</h4>
              <div className="flex-1 h-px bg-gradient-to-r from-yellow-400/30 to-transparent"></div>
            </div>
            
            {/* Current Time Display */}
            {currentLecture?.lecture_type === 'video' && (
              <div className="mb-3 p-3 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl border border-yellow-500/20">
                <div className="flex items-center gap-2 text-yellow-400 text-sm font-medium">
                  <IconWrapper icon={FaClock} size={12} />
                  <span>Current: {formatTime(currentTime)}</span>
                </div>
              </div>
            )}

            {/* Add Note Input */}
            <div className="space-y-3">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note at current time..."
                className="w-full p-3 bg-gray-800/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 text-sm resize-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all duration-300"
                rows={2}
              />
              <motion.button
                onClick={addNote}
                disabled={!newNote.trim()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-2 px-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-medium text-sm hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg"
              >
                <div className="flex items-center justify-center gap-2">
                  <IconWrapper icon={FaStickyNote} size={14} />
                  <span>Add Note</span>
                </div>
              </motion.button>
            </div>

            {/* Recent Notes Preview */}
            {notes.length > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400 font-medium">Recent Notes</span>
                  <span className="text-xs text-yellow-400 font-medium">{notes.length}</span>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {notes.slice(-3).reverse().map((note) => (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-2 bg-gray-800/30 rounded-lg border border-gray-700/30 hover:border-yellow-500/30 transition-all duration-300 cursor-pointer group"
                      onClick={() => openNoteModal(note, 'view')}
                      title={note.content} // Tooltip for full content
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-300 group-hover:text-white transition-colors leading-relaxed line-clamp-2">
                            {note.content}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <IconWrapper icon={FaClock} size={10} className="text-yellow-400" />
                            <span className="text-xs text-yellow-400 font-medium">
                              {formatTime(note.timestamp)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              openNoteModal(note, 'view');
                            }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-1 text-gray-500 hover:text-blue-400 transition-colors"
                            title="View note"
                          >
                            <IconWrapper icon={FaEye} size={8} />
                          </motion.button>
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              openNoteModal(note, 'edit');
                            }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-1 text-gray-500 hover:text-green-400 transition-colors"
                            title="Edit note"
                          >
                            <IconWrapper icon={FaEdit} size={8} />
                          </motion.button>
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNote(note.id);
                            }}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                            title="Delete note"
                          >
                            <IconWrapper icon={FaTrash} size={8} />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Course Sections */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-700/30 flex-shrink-0">
              <div className="flex items-center gap-2">
                <IconWrapper icon={FaListUl} className="text-blue-400" size={16} />
                <h4 className="font-semibold text-white text-sm">Lectures</h4>
                <div className="flex-1 h-px bg-gradient-to-r from-blue-400/30 to-transparent"></div>
              </div>
            </div>
            
            {/* Scrollable Lectures List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {sections.map((section, sectionIndex) => (
                <motion.div 
                  key={section.id} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: sectionIndex * 0.05 }}
                  className="space-y-2"
                >
                  {/* Section Header */}
                  <motion.button
                    onClick={() => {
                      const newExpanded = expandedSections.includes(section.id)
                        ? expandedSections.filter(id => id !== section.id)
                        : [...expandedSections, section.id];
                      setExpandedSections(newExpanded);
                    }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-gray-800/40 to-gray-700/40 hover:from-gray-700/50 hover:to-gray-600/50 rounded-lg transition-all duration-300 border border-gray-600/30 hover:border-gray-500/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-md">
                        {section.section_order}
                      </div>
                      <div className="text-left">
                        <h4 className="font-medium text-white text-sm leading-tight">{section.title}</h4>
                        <p className="text-xs text-gray-400">{section.course_lectures.length} lectures</p>
                      </div>
                    </div>
                    <IconWrapper 
                      icon={expandedSections.includes(section.id) ? FaChevronUp : FaChevronDown} 
                      className="text-gray-400" 
                      size={14}
                    />
                  </motion.button>

                  {/* Section Lectures */}
                  <AnimatePresence>
                    {expandedSections.includes(section.id) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-1 ml-2"
                      >
                        {section.course_lectures
                          .sort((a, b) => a.lecture_order - b.lecture_order)
                          .map((lecture, lectureIndex) => {
                            const progress = lectureProgress.find(p => p.lecture_id === lecture.id);
                            const isCurrentLecture = currentLecture?.id === lecture.id;
                            const hasNotes = notes.some(note => note.lecture_id === lecture.id);

                            return (
                              <motion.button
                                key={lecture.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: lectureIndex * 0.02 }}
                                onClick={() => {
                                  if (lecture.is_free || lecture.is_preview || user) {
                                    navigate(`/course/${courseId}/lecture/${lecture.id}`);
                                  }
                                }}
                                disabled={!lecture.is_free && !lecture.is_preview && !user}
                                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-300 text-left group ${
                                  isCurrentLecture
                                    ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 shadow-lg shadow-blue-500/10'
                                    : 'hover:bg-gray-800/30 border border-transparent hover:border-gray-600/30'
                                } ${
                                  !lecture.is_free && !lecture.is_preview && !user
                                    ? 'opacity-60 cursor-not-allowed'
                                    : 'cursor-pointer'
                                }`}
                              >
                                {/* Lecture Icon */}
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  lecture.lecture_type === 'video' 
                                    ? 'bg-gradient-to-r from-red-500/80 to-pink-500/80' 
                                    : 'bg-gradient-to-r from-blue-500/80 to-purple-500/80'
                                } shadow-md`}>
                                  {progress?.completed ? (
                                    <IconWrapper icon={FaCheck} className="text-white" size={12} />
                                  ) : (
                                    <IconWrapper 
                                      icon={lecture.lecture_type === 'video' ? FaPlayCircle : FaFileAlt} 
                                      className="text-white" 
                                      size={12} 
                                    />
                                  )}
                                </div>

                                {/* Lecture Info */}
                                <div className="flex-1 min-w-0">
                                  <h5 className={`font-medium text-sm leading-tight truncate ${
                                    isCurrentLecture ? 'text-blue-400' : 'text-white group-hover:text-blue-400'
                                  } transition-colors`}>
                                    {lecture.title}
                                  </h5>
                                  <div className="flex items-center gap-2 mt-1 text-xs">
                                    <span className={`font-medium ${
                                      isCurrentLecture ? 'text-blue-300' : 'text-gray-400'
                                    }`}>
                                      {lecture.lecture_type === 'video' ? 'Video' : 'Article'}
                                    </span>
                                    {lecture.video_duration_seconds && (
                                      <>
                                        <span className="text-gray-500">•</span>
                                        <span className="text-gray-400 font-medium">
                                          {formatTime(lecture.video_duration_seconds)}
                                        </span>
                                      </>
                                    )}
                                    {lecture.is_free && (
                                      <>
                                        <span className="text-gray-500">•</span>
                                        <span className="bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded text-xs font-medium">
                                          Free
                                        </span>
                                      </>
                                    )}
                                    {hasNotes && (
                                      <>
                                        <span className="text-gray-500">•</span>
                                        <IconWrapper icon={FaStickyNote} className="text-yellow-400" size={10} />
                                      </>
                                    )}
                                  </div>
                                </div>

                                {/* Progress Indicator */}
                                <div className="flex-shrink-0 flex items-center gap-2">
                                  {!lecture.is_free && !lecture.is_preview && !user && (
                                    <IconWrapper icon={FaLock} className="text-gray-500" size={12} />
                                  )}
                                  {progress && progress.progress_percentage > 0 && !progress.completed && (
                                    <div className="w-6 h-6 relative">
                                      <svg className="w-6 h-6 transform -rotate-90" viewBox="0 0 24 24">
                                        <circle
                                          cx="12"
                                          cy="12"
                                          r="8"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          fill="none"
                                          className="text-gray-600"
                                        />
                                        <circle
                                          cx="12"
                                          cy="12"
                                          r="8"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          fill="none"
                                          strokeDasharray={`${2 * Math.PI * 8}`}
                                          strokeDashoffset={`${2 * Math.PI * 8 * (1 - progress.progress_percentage / 100)}`}
                                          className="text-blue-400"
                                        />
                                      </svg>
                                      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-blue-400">
                                        {Math.round(progress.progress_percentage)}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </motion.button>
                            );
                          })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );

  // Note Modal Component
  const renderNoteModal = () => (
    <AnimatePresence>
      {noteEditState.isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
          onClick={closeNoteModal}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-600/50 max-w-2xl w-full max-h-[80vh] overflow-hidden"
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-700/50 bg-gradient-to-r from-gray-800/60 to-gray-700/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                    <IconWrapper icon={FaStickyNote} className="text-white" size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">
                      {noteEditState.mode === 'edit' ? 'Edit Note' : 'View Note'}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {currentLecture?.title} • {notes.find(n => n.id === noteEditState.noteId) && formatTime(notes.find(n => n.id === noteEditState.noteId)!.timestamp)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {noteEditState.mode === 'view' && (
                    <motion.button
                      onClick={() => setNoteEditState(prev => ({ ...prev, mode: 'edit' }))}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all duration-200"
                    >
                      <IconWrapper icon={FaEdit} size={16} />
                    </motion.button>
                  )}
                  <motion.button
                    onClick={closeNoteModal}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all duration-200"
                  >
                    <IconWrapper icon={FaTimes} size={16} />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-96 overflow-y-auto">
              {noteEditState.mode === 'edit' ? (
                <textarea
                  value={noteEditState.content}
                  onChange={(e) => setNoteEditState(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full h-48 p-4 bg-gray-900/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 resize-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500/50 transition-all duration-300"
                  placeholder="Edit your note..."
                  autoFocus
                />
              ) : (
                <div className="bg-gray-900/30 rounded-xl p-4 border border-gray-600/30">
                  <p className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                    {noteEditState.content}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-700/50 bg-gradient-to-r from-gray-800/30 to-gray-700/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <IconWrapper icon={FaClock} size={12} />
                  <span>
                    Created: {notes.find(n => n.id === noteEditState.noteId) && 
                      new Date(notes.find(n => n.id === noteEditState.noteId)!.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  {noteEditState.mode === 'edit' && (
                    <>
                      <motion.button
                        onClick={() => setNoteEditState(prev => ({ ...prev, mode: 'view', content: notes.find(n => n.id === noteEditState.noteId)?.content || '' }))}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200 border border-gray-600/50"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        onClick={saveNoteEdit}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={!noteEditState.content.trim()}
                        className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-medium hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
                      >
                        Save Changes
                      </motion.button>
                    </>
                  )}
                  {noteEditState.mode === 'view' && (
                    <motion.button
                      onClick={() => {
                        const note = notes.find(n => n.id === noteEditState.noteId);
                        if (note && currentLecture?.lecture_type === 'video') {
                          jumpToNoteTime(note.timestamp);
                          closeNoteModal();
                        }
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-600 transition-all duration-200 shadow-lg"
                    >
                      <div className="flex items-center gap-2">
                        <IconWrapper icon={FaPlayCircle} size={14} />
                        Jump to Time
                      </div>
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 relative overflow-hidden">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Grid Pattern Background */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="w-full h-full"
          style={{
            backgroundSize: '50px 50px',
            backgroundImage: `
              linear-gradient(to right, rgba(255, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
            `,
          }}
        />
      </div>

      
      {loading ? (
        <div className="flex items-center justify-center min-h-screen relative z-10">
          <div className="text-center">
            <div className="relative mb-8">
              <div className="w-32 h-32 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <div className="absolute inset-0 w-32 h-32 border-4 border-purple-500 border-b-transparent rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 border border-white/10"
            >
              <h3 className="text-2xl font-bold text-white mb-2">Loading Course</h3>
              <p className="text-gray-400">Preparing your learning experience...</p>
            </motion.div>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center min-h-screen relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-500/10 backdrop-blur-lg rounded-2xl p-8 border border-red-500/20 text-center max-w-md"
          >
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <IconWrapper icon={FaTimes} size={24} className="text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Error Loading Course</h3>
            <p className="text-gray-400 mb-4">{error}</p>
            <motion.button
              onClick={() => window.location.reload()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
            >
              Retry
            </motion.button>
          </motion.div>
        </div>
      ) : (
        <div className="flex h-screen relative z-10">
          {/* Sidebar */}
          {showSidebar && renderCourseSidebar()}

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Top Navigation Bar */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-shrink-0 p-6 bg-gradient-to-r from-gray-900/90 via-gray-800/90 to-gray-900/90 backdrop-blur-xl border-b border-gray-700/50 shadow-lg"
            >
              <div className="flex items-center justify-between">
                {/* Course Info */}
                <div className="flex items-center gap-4">
                  {!showSidebar && (
                    <motion.button
                      onClick={() => setShowSidebar(true)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300"
                    >
                      <IconWrapper icon={FaChevronRight} size={16} />
                    </motion.button>
                  )}
                  
                  <div className="flex items-center gap-3">
                    <motion.button
                      onClick={() => navigate('/ai-courses')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300"
                    >
                      <IconWrapper icon={FaChevronLeft} size={16} />
                    </motion.button>
                    
                    {course && (
                      <div>
                        <h2 className="text-lg font-bold text-white">
                          {course.title}
                        </h2>
                        <p className="text-sm text-gray-400">
                          {course.instructor_name} • {course.total_lectures} lectures
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Progress Bar */}
                  {course && sections.length > 0 && (
                    <div className="hidden lg:flex items-center gap-3 ml-6">
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                            style={{
                              width: `${(() => {
                                const totalLectures = sections.reduce((acc, section) => acc + section.course_lectures.length, 0);
                                const completedLectures = lectureProgress.filter(p => p.completed).length;
                                return totalLectures > 0 ? (completedLectures / totalLectures) * 100 : 0;
                              })()}%`
                            }}
                          />
                        </div>
                        <span className="text-sm font-bold text-blue-400">
                          {(() => {
                            const totalLectures = sections.reduce((acc, section) => acc + section.course_lectures.length, 0);
                            const completedLectures = lectureProgress.filter(p => p.completed).length;
                            return totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;
                          })()}%
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={toggleBookmark}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`p-3 rounded-xl transition-all duration-300 border ${
                        isBookmarked 
                          ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' 
                          : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-500/10 border-gray-600/50'
                      }`}
                    >
                      <IconWrapper icon={FaBookmark} size={16} />
                    </motion.button>
                    
                    <motion.button
                      onClick={markAsComplete}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`p-3 rounded-xl transition-all duration-300 border ${
                        isCompleted 
                          ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                          : 'text-gray-400 hover:text-green-400 hover:bg-green-500/10 border-gray-600/50'
                      }`}
                    >
                      <IconWrapper icon={FaCheck} size={16} />
                    </motion.button>
                    
                    <motion.button
                      onClick={() => {/* Share functionality */}}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-3 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all duration-300 border border-gray-600/50"
                    >
                      <IconWrapper icon={FaShare} size={16} />
                    </motion.button>
                  </div>
                </div>
              </div>
              
              {/* Lecture Info Bar */}
              {currentLecture && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      currentLecture.lecture_type === 'video' 
                        ? 'bg-gradient-to-r from-red-500 to-pink-500' 
                        : 'bg-gradient-to-r from-blue-500 to-purple-500'
                    } shadow-lg`}>
                      <IconWrapper 
                        icon={currentLecture.lecture_type === 'video' ? FaVideo : FaFileAlt} 
                        className="text-white" 
                        size={16} 
                      />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-white">
                        {currentLecture.title}
                      </h1>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-400 font-medium">
                          {currentLecture.lecture_type === 'video' ? 'Video Lecture' : 'Article'}
                        </span>
                        {currentLecture.video_duration_seconds && (
                          <>
                            <span className="text-gray-500">•</span>
                            <span className="text-xs text-blue-400 font-medium">
                              {formatTime(currentLecture.video_duration_seconds)}
                            </span>
                          </>
                        )}
                        {currentLecture.is_free && (
                          <>
                            <span className="text-gray-500">•</span>
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-medium">
                              Free
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Lecture Navigation */}
                  <div className="flex items-center gap-2">
                    <motion.button
                      onClick={goToPreviousLecture}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!canGoPrevious()}
                    >
                      <IconWrapper icon={FaBackward} size={16} />
                    </motion.button>
                    
                    <motion.button
                      onClick={goToNextLecture}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={!canGoNext()}
                    >
                      <IconWrapper icon={FaForward} size={16} />
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Content Area - Fixed height with proper overflow */}
            <div className="flex-1 overflow-hidden">
              {currentLecture?.lecture_type === 'video' ? renderVideoPlayer() : renderArticleContent()}
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant Floating Button - Repositioned to bottom-right */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1, type: "spring", damping: 15 }}
        className="fixed bottom-6 right-6 z-[80]"
      >
        <motion.button
          onClick={() => setShowAIChat(true)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="relative p-4 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 text-white rounded-full shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-full blur-lg opacity-75 group-hover:opacity-100 transition-opacity animate-pulse"></div>
          <div className="relative">
            <IconWrapper icon={FaRobot} size={24} />
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-400 rounded-full border-2 border-gray-900 flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          </div>
        </motion.button>
      </motion.div>

      {/* AI Assistant Modal - Draggable */}
      <AIAssistantModal
        isOpen={showAIChat}
        onClose={() => setShowAIChat(false)}
        currentLecture={currentLecture}
        messages={aiMessages}
        onSendMessage={sendAIMessage}
        isTyping={isAiTyping}
        question={aiQuestion}
        onQuestionChange={setAiQuestion}
        initialX={window.innerWidth - 450}
        initialY={100}
      />

      {/* Summary Modal */}
      {renderSummarySidePanel()}

      {/* NotificationModal */}
      <NotificationModal
        isOpen={notification.isOpen}
        onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />

      {/* Note Modal */}
      {renderNoteModal()}
    </div>
  );
};

export default CoursePlayer; 