import { homeworkAPI } from './apiService';

// Get user ID from localStorage or context - you might need to adjust this based on your auth system
const getUserId = (): string => {
  // This is a placeholder - replace with your actual user authentication method
  // You might get this from a React context, localStorage, or Supabase auth
  return localStorage.getItem('userId') || 'b846c59e-7422-4be3-a4f6-dd20145e8400'; // Fallback for testing
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
export const submitHomework = async (data: HomeworkSubmissionData): Promise<{ success: boolean; homework?: any; error?: string }> => {
  try {
    console.log('🚀 Submitting homework to database:', {
      hasFile: !!data.file,
      fileName: data.fileName,
      questionLength: data.question?.length,
      solutionLength: data.solution?.length,
      fileType: data.fileType,
      processingComplete: data.processingComplete
    });

    const uid = getUserId();
    
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

// Get homework history from the database
export const getHomeworkHistory = async (): Promise<{ success: boolean; history?: HomeworkHistoryItem[]; error?: string }> => {
  try {
    console.log('📚 Fetching homework history from database');
    
    const uid = getUserId();
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
      console.error('❌ Failed to fetch homework history:', result.error);
      return { success: false, error: result.error?.message || 'Failed to fetch homework history' };
    }
  } catch (error) {
    console.error('❌ Homework history fetch error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

// Update homework solution (useful for streaming updates)
export const updateHomework = async (id: string, data: {
  solution?: string;
  pageSolutions?: any[];
  currentPage?: number;
  processingComplete?: boolean;
}): Promise<{ success: boolean; homework?: any; error?: string }> => {
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
export const deleteHomework = async (id: string): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log('🗑️ Deleting homework from database:', id);
    
    const uid = getUserId();
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
export const getHomeworkById = async (id: string): Promise<{ success: boolean; homework?: HomeworkHistoryItem; error?: string }> => {
  try {
    console.log('🔍 Fetching homework by ID:', id);
    
    const uid = getUserId();
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