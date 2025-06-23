import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ApplicationTask {
  id: number;
  task: string;
  completed: boolean;
  dueDate?: string;
  reminder?: boolean;
  reminderDate?: string;
}

export interface Application {
  id: number;
  university: string;
  program: string;
  country: string;
  deadline: string;
  status: 'planning' | 'in-progress' | 'submitted' | 'interview' | 'accepted' | 'rejected' | 'waitlisted';
  notes?: string;
  tasks: ApplicationTask[];
  reminder?: boolean;
  reminderDate?: string;
}

export interface StudyTask {
  id: string;
  task: string;
  subject: string;
  date: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  estimatedHours: number;
  source?: 'application' | 'study';
  applicationId?: number;
  reminder?: boolean;
  reminderDate?: string;
}

export interface AppDataContextType {
  applications: Application[];
  studyTasks: StudyTask[];
  setApplications: (applications: Application[]) => void;
  setStudyTasks: (tasks: StudyTask[]) => void;
  addApplication: (application: Application) => void;
  updateApplication: (id: number, application: Partial<Application>) => void;
  deleteApplication: (id: number) => void;
  addStudyTask: (task: StudyTask) => void;
  updateStudyTask: (id: string, task: Partial<StudyTask>) => void;
  deleteStudyTask: (id: string) => void;
  syncApplicationToStudy: (application: Application) => void;
  toggleTaskReminder: (taskId: string | number, isApplication?: boolean) => void;
  setReminder: (taskId: string | number, reminderDate: string, isApplication?: boolean) => void;
  unsetReminder: (taskId: string | number, isApplication?: boolean) => void;
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
}

