import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AiOutlineBulb, AiOutlineRobot } from 'react-icons/ai';
import { FiCalendar, FiClock, FiCheck, FiPlus, FiEdit, FiTrash2, FiFilter, FiChevronLeft, FiChevronRight, FiUpload } from 'react-icons/fi';
import { FaCalendarAlt, FaSort, FaSortAmountDown, FaTimes, FaBell, FaBrain } from 'react-icons/fa';
import IconComponent from './IconComponent';
import { useLanguage } from '../../utils/LanguageContext';
import { useAppData, StudyTask } from '../../utils/AppDataContext';
import { useNotification } from '../../utils/NotificationContext';

interface StudyPlannerComponentProps {
  className?: string;
}

const StudyPlannerComponent: React.FC<StudyPlannerComponentProps> = ({ className = '' }) => {
  const { t } = useLanguage();
  const { showSuccess, showError, showWarning } = useNotification();
  const { 
    studyTasks, 
    applications,
    addStudyTask, 
    updateStudyTask, 
    deleteStudyTask,
    setReminder,
    toggleTaskReminder
  } = useAppData();
  
  const [newTask, setNewTask] = useState({
    task: '',
    subject: '',
    date: '',
    priority: 'medium' as 'low' | 'medium' | 'high',
    estimatedHours: 1
  });

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
  const [uploadedFile, setUploadedFile] = useState<{ file: File; base64: string; extractedText: string } | null>(null);
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
  const [aiSuggestionResult, setAiSuggestionResult] = useState<{
    priorityMatrix?: Array<{category: string; tasks: Array<{name: string; urgency: string; importance: string}>}>;
    timeline?: Array<{phase: string; duration: string; tasks: string[]; milestones: string[]}>;
    applicationStrategy?: Array<{status: string; actions: string[]; timeline: string}>;
    studyOptimization?: Array<{subject: string; strategy: string; timeAllocation: string; resources: string[]}>;
    deadlineManagement?: Array<{deadline: string; type: string; priority: string; actions: string[]}>;
    workloadDistribution?: Array<{week: string; studyHours: string; applicationHours: string; focus: string[]}>;
    riskMitigation?: Array<{risk: string; impact: string; mitigation: string[]}>;
    progressTracking?: Array<{milestone: string; deadline: string; criteria: string[]}>;
    rawText?: string;
  }>({});

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
    return studyTasks.filter(task => task.date === dateString);
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
        <div key={`empty-${i}`} className="h-24 border border-slate-600/30"></div>
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
          className={`h-24 border border-slate-600/30 p-1 cursor-pointer transition-all duration-200 ${
            isToday ? 'bg-cyan-500/20 border-cyan-500/50' : 
            isSelected ? 'bg-blue-500/20 border-blue-500/50' : 
            'hover:bg-slate-600/20'
          }`}
          onClick={() => setSelectedCalendarDate(date)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className={`text-sm font-medium mb-1 ${
            isToday ? 'text-cyan-400' : 
            isSelected ? 'text-blue-400' : 
            'text-slate-300'
          }`}>
            {day}
          </div>
          <div className="space-y-1 overflow-hidden">
            {tasksForDay.slice(0, 2).map((task, index) => (
              <div
                key={task.id}
                className={`text-xs px-1 py-0.5 rounded truncate ${
                  task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                  task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-green-500/20 text-green-400'
                } ${task.completed ? 'opacity-50 line-through' : ''}`}
                title={task.task}
              >
                {task.task}
              </div>
            ))}
            {tasksForDay.length > 2 && (
              <div className="text-xs text-slate-400 px-1">
                +{tasksForDay.length - 2} more
              </div>
            )}
          </div>
        </motion.div>
      );
    }

    return (
      <div className="bg-slate-700/30 backdrop-blur-sm rounded-xl border border-white/10 p-4">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-cyan-400">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h3>
          <div className="flex items-center space-x-2">
            <motion.button
              onClick={() => navigateMonth('prev')}
              className="p-2 bg-slate-600/50 hover:bg-slate-500/50 rounded-lg text-slate-300 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <IconComponent icon={FiChevronLeft} className="h-4 w-4" />
            </motion.button>
            <motion.button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-lg text-cyan-400 text-sm font-medium transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Today
            </motion.button>
            <motion.button
              onClick={() => navigateMonth('next')}
              className="p-2 bg-slate-600/50 hover:bg-slate-500/50 rounded-lg text-slate-300 transition-colors"
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
            <div key={day} className="text-center text-sm font-medium text-slate-400 py-2">
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

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.task.trim() || !newTask.subject.trim() || !newTask.date) return;
    
    const task: StudyTask = {
      id: Date.now().toString(),
      ...newTask,
      completed: false
    };
    
    addStudyTask(task);
    setNewTask({
      task: '',
      subject: '',
      date: '',
      priority: 'medium',
      estimatedHours: 1
    });
    setShowAddForm(false);
  };

  const handleTaskToggle = (id: string) => {
    const task = studyTasks.find(t => t.id === id);
    if (task) {
      updateStudyTask(id, { completed: !task.completed });
    }
  };

  const handleDeleteTask = (id: string) => {
    deleteStudyTask(id);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  // Filter and sort tasks
  const getFilteredAndSortedTasks = () => {
    let filtered = studyTasks;

    // Filter by selected calendar date
    if (selectedCalendarDate) {
      const selectedDateString = formatDateForComparison(selectedCalendarDate);
      filtered = filtered.filter(task => task.date === selectedDateString);
    }

    // Filter by selected date
    if (selectedDate) {
      filtered = filtered.filter(task => task.date === selectedDate);
    }

    // Filter by priority
    if (filterPriority !== 'all') {
      filtered = filtered.filter(task => task.priority === filterPriority);
    }

    // Filter by subject
    if (filterSubject !== 'all') {
      filtered = filtered.filter(task => task.subject === filterSubject);
    }

    // Sort tasks
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case 'date_desc':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'priority_desc':
          const priorityOrderDesc = { high: 3, medium: 2, low: 1 };
          return priorityOrderDesc[a.priority] - priorityOrderDesc[b.priority];
        case 'subject':
          return a.subject.localeCompare(b.subject);
        case 'subject_desc':
          return b.subject.localeCompare(a.subject);
        case 'hours':
          return b.estimatedHours - a.estimatedHours;
        case 'hours_desc':
          return a.estimatedHours - b.estimatedHours;
        case 'time_added':
          return parseInt(a.id) - parseInt(b.id);
        case 'time_added_desc':
          return parseInt(b.id) - parseInt(a.id);
        case 'completion':
          return Number(a.completed) - Number(b.completed);
        default:
          return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
    });
  };

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
    setReminderDate('');
    setReminderTime('');
  };

  const closeReminderModal = () => {
    setReminderModal({
      isOpen: false,
      taskId: ''
    });
    setReminderDate('');
    setReminderTime('');
  };

  const handleSetReminder = () => {
    if (!reminderDate || !reminderTime) {
      return;
    }

    const reminderDateTime = `${reminderDate}T${reminderTime}`;
    setReminder(reminderModal.taskId, reminderDateTime, false);
    closeReminderModal();
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
        model: "qwen-vl-max",
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

      const response = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer sk-0d874843ff2542c38940adcbeb2b2cc4',
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
      const response = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer sk-0d874843ff2542c38940adcbeb2b2cc4',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "qwen-vl-max",
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

    // Check file type (only images for now)
    if (!file.type.startsWith('image/')) {
      showError('Please select an image file (PNG, JPG, JPEG, GIF). PDF support coming soon!');
      return;
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      showError('File size must be less than 10MB');
      return;
    }

    try {
      setIsUploading(true);
      const extractedText = await handleFileUpload(file);
      
      // Create base64 string for display
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      setUploadedFile({
        file,
        base64,
        extractedText
      });

      showSuccess('File uploaded and analyzed successfully!');

    } catch (error) {
      console.error('Error processing file:', error);
      showError('Failed to process file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const processWithAI = async () => {
    if (!uploadedFile) return;

    try {
      setIsProcessingAI(true);
      const analysis = await analyzeWithAI(uploadedFile.extractedText);
      setAiAnalysisResult(analysis);
      showSuccess(`AI found ${analysis.length} tasks in your timetable!`);
    } catch (error) {
      console.error('Error processing with AI:', error);
      showError('Failed to analyze timetable with AI. Please try again.');
    } finally {
      setIsProcessingAI(false);
    }
  };

  const addAITasks = () => {
    if (!aiAnalysisResult) return;

    let addedCount = 0;
    aiAnalysisResult.forEach((task: any) => {
      if (task.title && task.dueDate) {
        const newTask: StudyTask = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          task: task.title,
          subject: task.subject || 'General',
          date: task.dueDate,
          priority: task.priority || 'medium',
          completed: false,
          estimatedHours: task.estimatedHours || 2,
          source: 'study'
        };
        addStudyTask(newTask);
        addedCount++;
      }
    });

    showSuccess(`Successfully added ${addedCount} tasks to your study planner!`);
    setShowAIModal(false);
    setUploadedFile(null);
    setAiAnalysisResult(null);
  };

  const closeAIModal = () => {
    setShowAIModal(false);
    setUploadedFile(null);
    setAiAnalysisResult(null);
  };

  // AI Suggestion Functions
  const generateAISuggestion = async () => {
    try {
      setIsGeneratingSuggestion(true);
      
      // Get all study tasks (including those synced from applications)
      let allStudyTasks = studyTasks;
      
      // Filter by date range if specified
      if (suggestionDateRange.startDate && suggestionDateRange.endDate) {
        allStudyTasks = studyTasks.filter(task => {
          const taskDate = new Date(task.date);
          const startDate = new Date(suggestionDateRange.startDate);
          const endDate = new Date(suggestionDateRange.endDate);
          return taskDate >= startDate && taskDate <= endDate;
        });
      }

      // Get applications data for additional context
      let relevantApplications = applications;
      if (suggestionDateRange.startDate && suggestionDateRange.endDate) {
        relevantApplications = applications.filter(app => {
          const appDeadline = new Date(app.deadline);
          const startDate = new Date(suggestionDateRange.startDate);
          const endDate = new Date(suggestionDateRange.endDate);
          return appDeadline >= startDate && appDeadline <= endDate;
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

      // Prepare application data for context
      const applicationData = relevantApplications.map(app => ({
        id: app.id,
        university: app.university,
        program: app.program,
        country: app.country,
        deadline: app.deadline,
        status: app.status,
        notes: app.notes,
        daysUntilDeadline: Math.ceil((new Date(app.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
        totalTasks: app.tasks.length,
        completedTasks: app.tasks.filter(t => t.completed).length,
        pendingTasks: app.tasks.filter(t => !t.completed).length,
        hasReminder: !!app.reminder,
        taskDetails: app.tasks.map(task => ({
          id: task.id,
          task: task.task,
          completed: task.completed,
          dueDate: task.dueDate,
          hasReminder: !!task.reminder
        }))
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
        studyOnlyTasks: allStudyTasks.filter(task => task.source === 'study').length,
        totalApplications: relevantApplications.length,
        applicationsByStatus: {
          planning: relevantApplications.filter(a => a.status === 'planning').length,
          inProgress: relevantApplications.filter(a => a.status === 'in-progress').length,
          submitted: relevantApplications.filter(a => a.status === 'submitted').length,
          interview: relevantApplications.filter(a => a.status === 'interview').length,
          accepted: relevantApplications.filter(a => a.status === 'accepted').length,
          rejected: relevantApplications.filter(a => a.status === 'rejected').length,
          waitlisted: relevantApplications.filter(a => a.status === 'waitlisted').length,
        },
        upcomingDeadlines: relevantApplications.filter(a => {
          const daysUntil = Math.ceil((new Date(a.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          return daysUntil <= 30 && daysUntil > 0;
        }).length,
        overdueApplications: relevantApplications.filter(a => new Date(a.deadline) < new Date() && a.status !== 'submitted').length
      };

      // Enhanced prompt for XML format response
      const prompt = customPrompt.trim() || 
        `Create a comprehensive study and application management roadmap that integrates both academic tasks and university application requirements. 

IMPORTANT: Return your response in the following XML format ONLY. Do not include any text outside the XML structure:

<roadmap>
  <priorityMatrix>
    <category name="High Urgency, High Importance">
      <task name="Task Name" urgency="high" importance="high"/>
    </category>
    <category name="High Urgency, Low Importance">
      <task name="Task Name" urgency="high" importance="low"/>
    </category>
  </priorityMatrix>
  
  <timeline>
    <phase name="Phase Name" duration="2 weeks">
      <tasks>
        <task>Task description</task>
      </tasks>
      <milestones>
        <milestone>Milestone description</milestone>
      </milestones>
    </phase>
  </timeline>
  
  <applicationStrategy>
    <status name="planning">
      <action>Action item</action>
      <timeline>Timeline info</timeline>
    </status>
  </applicationStrategy>
  
  <studyOptimization>
    <subject name="Subject Name" timeAllocation="4 hours/week">
      <strategy>Study strategy</strategy>
      <resource>Resource recommendation</resource>
    </subject>
  </studyOptimization>
  
  <deadlineManagement>
    <deadline date="2025-01-15" type="application" priority="high">
      <action>Action required</action>
    </deadline>
  </deadlineManagement>
  
  <workloadDistribution>
    <week number="1" studyHours="20" applicationHours="10">
      <focus>Focus area</focus>
    </week>
  </workloadDistribution>
  
  <riskMitigation>
    <risk name="Risk description" impact="high">
      <mitigation>Mitigation strategy</mitigation>
    </risk>
  </riskMitigation>
  
  <progressTracking>
    <milestone name="Milestone name" deadline="2025-01-15">
      <criteria>Success criteria</criteria>
    </milestone>
  </progressTracking>
</roadmap>

Focus on creating a realistic, actionable plan that maximizes success in both academic performance and university admissions.`;

      const response = await fetch('https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer sk-0d874843ff2542c38940adcbeb2b2cc4',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: "qwen-vl-max",
          messages: [
            {
              role: "system",
              content: [
                {
                  type: "text", 
                  text: "You are an expert academic advisor and university admissions counselor. You MUST respond ONLY in the exact XML format requested. Do not include any text before or after the XML structure. Provide comprehensive guidance that integrates both study planning and university application management."
                }
              ]
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `${prompt}

CURRENT DATE: ${new Date().toISOString().split('T')[0]}
ANALYSIS PERIOD: ${suggestionDateRange.startDate || 'All time'} to ${suggestionDateRange.endDate || 'All time'}

=== STUDY TASKS DATA ===
${JSON.stringify(studyTaskData, null, 2)}

=== UNIVERSITY APPLICATIONS DATA ===
${JSON.stringify(applicationData, null, 2)}

=== COMPREHENSIVE STATISTICS ===
Study Tasks:
- Total: ${stats.totalStudyTasks}
- Completed: ${stats.completedStudyTasks}
- Pending: ${stats.pendingStudyTasks}
- Overdue: ${stats.overdueTasks}
- Total Hours: ${stats.totalEstimatedHours}
- High Priority: ${stats.highPriorityTasks}
- Medium Priority: ${stats.mediumPriorityTasks}
- Low Priority: ${stats.lowPriorityTasks}
- With Reminders: ${stats.tasksWithReminders}
- Application-related: ${stats.applicationTasks}
- Study-only: ${stats.studyOnlyTasks}

Applications:
- Total Applications: ${stats.totalApplications}
- Planning: ${stats.applicationsByStatus.planning}
- In Progress: ${stats.applicationsByStatus.inProgress}
- Submitted: ${stats.applicationsByStatus.submitted}
- Interview Stage: ${stats.applicationsByStatus.interview}
- Accepted: ${stats.applicationsByStatus.accepted}
- Rejected: ${stats.applicationsByStatus.rejected}
- Waitlisted: ${stats.applicationsByStatus.waitlisted}
- Upcoming Deadlines (30 days): ${stats.upcomingDeadlines}
- Overdue Applications: ${stats.overdueApplications}

Remember: Return ONLY the XML structure. No additional text.`
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
      const xmlContent = result.choices?.[0]?.message?.content || '';
      
      // Parse XML response
      const parsedData = parseXMLRoadmap(xmlContent);
      
      setAiSuggestionResult({
        ...parsedData,
        rawText: xmlContent
      });
      
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
            importance: task.getAttribute('importance') || ''
          }))
        }));
      }
      
      // Parse Timeline
      const timeline = xmlDoc.getElementsByTagName('timeline')[0];
      if (timeline) {
        result.timeline = Array.from(timeline.getElementsByTagName('phase')).map(phase => ({
          phase: phase.getAttribute('name') || '',
          duration: phase.getAttribute('duration') || '',
          tasks: Array.from(phase.getElementsByTagName('task')).map(task => task.textContent || ''),
          milestones: Array.from(phase.getElementsByTagName('milestone')).map(milestone => milestone.textContent || '')
        }));
      }
      
      // Parse Application Strategy
      const applicationStrategy = xmlDoc.getElementsByTagName('applicationStrategy')[0];
      if (applicationStrategy) {
        result.applicationStrategy = Array.from(applicationStrategy.getElementsByTagName('status')).map(status => ({
          status: status.getAttribute('name') || '',
          actions: Array.from(status.getElementsByTagName('action')).map(action => action.textContent || ''),
          timeline: status.getElementsByTagName('timeline')[0]?.textContent || ''
        }));
      }
      
      // Parse Study Optimization
      const studyOptimization = xmlDoc.getElementsByTagName('studyOptimization')[0];
      if (studyOptimization) {
        result.studyOptimization = Array.from(studyOptimization.getElementsByTagName('subject')).map(subject => ({
          subject: subject.getAttribute('name') || '',
          timeAllocation: subject.getAttribute('timeAllocation') || '',
          strategy: subject.getElementsByTagName('strategy')[0]?.textContent || '',
          resources: Array.from(subject.getElementsByTagName('resource')).map(resource => resource.textContent || '')
        }));
      }
      
      // Parse Deadline Management
      const deadlineManagement = xmlDoc.getElementsByTagName('deadlineManagement')[0];
      if (deadlineManagement) {
        result.deadlineManagement = Array.from(deadlineManagement.getElementsByTagName('deadline')).map(deadline => ({
          deadline: deadline.getAttribute('date') || '',
          type: deadline.getAttribute('type') || '',
          priority: deadline.getAttribute('priority') || '',
          actions: Array.from(deadline.getElementsByTagName('action')).map(action => action.textContent || '')
        }));
      }
      
      // Parse Workload Distribution
      const workloadDistribution = xmlDoc.getElementsByTagName('workloadDistribution')[0];
      if (workloadDistribution) {
        result.workloadDistribution = Array.from(workloadDistribution.getElementsByTagName('week')).map(week => ({
          week: week.getAttribute('number') || '',
          studyHours: week.getAttribute('studyHours') || '',
          applicationHours: week.getAttribute('applicationHours') || '',
          focus: Array.from(week.getElementsByTagName('focus')).map(focus => focus.textContent || '')
        }));
      }
      
      // Parse Risk Mitigation
      const riskMitigation = xmlDoc.getElementsByTagName('riskMitigation')[0];
      if (riskMitigation) {
        result.riskMitigation = Array.from(riskMitigation.getElementsByTagName('risk')).map(risk => ({
          risk: risk.getAttribute('name') || '',
          impact: risk.getAttribute('impact') || '',
          mitigation: Array.from(risk.getElementsByTagName('mitigation')).map(mitigation => mitigation.textContent || '')
        }));
      }
      
      // Parse Progress Tracking
      const progressTracking = xmlDoc.getElementsByTagName('progressTracking')[0];
      if (progressTracking) {
        result.progressTracking = Array.from(progressTracking.getElementsByTagName('milestone')).map(milestone => ({
          milestone: milestone.getAttribute('name') || '',
          deadline: milestone.getAttribute('deadline') || '',
          criteria: Array.from(milestone.getElementsByTagName('criteria')).map(criteria => criteria.textContent || '')
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

  const filteredTasks = getFilteredAndSortedTasks();

  return (
    <motion.div
      className={`bg-slate-600/30 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg overflow-hidden ${className}`}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <div className="bg-slate-700/50 backdrop-blur-sm px-6 py-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <IconComponent icon={FiCalendar} className="h-6 w-6 text-cyan-400" />
            <h2 className="text-xl font-bold text-cyan-400">Study Planner</h2>
          </div>
          <div className="flex items-center space-x-3">
            <motion.button
              onClick={() => setShowAIModal(true)}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-medium shadow-md hover:shadow-lg transition-all"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              title="AI Timetable Import"
            >
              <IconComponent icon={FaBrain} className="h-4 w-4 mr-2" />
              AI Import
            </motion.button>
            <motion.button
              onClick={openAISuggestionModal}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg text-white font-medium shadow-md hover:shadow-lg transition-all"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
              title="AI Study Roadmap Generator"
            >
              <IconComponent icon={AiOutlineBulb} className="h-4 w-4 mr-2" />
              AI Roadmap
            </motion.button>
            <motion.button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg text-white font-medium shadow-md hover:shadow-lg transition-all"
              variants={buttonVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <IconComponent icon={FiPlus} className="h-4 w-4 mr-2" />
              Add Task
            </motion.button>
          </div>
        </div>
      </div>

      {/* Add Task Form */}
      {showAddForm && (
        <motion.div
          className="p-6 border-b border-white/10 bg-slate-700/30 backdrop-blur-sm"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
        >
          <form onSubmit={handleAddTask} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Task</label>
                <input
                  type="text"
                  value={newTask.task}
                  onChange={(e) => setNewTask({...newTask, task: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg text-slate-300 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="Enter task description"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Subject</label>
                <input
                  type="text"
                  value={newTask.subject}
                  onChange={(e) => setNewTask({...newTask, subject: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg text-slate-300 placeholder-slate-400 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="Enter subject"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Due Date</label>
                <input
                  type="date"
                  value={newTask.date}
                  onChange={(e) => setNewTask({...newTask, date: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg text-slate-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Priority</label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({...newTask, priority: e.target.value as 'low' | 'medium' | 'high'})}
                  className="w-full px-3 py-2 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg text-slate-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">Estimated Hours</label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={newTask.estimatedHours}
                  onChange={(e) => setNewTask({...newTask, estimatedHours: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg text-slate-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <motion.button
                type="submit"
                className="flex items-center px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg text-white font-medium shadow-md hover:shadow-lg transition-all"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <IconComponent icon={FiCheck} className="h-4 w-4 mr-2" />
                Add Task
              </motion.button>

              <motion.button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-6 py-2 bg-slate-600/50 backdrop-blur-sm hover:bg-slate-500/50 rounded-lg text-slate-300 transition-colors border border-white/10"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                Cancel
              </motion.button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Main Content - Calendar and Tasks */}
      <div className="flex flex-col lg:flex-row h-[600px]">
        {/* Left Half - Calendar */}
        <div className="lg:w-1/2 p-6 border-r border-white/10">
          {renderCalendar()}
        </div>

        {/* Right Half - Tasks */}
        <div className="lg:w-1/2 flex flex-col">
          {/* Filters and Sort */}
          <div className="p-6 border-b border-white/10">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <motion.button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-3 py-2 bg-slate-600/50 backdrop-blur-sm hover:bg-slate-500/50 rounded-lg text-slate-300 transition-colors border border-white/10"
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <IconComponent icon={FiFilter} className="h-4 w-4 mr-2" />
                Filters
              </motion.button>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg text-slate-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
              >
                <option value="date">Sort by Date</option>
                <option value="date_desc">Sort by Date (Desc)</option>
                <option value="priority">Sort by Priority</option>
                <option value="priority_desc">Sort by Priority (Desc)</option>
                <option value="subject">Sort by Subject</option>
                <option value="subject_desc">Sort by Subject (Desc)</option>
                <option value="hours">Sort by Hours</option>
                <option value="hours_desc">Sort by Hours (Desc)</option>
                <option value="completion">Sort by Completion</option>
              </select>

              {(selectedDate || selectedCalendarDate || filterPriority !== 'all' || filterSubject !== 'all') && (
                <motion.button
                  onClick={clearFilters}
                  className="flex items-center px-3 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-red-400 transition-colors border border-red-500/30"
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <IconComponent icon={FaTimes} className="h-4 w-4 mr-2" />
                  Clear Filters
                </motion.button>
              )}
            </div>

            {showFilters && (
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-700/30 backdrop-blur-sm rounded-lg border border-white/10"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Filter by Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg text-slate-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Filter by Priority</label>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg text-slate-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  >
                    <option value="all">All Priorities</option>
                    <option value="high">High Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="low">Low Priority</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Filter by Subject</label>
                  <select
                    value={filterSubject}
                    onChange={(e) => setFilterSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg text-slate-300 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  >
                    <option value="all">All Subjects</option>
                    {getUniqueSubjects().map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )}

            {selectedCalendarDate && (
              <div className="mt-4 p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
                <p className="text-blue-400 text-sm">
                  Showing tasks for: {selectedCalendarDate.toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          {/* Tasks List */}
          <div className="flex-1 overflow-y-auto p-6">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-12">
                <IconComponent icon={AiOutlineBulb} className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                <h3 className="text-lg font-medium text-slate-300 mb-2">No tasks found</h3>
                <p className="text-slate-400">
                  {selectedCalendarDate ? 'No tasks scheduled for this date.' : 'Add a new task or adjust your filters to see tasks here.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
                    className={`p-4 bg-slate-700/30 backdrop-blur-sm rounded-lg border border-white/10 transition-all ${
                      task.completed ? 'opacity-75' : ''
                    }`}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <motion.button
                          onClick={() => handleTaskToggle(task.id)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                            task.completed
                              ? 'bg-green-500 border-green-500 text-white'
                              : 'border-slate-400 hover:border-cyan-400'
                          }`}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {task.completed && <IconComponent icon={FiCheck} className="h-3 w-3" />}
                        </motion.button>

                        <div className="flex-1">
                          <h4 className={`font-medium ${task.completed ? 'line-through text-slate-400' : 'text-slate-200'}`}>
                            {task.task}
                          </h4>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-cyan-400">{task.subject}</span>
                            <span className="text-sm text-slate-400 flex items-center">
                              <IconComponent icon={FiCalendar} className="h-3 w-3 mr-1" />
                              {new Date(task.date).toLocaleDateString()}
                            </span>
                            <span className="text-sm text-slate-400 flex items-center">
                              <IconComponent icon={FiClock} className="h-3 w-3 mr-1" />
                              {task.estimatedHours}h
                            </span>
                          </div>
                        </div>

                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)}`}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <motion.button
                          onClick={() => openReminderModal(task.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            task.reminder 
                              ? 'text-yellow-400 hover:text-yellow-300 bg-yellow-500/10' 
                              : 'text-slate-400 hover:text-yellow-400 hover:bg-yellow-500/10'
                          }`}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title={task.reminder ? 'Reminder set' : 'Set reminder'}
                        >
                          <IconComponent icon={FaBell} className="h-4 w-4" />
                        </motion.button>

                        <motion.button
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
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
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-slate-800 rounded-2xl border border-white/10 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
            >
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-purple-400 flex items-center">
                    <IconComponent icon={FaBrain} className="mr-2" />
                    AI Timetable Import
                  </h2>
                  <motion.button
                    onClick={closeAIModal}
                    className="text-slate-400 hover:text-slate-300 p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <IconComponent icon={FaTimes} className="h-5 w-5" />
                  </motion.button>
                </div>
                <p className="text-slate-400 mt-2">
                  Upload your timetable image or PDF and let AI analyze it to automatically create study tasks with predicted priorities.
                </p>
              </div>
              
              <div className="p-6">
                {!uploadedFile ? (
                  <div className="space-y-6">
                    <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:border-purple-500/50 transition-colors">
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
                        <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center">
                          <IconComponent icon={FiUpload} className="h-8 w-8 text-purple-400" />
                        </div>
                        <div>
                          <p className="text-lg font-medium text-slate-300 mb-2">
                            {isUploading ? 'Processing...' : 'Upload Timetable Image'}
                          </p>
                          <p className="text-slate-400 text-sm">
                            Drag and drop or click to select an image file
                          </p>
                          <p className="text-slate-500 text-xs mt-2">
                            Supports: JPG, PNG, GIF (Max 10MB)
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* File Preview */}
                    <div className="bg-slate-700/30 rounded-xl p-4 border border-white/10">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-slate-300">Uploaded File</h3>
                        <motion.button
                          onClick={() => setUploadedFile(null)}
                          className="text-slate-400 hover:text-red-400 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <IconComponent icon={FaTimes} className="h-4 w-4" />
                        </motion.button>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="w-20 h-20 bg-slate-600/50 rounded-lg flex items-center justify-center overflow-hidden">
                          {uploadedFile.file.type.startsWith('image/') ? (
                            <img 
                              src={uploadedFile.base64} 
                              alt="Uploaded timetable" 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <IconComponent icon={FaCalendarAlt} className="h-8 w-8 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-slate-300 font-medium">{uploadedFile.file.name}</p>
                          <p className="text-slate-400 text-sm">
                            {(uploadedFile.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          {uploadedFile.extractedText && (
                            <p className="text-green-400 text-sm mt-1">
                              ✓ Text extracted successfully
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* AI Analysis Results */}
                    {aiAnalysisResult && (
                      <div className="bg-slate-700/30 rounded-xl p-4 border border-white/10">
                        <h3 className="text-lg font-medium text-slate-300 mb-4 flex items-center">
                          <IconComponent icon={AiOutlineRobot} className="mr-2 text-purple-400" />
                          AI Analysis Results
                        </h3>
                        
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                          {aiAnalysisResult.map((task: any, index: number) => (
                            <div key={index} className="bg-slate-600/30 rounded-lg p-3 border border-white/5">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-slate-200">{task.title}</h4>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  task.priority === 'high' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                  task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                  'bg-green-500/20 text-green-400 border border-green-500/30'
                                }`}>
                                  {task.priority} priority
                                </span>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-slate-400">
                                <span className="flex items-center">
                                  <IconComponent icon={FiCalendar} className="h-3 w-3 mr-1" />
                                  {task.dueDate}
                                </span>
                                <span className="flex items-center">
                                  <IconComponent icon={FiClock} className="h-3 w-3 mr-1" />
                                  {task.estimatedHours || 2}h
                                </span>
                                <span className="text-cyan-400">{task.subject || 'General'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {!aiAnalysisResult && (
                          <motion.button
                            onClick={processWithAI}
                            disabled={isProcessingAI || !uploadedFile.extractedText}
                            className="flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-medium rounded-lg transition-all disabled:cursor-not-allowed"
                            whileHover={{ scale: isProcessingAI ? 1 : 1.05 }}
                            whileTap={{ scale: isProcessingAI ? 1 : 0.95 }}
                          >
                            {isProcessingAI ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                                Analyzing...
                              </>
                            ) : (
                              <>
                                <IconComponent icon={AiOutlineRobot} className="h-4 w-4 mr-2" />
                                Analyze with AI
                              </>
                            )}
                          </motion.button>
                        )}
                        
                        {aiAnalysisResult && (
                          <motion.button
                            onClick={addAITasks}
                            className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium rounded-lg transition-all"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <IconComponent icon={FiCheck} className="h-4 w-4 mr-2" />
                            Add {aiAnalysisResult.length} Tasks
                          </motion.button>
                        )}
                      </div>
                      
                      <motion.button
                        onClick={closeAIModal}
                        className="px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-lg transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Close
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Suggestion Modal */}
      <AnimatePresence>
        {showAISuggestionModal && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-slate-800 rounded-2xl border border-white/10 shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
            >
              <div className="p-6 border-b border-white/10 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-emerald-400 flex items-center">
                    <IconComponent icon={AiOutlineBulb} className="mr-2" />
                    AI Study Roadmap Generator
                  </h2>
                  <motion.button
                    onClick={closeAISuggestionModal}
                    className="text-slate-400 hover:text-slate-300 p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <IconComponent icon={FaTimes} className="h-5 w-5" />
                  </motion.button>
                </div>
                <p className="text-slate-400 mt-2">
                  Get AI-powered study roadmaps with task prioritization, time management, and workload division strategies.
                </p>
              </div>
              
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {/* Date Range and Prompt in a compact row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Date Range Selection */}
                    <div className="bg-slate-700/30 rounded-xl p-4 border border-white/10">
                      <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center">
                        <IconComponent icon={FiCalendar} className="mr-2 text-emerald-400" />
                        Date Range (Optional)
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <input
                            type="date"
                            value={suggestionDateRange.startDate}
                            onChange={(e) => setSuggestionDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                            className="w-full px-3 py-2 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg text-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </div>
                        <div>
                          <input
                            type="date"
                            value={suggestionDateRange.endDate}
                            onChange={(e) => setSuggestionDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                            className="w-full px-3 py-2 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg text-slate-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Custom Prompt */}
                    <div className="bg-slate-700/30 rounded-xl p-4 border border-white/10">
                      <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center">
                        <IconComponent icon={FiEdit} className="mr-2 text-emerald-400" />
                        Custom Request (Optional)
                      </h3>
                      <textarea
                        value={customPrompt}
                        onChange={(e) => setCustomPrompt(e.target.value)}
                        placeholder="e.g., 'Focus on exam preparation' or 'Help with time management'"
                        className="w-full px-3 py-2 bg-slate-600/50 backdrop-blur-sm border border-white/10 rounded-lg text-slate-300 placeholder-slate-400 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Task Analysis Summary */}
                  <div className="bg-slate-700/30 rounded-xl p-4 border border-white/10">
                    <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center">
                      <IconComponent icon={FiClock} className="mr-2 text-emerald-400" />
                      Comprehensive Analysis
                    </h3>
                    <div className="text-slate-400 text-sm">
                      {(() => {
                        // Get all study tasks (including those synced from applications)
                        let allStudyTasks = studyTasks;
                        let relevantApplications = applications;
                        
                        if (suggestionDateRange.startDate && suggestionDateRange.endDate) {
                          allStudyTasks = studyTasks.filter(task => {
                            const taskDate = new Date(task.date);
                            const startDate = new Date(suggestionDateRange.startDate);
                            const endDate = new Date(suggestionDateRange.endDate);
                            return taskDate >= startDate && taskDate <= endDate;
                          });
                          
                          relevantApplications = applications.filter(app => {
                            const appDeadline = new Date(app.deadline);
                            const startDate = new Date(suggestionDateRange.startDate);
                            const endDate = new Date(suggestionDateRange.endDate);
                            return appDeadline >= startDate && appDeadline <= endDate;
                          });
                        }
                        
                        const completedTasks = allStudyTasks.filter(task => task.completed).length;
                        const pendingTasks = allStudyTasks.length - completedTasks;
                        const totalHours = allStudyTasks.reduce((sum, task) => sum + task.estimatedHours, 0);
                        const highPriority = allStudyTasks.filter(task => task.priority === 'high').length;
                        const mediumPriority = allStudyTasks.filter(task => task.priority === 'medium').length;
                        const lowPriority = allStudyTasks.filter(task => task.priority === 'low').length;
                        const overdueTasks = allStudyTasks.filter(task => new Date(task.date) < new Date() && !task.completed).length;
                        const applicationTasks = allStudyTasks.filter(task => task.source === 'application').length;
                        const studyOnlyTasks = allStudyTasks.filter(task => task.source === 'study').length;
                        
                        return (
                          <div className="space-y-4">
                            {/* Study Tasks Stats */}
                            <div>
                              <h4 className="text-xs font-medium text-slate-300 mb-2">Study Tasks</h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                <div className="text-center">
                                  <div className="text-lg font-bold text-emerald-400">{allStudyTasks.length}</div>
                                  <div className="text-xs">Total</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-green-400">{completedTasks}</div>
                                  <div className="text-xs">Done</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-yellow-400">{pendingTasks}</div>
                                  <div className="text-xs">Pending</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-cyan-400">{totalHours}h</div>
                                  <div className="text-xs">Hours</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-red-400">{highPriority}</div>
                                  <div className="text-xs">High</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-purple-400">{overdueTasks}</div>
                                  <div className="text-xs">Overdue</div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Task Sources */}
                            <div>
                              <h4 className="text-xs font-medium text-slate-300 mb-2">Task Sources</h4>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="text-center">
                                  <div className="text-lg font-bold text-blue-400">{studyOnlyTasks}</div>
                                  <div className="text-xs">Study Tasks</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-orange-400">{applicationTasks}</div>
                                  <div className="text-xs">Application Tasks</div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Applications Stats */}
                            <div>
                              <h4 className="text-xs font-medium text-slate-300 mb-2">University Applications</h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="text-center">
                                  <div className="text-lg font-bold text-indigo-400">{relevantApplications.length}</div>
                                  <div className="text-xs">Total Apps</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-yellow-400">{relevantApplications.filter(a => a.status === 'planning').length}</div>
                                  <div className="text-xs">Planning</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-blue-400">{relevantApplications.filter(a => a.status === 'in-progress').length}</div>
                                  <div className="text-xs">In Progress</div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-green-400">{relevantApplications.filter(a => a.status === 'submitted').length}</div>
                                  <div className="text-xs">Submitted</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* AI Suggestion Result */}
                  {Object.keys(aiSuggestionResult).length > 0 && (
                    <div className="bg-slate-700/30 rounded-xl p-4 border border-white/10">
                      <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center">
                        <IconComponent icon={AiOutlineRobot} className="mr-2 text-emerald-400" />
                        AI Study Roadmap
                      </h3>
                      
                      <div className="space-y-4 max-h-80 overflow-y-auto">
                        {/* Priority Matrix */}
                        {aiSuggestionResult.priorityMatrix && (
                          <div className="bg-slate-600/30 rounded-lg p-4 border border-white/5">
                            <h4 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center">
                              <IconComponent icon={FiFilter} className="mr-2" />
                              Priority Matrix
                            </h4>
                            <div className="space-y-3">
                              {aiSuggestionResult.priorityMatrix.map((category, idx) => (
                                <div key={idx} className="bg-slate-700/50 rounded-lg p-3">
                                  <h5 className="text-xs font-medium text-slate-300 mb-2">{category.category}</h5>
                                  <div className="space-y-1">
                                    {category.tasks.map((task, taskIdx) => (
                                      <div key={taskIdx} className="flex items-center justify-between text-xs">
                                        <span className="text-slate-400">{task.name}</span>
                                        <div className="flex space-x-1">
                                          <span className={`px-2 py-1 rounded text-xs ${
                                            task.urgency === 'high' ? 'bg-red-500/20 text-red-400' : 
                                            task.urgency === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 
                                            'bg-green-500/20 text-green-400'
                                          }`}>
                                            {task.urgency}
                                          </span>
                                          <span className={`px-2 py-1 rounded text-xs ${
                                            task.importance === 'high' ? 'bg-purple-500/20 text-purple-400' : 
                                            task.importance === 'medium' ? 'bg-blue-500/20 text-blue-400' : 
                                            'bg-gray-500/20 text-gray-400'
                                          }`}>
                                            {task.importance}
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

                        {/* Timeline */}
                        {aiSuggestionResult.timeline && (
                          <div className="bg-slate-600/30 rounded-lg p-4 border border-white/5">
                            <h4 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center">
                              <IconComponent icon={FiCalendar} className="mr-2" />
                              Timeline
                            </h4>
                            <div className="space-y-3">
                              {aiSuggestionResult.timeline.map((phase, idx) => (
                                <div key={idx} className="bg-slate-700/50 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="text-xs font-medium text-slate-300">{phase.phase}</h5>
                                    <span className="text-xs text-cyan-400">{phase.duration}</span>
                                  </div>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                      <h6 className="text-xs font-medium text-slate-400 mb-1">Tasks</h6>
                                      <ul className="text-xs text-slate-500 space-y-1">
                                        {phase.tasks.map((task, taskIdx) => (
                                          <li key={taskIdx} className="flex items-start">
                                            <span className="text-emerald-400 mr-2">•</span>
                                            {task}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                    <div>
                                      <h6 className="text-xs font-medium text-slate-400 mb-1">Milestones</h6>
                                      <ul className="text-xs text-slate-500 space-y-1">
                                        {phase.milestones.map((milestone, milestoneIdx) => (
                                          <li key={milestoneIdx} className="flex items-start">
                                            <span className="text-yellow-400 mr-2">★</span>
                                            {milestone}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Application Strategy */}
                        {aiSuggestionResult.applicationStrategy && (
                          <div className="bg-slate-600/30 rounded-lg p-4 border border-white/5">
                            <h4 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center">
                              <IconComponent icon={FiEdit} className="mr-2" />
                              Application Strategy
                            </h4>
                            <div className="space-y-3">
                              {aiSuggestionResult.applicationStrategy.map((strategy, idx) => (
                                <div key={idx} className="bg-slate-700/50 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="text-xs font-medium text-slate-300 capitalize">{strategy.status}</h5>
                                    <span className="text-xs text-blue-400">{strategy.timeline}</span>
                                  </div>
                                  <ul className="text-xs text-slate-500 space-y-1">
                                    {strategy.actions.map((action, actionIdx) => (
                                      <li key={actionIdx} className="flex items-start">
                                        <span className="text-blue-400 mr-2">→</span>
                                        {action}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Study Optimization */}
                        {aiSuggestionResult.studyOptimization && (
                          <div className="bg-slate-600/30 rounded-lg p-4 border border-white/5">
                            <h4 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center">
                              <IconComponent icon={FiClock} className="mr-2" />
                              Study Optimization
                            </h4>
                            <div className="space-y-3">
                              {aiSuggestionResult.studyOptimization.map((subject, idx) => (
                                <div key={idx} className="bg-slate-700/50 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="text-xs font-medium text-slate-300">{subject.subject}</h5>
                                    <span className="text-xs text-cyan-400">{subject.timeAllocation}</span>
                                  </div>
                                  <p className="text-xs text-slate-400 mb-2">{subject.strategy}</p>
                                  <div>
                                    <h6 className="text-xs font-medium text-slate-400 mb-1">Resources</h6>
                                    <ul className="text-xs text-slate-500 space-y-1">
                                      {subject.resources.map((resource, resourceIdx) => (
                                        <li key={resourceIdx} className="flex items-start">
                                          <span className="text-green-400 mr-2">📚</span>
                                          {resource}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Deadline Management */}
                        {aiSuggestionResult.deadlineManagement && (
                          <div className="bg-slate-600/30 rounded-lg p-4 border border-white/5">
                            <h4 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center">
                              <IconComponent icon={FaBell} className="mr-2" />
                              Deadline Management
                            </h4>
                            <div className="space-y-3">
                              {aiSuggestionResult.deadlineManagement.map((deadline, idx) => (
                                <div key={idx} className="bg-slate-700/50 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs text-slate-300">{deadline.deadline}</span>
                                      <span className={`px-2 py-1 rounded text-xs ${
                                        deadline.priority === 'high' ? 'bg-red-500/20 text-red-400' : 
                                        deadline.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 
                                        'bg-green-500/20 text-green-400'
                                      }`}>
                                        {deadline.priority}
                                      </span>
                                    </div>
                                    <span className="text-xs text-purple-400 capitalize">{deadline.type}</span>
                                  </div>
                                  <ul className="text-xs text-slate-500 space-y-1">
                                    {deadline.actions.map((action, actionIdx) => (
                                      <li key={actionIdx} className="flex items-start">
                                        <span className="text-red-400 mr-2">⚡</span>
                                        {action}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Workload Distribution */}
                        {aiSuggestionResult.workloadDistribution && (
                          <div className="bg-slate-600/30 rounded-lg p-4 border border-white/5">
                            <h4 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center">
                              <IconComponent icon={FiCalendar} className="mr-2" />
                              Workload Distribution
                            </h4>
                            <div className="space-y-3">
                              {aiSuggestionResult.workloadDistribution.map((week, idx) => (
                                <div key={idx} className="bg-slate-700/50 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="text-xs font-medium text-slate-300">Week {week.week}</h5>
                                    <div className="flex space-x-2">
                                      <span className="text-xs text-blue-400">Study: {week.studyHours}h</span>
                                      <span className="text-xs text-orange-400">Apps: {week.applicationHours}h</span>
                                    </div>
                                  </div>
                                  <ul className="text-xs text-slate-500 space-y-1">
                                    {week.focus.map((focus, focusIdx) => (
                                      <li key={focusIdx} className="flex items-start">
                                        <span className="text-cyan-400 mr-2">🎯</span>
                                        {focus}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Risk Mitigation */}
                        {aiSuggestionResult.riskMitigation && (
                          <div className="bg-slate-600/30 rounded-lg p-4 border border-white/5">
                            <h4 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center">
                              <IconComponent icon={FiTrash2} className="mr-2" />
                              Risk Mitigation
                            </h4>
                            <div className="space-y-3">
                              {aiSuggestionResult.riskMitigation.map((risk, idx) => (
                                <div key={idx} className="bg-slate-700/50 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="text-xs font-medium text-slate-300">{risk.risk}</h5>
                                    <span className={`px-2 py-1 rounded text-xs ${
                                      risk.impact === 'high' ? 'bg-red-500/20 text-red-400' : 
                                      risk.impact === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 
                                      'bg-green-500/20 text-green-400'
                                    }`}>
                                      {risk.impact} impact
                                    </span>
                                  </div>
                                  <ul className="text-xs text-slate-500 space-y-1">
                                    {risk.mitigation.map((mitigation, mitigationIdx) => (
                                      <li key={mitigationIdx} className="flex items-start">
                                        <span className="text-orange-400 mr-2">🛡️</span>
                                        {mitigation}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Progress Tracking */}
                        {aiSuggestionResult.progressTracking && (
                          <div className="bg-slate-600/30 rounded-lg p-4 border border-white/5">
                            <h4 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center">
                              <IconComponent icon={FiCheck} className="mr-2" />
                              Progress Tracking
                            </h4>
                            <div className="space-y-3">
                              {aiSuggestionResult.progressTracking.map((milestone, idx) => (
                                <div key={idx} className="bg-slate-700/50 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <h5 className="text-xs font-medium text-slate-300">{milestone.milestone}</h5>
                                    <span className="text-xs text-green-400">{milestone.deadline}</span>
                                  </div>
                                  <ul className="text-xs text-slate-500 space-y-1">
                                    {milestone.criteria.map((criteria, criteriaIdx) => (
                                      <li key={criteriaIdx} className="flex items-start">
                                        <span className="text-green-400 mr-2">✓</span>
                                        {criteria}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Raw XML (for debugging) */}
                        {aiSuggestionResult.rawText && (
                          <div className="bg-slate-600/30 rounded-lg p-4 border border-white/5">
                            <details>
                              <summary className="text-xs font-medium text-slate-400 cursor-pointer hover:text-slate-300">
                                View Raw XML Response
                              </summary>
                              <pre className="text-xs text-slate-500 mt-2 whitespace-pre-wrap overflow-x-auto">
                                {aiSuggestionResult.rawText}
                              </pre>
                            </details>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons - Fixed at bottom */}
              <div className="p-6 border-t border-white/10 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <motion.button
                      onClick={generateAISuggestion}
                      disabled={isGeneratingSuggestion}
                      className="flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:from-slate-600 disabled:to-slate-600 text-white font-medium rounded-lg transition-all disabled:cursor-not-allowed"
                      whileHover={{ scale: isGeneratingSuggestion ? 1 : 1.05 }}
                      whileTap={{ scale: isGeneratingSuggestion ? 1 : 0.95 }}
                    >
                      {isGeneratingSuggestion ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          Generating Roadmap...
                        </>
                      ) : (
                        <>
                          <IconComponent icon={AiOutlineBulb} className="h-4 w-4 mr-2" />
                          Generate Study Roadmap
                        </>
                      )}
                    </motion.button>
                    
                    {Object.keys(aiSuggestionResult).length > 0 && (
                      <div className="text-sm text-slate-400 flex items-center">
                        <IconComponent icon={FiCheck} className="h-4 w-4 mr-1 text-green-400" />
                        1 AI response used
                      </div>
                    )}
                  </div>
                  
                  <motion.button
                    onClick={closeAISuggestionModal}
                    className="px-6 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-lg transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Close
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reminder Modal */}
      <AnimatePresence>
        {reminderModal.isOpen && (
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-slate-800 rounded-2xl border border-white/10 shadow-2xl w-full max-w-md"
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
            >
              <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-bold text-cyan-400 flex items-center">
                  <IconComponent icon={FaBell} className="mr-2" />
                  Set Reminder
                </h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Reminder Date
                    </label>
                    <input
                      type="date"
                      value={reminderDate}
                      onChange={(e) => setReminderDate(e.target.value)}
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Reminder Time
                    </label>
                    <input
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-white/10 flex justify-end gap-4">
                <motion.button
                  onClick={closeReminderModal}
                  className="bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 px-6 py-3 rounded-lg transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleSetReminder}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Set Reminder
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StudyPlannerComponent; 