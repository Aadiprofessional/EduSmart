import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AiOutlineBulb } from 'react-icons/ai';
import { FiCalendar, FiClock, FiCheck, FiPlus, FiEdit, FiTrash2, FiFilter } from 'react-icons/fi';
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
      date: '2023-06-25',
      completed: false,
      priority: 'high',
      estimatedHours: 2
    },
    {
      id: '2',
      task: 'Prepare for biology test',
      subject: 'Biology',
      date: '2023-06-27',
      completed: false,
      priority: 'medium',
      estimatedHours: 3
    },
    {
      id: '3',
      task: 'Read chapter 5 for literature',
      subject: 'Literature',
      date: '2023-06-24',
      completed: true,
      priority: 'low',
      estimatedHours: 1
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
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter and sort tasks
  const getFilteredAndSortedTasks = () => {
    let filtered = studyTasks;

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
          return parseInt(a.id) - parseInt(b.id); // Assuming ID represents creation order
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
  };

  const today = new Date();
  const currentMonth = today.getMonth();
  const filteredTasks = getFilteredAndSortedTasks();

  return (
    <div className={`${className}`}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Enhanced Header with Calendar Picker */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-3xl font-bold text-teal-800 flex items-center">
                <IconComponent icon={FaCalendarAlt} className="mr-3 text-teal-600" />
                {t('aiStudy.studyPlannerCalendar')}
              </h2>
              
              {/* Date Picker */}
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                />
                {selectedDate && (
                  <motion.button
                    onClick={() => setSelectedDate('')}
                    className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <IconComponent icon={FaTimes} />
                  </motion.button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Filter Toggle */}
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => setShowFilters(!showFilters)}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 font-medium transition-colors ${
                  showFilters ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <IconComponent icon={FiFilter} className="h-4 w-4" />
                <span>Filters</span>
              </motion.button>

              {/* Add Task Button */}
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 font-medium"
              >
                <IconComponent icon={FiPlus} className="h-4 w-4" />
                <span>{t('aiStudy.addTask')}</span>
              </motion.button>
            </div>
          </div>

          {/* Filters Section */}
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 pt-6 border-t border-gray-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <IconComponent icon={FaSort} className="inline mr-1" />
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="date">Date</option>
                    <option value="date_desc">Date (Descending)</option>
                    <option value="priority">Priority</option>
                    <option value="priority_desc">Priority (Descending)</option>
                    <option value="subject">Subject</option>
                    <option value="subject_desc">Subject (Descending)</option>
                    <option value="hours">Estimated Hours</option>
                    <option value="hours_desc">Estimated Hours (Descending)</option>
                    <option value="time_added">Time Added</option>
                    <option value="time_added_desc">Time Added (Descending)</option>
                    <option value="completion">Completion</option>
                  </select>
                </div>

                {/* Filter by Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="all">All Priorities</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                {/* Filter by Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <select
                    value={filterSubject}
                    onChange={(e) => setFilterSubject(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="all">All Subjects</option>
                    {getUniqueSubjects().map((subject) => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <motion.button
                    onClick={clearFilters}
                    className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Clear Filters
                  </motion.button>
                </div>
              </div>

              {/* Active Filters Display */}
              {(selectedDate || filterPriority !== 'all' || filterSubject !== 'all') && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-gray-600 font-medium">Active filters:</span>
                  {selectedDate && (
                    <span className="bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                      Date: {new Date(selectedDate).toLocaleDateString()}
                      <button onClick={() => setSelectedDate('')}>
                        <IconComponent icon={FaTimes} className="text-xs" />
                      </button>
                    </span>
                  )}
                  {filterPriority !== 'all' && (
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                      Priority: {filterPriority}
                      <button onClick={() => setFilterPriority('all')}>
                        <IconComponent icon={FaTimes} className="text-xs" />
                      </button>
                    </span>
                  )}
                  {filterSubject !== 'all' && (
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                      Subject: {filterSubject}
                      <button onClick={() => setFilterSubject('all')}>
                        <IconComponent icon={FaTimes} className="text-xs" />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Add Task Form */}
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg"
          >
            <h3 className="text-lg font-medium text-teal-800 mb-4 flex items-center">
              <IconComponent icon={FiCalendar} className="mr-2" />
              {t('aiStudy.addNewStudyTask')}
            </h3>
            
            <form onSubmit={handleAddTask} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-1 text-sm font-medium">
                  {t('aiStudy.taskDescription')}
                </label>
                <input
                  type="text"
                  value={newTask.task}
                  onChange={(e) => setNewTask({...newTask, task: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder={t('aiStudy.whatDoYouNeedToStudy')}
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1 text-sm font-medium">
                  {t('aiStudy.subject')}
                </label>
                <input
                  type="text"
                  value={newTask.subject}
                  onChange={(e) => setNewTask({...newTask, subject: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder={t('aiStudy.egMathScienceHistory')}
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1 text-sm font-medium">
                  {t('aiStudy.dueDate')}
                </label>
                <input
                  type="date"
                  value={newTask.date}
                  onChange={(e) => setNewTask({...newTask, date: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1 text-sm font-medium">
                  {t('aiStudy.priority')}
                </label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({...newTask, priority: e.target.value as 'low' | 'medium' | 'high'})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="low">{t('aiStudy.lowPriority')}</option>
                  <option value="medium">{t('aiStudy.mediumPriority')}</option>
                  <option value="high">{t('aiStudy.highPriority')}</option>
                </select>
              </div>
              
              <div>
                <label className="block text-gray-700 mb-1 text-sm font-medium">
                  {t('aiStudy.estimatedHours')}
                </label>
                <input
                  type="number"
                  min="0.5"
                  max="12"
                  step="0.5"
                  value={newTask.estimatedHours}
                  onChange={(e) => setNewTask({...newTask, estimatedHours: parseFloat(e.target.value)})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              
              <div className="flex space-x-2">
                <motion.button
                  type="submit"
                  className="flex-1 py-2 bg-gradient-to-r from-teal-600 to-teal-700 rounded-lg text-white font-medium shadow-md hover:shadow-lg"
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  {t('aiStudy.addToStudyPlan')}
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium"
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

        <div className="grid grid-cols-1 gap-8">
          {/* Task List - Now takes full width */}
          <motion.div
            variants={itemVariants}
            className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
          >
            <h3 className="text-lg font-medium text-teal-800 mb-4 flex items-center">
              <IconComponent icon={FiClock} className="mr-2" />
              {t('aiStudy.yourStudySchedule')}
            </h3>
            
            {filteredTasks.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredTasks.map((task) => (
                  <motion.div
                    key={task.id}
                    variants={itemVariants}
                    className={`border rounded-lg p-3 ${
                      task.completed ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-200'
                    }`}
                    whileHover={{ y: -2, boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)" }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start flex-1">
                        <motion.button
                          className={`mt-1 mr-3 w-5 h-5 flex-shrink-0 rounded-full border ${
                            task.completed ? 'bg-teal-500 border-teal-500' : 'border-gray-300'
                          }`}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleTaskToggle(task.id)}
                        >
                          {task.completed && (
                            <IconComponent icon={FiCheck} className="text-white w-full h-full p-0.5" />
                          )}
                        </motion.button>
                        <div className="flex-1">
                          <p className={`font-medium text-sm ${
                            task.completed ? 'line-through text-gray-500' : 'text-gray-800'
                          }`}>
                            {task.task}
                          </p>
                          <div className="flex items-center flex-wrap gap-2 mt-1">
                            <span className="bg-teal-100 text-teal-800 px-2 py-0.5 rounded text-xs">
                              {task.subject}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                            <span className="flex items-center text-xs text-gray-500">
                              <IconComponent icon={FiCalendar} className="h-3 w-3 mr-1" />
                              {new Date(task.date).toLocaleDateString()}
                            </span>
                            <span className="flex items-center text-xs text-gray-500">
                              <IconComponent icon={FiClock} className="h-3 w-3 mr-1" />
                              {task.estimatedHours}h
                            </span>
                          </div>
                        </div>
                      </div>
                      <motion.button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <IconComponent icon={FiTrash2} className="h-4 w-4" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <IconComponent icon={FiCalendar} className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">{t('aiStudy.studyTasksWillAppearHere')}</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* AI Study Recommendations */}
        <motion.div 
          variants={itemVariants}
          className="bg-gradient-to-br from-teal-600 to-teal-700 rounded-xl p-6 shadow-md text-white"
        >
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <IconComponent icon={AiOutlineBulb} className="mr-2" />
            {t('aiStudy.smartStudyRecommendations')}
          </h3>
          
          <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
            <p className="mb-3">{t('aiStudy.basedOnYourUpcomingTasks')}:</p>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="bg-white text-teal-800 rounded-full p-1 mr-2 flex-shrink-0">
                  <IconComponent icon={FiCheck} className="h-3 w-3" />
                </span>
                <span>{t('aiStudy.startWithMathematicsHomework')}</span>
              </li>
              <li className="flex items-start">
                <span className="bg-white text-teal-800 rounded-full p-1 mr-2 flex-shrink-0">
                  <IconComponent icon={FiCheck} className="h-3 w-3" />
                </span>
                <span>{t('aiStudy.block2HourFocusSessions')}</span>
              </li>
              <li className="flex items-start">
                <span className="bg-white text-teal-800 rounded-full p-1 mr-2 flex-shrink-0">
                  <IconComponent icon={FiCheck} className="h-3 w-3" />
                </span>
                <span>{t('aiStudy.useTheAiStudyAssistant')}</span>
              </li>
            </ul>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default StudyPlannerComponent; 