export const AppDataProvider: React.FC<AppDataProviderProps> = ({ children }) => {
  const [applications, setApplicationsState] = useState<Application[]>([]);
  const [studyTasks, setStudyTasksState] = useState<StudyTask[]>([]);

  // Initialize with sample data
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
          { id: 3, task: 'Write Statement of Purpose', completed: false, dueDate: '2025-11-15' },
          { id: 4, task: 'Prepare resume', completed: false, dueDate: '2025-11-10' }
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
          { id: 1, task: 'Research faculty members', completed: false, dueDate: '2025-10-30' },
          { id: 2, task: 'Email potential advisors', completed: false, dueDate: '2025-11-05' },
          { id: 3, task: 'Prepare research proposal', completed: false, dueDate: '2025-11-20' }
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

    const sampleStudyTasks: StudyTask[] = [
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

    setApplicationsState(sampleApplications);
    setStudyTasksState(sampleStudyTasks);

    // Sync application tasks to study tasks
    sampleApplications.forEach(app => {
      syncApplicationToStudy(app);
    });
  }, []);

  const setApplications = (newApplications: Application[]) => {
    setApplicationsState(newApplications);
    // Sync all applications to study tasks
    newApplications.forEach(app => {
      syncApplicationToStudy(app);
    });
  };

  const setStudyTasks = (tasks: StudyTask[]) => {
    setStudyTasksState(tasks);
  };

  const addApplication = (application: Application) => {
    setApplicationsState(prev => [...prev, application]);
    syncApplicationToStudy(application);
  };

  const updateApplication = (id: number, updatedApplication: Partial<Application>) => {
    setApplicationsState(prev => {
      const updated = prev.map(app => 
        app.id === id ? { ...app, ...updatedApplication } : app
      );
      // Re-sync the updated application
      const app = updated.find(a => a.id === id);
      if (app) {
        syncApplicationToStudy(app);
      }
      return updated;
    });
  };

  const deleteApplication = (id: number) => {
    setApplicationsState(prev => prev.filter(app => app.id !== id));
    // Remove related study tasks
    setStudyTasksState(prev => prev.filter(task => task.applicationId !== id));
  };

  const addStudyTask = (task: StudyTask) => {
    setStudyTasksState(prev => [...prev, task]);
  };

  const updateStudyTask = (id: string, updatedTask: Partial<StudyTask>) => {
    setStudyTasksState(prev => 
      prev.map(task => 
        task.id === id ? { ...task, ...updatedTask } : task
      )
    );
  };

  const deleteStudyTask = (id: string) => {
    setStudyTasksState(prev => prev.filter(task => task.id !== id));
  };

  const syncApplicationToStudy = (application: Application) => {
    // Add application deadline as a study task
    const deadlineTask: StudyTask = {
      id: `app-deadline-${application.id}`,
      task: `${application.university} - ${application.program} Application Deadline`,
      subject: 'Applications',
      date: application.reminder && application.reminderDate ? application.reminderDate.split('T')[0] : application.deadline,
      completed: application.status === 'submitted' || application.status === 'accepted' || application.status === 'rejected',
      priority: 'high',
      estimatedHours: 1,
      source: 'application',
      applicationId: application.id,
      reminder: application.reminder,
      reminderDate: application.reminderDate
    };

    // Add application tasks as study tasks
    const taskStudyTasks: StudyTask[] = application.tasks.map(task => ({
      id: `app-task-${application.id}-${task.id}`,
      task: `${task.task} (${application.university})`,
      subject: 'Applications',
      date: task.reminder && task.reminderDate ? task.reminderDate.split('T')[0] : (task.dueDate || application.deadline),
      completed: task.completed,
      priority: 'medium',
      estimatedHours: 2,
      source: 'application',
      applicationId: application.id,
      reminder: task.reminder,
      reminderDate: task.reminderDate
    }));

    // Update study tasks - remove old ones and add new ones
    setStudyTasksState(prev => {
      const filtered = prev.filter(task => task.applicationId !== application.id);
      return [...filtered, deadlineTask, ...taskStudyTasks];
    });
  };

  const toggleTaskReminder = (taskId: string | number, isApplication = false) => {
    if (isApplication) {
      setApplicationsState(prev =>
        prev.map(app => {
          if (app.id === taskId) {
            return { ...app, reminder: !app.reminder };
          }
          
          // Check if it's a composite task ID (appId-taskId format)
          if (typeof taskId === 'string' && taskId.includes('-')) {
            const [appIdStr, taskIdStr] = taskId.split('-');
            const appId = parseInt(appIdStr);
            const actualTaskId = parseInt(taskIdStr);
            
            if (app.id === appId) {
              const updatedTasks = app.tasks.map(task => 
                task.id === actualTaskId ? { ...task, reminder: !task.reminder } : task
              );
              const updatedApp = { ...app, tasks: updatedTasks };
              syncApplicationToStudy(updatedApp);
              return updatedApp;
            }
          }
          
          return app;
        })
      );
    } else {
      setStudyTasksState(prev =>
        prev.map(task => 
          task.id === taskId ? { ...task, reminder: !task.reminder } : task
        )
      );
    }
  };

  const setReminder = (taskId: string | number, reminderDate: string, isApplication = false) => {
    if (isApplication) {
      setApplicationsState(prev =>
        prev.map(app => {
          if (app.id === taskId) {
            const updatedApp = { ...app, reminder: true, reminderDate };
            syncApplicationToStudy(updatedApp);
            return updatedApp;
          }
          
          // Check if it's a composite task ID (appId-taskId format)
          if (typeof taskId === 'string' && taskId.includes('-')) {
            const [appIdStr, taskIdStr] = taskId.split('-');
            const appId = parseInt(appIdStr);
            const actualTaskId = parseInt(taskIdStr);
            
            if (app.id === appId) {
              const updatedTasks = app.tasks.map(task => 
                task.id === actualTaskId ? { ...task, reminder: true, reminderDate } : task
              );
              const updatedApp = { ...app, tasks: updatedTasks };
              syncApplicationToStudy(updatedApp);
              return updatedApp;
            }
          }
          
          return app;
        })
      );
    } else {
      setStudyTasksState(prev =>
        prev.map(task => {
          if (task.id === taskId) {
            const updatedTask = { ...task, reminder: true, reminderDate };
            // If this is a synced task from application, update the original application too
            if (task.source === 'application' && task.applicationId) {
              const appId = task.applicationId;
              if (task.id.startsWith(`app-deadline-${appId}`)) {
                // This is an application deadline task
                setApplicationsState(prevApps =>
                  prevApps.map(app => 
                    app.id === appId ? { ...app, reminder: true, reminderDate } : app
                  )
                );
              } else if (task.id.startsWith(`app-task-${appId}-`)) {
                // This is an application task
                const originalTaskId = parseInt(task.id.split('-').pop() || '0');
                setApplicationsState(prevApps =>
                  prevApps.map(app => 
                    app.id === appId ? {
                      ...app,
                      tasks: app.tasks.map(appTask => 
                        appTask.id === originalTaskId ? { ...appTask, reminder: true, reminderDate } : appTask
                      )
                    } : app
                  )
                );
              }
            }
            return updatedTask;
          }
          return task;
        })
      );
    }
  };

  const unsetReminder = (taskId: string | number, isApplication = false) => {
    if (isApplication) {
      setApplicationsState(prev =>
        prev.map(app => {
          if (app.id === taskId) {
            const updatedApp = { ...app, reminder: false, reminderDate: undefined };
            syncApplicationToStudy(updatedApp);
            return updatedApp;
          }
          
          // Check if it's a composite task ID (appId-taskId format)
          if (typeof taskId === 'string' && taskId.includes('-')) {
            const [appIdStr, taskIdStr] = taskId.split('-');
            const appId = parseInt(appIdStr);
            const actualTaskId = parseInt(taskIdStr);
            
            if (app.id === appId) {
              const updatedTasks = app.tasks.map(task => 
                task.id === actualTaskId ? { ...task, reminder: false, reminderDate: undefined } : task
              );
              const updatedApp = { ...app, tasks: updatedTasks };
              syncApplicationToStudy(updatedApp);
              return updatedApp;
            }
          }
          
          return app;
        })
      );
    } else {
      setStudyTasksState(prev =>
        prev.map(task => {
          if (task.id === taskId) {
            const updatedTask = { ...task, reminder: false, reminderDate: undefined };
            // If this is a synced task from application, update the original application too
            if (task.source === 'application' && task.applicationId) {
              const appId = task.applicationId;
              if (task.id.startsWith(`app-deadline-${appId}`)) {
                // This is an application deadline task
                setApplicationsState(prevApps =>
                  prevApps.map(app => 
                    app.id === appId ? { ...app, reminder: false, reminderDate: undefined } : app
                  )
                );
              } else if (task.id.startsWith(`app-task-${appId}-`)) {
                // This is an application task
                const originalTaskId = parseInt(task.id.split('-').pop() || '0');
                setApplicationsState(prevApps =>
                  prevApps.map(app => 
                    app.id === appId ? {
                      ...app,
                      tasks: app.tasks.map(appTask => 
                        appTask.id === originalTaskId ? { ...appTask, reminder: false, reminderDate: undefined } : appTask
                      )
                    } : app
                  )
                );
              }
            }
            return updatedTask;
          }
          return task;
        })
      );
    }
  };

  const value: AppDataContextType = {
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
    unsetReminder
  };

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  );
}; 