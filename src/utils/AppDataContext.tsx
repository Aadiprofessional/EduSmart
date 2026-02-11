import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useUser } from '../contexts/UserContext';
import { supabase } from '../utils/supabase';

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
  studyTasks: StudyTask[];
  setStudyTasks: (tasks: StudyTask[]) => void;
  addStudyTask: (task: StudyTask) => Promise<void>;
  updateStudyTask: (id: string, task: Partial<StudyTask>) => Promise<void>;
  deleteStudyTask: (id: string) => Promise<void>;
  toggleTaskReminder: (taskId: string) => Promise<void>;
  setReminder: (taskId: string, reminderDate: string) => Promise<void>;
  unsetReminder: (taskId: string) => Promise<void>;
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
}

export const AppDataProvider: React.FC<AppDataProviderProps> = ({ children }) => {
  const { user } = useUser();
  const [studyTasks, setStudyTasksState] = useState<StudyTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudyTasks = useCallback(async () => {
    if (!user?.id) {
      setStudyTasksState([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('study_tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (fetchError) throw fetchError;

      const formattedTasks: StudyTask[] = (data || []).map(item => ({
        ...item,
        estimatedHours: item.estimated_hours || 0,
        reminderDate: item.reminder_date,
        applicationId: item.application_id
      }));

      setStudyTasksState(formattedTasks);
    } catch (err: any) {
      console.error('Error fetching study tasks:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchStudyTasks();
  }, [fetchStudyTasks]);

  const refreshData = async (force?: boolean) => {
    await fetchStudyTasks();
  };

  const addStudyTask = async (task: StudyTask) => {
    if (!user?.id) return;

    try {
      setError(null);
      
      const taskToInsert = {
        user_id: user.id,
        task: task.task,
        subject: task.subject,
        date: task.date,
        completed: task.completed || false,
        priority: task.priority,
        estimated_hours: task.estimatedHours,
        source: task.source || 'study',
        application_id: task.applicationId,
        reminder: task.reminder || false,
        reminder_date: task.reminderDate
      };

      const { data, error: insertError } = await supabase
        .from('study_tasks')
        .insert(taskToInsert)
        .select()
        .single();

      if (insertError) throw insertError;

      const newTask: StudyTask = {
        ...data,
        estimatedHours: data.estimated_hours || 0,
        reminderDate: data.reminder_date,
        applicationId: data.application_id
      };

      setStudyTasksState(prev => [...prev, newTask]);
    } catch (err: any) {
      console.error('Error adding study task:', err);
      setError(err.message);
      throw err;
    }
  };

  const updateStudyTask = async (id: string, updates: Partial<StudyTask>) => {
    if (!user?.id) return;

    try {
      setError(null);

      const updatePayload: any = { ...updates };
      
      // Map frontend fields to DB fields
      if (updates.estimatedHours !== undefined) {
        updatePayload.estimated_hours = updates.estimatedHours;
        delete updatePayload.estimatedHours;
      }
      if (updates.reminderDate !== undefined) {
        updatePayload.reminder_date = updates.reminderDate;
        delete updatePayload.reminderDate;
      }
      if (updates.applicationId !== undefined) {
        updatePayload.application_id = updates.applicationId;
        delete updatePayload.applicationId;
      }

      const { error: updateError } = await supabase
        .from('study_tasks')
        .update(updatePayload)
        .eq('id', id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setStudyTasksState(prev => prev.map(task => 
        task.id === id ? { ...task, ...updates } : task
      ));
    } catch (err: any) {
      console.error('Error updating study task:', err);
      setError(err.message);
      throw err;
    }
  };

  const deleteStudyTask = async (id: string) => {
    if (!user?.id) return;

    try {
      setError(null);

      const { error: deleteError } = await supabase
        .from('study_tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      setStudyTasksState(prev => prev.filter(task => task.id !== id));
    } catch (err: any) {
      console.error('Error deleting study task:', err);
      setError(err.message);
      throw err;
    }
  };

  const toggleTaskReminder = async (taskId: string) => {
    const task = studyTasks.find(t => t.id === taskId);
    if (task) {
      await updateStudyTask(taskId, { reminder: !task.reminder });
    }
  };

  const setReminder = async (taskId: string, reminderDate: string) => {
    await updateStudyTask(taskId, { reminder: true, reminderDate });
  };

  const unsetReminder = async (taskId: string) => {
    await updateStudyTask(taskId, { reminder: false, reminderDate: undefined });
  };

  const value = {
    studyTasks,
    setStudyTasks: setStudyTasksState,
    addStudyTask,
    updateStudyTask,
    deleteStudyTask,
    toggleTaskReminder,
    setReminder,
    unsetReminder,
    refreshData,
    isLoading,
    error
  };

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  );
};
