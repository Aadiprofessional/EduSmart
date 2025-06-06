import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AiOutlineBulb } from 'react-icons/ai';
import { FiCalendar, FiClock, FiCheck, FiPlus, FiEdit, FiTrash2 } from 'react-icons/fi';
import IconComponent from './IconComponent';
import { useLanguage } from '../../utils/LanguageContext';

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

  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddForm, setShowAddForm] = useState(false);

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

  const getTasksForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return studyTasks.filter(task => task.date === dateStr);
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const calendarDays = generateCalendarDays();
  const today = new Date();
  const currentMonth = currentDate.getMonth();

  return (
    <div className={`${className}`}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-teal-800">
            {t('aiStudy.studyPlannerCalendar')}
          </h2>
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

        {/* Add Task Form */}
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <motion.div
            variants={itemVariants}
            className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
          >
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex space-x-2">
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => navigateMonth('prev')}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </motion.button>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => navigateMonth('next')}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                const tasksForDay = getTasksForDate(day);
                const isCurrentMonth = day.getMonth() === currentMonth;
                const isToday = day.toDateString() === today.toDateString();
                
                return (
                  <motion.div
                    key={index}
                    className={`p-2 min-h-[80px] border border-gray-100 rounded-lg ${
                      isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                    } ${isToday ? 'ring-2 ring-teal-500' : ''}`}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className={`text-sm font-medium mb-1 ${
                      isCurrentMonth ? 'text-gray-800' : 'text-gray-400'
                    } ${isToday ? 'text-teal-600' : ''}`}>
                      {day.getDate()}
                    </div>
                    <div className="space-y-1">
                      {tasksForDay.slice(0, 2).map(task => (
                        <div
                          key={task.id}
                          className={`text-xs p-1 rounded truncate ${
                            task.completed ? 'bg-green-100 text-green-800' : getPriorityColor(task.priority)
                          }`}
                          title={task.task}
                        >
                          {task.task}
                        </div>
                      ))}
                      {tasksForDay.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{tasksForDay.length - 2} more
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Task List */}
          <motion.div
            variants={itemVariants}
            className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
          >
            <h3 className="text-lg font-medium text-teal-800 mb-4 flex items-center">
              <IconComponent icon={FiClock} className="mr-2" />
              {t('aiStudy.yourStudySchedule')}
            </h3>
            
            {studyTasks.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {studyTasks
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                  .map((task) => (
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