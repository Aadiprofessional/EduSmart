import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { StudyPlannerApiService } from '../services/studyPlannerApi';
import { useUser } from '../contexts/UserContext';

export interface ApplicationTask {
  id: number;
  application_id?: number;
  task: string;
  completed: boolean;
  dueDate?: string;
  due_date?: string;
  reminder?: boolean;
  reminderDate?: string;
  reminder_date?: string;
}

export interface Application {
  id: number;
  user_id?: string;
  university: string;
  program: string;
  country: string;
  deadline: string;
  status: 'planning' | 'in-progress' | 'submitted' | 'interview' | 'accepted' | 'rejected' | 'waitlisted';
  notes?: string;
  tasks: ApplicationTask[];
  reminder?: boolean;
  reminderDate?: string;
  reminder_date?: string;
  application_tasks?: ApplicationTask[];
}

export interface StudyTask {
  id: string;
  user_id?: string;
  task: string;
  subject: string;
  date: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  estimatedHours: number;
  estimated_hours?: number;
  source?: 'application' | 'study';
  applicationId?: number;
  application_id?: number;
  reminder?: boolean;
  reminderDate?: string;
  reminder_date?: string;
}

export interface AppDataContextType {
  applications: Application[];
  studyTasks: StudyTask[];
  setApplications: (applications: Application[]) => void;
  setStudyTasks: (tasks: StudyTask[]) => void;
  addApplication: (application: Application) => Promise<void>;
  updateApplication: (id: number, application: Partial<Application>) => Promise<void>;
  deleteApplication: (id: number) => Promise<void>;
  addStudyTask: (task: StudyTask) => Promise<void>;
  updateStudyTask: (id: string, task: Partial<StudyTask>) => Promise<void>;
  deleteStudyTask: (id: string) => Promise<void>;
  syncApplicationToStudy: (application: Application) => void;
  toggleTaskReminder: (taskId: string | number, isApplication?: boolean) => Promise<void>;
  setReminder: (taskId: string | number, reminderDate: string, isApplication?: boolean) => Promise<void>;
  unsetReminder: (taskId: string | number, isApplication?: boolean) => Promise<void>;
  refreshData: (force?: boolean) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};

interface AppDataProviderProps {
  children: ReactNode;
  userId?: string; // Make userId optional for backward compatibility
}

