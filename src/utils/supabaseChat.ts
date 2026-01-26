// Study Planner API Service
// Connects frontend to the backend study planner APIs

import { API_BASE_URL } from '../config/api';

// Generate a proper UUID v4
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export interface StudyTask {
  id: string;
  user_id: string;
  task: string;
  subject: string;
  date: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  estimated_hours: number;
  source?: 'application' | 'study';
  application_id?: number;
  reminder?: boolean;
  reminder_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Application {
  id: number;
  user_id: string;
  university: string;
  program: string;
  country: string;
  deadline: string;
  status: 'planning' | 'in-progress' | 'submitted' | 'interview' | 'accepted' | 'rejected' | 'waitlisted';
  notes?: string;
  reminder?: boolean;
  reminder_date?: string;
  created_at?: string;
  updated_at?: string;
  application_tasks?: ApplicationTask[];
}

export interface ApplicationTask {
  id: number;
  application_id: number;
  task: string;
  completed: boolean;
  due_date?: string;
  reminder?: boolean;
  reminder_date?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Reminder {
  id: number;
  user_id: string;
  type: 'study_task' | 'application' | 'application_task';
  reference_id: string;
  title: string;
  description?: string;
  reminder_date: string;
  priority: 'low' | 'medium' | 'high';
  is_active: boolean;
  metadata?: any;
  created_at?: string;
  updated_at?: string;
}

export interface DashboardStats {
  studyTasks: {
    total: number;
    completed: number;
    pending: number;
    highPriority: number;
  };
  applications: {
    total: number;
    planning: number;
    inProgress: number;
    submitted: number;
  };
  reminders: {
    active: number;
    today: number;
  };
}

class StudyPlannerApiService {
  private baseUrl: string;
  private userId: string;

  constructor(userId: string) {
    // Use centralized API configuration
    this.baseUrl = API_BASE_URL;
    this.userId = userId;
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {},
    retries: number = 3
  ): Promise<{ success: boolean; data?: T; message?: string; error?: string }> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const url = `${this.baseUrl}${endpoint}`;
        
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });

        const result = await response.json();
        
        if (!response.ok) {
          // For 500 errors, retry if we have attempts left
          if (response.status >= 500 && attempt < retries) {
            console.warn(`API Error (${response.status}) - Attempt ${attempt + 1}/${retries + 1}:`, result);
            lastError = new Error(result.error || result.message || `HTTP ${response.status}`);
            
            // Exponential backoff: wait 1s, 2s, 4s between retries
            const delay = Math.pow(2, attempt) * 1000;
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          console.error(`API Error (${response.status}):`, result);
          return {
            success: false,
            error: result.error || result.message || `HTTP ${response.status}`,
          };
        }

        return result;
      } catch (error) {
        lastError = error;
        
        // For network errors, retry if we have attempts left
        if (attempt < retries) {
          console.warn(`Network error - Attempt ${attempt + 1}/${retries + 1}:`, error);
          
          // Exponential backoff: wait 1s, 2s, 4s between retries
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        console.error('Network error (final attempt):', error);
      }
    }
    
    return {
      success: false,
      error: lastError instanceof Error ? lastError.message : 'Network error after retries',
    };
  }

  // ============= STUDY TASKS =============

  async getStudyTasks(): Promise<{ success: boolean; data?: StudyTask[]; error?: string }> {
    return this.makeRequest<StudyTask[]>(`/api/study-planner/users/${this.userId}/study-tasks`);
  }

  async getStudyTaskById(taskId: string): Promise<{ success: boolean; data?: StudyTask; error?: string }> {
    return this.makeRequest<StudyTask>(`/api/study-planner/study-tasks/${taskId}`);
  }

  async createStudyTask(taskData: Omit<StudyTask, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data?: StudyTask; error?: string }> {
    return this.makeRequest<StudyTask>('/api/study-planner/study-tasks', {
      method: 'POST',
      body: JSON.stringify({
        ...taskData,
        user_id: this.userId,
      }),
    });
  }

  async updateStudyTask(taskId: string, updateData: Partial<StudyTask>): Promise<{ success: boolean; data?: StudyTask; error?: string }> {
    return this.makeRequest<StudyTask>(`/api/study-planner/study-tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async deleteStudyTask(taskId: string): Promise<{ success: boolean; error?: string }> {
    return this.makeRequest(`/api/study-planner/study-tasks/${taskId}`, {
      method: 'DELETE',
    });
  }

  // ============= APPLICATIONS =============

  async getApplications(): Promise<{ success: boolean; data?: Application[]; error?: string }> {
    return this.makeRequest<Application[]>(`/api/study-planner/users/${this.userId}/applications`);
  }

  async getApplicationById(applicationId: number): Promise<{ success: boolean; data?: Application; error?: string }> {
    return this.makeRequest<Application>(`/api/study-planner/applications/${applicationId}`);
  }

  async createApplication(applicationData: Omit<Application, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'application_tasks'>): Promise<{ success: boolean; data?: Application; error?: string }> {
    return this.makeRequest<Application>('/api/study-planner/applications', {
      method: 'POST',
      body: JSON.stringify({
        ...applicationData,
        user_id: this.userId,
      }),
    });
  }

  async updateApplication(applicationId: number, updateData: Partial<Application>): Promise<{ success: boolean; data?: Application; error?: string }> {
    return this.makeRequest<Application>(`/api/study-planner/applications/${applicationId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async deleteApplication(applicationId: number): Promise<{ success: boolean; error?: string }> {
    return this.makeRequest(`/api/study-planner/applications/${applicationId}`, {
      method: 'DELETE',
    });
  }

  // ============= APPLICATION TASKS =============

  async createApplicationTask(applicationId: number, taskData: Omit<ApplicationTask, 'id' | 'application_id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data?: ApplicationTask; error?: string }> {
    return this.makeRequest<ApplicationTask>(`/api/study-planner/applications/${applicationId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  async updateApplicationTask(taskId: number, updateData: Partial<ApplicationTask>): Promise<{ success: boolean; data?: ApplicationTask; error?: string }> {
    return this.makeRequest<ApplicationTask>(`/api/study-planner/application-tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async deleteApplicationTask(taskId: number): Promise<{ success: boolean; error?: string }> {
    return this.makeRequest(`/api/study-planner/application-tasks/${taskId}`, {
      method: 'DELETE',
    });
  }

  // ============= REMINDERS =============

  async getReminders(): Promise<{ success: boolean; data?: Reminder[]; error?: string }> {
    return this.makeRequest<Reminder[]>(`/api/study-planner/users/${this.userId}/reminders`);
  }

  async createReminder(reminderData: Omit<Reminder, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; data?: Reminder; error?: string }> {
    return this.makeRequest<Reminder>('/api/study-planner/reminders', {
      method: 'POST',
      body: JSON.stringify({
        ...reminderData,
        user_id: this.userId,
      }),
    });
  }

  async updateReminder(reminderId: number, updateData: Partial<Reminder>): Promise<{ success: boolean; data?: Reminder; error?: string }> {
    return this.makeRequest<Reminder>(`/api/study-planner/reminders/${reminderId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
  }

  async deleteReminder(reminderId: number): Promise<{ success: boolean; error?: string }> {
    return this.makeRequest(`/api/study-planner/reminders/${reminderId}`, {
      method: 'DELETE',
    });
  }

  // ============= NOTIFICATIONS =============

  async getUpcomingNotifications(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      // Get reminders for the next week
      const result = await this.makeRequest<any[]>(`/api/study-planner/users/${this.userId}/reminders?startDate=${now.toISOString()}&endDate=${weekFromNow.toISOString()}&isActive=true`);
      
      return result;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch notifications',
      };
    }
  }

  // ============= DASHBOARD =============

  async getDashboardStats(): Promise<{ success: boolean; data?: DashboardStats; error?: string }> {
    return this.makeRequest<DashboardStats>(`/api/study-planner/users/${this.userId}/dashboard/stats`);
  }
}

export { StudyPlannerApiService };