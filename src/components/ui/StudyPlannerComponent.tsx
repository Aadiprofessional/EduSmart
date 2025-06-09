import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AiOutlineBulb } from 'react-icons/ai';
import { FiCalendar, FiClock, FiCheck, FiPlus, FiEdit, FiTrash2, FiFilter, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { FaCalendarAlt, FaSort, FaSortAmountDown, FaTimes } from 'react-icons/fa';
import IconComponent from './IconComponent';
import { useLanguage } from '../../utils/LanguageContext';

// Empty export to make this a module
export {};

interface StudyTask {
  id: string;
  task: string;
  subject: string;
  date: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  estimatedHours: number;
}

interface StudyPlannerComponentProps {
  className?: string;
}

const StudyPlannerComponent: React.FC<StudyPlannerComponentProps> = ({ className = '' }) => {
  const { t } = useLanguage();
  
  const [studyTasks, setStudyTasks] = useState<StudyTask[]>([
    {
      id: '1',
      task: 'Complete math homework',
      subject: 'Mathematics',
      date: '2025-06-25',
      completed: false,
      priority: 'high',
      estimatedHours: 2
    },
    {
      id: '2',
      task: 'Prepare for biology test',
      subject: 'Biology',
      date: '2025-06-27',
      completed: false,
      priority: 'medium',
      estimatedHours: 3
    },
    {
      id: '3',
      task: 'Read chapter 5 for literature',
      subject: 'Literature',
      date: '2025-06-24',
      completed: true,
      priority: 'low',
      estimatedHours: 1
    },
    {
      id: '4',
      task: 'Physics lab report',
      subject: 'Physics',
      date: '2025-06-30',
      completed: false,
      priority: 'high',
      estimatedHours: 4
    },
    {
      id: '5',
      task: 'History essay draft',
      subject: 'History',
      date: '2025-06-02',
      completed: false,
      priority: 'medium',
      estimatedHours: 3
    },
  ]);

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
    return date.toISOString().split('T')[0];
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
    
    setStudyTasks(prev => [...prev, task]);
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
    setStudyTasks(prev => 
      prev.map(task => 
        task.id === id ? {...task, completed: !task.completed} : task
      )
    );
  };

  const handleDeleteTask = (id: string) => {
    setStudyTasks(prev => prev.filter(task => task.id !== id));
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
    setFilterPriority('all');
    setFilterSubject('all');
    setSortBy('date');
    setSelectedCalendarDate(null);
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

                      <motion.button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <IconComponent icon={FiTrash2} className="h-4 w-4" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StudyPlannerComponent; 