import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaCalendarAlt, FaUniversity, FaChartBar, FaFilter, FaSort, FaSortAmountUp, FaSortAmountDown } from 'react-icons/fa';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import IconComponent from '../components/ui/IconComponent';

interface Application {
  id: number;
  university: string;
  program: string;
  country: string;
  deadline: string;
  status: 'planning' | 'in-progress' | 'submitted' | 'interview' | 'accepted' | 'rejected' | 'waitlisted';
  notes?: string;
  tasks: ApplicationTask[];
}

interface ApplicationTask {
  id: number;
  task: string;
  completed: boolean;
}

const ApplicationTracker: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
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
  const [newTask, setNewTask] = useState('');

  // Sample applications for demo
  useEffect(() => {
    const sampleApplications: Application[] = [
      {
        id: 1,
        university: 'Stanford University',
        program: 'MS in Computer Science',
        country: 'USA',
        deadline: '2025-12-01',
        status: 'in-progress',
        notes: 'Need to complete Statement of Purpose and get recommendation letters',
        tasks: [
          { id: 1, task: 'Request transcript', completed: true },
          { id: 2, task: 'Ask for recommendation letters', completed: true },
          { id: 3, task: 'Write Statement of Purpose', completed: false },
          { id: 4, task: 'Prepare resume', completed: false }
        ]
      },
      {
        id: 2,
        university: 'MIT',
        program: 'PhD in Artificial Intelligence',
        country: 'USA',
        deadline: '2025-12-15',
        status: 'planning',
        notes: 'Need to contact potential advisors',
        tasks: [
          { id: 1, task: 'Research faculty members', completed: false },
          { id: 2, task: 'Email potential advisors', completed: false },
          { id: 3, task: 'Prepare research proposal', completed: false }
        ]
      },
      {
        id: 3,
        university: 'University of Cambridge',
        program: 'MPhil in Machine Learning',
        country: 'UK',
        deadline: '2025-11-15',
        status: 'submitted',
        notes: 'Application submitted on October 20th. Waiting for response.',
        tasks: [
          { id: 1, task: 'Submit application', completed: true },
          { id: 2, task: 'Pay application fee', completed: true },
          { id: 3, task: 'Send supporting documents', completed: true }
        ]
      }
    ];
    
    setApplications(sampleApplications);
  }, []);

  // Add new application
  const handleAddApplication = () => {
    if (!newApplication.university || !newApplication.program || !newApplication.deadline) {
      alert('Please fill in all required fields');
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
    
    setApplications([...applications, application]);
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
      alert('Please fill in all required fields');
      return;
    }
    
    const updatedApplications = applications.map(app => {
      if (app.id === isEditingApplication) {
        return {
          ...app,
          university: newApplication.university || app.university,
          program: newApplication.program || app.program,
          country: newApplication.country || app.country,
          deadline: newApplication.deadline || app.deadline,
          status: newApplication.status as 'planning' | 'in-progress' | 'submitted' | 'interview' | 'accepted' | 'rejected' | 'waitlisted' || app.status,
          notes: newApplication.notes || app.notes,
          tasks: newApplication.tasks || app.tasks
        };
      }
      return app;
    });
    
    setApplications(updatedApplications);
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
    if (window.confirm('Are you sure you want to delete this application?')) {
      setApplications(applications.filter(app => app.id !== id));
    }
  };

  // Toggle task completion
  const toggleTaskCompletion = (appId: number, taskId: number) => {
    const updatedApplications = applications.map(app => {
      if (app.id === appId) {
        const updatedTasks = app.tasks.map(task => {
          if (task.id === taskId) {
            return { ...task, completed: !task.completed };
          }
          return task;
        });
        return { ...app, tasks: updatedTasks };
      }
      return app;
    });
    
    setApplications(updatedApplications);
  };

  // Add task to application
  const addTask = (appId: number) => {
    if (!newTask.trim()) return;
    
    const updatedApplications = applications.map(app => {
      if (app.id === appId) {
        const newTaskId = app.tasks.length > 0 ? Math.max(...app.tasks.map(t => t.id)) + 1 : 1;
        const updatedTasks = [...app.tasks, { id: newTaskId, task: newTask, completed: false }];
        return { ...app, tasks: updatedTasks };
      }
      return app;
    });
    
    setApplications(updatedApplications);
    setNewTask('');
  };

  // Update application status
  const updateApplicationStatus = (appId: number, newStatus: Application['status']) => {
    const updatedApplications = applications.map(app => {
      if (app.id === appId) {
        return { ...app, status: newStatus };
      }
      return app;
    });
    
    setApplications(updatedApplications);
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
      case 'planning': return 'bg-gray-200 text-gray-800';
      case 'in-progress': return 'bg-blue-200 text-blue-800';
      case 'submitted': return 'bg-purple-200 text-purple-800';
      case 'interview': return 'bg-indigo-200 text-indigo-800';
      case 'accepted': return 'bg-green-200 text-green-800';
      case 'rejected': return 'bg-red-200 text-red-800';
      case 'waitlisted': return 'bg-yellow-200 text-yellow-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planning': return 'Planning';
      case 'in-progress': return 'In Progress';
      case 'submitted': return 'Submitted';
      case 'interview': return 'Interview Stage';
      case 'accepted': return 'Accepted';
      case 'rejected': return 'Rejected';
      case 'waitlisted': return 'Waitlisted';
      default: return status;
    }
  };

  // Date formatting
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow pt-8 pb-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-teal-800">Application Tracker</h1>
            <button
              onClick={() => setIsAddingApplication(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <IconComponent icon={FaPlus} /> Add Application
            </button>
          </div>
          
          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-gray-600 text-sm mb-1">Total Applications</h3>
              <p className="text-2xl font-bold text-teal-800">{applications.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-gray-600 text-sm mb-1">Submitted</h3>
              <p className="text-2xl font-bold text-purple-700">
                {applications.filter(app => app.status === 'submitted' || app.status === 'interview' || app.status === 'accepted' || app.status === 'rejected' || app.status === 'waitlisted').length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-gray-600 text-sm mb-1">Accepted</h3>
              <p className="text-2xl font-bold text-green-700">{applications.filter(app => app.status === 'accepted').length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-gray-600 text-sm mb-1">In Progress</h3>
              <p className="text-2xl font-bold text-blue-700">{applications.filter(app => app.status === 'planning' || app.status === 'in-progress').length}</p>
            </div>
          </div>
          
          {/* Filter and Sort */}
          <div className="flex flex-col md:flex-row justify-between bg-white p-4 rounded-lg shadow-md mb-6">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
              <div className="flex items-center">
                <IconComponent icon={FaFilter} className="text-gray-500 mr-2" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-gray-100 border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="planning">Planning</option>
                  <option value="in-progress">In Progress</option>
                  <option value="submitted">Submitted</option>
                  <option value="interview">Interview</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                  <option value="waitlisted">Waitlisted</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <IconComponent icon={FaSort} className="text-gray-500 mr-2" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-gray-100 border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="deadline">Sort by Deadline</option>
                  <option value="university">Sort by University</option>
                  <option value="status">Sort by Status</option>
                </select>
              </div>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="text-gray-500 hover:text-teal-600 transition-colors"
              >
                {sortOrder === 'asc' ? <IconComponent icon={FaSortAmountUp} /> : <IconComponent icon={FaSortAmountDown} />}
              </button>
            </div>
          </div>
          
          {/* Applications List */}
          {sortedApplications.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedApplications.map(app => (
                <div key={app.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-teal-800">{app.university}</h3>
                        <p className="text-sm text-gray-600">{app.program}</p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditApplication(app)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          aria-label="Edit application"
                        >
                          <IconComponent icon={FaEdit} />
                        </button>
                        <button
                          onClick={() => handleDeleteApplication(app.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          aria-label="Delete application"
                        >
                          <IconComponent icon={FaTrash} />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                        {getStatusLabel(app.status)}
                      </span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        {app.country}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mt-2">
                      <IconComponent icon={FaCalendarAlt} className="mr-1 text-orange-500" /> Deadline: {formatDate(app.deadline)}
                    </div>
                  </div>
                  
                  {/* Tasks */}
                  <div className="p-4">
                    <h4 className="font-medium text-gray-700 mb-2">Tasks</h4>
                    {app.tasks.length > 0 ? (
                      <ul className="space-y-2">
                        {app.tasks.map(task => (
                          <li key={task.id} className="flex items-start">
                            <button
                              onClick={() => toggleTaskCompletion(app.id, task.id)}
                              className={`flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 mr-2 ${
                                task.completed ? 'bg-teal-500 border-teal-500 text-white' : 'border-gray-300'
                              }`}
                            >
                              {task.completed && <IconComponent icon={FaCheck} className="text-xs" />}
                            </button>
                            <span className={`text-sm ${task.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                              {task.task}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-500 italic">No tasks added yet</p>
                    )}
                    
                    {/* Add task form */}
                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        placeholder="Add a task..."
                        value={newTask}
                        onChange={(e) => setNewTask(e.target.value)}
                        className="flex-grow bg-gray-100 border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        onKeyDown={(e) => e.key === 'Enter' && addTask(app.id)}
                      />
                      <button
                        onClick={() => addTask(app.id)}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded-md text-sm transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                  
                  {/* Notes and Update Status */}
                  <div className="p-4 bg-gray-50 border-t border-gray-100">
                    {app.notes && (
                      <div className="mb-3">
                        <h4 className="font-medium text-gray-700 mb-1">Notes</h4>
                        <p className="text-sm text-gray-600">{app.notes}</p>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="font-medium text-gray-700 mb-1">Update Status</h4>
                      <div className="flex flex-wrap gap-2">
                        <select
                          value={app.status}
                          onChange={(e) => updateApplicationStatus(app.id, e.target.value as Application['status'])}
                          className="bg-white border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          <option value="planning">Planning</option>
                          <option value="in-progress">In Progress</option>
                          <option value="submitted">Submitted</option>
                          <option value="interview">Interview</option>
                          <option value="accepted">Accepted</option>
                          <option value="rejected">Rejected</option>
                          <option value="waitlisted">Waitlisted</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <IconComponent icon={FaUniversity} className="text-5xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No applications found</h3>
              <p className="text-gray-600 mb-4">
                {filterStatus === 'all' 
                  ? "You haven't added any applications yet."
                  : "No applications match the selected filter."}
              </p>
              {filterStatus !== 'all' && (
                <button
                  onClick={() => setFilterStatus('all')}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Show All Applications
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Add/Edit Application Modal */}
        {(isAddingApplication || isEditingApplication !== null) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-800">
                  {isEditingApplication !== null ? 'Edit Application' : 'Add New Application'}
                </h2>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">University *</label>
                    <input
                      type="text"
                      value={newApplication.university}
                      onChange={(e) => setNewApplication({...newApplication, university: e.target.value})}
                      className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="e.g. Stanford University"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Program *</label>
                    <input
                      type="text"
                      value={newApplication.program}
                      onChange={(e) => setNewApplication({...newApplication, program: e.target.value})}
                      className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="e.g. MS in Computer Science"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <input
                      type="text"
                      value={newApplication.country}
                      onChange={(e) => setNewApplication({...newApplication, country: e.target.value})}
                      className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      placeholder="e.g. USA"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Application Deadline *</label>
                    <input
                      type="date"
                      value={newApplication.deadline}
                      onChange={(e) => setNewApplication({...newApplication, deadline: e.target.value})}
                      className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={newApplication.status}
                      onChange={(e) => setNewApplication({...newApplication, status: e.target.value as Application['status']})}
                      className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="planning">Planning</option>
                      <option value="in-progress">In Progress</option>
                      <option value="submitted">Submitted</option>
                      <option value="interview">Interview</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                      <option value="waitlisted">Waitlisted</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={newApplication.notes}
                      onChange={(e) => setNewApplication({...newApplication, notes: e.target.value})}
                      className="w-full bg-gray-100 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      rows={3}
                      placeholder="Add any notes or reminders..."
                    />
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
                <button
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
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={isEditingApplication !== null ? handleUpdateApplication : handleAddApplication}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {isEditingApplication !== null ? 'Save Changes' : 'Add Application'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ApplicationTracker; 