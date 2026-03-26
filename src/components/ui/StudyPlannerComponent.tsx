import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AiOutlineBulb, AiOutlineRobot, AiOutlineUp, AiOutlineDown, AiOutlineLineChart } from 'react-icons/ai';
import { FiCalendar, FiClock, FiCheck, FiPlus, FiEdit, FiTrash2, FiFilter, FiChevronLeft, FiChevronRight, FiUpload, FiBook, FiChevronUp, FiChevronDown, FiX, FiAlertTriangle, FiBell } from 'react-icons/fi';
import { FaCalendarAlt, FaSort, FaSortAmountDown, FaTimes, FaBell, FaBrain } from 'react-icons/fa';
import IconComponent from './IconComponent';
import { useLanguage } from '../../utils/LanguageContext';
import { useAppData, StudyTask } from '../../utils/AppDataContext';
import { useNotification } from '../../utils/NotificationContext';
import { useAuth } from '../../utils/AuthContext';
import { supabase } from '../../utils/supabase';
import { useResponseCheck, ResponseUpgradeModal } from '../../utils/responseChecker';
import * as echarts from 'echarts';

export interface StudyPlannerHistory {
  id: string;
  created_at: string;
  roadmap_data: any;
  webhook_response: any;
  title?: string;
}

export interface StudyPlannerComponentHandle {
  loadHistoryItem: (item: StudyPlannerHistory) => void;
  refreshHistory: () => void;
}

interface StudyPlannerComponentProps {
  className?: string;
  onToggleHistory?: () => void;
  onRefreshHistory?: () => void;
}

// Portal Modal Component - renders at document.body level
interface PortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  fullScreen?: boolean;
}

const PortalModal: React.FC<PortalModalProps> = ({ isOpen, onClose, children, className = '', fullScreen = false }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <AnimatePresence>
      <motion.div 
        className="bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9999
        }}
      >
        <motion.div 
          className={className}
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'relative',
            maxWidth: fullScreen ? '100vw' : '90vw',
            maxHeight: fullScreen ? '100vh' : '90vh',
            width: fullScreen ? '100%' : undefined,
            height: fullScreen ? '100%' : undefined
          }}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

// Simple ECharts Wrapper
const SimpleChart = ({ option, style, className, theme }: { option: any, style?: React.CSSProperties, className?: string, theme?: string }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (chartRef.current) {
      // Dispose existing instance if it exists (to handle theme changes)
      if (chartInstance.current) {
        chartInstance.current.dispose();
      }
      // Initialize new instance
      chartInstance.current = echarts.init(chartRef.current, theme);
      chartInstance.current.setOption(option);
    }

    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
      chartInstance.current = null;
    };
  }, [theme]); // Re-initialize when theme changes

  // Update options when data changes
  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.setOption(option);
    }
  }, [option]);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.resize();
    }
  }, [style, className]);

  return <div ref={chartRef} style={style} className={className} />;
};

