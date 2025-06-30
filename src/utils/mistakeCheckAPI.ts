import { mistakeCheckAPI } from './apiService';

// Get user ID from authentication context or localStorage - proper authentication
const getUserId = (user?: any, session?: any): string => {
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
  
  // Try Supabase auth
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
  
  // If no authenticated user found, return a fallback or throw error
  console.warn('⚠️ No authenticated user found, using fallback user ID');
  return 'anonymous-user'; // Fallback instead of throwing error
};

export interface MistakeCheckSubmissionData {
  text: string;
  fileName: string;
  file?: File;
  fileType: string;
  documentPages?: string[];
  mistakes: any[];
  pageMistakes?: any[];
  extractedTexts?: any[];
  pageMarkings?: any[];
  markingSummary?: any;
  selectedMarkingStandard: string;
  currentPage: number;
  overallProcessingComplete: boolean;
}

export interface MistakeCheckHistoryItem {
  id: string;
  fileName: string;
  text: string;
  mistakes: any[];
  markingSummary: any;
  timestamp: Date;
  fileType: string;
  documentPages?: string[];
  pageMistakes?: any[];
  currentPage?: number;
  overallProcessingComplete?: boolean;
  extractedTexts?: any[];
  pageMarkings?: any[];
  selectedMarkingStandard?: string;
}

// Submit a new mistake check - Enhanced with user context
export const submitMistakeCheck = async (data: MistakeCheckSubmissionData, user?: any, session?: any) => {
  try {
    const userId = getUserId(user, session);
    console.log('🔄 Submitting mistake check for user:', userId);
    
    const result = await mistakeCheckAPI.submit({
      uid: userId, // Use 'uid' as expected by the API
      text: data.text,
      fileName: data.fileName,
      file_type: data.fileType,
      document_pages: data.documentPages,
      mistakes: data.mistakes,
      page_mistakes: data.pageMistakes,
      extracted_texts: data.extractedTexts,
      page_markings: data.pageMarkings,
      marking_summary: data.markingSummary,
      selected_marking_standard: data.selectedMarkingStandard,
      current_page: data.currentPage,
      overall_processing_complete: data.overallProcessingComplete,
      file: data.file
    });
    
    console.log('✅ Mistake check submitted successfully');
    return { success: true, data: result };
  } catch (error: any) {
    console.error('❌ Error submitting mistake check:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to submit mistake check'
    };
  }
};

// Get mistake check history - Enhanced with user context
export const getMistakeCheckHistory = async (user?: any, session?: any) => {
  try {
    const userId = getUserId(user, session);
    console.log('🔄 Fetching mistake check history for user:', userId);
    
    const result = await mistakeCheckAPI.getHistory(userId);
    console.log('✅ History fetched successfully');
    
    if (result.success && result.data) {
      const historyData = result.data.history || result.data;
      return { 
        success: true, 
        history: Array.isArray(historyData) ? historyData.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })) : []
      };
    } else {
      return { 
        success: false, 
        error: result.error || 'Failed to fetch history',
        history: []
      };
    }
  } catch (error: any) {
    console.error('❌ Error fetching mistake check history:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to fetch history',
      history: []
    };
  }
};

// Update a mistake check - Enhanced with user context
export const updateMistakeCheck = async (id: string, data: Partial<MistakeCheckSubmissionData>, user?: any, session?: any) => {
  try {
    const userId = getUserId(user, session);
    console.log('🔄 Updating mistake check for user:', userId);
    
    const result = await mistakeCheckAPI.update(id, {
      text: data.text,
      mistakes: data.mistakes,
      page_mistakes: data.pageMistakes,
      extracted_texts: data.extractedTexts,
      page_markings: data.pageMarkings,
      marking_summary: data.markingSummary,
      selected_marking_standard: data.selectedMarkingStandard,
      current_page: data.currentPage,
      overall_processing_complete: data.overallProcessingComplete
    });
    
    console.log('✅ Mistake check updated successfully');
    return { success: true, data: result };
  } catch (error: any) {
    console.error('❌ Error updating mistake check:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to update mistake check'
    };
  }
};

// Delete a mistake check - Enhanced with user context
export const deleteMistakeCheck = async (id: string, user?: any, session?: any) => {
  try {
    const userId = getUserId(user, session);
    console.log('🔄 Deleting mistake check for user:', userId);
    
    await mistakeCheckAPI.delete(id, userId);
    console.log('✅ Mistake check deleted successfully');
    return { success: true };
  } catch (error: any) {
    console.error('❌ Error deleting mistake check:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to delete mistake check'
    };
  }
};

// Get a specific mistake check by ID - Enhanced with user context
export const getMistakeCheckById = async (id: string, user?: any, session?: any) => {
  try {
    const userId = getUserId(user, session);
    console.log('🔄 Fetching mistake check by ID for user:', userId);
    
    const result = await mistakeCheckAPI.getById(id, userId);
    console.log('✅ Mistake check fetched successfully');
    
    if (result.success && result.data) {
      const mistakeCheckData = result.data.mistakeCheck || result.data;
      return { 
        success: true, 
        data: {
          ...mistakeCheckData,
          timestamp: new Date(mistakeCheckData.timestamp)
        }
      };
    } else {
      return { 
        success: false, 
        error: result.error || 'Failed to fetch mistake check'
      };
    }
  } catch (error: any) {
    console.error('❌ Error fetching mistake check by ID:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to fetch mistake check'
    };
  }
}; 