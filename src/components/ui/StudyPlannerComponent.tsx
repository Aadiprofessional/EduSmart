import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AiOutlineBulb, AiOutlineRobot } from 'react-icons/ai';
import { FiCalendar, FiClock, FiCheck, FiPlus, FiEdit, FiTrash2, FiFilter, FiChevronLeft, FiChevronRight, FiUpload } from 'react-icons/fi';
import { FaCalendarAlt, FaSort, FaSortAmountDown, FaTimes, FaBell, FaBrain } from 'react-icons/fa';
import IconComponent from './IconComponent';
import { useLanguage } from '../../utils/LanguageContext';
import { useAppData, StudyTask } from '../../utils/AppDataContext';
import { useNotification } from '../../utils/NotificationContext';

// Empty export to make this a module
export {};

interface StudyPlannerComponentProps {
  className?: string;
}

const StudyPlannerComponent: React.FC<StudyPlannerComponentProps> = ({ className = '' }) => {
  const { t } = useLanguage();
  const { showSuccess, showError, showWarning } = useNotification();
  const { 
    studyTasks, 
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