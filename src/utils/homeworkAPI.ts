import { homeworkAPI } from './apiService';

// Get user ID from authentication context or localStorage - proper authentication
const getUserId = (user?: any, session?: any): string | null => {
  // First try to get user ID from the provided authentication context
  if (user?.id) {
    console.log('📱 Found user ID from auth context:', user.id);
    return user.id;
  }
  
  if (session?.user?.id) {
    console.log('📱 Found user ID from session:', session.user.id);
    return session.user.id;
  }
  
  // Try to get user ID from localStorage first (common auth pattern)
  const userId = localStorage.getItem('userId') || localStorage.getItem('user_id');
  if (userId && userId !== 'undefined' && userId !== 'null') {
    console.log('📱 Found user ID in localStorage:', userId);
    return userId;
  }
  
  // Try to get from user object in localStorage
  const userStr = localStorage.getItem('user');
  if (userStr && userStr !== 'undefined' && userStr !== 'null') {
    try {
      const user = JSON.parse(userStr);
      if (user && (user.id || user.user_id || user.uid)) {
        const foundUserId = user.id || user.user_id || user.uid;
        console.log('📱 Found user ID from user object:', foundUserId);
        return foundUserId;
      }
    } catch (e) {
      console.warn('Failed to parse user from localStorage');
    }
  }
  
  // Try Supabase auth patterns
  const supabaseAuthStr = localStorage.getItem('sb-cdqrmxmqsoxncnkxiqwu-auth-token');
  if (supabaseAuthStr && supabaseAuthStr !== 'undefined' && supabaseAuthStr !== 'null') {
    try {
      const authData = JSON.parse(supabaseAuthStr);
      if (authData.user?.id) {
        console.log('📱 Found user ID from Supabase auth:', authData.user.id);
        return authData.user.id;
      }
    } catch (e) {
      console.warn('Failed to parse Supabase auth from localStorage');
    }
  }
  
  // Check other possible Supabase auth keys
  const keys = Object.keys(localStorage);
  for (const key of keys) {
    if (key.includes('supabase') || key.includes('auth')) {
      try {
        const data = localStorage.getItem(key);
        if (data && data !== 'undefined' && data !== 'null') {
          const parsed = JSON.parse(data);
          if (parsed?.user?.id) {
            console.log('📱 Found user ID from auth key:', key, parsed.user.id);
            return parsed.user.id;
          }
        }
      } catch (e) {
        // Continue to next key
      }
    }
  }
  
  // No authenticated user found - return null to require proper authentication
  console.warn('⚠️ No authenticated user found - authentication required');
  return null;
};

export interface HomeworkSubmissionData {
  question: string;
  solution: string;
  file?: File;
  fileType: string;
  fileName?: string;
  pageSolutions?: any[];
  currentPage?: number;
  processingComplete?: boolean;
}

export interface HomeworkHistoryItem {
  id: string;
  fileName?: string;
  fileUrl?: string;
  question: string;
  answer: string;
  fileType: string;
  pageSolutions?: any[];
  currentPage?: number;
  overallProcessingComplete?: boolean;
  timestamp: Date;
}