export const AppDataProvider: React.FC<AppDataProviderProps> = ({ children, userId }) => {
  const { user } = useUser();
  
  // Generate a consistent demo UUID for unauthenticated users
  const getDemoUserId = () => {
    // Check if we have a stored demo user ID
    let demoUserId = localStorage.getItem('demo-user-id');
    if (!demoUserId) {
      // Generate a proper UUID format for demo user
      demoUserId = '00000000-0000-4000-8000-000000000001';
      localStorage.setItem('demo-user-id', demoUserId);
    }
    return demoUserId;
  };

  // Get effective user ID from props, context, or generate demo UUID
  const effectiveUserId = userId || user?.id || getDemoUserId();
  
  const [applications, setApplicationsState] = useState<Application[]>([]);
  const [studyTasks, setStudyTasksState] = useState<StudyTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<number>(0);
  const [apiService] = useState(() => new StudyPlannerApiService(effectiveUserId));
  
  // Cache timeout: 10 seconds for real-time feel
  const CACHE_TIMEOUT = 10 * 1000;

  // Convert backend data to frontend format
  const normalizeStudyTask = (task: any): StudyTask => ({
    id: task.id,
    task: task.task,
    subject: task.subject,
    date: task.date,
    completed: task.completed,
    priority: task.priority,
    estimatedHours: task.estimated_hours || task.estimatedHours || 1,
    source: task.source || 'study',
    applicationId: task.application_id || task.applicationId,
    reminder: task.reminder,
    reminderDate: task.reminder_date || task.reminderDate,
  });

  const normalizeApplication = (app: any): Application => ({
    id: app.id,
    university: app.university,
    program: app.program,
    country: app.country,
    deadline: app.deadline,
    status: app.status,
    notes: app.notes || '',
    reminder: app.reminder,
    reminderDate: app.reminder_date || app.reminderDate,
    tasks: (app.application_tasks || app.tasks || []).map((task: any) => ({
      id: task.id,
      task: task.task,
      completed: task.completed,
      dueDate: task.due_date || task.dueDate,
      reminder: task.reminder,
      reminderDate: task.reminder_date || task.reminderDate,
    })),
  });

  // Convert frontend data to backend format
  const denormalizeStudyTask = (task: StudyTask) => ({
    id: task.id,
    task: task.task,
    subject: task.subject,
    date: task.date,
    completed: task.completed,
    priority: task.priority,
    estimated_hours: task.estimatedHours || task.estimated_hours || 1,
    source: task.source || 'study',
    application_id: task.applicationId || task.application_id,
    reminder: task.reminder,
    reminder_date: task.reminderDate || task.reminder_date,
  });

  const denormalizeApplication = (app: Application) => ({
    id: app.id,
    university: app.university,
    program: app.program,
    country: app.country,
    deadline: app.deadline,
    status: app.status,
    notes: app.notes || '',
    reminder: app.reminder,
    reminder_date: app.reminderDate || app.reminder_date,
  });

  // Load data from API with caching
  const refreshData = useCallback(async (force = false) => {
    const now = Date.now();
    
    // Skip refresh if cache is still valid and not forced
    if (!force && (now - lastRefresh) < CACHE_TIMEOUT) {
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      // Load study tasks and applications in parallel
      const [studyTasksResult, applicationsResult] = await Promise.all([
        apiService.getStudyTasks(),
        apiService.getApplications(),
      ]);

      if (studyTasksResult.success && studyTasksResult.data) {
        const normalizedTasks = studyTasksResult.data.map(normalizeStudyTask);
        setStudyTasksState(normalizedTasks);
      } else {
        console.warn('Failed to load study tasks:', studyTasksResult.error);
        // Fallback to sample data if API fails
        setStudyTasksState(getSampleStudyTasks());
      }

      if (applicationsResult.success && applicationsResult.data) {
        const normalizedApps = applicationsResult.data.map(normalizeApplication);
        setApplicationsState(normalizedApps);
      } else {
        console.warn('Failed to load applications:', applicationsResult.error);
        // Fallback to sample data if API fails
        setApplicationsState(getSampleApplications());
      }
      
      setLastRefresh(now);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
      setError(errorMessage);
      console.error('Error loading data:', err);
      
      // Fallback to sample data
      setStudyTasksState(getSampleStudyTasks());
      setApplicationsState(getSampleApplications());
    } finally {
      setIsLoading(false);
    }
  }, [effectiveUserId, lastRefresh, apiService]);

  // Initialize data on mount and when userId changes
  useEffect(() => {
    refreshData(true); // Force initial load
  }, [effectiveUserId]); // Only depend on userId change

  // Auto-refresh when component mounts or becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshData(false); // Don't force, use cache if valid
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshData]);

  // Sample data for fallback
  const getSampleStudyTasks = (): StudyTask[] => [
      {
        id: '1',
        task: 'Complete math homework',
        subject: 'Mathematics',
        date: '2025-06-25',
        completed: false,
        priority: 'high',
        estimatedHours: 2,
        source: 'study'
      },
      {
        id: '2',
        task: 'Prepare for biology test',
        subject: 'Biology',
        date: '2025-06-27',
        completed: false,
        priority: 'medium',
        estimatedHours: 3,
        source: 'study'
      },
      {
        id: '3',
        task: 'Read chapter 5 for literature',
        subject: 'Literature',
        date: '2025-06-24',
        completed: true,
        priority: 'low',
        estimatedHours: 1,
        source: 'study'
      }
    ];

  const getSampleApplications = (): Application[] => [
    {
      id: 1,
      university: 'Stanford University',
      program: 'Computer Science',
      country: 'USA',
      deadline: '2025-07-01',
      status: 'in-progress',
      notes: 'Working on personal statement',
      tasks: [
        {
          id: 1,
          task: 'Complete personal statement',
          completed: false,
          dueDate: '2025-06-30'
        },
        {
          id: 2,
          task: 'Get letters of recommendation',
          completed: true,
          dueDate: '2025-06-28'
        }
      ]
    },
    {
      id: 2,
      university: 'MIT',
      program: 'Electrical Engineering',
      country: 'USA',
      deadline: '2025-07-15',
      status: 'planning',
      notes: 'Need to prepare for entrance exam',
      tasks: [
        {
          id: 3,
          task: 'Prepare for GRE',
          completed: false,
          dueDate: '2025-07-10'
        }
      ]
    }
  ];

  const setApplications = (newApplications: Application[]) => {
    setApplicationsState(newApplications);
    // Also sync to study tasks that are application-derived
    newApplications.forEach(app => {
      syncApplicationToStudy(app);
    });
  };

  const setStudyTasks = (tasks: StudyTask[]) => {
    setStudyTasksState(tasks);
  };

  const addApplication = async (application: Application) => {
    try {
      const normalizedApp = denormalizeApplication(application);
      const result = await apiService.createApplication(normalizedApp);
      
      if (result.success && result.data) {
        await refreshData(true); // Refresh to get latest data
      } else {
        throw new Error(result.error || 'Failed to create application');
      }
    } catch (error) {
      console.error('Error adding application:', error);
      throw error;
    }
  };

  const updateApplication = async (id: number, updatedApplication: Partial<Application>) => {
    try {
      // Handle application task updates separately
      if (updatedApplication.tasks) {
        const app = applications.find(a => a.id === id);
      if (app) {
          // Update each task through the API
          for (const task of updatedApplication.tasks) {
            if (task.id) {
              const taskData = {
                task: task.task,
                completed: task.completed,
                due_date: task.dueDate,
                reminder: task.reminder,
                reminder_date: task.reminderDate
              };
              await apiService.updateApplicationTask(task.id, taskData);
            }
          }
        }
        // Remove tasks from the update object as they're handled separately
        const { tasks, ...appUpdateData } = updatedApplication;
        updatedApplication = appUpdateData;
      }

      // Update the application itself if there are changes
      if (Object.keys(updatedApplication).length > 0) {
        const normalizedUpdate = denormalizeApplication(updatedApplication as Application);
        const result = await apiService.updateApplication(id, normalizedUpdate);
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to update application');
        }
      }

      await refreshData(true); // Refresh to get latest data
    } catch (error) {
      console.error('Error updating application:', error);
      throw error;
    }
  };

  const deleteApplication = async (id: number) => {
    try {
      const result = await apiService.deleteApplication(id);
      
      if (result.success) {
        await refreshData(true); // Refresh to get latest data
      } else {
        throw new Error(result.error || 'Failed to delete application');
      }
    } catch (error) {
      console.error('Error deleting application:', error);
      throw error;
    }
  };

  const addStudyTask = async (task: StudyTask) => {
    try {
      const normalizedTask = denormalizeStudyTask(task);
      const result = await apiService.createStudyTask(normalizedTask);
      
      if (result.success && result.data) {
        await refreshData(true); // Refresh to get latest data
      } else {
        throw new Error(result.error || 'Failed to create study task');
      }
    } catch (error) {
      console.error('Error adding study task:', error);
      throw error;
    }
  };

  const updateStudyTask = async (id: string, updatedTask: Partial<StudyTask>) => {
    try {
      const normalizedUpdate = denormalizeStudyTask(updatedTask as StudyTask);
      const result = await apiService.updateStudyTask(id, normalizedUpdate);
      
      if (result.success) {
        await refreshData(true); // Refresh to get latest data
      } else {
        throw new Error(result.error || 'Failed to update study task');
      }
    } catch (error) {
      console.error('Error updating study task:', error);
      throw error;
    }
  };

  const deleteStudyTask = async (id: string) => {
    try {
      const result = await apiService.deleteStudyTask(id);
      
      if (result.success) {
        await refreshData(true); // Refresh to get latest data
      } else {
        throw new Error(result.error || 'Failed to delete study task');
      }
    } catch (error) {
      console.error('Error deleting study task:', error);
      throw error;
    }
  };

  const syncApplicationToStudy = (application: Application) => {
    // This function can be used to create virtual study tasks from applications
    // but since we handle this in the frontend filtering, we don't need to persist them
  };

  const toggleTaskReminder = async (taskId: string | number, isApplication = false) => {
    try {
    if (isApplication) {
        const app = applications.find(a => a.id === Number(taskId));
        if (app) {
          await updateApplication(app.id, { 
            reminder: !app.reminder,
            reminderDate: app.reminder ? undefined : new Date().toISOString()
          });
        }
      } else {
        const task = studyTasks.find(t => t.id === String(taskId));
        if (task) {
          await updateStudyTask(task.id, { 
            reminder: !task.reminder,
            reminderDate: task.reminder ? undefined : new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error('Error toggling reminder:', error);
      throw error;
    }
  };

  const setReminder = async (taskId: string | number, reminderDate: string, isApplication = false) => {
    try {
    if (isApplication) {
        const app = applications.find(a => a.id === Number(taskId));
        if (app) {
          await updateApplication(app.id, { 
            reminder: true,
            reminderDate: reminderDate
          });
        }
    } else {
        const task = studyTasks.find(t => t.id === String(taskId));
        if (task) {
          await updateStudyTask(task.id, { 
            reminder: true,
            reminderDate: reminderDate
          });
        }
      }
    } catch (error) {
      console.error('Error setting reminder:', error);
      throw error;
    }
  };

  const unsetReminder = async (taskId: string | number, isApplication = false) => {
    try {
    if (isApplication) {
        const app = applications.find(a => a.id === Number(taskId));
        if (app) {
          await updateApplication(app.id, { 
            reminder: false,
            reminderDate: undefined
          });
        }
    } else {
        const task = studyTasks.find(t => t.id === String(taskId));
        if (task) {
          await updateStudyTask(task.id, { 
            reminder: false,
            reminderDate: undefined
          });
        }
      }
    } catch (error) {
      console.error('Error unsetting reminder:', error);
      throw error;
    }
  };

  const contextValue: AppDataContextType = {
    applications,
    studyTasks,
    setApplications,
    setStudyTasks,
    addApplication,
    updateApplication,
    deleteApplication,
    addStudyTask,
    updateStudyTask,
    deleteStudyTask,
    syncApplicationToStudy,
    toggleTaskReminder,
    setReminder,
    unsetReminder,
    refreshData,
    isLoading,
    error,
  };

  return (
    <AppDataContext.Provider value={contextValue}>
      {children}
    </AppDataContext.Provider>
  );
};