// Generate a proper UUID v4
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const StudyPlannerComponent = React.forwardRef<StudyPlannerComponentHandle, StudyPlannerComponentProps>(({ className = '', onToggleHistory, onRefreshHistory }, ref) => {
  const topRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();
  const { showSuccess, showError, showWarning } = useNotification();
  const { user } = useAuth();
  const { checkAndUseResponse } = useResponseCheck();
  const { studyTasks, addStudyTask, updateStudyTask, deleteStudyTask, setReminder, unsetReminder, refreshData, isLoading } = useAppData();
  
  const [newTask, setNewTask] = useState({
    task: '',
    subject: '',
    date: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    estimatedHours: 1
  });

  // Dark mode detection for charts
  const [isDarkMode, setIsDarkMode] = useState(false);
  useEffect(() => {
    // Initial check
    if (document.documentElement.classList.contains('dark')) {
      setIsDarkMode(true);
    }
    // Observer for class changes on html element
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDarkMode(document.documentElement.classList.contains('dark'));
        }
      });
    });
    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [sortBy, setSortBy] = useState('date');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterSubject, setFilterSubject] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [reminderModal, setReminderModal] = useState<{
    isOpen: boolean;
    taskId: string;
  }>({
    isOpen: false,
    taskId: ''
  });
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');

  // AI Timetable Import state
  const [showAIModal, setShowAIModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ file: File; base64: string; extractedText: string; imageUrl?: string } | null>(null);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<any>(null);

  // AI Suggestion state
  const [showAISuggestionModal, setShowAISuggestionModal] = useState(false);
  const [suggestionDateRange, setSuggestionDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  const [showRoadmapResultModal, setShowRoadmapResultModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeMessage, setUpgradeMessage] = useState('');
  const [upgradeCtaType, setUpgradeCtaType] = useState<'coins' | 'subscription'>('subscription');
  const [aiSuggestionResult, setAiSuggestionResult] = useState<{
    priorityMatrix?: Array<{
      category: string; 
      tasks: Array<{
        name: string; 
        urgency: string; 
        importance: string;
        hasReminder?: boolean;
        daysUntilDue?: number;
      }>
    }>;
    timeline?: Array<{
      phase: string; 
      duration: string; 
      tasks: Array<{description: string; priority: string; hasReminder: boolean; source: string} | string>; 
      milestones: Array<{description: string; date: string; type: string}>;
      reminders?: Array<{date: string; task: string; type: string; description: string}>;
    }>;
    applicationStrategy?: Array<{
      status: string; 
      actions: Array<{description: string; priority: string; deadline: string} | string>; 
      timeline: string;
      reminders?: Array<{date: string; description: string}>;
    }>;
    studyOptimization?: Array<{
      subject: string; 
      timeAllocation: string; 
      totalTasks?: number;
      completedTasks?: number;
      strategy: string; 
      resources: string[];
      upcomingDeadlines?: Array<{date: string; task: string; priority: string}>;
    }>;
    deadlineManagement?: Array<{
      deadline: string; 
      type: string; 
      priority: string; 
      university?: string;
      subject?: string;
      daysUntil?: number;
      actions: string[];
      reminders?: Array<{date: string; description: string}>;
    }>;
    workloadDistribution?: Array<{
      week: string; 
      studyHours: string; 
      applicationHours: string; 
      totalTasks?: number;
      highPriorityTasks?: number;
      focus: string[];
      criticalDeadlines?: Array<{date: string; type: string; description: string}>;
      reminders?: Array<{date: string; description: string}>;
    }>;
    riskMitigation?: Array<{
      risk: string; 
      impact: string; 
      likelihood?: string;
      mitigation: string[];
      monitoringReminders?: Array<{date: string; description: string}>;
    }>;
    progressTracking?: Array<{
      milestone: string; 
      deadline: string; 
      status?: string;
      relatedTasks?: number;
      criteria: string[];
      reminders?: Array<{date: string; description: string}>;
      dependencies?: Array<{task: string; status: string}>;
    }>;
    rawText?: string;
    reminderManagement?: Array<{
      date: string;
      type: string;
      priority: string;
      task: string;
      university?: string;
      actions?: string[];
      followUps?: Array<{
        date: string;
        description: string;
      }>;
    }>;
  }>({});

  // History state - No longer used for display here, but methods kept for compatibility/lifting if needed.
  // Actually, we keep local history state for now as the parent might just toggle visibility, 
  // or we can remove the internal panel rendering if the parent renders it.
  // For this step, let's keep internal logic but use the prop to toggle if provided.

  // Remove the interface declaration since it's now exported above
  // interface StudyPlannerHistory { ... }

  const [history, setHistory] = useState<StudyPlannerHistory[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Expose methods to parent
  React.useImperativeHandle(ref, () => ({
    loadHistoryItem,
    refreshHistory: fetchHistory
  }));

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const buttonVariants = {
    hover: { scale: 1.05, boxShadow: "0px 5px 15px rgba(0, 0, 0, 0.1)" },
    tap: { scale: 0.98 }
  };

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const formatDateForComparison = (date: Date) => {
    // Use local date components to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getTasksForDate = (date: Date) => {
    const dateString = formatDateForComparison(date);
    const tasks = studyTasks.filter(task => task.date === dateString);
    
    return tasks.sort((a, b) => {
      // Sort by priority and completion status
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-20 sm:h-24 border border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-transparent"></div>
      );
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const tasksForDay = getTasksForDate(date);
      const isToday = formatDateForComparison(date) === formatDateForComparison(new Date());
      const isSelected = selectedCalendarDate && formatDateForComparison(date) === formatDateForComparison(selectedCalendarDate);

      days.push(
        <motion.div
          key={day}
          className={`h-20 sm:h-24 border border-gray-200 dark:border-white/5 p-1 cursor-pointer transition-all duration-200 ${
            isToday ? 'bg-cyan-50 dark:bg-cyan-500/10 border-cyan-500/30' : 
            isSelected ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-500/30' : 
            'hover:bg-gray-100 dark:hover:bg-white/5 bg-white dark:bg-transparent'
          }`}
          onClick={() => {
            const dateStr = formatDateForComparison(date);
            // If clicking the already selected date, deselect it
            if (isSelected) {
              setSelectedCalendarDate(null);
              setSelectedDate('');
            } else {
              setSelectedCalendarDate(date);
              setSelectedDate(dateStr);
            }
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className={`text-sm font-medium mb-1 ${
            isToday ? 'text-cyan-600 dark:text-cyan-400' : 
            isSelected ? 'text-blue-600 dark:text-blue-400' : 
            'text-gray-700 dark:text-gray-400'
          }`}>
            {day}
          </div>
          <div className="space-y-1 overflow-hidden">
            {tasksForDay.slice(0, 2).map((task, index) => (
              <div
                key={task.id}
                className={`text-[10px] sm:text-xs px-1 py-0.5 rounded truncate ${
                  task.priority === 'high' ? 'bg-red-500/10 text-red-600 dark:text-red-400' :
                  task.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400' :
                  'bg-green-500/10 text-green-600 dark:text-green-400'
                } ${task.completed ? 'opacity-50 line-through' : ''}`}
                title={task.task}
              >
                {task.task}
              </div>
            ))}
            {tasksForDay.length > 2 && (
              <div className="text-[10px] sm:text-xs text-gray-500 dark:text-slate-400 px-1">
                +{tasksForDay.length - 2}
              </div>
            )}
          </div>
        </motion.div>
      );
    }

    return (
      <div className="bg-transparent rounded-2xl p-4">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <div className="flex items-center space-x-2">
            <motion.button
              onClick={() => navigateMonth('prev')}
              className="p-2 bg-gray-100 dark:bg-[#27272a] hover:bg-gray-200 dark:hover:bg-[#3f3f46] rounded-lg text-gray-600 dark:text-gray-400 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <IconComponent icon={FiChevronLeft} className="h-4 w-4" />
            </motion.button>
            <motion.button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-2 bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Today
            </motion.button>
            <motion.button
              onClick={() => navigateMonth('next')}
              className="p-2 bg-gray-100 dark:bg-[#27272a] hover:bg-gray-200 dark:hover:bg-[#3f3f46] rounded-lg text-gray-600 dark:text-gray-400 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <IconComponent icon={FiChevronRight} className="h-4 w-4" />
            </motion.button>
          </div>
        </div>

        {/* Day Names */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div key={day} className="text-center text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days}
        </div>
      </div>
    );
  };

  // Updated task addition handler to ensure database save
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.task.trim() || !newTask.subject.trim() || !newTask.date) return;
    
    try {
      const task: StudyTask = {
        id: generateUUID(),
        ...newTask,
        completed: false,
        source: 'study'
      };
      
      await addStudyTask(task);
      
      // Clear form and close
      setNewTask({
        task: '',
        subject: '',
        date: '',
        priority: 'medium',
        estimatedHours: 1
      });
      setShowAddForm(false);
      
      showSuccess('Task added successfully!');
    } catch (error) {
      console.error('Error adding task:', error);
      showError('Failed to add task. Please try again.');
    }
  };

  const handleTaskToggle = async (id: string) => {
    try {
      const task = studyTasks.find(t => t.id === id);
      if (task) {
        await updateStudyTask(id, { completed: !task.completed });
        showSuccess(task.completed ? 'Task marked as incomplete' : 'Task completed!');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      showError('Failed to update task. Please try again.');
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      await deleteStudyTask(id);
      showSuccess('Task deleted successfully!');
    } catch (error) {
      console.error('Error deleting task:', error);
      showError('Failed to delete task. Please try again.');
    }
  };

  const handlePriorityUpdate = async (taskId: string, currentPriority: 'low' | 'medium' | 'high') => {
    try {
      const priorityOrder: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
      const currentIndex = priorityOrder.indexOf(currentPriority);
      const nextIndex = (currentIndex + 1) % priorityOrder.length;
      const newPriority = priorityOrder[nextIndex];
      
      await updateStudyTask(taskId, { priority: newPriority });
      showSuccess(`Priority updated to ${newPriority}!`);
    } catch (error) {
      console.error('Error updating priority:', error);
      showError('Failed to update priority. Please try again.');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  // Filter tasks to show only:
  // 1. Study tasks 
  // 2. Tasks from applications that have reminders set
  const getFilteredAndSortedTasks = () => {
    let filtered = studyTasks.filter(task => task.source !== 'application' || !task.source);
    
    // Apply priority filter
    if (filterPriority !== 'all') {
      filtered = filtered.filter(task => task.priority === filterPriority);
    }
    
    // Apply subject filter
    if (filterSubject !== 'all') {
      filtered = filtered.filter(task => task.subject === filterSubject);
    }

    // Apply date filter if selectedDate is set
    if (selectedDate) {
      filtered = filtered.filter(task => task.date === selectedDate);
    }

    // Sort by the selected criteria
    switch (sortBy) {
      case 'priority':
        filtered.sort((a, b) => {
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          }
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
        break;
      case 'subject':
        filtered.sort((a, b) => {
          if (a.subject !== b.subject) {
            return a.subject.localeCompare(b.subject);
          }
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        });
        break;
      case 'date':
      default:
        filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
    }

    return filtered;
  };

  // Get applications with reminders for calendar display
  // Get unique subjects for filter
  const getUniqueSubjects = () => {
    return Array.from(new Set(studyTasks.map(task => task.subject)));
  };

  const clearFilters = () => {
    setSelectedDate('');
    setSelectedCalendarDate(null);
    setFilterPriority('all');
    setFilterSubject('all');
  };

  // Reminder functions
  const openReminderModal = (taskId: string) => {
    setReminderModal({
      isOpen: true,
      taskId
    });
    
    // Pre-fill with existing reminder if available for study tasks only
    const task = studyTasks.find(t => t.id === taskId);
    if (task?.reminderDate) {
      const reminderDate = new Date(task.reminderDate);
      setReminderDate(reminderDate.toISOString().split('T')[0]);
      setReminderTime(reminderDate.toTimeString().slice(0, 5));
    } else {
      setReminderDate('');
      setReminderTime('');
    }
  };

  const closeReminderModal = () => {
    setReminderModal({
      isOpen: false,
      taskId: ''
    });
    setReminderDate('');
    setReminderTime('');
  };

  const handleSetReminder = async () => {
    if (!reminderModal.isOpen || !reminderDate || !reminderTime) return;

    try {
      const reminderDateTime = `${reminderDate}T${reminderTime}`;
      const taskId = reminderModal.taskId;
      
      // Only handle real study tasks
      await updateStudyTask(taskId, { 
        reminder: true, 
        reminderDate: reminderDateTime 
      });
      showSuccess('Reminder set successfully!');
      
      closeReminderModal();
    } catch (error) {
      console.error('Error setting reminder:', error);
      showError('Failed to set reminder. Please try again.');
    }
  };

  const handleUnsetReminder = async () => {
    if (!reminderModal.isOpen) return;

    try {
      const taskId = reminderModal.taskId;
      
      // Only handle real study tasks
      await updateStudyTask(taskId, { 
        reminder: false, 
        reminderDate: undefined 
      });
      showSuccess('Reminder removed successfully!');
      
      closeReminderModal();
    } catch (error) {
      console.error('Error removing reminder:', error);
      showError('Failed to remove reminder. Please try again.');
    }
  };

  // AI Processing Functions
  const handleFileUpload = async (file: File): Promise<string> => {
    try {
      console.log('🔄 Starting file upload process:', file.name, file.type, file.size);
      
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      console.log('✅ File converted to base64, length:', base64.length);
      console.log('📡 Making API request to extract text from image...');

      const requestPayload = {
        model: "doubao-seed-1-6-vision-250815",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: base64
                }
              },
              {
                type: "text",
                text: "Please extract all text from this timetable/schedule image exactly as it appears, maintaining line breaks and formatting. Focus on identifying dates, times, subjects, assignments, deadlines, and any other academic content. Provide a clear, structured extraction of all visible information."
              }
            ]
          }
        ],
        stream: true
      };

      const response = await fetch(process.env.REACT_APP_DASHSCOPE_ENDPOINT || 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REACT_APP_DASHSCOPE_API_KEY || ''}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload)
      });

      console.log('📊 API Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ API Error Response:', errorText);
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      let extractedText = '';
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = new TextDecoder().decode(value);
          const lines = chunk.split('\n').filter(line => line.trim() !== '');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta) {
                  const delta = parsed.choices[0].delta;
                  if (delta.content) {
                    extractedText += delta.content;
                  }
                }
              } catch (parseError) {
                console.warn('Failed to parse streaming data:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      console.log('✅ Text extraction completed, length:', extractedText.length);
      return extractedText.trim();
    } catch (error) {
      console.error('💥 Error extracting text from file:', error);
      throw new Error('Failed to extract text from file. Please try again.');
    }
  };

  const analyzeWithAI = async (extractedText: string): Promise<any> => {
    try {
      const response = await fetch(process.env.REACT_APP_DASHSCOPE_ENDPOINT || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.REACT_APP_DASHSCOPE_API_KEY || ''}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: "doubao-seed-1-6-vision-250815",
          messages: [
            {
              role: "system",
              content: [
                {
                  type: "text", 
                  text: "You are an AI assistant that analyzes academic timetables and schedules. Your task is to extract study tasks, assignments, deadlines, and academic events from the provided text. Return a JSON array of tasks with the following structure: [{\"title\": \"task name\", \"subject\": \"subject name\", \"dueDate\": \"YYYY-MM-DD\", \"priority\": \"high|medium|low\", \"description\": \"additional details\", \"type\": \"assignment|exam|project|study|other\"}]. Predict priority based on urgency and importance. Use current date as reference if no year is specified."
                }
              ]
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Please analyze this timetable/schedule text and extract all study tasks, assignments, deadlines, and academic events. Return only a valid JSON array of tasks:\n\n${extractedText}`
                }
              ]
            }
          ],
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      const content = result.choices?.[0]?.message?.content || '';
      
      // Extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in AI response');
      }
    } catch (error) {
      console.error('Error analyzing with AI:', error);
      throw new Error('Failed to analyze timetable with AI. Please try again.');
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const responseCheck = await checkAndUseResponse({
      responseType: 'study_planner_upload_access',
      queryData: { type: 'file_upload' },
      consumeCredits: false,
      requireCoins: true,
      noCoinsMessage: 'Please buy more coins to continue.'
    });
    if (!responseCheck.canProceed) {
      if (responseCheck.showUpgradeModal) {
        setUpgradeMessage(responseCheck.message || 'You need an active subscription or coins to upload files.');
        setUpgradeCtaType(responseCheck.ctaType || 'subscription');
        setShowUpgradeModal(true);
      }
      if (e.target) {
        e.target.value = '';
      }
      return;
    }

    // Check file type (only images for now)
    if (!file.type.startsWith('image/')) {
      showWarning('Please select an image file (PNG, JPG, JPEG, GIF). Only images are supported for now.');
      return;
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      showWarning('File size must be less than 10MB');
      return;
    }

    if (!user) {
      showError('Please sign in to upload files.');
      return;
    }

    try {
      setIsUploading(true);

      // 1. Upload to Supabase
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/ai-import/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(filePath);

      let extractedText = '';
      try {
        extractedText = await handleFileUpload(file);
      } catch (extractError) {
        console.warn('Text extraction failed, but proceeding with image:', extractError);
        // Continue without extracted text
      }
      
      // Create base64 string for display
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      setUploadedFile({
        file,
        base64,
        extractedText,
        imageUrl: publicUrl
      });

      showSuccess('File uploaded successfully!');

    } catch (error) {
      console.error('Error processing file:', error);
      showError('Failed to process file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Helper to save tasks to database
  const saveTasksToDatabase = async (tasks: any[]) => {
    let addedCount = 0;
    const taskPromises = tasks.map(async (task: any) => {
      if (task.title && task.dueDate) {
        const newTask: StudyTask = {
          id: generateUUID(),
          task: task.title,
          subject: task.subject || 'General',
          date: task.dueDate,
          priority: task.priority || 'medium',
          completed: false,
          estimatedHours: task.estimatedHours || 2,
          source: 'study'
        };
        await addStudyTask(newTask);
        addedCount++;
      }
    });
    await Promise.all(taskPromises);
    return addedCount;
  };

  const processWithAI = async () => {
    if (!uploadedFile) return;
    const responseCheck = await checkAndUseResponse({
      responseType: 'study_planner_analysis',
      queryData: {
        hasUploadedFile: true,
        hasExtractedText: !!uploadedFile.extractedText
      },
      requireCoins: true,
      noCoinsMessage: 'Please buy more coins to continue.'
    });
    if (!responseCheck.canProceed) {
      if (responseCheck.showUpgradeModal) {
        setUpgradeMessage(responseCheck.message || 'You need an active subscription or coins to continue.');
        setUpgradeCtaType(responseCheck.ctaType || 'subscription');
        setShowUpgradeModal(true);
      }
      return;
    }

    try {
      setIsProcessingAI(true);

      // Call Webhook if imageUrl is available
      if (uploadedFile.imageUrl && user) {
        const webhookUrl = 'https://n8n.matrixaiserver.com/webhook/b95c1be4-c8db-47a1-bcd3-a871834037f3';
        
        // Format timestamp as "YYYY-MM-DD HH:mm:ss.SSS"
        const now = new Date();
        const formattedTimestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(now.getMilliseconds()).padStart(3, '0')}`;

        const payload = {
          uid: user.id,
          image_url: uploadedFile.imageUrl,
          timestamp: formattedTimestamp
        };

        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
        }

        const rawData = await response.json();
        console.log('Webhook response:', rawData);

        let tasksData: any[] = [];
        
        // Handle nested format: [{ data: [...] }]
        if (Array.isArray(rawData) && rawData.length > 0 && rawData[0]?.data && Array.isArray(rawData[0].data)) {
            tasksData = rawData[0].data;
        } 
        // Handle object format: { data: [...] }
        else if (rawData && typeof rawData === 'object' && rawData.data && Array.isArray(rawData.data)) {
            tasksData = rawData.data;
        }
        // Handle flat format: [...]
        else if (Array.isArray(rawData)) {
            tasksData = rawData;
        }

        console.log('Parsed tasks data:', tasksData);

        // Map webhook response to internal format
        const analysis = tasksData.map((item: any) => ({
          title: item.task_text,
          subject: item.subject,
          dueDate: item.date,
          priority: item.priority?.toLowerCase() || 'medium',
          estimatedHours: Number(item.estimated_hours) || 1
        }));

        // Auto-save tasks directly
        const addedCount = await saveTasksToDatabase(analysis);
        showSuccess(`Successfully added ${addedCount} tasks to your study planner!`);
        setShowAIModal(false);
        setUploadedFile(null);
        setAiAnalysisResult(null);

      } else {
        // Fallback to local extraction
        if (!uploadedFile.extractedText) {
             throw new Error("No text extracted and no image URL available.");
        }
        const analysis = await analyzeWithAI(uploadedFile.extractedText);
        setAiAnalysisResult(analysis);
        showSuccess(`AI found ${analysis.length} tasks in your timetable!`);
      }
    } catch (error) {
      console.error('Error processing with AI:', error);
      showError('Failed to analyze timetable with AI. Please try again.');
    } finally {
      setIsProcessingAI(false);
    }
  };

  // Updated AI task addition to ensure database save
  const addAITasks = async () => {
    if (!aiAnalysisResult) return;

    try {
      const addedCount = await saveTasksToDatabase(aiAnalysisResult);
      showSuccess(`Successfully added ${addedCount} tasks to your study planner!`);
      setShowAIModal(false);
      setUploadedFile(null);
      setAiAnalysisResult(null);
    } catch (error) {
      console.error('Error adding AI tasks:', error);
      showError('Failed to add some tasks. Please try again.');
    }
  };

  const closeAIModal = () => {
    setShowAIModal(false);
    setUploadedFile(null);
    setAiAnalysisResult(null);
  };

  // History functions
  const fetchHistory = async () => {
    if (!user) return;
    try {
      setIsLoadingHistory(true);
      const { data, error } = await supabase
        .from('study_planner_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error fetching history:', error);
      showError('Failed to load history.');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const saveHistory = async (roadmapData: any, webhookResponse: any, title?: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('study_planner_history')
        .insert({
          user_id: user.id,
          roadmap_data: roadmapData,
          webhook_response: webhookResponse,
          title: title || `Study Plan - ${new Date().toLocaleDateString()}`
        });

      if (error) throw error;
      
      // Notify parent to refresh history
      if (onRefreshHistory) {
        onRefreshHistory();
      }
      
      // Refresh local history if using internal state
      fetchHistory();
    } catch (error) {
      console.error('Error saving history:', error);
    }
  };

  const loadHistoryItem = (item: StudyPlannerHistory) => {
    setAiSuggestionResult({
      ...item.roadmap_data,
      rawText: typeof item.roadmap_data === 'string' ? item.roadmap_data : JSON.stringify(item.roadmap_data)
    });
    setShowHistoryModal(false);
    setShowRoadmapResultModal(true);
  };

  // AI Suggestion Functions
  const generateAISuggestion = async () => {
    const responseCheck = await checkAndUseResponse({
      responseType: 'study_planner_roadmap',
      queryData: {
        startDate: suggestionDateRange.startDate,
        endDate: suggestionDateRange.endDate,
        hasCustomPrompt: !!customPrompt.trim()
      },
      requireCoins: true,
      noCoinsMessage: 'Please buy more coins to continue.'
    });
    if (!responseCheck.canProceed) {
      if (responseCheck.showUpgradeModal) {
        setUpgradeMessage(responseCheck.message || 'You need an active subscription or coins to continue.');
        setUpgradeCtaType(responseCheck.ctaType || 'subscription');
        setShowUpgradeModal(true);
      }
      return;
    }

    try {
      setIsGeneratingSuggestion(true);
      
      // Get all study tasks (including those synced from applications)
      let allStudyTasks = studyTasks;
      
      // Validate date range as it is required
      if (!suggestionDateRange.startDate || !suggestionDateRange.endDate) {
        showError('Please select a date range for the AI Roadmap.');
        setIsGeneratingSuggestion(false);
        return;
      }
      
      // Filter by date range
      if (suggestionDateRange.startDate && suggestionDateRange.endDate) {
        allStudyTasks = studyTasks.filter(task => {
          const taskDate = new Date(task.date);
          const startDate = new Date(suggestionDateRange.startDate);
          const endDate = new Date(suggestionDateRange.endDate);
          return taskDate >= startDate && taskDate <= endDate;
        });
      }

      // Prepare comprehensive study task data
      const studyTaskData = allStudyTasks.map(task => ({
        id: task.id,
        title: task.task,
        subject: task.subject,
        dueDate: task.date,
        priority: task.priority,
        estimatedHours: task.estimatedHours,
        completed: task.completed,
        source: task.source || 'study',
        applicationId: task.applicationId,
        hasReminder: !!task.reminder,
        reminderDate: task.reminderDate,
        daysUntilDue: Math.ceil((new Date(task.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      }));

      // Calculate comprehensive statistics
      const stats = {
        totalStudyTasks: allStudyTasks.length,
        completedStudyTasks: allStudyTasks.filter(t => t.completed).length,
        pendingStudyTasks: allStudyTasks.filter(t => !t.completed).length,
        totalEstimatedHours: allStudyTasks.reduce((sum, task) => sum + task.estimatedHours, 0),
        highPriorityTasks: allStudyTasks.filter(t => t.priority === 'high').length,
        mediumPriorityTasks: allStudyTasks.filter(t => t.priority === 'medium').length,
        lowPriorityTasks: allStudyTasks.filter(t => t.priority === 'low').length,
        overdueTasks: allStudyTasks.filter(t => new Date(t.date) < new Date() && !t.completed).length,
        tasksWithReminders: allStudyTasks.filter(t => t.reminder).length,
        applicationTasks: allStudyTasks.filter(task => task.source === 'application').length,
        studyOnlyTasks: allStudyTasks.filter(task => task.source === 'study').length
      };

      const now = new Date();
      const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(now.getMilliseconds()).padStart(3, '0')}`;

      // Prepare payload for N8N webhook
      const payload = {
        uid: user?.id,
        timestamp: timestamp,
        custom_request: customPrompt || '',
        date_range: {
          start: suggestionDateRange.startDate || null,
          end: suggestionDateRange.endDate || null
        },
        tasks: studyTaskData,
        stats: stats
      };

      const response = await fetch('https://n8n.matrixaiserver.com/webhook/363f0bef-d88e-4658-a9ab-94bed9bbe4bd', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // Try to find XML content in the response
      let xmlContent = '';
      
      // Check if response is directly the XML string (in a JSON property like 'output' or 'text')
      // or if it matches the previous structure
      if (result.choices?.[0]?.message?.content) {
        xmlContent = result.choices[0].message.content;
      } else if (result.output) {
        // Check if output is already an object (the new JSON structure)
        if (typeof result.output === 'object' && result.output !== null) {
          setAiSuggestionResult({
            ...result.output,
            rawText: JSON.stringify(result.output)
          });
          await saveHistory(result.output, result);
          setShowRoadmapResultModal(true);
          showSuccess('Comprehensive AI roadmap generated successfully!');
          return;
        }
        xmlContent = result.output;
      } else if (result.xml) {
        xmlContent = result.xml;
      } else if (typeof result === 'string' && result.includes('<roadmap>')) {
        xmlContent = result;
      } else if (typeof result === 'object') {
        // If it's a JSON object, maybe we can just use it directly if it matches our internal structure?
        // But for now, let's assume the webhook returns the XML or we need to extract it.
        // If the webhook returns the roadmap object directly (not XML), we might need a different handler.
        // For safety, let's check if we can stringify it and find XML tags, or just assume it might be the parsed data.
        
        // If the response IS the parsed data structure (timeline, priorityMatrix, etc.)
        if (result.timeline || result.priorityMatrix) {
          setAiSuggestionResult({
            ...result,
            rawText: JSON.stringify(result)
          });
          await saveHistory(result, result);
          setShowRoadmapResultModal(true);
          showSuccess('Comprehensive AI roadmap generated successfully!');
          return;
        }
        
        // Fallback: try to find any string property that looks like XML
        const potentialXml = Object.values(result).find(val => typeof val === 'string' && val.includes('<roadmap>'));
        if (potentialXml) {
          xmlContent = potentialXml as string;
        }
      }

      if (!xmlContent) {
        console.warn('Could not find XML content in response:', result);
        // Fallback or error handling
        // For now, let's try to parse whatever we got or show an error
        if (typeof result === 'string') {
            xmlContent = result;
        } else {
            // If we received JSON but couldn't find XML, maybe it's a different format.
            // Let's just try to stringify it and hope parseXMLRoadmap handles it or fails gracefully
             xmlContent = JSON.stringify(result);
        }
      }
      
      // Check if xmlContent is actually a JSON string
      if (typeof xmlContent === 'string' && (xmlContent.trim().startsWith('{') || xmlContent.trim().startsWith('['))) {
        try {
          const parsedJson = JSON.parse(xmlContent);
          // If the parsed JSON has an output field that is an object, use that
          if (parsedJson.output && typeof parsedJson.output === 'object') {
             setAiSuggestionResult({
              ...parsedJson.output,
              rawText: xmlContent
            });
            await saveHistory(parsedJson.output, result);
            setShowRoadmapResultModal(true);
            showSuccess('Comprehensive AI roadmap generated successfully!');
            return;
          }
          
          // Otherwise, use the parsed JSON directly if it looks like a roadmap
          if (parsedJson.timeline || parsedJson.priorityMatrix) {
             setAiSuggestionResult({
              ...parsedJson,
              rawText: xmlContent
            });
            await saveHistory(parsedJson, result);
            setShowRoadmapResultModal(true);
            showSuccess('Comprehensive AI roadmap generated successfully!');
            return;
          }
        } catch (e) {
          // Not valid JSON, proceed to XML parsing
          console.log('Content is not valid JSON, trying XML');
        }
      }
      
      // Parse XML response
      const parsedData = parseXMLRoadmap(xmlContent);
      
      setAiSuggestionResult({
        ...parsedData,
        rawText: xmlContent
      });
      await saveHistory(parsedData, result);
      setShowRoadmapResultModal(true);
      
      showSuccess('Comprehensive AI roadmap generated successfully! 1 AI response used.');
      
    } catch (error) {
      console.error('Error generating AI suggestion:', error);
      showError('Failed to generate AI suggestion. Please try again.');
    } finally {
      setIsGeneratingSuggestion(false);
    }
  };

  // XML Parser function
  const parseXMLRoadmap = (xmlString: string) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString, 'text/xml');
      
      const result: any = {};
      
      // Parse Priority Matrix
      const priorityMatrix = xmlDoc.getElementsByTagName('priorityMatrix')[0];
      if (priorityMatrix) {
        result.priorityMatrix = Array.from(priorityMatrix.getElementsByTagName('category')).map(category => ({
          category: category.getAttribute('name') || '',
          tasks: Array.from(category.getElementsByTagName('task')).map(task => ({
            name: task.getAttribute('name') || '',
            urgency: task.getAttribute('urgency') || '',
            importance: task.getAttribute('importance') || '',
            hasReminder: task.getAttribute('hasReminder') === 'true',
            daysUntilDue: parseInt(task.getAttribute('daysUntilDue') || '0')
          }))
        }));
      }
      
      // Parse Timeline
      const timeline = xmlDoc.getElementsByTagName('timeline')[0];
      if (timeline) {
        result.timeline = Array.from(timeline.getElementsByTagName('phase')).map(phase => ({
          phase: phase.getAttribute('name') || '',
          duration: phase.getAttribute('duration') || '',
          tasks: Array.from(phase.getElementsByTagName('task')).map(task => ({
            description: task.textContent || '',
            priority: task.getAttribute('priority') || '',
            hasReminder: task.getAttribute('hasReminder') === 'true',
            source: task.getAttribute('source') || ''
          })),
          milestones: Array.from(phase.getElementsByTagName('milestone')).map(milestone => ({
            description: milestone.textContent || '',
            date: milestone.getAttribute('date') || '',
            type: milestone.getAttribute('type') || ''
          })),
          reminders: Array.from(phase.getElementsByTagName('reminder')).map(reminder => ({
            date: reminder.getAttribute('date') || '',
            task: reminder.getAttribute('task') || '',
            type: reminder.getAttribute('type') || '',
            description: reminder.textContent || ''
          }))
        }));
      }
      
      // Parse Application Strategy
      const applicationStrategy = xmlDoc.getElementsByTagName('applicationStrategy')[0];
      if (applicationStrategy) {
        result.applicationStrategy = Array.from(applicationStrategy.getElementsByTagName('status')).map(status => ({
          status: status.getAttribute('name') || '',
          actions: Array.from(status.getElementsByTagName('action')).map(action => ({
            description: action.textContent || '',
            priority: action.getAttribute('priority') || '',
            deadline: action.getAttribute('deadline') || ''
          })),
          timeline: status.getElementsByTagName('timeline')[0]?.textContent || '',
          reminders: Array.from(status.getElementsByTagName('reminder')).map(reminder => ({
            date: reminder.getAttribute('date') || '',
            description: reminder.textContent || ''
          }))
        }));
      }
      
      // Parse Study Optimization
      const studyOptimization = xmlDoc.getElementsByTagName('studyOptimization')[0];
      if (studyOptimization) {
        result.studyOptimization = Array.from(studyOptimization.getElementsByTagName('subject')).map(subject => ({
          subject: subject.getAttribute('name') || '',
          timeAllocation: subject.getAttribute('timeAllocation') || '',
          totalTasks: parseInt(subject.getAttribute('totalTasks') || '0'),
          completedTasks: parseInt(subject.getAttribute('completedTasks') || '0'),
          strategy: subject.getElementsByTagName('strategy')[0]?.textContent || '',
          resources: Array.from(subject.getElementsByTagName('resource')).map(resource => resource.textContent || ''),
          upcomingDeadlines: Array.from(subject.getElementsByTagName('deadline')).map(deadline => ({
            date: deadline.getAttribute('date') || '',
            task: deadline.getAttribute('task') || '',
            priority: deadline.getAttribute('priority') || ''
          }))
        }));
      }
      
      // Parse Deadline Management
      const deadlineManagement = xmlDoc.getElementsByTagName('deadlineManagement')[0];
      if (deadlineManagement) {
        result.deadlineManagement = Array.from(deadlineManagement.getElementsByTagName('deadline')).map(deadline => ({
          deadline: deadline.getAttribute('date') || '',
          type: deadline.getAttribute('type') || '',
          priority: deadline.getAttribute('priority') || '',
          university: deadline.getAttribute('university') || '',
          subject: deadline.getAttribute('subject') || '',
          daysUntil: parseInt(deadline.getAttribute('daysUntil') || '0'),
          actions: Array.from(deadline.getElementsByTagName('action')).map(action => action.textContent || ''),
          reminders: Array.from(deadline.getElementsByTagName('reminder')).map(reminder => ({
            date: reminder.getAttribute('date') || '',
            description: reminder.textContent || ''
          }))
        }));
      }
      
      // Parse Reminder Management (NEW)
      const reminderManagement = xmlDoc.getElementsByTagName('reminderManagement')[0];
      if (reminderManagement) {
        result.reminderManagement = Array.from(reminderManagement.getElementsByTagName('reminder')).map(reminder => ({
          date: reminder.getAttribute('date') || '',
          type: reminder.getAttribute('type') || '',
          priority: reminder.getAttribute('priority') || '',
          task: reminder.getAttribute('task') || '',
          university: reminder.getAttribute('university') || '',
          actions: Array.from(reminder.getElementsByTagName('action')).map(action => action.textContent || ''),
          followUps: Array.from(reminder.getElementsByTagName('followUp')).map(followUp => ({
            date: followUp.getAttribute('date') || '',
            description: followUp.textContent || ''
          }))
        }));
      }
      
      // Parse Workload Distribution
      const workloadDistribution = xmlDoc.getElementsByTagName('workloadDistribution')[0];
      if (workloadDistribution) {
        result.workloadDistribution = Array.from(workloadDistribution.getElementsByTagName('week')).map(week => ({
          week: week.getAttribute('number') || '',
          studyHours: week.getAttribute('studyHours') || '',
          applicationHours: week.getAttribute('applicationHours') || '',
          totalTasks: parseInt(week.getAttribute('totalTasks') || '0'),
          highPriorityTasks: parseInt(week.getAttribute('highPriorityTasks') || '0'),
          focus: Array.from(week.getElementsByTagName('focus')).map(focus => focus.textContent || ''),
          criticalDeadlines: Array.from(week.getElementsByTagName('deadline')).map(deadline => ({
            date: deadline.getAttribute('date') || '',
            type: deadline.getAttribute('type') || '',
            description: deadline.textContent || ''
          })),
          reminders: Array.from(week.getElementsByTagName('reminder')).map(reminder => ({
            date: reminder.getAttribute('date') || '',
            description: reminder.textContent || ''
          }))
        }));
      }
      
      // Parse Risk Mitigation
      const riskMitigation = xmlDoc.getElementsByTagName('riskMitigation')[0];
      if (riskMitigation) {
        result.riskMitigation = Array.from(riskMitigation.getElementsByTagName('risk')).map(risk => ({
          risk: risk.getAttribute('name') || '',
          impact: risk.getAttribute('impact') || '',
          likelihood: risk.getAttribute('likelihood') || '',
          mitigation: Array.from(risk.getElementsByTagName('mitigation')).map(mitigation => mitigation.textContent || ''),
          monitoringReminders: Array.from(risk.getElementsByTagName('monitoringReminder')).map(reminder => ({
            date: reminder.getAttribute('date') || '',
            description: reminder.textContent || ''
          }))
        }));
      }
      
      // Parse Progress Tracking
      const progressTracking = xmlDoc.getElementsByTagName('progressTracking')[0];
      if (progressTracking) {
        result.progressTracking = Array.from(progressTracking.getElementsByTagName('milestone')).map(milestone => ({
          milestone: milestone.getAttribute('name') || '',
          deadline: milestone.getAttribute('deadline') || '',
          status: milestone.getAttribute('status') || '',
          relatedTasks: parseInt(milestone.getAttribute('relatedTasks') || '0'),
          criteria: Array.from(milestone.getElementsByTagName('criteria')).map(criteria => criteria.textContent || ''),
          reminders: Array.from(milestone.getElementsByTagName('reminder')).map(reminder => ({
            date: reminder.getAttribute('date') || '',
            description: reminder.textContent || ''
          })),
          dependencies: Array.from(milestone.getElementsByTagName('dependency')).map(dependency => ({
            task: dependency.getAttribute('task') || '',
            status: dependency.getAttribute('status') || ''
          }))
        }));
      }
      
      return result;
    } catch (error) {
      console.error('Error parsing XML:', error);
      return { rawText: xmlString };
    }
  };

  const closeAISuggestionModal = () => {
    setShowAISuggestionModal(false);
    setSuggestionDateRange({ startDate: '', endDate: '' });
    setCustomPrompt('');
    setAiSuggestionResult({});
  };

  const openAISuggestionModal = () => {
    setShowAISuggestionModal(true);
    // Set default date range to current week
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    setSuggestionDateRange({
      startDate: today.toISOString().split('T')[0],
      endDate: nextWeek.toISOString().split('T')[0]
    });
  };

  // Calculate analysis data using useMemo
  const analysisData = useMemo(() => {
    // Get all study tasks
    let allStudyTasks = studyTasks;
    
    if (suggestionDateRange.startDate && suggestionDateRange.endDate) {
      allStudyTasks = studyTasks.filter(task => {
        const taskDate = new Date(task.date);
        const startDate = new Date(suggestionDateRange.startDate);
        const endDate = new Date(suggestionDateRange.endDate);
        return taskDate >= startDate && taskDate <= endDate;
      });
    }
    
    const completedTasks = allStudyTasks.filter(task => task.completed).length;
    const pendingTasks = allStudyTasks.length - completedTasks;
    const totalHours = allStudyTasks.reduce((sum, task) => sum + task.estimatedHours, 0);
    const highPriorityTasks = allStudyTasks.filter(task => task.priority === 'high').length;
    const overdueTasks = allStudyTasks.filter(task => new Date(task.date) < new Date() && !task.completed).length;

    return {
      allStudyTasks,
      completedTasks,
      pendingTasks,
      totalHours,
      highPriorityTasks,
      overdueTasks
    };
  }, [studyTasks, suggestionDateRange.startDate, suggestionDateRange.endDate]);

  const filteredTasks = getFilteredAndSortedTasks();

  // Updated date change handler to ensure database save
  const handleDateChange = async (taskId: string, newDate: string) => {
    try {
      await updateStudyTask(taskId, { date: newDate });
      showSuccess('Task date updated!');
    } catch (error) {
      console.error('Error updating task date:', error);
      showError('Failed to update task date. Please try again.');
    }
  };

  // Updated subject change handler to ensure database save
  const handleSubjectChange = async (taskId: string, newSubject: string) => {
    try {
      await updateStudyTask(taskId, { subject: newSubject });
      showSuccess('Task subject updated!');
    } catch (error) {
      console.error('Error updating task subject:', error);
      showError('Failed to update task subject. Please try again.');
    }
  };

  // Updated estimated hours change handler to ensure database save
  const handleEstimatedHoursChange = async (taskId: string, newHours: number) => {
    try {
      await updateStudyTask(taskId, { estimatedHours: newHours });
      showSuccess('Estimated hours updated!');
    } catch (error) {
      console.error('Error updating estimated hours:', error);
      showError('Failed to update estimated hours. Please try again.');
    }
  };

  // Updated task name change handler to ensure database save
  const handleTaskNameChange = async (taskId: string, newTaskName: string) => {
    try {
      await updateStudyTask(taskId, { task: newTaskName });
      showSuccess('Task name updated!');
    } catch (error) {
      console.error('Error updating task name:', error);
      showError('Failed to update task name. Please try again.');
    }
  };

  // Chart Options for Roadmap Modal
  const timelineChartOption = useMemo(() => {
    if (!aiSuggestionResult?.timeline) return null;
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: aiSuggestionResult.timeline.map(t => t.phase), axisLabel: { interval: 0, rotate: 30, color: '#9CA3AF' } },
      yAxis: { type: 'value', axisLabel: { color: '#9CA3AF' }, splitLine: { lineStyle: { color: '#374151', type: 'dashed', opacity: 0.3 } } },
      series: [{
        data: aiSuggestionResult.timeline.map(t => parseInt(t.duration) || 1),
        type: 'bar',
        itemStyle: { color: '#10B981', borderRadius: [4, 4, 0, 0] },
        showBackground: true,
        backgroundStyle: { color: 'rgba(180, 180, 180, 0.1)' }
      }]
    };
  }, [aiSuggestionResult, t]);

  const workloadChartOption = useMemo(() => {
    if (!aiSuggestionResult?.workloadDistribution) return null;
    return {
      tooltip: { trigger: 'axis' },
      legend: { data: [t('aiStudy.studyLabel'), t('aiStudy.applicationLabel')], textStyle: { color: '#9CA3AF' }, bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
      xAxis: { type: 'category', data: aiSuggestionResult.workloadDistribution.map(w => w.week), axisLabel: { color: '#9CA3AF' } },
      yAxis: { type: 'value', axisLabel: { color: '#9CA3AF' }, splitLine: { lineStyle: { color: '#374151', type: 'dashed', opacity: 0.3 } } },
      series: [
        {
          name: t('aiStudy.studyLabel'),
          type: 'line',
          smooth: true,
          data: aiSuggestionResult.workloadDistribution.map(w => parseInt(w.studyHours) || 0),
          areaStyle: { opacity: 0.2 },
          itemStyle: { color: '#3B82F6' }
        },
        {
          name: t('aiStudy.applicationLabel'),
          type: 'line',
          smooth: true,
          data: aiSuggestionResult.workloadDistribution.map(w => parseInt(w.applicationHours) || 0),
          areaStyle: { opacity: 0.2 },
          itemStyle: { color: '#8B5CF6' }
        }
      ]
    };
  }, [aiSuggestionResult]);

  const priorityChartOption = useMemo(() => {
    if (!aiSuggestionResult?.priorityMatrix) return null;
    const stats = { High: 0, Medium: 0, Low: 0 };
    aiSuggestionResult.priorityMatrix.forEach(cat => {
      cat.tasks.forEach(t => {
        if (t.urgency.toLowerCase().includes('high')) stats.High++;
        else if (t.urgency.toLowerCase().includes('medium')) stats.Medium++;
        else stats.Low++;
      });
    });
    return {
      tooltip: { trigger: 'item' },
      legend: { bottom: '0%', textStyle: { color: '#9CA3AF' } },
      series: [{
        name: t('aiStudy.taskPriorities'),
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: 'transparent', borderWidth: 2 },
        label: { show: false, position: 'center' },
        emphasis: { label: { show: true, fontSize: '18', fontWeight: 'bold', color: '#9CA3AF' } },
        data: [
          { value: stats.High, name: t('aiStudy.chartHigh'), itemStyle: { color: '#EF4444' } },
          { value: stats.Medium, name: t('aiStudy.chartMedium'), itemStyle: { color: '#F59E0B' } },
          { value: stats.Low, name: t('aiStudy.chartLow'), itemStyle: { color: '#10B981' } }
        ]
      }]
    };
  }, [aiSuggestionResult, t]);

  return (
    <motion.div
      className={`bg-white dark:bg-black/40 backdrop-blur-xl border border-gray-200 dark:border-white/5 rounded-[32px] shadow-2xl overflow-hidden ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className="bg-transparent px-4 lg:px-6 py-6 border-b border-gray-200 dark:border-white/5">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
          </div>
          <div className="flex flex-wrap justify-center items-center gap-2 lg:gap-3 w-full lg:w-auto">
            <motion.button
              onClick={() => setShowAIModal(true)}
              className="flex items-center px-4 py-2 bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-500/30 rounded-xl hover:bg-purple-500/20 dark:hover:bg-purple-500/30 transition-all font-medium"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              title={t('aiStudy.aiTimetableImport')}
            >
              <IconComponent icon={FaBrain} className="h-4 w-4 mr-2" />
              {t('aiStudy.aiImport')}
            </motion.button>
            <motion.button
              onClick={openAISuggestionModal}
              className="flex items-center px-4 py-2 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 rounded-xl hover:bg-emerald-500/20 dark:hover:bg-emerald-500/30 transition-all font-medium"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              title={t('aiStudy.aiStudyRoadmapGenerator')}
            >
              <IconComponent icon={AiOutlineBulb} className="h-4 w-4 mr-2" />
              {t('aiStudy.aiRoadmap')}
            </motion.button>
            <motion.button
              onClick={() => {
                if (onToggleHistory) {
                  onToggleHistory();
                } else {
                  setShowHistoryModal(true);
                  fetchHistory();
                }
              }}
              className="flex items-center px-4 py-2 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 rounded-xl hover:bg-amber-500/20 dark:hover:bg-amber-500/30 transition-all font-medium"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              title={t('aiStudy.history')}
            >
              <IconComponent icon={FiClock} className="h-4 w-4 mr-2" />
              {t('aiStudy.history')}
            </motion.button>
            <motion.button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center px-4 py-2 bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 border border-blue-200 dark:border-blue-500/30 rounded-xl hover:bg-blue-500/20 dark:hover:bg-blue-500/30 transition-all font-medium"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <IconComponent icon={FiPlus} className="h-4 w-4 mr-2" />
              {t('aiStudy.addTask')}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Add Task Form */}
      {showAddForm && (
        <motion.div
          className="p-6 border-b border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-transparent"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <form onSubmit={handleAddTask} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">{t('aiStudy.taskDescription')}</label>
                <input
                  type="text"
                  value={newTask.task}
                  onChange={(e) => setNewTask({...newTask, task: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-[#1f1f23] border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-gray-300 placeholder-gray-500 focus:outline-none focus:border-indigo-500 dark:focus:border-white/20"
                  placeholder={t('aiStudy.enterTaskDescription')}
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">{t('aiStudy.subject')}</label>
                <input
                  type="text"
                  value={newTask.subject}
                  onChange={(e) => setNewTask({...newTask, subject: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-[#1f1f23] border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-gray-300 placeholder-gray-500 focus:outline-none focus:border-indigo-500 dark:focus:border-white/20"
                  placeholder={t('aiStudy.enterSubject')}
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">{t('aiStudy.dueDate')}</label>
                <input
                  type="date"
                  value={newTask.date}
                  onClick={(e) => e.currentTarget.showPicker()}
                  onChange={(e) => setNewTask({...newTask, date: e.target.value})}
                  className="w-full px-3 py-2 bg-white dark:bg-[#1f1f23] border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-gray-300 focus:outline-none focus:border-indigo-500 dark:focus:border-white/20 dark:[color-scheme:dark] dark:[&::-webkit-calendar-picker-indicator]:invert"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">{t('aiStudy.priority')}</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({...newTask, priority: e.target.value as 'low' | 'medium' | 'high'})}
                  className="w-full px-3 py-2 bg-white dark:bg-[#1f1f23] border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-gray-300 focus:outline-none focus:border-indigo-500 dark:focus:border-white/20"
                >
                  <option value="low">{t('aiStudy.lowPriority')}</option>
                  <option value="medium">{t('aiStudy.mediumPriority')}</option>
                  <option value="high">{t('aiStudy.highPriority')}</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">{t('aiStudy.estimatedHours')}</label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={newTask.estimatedHours}
                  onChange={(e) => setNewTask({...newTask, estimatedHours: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-white dark:bg-[#1f1f23] border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-gray-300 focus:outline-none focus:border-indigo-500 dark:focus:border-white/20"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <motion.button
                type="submit"
                className="flex items-center px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg font-medium shadow-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-all"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <IconComponent icon={FiCheck} className="h-4 w-4 mr-2" />
                {t('aiStudy.addTask')}
              </motion.button>

              <motion.button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-6 py-2 bg-gray-200 dark:bg-[#27272a] hover:bg-gray-300 dark:hover:bg-[#3f3f46] rounded-lg text-gray-700 dark:text-gray-300 transition-colors border border-transparent"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                {t('aiStudy.cancel')}
              </motion.button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Main Content - Calendar and Tasks */}
      <div className="flex flex-col lg:flex-row h-auto lg:h-[600px]">
        {/* Left Half - Calendar */}
        <div className="w-full lg:w-1/2 p-4 lg:p-6 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-white/10">
          {renderCalendar()}
        </div>

        {/* Right Half - Tasks */}
        <div className="w-full lg:w-1/2 flex flex-col h-[600px] lg:h-auto">
          {/* Filters and Sort */}
          <div className="p-4 lg:p-6 border-b border-gray-200 dark:border-white/10">
            <div className="flex flex-wrap items-center gap-2 lg:gap-4 mb-4">
              <motion.button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-3 py-2 bg-gray-100 dark:bg-black/20 backdrop-blur-sm hover:bg-gray-200 dark:hover:bg-black/30 rounded-lg text-gray-700 dark:text-gray-300 transition-colors border border-gray-200 dark:border-white/10"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <IconComponent icon={FiFilter} className="h-4 w-4 mr-2" />
                {t('aiStudy.filters')}
              </motion.button>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-gray-100 dark:bg-black/20 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-lg text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
              >
                <option value="date">{t('aiStudy.sortByDate')}</option>
                <option value="date_desc">{t('aiStudy.sortByDateDesc')}</option>
                <option value="priority">{t('aiStudy.sortByPriority')}</option>
                <option value="priority_desc">{t('aiStudy.sortByPriorityDesc')}</option>
                <option value="subject">{t('aiStudy.sortBySubject')}</option>
                <option value="subject_desc">{t('aiStudy.sortBySubjectDesc')}</option>
                <option value="hours">{t('aiStudy.sortByHours')}</option>
                <option value="hours_desc">{t('aiStudy.sortByHoursDesc')}</option>
                <option value="completion">{t('aiStudy.sortByCompletion')}</option>
              </select>

              {(selectedDate || selectedCalendarDate || filterPriority !== 'all' || filterSubject !== 'all') && (
                <motion.button
                  onClick={clearFilters}
                  className="flex items-center px-3 py-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-600 dark:text-red-400 transition-colors border border-red-500/20"
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <IconComponent icon={FaTimes} className="h-4 w-4 mr-2" />
                  {t('aiStudy.clearFilters')}
                </motion.button>
              )}
            </div>

            {showFilters && (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-black/20 backdrop-blur-sm rounded-lg border border-gray-200 dark:border-white/10"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">{t('aiStudy.filterByDate')}</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onClick={(e) => e.currentTarget.showPicker()}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-black/20 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-lg text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none dark:[color-scheme:dark] dark:[&::-webkit-calendar-picker-indicator]:invert"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">{t('aiStudy.filterByPriority')}</label>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-black/20 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-lg text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                  >
                    <option value="all">{t('aiStudy.allPriorities')}</option>
                    <option value="high">{t('aiStudy.highPriority')}</option>
                    <option value="medium">{t('aiStudy.mediumPriority')}</option>
                    <option value="low">{t('aiStudy.lowPriority')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">{t('aiStudy.filterBySubject')}</label>
                  <select
                    value={filterSubject}
                    onChange={(e) => setFilterSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-black/20 backdrop-blur-sm border border-gray-200 dark:border-white/10 rounded-lg text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                  >
                    <option value="all">{t('aiStudy.allSubjects')}</option>
                    {getUniqueSubjects().map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )}

            {selectedCalendarDate && (
              <div className="mt-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <p className="text-blue-600 dark:text-blue-400 text-sm">
                  {t('aiStudy.showingTasksFor')}: {selectedCalendarDate.toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Tasks List */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <IconComponent icon={AiOutlineBulb} className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-600" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-300 mb-2">{t('aiStudy.noTasksFound')}</h3>
                <p className="text-gray-500 dark:text-gray-400">
                  {selectedCalendarDate ? t('aiStudy.noTasksScheduled') : t('aiStudy.addTaskOrAdjustFilters')}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    className={`group relative p-5 bg-white dark:bg-[#18181b]/60 backdrop-blur-xl rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-lg hover:border-gray-200 dark:hover:border-white/10 transition-all duration-300 ${
                      task.completed ? 'opacity-60 grayscale-[0.5]' : ''
                    }`}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.05 }}
                  >
                    {/* Priority Indicator Line */}
                    <div className={`absolute left-0 top-6 bottom-6 w-1 rounded-r-full transition-colors duration-300 ${
                      task.priority === 'high' ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.4)]' :
                      task.priority === 'medium' ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]' :
                      'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                    }`} />

                    <div className="flex items-start gap-4 pl-3">
                      {/* Checkbox */}
                      <motion.button
                        onClick={() => handleTaskToggle(task.id)}
                        className={`mt-1.5 flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                          task.completed
                            ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                            : 'border-gray-300 dark:border-zinc-600 hover:border-emerald-500 dark:hover:border-emerald-400 bg-transparent'
                        }`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {task.completed && <IconComponent icon={FiCheck} className="h-3 w-3 stroke-[3]" />}
                      </motion.button>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-3">
                        {/* Header: Title & Priority */}
                        <div className="flex items-start justify-between gap-3">
                          <input
                            type="text"
                            value={task.task}
                            onChange={(e) => handleTaskNameChange(task.id, e.target.value)}
                            className={`w-full bg-transparent border-none outline-none font-semibold text-lg leading-tight transition-colors ${
                              task.completed 
                                ? 'line-through text-gray-400 dark:text-zinc-500' 
                                : 'text-gray-900 dark:text-zinc-100 placeholder-gray-400'
                            }`}
                            placeholder="Task name"
                          />
                          
                          {/* Priority Badge (Clickable) */}
                          <motion.button
                            onClick={() => handlePriorityUpdate(task.id, task.priority)}
                            className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all duration-300 ${
                              task.priority === 'high' 
                                ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20' 
                                : task.priority === 'medium'
                                ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20 hover:bg-amber-100 dark:hover:bg-amber-500/20'
                                : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'
                            }`}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {task.priority}
                          </motion.button>
                        </div>

                        {/* Metadata Row */}
                        <div className="flex flex-wrap items-center gap-2.5">
                          {/* Subject */}
                          <div className="group/input relative">
                             <input
                              type="text"
                              value={task.subject}
                              onChange={(e) => handleSubjectChange(task.id, e.target.value)}
                              className="w-24 sm:w-32 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/30 outline-none transition-all hover:bg-gray-100 dark:hover:bg-white/10 placeholder-gray-400 dark:placeholder-zinc-600"
                              placeholder="Subject"
                            />
                          </div>

                          {/* Date */}
                          <div className="flex items-center bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-lg px-2.5 py-1.5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors group-focus-within:ring-2 group-focus-within:ring-indigo-500/20">
                            <IconComponent icon={FiCalendar} className="h-3.5 w-3.5 text-gray-400 dark:text-zinc-500 mr-2" />
                            <input
                              type="date"
                              value={task.date}
                              onClick={(e) => e.currentTarget.showPicker()}
                              onChange={(e) => handleDateChange(task.id, e.target.value)}
                              className="bg-transparent border-none outline-none text-xs font-medium text-gray-600 dark:text-zinc-300 w-24 cursor-pointer dark:[color-scheme:dark] dark:[&::-webkit-calendar-picker-indicator]:invert"
                            />
                          </div>

                          {/* Duration */}
                          <div className="flex items-center bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-lg px-2.5 py-1.5 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
                            <IconComponent icon={FiClock} className="h-3.5 w-3.5 text-gray-400 dark:text-zinc-500 mr-2" />
                            <input
                              type="number"
                              value={task.estimatedHours}
                              onChange={(e) => handleEstimatedHoursChange(task.id, parseInt(e.target.value) || 1)}
                              min="1"
                              max="24"
                              className="bg-transparent border-none outline-none text-xs font-medium text-gray-600 dark:text-zinc-300 w-8 text-center"
                            />
                            <span className="text-xs text-gray-400 dark:text-zinc-500 ml-1">h</span>
                          </div>
                        </div>
                        
                        {/* Reminder Status (if set) */}
                        {task.reminder && task.reminderDate && (
                          <div className="flex items-center gap-2 text-[10px] font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 rounded-md w-fit border border-amber-100 dark:border-amber-500/10">
                            <IconComponent icon={FaBell} className="h-3 w-3" />
                            <span>
                              Reminder: {new Date(task.reminderDate).toLocaleDateString()} at {new Date(task.reminderDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions (Vertical or Horizontal) */}
                      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
                         <motion.button
                          onClick={() => openReminderModal(task.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            task.reminder 
                              ? 'text-amber-500 bg-amber-500/10 dark:bg-amber-500/20' 
                              : 'text-gray-400 hover:text-amber-500 hover:bg-amber-500/10 dark:hover:bg-amber-500/20'
                          }`}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title={task.reminder ? 'Edit Reminder' : 'Set Reminder'}
                        >
                          <IconComponent icon={FaBell} className="h-4 w-4" />
                        </motion.button>
                        
                        <motion.button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded-lg transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title="Delete Task"
                        >
                          <IconComponent icon={FiTrash2} className="h-4 w-4" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Timetable Import Modal */}
      <AnimatePresence>
        {showAIModal && (
          <PortalModal
            isOpen={showAIModal}
            onClose={closeAIModal}
            className="flex items-center justify-center z-50 p-4"
          >
            <motion.div
              className="bg-white dark:bg-black/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
            >
              <div className="p-6 border-b border-gray-200 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-purple-600 dark:text-purple-400 flex items-center">
                    <IconComponent icon={FaBrain} className="mr-2" />
                    {t('aiStudy.aiTimetableImport')}
                  </h2>
                  <motion.button
                    onClick={closeAIModal}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <IconComponent icon={FaTimes} className="h-5 w-5" />
                  </motion.button>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  {t('aiStudy.aiTimetableImportDescription')}
                </p>
              </div>
              
              <div className="p-6">
                {!uploadedFile ? (
                  <div className="space-y-6">
                    <div className="border-2 border-dashed border-gray-300 dark:border-white/10 rounded-xl p-8 text-center hover:border-purple-500/50 transition-colors bg-gray-50 dark:bg-transparent">
                      <input
                        type="file"
                        id="timetable-upload"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                        disabled={isUploading}
                      />
                      <label
                        htmlFor="timetable-upload"
                        className="cursor-pointer flex flex-col items-center space-y-4"
                      >
                        <div className="w-16 h-16 bg-purple-500/10 dark:bg-purple-500/20 rounded-full flex items-center justify-center">
                          <IconComponent icon={FiUpload} className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-lg font-medium text-gray-900 dark:text-gray-300 mb-2">
                            {isUploading ? t('aiStudy.analyzing') : t('aiStudy.uploadTimetableImage')}
                          </p>
                          <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {t('aiStudy.dragDropOrClickImage')}
                          </p>
                          <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">
                            {t('aiStudy.supportedImageFormats')}
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* File Preview */}
                    <div className="bg-white dark:bg-[#1f1f23] rounded-xl p-4 border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-300">{t('aiStudy.uploadedFile')}</h3>
                        <motion.button
                          onClick={() => setUploadedFile(null)}
                          className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <IconComponent icon={FaTimes} className="h-4 w-4" />
                        </motion.button>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="w-20 h-20 bg-gray-100 dark:bg-black/20 rounded-lg flex items-center justify-center overflow-hidden">
                          {uploadedFile.file.type.startsWith('image/') ? (
                            <img 
                              src={uploadedFile.base64} 
                              alt={t('aiStudy.uploadedTimetableAlt')} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <IconComponent icon={FaCalendarAlt} className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900 dark:text-gray-300 font-medium">{uploadedFile.file.name}</p>
                          <p className="text-gray-500 dark:text-gray-400 text-sm">
                            {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          {uploadedFile.extractedText && (
                            <p className="text-green-600 dark:text-green-400 text-sm mt-1">
                              ✓ {t('aiStudy.textExtractedSuccessfully')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* AI Analysis Results */}
                    {aiAnalysisResult && (
                      <div className="bg-white dark:bg-[#1f1f23] rounded-xl p-4 border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-300 mb-4 flex items-center">
                          <IconComponent icon={AiOutlineRobot} className="mr-2 text-purple-600 dark:text-purple-400" />
                          {t('aiStudy.aiAnalysisResults')}
                        </h3>
                        
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                          {aiAnalysisResult.map((task: any, index: number) => (
                            <div key={index} className="bg-gray-50 dark:bg-black/20 rounded-lg p-3 border border-gray-200 dark:border-white/5">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-gray-900 dark:text-gray-200">{task.title}</h4>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  task.priority === 'high' ? 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30' :
                                  task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30' :
                                  'bg-green-500/20 text-green-600 dark:text-green-400 border border-green-500/30'
                                }`}>
                                  {t('aiStudy.priorityText', { values: { priority: task.priority } })}
                                </span>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                <span className="flex items-center">
                                  <IconComponent icon={FiCalendar} className="h-3 w-3 mr-1" />
                                  {task.dueDate}
                                </span>
                                <span className="flex items-center">
                                  <IconComponent icon={FiClock} className="h-3 w-3 mr-1" />
                                  {task.estimatedHours || 2}h
                                </span>
                                <span className="text-cyan-600 dark:text-cyan-400">{task.subject || t('aiStudy.general')}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
                      <motion.button
                        onClick={closeAIModal}
                        className="w-full sm:w-auto px-6 py-3 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {t('aiStudy.close')}
                      </motion.button>

                      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                        {!aiAnalysisResult && (
                          <motion.button
                            onClick={processWithAI}
                            disabled={isProcessingAI || (!uploadedFile.extractedText && !uploadedFile.imageUrl)}
                            className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-slate-400 disabled:to-slate-500 dark:disabled:from-slate-600 dark:disabled:to-slate-600 text-white font-medium rounded-lg transition-all disabled:cursor-not-allowed"
                            whileHover={{ scale: isProcessingAI ? 1 : 1.05 }}
                            whileTap={{ scale: isProcessingAI ? 1 : 0.95 }}
                          >
                            {isProcessingAI ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                {t('aiStudy.analyzing')}
                              </>
                            ) : (
                              <>
                                <IconComponent icon={AiOutlineRobot} className="h-4 w-4 mr-2" />
                                {t('aiStudy.analyzeWithAI')}
                              </>
                            )}
                          </motion.button>
                        )}
                        
                        {aiAnalysisResult && (
                          <motion.button
                            onClick={addAITasks}
                            className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium rounded-lg transition-all"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <IconComponent icon={FiCheck} className="h-4 w-4 mr-2" />
                            {t('aiStudy.addTasks', { count: aiAnalysisResult.length })}
                          </motion.button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </PortalModal>
        )}
      </AnimatePresence>

      {/* History Panel (Slide-over) */}
      <AnimatePresence>
        {showHistoryModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistoryModal(false)}
              className="fixed inset-0 bg-black/20 dark:bg-black/50 z-[60] backdrop-blur-sm"
            />
            
            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-[#09090b]/95 backdrop-blur-xl border-l border-gray-200 dark:border-white/10 shadow-2xl z-[70] flex flex-col"
            >
              <div className="p-6 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-transparent">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                  <div className="p-2 rounded-lg bg-amber-500/10 mr-3">
                    <IconComponent icon={FiClock} className="h-5 w-5 text-amber-500" />
                  </div>
                  {t('aiStudy.roadmapHistory')}
                </h2>
                <motion.button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <IconComponent icon={FiX} className="h-5 w-5" />
                </motion.button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-4">
                {isLoadingHistory ? (
                  <div className="flex justify-center items-center h-40">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-500 border-t-transparent"></div>
                  </div>
                ) : history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4 border border-gray-200 dark:border-white/5">
                        <IconComponent icon={FiClock} className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-900 dark:text-white font-medium mb-1 text-lg">{t('aiStudy.noHistoryYet')}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                        {t('aiStudy.generateFirstRoadmapHint')}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map((item) => (
                      <motion.div
                        key={item.id}
                        className="p-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl hover:border-amber-500/50 dark:hover:border-amber-500/50 hover:shadow-lg dark:hover:bg-white/10 cursor-pointer transition-all group relative overflow-hidden"
                        onClick={() => loadHistoryItem(item)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-amber-500/10 to-transparent rounded-bl-3xl -mr-2 -mt-2 transition-opacity opacity-0 group-hover:opacity-100" />
                        
                        <div className="flex justify-between items-start relative z-10">
                          <div className="flex-1 pr-4">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-2 text-lg group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-2">
                              {item.title || t('aiStudy.untitledRoadmap')}
                            </h3>
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 space-x-4">
                                <span className="flex items-center bg-gray-100 dark:bg-black/30 px-2 py-1 rounded-md">
                                    <IconComponent icon={FiCalendar} className="mr-1.5 h-3.5 w-3.5 text-gray-400" />
                                    {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                                <span className="flex items-center bg-gray-100 dark:bg-black/30 px-2 py-1 rounded-md">
                                    <IconComponent icon={FiClock} className="mr-1.5 h-3.5 w-3.5 text-gray-400" />
                                    {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                          </div>
                          <div className="bg-gray-100 dark:bg-white/5 p-2 rounded-full text-gray-400 group-hover:bg-amber-500 group-hover:text-white transition-all transform group-hover:rotate-45">
                             <IconComponent icon={FiChevronRight} className="h-5 w-5" />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* AI Suggestion Modal - Compact Design */}
      <AnimatePresence>
        {showAISuggestionModal && (
          <PortalModal
            isOpen={showAISuggestionModal}
            onClose={closeAISuggestionModal}
            className="flex items-center justify-center z-50 p-4"
          >
            <motion.div
              className="bg-white dark:bg-black/90 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden"
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
            >
              <div className="p-5 border-b border-gray-200 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
                    <IconComponent icon={AiOutlineRobot} className="mr-2 text-emerald-600 dark:text-emerald-400" />
                    {t('aiStudy.aiStudyRoadmapGenerator')}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('aiStudy.generatePersonalizedStudyPlan')}
                  </p>
                </div>
                <motion.button
                  onClick={closeAISuggestionModal}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <IconComponent icon={FiX} className="h-5 w-5" />
                </motion.button>
              </div>
              
              <div className="p-6 space-y-5">
                {/* Date Range Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <IconComponent icon={FiCalendar} className="mr-2 text-emerald-500" />
                    {t('aiStudy.selectDateRange')}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-xs">{t('aiStudy.start')}</span>
                      </div>
                      <input
                        type="date"
                        value={suggestionDateRange.startDate}
                        onClick={(e) => e.currentTarget.showPicker()}
                        onChange={(e) => setSuggestionDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                        className="pl-12 w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-gray-900 dark:text-white dark:[color-scheme:dark] dark:[&::-webkit-calendar-picker-indicator]:invert"
                      />
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 text-xs">{t('aiStudy.end')}</span>
                      </div>
                      <input
                        type="date"
                        value={suggestionDateRange.endDate}
                        onClick={(e) => e.currentTarget.showPicker()}
                        onChange={(e) => setSuggestionDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                        className="pl-10 w-full bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-gray-900 dark:text-white dark:[color-scheme:dark] dark:[&::-webkit-calendar-picker-indicator]:invert"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Context */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                    <IconComponent icon={FiEdit} className="mr-2 text-blue-500" />
                    {t('aiStudy.additionalContextOptional')}
                  </label>
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder={t('aiStudy.additionalContextPlaceholder')}
                    className="w-full h-24 bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600"
                  />
                </div>

                {/* Generate Button */}
                <motion.button
                  onClick={generateAISuggestion}
                  disabled={isGeneratingSuggestion}
                  className={`w-full py-3.5 rounded-xl font-medium text-sm flex items-center justify-center shadow-lg shadow-emerald-500/20 ${
                    isGeneratingSuggestion
                      ? 'bg-gray-100 dark:bg-white/5 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white transform hover:-translate-y-0.5'
                  } transition-all duration-200`}
                  whileTap={!isGeneratingSuggestion ? { scale: 0.98 } : {}}
                >
                  {isGeneratingSuggestion ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      {t('aiStudy.generatingRoadmap')}
                    </>
                  ) : (
                    <>
                      <IconComponent icon={FaBrain} className="h-4 w-4 mr-2" />
                      {t('aiStudy.generateStudyRoadmap')}
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </PortalModal>
        )}
      </AnimatePresence>

      {/* AI Roadmap Result Modal */}
      <AnimatePresence>
        {showRoadmapResultModal && (
          <PortalModal
            isOpen={showRoadmapResultModal}
            onClose={() => setShowRoadmapResultModal(false)}
            className="flex flex-col z-50 bg-gray-50 dark:bg-[#0a0a0a]"
            fullScreen={true}
          >
            <div className="flex flex-col h-full w-full overflow-hidden">
              {/* Header */}
              <div className="flex-none px-6 py-4 bg-white dark:bg-[#111] border-b border-gray-200 dark:border-white/10 flex justify-between items-center z-10 shadow-sm">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                    <IconComponent icon={AiOutlineRobot} className="mr-3 text-emerald-600 dark:text-emerald-400 h-6 w-6" />
                    {t('aiStudy.aiStudyRoadmap')}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {t('aiStudy.roadmapStrategyDescription')}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <motion.button
                    onClick={() => setShowRoadmapResultModal(false)}
                    className="p-2 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-colors text-gray-500 dark:text-gray-400"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <IconComponent icon={FiX} className="h-5 w-5" />
                  </motion.button>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                <div className="max-w-7xl mx-auto space-y-6">
                  
                  {/* Charts Overview Section */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Priority Chart */}
                    <div className="bg-white dark:bg-[#111] p-5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                          <IconComponent icon={FiFilter} className="mr-2 text-purple-500" />
                          {t('aiStudy.taskPriorities')}
                        </h3>
                      </div>
                      <div className="h-48 w-full">
                        <SimpleChart option={priorityChartOption} style={{ height: '100%', width: '100%' }} theme={isDarkMode ? 'dark' : undefined} />
                      </div>
                    </div>

                    {/* Timeline Chart */}
                    <div className="bg-white dark:bg-[#111] p-5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                          <IconComponent icon={FiClock} className="mr-2 text-blue-500" />
                          {t('aiStudy.timelineDistribution')}
                        </h3>
                      </div>
                      <div className="h-48 w-full">
                        <SimpleChart option={timelineChartOption} style={{ height: '100%', width: '100%' }} theme={isDarkMode ? 'dark' : undefined} />
                      </div>
                    </div>

                    {/* Workload Chart */}
                    <div className="bg-white dark:bg-[#111] p-5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center">
                          <IconComponent icon={FiCheck} className="mr-2 text-emerald-500" />
                          {t('aiStudy.workloadBalance')}
                        </h3>
                      </div>
                      <div className="h-48 w-full">
                        <SimpleChart option={workloadChartOption} style={{ height: '100%', width: '100%' }} theme={isDarkMode ? 'dark' : undefined} />
                      </div>
                    </div>
                  </div>

                  {/* Detailed Sections Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    
                    {/* Priority Matrix Detail */}
                    {aiSuggestionResult.priorityMatrix && (
                      <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
                          <h3 className="font-bold text-gray-900 dark:text-white flex items-center text-lg">
                            <IconComponent icon={FiFilter} className="mr-2 text-purple-500" />
                            {t('aiStudy.priorityMatrix')}
                          </h3>
                        </div>
                        <div className="p-5 space-y-4 flex-1 overflow-y-auto max-h-[400px]">
                          {aiSuggestionResult.priorityMatrix.map((category, idx) => (
                            <div key={idx} className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 border border-gray-100 dark:border-white/5">
                              <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center justify-between">
                                {category.category}
                                <span className="text-xs font-normal bg-gray-200 dark:bg-white/10 px-2 py-1 rounded-full text-gray-600 dark:text-gray-400">
                                  {t('aiStudy.taskCount', { count: category.tasks.length })}
                                </span>
                              </h5>
                              <div className="space-y-2">
                                {category.tasks.map((task, taskIdx) => (
                                  <div key={taskIdx} className="flex items-center justify-between text-sm bg-white dark:bg-black/20 p-2.5 rounded-lg border border-gray-100 dark:border-white/5">
                                    <span className="text-gray-700 dark:text-gray-300 font-medium">{task.name}</span>
                                    <div className="flex space-x-1">
                                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                                        task.urgency === 'high' ? 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400' : 
                                        task.urgency === 'medium' ? 'bg-yellow-500/10 text-yellow-600 dark:bg-yellow-500/20 dark:text-yellow-400' : 
                                        'bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400'
                                      }`}>
                                        {task.urgency}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Timeline Detail */}
                    {aiSuggestionResult.timeline && (
                      <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
                          <h3 className="font-bold text-gray-900 dark:text-white flex items-center text-lg">
                            <IconComponent icon={FiClock} className="mr-2 text-blue-500" />
                            {t('aiStudy.timeline')}
                          </h3>
                        </div>
                        <div className="p-5 space-y-6 flex-1 overflow-y-auto max-h-[400px]">
                          {aiSuggestionResult.timeline.map((item, idx) => (
                            <div key={idx} className="relative pl-6 border-l-2 border-gray-200 dark:border-white/10 last:border-0 pb-2">
                              <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-blue-500 border-4 border-white dark:border-[#111]"></div>
                              <div className="mb-1 flex justify-between items-start">
                                <h5 className="text-sm font-bold text-gray-900 dark:text-white">{item.phase}</h5>
                                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded font-medium">
                                  {item.duration}
                                </span>
                              </div>
                              <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3 mt-2">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">{t('aiStudy.tasksLabel')}</p>
                                    <ul className="space-y-1">
                                      {item.tasks.map((task, i) => {
                                        const isObj = typeof task === 'object' && task !== null;
                                        const description = isObj ? (task as any).description : task;
                                        const priority = isObj ? (task as any).priority : t('aiStudy.chartMedium');
                                        
                                        return (
                                          <li key={i} className="text-xs text-gray-600 dark:text-gray-300 flex items-start">
                                            <span className={`mr-1.5 mt-1 h-1.5 w-1.5 rounded-full flex-shrink-0 ${priority === 'High' ? 'bg-red-500' : priority === 'Medium' ? 'bg-amber-500' : 'bg-blue-500'}`}></span>
                                            <span>{description}</span>
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">{t('aiStudy.milestonesLabel')}</p>
                                    <ul className="space-y-1">
                                      {item.milestones.map((ms, i) => (
                                        <li key={i} className="text-xs text-gray-600 dark:text-gray-300 flex items-start">
                                          <IconComponent icon={FiCheck} className="mr-1.5 mt-0.5 h-3 w-3 text-emerald-500 flex-shrink-0" />
                                          <span>
                                            <span className="font-medium">{ms.date}:</span> {ms.description}
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Application Strategy */}
                    {aiSuggestionResult.applicationStrategy && (
                      <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
                          <h3 className="font-bold text-gray-900 dark:text-white flex items-center text-lg">
                            <IconComponent icon={FiBook} className="mr-2 text-emerald-500" />
                            {t('aiStudy.applicationStrategy')}
                          </h3>
                        </div>
                        <div className="p-5 space-y-4 flex-1 overflow-y-auto max-h-[400px]">
                          {aiSuggestionResult.applicationStrategy.map((item, idx) => (
                            <div key={idx} className="bg-emerald-50/50 dark:bg-emerald-900/10 rounded-xl p-4 border border-emerald-100 dark:border-emerald-500/20">
                              <div className="flex justify-between items-start mb-3">
                                <h5 className="text-sm font-bold text-gray-900 dark:text-white">{item.status}</h5>
                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{item.timeline}</span>
                              </div>
                              <div className="space-y-2">
                                {item.actions.map((action, i) => {
                                  const isObj = typeof action === 'object' && action !== null;
                                  const description = isObj ? (action as any).description : action;
                                  const priority = isObj ? (action as any).priority : t('aiStudy.chartMedium');
                                  const deadline = isObj ? (action as any).deadline : '';
                                  
                                  return (
                                    <div key={i} className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                                      <IconComponent icon={FiCheck} className="mt-1 mr-2 flex-shrink-0 text-emerald-500" />
                                      <div className="flex-1">
                                        <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium mr-2 ${
                                          priority === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                                          priority === 'Medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                                          'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                        }`}>
                                          {priority}
                                        </span>
                                        <span>{description}</span>
                                        {deadline && <span className="ml-2 text-xs text-gray-500">{t('aiStudy.due')}: {deadline}</span>}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Deadline Management */}
                    {aiSuggestionResult.deadlineManagement && (
                      <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
                          <h3 className="font-bold text-gray-900 dark:text-white flex items-center text-lg">
                            <IconComponent icon={FiCalendar} className="mr-2 text-red-500" />
                            {t('aiStudy.deadlineManagement')}
                          </h3>
                        </div>
                        <div className="p-5 space-y-4 flex-1 overflow-y-auto max-h-[400px]">
                          {aiSuggestionResult.deadlineManagement.map((item, idx) => (
                            <div key={idx} className="bg-red-50/50 dark:bg-red-900/10 rounded-xl p-4 border border-red-100 dark:border-red-500/20">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h5 className="text-sm font-bold text-gray-900 dark:text-white">{item.type}</h5>
                                  <span className="text-xs text-red-600 dark:text-red-400 font-medium">{t('aiStudy.due')}: {item.deadline}</span>
                                </div>
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                                  item.priority === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                                  item.priority === 'medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' :
                                  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                                }`}>
                                  {item.priority}
                                </span>
                              </div>
                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t('aiStudy.actionsLabel')}</p>
                                {item.actions.map((action, i) => (
                                  <div key={i} className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                                    <IconComponent icon={FiCheck} className="mt-1 mr-2 flex-shrink-0 text-red-500" />
                                    <span>{action}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Study Optimization */}
                    {aiSuggestionResult.studyOptimization && (
                      <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
                          <h3 className="font-bold text-gray-900 dark:text-white flex items-center text-lg">
                            <IconComponent icon={FaBrain} className="mr-2 text-amber-500" />
                            {t('aiStudy.studyOptimization')}
                          </h3>
                        </div>
                        <div className="p-5 space-y-4 flex-1 overflow-y-auto max-h-[400px]">
                          <div className="grid grid-cols-1 gap-4">
                            {aiSuggestionResult.studyOptimization.map((subject, idx) => (
                              <div key={idx} className="bg-amber-50/50 dark:bg-amber-900/10 rounded-xl p-4 border border-amber-100 dark:border-amber-500/20">
                                <h5 className="text-sm font-bold text-gray-900 dark:text-white mb-2">{subject.subject}</h5>
                                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2"><span className="font-semibold">{t('aiStudy.strategy')}:</span> {subject.strategy}</p>
                                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2"><span className="font-semibold">{t('aiStudy.time')}:</span> {subject.timeAllocation}</p>
                                {subject.resources && subject.resources.length > 0 && (
                                  <div className="mt-2">
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('aiStudy.resources')}</span>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                      {subject.resources.map((res, i) => (
                                        <span key={i} className="text-xs bg-white dark:bg-black/20 px-2 py-1 rounded border border-amber-200 dark:border-amber-500/30 text-gray-600 dark:text-gray-400">
                                          {res}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Risk Mitigation */}
                    {aiSuggestionResult.riskMitigation && (
                      <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
                          <h3 className="font-bold text-gray-900 dark:text-white flex items-center text-lg">
                            <IconComponent icon={FiAlertTriangle} className="mr-2 text-red-500" />
                            {t('aiStudy.riskMitigation')}
                          </h3>
                        </div>
                        <div className="p-5 space-y-4 flex-1 overflow-y-auto max-h-[400px]">
                          {aiSuggestionResult.riskMitigation.map((risk, idx) => (
                            <div key={idx} className="bg-red-50/50 dark:bg-red-900/10 rounded-xl p-4 border border-red-100 dark:border-red-500/20">
                              <h5 className="text-sm font-bold text-red-700 dark:text-red-400 mb-1">{risk.risk}</h5>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{risk.impact}</p>
                              <div className="bg-white dark:bg-black/20 rounded-lg p-3 text-sm">
                                <span className="font-medium text-gray-700 dark:text-gray-200">{t('aiStudy.mitigation')}: </span>
                                <ul className="list-disc pl-4 mt-1 space-y-1">
                                  {risk.mitigation.map((m, i) => (
                                    <li key={i} className="text-gray-600 dark:text-gray-400">{m}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Progress Tracking */}
                    {aiSuggestionResult.progressTracking && (
                      <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
                          <h3 className="font-bold text-gray-900 dark:text-white flex items-center text-lg">
                            <IconComponent icon={AiOutlineLineChart} className="mr-2 text-indigo-500" />
                            {t('aiStudy.progressTracking')}
                          </h3>
                        </div>
                        <div className="p-5 space-y-4 flex-1 overflow-y-auto max-h-[400px]">
                          {aiSuggestionResult.progressTracking.map((item, idx) => (
                            <div key={idx} className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-bold text-gray-900 dark:text-white">{item.milestone}</span>
                                <span className="text-xs font-medium px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full">{item.deadline}</span>
                              </div>
                              <div className="space-y-1">
                                {item.criteria.map((crit, i) => (
                                  <div key={i} className="flex items-start text-xs text-gray-600 dark:text-gray-400">
                                    <span className="mr-1.5 mt-0.5 text-indigo-500">•</span>
                                    {crit}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reminder Management */}
                    {aiSuggestionResult.reminderManagement && (
                      <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden flex flex-col">
                        <div className="p-5 border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
                          <h3 className="font-bold text-gray-900 dark:text-white flex items-center text-lg">
                            <IconComponent icon={FiBell} className="mr-2 text-yellow-500" />
                            {t('aiStudy.reminderManagement')}
                          </h3>
                        </div>
                        <div className="p-5 space-y-4 flex-1 overflow-y-auto max-h-[400px]">
                          {aiSuggestionResult.reminderManagement.map((reminder, idx) => (
                            <div key={idx} className="flex items-start p-3 bg-yellow-50/50 dark:bg-yellow-900/10 rounded-xl border border-yellow-100 dark:border-yellow-500/20">
                              <IconComponent icon={FiClock} className="mt-1 mr-3 text-yellow-500 flex-shrink-0" />
                              <div>
                                <h5 className="text-sm font-bold text-gray-900 dark:text-white">{reminder.type}</h5>
                                <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{reminder.task}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{reminder.date}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>
            </div>
          </PortalModal>
        )}
      </AnimatePresence>

      {/* Reminder Modal */}
      <AnimatePresence>
        {reminderModal.isOpen && (
          <PortalModal
            isOpen={reminderModal.isOpen}
            onClose={closeReminderModal}
            className="flex items-center justify-center z-50 p-4"
          >
            <motion.div
              className="bg-white dark:bg-black/80 backdrop-blur-xl rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl w-full max-w-md"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
            >
              <div className="p-6 border-b border-gray-200 dark:border-white/10">
                <h2 className="text-xl font-bold text-cyan-600 dark:text-cyan-400 flex items-center">
                  <IconComponent icon={FaBell} className="mr-2" />
                  {(() => {
                    const task = studyTasks.find(t => t.id === reminderModal.taskId);
                    return task?.reminder ? t('aiStudy.updateReminder') : t('aiStudy.setReminder');
                  })()}
                </h2>
                {(() => {
                  const task = studyTasks.find(t => t.id === reminderModal.taskId);
                  if (task?.reminder && task?.reminderDate) {
                    const reminderDateTime = new Date(task.reminderDate);
                    return (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        {t('aiStudy.currentReminder')}: {reminderDateTime.toLocaleDateString()} {t('aiStudy.atTime')} {reminderDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    );
                  }
                  return null;
                })()}
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('aiStudy.reminderDateLabel')}
                    </label>
                    <input
                      type="date"
                      value={reminderDate}
                      onClick={(e) => e.currentTarget.showPicker()}
                      onChange={(e) => setReminderDate(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 dark:[color-scheme:dark] dark:[&::-webkit-calendar-picker-indicator]:invert"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('aiStudy.reminderTimeLabel')}
                    </label>
                    <input
                      type="time"
                      value={reminderTime}
                      onClick={(e) => e.currentTarget.showPicker()}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 text-gray-900 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 dark:[color-scheme:dark] dark:[&::-webkit-calendar-picker-indicator]:invert"
                    />
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 dark:border-white/10 flex justify-between">
                <div className="flex gap-2">
                  <motion.button
                    onClick={closeReminderModal}
                    className="bg-gray-100 dark:bg-black/20 hover:bg-gray-200 dark:hover:bg-black/40 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {t('aiStudy.cancel')}
                  </motion.button>
                  {(() => {
                    const task = studyTasks.find(t => t.id === reminderModal.taskId);
                    if (task?.reminder) {
                      return (
                        <motion.button
                          onClick={handleUnsetReminder}
                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-lg font-medium transition-all"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {t('aiStudy.removeReminder')}
                        </motion.button>
                      );
                    }
                    return null;
                  })()}
                </div>
                
                <motion.button
                  onClick={handleSetReminder}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {t('aiStudy.setReminder')}
                </motion.button>
              </div>
            </motion.div>
          </PortalModal>
        )}
      </AnimatePresence>
      <ResponseUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        message={upgradeMessage}
        ctaType={upgradeCtaType}
      />
    </motion.div>
  );
});

export default StudyPlannerComponent;