// Submit homework to the database
export const submitHomework = async (data: HomeworkSubmissionData, user?: any, session?: any): Promise<{ success: boolean; homework?: any; error?: string }> => {
  try {
    console.log('🚀 Submitting homework to database:', {
      hasFile: !!data.file,
      fileName: data.fileName,
      questionLength: data.question?.length,
      solutionLength: data.solution?.length,
      fileType: data.fileType,
      processingComplete: data.processingComplete
    });

    const uid = getUserId(user, session);
    
    if (!uid) {
      return { success: false, error: 'User authentication required. Please log in to submit homework.' };
    }
    
    const submissionData = {
      uid,
      question: data.question,
      solution: data.solution,
      file_type: data.fileType,
      page_solutions: data.pageSolutions,
      current_page: data.currentPage || 0,
      processing_complete: data.processingComplete || true,
      file: data.file
    };

    const result = await homeworkAPI.submit(submissionData);
    
    if (result.success) {
      console.log('✅ Homework submitted successfully:', result.data);
      return { success: true, homework: result.data.homework };
    } else {
      console.error('❌ Failed to submit homework:', result.error);
      return { success: false, error: result.error?.message || 'Failed to submit homework' };
    }
  } catch (error) {
    console.error('❌ Homework submission error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Sample homework history for fallback when API fails
const getSampleHomeworkHistory = (): HomeworkHistoryItem[] => [
  {
    id: 'sample-1',
    fileName: 'Math_Homework_Sample.pdf',
    question: 'Solve the quadratic equation: x² + 5x + 6 = 0',
    answer: 'To solve x² + 5x + 6 = 0:\n\nUsing the quadratic formula or factoring:\n(x + 2)(x + 3) = 0\n\nTherefore: x = -2 or x = -3\n\nThe solutions are x = -2 and x = -3.',
    fileType: 'application/pdf',
    overallProcessingComplete: true,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
  },
  {
    id: 'sample-2',
    fileName: 'Physics_Problem_Sample.jpg',
    question: 'Calculate the velocity of an object in free fall after 3 seconds',
    answer: 'For an object in free fall:\n\nUsing v = gt where:\n- g = 9.8 m/s² (acceleration due to gravity)\n- t = 3 seconds\n\nv = 9.8 × 3 = 29.4 m/s\n\nThe velocity after 3 seconds is 29.4 m/s downward.',
    fileType: 'image/jpeg',
    overallProcessingComplete: true,
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
  },
  {
    id: 'sample-3',
    question: 'What is the derivative of f(x) = 3x² + 2x - 1?',
    answer: 'To find the derivative of f(x) = 3x² + 2x - 1:\n\nUsing the power rule:\n- d/dx(3x²) = 6x\n- d/dx(2x) = 2\n- d/dx(-1) = 0\n\nTherefore: f\'(x) = 6x + 2',
    fileType: 'text',
    overallProcessingComplete: true,
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
  }
];

// Get homework history from the database
export const getHomeworkHistory = async (user?: any, session?: any): Promise<{ success: boolean; history?: HomeworkHistoryItem[]; error?: string }> => {
  try {
    console.log('📚 Fetching homework history from database');
    
    const uid = getUserId(user, session);
    
    if (!uid) {
      console.warn('⚠️ No authenticated user - providing sample homework history');
      return { success: true, history: getSampleHomeworkHistory(), error: 'Using sample data - please log in for your personal history' };
    }
    
    const result = await homeworkAPI.getHistory(uid);
    
    if (result.success) {
      console.log('✅ Homework history fetched successfully:', result.data.total, 'items');
      
      // Transform the data to match the component's expected format
      const transformedHistory: HomeworkHistoryItem[] = result.data.history.map((item: any) => ({
        id: item.id,
        fileName: item.fileName,
        fileUrl: item.fileUrl,
        question: item.question,
        answer: item.answer,
        fileType: item.fileType,
        pageSolutions: item.pageSolutions,
        currentPage: item.currentPage,
        overallProcessingComplete: item.overallProcessingComplete,
        timestamp: new Date(item.timestamp)
      }));
      
      return { success: true, history: transformedHistory };
    } else {
      console.warn('❌ Failed to fetch homework history, using sample data:', result.error);
      return { 
        success: true, 
        history: getSampleHomeworkHistory(), 
        error: 'Backend temporarily unavailable - showing sample homework history' 
      };
    }
  } catch (error) {
    console.error('❌ Homework history fetch error, using sample data:', error);
    return { 
      success: true, 
      history: getSampleHomeworkHistory(), 
      error: 'Network error - showing sample homework history' 
    };
  }
};

// Update homework solution (useful for streaming updates)
export const updateHomework = async (id: string, data: {
  solution?: string;
  pageSolutions?: any[];
  currentPage?: number;
  processingComplete?: boolean;
}, user?: any, session?: any): Promise<{ success: boolean; homework?: any; error?: string }> => {
  try {
    console.log('🔄 Updating homework in database:', id);
    
    const updateData = {
      solution: data.solution,
      page_solutions: data.pageSolutions,
      current_page: data.currentPage,
      processing_complete: data.processingComplete
    };

    const result = await homeworkAPI.update(id, updateData);
    
    if (result.success) {
      console.log('✅ Homework updated successfully');
      return { success: true, homework: result.data.homework };
    } else {
      console.error('❌ Failed to update homework:', result.error);
      return { success: false, error: result.error?.message || 'Failed to update homework' };
    }
  } catch (error) {
    console.error('❌ Homework update error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Delete homework entry
export const deleteHomework = async (id: string, user?: any, session?: any): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🗑️ Deleting homework from database:', id);
    
    const uid = getUserId(user, session);
    
    if (!uid) {
      return { success: false, error: 'User authentication required. Please log in to delete homework.' };
    }
    
    const result = await homeworkAPI.delete(id, uid);
    
    if (result.success) {
      console.log('✅ Homework deleted successfully');
      return { success: true };
    } else {
      console.error('❌ Failed to delete homework:', result.error);
      return { success: false, error: result.error?.message || 'Failed to delete homework' };
    }
  } catch (error) {
    console.error('❌ Homework delete error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Get specific homework by ID
export const getHomeworkById = async (id: string, user?: any, session?: any): Promise<{ success: boolean; homework?: HomeworkHistoryItem; error?: string }> => {
  try {
    console.log('🔍 Fetching homework by ID:', id);
    
    const uid = getUserId(user, session);
    
    if (!uid) {
      return { success: false, error: 'User authentication required. Please log in to view homework.' };
    }
    
    const result = await homeworkAPI.getById(id, uid);
    
    if (result.success) {
      const item = result.data.homework;
      const transformedHomework: HomeworkHistoryItem = {
        id: item.id,
        fileName: item.fileName,
        fileUrl: item.fileUrl,
        question: item.question,
        answer: item.answer,
        fileType: item.fileType,
        pageSolutions: item.pageSolutions,
        currentPage: item.currentPage,
        overallProcessingComplete: item.overallProcessingComplete,
        timestamp: new Date(item.timestamp)
      };
      
      console.log('✅ Homework fetched successfully');
      return { success: true, homework: transformedHomework };
    } else {
      console.error('❌ Failed to fetch homework:', result.error);
      return { success: false, error: result.error?.message || 'Failed to fetch homework' };
    }
  } catch (error) {
    console.error('❌ Homework fetch error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};