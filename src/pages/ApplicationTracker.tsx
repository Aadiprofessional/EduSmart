import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaEye, FaCalendarAlt, FaUniversity, FaGraduationCap, FaCheckCircle, FaClock, FaExclamationTriangle, FaSpinner, FaSearch, FaFilter, FaTimes, FaSort, FaSortAmountUp, FaSortAmountDown, FaCheck, FaBell, FaBellSlash, FaClipboardList, FaSave, FaChartLine } from 'react-icons/fa';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import PageHeader from '../components/ui/PageHeader';
import IconComponent from '../components/ui/IconComponent';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../utils/LanguageContext';
import { useNotification } from '../utils/NotificationContext';
import { useAppData, Application, ApplicationTask } from '../utils/AppDataContext';
import { useNavigate } from 'react-router-dom';

const ApplicationTracker: React.FC = () => {
  const { t } = useLanguage();
  const { showWarning, showConfirmation } = useNotification();
  const navigate = useNavigate();
  const { 
    applications, 
    addApplication, 
    updateApplication, 
    deleteApplication,
    toggleTaskReminder,
    setReminder,
    unsetReminder
  } = useAppData();

  const [isAddingApplication, setIsAddingApplication] = useState(false);
  const [isEditingApplication, setIsEditingApplication] = useState<number | null>(null);
  const [newApplication, setNewApplication] = useState<Partial<Application>>({
    university: '',
    program: '',
    country: '',
    deadline: '',
    status: 'planning',
    notes: '',
    tasks: []
  });
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('deadline');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [newTaskInputs, setNewTaskInputs] = useState<{[key: number]: string}>({});
  const [reminderModal, setReminderModal] = useState<{
    isOpen: boolean;
    taskId: string | number;
    isApplication: boolean;
    type: 'application' | 'task';
  }>({
    isOpen: false,
    taskId: '',
    isApplication: false,
    type: 'application'
  });
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [editingTask, setEditingTask] = useState<{appId: number, taskId: number} | null>(null);
  const [editTaskText, setEditTaskText] = useState('');

  // Add new application
  const handleAddApplication = () => {
    if (!newApplication.university || !newApplication.program || !newApplication.deadline) {
      showWarning(t('applicationTracker.requiredFields') || 'Please fill in all required fields');
      return;
    }
    
    const application: Application = {
      id: applications.length > 0 ? Math.max(...applications.map(a => a.id)) + 1 : 1,
      university: newApplication.university || '',
      program: newApplication.program || '',
      country: newApplication.country || '',
      deadline: newApplication.deadline || '',
      status: newApplication.status as 'planning' | 'in-progress' | 'submitted' | 'interview' | 'accepted' | 'rejected' | 'waitlisted',
      notes: newApplication.notes || '',
      tasks: newApplication.tasks || []
    };
    
    addApplication(application);
    setNewApplication({
      university: '',
      program: '',
      country: '',
      deadline: '',
      status: 'planning',
      notes: '',
      tasks: []
    });
    setIsAddingApplication(false);
  };

  // Update existing application
  const handleUpdateApplication = () => {
    if (isEditingApplication === null) return;
    
    if (!newApplication.university || !newApplication.program || !newApplication.deadline) {
      showWarning(t('applicationTracker.requiredFields') || 'Please fill in all required fields');
      return;
    }
    
    updateApplication(isEditingApplication, newApplication);
    setIsEditingApplication(null);
    setNewApplication({
      university: '',
      program: '',
      country: '',
      deadline: '',
      status: 'planning',
      notes: '',
      tasks: []
    });
  };

  // Edit application
  const handleEditApplication = (app: Application) => {
    setIsEditingApplication(app.id);
    setNewApplication({
      university: app.university,
      program: app.program,
      country: app.country,
      deadline: app.deadline,
      status: app.status,
      notes: app.notes,
      tasks: app.tasks
    });
  };

  // Delete application
  const handleDeleteApplication = (id: number) => {
    showConfirmation({
      message: t('applicationTracker.confirmDelete') || 'Are you sure you want to delete this application?',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: () => {
        deleteApplication(id);
      }
    });
  };

  // Toggle task completion
  const toggleTaskCompletion = (appId: number, taskId: number) => {
    const app = applications.find(a => a.id === appId);
    if (!app) return;

    const updatedTasks = app.tasks.map(task => {
      if (task.id === taskId) {
        return { ...task, completed: !task.completed };
      }
      return task;
    });

    updateApplication(appId, { tasks: updatedTasks });
  };

  // Add task to application
  const addTask = (appId: number) => {
    const taskText = newTaskInputs[appId] || '';
    if (!taskText.trim()) return;
    
    const app = applications.find(a => a.id === appId);
    if (!app) return;

    const newTaskId = app.tasks.length > 0 ? Math.max(...app.tasks.map(t => t.id)) + 1 : 1;
    const updatedTasks = [...app.tasks, { id: newTaskId, task: taskText, completed: false }];
    
    updateApplication(appId, { tasks: updatedTasks });
    setNewTaskInputs(prev => ({ ...prev, [appId]: '' }));
  };

  // Edit task
  const startEditingTask = (appId: number, taskId: number, currentText: string) => {
    setEditingTask({ appId, taskId });
    setEditTaskText(currentText);
  };

  const saveTaskEdit = () => {
    if (!editingTask || !editTaskText.trim()) return;
    
    const app = applications.find(a => a.id === editingTask.appId);
    if (!app) return;

    const updatedTasks = app.tasks.map(task => {
      if (task.id === editingTask.taskId) {
        return { ...task, task: editTaskText };
      }
      return task;
    });

    updateApplication(editingTask.appId, { tasks: updatedTasks });
    setEditingTask(null);
    setEditTaskText('');
  };

  const cancelTaskEdit = () => {
    setEditingTask(null);
    setEditTaskText('');
  };

  // Delete task
  const deleteTask = (appId: number, taskId: number) => {
    const app = applications.find(a => a.id === appId);
    if (!app) return;

    const updatedTasks = app.tasks.filter(task => task.id !== taskId);
    updateApplication(appId, { tasks: updatedTasks });
  };

  // Update application status
  const updateApplicationStatus = (appId: number, newStatus: Application['status']) => {
    updateApplication(appId, { status: newStatus });
  };

  // Handle reminder modal
  const openReminderModal = (taskId: string | number, isApplication: boolean, type: 'application' | 'task') => {
    setReminderModal({
      isOpen: true,
      taskId,
      isApplication,
      type
    });
    setReminderDate('');
    setReminderTime('');
  };

  const closeReminderModal = () => {
    setReminderModal({
      isOpen: false,
      taskId: '',
      isApplication: false,
      type: 'application'
    });
    setReminderDate('');
    setReminderTime('');
  };

  const handleSetReminder = () => {
    if (!reminderDate || !reminderTime) {
      showWarning('Please select both date and time for the reminder');
      return;
    }

    const reminderDateTime = `${reminderDate}T${reminderTime}`;
    setReminder(reminderModal.taskId, reminderDateTime, reminderModal.isApplication);
    closeReminderModal();
  };

  const handleUnsetReminder = () => {
    unsetReminder(reminderModal.taskId, reminderModal.isApplication);
    closeReminderModal();
  };

  // Filter applications by status
  const filteredApplications = applications.filter(app => {
    if (filterStatus === 'all') return true;
    return app.status === filterStatus;
  });

  // Sort applications
  const sortedApplications = [...filteredApplications].sort((a, b) => {
    if (sortBy === 'university') {
      return sortOrder === 'asc' 
        ? a.university.localeCompare(b.university)
        : b.university.localeCompare(a.university);
    } else if (sortBy === 'deadline') {
      return sortOrder === 'asc' 
        ? new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        : new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
    } else if (sortBy === 'status') {
      return sortOrder === 'asc' 
        ? a.status.localeCompare(b.status)
        : b.status.localeCompare(a.status);
    }
    return 0;
  });

  // Status colors and labels
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
      case 'in-progress': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'submitted': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'interview': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
      case 'accepted': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'waitlisted': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planning': return t('applicationTracker.planning') || 'Planning';
      case 'in-progress': return t('applicationTracker.inProgress') || 'In Progress';
      case 'submitted': return t('applicationTracker.submitted') || 'Submitted';
      case 'interview': return t('applicationTracker.interview') || 'Interview';
      case 'accepted': return t('applicationTracker.accepted') || 'Accepted';
      case 'rejected': return t('applicationTracker.rejected') || 'Rejected';
      case 'waitlisted': return t('applicationTracker.waitlisted') || 'Waitlisted';
      default: return status;
    }
  };

  // Date formatting
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Animation variants
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

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />
      <main className="flex-grow">
        {/* Futuristic Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-cyan-900/20 via-blue-900/20 to-purple-900/20 backdrop-blur-sm border-b border-cyan-500/20">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5"></div>
            <div className="absolute inset-0" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px'
            }}></div>
          </div>
          <div className="relative container mx-auto px-4 py-16">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl border border-cyan-500/30 backdrop-blur-sm">
                  <IconComponent icon={FaClipboardList} className="text-4xl text-cyan-400" />
                </div>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-4 whitespace-nowrap overflow-hidden text-ellipsis">
                {t('applicationTracker.title') || 'Application Tracker'}
              </h1>
              <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
                {t('applicationTracker.subtitle') || 'Track and manage your university applications with intelligent reminders and calendar integration'}
              </p>
              
              <motion.button
                onClick={() => setIsAddingApplication(true)}
                className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-cyan-500/25 transition-all duration-300 transform hover:scale-105 whitespace-nowrap mr-4"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <IconComponent icon={FaPlus} className="mr-2 flex-shrink-0" />
                <span className="truncate">{t('applicationTracker.addApplication') || 'Add Application'}</span>
              </motion.button>
              
              <motion.button
                onClick={() => navigate('/ai-study?tab=study-planner')}
                className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105 whitespace-nowrap"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <IconComponent icon={FaChartLine} className="mr-2 flex-shrink-0" />
                <span className="truncate">Go to Study Planner</span>
              </motion.button>
            </motion.div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-8">
          {/* Statistics Dashboard */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {[
              {
                label: t('applicationTracker.totalApplications') || 'Total Applications',
                value: applications.length,
                icon: FaUniversity,
                color: 'from-cyan-500 to-blue-500'
              },
              {
                label: t('applicationTracker.submittedCount') || 'Submitted',
                value: applications.filter(app => ['submitted', 'interview', 'accepted', 'rejected', 'waitlisted'].includes(app.status)).length,
                icon: FaCheckCircle,
                color: 'from-purple-500 to-indigo-500'
              },
              {
                label: t('applicationTracker.acceptedCount') || 'Accepted',
                value: applications.filter(app => app.status === 'accepted').length,
                icon: FaGraduationCap,
                color: 'from-green-500 to-emerald-500'
              },
              {
                label: t('applicationTracker.pending') || 'Pending',
                value: applications.filter(app => ['planning', 'in-progress'].includes(app.status)).length,
                icon: FaClock,
                color: 'from-yellow-500 to-orange-500'
              }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-white/10 p-6 hover:border-cyan-500/30 transition-all duration-300"
                variants={itemVariants}
                whileHover={{ scale: 1.02, y: -5 }}
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center mb-4`}>
                  <IconComponent icon={stat.icon} className="text-xl text-white" />
                </div>
                <h3 className="text-slate-400 text-sm mb-1">{stat.label}</h3>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
              </motion.div>
            ))}
          </motion.div>
          
          {/* Filter and Sort Controls */}
          <motion.div
            className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-white/10 p-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <IconComponent icon={FaFilter} className="text-cyan-400 mr-2" />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  >
                    <option value="all">{t('applicationTracker.allStatuses') || 'All Statuses'}</option>
                    <option value="planning">{t('applicationTracker.planning') || 'Planning'}</option>
                    <option value="in-progress">{t('applicationTracker.inProgress') || 'In Progress'}</option>
                    <option value="submitted">{t('applicationTracker.submitted') || 'Submitted'}</option>
                    <option value="interview">{t('applicationTracker.interview') || 'Interview'}</option>
                    <option value="accepted">{t('applicationTracker.accepted') || 'Accepted'}</option>
                    <option value="rejected">{t('applicationTracker.rejected') || 'Rejected'}</option>
                    <option value="waitlisted">{t('applicationTracker.waitlisted') || 'Waitlisted'}</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <IconComponent icon={FaSort} className="text-cyan-400 mr-2" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  >
                    <option value="deadline">{t('applicationTracker.sortBy') || 'Sort by'} {t('applicationTracker.deadline') || 'Deadline'}</option>
                    <option value="university">{t('applicationTracker.sortBy') || 'Sort by'} {t('applicationTracker.university') || 'University'}</option>
                    <option value="status">{t('applicationTracker.sortBy') || 'Sort by'} {t('applicationTracker.status') || 'Status'}</option>
                  </select>
                </div>
                <motion.button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="text-slate-400 hover:text-cyan-400 transition-colors p-2 rounded-lg hover:bg-slate-700/50"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {sortOrder === 'asc' ? <IconComponent icon={FaSortAmountUp} /> : <IconComponent icon={FaSortAmountDown} />}
                </motion.button>
              </div>
            </div>
          </motion.div>
          
          {/* Applications Grid */}
          {sortedApplications.length > 0 ? (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {sortedApplications.map((app, index) => (
                <motion.div
                  key={app.id}
                  className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden hover:border-cyan-500/30 transition-all duration-300"
                  variants={itemVariants}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                >
                  {/* Card Header */}
                  <div className="p-6 border-b border-white/10">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-cyan-400 mb-1">{app.university}</h3>
                        <p className="text-slate-300">{app.program}</p>
                      </div>
                      <div className="flex gap-2">
                        <motion.button
                          onClick={() => openReminderModal(app.id, true, 'application')}
                          className={`p-2 rounded-lg transition-colors ${
                            app.reminder 
                              ? 'text-yellow-400 bg-yellow-500/20 hover:bg-yellow-500/30' 
                              : 'text-slate-400 hover:text-yellow-400 hover:bg-slate-700/50'
                          }`}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title="Set Reminder"
                        >
                          <IconComponent icon={app.reminder ? FaBell : FaBellSlash} className="text-sm" />
                        </motion.button>
                        <motion.button
                          onClick={() => handleEditApplication(app)}
                          className="text-blue-400 hover:text-blue-300 hover:bg-slate-700/50 p-2 rounded-lg transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <IconComponent icon={FaEdit} className="text-sm" />
                        </motion.button>
                        <motion.button
                          onClick={() => handleDeleteApplication(app.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-slate-700/50 p-2 rounded-lg transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <IconComponent icon={FaTrash} className="text-sm" />
                        </motion.button>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(app.status)}`}>
                        {getStatusLabel(app.status)}
                      </span>
                      <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-medium">
                        {app.country}
                      </span>
                    </div>
                    
                    <div className="flex items-center text-sm text-slate-400">
                      <IconComponent icon={FaCalendarAlt} className="mr-2 text-orange-400" />
                      Deadline: {formatDate(app.deadline)}
                    </div>
                    
                    {app.reminder && app.reminderDate && (
                      <div className="flex items-center text-sm text-yellow-400 mt-2">
                        <IconComponent icon={FaBell} className="mr-2" />
                        Reminder: {new Date(app.reminderDate).toLocaleDateString()} at {new Date(app.reminderDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                  
                  {/* Tasks Section */}
                  <div className="p-6">
                    <h4 className="font-semibold text-slate-300 mb-3 flex items-center">
                      <IconComponent icon={FaCheckCircle} className="mr-2 text-cyan-400" />
                      {t('applicationTracker.tasks') || 'Tasks'}
                    </h4>
                    
                    {app.tasks.length > 0 ? (
                      <ul className="space-y-3 mb-4">
                        {app.tasks.map(task => (
                          <li key={task.id} className="flex items-start group">
                            <motion.button
                              onClick={() => toggleTaskCompletion(app.id, task.id)}
                              className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 mr-3 transition-all ${
                                task.completed 
                                  ? 'bg-green-500 border-green-500 text-white' 
                                  : 'border-slate-400 hover:border-cyan-400'
                              }`}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              {task.completed && <IconComponent icon={FaCheck} className="text-xs" />}
                            </motion.button>
                            <div className="flex-1">
                              {editingTask?.appId === app.id && editingTask?.taskId === task.id ? (
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={editTaskText}
                                    onChange={(e) => setEditTaskText(e.target.value)}
                                    className="flex-1 bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-sm text-slate-300"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveTaskEdit();
                                      if (e.key === 'Escape') cancelTaskEdit();
                                    }}
                                    autoFocus
                                  />
                                  <motion.button
                                    onClick={saveTaskEdit}
                                    className="text-green-400 hover:text-green-300 p-1"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <IconComponent icon={FaSave} className="text-xs" />
                                  </motion.button>
                                  <motion.button
                                    onClick={cancelTaskEdit}
                                    className="text-red-400 hover:text-red-300 p-1"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <IconComponent icon={FaTimes} className="text-xs" />
                                  </motion.button>
                                </div>
                              ) : (
                                <>
                                  <span className={`text-sm ${task.completed ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                                    {task.task}
                                  </span>
                                  {task.dueDate && (
                                    <div className="text-xs text-slate-500 mt-1">
                                      Due: {formatDate(task.dueDate)}
                                    </div>
                                  )}
                                  {task.reminder && task.reminderDate && (
                                    <div className="text-xs text-yellow-400 mt-1 flex items-center">
                                      <IconComponent icon={FaBell} className="mr-1" />
                                      Reminder: {new Date(task.reminderDate).toLocaleDateString()} at {new Date(task.reminderDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                            <div className="flex gap-1 ml-2">
                              <motion.button
                                onClick={() => openReminderModal(`${app.id}-${task.id}`, true, 'task')}
                                className={`p-1 rounded transition-all ${
                                  task.reminder 
                                    ? 'text-yellow-400 bg-yellow-500/20' 
                                    : 'text-slate-400 hover:text-yellow-400'
                                }`}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                title="Set Reminder"
                              >
                                <IconComponent icon={task.reminder ? FaBell : FaBellSlash} className="text-xs" />
                              </motion.button>
                              <motion.button
                                onClick={() => startEditingTask(app.id, task.id, task.task)}
                                className="text-blue-400 hover:text-blue-300 p-1 rounded transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                title="Edit Task"
                              >
                                <IconComponent icon={FaEdit} className="text-xs" />
                              </motion.button>
                              <motion.button
                                onClick={() => deleteTask(app.id, task.id)}
                                className="text-red-400 hover:text-red-300 p-1 rounded transition-colors"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                title="Delete Task"
                              >
                                <IconComponent icon={FaTrash} className="text-xs" />
                              </motion.button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-500 italic mb-4">{t('applicationTracker.noTasks') || 'No tasks yet'}</p>
                    )}
                    
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={t('applicationTracker.taskPlaceholder') || 'Add a new task...'}
                        value={newTaskInputs[app.id] || ''}
                        onChange={(e) => setNewTaskInputs(prev => ({ ...prev, [app.id]: e.target.value }))}
                        className="flex-1 bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-300 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        onKeyDown={(e) => e.key === 'Enter' && addTask(app.id)}
                      />
                      <motion.button
                        onClick={() => addTask(app.id)}
                        className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <IconComponent icon={FaPlus} className="text-xs" />
                      </motion.button>
                    </div>
                  </div>
                  
                  {/* Notes and Status Update */}
                  <div className="p-6 bg-slate-900/30 border-t border-white/10">
                    {app.notes && (
                      <div className="mb-4">
                        <h4 className="font-medium text-slate-300 mb-2">{t('applicationTracker.notes') || 'Notes'}</h4>
                        <p className="text-sm text-slate-400 bg-slate-800/50 rounded-lg p-3">{app.notes}</p>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-medium text-slate-300 mb-2">{t('applicationTracker.updateStatus') || 'Update Status'}</h4>
                      <select
                        value={app.status}
                        onChange={(e) => updateApplicationStatus(app.id, e.target.value as Application['status'])}
                        className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-3 py-2 text-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      >
                        <option value="planning">{t('applicationTracker.planning') || 'Planning'}</option>
                        <option value="in-progress">{t('applicationTracker.inProgress') || 'In Progress'}</option>
                        <option value="submitted">{t('applicationTracker.submitted') || 'Submitted'}</option>
                        <option value="interview">{t('applicationTracker.interview') || 'Interview'}</option>
                        <option value="accepted">{t('applicationTracker.accepted') || 'Accepted'}</option>
                        <option value="rejected">{t('applicationTracker.rejected') || 'Rejected'}</option>
                        <option value="waitlisted">{t('applicationTracker.waitlisted') || 'Waitlisted'}</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-white/10 p-12 text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="w-20 h-20 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <IconComponent icon={FaUniversity} className="text-4xl text-cyan-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-300 mb-3">
                {t('applicationTracker.noApplicationsFound') || 'No Applications Found'}
              </h3>
              <p className="text-slate-400 mb-6 max-w-md mx-auto">
                {filterStatus === 'all' 
                  ? t('applicationTracker.noApplicationsYet') || 'Start tracking your university applications by adding your first application.'
                  : t('applicationTracker.noMatchingFilter') || 'No applications match your current filter. Try adjusting your search criteria.'}
              </p>
              {filterStatus !== 'all' ? (
                <motion.button
                  onClick={() => setFilterStatus('all')}
                  className="bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 px-6 py-3 rounded-lg transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {t('applicationTracker.showAllApplications') || 'Show All Applications'}
                </motion.button>
              ) : (
                <motion.button
                  onClick={() => setIsAddingApplication(true)}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-all"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <IconComponent icon={FaPlus} className="mr-2" />
                  Add Your First Application
                </motion.button>
              )}
            </motion.div>
          )}
        </div>
        
        {/* Add/Edit Application Modal */}
        <AnimatePresence>
          {(isAddingApplication || isEditingApplication !== null) && (
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
                  <h2 className="text-2xl font-bold text-cyan-400">
                    {isEditingApplication !== null 
                      ? t('applicationTracker.editApplication') || 'Edit Application'
                      : t('applicationTracker.addNewApplication') || 'Add New Application'}
                  </h2>
                </div>
                
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        {t('applicationTracker.university') || 'University'} *
                      </label>
                      <input
                        type="text"
                        value={newApplication.university}
                        onChange={(e) => setNewApplication({...newApplication, university: e.target.value})}
                        className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        placeholder="Enter university name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        {t('applicationTracker.program') || 'Program'} *
                      </label>
                      <input
                        type="text"
                        value={newApplication.program}
                        onChange={(e) => setNewApplication({...newApplication, program: e.target.value})}
                        className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        placeholder="Enter program name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        {t('applicationTracker.country') || 'Country'}
                      </label>
                      <input
                        type="text"
                        value={newApplication.country}
                        onChange={(e) => setNewApplication({...newApplication, country: e.target.value})}
                        className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        placeholder="Enter country"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        {t('applicationTracker.deadline') || 'Deadline'} *
                      </label>
                      <input
                        type="date"
                        value={newApplication.deadline}
                        onChange={(e) => setNewApplication({...newApplication, deadline: e.target.value})}
                        className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        {t('applicationTracker.status') || 'Status'}
                      </label>
                      <select
                        value={newApplication.status}
                        onChange={(e) => setNewApplication({...newApplication, status: e.target.value as Application['status']})}
                        className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                      >
                        <option value="planning">{t('applicationTracker.planning') || 'Planning'}</option>
                        <option value="in-progress">{t('applicationTracker.inProgress') || 'In Progress'}</option>
                        <option value="submitted">{t('applicationTracker.submitted') || 'Submitted'}</option>
                        <option value="interview">{t('applicationTracker.interview') || 'Interview'}</option>
                        <option value="accepted">{t('applicationTracker.accepted') || 'Accepted'}</option>
                        <option value="rejected">{t('applicationTracker.rejected') || 'Rejected'}</option>
                        <option value="waitlisted">{t('applicationTracker.waitlisted') || 'Waitlisted'}</option>
                      </select>
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        {t('applicationTracker.notes') || 'Notes'}
                      </label>
                      <textarea
                        value={newApplication.notes}
                        onChange={(e) => setNewApplication({...newApplication, notes: e.target.value})}
                        className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                        rows={4}
                        placeholder="Add any additional notes..."
                      />
                    </div>
                  </div>
                </div>
                
                <div className="p-6 border-t border-white/10 flex justify-end gap-4">
                  <motion.button
                    onClick={() => {
                      setIsAddingApplication(false);
                      setIsEditingApplication(null);
                      setNewApplication({
                        university: '',
                        program: '',
                        country: '',
                        deadline: '',
                        status: 'planning',
                        notes: '',
                        tasks: []
                      });
                    }}
                    className="bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 px-6 py-3 rounded-lg transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {t('common.cancel') || 'Cancel'}
                  </motion.button>
                  <motion.button
                    onClick={isEditingApplication !== null ? handleUpdateApplication : handleAddApplication}
                    className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-all"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isEditingApplication !== null 
                      ? t('applicationTracker.saveChanges') || 'Save Changes'
                      : t('applicationTracker.addApplication') || 'Add Application'}
                  </motion.button>
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
                    {(() => {
                      // Check if reminder already exists
                      let hasReminder = false;
                      let currentReminderDate = '';
                      
                      if (reminderModal.isApplication && reminderModal.type === 'application') {
                        const app = applications.find(a => a.id === reminderModal.taskId);
                        hasReminder = !!app?.reminder;
                        currentReminderDate = app?.reminderDate || '';
                      } else if (reminderModal.isApplication && reminderModal.type === 'task') {
                        // Handle composite task ID (appId-taskId format)
                        if (typeof reminderModal.taskId === 'string' && reminderModal.taskId.includes('-')) {
                          const [appIdStr, taskIdStr] = reminderModal.taskId.split('-');
                          const appId = parseInt(appIdStr);
                          const actualTaskId = parseInt(taskIdStr);
                          
                          const app = applications.find(a => a.id === appId);
                          if (app) {
                            const task = app.tasks.find(t => t.id === actualTaskId);
                            if (task) {
                              hasReminder = !!task.reminder;
                              currentReminderDate = task.reminderDate || '';
                            }
                          }
                        }
                      }
                      
                      return hasReminder ? 'Update Reminder' : 'Set Reminder';
                    })()}
                  </h2>
                  {(() => {
                    // Show current reminder info if exists
                    let hasReminder = false;
                    let currentReminderDate = '';
                    
                    if (reminderModal.isApplication && reminderModal.type === 'application') {
                      const app = applications.find(a => a.id === reminderModal.taskId);
                      hasReminder = !!app?.reminder;
                      currentReminderDate = app?.reminderDate || '';
                    } else if (reminderModal.isApplication && reminderModal.type === 'task') {
                      // Handle composite task ID (appId-taskId format)
                      if (typeof reminderModal.taskId === 'string' && reminderModal.taskId.includes('-')) {
                        const [appIdStr, taskIdStr] = reminderModal.taskId.split('-');
                        const appId = parseInt(appIdStr);
                        const actualTaskId = parseInt(taskIdStr);
                        
                        const app = applications.find(a => a.id === appId);
                        if (app) {
                          const task = app.tasks.find(t => t.id === actualTaskId);
                          if (task) {
                            hasReminder = !!task.reminder;
                            currentReminderDate = task.reminderDate || '';
                          }
                        }
                      }
                    }
                    
                    if (hasReminder && currentReminderDate) {
                      const reminderDateTime = new Date(currentReminderDate);
                      return (
                        <p className="text-sm text-slate-400 mt-2">
                          Current reminder: {reminderDateTime.toLocaleDateString()} at {reminderDateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      );
                    }
                    return null;
                  })()}
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
                
                <div className="p-6 border-t border-white/10 flex justify-between">
                  <div className="flex gap-2">
                    <motion.button
                      onClick={closeReminderModal}
                      className="bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 px-6 py-3 rounded-lg transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Cancel
                    </motion.button>
                    {(() => {
                      // Show unset button if reminder exists
                      let hasReminder = false;
                      
                      if (reminderModal.isApplication && reminderModal.type === 'application') {
                        const app = applications.find(a => a.id === reminderModal.taskId);
                        hasReminder = !!app?.reminder;
                      } else if (reminderModal.isApplication && reminderModal.type === 'task') {
                        // Handle composite task ID (appId-taskId format)
                        if (typeof reminderModal.taskId === 'string' && reminderModal.taskId.includes('-')) {
                          const [appIdStr, taskIdStr] = reminderModal.taskId.split('-');
                          const appId = parseInt(appIdStr);
                          const actualTaskId = parseInt(taskIdStr);
                          
                          const app = applications.find(a => a.id === appId);
                          if (app) {
                            const task = app.tasks.find(t => t.id === actualTaskId);
                            if (task) {
                              hasReminder = !!task.reminder;
                            }
                          }
                        }
                      }
                      
                      if (hasReminder) {
                        return (
                          <motion.button
                            onClick={handleUnsetReminder}
                            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-3 rounded-lg font-medium transition-all"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            Remove Reminder
                          </motion.button>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  
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
      </main>
      <Footer />
    </div>
  );
};

export default ApplicationTracker; 